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
import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import * as prompts from "@inquirer/prompts";

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
let selectHandler = async () => "codex-chatgpt";
let confirmHandler = async () => true;
let passwordHandler = async () => "unused";
let inputHandler = async () => "unused";
let add: typeof import("../src/commands/add").add;
const { loadAliases } = await import("../src/alias/store");
const { CODEX_CONFIG_FILE, SETTINGS_FILE } = await import(
  "../src/lib/paths"
);
const { readActiveAuth, readAccountAuth } = await import(
  "../src/providers/codex/auth"
);
const { loadRegistry } = await import("../src/providers/codex/registry");
const { makeJwt, resetTestHome } = await import("./helpers");
import type { CodexAuthFile } from "../src/types";

const originalFetch = globalThis.fetch;
const { RELAYS_FILE } = await import("../src/lib/paths");

describe("add", () => {
  afterEach(() => {
    childProcess.spawn.mockRestore?.();
    childProcess.spawnSync.mockRestore?.();
    prompts.select.mockRestore?.();
    prompts.confirm.mockRestore?.();
    prompts.password.mockRestore?.();
    prompts.input.mockRestore?.();
    globalThis.fetch = originalFetch;
  });

  beforeEach(async () => {
    await resetTestHome();
    process.env.CLAUDEX_FORCE_FILE_CREDENTIALS = "1";
    // Relay detection probes /api/status on api-key base URLs; never let
    // tests reach the network.
    globalThis.fetch = (async () =>
      new Response("not found", { status: 404 })) as typeof fetch;
    spawnHandler = async () => 0;
    spawnSyncHandler = () => ({
      status: 0,
      stdout: "",
      stderr: "",
    });
    selectHandler = async () => "codex-chatgpt";
    confirmHandler = async () => true;
    passwordHandler = async () => "unused";
    inputHandler = async () => "unused";

    spyOn(prompts, "select").mockImplementation(() => selectHandler());
    spyOn(prompts, "confirm").mockImplementation(() => confirmHandler());
    spyOn(prompts, "password").mockImplementation(() => passwordHandler());
    spyOn(prompts, "input").mockImplementation(() => inputHandler());

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

    ({ add } = await import("../src/commands/add"));
  });

  test("adds a codex chatgpt account through isolated browser auth", async () => {
    const authData: CodexAuthFile = {
      auth_mode: "chatgpt",
      OPENAI_API_KEY: null,
      tokens: {
        id_token: makeJwt({
          email: "dev@example.com",
          "https://api.openai.com/auth": {
            user_id: "user-9",
            account_id: "acct-9",
            plan_type: "team",
          },
        }),
        access_token: makeJwt({ sub: "user-9" }),
        refresh_token: "refresh-9",
        account_id: "acct-9",
      },
      last_refresh: "2026-04-20T00:00:00.000Z",
    };

    inputHandler = async () => "gpt-5.4";
    spawnSyncHandler = (command, args) => {
      if (command === "codex" && args[0] === "--version") {
        return {
          status: 0,
          stdout: "codex-cli 0.121.0",
          stderr: "",
        };
      }

      return {
        status: 1,
        stdout: "",
        stderr: "unexpected spawnSync call",
      };
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
        JSON.stringify(authData, null, 2),
      );
    };

    const logSpy = spyOn(console, "log").mockImplementation(() => {});

    await add("work-codex");

    const aliases = await loadAliases();
    expect(aliases.aliases).toEqual([
      {
        alias: "work-codex",
        target: {
          provider: "codex",
          accountKey: "user-9::acct-9",
        },
        createdAt: expect.any(Number),
      },
    ]);

    const registry = await loadRegistry();
    expect(registry.active_account_key).toBe("user-9::acct-9");
    expect(registry.accounts).toHaveLength(1);
    expect(registry.accounts[0]?.email).toBe("dev@example.com");
    expect(registry.accounts[0]?.plan).toBe("team");
    expect(registry.accounts[0]?.auth_mode).toBe("chatgpt");
    expect(registry.accounts[0]?.default_model).toBe("gpt-5.4");

    expect(await readActiveAuth()).toEqual(authData);
    expect(await readAccountAuth("user-9::acct-9")).toEqual(authData);
    const config = await readFile(CODEX_CONFIG_FILE, "utf-8");
    expect(config).toContain('model = "gpt-5.4"');
    expect(config).not.toContain("model_provider =");
    const output = logSpy.mock.calls.flat().join("\n");
    expect(output).toContain("work-codex created");

    logSpy.mockRestore();
  });

  test("adds a codex api key with a custom provider config", async () => {
    const promptOrder: string[] = [];
    const selectValues = ["codex-apikey", "custom"];
    const inputValues = [
      "admin",
      "https://newapi.hybaliez.com/v1",
      "gpt-5.4",
      "OPENAI_API_KEY",
    ];
    selectHandler = async () => {
      promptOrder.push("select");
      return selectValues.shift() ?? "custom";
    };
    inputHandler = async () => {
      promptOrder.push("input");
      return inputValues.shift() ?? "";
    };
    passwordHandler = async () => {
      promptOrder.push("password");
      return "sk-test-123456789";
    };

    const logSpy = spyOn(console, "log").mockImplementation(() => {});

    await add("custom-codex");

    const aliases = await loadAliases();
    expect(aliases.aliases).toHaveLength(1);
    expect(aliases.aliases[0]?.alias).toBe("custom-codex");

    const registry = await loadRegistry();
    const account = registry.accounts[0];
    expect(account?.auth_mode).toBe("apikey");
    expect(account?.default_model).toBe("gpt-5.4");
    expect(promptOrder).toEqual([
      "select",
      "select",
      "input",
      "input",
      "input",
      "input",
      "password",
    ]);
    expect(account?.api_provider).toEqual({
      type: "custom",
      name: "admin",
      base_url: "https://newapi.hybaliez.com/v1",
      model: "gpt-5.4",
      env_key: "OPENAI_API_KEY",
    });

    const config = await readFile(CODEX_CONFIG_FILE, "utf-8");
    expect(config).toContain('model_provider = "admin"');
    expect(config).toContain('model = "gpt-5.4"');
    expect(config).toContain("[model_providers.admin]");
    expect(config).toContain('base_url = "https://newapi.hybaliez.com/v1"');
    expect(config).toContain('experimental_bearer_token = "sk-test-123456789"');
    expect(config).not.toContain('env_key = "OPENAI_API_KEY"');
    expect(config).toContain("requires_openai_auth = false");
    expect(config).toContain('cli_auth_credentials_store = "file"');
    expect(await readActiveAuth()).toEqual({
      auth_mode: "apikey",
      OPENAI_API_KEY: "sk-test-123456789",
    });

    const output = logSpy.mock.calls.flat().join("\n");
    expect(output).toContain("custom-codex created");

    logSpy.mockRestore();
  });

  test("adds a claude api key with model mapping config", async () => {
    const promptOrder: string[] = [];
    const selectValues = ["claude-apikey"];
    const inputValues = [
      "https://claude-proxy.example.com",
      "sonnet",
      "claude-sonnet-4-20250514",
      "claude-opus-4-20250514",
      "claude-3-5-haiku-20241022",
    ];
    const passwordValues = ["sk-ant-test-123456789", "proxy-token-1"];

    selectHandler = async () => {
      promptOrder.push("select");
      return selectValues.shift() ?? "claude-apikey";
    };
    inputHandler = async () => {
      promptOrder.push("input");
      return inputValues.shift() ?? "";
    };
    passwordHandler = async () => {
      promptOrder.push("password");
      return passwordValues.shift() ?? "";
    };

    const logSpy = spyOn(console, "log").mockImplementation(() => {});

    await add("custom-claude");

    const aliases = await loadAliases();
    expect(aliases.aliases).toEqual([
      {
        alias: "custom-claude",
        target: {
          provider: "claude",
          profileName: "custom-claude",
        },
        createdAt: expect.any(Number),
      },
    ]);
    expect(promptOrder).toEqual([
      "select",
      "password",
      "input",
      "password",
      "input",
      "input",
      "input",
      "input",
    ]);

    const settings = JSON.parse(await readFile(SETTINGS_FILE, "utf-8"));
    expect(settings).toEqual({
      model: "sonnet",
      env: {
        ANTHROPIC_API_KEY: "sk-ant-test-123456789",
        ANTHROPIC_BASE_URL: "https://claude-proxy.example.com",
        ANTHROPIC_AUTH_TOKEN: "proxy-token-1",
        ANTHROPIC_MODEL: "sonnet",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "claude-sonnet-4-20250514",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "claude-opus-4-20250514",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "claude-3-5-haiku-20241022",
      },
    });

    const output = logSpy.mock.calls.flat().join("\n");
    expect(output).toContain("custom-claude created");

    logSpy.mockRestore();
  });

  test("offers relay account balance setup when the base URL is a one-api relay", async () => {
    const selectValues = ["codex-apikey", "custom"];
    const inputValues = [
      "relay",
      "https://relay.example.com/v1",
      "gpt-5.4",
      "OPENAI_API_KEY",
      "7", // numeric user id for the relay console
    ];
    const passwordValues = ["sk-test-123456789", "console-token"];
    selectHandler = async () => selectValues.shift() ?? "custom";
    inputHandler = async () => inputValues.shift() ?? "";
    passwordHandler = async () => passwordValues.shift() ?? "";

    const fetchCalls: { url: string; headers: Record<string, string> }[] = [];
    globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
      const url = String(input);
      fetchCalls.push({
        url,
        headers: (init?.headers ?? {}) as Record<string, string>,
      });
      if (url === "https://relay.example.com/api/status") {
        return new Response(
          JSON.stringify({
            success: true,
            data: { system_name: "Mo API", quota_per_unit: 500000 },
          }),
          { status: 200 },
        );
      }
      if (url === "https://relay.example.com/api/user/self") {
        return new Response(
          JSON.stringify({
            success: true,
            data: { id: 7, quota: 163_055_000, used_quota: 0 },
          }),
          { status: 200 },
        );
      }
      return new Response("not found", { status: 404 });
    }) as typeof fetch;

    const logSpy = spyOn(console, "log").mockImplementation(() => {});

    await add("relayx");

    const selfCall = fetchCalls.find((c) => c.url.endsWith("/api/user/self"));
    expect(selfCall?.headers.Authorization).toBe("console-token");
    expect(selfCall?.headers["New-Api-User"]).toBe("7");

    const relays = JSON.parse(await readFile(RELAYS_FILE, "utf-8"));
    expect(relays).toEqual({
      "https://relay.example.com": {
        accessToken: "console-token",
        userId: 7,
      },
    });

    const output = logSpy.mock.calls.flat().join("\n");
    expect(output).toContain("one-api/new-api relay");
    // 163,055,000 quota units / 500,000 per dollar = $326.11
    expect(output).toContain("Relay account balance: $326.11 left");

    logSpy.mockRestore();
  });

  test("does not save relay credentials the relay rejects", async () => {
    const selectValues = ["codex-apikey", "custom"];
    const inputValues = [
      "relay",
      "https://relay.example.com/v1",
      "gpt-5.4",
      "OPENAI_API_KEY",
      "7",
    ];
    // First attempt rejected, second prompt skipped with Enter.
    const passwordValues = ["sk-test-123456789", "bad-token", ""];
    selectHandler = async () => selectValues.shift() ?? "custom";
    inputHandler = async () => inputValues.shift() ?? "";
    passwordHandler = async () => passwordValues.shift() ?? "";

    globalThis.fetch = (async (input: unknown) => {
      const url = String(input);
      if (url === "https://relay.example.com/api/status") {
        return new Response(
          JSON.stringify({
            success: true,
            data: { system_name: "Mo API", quota_per_unit: 500000 },
          }),
          { status: 200 },
        );
      }
      if (url === "https://relay.example.com/api/user/self") {
        return new Response(
          JSON.stringify({ success: false, message: "Unauthorized" }),
          { status: 401 },
        );
      }
      return new Response("not found", { status: 404 });
    }) as typeof fetch;

    const logSpy = spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = spyOn(console, "error").mockImplementation(() => {});

    await add("relayx");

    // account still created, but no relay credentials persisted
    const aliases = await loadAliases();
    expect(aliases.aliases[0]?.alias).toBe("relayx");
    await expect(readFile(RELAYS_FILE, "utf-8")).rejects.toThrow();

    const output = errorSpy.mock.calls.flat().join("\n");
    expect(output).toContain("rejected");

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
