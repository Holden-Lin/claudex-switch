import { beforeEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { CODEX_DIR } from "../src/lib/paths";
import { syncCodexSessionProviders } from "../src/providers/codex/sessions";
import { saveAliases } from "../src/alias/store";
import { saveAccountAuth } from "../src/providers/codex/auth";
import { saveRegistry } from "../src/providers/codex/registry";
import { use } from "../src/commands/use";
import { makeJwt, resetTestHome } from "./helpers";
import type { CodexRegistry } from "../src/types";

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

describe("syncCodexSessionProviders", () => {
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
      sessionMetaLine("1000x", "t-archived"),
    );

    const result = await syncCodexSessionProviders("openai");

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

  test("stamps a provider onto session_meta lines missing one", async () => {
    const missing = await writeSession(
      "sessions/rollout.jsonl",
      sessionMetaLine(null, "t-missing"),
    );

    const result = await syncCodexSessionProviders("hybaliez");

    expect(result.rolloutFilesUpdated).toBe(1);
    const firstLine = (await readFile(missing, "utf-8")).split("\n")[0];
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

    const result = await syncCodexSessionProviders("openai");

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

    const result = await syncCodexSessionProviders("openai");

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

    const result = await syncCodexSessionProviders("openai");

    expect(result.rolloutFilesUpdated).toBe(1);
    expect(result.sqliteRowsUpdated).toBe(0);
  });

  test("is a no-op when everything already matches", async () => {
    await writeSession(
      "sessions/rollout.jsonl",
      sessionMetaLine("openai", "t-1"),
    );
    createStateDb([["t-1", "openai"]]);

    const result = await syncCodexSessionProviders("openai");

    expect(result.rolloutFilesUpdated).toBe(0);
    expect(result.sqliteRowsUpdated).toBe(0);
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
