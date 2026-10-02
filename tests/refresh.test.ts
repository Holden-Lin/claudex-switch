import {
  afterEach,
  beforeEach,
  describe,
  expect,
  spyOn,
  test,
} from "bun:test";
import * as childProcess from "child_process";
import * as prompts from "@inquirer/prompts";
import { EventEmitter } from "events";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";

type SpawnHandler = (
  command: string,
  args: string[],
  options: { env?: NodeJS.ProcessEnv },
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
  CODEX_CONFIG_FILE,
  CREDENTIALS_FILE,
  claudeProfileCredentials,
} = await import("../src/lib/paths");
const { readJson } = await import("../src/lib/fs");
const {
  OPENCODE_GLOBAL_AUTH_FILE,
  openCodeProfileAuthFile,
} = await import("../src/lib/paths");
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
const {
  createOpenCodeGoProfile,
} = await import("../src/providers/opencode/profiles");
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
    prompts.password.mockRestore?.();
    process.exit.mockRestore?.();
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

    spyOn(childProcess, "spawn").mockImplementation((command, args, options) => {
      const proc = new EventEmitter() as EventEmitter & {
        on(event: string, listener: (...value: unknown[]) => void): unknown;
      };

      queueMicrotask(async () => {
        try {
          const code = (await spawnHandler(
            String(command),
            (args ?? []).map((value) => String(value)),
            (options ?? {}) as { env?: NodeJS.ProcessEnv },
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
    spyOn(prompts, "password").mockResolvedValue("unused");
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
    registry.active_account_key = accountKey;
    registry.accounts.push({
      account_key: accountKey,
      chatgpt_account_id: "acct-1",
      chatgpt_user_id: "user-1",
      email: "fixture-user@example.invalid",
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
          email: "fixture-user@example.invalid",
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
    await mkdir(dirname(CODEX_AUTH_FILE), { recursive: true });
    await writeFile(CODEX_AUTH_FILE, JSON.stringify(staleAuth, null, 2));

    const refreshedAuth: CodexAuthFile = {
      auth_mode: "chatgpt",
      OPENAI_API_KEY: null,
      tokens: {
        id_token: makeJwt({
          email: "fixture-user@example.invalid",
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

    spawnHandler = async (command, args, options) => {
      expect(command).toBe("codex");
      expect(args).toEqual([
        "login",
        "-c",
        'cli_auth_credentials_store="file"',
      ]);
      const isolatedHome = options.env?.CODEX_HOME;
      expect(isolatedHome).toBeTruthy();
      await writeFile(
        join(isolatedHome!, "auth.json"),
        JSON.stringify(refreshedAuth, null, 2),
      );
    };

    const logSpy = spyOn(console, "log").mockImplementation(() => {});

    await refresh("satoshix");

    expect(await readActiveAuth()).toEqual(refreshedAuth);
    expect(await readAccountAuth(accountKey)).toEqual(refreshedAuth);
    expect(await readFile(CODEX_CONFIG_FILE, "utf-8")).toContain(
      'model = "gpt-5.4"',
    );

    const savedRegistry = await loadRegistry();
    expect(savedRegistry.active_account_key).toBe(accountKey);
    expect(savedRegistry.accounts[0]?.email).toBe("fixture-user@example.invalid");
    expect(savedRegistry.accounts[0]?.plan).toBe("plus");
    const output = logSpy.mock.calls.flat().join("\n");
    expect(output).toContain("Refreshed satoshix");

    logSpy.mockRestore();
  });

  test("keeps active and saved auth unchanged after login to another account", async () => {
    const accountKey = "user-1::acct-1";
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "satoshix",
          target: { provider: "codex", accountKey },
          createdAt: 1,
        },
      ],
    });
    const registry = createRegistry();
    registry.active_account_key = accountKey;
    registry.accounts.push({
      account_key: accountKey,
      chatgpt_account_id: "acct-1",
      chatgpt_user_id: "user-1",
      email: "fixture-user@example.invalid",
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
          email: "fixture-user@example.invalid",
          "https://api.openai.com/auth": {
            chatgpt_user_id: "user-1",
            chatgpt_account_id: "acct-1",
          },
        }),
        access_token: "old-access",
        refresh_token: "old-refresh",
        account_id: "acct-1",
      },
      last_refresh: "2026-04-01T00:00:00.000Z",
    };
    await saveAccountAuth(accountKey, staleAuth);
    await mkdir(dirname(CODEX_AUTH_FILE), { recursive: true });
    const original = JSON.stringify(staleAuth, null, 2);
    await writeFile(CODEX_AUTH_FILE, original);
    const wrongAuth: CodexAuthFile = {
      auth_mode: "chatgpt",
      OPENAI_API_KEY: null,
      tokens: {
        id_token: makeJwt({
          email: "other@example.com",
          "https://api.openai.com/auth": {
            chatgpt_user_id: "user-2",
            chatgpt_account_id: "acct-2",
          },
        }),
        access_token: "other-access",
        refresh_token: "other-refresh",
        account_id: "acct-2",
      },
      last_refresh: "2026-08-02T00:00:00.000Z",
    };
    spawnHandler = async (_command, _args, options) => {
      await writeFile(
        join(options.env!.CODEX_HOME!, "auth.json"),
        JSON.stringify(wrongAuth, null, 2),
      );
      return 0;
    };
    spyOn(console, "log").mockImplementation(() => {});
    spyOn(process, "exit").mockImplementation((() => {
      throw new Error("exit");
    }) as typeof process.exit);

    await expect(refresh("satoshix")).rejects.toThrow("exit");

    expect(await readFile(CODEX_AUTH_FILE, "utf-8")).toBe(original);
    expect(await readAccountAuth(accountKey)).toEqual(staleAuth);
    expect((await loadRegistry()).active_account_key).toBe(accountKey);
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

    await mkdir(dirname(CREDENTIALS_FILE), { recursive: true });

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

  test("replaces an OpenCode V2 key without launching the TUI or touching global auth.json", async () => {
    const profileId = "go-00000000-0000-4000-8000-000000000002";
    await createOpenCodeGoProfile(profileId, {
      type: "api",
      key: "fake-v2-old-key",
    });
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "go-v2-refresh",
          target: { provider: "opencode", profileId },
          createdAt: 1,
        },
      ],
    });
    await mkdir(dirname(OPENCODE_GLOBAL_AUTH_FILE), { recursive: true });
    const originalGlobalAuth = JSON.stringify({
      "opencode-go": { type: "api", key: "fake-native-key" },
    });
    await writeFile(OPENCODE_GLOBAL_AUTH_FILE, originalGlobalAuth);
    spawnSyncHandler = (command, args) => {
      expect(command).toBe("opencode");
      expect(args).toEqual(["--version"]);
      return { status: 0, stdout: "opencode v2.0.6", stderr: "" };
    };
    spawnHandler = async (command) => {
      throw new Error(`V2 key refresh should not launch OpenCode TUI: ${command}`);
    };
    prompts.password.mockResolvedValue(" fake-v2-new-key ");
    const logSpy = spyOn(console, "log").mockImplementation(() => {});

    await refresh("go-v2-refresh");

    expect(JSON.parse(await readFile(openCodeProfileAuthFile(profileId), "utf-8"))).toEqual({
      "opencode-go": { type: "api", key: "fake-v2-new-key" },
    });
    expect(await readFile(OPENCODE_GLOBAL_AUTH_FILE, "utf-8")).toBe(originalGlobalAuth);
    const output = logSpy.mock.calls.flat().join("\n");
    expect(output).toContain("OpenCode Go key replaced");
    expect(output).not.toContain("fake-v2-new-key");
    expect(prompts.password).toHaveBeenCalledTimes(1);

    logSpy.mockRestore();
  });

  test("rejects an unchanged OpenCode V1 TUI capture instead of reporting refresh success", async () => {
    const profileId = "go-00000000-0000-4000-8000-000000000004";
    await createOpenCodeGoProfile(profileId, {
      type: "api",
      key: "fake-v1-unchanged-key",
    });
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "go-v1-unchanged",
          target: { provider: "opencode", profileId },
          createdAt: 1,
        },
      ],
    });
    spawnSyncHandler = () => ({
      status: 0,
      stdout: "OpenCode 1.18.30",
      stderr: "",
    });
    spawnHandler = async (command, args, options) => {
      expect(command).toBe("opencode");
      expect(args).toEqual([]);
      expect(options.env?.XDG_DATA_HOME).toContain(profileId);
      return 0;
    };
    spyOn(process, "exit").mockImplementation((() => {
      throw new Error("exit");
    }) as typeof process.exit);
    const logSpy = spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = spyOn(console, "error").mockImplementation(() => {});

    await expect(refresh("go-v1-unchanged")).rejects.toThrow("exit");

    expect(JSON.parse(await readFile(openCodeProfileAuthFile(profileId), "utf-8"))).toEqual({
      "opencode-go": { type: "api", key: "fake-v1-unchanged-key" },
    });
    expect(errorSpy.mock.calls.flat().join("\n")).toContain("without changing the saved key");
    errorSpy.mockRestore();
    logSpy.mockRestore();
  });

  test("rejects an unchanged OpenCode V2 key instead of reporting a refresh", async () => {
    const profileId = "go-00000000-0000-4000-8000-000000000003";
    await createOpenCodeGoProfile(profileId, {
      type: "api",
      key: "fake-v2-unchanged-key",
    });
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "go-v2-unchanged",
          target: { provider: "opencode", profileId },
          createdAt: 1,
        },
      ],
    });
    spawnSyncHandler = () => ({
      status: 0,
      stdout: "opencode v2.0.6",
      stderr: "",
    });
    prompts.password.mockResolvedValue("fake-v2-unchanged-key");
    spyOn(process, "exit").mockImplementation((() => {
      throw new Error("exit");
    }) as typeof process.exit);
    const logSpy = spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = spyOn(console, "error").mockImplementation(() => {});

    await expect(refresh("go-v2-unchanged")).rejects.toThrow("exit");

    expect(JSON.parse(await readFile(openCodeProfileAuthFile(profileId), "utf-8"))).toEqual({
      "opencode-go": { type: "api", key: "fake-v2-unchanged-key" },
    });
    expect(errorSpy.mock.calls.flat().join("\n")).toContain("key is unchanged");
    errorSpy.mockRestore();
    logSpy.mockRestore();
  });
});
