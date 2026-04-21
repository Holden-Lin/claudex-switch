import {
  afterEach,
  beforeEach,
  describe,
  expect,
  spyOn,
  test,
} from "bun:test";
import * as prompts from "@inquirer/prompts";
import { loadAliases, saveAliases } from "../src/alias/store";
import { codexAccountAuthFile } from "../src/lib/paths";
import { fileExists } from "../src/lib/fs";
import { saveAccountAuth } from "../src/providers/codex/auth";
import {
  loadRegistry,
  saveRegistry,
} from "../src/providers/codex/registry";
import type { AliasRegistry, CodexAuthFile, CodexRegistry } from "../src/types";
import { resetTestHome } from "./helpers";

let purge: typeof import("../src/commands/purge").purge;

function createRegistry(): CodexRegistry {
  return {
    schema_version: 3,
    active_account_key: "account-1",
    active_account_activated_at_ms: 123,
    auto_switch: {
      enabled: false,
      threshold_5h_percent: 10,
      threshold_weekly_percent: 5,
    },
    api: { usage: true, account: true },
    accounts: [
      {
        account_key: "account-1",
        chatgpt_account_id: "acct-1",
        chatgpt_user_id: "user-1",
        email: "dev@example.com",
        alias: "codex-main",
        account_name: null,
        plan: "plus",
        auth_mode: "chatgpt",
        created_at: 1,
        last_used_at: 1,
        last_usage: null,
        last_usage_at: null,
        last_local_rollout: null,
      },
    ],
  };
}

describe("purge", () => {
  afterEach(() => {
    prompts.confirm.mockRestore?.();
  });

  beforeEach(async () => {
    await resetTestHome();
    spyOn(prompts, "confirm").mockResolvedValue(true);
    ({ purge } = await import("../src/commands/purge"));
  });

  test("removes linked aliases, registry entry, and auth snapshot for codex accounts", async () => {
    const aliasRegistry: AliasRegistry = {
      version: 1,
      aliases: [
        {
          alias: "primary",
          target: { provider: "codex", accountKey: "account-1" },
          createdAt: 1,
        },
        {
          alias: "secondary",
          target: { provider: "codex", accountKey: "account-1" },
          createdAt: 2,
        },
      ],
    };
    await saveAliases(aliasRegistry);
    await saveRegistry(createRegistry());

    const authData: CodexAuthFile = {
      auth_mode: "chatgpt",
      OPENAI_API_KEY: null,
      tokens: {
        id_token: "header.payload.sig",
        access_token: "access-token",
        refresh_token: "refresh-token",
        account_id: "account-1",
      },
      last_refresh: "2026-04-06T00:00:00.000Z",
    };
    await saveAccountAuth("account-1", authData);

    const logSpy = spyOn(console, "log").mockImplementation(() => {});

    await purge("primary");

    const aliases = await loadAliases();
    expect(aliases.aliases).toHaveLength(0);

    const registry = await loadRegistry();
    expect(registry.accounts).toHaveLength(0);
    expect(registry.active_account_key).toBeNull();
    expect(registry.active_account_activated_at_ms).toBeNull();
    expect(await fileExists(codexAccountAuthFile("account-1"))).toBe(false);

    expect(logSpy.mock.calls.length).toBeGreaterThan(0);

    logSpy.mockRestore();
  });
});
