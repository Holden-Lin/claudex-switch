import { beforeEach, describe, expect, test } from "bun:test";
import { spawnSync } from "child_process";
import { mkdir, readFile, readdir } from "fs/promises";
import { dirname, join } from "path";
import { saveAliases } from "../src/alias/store";
import { writeJson } from "../src/lib/fs";
import {
  CLAUDE_JSON, CLAUDE_STATE_FILE, CREDENTIALS_FILE, SETTINGS_FILE,
  claudeProfileCredentials, claudeProfileDataFile,
} from "../src/lib/paths";
import {
  switchProfile, updateClaudeProfileConfig, updateProfileDefaultModel,
} from "../src/providers/claude/profiles";
import { assertIsolatedHome, resetTestHome, TEST_HOME } from "./helpers";

async function snapshot(dir = TEST_HOME): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) Object.assign(result, await snapshot(path));
    else result[path] = (await readFile(path)).toString("base64");
  }
  return result;
}

function cli(args: string[]) {
  return spawnSync(process.execPath, ["src/index.ts", ...args], {
    encoding: "utf-8",
    env: { ...process.env, BUN_RUNTIME_TRANSPILER_CACHE_PATH: "0", CLAUDEX_DISABLE_AUTO_UPDATE: "1", CLAUDEX_FORCE_FILE_CREDENTIALS: "1" },
  });
}

describe("proxy profiles cannot switch global Claude", () => {
  beforeEach(async () => {
    assertIsolatedHome(TEST_HOME);
    await resetTestHome();
    process.env.CLAUDEX_FORCE_FILE_CREDENTIALS = "1";
    for (const [path, value] of [
      [SETTINGS_FILE, { model: "claude-opus-5-5", env: { KEEP: "yes" } }],
      [CREDENTIALS_FILE, { claudeAiOauth: { accessToken: "fixture-live" } }],
      [CLAUDE_JSON, { oauthAccount: { accountUuid: "fixture-account" } }],
      [CLAUDE_STATE_FILE, { active: "native" }],
      [claudeProfileDataFile("native"), { type: "oauth" }],
      [claudeProfileCredentials("native"), { claudeAiOauth: { accessToken: "fixture-snapshot" } }],
      [claudeProfileDataFile("proxy-id"), {
        type: "local-cliproxyapi", profileId: "fixture-proxy",
        binaryPath: "/must-not-be-started", defaultModel: "deepseek-v4.1-flash",
      }],
    ] as const) {
      await mkdir(dirname(path), { recursive: true });
      await writeJson(path, value);
    }
    await saveAliases({ version: 1, aliases: [
      { alias: "workbuddy", target: { provider: "claude", profileName: "proxy-id" }, createdAt: 1 },
      { alias: "native", target: { provider: "claude", profileName: "native" }, createdAt: 1 },
    ] });
  });

  test.each(["native", "proxy-id"])("refuses before writes even when active=%s", async (active) => {
    await writeJson(CLAUDE_STATE_FILE, { active });
    const before = await snapshot();
    await expect(switchProfile("proxy-id")).rejects.toThrow("claudex-switch workbuddy --run");
    expect(await snapshot()).toEqual(before);
  });

  test.each([["workbuddy"], ["use", "workbuddy"]])("CLI refuses %j without side effects", async (...args) => {
    const before = await snapshot();
    const result = cli(args);
    expect(result.status).toBe(1);
    expect(result.stderr + result.stdout).toContain("claudex-switch workbuddy --run");
    expect(await snapshot()).toEqual(before);
  });

  test.each([
    ["workbuddy", "--help"], ["workbuddy", "-h"],
    ["native", "--help"], ["missing-alias", "-h"], ["use", "workbuddy", "--help"],
  ])("help %j changes nothing", async (...args) => {
    const before = await snapshot();
    const result = cli(args);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Usage:");
    expect(await snapshot()).toEqual(before);
  });

  test("editing a legacy active proxy never reapplies global settings", async () => {
    await writeJson(CLAUDE_STATE_FILE, { active: "proxy-id" });
    const before = await snapshot();
    expect((await updateClaudeProfileConfig("proxy-id", { fields: { defaultModel: "hy3" } })).reapplied).toBe(false);
    await updateProfileDefaultModel("proxy-id", "deepseek-v4.1-flash");
    expect(await snapshot()).toEqual(before);
  });

  test("API key profiles still switch", async () => {
    await writeJson(claudeProfileDataFile("native"), { type: "api-key", apiKey: "fixture-key", model: "sonnet" });
    await switchProfile("native");
    expect(JSON.parse(await readFile(CLAUDE_STATE_FILE, "utf-8")).active).toBe("native");
    expect(JSON.parse(await readFile(SETTINGS_FILE, "utf-8")).env.ANTHROPIC_API_KEY).toBe("fixture-key");
  });
});
