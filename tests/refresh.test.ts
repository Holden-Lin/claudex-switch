import {
  afterEach,
  beforeEach,
  describe,
  expect,
  spyOn,
  test,
} from "bun:test";
import * as childProcess from "child_process";
import { EventEmitter } from "events";
import { mkdir, writeFile } from "fs/promises";
import { homedir } from "os";

type SpawnHandler = (
  command: string,
  args: string[],
) => number | void | Promise<number | void>;

type SpawnSyncResult = {
  status: number | null;
  error?: Error;
  stdout?: string | Buffer;
  stderr?: string | Buffer;
};

type SpawnSyncHandler = (
  command: string,
  args: string[],
) => SpawnSyncResult;

let spawnHandler: SpawnHandler = async () => 0;
let spawnSyncHandler: SpawnSyncHandler = () => ({
  status: 0,
  stdout: "",
  stderr: "",
});

const { saveAliases } = await import("../src/alias/store");
const { refresh } = await import("../src/commands/refresh");
const {
  CLAUDE_JSON,
  CODEX_AUTH_FILE,
  CREDENTIALS_FILE,
  claudeProfileCredentials,
} = await import("../src/lib/paths");
const { readJson } = await import("../src/lib/fs");
const { addOAuthProfile, readState } = await import(
  "../src/providers/claude/profiles"
);
const {
  readAccountAuth,
  readActiveAuth,
  saveAccountAuth,
} = await import("../src/providers/codex/auth");
const {
  loadRegistry,
  saveRegistry,
} = await import("../src/providers/codex/registry");
const { makeJwt, resetTestHome } = await import("./helpers");
import type {
  AliasRegistry,
  CodexAuthFile,
  CodexRegistry,
  CredentialsFile,
  OAuthAccount,
} from "../src/types";

function createRegistry(): CodexRegistry {
  return {
    schema_version: 3,
    active_account_key: null,
    active_account_activated_at_ms: null,
    auto_switch: {
      enabled: false,
      threshold_5h_percent: 10,
      threshold_weekly_percent: 5,
    },
    api: { usage: true, account: true },
    accounts: [],
  };
}

describe("refresh", () => {
  afterEach(() => {
    childProcess.spawn.mockRestore?.();
    childProcess.spawnSync.mockRestore?.();
  });

  beforeEach(async () => {
    await resetTestHome();
    process.env.CLAUDEX_FORCE_FILE_CREDENTIALS = "1";
    spawnHandler = async () => 0;
    spawnSyncHandler = () => ({
      status: 0,
      stdout: "",
      stderr: "",
    });

    spyOn(childProcess, "spawn").mockImplementation((command, args) => {
      const proc = new EventEmitter() as EventEmitter & {
        on(event: string, listener: (...value: unknown[]) => void): unknown;
      };

      queueMicrotask(async () => {
        try {
          const code = (await spawnHandler(
            String(command),
            (args ?? []).map((value) => String(value)),
          )) ?? 0;
          proc.emit("close", code);
        } catch (err) {
          proc.emit("error", err);
        }
      });

      return proc as ReturnType<typeof childProcess.spawn>;
    });

    spyOn(childProcess, "spawnSync").mockImplementation((command, args) =>
      spawnSyncHandler(
        String(command),
        (args ?? []).map((value) => String(value)),
      ) as ReturnType<typeof childProcess.spawnSync>,
    );
  });

  test("refreshes a codex alias by resaving the refreshed auth snapshot", async () => {
    const accountKey = "user-1::acct-1";
    const aliases: AliasRegistry = {
      version: 1,
      aliases: [
        {
          alias: "satoshix",
          target: { provider: "codex", accountKey },
          createdAt: 1,
        },
      ],
    };
    await saveAliases(aliases);

    const registry = createRegistry();
    registry.accounts.push({
      account_key: accountKey,
      chatgpt_account_id: "acct-1",
      chatgpt_user_id: "user-1",
      email: "satoshi.lamm@gmail.com",
      alias: "satoshix",
      account_name: null,
      plan: "plus",
      auth_mode: "chatgpt",
      created_at: 1,
      last_used_at: null,
      last_usage: null,
      last_usage_at: null,
      last_local_rollout: null,
    });
    await saveRegistry(registry);

    const staleAuth: CodexAuthFile = {
      auth_mode: "chatgpt",
      OPENAI_API_KEY: null,
      tokens: {
        id_token: makeJwt({
          email: "satoshi.lamm@gmail.com",
          "https://api.openai.com/auth": {
            user_id: "user-1",
            account_id: "acct-1",
            plan_type: "plus",
          },
        }),
        access_token: makeJwt({ sub: "user-1" }),
        refresh_token: "stale-refresh",
        account_id: "acct-1",
      },
      last_refresh: "2026-04-01T00:00:00.000Z",
    };
    await saveAccountAuth(accountKey, staleAuth);

    const refreshedAuth: CodexAuthFile = {
      auth_mode: "chatgpt",
      OPENAI_API_KEY: null,
      tokens: {
        id_token: makeJwt({
          email: "satoshi.lamm@gmail.com",
          "https://api.openai.com/auth": {
            user_id: "user-1",
            account_id: "acct-1",
            plan_type: "plus",
          },
        }),
        access_token: makeJwt({ sub: "user-1", exp: 1999999999 }),
        refresh_token: "fresh-refresh",
        account_id: "acct-1",
      },
      last_refresh: "2026-04-06T00:00:00.000Z",
    };

    const browserCalls: Array<[string, string[]]> = [];
    spawnHandler = async (command, args) => {
      expect(command).toBe("codex");
      expect(args).toEqual(["login", "--device-auth"]);
      await mkdir(homedir(), { recursive: true });
      await writeFile(
        CODEX_AUTH_FILE,
        JSON.stringify(refreshedAuth, null, 2),
      );
    };
    spawnSyncHandler = (command, args) => {
      browserCalls.push([command, args]);
      return {
        status: 0,
        stdout: "",
        stderr: "",
      };
    };

    const logSpy = spyOn(console, "log").mockImplementation(() => {});

    await refresh("satoshix");

    expect(await readActiveAuth()).toEqual(refreshedAuth);
    expect(await readAccountAuth(accountKey)).toEqual(refreshedAuth);

    const savedRegistry = await loadRegistry();
    expect(savedRegistry.active_account_key).toBe(accountKey);
    expect(savedRegistry.accounts[0]?.email).toBe("satoshi.lamm@gmail.com");
    expect(savedRegistry.accounts[0]?.plan).toBe("plus");
    const browserCall = browserCalls.at(-1);
    expect(browserCall?.[1]).toEqual([
      "https://auth.openai.com/codex/device",
    ]);
    if (process.platform === "darwin") {
      expect(browserCall?.[0]).toContain("claudex-private-browser-");
    } else if (process.platform === "linux") {
      expect(browserCall?.[0]).toBe("xdg-open");
    } else if (process.platform === "win32") {
      expect(browserCall).toEqual([
        "cmd",
        ["/c", "start", "", "https://auth.openai.com/codex/device"],
      ]);
    }

    const output = logSpy.mock.calls.flat().join("\n");
    expect(output).toContain("Refreshed satoshix");

    logSpy.mockRestore();
  });

  test("refreshes a claude oauth alias by resaving the current credentials", async () => {
    const aliases: AliasRegistry = {
      version: 1,
      aliases: [
        {
          alias: "holden",
          target: { provider: "claude", profileName: "holden" },
          createdAt: 1,
        },
      ],
    };
    await saveAliases(aliases);

    await mkdir(homedir(), { recursive: true });
    await mkdir(`${homedir()}/.claude`, { recursive: true });

    const originalCreds: CredentialsFile = {
      claudeAiOauth: {
        accessToken: "old-access",
        refreshToken: "old-refresh",
        expiresAt: 1,
        scopes: ["org:read"],
        subscriptionType: "pro",
      },
    };
    const refreshedCreds: CredentialsFile = {
      claudeAiOauth: {
        accessToken: "new-access",
        refreshToken: "new-refresh",
        expiresAt: 2,
        scopes: ["org:read"],
        subscriptionType: "max",
      },
    };
    const account: OAuthAccount = {
      accountUuid: "acct-claude-1",
      emailAddress: "holden@example.com",
      organizationUuid: "org-1",
    };

    await writeFile(
      CREDENTIALS_FILE,
      JSON.stringify(originalCreds, null, 2),
    );
    await writeFile(
      CLAUDE_JSON,
      JSON.stringify({ oauthAccount: account }, null, 2),
    );
    await addOAuthProfile("holden");

    spawnHandler = async (command, args) => {
      expect(command).toBe("claude");
      expect(args).toEqual(["auth", "login"]);
      await writeFile(
        CREDENTIALS_FILE,
        JSON.stringify(refreshedCreds, null, 2),
      );
      await writeFile(
        CLAUDE_JSON,
        JSON.stringify({ oauthAccount: account }, null, 2),
      );
    };

    const logSpy = spyOn(console, "log").mockImplementation(() => {});

    await refresh("holden");

    expect(
      await readJson<CredentialsFile | null>(
        claudeProfileCredentials("holden"),
        null,
      ),
    ).toEqual(refreshedCreds);
    expect(await readJson<CredentialsFile | null>(CREDENTIALS_FILE, null)).toEqual(
      refreshedCreds,
    );
    expect((await readState()).active).toBe("holden");

    const output = logSpy.mock.calls.flat().join("\n");
    expect(output).toContain("Refreshed holden");

    logSpy.mockRestore();
  });
});
