/**
 * Real OpenCode 2.x acceptance: fake only Console/browser/TUI transport.
 * Run after `bun run build`: `bun scripts/verify-opencode-subscription.ts`.
 * OPENCODE_BIN may name an installed native binary. All writes use temporary HOME.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { appendFile, chmod, copyFile, mkdir, mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Database } from "bun:sqlite";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const nativeBinary = Bun.which(process.env.OPENCODE_BIN ?? "opencode");
assert(nativeBinary, "Install OpenCode 2.x or set OPENCODE_BIN");
const home = await mkdtemp(join(tmpdir(), "claudex-console-acceptance-"));
process.chdir(home);
const version = Bun.spawnSync([nativeBinary, "--version"], {
  env: { ...process.env, HOME: home, XDG_DATA_HOME: join(home, "version-data"),
    XDG_STATE_HOME: join(home, "version-state"), XDG_CACHE_HOME: join(home, "version-cache") },
});
assert(/opencode v2\./.test(version.stdout.toString()), "This fixture requires OpenCode 2.x");
const evidence = process.env.CLAUDEX_ACCEPTANCE_LOG ?? join(tmpdir(), "claudex-console-portable.txt");
await writeFile(evidence, `Native binary: ${nativeBinary}\nTemporary HOME: ${home}\n`);
async function report(message: string) {
  console.log(message);
  await appendFile(evidence, `${message}\n`);
}
const quote = (value: string) => `'${value.replaceAll("'", "'\\''")}'`;
const profileA = `go-${randomUUID()}`;
const profileB = `go-${randomUUID()}`;
const helper = join(repoRoot, "tests", "fixtures", "opencode-console-login.ts");
const capture = join(home, "tui-capture.json");
const productCLI = join(home, "claudex-switch.js");
await copyFile(join(repoRoot, "dist", "claudex-switch.js"), productCLI);
await chmod(productCLI, 0o755); // Bun install makes the package bin executable.
const bin = join(home, "bin");
await mkdir(bin);
await writeFile(join(bin, "opencode"), `#!/bin/sh
if [ "$1" = auth ] && [ "$2" = login ]; then
  exec ${quote(process.execPath)} ${quote(helper)}
fi
if [ "$1" = serve ] || [ "$1" = --version ]; then
  exec ${quote(nativeBinary)} "$@"
fi
exec ${quote(process.execPath)} ${quote(helper)} capture "$@"
`);
await chmod(join(bin, "opencode"), 0o755);
Object.assign(process.env, {
  HOME: home,
  CLAUDEX_TEST_HOME: home,
  XDG_CONFIG_HOME: join(home, "config"),
  CLAUDEX_DISABLE_AUTO_UPDATE: "1",
  OPENCODE_CONFIG_CONTENT: "{}",
  OPENCODE_CONFIG_PROJECT_DISABLE: "1",
  OPENCODE_DISABLE_AUTOUPDATE: "1",
  OPENCODE_DISABLE_MODELS_FETCH: "1",
  OPENCODE_DISABLE_FILEWATCHER: "1",
  FAKE_TUI_CAPTURE: capture,
  PATH: `${bin}:${process.env.PATH}`,
});
for (const key of ["OPENCODE_DB", "XDG_DATA_HOME", "XDG_STATE_HOME", "XDG_CACHE_HOME",
  "OPENCODE_API_KEY", "OPENCODE_AUTH_CONTENT", "OPENCODE_PASSWORD", "OPENCODE_CONFIG", "OPENCODE_CONFIG_DIR"]) delete process.env[key];

// Deterministic public catalog transport; no official service requests are made.
const catalog = { object: "list", data: [{ id: "minimax-m3", object: "model", owned_by: "opencode" }] };
const preload = join(home, "catalog-preload.mjs");
await writeFile(preload, `const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  if (url.href === "https://opencode.ai/zen/go/v1/models") return Promise.resolve(Response.json(${JSON.stringify(catalog)}));
  if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) throw new Error("Acceptance fixture forbids external requests: " + url.hostname);
  return originalFetch(input, init);
};
`);
await import(preload);

let selectedAccount = "A";
let hasSubscription = true;
let sequence = 0;
const tokens = new Map<string, string>();
const events: { path: string; account: string; org: string | null; grant?: string }[] = [];
const fake = Bun.serve({
  hostname: "127.0.0.1", port: 0,
  async fetch(request) {
    const path = new URL(request.url).pathname;
    const body = request.method === "POST" ? await request.json() as Record<string, string> : {};
    const bearer = (request.headers.get("authorization") ?? "").replace("Bearer ", "");
    const account = tokens.get(bearer) ?? selectedAccount;
    events.push({ path, account, org: request.headers.get("x-org-id"), grant: body.grant_type });
    if (path === "/auth/device/code") return Response.json({
      device_code: `device-${selectedAccount}`, user_code: "TEST-CODE",
      verification_uri_complete: `http://127.0.0.1:${fake.port}/authorize`, expires_in: 600, interval: 0.01,
    });
    if (path === "/auth/device/token") {
      const owner = body.grant_type === "refresh_token"
        ? tokens.get(body.refresh_token) : body.device_code.slice(-1);
      assert(owner, "Unknown fake token owner");
      const access = `fake-access-${owner}-${++sequence}`;
      const refresh = `fake-refresh-${owner}-${sequence}`;
      tokens.set(access, owner); tokens.set(refresh, owner);
      return Response.json({ access_token: access, refresh_token: refresh, expires_in: 3600, org_id: `wrk_${owner}` });
    }
    if (path === "/api/user") return Response.json({ id: `user_${account}`, email: `${account}@example.test` });
    if (path === "/api/orgs") return Response.json([{ id: `wrk_${account}`, name: `Workspace ${account}` }]);
    if (path === "/api/v2/config") return Response.json({ providers: {
      // Production Console declares Zen and Go separately, often with the
      // same model IDs. Subscription access must never select the Zen route.
      opencode: {
        name: "Console Zen", package: "aisdk:@ai-sdk/openai-compatible",
        settings: { baseURL: `http://127.0.0.1:${fake.port}/api/inference/zen` },
        models: { "minimax-m3": { name: "MiniMax M3 Zen",
          capabilities: { tools: true, input: ["text"], output: ["text"] }, limit: { context: 200000, output: 8000 } } },
      },
      "opencode-go": {
        name: "Console Go", package: "aisdk:@ai-sdk/openai-compatible",
        settings: { baseURL: `http://127.0.0.1:${fake.port}/api/inference/go` },
        models: {
          "minimax-m3": { modelID: "minimax-m3", name: `MiniMax M3 Go ${account}`,
            capabilities: { tools: true, input: ["text"], output: ["text"] }, limit: { context: 200000, output: 8000 } },
          // A paid Console alias must not become Go merely because its upstream modelID matches.
          "zen-copy": { modelID: "minimax-m3", name: "Paid Zen Copy",
            capabilities: { tools: true, input: ["text"], output: ["text"] }, limit: { context: 200000, output: 8000 } },
        },
    } } });
    if (path === "/api/go/status") return Response.json(!hasSubscription ? null : {
      product: "go", access: {
        startsAt: new Date(Date.now() - 86400000).toISOString(), endsAt: new Date(Date.now() + 86400000).toISOString(),
        meters: {
          fiveHour: { startsAt: null, resetsAt: null, limitMicroCents: "1200", usedMicroCents: account === "A" ? "120" : "240" },
          week: { limitMicroCents: "3000", usedMicroCents: "750", resetsAt: new Date(Date.now() + 3600000).toISOString() },
          month: { limitMicroCents: "6000", usedMicroCents: "1800" },
        },
      },
    });
    return Response.json({ error: `Unexpected fake Console request: ${path}` }, { status: 404 });
  },
});
process.env.FAKE_CONSOLE_URL = `http://127.0.0.1:${fake.port}`;
// Import only after replacing HOME: source path constants are evaluated at module load.
const consoleProvider = await import("../src/providers/opencode/console");
const paths = await import("../src/lib/paths");
const runtime = await import("../src/providers/opencode/runtime");
const native = await import("../src/providers/opencode/native");
const profiles = await import("../src/providers/opencode/profiles");
const aliases = await import("../src/alias/store");
async function runCli(args: string[]) {
  const executable = productCLI;
  // Exercise the installed script's shebang for list, including SQLite reads.
  // Run needs the test-only public catalog transport preloaded before launch.
  const command = args[0] === "list" ? [executable, ...args]
    : [process.execPath, "--preload", preload, executable, ...args];
  const child = Bun.spawn(command, {
    env: process.env, cwd: home, stdout: "pipe", stderr: "pipe",
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited,
  ]);
  assert(!/fake-(?:access|refresh)-/.test(stdout + stderr), "CLI output leaked fake OAuth secrets");
  assert(!/ExperimentalWarning|SQLite is an experimental feature/.test(stderr), "Installed CLI emitted a SQLite warning");
  assert.equal(code, 0, `CLI ${args.join(" ")} failed: ${stderr}\n${stdout}`);
  return stdout;
}
try {
  selectedAccount = "A";
  const accountA = await consoleProvider.loginOpenCodeConsole(profileA);
  assert.equal(accountA.console?.accountId, "user_A");
  assert.equal(accountA.defaultModel, "opencode-go/minimax-m3");
  await report("PASS login A through real native device OAuth and save private marker");
  selectedAccount = "B";
  const accountB = await consoleProvider.loginOpenCodeConsole(profileB);
  assert.equal(accountB.console?.accountId, "user_B");
  await report("PASS login B uses independent private account/workspace database");
  await aliases.addAlias("goa", { provider: "opencode", profileId: profileA });
  await aliases.addAlias("gob", { provider: "opencode", profileId: profileB });

  const prepared = await consoleProvider.prepareOpenCodeConsoleRun(profileA);
  const config = JSON.parse(prepared.env.OPENCODE_CONFIG_CONTENT!);
  assert.equal(config.model, "opencode-go/minimax-m3");
  assert.deepEqual(config.enabled_providers, ["opencode-go"]);
  assert.equal(config.providers["opencode-go"].models["zen-copy"].disabled, true);
  try {
    await runtime.withOpenCodePrivateServer(prepared.env, async (baseUrl, password) => {
      await runtime.verifyEffectiveOpenCodeRouting(fetch, baseUrl, password, ["opencode-go/minimax-m3"], "opencode-go");
      const response = await runtime.fetchOpenCodeApi(fetch, baseUrl, "/api/provider/opencode-go", password);
      assert.equal(response.status, 200);
      const provider = runtime.locationData(await response.json()) as { integrationID: string; settings: { baseURL: string } };
      assert.equal(provider.integrationID, "opencode");
      assert.equal(provider.settings.baseURL, `http://127.0.0.1:${fake.port}/api/inference/go`);
    });
  } finally { await prepared.release(); }
  await assert.rejects(() => consoleProvider.prepareOpenCodeConsoleRun(profileA, "opencode/zen-copy"), /unavailable/);
  await report("PASS native Go provider uses Console OAuth and Go endpoint, excluding matching Zen IDs and paid aliases");
  await profiles.updateOpenCodeProfileDefaultModel(profileA, "opencode/minimax-m3");
  const legacy = await consoleProvider.prepareOpenCodeConsoleRun(profileA);
  try { assert.equal(JSON.parse(legacy.env.OPENCODE_CONFIG_CONTENT!).model, "opencode-go/minimax-m3"); }
  finally { await legacy.release(); }
  await report("PASS v1.18.0 stored Zen prefix is routed to Go without another account login");
  const usageA = await consoleProvider.fetchOpenCodeConsoleUsage(profileA);
  const usageB = await consoleProvider.fetchOpenCodeConsoleUsage(profileB);
  assert.equal(usageA.usage?.fiveHourUsedPercent, 10);
  assert.equal(usageB.usage?.fiveHourUsedPercent, 20);
  await report("PASS own account/workspace quota is 10% for A and 20% for B");

  const jsonList = JSON.parse(await runCli(["list", "--json"]));
  await writeFile(join(home, "list.json"), JSON.stringify(jsonList, null, 2));
  const rows = Array.isArray(jsonList) ? jsonList : jsonList.accounts;
  assert.equal(rows.find((row: { alias: string }) => row.alias === "goa").authMode, "subscription");
  assert.equal(rows.find((row: { alias: string }) => row.alias === "goa").defaultModel, "opencode-go/minimax-m3");
  assert.equal(rows.find((row: { alias: string }) => row.alias === "gob").usage.fiveHourUsedPercent, 20);
  const textList = await runCli(["list"]);
  assert(textList.includes("goa") && textList.includes("gob") && /subscription/i.test(textList));
  await writeFile(join(home, "list.json"), JSON.stringify(jsonList, null, 2));
  await writeFile(join(home, "list.txt"), textList);
  await report("PASS built CLI JSON and rendered text list show both subscription accounts and quota");
  await runCli(["goa", "-run"]);
  const launch = JSON.parse(await readFile(capture, "utf8"));
  assert.equal(launch.database, paths.openCodeProfileV2DatabaseFile(profileA));
  assert.equal(launch.config.model, "opencode-go/minimax-m3");
  assert(launch.args.includes("--standalone"));
  await report("PASS built CLI -run reaches TUI with A private database and selected Go model");

  const databaseA = paths.openCodeProfileV2DatabaseFile(profileA);
  const sqlite = new Database(databaseA);
  const stored = sqlite.query("SELECT value FROM credential WHERE id=?").get(accountA.console!.credentialId) as { value: string };
  const expired = JSON.parse(stored.value); expired.expires = 1;
  sqlite.query("UPDATE credential SET value=? WHERE id=?").run(JSON.stringify(expired), accountA.console!.credentialId);
  sqlite.close();
  const before = await consoleProvider.readPinnedConsoleCredential(profileA);
  assert.equal((await consoleProvider.fetchOpenCodeConsoleUsage(profileA)).usage?.fiveHourUsedPercent, 10);
  const after = await consoleProvider.readPinnedConsoleCredential(profileA);
  assert.notEqual(after.value.refresh, before.value.refresh);
  assert.notEqual(after.value.access, before.value.access);
  await report("PASS native expiry refresh rotates and persists both OAuth tokens");

  let sessionId = "";
  const environmentA = await consoleProvider.openCodeConsoleEnvironment(profileA);
  environmentA.OPENCODE_CONFIG_CONTENT = "{}";
  const credentialB = (await native.readOpenCodeConsoleCredentials(paths.openCodeProfileV2DatabaseFile(profileB)))[0]!;
  await runtime.withOpenCodePrivateServer(environmentA, async (baseUrl, password) => {
    const session = await runtime.fetchOpenCodeApi(fetch, baseUrl, "/api/session", password, {
      method: "POST", body: JSON.stringify({ title: "Acceptance history retained" }),
    });
    assert.equal(session.status, 200);
    sessionId = (await session.json() as { data: { id: string } }).data.id;
    const connected = await runtime.fetchOpenCodeApi(fetch, baseUrl, "/api/credential", password, {
      method: "POST", body: JSON.stringify({ id: credentialB.id, integrationID: "opencode",
        label: credentialB.label, value: credentialB.value, activate: true }),
    });
    assert.equal(connected.status, 200);
  });
  assert.equal((await native.readOpenCodeConsoleCredentials(databaseA)).find((entry) => entry.active)?.value.metadata.accountID, "user_B");
  const repinned = await consoleProvider.prepareOpenCodeConsoleRun(profileA);
  await repinned.release();
  assert.equal((await native.readOpenCodeConsoleCredentials(databaseA)).find((entry) => entry.active)?.id, accountA.console!.credentialId);
  await report("PASS alternate native /connect account is restored to pinned A on next launch");

  selectedAccount = "B";
  await assert.rejects(() => consoleProvider.loginOpenCodeConsole(profileA, accountA), /different account/);
  assert.equal((await consoleProvider.readPinnedConsoleCredential(profileA)).id, accountA.console!.credentialId);
  await report("PASS wrong-account refresh refuses replacement and preserves A");
  selectedAccount = "A";
  const refreshed = await consoleProvider.loginOpenCodeConsole(profileA, accountA);
  await runtime.withOpenCodePrivateServer(environmentA, async (baseUrl, password) => {
    const session = await runtime.fetchOpenCodeApi(fetch, baseUrl, `/api/session/${sessionId}`, password);
    assert.equal(session.status, 200);
  });
  await report("PASS same-account refresh preserves native session history");

  hasSubscription = false;
  await assert.rejects(() => consoleProvider.loginOpenCodeConsole(profileA, refreshed), /no active Go/);
  assert.equal((await consoleProvider.readPinnedConsoleCredential(profileA)).id, refreshed.console!.credentialId);
  const refusedProfile = `go-${randomUUID()}`;
  await assert.rejects(() => consoleProvider.loginOpenCodeConsole(refusedProfile), /no active Go/);
  await assert.rejects(() => stat(paths.openCodeProfileDataFile(refusedProfile)));
  await report("PASS no-subscription add creates no profile; refresh preserves saved account");
  hasSubscription = true;
  process.env.FAKE_LOGIN_MODE = "cancel";
  const cancelledProfile = `go-${randomUUID()}`;
  await assert.rejects(() => consoleProvider.loginOpenCodeConsole(cancelledProfile), /cancelled or failed/);
  await assert.rejects(() => stat(paths.openCodeProfileV2DatabaseFile(cancelledProfile)));
  delete process.env.FAKE_LOGIN_MODE;
  await report("PASS cancelled authorization creates no saved profile/database");

  await assert.rejects(() => stat(join(home, ".local", "share", "opencode", "opencode.db")));
  const marker = await readFile(paths.openCodeProfileDataFile(profileA), "utf8");
  assert(!/fake-(?:access|refresh)-/.test(marker));
  await writeFile(join(home, "events.json"), JSON.stringify(events, null, 2));
  await report("PASS no shared native database, no marker/CLI output token leakage");
  await report(`ALL ACCEPTANCE CHECKS PASSED; retained review artifacts: ${home}`);
} catch (error) {
  await report(`FAIL ${String(error)}`);
  throw error;
} finally {
  fake.stop(true);
}
