import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { Database } from "bun:sqlite";
import { execFileSync } from "child_process";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { saveAliases } from "../src/alias/store";
import { list } from "../src/commands/list";
import {
  activityWindow,
  computeActivity,
  emptyActivityCache,
  localDay,
  readActivityCache,
  refreshActivityCache,
  renderActivityLines,
  type ActivityCache,
} from "../src/lib/activity";
import { ACTIVITY_CACHE_FILE, OPENCODE_GLOBAL_DATA_DIR } from "../src/lib/paths";
import { resetTestHome, TEST_HOME } from "./helpers";

const NOW = Date.now();
const TODAY = localDay(NOW);
const YESTERDAY = localDay(NOW - 86_400_000);
const iso = (ms: number) => new Date(ms).toISOString();
const REPO = () => join(TEST_HOME, "work", "repo");

async function writeLines(path: string, records: unknown[]): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, records.map((r) => JSON.stringify(r)).join("\n") + "\n");
}

function git(cwd: string, args: string[], env: Record<string, string> = {}): void {
  execFileSync("git", args, { cwd, stdio: "ignore", env: { ...process.env, ...env } });
}

async function commit(files: Record<string, number>, email: string, at: number): Promise<void> {
  for (const [path, lines] of Object.entries(files)) {
    await mkdir(dirname(join(REPO(), path)), { recursive: true });
    await writeFile(join(REPO(), path), Array.from({ length: lines }, (_, i) => `line ${i}`).join("\n") + "\n");
  }
  git(REPO(), ["add", "-A"]);
  const date = new Date(at).toISOString();
  git(REPO(), ["-c", `user.email=${email}`, "-c", "user.name=T", "commit", "-qm", "c"], {
    GIT_AUTHOR_DATE: date,
    GIT_COMMITTER_DATE: date,
  });
}

async function writeFixtures(): Promise<void> {
  await mkdir(REPO(), { recursive: true });
  git(REPO(), ["init", "-q"]);
  git(REPO(), ["config", "user.email", "me@example.com"]);
  await commit({ "src/a.py": 10, "output/gen.py": 500, "notes.json": 300 }, "me@example.com", NOW - 60_000);
  await commit({ "src/b.ts": 7 }, "other@example.com", NOW - 60_000);
  await commit({ "src/c.go": 4 }, "me@example.com", NOW - 86_400_000);

  // One assistant message split over two lines, plus one outside the window.
  const usage = { input_tokens: 1, output_tokens: 2, cache_creation_input_tokens: 3, cache_read_input_tokens: 4 };
  await writeLines(join(TEST_HOME, ".claude", "projects", "-work-repo", "s1.jsonl"), [
    { type: "assistant", timestamp: iso(NOW), cwd: join(REPO(), "src"), requestId: "r1", message: { id: "m1", usage } },
    { type: "assistant", timestamp: iso(NOW), cwd: REPO(), requestId: "r1", message: { id: "m1", usage } },
    { type: "assistant", timestamp: iso(NOW - 40 * 86_400_000), requestId: "r0", message: { id: "m0", usage } },
  ]);

  // Codex reports a running total; a repeated total adds nothing.
  const tokenCount = (at: number, total: number) => ({
    timestamp: iso(at),
    type: "event_msg",
    payload: { type: "token_count", info: { total_token_usage: { total_tokens: total } } },
  });
  await writeLines(join(TEST_HOME, ".codex", "sessions", "2026", "01", "01", "rollout-x.jsonl"), [
    { timestamp: iso(NOW), type: "session_meta", payload: { cwd: REPO() } },
    tokenCount(NOW - 86_400_000, 100),
    tokenCount(NOW, 100),
    tokenCount(NOW, 250),
  ]);

  const dbFile = join(OPENCODE_GLOBAL_DATA_DIR, "opencode.db");
  await mkdir(dirname(dbFile), { recursive: true });
  const db = new Database(dbFile);
  db.exec("CREATE TABLE session_message (id text PRIMARY KEY, type text, time_created integer, data text)");
  db.exec("CREATE TABLE session_v2 (id text PRIMARY KEY, directory text, time_updated integer)");
  const tokens = { input: 10, output: 20, reasoning: 30, cache: { read: 40, write: 50 } };
  db.prepare("INSERT INTO session_message VALUES (?, ?, ?, ?)").run("a1", "assistant", NOW, JSON.stringify({ tokens }));
  db.prepare("INSERT INTO session_message VALUES (?, ?, ?, ?)").run("u1", "user", NOW, JSON.stringify({ tokens }));
  db.prepare("INSERT INTO session_v2 VALUES (?, ?, ?)").run("s1", REPO(), NOW);
  db.close();
}

describe("activity trend", () => {
  beforeEach(async () => {
    await resetTestHome();
  });

  test("sums tokens from all three tools and the user's committed source lines per day", async () => {
    await writeFixtures();
    const { days, repos } = await computeActivity(NOW);

    expect(Object.keys(days)).toEqual(activityWindow(NOW));
    // Claude 10 (deduplicated) + Codex 150 + OpenCode 150.
    expect(days[TODAY]!.tokens).toBe(310);
    expect(days[YESTERDAY]!.tokens).toBe(100);
    // Only the user's source files outside generated dirs; JSON is never diffed.
    expect(days[TODAY]!.added).toBe(10);
    expect(days[YESTERDAY]!.added).toBe(4);
    // Claude, Codex and OpenCode cwds all resolve to the same repo.
    expect(repos).toBe(1);
  });

  test("refreshes at most once per interval", async () => {
    expect(await refreshActivityCache(NOW)).toBe(true);
    const first = await readActivityCache();
    expect(first.finishedAt).not.toBeNull();
    expect(await refreshActivityCache(NOW + 60_000)).toBe(false);
    expect(await refreshActivityCache(NOW + 11 * 60_000)).toBe(true);
  });

  test("renders nothing before the first refresh finishes", () => {
    expect(renderActivityLines(emptyActivityCache(), NOW)).toEqual([]);
    expect(renderActivityLines({ ...emptyActivityCache(), startedAt: NOW }, NOW)).toEqual([]);
  });

  test("renders one sparkline column per day with totals and peaks", () => {
    const window = activityWindow(NOW);
    const cache: ActivityCache = {
      ...emptyActivityCache(),
      finishedAt: NOW,
      repos: 2,
      days: {
        [window[0]!]: { tokens: 1_000_000, added: 0, deleted: 0 },
        [window[29]!]: { tokens: 8_000_000, added: 1_500, deleted: 20 },
      },
    };
    const [title, tokens, code, axis] = renderActivityLines(cache, NOW);
    expect(title).toContain("Last 30 days");
    expect(tokens).toContain(`  Tokens  ▁${" ".repeat(28)}█  9M  peak 8M ${window[29]!.slice(5).replace("-", "/")}`);
    expect(code).toContain(`  Code    ${" ".repeat(29)}█  +1.5K -20  2 repos  peak +1.5K`);
    expect(axis!.trim()).toMatch(/^\d\d\/\d\d {20}\d\d\/\d\d$/);
  });

  test("shows its age once the cached trend is over an hour old", () => {
    const cache = { ...emptyActivityCache(), finishedAt: NOW - 3 * 60 * 60_000 };
    expect(renderActivityLines(cache, NOW)[0]).toContain("3h ago");
  });

  describe("in list", () => {
    afterEach(() => {
      (console.log as any).mockRestore?.();
    });

    test("--cached prints the trend from the cache file without computing it", async () => {
      await saveAliases({
        version: 1,
        aliases: [{ alias: "demo", target: { provider: "codex", accountKey: "k" }, createdAt: 1 }],
      });
      const cache: ActivityCache = {
        ...emptyActivityCache(),
        finishedAt: Date.now(),
        repos: 3,
        days: { [TODAY]: { tokens: 42_000, added: 12, deleted: 1 } },
      };
      await mkdir(dirname(ACTIVITY_CACHE_FILE), { recursive: true });
      await writeFile(ACTIVITY_CACHE_FILE, JSON.stringify(cache));
      const logs = spyOn(console, "log").mockImplementation(() => {});

      await list({ cached: true, background: true, spawnRefresh: () => {} });

      const out = logs.mock.calls.flat().join("\n");
      expect(out).toContain("Last 30 days");
      expect(out).toContain("42K");
      expect(out).toContain("+12 -1  3 repos");
      expect(JSON.parse(await readFile(ACTIVITY_CACHE_FILE, "utf-8"))).toEqual(cache);
    });
  });
});
