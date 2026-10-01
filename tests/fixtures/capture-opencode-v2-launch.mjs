#!/usr/bin/env node

// Test-only stand-in for OpenCode's final interactive TUI command. The caller
// delegates --version and `serve` to the pinned real binary before reaching
// this wrapper. Record only routing metadata; never serialize arbitrary env or
// the full config, and fail if credential-bearing env variables survive.

import { writeFile } from "node:fs/promises";

const MANAGED_PROVIDER_ID = "claudex-switch-opencode-go";
const args = process.argv.slice(2);
const fail = (message) => {
  process.stderr.write(`${message}\n`);
  process.exit(1);
};

if (args[0] !== "--standalone" || !args.includes("--auto")) {
  fail("Unexpected final OpenCode launch arguments in the adapter fixture.");
}

if (
  args.some((arg) => /fake-only-opencode-v2|fake-only-global/.test(arg)) ||
  ["OPENCODE_API_KEY", "OPENCODE_AUTH_CONTENT", "OPENCODE_PASSWORD"].some(
    (name) => Boolean(process.env[name]),
  )
) {
  fail("A credential-bearing value reached the final OpenCode launch environment.");
}

const captureFile = process.env.CLAUDEX_TEST_CAPTURE_FILE;
if (!captureFile) fail("Missing launch-contract capture path.");

let config;
try {
  config = JSON.parse(process.env.OPENCODE_CONFIG_CONTENT || "{}");
} catch {
  fail("The final OpenCode config content was invalid.");
}

const provider = config.providers?.[MANAGED_PROVIDER_ID];
const modelIds =
  provider?.models && typeof provider.models === "object" && !Array.isArray(provider.models)
    ? Object.keys(provider.models).sort()
    : [];
const database = process.env.OPENCODE_DB;
if (
  typeof database !== "string" ||
  !database.includes("/.claudex-switch/opencode/profiles/") ||
  !database.endsWith("/v2-runtime/data/opencode/opencode.db")
) {
  fail("The final OpenCode process did not receive the alias-private database path.");
}

const capture = {
  args,
  database,
  dataHome: process.env.XDG_DATA_HOME,
  stateHome: process.env.XDG_STATE_HOME,
  cacheHome: process.env.XDG_CACHE_HOME,
  model: config.model,
  providerIds: Object.keys(config.providers || {}).sort(),
  modelIds,
};

await writeFile(captureFile, JSON.stringify(capture, null, 2), {
  mode: 0o600,
  flag: "wx",
});
