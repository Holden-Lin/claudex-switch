import { afterEach, beforeEach, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { saveAliases } from "../src/alias/store";
import { claudeProfileDir, cliProxyAPIProfileDir } from "../src/lib/paths";
import { saveLocalCLIProxyAPIProfile } from "../src/providers/claude/profiles";
import { initializeManagedCLIProxyAPI, stopManagedCLIProxyAPI } from "../src/providers/cliproxyapi/managed";
import type { LocalCLIProxyAPIProfileData } from "../src/types";
import { resetTestHome, TEST_HOME } from "./helpers";

let profile: LocalCLIProxyAPIProfileData;
let profiles: LocalCLIProxyAPIProfileData[];
const binaryPath = join(import.meta.dir, "fixtures", "fake-cliproxyapi");
const bin = join(TEST_HOME, "native-bin");

beforeEach(async () => {
  await resetTestHome();
  profiles = [];
  await mkdir(bin, { recursive: true });
  for (const command of ["agy", "cursor", "claude"]) {
    await writeFile(join(bin, command), `#!/bin/sh\nprintf '${command} argument: %s\\n' "$@"\n`, { mode: 0o755 });
  }
});
afterEach(async () => {
  for (const item of profiles) await stopManagedCLIProxyAPI(item);
  await resetTestHome();
});

async function seed(upstream: LocalCLIProxyAPIProfileData["upstream"]) {
  profile = { type: "local-cliproxyapi", profileId: randomUUID(), binaryPath, upstream, defaultModel: "fable" };
  profiles.push(profile);
  await saveLocalCLIProxyAPIProfile("subscription", profile);
  await saveAliases({ version: 1, aliases: [{ alias: "workbuddy", target: { provider: "claude", profileName: "subscription" }, createdAt: 1 }] });
}

function run(args: string[], preload?: string) {
  return spawnSync(process.execPath, [preload ?? "src/index.ts", "workbuddy", ...args], {
    cwd: process.cwd(), encoding: "utf8", input: "", timeout: 30_000,
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, CLAUDEX_DISABLE_AUTO_UPDATE: "1", NO_COLOR: "1", CLAUDEX_FAKE_MODELS: profile.upstream === "antigravity" ? "claude-opus-5-5-high,claude-sonnet-5-5-high" : "hy4free" },
  });
}

test.each(["cursor"] as const)("%s launches native frontend and preserves native arguments without creating proxy state", async (upstream) => {
  await seed(upstream);
  const result = run(["--run", "--model", "native-model", "--effort", "xhigh", "-p", "hello"]);
  expect(result.status).toBe(0);
  const command = "cursor";
  expect(result.stdout).toContain(`Running ${command}${upstream === "cursor" ? " agent" : ""}`);
  for (const arg of ["--model", "native-model", "--effort", "xhigh", "-p", "hello"]) expect(result.stdout).toContain(`${command} argument: ${arg}`);
  if (upstream === "cursor") expect(result.stdout).toContain("cursor argument: agent");
  expect(result.stdout).toContain("native CLI's own login");
  expect(result.stdout).not.toContain("claude argument");
  expect(await readFile(join(cliProxyAPIProfileDir(profile.profileId), "state.json"), "utf8").catch(() => null)).toBeNull();
});

async function inspectNativeAgy() {
  await writeFile(join(bin, "agy"), `#!/usr/bin/env bun
const args = process.argv.slice(2);
console.log(JSON.stringify({
  args,
  storage: process.env.AGY_CLI_FORCE_FILE_TOKEN_STORAGE,
  gateway: Object.keys(process.env).some((name) => name.startsWith("AGY_LLM_GATEWAY_")),
  adc: Boolean(process.env.AGY_ADC_AUTH),
}));
`, { mode: 0o755 });
}

function nativeAgyOutput(stdout: string) {
  return JSON.parse(stdout.trim().split("\n").at(-1)!);
}

test("Antigravity starts the native OAuth profile even without a proxy login or daemon", async () => {
  await seed("antigravity");
  await inspectNativeAgy();
  const directory = join(claudeProfileDir("subscription"), "agy-native");
  const result = run(["--run"]);
  expect({ code: result.status, error: result.stderr }).toEqual({ code: 0, error: "" });
  expect(result.stdout).toContain("Using Antigravity native profile workbuddy");
  expect(nativeAgyOutput(result.stdout)).toEqual({
    args: ["--gemini_dir", directory, "--app_data_dir", "antigravity-cli"],
    storage: "1",
    gateway: false,
    adc: false,
  });
  if (process.platform !== "win32") expect((await stat(directory)).mode & 0o777).toBe(0o700);
  expect(await Bun.file(join(cliProxyAPIProfileDir(profile.profileId), "state.json")).exists()).toBe(false);
});

test("Antigravity preserves native arguments and normalizes model effort without consulting the proxy catalog", async () => {
  await seed("antigravity");
  await inspectNativeAgy();
  for (const spelling of [
    ["--model", "gemini-4-neon", "xhigh"],
    ["--model", "gemini-4-neon xhigh"],
    ["--model", "gemini-4-neon-high", "--effort", "xhigh"],
    ["--model=gemini-4-neon-xhigh"],
    ["--effort=xhigh", "--model", "gemini-4-neon"],
  ]) {
    const result = run(["--run", ...spelling, "--settings", '{"colorScheme":"dark"}', "-p", "hello", "--mode", "plan"]);
    expect({ spelling, code: result.status, error: result.stderr }).toEqual({ spelling, code: 0, error: "" });
    expect(nativeAgyOutput(result.stdout).args.slice(4)).toEqual([
      "--model", "gemini-4-neon-xhigh", "--settings", '{"colorScheme":"dark"}', "-p", "hello", "--mode", "plan",
    ]);
  }
  const native = run(["--run", "--model", "Gemini 4 Neon (XHigh)", "--", "hello"]);
  expect(native.status).toBe(0);
  expect(nativeAgyOutput(native.stdout).args.slice(4)).toEqual(["--model", "Gemini 4 Neon (XHigh)", "--", "hello"]);
});

test("Antigravity aliases select separate persistent directories and clear inherited gateway auth", async () => {
  await seed("antigravity");
  await saveLocalCLIProxyAPIProfile("second-subscription", { ...profile, profileId: randomUUID() });
  await saveAliases({ version: 1, aliases: [
    { alias: "first", target: { provider: "claude", profileName: "subscription" }, createdAt: 1 },
    { alias: "second", target: { provider: "claude", profileName: "second-subscription" }, createdAt: 1 },
  ] });
  await inspectNativeAgy();
  const launch = async (alias: string) => {
    const child = Bun.spawn([process.execPath, "src/index.ts", alias, "--run"], {
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, CLAUDEX_DISABLE_AUTO_UPDATE: "1", NO_COLOR: "1",
        AGY_LLM_GATEWAY_URL: "http://127.0.0.1:1", AGY_LLM_GATEWAY_API_KEY: "wrong-account",
        AGY_LLM_GATEWAY_HEADERS: "wrong-authorization", AGY_LLM_GATEWAY_WIRE_PROTOCOL: "genai",
        AGY_ADC_AUTH: "true", AGY_CLI_FORCE_FILE_TOKEN_STORAGE: "0" },
      stdout: "pipe", stderr: "pipe",
    });
    const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
    expect({ code, stderr }).toEqual({ code: 0, stderr: "" });
    expect(stdout).not.toContain("wrong-account");
    const result = nativeAgyOutput(stdout);
    expect(result).toMatchObject({ gateway: false, adc: false, storage: "1" });
    return result.args[1];
  };
  const [first, second] = await Promise.all(["first", "second"].map(launch));
  expect(first).not.toBe(second);
  expect(await launch("first")).toBe(first);
});

test("Antigravity cannot use a forwarded flag to change the alias's profile directory", async () => {
  await seed("antigravity");
  for (const args of [["--gemini_dir", "/tmp/elsewhere"], ["--app_data_dir=elsewhere"]]) {
    const result = run(["--run", ...args]);
    expect(result.status).toBe(1);
    expect(result.stderr + result.stdout).toContain("the alias selects the Antigravity profile directory");
    expect(result.stdout).not.toContain("agy argument");
  }
});

test("Antigravity reports native executable failure without starting a proxy", async () => {
  await seed("antigravity");
  await writeFile(join(bin, "agy"), "#!/nonexistent-native-interpreter\n", { mode: 0o755 });
  const result = run(["--run"]);
  expect(result.status).toBe(1);
  expect(result.stderr + result.stdout).toContain("Failed to start agy");
  expect(await Bun.file(join(cliProxyAPIProfileDir(profile.profileId), "state.json")).exists()).toBe(false);
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
