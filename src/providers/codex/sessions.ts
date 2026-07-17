import { execFile } from "child_process";
import { createReadStream, createWriteStream } from "fs";
import {
  open,
  readdir,
  realpath,
  rename,
  rm,
  stat,
  utimes,
} from "fs/promises";
import { join } from "path";
import { pipeline } from "stream/promises";
import { promisify } from "util";
import { CODEX_DIR } from "../../lib/paths";
import { fileExists } from "../../lib/fs";

// Codex hides historical sessions whose recorded model_provider differs from
// the active one, both in /resume (rollout first lines) and in the desktop
// thread list (state_5.sqlite). Switching accounts through claudex-switch can
// flip the active provider (official "openai" vs a custom relay), so after a
// switch we rewrite that visibility metadata to the new provider. Only
// metadata moves: message content and encrypted payloads stay untouched, same
// approach as https://github.com/Dailin521/codex-provider-sync.

const SESSION_DIRS = ["sessions", "archived_sessions"];
const STATE_DB_CANDIDATES = [
  join("sqlite", "state_5.sqlite"),
  "state_5.sqlite",
];
// session_meta first lines embed base_instructions (tens of KB); anything
// beyond this cap is not a metadata line we should touch.
const FIRST_LINE_MAX_BYTES = 4 * 1024 * 1024;
const READ_CHUNK_BYTES = 64 * 1024;

export interface CodexSessionSyncResult {
  rolloutFilesUpdated: number;
  sqliteRowsUpdated: number;
}

interface FirstLine {
  line: string;
  // Byte offset where the rest of the file starts (after the newline).
  restOffset: number;
  separator: "\n" | "\r\n" | "";
}

async function listJsonlFiles(root: string): Promise<string[]> {
  const results: string[] = [];
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
      } else if (entry.isFile() && entry.name.endsWith(".jsonl")) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

async function readFirstLine(filePath: string): Promise<FirstLine | null> {
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
        const buffer = Buffer.concat(chunks);
        const newlineIndex = total + idx;
        const hasCr = newlineIndex > 0 && buffer[newlineIndex - 1] === 0x0d;
        const lineEnd = hasCr ? newlineIndex - 1 : newlineIndex;
        return {
          line: buffer.subarray(0, lineEnd).toString("utf-8"),
          restOffset: newlineIndex + 1,
          separator: hasCr ? "\r\n" : "\n",
        };
      }
      total += bytesRead;
    }
    if (total === 0) return null;
    if (total >= FIRST_LINE_MAX_BYTES) return null;
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

function rewriteSessionMetaLine(
  line: string,
  targetProvider: string,
  managedProviders: Set<string>,
): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch {
    return null;
  }
  const record = parsed as {
    type?: unknown;
    payload?: { model_provider?: unknown } | null;
  };
  if (
    record?.type !== "session_meta" ||
    typeof record.payload !== "object" ||
    record.payload === null
  ) {
    return null;
  }
  const current = record.payload.model_provider;
  if (current === targetProvider) return null;
  // Only restamp sessions belonging to providers claudex-switch manages; a
  // provider the user configured by hand (say ollama) keeps its metadata —
  // restamping it would irreversibly destroy the original provider name.
  // A missing or empty provider carries no information worth preserving and
  // hides the session everywhere, so it always gets stamped. Membership is
  // case-insensitive (managedProviders holds lowercase names) so historical
  // casing variants like "OpenAI" are still managed and get normalized.
  if (
    typeof current === "string" &&
    current !== "" &&
    !managedProviders.has(current.toLowerCase())
  ) {
    return null;
  }
  record.payload.model_provider = targetProvider;
  return JSON.stringify(record);
}

async function rewriteRolloutProvider(
  filePath: string,
  targetProvider: string,
  managedProviders: Set<string>,
): Promise<boolean> {
  const first = await readFirstLine(filePath);
  if (!first) return false;
  const updatedLine = rewriteSessionMetaLine(
    first.line,
    targetProvider,
    managedProviders,
  );
  if (updatedLine === null) return false;

  const { mode, size, atime, mtime } = await stat(filePath);
  const tmpPath = `${filePath}.claudex-sync.${process.pid}.tmp`;
  try {
    const out = createWriteStream(tmpPath, { mode });
    await new Promise<void>((resolve, reject) => {
      out.write(updatedLine + first.separator, (err) =>
        err ? reject(err) : resolve(),
      );
    });
    if (first.restOffset < size) {
      await pipeline(
        createReadStream(filePath, { start: first.restOffset }),
        out,
      );
    } else {
      await new Promise<void>((resolve, reject) => {
        out.end((err?: Error | null) => (err ? reject(err) : resolve()));
      });
    }
    await rename(tmpPath, filePath);
    // Codex orders /resume by recency; a metadata restamp must not bump the
    // session to the top, so keep the original timestamps.
    await utimes(filePath, atime, mtime).catch(() => {});
    return true;
  } catch (err) {
    await rm(tmpPath, { force: true }).catch(() => {});
    throw err;
  }
}

interface SqliteHandle {
  exec(sql: string): void;
  runUpdate(sql: string, ...params: string[]): number;
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

// Last resort for Node.js < 22.5 (no node:sqlite): the sqlite3 CLI, present
// on macOS and most Linux distributions.
async function updateProvidersViaSqliteCli(
  dbPath: string,
  targetProvider: string,
  managedProviders: Set<string>,
): Promise<number> {
  const target = sqlQuote(targetProvider);
  const managed = [...managedProviders]
    .map((name) => sqlQuote(name.toLowerCase()))
    .join(", ");
  const { stdout } = await execFileAsync("sqlite3", [
    "-cmd",
    ".timeout 2000",
    dbPath,
    `UPDATE threads SET model_provider = ${target} WHERE COALESCE(model_provider, '') <> ${target} AND (lower(model_provider) IN (${managed}) OR COALESCE(model_provider, '') = ''); SELECT changes();`,
  ]);
  return Number(stdout.trim()) || 0;
}

async function updateSqliteThreadProviders(
  targetProvider: string,
  managedProviders: Set<string>,
): Promise<number> {
  let dbPath: string | null = null;
  for (const candidate of STATE_DB_CANDIDATES) {
    const fullPath = join(CODEX_DIR, candidate);
    if (await fileExists(fullPath)) {
      dbPath = fullPath;
      break;
    }
  }
  if (!dbPath) return 0;

  const db = await openSqlite(dbPath);
  if (!db) {
    return updateProvidersViaSqliteCli(
      dbPath,
      targetProvider,
      managedProviders,
    );
  }
  try {
    db.exec("PRAGMA busy_timeout = 2000");
    // Empty/NULL provider rows (observed from Codex Desktop automation) carry
    // no provider to preserve and keep the thread hidden, so repair them too.
    // Managed membership compares lowercased, exactness against the target
    // stays strict so casing variants get normalized to the canonical name.
    const managed = [...managedProviders].map((name) => name.toLowerCase());
    const placeholders = managed.map(() => "?").join(", ");
    return db.runUpdate(
      `UPDATE threads SET model_provider = ? WHERE COALESCE(model_provider, '') <> ? AND (lower(model_provider) IN (${placeholders}) OR COALESCE(model_provider, '') = '')`,
      targetProvider,
      targetProvider,
      ...managed,
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
    if (line.startsWith("n") && line.endsWith(".jsonl")) {
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

export async function syncCodexSessionProviders(
  targetProvider: string,
  managedProviders: Set<string>,
): Promise<CodexSessionSyncResult> {
  // Collect the rollouts that actually need a restamp before touching any.
  const candidates: string[] = [];
  for (const dirName of SESSION_DIRS) {
    const root = join(CODEX_DIR, dirName);
    for (const filePath of await listJsonlFiles(root)) {
      try {
        const first = await readFirstLine(filePath);
        if (!first) continue;
        if (
          rewriteSessionMetaLine(first.line, targetProvider, managedProviders) !==
          null
        ) {
          candidates.push(filePath);
        }
      } catch {
        // An unreadable rollout must not block the switch.
      }
    }
  }

  const scan =
    candidates.length > 0
      ? await scanOpenFiles(candidates)
      : { ok: true as const, paths: new Set<string>() };
  // When open-file detection failed (lsof missing/forbidden), rewriting could
  // hit a live session's rollout; only proceed if no codex process is running.
  const skipRollouts = !scan.ok && (await anyCodexProcessRunning());
  const openPaths = scan.ok ? scan.paths : new Set<string>();

  let rolloutFilesUpdated = 0;
  if (!skipRollouts) {
    for (const filePath of candidates) {
      if (openPaths.has(filePath)) continue;
      try {
        if (
          await rewriteRolloutProvider(
            filePath,
            targetProvider,
            managedProviders,
          )
        ) {
          rolloutFilesUpdated += 1;
        }
      } catch {
        // A locked rollout must not block the switch.
      }
    }
  }

  let sqliteRowsUpdated = 0;
  try {
    sqliteRowsUpdated = await updateSqliteThreadProviders(
      targetProvider,
      managedProviders,
    );
  } catch {
    // A busy or missing state DB must not block the switch either.
  }

  return { rolloutFilesUpdated, sqliteRowsUpdated };
}
