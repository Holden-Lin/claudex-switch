// The 11-26 incident shape: import the stores first, point HOME at a temp
// home second, then save. Run with `bun <this> <home>`; the parent test starts
// this process with HOME at a separate sandbox standing in for the real home.
import { saveAliases } from "../../src/alias/store";
import { saveAccountAuth } from "../../src/providers/codex/auth";
import { saveRegistry } from "../../src/providers/codex/registry";

const home = process.argv[2]!;
process.env.HOME = home;
process.env.USERPROFILE = home;
process.env.CLAUDEX_TEST_HOME = home;

const accountKey = "user-1::acct-1";
await saveAliases({
  version: 1,
  aliases: [{ alias: "probe", target: { provider: "codex", accountKey }, createdAt: 1 }],
});
await saveRegistry({
  schema_version: 3,
  active_account_key: null,
  active_account_activated_at_ms: null,
  auto_switch: { enabled: false, threshold_5h_percent: 10, threshold_weekly_percent: 5 },
  api: { usage: true, account: true },
  accounts: [],
});
await saveAccountAuth(accountKey, {
  auth_mode: "apikey",
  OPENAI_API_KEY: "fixture-key",
});
