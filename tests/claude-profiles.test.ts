import { beforeEach, describe, expect, test } from "bun:test";
import { mkdir, writeFile } from "fs/promises";
import { dirname } from "path";
import {
  CLAUDE_JSON,
  CREDENTIALS_FILE,
  SETTINGS_FILE,
  claudeProfileAccountFile,
  claudeProfileCredentials,
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

  test("keeps freshly refreshed live credentials when re-activating the same account", async () => {
    const snapshotCreds: CredentialsFile = {
      claudeAiOauth: {
        accessToken: "snapshot-access",
        refreshToken: "snapshot-refresh",
        expiresAt: 1,
        scopes: ["org:read"],
        subscriptionType: "max",
      },
    };
    const account: OAuthAccount = {
      accountUuid: "acct-holden",
      emailAddress: "holden@example.com",
      organizationUuid: "org-holden",
    };

    await mkdir(dirname(CREDENTIALS_FILE), { recursive: true });
    await writeCredentials(snapshotCreds, CREDENTIALS_FILE);
    await writeFile(
      CLAUDE_JSON,
      JSON.stringify({ oauthAccount: account }, null, 2),
    );
    await addOAuthProfile("holden");

    // A running session for the same account rotates its refresh token; the
    // live store now holds fresher credentials than the on-disk snapshot.
    const rotatedCreds: CredentialsFile = {
      claudeAiOauth: {
        accessToken: "rotated-access",
        refreshToken: "rotated-refresh",
        expiresAt: 999,
        scopes: ["org:read"],
        subscriptionType: "max",
      },
    };
    await writeCredentials(rotatedCreds, CREDENTIALS_FILE);
    // Force re-activation (mimics `--model` drift making the profile look
    // unapplied) so switchProfile does not early-return.
    await writeFile(
      SETTINGS_FILE,
      JSON.stringify({ model: "claude-opus-4-8" }, null, 2),
    );

    await switchProfile("holden");

    // Live credentials must stay the rotated (valid) ones, not be clobbered by
    // the stale snapshot, otherwise the running session is forced to re-login.
    expect(
      await readJson<CredentialsFile | null>(CREDENTIALS_FILE, null),
    ).toEqual(rotatedCreds);
    // The on-disk snapshot is refreshed from the live credentials.
    expect(
      await readJson<CredentialsFile | null>(
        claudeProfileCredentials("holden"),
        null,
      ),
    ).toEqual(rotatedCreds);
    expect(await readJson<Record<string, unknown>>(SETTINGS_FILE, {})).toEqual(
      {},
    );
  });

  test("restores the target org when two profiles share a login", async () => {
    // Profile for org 1.
    const org1Creds: CredentialsFile = {
      claudeAiOauth: {
        accessToken: "org1-access",
        refreshToken: "org1-refresh",
        expiresAt: 2,
        scopes: ["org:read"],
        subscriptionType: "max",
      },
    };
    const org1Account: OAuthAccount = {
      accountUuid: "acct-shared",
      emailAddress: "shared@example.com",
      organizationUuid: "org-1",
    };
    await mkdir(dirname(CREDENTIALS_FILE), { recursive: true });
    await writeCredentials(org1Creds, CREDENTIALS_FILE);
    await writeFile(
      CLAUDE_JSON,
      JSON.stringify({ oauthAccount: org1Account }, null, 2),
    );
    await addOAuthProfile("work-org1");

    // Profile for org 2 under the same login — becomes the active profile.
    const org2Creds: CredentialsFile = {
      claudeAiOauth: {
        accessToken: "org2-access",
        refreshToken: "org2-refresh",
        expiresAt: 2,
        scopes: ["org:read"],
        subscriptionType: "max",
      },
    };
    const org2Account: OAuthAccount = {
      accountUuid: "acct-shared",
      emailAddress: "shared@example.com",
      organizationUuid: "org-2",
    };
    await writeCredentials(org2Creds, CREDENTIALS_FILE);
    await writeFile(
      CLAUDE_JSON,
      JSON.stringify({ oauthAccount: org2Account }, null, 2),
    );
    await addOAuthProfile("work-org2");

    // Switch back to org 1: the live session is still org 2 (same login), so we
    // must restore org 1's snapshot rather than keep the org 2 session.
    await switchProfile("work-org1");

    expect(
      await readJson<CredentialsFile | null>(CREDENTIALS_FILE, null),
    ).toEqual(org1Creds);
    expect(await readJson<{ oauthAccount?: OAuthAccount }>(CLAUDE_JSON, {}))
      .toEqual({ oauthAccount: org1Account });
    // The org 1 snapshot must not be corrupted with the org 2 session.
    expect(
      await readJson<CredentialsFile | null>(
        claudeProfileCredentials("work-org1"),
        null,
      ),
    ).toEqual(org1Creds);
  });

  test("reapplies an active profile when the live org drifts under the same login", async () => {
    const targetCreds: CredentialsFile = {
      claudeAiOauth: {
        accessToken: "target-access",
        refreshToken: "target-refresh",
        expiresAt: 2,
        scopes: ["org:read"],
        subscriptionType: "max",
      },
    };
    const targetAccount: OAuthAccount = {
      accountUuid: "acct-shared",
      emailAddress: "shared@example.com",
      organizationUuid: "org-target",
    };

    await mkdir(dirname(CREDENTIALS_FILE), { recursive: true });
    await writeCredentials(targetCreds, CREDENTIALS_FILE);
    await writeFile(
      CLAUDE_JSON,
      JSON.stringify({ oauthAccount: targetAccount }, null, 2),
    );
    await addOAuthProfile("holden");

    const driftedCreds: CredentialsFile = {
      claudeAiOauth: {
        accessToken: "drifted-access",
        refreshToken: "drifted-refresh",
        expiresAt: 999,
        scopes: ["org:read"],
        subscriptionType: "max",
      },
    };
    const driftedAccount: OAuthAccount = {
      accountUuid: "acct-shared",
      emailAddress: "shared@example.com",
      organizationUuid: "org-drifted",
    };
    await writeCredentials(driftedCreds, CREDENTIALS_FILE);
    await writeFile(
      CLAUDE_JSON,
      JSON.stringify({ oauthAccount: driftedAccount }, null, 2),
    );

    await switchProfile("holden");

    expect(
      await readJson<CredentialsFile | null>(CREDENTIALS_FILE, null),
    ).toEqual(targetCreds);
    expect(await readJson<{ oauthAccount?: OAuthAccount }>(CLAUDE_JSON, {}))
      .toEqual({ oauthAccount: targetAccount });
  });

  test("does not corrupt a stale active profile snapshot when switching away", async () => {
    const holdenCreds: CredentialsFile = {
      claudeAiOauth: {
        accessToken: "holden-access",
        refreshToken: "holden-refresh",
        expiresAt: 2,
        scopes: ["org:read"],
        subscriptionType: "max",
      },
    };
    const holdenAccount: OAuthAccount = {
      accountUuid: "acct-shared",
      emailAddress: "shared@example.com",
      organizationUuid: "org-holden",
    };

    await mkdir(dirname(CREDENTIALS_FILE), { recursive: true });
    await writeCredentials(holdenCreds, CREDENTIALS_FILE);
    await writeFile(
      CLAUDE_JSON,
      JSON.stringify({ oauthAccount: holdenAccount }, null, 2),
    );
    await addOAuthProfile("holden");

    const satoshiCreds: CredentialsFile = {
      claudeAiOauth: {
        accessToken: "satoshi-access",
        refreshToken: "satoshi-refresh",
        expiresAt: 2,
        scopes: ["org:read"],
        subscriptionType: "pro",
      },
    };
    const satoshiAccount: OAuthAccount = {
      accountUuid: "acct-satoshi",
      emailAddress: "satoshi@example.com",
      organizationUuid: "org-satoshi",
    };
    await writeCredentials(satoshiCreds, CREDENTIALS_FILE);
    await writeFile(
      CLAUDE_JSON,
      JSON.stringify({ oauthAccount: satoshiAccount }, null, 2),
    );
    await addOAuthProfile("satoshi");

    await switchProfile("holden");

    const driftedCreds: CredentialsFile = {
      claudeAiOauth: {
        accessToken: "drifted-access",
        refreshToken: "drifted-refresh",
        expiresAt: 999,
        scopes: ["org:read"],
        subscriptionType: "max",
      },
    };
    const driftedAccount: OAuthAccount = {
      accountUuid: "acct-shared",
      emailAddress: "shared@example.com",
      organizationUuid: "org-drifted",
    };
    await writeCredentials(driftedCreds, CREDENTIALS_FILE);
    await writeFile(
      CLAUDE_JSON,
      JSON.stringify({ oauthAccount: driftedAccount }, null, 2),
    );

    await switchProfile("satoshi");

    expect(
      await readJson<CredentialsFile | null>(
        claudeProfileCredentials("holden"),
        null,
      ),
    ).toEqual(holdenCreds);
    expect(
      await readJson<OAuthAccount | null>(
        claudeProfileAccountFile("holden"),
        null,
      ),
    ).toEqual(holdenAccount);
    expect(
      await readJson<CredentialsFile | null>(CREDENTIALS_FILE, null),
    ).toEqual(satoshiCreds);
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

  test("keeps active Claude auth single-mode when switching between oauth and api key", async () => {
    const creds: CredentialsFile = {
      claudeAiOauth: {
        accessToken: "oauth-access",
        refreshToken: "oauth-refresh",
        expiresAt: 2,
        scopes: ["org:read"],
        subscriptionType: "max",
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
    await addOAuthProfile("oauth");

    await addApiKeyProfile("api", { apiKey: "sk-ant-live" });

    expect(
      await readJson<CredentialsFile | null>(CREDENTIALS_FILE, null),
    ).toBeNull();
    expect(await readJson<Record<string, unknown>>(CLAUDE_JSON, {})).toEqual(
      {},
    );
    expect(await readJson<Record<string, unknown>>(SETTINGS_FILE, {})).toEqual({
      env: { ANTHROPIC_API_KEY: "sk-ant-live" },
    });

    await switchProfile("oauth");

    expect(
      await readJson<CredentialsFile | null>(CREDENTIALS_FILE, null),
    ).toEqual(creds);
    expect(await readJson<{ oauthAccount?: OAuthAccount }>(CLAUDE_JSON, {}))
      .toEqual({ oauthAccount: account });
    expect(await readJson<Record<string, unknown>>(SETTINGS_FILE, {})).toEqual(
      {},
    );
  });

  test("applies an oauth profile default model without API env", async () => {
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
    await addOAuthProfile("oauth-model", CREDENTIALS_FILE, {
      defaultModel: "claude-sonnet-4-20250514",
    });

    expect(await readJson<Record<string, unknown>>(SETTINGS_FILE, {})).toEqual({
      model: "claude-sonnet-4-20250514",
    });

    await switchProfile("oauth-model");

    expect(await readJson<Record<string, unknown>>(SETTINGS_FILE, {})).toEqual({
      model: "claude-sonnet-4-20250514",
    });
  });

  test("reapplies an active api key profile when legacy oauth auth remains", async () => {
    await addApiKeyProfile("api", { apiKey: "sk-ant-live" });

    const staleCreds: CredentialsFile = {
      claudeAiOauth: {
        accessToken: "stale-access",
        refreshToken: "stale-refresh",
        expiresAt: 2,
        scopes: ["org:read"],
        subscriptionType: "max",
      },
    };
    const staleAccount: OAuthAccount = {
      accountUuid: "acct-stale",
      emailAddress: "stale@example.com",
      organizationUuid: "org-stale",
    };

    await mkdir(dirname(CREDENTIALS_FILE), { recursive: true });
    await writeCredentials(staleCreds, CREDENTIALS_FILE);
    await writeFile(
      CLAUDE_JSON,
      JSON.stringify({ oauthAccount: staleAccount }, null, 2),
    );

    await switchProfile("api");

    expect(
      await readJson<CredentialsFile | null>(CREDENTIALS_FILE, null),
    ).toBeNull();
    expect(await readJson<Record<string, unknown>>(CLAUDE_JSON, {})).toEqual(
      {},
    );
    expect(await readJson<Record<string, unknown>>(SETTINGS_FILE, {})).toEqual({
      env: { ANTHROPIC_API_KEY: "sk-ant-live" },
    });
  });
});
