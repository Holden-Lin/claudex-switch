import {
  afterEach,
  beforeEach,
  describe,
  expect,
  setSystemTime,
  spyOn,
  test,
} from "bun:test";
import { saveAliases } from "../src/alias/store";
import { list } from "../src/commands/list";
import { saveAccountAuth } from "../src/providers/codex/auth";
import { loadRegistry, saveRegistry } from "../src/providers/codex/registry";
import { makeJwt, resetTestHome } from "./helpers";
import type {
  AliasRegistry,
  CodexAuthFile,
  CodexRegistry,
} from "../src/types";

const originalFetch = globalThis.fetch;

function createRegistry(): CodexRegistry {
  return {
    schema_version: 3,
    active_account_key: "user-1::acct-1",
    active_account_activated_at_ms: null,
    auto_switch: {
      enabled: false,
      threshold_5h_percent: 10,
      threshold_weekly_percent: 5,
    },
    api: { usage: true, account: true },
    accounts: [
      {
        account_key: "user-1::acct-1",
        chatgpt_account_id: "acct-1",
        chatgpt_user_id: "user-1",
        email: "one@example.com",
        alias: "one",
        account_name: null,
        plan: null,
        auth_mode: "chatgpt",
        created_at: 1,
        last_used_at: null,
        last_usage: null,
        last_usage_at: null,
        last_local_rollout: null,
      },
      {
        account_key: "user-2::acct-2",
        chatgpt_account_id: "acct-2",
        chatgpt_user_id: "user-2",
        email: "two@example.com",
        alias: "two",
        account_name: null,
        plan: null,
        auth_mode: "chatgpt",
        created_at: 1,
        last_used_at: null,
        last_usage: null,
        last_usage_at: null,
        last_local_rollout: null,
      },
      {
        account_key: "api-key-account",
        chatgpt_account_id: "",
        chatgpt_user_id: "",
        email: "api@example.com",
        alias: "api",
        account_name: null,
        plan: null,
        auth_mode: "apikey",
        created_at: 1,
        last_used_at: null,
        last_usage: null,
        last_usage_at: null,
        last_local_rollout: null,
      },
    ],
  };
}

function createAuth(accountId: string, userId: string): CodexAuthFile {
  return {
    auth_mode: "chatgpt",
    OPENAI_API_KEY: null,
    tokens: {
      id_token: makeJwt({ sub: userId }),
      access_token: makeJwt({ sub: userId }),
      refresh_token: "refresh-token",
      account_id: accountId,
    },
    last_refresh: "2026-04-28T00:00:00.000Z",
  };
}

describe("list", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    console.log.mockRestore?.();
    setSystemTime();
  });

  beforeEach(async () => {
    await resetTestHome();
    setSystemTime(new Date("2026-04-28T00:00:00.000Z"));
    spyOn(console, "log").mockImplementation(() => {});
  });

  test("refreshes Codex ChatGPT usage before displaying accounts", async () => {
    const aliases: AliasRegistry = {
      version: 1,
      aliases: [
        {
          alias: "one",
          target: { provider: "codex", accountKey: "user-1::acct-1" },
          createdAt: 1,
        },
        {
          alias: "two",
          target: { provider: "codex", accountKey: "user-2::acct-2" },
          createdAt: 1,
        },
        {
          alias: "api",
          target: { provider: "codex", accountKey: "api-key-account" },
          createdAt: 1,
        },
      ],
    };
    await saveAliases(aliases);
    await saveRegistry(createRegistry());
    await saveAccountAuth("user-1::acct-1", createAuth("acct-1", "user-1"));
    await saveAccountAuth("user-2::acct-2", createAuth("acct-2", "user-2"));

    const fetchedAccountIds: string[] = [];
    globalThis.fetch = async (_input, init) => {
      const headers = init?.headers as Record<string, string>;
      const accountId = headers["chatgpt-account-id"];
      fetchedAccountIds.push(accountId);

      const usedPercent = accountId === "acct-1" ? 15 : 60;
      return new Response(
        JSON.stringify({
          rate_limits: {
            plan_type: accountId === "acct-1" ? "plus" : "pro",
            primary: {
              used_percent: usedPercent,
              window_minutes: 300,
              resets_at: null,
            },
            secondary: {
              used_percent: usedPercent + 10,
              window_minutes: 10080,
              resets_at: null,
            },
          },
        }),
        { status: 200 },
      );
    };

    await list();

    expect(fetchedAccountIds).toEqual(["acct-1", "acct-2"]);

    const registry = await loadRegistry();
    expect(registry.accounts[0]?.plan).toBe("plus");
    expect(registry.accounts[0]?.last_usage?.primary?.used_percent).toBe(15);
    expect(registry.accounts[0]?.last_usage_at).toBe(1777334400);
    expect(registry.accounts[1]?.plan).toBe("pro");
    expect(registry.accounts[1]?.last_usage?.secondary?.used_percent).toBe(70);
    expect(registry.accounts[2]?.last_usage).toBeNull();

    const output = console.log.mock.calls.flat().join("\n");
    expect(output).toContain("5hrem: 85%");
    expect(output).toContain("wkrem: 30%");
  });
});
