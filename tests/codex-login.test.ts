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
import { CODEX_DEVICE_AUTH_URL } from "../src/lib/browser";

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

const { runCodexDeviceAuthLogin } = await import(
  "../src/providers/codex/login"
);

describe("codex device auth login", () => {
  afterEach(() => {
    childProcess.spawn.mockRestore?.();
    childProcess.spawnSync.mockRestore?.();
  });

  beforeEach(() => {
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

  test("runs codex login with device auth and opens the device URL", async () => {
    const spawnCalls: Array<[string, string[]]> = [];
    const spawnSyncCalls: Array<[string, string[]]> = [];

    spawnHandler = async (command, args) => {
      spawnCalls.push([command, args]);
      return 0;
    };

    spawnSyncHandler = (command, args) => {
      spawnSyncCalls.push([command, args]);
      return {
        status: 0,
        stdout: "",
        stderr: "",
      };
    };

    const exitCode = await runCodexDeviceAuthLogin();

    expect(exitCode).toBe(0);
    expect(spawnCalls).toEqual([["codex", ["login", "--device-auth"]]]);
    const browserCall = spawnSyncCalls.at(-1);
    expect(browserCall?.[1]).toEqual([CODEX_DEVICE_AUTH_URL]);
    if (process.platform === "darwin") {
      expect(browserCall?.[0]).toContain("claudex-private-browser-");
    } else if (process.platform === "linux") {
      expect(browserCall?.[0]).toBe("xdg-open");
    } else if (process.platform === "win32") {
      expect(browserCall).toEqual([
        "cmd",
        ["/c", "start", "", CODEX_DEVICE_AUTH_URL],
      ]);
    }
  });

  test("prints a manual URL hint when auto-open fails", async () => {
    const logSpy = spyOn(console, "log").mockImplementation(() => {});

    spawnSyncHandler = () => ({
      status: 1,
      stdout: "",
      stderr: "failed",
    });

    await runCodexDeviceAuthLogin();

    const output = logSpy.mock.calls.flat().join("\n");
    expect(output).toContain(CODEX_DEVICE_AUTH_URL);

    logSpy.mockRestore();
  });
});
