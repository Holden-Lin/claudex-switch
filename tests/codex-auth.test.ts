import { beforeEach, describe, expect, test } from "bun:test";
import { mkdir, stat, writeFile } from "fs/promises";
import { dirname } from "path";
import {
  CODEX_AUTH_FILE,
  codexAccountAuthFile,
} from "../src/lib/paths";
import {
  decodeIdToken,
  readActiveAuth,
  readAccountAuth,
  saveAccountAuth,
  snapshotActiveAuth,
  switchToAccount,
  syncActiveAuthSnapshot,
} from "../src/providers/codex/auth";
import type { CodexAuthFile, CodexRegistry } from "../src/types";
import { fileMode, makeJwt, resetTestHome } from "./helpers";

describe("codex auth", () => {
  beforeEach(async () => {
    await resetTestHome();
  });

  test("decodes id tokens with OpenAI auth metadata", () => {
    const token = makeJwt({
      email: "dev@example.com",
      sub: "fallback-user",
      "https://api.openai.com/auth": {
        user_id: "user-1",
        account_id: "account-1",
        plan_type: "team",
      },
    });

    expect(decodeIdToken(token)).toEqual({
      email: "dev@example.com",
      chatgpt_user_id: "user-1",
      chatgpt_account_id: "account-1",
      plan_type: "team",
    });
    expect(decodeIdToken("not-a-jwt")).toBeNull();
  });

  test("decodes current chatgpt claim names and profile email", () => {
    const token = makeJwt({
      "https://api.openai.com/profile": { email: "new@example.com" },
      "https://api.openai.com/auth": {
        chatgpt_user_id: "user-new",
        chatgpt_account_id: "account-new",
        chatgpt_plan_type: "pro",
      },
    });

    expect(decodeIdToken(token)).toEqual({
      email: "new@example.com",
      chatgpt_user_id: "user-new",
      chatgpt_account_id: "account-new",
      plan_type: "pro",
    });
  });

  test("snapshots and saves auth files with restricted permissions", async () => {
    const authData: CodexAuthFile = {
      auth_mode: "chatgpt",
      OPENAI_API_KEY: null,
      tokens: {
        id_token: "header.payload.sig",
        access_token: "access-token",
        refresh_token: "refresh-token",
        account_id: "account-1",
      },
      last_refresh: "2026-04-06T00:00:00.000Z",
    };

    await mkdir(dirname(CODEX_AUTH_FILE), { recursive: true });
    await writeFile(CODEX_AUTH_FILE, JSON.stringify(authData, null, 2));

    const weirdKey = "user::account/with spaces";
    await snapshotActiveAuth(weirdKey);

    const snapshotPath = codexAccountAuthFile(weirdKey);
    expect(await readAccountAuth(weirdKey)).toEqual(authData);
    expect(fileMode((await stat(snapshotPath)).mode)).toBe(0o600);

    const savedKey = "user::account-2";
    await saveAccountAuth(savedKey, authData);
    expect(await readAccountAuth(savedKey)).toEqual(authData);
    expect(fileMode((await stat(codexAccountAuthFile(savedKey))).mode)).toBe(
      0o600,
    );
  });

  test("normalizes api key auth files to Codex CLI format", async () => {
    const oldApiAuth: CodexAuthFile = {
      auth_mode: "apikey",
      OPENAI_API_KEY: "sk-test",
      tokens: {
        id_token: "",
        access_token: "",
        refresh_token: "",
        account_id: "",
      },
      last_refresh: "2026-04-30T00:00:00.000Z",
    };

    await saveAccountAuth("apikey::test", oldApiAuth);
    expect(await readAccountAuth("apikey::test")).toEqual({
      auth_mode: "apikey",
      OPENAI_API_KEY: "sk-test",
    });

    await switchToAccount("apikey::test");
    expect(await readActiveAuth()).toEqual({
      auth_mode: "apikey",
      OPENAI_API_KEY: "sk-test",
    });
  });

  test("syncs only a matching active account back to its snapshot", async () => {
    const accountKey = "user-1::account-1";
    const registry: CodexRegistry = {
      schema_version: 3,
      active_account_key: accountKey,
      active_account_activated_at_ms: 1,
      auto_switch: {
        enabled: false,
        threshold_5h_percent: 10,
        threshold_weekly_percent: 5,
      },
      api: { usage: true, account: true },
      accounts: [
        {
          account_key: accountKey,
          chatgpt_account_id: "account-1",
          chatgpt_user_id: "user-1",
          email: "one@example.com",
          alias: "one",
          account_name: null,
          plan: "plus",
          auth_mode: "chatgpt",
          created_at: 1,
          last_used_at: null,
          last_usage: null,
          last_usage_at: null,
          last_local_rollout: null,
        },
      ],
    };
    const auth = (user: string, refresh: string): CodexAuthFile => ({
      auth_mode: "chatgpt",
      OPENAI_API_KEY: null,
      tokens: {
        id_token: makeJwt({ sub: user }),
        access_token: "access",
        refresh_token: refresh,
        account_id: "account-1",
      },
      last_refresh: "2026-08-02T00:00:00.000Z",
    });
    await saveAccountAuth(accountKey, auth("user-1", "old"));
    await mkdir(dirname(CODEX_AUTH_FILE), { recursive: true });
    await writeFile(CODEX_AUTH_FILE, JSON.stringify(auth("user-1", "new")));

    expect(await syncActiveAuthSnapshot(registry)).toBe(true);
    expect(await readAccountAuth(accountKey)).toEqual(auth("user-1", "new"));

    await writeFile(CODEX_AUTH_FILE, JSON.stringify(auth("other-user", "bad")));
    expect(await syncActiveAuthSnapshot(registry)).toBe(false);
    expect(await readAccountAuth(accountKey)).toEqual(auth("user-1", "new"));
  });
});
