import { execFile } from "child_process";
import { createReadStream, createWriteStream } from "fs";
import {
  open,
  readdir,
  readFile,
  realpath,
  rename,
  rm,
  stat,
  utimes,
  writeFile,
} from "fs/promises";
import { basename, join } from "path";
import { pipeline } from "stream/promises";
import { promisify } from "util";
import zlib from "zlib";
import { CODEX_DIR } from "../../lib/paths";
import { fileExists } from "../../lib/fs";

// Two pieces of rollout metadata decide whether another account can find and
// resume a Codex session:
// - model_provider: resume uses the recorded provider regardless of the active
//   one (official "openai" vs a custom relay), so switching or launching an
//   account restamps managed sessions to that account's provider (rollout
//   first line + state_5.sqlite), like
//   https://github.com/Dailin521/codex-provider-sync.
// - account_scoped: since Codex 0.169 new sessions carry this marker plus the
//   creator's ChatGPT user/account ids, and every local thread list (resume
//   picker included) hides scoped sessions of other ChatGPT accounts. Sessions
//   created by accounts claudex-switch manages are made shared again by
//   dropping the marker — exactly how Codex writes an unscoped session. The
//   creator ids stay as provenance.
//
// Codex's paginated history (thread_history_*.sqlite) and fork lineage
// (session_meta.history_base.end_byte_offset) address rollouts by byte
// offset, so the first line must keep its exact byte length: edits are made
// textually and padded with JSON whitespace; an edit that would grow the line
// beyond that budget is skipped. Message content is never touched.

const SESSION_DIRS = ["sessions", "archived_sessions"];
const STATE_DB_CANDIDATES = [
  join("sqlite", "state_5.sqlite"),
  "state_5.sqlite",
];
const HISTORY_DB_CANDIDATES = [
  join("sqlite", "thread_history_1.sqlite"),
  "thread_history_1.sqlite",
];
const PLAIN_SUFFIX = ".jsonl";
const COMPRESSED_SUFFIX = ".jsonl.zst";
// session_meta first lines embed base_instructions (tens of KB); anything
// beyond this cap is not a metadata line we should touch.
const FIRST_LINE_MAX_BYTES = 4 * 1024 * 1024;
const READ_CHUNK_BYTES = 64 * 1024;
// Older claudex-switch builds re-serialized first lines, shortening e.g.
// "hybaliez" -> "openai". The shortfall shows up as a history projection that
// ends past the file; only differences this small are attributed to that.
const MAX_REPAIR_BYTES = 64;

/** A ChatGPT login whose account-scoped sessions should be shared. */
export interface CodexSessionCreator {
  userId: string;
  accountId: string;
}

export interface CodexSessionSyncOptions {
  /** Restamp managed sessions to this provider; null leaves providers alone. */
  provider: { target: string; managed: Set<string> } | null;
  /** Logins whose account-scoped sessions become visible to every account. */
  sharedCreators: CodexSessionCreator[];
}

export interface CodexSessionSyncResult {
  /** Rollout files rewritten for any reason. */
  rolloutFilesUpdated: number;
  /** Rollouts stamped with the target provider. */
  providerStamped: number;
  /** Rollouts whose provider could not change without growing the line. */
  providerSkipped: number;
  /** Account-scoped rollouts made visible to the other accounts. */
  sessionsShared: number;
  /** Rollouts restored to the length Codex's history index expects. */
  rolloutsRepaired: number;
  sqliteRowsUpdated: number;
}

interface FirstLine {
  line: string;
  // Plain rollouts only: byte offset where the rest of the file starts.
  restOffset: number;
  separator: "\n" | "\r\n" | "";
}

interface RolloutFile {
  path: string;
  compressed: boolean;
}

interface LineEdit {
  line: string;
  providerStamped: boolean;
  providerSkipped: boolean;
  shared: boolean;
}

async function listRolloutFiles(root: string): Promise<RolloutFile[]> {
  const results: RolloutFile[] = [];
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (!entry.isFile() || entry.name.startsWith(".")) {
        // Dotfiles are Codex's in-flight materialize temps.
        continue;
      } else if (entry.name.endsWith(PLAIN_SUFFIX)) {
        results.push({ path: fullPath, compressed: false });
      } else if (entry.name.endsWith(COMPRESSED_SUFFIX)) {
        results.push({ path: fullPath, compressed: true });
      }
    }
  }
  return results;
}

function splitFirstLine(buffer: Buffer, newlineIndex: number): FirstLine {
  const hasCr = newlineIndex > 0 && buffer[newlineIndex - 1] === 0x0d;
  const lineEnd = hasCr ? newlineIndex - 1 : newlineIndex;
  return {
    line: buffer.subarray(0, lineEnd).toString("utf-8"),
    restOffset: newlineIndex + 1,
    separator: hasCr ? "\r\n" : "\n",
  };
}

async function readPlainFirstLine(filePath: string): Promise<FirstLine | null> {
  const handle = await open(filePath, "r");
  try {
    const chunks: Buffer[] = [];
    let total = 0;
    while (total < FIRST_LINE_MAX_BYTES) {
      const chunk = Buffer.alloc(READ_CHUNK_BYTES);
      const { bytesRead } = await handle.read(chunk, 0, READ_CHUNK_BYTES, total);
      if (bytesRead === 0) break;
      const part = chunk.subarray(0, bytesRead);
      // Only the fresh chunk needs scanning; earlier chunks held no newline.
      const idx = part.indexOf(0x0a);
      chunks.push(part);
      if (idx !== -1) {
        return splitFirstLine(Buffer.concat(chunks), total + idx);
      }
      total += bytesRead;
    }
    if (total === 0 || total >= FIRST_LINE_MAX_BYTES) return null;
    // Single-line file without a trailing newline.
    return {
      line: Buffer.concat(chunks).toString("utf-8"),
      restOffset: total,
      separator: "",
    };
  } finally {
    await handle.close();
  }
}

function zstdAvailable(): boolean {
  return (
    typeof zlib.createZstdDecompress === "function" &&
    typeof zlib.zstdDecompressSync === "function" &&
    typeof zlib.zstdCompressSync === "function"
  );
}

// Decodes only as far as the first newline; compressed rollouts can be large.
async function readCompressedFirstLine(
  filePath: string,
): Promise<FirstLine | null> {
  const source = createReadStream(filePath);
  const decoder = zlib.createZstdDecompress();
  source.on("error", (err) => decoder.destroy(err));
  source.pipe(decoder);
  const chunks: Buffer[] = [];
  let total = 0;
  try {
    for await (const chunk of decoder as AsyncIterable<Buffer>) {
      const idx = chunk.indexOf(0x0a);
      chunks.push(chunk);
      if (idx !== -1) {
        return splitFirstLine(Buffer.concat(chunks), total + idx);
      }
      total += chunk.length;
      if (total >= FIRST_LINE_MAX_BYTES) return null;
    }
  } finally {
    decoder.destroy();
    source.destroy();
  }
  if (total === 0) return null;
  return { line: Buffer.concat(chunks).toString("utf-8"), restOffset: total, separator: "" };
}

// Codex writes the decoded size into the zstd frame header; reading it avoids
// decoding the whole rollout just to learn its logical length.
async function compressedContentSize(filePath: string): Promise<number | null> {
  const handle = await open(filePath, "r");
  try {
    const header = Buffer.alloc(18);
    const { bytesRead } = await handle.read(header, 0, 18, 0);
    return zstdFrameContentSize(header.subarray(0, bytesRead));
  } finally {
    await handle.close();
  }
}

export function zstdFrameContentSize(header: Buffer): number | null {
  if (header.length < 5 || header.readUInt32LE(0) !== 0xfd2fb528) return null;
  const descriptor = header[4]!;
  const fcsFlag = descriptor >> 6;
  const singleSegment = (descriptor >> 5) & 1;
  const dictFlag = descriptor & 3;
  const fcsBytes = [singleSegment ? 1 : 0, 2, 4, 8][fcsFlag]!;
  if (fcsBytes === 0) return null;
  const offset = 5 + (singleSegment ? 0 : 1) + [0, 1, 2, 4][dictFlag]!;
  if (header.length < offset + fcsBytes) return null;
  switch (fcsBytes) {
    case 1:
      return header[offset]!;
    case 2:
      return header.readUInt16LE(offset) + 256;
    case 4:
      return header.readUInt32LE(offset);
    default:
      return Number(header.readBigUInt64LE(offset));
  }
}

async function readFirstLine(file: RolloutFile): Promise<FirstLine | null> {
  return file.compressed
    ? readCompressedFirstLine(file.path)
    : readPlainFirstLine(file.path);
}

async function logicalSize(file: RolloutFile): Promise<number | null> {
  return file.compressed
    ? compressedContentSize(file.path)
    : (await stat(file.path)).size;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

// A reverted thread's rollout carries its own rollout id in the filename;
// Codex then consults the original rollout instead, so only ordinary
// rollouts (filename id == thread id) are unscoped.
function isOrdinaryRollout(filePath: string, threadId: unknown): boolean {
  if (typeof threadId !== "string" || threadId === "") return false;
  const name = basename(filePath);
  const stem = name.endsWith(COMPRESSED_SUFFIX)
    ? name.slice(0, -COMPRESSED_SUFFIX.length)
    : name.slice(0, -PLAIN_SUFFIX.length);
  return stem.endsWith(`-${threadId}`);
}

function providerNeedsRestamp(
  current: unknown,
  provider: { target: string; managed: Set<string> },
): boolean {
  if (current === provider.target) return false;
  // Only restamp sessions belonging to providers claudex-switch manages; a
  // provider the user configured by hand (say ollama) keeps its metadata.
  // A missing or empty provider carries no information worth preserving.
  // Membership is case-insensitive so "OpenAI" is normalized too.
  return !(
    typeof current === "string" &&
    current !== "" &&
    !provider.managed.has(current.toLowerCase())
  );
}

function createdBySharedLogin(
  payload: Record<string, unknown>,
  creators: CodexSessionCreator[],
): boolean {
  const userId = stringOrNull(payload.creator_user_id);
  const accountId = stringOrNull(payload.creator_account_id);
  // Without creator ids the session is already visible to every account.
  if (userId === null && accountId === null) return false;
  return creators.some(
    (creator) =>
      (userId === null || userId === creator.userId) &&
      (accountId === null || accountId === creator.accountId),
  );
}

const PROVIDER_FIELD = /"model_provider"\s*:\s*(?:"(?:[^"\\]|\\.)*"|null)/g;
const SCOPED_FIELD = /"account_scoped"\s*:\s*true/g;

function setProviderText(text: string, target: string): string | null {
  const field = `"model_provider":${JSON.stringify(target)}`;
  const matches = text.match(PROVIDER_FIELD) ?? [];
  if (matches.length === 1) return text.replace(PROVIDER_FIELD, () => field);
  if (matches.length > 1 || !text.endsWith("}}")) return null;
  // Missing key: payload is the last field of the record.
  const head = text.slice(0, -2);
  return `${head}${head.endsWith("{") ? "" : ","}${field}}}`;
}

function removeScopedText(text: string): string | null {
  if ((text.match(SCOPED_FIELD) ?? []).length !== 1) return null;
  let out = text.replace(/"account_scoped"\s*:\s*true\s*,/, "");
  if (out === text) out = text.replace(/,\s*"account_scoped"\s*:\s*true/, "");
  return out === text ? null : out;
}

// Pads a candidate to exactly `budget` bytes with whitespace before the
// record's closing brace, then confirms it decodes to the intended record.
function fitToBudget(
  candidate: string,
  budget: number,
  expected: unknown,
): string | null {
  const length = Buffer.byteLength(candidate, "utf-8");
  if (length > budget || !candidate.endsWith("}")) return null;
  const padded = `${candidate.slice(0, -1)}${" ".repeat(budget - length)}}`;
  try {
    if (JSON.stringify(JSON.parse(padded)) !== JSON.stringify(expected)) {
      return null;
    }
  } catch {
    return null;
  }
  return padded;
}

/**
 * Plans the session_meta first-line edit for one rollout. The result keeps
 * the original byte length plus `growBy` (used to undo an earlier shrink).
 */
export function editSessionMetaLine(
  line: string,
  filePath: string,
  options: CodexSessionSyncOptions,
  growBy = 0,
): LineEdit | null {
  let record: unknown;
  try {
    record = JSON.parse(line);
  } catch {
    return null;
  }
  const parsed = record as { type?: unknown; payload?: unknown };
  if (
    parsed?.type !== "session_meta" ||
    typeof parsed.payload !== "object" ||
    parsed.payload === null ||
    Array.isArray(parsed.payload)
  ) {
    return null;
  }
  const payload = parsed.payload as Record<string, unknown>;
  const ordinary = isOrdinaryRollout(filePath, payload.id);
  const scoped = payload.account_scoped === true && ordinary;
  const wantShare =
    scoped && createdBySharedLogin(payload, options.sharedCreators);
  const wantProvider =
    options.provider !== null &&
    providerNeedsRestamp(payload.model_provider, options.provider);
  if (!wantShare && !wantProvider && growBy === 0) return null;

  const budget = Buffer.byteLength(line, "utf-8") + growBy;
  // Whitespace before the closing brace can only be our earlier padding;
  // reclaim it so later edits have room.
  const base = line.replace(/\s+\}$/, "}");
  const unscoped = scoped ? removeScopedText(base) : null;

  const expectedRecord = (changes: {
    provider: boolean;
    unscope: boolean;
  }): unknown => {
    const copy = JSON.parse(line) as { payload: Record<string, unknown> };
    if (changes.unscope) delete copy.payload.account_scoped;
    if (changes.provider) copy.payload.model_provider = options.provider!.target;
    return copy;
  };

  // Ordered by preference. Dropping the marker of a session that has no
  // creator ids changes nothing for Codex, so it may only make room.
  const attempts: Array<{ text: string | null; provider: boolean; unscope: boolean }> = [];
  const shareBase = wantShare && unscoped !== null ? unscoped : base;
  if (wantProvider) {
    attempts.push({
      text: setProviderText(shareBase, options.provider!.target),
      provider: true,
      unscope: shareBase !== base,
    });
    if (!wantShare && unscoped !== null) {
      attempts.push({
        text: setProviderText(unscoped, options.provider!.target),
        provider: true,
        unscope: true,
      });
    }
  }
  attempts.push({ text: shareBase, provider: false, unscope: shareBase !== base });

  // Only a rollout that keeps another named provider counts as skipped; a
  // missing provider already resumes with the configured default.
  const keepsOtherProvider =
    wantProvider &&
    typeof payload.model_provider === "string" &&
    payload.model_provider !== "";
  for (const attempt of attempts) {
    if (attempt.text === null) continue;
    const fitted = fitToBudget(attempt.text, budget, expectedRecord(attempt));
    if (fitted === null) continue;
    if (fitted === line) break;
    return {
      line: fitted,
      providerStamped: attempt.provider,
      providerSkipped: keepsOtherProvider && !attempt.provider,
      shared: wantShare && attempt.unscope,
    };
  }
  return keepsOtherProvider
    ? { line, providerStamped: false, providerSkipped: true, shared: false }
    : null;
}

async function replaceFile(
  filePath: string,
  write: (tmpPath: string, mode: number) => Promise<void>,
): Promise<void> {
  const { mode, atime, mtime } = await stat(filePath);
  const tmpPath = `${filePath}.claudex-sync.${process.pid}.tmp`;
  try {
    await write(tmpPath, mode);
    await rename(tmpPath, filePath);
    // Codex orders /resume by recency and compresses by age; a metadata edit
    // must not change either, so keep the original timestamps.
    await utimes(filePath, atime, mtime).catch(() => {});
  } catch (err) {
    await rm(tmpPath, { force: true }).catch(() => {});
    throw err;
  }
}

async function rewritePlainRollout(
  filePath: string,
  options: CodexSessionSyncOptions,
  growBy: number,
): Promise<LineEdit | null> {
  const first = await readPlainFirstLine(filePath);
  if (!first) return null;
  const edit = editSessionMetaLine(first.line, filePath, options, growBy);
  if (!edit || edit.line === first.line) return null;
  const { size } = await stat(filePath);
  await replaceFile(filePath, async (tmpPath, mode) => {
    const out = createWriteStream(tmpPath, { mode });
    await new Promise<void>((resolve, reject) => {
      out.write(edit.line + first.separator, (err) =>
        err ? reject(err) : resolve(),
      );
    });
    if (first.restOffset < size) {
      await pipeline(createReadStream(filePath, { start: first.restOffset }), out);
    } else {
      await new Promise<void>((resolve, reject) => {
        out.end((err?: Error | null) => (err ? reject(err) : resolve()));
      });
    }
  });
  return edit;
}

async function rewriteCompressedRollout(
  filePath: string,
  options: CodexSessionSyncOptions,
  growBy: number,
): Promise<LineEdit | null> {
  const decoded = zlib.zstdDecompressSync(await readFile(filePath));
  const newline = decoded.indexOf(0x0a);
  if (newline === -1 || newline >= FIRST_LINE_MAX_BYTES) return null;
  const first = splitFirstLine(decoded, newline);
  const edit = editSessionMetaLine(first.line, filePath, options, growBy);
  if (!edit || edit.line === first.line) return null;
  const updated = Buffer.concat([
    Buffer.from(edit.line + first.separator, "utf-8"),
    decoded.subarray(first.restOffset),
  ]);
  await replaceFile(filePath, async (tmpPath, mode) => {
    await writeFile(tmpPath, zlib.zstdCompressSync(updated), { mode });
  });
  return edit;
}

interface SqliteHandle {
  exec(sql: string): void;
  runUpdate(sql: string, ...params: string[]): number;
  all(sql: string): Array<Record<string, unknown>>;
  close(): void;
}

// The Homebrew binary runs under bun (bun:sqlite), the npm dist under Node
// (node:sqlite, 22.5+). Specifiers are built at runtime so the bundler leaves
// them alone; whichever import resolves wins.
async function openSqlite(dbPath: string): Promise<SqliteHandle | null> {
  try {
    const mod = await import(["bun", "sqlite"].join(":"));
    const db = new mod.Database(dbPath);
    return {
      exec: (sql) => db.exec(sql),
      runUpdate: (sql, ...params) =>
        Number(db.prepare(sql).run(...params).changes ?? 0),
      all: (sql) => db.prepare(sql).all(),
      close: () => db.close(),
    };
  } catch {
    // Not running under bun.
  }
  try {
    const mod = await import(["node", "sqlite"].join(":"));
    const db = new mod.DatabaseSync(dbPath);
    return {
      exec: (sql) => db.exec(sql),
      runUpdate: (sql, ...params) =>
        Number(db.prepare(sql).run(...params).changes ?? 0),
      all: (sql) => db.prepare(sql).all(),
      close: () => db.close(),
    };
  } catch {
    return null;
  }
}

const execFileAsync = promisify(execFile);

function sqlQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

async function findCodexFile(candidates: string[]): Promise<string | null> {
  for (const candidate of candidates) {
    const fullPath = join(CODEX_DIR, candidate);
    if (await fileExists(fullPath)) return fullPath;
  }
  return null;
}

// Where Codex's paginated history projection of each rollout ends.
async function readProjectionOffsets(): Promise<Map<string, number>> {
  const offsets = new Map<string, number>();
  const dbPath = await findCodexFile(HISTORY_DB_CANDIDATES);
  if (!dbPath) return offsets;
  // Not opened read-only: a WAL database whose -shm file is gone (Codex not
  // running) cannot be opened that way. Only SELECTs run here.
  const db = await openSqlite(dbPath);
  if (!db) return offsets;
  try {
    db.exec("PRAGMA busy_timeout = 2000");
    for (const row of db.all(
      "SELECT thread_id, next_rollout_byte_offset FROM thread_history_projection_state",
    )) {
      const offset = Number(row.next_rollout_byte_offset);
      if (typeof row.thread_id === "string" && Number.isFinite(offset)) {
        offsets.set(row.thread_id, offset);
      }
    }
  } catch {
    // Unknown schema: skip repairs rather than guess.
  } finally {
    db.close();
  }
  return offsets;
}

// Thread rows follow their rollout: rows whose rollout keeps another managed
// provider (no room to restamp it) stay as they are, so the picker does not
// offer a session that would resume against the wrong endpoint.
async function updateSqliteThreadProviders(
  targetProvider: string,
  managedProviders: Set<string>,
  keepIds: string[],
): Promise<number> {
  const dbPath = await findCodexFile(STATE_DB_CANDIDATES);
  if (!dbPath) return 0;
  const managed = [...managedProviders].map((name) => name.toLowerCase());
  const keepJson = JSON.stringify(keepIds);

  const db = await openSqlite(dbPath);
  if (!db) {
    // Last resort for Node.js < 22.5 (no node:sqlite): the sqlite3 CLI,
    // present on macOS and most Linux distributions.
    const target = sqlQuote(targetProvider);
    const { stdout } = await execFileAsync("sqlite3", [
      "-cmd",
      ".timeout 2000",
      dbPath,
      `UPDATE threads SET model_provider = ${target} WHERE COALESCE(model_provider, '') <> ${target} AND (lower(model_provider) IN (${managed.map(sqlQuote).join(", ")}) OR COALESCE(model_provider, '') = '') AND id NOT IN (SELECT value FROM json_each(${sqlQuote(keepJson)})); SELECT changes();`,
    ]);
    return Number(stdout.trim()) || 0;
  }
  try {
    db.exec("PRAGMA busy_timeout = 2000");
    // Empty/NULL provider rows (observed from Codex Desktop automation) carry
    // no provider to preserve and keep the thread hidden, so repair them too.
    // Managed membership compares lowercased, exactness against the target
    // stays strict so casing variants get normalized to the canonical name.
    const placeholders = managed.map(() => "?").join(", ");
    return db.runUpdate(
      `UPDATE threads SET model_provider = ? WHERE COALESCE(model_provider, '') <> ? AND (lower(model_provider) IN (${placeholders}) OR COALESCE(model_provider, '') = '') AND id NOT IN (SELECT value FROM json_each(?))`,
      targetProvider,
      targetProvider,
      ...managed,
      keepJson,
    );
  } finally {
    db.close();
  }
}

// Rollout files a running codex process holds open must not be swapped out
// from under it: after the tmp+rename the live process keeps appending to the
// unlinked old inode and those writes are silently lost.
type OpenRolloutScan = { ok: true; paths: Set<string> } | { ok: false };

function parseLsofPaths(stdout: string): Set<string> {
  const open = new Set<string>();
  for (const line of stdout.split("\n")) {
    if (
      line.startsWith("n") &&
      (line.endsWith(PLAIN_SUFFIX) || line.endsWith(COMPRESSED_SUFFIX))
    ) {
      open.add(line.slice(1));
    }
  }
  return open;
}

const LSOF_CHUNK_SIZE = 100;

// Which of these files does ANY process hold open? Checking by path (rather
// than lsof -c <name>) also catches codex launched through a node/bun wrapper
// whose process command doesn't start with "codex". lsof reports resolved
// paths (/tmp -> /private/tmp), so results are mapped back through realpath.
async function scanOpenFiles(paths: string[]): Promise<OpenRolloutScan> {
  const byRealPath = new Map<string, string>();
  for (const path of paths) {
    try {
      byRealPath.set(await realpath(path), path);
    } catch {
      byRealPath.set(path, path);
    }
  }

  const openReal = new Set<string>();
  for (let i = 0; i < paths.length; i += LSOF_CHUNK_SIZE) {
    const chunk = paths.slice(i, i + LSOF_CHUNK_SIZE);
    try {
      // -w suppresses warnings, so anything left on stderr is a real error.
      const { stdout, stderr } = await execFileAsync(
        "lsof",
        ["-w", "-Fn", "--", ...chunk],
        { maxBuffer: 16 * 1024 * 1024 },
      );
      if (stderr.trim()) return { ok: false };
      for (const path of parseLsofPaths(stdout)) openReal.add(path);
    } catch (err) {
      // lsof exits 1 both for "none of the listed files are open" and for
      // detected errors; only a clean stderr makes it a trustworthy empty
      // scan (partial matches are still printed on stdout). Anything else
      // (ENOENT, EPERM, errors on stderr) means the scan is unreliable.
      const e = err as { code?: unknown; stdout?: unknown; stderr?: unknown };
      const stderrText = typeof e.stderr === "string" ? e.stderr : "";
      if (e.code !== 1 || stderrText.trim()) return { ok: false };
      const stdout = typeof e.stdout === "string" ? e.stdout : "";
      for (const path of parseLsofPaths(stdout)) openReal.add(path);
    }
  }

  const open = new Set<string>();
  for (const real of openReal) {
    open.add(byRealPath.get(real) ?? real);
  }
  return { ok: true, paths: open };
}

// Last resort when lsof is unavailable: only proceed if no codex process is
// running at all. -f matches the full command line, so wrapper-launched codex
// (process named node/bun invoking .../codex) is caught too; a false positive
// (some unrelated command line mentioning codex) merely skips the sync, which
// is the safe direction. If pgrep is unavailable as well, fail closed.
async function anyCodexProcessRunning(): Promise<boolean> {
  try {
    await execFileAsync("pgrep", ["-f", "codex"]);
    return true;
  } catch (err) {
    const e = err as { code?: unknown };
    if (e.code === 1) return false;
    return true;
  }
}

interface Candidate {
  file: RolloutFile;
  growBy: number;
}

export async function syncCodexSessions(
  options: CodexSessionSyncOptions,
): Promise<CodexSessionSyncResult> {
  const result: CodexSessionSyncResult = {
    rolloutFilesUpdated: 0,
    providerStamped: 0,
    providerSkipped: 0,
    sessionsShared: 0,
    rolloutsRepaired: 0,
    sqliteRowsUpdated: 0,
  };
  const canDecompress = zstdAvailable();
  const projections = await readProjectionOffsets();
  // Threads whose rollout keeps a different managed provider.
  const keepIds: string[] = [];

  // Collect the rollouts that actually need an edit before touching any.
  const candidates: Candidate[] = [];
  for (const dirName of SESSION_DIRS) {
    for (const file of await listRolloutFiles(join(CODEX_DIR, dirName))) {
      if (file.compressed && !canDecompress) continue;
      try {
        const first = await readFirstLine(file);
        if (!first) continue;
        let growBy = 0;
        let threadId: unknown;
        try {
          threadId = (JSON.parse(first.line) as { payload?: { id?: unknown } })
            ?.payload?.id;
        } catch {
          continue;
        }
        const projected =
          typeof threadId === "string" && isOrdinaryRollout(file.path, threadId)
            ? projections.get(threadId)
            : undefined;
        if (projected !== undefined) {
          const size = await logicalSize(file);
          if (
            size !== null &&
            projected > size &&
            projected - size <= MAX_REPAIR_BYTES
          ) {
            growBy = projected - size;
          }
        }
        const edit = editSessionMetaLine(first.line, file.path, options, growBy);
        if (!edit) continue;
        if (edit.providerSkipped) {
          // The rollout keeps its provider; leave the thread row alone too.
          result.providerSkipped += 1;
          if (typeof threadId === "string") keepIds.push(threadId);
        }
        if (edit.line !== first.line) candidates.push({ file, growBy });
      } catch {
        // An unreadable rollout must not block the switch.
      }
    }
  }

  const scan =
    candidates.length > 0
      ? await scanOpenFiles(candidates.map((c) => c.file.path))
      : { ok: true as const, paths: new Set<string>() };
  // When open-file detection failed (lsof missing/forbidden), rewriting could
  // hit a live session's rollout; only proceed if no codex process is running.
  const skipRollouts = !scan.ok && (await anyCodexProcessRunning());
  const openPaths = scan.ok ? scan.paths : new Set<string>();

  if (!skipRollouts) {
    for (const { file, growBy } of candidates) {
      if (openPaths.has(file.path)) continue;
      try {
        const edit = file.compressed
          ? await rewriteCompressedRollout(file.path, options, growBy)
          : await rewritePlainRollout(file.path, options, growBy);
        if (!edit) continue;
        result.rolloutFilesUpdated += 1;
        if (edit.providerStamped) result.providerStamped += 1;
        if (edit.shared) result.sessionsShared += 1;
        if (growBy > 0) result.rolloutsRepaired += 1;
      } catch {
        // A locked rollout must not block the switch.
      }
    }
  }

  if (options.provider) {
    try {
      result.sqliteRowsUpdated = await updateSqliteThreadProviders(
        options.provider.target,
        options.provider.managed,
        keepIds,
      );
    } catch {
      // A busy or missing state DB must not block the switch either.
    }
  }

  return result;
}
