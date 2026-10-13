import { spawn } from "child_process";
import { mkdir, open, readFile, rename, stat, unlink, writeFile } from "fs/promises";
import { USAGE_CACHE_FILE, USAGE_REFRESH_LOCK, CLAUDEX_DIR } from "./paths";
import type { RelayBalance, UsageInfo } from "../types";

// A refresher that crashed or was killed leaves its lock behind; after this
// long the next one takes over. Longer than the slowest serial fetch chain.
const LOCK_STALE_MS = 2 * 60_000;

// Notes that mean "this attempt failed", not "the account changed state".
// For these the last good numbers are more useful than the note.
const TRANSIENT_NOTES = new Set(["usage n/a", "quota unavailable"]);

export interface UsageCacheEntry {
  usage: UsageInfo | null;
  balance: RelayBalance | null;
  /** Live Codex plan from the rate-limit response (ChatGPT accounts only). */
  plan: string | null;
  /** When usage/balance was last fetched successfully. */
  dataAt: number | null;
  /** Note from the latest attempt (null when it succeeded). */
  note: string | null;
  checkedAt: number;
}

export interface UsageCache {
  version: 1;
  refreshStartedAt: number | null;
  refreshFinishedAt: number | null;
  entries: Record<string, UsageCacheEntry>;
}

export interface CachedQuota {
  usage: UsageInfo | null;
  balance: RelayBalance | null;
  note: string | null;
  plan: string | null;
  /** Set when the shown numbers come from an earlier refresh. */
  dataAt: number | null;
}

export function emptyUsageCache(): UsageCache {
  return { version: 1, refreshStartedAt: null, refreshFinishedAt: null, entries: {} };
}

export async function readUsageCache(): Promise<UsageCache> {
  try {
    const parsed = JSON.parse(await readFile(USAGE_CACHE_FILE, "utf-8")) as UsageCache;
    if (parsed?.version !== 1 || !parsed.entries || typeof parsed.entries !== "object") {
      return emptyUsageCache();
    }
    return parsed;
  } catch {
    return emptyUsageCache();
  }
}

/** Atomic replace so a concurrent reader never sees a half-written file. */
export async function writeUsageCache(cache: UsageCache): Promise<void> {
  await mkdir(CLAUDEX_DIR, { recursive: true });
  const tmp = `${USAGE_CACHE_FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(cache, null, 2), { mode: 0o600 });
  await rename(tmp, USAGE_CACHE_FILE);
}

export async function usageCacheMtime(): Promise<number> {
  try {
    return (await stat(USAGE_CACHE_FILE)).mtimeMs;
  } catch {
    return 0;
  }
}

export function nextCacheEntry(
  previous: UsageCacheEntry | undefined,
  result: { usage: UsageInfo | null; balance: RelayBalance | null; note: string | null; plan: string | null },
  now: number,
): UsageCacheEntry {
  if (result.usage || result.balance) {
    return {
      usage: result.usage,
      balance: result.balance,
      plan: result.plan ?? previous?.plan ?? null,
      dataAt: now,
      note: null,
      checkedAt: now,
    };
  }
  return {
    usage: previous?.usage ?? null,
    balance: previous?.balance ?? null,
    plan: result.plan ?? previous?.plan ?? null,
    dataAt: previous?.dataAt ?? null,
    note: result.note,
    checkedAt: now,
  };
}

/** What to show for one account given its cache entry. */
export function quotaFromCache(entry: UsageCacheEntry | undefined): CachedQuota | null {
  if (!entry) return null;
  const latestOk = entry.note === null && entry.dataAt === entry.checkedAt;
  const hasData = Boolean(entry.usage || entry.balance);
  if (latestOk || (hasData && (entry.note === null || TRANSIENT_NOTES.has(entry.note)))) {
    return {
      usage: entry.usage,
      balance: entry.balance,
      note: null,
      plan: entry.plan,
      dataAt: entry.dataAt,
    };
  }
  return { usage: null, balance: null, note: entry.note, plan: entry.plan, dataAt: null };
}

export function formatAge(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Returns a release function, or null when another refresher is running. */
export async function acquireRefreshLock(): Promise<(() => Promise<void>) | null> {
  await mkdir(CLAUDEX_DIR, { recursive: true });
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const handle = await open(USAGE_REFRESH_LOCK, "wx", 0o600);
      await handle.writeFile(`${process.pid} ${Date.now()}\n`);
      await handle.close();
      return async () => {
        await unlink(USAGE_REFRESH_LOCK).catch(() => {});
      };
    } catch {
      if (!(await isRefreshLockStale())) return null;
      await unlink(USAGE_REFRESH_LOCK).catch(() => {});
    }
  }
  return null;
}

export async function isRefreshRunning(): Promise<boolean> {
  try {
    await stat(USAGE_REFRESH_LOCK);
  } catch {
    return false;
  }
  return !(await isRefreshLockStale());
}

async function isRefreshLockStale(): Promise<boolean> {
  try {
    return Date.now() - (await stat(USAGE_REFRESH_LOCK)).mtimeMs > LOCK_STALE_MS;
  } catch {
    return true;
  }
}

/**
 * Start `claudex-switch list --refresh-cache` detached from the terminal so the
 * shell never waits on it. Re-invokes this same CLI (script or compiled binary).
 */
export function spawnBackgroundRefresh(): void {
  const args = ["list", "--refresh-cache"];
  const script = process.argv[1];
  // Compiled Bun binaries report a virtual script path; the binary is the CLI.
  const compiled = !script || script.startsWith("/$bunfs/") || /^[A-Za-z]:[\\/]~BUN[\\/]/.test(script);
  try {
    const child = spawn(process.execPath, compiled ? args : [script, ...args], {
      detached: true,
      stdio: "ignore",
      env: process.env,
    });
    child.on("error", () => {});
    child.unref();
  } catch {
    // The cached view is still shown; the next list tries again.
  }
}
