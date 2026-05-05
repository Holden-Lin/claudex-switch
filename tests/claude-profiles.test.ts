import { beforeEach, describe, expect, test } from "bun:test";
import { mkdir, writeFile } from "fs/promises";
import { dirname } from "path";
import {
  CLAUDE_JSON,
  CREDENTIALS_FILE,
  SETTINGS_FILE,
} from "../src/lib/paths";
import { readJson } from "../src/lib/fs";
import { writeCredentials } from "../src/providers/claude/credentials";
import {
  addOAuthProfile,
  addApiKeyProfile,
  switchProfile,
} from "../src/providers/claude/profiles";
import { resetTestHome } from "./helpers";
import type {
  ClaudeApiProfileConfig,
  CredentialsFile,
  OAuthAccount,
} from "../src/types";

describe("claude profiles", () => {
  beforeEach(async () => {
    await resetTestHome();
    process.env.CLAUDEX_FORCE_FILE_CREDENTIALS = "1";
  });

  test("reapplies an active oauth profile when the real Claude config drifts", async () => {
    const savedCreds: CredentialsFile = {
      claudeAiOauth: {
        accessToken: "saved-access",
        refreshToken: "saved-refresh",
        expiresAt: 2,
        scopes: ["org:read"],
        subscriptionType: "max",
      },
    };
    const savedAccount: OAuthAccount = {
      accountUuid: "acct-saved",
      emailAddress: "saved@example.com",
      organizationUuid: "org-saved",
    };

    await mkdir(dirname(CREDENTIALS_FILE), { recursive: true });
    await writeCredentials(savedCreds, CREDENTIALS_FILE);
    await writeFile(
      CLAUDE_JSON,
      JSON.stringify({ oauthAccount: savedAccount }, null, 2),
    );
    await addOAuthProfile("holden");

    const driftedCreds: CredentialsFile = {
      claudeAiOauth: {
        accessToken: "other-access",
        refreshToken: "other-refresh",
        expiresAt: 3,
        scopes: ["org:read"],
        subscriptionType: "pro",
      },
    };
    const driftedAccount: OAuthAccount = {
      accountUuid: "acct-other",
      emailAddress: "other@example.com",
      organizationUuid: "org-other",
    };

    await writeCredentials(driftedCreds, CREDENTIALS_FILE);
    await writeFile(
      CLAUDE_JSON,
      JSON.stringify({ oauthAccount: driftedAccount }, null, 2),
    );
    await writeFile(
      SETTINGS_FILE,
      JSON.stringify({
        env: {
          ANTHROPIC_API_KEY: "sk-ant-stale",
          ANTHROPIC_BASE_URL: "https://stale.example.com",
          ANTHROPIC_AUTH_TOKEN: "stale-token",
          ANTHROPIC_MODEL: "opus",
          ANTHROPIC_DEFAULT_SONNET_MODEL: "claude-sonnet-stale",
          ANTHROPIC_DEFAULT_OPUS_MODEL: "claude-opus-stale",
          ANTHROPIC_DEFAULT_HAIKU_MODEL: "claude-haiku-stale",
          KEEP_ME: "1",
        },
        model: "opus",
        theme: "dark",
      }, null, 2),
    );

    await switchProfile("holden");

    expect(
      await readJson<CredentialsFile | null>(CREDENTIALS_FILE, null),
    ).toEqual(savedCreds);
    expect(await readJson<{ oauthAccount?: OAuthAccount }>(CLAUDE_JSON, {}))
      .toEqual({ oauthAccount: savedAccount });
    expect(await readJson<Record<string, unknown>>(SETTINGS_FILE, {})).toEqual({
      env: { KEEP_ME: "1" },
      theme: "dark",
    });
  });

  test("applies the full Claude API config for api-key profiles", async () => {
    const config: ClaudeApiProfileConfig = {
      apiKey: "sk-ant-live",
      baseUrl: "https://proxy.example.com",
      authToken: "proxy-token",
      model: "sonnet",
      defaultSonnetModel: "claude-sonnet-4-20250514",
      defaultOpusModel: "claude-opus-4-20250514",
      defaultHaikuModel: "claude-3-5-haiku-20241022",
    };

    await mkdir(dirname(SETTINGS_FILE), { recursive: true });
    await writeFile(
      SETTINGS_FILE,
      JSON.stringify(
        {
          env: { KEEP_ME: "1", ANTHROPIC_API_KEY: "sk-ant-old" },
          theme: "dark",
        },
        null,
        2,
      ),
    );

    await addApiKeyProfile("api-work", config);

    expect(await readJson<Record<string, unknown>>(SETTINGS_FILE, {})).toEqual({
      env: {
        KEEP_ME: "1",
        ANTHROPIC_API_KEY: "sk-ant-live",
        ANTHROPIC_BASE_URL: "https://proxy.example.com",
        ANTHROPIC_AUTH_TOKEN: "proxy-token",
        ANTHROPIC_MODEL: "sonnet",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "claude-sonnet-4-20250514",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "claude-opus-4-20250514",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "claude-3-5-haiku-20241022",
      },
      model: "sonnet",
      theme: "dark",
    });
  });
});
