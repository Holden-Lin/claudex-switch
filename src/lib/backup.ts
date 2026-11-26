import { mkdir, readFile, readdir, unlink, writeFile } from "fs/promises";
import { join } from "path";
import { assertTestWriteTarget } from "./home-guard";

// Rolling copies of the stores that no other file can rebuild (aliases.json,
// the Codex registry). Taken before a write whenever the store's identity
// changes (an alias or account added, removed, renamed or repointed), and at
// least daily otherwise, so routine usage updates cannot push the last good
// copy out. Restore steps: README "从备份恢复".
export const BACKUP_KEEP = 20;
const BACKUP_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function stamp(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

function stampTime(name: string): number {
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2})-(\d{3})Z\.json$/.exec(name);
  return match ? Date.parse(`${match[1]}:${match[2]}:${match[3]}.${match[4]}Z`) : NaN;
}

export async function listBackups(dir: string): Promise<string[]> {
  try {
    return (await readdir(dir))
      .filter((name) => !Number.isNaN(stampTime(name)))
      .sort();
  } catch {
    return [];
  }
}

/**
 * Copy the current `file` into `dir` before it is replaced by `next`.
 * Never blocks the write: a failed backup is reported on stderr.
 */
export async function backupBeforeWrite<T>(
  file: string,
  next: T,
  dir: string,
  identity: (data: T) => string,
): Promise<void> {
  try {
    let current: string;
    try {
      current = await readFile(file, "utf-8");
    } catch {
      return; // nothing on disk yet
    }

    const backups = await listBackups(dir);
    const newest = backups.at(-1);
    let changed = true;
    try {
      changed = identity(JSON.parse(current) as T) !== identity(next);
    } catch {
      // An unreadable store is worth keeping before it is replaced.
    }
    const stale = !newest || Date.now() - stampTime(newest) > BACKUP_MAX_AGE_MS;
    if (!changed && !stale) return;

    // Two writes in one millisecond must not overwrite the first copy.
    let at = Date.now();
    while (backups.includes(`${stamp(new Date(at))}.json`)) at++;
    const target = join(dir, `${stamp(new Date(at))}.json`);
    assertTestWriteTarget(target);
    await mkdir(dir, { recursive: true, mode: 0o700 });
    await writeFile(target, current, { mode: 0o600 });

    const kept = [...backups, target.slice(dir.length + 1)].sort();
    for (const name of kept.slice(0, Math.max(0, kept.length - BACKUP_KEEP))) {
      await unlink(join(dir, name)).catch(() => {});
    }
  } catch (err) {
    console.error(
      `claudex-switch: could not back up ${file} before writing: ${(err as Error).message}`,
    );
  }
}
