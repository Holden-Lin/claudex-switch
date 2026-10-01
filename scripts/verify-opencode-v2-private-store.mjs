#!/usr/bin/env node

// Manual, fake-key fixture for an installed OpenCode V2 binary. It starts a
// private server with temporary HOME/XDG/SQLite paths, disables updater and
// model fetching, loads no user/project config or plugins, and exercises only
// loopback auth/model metadata endpoints. It does not send a model request.
// Set CLAUDEX_OPENCODE_V2_NETWORK_ISOLATED=1 in a container with no external
// interfaces/routes to verify and require namespace isolation; this path does
// not use ptrace, strace, cc, or download dependencies. The secondary local
// path uses bounded dynamic-ELF interception plus strace, not a security
// sandbox; it is only defense-in-depth for accidental egress.

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
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

    console.log(
      "OpenCode V2.0.6 isolated credential fixture passed: model config, add/refresh cleanup, alias A/B DB separation, and default credential preservation. No model/provider request was made.",
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
