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
import { dirname } from "path";
import * as prompts from "@inquirer/prompts";

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
let selectHandler = async () => "codex-chatgpt";
let confirmHandler = async () => true;
let passwordHandler = async () => "unused";
let inputHandler = async () => "unused";
let add: typeof import("../src/commands/add").add;
const { loadAliases } = await import("../src/alias/store");
const { CODEX_AUTH_FILE, CODEX_CONFIG_FILE } = await import("../src/lib/paths");
const { readActiveAuth, readAccountAuth } = await import(
  "../src/providers/codex/auth"
);
const { loadRegistry } = await import("../src/providers/codex/registry");
const { makeJwt, resetTestHome } = await import("./helpers");
import { CODEX_DEVICE_AUTH_URL } from "../src/lib/browser";
import type { CodexAuthFile } from "../src/types";

describe("add", () => {
  afterEach(() => {
    childProcess.spawn.mockRestore?.();
    childProcess.spawnSync.mockRestore?.();
    prompts.select.mockRestore?.();
    prompts.confirm.mockRestore?.();
    prompts.password.mockRestore?.();
    prompts.input.mockRestore?.();
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
    selectHandler = async () => "codex-chatgpt";
    confirmHandler = async () => true;
    passwordHandler = async () => "unused";
    inputHandler = async () => "unused";

    spyOn(prompts, "select").mockImplementation(() => selectHandler());
    spyOn(prompts, "confirm").mockImplementation(() => confirmHandler());
    spyOn(prompts, "password").mockImplementation(() => passwordHandler());
    spyOn(prompts, "input").mockImplementation(() => inputHandler());

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

    ({ add } = await import("../src/commands/add"));
  });

  test("adds a codex chatgpt account through device auth", async () => {
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

    const spawnSyncCalls: Array<[string, string[]]> = [];
    spawnSyncHandler = (command, args) => {
      spawnSyncCalls.push([command, args]);

      if (command === "codex" && args[0] === "--version") {
        return {
          status: 0,
          stdout: "codex-cli 0.121.0",
          stderr: "",
        };
      }

      if (command === "xdg-open") {
        return {
          status: 0,
          stdout: "",
          stderr: "",
        };
      }

      return {
        status: 1,
        stdout: "",
        stderr: "unexpected spawnSync call",
      };
    };

    spawnHandler = async (command, args) => {
      expect(command).toBe("codex");
      expect(args).toEqual(["login", "--device-auth"]);
      await mkdir(dirname(CODEX_AUTH_FILE), { recursive: true });
      await writeFile(CODEX_AUTH_FILE, JSON.stringify(authData, null, 2));
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

    expect(await readActiveAuth()).toEqual(authData);
    expect(await readAccountAuth("user-9::acct-9")).toEqual(authData);
    const browserCall = spawnSyncCalls.find(([, args]) =>
      args.includes(CODEX_DEVICE_AUTH_URL),
    );
    if (process.platform === "darwin") {
      expect(browserCall?.[0]).toContain("claudex-private-browser-");
      expect(browserCall?.[1]).toEqual([CODEX_DEVICE_AUTH_URL]);
    } else if (process.platform === "linux") {
      expect(browserCall).toEqual(["xdg-open", [CODEX_DEVICE_AUTH_URL]]);
    } else if (process.platform === "win32") {
      expect(browserCall).toEqual([
        "cmd",
        ["/c", "start", "", CODEX_DEVICE_AUTH_URL],
      ]);
    }

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
      "gpt-5.3-codex",
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
      model: "gpt-5.3-codex",
      env_key: "OPENAI_API_KEY",
    });

    const config = await readFile(CODEX_CONFIG_FILE, "utf-8");
    expect(config).toContain('model_provider = "admin"');
    expect(config).toContain('model = "gpt-5.3-codex"');
    expect(config).toContain("[model_providers.admin]");
    expect(config).toContain('base_url = "https://newapi.hybaliez.com/v1"');
    expect(config).toContain('experimental_bearer_token = "sk-test-123456789"');
    expect(config).not.toContain('env_key = "OPENAI_API_KEY"');
    expect(config).toContain("requires_openai_auth = false");

    const output = logSpy.mock.calls.flat().join("\n");
    expect(output).toContain("custom-codex created");

    logSpy.mockRestore();
  });
});
