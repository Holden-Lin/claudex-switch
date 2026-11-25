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

// Behaves like agy 1.5.17 behind a model gateway (probed 2026-11-25): `models`
// prints "<id>\t<label>", --effort is rejected for a tiered gateway ID, and a
// Gemini ID's tier is stripped from the request path (sent as thinkingLevel).
async function realisticAgyFixture() {
  await writeFile(join(bin, "agy"), `#!/usr/bin/env bun
const argv = process.argv.slice(2);
const ids = (process.env.AGY_LLM_GATEWAY_MODELS ?? '').split(',');
const label = (id) => {
  const m = id.match(/^gemini-([\\d.]+)-(\\w+)-(xhigh|high|medium|low)$/);
  const cap = (w) => w[0].toUpperCase() + w.slice(1);
  return m ? 'Gemini ' + m[1] + ' ' + cap(m[2]) + ' (' + (m[3] === 'xhigh' ? 'XHigh' : cap(m[3])) + ')' : id;
};
if (argv[0] === 'models') { for (const id of ids) console.log(id + '\\t' + label(id)); process.exit(0); }
for (const arg of argv) console.log('agy argument: ' + arg);
console.log('catalog: ' + process.env.AGY_LLM_GATEWAY_MODELS);
const model = argv[argv.indexOf('--model') + 1];
if (argv.includes('--effort')) { console.log('agy: --effort is not supported for model ' + model); process.exit(3); }
if (!ids.includes(model)) { console.log('agy: model ' + model + ' is not recognized'); process.exit(3); }
const sent = model.replace(/^(gemini-.+)-(xhigh|high|medium|low)$/i, '$1');
const response = await fetch(process.env.AGY_LLM_GATEWAY_URL + '/v1beta/models/' + sent + ':streamGenerateContent?alt=sse', {
  method: 'POST', headers: { Authorization: 'Bearer ' + process.env.AGY_LLM_GATEWAY_API_KEY }, body: '{}',
});
console.log('gateway ' + sent + ': ' + response.status + ' ' + await response.text());
process.exit(response.ok ? 0 : 1);
`, { mode: 0o755 });
}

const AGY_CATALOG = "claude-opus-5-5-high,claude-sonnet-5-5-high,gemini-3.8-flash-high,gemini-4-carbon-high,gemini-4-neon-xhigh";

function runAgy(args: string[]) {
  return spawnSync(process.execPath, ["src/index.ts", "workbuddy", ...args], {
    cwd: process.cwd(), encoding: "utf8", input: "", timeout: 30_000,
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, CLAUDEX_DISABLE_AUTO_UPDATE: "1", NO_COLOR: "1", CLAUDEX_FAKE_MODELS: AGY_CATALOG },
  });
}

test("Antigravity native run binds the saved account, joins model and effort, and keeps other arguments", async () => {
  await seedAntigravity("new@example.invalid");
  await realisticAgyFixture();
  const result = runAgy(["--run", "--model", "claude-sonnet-5-5", "high", "-p", "hello", "--mode", "plan"]);
  expect({ status: result.status, error: result.stderr }).toEqual({ status: 0, error: "" });
  expect(result.stdout).toContain("Using Antigravity account saved as workbuddy");
  expect(result.stdout).toContain("gateway claude-sonnet-5-5-high: 200");
  expect(result.stdout).toContain("ACCOUNT:new@example.invalid UPSTREAM:claude-sonnet-5-5-high");
  const agyArgs = [...result.stdout.matchAll(/agy argument: (.*)/g)].map((match) => match[1]);
  expect(agyArgs).toEqual(["--model", "claude-sonnet-5-5-high", "--settings", '{"model":"claude-sonnet-5-5-high"}', "-p", "hello", "--mode", "plan"]);
  // The proxy's forked Gemini aliases never reach agy's or Claude Code's list.
  expect(result.stdout).toContain(`catalog: ${AGY_CATALOG}`);
  expect(result.stdout).not.toContain("native CLI's own login");
  expect(result.stdout).not.toContain("synthetic-access");
  expect(await readdir(join(cliProxyAPIProfileDir(profile.profileId), "sessions"))).toEqual([]);
}, 30000);

// ROOT 2026-11-25: `agy -run --model gemini-4-neon xhigh` → agy "unexpected
// argument xhigh"; `--model gemini-4-neon-xhigh` → 400 "unknown provider for
// model gemini-4-neon"; `--model gemini-4-neon-high --effort xhigh` → agy
// swapped in another model.
test("every spelling of gemini-4-neon at xhigh launches gemini-4-neon-xhigh and its request reaches that model", async () => {
  await seedAntigravity("neon@example.invalid");
  await realisticAgyFixture();
  for (const spelling of [
    ["--model", "gemini-4-neon", "xhigh"],
    ["--model", "gemini-4-neon xhigh"],
    ["--model", "gemini-4-neon-high", "--effort", "xhigh"],
    ["--model=gemini-4-neon-xhigh"],
    ["--effort=xhigh", "--model", "gemini-4-neon"],
  ]) {
    const result = runAgy(["--run", ...spelling, "-p", "hello"]);
    expect({ spelling, status: result.status, error: result.stderr }).toEqual({ spelling, status: 0, error: "" });
    expect(result.stdout).toContain(`Running agy --model gemini-4-neon-xhigh --settings {"model":"Gemini 4 Neon (XHigh)"} -p hello`);
    expect(result.stdout).toContain("gateway gemini-4-neon: 200");
    expect(result.stdout).toContain("UPSTREAM:gemini-4-neon-xhigh");
    expect(result.stdout).not.toMatch(/agy argument: (xhigh|--effort)$/m);
  }
}, 60000);

test("bare --run uses the account's saved model, also when it is a tiered Gemini model", async () => {
  await seedAntigravity("saved@example.invalid");
  await realisticAgyFixture();
  let result = runAgy(["--run", "-p", "hello"]);
  expect({ status: result.status, error: result.stderr }).toEqual({ status: 0, error: "" });
  expect(result.stdout).toContain(`Running agy --model claude-opus-5-5-high --settings {"model":"claude-opus-5-5-high"} -p hello`);
  expect(result.stdout).toContain("UPSTREAM:claude-opus-5-5-high");
  await saveLocalCLIProxyAPIProfile("subscription", { ...profile, defaultModel: "gemini-4-carbon-high" });
  result = runAgy(["--run", "-p", "hello"]);
  expect({ status: result.status, error: result.stderr }).toEqual({ status: 0, error: "" });
  expect(result.stdout).toContain(`Running agy --model gemini-4-carbon-high --settings {"model":"Gemini 4 Carbon (High)"} -p hello`);
  expect(result.stdout).toContain("gateway gemini-4-carbon: 200");
  expect(result.stdout).toContain("UPSTREAM:gemini-4-carbon-high");
}, 45000);

test("a tier the account lacks is refused with the available tiers instead of swapping models", async () => {
  await seedAntigravity("tier@example.invalid");
  await realisticAgyFixture();
  for (const spelling of [["--model", "gemini-4-neon", "high"], ["--model", "gemini-4-neon-high"], ["--model", "no-such-model"]]) {
    const result = runAgy(["--run", ...spelling, "-p", "hello"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("is not in this account's catalog");
    expect(result.stderr).toContain(spelling[1] === "no-such-model" ? "Available models: claude-opus-5-5-high" : "Available tiers: gemini-4-neon-xhigh");
    expect(result.stdout).not.toContain("agy argument");
  }
  expect(await readdir(join(cliProxyAPIProfileDir(profile.profileId), "sessions"))).toEqual([]);
}, 45000);

test("a user --settings is passed through untouched and not doubled", async () => {
  await seedAntigravity("settings@example.invalid");
  await realisticAgyFixture();
  const result = runAgy(["--run", "--model", "gemini-4-neon", "xhigh", "--settings", '{"colorScheme":"dark"}', "-p", "hello"]);
  expect({ status: result.status, error: result.stderr }).toEqual({ status: 0, error: "" });
  const agyArgs = [...result.stdout.matchAll(/agy argument: (.*)/g)].map((match) => match[1]);
  expect(agyArgs).toEqual(["--model", "gemini-4-neon-xhigh", "--settings", '{"colorScheme":"dark"}', "-p", "hello"]);
}, 30000);

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
