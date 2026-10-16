import { afterEach, beforeEach, describe, expect, setSystemTime, spyOn, test } from "bun:test";
import type { ChildProcess } from "child_process";
import { EventEmitter } from "events";
import { mkdir, readFile, stat, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { PassThrough } from "stream";
import { saveAliases } from "../src/alias/store";
import { runAliasSession } from "../src/commands/run";
import { fileMode, resetTestHome } from "./helpers";
import { fileExists } from "../src/lib/fs";
import {
  OPENCODE_GLOBAL_AUTH_FILE,
  OPENCODE_STATE_FILE,
  openCodeProfileAuthFile,
  openCodeProfileDataFile,
  openCodeProfileV2DatabaseFile,
  openCodeProfileV2CredentialStateFile,
  openCodeProfileV2DataHome,
  openCodeProfileV2ModelInventoryFile,
  openCodeProfileV2RuntimeDir,
} from "../src/lib/paths";
import { writeJsonSecure } from "../src/lib/fs";
import {
  createOpenCodeGoProfile,
  getOpenCodeProfileData,
  hasOpenCodeGoCredential,
  normalizeOpenCodeGoModel,
  openCodeRunEnvironment,
  openCodeSetupEnvironment,
  OPENCODE_V2_MANAGED_PROVIDER_ID,
  readOpenCodeState,
  setActiveOpenCodeProfile,
} from "../src/providers/opencode/profiles";
import {
  applyManagedCompactionPolicy,
  buildOpenCodeV2Config,
  isOpenCodeFreeModel,
  mapOpenCodeGoModelForV2,
  prepareOpenCodeV2RunEnvironment,
  syncOpenCodeV2CredentialToPrivateDatabase,
  verifyEffectiveOpenCodeRouting,
} from "../src/providers/opencode/runtime";
import { parseOpenCodeVersion } from "../src/providers/opencode/version";
import { matchOpenCodeGoModel, resolveOpenCodeGoModel } from "../src/providers/opencode/catalog";
import { model as setDefaultModel } from "../src/commands/model";

const PROFILE_ID = "go-00000000-0000-4000-8000-000000000001";
const PROFILE_ID_2 = "go-00000000-0000-4000-8000-000000000002";
const CREDENTIAL = { type: "api", key: "go-test-secret" };
const originalFetch = globalThis.fetch;
const GO_CATALOG = new Set(["glm-5.3-flash", "kimi-k3", "minimax-m3"]);

function serveGoCatalog(ids = GO_CATALOG) {
  globalThis.fetch = (async () => Response.json({
    object: "list",
    data: [...ids].map((id) => ({ id, object: "model" })),
  })) as unknown as typeof fetch;
}

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

type SyncSpawnCall = {
  command: string;
  args: string[];
  env?: NodeJS.ProcessEnv;
  stdio?: unknown;
  child?: ChildProcess;
};

function createLoopbackServerSpawn(calls: SyncSpawnCall[]) {
  return ((command: string, args: string[], options: { env?: NodeJS.ProcessEnv; stdio?: unknown }) => {
    const child = new EventEmitter() as ChildProcess;
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const stderr = new PassThrough();
    child.stdin = stdin;
    child.stdout = stdout;
    child.stderr = stderr;
    child.exitCode = null;
    child.signalCode = null;
    child.kill = ((signal = "SIGTERM") => {
      child.exitCode = 0;
      child.signalCode = signal;
      queueMicrotask(() => child.emit("close", 0, signal));
      return true;
    }) as ChildProcess["kill"];
    stdin.on("finish", () => {
      child.exitCode = 0;
      queueMicrotask(() => child.emit("close", 0, null));
    });
    calls.push({ command, args, env: options.env, stdio: options.stdio, child });
    queueMicrotask(() => stdout.write('{"url":"http://127.0.0.1:41987"}\n'));
    return child;
  }) as typeof import("child_process").spawn;
}

function locationResponse(data: unknown): string {
  return JSON.stringify({ location: { directory: process.cwd() }, data });
}

describe("OpenCode Go profiles", () => {
  beforeEach(async () => {
    await resetTestHome();
    spyOn(console, "log").mockImplementation(() => {});
    spyOn(console, "error").mockImplementation(() => {});
    // Offline by default: model IDs pass through unchanged unless a test
    // serves the Go catalog explicitly.
    globalThis.fetch = (async () => { throw new Error("offline"); }) as unknown as typeof fetch;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("resolves Go display names and casing to the catalog model ID", async () => {
    expect(matchOpenCodeGoModel("opencode-go/GLM-5.3-Flash", GO_CATALOG)).toBe("opencode-go/glm-5.3-flash");
    expect(matchOpenCodeGoModel("opencode-go/Kimi K3", GO_CATALOG)).toBe("opencode-go/kimi-k3");
    expect(matchOpenCodeGoModel("opencode-go/kimi-k3", GO_CATALOG)).toBe("opencode-go/kimi-k3");
    expect(() => matchOpenCodeGoModel("opencode-go/glm-9", GO_CATALOG)).toThrow(
      'OpenCode Go has no model "glm-9". Available: glm-5.3-flash, kimi-k3, minimax-m3.',
    );
    expect(await resolveOpenCodeGoModel("opencode-go/GLM-5.3-Flash")).toBe("opencode-go/GLM-5.3-Flash");
    serveGoCatalog();
    expect(await resolveOpenCodeGoModel("opencode-go/GLM-5.3-Flash")).toBe("opencode-go/glm-5.3-flash");
  });

  test("model command saves the catalog ID and rejects unknown Go models", async () => {
    await createOpenCodeGoProfile(PROFILE_ID, CREDENTIAL);
    await saveAliases({
      version: 1,
      aliases: [{ alias: "go-work", target: { provider: "opencode", profileId: PROFILE_ID }, createdAt: 1 }],
    });
    serveGoCatalog();
    await setDefaultModel("go-work", "opencode-go/GLM-5.3-Flash");
    expect((await getOpenCodeProfileData(PROFILE_ID)).defaultModel).toBe("opencode-go/glm-5.3-flash");

    const exit = spyOn(process, "exit").mockImplementation((() => { throw new Error("exit"); }) as never);
    try {
      await expect(setDefaultModel("go-work", "opencode-go/glm-9")).rejects.toThrow("exit");
    } finally {
      exit.mockRestore();
    }
    expect((await getOpenCodeProfileData(PROFILE_ID)).defaultModel).toBe("opencode-go/glm-5.3-flash");
  });

  test("corrects a saved display-name default before launching", async () => {
    await createOpenCodeGoProfile(PROFILE_ID, CREDENTIAL);
    await writeJsonSecure(openCodeProfileDataFile(PROFILE_ID), {
      type: "go",
      defaultModel: "opencode-go/GLM-5.3-Flash",
    });
    await saveAliases({
      version: 1,
      aliases: [{ alias: "go-work", target: { provider: "opencode", profileId: PROFILE_ID }, createdAt: 1 }],
    });
    serveGoCatalog();
    const calls: SpawnCall[] = [];
    const exitCode = await runAliasSession(
      "go-work",
      [],
      createSpawn(calls),
      () => ({ major: 1, minor: 18, patch: 30, raw: "1.18.30" }),
    );
    expect(exitCode).toBe(0);
    expect(calls[0]?.args).toEqual(["--auto", "--model", "opencode-go/glm-5.3-flash"]);
    expect((await getOpenCodeProfileData(PROFILE_ID)).defaultModel).toBe("opencode-go/glm-5.3-flash");
  });

  test("V2 lists the live Go catalog in the picker without saving it as history", async () => {
    await createOpenCodeGoProfile(PROFILE_ID, { type: "api", key: "fake-catalog-key" });
    serveGoCatalog();
    const prepared = await prepareOpenCodeV2RunEnvironment(PROFILE_ID, "opencode-go/glm-5.3-flash", async () => {});
    const config = JSON.parse(prepared.env.OPENCODE_CONFIG_CONTENT ?? "{}");
    expect(config.model).toBe(`${OPENCODE_V2_MANAGED_PROVIDER_ID}/glm-5.3-flash`);
    expect(Object.keys(config.providers[OPENCODE_V2_MANAGED_PROVIDER_ID].models).sort()).toEqual([
      "glm-5.3-flash",
      "kimi-k3",
      "minimax-m3",
    ]);
    expect(JSON.parse(await readFile(openCodeProfileV2ModelInventoryFile(PROFILE_ID), "utf8"))).toEqual([
      "opencode-go/glm-5.3-flash",
    ]);
  });

  test("V2 history drops a differently-cased spelling of the selected model", async () => {
    await createOpenCodeGoProfile(PROFILE_ID, { type: "api", key: "fake-history-key" });
    await mkdir(openCodeProfileV2RuntimeDir(PROFILE_ID), { recursive: true });
    await writeFile(
      openCodeProfileV2ModelInventoryFile(PROFILE_ID),
      JSON.stringify(["opencode-go/GLM-5.3-Flash", "opencode-go/kimi-k3"]),
    );
    const prepared = await prepareOpenCodeV2RunEnvironment(PROFILE_ID, "opencode-go/glm-5.3-flash", async () => {});
    const config = JSON.parse(prepared.env.OPENCODE_CONFIG_CONTENT ?? "{}");
    expect(Object.keys(config.providers[OPENCODE_V2_MANAGED_PROVIDER_ID].models).sort()).toEqual(["glm-5.3-flash", "kimi-k3"]);
    expect(JSON.parse(await readFile(openCodeProfileV2ModelInventoryFile(PROFILE_ID), "utf8"))).toEqual([
      "opencode-go/kimi-k3",
      "opencode-go/glm-5.3-flash",
    ]);
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

  test("runs the native TUI with private auth and the shared session store", async () => {
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
    const previousDataHome = process.env.XDG_DATA_HOME;
    process.env.OPENCODE_AUTH_CONTENT = '{"opencode-go":{"type":"api","key":"wrong"}}';
    process.env.XDG_DATA_HOME = "/tmp/opencode-shared-sessions";
    await setActiveOpenCodeProfile("default-profile");
    try {
      const calls: SpawnCall[] = [];
      const exitCode = await runAliasSession(
        "go-work",
        ["--model", "opencode-go/kimi-k3", "--continue"],
        createSpawn(calls),
        () => ({ major: 1, minor: 18, patch: 30, raw: "1.18.30" }),
      );

      expect(exitCode).toBe(0);
      expect(calls).toHaveLength(1);
      expect(calls[0]?.command).toBe("opencode");
      expect(calls[0]?.args).toEqual([
        "--auto",
        "--model",
        "opencode-go/kimi-k3",
        "--continue",
      ]);
      expect(calls[0]?.env?.XDG_DATA_HOME).toBe(
        "/tmp/opencode-shared-sessions",
      );
      expect(JSON.parse(calls[0]?.env?.OPENCODE_AUTH_CONTENT ?? "{}")).toEqual({
        "opencode-go": CREDENTIAL,
      });
      expect(await getOpenCodeProfileData(PROFILE_ID)).toEqual({
        type: "go",
        defaultModel: "opencode-go/kimi-k3",
      });
      // -run leaves the default account alone.
      expect(await readOpenCodeState()).toEqual({ active: "default-profile" });
    } finally {
      if (previous === undefined) delete process.env.OPENCODE_AUTH_CONTENT;
      else process.env.OPENCODE_AUTH_CONTENT = previous;
      if (previousDataHome === undefined) delete process.env.XDG_DATA_HOME;
      else process.env.XDG_DATA_HOME = previousDataHome;
    }
  });

  test("validates Go model ids and reserves private XDG data for setup only", async () => {
    expect(normalizeOpenCodeGoModel("opencode-go/glm-5.3")).toBe(
      "opencode-go/glm-5.3",
    );
    expect(() => normalizeOpenCodeGoModel("glm-5.3")).toThrow(
      "OpenCode Go models must use the form",
    );
    await createOpenCodeGoProfile(PROFILE_ID, CREDENTIAL);
    expect(await openCodeRunEnvironment(PROFILE_ID)).toHaveProperty(
      "OPENCODE_AUTH_CONTENT",
    );
    expect(openCodeSetupEnvironment(PROFILE_ID).XDG_DATA_HOME).toContain(
      PROFILE_ID,
    );
    expect(OPENCODE_STATE_FILE).toContain(".claudex-switch/opencode/state.json");
  });

  test("detects supported V1 and V2 version output precisely", () => {
    expect(parseOpenCodeVersion("1.18.30")).toEqual({
      major: 1,
      minor: 18,
      patch: 30,
      raw: "1.18.30",
    });
    expect(parseOpenCodeVersion("opencode v2.0.6\n")).toEqual({
      major: 2,
      minor: 0,
      patch: 6,
      raw: "v2.0.6",
    });
    expect(parseOpenCodeVersion("OpenCode dev build")).toBeNull();
    expect(mapOpenCodeGoModelForV2("opencode-go/kimi-k3")).toBe(
      `${OPENCODE_V2_MANAGED_PROVIDER_ID}/kimi-k3`,
    );
  });

  test("builds a V2 config under the managed provider with a deny-by-default provider policy", () => {
    const config = buildOpenCodeV2Config(
      JSON.stringify({
        theme: "dark",
        model: "opencode-go/kimi-k3",
        enabled_providers: ["anthropic", OPENCODE_V2_MANAGED_PROVIDER_ID],
        providers: { anthropic: { models: { "claude-sonnet": {} } } },
      }),
      "opencode-go/deepseek-v4-flash",
    );

    expect(config.theme).toBe("dark");
    expect(config.model).toBe(`${OPENCODE_V2_MANAGED_PROVIDER_ID}/deepseek-v4-flash`);
    expect(config.experimental).toMatchObject({
      policies: [
        { action: "provider.use", resource: "*", effect: "deny" },
        { action: "provider.use", resource: OPENCODE_V2_MANAGED_PROVIDER_ID, effect: "allow" },
      ],
    });
    expect(config.enabled_providers).toEqual([OPENCODE_V2_MANAGED_PROVIDER_ID]);
    expect(config.providers).toMatchObject({
      anthropic: { models: { "claude-sonnet": {} } },
      [OPENCODE_V2_MANAGED_PROVIDER_ID]: {
        canonical: "opencode-go",
        models: { "deepseek-v4-flash": {} },
      },
    });
    expect(JSON.stringify(config)).not.toContain("fake-secret");
  });

  test("keeps an inherited provider deny after the managed-provider allow", () => {
    const userPolicies = [
      { action: "provider.use", resource: "anthropic", effect: "deny" },
      { action: "provider.use", resource: "opencode-go", effect: "allow" },
      { action: "provider.use", resource: OPENCODE_V2_MANAGED_PROVIDER_ID, effect: "allow" },
    ];
    const config = buildOpenCodeV2Config(
      JSON.stringify({
        model: "opencode-go/kimi-k3",
        experimental: { policies: userPolicies },
      }),
    );
    const policies = (config.experimental as { policies: unknown[] }).policies;
    expect(policies).toEqual([
      userPolicies[1],
      { action: "provider.use", resource: "*", effect: "deny" },
      { action: "provider.use", resource: OPENCODE_V2_MANAGED_PROVIDER_ID, effect: "allow" },
      { action: "provider.use", resource: "opencode", effect: "allow" },
      userPolicies[0],
    ]);
  });

  test("enables native free models without weakening explicit provider restrictions", () => {
    const config = buildOpenCodeV2Config(undefined, "opencode-go/kimi-k3");
    expect(config.enabled_providers).toEqual([OPENCODE_V2_MANAGED_PROVIDER_ID, "opencode"]);
    for (const restriction of [
      { disabled_providers: ["opencode"] },
      { enabled_providers: [OPENCODE_V2_MANAGED_PROVIDER_ID] },
      { experimental: { policies: [{ action: "provider.use", resource: "opencode", effect: "deny" }] } },
    ]) {
      const restricted = buildOpenCodeV2Config(JSON.stringify(restriction), "opencode-go/kimi-k3");
      expect(restricted.enabled_providers).toEqual([OPENCODE_V2_MANAGED_PROVIDER_ID]);
    }
  });

  test("requires zero input, output and cache prices in every native model tier", () => {
    const model = { providerID: "opencode", cost: [{ input: 0, output: 0, cache: { read: 0, write: 0 } }] };
    expect(isOpenCodeFreeModel(model)).toBe(true);
    for (const changed of [
      { providerID: "other" }, { cost: [] }, { cost: undefined },
      { cost: [{ input: 0, output: 1 }] }, { cost: [{ input: 1, output: 0 }] },
      { cost: [{ input: 0, output: 0, cache: { read: 1 } }] },
      { cost: [{ input: 0, output: 0, cache: "unknown" }] },
      { cost: [...model.cost, { input: 1, output: 1 }] },
    ]) expect(isOpenCodeFreeModel({ ...model, ...changed })).toBe(false);
  });

  test("accepts native free models and protects their windows when switching from Go", async () => {
    const free = { providerID: "opencode", id: "deepseek-v4.1-flash-free", enabled: true,
      cost: [{ input: 0, output: 0, cache: { read: 0, write: 0 } }], limit: { context: 200000 } };
    let native = free;
    const fetcher = (async (input: string | URL | Request) => {
      const path = new URL(input.toString()).pathname;
      if (path === "/api/config") return Response.json([{ type: "document", info: {} }]);
      if (path === "/api/agent") return new Response(locationResponse([
        { id: "build", permissions: [], model: { providerID: "opencode", id: free.id } },
      ]));
      return new Response(locationResponse([
        { providerID: OPENCODE_V2_MANAGED_PROVIDER_ID, id: "kimi-k3", limit: { context: 1048576 } }, native,
      ]));
    }) as typeof fetch;
    const routing = await verifyEffectiveOpenCodeRouting(fetcher, "http://127.0.0.1:4096", "test", ["opencode-go/kimi-k3"]);
    expect(routing.freeModelIds).toEqual(["opencode/deepseek-v4.1-flash-free"]);
    expect(routing.agentModelId).toBe("opencode/deepseek-v4.1-flash-free");
    // Even when the starting agent uses Go, switching to a small free model
    // must not inherit the user's oversized reserved budget.
    delete routing.agentModelId;
    const applied = applyManagedCompactionPolicy("{}", routing, "kimi-k3");
    expect(JSON.parse(applied.configContent).compaction).toEqual({ auto: true, buffer: 20000 });
    native = { ...free, cost: [{ input: 0, output: 1, cache: { read: 0, write: 0 } }] };
    await expect(verifyEffectiveOpenCodeRouting(fetcher, "http://127.0.0.1:4096", "test", ["opencode-go/kimi-k3"]))
      .rejects.toThrow("paid or unpriced");
  });

  test("rejects invalid or colliding V2 config and fails closed without a Go model", () => {
    expect(() => buildOpenCodeV2Config("not json")).toThrow(
      "Could not merge OpenCode V2 launch settings",
    );
    expect(() =>
      buildOpenCodeV2Config(
        JSON.stringify({
          providers: { [OPENCODE_V2_MANAGED_PROVIDER_ID]: { canonical: "opencode-go" } },
        }),
      ),
    ).toThrow("reserved provider ID");
    expect(() => buildOpenCodeV2Config(JSON.stringify({ theme: "dark" }))).toThrow(
      "require an OpenCode Go model",
    );
    expect(() =>
      buildOpenCodeV2Config(JSON.stringify({ model: "anthropic/claude-sonnet" })),
    ).toThrow("only bind credentials for OpenCode Go models");
    expect(() =>
      buildOpenCodeV2Config(
        JSON.stringify({
          model: "opencode-go/kimi-k3",
          experimental: {
            policies: [{ action: "provider.use", resource: "*", effect: "deny" }],
          },
        }),
      ),
    ).toThrow("denies claudex-switch's managed Go provider");
    expect(() =>
      buildOpenCodeV2Config(
        JSON.stringify({ model: "opencode-go/kimi-k3", enabled_providers: ["anthropic"] }),
      ),
    ).toThrow("does not enable claudex-switch's managed Go provider");
  });

  test("syncs a fake V2 key separately and uses alias-private database and XDG roots", async () => {
    await createOpenCodeGoProfile(PROFILE_ID, { type: "api", key: "fake-v2-loopback-key" });
    await mkdir(dirname(OPENCODE_GLOBAL_AUTH_FILE), { recursive: true });
    await writeJsonSecure(OPENCODE_GLOBAL_AUTH_FILE, {
      "opencode-go": { type: "api", key: "fake-global-v1-key" },
    });
    const previousConfig = process.env.OPENCODE_CONFIG_CONTENT;
    const previousAuth = process.env.OPENCODE_AUTH_CONTENT;
    const previousDb = process.env.OPENCODE_DB;
    const previousGoEnvKey = process.env.OPENCODE_API_KEY;
    process.env.OPENCODE_CONFIG_CONTENT = JSON.stringify({ theme: "dark" });
    process.env.OPENCODE_AUTH_CONTENT = '{"opencode-go":{"type":"api","key":"wrong"}}';
    process.env.OPENCODE_API_KEY = "fake-global-go-env-key";
    process.env.OPENCODE_DB = "/tmp/shared-opencode-fixture.sqlite";
    let syncInput: { profileId: string; key: string; env: NodeJS.ProcessEnv } | undefined;
    try {
      const prepared = await prepareOpenCodeV2RunEnvironment(
        PROFILE_ID,
        "opencode-go/kimi-k3",
        async (profileId, key, env) => {
          syncInput = { profileId, key, env: { ...env } };
        },
      );
      const dataHome = prepared.env.XDG_DATA_HOME!;
      const privateRoot = openCodeProfileV2RuntimeDir(PROFILE_ID);
      const config = JSON.parse(prepared.env.OPENCODE_CONFIG_CONTENT ?? "{}");

      expect(prepared.env.OPENCODE_AUTH_CONTENT).toBeUndefined();
      expect(prepared.env.OPENCODE_API_KEY).toBeUndefined();
      expect(prepared.env.OPENCODE_DB).toBe(openCodeProfileV2DatabaseFile(PROFILE_ID));
      expect(prepared.env.OPENCODE_DB).not.toBe(process.env.OPENCODE_DB);
      expect(dataHome).not.toBe(process.env.XDG_DATA_HOME);
      expect(dataHome).toBe(openCodeProfileV2DataHome(PROFILE_ID));
      expect(config.theme).toBe("dark");
      expect(config.model).toBe(OPENCODE_V2_MANAGED_PROVIDER_ID + "/kimi-k3");
      expect(prepared.env.OPENCODE_CONFIG_CONTENT).not.toContain("fake-v2-loopback-key");
      expect(prepared.env.OPENCODE_CONFIG_CONTENT).not.toContain("fake-global-v1-key");
      expect(syncInput).toMatchObject({
        profileId: PROFILE_ID,
        key: "fake-v2-loopback-key",
      });
      expect(syncInput?.env.OPENCODE_DB).toBe(openCodeProfileV2DatabaseFile(PROFILE_ID));
      expect(syncInput?.env.OPENCODE_API_KEY).toBeUndefined();
      expect(syncInput?.env.OPENCODE_AUTH_CONTENT).toBeUndefined();
      expect(syncInput?.env.OPENCODE_CONFIG_CONTENT).not.toContain("fake-v2-loopback-key");
      expect(await fileExists(privateRoot)).toBe(true);
      expect(await fileExists(join(dataHome, "opencode", "auth.json"))).toBe(false);
    } finally {
      if (previousConfig === undefined) delete process.env.OPENCODE_CONFIG_CONTENT;
      else process.env.OPENCODE_CONFIG_CONTENT = previousConfig;
      if (previousAuth === undefined) delete process.env.OPENCODE_AUTH_CONTENT;
      else process.env.OPENCODE_AUTH_CONTENT = previousAuth;
      if (previousDb === undefined) delete process.env.OPENCODE_DB;
      else process.env.OPENCODE_DB = previousDb;
      if (previousGoEnvKey === undefined) delete process.env.OPENCODE_API_KEY;
      else process.env.OPENCODE_API_KEY = previousGoEnvKey;
    }
  });

  test("stores the selected key through the loopback credential API without argv or env leakage", async () => {
    const secret = "fake-only-loopback-key";
    const spawnCalls: SyncSpawnCall[] = [];
    const requests: Array<{ url: string; method: string; headers: Headers; body?: string }> = [];
    let integrationReads = 0;
    let createdLabel = "";
    const fetcher: typeof fetch = async (input, init = {}) => {
      const url = new URL(input.toString());
      const method = init.method ?? "GET";
      requests.push({
        url: url.href,
        method,
        headers: new Headers(init.headers),
        body: typeof init.body === "string" ? init.body : undefined,
      });
      if (url.pathname === "/api/config") {
        return new Response(JSON.stringify([{ type: "document", info: { default_agent: "build" } }]), {
          status: 200,
        });
      }
      if (url.pathname === "/api/agent") {
        return new Response(
          locationResponse([
            {
              id: "build",
              name: "Build",
              mode: "primary",
              permissions: [{ action: "read", resource: "*", effect: "allow" }],
            },
          ]),
          { status: 200 },
        );
      }
      if (url.pathname === "/api/model") {
        return new Response(
          locationResponse([
            { providerID: OPENCODE_V2_MANAGED_PROVIDER_ID, id: "kimi-k3" },
          ]),
          { status: 200 },
        );
      }
      if (url.pathname === `/api/integration/${OPENCODE_V2_MANAGED_PROVIDER_ID}`) {
        integrationReads += 1;
        if (integrationReads === 1) {
          return new Response(
            locationResponse({
              id: OPENCODE_V2_MANAGED_PROVIDER_ID,
              methods: [{ type: "key", label: "API key" }],
              connections: [],
            }),
            { status: 200 },
          );
        }
        return new Response(
          locationResponse({
            id: OPENCODE_V2_MANAGED_PROVIDER_ID,
            methods: [{ type: "key", label: "API key" }],
            connections: [{ type: "credential", id: "credential-new", label: createdLabel }],
          }),
          { status: 200 },
        );
      }
      if (url.pathname.endsWith("/connect/key")) {
        createdLabel = JSON.parse(typeof init.body === "string" ? init.body : "{}").label;
        return new Response(null, { status: 204 });
      }
      throw new Error(`Unexpected loopback fixture request: ${url.pathname}`);
    };
    const env = {
      PATH: "/fake",
      OPENCODE_DB: openCodeProfileV2DatabaseFile(PROFILE_ID),
      OPENCODE_CONFIG_CONTENT: JSON.stringify(
        buildOpenCodeV2Config(undefined, "opencode-go/kimi-k3"),
      ),
      OPENCODE_API_KEY: "fake-global-env-key",
    };

    await syncOpenCodeV2CredentialToPrivateDatabase(
      PROFILE_ID,
      secret,
      env,
      createLoopbackServerSpawn(spawnCalls),
      fetcher,
    );

    expect(spawnCalls).toHaveLength(1);
    expect(spawnCalls[0]?.command).toBe("opencode");
    expect(spawnCalls[0]?.args).toEqual([
      "serve",
      "--stdio",
      "--hostname",
      "127.0.0.1",
      "--port",
      "0",
    ]);
    expect(spawnCalls[0]?.args.join(" ")).not.toContain(secret);
    expect(spawnCalls[0]?.env?.OPENCODE_DB).toBe(openCodeProfileV2DatabaseFile(PROFILE_ID));
    expect(spawnCalls[0]?.env?.OPENCODE_API_KEY).toBeUndefined();
    expect(spawnCalls[0]?.env?.OPENCODE_PASSWORD).not.toBe(secret);
    expect(spawnCalls[0]?.env?.OPENCODE_DISABLE_AUTOUPDATE).toBe("1");
    expect(spawnCalls[0]?.env?.OPENCODE_DISABLE_MODELS_FETCH).toBe("1");
    expect(spawnCalls[0]?.env?.OPENCODE_CONFIG_PROJECT_DISABLE).toBeUndefined();
    expect(JSON.stringify(spawnCalls[0]?.env)).not.toContain(secret);
    expect(requests.every((request) => new URL(request.url).hostname === "127.0.0.1")).toBe(true);
    expect(requests.map((request) => request.method)).toEqual([
      "GET",
      "GET",
      "GET",
      "GET",
      "GET",
      "GET",
      "POST",
      "GET",
    ]);
    const post = requests.find((request) => request.method === "POST")!;
    expect(JSON.parse(post.body ?? "{}")).toMatchObject({ key: secret });
    expect(post.headers.get("authorization")).toStartWith("Basic ");
    expect(post.headers.get("authorization")).not.toContain(secret);
    expect(requests.some((request) => request.url.includes("opencode.ai"))).toBe(false);
    expect(spawnCalls[0]?.child?.exitCode).toBe(0);
    expect(JSON.parse(await readFile(openCodeProfileV2CredentialStateFile(PROFILE_ID), "utf8"))).toEqual({
      version: 1,
      credentialIds: ["credential-new"],
    });
  });

  test("fails closed when OpenCode does not activate the synced alias key", async () => {
    const secret = "fake-only-mismatch-key";
    let integrationReads = 0;
    const fetcher: typeof fetch = async (input) => {
      const url = new URL(input.toString());
      if (url.pathname === "/api/config") {
        return new Response(JSON.stringify([{ type: "document", info: { default_agent: "build" } }]), {
          status: 200,
        });
      }
      if (url.pathname === "/api/agent") {
        return new Response(
          locationResponse([
            { id: "build", name: "Build", mode: "primary", permissions: [] },
          ]),
          { status: 200 },
        );
      }
      if (url.pathname === "/api/model") {
        return new Response(
          locationResponse([{ providerID: OPENCODE_V2_MANAGED_PROVIDER_ID, id: "kimi-k3" }]),
          { status: 200 },
        );
      }
      if (url.pathname === `/api/integration/${OPENCODE_V2_MANAGED_PROVIDER_ID}`) {
        integrationReads += 1;
        return new Response(locationResponse({
            id: OPENCODE_V2_MANAGED_PROVIDER_ID,
            methods: [{ type: "key", label: "API key" }],
            connections:
              integrationReads === 1
                ? []
                : [{ type: "credential", id: "other-active", label: "wrong-account" }],
          }), { status: 200 });
      }
      if (url.pathname.endsWith("/connect/key")) {
        return new Response(null, { status: 204 });
      }
      throw new Error(`Unexpected loopback fixture request: ${url.pathname}`);
    };
    const env = {
      PATH: "/fake",
      OPENCODE_DB: openCodeProfileV2DatabaseFile(PROFILE_ID),
      OPENCODE_CONFIG_CONTENT: JSON.stringify(
        buildOpenCodeV2Config(undefined, "opencode-go/kimi-k3"),
      ),
    };
    await expect(
      syncOpenCodeV2CredentialToPrivateDatabase(
        PROFILE_ID,
        secret,
        env,
        createLoopbackServerSpawn([]),
        fetcher,
      ),
    ).rejects.toThrow("did not activate the selected key");
  });

  test("fails closed before POST when the effective default agent selects another provider", async () => {
    const methods: string[] = [];
    const fetcher: typeof fetch = async (input) => {
      const url = new URL(input.toString());
      methods.push(`${url.pathname}`);
      if (url.pathname === `/api/integration/${OPENCODE_V2_MANAGED_PROVIDER_ID}`) {
        return new Response(
          locationResponse({
            id: OPENCODE_V2_MANAGED_PROVIDER_ID,
            methods: [{ type: "key", label: "API key" }],
            connections: [],
          }),
          { status: 200 },
        );
      }
      if (url.pathname === "/api/config") {
        return new Response(JSON.stringify([{ type: "document", info: { default_agent: "plan" } }]), {
          status: 200,
        });
      }
      if (url.pathname === "/api/agent") {
        return new Response(
          locationResponse([
            {
              id: "plan",
              name: "Plan",
              mode: "primary",
              permissions: [{ action: "read", resource: "*", effect: "deny" }],
              model: { providerID: "anthropic", id: "claude-sonnet" },
            },
          ]),
          { status: 200 },
        );
      }
      throw new Error(`Unexpected loopback fixture request: ${url.pathname}`);
    };
    const env = {
      PATH: "/fake",
      OPENCODE_DB: openCodeProfileV2DatabaseFile(PROFILE_ID),
      OPENCODE_CONFIG_CONTENT: JSON.stringify(buildOpenCodeV2Config(undefined, "opencode-go/kimi-k3")),
    };

    await expect(
      syncOpenCodeV2CredentialToPrivateDatabase(
        PROFILE_ID,
        "fake-only-agent-model-key",
        env,
        createLoopbackServerSpawn([]),
        fetcher,
      ),
    ).rejects.toThrow("default agent \"plan\" selects another provider");
    expect(methods.some((path) => path.endsWith("/connect/key"))).toBe(false);
  });

  test("retries the agent inventory until the effective default agent appears", async () => {
    let agentReads = 0;
    const fetcher: typeof fetch = async (input) => {
      const url = new URL(input.toString());
      if (url.pathname === "/api/config") {
        return new Response(JSON.stringify([{ type: "document", info: { default_agent: "build" } }]), {
          status: 200,
        });
      }
      if (url.pathname === "/api/agent") {
        agentReads += 1;
        // OpenCode answers before the location's agent inventory is ready.
        return new Response(
          locationResponse(
            agentReads === 1
              ? []
              : [{ id: "build", name: "Build", mode: "primary", permissions: [] }],
          ),
          { status: 200 },
        );
      }
      if (url.pathname === "/api/model") {
        return new Response(
          locationResponse([{ providerID: OPENCODE_V2_MANAGED_PROVIDER_ID, id: "kimi-k3" }]),
          { status: 200 },
        );
      }
      throw new Error(`Unexpected loopback fixture request: ${url.pathname}`);
    };

    await verifyEffectiveOpenCodeRouting(
      fetcher,
      "http://127.0.0.1:41987",
      "fake-password",
      ["opencode-go/kimi-k3"],
    );
    expect(agentReads).toBe(2);
  });

  test("resolves the effective compaction buffer and model windows for the launch policy", async () => {
    const fetcher: typeof fetch = async (input) => {
      const url = new URL(input.toString());
      if (url.pathname === "/api/config") {
        return new Response(JSON.stringify([
          { type: "document", path: "/home/.config/opencode/opencode.jsonc", info: { compaction: { reserved: 500000 } } },
          { type: "document", info: { default_agent: "build", compaction: { buffer: 500000 } } },
        ]), { status: 200 });
      }
      if (url.pathname === "/api/agent") {
        return new Response(locationResponse([
          { id: "build", name: "Build", mode: "primary", permissions: [], model: { providerID: OPENCODE_V2_MANAGED_PROVIDER_ID, id: "omen-alpha" } },
        ]), { status: 200 });
      }
      if (url.pathname === "/api/model") {
        return new Response(locationResponse([
          { providerID: OPENCODE_V2_MANAGED_PROVIDER_ID, id: "omen-alpha", limit: { context: 200000, output: 32000 } },
          { providerID: OPENCODE_V2_MANAGED_PROVIDER_ID, id: "kimi-k3", limit: { context: 1048576, output: 131072 } },
          // OpenCode's compaction trigger uses `limit.input || limit.context`,
          // so a smaller input limit must win over the context window.
          { providerID: OPENCODE_V2_MANAGED_PROVIDER_ID, id: "hy3", limit: { context: 256000, input: 192000, output: 128000 } },
        ]), { status: 200 });
      }
      throw new Error(`Unexpected loopback fixture request: ${url.pathname}`);
    };

    const routing = await verifyEffectiveOpenCodeRouting(
      fetcher,
      "http://127.0.0.1:41987",
      "fake-password",
      ["opencode-go/omen-alpha", "opencode-go/kimi-k3", "opencode-go/hy3"],
    );
    expect(routing).toEqual({
      freeModelIds: [],
      auto: true,
      buffer: 500000,
      windows: new Map([["omen-alpha", 200000], ["kimi-k3", 1048576], ["hy3", 192000]]),
      agentModelId: "omen-alpha",
    });
  });

  test("keeps auto-compaction on with a ~90% buffer below a 500k token window", () => {
    const config = JSON.stringify({
      model: `${OPENCODE_V2_MANAGED_PROVIDER_ID}/minimax-m2.7`,
    });

    // A 200k window compacts at 90%: buffer 20000, trigger 180000.
    const small = applyManagedCompactionPolicy(
      config,
      { auto: true, buffer: 500000, windows: new Map([["minimax-m2.7", 200000]]) },
      "minimax-m2.7",
    );
    expect(small.guard).toEqual({ id: "minimax-m2.7", context: 200000, buffer: 20000, managed: true });
    const smallConfig = JSON.parse(small.configContent);
    expect(smallConfig.compaction).toEqual({ auto: true, buffer: 20000 });
    expect(smallConfig.model).toBe(`${OPENCODE_V2_MANAGED_PROVIDER_ID}/minimax-m2.7`);
    expect(small.guard!.context - small.guard!.buffer).toBe(180000);

    // The reported 204800-token window still keeps a 10% buffer.
    const exact = applyManagedCompactionPolicy(
      config,
      { auto: true, buffer: 500000, windows: new Map([["minimax-m2.7", 204800]]) },
      "minimax-m2.7",
    );
    expect(exact.guard).toEqual({ id: "minimax-m2.7", context: 204800, buffer: 20480, managed: true });
    expect(JSON.parse(exact.configContent).compaction).toEqual({ auto: true, buffer: 20480 });

    // A model whose input limit is smaller than its context window uses the
    // input limit for both the guard and the buffer (19200 -> 90% of 192000).
    const inputBound = applyManagedCompactionPolicy(
      config,
      { auto: true, buffer: 500000, windows: new Map([["hy3", 192000]]) },
      "hy3",
    );
    expect(inputBound.guard).toEqual({ id: "hy3", context: 192000, buffer: 19200, managed: true });

    // Small windows keep OpenCode's 16,000-token minimum buffer so the
    // compaction request itself still fits (trigger stays > 0).
    const tiny = applyManagedCompactionPolicy(
      config,
      { auto: true, buffer: 500000, windows: new Map([["minimax-m2.7", 128000]]) },
      "minimax-m2.7",
    );
    expect(tiny.guard).toEqual({ id: "minimax-m2.7", context: 128000, buffer: 16000, managed: true });

    // Metadata-less models resolve to OpenCode's 200k fallback window and are
    // managed the same way.
    const fallbackMissing = applyManagedCompactionPolicy(
      config,
      { auto: true, buffer: 500000, windows: new Map() },
      "minimax-m2.7",
    );
    expect(fallbackMissing.guard).toEqual({ id: "minimax-m2.7", context: 200000, buffer: 20000, managed: true });
    const fallbackZero = applyManagedCompactionPolicy(
      config,
      { auto: true, buffer: 500000, windows: new Map([["minimax-m2.7", 0]]) },
      "minimax-m2.7",
    );
    expect(fallbackZero.guard).toEqual({ id: "minimax-m2.7", context: 200000, buffer: 20000, managed: true });

    // Windows at or above 500k keep the user's own compaction settings.
    for (const context of [500000, 524288, 1048576]) {
      const large = applyManagedCompactionPolicy(
        config,
        { auto: true, buffer: 500000, windows: new Map([["minimax-m2.7", context]]) },
        "minimax-m2.7",
      );
      expect(large.guard).toBeUndefined();
      expect(large.configContent).toBe(config);
    }

    // Sessions with auto-compaction disabled by the user are untouched.
    expect(
      applyManagedCompactionPolicy(
        config,
        { auto: false, buffer: 500000, windows: new Map([["minimax-m2.7", 204800]]) },
        "minimax-m2.7",
      ).configContent,
    ).toBe(config);

    // A user buffer smaller than the computed one but still at least
    // OpenCode's minimum margin compacts later and is kept as-is.
    const kept = applyManagedCompactionPolicy(
      config,
      { auto: true, buffer: 16000, windows: new Map([["minimax-m2.7", 204800]]) },
      "minimax-m2.7",
    );
    expect(kept.guard).toEqual({ id: "minimax-m2.7", context: 204800, buffer: 16000, managed: false });
    expect(kept.configContent).toBe(config);

    // A user buffer below OpenCode's minimum margin would risk the
    // compaction request not fitting; the managed 90% buffer replaces it.
    const tooSmall = applyManagedCompactionPolicy(
      config,
      { auto: true, buffer: 1000, windows: new Map([["minimax-m2.7", 204800]]) },
      "minimax-m2.7",
    );
    expect(tooSmall.guard).toEqual({ id: "minimax-m2.7", context: 204800, buffer: 20480, managed: true });
    expect(JSON.parse(tooSmall.configContent).compaction).toEqual({ auto: true, buffer: 20480 });

    // The default agent's smaller window constrains the session too.
    const agent = applyManagedCompactionPolicy(
      config,
      { auto: true, buffer: 500000, windows: new Map([["minimax-m2.7", 1048576], ["omen-alpha", 200000]]), agentModelId: "omen-alpha" },
      "minimax-m2.7",
    );
    expect(agent.guard).toEqual({ id: "omen-alpha", context: 200000, buffer: 20000, managed: true });
    expect(JSON.parse(agent.configContent).compaction).toEqual({ auto: true, buffer: 20000 });
  });

  test("applies the small-window compaction buffer to the V2 run environment", async () => {
    await createOpenCodeGoProfile(PROFILE_ID, { type: "api", key: "fake-compaction-env-key" });
    const prepared = await prepareOpenCodeV2RunEnvironment(
      PROFILE_ID,
      "opencode-go/minimax-m2.7",
      async () => ({ auto: true, buffer: 500000, windows: new Map([["minimax-m2.7", 204800]]) }),
    );
    expect(prepared.compactionGuard).toEqual({ id: "minimax-m2.7", context: 204800, buffer: 20480, managed: true });
    const config = JSON.parse(prepared.env.OPENCODE_CONFIG_CONTENT ?? "{}");
    expect(config.compaction).toEqual({ auto: true, buffer: 20480 });
    expect(config.model).toBe(`${OPENCODE_V2_MANAGED_PROVIDER_ID}/minimax-m2.7`);

    const untouched = await prepareOpenCodeV2RunEnvironment(
      PROFILE_ID,
      "opencode-go/kimi-k3",
      async () => ({ auto: true, buffer: 500000, windows: new Map([["kimi-k3", 1048576]]) }),
    );
    expect(untouched.compactionGuard).toBeUndefined();
    expect(JSON.parse(untouched.env.OPENCODE_CONFIG_CONTENT ?? "{}").compaction).toBeUndefined();
  });

  test("fails closed when the effective default agent never becomes available", async () => {
    let agentReads = 0;
    const fetcher: typeof fetch = async (input) => {
      const url = new URL(input.toString());
      if (url.pathname === "/api/config") {
        return new Response(JSON.stringify([{ type: "document", info: { default_agent: "build" } }]), {
          status: 200,
        });
      }
      if (url.pathname === "/api/agent") {
        agentReads += 1;
        // Jump past the readiness deadline so the timeout path stays fast.
        setSystemTime(Date.now() + 11_000);
        return new Response(locationResponse([]), { status: 200 });
      }
      throw new Error(`Unexpected loopback fixture request: ${url.pathname}`);
    };

    try {
      await expect(
        verifyEffectiveOpenCodeRouting(
          fetcher,
          "http://127.0.0.1:41987",
          "fake-password",
          ["opencode-go/kimi-k3"],
        ),
      ).rejects.toThrow("configured default agent is unavailable in this location");
      expect(agentReads).toBe(1);
    } finally {
      setSystemTime();
    }
  });

  test("cleans only previously tracked claudex credentials and retains manual connections", async () => {
    const secret = "fake-only-owned-cleanup-key";
    const credentialState = openCodeProfileV2CredentialStateFile(PROFILE_ID);
    await mkdir(dirname(credentialState), { recursive: true });
    await writeJsonSecure(credentialState, { version: 1, credentialIds: ["owned-old"] });
    const requests: string[] = [];
    let integrationReads = 0;
    let createdLabel = "";
    const fetcher: typeof fetch = async (input, init = {}) => {
      const url = new URL(input.toString());
      requests.push(`${init.method ?? "GET"} ${url.pathname}`);
      if (url.pathname === "/api/config") {
        return new Response(JSON.stringify([{ type: "document", info: { default_agent: "build" } }]), {
          status: 200,
        });
      }
      if (url.pathname === "/api/agent") {
        return new Response(locationResponse([{ id: "build", name: "Build", mode: "primary", permissions: [] }]), {
          status: 200,
        });
      }
      if (url.pathname === "/api/model") {
        return new Response(locationResponse([{ providerID: OPENCODE_V2_MANAGED_PROVIDER_ID, id: "kimi-k3" }]), {
          status: 200,
        });
      }
      if (url.pathname === `/api/integration/${OPENCODE_V2_MANAGED_PROVIDER_ID}`) {
        integrationReads += 1;
        return new Response(
          locationResponse({
            id: OPENCODE_V2_MANAGED_PROVIDER_ID,
            methods: [{ type: "key", label: "API key" }],
            connections:
              integrationReads === 1
                ? []
                : [
                    { type: "credential", id: "owned-new", label: createdLabel },
                    { type: "credential", id: "owned-old", label: "previous claudex key" },
                    { type: "credential", id: "manual-key", label: "manual /connect key" },
                  ],
          }),
          { status: 200 },
        );
      }
      if (url.pathname.endsWith("/connect/key")) {
        createdLabel = JSON.parse(typeof init.body === "string" ? init.body : "{}").label;
        return new Response(null, { status: 204 });
      }
      if (url.pathname === "/api/credential/owned-old") return new Response(null, { status: 204 });
      throw new Error(`Unexpected loopback fixture request: ${url.pathname}`);
    };
    const env = {
      PATH: "/fake",
      OPENCODE_DB: openCodeProfileV2DatabaseFile(PROFILE_ID),
      OPENCODE_CONFIG_CONTENT: JSON.stringify(buildOpenCodeV2Config(undefined, "opencode-go/kimi-k3")),
    };

    await syncOpenCodeV2CredentialToPrivateDatabase(
      PROFILE_ID,
      secret,
      env,
      createLoopbackServerSpawn([]),
      fetcher,
    );

    expect(requests.filter((item) => item.startsWith("DELETE "))).toEqual([
      "DELETE /api/credential/owned-old",
    ]);
    expect(requests).not.toContain("DELETE /api/credential/manual-key");
    expect(JSON.parse(await readFile(credentialState, "utf8"))).toEqual({
      version: 1,
      credentialIds: ["owned-new"],
    });
  });

  test("keeps prior Go models available for history within one alias", async () => {
    await createOpenCodeGoProfile(PROFILE_ID, { type: "api", key: "fake-history-key" });
    const sync = async () => {};
    const first = await prepareOpenCodeV2RunEnvironment(
      PROFILE_ID,
      "opencode-go/model-a",
      sync,
    );
    const firstConfig = JSON.parse(first.env.OPENCODE_CONFIG_CONTENT ?? "{}");
    expect(firstConfig.providers[OPENCODE_V2_MANAGED_PROVIDER_ID].models).toEqual({
      "model-a": {},
    });

    const second = await prepareOpenCodeV2RunEnvironment(
      PROFILE_ID,
      "opencode-go/model-b",
      sync,
    );
    const secondConfig = JSON.parse(second.env.OPENCODE_CONFIG_CONTENT ?? "{}");
    expect(secondConfig.providers[OPENCODE_V2_MANAGED_PROVIDER_ID].models).toEqual({
      "model-a": {},
      "model-b": {},
    });
    expect(JSON.parse(await readFile(openCodeProfileV2ModelInventoryFile(PROFILE_ID), "utf8"))).toEqual([
      "opencode-go/model-a",
      "opencode-go/model-b",
    ]);
    expect(fileMode((await stat(openCodeProfileV2ModelInventoryFile(PROFILE_ID))).mode)).toBe(0o600);
  });

  test("concurrent V2 launches union alias model history and malformed data fails closed", async () => {
    await createOpenCodeGoProfile(PROFILE_ID, { type: "api", key: "fake-history-key" });
    const sync = async () => {};
    await Promise.all([
      prepareOpenCodeV2RunEnvironment(PROFILE_ID, "opencode-go/model-a", sync),
      prepareOpenCodeV2RunEnvironment(PROFILE_ID, "opencode-go/model-b", sync),
    ]);
    const inventoryFile = openCodeProfileV2ModelInventoryFile(PROFILE_ID);
    expect(JSON.parse(await readFile(inventoryFile, "utf8")).sort()).toEqual([
      "opencode-go/model-a",
      "opencode-go/model-b",
    ]);

    const previous = await readFile(inventoryFile, "utf8");
    await expect(
      prepareOpenCodeV2RunEnvironment(PROFILE_ID, "anthropic/not-a-go-model", sync),
    ).rejects.toThrow("only bind credentials for OpenCode Go models");
    expect(await readFile(inventoryFile, "utf8")).toBe(previous);
    await expect(
      prepareOpenCodeV2RunEnvironment(PROFILE_ID, "opencode-go/model-c", sync),
    ).resolves.toBeDefined();
    const current = JSON.parse(await readFile(inventoryFile, "utf8"));
    expect(current).toContain("opencode-go/model-c");
    await writeFile(inventoryFile, "not-json", { mode: 0o600 });
    await expect(
      prepareOpenCodeV2RunEnvironment(PROFILE_ID, "opencode-go/model-d", sync),
    ).rejects.toThrow("model history is malformed");
    expect(await readFile(inventoryFile, "utf8")).toBe("not-json");
    expect(previous).toContain("model-a");
  });

  test("keeps model inventories and SQLite databases separate across aliases", async () => {
    await createOpenCodeGoProfile(PROFILE_ID, { type: "api", key: "fake-alias-one-key" });
    await createOpenCodeGoProfile(PROFILE_ID_2, { type: "api", key: "fake-alias-two-key" });
    const sync = async () => {};
    await prepareOpenCodeV2RunEnvironment(PROFILE_ID, "opencode-go/model-a", sync);
    const second = await prepareOpenCodeV2RunEnvironment(
      PROFILE_ID_2,
      "opencode-go/model-b",
      sync,
    );
    const config = JSON.parse(second.env.OPENCODE_CONFIG_CONTENT ?? "{}");

    expect(second.env.OPENCODE_DB).toBe(openCodeProfileV2DatabaseFile(PROFILE_ID_2));
    expect(second.env.OPENCODE_DB).not.toBe(openCodeProfileV2DatabaseFile(PROFILE_ID));
    expect(config.providers[OPENCODE_V2_MANAGED_PROVIDER_ID].models).toEqual({
      "model-b": {},
    });
    expect(JSON.parse(await readFile(openCodeProfileV2ModelInventoryFile(PROFILE_ID_2), "utf8"))).toEqual([
      "opencode-go/model-b",
    ]);
  });

  test("runs V2 standalone after syncing the selected key and without exposing it to tools", async () => {
    await createOpenCodeGoProfile(PROFILE_ID, { type: "api", key: "fake-v2-run-key" });
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "go-v2-work",
          target: { provider: "opencode", profileId: PROFILE_ID },
          createdAt: 1,
        },
      ],
    });

    const calls: SpawnCall[] = [];
    let synced: { profileId: string; key: string; env: NodeJS.ProcessEnv } | undefined;
    const exitCode = await runAliasSession(
      "go-v2-work",
      ["--model", "opencode-go/kimi-k3", "--prompt", "hello from this project"],
      createSpawn(calls),
      () => ({ major: 2, minor: 0, patch: 6, raw: "v2.0.6" }),
      async (profileId, key, env) => {
        synced = { profileId, key, env: { ...env } };
      },
    );

    expect(exitCode).toBe(0);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.args).toEqual([
      "--standalone",
      "--auto",
      "--prompt",
      "hello from this project",
    ]);
    expect(synced).toMatchObject({ profileId: PROFILE_ID, key: "fake-v2-run-key" });
    expect(calls[0]?.env?.OPENCODE_API_KEY).toBeUndefined();
    expect(calls[0]?.env?.OPENCODE_CONFIG_CONTENT).not.toContain("fake-v2-run-key");
    const config = JSON.parse(calls[0]?.env?.OPENCODE_CONFIG_CONTENT ?? "{}");
    expect(config.model).toBe(`${OPENCODE_V2_MANAGED_PROVIDER_ID}/kimi-k3`);
    expect(config.experimental.policies).toContainEqual({
      action: "provider.use",
      resource: "*",
      effect: "deny",
    });
    expect(config.enabled_providers).toEqual([OPENCODE_V2_MANAGED_PROVIDER_ID, "opencode"]);
  });

  test("runs a V2 headless one-shot in the current directory with the managed account and model", async () => {
    await createOpenCodeGoProfile(PROFILE_ID, { type: "api", key: "fake-v2-headless-key" });
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "go-v2-headless",
          target: { provider: "opencode", profileId: PROFILE_ID },
          createdAt: 1,
        },
      ],
    });

    const calls: SpawnCall[] = [];
    let synced: { profileId: string; key: string; env: NodeJS.ProcessEnv } | undefined;
    const exitCode = await runAliasSession(
      "go-v2-headless",
      ["--model", "opencode-go/kimi-k3", "run", "--format", "json", "summarize this project"],
      createSpawn(calls),
      () => ({ major: 2, minor: 0, patch: 21, raw: "v2.0.21" }),
      async (profileId, key, env) => {
        synced = { profileId, key, env: { ...env } };
      },
    );

    expect(exitCode).toBe(0);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.command).toBe("opencode");
    // `run` must precede the standalone/auto flags: OpenCode's root parser
    // rejects root flags placed before a subcommand.
    expect(calls[0]?.args).toEqual([
      "run",
      "--standalone",
      "--auto",
      "--format",
      "json",
      "summarize this project",
    ]);
    expect(synced).toMatchObject({ profileId: PROFILE_ID, key: "fake-v2-headless-key" });
    expect(calls[0]?.env?.OPENCODE_DB).toBe(openCodeProfileV2DatabaseFile(PROFILE_ID));
    expect(calls[0]?.env?.OPENCODE_API_KEY).toBeUndefined();
    expect(calls[0]?.env?.OPENCODE_CONFIG_CONTENT).not.toContain("fake-v2-headless-key");
    const config = JSON.parse(calls[0]?.env?.OPENCODE_CONFIG_CONTENT ?? "{}");
    expect(config.model).toBe(`${OPENCODE_V2_MANAGED_PROVIDER_ID}/kimi-k3`);
    expect((await getOpenCodeProfileData(PROFILE_ID)).defaultModel).toBe(
      "opencode-go/kimi-k3",
    );
  });

  test("forwards supported V2 headless run flags and message positionals", async () => {
    await createOpenCodeGoProfile(PROFILE_ID, { type: "api", key: "fake-v2-headless-flags" });
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "go-v2-headless-flags",
          target: { provider: "opencode", profileId: PROFILE_ID },
          createdAt: 1,
        },
      ],
    });

    const calls: SpawnCall[] = [];
    const exitCode = await runAliasSession(
      "go-v2-headless-flags",
      [
        "--model",
        "opencode-go/kimi-k3",
        "run",
        "--format=json",
        "--thinking",
        "--title",
        "Nightly review",
        "--file",
        "./notes.md",
        "--auto",
        "--print-logs",
        "review",
        "the",
        "diff",
      ],
      createSpawn(calls),
      () => ({ major: 2, minor: 0, patch: 21, raw: "v2.0.21" }),
      async () => {},
    );

    expect(exitCode).toBe(0);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.args).toEqual([
      "run",
      "--standalone",
      "--auto",
      "--format=json",
      "--thinking",
      "--title",
      "Nightly review",
      "--file",
      "./notes.md",
      "--auto",
      "--print-logs",
      "review",
      "the",
      "diff",
    ]);
  });

  test("refuses unsafe V2 headless run arguments before syncing or launching", async () => {
    await createOpenCodeGoProfile(PROFILE_ID, { type: "api", key: "fake-v2-headless-guard" });
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "go-v2-headless-guard",
          target: { provider: "opencode", profileId: PROFILE_ID },
          createdAt: 1,
        },
      ],
    });

    const blockedArgs = [
      // Session targeting stays refused: the preflight only covers this
      // directory, and sessions may belong to another project under the alias.
      ["run", "--continue"],
      ["run", "-c"],
      ["run", "--session", "existing-session"],
      ["run", "-s", "existing-session"],
      ["run", "--session=existing-session"],
      ["run", "-sexisting-session"],
      ["run", "--fork"],
      // The alias owns the model, agent, and server selection.
      ["run", "-m", "anthropic/claude-sonnet"],
      ["run", "-m=anthropic/claude-sonnet"],
      ["run", "--model=anthropic/claude-sonnet"],
      ["run", "-model=anthropic/claude-sonnet"],
      ["run", "--agent", "plan"],
      ["run", "--agent=plan"],
      ["run", "--standalone"],
      ["run", "--standalone=false"],
      ["run", "--server", "https://remote.example"],
      ["run", "--attach", "http://remote"],
      ["run", "--config", "/tmp/custom.json"],
      // Unknown or malformed run arguments fail closed.
      ["run", "--prompt", "hello"],
      ["run", "--future-option"],
      ["run", "--format"],
      ["run", "-f"],
      // A flag-like token is not a value for the preceding flag, matching
      // OpenCode's own parser.
      ["run", "--format", "-m", "x"],
      ["run", "--title", "-x", "hello"],
      // `run` must be the first forwarded token; the TUI path still rejects a
      // directory positional.
      ["--auto", "run", "hello"],
      ["/tmp/another-project"],
    ];
    for (const args of blockedArgs) {
      const calls: SpawnCall[] = [];
      let syncCalls = 0;
      const exitCode = await runAliasSession(
        "go-v2-headless-guard",
        args,
        createSpawn(calls),
        () => ({ major: 2, minor: 0, patch: 21, raw: "v2.0.21" }),
        async () => {
          syncCalls += 1;
        },
      );
      expect(exitCode).toBe(1);
      expect(calls).toHaveLength(0);
      expect(syncCalls).toBe(0);
    }
  });

  test("V2 --autoreview toggles the completion-review plugin only for this launch", async () => {
    await createOpenCodeGoProfile(PROFILE_ID, { type: "api", key: "fake-v2-run-key" });
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "go-v2-work",
          target: { provider: "opencode", profileId: PROFILE_ID },
          createdAt: 1,
        },
      ],
    });
    const envName = "CODEX_COMPLETION_REVIEW_DISABLED";
    const originalEnvValue = process.env[envName];
    delete process.env[envName];
    const calls: SpawnCall[] = [];
    const v2 = () => ({ major: 2, minor: 0, patch: 21, raw: "v2.0.21" });
    const sync = async () => {};

    try {
      await runAliasSession("go-v2-work", ["--model", "opencode-go/kimi-k3", "--autoreview", "off"], createSpawn(calls), v2, sync);
      process.env[envName] = "1";
      await runAliasSession("go-v2-work", ["--model", "opencode-go/kimi-k3", "--autoreview", "on"], createSpawn(calls), v2, sync);

      expect(calls).toHaveLength(2);
      expect(calls[0]?.args).toEqual(["--standalone", "--auto"]);
      expect(calls[0]?.env?.[envName]).toBe("1");
      // The private V2 environment is still the one OpenCode receives.
      expect(calls[0]?.env?.OPENCODE_CONFIG_CONTENT).toBeDefined();
      expect(calls[1]?.env?.[envName]).toBeUndefined();
      expect(process.env[envName]).toBe("1");
    } finally {
      if (originalEnvValue === undefined) delete process.env[envName];
      else process.env[envName] = originalEnvValue;
    }
  });

  test("rejects V2 directory, resume, and unknown arguments before syncing or launching", async () => {
    await createOpenCodeGoProfile(PROFILE_ID, { type: "api", key: "fake-v2-run-key" });
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "go-v2-target-guard",
          target: { provider: "opencode", profileId: PROFILE_ID },
          createdAt: 1,
        },
      ],
    });

    const blockedArgs = [
      ["/tmp/another-project"],
      ["--continue"],
      ["-c"],
      ["--session", "existing-session"],
      ["-s", "existing-session"],
      ["--session=existing-session"],
      ["-sexisting-session"],
      ["--future-option"],
    ];
    for (const args of blockedArgs) {
      const calls: SpawnCall[] = [];
      let syncCalls = 0;
      const exitCode = await runAliasSession(
        "go-v2-target-guard",
        args,
        createSpawn(calls),
        () => ({ major: 2, minor: 0, patch: 6, raw: "v2.0.6" }),
        async () => {
          syncCalls += 1;
        },
      );
      expect(exitCode).toBe(1);
      expect(calls).toHaveLength(0);
      expect(syncCalls).toBe(0);
    }
  });

  test("fails closed before launching V2 when no Go model is selected", async () => {
    await createOpenCodeGoProfile(PROFILE_ID, { type: "api", key: "fake-v2-run-key" });
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "go-v2-no-model",
          target: { provider: "opencode", profileId: PROFILE_ID },
          createdAt: 1,
        },
      ],
    });
    const previousConfig = process.env.OPENCODE_CONFIG_CONTENT;
    delete process.env.OPENCODE_CONFIG_CONTENT;
    const calls: SpawnCall[] = [];
    try {
      const exitCode = await runAliasSession(
        "go-v2-no-model",
        [],
        createSpawn(calls),
        () => ({ major: 2, minor: 0, patch: 6, raw: "v2.0.6" }),
        async () => {},
      );
      expect(exitCode).toBe(1);
      expect(calls).toHaveLength(0);
    } finally {
      if (previousConfig === undefined) delete process.env.OPENCODE_CONFIG_CONTENT;
      else process.env.OPENCODE_CONFIG_CONTENT = previousConfig;
    }
  });

  test("blocks a V2 launch when private credential synchronization fails", async () => {
    await createOpenCodeGoProfile(PROFILE_ID, CREDENTIAL);
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "go-v2-blocked",
          target: { provider: "opencode", profileId: PROFILE_ID },
          createdAt: 1,
        },
      ],
    });
    const calls: SpawnCall[] = [];
    const exitCode = await runAliasSession(
      "go-v2-blocked",
      [],
      createSpawn(calls),
      () => ({ major: 2, minor: 0, patch: 6, raw: "v2.0.6" }),
      async () => {
        throw new Error("private credential sync failed");
      },
    );
    expect(exitCode).toBe(1);
    expect(calls).toHaveLength(0);
  });

  test("rejects V2 remote-server overrides before spawning OpenCode", async () => {
    await createOpenCodeGoProfile(PROFILE_ID, CREDENTIAL);
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "go-v2-remote",
          target: { provider: "opencode", profileId: PROFILE_ID },
          createdAt: 1,
        },
      ],
    });
    const calls: SpawnCall[] = [];
    const exitCode = await runAliasSession(
      "go-v2-remote",
      ["--server", "https://remote.example"],
      createSpawn(calls),
      () => ({ major: 2, minor: 0, patch: 6, raw: "v2.0.6" }),
    );
    expect(exitCode).toBe(1);
    expect(calls).toHaveLength(0);
  });

  test("rejects V2 server, config, and model routing overrides before spawning", async () => {
    await createOpenCodeGoProfile(PROFILE_ID, CREDENTIAL);
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "go-v2-unsafe-overrides",
          target: { provider: "opencode", profileId: PROFILE_ID },
          createdAt: 1,
        },
      ],
    });
    const version = () => ({ major: 2, minor: 0, patch: 6, raw: "v2.0.6" });
    for (const args of [
      ["--attach", "http://remote"],
      ["--config", "/tmp/custom.json"],
      ["--standalone=false"],
      ["--model=anthropic/claude-sonnet"],
    ]) {
      const calls: SpawnCall[] = [];
      const exitCode = await runAliasSession(
        "go-v2-unsafe-overrides",
        args,
        createSpawn(calls),
        version,
      );
      expect(exitCode).toBe(1);
      expect(calls).toHaveLength(0);
    }
  });
});
