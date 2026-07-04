import {
  afterEach,
  beforeEach,
  describe,
  expect,
  spyOn,
  test,
} from "bun:test";
import type { ChildProcess } from "child_process";
import { EventEmitter } from "events";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname } from "path";
import { saveAliases } from "../src/alias/store";
import { runAliasSession } from "../src/commands/run";
import {
  CLAUDE_JSON,
  CODEX_CONFIG_FILE,
  CREDENTIALS_FILE,
  claudeProfileConfigJson,
  claudeProfileDir,
  claudeProfileConfigDir,
} from "../src/lib/paths";
import { readJson } from "../src/lib/fs";
import {
  readCredentials,
  writeCredentials,
} from "../src/providers/claude/credentials";
import {
  addOAuthProfile,
  addApiKeyProfile,
  readState,
  switchProfile,
} from "../src/providers/claude/profiles";
import { saveAccountAuth } from "../src/providers/codex/auth";
import { loadRegistry, saveRegistry } from "../src/providers/codex/registry";
import { makeJwt, resetTestHome } from "./helpers";
import type {
  AliasRegistry,
  CodexAuthFile,
  CodexRegistry,
  CredentialsFile,
  OAuthAccount,
} from "../src/types";

type SpawnCall = {
  command: string;
  args: string[];
  stdio: string;
  env?: NodeJS.ProcessEnv;
};

function createRegistry(accountKey: string): CodexRegistry {
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
    accounts: [
      {
        account_key: accountKey,
        chatgpt_account_id: "acct-1",
        chatgpt_user_id: "user-1",
        email: "codex@example.com",
        alias: "cx",
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
}

function createSpawn(
  calls: SpawnCall[],
  exitCode = 0,
): Parameters<typeof runAliasSession>[2] {
  return (command, args, options) => {
    calls.push({
      command,
      args,
      stdio: options.stdio,
      env: options.env,
    });

    const proc = new EventEmitter();
    queueMicrotask(() => {
      proc.emit("close", exitCode);
    });
    return proc as ChildProcess;
  };
}

describe("run alias session", () => {
  afterEach(() => {
    console.log.mockRestore?.();
  });

  beforeEach(async () => {
    await resetTestHome();
    process.env.CLAUDEX_FORCE_FILE_CREDENTIALS = "1";
    spyOn(console, "log").mockImplementation(() => {});
  });

  test("runs Claude Code with auto permission mode after switching", async () => {
    const creds: CredentialsFile = {
      claudeAiOauth: {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresAt: Date.now() + 1000,
        scopes: [],
        subscriptionType: "pro",
      },
    };
    await mkdir(dirname(CREDENTIALS_FILE), { recursive: true });
    await writeCredentials(creds, CREDENTIALS_FILE);
    await addOAuthProfile("holden");

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

    const calls: SpawnCall[] = [];
    const exitCode = await runAliasSession(
      "holden",
      ["--continue"],
      createSpawn(calls, 7),
    );

    expect(exitCode).toBe(7);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.command).toBe("claude");
    expect(calls[0]?.args).toEqual([
      "--permission-mode",
      "auto",
      "--continue",
    ]);
    expect(calls[0]?.stdio).toBe("inherit");
    expect(calls[0]?.env?.ANTHROPIC_API_KEY).toBeUndefined();
  });

  test("isolates a Claude OAuth run from the global account state", async () => {
    const makeCreds = (token: string): CredentialsFile => ({
      claudeAiOauth: {
        accessToken: token,
        refreshToken: `${token}-refresh`,
        expiresAt: Date.now() + 1000,
        scopes: [],
        subscriptionType: "pro",
      },
    });
    const accountA: OAuthAccount = {
      accountUuid: "acct-a",
      emailAddress: "a@example.com",
      organizationUuid: "org-a",
    };
    const accountB: OAuthAccount = {
      accountUuid: "acct-b",
      emailAddress: "b@example.com",
      organizationUuid: "org-b",
    };

    await mkdir(dirname(CREDENTIALS_FILE), { recursive: true });
    await writeCredentials(makeCreds("token-a"), CREDENTIALS_FILE);
    await writeFile(
      CLAUDE_JSON,
      JSON.stringify({ oauthAccount: accountA }, null, 2),
    );
    await addOAuthProfile("a");
    await writeCredentials(makeCreds("token-b"), CREDENTIALS_FILE);
    await writeFile(
      CLAUDE_JSON,
      JSON.stringify({ oauthAccount: accountB }, null, 2),
    );
    await addOAuthProfile("b");
    await switchProfile("a");

    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "b",
          target: { provider: "claude", profileName: "b" },
          createdAt: 1,
        },
      ],
    });

    const calls: SpawnCall[] = [];
    await runAliasSession("b", [], createSpawn(calls));

    // The run must not touch the globally active account...
    const state = await readState();
    expect(state.active).toBe("a");
    const liveCreds = await readCredentials(CREDENTIALS_FILE);
    expect(liveCreds?.claudeAiOauth?.accessToken).toBe("token-a");

    // ...and the session must use the per-profile credential store.
    expect(calls[0]?.env?.CLAUDE_SECURESTORAGE_CONFIG_DIR).toBe(
      claudeProfileDir("b"),
    );
    expect(calls[0]?.env?.CLAUDE_CONFIG_DIR).toBe(
      claudeProfileConfigDir("b"),
    );
    expect(
      await readJson<{ oauthAccount?: OAuthAccount }>(
        claudeProfileConfigJson("b"),
        {},
      ),
    ).toEqual({ oauthAccount: accountB });
    expect(await readJson<{ oauthAccount?: OAuthAccount }>(CLAUDE_JSON, {}))
      .toEqual({ oauthAccount: accountA });
    expect(calls[0]?.args).toEqual(["--permission-mode", "auto"]);
  });

  test("neutralizes global API settings env for an isolated OAuth run", async () => {
    const creds: CredentialsFile = {
      claudeAiOauth: {
        accessToken: "oauth-token",
        refreshToken: "oauth-refresh",
        expiresAt: Date.now() + 1000,
        scopes: [],
        subscriptionType: "pro",
      },
    };
    await mkdir(dirname(CREDENTIALS_FILE), { recursive: true });
    await writeCredentials(creds, CREDENTIALS_FILE);
    await addOAuthProfile("oauth");
    await addApiKeyProfile("api", {
      apiKey: "sk-ant-active",
      model: "custom-model",
    });

    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "oauth",
          target: { provider: "claude", profileName: "oauth" },
          createdAt: 1,
        },
      ],
    });

    const calls: SpawnCall[] = [];
    await runAliasSession("oauth", [], createSpawn(calls));

    const state = await readState();
    expect(state.active).toBe("api");

    const settingsIndex = calls[0]?.args.indexOf("--settings") ?? -1;
    expect(settingsIndex).toBeGreaterThanOrEqual(0);
    const override = JSON.parse(calls[0]?.args[settingsIndex + 1] ?? "{}");
    expect(override.env.ANTHROPIC_API_KEY).toBe("");
    expect(override.env.ANTHROPIC_MODEL).toBe("");
  });

  test("applies the OAuth profile default model to isolated runs", async () => {
    const creds: CredentialsFile = {
      claudeAiOauth: {
        accessToken: "oauth-token",
        refreshToken: "oauth-refresh",
        expiresAt: Date.now() + 1000,
        scopes: [],
        subscriptionType: "pro",
      },
    };
    await mkdir(dirname(CREDENTIALS_FILE), { recursive: true });
    await writeCredentials(creds, CREDENTIALS_FILE);
    await addOAuthProfile("holden", CREDENTIALS_FILE, {
      defaultModel: "claude-opus-4-6",
    });

    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "holden",
          target: { provider: "claude", profileName: "holden" },
          createdAt: 1,
        },
      ],
    });

    const calls: SpawnCall[] = [];
    await runAliasSession("holden", [], createSpawn(calls));

    expect(calls[0]?.args).toEqual([
      "--permission-mode",
      "auto",
      "--model",
      "claude-opus-4-6",
    ]);
  });

  test("runs Claude OAuth without inherited Anthropic API env", async () => {
    const oldApiKey = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = "sk-ant-shell";

    try {
      const creds: CredentialsFile = {
        claudeAiOauth: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
          expiresAt: Date.now() + 1000,
          scopes: [],
          subscriptionType: "pro",
        },
      };
      await mkdir(dirname(CREDENTIALS_FILE), { recursive: true });
      await writeCredentials(creds, CREDENTIALS_FILE);
      await addOAuthProfile("holden");

      await saveAliases({
        version: 1,
        aliases: [
          {
            alias: "holden",
            target: { provider: "claude", profileName: "holden" },
            createdAt: 1,
          },
        ],
      });

      const calls: SpawnCall[] = [];
      await runAliasSession("holden", [], createSpawn(calls));

      expect(calls[0]?.env?.ANTHROPIC_API_KEY).toBeUndefined();
    } finally {
      if (oldApiKey === undefined) {
        delete process.env.ANTHROPIC_API_KEY;
      } else {
        process.env.ANTHROPIC_API_KEY = oldApiKey;
      }
    }
  });

  test("disables the Claude attribution header only for a one-shot run", async () => {
    const oldHeader = process.env.CLAUDE_CODE_ATTRIBUTION_HEADER;

    try {
      const creds: CredentialsFile = {
        claudeAiOauth: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
          expiresAt: Date.now() + 1000,
          scopes: [],
          subscriptionType: "pro",
        },
      };
      await mkdir(dirname(CREDENTIALS_FILE), { recursive: true });
      await writeCredentials(creds, CREDENTIALS_FILE);
      await addOAuthProfile("holden");

      await saveAliases({
        version: 1,
        aliases: [
          {
            alias: "holden",
            target: { provider: "claude", profileName: "holden" },
            createdAt: 1,
          },
        ],
      });

      const calls: SpawnCall[] = [];
      await runAliasSession(
        "holden",
        ["--attribution-header", "false", "--continue"],
        createSpawn(calls),
      );

      expect(calls[0]?.args).toEqual([
        "--permission-mode",
        "auto",
        "--continue",
      ]);
      expect(calls[0]?.env?.CLAUDE_CODE_ATTRIBUTION_HEADER).toBe("0");
    } finally {
      if (oldHeader === undefined) {
        delete process.env.CLAUDE_CODE_ATTRIBUTION_HEADER;
      } else {
        process.env.CLAUDE_CODE_ATTRIBUTION_HEADER = oldHeader;
      }
    }
  });

  test("runs Claude API key with the selected profile env", async () => {
    const oldApiKey = process.env.ANTHROPIC_API_KEY;
    const oldModel = process.env.ANTHROPIC_MODEL;
    process.env.ANTHROPIC_API_KEY = "sk-ant-shell";
    process.env.ANTHROPIC_MODEL = "stale-model";

    try {
      await addApiKeyProfile("api", {
        apiKey: "sk-ant-profile",
        baseUrl: "https://proxy.example.com",
        model: "claude-opus-4-6",
      });

      await saveAliases({
        version: 1,
        aliases: [
          {
            alias: "api",
            target: { provider: "claude", profileName: "api" },
            createdAt: 1,
          },
        ],
      });

      const calls: SpawnCall[] = [];
      await runAliasSession("api", [], createSpawn(calls));

      expect(calls[0]?.args).toEqual([
        "--bare",
        "--permission-mode",
        "auto",
      ]);
      expect(calls[0]?.env?.ANTHROPIC_API_KEY).toBe("sk-ant-profile");
      expect(calls[0]?.env?.ANTHROPIC_BASE_URL).toBe(
        "https://proxy.example.com",
      );
      expect(calls[0]?.env?.ANTHROPIC_MODEL).toBe("claude-opus-4-6");
      expect(calls[0]?.env?.ANTHROPIC_DEFAULT_OPUS_MODEL).toBeUndefined();
    } finally {
      if (oldApiKey === undefined) {
        delete process.env.ANTHROPIC_API_KEY;
      } else {
        process.env.ANTHROPIC_API_KEY = oldApiKey;
      }

      if (oldModel === undefined) {
        delete process.env.ANTHROPIC_MODEL;
      } else {
        process.env.ANTHROPIC_MODEL = oldModel;
      }
    }
  });

  test("maps -model to a one-shot Claude run override", async () => {
    await addApiKeyProfile("api", {
      apiKey: "sk-ant-profile",
      model: "claude-opus-4-6",
    });

    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "api",
          target: { provider: "claude", profileName: "api" },
          createdAt: 1,
        },
      ],
    });

    const calls: SpawnCall[] = [];
    await runAliasSession(
      "api",
      ["-model", "claude-sonnet-4-20250514", "--continue"],
      createSpawn(calls),
    );

    expect(calls[0]?.args).toEqual([
      "--bare",
      "--permission-mode",
      "auto",
      "--model",
      "claude-sonnet-4-20250514",
      "--continue",
    ]);
    expect(calls[0]?.env?.ANTHROPIC_MODEL).toBe("claude-opus-4-6");
  });

  test("expands a Claude --model shorthand into the canonical model id", async () => {
    await addApiKeyProfile("api", {
      apiKey: "sk-ant-profile",
      model: "claude-opus-4-6",
    });

    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "api",
          target: { provider: "claude", profileName: "api" },
          createdAt: 1,
        },
      ],
    });

    const calls: SpawnCall[] = [];
    await runAliasSession(
      "api",
      ["--model", "4.8", "--continue"],
      createSpawn(calls),
    );

    expect(calls[0]?.args).toEqual([
      "--bare",
      "--permission-mode",
      "auto",
      "--model",
      "claude-opus-4-8",
      "--continue",
    ]);
  });

  test("expands a Codex --model shorthand into a gpt model id", async () => {
    const accountKey = "user-1::acct-1";
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "cx",
          target: { provider: "codex", accountKey },
          createdAt: 1,
        },
      ],
    });
    await saveRegistry(createRegistry(accountKey));
    await saveAccountAuth(accountKey, {
      auth_mode: "chatgpt",
      OPENAI_API_KEY: null,
      tokens: {
        id_token: makeJwt({ sub: "user-1" }),
        access_token: makeJwt({ sub: "user-1" }),
        refresh_token: "refresh-token",
        account_id: "acct-1",
      },
      last_refresh: "2026-04-28T00:00:00.000Z",
    });

    const calls: SpawnCall[] = [];
    await runAliasSession(
      "cx",
      ["--model", "5.5", "--continue"],
      createSpawn(calls),
    );

    expect(calls[0]?.args).toEqual([
      "--dangerously-bypass-approvals-and-sandbox",
      "--model",
      "gpt-5.5",
      "--continue",
    ]);
  });

  test("re-enables the attribution header for a one-shot Claude run", async () => {
    const oldHeader = process.env.CLAUDE_CODE_ATTRIBUTION_HEADER;
    process.env.CLAUDE_CODE_ATTRIBUTION_HEADER = "0";

    try {
      await addApiKeyProfile("api", {
        apiKey: "sk-ant-profile",
        model: "claude-opus-4-6",
      });

      await saveAliases({
        version: 1,
        aliases: [
          {
            alias: "api",
            target: { provider: "claude", profileName: "api" },
            createdAt: 1,
          },
        ],
      });

      const calls: SpawnCall[] = [];
      await runAliasSession(
        "api",
        ["--attribution-header", "true"],
        createSpawn(calls),
      );

      expect(calls[0]?.args).toEqual([
        "--bare",
        "--permission-mode",
        "auto",
      ]);
      expect(calls[0]?.env?.CLAUDE_CODE_ATTRIBUTION_HEADER).toBeUndefined();
    } finally {
      if (oldHeader === undefined) {
        delete process.env.CLAUDE_CODE_ATTRIBUTION_HEADER;
      } else {
        process.env.CLAUDE_CODE_ATTRIBUTION_HEADER = oldHeader;
      }
    }
  });

  test("runs Claude API key aliases without changing the active global Claude auth", async () => {
    const oauthCreds: CredentialsFile = {
      claudeAiOauth: {
        accessToken: "oauth-access",
        refreshToken: "oauth-refresh",
        expiresAt: Date.now() + 1000,
        scopes: [],
        subscriptionType: "max",
      },
    };

    await mkdir(dirname(CREDENTIALS_FILE), { recursive: true });
    await writeCredentials(oauthCreds, CREDENTIALS_FILE);
    await addOAuthProfile("holden");
    await addApiKeyProfile("api", {
      apiKey: "sk-ant-profile",
      model: "claude-opus-4-6",
    });
    await switchProfile("holden");

    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "holden",
          target: { provider: "claude", profileName: "holden" },
          createdAt: 1,
        },
        {
          alias: "api",
          target: { provider: "claude", profileName: "api" },
          createdAt: 1,
        },
      ],
    });

    const calls: SpawnCall[] = [];
    await runAliasSession("api", ["--continue"], createSpawn(calls));

    expect(calls).toHaveLength(1);
    expect(calls[0]?.args).toEqual([
      "--bare",
      "--permission-mode",
      "auto",
      "--continue",
    ]);
    expect(calls[0]?.env?.ANTHROPIC_API_KEY).toBe("sk-ant-profile");
    expect(await readState()).toEqual({ active: "holden" });
    expect(
      await readJson<CredentialsFile | null>(CREDENTIALS_FILE, null),
    ).toEqual(oauthCreds);
  });

  test("runs Codex with bypass approvals and sandbox after switching", async () => {
    const accountKey = "user-1::acct-1";
    const aliases: AliasRegistry = {
      version: 1,
      aliases: [
        {
          alias: "cx",
          target: { provider: "codex", accountKey },
          createdAt: 1,
        },
      ],
    };
    await saveAliases(aliases);
    await saveRegistry(createRegistry(accountKey));

    const auth: CodexAuthFile = {
      auth_mode: "chatgpt",
      OPENAI_API_KEY: null,
      tokens: {
        id_token: makeJwt({ sub: "user-1" }),
        access_token: makeJwt({ sub: "user-1" }),
        refresh_token: "refresh-token",
        account_id: "acct-1",
      },
      last_refresh: "2026-04-28T00:00:00.000Z",
    };
    await saveAccountAuth(accountKey, auth);

    const calls: SpawnCall[] = [];
    const exitCode = await runAliasSession(
      "cx",
      ["--model", "gpt-5"],
      createSpawn(calls),
    );

    expect(exitCode).toBe(0);
    expect(calls).toEqual([
      {
        command: "codex",
        args: [
          "--dangerously-bypass-approvals-and-sandbox",
          "--model",
          "gpt-5",
        ],
        stdio: "inherit",
        env: undefined,
      },
    ]);
    const config = await readFile(CODEX_CONFIG_FILE, "utf-8");
    expect(config).toContain('model = "gpt-5.4"');
    expect(config).not.toContain("model_provider =");

    const registry = await loadRegistry();
    expect(registry.active_account_key).toBe(accountKey);
  });

  test("maps -model to a one-shot Codex run override without persisting it", async () => {
    const accountKey = "user-1::acct-1";
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "cx",
          target: { provider: "codex", accountKey },
          createdAt: 1,
        },
      ],
    });
    await saveRegistry(createRegistry(accountKey));
    await saveAccountAuth(accountKey, {
      auth_mode: "chatgpt",
      OPENAI_API_KEY: null,
      tokens: {
        id_token: makeJwt({ sub: "user-1" }),
        access_token: makeJwt({ sub: "user-1" }),
        refresh_token: "refresh-token",
        account_id: "acct-1",
      },
      last_refresh: "2026-04-28T00:00:00.000Z",
    });

    const calls: SpawnCall[] = [];
    await runAliasSession(
      "cx",
      ["-model", "gpt-5-mini", "--continue"],
      createSpawn(calls),
    );

    expect(calls[0]?.args).toEqual([
      "--dangerously-bypass-approvals-and-sandbox",
      "--model",
      "gpt-5-mini",
      "--continue",
    ]);

    const config = await readFile(CODEX_CONFIG_FILE, "utf-8");
    expect(config).toContain('model = "gpt-5.4"');
    expect(config).not.toContain('model = "gpt-5-mini"');
  });

  test("activates a custom Codex provider before running an api key alias", async () => {
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
    await saveRegistry({
      schema_version: 3,
      active_account_key: null,
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
    });
    await saveAccountAuth(accountKey, {
      auth_mode: "apikey",
      OPENAI_API_KEY: "sk-test",
      tokens: {
        id_token: "",
        access_token: "",
        refresh_token: "",
        account_id: "",
      },
      last_refresh: "2026-04-28T00:00:00.000Z",
    });

    const calls: SpawnCall[] = [];
    const exitCode = await runAliasSession("custom-cx", [], createSpawn(calls));

    expect(exitCode).toBe(0);
    expect(calls[0]?.command).toBe("codex");
    expect(calls[0]?.env?.OPENAI_API_KEY).toBe("sk-test");

    const config = await readFile(CODEX_CONFIG_FILE, "utf-8");
    expect(config).toContain('model_provider = "admin"');
    expect(config).toContain("[model_providers.admin]");
    expect(config).toContain('base_url = "https://newapi.hybaliez.com/v1"');
    expect(config).toContain('experimental_bearer_token = "sk-test"');
  });
});
