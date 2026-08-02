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
import { dirname, join } from "path";
import { CODEX_AUTH_FILE, CODEX_CONFIG_FILE } from "../src/lib/paths";
import { runIsolatedCodexLogin } from "../src/providers/codex/login";
import type { CodexAuthFile } from "../src/types";
import { makeJwt, resetTestHome } from "./helpers";

type SpawnOptions = { env?: NodeJS.ProcessEnv };
type SpawnHandler = (
  command: string,
  args: string[],
  options: SpawnOptions,
) => number | Promise<number>;

let spawnHandler: SpawnHandler = async () => 0;

const authData: CodexAuthFile = {
  auth_mode: "chatgpt",
  OPENAI_API_KEY: null,
  tokens: {
    id_token: makeJwt({
      email: "dev@example.com",
      "https://api.openai.com/auth": {
        chatgpt_user_id: "user-1",
        chatgpt_account_id: "acct-1",
        chatgpt_plan_type: "plus",
      },
    }),
    access_token: makeJwt({ sub: "user-1" }),
    refresh_token: "refresh-1",
    account_id: "acct-1",
  },
  last_refresh: "2026-08-02T00:00:00.000Z",
};

describe("isolated Codex login", () => {
  afterEach(() => {
    childProcess.spawn.mockRestore?.();
  });

  beforeEach(async () => {
    await resetTestHome();
    spawnHandler = async () => 0;
    spyOn(childProcess, "spawn").mockImplementation(
      (command, args, options) => {
        const proc = new EventEmitter();
        queueMicrotask(async () => {
          try {
            const code = await spawnHandler(
              String(command),
              (args ?? []).map(String),
              (options ?? {}) as SpawnOptions,
            );
            proc.emit("close", code);
          } catch (err) {
            proc.emit("error", err);
          }
        });
        return proc as ReturnType<typeof childProcess.spawn>;
      },
    );
  });

  test("runs standard browser login in a temporary CODEX_HOME", async () => {
    await mkdir(dirname(CODEX_CONFIG_FILE), { recursive: true });
    await writeFile(CODEX_CONFIG_FILE, 'model = "gpt-5.4"\n');
    await writeFile(CODEX_AUTH_FILE, "existing-global-auth");
    let isolatedHome = "";

    spawnHandler = async (command, args, options) => {
      expect(command).toBe("codex");
      expect(args).toEqual([
        "login",
        "-c",
        'cli_auth_credentials_store="file"',
      ]);
      isolatedHome = options.env?.CODEX_HOME ?? "";
      expect(isolatedHome).not.toBe(dirname(CODEX_AUTH_FILE));
      expect(options.env?.OPENAI_API_KEY).toBeUndefined();
      expect(await readFile(join(isolatedHome, "config.toml"), "utf-8")).toContain(
        'model = "gpt-5.4"',
      );
      await writeFile(
        join(isolatedHome, "auth.json"),
        JSON.stringify(authData, null, 2),
      );
      return 0;
    };

    const result = await runIsolatedCodexLogin();

    expect(result).toEqual({ exitCode: 0, auth: authData });
    expect(await readFile(CODEX_AUTH_FILE, "utf-8")).toBe(
      "existing-global-auth",
    );
    await expect(Bun.file(isolatedHome).exists()).resolves.toBe(false);
  });

  test("leaves existing global auth untouched when login is cancelled", async () => {
    await mkdir(dirname(CODEX_AUTH_FILE), { recursive: true });
    await writeFile(CODEX_AUTH_FILE, "existing-global-auth");
    spawnHandler = async () => 1;

    expect(await runIsolatedCodexLogin()).toEqual({ exitCode: 1, auth: null });
    expect(await readFile(CODEX_AUTH_FILE, "utf-8")).toBe(
      "existing-global-auth",
    );
  });
});
