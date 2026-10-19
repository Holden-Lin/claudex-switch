import { describe, expect, test } from "bun:test";
import { spawnSync } from "child_process";
import { resetTestHome } from "./helpers";

// The dispatcher only reaches the cliproxy resolver for aliases that already
// exist, so `agy` (which creates itself on first use) was rejected as an
// unknown command. These tests run the real CLI to cover that path.
function runCli(args: string[]) {
  return spawnSync(process.execPath, ["src/index.ts", ...args], {
    cwd: process.cwd(),
    encoding: "utf-8",
    env: {
      ...process.env,
      CLAUDEX_DISABLE_AUTO_UPDATE: "1",
      NO_COLOR: "1",
    },
    input: "",
    timeout: 30_000,
  });
}

describe("alias dispatch for --cliproxy", () => {
  test("an alias that does not exist yet reaches the Antigravity setup", async () => {
    await resetTestHome();
    const result = runCli(["agy", "--run", "--cliproxy", "claudecode"]);
    const output = `${result.stderr}${result.stdout}`;

    expect(output).not.toContain("Unknown command");
    expect(output).toContain("Google has suspended Antigravity access");
  });

  test("an unknown --cliproxy target reports the alias, not an unknown command", async () => {
    await resetTestHome();
    const result = runCli(["nope", "--run", "--cliproxy", "claudecode"]);
    const output = `${result.stderr}${result.stdout}`;

    expect(result.status).toBe(1);
    expect(output).not.toContain("Unknown command");
    expect(output).toContain('Alias "nope" not found.');
    expect(output).toContain("agy for Antigravity");
  });

  test("Antigravity without --cliproxy points at the proxy command", async () => {
    await resetTestHome();
    const result = runCli(["agy", "--run"]);
    const output = `${result.stderr}${result.stdout}`;

    expect(result.status).toBe(1);
    expect(output).toContain('Unknown command: "agy"');
    expect(output).toContain("claudex-switch agy --run --cliproxy claudecode");
  });

  test("an unknown command without --cliproxy still fails as a command", async () => {
    await resetTestHome();
    const result = runCli(["nope"]);
    const output = `${result.stderr}${result.stdout}`;

    expect(result.status).toBe(1);
    expect(output).toContain('Unknown command: "nope"');
  });
});
