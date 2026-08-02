import { beforeEach, describe, expect, test } from "bun:test";
import { EventEmitter } from "events";
import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { PassThrough } from "stream";
import type { ChildProcess } from "child_process";
import { CODEX_AUTH_FILE } from "../src/lib/paths";
import {
  readActiveAuth,
  readAccountAuth,
  saveAccountAuth,
} from "../src/providers/codex/auth";
import {
  CodexRateLimitsReadError,
  readCodexRateLimits,
  type CodexRateLimitsResponse,
} from "../src/providers/codex/app-server";
import { saveRegistry } from "../src/providers/codex/registry";
import {
  fetchCodexUsage,
  parseRateLimitsResponse,
} from "../src/providers/codex/usage";
import { formatUsage } from "../src/lib/ui";
import type { CodexAuthFile, CodexRegistry } from "../src/types";
import { makeJwt, resetTestHome } from "./helpers";

const accountKey = "user-1::acct-1";

function makeAuth(refreshToken: string): CodexAuthFile {
  return {
    auth_mode: "chatgpt",
    OPENAI_API_KEY: null,
    tokens: {
      id_token: makeJwt({
        "https://api.openai.com/profile": { email: "one@example.com" },
        "https://api.openai.com/auth": {
          chatgpt_user_id: "user-1",
          chatgpt_account_id: "acct-1",
          chatgpt_plan_type: "plus",
        },
      }),
      access_token: makeJwt({ sub: "user-1" }),
      refresh_token: refreshToken,
      account_id: "acct-1",
    },
    last_refresh: "2026-08-02T00:00:00.000Z",
  };
}

function registry(): CodexRegistry {
  return {
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
        chatgpt_account_id: "acct-1",
        chatgpt_user_id: "user-1",
        email: "one@example.com",
        alias: "one",
        account_name: null,
        plan: "plus",
        auth_mode: "chatgpt",
        created_at: 1,
        last_used_at: 1,
        last_usage: null,
        last_usage_at: null,
        last_local_rollout: null,
      },
    ],
  };
}

const rateLimits: CodexRateLimitsResponse = {
  rateLimits: {
    primary: {
      usedPercent: 25,
      windowDurationMins: 300,
      resetsAt: 1_800_000_000,
    },
    secondary: {
      usedPercent: 40,
      windowDurationMins: 10_080,
      resetsAt: 1_800_100_000,
    },
  },
};

describe("Codex App Server usage", () => {
  beforeEach(resetTestHome);

  test("keeps account/rateLimits values as used and displays remaining quota", () => {
    const usage = parseRateLimitsResponse(rateLimits);

    expect(usage).toEqual({
      fiveHourUsedPercent: 25,
      fiveHourResetsAt: 1_800_000_000_000,
      weeklyUsedPercent: 40,
      weeklyResetsAt: 1_800_100_000_000,
    });
    expect(formatUsage(usage, null)).toContain("5h 75%");
    expect(formatUsage(usage, null)).toContain("wk 60%");
  });

  test("uses the official initialize and account/rateLimits protocol in isolation", async () => {
    const oldAuth = makeAuth("refresh-old");
    const refreshedAuth = makeAuth("refresh-new");
    const requests: Array<Record<string, unknown>> = [];
    let isolatedHome = "";

    const result = await readCodexRateLimits(
      oldAuth,
      (command, args, options) => {
        expect(command).toBe("codex");
        expect(args).toEqual([
          "app-server",
          "-c",
          'cli_auth_credentials_store="file"',
        ]);
        expect(options.env.OPENAI_API_KEY).toBeUndefined();
        isolatedHome = options.env.CODEX_HOME ?? "";

        const stdin = new PassThrough();
        const stdout = new PassThrough();
        const stderr = new PassThrough();
        const proc = new EventEmitter() as EventEmitter & {
          stdin: PassThrough;
          stdout: PassThrough;
          stderr: PassThrough;
          kill: () => boolean;
        };
        proc.stdin = stdin;
        proc.stdout = stdout;
        proc.stderr = stderr;
        proc.kill = () => true;

        let input = "";
        stdin.on("data", (chunk) => {
          input += String(chunk);
          while (input.includes("\n")) {
            const index = input.indexOf("\n");
            const line = input.slice(0, index);
            input = input.slice(index + 1);
            if (!line) continue;
            const request = JSON.parse(line) as Record<string, unknown>;
            requests.push(request);
            if (request.id === 0) {
              stdout.write(`${JSON.stringify({ id: 0, result: {} })}\n`);
            } else if (request.id === 1) {
              void writeFile(
                join(isolatedHome, "auth.json"),
                JSON.stringify(refreshedAuth, null, 2),
              ).then(() => {
                stdout.write(
                  `${JSON.stringify({ id: 1, result: rateLimits })}\n`,
                );
              });
            }
          }
        });
        return proc as unknown as ChildProcess;
      },
    );

    expect(requests).toEqual([
      expect.objectContaining({ id: 0, method: "initialize" }),
      { method: "initialized" },
      { id: 1, method: "account/rateLimits/read" },
    ]);
    expect(result).toEqual({ response: rateLimits, refreshedAuth });
    await expect(Bun.file(isolatedHome).exists()).resolves.toBe(false);
  });

  test("persists App Server token rotation to the snapshot and active auth", async () => {
    const oldAuth = makeAuth("refresh-old");
    const refreshedAuth = makeAuth("refresh-new");
    await saveAccountAuth(accountKey, oldAuth);
    await saveRegistry(registry());
    await mkdir(dirname(CODEX_AUTH_FILE), { recursive: true });
    await writeFile(CODEX_AUTH_FILE, JSON.stringify(oldAuth, null, 2));

    const result = await fetchCodexUsage(
      accountKey,
      true,
      async () => ({ response: rateLimits, refreshedAuth }),
    );

    expect(result.usage?.fiveHourUsedPercent).toBe(25);
    expect(result.usage?.weeklyUsedPercent).toBe(40);
    expect(await readAccountAuth(accountKey)).toEqual(refreshedAuth);
    expect(await readActiveAuth()).toEqual(refreshedAuth);
  });

  test("persists token rotation even when the rate-limit request fails", async () => {
    const oldAuth = makeAuth("refresh-old");
    const refreshedAuth = makeAuth("refresh-new");
    await saveAccountAuth(accountKey, oldAuth);
    await saveRegistry(registry());
    await mkdir(dirname(CODEX_AUTH_FILE), { recursive: true });
    await writeFile(CODEX_AUTH_FILE, JSON.stringify(oldAuth, null, 2));

    const result = await fetchCodexUsage(accountKey, true, async () => {
      throw new CodexRateLimitsReadError("usage service unavailable", refreshedAuth);
    });

    expect(result).toEqual({ usage: null, note: "usage n/a" });
    expect(await readAccountAuth(accountKey)).toEqual(refreshedAuth);
    expect(await readActiveAuth()).toEqual(refreshedAuth);
  });

  test("does not overwrite a newer active token from a concurrent Codex run", async () => {
    const oldAuth = makeAuth("refresh-old");
    const appServerAuth = makeAuth("refresh-app-server");
    const activeAuth = makeAuth("refresh-active-newer");
    await saveAccountAuth(accountKey, oldAuth);
    await saveRegistry(registry());
    await mkdir(dirname(CODEX_AUTH_FILE), { recursive: true });
    await writeFile(CODEX_AUTH_FILE, JSON.stringify(activeAuth, null, 2));

    await fetchCodexUsage(
      accountKey,
      true,
      async () => ({ response: rateLimits, refreshedAuth: appServerAuth }),
    );

    expect(await readAccountAuth(accountKey)).toEqual(activeAuth);
    expect(await readActiveAuth()).toEqual(activeAuth);
  });
});
