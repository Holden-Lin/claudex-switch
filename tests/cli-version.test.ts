import { describe, expect, test } from "bun:test";
import { spawnSync } from "child_process";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import packageJson from "../package.json";
import { saveAliases } from "../src/alias/store";
import { resetTestHome } from "./helpers";

function runCli(args: string[]) {
  return spawnSync(process.execPath, ["src/index.ts", ...args], {
    cwd: process.cwd(),
    encoding: "utf-8",
    env: {
      ...process.env,
      CLAUDEX_DISABLE_AUTO_UPDATE: "1",
      NO_COLOR: "1",
    },
  });
}

function runLocalCliWithoutTestHome(args: string[]) {
  const home = mkdtempSync(join(tmpdir(), "claudex-switch-real-home-guard-"));
  const env = {
    PATH: process.env.PATH ?? "",
    HOME: home,
    USERPROFILE: home,
    NO_COLOR: "1",
    CLAUDEX_DISABLE_AUTO_UPDATE: "1",
  };

  try {
    return spawnSync(process.execPath, ["src/index.ts", ...args], {
      cwd: process.cwd(),
      encoding: "utf-8",
      env,
    });
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
}

describe("cli version flags", () => {
  test("prints the current version for --version", () => {
    const result = runCli(["--version"]);

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(packageJson.version);
    expect(result.stderr).toBe("");
  });

  test("prints the current version for -V", () => {
    const result = runCli(["-V"]);

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(packageJson.version);
    expect(result.stderr).toBe("");
  });

  test("does not treat -version as a supported flag", () => {
    const result = runCli(["-version"]);
    const output = `${result.stderr}${result.stdout}`;

    expect(result.status).toBe(1);
    expect(output).toContain('Unknown command: "-version"');
  });

  test("blocks repo-local account commands without an isolated home", () => {
    const result = runLocalCliWithoutTestHome(["list"]);
    const output = `${result.stderr}${result.stdout}`;

    expect(result.status).toBe(1);
    expect(output).toContain(
      "Refusing to run repo-local claudex-switch against your real HOME.",
    );
    expect(output).toContain("CLAUDEX_TEST_HOME");
  });

  test("allows repo-local version checks without an isolated home", () => {
    const result = runLocalCliWithoutTestHome(["--version"]);

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(packageJson.version);
  });

  test.each([
    ["alias shortcut", ["cx", "--autoreview", "off"]],
    ["use command", ["use", "cx", "--autoreview", "off"]],
  ])("requires -run for autoreview via %s", (_syntax, args) => {
    const result = runCli(args);
    const output = `${result.stderr}${result.stdout}`;

    expect(result.status).toBe(1);
    expect(output).toContain("--autoreview can only be used with -run or --run.");
  });

  test.each([
    ["missing", ["cx", "-run", "--autoreview"]],
    ["invalid", ["cx", "-run", "--autoreview", "sometimes"]],
  ])("rejects a %s autoreview value before provider validation", async (_case, args) => {
    await resetTestHome();
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "cx",
          target: { provider: "claude", profileName: "fake-profile" },
          createdAt: 1,
        },
      ],
    });
    const result = runCli(args);
    const output = `${result.stderr}${result.stdout}`;

    expect(result.status).toBe(1);
    expect(output).toContain("Expected 'on' or 'off' after --autoreview.");
    expect(output).not.toContain("--autoreview is only supported for Codex sessions.");
  });

  test("accepts autoreview through both alias and use session syntaxes", async () => {
    await resetTestHome();
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "cx",
          target: { provider: "claude", profileName: "fake-profile" },
          createdAt: 1,
        },
      ],
    });

    for (const args of [
      ["cx", "-run", "--autoreview", "on"],
      ["use", "cx", "-run", "--autoreview", "off"],
    ]) {
      const result = runCli(args);
      const output = `${result.stderr}${result.stdout}`;
      expect(result.status).toBe(1);
      expect(output).toContain("--autoreview is only supported for Codex sessions.");
    }
  });
});
