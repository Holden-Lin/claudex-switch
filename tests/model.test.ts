import { beforeEach, describe, expect, spyOn, test } from "bun:test";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname } from "path";
import { saveAliases } from "../src/alias/store";
import { model } from "../src/commands/model";
import {
  CLAUDE_JSON,
  CODEX_CONFIG_FILE,
  CREDENTIALS_FILE,
  SETTINGS_FILE,
} from "../src/lib/paths";
import { readJson } from "../src/lib/fs";
import { writeCredentials } from "../src/providers/claude/credentials";
import {
  addApiKeyProfile,
  addOAuthProfile,
  getProfileData,
} from "../src/providers/claude/profiles";
import { saveAccountAuth } from "../src/providers/codex/auth";
import { loadRegistry, saveRegistry } from "../src/providers/codex/registry";
import { resetTestHome } from "./helpers";
import type {
  AliasRegistry,
  CodexRegistry,
  CredentialsFile,
  OAuthAccount,
} from "../src/types";

describe("model command", () => {
  beforeEach(async () => {
    await resetTestHome();
    process.env.CLAUDEX_FORCE_FILE_CREDENTIALS = "1";
    spyOn(console, "log").mockImplementation(() => {});
    spyOn(console, "error").mockImplementation(() => {});
  });

  test("updates an active Claude OAuth profile default model", async () => {
    const creds: CredentialsFile = {
      claudeAiOauth: {
        accessToken: "oauth-access",
        refreshToken: "oauth-refresh",
        expiresAt: 2,
        scopes: ["org:read"],
        subscriptionType: "pro",
      },
    };
    const account: OAuthAccount = {
      accountUuid: "acct-oauth",
      emailAddress: "oauth@example.com",
      organizationUuid: "org-oauth",
    };

    await mkdir(dirname(CREDENTIALS_FILE), { recursive: true });
    await writeCredentials(creds, CREDENTIALS_FILE);
    await writeFile(
      CLAUDE_JSON,
      JSON.stringify({ oauthAccount: account }, null, 2),
    );
    await addOAuthProfile("oauth-model");
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "oauth-model",
          target: { provider: "claude", profileName: "oauth-model" },
          createdAt: 1,
        },
      ],
    });

    await model("oauth-model", "claude-sonnet-4-20250514");

    expect(await getProfileData("oauth-model")).toEqual({
      type: "oauth",
      defaultModel: "claude-sonnet-4-20250514",
    });
    expect(await readJson<Record<string, unknown>>(SETTINGS_FILE, {})).toEqual({
      model: "claude-sonnet-4-20250514",
    });
  });

  test("updates an active Claude API key profile default model", async () => {
    await addApiKeyProfile("api-model", { apiKey: "sk-ant-live" });
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "api-model",
          target: { provider: "claude", profileName: "api-model" },
          createdAt: 1,
        },
      ],
    });

    await model("api-model", "claude-opus-4-20250514");

    expect(await getProfileData("api-model")).toEqual({
      type: "api-key",
      apiKey: "sk-ant-live",
      model: "claude-opus-4-20250514",
    });
    expect(await readJson<Record<string, unknown>>(SETTINGS_FILE, {})).toEqual({
      env: {
        ANTHROPIC_API_KEY: "sk-ant-live",
        ANTHROPIC_MODEL: "claude-opus-4-20250514",
      },
      model: "claude-opus-4-20250514",
    });
  });

  test("expands a Claude opus shorthand into the canonical model id", async () => {
    await addApiKeyProfile("api-shorthand", { apiKey: "sk-ant-live" });
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "api-shorthand",
          target: { provider: "claude", profileName: "api-shorthand" },
          createdAt: 1,
        },
      ],
    });

    await model("api-shorthand", "4.8");

    expect(await getProfileData("api-shorthand")).toEqual({
      type: "api-key",
      apiKey: "sk-ant-live",
      model: "claude-opus-4-8",
    });
  });

  test("updates an active Codex API key account default model", async () => {
    const accountKey = "apikey::custom";
    const aliases: AliasRegistry = {
      version: 1,
      aliases: [
        {
          alias: "custom-cx",
          target: { provider: "codex", accountKey },
          createdAt: 1,
        },
      ],
    };
    await saveAliases(aliases);

    const registry: CodexRegistry = {
      schema_version: 3,
      active_account_key: accountKey,
      active_account_activated_at_ms: null,
      auto_switch: {
        enabled: false,
        threshold_5h_percent: 10,
        threshold_weekly_percent: 5,
      },
      api: { usage: true, account: true },
      accounts: [
        {
          account_key: accountKey,
          chatgpt_account_id: "",
          chatgpt_user_id: "",
          email: "",
          alias: "custom-cx",
          account_name: null,
          plan: null,
          auth_mode: "apikey",
          default_model: "gpt-5.4",
          api_provider: {
            type: "custom",
            name: "admin",
            base_url: "https://newapi.hybaliez.com/v1",
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
    await saveAccountAuth(accountKey, {
      auth_mode: "apikey",
      OPENAI_API_KEY: "sk-test",
    });

    await model("custom-cx", "gpt-4.1");

    const savedRegistry = await loadRegistry();
    expect(savedRegistry.accounts[0]?.default_model).toBe("gpt-4.1");

    const config = await readFile(CODEX_CONFIG_FILE, "utf-8");
    expect(config).toContain('model_provider = "admin"');
    expect(config).toContain('model = "gpt-4.1"');
    expect(config).toContain('experimental_bearer_token = "sk-test"');
  });
});
