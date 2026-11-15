import { beforeEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdir, open, readFile, stat, utimes, writeFile } from "fs/promises";
import { zstdCompressSync, zstdDecompressSync } from "zlib";
import { dirname, join } from "path";
import { CODEX_DIR } from "../src/lib/paths";
import {
  syncCodexSessions,
  zstdFrameContentSize,
  type CodexSessionCreator,
} from "../src/providers/codex/sessions";
import { saveAliases } from "../src/alias/store";
import { saveAccountAuth } from "../src/providers/codex/auth";
import { saveRegistry } from "../src/providers/codex/registry";
import { use } from "../src/commands/use";
import { makeJwt, resetTestHome } from "./helpers";
import type { CodexRegistry } from "../src/types";

// Mirrors managedProviderNames() output for a registry containing an official
// account plus relay accounts named hybaliez and 1000x.
const MANAGED = new Set(["openai", "hybaliez", "1000x"]);

function syncCodexSessionProviders(
  target: string,
  managed: Set<string>,
  sharedCreators: CodexSessionCreator[] = [],
) {
  return syncCodexSessions({ provider: { target, managed }, sharedCreators });
}

function sessionMetaLine(provider: string | null, id = "thread-1"): string {
  const payload: Record<string, unknown> = {
    id,
    timestamp: "2026-07-01T00:00:00.000Z",
    cwd: "/tmp/project",
    originator: "codex_exec",
    cli_version: "0.137.0",
  };
  if (provider !== null) {
    payload.model_provider = provider;
  }
  return JSON.stringify({
    timestamp: "2026-07-01T00:00:00.000Z",
    type: "session_meta",
    payload,
  });
}

async function writeSession(
  relativePath: string,
  firstLine: string,
  rest = `{"type":"event_msg","payload":{"type":"user_message"}}\n`,
): Promise<string> {
  const fullPath = join(CODEX_DIR, relativePath);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, `${firstLine}\n${rest}`);
  return fullPath;
}

function createStateDb(rows: Array<[string, string]>): void {
  const db = new Database(join(CODEX_DIR, "state_5.sqlite"));
  db.exec(
    "CREATE TABLE threads (id TEXT PRIMARY KEY, rollout_path TEXT, model_provider TEXT NOT NULL)",
  );
  const insert = db.prepare(
    "INSERT INTO threads (id, rollout_path, model_provider) VALUES (?, '', ?)",
  );
  for (const [id, provider] of rows) {
    insert.run(id, provider);
  }
  db.close();
}

function readProviders(): Array<{ id: string; model_provider: string }> {
  const db = new Database(join(CODEX_DIR, "state_5.sqlite"), {
    readonly: true,
  });
  const rows = db
    .prepare("SELECT id, model_provider FROM threads ORDER BY id")
    .all() as Array<{ id: string; model_provider: string }>;
  db.close();
  return rows;
}

describe("syncCodexSessions providers", () => {
  beforeEach(async () => {
    await resetTestHome();
  });

  test("rewrites rollout first lines to the target provider", async () => {
    const relay = await writeSession(
      "sessions/2026/07/01/rollout-1.jsonl",
      sessionMetaLine("hybaliez", "t-relay"),
    );
    const official = await writeSession(
      "sessions/2026/07/02/rollout-2.jsonl",
      sessionMetaLine("openai", "t-official"),
    );
    const archived = await writeSession(
      "archived_sessions/rollout-3.jsonl",
      sessionMetaLine("hybaliez", "t-archived"),
    );

    const result = await syncCodexSessionProviders("openai", MANAGED);

    expect(result.rolloutFilesUpdated).toBe(2);
    const relayLines = (await readFile(relay, "utf-8")).split("\n");
    expect(JSON.parse(relayLines[0]).payload.model_provider).toBe("openai");
    expect(relayLines[1]).toBe(
      `{"type":"event_msg","payload":{"type":"user_message"}}`,
    );
    const archivedFirst = (await readFile(archived, "utf-8")).split("\n")[0];
    expect(JSON.parse(archivedFirst).payload.model_provider).toBe("openai");
    expect((await readFile(official, "utf-8")).split("\n")[0]).toBe(
      sessionMetaLine("openai", "t-official"),
    );
  });

  test("stamps a missing provider only into reclaimed padding", async () => {
    // No room: Codex already falls back to the configured provider.
    const tight = await writeSession(
      "sessions/tight.jsonl",
      sessionMetaLine(null, "t-tight"),
    );
    // Padding left by an earlier sync can hold the new field.
    const padded = sessionMetaLine(null, "t-padded").replace(/\}$/, `${" ".repeat(40)}}`);
    const roomy = await writeSession("sessions/roomy.jsonl", padded);

    const result = await syncCodexSessionProviders("hybaliez", MANAGED);

    expect(result.rolloutFilesUpdated).toBe(1);
    expect(result.providerSkipped).toBe(0);
    expect((await readFile(tight, "utf-8")).split("\n")[0]).toBe(
      sessionMetaLine(null, "t-tight"),
    );
    const firstLine = (await readFile(roomy, "utf-8")).split("\n")[0];
    expect(Buffer.byteLength(firstLine)).toBe(Buffer.byteLength(padded));
    expect(JSON.parse(firstLine).payload.model_provider).toBe("hybaliez");
  });

  test("leaves malformed and non-session files alone", async () => {
    const malformed = await writeSession(
      "sessions/broken.jsonl",
      "not json at all",
    );
    const otherType = await writeSession(
      "sessions/other.jsonl",
      `{"type":"event_msg","payload":{"model_provider":"hybaliez"}}`,
    );

    const result = await syncCodexSessionProviders("openai", MANAGED);

    expect(result.rolloutFilesUpdated).toBe(0);
    expect(await readFile(malformed, "utf-8")).toContain("not json at all");
    expect(await readFile(otherType, "utf-8")).toContain(
      `"model_provider":"hybaliez"`,
    );
  });

  test("updates thread rows in state_5.sqlite", async () => {
    await mkdir(CODEX_DIR, { recursive: true });
    createStateDb([
      ["t-1", "hybaliez"],
      ["t-2", "openai"],
      ["t-3", "1000x"],
    ]);

    const result = await syncCodexSessionProviders("openai", MANAGED);

    expect(result.sqliteRowsUpdated).toBe(2);
    expect(readProviders()).toEqual([
      { id: "t-1", model_provider: "openai" },
      { id: "t-2", model_provider: "openai" },
      { id: "t-3", model_provider: "openai" },
    ]);
  });

  test("syncs rollouts even when no state DB exists", async () => {
    await writeSession(
      "sessions/rollout.jsonl",
      sessionMetaLine("hybaliez", "t-1"),
    );

    const result = await syncCodexSessionProviders("openai", MANAGED);

    expect(result.rolloutFilesUpdated).toBe(1);
    expect(result.sqliteRowsUpdated).toBe(0);
  });

  test("is a no-op when everything already matches", async () => {
    await writeSession(
      "sessions/rollout.jsonl",
      sessionMetaLine("openai", "t-1"),
    );
    createStateDb([["t-1", "openai"]]);

    const result = await syncCodexSessionProviders("openai", MANAGED);

    expect(result.rolloutFilesUpdated).toBe(0);
    expect(result.sqliteRowsUpdated).toBe(0);
  });

  test("normalizes casing variants of managed providers", async () => {
    const cased = await writeSession(
      "sessions/cased.jsonl",
      sessionMetaLine("OpenAI", "t-cased"),
    );
    createStateDb([["t-cased", "OpenAI"]]);

    const result = await syncCodexSessionProviders("openai", MANAGED);

    expect(result.rolloutFilesUpdated).toBe(1);
    expect(result.sqliteRowsUpdated).toBe(1);
    const firstLine = (await readFile(cased, "utf-8")).split("\n")[0];
    expect(JSON.parse(firstLine).payload.model_provider).toBe("openai");
    expect(readProviders()).toEqual([
      { id: "t-cased", model_provider: "openai" },
    ]);
  });

  test("repairs empty provider metadata in the DB without growing rollouts", async () => {
    const empty = await writeSession(
      "sessions/empty.jsonl",
      sessionMetaLine("", "t-empty"),
    );
    createStateDb([
      ["t-empty", ""],
      ["t-ok", "openai"],
    ]);

    const result = await syncCodexSessionProviders("openai", MANAGED);

    expect(result.rolloutFilesUpdated).toBe(0);
    expect(result.sqliteRowsUpdated).toBe(1);
    const firstLine = (await readFile(empty, "utf-8")).split("\n")[0];
    expect(firstLine).toBe(sessionMetaLine("", "t-empty"));
    expect(readProviders()).toEqual([
      { id: "t-empty", model_provider: "openai" },
      { id: "t-ok", model_provider: "openai" },
    ]);
  });

  test("leaves sessions of unmanaged providers untouched", async () => {
    const unmanaged = await writeSession(
      "sessions/ollama.jsonl",
      sessionMetaLine("ollama", "t-ollama"),
    );
    const managed = await writeSession(
      "sessions/relay.jsonl",
      sessionMetaLine("hybaliez", "t-relay"),
    );
    createStateDb([
      ["t-ollama", "ollama"],
      ["t-relay", "hybaliez"],
    ]);

    const result = await syncCodexSessionProviders("openai", MANAGED);

    expect(result.rolloutFilesUpdated).toBe(1);
    expect(result.sqliteRowsUpdated).toBe(1);
    const unmanagedFirst = (await readFile(unmanaged, "utf-8")).split("\n")[0];
    expect(JSON.parse(unmanagedFirst).payload.model_provider).toBe("ollama");
    const managedFirst = (await readFile(managed, "utf-8")).split("\n")[0];
    expect(JSON.parse(managedFirst).payload.model_provider).toBe("openai");
    expect(readProviders()).toEqual([
      { id: "t-ollama", model_provider: "ollama" },
      { id: "t-relay", model_provider: "openai" },
    ]);
  });

  test("skips a rollout another process holds open", async () => {
    const live = await writeSession(
      "sessions/live.jsonl",
      sessionMetaLine("hybaliez", "t-live"),
    );
    const idle = await writeSession(
      "sessions/idle.jsonl",
      sessionMetaLine("hybaliez", "t-idle"),
    );
    // The test process itself keeps the file open; the path-based lsof scan
    // must flag it regardless of the holder's process name.
    const handle = await open(live, "r");
    try {
      const result = await syncCodexSessionProviders("openai", MANAGED);

      expect(result.rolloutFilesUpdated).toBe(1);
      const liveFirst = (await readFile(live, "utf-8")).split("\n")[0];
      expect(JSON.parse(liveFirst).payload.model_provider).toBe("hybaliez");
      const idleFirst = (await readFile(idle, "utf-8")).split("\n")[0];
      expect(JSON.parse(idleFirst).payload.model_provider).toBe("openai");
    } finally {
      await handle.close();
    }
  });

  test("preserves rollout timestamps across a rewrite", async () => {
    const rollout = await writeSession(
      "sessions/rollout.jsonl",
      sessionMetaLine("hybaliez", "t-1"),
    );
    const past = new Date("2026-06-01T00:00:00Z");
    await utimes(rollout, past, past);

    const result = await syncCodexSessionProviders("openai", MANAGED);

    expect(result.rolloutFilesUpdated).toBe(1);
    const after = await stat(rollout);
    expect(after.mtime.toISOString()).toBe(past.toISOString());
  });
});

const HOLDEN = { userId: "user-holden", accountId: "acct-holden" };
const SATOSHI = { userId: "user-satoshi", accountId: "acct-satoshi" };
const BODY = `{"timestamp":"2026-11-15T07:22:14.000Z","ordinal":1,"type":"event_msg","payload":{"type":"user_message","message":"keep me"}}\n`;

// Mirrors a Codex 0.169 rollout header: scoped marker and creator ids first,
// provider in the middle, large base_instructions after it.
function codexMetaLine(options: {
  id: string;
  provider?: string;
  scoped?: boolean;
  creator?: { userId: string; accountId: string } | null;
}): string {
  const payload: Record<string, unknown> = {};
  if (options.scoped ?? true) payload.account_scoped = true;
  if (options.creator !== null) {
    const creator = options.creator ?? HOLDEN;
    payload.creator_user_id = creator.userId;
    payload.creator_account_id = creator.accountId;
  }
  Object.assign(payload, {
    session_id: options.id,
    id: options.id,
    timestamp: "2026-11-15T07:21:45.613Z",
    cwd: "/tmp/项目",
    originator: "codex-tui",
    cli_version: "0.169.0",
    source: "cli",
    model_provider: options.provider ?? "openai",
    base_instructions: { text: "You are Codex. \"quoted\" \u2028 text" },
    history_mode: "paginated",
  });
  return JSON.stringify({
    timestamp: "2026-11-15T07:22:13.084Z",
    ordinal: 0,
    type: "session_meta",
    payload,
  });
}

function rolloutName(id: string, dir = "sessions/2026/11/15"): string {
  return `${dir}/rollout-2026-11-15T16-21-45-${id}.jsonl`;
}

function createHistoryDb(rows: Array<[string, number]>): void {
  const db = new Database(join(CODEX_DIR, "thread_history_1.sqlite"));
  db.exec(
    "CREATE TABLE thread_history_projection_state (thread_id TEXT PRIMARY KEY, next_rollout_byte_offset INTEGER NOT NULL, next_rollout_ordinal INTEGER NOT NULL)",
  );
  const insert = db.prepare(
    "INSERT INTO thread_history_projection_state VALUES (?, ?, 1)",
  );
  for (const [id, offset] of rows) insert.run(id, offset);
  db.close();
}

async function firstLineOf(path: string): Promise<string> {
  return (await readFile(path, "utf-8")).split("\n")[0]!;
}

describe("syncCodexSessions sharing and byte offsets", () => {
  beforeEach(async () => {
    await resetTestHome();
  });

  test("shares sessions another managed ChatGPT account created", async () => {
    const line = codexMetaLine({ id: "01a1de15-6114-7540-9e96-8b4ddbf1b133" });
    const path = await writeSession(rolloutName("01a1de15-6114-7540-9e96-8b4ddbf1b133"), line, BODY);

    const result = await syncCodexSessions({
      provider: null,
      sharedCreators: [SATOSHI, HOLDEN],
    });

    expect(result).toMatchObject({ rolloutFilesUpdated: 1, sessionsShared: 1 });
    const after = await firstLineOf(path);
    expect(Buffer.byteLength(after)).toBe(Buffer.byteLength(line));
    const expected = JSON.parse(line);
    delete expected.payload.account_scoped;
    expect(JSON.parse(after)).toEqual(expected);
    expect((await readFile(path, "utf-8")).slice(after.length + 1)).toBe(BODY);
  });

  test("keeps the scope of unmanaged, creator-less and reverted sessions", async () => {
    const stranger = codexMetaLine({
      id: "t-stranger",
      creator: { userId: "user-x", accountId: "acct-x" },
    });
    const anonymous = codexMetaLine({ id: "t-anon", creator: null });
    // A reverted thread's filename carries a different rollout id.
    const reverted = codexMetaLine({ id: "t-reverted" });
    const paths = [
      await writeSession(rolloutName("t-stranger"), stranger, BODY),
      await writeSession(rolloutName("t-anon"), anonymous, BODY),
      await writeSession(
        "sessions/2026/11/15/rollout-2026-11-15T16-21-45-t-reverted_t-rollout2.jsonl",
        reverted,
        BODY,
      ),
    ];

    const result = await syncCodexSessions({
      provider: null,
      sharedCreators: [HOLDEN, SATOSHI],
    });

    expect(result.rolloutFilesUpdated).toBe(0);
    expect(await firstLineOf(paths[0]!)).toBe(stranger);
    expect(await firstLineOf(paths[1]!)).toBe(anonymous);
    expect(await firstLineOf(paths[2]!)).toBe(reverted);
  });

  test("pads a shorter provider so every later byte keeps its offset", async () => {
    const line = codexMetaLine({ id: "t-relay", provider: "hybaliez", scoped: false, creator: null });
    const path = await writeSession(rolloutName("t-relay"), line, BODY);
    const before = await stat(path);

    const result = await syncCodexSessionProviders("openai", MANAGED);

    expect(result).toMatchObject({ rolloutFilesUpdated: 1, providerStamped: 1 });
    const after = await firstLineOf(path);
    expect(after.endsWith("  }")).toBe(true);
    expect(JSON.parse(after).payload.model_provider).toBe("openai");
    expect((await stat(path)).size).toBe(before.size);
    expect((await readFile(path, "utf-8")).slice(after.length + 1)).toBe(BODY);
  });

  test("never grows a first line: a longer provider is skipped with its thread row", async () => {
    const line = codexMetaLine({ id: "t-old", provider: "openai", scoped: false, creator: null });
    const path = await writeSession(rolloutName("t-old"), line, BODY);
    createStateDb([
      ["t-old", "openai"],
      ["t-elsewhere", "openai"],
    ]);

    const result = await syncCodexSessionProviders("hybaliez", MANAGED);

    expect(result).toMatchObject({ rolloutFilesUpdated: 0, providerSkipped: 1, sqliteRowsUpdated: 1 });
    expect(await firstLineOf(path)).toBe(line);
    expect(readProviders()).toEqual([
      { id: "t-elsewhere", model_provider: "hybaliez" },
      { id: "t-old", model_provider: "openai" },
    ]);
  });

  test("reuses earlier padding, so a provider round trip restores the original bytes", async () => {
    const line = codexMetaLine({ id: "t-trip", provider: "hybaliez", scoped: false, creator: null });
    const path = await writeSession(rolloutName("t-trip"), line, BODY);

    await syncCodexSessionProviders("openai", MANAGED);
    const result = await syncCodexSessionProviders("hybaliez", MANAGED);

    expect(result.providerStamped).toBe(1);
    expect(await firstLineOf(path)).toBe(line);
  });

  test("dropping the scope marker makes room for a longer provider", async () => {
    const managed = codexMetaLine({ id: "t-managed", provider: "openai" });
    const anonymous = codexMetaLine({ id: "t-anon", provider: "openai", creator: null });
    const managedPath = await writeSession(rolloutName("t-managed"), managed, BODY);
    const anonPath = await writeSession(rolloutName("t-anon"), anonymous, BODY);

    const result = await syncCodexSessionProviders("hybaliez", MANAGED, [HOLDEN]);

    expect(result).toMatchObject({ providerStamped: 2, sessionsShared: 1, providerSkipped: 0 });
    for (const [path, original] of [[managedPath, managed], [anonPath, anonymous]] as const) {
      const after = JSON.parse(await firstLineOf(path));
      expect(Buffer.byteLength(await firstLineOf(path))).toBe(Buffer.byteLength(original));
      expect(after.payload.model_provider).toBe("hybaliez");
      expect(after.payload.account_scoped).toBeUndefined();
      expect(after.payload.creator_user_id).toBe(JSON.parse(original).payload.creator_user_id);
    }
  });

  test("rewrites compressed rollouts in place and keeps their decoded size", async () => {
    const id = "t-zst";
    const line = codexMetaLine({ id, provider: "hybaliez" });
    const plain = Buffer.from(`${line}\n${BODY}`);
    const path = join(CODEX_DIR, `${rolloutName(id)}.zst`);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, zstdCompressSync(plain));
    const past = new Date("2026-06-01T00:00:00Z");
    await utimes(path, past, past);

    const result = await syncCodexSessionProviders("openai", MANAGED, [HOLDEN]);

    expect(result).toMatchObject({ rolloutFilesUpdated: 1, providerStamped: 1, sessionsShared: 1 });
    const compressed = await readFile(path);
    expect(zstdFrameContentSize(compressed.subarray(0, 18))).toBe(plain.length);
    const decoded = zstdDecompressSync(compressed).toString("utf-8");
    const [first, ...rest] = decoded.split("\n");
    expect(JSON.parse(first!).payload).toMatchObject({ model_provider: "openai", id });
    expect(JSON.parse(first!).payload.account_scoped).toBeUndefined();
    expect(rest.join("\n")).toBe(BODY);
    expect((await stat(path)).mtime.toISOString()).toBe(past.toISOString());
  });

  test("restores rollouts an earlier sync shortened to Codex's history offset", async () => {
    const shortened = codexMetaLine({ id: "t-short", scoped: false, creator: null });
    const shortPath = await writeSession(rolloutName("t-short"), shortened, BODY);
    const intact = codexMetaLine({ id: "t-intact", scoped: false, creator: null });
    const intactPath = await writeSession(rolloutName("t-intact"), intact, BODY);
    const foreign = codexMetaLine({ id: "t-foreign", scoped: false, creator: null });
    const foreignPath = await writeSession(rolloutName("t-foreign"), foreign, BODY);
    const size = (await stat(shortPath)).size;
    createHistoryDb([
      ["t-short", size + 2],
      // Fully projected and still in sync.
      ["t-intact", (await stat(intactPath)).size],
      // Far beyond what a metadata edit could explain.
      ["t-foreign", (await stat(foreignPath)).size + 4096],
    ]);

    const result = await syncCodexSessions({ provider: null, sharedCreators: [] });

    expect(result).toMatchObject({ rolloutFilesUpdated: 1, rolloutsRepaired: 1 });
    expect((await stat(shortPath)).size).toBe(size + 2);
    const repaired = await firstLineOf(shortPath);
    expect(JSON.parse(repaired)).toEqual(JSON.parse(shortened));
    expect((await readFile(shortPath, "utf-8")).slice(repaired.length + 1)).toBe(BODY);
    expect(await firstLineOf(intactPath)).toBe(intact);
    expect(await firstLineOf(foreignPath)).toBe(foreign);
  });

  test("a share-only pass leaves providers and thread rows alone", async () => {
    const line = codexMetaLine({ id: "t-share", provider: "hybaliez" });
    const path = await writeSession(rolloutName("t-share"), line, BODY);
    createStateDb([["t-share", "hybaliez"]]);

    const result = await syncCodexSessions({ provider: null, sharedCreators: [HOLDEN] });

    expect(result).toMatchObject({ sessionsShared: 1, providerStamped: 0, sqliteRowsUpdated: 0 });
    expect(JSON.parse(await firstLineOf(path)).payload.model_provider).toBe("hybaliez");
    expect(readProviders()).toEqual([{ id: "t-share", model_provider: "hybaliez" }]);
  });
});

describe("session visibility sync on switch", () => {
  beforeEach(async () => {
    await resetTestHome();
  });

  test("switching to a ChatGPT account re-stamps sessions to openai", async () => {
    const accountKey = "user-1::acct-1";
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "cx",
          target: { provider: "codex", accountKey },
          createdAt: 1,
        },
      ],
    });
    const registry: CodexRegistry = {
      schema_version: 3,
      active_account_key: null,
      active_account_activated_at_ms: null,
      auto_switch: {
        enabled: false,
        threshold_5h_percent: 10,
        threshold_weekly_percent: 5,
      },
      api: { usage: true, account: true },
      accounts: [
        {
          account_key: accountKey,
          chatgpt_account_id: "acct-1",
          chatgpt_user_id: "user-1",
          email: "codex@example.com",
          alias: "cx",
          account_name: null,
          plan: "plus",
          auth_mode: "chatgpt",
          created_at: 1,
          last_used_at: null,
          last_usage: null,
          last_usage_at: null,
          last_local_rollout: null,
        },
        {
          account_key: "apikey::relay",
          chatgpt_account_id: "",
          chatgpt_user_id: "",
          email: "",
          alias: "relay",
          account_name: null,
          plan: null,
          auth_mode: "apikey",
          api_provider: {
            type: "custom",
            name: "hybaliez",
            base_url: "https://relay.example.com/v1",
            model: "gpt-5.4",
            env_key: "OPENAI_API_KEY",
          },
          created_at: 1,
          last_used_at: null,
          last_usage: null,
          last_usage_at: null,
          last_local_rollout: null,
        },
      ],
    };
    await saveRegistry(registry);
    await saveAccountAuth(accountKey, {
      auth_mode: "chatgpt",
      OPENAI_API_KEY: null,
      tokens: {
        id_token: makeJwt({ sub: "user-1" }),
        access_token: makeJwt({ sub: "user-1" }),
        refresh_token: "refresh-token",
        account_id: "acct-1",
      },
      last_refresh: "2026-04-28T00:00:00.000Z",
    });
    const rollout = await writeSession(
      "sessions/rollout.jsonl",
      sessionMetaLine("hybaliez", "t-1"),
    );
    createStateDb([["t-1", "hybaliez"]]);

    await use("cx");

    const firstLine = (await readFile(rollout, "utf-8")).split("\n")[0];
    expect(JSON.parse(firstLine).payload.model_provider).toBe("openai");
    expect(readProviders()).toEqual([{ id: "t-1", model_provider: "openai" }]);
  });
});
