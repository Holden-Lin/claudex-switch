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
  switchProfile,
} from "../src/providers/claude/profiles";
import { resetTestHome } from "./helpers";
import type { CredentialsFile, OAuthAccount } from "../src/types";

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
          KEEP_ME: "1",
        },
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
});
