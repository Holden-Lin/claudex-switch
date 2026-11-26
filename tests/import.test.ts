import {
  beforeEach,
  describe,
  expect,
  spyOn,
  test,
} from "bun:test";
import { mkdir } from "fs/promises";
import { join } from "path";
import { loadAliases, saveAliases } from "../src/alias/store";
import { importAccounts } from "../src/commands/import";
import { CLAUDE_PROFILES_DIR } from "../src/lib/paths";
import {
  loadRegistry,
  saveRegistry,
} from "../src/providers/codex/registry";
import type { AliasRegistry, CodexRegistry } from "../src/types";
import { resetTestHome } from "./helpers";

function createRegistry(): CodexRegistry {
  return {
    schema_version: 3,
    active_account_key: null,
    active_account_activated_at_ms: null,
    auto_switch: {
      enabled: false,
      threshold_5h_percent: 10,
      threshold_weekly_percent: 5,
    },
    api: { usage: true, account: true },
    accounts: [],
  };
}

describe("importAccounts", () => {
  beforeEach(async () => {
    await resetTestHome();
  });

  test("imports new accounts and reports skipped duplicates and invalid aliases", async () => {
    const aliasRegistry: AliasRegistry = {
      version: 1,
      aliases: [
        {
          alias: "taken",
          target: { provider: "claude", profileName: "other-profile" },
          createdAt: 1,
        },
        {
          alias: "already-claude",
          target: { provider: "claude", profileName: "alreadyImported" },
          createdAt: 2,
        },
        {
          alias: "already-codex",
          target: { provider: "codex", accountKey: "account-2" },
          createdAt: 3,
        },
      ],
    };
    await saveAliases(aliasRegistry);

    for (const profile of [
      "validclaude",
      "import",
      "taken",
      "alreadyImported",
    ]) {
      await mkdir(join(CLAUDE_PROFILES_DIR(), profile), { recursive: true });
    }

    const registry = createRegistry();
    registry.accounts.push(
      {
        account_key: "account-1",
        chatgpt_account_id: "acct-1",
        chatgpt_user_id: "user-1",
        email: "valid@example.com",
        alias: "valid-codex",
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
        account_key: "account-2",
        chatgpt_account_id: "acct-2",
        chatgpt_user_id: "user-2",
        email: "existing@example.com",
        alias: "already-codex",
        account_name: null,
        plan: "team",
        auth_mode: "chatgpt",
        created_at: 1,
        last_used_at: null,
        last_usage: null,
        last_usage_at: null,
        last_local_rollout: null,
      },
      {
        account_key: "account-3",
        chatgpt_account_id: "acct-3",
        chatgpt_user_id: "user-3",
        email: "reserved@example.com",
        alias: "import",
        account_name: null,
        plan: "pro",
        auth_mode: "chatgpt",
        created_at: 1,
        last_used_at: null,
        last_usage: null,
        last_usage_at: null,
        last_local_rollout: null,
      },
    );
    await saveRegistry(registry);

    const logSpy = spyOn(console, "log").mockImplementation(() => {});

    await importAccounts();

    const output = logSpy.mock.calls
      .flat()
      .map((value) => String(value))
      .join("\n");

    expect(output).toContain("Imported 3 account(s)");
    expect(output).toContain("4 account(s) skipped");

    const aliases = await loadAliases();
    expect(aliases.aliases.map((entry) => entry.alias).sort()).toEqual([
      "already-claude",
      "already-codex",
      "import-1",
      "taken",
      "valid-codex",
      "validclaude",
    ]);

    const savedRegistry = await loadRegistry();
    expect(savedRegistry.accounts).toHaveLength(3);

    logSpy.mockRestore();
  });
});
