import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { saveAliases } from "../src/alias/store";
import { list } from "../src/commands/list";
import { loadRegistry, saveRegistry } from "../src/providers/codex/registry";
import { resetTestHome } from "./helpers";
import type { AliasRegistry, CodexRegistry } from "../src/types";

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

describe("list", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    console.log.mockRestore?.();
  });

  beforeEach(async () => {
    await resetTestHome();
    spyOn(console, "log").mockImplementation(() => {});
  });

  test("lists Codex accounts without refreshing usage", async () => {
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
    const initialRegistry = createRegistry();
    initialRegistry.accounts[0]!.plan = "plus";
    initialRegistry.accounts[0]!.last_usage = {
      primary: {
        used_percent: 15,
        window_minutes: 300,
        resets_at: null,
      },
      secondary: {
        used_percent: 25,
        window_minutes: 10080,
        resets_at: null,
      },
      credits: null,
      plan_type: "plus",
    };
    await saveRegistry(initialRegistry);

    const fetchCalls: string[] = [];
    globalThis.fetch = async (input) => {
      fetchCalls.push(String(input));
      return new Response("{}", { status: 200 });
    };

    await list();

    expect(fetchCalls).toEqual([]);

    const registry = await loadRegistry();
    expect(registry.accounts[0]?.plan).toBe("plus");
    expect(registry.accounts[0]?.last_usage?.primary?.used_percent).toBe(15);
    expect(registry.accounts[0]?.last_usage_at).toBeNull();
    expect(registry.accounts[1]?.plan).toBeNull();
    expect(registry.accounts[1]?.last_usage).toBeNull();
    expect(registry.accounts[2]?.last_usage).toBeNull();

    const output = console.log.mock.calls.flat().join("\n");
    expect(output).toContain("one");
    expect(output).toContain("Plus");
    expect(output).not.toContain("5h");
    expect(output).not.toContain("wk");
  });
});
