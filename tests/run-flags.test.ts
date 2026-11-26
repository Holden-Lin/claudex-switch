import { beforeEach, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { saveAliases } from "../src/alias/store";
import { saveAccountAuth } from "../src/providers/codex/auth";
import { saveRegistry } from "../src/providers/codex/registry";
import { makeJwt, resetTestHome, TEST_HOME } from "./helpers";

const bin = join(TEST_HOME, "bin");

beforeEach(resetTestHome);

function run(args: string[]) {
  return spawnSync(process.execPath, ["src/index.ts", ...args], {
    encoding: "utf8",
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, CLAUDEX_DISABLE_AUTO_UPDATE: "1" },
  });
}

test.each([
  ["cx", "-run"],
  ["use", "cx", "-run"],
  ["cx", "--run", "--model", "6.1", "-run"],
  ["agy", "-run", "--cliproxy", "claudecode"],
  ["cx", "cc", "-run"],
])("rejects removed single-dash run before launching: %j", (...args) => {
  const result = run(args);
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("-run is no longer supported. Use --run instead.");
});

test.each([
  ["cx", "--run", "--model", "6.1"],
  ["cx", "--run", "--model", "6.1", "--run"],
  ["use", "cx", "--run", "--run", "--model", "6.1", "--run"],
])("Codex CLI forwards canonical model without run flags: %j", async (...args) => {
  const accountKey = "user-1::acct-1";
  await saveAliases({ version: 1, aliases: [{ alias: "cx", target: { provider: "codex", accountKey }, createdAt: 1 }] });
  await saveRegistry({ schema_version: 3, active_account_key: null, active_account_activated_at_ms: null,
    auto_switch: { enabled: false, threshold_5h_percent: 10, threshold_weekly_percent: 5 },
    api: { usage: true, account: true }, accounts: [{ account_key: accountKey, chatgpt_account_id: "acct-1",
      chatgpt_user_id: "user-1", email: "codex@example.com", alias: "cx", account_name: null, plan: "plus",
      auth_mode: "chatgpt", created_at: 1, last_used_at: null, last_usage: null, last_usage_at: null, last_local_rollout: null }] });
  await saveAccountAuth(accountKey, { auth_mode: "chatgpt", OPENAI_API_KEY: null,
    tokens: { id_token: makeJwt({ sub: "user-1" }), access_token: makeJwt({ sub: "user-1" }),
      refresh_token: "fixture-refresh", account_id: "acct-1" }, last_refresh: "2026-11-26T00:00:00.000Z" });
  await mkdir(bin, { recursive: true });
  await writeFile(join(bin, "codex"), '#!/bin/sh\nprintf "argument: %s\\n" "$@"\n', { mode: 0o755 });
  const result = run(args);
  expect({ status: result.status, stderr: result.stderr }).toEqual({ status: 0, stderr: "" });
  expect(result.stdout.split("\n").filter((line) => line.startsWith("argument: "))).toEqual([
    "argument: --approve-for-me", "argument: --model", "argument: gpt-6.1-sol",
  ]);
});
