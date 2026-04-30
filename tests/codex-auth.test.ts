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
} from "../src/providers/codex/auth";
import type { CodexAuthFile } from "../src/types";
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
});
