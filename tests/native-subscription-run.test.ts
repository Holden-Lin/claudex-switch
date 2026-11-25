import { afterEach, beforeEach, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { saveAliases } from "../src/alias/store";
import { cliProxyAPIProfileDir } from "../src/lib/paths";
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

async function seedAntigravity(email: string) {
  await seed("antigravity");
  await initializeManagedCLIProxyAPI(profile.profileId, { upstream: "antigravity" });
  await writeFile(join(cliProxyAPIProfileDir(profile.profileId), "auth", "antigravity-fixture.json"), JSON.stringify({
    type: "antigravity", access_token: "synthetic-access", email,
  }));
  return profile;
}

async function nativeGatewayFixture() {
  await writeFile(join(bin, "agy"), `#!/usr/bin/env bun
for (const arg of process.argv.slice(2)) console.log('agy argument: '+arg);
const root = process.env.AGY_LLM_GATEWAY_URL;
console.log('gateway: '+root);
console.log('catalog: '+process.env.AGY_LLM_GATEWAY_MODELS);
console.log('headers override: '+Boolean(process.env.AGY_LLM_GATEWAY_HEADERS));
const response = await fetch(root+'/v1beta/models/claude-sonnet-5-5-high:streamGenerateContent', {
 method: 'POST', headers: {Authorization: 'Bearer '+process.env.AGY_LLM_GATEWAY_API_KEY},
 body: JSON.stringify({contents:[{role:'user',parts:[{text:'hello'}]}]})
});
console.log(await response.text());
process.exit(response.ok ? 0 : 1);
`, { mode: 0o755 });
}

test("Antigravity native run binds the saved account and preserves arguments", async () => {
  await seedAntigravity("new@example.invalid");
  await nativeGatewayFixture();
  const result = run(["--run", "--model", "native-model", "--effort", "xhigh", "-p", "hello"]);
  expect({ status: result.status, error: result.stderr }).toEqual({ status: 0, error: "" });
  expect(result.stdout).toContain("Using Antigravity account saved as workbuddy");
  expect(result.stdout).toContain("ACCOUNT:new@example.invalid");
  for (const arg of ["--model", "native-model", "--effort", "xhigh", "-p", "hello"]) expect(result.stdout).toContain(`agy argument: ${arg}`);
  expect(result.stdout).toContain("catalog: claude-opus-5-5-high,claude-sonnet-5-5-high");
  expect(result.stdout).not.toContain("native CLI's own login");
  expect(result.stdout).not.toContain("synthetic-access");
  expect(await readdir(join(cliProxyAPIProfileDir(profile.profileId), "sessions"))).toEqual([]);
}, 15000);

test("Antigravity refuses a missing alias login instead of falling back to the native account", async () => {
  await seed("antigravity");
  await initializeManagedCLIProxyAPI(profile.profileId, { upstream: "antigravity" });
  const result = run(["--run", "-p", "hello"]);
  expect(result.status).toBe(1);
  expect(result.stderr + result.stdout).toContain("No valid Antigravity login");
  expect(result.stdout).not.toContain("agy argument");
});

test("two concurrent native aliases use separate accounts and release their leases", async () => {
  const first = await seedAntigravity("first@example.invalid");
  await saveLocalCLIProxyAPIProfile("first", first);
  const second = await seedAntigravity("second@example.invalid");
  await saveAliases({ version: 1, aliases: [
    { alias: "first", target: { provider: "claude", profileName: "first" }, createdAt: 1 },
    { alias: "second", target: { provider: "claude", profileName: "subscription" }, createdAt: 1 },
  ] });
  await nativeGatewayFixture();
  const results = await Promise.all(["first", "second"].map(async (alias) => {
    const child = Bun.spawn([process.execPath, "src/index.ts", alias, "--run", "-p", "hello"], {
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, CLAUDEX_DISABLE_AUTO_UPDATE: "1", NO_COLOR: "1",
        CLAUDEX_FAKE_MODELS: "claude-opus-5-5-high,claude-sonnet-5-5-high",
        AGY_LLM_GATEWAY_URL: "http://127.0.0.1:1", AGY_LLM_GATEWAY_API_KEY: "wrong-account",
        AGY_LLM_GATEWAY_MODELS: "wrong-model", AGY_LLM_GATEWAY_HEADERS: "wrong-authorization" },
      stdout: "pipe", stderr: "pipe",
    });
    const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
    expect({ code, stderr }).toEqual({ code: 0, stderr: "" });
    return stdout;
  }));
  for (const [index, account] of ["first", "second"].entries()) {
    expect(results[index]).toContain(`ACCOUNT:${account}@example.invalid`);
    expect(results[index]).not.toContain(`ACCOUNT:${account === "first" ? "second" : "first"}@example.invalid`);
    expect(results[index]).toContain("agy argument: claude-opus-5-5-high");
    expect(results[index]).toContain("headers override: false");
  }
  expect(results[0]!.match(/gateway: (.+)/)![1]).not.toBe(results[1]!.match(/gateway: (.+)/)![1]);
  for (const item of [first, second]) expect(await readdir(join(cliProxyAPIProfileDir(item.profileId), "sessions"))).toEqual([]);
}, 15000);

test("Antigravity releases its lease when the native executable is missing", async () => {
  await seedAntigravity("spawn-error@example.invalid");
  await writeFile(join(bin, "agy"), "#!/nonexistent-native-interpreter\n", { mode: 0o755 });
  const result = run(["--run"]);
  expect(result.status).toBe(1);
  expect(result.stdout).toContain("Running agy");
  expect(result.stderr + result.stdout).toContain("Failed to start agy");
  expect(await readdir(join(cliProxyAPIProfileDir(profile.profileId), "sessions"))).toEqual([]);
}, 15000);

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
