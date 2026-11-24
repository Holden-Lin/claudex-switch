import { afterEach, beforeEach, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { saveAliases } from "../src/alias/store";
import { cliProxyAPIProfileDir } from "../src/lib/paths";
import { saveLocalCLIProxyAPIProfile } from "../src/providers/claude/profiles";
import { initializeManagedCLIProxyAPI, stopManagedCLIProxyAPI } from "../src/providers/cliproxyapi/managed";
import type { LocalCLIProxyAPIProfileData } from "../src/types";
import { resetTestHome, TEST_HOME } from "./helpers";

let profile: LocalCLIProxyAPIProfileData;
const binaryPath = join(import.meta.dir, "fixtures", "fake-cliproxyapi");
const bin = join(TEST_HOME, "native-bin");

beforeEach(async () => {
  await resetTestHome();
  await mkdir(bin, { recursive: true });
  for (const command of ["agy", "cursor", "claude"]) {
    await writeFile(join(bin, command), `#!/bin/sh\nprintf '${command} argument: %s\\n' "$@"\n`, { mode: 0o755 });
  }
});
afterEach(async () => {
  if (profile) await stopManagedCLIProxyAPI(profile);
  await resetTestHome();
});

async function seed(upstream: LocalCLIProxyAPIProfileData["upstream"]) {
  profile = { type: "local-cliproxyapi", profileId: randomUUID(), binaryPath, upstream, defaultModel: "fable" };
  await saveLocalCLIProxyAPIProfile("subscription", profile);
  await saveAliases({ version: 1, aliases: [{ alias: "workbuddy", target: { provider: "claude", profileName: "subscription" }, createdAt: 1 }] });
}

function run(args: string[], preload?: string) {
  return spawnSync(process.execPath, [preload ?? "src/index.ts", "workbuddy", ...args], {
    cwd: process.cwd(), encoding: "utf8", input: "", timeout: 30_000,
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, CLAUDEX_DISABLE_AUTO_UPDATE: "1", NO_COLOR: "1", CLAUDEX_FAKE_MODELS: "hy4free" },
  });
}

test.each(["antigravity", "cursor"] as const)("%s launches native frontend and preserves native arguments without creating proxy state", async (upstream) => {
  await seed(upstream);
  const result = run(["--run", "--model", "native-model", "--effort", "xhigh", "-p", "hello"]);
  expect(result.status).toBe(0);
  const command = upstream === "antigravity" ? "agy" : "cursor";
  expect(result.stdout).toContain(`Running ${command}${upstream === "cursor" ? " agent" : ""}`);
  for (const arg of ["--model", "native-model", "--effort", "xhigh", "-p", "hello"]) expect(result.stdout).toContain(`${command} argument: ${arg}`);
  if (upstream === "cursor") expect(result.stdout).toContain("cursor argument: agent");
  expect(result.stdout).toContain("native CLI's own login");
  expect(result.stdout).not.toContain("claude argument");
  expect(await readFile(join(cliProxyAPIProfileDir(profile.profileId), "state.json"), "utf8").catch(() => null)).toBeNull();
});

test.each(["workbuddy", "workbuddy-ai"] as const)("%s bare run gives an explicit proxy instruction", async (upstream) => {
  await seed(upstream);
  const result = run(["--run", "-p", "hello"]);
  expect(result.status).toBe(1);
  expect(result.stderr + result.stdout).toContain("Native WorkBuddy terminal launch is not supported");
  expect(result.stderr + result.stdout).toContain("--cliproxy claudecode");
  expect(result.stdout).not.toContain("claude argument");
});

test.each([{ args: [] }, { args: ["-p", "reply OK"] }])("workbuddy cc --model hy4free preserves explicit Claude routing and print arguments %j", async ({ args }) => {
  await seed("workbuddy");
  await initializeManagedCLIProxyAPI(profile.profileId, { upstream: "workbuddy" });
  await writeFile(join(cliProxyAPIProfileDir(profile.profileId), "plugin-auth.json"), JSON.stringify({
    version: 1, upstream: "workbuddy", auth: { type: "oauth", access: "fixture-access", refresh: "fixture-refresh", expires: Date.now() + 3_600_000 },
  }));
  // The proxy supervisor re-enters argv[1], so both processes use this same
  // vendor transport fixture while the real dispatcher and adapter still run.
  const preload = join(TEST_HOME, "vendor-transport.mjs");
  await writeFile(preload, `const realFetch = globalThis.fetch;
globalThis.fetch = (input, init) => new URL(String(input)).pathname === "/v3/config"
  ? Promise.resolve(Response.json({ code: 0, data: { agents: [{ name: "cli", models: ["hy4free"] }], models: [{ id: "hy4free", name: "HY", credits: "x0.00", maxInputTokens: 200000 }] } }))
  : realFetch(input, init);
await import(${JSON.stringify(join(process.cwd(), "src/index.ts"))});
`);
  const result = run(["cc", "--model", "hy4free", ...args], preload);
  expect({ status: result.status, error: result.stderr }).toEqual({ status: 0, error: "" });
  expect(result.stdout).toContain("Running claude --permission-mode auto --model hy4free --settings");
  for (const arg of ["--model", "hy4free", ...args]) expect(result.stdout).toContain(`claude argument: ${arg}`);
});
