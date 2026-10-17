import chalk from "chalk";
import { execFile } from "child_process";
import { mkdir, readdir, readFile, realpath, rename, stat, writeFile } from "fs/promises";
import { join } from "path";
import { promisify } from "util";
import {
  ACTIVITY_CACHE_FILE,
  CLAUDE_DIR,
  CLAUDE_PROFILES_DIR,
  CLAUDEX_DIR,
  CODEX_DIR,
  OPENCODE_PROFILES_DIR,
  openCodeProfileV2DatabaseFile,
} from "./paths";
import { formatAge } from "./usage-cache";
import { nativeOpenCodeDatabaseFile, queryRows } from "../providers/opencode/native";

// The trend under `list`: tokens read from local Claude Code / Codex / OpenCode
// session logs (cache reads included) and source lines the user committed in
// the repos those sessions ran in. Scanning ~300MB of logs and running git log
// takes seconds, so only the detached refresher computes it, at most every
// REFRESH_INTERVAL_MS; `list` itself only reads ACTIVITY_CACHE_FILE.

export const ACTIVITY_DAYS = 30;
const REFRESH_INTERVAL_MS = 10 * 60_000;
// A refresher killed mid-scan must not block the next one for long.
const STALE_START_MS = 2 * 60_000;
const GIT_TIMEOUT_MS = 30_000;

const execFileAsync = promisify(execFile);

export interface ActivityDay {
  tokens: number;
  added: number;
  deleted: number;
}

export interface ActivityCache {
  version: 1;
  startedAt: number | null;
  finishedAt: number | null;
  repos: number;
  days: Record<string, ActivityDay>;
}

// Git pathspecs: only source files are diffed. Letting git skip large JSON /
// HTML / data files is what keeps `git log --numstat` fast (9s → 0.6s on a
// repo with committed agent journals).
const CODE_EXTENSIONS = [
  "py", "ts", "tsx", "js", "jsx", "mjs", "cjs", "go", "rs", "sh", "swift", "java", "kt",
  "c", "cc", "cpp", "h", "hpp", "cs", "rb", "php", "lua", "sql", "css", "scss", "vue",
  "svelte", "dart", "zig",
];
// Source-looking files that machines write: build output, vendored code, and
// agent / script output directories.
const GENERATED_PATH =
  /(\.min\.(js|css)$|(^|\/)(node_modules|dist|build|vendor|\.venv|output|outputs|data|state|journals|logs|fixtures|snapshots|generated)\/)/;

export function emptyActivityCache(): ActivityCache {
  return { version: 1, startedAt: null, finishedAt: null, repos: 0, days: {} };
}

export async function readActivityCache(): Promise<ActivityCache> {
  try {
    const parsed = JSON.parse(await readFile(ACTIVITY_CACHE_FILE, "utf-8")) as ActivityCache;
    if (parsed?.version !== 1 || !parsed.days || typeof parsed.days !== "object") {
      return emptyActivityCache();
    }
    return parsed;
  } catch {
    return emptyActivityCache();
  }
}

async function writeActivityCache(cache: ActivityCache): Promise<void> {
  await mkdir(CLAUDEX_DIR, { recursive: true });
  const tmp = `${ACTIVITY_CACHE_FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(cache), { mode: 0o600 });
  await rename(tmp, ACTIVITY_CACHE_FILE);
}

/** Local calendar day (YYYY-MM-DD) of a timestamp. */
export function localDay(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** The ACTIVITY_DAYS local days ending today, oldest first. */
export function activityWindow(now: number): string[] {
  const today = new Date(now);
  return Array.from({ length: ACTIVITY_DAYS }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (ACTIVITY_DAYS - 1 - i), 12);
    return localDay(d.getTime());
  });
}

/** Recompute the cache unless a recent or running refresh already covers it. */
export async function refreshActivityCache(now = Date.now()): Promise<boolean> {
  const cache = await readActivityCache();
  const started = cache.startedAt ?? 0;
  const running = started > (cache.finishedAt ?? 0) && now - started < STALE_START_MS;
  if (running || now - (cache.finishedAt ?? 0) < REFRESH_INTERVAL_MS) return false;

  await writeActivityCache({ ...cache, startedAt: now });
  const result = await computeActivity(now);
  await writeActivityCache({ version: 1, startedAt: now, finishedAt: Date.now(), ...result });
  return true;
}

export async function computeActivity(now: number): Promise<Pick<ActivityCache, "repos" | "days">> {
  const window = activityWindow(now);
  const since = new Date(`${window[0]}T00:00:00`).getTime();
  const days: Record<string, ActivityDay> = Object.fromEntries(
    window.map((day) => [day, { tokens: 0, added: 0, deleted: 0 }]),
  );
  const addTokens = (ms: number, tokens: number) => {
    const day = days[localDay(ms)];
    if (day && tokens > 0) day.tokens += tokens;
  };
  const cwds = new Set<string>();

  await Promise.all([
    collectClaudeTokens(since, addTokens, cwds).catch(() => {}),
    collectCodexTokens(since, addTokens, cwds).catch(() => {}),
    collectOpenCodeTokens(since, addTokens, cwds).catch(() => {}),
  ]);
  const repos = await collectCommittedLines(cwds, since, days).catch(() => 0);
  return { repos, days };
}

type AddTokens = (ms: number, tokens: number) => void;

async function recentJsonlFiles(roots: string[], since: number): Promise<string[]> {
  const files = new Set<string>();
  const seenDirs = new Set<string>();
  const walk = async (dir: string): Promise<void> => {
    let real: string;
    try {
      real = await realpath(dir);
    } catch {
      return;
    }
    // Profiles commonly symlink their projects dir to ~/.claude/projects.
    if (seenDirs.has(real)) return;
    seenDirs.add(real);
    const entries = await readdir(real, { withFileTypes: true }).catch(() => []);
    await Promise.all(entries.map(async (entry) => {
      const path = join(real, entry.name);
      if (entry.isDirectory() || entry.isSymbolicLink()) {
        const info = await stat(path).catch(() => null);
        if (info?.isDirectory()) return walk(path);
        if (!info || !entry.name.endsWith(".jsonl")) return;
        if (info.mtimeMs >= since) files.add(await realpath(path));
      } else if (entry.name.endsWith(".jsonl")) {
        const info = await stat(path).catch(() => null);
        if (info && info.mtimeMs >= since) files.add(path);
      }
    }));
  };
  await Promise.all(roots.map(walk));
  return [...files];
}

async function collectClaudeTokens(since: number, addTokens: AddTokens, cwds: Set<string>): Promise<void> {
  const roots = [join(CLAUDE_DIR, "projects")];
  for (const profile of await readdir(CLAUDE_PROFILES_DIR).catch(() => [])) {
    roots.push(join(CLAUDE_PROFILES_DIR, profile, "config", "projects"));
  }
  // Claude Code writes one assistant message as several lines sharing its usage.
  const seen = new Set<string>();
  for (const file of await recentJsonlFiles(roots, since)) {
    const text = await readFile(file, "utf-8").catch(() => "");
    for (const line of text.split("\n")) {
      if (!line.includes('"usage"')) continue;
      let record: any;
      try {
        record = JSON.parse(line);
      } catch {
        continue;
      }
      const usage = record?.message?.usage;
      const at = Date.parse(record?.timestamp);
      if (!usage || !(at >= since)) continue;
      const key = `${record.message.id}:${record.requestId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (typeof record.cwd === "string") cwds.add(record.cwd);
      addTokens(
        at,
        num(usage.input_tokens) + num(usage.output_tokens) +
          num(usage.cache_creation_input_tokens) + num(usage.cache_read_input_tokens),
      );
    }
  }
}

async function collectCodexTokens(since: number, addTokens: AddTokens, cwds: Set<string>): Promise<void> {
  // Private CODEX_HOMEs link their sessions dir back to ~/.codex/sessions.
  const files = await recentJsonlFiles(
    [join(CODEX_DIR, "sessions"), join(CODEX_DIR, "archived_sessions")],
    since,
  );
  for (const file of files) {
    const text = await readFile(file, "utf-8").catch(() => "");
    // token_count carries the session's running total (it can repeat after a
    // rate-limit update), so each event contributes only its increase.
    let previous = 0;
    for (const line of text.split("\n")) {
      const tokenEvent = line.includes('"token_count"');
      if (!tokenEvent && !line.includes('"turn_context"') && !line.includes('"session_meta"')) continue;
      let record: any;
      try {
        record = JSON.parse(line);
      } catch {
        continue;
      }
      const payload = record?.payload;
      if (tokenEvent) {
        const total = num(payload?.info?.total_token_usage?.total_tokens);
        if (total <= previous) continue;
        const at = Date.parse(record.timestamp);
        if (at >= since) addTokens(at, total - previous);
        previous = total;
      } else if (typeof payload?.cwd === "string") {
        cwds.add(payload.cwd);
      }
    }
  }
}

async function collectOpenCodeTokens(since: number, addTokens: AddTokens, cwds: Set<string>): Promise<void> {
  const dbs = [nativeOpenCodeDatabaseFile()];
  for (const profileId of await readdir(OPENCODE_PROFILES_DIR).catch(() => [])) {
    dbs.push(openCodeProfileV2DatabaseFile(profileId));
  }
  const seen = new Set<string>();
  for (const db of dbs) {
    if (!(await stat(db).catch(() => null))) continue;
    // Per assistant message, so a session spanning days lands on each day.
    const messages = await queryRows(db,
      `SELECT id, time_created AS at,
         coalesce(json_extract(data, '$.tokens.input'), 0) + coalesce(json_extract(data, '$.tokens.output'), 0) +
         coalesce(json_extract(data, '$.tokens.reasoning'), 0) + coalesce(json_extract(data, '$.tokens.cache.read'), 0) +
         coalesce(json_extract(data, '$.tokens.cache.write'), 0) AS tokens
       FROM session_message WHERE type = 'assistant' AND time_created >= ${Math.floor(since)}`);
    for (const row of messages ?? []) {
      if (typeof row.id !== "string" || seen.has(row.id)) continue;
      seen.add(row.id);
      addTokens(num(row.at), num(row.tokens));
    }
    const sessions = await queryRows(db,
      `SELECT DISTINCT directory FROM session_v2 WHERE time_updated >= ${Math.floor(since)}`);
    for (const row of sessions ?? []) {
      if (typeof row.directory === "string") cwds.add(row.directory);
    }
  }
}

async function git(args: string[]): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("git", args, {
      maxBuffer: 256 * 1024 * 1024,
      timeout: GIT_TIMEOUT_MS,
    });
    return stdout;
  } catch {
    return null;
  }
}

/** Adds the user's committed source lines per day; returns the repo count. */
async function collectCommittedLines(
  cwds: Set<string>,
  since: number,
  days: Record<string, ActivityDay>,
): Promise<number> {
  // Worktrees and subdirectories of one repo share a common git dir.
  const repos = new Map<string, string>();
  await Promise.all([...cwds].map(async (cwd) => {
    if (!(await stat(cwd).catch(() => null))?.isDirectory()) return;
    const out = await git(["-C", cwd, "rev-parse", "--path-format=absolute", "--git-common-dir", "--show-toplevel"]);
    const [common, top] = out?.trim().split("\n") ?? [];
    if (common && top && !repos.has(common)) repos.set(common, top);
  }));

  const seenCommits = new Set<string>();
  let counted = 0;
  await Promise.all([...repos.values()].map(async (top) => {
    const email = (await git(["-C", top, "config", "user.email"]))?.trim();
    if (!email) return;
    const out = await git([
      "-C", top, "log", "--all", "--no-merges", `--since=${new Date(since).toISOString()}`,
      "--author", `<${email}>`, "--fixed-strings", "--numstat",
      "--date=format-local:%Y-%m-%d", "--format=@%H %ad", "--",
      ...CODE_EXTENSIONS.map((ext) => `*.${ext}`),
    ]);
    if (out === null) return;
    counted++;
    let day: ActivityDay | undefined;
    for (const line of out.split("\n")) {
      if (line.startsWith("@")) {
        const [hash, date] = line.slice(1).split(" ");
        // The same commit can live in a fork or a copied repo.
        day = hash && !seenCommits.has(hash) ? days[date ?? ""] : undefined;
        if (hash) seenCommits.add(hash);
        continue;
      }
      const [added, deleted, path] = line.split("\t");
      if (!day || path === undefined || added === "-" || GENERATED_PATH.test(path)) continue;
      day.added += num(Number(added));
      day.deleted += num(Number(deleted));
    }
  }));
  return counted;
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}

const SPARK = "▁▂▃▄▅▆▇█";

function sparkline(values: number[]): string {
  const max = Math.max(...values);
  return values
    .map((v) => (v <= 0 || max <= 0 ? " " : SPARK[Math.min(SPARK.length - 1, Math.ceil((v / max) * SPARK.length) - 1)]))
    .join("");
}

export function formatCompact(n: number): string {
  const units: Array<[number, string]> = [[1e9, "B"], [1e6, "M"], [1e3, "K"]];
  for (const [size, suffix] of units) {
    if (n >= size) {
      const value = n / size;
      return `${value >= 100 ? value.toFixed(0) : value.toFixed(1).replace(/\.0$/, "")}${suffix}`;
    }
  }
  return String(Math.round(n));
}

function shortDay(day: string): string {
  return `${day.slice(5, 7)}/${day.slice(8, 10)}`;
}

/** The trend section for the human `list`; empty until a refresh has finished. */
export function renderActivityLines(cache: ActivityCache, now = Date.now()): string[] {
  if (!cache.finishedAt) return [];
  const window = activityWindow(now);
  const day = (key: string): ActivityDay => cache.days[key] ?? { tokens: 0, added: 0, deleted: 0 };
  const tokens = window.map((key) => day(key).tokens);
  const added = window.map((key) => day(key).added);
  const deleted = window.reduce((sum, key) => sum + day(key).deleted, 0);
  const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
  const peak = (values: number[], format: (n: number) => string) => {
    const max = Math.max(...values);
    return max > 0 ? chalk.dim(`  peak ${format(max)} ${shortDay(window[values.indexOf(max)]!)}`) : "";
  };
  const age = now - cache.finishedAt >= 60 * 60_000 ? chalk.dim(` · ${formatAge(now - cache.finishedAt)}`) : "";
  const axisGap = " ".repeat(ACTIVITY_DAYS - 10);

  return [
    `  ${chalk.dim("──")} ${chalk.bold(`Last ${ACTIVITY_DAYS} days`)} ${chalk.dim("──")}${age}`,
    `  Tokens  ${chalk.cyan(sparkline(tokens))}  ${formatCompact(sum(tokens))}${peak(tokens, formatCompact)}`,
    `  Code    ${chalk.green(sparkline(added))}  ${chalk.green(`+${formatCompact(sum(added))}`)} ${chalk.red(`-${formatCompact(deleted)}`)}` +
      chalk.dim(`  ${cache.repos} ${cache.repos === 1 ? "repo" : "repos"}`) +
      peak(added, (n) => `+${formatCompact(n)}`),
    chalk.dim(`          ${shortDay(window[0]!)}${axisGap}${shortDay(window[window.length - 1]!)}`),
  ];
}
