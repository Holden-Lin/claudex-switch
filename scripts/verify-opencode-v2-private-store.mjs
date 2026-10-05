#!/usr/bin/env node

// Fake-key offline acceptance fixture for an installed OpenCode V2 binary.
// It first checks upstream private-store API primitives, then launches the
// actual claudex-switch CLI against real private OpenCode servers. A PATH shim
// delegates --version and `serve` to the pinned binary and intercepts only the
// final interactive TUI invocation, so this validates the product's launch
// contract without claiming interactive TUI or model-request acceptance.
// Set CLAUDEX_OPENCODE_V2_NETWORK_ISOLATED=1 in a container with no external
// interfaces/routes to verify and require namespace isolation; this path does
// not use ptrace, strace, cc, or download dependencies. The secondary local
// path uses bounded dynamic-ELF interception plus strace, not a security
// sandbox; it is only defense-in-depth for accidental egress.

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

const OPENCODE = process.env.OPENCODE_BIN || "opencode";
const NETWORK_ISOLATED = process.env.CLAUDEX_OPENCODE_V2_NETWORK_ISOLATED === "1";
const PROVIDER_ID = "claudex-switch-opencode-go";
const MODEL_ID = "kimi-k3";
const FAKE_DEFAULT_KEY = "fake-only-opencode-v2-default-store-key";
const FAKE_ALIAS_A_KEY = "fake-only-opencode-v2-alias-a-key";
const FAKE_ALIAS_A_REFRESHED_KEY = "fake-only-opencode-v2-alias-a-refreshed-key";
const FAKE_ALIAS_B_KEY = "fake-only-opencode-v2-alias-b-key";
const FAKE_PRODUCT_ALIAS_A_KEY = "fake-only-opencode-v2-product-alias-a-key";
const FAKE_PRODUCT_ALIAS_A_REFRESHED_KEY = "fake-only-opencode-v2-product-alias-a-refreshed-key";
const FAKE_PRODUCT_ALIAS_B_KEY = "fake-only-opencode-v2-product-alias-b-key";
const FAKE_PRODUCT_MANUAL_KEY = "fake-only-opencode-v2-product-manual-connect-key";
const FAKE_PRODUCT_GLOBAL_AUTH_KEY = "fake-only-global-opencode-auth-key";
const FAKE_PRODUCT_GLOBAL_ENV_KEY = "fake-only-global-opencode-env-key";
const FAKE_PRODUCT_GLOBAL_PASSWORD = "fake-only-global-opencode-password";

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

async function assertNetworkDisabledContainer() {
  const interfaces = await readdir("/sys/class/net");
  assert(
    interfaces.length === 1 && interfaces[0] === "lo",
    "Network-isolated mode requires a container with only the loopback interface",
  );

  const ipv4 = await readFile("/proc/net/route", "utf8").catch(() => "");
  for (const line of ipv4.split(/\r?\n/).slice(1)) {
    if (!line.trim()) continue;
    const [iface, destination, , rawFlags] = line.trim().split(/\s+/);
    assert(iface === "lo", "Network-isolated mode found an external IPv4 route");
    if (destination === "00000000") {
      const flags = Number.parseInt(rawFlags, 16);
      assert(Number.isFinite(flags) && (flags & 0x200) !== 0, "Network-isolated mode found a usable default IPv4 route");
    }
  }

  const ipv6 = await readFile("/proc/net/ipv6_route", "utf8").catch(() => "");
  for (const line of ipv6.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const fields = line.trim().split(/\s+/);
    assert(fields.at(-1) === "lo", "Network-isolated mode found an external IPv6 route");
    if (fields[0] === "0".repeat(32) && fields[1] === "00") {
      const flags = Number.parseInt(fields[8], 16);
      assert(Number.isFinite(flags) && (flags & 0x200) !== 0, "Network-isolated mode found a usable default IPv6 route");
    }
  }

  const proxyKeys = [
    "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy",
  ];
  assert(
    proxyKeys.every((key) => !process.env[key]),
    "Network-isolated mode must not inherit proxy settings",
  );
}

function locationData(value) {
  assert(
    value && typeof value === "object" && value.location &&
      typeof value.location.directory === "string" && value.data !== undefined,
    "OpenCode returned an unexpected location-scoped API response",
  );
  return value.data;
}

function parseServerUrl(line) {
  let value;
  try {
    value = JSON.parse(line);
  } catch {
    return null;
  }
  if (!value || typeof value.url !== "string") return null;
  const url = new URL(value.url);
  assert(
    url.protocol === "http:" && url.hostname === "127.0.0.1" && url.port &&
      !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash,
    "OpenCode did not bind the fixture service to IPv4 loopback",
  );
  return url.origin;
}

async function startServer(env, guardLibrary, guardLog, tracePrefix) {
  const serverArgs = [
    "serve",
    "--stdio",
    "--hostname",
    "127.0.0.1",
    "--port",
    "0",
  ];
  const command = NETWORK_ISOLATED
    ? { binary: OPENCODE, args: serverArgs }
    : {
        binary: "strace",
        args: [
          "-ff",
          "-qq",
          "-e",
          "trace=network",
          "-o",
          tracePrefix,
          "-E",
          `LD_PRELOAD=${guardLibrary}`,
          "-E",
          `CLAUDEX_NET_GUARD_LOG=${guardLog}`,
          OPENCODE,
          ...serverArgs,
        ],
      };
  const child = spawn(command.binary, command.args, {
    env,
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  });
  child.stderr.on("data", () => {});
  try {
    const baseUrl = await new Promise((resolve, reject) => {
    let pending = "";
    const timer = setTimeout(() => finish(new Error("Timed out waiting for the local OpenCode server")), 15_000);
    const finish = (error, url) => {
      clearTimeout(timer);
      child.stdout.off("data", onData);
      child.off("error", onError);
      child.off("close", onClose);
      if (error) reject(error);
      else resolve(url);
    };
    const onData = (chunk) => {
      pending += chunk.toString();
      const lines = pending.split(/\r?\n/);
      pending = lines.pop() || "";
      for (const line of lines) {
        try {
          const url = parseServerUrl(line);
          if (url) return finish(undefined, url);
        } catch (error) {
          return finish(error);
        }
      }
    };
    const onError = () => finish(new Error("Could not start the local OpenCode V2 server"));
    const onClose = () => finish(new Error("OpenCode exited before its local server became ready"));
    child.stdout.on("data", onData);
    child.once("error", onError);
    child.once("close", onClose);
    });
    child.stdout.on("data", () => {});
    return { child, baseUrl };
  } catch (error) {
    await stopServer(child);
    throw error;
  }
}

function runVersionWithGuard(env, guardLibrary, guardLog, tracePrefix) {
  const versionArgs = ["--version"];
  const command = NETWORK_ISOLATED
    ? { binary: OPENCODE, args: versionArgs }
    : {
        binary: "strace",
        args: [
          "-ff",
          "-qq",
          "-e",
          "trace=network",
          "-o",
          tracePrefix,
          "-E",
          `LD_PRELOAD=${guardLibrary}`,
          "-E",
          `CLAUDEX_NET_GUARD_LOG=${guardLog}`,
          OPENCODE,
          ...versionArgs,
        ],
      };
  return spawnSync(command.binary, command.args, {
    env,
    encoding: "utf8",
    timeout: 5_000,
    windowsHide: true,
  });
}

async function assertNetworkContained(guardLog, tracePrefix) {
  if (NETWORK_ISOLATED) await assertNetworkDisabledContainer();
  let denials = "";
  try {
    denials = await readFile(guardLog, "utf8");
  } catch {
    // No denials were recorded.
  }
  if (denials.trim()) {
    fail(`The loopback guard blocked an unexpected network route: ${denials.trim().split("\n")[0]}`);
  }

  const directory = dirname(tracePrefix);
  const prefix = `${tracePrefix.split("/").at(-1)}.`;
  const files = (await readdir(directory)).filter((name) => name.startsWith(prefix));
  for (const name of files) {
    const trace = await readFile(join(directory, name), "utf8");
    for (const line of trace.split("\n")) {
      if (!/\b(?:connect|sendto|sendmsg|bind|listen)\(/.test(line)) continue;
      if (!/sa_family=AF_INET6?\b/.test(line)) continue;
      const ipv4 = line.match(/sin_addr=inet_addr\("([^"]+)"\)/)?.[1];
      const ipv6 = line.match(/inet_pton\(AF_INET6, "([^"]+)"/)?.[1];
      const host = ipv4 ?? ipv6;
      if (!host || (ipv4 && !ipv4.startsWith("127.")) || (ipv6 && ipv6 !== "::1" && !ipv6.startsWith("::ffff:127."))) {
        fail("strace observed a non-loopback IPv4/IPv6 network syscall; fixture stopped");
      }
    }
  }
}

async function stopServer(child) {
  const exited = () => child.exitCode !== null || child.signalCode !== null;
  const waitClose = (timeoutMs) => {
    if (exited()) return Promise.resolve(true);
    return new Promise((resolve) => {
      const finish = (closed) => {
        clearTimeout(timer);
        child.off("close", onClose);
        resolve(closed);
      };
      const onClose = () => finish(true);
      const timer = setTimeout(() => finish(false), timeoutMs);
      child.once("close", onClose);
    });
  };
  child.stdin.end();
  if (await waitClose(1_500)) return;
  child.kill("SIGTERM");
  if (await waitClose(1_500)) return;
  child.kill("SIGKILL");
  if (!(await waitClose(1_500))) fail("OpenCode V2 fixture server did not exit after SIGKILL");
}

function headers(password) {
  return {
    authorization: `Basic ${Buffer.from(`opencode:${password}`).toString("base64")}`,
    "content-type": "application/json",
  };
}

async function request(baseUrl, password, path, init = {}) {
  const url = new URL(path, baseUrl);
  assert(url.hostname === "127.0.0.1", "fixture attempted a non-loopback request");
  return fetch(url, {
    ...init,
    headers: { ...headers(password), ...(init.headers || {}) },
    signal: AbortSignal.timeout(5_000),
    redirect: "error",
  });
}

async function getJson(response, description) {
  assert(response.ok, `${description} failed with HTTP ${response.status}`);
  try {
    return await response.json();
  } catch {
    fail(`${description} returned invalid JSON`);
  }
}

function fixtureConfig(modelId) {
  return {
    model: `${PROVIDER_ID}/${modelId}`,
    enabled_providers: [PROVIDER_ID],
    experimental: {
      policies: [
        { action: "provider.use", resource: "*", effect: "deny" },
        { action: "provider.use", resource: PROVIDER_ID, effect: "allow" },
      ],
    },
    providers: {
      [PROVIDER_ID]: {
        name: "OpenCode Go (claudex-switch test)",
        canonical: "opencode-go",
        models: { [modelId]: {} },
      },
    },
  };
}

async function makeFixtureHome(base, name, modelId) {
  const home = join(base, name);
  const dataHome = join(home, "data");
  await Promise.all(
    [join(home, "config", "opencode"), join(dataHome, "opencode"), join(home, "state"), join(home, "cache")]
      .map((path) => mkdir(path, { recursive: true, mode: 0o700 })),
  );
  const password = randomBytes(32).toString("base64url");
  const env = {
    PATH: process.env.PATH || "/usr/bin:/bin",
    HOME: home,
    TMPDIR: home,
    XDG_CONFIG_HOME: join(home, "config"),
    XDG_DATA_HOME: dataHome,
    XDG_STATE_HOME: join(home, "state"),
    XDG_CACHE_HOME: join(home, "cache"),
    OPENCODE_CONFIG_DIR: join(home, "config", "opencode"),
    OPENCODE_DB: join(dataHome, "opencode", "opencode.db"),
    OPENCODE_CONFIG_PROJECT_DISABLE: "1",
    OPENCODE_CONFIG_CONTENT: JSON.stringify(fixtureConfig(modelId)),
    OPENCODE_PASSWORD: password,
    OPENCODE_DISABLE_AUTOUPDATE: "1",
    OPENCODE_DISABLE_MODELS_FETCH: "1",
    OPENCODE_DISABLE_FILEWATCHER: "1",
  };
  assert(
    !JSON.stringify(env).includes("fake-only-opencode-v2-"),
    "Fixture keys must never appear in the OpenCode child environment",
  );
  return { name, home, password, env, modelId };
}

async function waitForManagedKeyMethod(server) {
  const deadline = Date.now() + 15_000;
  const path = `/api/integration/${encodeURIComponent(PROVIDER_ID)}`;
  while (Date.now() < deadline) {
    let response;
    try {
      response = await request(server.baseUrl, server.password, path);
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
      continue;
    }
    if (response.status === 404 || response.status === 503) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      continue;
    }
    const integration = locationData(await getJson(response, "managed integration readiness"));
    assert(integration.id === PROVIDER_ID, "Unexpected managed integration ID");
    if (integration.methods?.some((method) => method.type === "key")) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  fail("Managed key method did not become ready");
}

async function verifyConfiguredModel(server, expectedModelId) {
  const expected = JSON.stringify([{ providerID: PROVIDER_ID, id: expectedModelId }]);
  const deadline = Date.now() + 15_000;
  let previous = "";
  let stablePolls = 0;
  while (Date.now() < deadline) {
    let response;
    try {
      response = await request(server.baseUrl, server.password, "/api/model");
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 150));
      continue;
    }
    if (!response.ok) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      continue;
    }
    const models = locationData(await getJson(response, "local model inventory"));
    assert(Array.isArray(models), "OpenCode returned an unexpected model inventory");
    const normalized = models
      .map((model) => {
        assert(
          model && typeof model.providerID === "string" && typeof model.id === "string",
          "OpenCode returned an unexpected model inventory",
        );
        return { providerID: model.providerID, id: model.id };
      })
      .toSorted((left, right) => `${left.providerID}/${left.id}`.localeCompare(`${right.providerID}/${right.id}`));
    const actual = JSON.stringify(normalized);
    stablePolls = actual === expected && actual === previous ? stablePolls + 1 : actual === expected ? 1 : 0;
    previous = actual;
    if (stablePolls >= 3) return;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  fail("OpenCode's model inventory did not settle to the configured managed Go model");
}

async function getManagedIntegration(server, description = "credential verification") {
  const response = await request(
    server.baseUrl,
    server.password,
    `/api/integration/${encodeURIComponent(PROVIDER_ID)}`,
  );
  const integration = locationData(await getJson(response, description));
  assert(integration.id === PROVIDER_ID && Array.isArray(integration.connections), "Unexpected credential response");
  return integration;
}

async function connectFakeCredential(server, key, label) {
  const response = await request(
    server.baseUrl,
    server.password,
    `/api/integration/${encodeURIComponent(PROVIDER_ID)}/connect/key`,
    { method: "POST", body: JSON.stringify({ key, label }) },
  );
  assert(response.status === 204, "OpenCode did not store the fake key in its private SQLite database");
  const integration = await getManagedIntegration(server);
  const active = integration.connections[0];
  assert(
    active?.type === "credential" && active.label === label && typeof active.id === "string" && active.id,
    "OpenCode did not activate the selected fake credential",
  );
  return { id: active.id, label };
}

async function withFixtureServer(base, fixture, callback) {
  const password = fixture.password;
  const tracePrefix = join(base, `${fixture.name}-strace`);
  const guardLog = join(base, `${fixture.name}-network-denials.log`);
  const guardLibrary = join(base, "libclaudex-loopback-guard.so");
  const server = await startServer(fixture.env, guardLibrary, guardLog, tracePrefix);
  server.password = password;
  try {
    await waitForManagedKeyMethod(server);
    await verifyConfiguredModel(server, fixture.modelId);
    return await callback(server);
  } finally {
    await stopServer(server.child);
    await assertNetworkContained(guardLog, tracePrefix);
  }
}

async function removeCredential(server, credentialId) {
  const response = await request(
    server.baseUrl,
    server.password,
    `/api/credential/${encodeURIComponent(credentialId)}`,
    { method: "DELETE" },
  );
  assert(
    response.status === 204 || response.status === 404 || response.ok,
    "OpenCode could not clean up the fixture's previous fake credential",
  );
}

async function fileSha256(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

function productProfilePaths(home, profileId) {
  const root = join(home, ".claudex-switch", "opencode", "profiles", profileId);
  return {
    root,
    profile: join(root, "profile.json"),
    auth: join(root, "data", "opencode", "auth.json"),
    database: join(root, "v2-runtime", "data", "opencode", "opencode.db"),
  };
}

async function writeProductProfile(home, profileId, key, defaultModel = "opencode-go/kimi-k3") {
  const paths = productProfilePaths(home, profileId);
  await mkdir(dirname(paths.profile), { recursive: true, mode: 0o700 });
  await mkdir(dirname(paths.auth), { recursive: true, mode: 0o700 });
  await writeFile(paths.profile, JSON.stringify({ type: "go", defaultModel }, null, 2), {
    mode: 0o600,
  });
  await writeFile(
    paths.auth,
    JSON.stringify({ "opencode-go": { type: "api", key } }, null, 2),
    { mode: 0o600 },
  );
  return paths;
}

async function readPidFile(path) {
  try {
    return (await readFile(path, "utf8"))
      .split(/\r?\n/)
      .map((value) => Number(value.trim()))
      .filter((pid) => Number.isInteger(pid) && pid > 0);
  } catch {
    return [];
  }
}

async function assertProcessesStopped(pids) {
  for (const pid of pids) {
    try {
      process.kill(pid, 0);
      fail("The product launch left an OpenCode credential server running.");
    } catch (error) {
      if (error?.code !== "ESRCH") {
        fail("Could not verify shutdown of the product's OpenCode credential server.");
      }
    }
  }
}

async function createProductLaunchFixture(base) {
  const productRoot = join(base, "claudex-product");
  const home = join(productRoot, "home");
  const globalData = join(productRoot, "normal-xdg-data");
  const configHome = join(productRoot, "config");
  const stateHome = join(productRoot, "normal-xdg-state");
  const cacheHome = join(productRoot, "normal-xdg-cache");
  const projectDir = join(productRoot, "project");
  const wrapperDir = join(productRoot, "bin");
  const globalOpenCodeDir = join(globalData, "opencode");
  const globalAuthFile = join(globalOpenCodeDir, "auth.json");
  const globalDatabase = join(globalOpenCodeDir, "opencode.db");
  const serverPidFile = join(productRoot, "private-server-pids.txt");
  const eventFile = join(productRoot, "opencode-wrapper-events.txt");
  const captureScript = join(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "tests",
    "fixtures",
    "capture-opencode-v2-launch.mjs",
  );
  const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
  const cliPath = join(repositoryRoot, "dist", "claudex-switch.js");
  const wrapperPath = join(wrapperDir, "opencode");
  await Promise.all(
    [
      globalOpenCodeDir,
      configHome,
      join(configHome, "opencode"),
      stateHome,
      cacheHome,
      projectDir,
      wrapperDir,
      join(home, ".claudex-switch"),
    ].map((path) => mkdir(path, { recursive: true, mode: 0o700 })),
  );

  await writeFile(
    globalAuthFile,
    JSON.stringify({ "opencode-go": { type: "api", key: FAKE_PRODUCT_GLOBAL_AUTH_KEY } }),
    { mode: 0o600 },
  );
  // A non-SQLite sentinel makes any accidental use of this inherited path
  // fail at startup; V2 must replace it with the alias-private DB.
  await writeFile(globalDatabase, "fake global OpenCode database sentinel", { mode: 0o600 });

  const profileA = "go-00000000-0000-4000-8000-000000000011";
  const profileB = "go-00000000-0000-4000-8000-000000000012";
  const badModelProfile = "go-00000000-0000-4000-8000-000000000013";
  await writeProductProfile(home, profileA, FAKE_PRODUCT_ALIAS_A_KEY);
  await writeProductProfile(home, profileB, FAKE_PRODUCT_ALIAS_B_KEY);
  await writeProductProfile(
    home,
    badModelProfile,
    "fake-only-opencode-v2-product-bad-model-key",
    "anthropic/claude-sonnet",
  );

  const aliasRegistry = {
    version: 1,
    aliases: [
      { alias: "product-a", target: { provider: "opencode", profileId: profileA }, createdAt: 1 },
      { alias: "product-b", target: { provider: "opencode", profileId: profileB }, createdAt: 2 },
      {
        alias: "product-bad-model",
        target: { provider: "opencode", profileId: badModelProfile },
        createdAt: 3,
      },
    ],
  };
  await writeFile(
    join(home, ".claudex-switch", "aliases.json"),
    JSON.stringify(aliasRegistry, null, 2),
    { mode: 0o600 },
  );

  const shim = `#!/bin/sh
set -eu
case "\${1-}" in
  --version)
    printf '%s\\n' 'version' >> "$CLAUDEX_TEST_EVENT_FILE"
    exec "$OPENCODE_BIN" "$@"
    ;;
  serve)
    if [ "$#" -ne 6 ] || [ "$2" != "--stdio" ] || [ "$3" != "--hostname" ] || [ "$4" != "127.0.0.1" ] || [ "$5" != "--port" ] || [ "$6" != "0" ]; then
      echo 'Unexpected OpenCode server arguments in the offline launch fixture' >&2
      exit 73
    fi
    printf '%s\\n' 'serve' >> "$CLAUDEX_TEST_EVENT_FILE"
    printf '%s\\n' "$$" >> "$CLAUDEX_TEST_SERVER_PID_FILE"
    exec "$OPENCODE_BIN" "$@"
    ;;
  --standalone)
    printf '%s\\n' 'tui' >> "$CLAUDEX_TEST_EVENT_FILE"
    exec "$CLAUDEX_TEST_NODE_BIN" "$CLAUDEX_TEST_CAPTURE_SCRIPT" "$@"
    ;;
  *)
    printf '%s\\n' 'unexpected' >> "$CLAUDEX_TEST_EVENT_FILE"
    echo 'Unexpected OpenCode command in the offline launch fixture' >&2
    exit 74
    ;;
esac
`;
  await writeFile(wrapperPath, shim, { mode: 0o700, flag: "wx" });

  const productEnv = {
    // Exclude the real OpenCode binary from PATH: if the shim cannot execute,
    // version detection must fail closed rather than accidentally opening the
    // interactive TUI. Server/version delegation uses this absolute path.
    PATH: `${wrapperDir}:/usr/bin:/bin`,
    HOME: home,
    CLAUDEX_TEST_HOME: home,
    CLAUDEX_TEST_CAPTURE_SCRIPT: captureScript,
    CLAUDEX_TEST_SERVER_PID_FILE: serverPidFile,
    CLAUDEX_TEST_EVENT_FILE: eventFile,
    CLAUDEX_TEST_NODE_BIN: process.execPath,
    OPENCODE_BIN: OPENCODE,
    OPENCODE_CONFIG_CONTENT: "{}",
    OPENCODE_DB: globalDatabase,
    OPENCODE_API_KEY: FAKE_PRODUCT_GLOBAL_ENV_KEY,
    OPENCODE_AUTH_CONTENT: JSON.stringify({
      "opencode-go": { type: "api", key: FAKE_PRODUCT_GLOBAL_AUTH_KEY },
    }),
    OPENCODE_PASSWORD: FAKE_PRODUCT_GLOBAL_PASSWORD,
    CLAUDEX_DISABLE_AUTO_UPDATE: "1",
    OPENCODE_DISABLE_AUTOUPDATE: "1",
    OPENCODE_DISABLE_MODELS_FETCH: "1",
    OPENCODE_DISABLE_FILEWATCHER: "1",
    OPENCODE_CONFIG_PROJECT_DISABLE: "1",
    XDG_CONFIG_HOME: configHome,
    XDG_DATA_HOME: globalData,
    XDG_STATE_HOME: stateHome,
    XDG_CACHE_HOME: cacheHome,
  };

  const resolvedOpenCode = spawnSync("/bin/sh", ["-c", "command -v opencode"], {
    env: productEnv,
    encoding: "utf8",
    timeout: 5_000,
  });
  assert(
    resolvedOpenCode.status === 0 && resolvedOpenCode.stdout.trim() === wrapperPath,
    "The isolated product PATH did not resolve OpenCode to the deterministic fixture shim.",
  );

  return {
    productRoot,
    home,
    globalAuthFile,
    globalDatabase,
    serverPidFile,
    eventFile,
    projectDir,
    cliPath,
    productEnv,
    profileA,
    profileB,
    badModelProfile,
    globalHashes: {
      auth: await fileSha256(globalAuthFile),
      database: await fileSha256(globalDatabase),
    },
    fakeKeys: [
      FAKE_PRODUCT_ALIAS_A_KEY,
      FAKE_PRODUCT_ALIAS_A_REFRESHED_KEY,
      FAKE_PRODUCT_ALIAS_B_KEY,
      FAKE_PRODUCT_MANUAL_KEY,
      FAKE_PRODUCT_GLOBAL_AUTH_KEY,
      FAKE_PRODUCT_GLOBAL_ENV_KEY,
      FAKE_PRODUCT_GLOBAL_PASSWORD,
      "fake-only-opencode-v2-product-bad-model-key",
    ],
  };
}

async function runProductLaunch(fixture, alias, captureName, overrides = {}) {
  const capturePath = join(fixture.productRoot, `${captureName}.json`);
  const pidsBefore = await readPidFile(fixture.serverPidFile);
  let eventsBefore = [];
  try {
    eventsBefore = (await readFile(fixture.eventFile, "utf8")).split(/\r?\n/).filter(Boolean);
  } catch {}
  const env = { ...fixture.productEnv, ...overrides, CLAUDEX_TEST_CAPTURE_FILE: capturePath };
  const result = spawnSync(process.execPath, [fixture.cliPath, alias, "-run"], {
    cwd: fixture.projectDir,
    env,
    encoding: "utf8",
    timeout: 120_000,
    maxBuffer: 2 * 1024 * 1024,
    windowsHide: true,
  });
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  for (const key of fixture.fakeKeys) {
    if (output.includes(key)) fail("A fake credential appeared in claudex-switch launch output.");
  }
  if (result.error) fail("Could not execute the built claudex-switch CLI in the offline fixture.");

  const pidsAfter = await readPidFile(fixture.serverPidFile);
  const startedPids = pidsAfter.slice(pidsBefore.length);
  await assertProcessesStopped(startedPids);
  const eventsAfter = await readFile(fixture.eventFile, "utf8").catch(() => "");
  const startedEvents = eventsAfter.split(/\r?\n/).filter(Boolean).slice(eventsBefore.length);
  let capture = null;
  try {
    capture = JSON.parse(await readFile(capturePath, "utf8"));
    for (const key of fixture.fakeKeys) {
      if (JSON.stringify(capture).includes(key)) fail("A fake credential appeared in the launch capture.");
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  return { status: result.status, output, capture, startedPids, startedEvents };
}

function assertProductLaunchSucceeded(result, alias) {
  if (result.status === 0) return;
  let safeOutput = result.output;
  safeOutput = safeOutput.replace(/fake-only-[A-Za-z0-9_-]+/g, "[REDACTED]");
  safeOutput = safeOutput.replace(/[A-Za-z0-9_+\/=.-]{40,}/g, "[LONG-VALUE-REDACTED]");
  safeOutput = safeOutput.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[EMAIL-REDACTED]");
  fail(
    `The built claudex-switch CLI failed for ${alias} (status ${result.status}; OpenCode shim events: ${result.startedEvents.join(",") || "none"}): ${safeOutput.trim().slice(-1400)}`,
  );
}

function assertRealServerAndInterceptedTui(result, alias) {
  assert(result.startedEvents.includes("version"), `${alias} did not detect the pinned OpenCode binary through PATH.`);
  assert(result.startedEvents.includes("serve"), `${alias} did not start the real private OpenCode server through PATH.`);
  assert(result.startedEvents.includes("tui"), `${alias} did not reach the intercepted final TUI invocation.`);
}

function assertProductCapture(fixture, profileId, capture) {
  const expected = productProfilePaths(fixture.home, profileId);
  assert(capture !== null, "The claudex-switch launch did not reach the deterministic TUI capture.");
  assert(capture.database === expected.database, "The launch did not select this alias's private SQLite database.");
  assert(capture.dataHome === join(expected.root, "v2-runtime", "data"), "The launch used a non-private XDG data root.");
  assert(capture.stateHome === join(expected.root, "v2-runtime", "state"), "The launch used a non-private XDG state root.");
  assert(capture.cacheHome === join(expected.root, "v2-runtime", "cache"), "The launch used a non-private XDG cache root.");
  assert(capture.model === `${PROVIDER_ID}/${MODEL_ID}`, "The launch used an unexpected managed Go model.");
  assert(capture.providerIds.join(",") === PROVIDER_ID, "The launch exposed an unexpected provider inventory.");
  assert(capture.modelIds.includes(MODEL_ID), "The launch omitted the selected Go model from its private provider config.");
  assert(capture.args.includes("--standalone") && capture.args.includes("--auto"), "The launcher omitted the V2 standalone/auto flags.");
  assert(!capture.args.some((arg) => ["--server", "--attach", "--config", "--model"].includes(arg)), "The launcher forwarded an unsafe server/config/model override.");
}

function productApiFixture(fixture, profileId, name) {
  const profile = productProfilePaths(fixture.home, profileId);
  const password = randomBytes(32).toString("base64url");
  const runtime = join(profile.root, "v2-runtime");
  const dataHome = join(runtime, "data");
  return {
    name,
    password,
    modelId: MODEL_ID,
    env: {
      PATH: process.env.PATH || "/usr/bin:/bin",
      HOME: fixture.home,
      TMPDIR: fixture.home,
      XDG_CONFIG_HOME: fixture.productEnv.XDG_CONFIG_HOME,
      XDG_DATA_HOME: dataHome,
      XDG_STATE_HOME: join(runtime, "state"),
      XDG_CACHE_HOME: join(runtime, "cache"),
      OPENCODE_CONFIG_DIR: join(fixture.productEnv.XDG_CONFIG_HOME, "opencode"),
      OPENCODE_DB: profile.database,
      OPENCODE_CONFIG_PROJECT_DISABLE: "1",
      OPENCODE_CONFIG_CONTENT: JSON.stringify(fixtureConfig(MODEL_ID)),
      OPENCODE_PASSWORD: password,
      OPENCODE_DISABLE_AUTOUPDATE: "1",
      OPENCODE_DISABLE_MODELS_FETCH: "1",
      OPENCODE_DISABLE_FILEWATCHER: "1",
    },
  };
}

async function readProductConnections(fixture, profileId, name) {
  const serverFixture = productApiFixture(fixture, profileId, name);
  return withFixtureServer(
    fixture.productRoot,
    serverFixture,
    async (server) => {
      const integration = await getManagedIntegration(server, `${name} credential verification`);
      return integration.connections.map((connection) => ({
        id: connection?.id,
        type: connection?.type,
        label: connection?.label,
      }));
    },
  );
}

function storedCredentialKeyHash(databasePath, credentialId) {
  // OpenCode v2.0.6 stores Credential.Value JSON in credential.value; this
  // test-only read uses the pinned schema and only fake alias databases.
  // Never print or return the raw key.
  let database;
  try {
    database = new DatabaseSync(databasePath, { readOnly: true });
  } catch {
    fail("Could not open an alias-private fake credential database read-only.");
  }
  try {
    const row = database
      .prepare("SELECT value FROM credential WHERE id = ?")
      .get(credentialId);
    if (!row || typeof row.value !== "string") {
      fail("The expected fake credential was not present in its alias-private database.");
    }
    let value;
    try {
      value = JSON.parse(row.value);
    } catch {
      fail("The stored fake credential used an unexpected v2.0.6 schema.");
    }
    if (value?.type !== "key" || typeof value.key !== "string") {
      fail("The stored fake credential used an unexpected v2.0.6 key value.");
    }
    return createHash("sha256").update(value.key, "utf8").digest("hex");
  } finally {
    database.close();
  }
}

function assertStoredCredentialKey(databasePath, connection, expectedKey, description) {
  assert(
    connection?.type === "credential" && typeof connection.id === "string",
    `${description} has no stored credential ID.`,
  );
  const expectedHash = createHash("sha256").update(expectedKey, "utf8").digest("hex");
  assert(
    storedCredentialKeyHash(databasePath, connection.id) === expectedHash,
    `${description} stored a different fake key than the claudex sidecar selected.`,
  );
}

async function verifyProductLaunchContract(base) {
  const fixture = await createProductLaunchFixture(base);
  const authHashBefore = fixture.globalHashes.auth;
  const databaseHashBefore = fixture.globalHashes.database;

  const firstA = await runProductLaunch(fixture, "product-a", "product-a-first");
  assertProductLaunchSucceeded(firstA, "alias A");
  assertRealServerAndInterceptedTui(firstA, "alias A");
  assertProductCapture(fixture, fixture.profileA, firstA.capture);
  const aFirstConnections = await readProductConnections(fixture, fixture.profileA, "product-a-first");
  const aFirstActive = aFirstConnections[0];
  assert(
    aFirstActive?.type === "credential" && aFirstActive.label.startsWith(`claudex-switch-${fixture.profileA}-`),
    "The product did not sync its saved alias A credential through the V2 local API.",
  );
  assertStoredCredentialKey(
    productProfilePaths(fixture.home, fixture.profileA).database,
    aFirstActive,
    FAKE_PRODUCT_ALIAS_A_KEY,
    "The first alias A launch",
  );
  const aFirstOwnedLabel = aFirstActive.label;

  const firstB = await runProductLaunch(fixture, "product-b", "product-b-first");
  assertProductLaunchSucceeded(firstB, "alias B");
  assertRealServerAndInterceptedTui(firstB, "alias B");
  assertProductCapture(fixture, fixture.profileB, firstB.capture);
  const bFirstConnections = await readProductConnections(fixture, fixture.profileB, "product-b-first");
  const bFirstActive = bFirstConnections[0];
  assert(
    bFirstActive?.type === "credential" && bFirstActive.label.startsWith(`claudex-switch-${fixture.profileB}-`),
    "The product did not sync its saved alias B credential through the V2 local API.",
  );
  assertStoredCredentialKey(
    productProfilePaths(fixture.home, fixture.profileB).database,
    bFirstActive,
    FAKE_PRODUCT_ALIAS_B_KEY,
    "The alias B launch",
  );
  assert(
    !bFirstConnections.some((connection) => connection.label === aFirstOwnedLabel),
    "Alias B's private database contains alias A's connection.",
  );

  const manual = await withFixtureServer(
    fixture.productRoot,
    productApiFixture(fixture, fixture.profileA, "product-a-manual-connect"),
    (server) => connectFakeCredential(server, FAKE_PRODUCT_MANUAL_KEY, "manual-connect-canary"),
  );
  const manualConnections = await readProductConnections(fixture, fixture.profileA, "product-a-manual-active");
  assert(manualConnections[0]?.id === manual.id, "The manual V2 /connect fixture did not become active.");
  assertStoredCredentialKey(
    productProfilePaths(fixture.home, fixture.profileA).database,
    manualConnections[0],
    FAKE_PRODUCT_MANUAL_KEY,
    "The manual /connect fixture",
  );

  const resetA = await runProductLaunch(fixture, "product-a", "product-a-reset");
  assertProductLaunchSucceeded(resetA, "alias A after manual /connect");
  assertRealServerAndInterceptedTui(resetA, "alias A after manual /connect");
  assertProductCapture(fixture, fixture.profileA, resetA.capture);
  const resetConnections = await readProductConnections(fixture, fixture.profileA, "product-a-reset-active");
  assert(
    resetConnections[0]?.type === "credential" &&
      resetConnections[0].label.startsWith(`claudex-switch-${fixture.profileA}-`),
    "The next claudex launch did not restore alias A's saved sidecar credential after manual /connect.",
  );
  assertStoredCredentialKey(
    productProfilePaths(fixture.home, fixture.profileA).database,
    resetConnections[0],
    FAKE_PRODUCT_ALIAS_A_KEY,
    "The post-/connect alias A launch",
  );
  assert(
    resetConnections.some((connection) => connection.id === manual.id && connection.label === "manual-connect-canary"),
    "The product removed a user-created /connect credential while restoring its own key.",
  );
  assert(
    !resetConnections.some((connection) => connection.label === aFirstOwnedLabel),
    "The product did not clean up its previous owned alias A credential.",
  );

  // The refresh unit test covers the prompt/save command. Here, model the
  // committed result of refresh by rotating only the fake sidecar; the actual
  // product -run path must sync that new value on its next launch.
  const refreshedPaths = productProfilePaths(fixture.home, fixture.profileA);
  await writeFile(
    refreshedPaths.auth,
    JSON.stringify({ "opencode-go": { type: "api", key: FAKE_PRODUCT_ALIAS_A_REFRESHED_KEY } }, null, 2),
    { mode: 0o600 },
  );
  const refreshedA = await runProductLaunch(fixture, "product-a", "product-a-refreshed");
  assertProductLaunchSucceeded(refreshedA, "alias A after sidecar refresh");
  assertRealServerAndInterceptedTui(refreshedA, "alias A after sidecar refresh");
  assertProductCapture(fixture, fixture.profileA, refreshedA.capture);
  const refreshedConnections = await readProductConnections(fixture, fixture.profileA, "product-a-refreshed-active");
  assert(
    refreshedConnections[0]?.type === "credential" &&
      refreshedConnections[0].label.startsWith(`claudex-switch-${fixture.profileA}-`),
    "The post-refresh launch did not activate the updated alias A key.",
  );
  assertStoredCredentialKey(
    productProfilePaths(fixture.home, fixture.profileA).database,
    refreshedConnections[0],
    FAKE_PRODUCT_ALIAS_A_REFRESHED_KEY,
    "The post-refresh alias A launch",
  );
  assert(
    refreshedConnections.some((connection) => connection.id === manual.id && connection.label === "manual-connect-canary"),
    "The post-refresh launch removed the manual /connect credential.",
  );
  assert(
    !refreshedConnections.some((connection) => connection.id === resetConnections[0]?.id),
    "Refresh did not remove only the previously owned alias A credential.",
  );

  const finalB = await readProductConnections(fixture, fixture.profileB, "product-b-final");
  assert(finalB[0]?.id === bFirstActive.id, "Alias A launch/refresh changed alias B's active credential.");
  assertStoredCredentialKey(
    productProfilePaths(fixture.home, fixture.profileB).database,
    finalB[0],
    FAKE_PRODUCT_ALIAS_B_KEY,
    "Alias B after alias A refresh",
  );
  assert(!finalB.some((connection) => connection.id === manual.id), "Alias B contains alias A's manual connection.");
  assert(
    await fileSha256(fixture.globalAuthFile) === authHashBefore &&
      await fileSha256(fixture.globalDatabase) === databaseHashBefore,
    "The real product adapter changed the inherited/default OpenCode auth or database sentinel.",
  );

  const pidsBeforeFailures = await readPidFile(fixture.serverPidFile);
  const deniedPolicy = await runProductLaunch(fixture, "product-a", "product-denied-policy", {
    OPENCODE_CONFIG_CONTENT: JSON.stringify({
      model: "opencode-go/kimi-k3",
      experimental: {
        policies: [{ action: "provider.use", resource: PROVIDER_ID, effect: "deny" }],
      },
    }),
  });
  assert(deniedPolicy.status !== 0 && deniedPolicy.capture === null, "A deny policy unexpectedly launched the V2 TUI.");
  assert(
    deniedPolicy.output.includes("denies claudex-switch's managed Go provider"),
    "The deny-policy fixture did not report the expected fail-closed reason.",
  );
  assert(
    deniedPolicy.startedEvents.includes("version") &&
      !deniedPolicy.startedEvents.includes("serve") &&
      !deniedPolicy.startedEvents.includes("tui"),
    "The deny-policy fixture spawned a private server or TUI before rejecting launch.",
  );

  const deniedModel = await runProductLaunch(fixture, "product-bad-model", "product-denied-model");
  assert(deniedModel.status !== 0 && deniedModel.capture === null, "A non-Go model unexpectedly launched the V2 TUI.");
  assert(
    deniedModel.output.includes(
      "OpenCode Go models must use the form opencode-go/<model> (for example opencode-go/kimi-k3).",
    ),
    "The non-Go model fixture did not report the expected early model-validation failure.",
  );
  assert(
    deniedModel.startedEvents.includes("version") &&
      !deniedModel.startedEvents.includes("serve") &&
      !deniedModel.startedEvents.includes("tui"),
    "The non-Go model fixture spawned a private server or TUI before rejecting launch.",
  );
  assert(
    (await readPidFile(fixture.serverPidFile)).length === pidsBeforeFailures.length,
    "A fail-closed policy/model case started the private server before rejecting launch.",
  );

  for (const key of fixture.fakeKeys) {
    assert(!JSON.stringify(firstA.capture).includes(key), "Alias A launch capture contains a fake key.");
    assert(!JSON.stringify(firstB.capture).includes(key), "Alias B launch capture contains a fake key.");
    assert(!JSON.stringify(resetA.capture).includes(key), "Alias reset launch capture contains a fake key.");
    assert(!JSON.stringify(refreshedA.capture).includes(key), "Alias refresh launch capture contains a fake key.");
  }
  return "Product launch contract passed: actual dist CLI config, private server lifecycle, A/B DB isolation, manual /connect reset, refreshed sidecar sync, fail-closed policy/model checks, and no key logs. Final interactive TUI was intercepted; no provider/model request was made.";
}

async function main() {
  if (process.platform !== "linux") fail("The OpenCode V2 fixture requires Linux");
  if (NETWORK_ISOLATED) {
    assert(isAbsolute(OPENCODE), "Network-isolated mode requires an absolute staged OPENCODE_BIN path");
    await assertNetworkDisabledContainer();
  } else {
    const cc = spawnSync("cc", ["--version"], { encoding: "utf8", timeout: 5_000 });
    const strace = spawnSync("strace", ["--version"], { encoding: "utf8", timeout: 5_000 });
    assert(cc.status === 0 && strace.status === 0, "The bounded fixture requires cc and strace");
  }

  const home = await mkdtemp(join(tmpdir(), "claudex-opencode-v2-fixture-"));
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const guardSource = join(scriptDir, "..", "tests", "fixtures", "loopback_guard.c");
  const guardLibrary = join(home, "libclaudex-loopback-guard.so");
  const guardLog = join(home, "network-denials.log");
  const versionTracePrefix = join(home, "version-strace");
  try {
    if (!NETWORK_ISOLATED) {
      const compile = spawnSync(
        "cc",
        ["-shared", "-fPIC", "-pthread", "-o", guardLibrary, guardSource, "-ldl"],
        { encoding: "utf8", timeout: 15_000 },
      );
      assert(compile.status === 0, "Could not compile the test-only loopback guard");
    }

    const defaultFixture = await makeFixtureHome(home, "default", MODEL_ID);
    const aliasAFixture = await makeFixtureHome(home, "alias-a", MODEL_ID);
    const aliasBFixture = await makeFixtureHome(home, "alias-b", MODEL_ID);
    const version = runVersionWithGuard(defaultFixture.env, guardLibrary, guardLog, versionTracePrefix);
    assert(!version.error && version.status === 0, "Could not detect OpenCode on OPENCODE_BIN/PATH");
    await assertNetworkContained(guardLog, versionTracePrefix);
    const text = `${version.stdout || ""}\n${version.stderr || ""}`;
    assert(/(?:^|\s)v?2\.0\.6(?:\s|$)/m.test(text), "This fixture requires exactly OpenCode v2.0.6");

    const label = (profile) => `claudex-v2-${profile}-${randomUUID()}`;
    const defaultLabel = label("default-preserved");
    const defaultCredential = await withFixtureServer(home, defaultFixture, async (server) =>
      connectFakeCredential(server, FAKE_DEFAULT_KEY, defaultLabel),
    );
    const defaultDbBeforeAliases = await fileSha256(defaultFixture.env.OPENCODE_DB);

    const aliasAOldLabel = label("alias-a-before-refresh");
    const aliasACurrentLabel = label("alias-a-after-refresh");
    let aliasACredential;
    await withFixtureServer(home, aliasAFixture, async (server) => {
      const initial = await connectFakeCredential(server, FAKE_ALIAS_A_KEY, aliasAOldLabel);
      aliasACredential = await connectFakeCredential(server, FAKE_ALIAS_A_REFRESHED_KEY, aliasACurrentLabel);
      await removeCredential(server, initial.id);
      const integration = await getManagedIntegration(server, "refresh verification");
      assert(
        integration.connections[0]?.id === aliasACredential.id &&
          integration.connections[0]?.label === aliasACurrentLabel &&
          !integration.connections.some((connection) => connection.label === aliasAOldLabel),
        "Refresh cleanup did not retain only the current fake alias credential",
      );
    });

    const aliasBLabel = label("alias-b");
    const aliasBCredential = await withFixtureServer(home, aliasBFixture, async (server) =>
      connectFakeCredential(server, FAKE_ALIAS_B_KEY, aliasBLabel),
    );

    assert(
      new Set([
        defaultFixture.env.OPENCODE_DB,
        aliasAFixture.env.OPENCODE_DB,
        aliasBFixture.env.OPENCODE_DB,
      ]).size === 3,
      "The default database and alias databases are not isolated",
    );
    assert(
      await fileSha256(defaultFixture.env.OPENCODE_DB) === defaultDbBeforeAliases,
      "Alias credential writes modified the default OpenCode database",
    );

    await withFixtureServer(home, defaultFixture, async (server) => {
      const integration = await getManagedIntegration(server, "default credential preservation");
      assert(
        integration.connections[0]?.id === defaultCredential.id &&
          integration.connections[0]?.label === defaultLabel,
        "The default fake credential changed while alias-private databases were used",
      );
    });
    await withFixtureServer(home, aliasAFixture, async (server) => {
      const integration = await getManagedIntegration(server, "alias A persistence");
      assert(
        integration.connections[0]?.id === aliasACredential.id &&
          integration.connections[0]?.label === aliasACurrentLabel,
        "Alias A did not retain its own refreshed fake credential",
      );
    });
    await withFixtureServer(home, aliasBFixture, async (server) => {
      const integration = await getManagedIntegration(server, "alias B persistence");
      assert(
        integration.connections[0]?.id === aliasBCredential.id &&
          integration.connections[0]?.label === aliasBLabel,
        "Alias B did not retain its own fake credential",
      );
    });

    const productResult = await verifyProductLaunchContract(home);
    console.log(
      `OpenCode V2.0.6 offline fixture passed: upstream private-store API primitives plus ${productResult}`,
    );
  } finally {
    await rm(home, { recursive: true, force: true });
  }
}

main().catch((error) => {
  // Never echo request bodies, config contents, credentials, or child stderr.
  process.stderr.write(`${error instanceof Error ? error.message : "OpenCode V2 fixture failed"}\n`);
  process.exitCode = 1;
});
