import { beforeEach, describe, expect, spyOn, test } from "bun:test";
import type { ChildProcess } from "child_process";
import { EventEmitter } from "events";
import { mkdir, readFile, stat } from "fs/promises";
import { dirname } from "path";
import { saveAliases } from "../src/alias/store";
import { runAliasSession } from "../src/commands/run";
import { fileMode, resetTestHome } from "./helpers";
import {
  OPENCODE_GLOBAL_AUTH_FILE,
  OPENCODE_STATE_FILE,
  openCodeProfileAuthFile,
} from "../src/lib/paths";
import { writeJsonSecure } from "../src/lib/fs";
import {
  createOpenCodeGoProfile,
  getOpenCodeProfileData,
  hasOpenCodeGoCredential,
  normalizeOpenCodeGoModel,
  openCodeRunEnvironment,
  readOpenCodeState,
} from "../src/providers/opencode/profiles";

const PROFILE_ID = "go-00000000-0000-4000-8000-000000000001";
const CREDENTIAL = { type: "api", key: "go-test-secret" };

type SpawnCall = {
  command: string;
  args: string[];
  env?: NodeJS.ProcessEnv;
};

function createSpawn(calls: SpawnCall[]) {
  return (command: string, args: string[], options: { env?: NodeJS.ProcessEnv }) => {
    calls.push({ command, args, env: options.env });
    const proc = new EventEmitter() as ChildProcess;
    queueMicrotask(() => proc.emit("close", 0));
    return proc;
  };
}

describe("OpenCode Go profiles", () => {
  beforeEach(async () => {
    await resetTestHome();
    spyOn(console, "log").mockImplementation(() => {});
    spyOn(console, "error").mockImplementation(() => {});
  });

  test("stores only the Go credential in a private 0600 profile", async () => {
    await mkdir(dirname(OPENCODE_GLOBAL_AUTH_FILE), { recursive: true });
    await writeJsonSecure(OPENCODE_GLOBAL_AUTH_FILE, {
      "opencode-go": CREDENTIAL,
      anthropic: { type: "api", key: "must-not-copy" },
    });
    await createOpenCodeGoProfile(PROFILE_ID, CREDENTIAL);

    expect(await hasOpenCodeGoCredential(PROFILE_ID)).toBe(true);
    expect(JSON.parse(await readFile(openCodeProfileAuthFile(PROFILE_ID), "utf-8"))).toEqual({
      "opencode-go": CREDENTIAL,
    });
    expect(fileMode((await stat(openCodeProfileAuthFile(PROFILE_ID))).mode)).toBe(0o600);
  });

  test("runs the native TUI with the selected private XDG data directory", async () => {
    await createOpenCodeGoProfile(PROFILE_ID, CREDENTIAL);
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "go-work",
          target: { provider: "opencode", profileId: PROFILE_ID },
          createdAt: 1,
        },
      ],
    });

    const previous = process.env.OPENCODE_AUTH_CONTENT;
    process.env.OPENCODE_AUTH_CONTENT = '{"opencode-go":{"type":"api","key":"wrong"}}';
    try {
      const calls: SpawnCall[] = [];
      const exitCode = await runAliasSession(
        "go-work",
        ["--model", "opencode-go/kimi-k3", "--continue"],
        createSpawn(calls),
      );

      expect(exitCode).toBe(0);
      expect(calls).toHaveLength(1);
      expect(calls[0]?.command).toBe("opencode");
      expect(calls[0]?.args).toEqual([
        "--model",
        "opencode-go/kimi-k3",
        "--continue",
      ]);
      expect(calls[0]?.env?.XDG_DATA_HOME).toContain(PROFILE_ID);
      expect(calls[0]?.env?.OPENCODE_AUTH_CONTENT).toBeUndefined();
      expect(await getOpenCodeProfileData(PROFILE_ID)).toEqual({
        type: "go",
        defaultModel: "opencode-go/kimi-k3",
      });
      expect(await readOpenCodeState()).toEqual({ active: PROFILE_ID });
    } finally {
      if (previous === undefined) delete process.env.OPENCODE_AUTH_CONTENT;
      else process.env.OPENCODE_AUTH_CONTENT = previous;
    }
  });

  test("validates Go model ids and builds a private XDG environment", () => {
    expect(normalizeOpenCodeGoModel("opencode-go/glm-5.3")).toBe(
      "opencode-go/glm-5.3",
    );
    expect(() => normalizeOpenCodeGoModel("glm-5.3")).toThrow(
      "OpenCode Go models must use the form",
    );
    expect(() => openCodeRunEnvironment(PROFILE_ID)).not.toThrow();
    expect(OPENCODE_STATE_FILE).toContain(".claudex-switch/opencode/state.json");
  });
});
