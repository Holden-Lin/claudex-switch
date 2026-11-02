import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { randomUUID } from "crypto";
import { spawnSync } from "child_process";
import { mkdir, readFile, readdir, rm } from "fs/promises";
import { dirname, join } from "path";
import { saveAliases } from "../src/alias/store";
import { writeJson } from "../src/lib/fs";
import {
  CLAUDE_JSON, CLAUDE_STATE_FILE, CREDENTIALS_FILE, SETTINGS_FILE, MANAGED_ENV_FILE,
  claudeProfileCredentials, claudeProfileDataFile, claudeProfileConfigDir,
  cliProxyAPIEnvFile,
} from "../src/lib/paths";
import {
  switchProfile, updateClaudeProfileConfig, updateProfileDefaultModel,
  prepareIsolatedApiRun,
} from "../src/providers/claude/profiles";
import {
  ensureManagedCLIProxyAPI, initializeManagedCLIProxyAPI, runManagedCLIProxyAPILogin,
  stopManagedCLIProxyAPI, prepareLocalCLIProxyAPIClaudeSettings,
} from "../src/providers/cliproxyapi/managed";
import {
  prepareApiProfileClaudeSettings, prepareOAuthProfileClaudeSettings,
} from "../src/providers/claude/settings";
import type { LocalCLIProxyAPIProfileData } from "../src/types";
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

const FIXTURE_BINARY = join(import.meta.dir, "fixtures", "fake-cliproxyapi");
let proxy: LocalCLIProxyAPIProfileData;

describe("proxy accounts switch global Claude without redirecting isolated runs", () => {
  beforeEach(async () => {
    assertIsolatedHome(TEST_HOME);
    await resetTestHome();
    process.env.CLAUDEX_FORCE_FILE_CREDENTIALS = "1";
    proxy = {
      type: "local-cliproxyapi", profileId: randomUUID(),
      binaryPath: FIXTURE_BINARY, defaultModel: "fable",
      env: { CLAUDE_CODE_EFFORT_LEVEL: "max" },
    };
    for (const [path, value] of [
      [SETTINGS_FILE, { model: "claude-opus-5-5", env: { KEEP: "yes" } }],
      [CREDENTIALS_FILE, { claudeAiOauth: { accessToken: "fixture-live" } }],
      [CLAUDE_JSON, { oauthAccount: { accountUuid: "fixture-account" } }],
      [CLAUDE_STATE_FILE, { active: "native" }],
      [claudeProfileDataFile("native"), { type: "oauth", defaultModel: "claude-opus-5-5" }],
      [claudeProfileCredentials("native"), { claudeAiOauth: { accessToken: "fixture-snapshot" } }],
      [claudeProfileDataFile("proxy-id"), proxy],
    ] as const) {
      await mkdir(dirname(path), { recursive: true });
      await writeJson(path, value);
    }
    await saveAliases({ version: 1, aliases: [
      { alias: "workbuddy", target: { provider: "claude", profileName: "proxy-id" }, createdAt: 1 },
      { alias: "native", target: { provider: "claude", profileName: "native" }, createdAt: 1 },
    ] });
    await initializeManagedCLIProxyAPI(proxy.profileId);
    await runManagedCLIProxyAPILogin(proxy);
  });

  afterEach(async () => {
    await stopManagedCLIProxyAPI(proxy);
  });

  test("starts/reuses the proxy, updates state, then restores OAuth and clears only managed env", async () => {
    const credentials = await readFile(CREDENTIALS_FILE, "utf-8");
    await switchProfile("proxy-id");
    const runtime = await ensureManagedCLIProxyAPI(proxy);
    const settings = JSON.parse(await readFile(SETTINGS_FILE, "utf-8"));
    expect(settings.env.ANTHROPIC_BASE_URL).toBe(runtime.baseUrl);
    expect(settings.env.ANTHROPIC_AUTH_TOKEN).toBe(runtime.apiKey);
    expect(settings.env.ANTHROPIC_API_KEY).toBe("");
    expect(settings.env.CLAUDE_CODE_AUTO_MODE_SERVER).toBe("0");
    expect(settings.env.CLAUDE_CODE_EFFORT_LEVEL).toBe("max");
    expect(JSON.parse(await readFile(CLAUDE_STATE_FILE, "utf-8")).active).toBe("proxy-id");
    expect(JSON.parse(await readFile(CLAUDE_JSON, "utf-8")).oauthAccount).toBeUndefined();
    await expect(readFile(CREDENTIALS_FILE)).rejects.toThrow();
    await switchProfile("proxy-id");
    expect((await ensureManagedCLIProxyAPI(proxy)).baseUrl).toBe(runtime.baseUrl);

    await switchProfile("native");
    expect(await readFile(CREDENTIALS_FILE, "utf-8")).toBe(credentials);
    expect(JSON.parse(await readFile(CLAUDE_JSON, "utf-8")).oauthAccount).toEqual({ accountUuid: "fixture-account" });
    expect(JSON.parse(await readFile(SETTINGS_FILE, "utf-8"))).toEqual({
      model: "claude-opus-5-5", env: { KEEP: "yes", ANTHROPIC_DEFAULT_OPUS_MODEL: "claude-opus-5-5" },
    });
    expect(JSON.parse(await readFile(MANAGED_ENV_FILE, "utf-8")).keys).toEqual([]);
  });

  test.each([["workbuddy"], ["use", "workbuddy"]])("CLI switches %j", async (...args) => {
    const result = cli(args);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Switched to workbuddy");
    expect(JSON.parse(await readFile(CLAUDE_STATE_FILE, "utf-8")).active).toBe("proxy-id");
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

  test.each([
    ["workbuddy", "typo"], ["native", "unknown"], ["workbuddy", "--typo"],
    ["use", "workbuddy", "typo"], ["use", "native", "--model", "opus"],
  ])("invalid trailing arguments %j never switch or write", async (...args) => {
    const before = await snapshot();
    const result = cli(args);
    expect(result.status).toBe(1);
    expect(result.stderr + result.stdout).toContain("Usage:");
    expect(await snapshot()).toEqual(before);
  });

  test("editing the active proxy reapplies its model and extra env", async () => {
    await switchProfile("proxy-id");
    expect((await updateClaudeProfileConfig("proxy-id", {
      fields: { defaultModel: "custom-model" }, env: { CUSTOM_PROXY: "yes" },
    })).reapplied).toBe(true);
    let settings = JSON.parse(await readFile(SETTINGS_FILE, "utf-8"));
    expect(settings.model).toBe("custom-model");
    expect(settings.env.CUSTOM_PROXY).toBe("yes");
    expect(settings.env.CLAUDE_CODE_EFFORT_LEVEL).toBeUndefined();
    await updateProfileDefaultModel("proxy-id", "gpt-6.1-terra");
    settings = JSON.parse(await readFile(SETTINGS_FILE, "utf-8"));
    expect(settings.model).toBe("gpt-6.1-terra");
  });

  test("a missing proxy configuration leaves global settings, state and credentials untouched", async () => {
    await rm(cliProxyAPIEnvFile(proxy.profileId));
    const paths = [SETTINGS_FILE, CLAUDE_STATE_FILE, CREDENTIALS_FILE, CLAUDE_JSON];
    const before = await Promise.all(paths.map((path) => readFile(path, "utf-8")));
    await expect(switchProfile("proxy-id")).rejects.toThrow();
    expect(await Promise.all(paths.map((path) => readFile(path, "utf-8")))).toEqual(before);
  });

  test("every global proxy settings key is already covered by each run overlay before switching", async () => {
    const read = async (file: string) => JSON.parse(await readFile(file, "utf-8"));
    const runtime = await ensureManagedCLIProxyAPI(proxy);
    const withUserSettings = async (name: string, overlay: string) => {
      const config = await prepareIsolatedApiRun(name);
      return { ...await read(join(config, "settings.json")), ...await read(overlay) };
    };
    const overlays = [
      await withUserSettings("plain-oauth", await prepareOAuthProfileClaudeSettings("plain-oauth", { type: "oauth" })),
      await withUserSettings("extra-oauth", await prepareOAuthProfileClaudeSettings("extra-oauth", { type: "oauth", env: { OWN: "yes" } })),
      await withUserSettings("api", await prepareApiProfileClaudeSettings("api", { apiKey: "fixture-api", baseUrl: "https://fixture.invalid" })),
      await withUserSettings("proxy-id", await prepareLocalCLIProxyAPIClaudeSettings(proxy, runtime)),
      await withUserSettings("proxy-id", await prepareLocalCLIProxyAPIClaudeSettings(proxy, runtime, { inheritModel: true })),
    ];
    await switchProfile("proxy-id");
    const global = await read(SETTINGS_FILE);
    const written = Object.keys(global.env).filter((key) => key !== "KEEP");
    for (const overlay of overlays) {
      expect(Object.hasOwn(overlay, "model")).toBe(true);
      for (const key of written) expect(Object.hasOwn(overlay.env, key)).toBe(true);
    }
    expect(overlays[0].env.ANTHROPIC_BASE_URL).toBe("");
    expect(overlays[0].env.CLAUDE_CODE_SUBAGENT_MODEL_FORCE).toBe("");
    expect(overlays[0].env.CLAUDE_CODE_EFFORT_LEVEL).toBe("");
    expect(overlays[2].env.ANTHROPIC_API_KEY).toBe("fixture-api");
    expect(overlays[3].env.ANTHROPIC_BASE_URL).toBe(runtime.baseUrl);
    expect(overlays[4].model).toBe("claude-opus-5-5");
    for (const overlay of overlays) {
      const effective = { ...global, ...overlay, env: { ...global.env, ...overlay.env } };
      for (const key of written) expect(effective.env[key]).toBe(overlay.env[key]);
      expect(effective.model).toBe(overlay.model);
    }
    await switchProfile("native");
    expect((await read(SETTINGS_FILE)).model).toBe("claude-opus-5-5");
  });

  test("API key profiles still switch", async () => {
    await writeJson(claudeProfileDataFile("native"), { type: "api-key", apiKey: "fixture-key", model: "sonnet" });
    await switchProfile("native");
    expect(JSON.parse(await readFile(CLAUDE_STATE_FILE, "utf-8")).active).toBe("native");
    expect(JSON.parse(await readFile(SETTINGS_FILE, "utf-8")).env.ANTHROPIC_API_KEY).toBe("fixture-key");
  });
});
