import { execFile } from "child_process";
import { createReadStream, createWriteStream } from "fs";
import { open, readdir, rename, rm, stat, utimes } from "fs/promises";
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
  if (typeof current === "string" && !managedProviders.has(current)) {
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
  const managed = [...managedProviders].map(sqlQuote).join(", ");
  const { stdout } = await execFileAsync("sqlite3", [
    "-cmd",
    ".timeout 2000",
    dbPath,
    `UPDATE threads SET model_provider = ${target} WHERE model_provider <> ${target} AND model_provider IN (${managed}); SELECT changes();`,
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
    const placeholders = [...managedProviders].map(() => "?").join(", ");
    return db.runUpdate(
      `UPDATE threads SET model_provider = ? WHERE model_provider <> ? AND model_provider IN (${placeholders})`,
      targetProvider,
      targetProvider,
      ...managedProviders,
    );
  } finally {
    db.close();
  }
}

// Rollout files a running codex process holds open must not be swapped out
// from under it: after the tmp+rename the live process keeps appending to the
// unlinked old inode and those writes are silently lost. Best effort — when
// lsof is missing or errors we sync everything, same as the reference tool.
async function listOpenRolloutPaths(): Promise<Set<string>> {
  const open = new Set<string>();
  try {
    const { stdout } = await execFileAsync("lsof", ["-c", "codex", "-Fn"], {
      maxBuffer: 16 * 1024 * 1024,
    });
    for (const line of stdout.split("\n")) {
      if (line.startsWith("n") && line.endsWith(".jsonl")) {
        open.add(line.slice(1));
      }
    }
  } catch {
    // No codex processes running, or lsof unavailable.
  }
  return open;
}

export async function syncCodexSessionProviders(
  targetProvider: string,
  managedProviders: Set<string>,
): Promise<CodexSessionSyncResult> {
  const openPaths = await listOpenRolloutPaths();
  let rolloutFilesUpdated = 0;
  for (const dirName of SESSION_DIRS) {
    const root = join(CODEX_DIR, dirName);
    for (const filePath of await listJsonlFiles(root)) {
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
        // A locked or unreadable rollout must not block the switch.
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
