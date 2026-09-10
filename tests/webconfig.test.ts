import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { access, mkdir, readFile, stat } from "fs/promises";
import { join } from "path";
import { saveAliases } from "../src/alias/store";
import { codexAccountAuthFile } from "../src/lib/paths";
import { parseWebConfigArgs } from "../src/commands/webconfig";
import { writeJson } from "../src/lib/fs";
import {
  CLAUDE_STATE_FILE,
  MANAGED_ENV_FILE,
  SETTINGS_FILE,
  claudeProfileDataFile,
  claudeProfileDir,
} from "../src/lib/paths";
import { getProfileData } from "../src/providers/claude/profiles";
import {
  getClaudeEnvNeutralizer,
  prepareApiProfileClaudeSettings,
  prepareOAuthProfileClaudeSettings,
} from "../src/providers/claude/settings";
import { saveAccountAuth } from "../src/providers/codex/auth";
import { saveRegistry } from "../src/providers/codex/registry";
import { startWebConfigServer, type WebConfigServer } from "../src/webconfig/server";
import { createAccount } from "../src/webconfig/create";
import {
  applyChanges,
  buildSnapshot,
  deleteAccount,
  renameAccountAlias,
} from "../src/webconfig/snapshot";
import { assertIsolatedHome, fileMode, resetTestHome, TEST_HOME } from "./helpers";
import type {
  AliasRegistry,
  ApiKeyProfileData,
  CodexRegistry,
  ProfileData,
  WebConfigAccount,
  WebConfigSnapshot,
} from "../src/types";

const CODEX_ACCOUNT_KEY = "user-1::acct-1";

async function writeClaudeProfile(
  name: string,
  data: ProfileData,
): Promise<void> {
  assertIsolatedHome(claudeProfileDir(name));
  await mkdir(claudeProfileDir(name), { recursive: true });
  await writeJson(claudeProfileDataFile(name), data);
}

async function setActiveClaudeProfile(name: string | null): Promise<void> {
  assertIsolatedHome(CLAUDE_STATE_FILE);
  await mkdir(join(TEST_HOME, ".claude-profiles"), { recursive: true });
  await writeJson(CLAUDE_STATE_FILE, { active: name });
}

async function seedCodexAccount(alias: string): Promise<void> {
  const registry: CodexRegistry = {
    schema_version: 1,
    active_account_key: CODEX_ACCOUNT_KEY,
    active_account_activated_at_ms: Date.now(),
    auto_switch: {
      enabled: false,
      threshold_5h_percent: 90,
      threshold_weekly_percent: 90,
    },
    api: { usage: true, account: true },
    accounts: [
      {
        account_key: CODEX_ACCOUNT_KEY,
        chatgpt_account_id: "acct-1",
        chatgpt_user_id: "user-1",
        email: "relay@example.com",
        alias,
        account_name: null,
        plan: null,
        auth_mode: "apikey",
        default_model: "gpt-5.4",
        api_provider: {
          type: "custom",
          name: "relay",
          base_url: "https://old.example.com/v1",
          model: "gpt-5.4",
          env_key: "OPENAI_API_KEY",
        },
        created_at: 1,
        last_used_at: null,
        last_usage: null,
        last_usage_at: null,
        last_local_rollout: null,
      },
    ],
  };
  await saveRegistry(registry);
  await saveAccountAuth(CODEX_ACCOUNT_KEY, {
    auth_mode: "apikey",
    OPENAI_API_KEY: "sk-old-codex-key",
  });
}

async function seedAliases(entries: AliasRegistry["aliases"]): Promise<void> {
  await saveAliases({ version: 1, aliases: entries });
}

function findAccount(
  snapshot: WebConfigSnapshot,
  alias: string,
): WebConfigAccount {
  const account = [...snapshot.claude, ...snapshot.codex].find(
    (candidate) => candidate.alias === alias,
  );
  if (!account) throw new Error(`missing account ${alias}`);
  return account;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readSettings(): Promise<{
  env?: Record<string, string>;
  model?: string;
}> {
  return JSON.parse(await readFile(SETTINGS_FILE, "utf-8"));
}

describe("webconfig snapshot", () => {
  beforeEach(async () => {
    await resetTestHome();
  });

  test("names every alias a delete would also remove", async () => {
    await writeClaudeProfile("shared", { type: "api-key", apiKey: "sk-shared" });
    await setActiveClaudeProfile("shared");
    await seedAliases([
      {
        alias: "one",
        target: { provider: "claude", profileName: "shared" },
        createdAt: 1,
      },
      {
        alias: "two",
        target: { provider: "claude", profileName: "shared" },
        createdAt: 2,
      },
      {
        alias: "other",
        target: { provider: "claude", profileName: "other" },
        createdAt: 3,
      },
    ]);

    const snapshot = await buildSnapshot();
    expect(findAccount(snapshot, "one").linkedAliases).toEqual(["one", "two"]);
    expect(findAccount(snapshot, "two").linkedAliases).toEqual(["one", "two"]);
    expect(findAccount(snapshot, "other").linkedAliases).toEqual(["other"]);
  });

  test("renames an alias without touching the account underneath", async () => {
    await writeClaudeProfile("keepme", {
      type: "api-key",
      apiKey: "sk-keepme",
      baseUrl: "https://relay.example.com",
    });
    await setActiveClaudeProfile("keepme");
    await seedAliases([
      {
        alias: "before",
        target: { provider: "claude", profileName: "keepme" },
        createdAt: 1,
      },
    ]);

    expect(await renameAccountAlias("before", "after")).toBe("after");

    const snapshot = await buildSnapshot();
    expect(snapshot.claude.map((a) => a.alias)).toEqual(["after"]);
    // The profile name is the account's own identity and must not move.
    expect(findAccount(snapshot, "after").profileName).toBe("keepme");
    expect(await getProfileData("keepme")).toMatchObject({
      apiKey: "sk-keepme",
      baseUrl: "https://relay.example.com",
    });
  });

  test("rejects a rename to a bad or occupied alias", async () => {
    await writeClaudeProfile("a", { type: "api-key", apiKey: "sk-a" });
    await writeClaudeProfile("b", { type: "api-key", apiKey: "sk-b" });
    await setActiveClaudeProfile(null);
    await seedAliases([
      { alias: "a", target: { provider: "claude", profileName: "a" }, createdAt: 1 },
      { alias: "b", target: { provider: "claude", profileName: "b" }, createdAt: 2 },
    ]);

    await expect(renameAccountAlias("a", "b")).rejects.toThrow("占用");
    await expect(renameAccountAlias("a", "purge")).rejects.toThrow("保留命令");
    await expect(renameAccountAlias("a", "with space")).rejects.toThrow();
    await expect(renameAccountAlias("a", "")).rejects.toThrow("不能为空");
    await expect(renameAccountAlias("nope", "c")).rejects.toThrow("不存在");

    expect((await buildSnapshot()).claude.map((a) => a.alias)).toEqual(["a", "b"]);
  });

  test("deletes the account and every alias pointing at it", async () => {
    await writeClaudeProfile("target", { type: "api-key", apiKey: "sk-target" });
    await writeClaudeProfile("survivor", {
      type: "api-key",
      apiKey: "sk-survivor",
    });
    await setActiveClaudeProfile("target");
    await seedCodexAccount("cx");
    await seedAliases([
      {
        alias: "gone1",
        target: { provider: "claude", profileName: "target" },
        createdAt: 1,
      },
      {
        alias: "gone2",
        target: { provider: "claude", profileName: "target" },
        createdAt: 2,
      },
      {
        alias: "kept",
        target: { provider: "claude", profileName: "survivor" },
        createdAt: 3,
      },
      {
        alias: "cx",
        target: { provider: "codex", accountKey: CODEX_ACCOUNT_KEY },
        createdAt: 4,
      },
    ]);

    const removed = await deleteAccount("gone1");
    expect(removed.sort()).toEqual(["gone1", "gone2"]);

    const snapshot = await buildSnapshot();
    expect(snapshot.claude.map((a) => a.alias).sort()).toEqual(["kept"]);
    // The target profile's directory, credentials and all, is gone.
    expect(await pathExists(claudeProfileDir("target"))).toBe(false);
    expect(await pathExists(claudeProfileDir("survivor"))).toBe(true);
    expect(await getProfileData("survivor")).toMatchObject({
      apiKey: "sk-survivor",
    });

    // Purging an active account clears the global active pointer.
    expect(JSON.parse(await readFile(CLAUDE_STATE_FILE, "utf-8"))).toEqual({
      active: null,
    });

    // Codex keeps its own account until it is the one being deleted.
    expect(findAccount(snapshot, "cx").fields.apiKey).toBe("sk-old-codex-key");
  });

  test("deletes a codex account and its stored login file", async () => {
    await seedCodexAccount("cx");
    await seedAliases([
      {
        alias: "cx",
        target: { provider: "codex", accountKey: CODEX_ACCOUNT_KEY },
        createdAt: 1,
      },
    ]);

    const authFile = codexAccountAuthFile(CODEX_ACCOUNT_KEY);
    expect(await pathExists(authFile)).toBe(true);

    await deleteAccount("cx");

    expect(await pathExists(authFile)).toBe(false);
    const snapshot = await buildSnapshot();
    expect(snapshot.codex).toEqual([]);
    const registry = JSON.parse(
      await readFile(join(TEST_HOME, ".codex", "accounts", "registry.json"), "utf-8"),
    );
    expect(registry.accounts).toEqual([]);
  });

  test("leaves the alias alone when the account underneath cannot be removed", async () => {
    // Ordering contract: the account is removed before its aliases, so any
    // refusal (here a corrupt profile id, as a held -run lease would be) must
    // leave at least one alias pointing at a still-present account. Dropping
    // the aliases first would strand the account with no way to reach it.
    await writeClaudeProfile("proxy", {
      type: "local-cliproxyapi",
      profileId: "not-a-uuid",
      binaryPath: "/nonexistent/cli-proxy-api",
      defaultModel: "gpt-6",
    });
    await setActiveClaudeProfile(null);
    await seedAliases([
      {
        alias: "p",
        target: { provider: "claude", profileName: "proxy" },
        createdAt: 1,
      },
    ]);

    await expect(deleteAccount("p")).rejects.toThrow("Invalid managed");

    const snapshot = await buildSnapshot();
    expect(snapshot.claude.map((a) => a.alias)).toEqual(["p"]);
    expect(await pathExists(claudeProfileDir("proxy"))).toBe(true);
  });

  test("refuses to delete an alias that is already gone", async () => {
    await seedAliases([]);
    await expect(deleteAccount("ghost")).rejects.toThrow("不存在");
  });

  test("reports each account's editable fields and current env", async () => {
    await writeClaudeProfile("deepseek", {
      type: "api-key",
      apiKey: "sk-deepseek",
      baseUrl: "https://api.deepseek.com/anthropic",
      model: "deepseek-v4-pro",
      defaultHaikuModel: "deepseek-v4-flash",
      env: { CLAUDE_CODE_EFFORT_LEVEL: "max" },
    });
    await writeClaudeProfile("sub", { type: "oauth", defaultModel: "opus" });
    await setActiveClaudeProfile("deepseek");
    await seedCodexAccount("cx");
    await seedAliases([
      {
        alias: "deepseek",
        target: { provider: "claude", profileName: "deepseek" },
        createdAt: 1,
      },
      {
        alias: "sub",
        target: { provider: "claude", profileName: "sub" },
        createdAt: 2,
      },
      {
        alias: "cx",
        target: { provider: "codex", accountKey: CODEX_ACCOUNT_KEY },
        createdAt: 3,
      },
    ]);

    const snapshot = await buildSnapshot();
    expect(snapshot.claude).toHaveLength(2);
    expect(snapshot.codex).toHaveLength(1);

    const deepseek = findAccount(snapshot, "deepseek");
    expect(deepseek.type).toBe("api-key");
    expect(deepseek.isActive).toBe(true);
    expect(deepseek.fields.baseUrl).toBe("https://api.deepseek.com/anthropic");
    expect(deepseek.fields.apiKey).toBe("sk-deepseek");
    expect(deepseek.env).toEqual({ CLAUDE_CODE_EFFORT_LEVEL: "max" });
    expect(deepseek.secretFields).toContain("apiKey");

    const oauth = findAccount(snapshot, "sub");
    expect(oauth.type).toBe("oauth");
    expect(oauth.fields).toEqual({ defaultModel: "opus" });

    const codex = findAccount(snapshot, "cx");
    expect(codex.supportsEnv).toBe(false);
    expect(codex.fields.baseUrl).toBe("https://old.example.com/v1");
    expect(codex.fields.apiKey).toBe("sk-old-codex-key");
    // The provider name keys config.toml's [model_providers.<name>] table.
    expect(codex.readonly).toContain("providerName");
  });

  test("saves only the submitted accounts and keeps the rest untouched", async () => {
    await writeClaudeProfile("one", { type: "api-key", apiKey: "sk-one" });
    await writeClaudeProfile("two", { type: "api-key", apiKey: "sk-two" });
    await setActiveClaudeProfile(null);
    await seedAliases([
      {
        alias: "one",
        target: { provider: "claude", profileName: "one" },
        createdAt: 1,
      },
      {
        alias: "two",
        target: { provider: "claude", profileName: "two" },
        createdAt: 2,
      },
    ]);

    const results = await applyChanges([
      {
        provider: "claude",
        alias: "one",
        fields: { apiKey: "sk-one-new", baseUrl: "https://relay.example.com" },
      },
    ]);

    expect(results).toEqual([{ alias: "one", ok: true, reapplied: false }]);
    const one = await getProfileData("one");
    expect(one).toMatchObject({
      apiKey: "sk-one-new",
      baseUrl: "https://relay.example.com",
    });
    expect(await getProfileData("two")).toEqual({
      type: "api-key",
      apiKey: "sk-two",
    });
  });

  test("re-applies global settings when the edited account is active", async () => {
    await writeClaudeProfile("live", {
      type: "api-key",
      apiKey: "sk-live",
      model: "old-model",
    });
    await setActiveClaudeProfile("live");
    await seedAliases([
      {
        alias: "live",
        target: { provider: "claude", profileName: "live" },
        createdAt: 1,
      },
    ]);

    const results = await applyChanges([
      {
        provider: "claude",
        alias: "live",
        fields: {
          apiKey: "sk-live",
          baseUrl: "https://api.deepseek.com/anthropic",
          model: "deepseek-v4-pro",
          defaultHaikuModel: "deepseek-v4-flash",
        },
        env: {
          CLAUDE_CODE_EFFORT_LEVEL: "max",
          CLAUDE_CODE_AUTO_COMPACT_WINDOW: "786432",
        },
      },
    ]);

    expect(results[0]).toEqual({ alias: "live", ok: true, reapplied: true });

    const settings = await readSettings();
    expect(settings.env).toMatchObject({
      ANTHROPIC_API_KEY: "sk-live",
      ANTHROPIC_BASE_URL: "https://api.deepseek.com/anthropic",
      ANTHROPIC_MODEL: "deepseek-v4-pro",
      ANTHROPIC_DEFAULT_HAIKU_MODEL: "deepseek-v4-flash",
      CLAUDE_CODE_EFFORT_LEVEL: "max",
      CLAUDE_CODE_AUTO_COMPACT_WINDOW: "786432",
    });
    expect(settings.model).toBe("deepseek-v4-pro");
  });

  test("accepts a pasted export block verbatim, including subagent routing", async () => {
    await writeClaudeProfile("paste", { type: "api-key", apiKey: "sk-paste" });
    await setActiveClaudeProfile("paste");
    await seedAliases([
      {
        alias: "paste",
        target: { provider: "claude", profileName: "paste" },
        createdAt: 1,
      },
    ]);

    const results = await applyChanges([
      {
        provider: "claude",
        alias: "paste",
        fields: {
          apiKey: "sk-paste",
          baseUrl: "https://api.deepseek.com/anthropic",
          model: "deepseek-v4-pro[1m]",
          defaultOpusModel: "deepseek-v4-pro[1m]",
          defaultSonnetModel: "deepseek-v4-pro[1m]",
          defaultHaikuModel: "deepseek-v4-flash",
          // CLAUDE_CODE_SUBAGENT_MODEL is a managed key: it needs its own
          // field, otherwise a pasted export block is rejected as reserved.
          subagentModel: "deepseek-v4-flash",
        },
        env: {
          CLAUDE_CODE_EFFORT_LEVEL: "max",
          CLAUDE_CODE_AUTO_COMPACT_WINDOW: "786432",
        },
      },
    ]);

    expect(results[0].ok).toBe(true);
    expect((await readSettings()).env).toMatchObject({
      CLAUDE_CODE_SUBAGENT_MODEL: "deepseek-v4-flash",
      CLAUDE_CODE_EFFORT_LEVEL: "max",
      CLAUDE_CODE_AUTO_COMPACT_WINDOW: "786432",
    });

    // The same routing must reach an isolated -run through its private,
    // higher-precedence settings file, not only the global settings.
    const runSettingsFile = await prepareApiProfileClaudeSettings(
      "paste",
      (await getProfileData("paste")) as ApiKeyProfileData,
    );
    const runSettings = JSON.parse(await readFile(runSettingsFile, "utf-8"));
    expect(runSettings.env).toMatchObject({
      ANTHROPIC_BASE_URL: "https://api.deepseek.com/anthropic",
      CLAUDE_CODE_SUBAGENT_MODEL: "deepseek-v4-flash",
      CLAUDE_CODE_EFFORT_LEVEL: "max",
      CLAUDE_CODE_AUTO_COMPACT_WINDOW: "786432",
    });
  });

  test("neutralizes another profile's custom env for an isolated OAuth run", async () => {
    await writeClaudeProfile("api", {
      type: "api-key",
      apiKey: "sk-api",
      env: { CLAUDE_CODE_EFFORT_LEVEL: "max" },
    });
    await writeClaudeProfile("sub", { type: "oauth" });
    await setActiveClaudeProfile("api");
    await seedAliases([
      {
        alias: "api",
        target: { provider: "claude", profileName: "api" },
        createdAt: 1,
      },
    ]);
    await applyChanges([
      {
        provider: "claude",
        alias: "api",
        fields: { apiKey: "sk-api" },
        env: { CLAUDE_CODE_EFFORT_LEVEL: "max" },
      },
    ]);

    const neutralizer = JSON.parse((await getClaudeEnvNeutralizer()) ?? "{}");
    expect(neutralizer.env.CLAUDE_CODE_EFFORT_LEVEL).toBe("");
    expect(neutralizer.env.ANTHROPIC_API_KEY).toBe("");

    // An OAuth profile that owns extra env gets a private 0600 file instead,
    // because the inline neutralizer JSON is visible in `ps`.
    const file = await prepareOAuthProfileClaudeSettings("sub", {
      type: "oauth",
      env: { CLAUDE_CODE_AUTO_COMPACT_WINDOW: "786432" },
    });
    const settings = JSON.parse(await readFile(file, "utf-8"));
    expect(settings.env.CLAUDE_CODE_AUTO_COMPACT_WINDOW).toBe("786432");
    expect(settings.env.CLAUDE_CODE_EFFORT_LEVEL).toBe("");
    expect(fileMode((await stat(file)).mode)).toBe(0o600);
  });

  test("rejects invalid values without touching the profile", async () => {
    await writeClaudeProfile("bad", { type: "api-key", apiKey: "sk-bad" });
    await setActiveClaudeProfile(null);
    await seedAliases([
      {
        alias: "bad",
        target: { provider: "claude", profileName: "bad" },
        createdAt: 1,
      },
    ]);

    const results = await applyChanges([
      { provider: "claude", alias: "bad", fields: { baseUrl: "not a url" } },
      { provider: "claude", alias: "bad", env: { "lower-case": "1" } },
      {
        provider: "claude",
        alias: "bad",
        env: { ANTHROPIC_BASE_URL: "https://x.example.com" },
      },
      { provider: "claude", alias: "nope", fields: {} },
    ]);

    expect(results.map((result) => result.ok)).toEqual([
      false,
      false,
      false,
      false,
    ]);
    // The reserved-key rejection must name the dedicated input, not just fail.
    expect(results[2].error).toContain("ANTHROPIC_BASE_URL");
    expect(await getProfileData("bad")).toEqual({
      type: "api-key",
      apiKey: "sk-bad",
    });
  });

  test("clears the previous account's custom env on the next switch", async () => {
    await writeClaudeProfile("withenv", {
      type: "api-key",
      apiKey: "sk-env",
      env: { CLAUDE_CODE_EFFORT_LEVEL: "max" },
    });
    await writeClaudeProfile("plain", { type: "oauth" });
    await setActiveClaudeProfile("withenv");
    await seedAliases([
      {
        alias: "withenv",
        target: { provider: "claude", profileName: "withenv" },
        createdAt: 1,
      },
      {
        alias: "plain",
        target: { provider: "claude", profileName: "plain" },
        createdAt: 2,
      },
    ]);

    await applyChanges([
      {
        provider: "claude",
        alias: "withenv",
        fields: { apiKey: "sk-env" },
        env: { CLAUDE_CODE_EFFORT_LEVEL: "max", MY_OWN_FLAG: "1" },
      },
    ]);
    expect((await readSettings()).env).toMatchObject({
      CLAUDE_CODE_EFFORT_LEVEL: "max",
      MY_OWN_FLAG: "1",
    });
    expect(JSON.parse(await readFile(MANAGED_ENV_FILE, "utf-8")).keys).toEqual([
      "CLAUDE_CODE_EFFORT_LEVEL",
      "MY_OWN_FLAG",
    ]);

    // Switching to a profile that owns no extra env must remove them again.
    await setActiveClaudeProfile("plain");
    await applyChanges([
      { provider: "claude", alias: "plain", fields: { defaultModel: "opus" } },
    ]);

    const settings = await readSettings();
    expect(settings.env?.CLAUDE_CODE_EFFORT_LEVEL).toBeUndefined();
    expect(settings.env?.MY_OWN_FLAG).toBeUndefined();
  });

  test("never removes env entries the user added by hand", async () => {
    await writeClaudeProfile("hand", { type: "api-key", apiKey: "sk-hand" });
    await setActiveClaudeProfile("hand");
    await mkdir(join(TEST_HOME, ".claude"), { recursive: true });
    await writeJson(SETTINGS_FILE, {
      env: { MY_MANUAL_SETTING: "keep-me" },
    });
    await seedAliases([
      {
        alias: "hand",
        target: { provider: "claude", profileName: "hand" },
        createdAt: 1,
      },
    ]);

    await applyChanges([
      {
        provider: "claude",
        alias: "hand",
        fields: { apiKey: "sk-hand" },
        env: { CLAUDE_CODE_EFFORT_LEVEL: "high" },
      },
    ]);

    expect((await readSettings()).env).toMatchObject({
      MY_MANUAL_SETTING: "keep-me",
      CLAUDE_CODE_EFFORT_LEVEL: "high",
    });
  });

  test("clears every custom env row on a local CLIProxyAPI profile", async () => {
    await writeClaudeProfile("proxy", {
      type: "local-cliproxyapi",
      profileId: "pid-1",
      binaryPath: "/usr/local/bin/cli-proxy-api",
      defaultModel: "gpt-6",
      env: { CLAUDE_CODE_EFFORT_LEVEL: "max" },
    });
    await setActiveClaudeProfile(null);
    await seedAliases([
      {
        alias: "proxy",
        target: { provider: "claude", profileName: "proxy" },
        createdAt: 1,
      },
    ]);

    const results = await applyChanges([
      {
        provider: "claude",
        alias: "proxy",
        fields: { defaultModel: "gpt-6" },
        env: {},
      },
    ]);

    expect(results[0].ok).toBe(true);
    expect(await getProfileData("proxy")).toEqual({
      type: "local-cliproxyapi",
      profileId: "pid-1",
      binaryPath: "/usr/local/bin/cli-proxy-api",
      defaultModel: "gpt-6",
    });
  });

  test("refuses to blank a relay account's base URL", async () => {
    await seedCodexAccount("cx");
    await seedAliases([
      {
        alias: "cx",
        target: { provider: "codex", accountKey: CODEX_ACCOUNT_KEY },
        createdAt: 1,
      },
    ]);

    const results = await applyChanges([
      { provider: "codex", alias: "cx", fields: { baseUrl: "  " } },
    ]);

    expect(results[0].ok).toBe(false);
    // The registry must be untouched, not left half-written.
    const codex = findAccount(await buildSnapshot(), "cx");
    expect(codex.fields.baseUrl).toBe("https://old.example.com/v1");
  });

  test("writes codex edits to the registry, auth file and config.toml", async () => {
    await seedCodexAccount("cx");
    await seedAliases([
      {
        alias: "cx",
        target: { provider: "codex", accountKey: CODEX_ACCOUNT_KEY },
        createdAt: 1,
      },
    ]);

    const results = await applyChanges([
      {
        provider: "codex",
        alias: "cx",
        fields: {
          baseUrl: "https://new.example.com/v1",
          model: "gpt-6",
          defaultModel: "gpt-6",
          apiKey: "sk-new-codex-key",
          // Read-only in the UI; a hand-crafted request must not rename it.
          providerName: "hijacked",
        },
      },
    ]);

    expect(results[0]).toEqual({ alias: "cx", ok: true, reapplied: true });

    const snapshot = await buildSnapshot();
    const codex = findAccount(snapshot, "cx");
    expect(codex.fields.baseUrl).toBe("https://new.example.com/v1");
    expect(codex.fields.providerName).toBe("relay");
    expect(codex.fields.apiKey).toBe("sk-new-codex-key");

    const config = await readFile(join(TEST_HOME, ".codex", "config.toml"), "utf-8");
    expect(config).toContain('base_url = "https://new.example.com/v1"');
    expect(config).toContain('experimental_bearer_token = "sk-new-codex-key"');
    expect(config).toContain('model = "gpt-6"');
  });
});

describe("webconfig account creation", () => {
  beforeEach(async () => {
    await resetTestHome();
  });

  test("creates a Claude API key account and makes it active", async () => {
    await setActiveClaudeProfile(null);
    await seedAliases([]);

    await createAccount({
      provider: "claude",
      alias: "deepseek",
      fields: {
        apiKey: "sk-new-deepseek",
        baseUrl: "https://api.deepseek.com/anthropic",
        model: "deepseek-v4-pro",
        defaultHaikuModel: "deepseek-v4-flash",
        subagentModel: "deepseek-v4-flash",
      },
      env: { CLAUDE_CODE_EFFORT_LEVEL: "max" },
    });

    const snapshot = await buildSnapshot();
    const account = findAccount(snapshot, "deepseek");
    expect(account.isActive).toBe(true);
    expect(account.fields.model).toBe("deepseek-v4-pro");
    expect(account.env).toEqual({ CLAUDE_CODE_EFFORT_LEVEL: "max" });

    // Same as `add`: the new account takes over the global Claude routing.
    expect((await readSettings()).env).toMatchObject({
      ANTHROPIC_API_KEY: "sk-new-deepseek",
      ANTHROPIC_BASE_URL: "https://api.deepseek.com/anthropic",
      CLAUDE_CODE_SUBAGENT_MODEL: "deepseek-v4-flash",
      CLAUDE_CODE_EFFORT_LEVEL: "max",
    });
    expect(JSON.parse(await readFile(CLAUDE_STATE_FILE, "utf-8"))).toEqual({
      active: "deepseek",
    });
  });

  test("creates a Codex relay account and writes config.toml", async () => {
    await seedAliases([]);

    await createAccount({
      provider: "codex",
      alias: "relay",
      fields: {
        apiKey: "sk-relay-key",
        providerType: "custom",
        providerName: "relay",
        baseUrl: "https://newrelay.example.com/v1",
        model: "gpt-6",
        envKey: "OPENAI_API_KEY",
        defaultModel: "gpt-6",
      },
    });

    const snapshot = await buildSnapshot();
    const account = findAccount(snapshot, "relay");
    expect(account.isActive).toBe(true);
    expect(account.fields.baseUrl).toBe("https://newrelay.example.com/v1");

    const config = await readFile(join(TEST_HOME, ".codex", "config.toml"), "utf-8");
    expect(config).toContain('base_url = "https://newrelay.example.com/v1"');
    expect(config).toContain('model = "gpt-6"');
    expect(config).toContain('experimental_bearer_token = "sk-relay-key"');
  });

  test("uses the relay's model as its default model", async () => {
    await seedAliases([]);
    // The page sends no separate default model for a relay, mirroring the CLI
    // (which prompts for one model and uses it for both). Asserting the
    // endpoint copies it keeps a relay from being created pointing at gpt-5.4.
    await createAccount({
      provider: "codex",
      alias: "relay",
      fields: {
        apiKey: "sk-relay",
        providerType: "custom",
        providerName: "deepseekrelay",
        baseUrl: "https://api.deepseek.com/v1",
        model: "deepseek-v4-pro",
        envKey: "OPENAI_API_KEY",
        defaultModel: "deepseek-v4-pro",
      },
    });

    const registry = JSON.parse(
      await readFile(join(TEST_HOME, ".codex", "accounts", "registry.json"), "utf-8"),
    );
    expect(registry.accounts[0].default_model).toBe("deepseek-v4-pro");
  });

  test("accepts the official Codex provider without relay fields", async () => {
    await seedAliases([]);
    // The page hides the relay fields for the official provider, so an empty
    // base URL must not be treated as invalid input.
    await createAccount({
      provider: "codex",
      alias: "official",
      fields: {
        apiKey: "sk-official",
        providerType: "official",
        defaultModel: "gpt-5.4",
      },
    });

    const account = findAccount(await buildSnapshot(), "official");
    expect(account.fields.providerName).toBeUndefined();
    const config = await readFile(join(TEST_HOME, ".codex", "config.toml"), "utf-8");
    expect(config).not.toContain("model_provider = ");
  });

  test("refuses a Codex create that leaves the provider type unset", async () => {
    await seedAliases([]);

    // Regression: the page used to omit the select's value, and the endpoint
    // then defaulted to "official" — silently dropping the relay's base URL and
    // per-key routing while still reporting success.
    await expect(
      createAccount({
        provider: "codex",
        alias: "mystery",
        fields: {
          apiKey: "sk-mystery",
          providerName: "relay",
          baseUrl: "https://relay.example.com/v1",
          model: "gpt-6",
          envKey: "OPENAI_API_KEY",
          defaultModel: "gpt-6",
        },
      }),
    ).rejects.toThrow("Provider 类型");

    expect((await buildSnapshot()).codex).toEqual([]);
  });

  test("rejects a bad custom env key instead of silently dropping it", async () => {
    await seedAliases([]);

    // The edit path already refuses these; creating must not quietly discard a
    // variable the user typed and the form reported as saved.
    await expect(
      createAccount({
        provider: "claude",
        alias: "envy",
        fields: { apiKey: "sk-envy" },
        env: { "lower-case": "1" },
      }),
    ).rejects.toThrow("无效");

    await expect(
      createAccount({
        provider: "claude",
        alias: "envy",
        fields: { apiKey: "sk-envy" },
        env: { ANTHROPIC_BASE_URL: "https://x.example.com" },
      }),
    ).rejects.toThrow("专门的输入框");

    expect((await buildSnapshot()).claude).toEqual([]);
  });

  test("names the relay model field when a relay create omits it", async () => {
    await seedAliases([]);

    // A relay's default model is derived from its provider model, so an empty
    // model must not be reported as a missing "默认模型" the form never showed.
    await expect(
      createAccount({
        provider: "codex",
        alias: "relay",
        fields: {
          apiKey: "sk-relay",
          providerType: "custom",
          providerName: "deepseekrelay",
          baseUrl: "https://api.deepseek.com/v1",
          model: "",
          envKey: "OPENAI_API_KEY",
          defaultModel: "",
        },
      }),
    ).rejects.toThrow("Provider 模型不能为空");
  });

  test("rejects bad input before creating anything", async () => {
    await setActiveClaudeProfile(null);
    await seedAliases([
      {
        alias: "taken",
        target: { provider: "claude", profileName: "taken" },
        createdAt: 1,
      },
    ]);

    const attempt = async (alias: string, fields: Record<string, string>) => {
      await expect(
        createAccount({ provider: "claude", alias, fields }),
      ).rejects.toThrow();
    };

    await attempt("taken", { apiKey: "sk-x" });
    await attempt("purge", { apiKey: "sk-x" });
    await attempt("with space", { apiKey: "sk-x" });
    await attempt("", { apiKey: "sk-x" });
    await attempt("no-key", { apiKey: "   " });
    await attempt("bad-url", {
      apiKey: "sk-x",
      baseUrl: "not a url",
    });

    // Nothing was written for any of the rejected attempts.
    const snapshot = await buildSnapshot();
    expect(snapshot.claude.map((a) => a.alias)).toEqual(["taken"]);
    expect(await pathExists(claudeProfileDir("bad-url"))).toBe(false);
  });

  test("refuses to import the same Codex API key twice", async () => {
    await seedAliases([]);
    const fields = {
      apiKey: "sk-shared-key",
      providerType: "official",
      defaultModel: "gpt-5.4",
    };

    await createAccount({ provider: "codex", alias: "first", fields });
    await expect(
      createAccount({ provider: "codex", alias: "second", fields }),
    ).rejects.toThrow("已经导入为");

    expect((await buildSnapshot()).codex.map((a) => a.alias)).toEqual(["first"]);
  });
});

describe("webconfig server", () => {
  let server: WebConfigServer;

  beforeEach(async () => {
    await resetTestHome();
    await seedAliases([]);
    server = await startWebConfigServer();
  });

  afterEach(async () => {
    await server.close();
  });

  test("serves the page only with a valid token", async () => {
    const anonymous = await fetch(`http://127.0.0.1:${server.port}/`);
    expect(anonymous.status).toBe(403);

    const wrong = await fetch(`http://127.0.0.1:${server.port}/?t=nope`);
    expect(wrong.status).toBe(403);

    const ok = await fetch(server.url);
    expect(ok.status).toBe(200);
    expect(ok.headers.get("content-type")).toContain("text/html");
    expect(await ok.text()).toContain("claudex-switch 配置");
  });

  test("rejects a foreign Host header", async () => {
    const res = await fetch(`http://127.0.0.1:${server.port}/api/accounts`, {
      headers: {
        authorization: `Bearer ${server.token}`,
        host: "evil.example.com",
      },
    });
    expect(res.status).toBe(403);
  });

  test("round-trips a save through the HTTP API", async () => {
    await writeClaudeProfile("web", { type: "api-key", apiKey: "sk-web" });
    await setActiveClaudeProfile(null);
    await seedAliases([
      {
        alias: "web",
        target: { provider: "claude", profileName: "web" },
        createdAt: 1,
      },
    ]);

    const listed = await fetch(`http://127.0.0.1:${server.port}/api/accounts`, {
      headers: { authorization: `Bearer ${server.token}` },
    });
    const snapshot = (await listed.json()) as WebConfigSnapshot;
    expect(findAccount(snapshot, "web").fields.apiKey).toBe("sk-web");

    const saved = await fetch(`http://127.0.0.1:${server.port}/api/accounts`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${server.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        changes: [
          {
            provider: "claude",
            alias: "web",
            fields: { apiKey: "sk-web", model: "some-model" },
            env: { CLAUDE_CODE_EFFORT_LEVEL: "max" },
          },
        ],
      }),
    });
    const body = (await saved.json()) as {
      results: { ok: boolean }[];
      snapshot: WebConfigSnapshot;
    };
    expect(body.results[0].ok).toBe(true);
    expect(findAccount(body.snapshot, "web").env).toEqual({
      CLAUDE_CODE_EFFORT_LEVEL: "max",
    });
  });

  test("renames and deletes through the HTTP API", async () => {
    await writeClaudeProfile("erased", {
      type: "api-key",
      apiKey: "sk-erased",
    });
    await setActiveClaudeProfile(null);
    await seedAliases([
      {
        alias: "old",
        target: { provider: "claude", profileName: "erased" },
        createdAt: 1,
      },
    ]);

    const post = async (path: string, body: unknown) => {
      const res = await fetch(`http://127.0.0.1:${server.port}${path}`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${server.token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      });
      return { status: res.status, body: (await res.json()) as any };
    };

    const renamed = await post("/api/accounts/rename", {
      alias: "old",
      newAlias: "new",
    });
    expect(renamed.body.ok).toBe(true);
    expect(renamed.body.alias).toBe("new");
    expect(renamed.body.snapshot.claude[0].alias).toBe("new");

    const bad = await post("/api/accounts/rename", {
      alias: "new",
      newAlias: "purge",
    });
    expect(bad.body.ok).toBe(false);
    expect(bad.body.error).toContain("保留命令");

    const deleted = await post("/api/accounts/delete", { alias: "new" });
    expect(deleted.body.ok).toBe(true);
    expect(deleted.body.removedAliases).toEqual(["new"]);
    expect(deleted.body.snapshot.claude).toEqual([]);
    expect(await pathExists(claudeProfileDir("erased"))).toBe(false);

    const missing = await post("/api/accounts/delete", { alias: "new" });
    expect(missing.body.ok).toBe(false);
    expect(missing.body.error).toContain("不存在");

    const malformed = await post("/api/accounts/delete", {});
    expect(malformed.status).toBe(400);
  });

  test("rejects a malformed save body", async () => {
    const res = await fetch(`http://127.0.0.1:${server.port}/api/accounts`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${server.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ nope: true }),
    });
    expect(res.status).toBe(400);
  });
});

describe("webconfig args", () => {
  test("parses port and open flags", () => {
    expect(parseWebConfigArgs([])).toEqual({ open: true });
    expect(parseWebConfigArgs(["--no-open"])).toEqual({ open: false });
    expect(parseWebConfigArgs(["--port", "8899"])).toEqual({
      open: true,
      port: 8899,
    });
    expect(() => parseWebConfigArgs(["--port", "abc"])).toThrow();
    expect(() => parseWebConfigArgs(["--what"])).toThrow();
  });
});
