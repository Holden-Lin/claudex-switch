import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { spawnSync } from "child_process";
import { lstat, mkdir, readFile, readdir, writeFile } from "fs/promises";
import { dirname, join, relative } from "path";
import { saveAliases } from "../src/alias/store";
import { list } from "../src/commands/list";
import {
  CLAUDE_STATE_FILE,
  CODEX_AUTH_FILE,
  CODEX_REGISTRY_FILE,
  claudeProfileAccountFile,
  claudeProfileCredentials,
  claudeProfileDataFile,
  codexAccountAuthFile,
  openCodeProfileDataFile,
} from "../src/lib/paths";
import {
  createOpenCodeGoProfile,
  setActiveOpenCodeProfile,
} from "../src/providers/opencode/profiles";
import { saveRegistry } from "../src/providers/codex/registry";
import { makeJwt, resetTestHome, TEST_HOME } from "./helpers";
import type {
  AliasRegistry,
  CodexAuthFile,
  CodexRegistry,
  CredentialsFile,
} from "../src/types";

const CODEX_ACCOUNT_KEY = "user-1::acct-1";
const CODEX_RELAY_ACCOUNT_KEY = "relay-account";
const CODEX_PROFILE_ID = "go-00000000-0000-4000-8000-000000000003";
const API_KEY_SENTINEL = "raw-api-key-sentinel-do-not-print";
const PROVIDER_SENTINEL = "provider-label-sentinel-do-not-print";
const EMAIL_SENTINEL = "private-email-sentinel@example.test";
const ENDPOINT_SENTINEL = "endpoint-query-secret-sentinel";

const originalFetch = globalThis.fetch;

function runCli(args: string[]) {
  return spawnSync(process.execPath, ["src/index.ts", ...args], {
    cwd: process.cwd(),
    encoding: "utf-8",
    env: {
      ...process.env,
      CLAUDEX_DISABLE_AUTO_UPDATE: "1",
      CLAUDEX_FORCE_FILE_CREDENTIALS: "1",
      NO_COLOR: "1",
    },
  });
}

function makeCodexTokens(plan = "pro") {
  return {
    id_token: makeJwt({
      email: EMAIL_SENTINEL,
      "https://api.openai.com/auth": {
        chatgpt_account_id: "acct-1",
        user_id: "user-1",
        plan_type: plan,
      },
    }),
    access_token: makeJwt({
      exp: Math.floor(Date.now() / 1000) + 3600,
      "https://api.openai.com/auth": {
        chatgpt_account_id: "acct-1",
        chatgpt_plan_type: plan,
      },
    }),
    refresh_token: API_KEY_SENTINEL,
    account_id: "acct-1",
  };
}

function makeClaudeCredentials(plan = "max"): CredentialsFile {
  return {
    claudeAiOauth: {
      accessToken: "claude-access-token-sentinel",
      refreshToken: "claude-refresh-token-sentinel",
      expiresAt: Date.now() + 60_000,
      scopes: ["user:inference"],
      subscriptionType: plan,
    },
  };
}

function createRegistry(): CodexRegistry {
  return {
    schema_version: 3,
    active_account_key: CODEX_ACCOUNT_KEY,
    active_account_activated_at_ms: 1,
    auto_switch: {
      enabled: false,
      threshold_5h_percent: 10,
      threshold_weekly_percent: 5,
    },
    api: { usage: true, account: true },
    accounts: [
      {
        account_key: CODEX_ACCOUNT_KEY,
        chatgpt_account_id: "acct-1",
        chatgpt_user_id: "user-1",
        email: EMAIL_SENTINEL,
        alias: "codex-work",
        account_name: null,
        plan: "free",
        auth_mode: "chatgpt",
        default_model: "",
        created_at: 1,
        last_used_at: null,
        last_usage: null,
        last_usage_at: null,
        last_local_rollout: null,
      },
      {
        account_key: CODEX_RELAY_ACCOUNT_KEY,
        chatgpt_account_id: "relay-id",
        chatgpt_user_id: "relay-user",
        email: EMAIL_SENTINEL,
        alias: "codex-relay",
        account_name: null,
        plan: "plan-secret-sentinel",
        auth_mode: "apikey",
        default_model: API_KEY_SENTINEL,
        api_provider: {
          type: "custom",
          name: PROVIDER_SENTINEL,
          base_url: `https://relay.example/v1?token=${ENDPOINT_SENTINEL}`,
          model: "gpt-4.1",
          env_key: "RELAY_KEY_SECRET_SENTINEL",
        },
        created_at: 2,
        last_used_at: null,
        last_usage: null,
        last_usage_at: null,
        last_local_rollout: null,
      },
    ],
  };
}

async function writeClaudeFixture(): Promise<void> {
  const credentials = makeClaudeCredentials();
  await mkdir(dirname(claudeProfileDataFile("work")), { recursive: true });
  await writeFile(
    claudeProfileDataFile("work"),
    JSON.stringify({ type: "oauth", defaultModel: "claude-sonnet-4-6" }),
  );
  await writeFile(claudeProfileCredentials("work"), JSON.stringify(credentials));
  await writeFile(
    claudeProfileAccountFile("work"),
    JSON.stringify({ emailAddress: EMAIL_SENTINEL }),
  );
  await writeFile(CLAUDE_STATE_FILE, JSON.stringify({ active: "work" }));
}

async function writeCodexFixture(): Promise<void> {
  const registry = createRegistry();
  await saveRegistry(registry);
  const snapshotPath = codexAccountAuthFile(CODEX_ACCOUNT_KEY);
  await mkdir(dirname(snapshotPath), { recursive: true });
  const snapshot: CodexAuthFile = {
    auth_mode: "chatgpt",
    OPENAI_API_KEY: null,
    tokens: makeCodexTokens("plus"),
    last_refresh: new Date(0).toISOString(),
  };
  const active: CodexAuthFile = {
    ...snapshot,
    tokens: makeCodexTokens("pro"),
  };
  await writeFile(snapshotPath, JSON.stringify(snapshot, null, 2));
  await writeFile(CODEX_AUTH_FILE, JSON.stringify(active, null, 2));
  const relayPath = codexAccountAuthFile(CODEX_RELAY_ACCOUNT_KEY);
  await mkdir(dirname(relayPath), { recursive: true });
  await writeFile(
    relayPath,
    JSON.stringify({ auth_mode: "apikey", OPENAI_API_KEY: API_KEY_SENTINEL }),
  );
}

async function writeOpenCodeFixture(): Promise<void> {
  await createOpenCodeGoProfile(CODEX_PROFILE_ID, {
    type: "api",
    key: API_KEY_SENTINEL,
  });
  await writeFile(
    openCodeProfileDataFile(CODEX_PROFILE_ID),
    JSON.stringify({ type: "go", defaultModel: "opencode-go/kimi-k3" }),
  );
  await setActiveOpenCodeProfile(CODEX_PROFILE_ID);
}

async function writeAllProviderAliases(): Promise<void> {
  await saveAliases({
    version: 1,
    aliases: [
      {
        alias: "z-claude",
        target: { provider: "claude", profileName: "work" },
        createdAt: 1,
      },
      {
        alias: "b-codex",
        target: { provider: "codex", accountKey: CODEX_ACCOUNT_KEY },
        createdAt: 2,
      },
      {
        alias: "c-codex-relay",
        target: { provider: "codex", accountKey: CODEX_RELAY_ACCOUNT_KEY },
        createdAt: 4,
      },
      {
        alias: "a-opencode",
        target: { provider: "opencode", profileId: CODEX_PROFILE_ID },
        createdAt: 3,
      },
    ],
  });
}

async function writeAllProviders(): Promise<void> {
  await writeAllProviderAliases();
  await writeClaudeFixture();
  await writeCodexFixture();
  await writeOpenCodeFixture();
}

async function snapshotTree(root: string): Promise<string> {
  const rows: Array<[string, string, number, number, string?]> = [];
  async function visit(path: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(path, { withFileTypes: true });
    } catch {
      return;
    }
    entries.sort((left, right) => (left.name < right.name ? -1 : 1));
    for (const entry of entries) {
      const fullPath = join(path, entry.name);
      const relPath = relative(root, fullPath);
      const metadata = await lstat(fullPath);
      if (entry.isDirectory()) {
        rows.push([relPath, "directory", metadata.mode, metadata.mtimeMs]);
        await visit(fullPath);
      } else if (entry.isFile()) {
        const contents = await readFile(fullPath);
        rows.push([
          relPath,
          "file",
          metadata.mode,
          metadata.mtimeMs,
          contents.toString("base64"),
        ]);
      }
    }
  }
  await visit(root);
  return JSON.stringify(rows);
}

describe("list --json", () => {
  beforeEach(async () => {
    await resetTestHome();
    process.env.CLAUDEX_FORCE_FILE_CREDENTIALS = "1";
    spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    console.log.mockRestore?.();
    delete process.env.CLAUDEX_FORCE_FILE_CREDENTIALS;
  });

  test("emits one valid versioned JSON object for an empty inventory", () => {
    const result = runCli(["list", "--json", "--no-usage"]);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).not.toContain("\u001b");
    expect(result.stdout.trim().split("\n")).toHaveLength(1);
    expect(JSON.parse(result.stdout)).toEqual({ schemaVersion: 1, accounts: [] });
  });

  test("advertises JSON inventory support in help without triggering auto-update", () => {
    const result = runCli(["help"]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("list [--json] [--no-usage]");
    expect(result.stderr).toBe("");
  });

  test("outputs stable allowlisted records for providers in deterministic order", async () => {
    await writeAllProviders();
    const result = runCli(["ls", "--json", "--no-usage"]);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).not.toContain("\u001b");
    expect(result.stdout.trim().split("\n")).toHaveLength(1);
    const payload = JSON.parse(result.stdout);
    expect(payload.schemaVersion).toBe(1);
    expect(payload.accounts.map((account: { provider: string }) => account.provider)).toEqual([
      "claude",
      "codex",
      "codex",
      "opencode",
    ]);
    expect(payload.accounts.map((account: { alias: string }) => account.alias)).toEqual([
      "z-claude",
      "b-codex",
      "c-codex-relay",
      "a-opencode",
    ]);
    for (const account of payload.accounts) {
      expect(Object.keys(account)).toEqual([
        "alias",
        "provider",
        "authMode",
        "plan",
        "defaultModel",
        "isActive",
        "status",
        "usage",
        "balance",
      ]);
      expect(account.usage).toBeNull();
      expect(account.balance).toBeNull();
      expect(account.status).toBe("configured");
    }
    expect(payload.accounts[0].isActive).toBe(true);
    expect(payload.accounts[1].isActive).toBe(true);
    expect(payload.accounts[2].isActive).toBe(false);
    expect(payload.accounts[3].isActive).toBe(true);
    expect(payload.accounts[0]).toMatchObject({
      alias: "z-claude",
      provider: "claude",
      authMode: "oauth",
      plan: "max",
      defaultModel: "claude-sonnet-4-6",
    });
    expect(payload.accounts[1]).toMatchObject({
      alias: "b-codex",
      provider: "codex",
      authMode: "chatgpt",
      plan: "plus",
      defaultModel: "gpt-5.4",
    });
    expect(payload.accounts[2]).toMatchObject({
      alias: "c-codex-relay",
      provider: "codex",
      authMode: "apikey",
      plan: null,
      defaultModel: null,
    });
    expect(payload.accounts[3]).toMatchObject({
      alias: "a-opencode",
      provider: "opencode",
      authMode: "subscription",
      plan: "go",
      defaultModel: "opencode-go/kimi-k3",
    });

    for (const sentinel of [
      API_KEY_SENTINEL,
      PROVIDER_SENTINEL,
      EMAIL_SENTINEL,
      ENDPOINT_SENTINEL,
      "access-token-sentinel",
      "refresh-token-sentinel",
    ]) {
      expect(result.stdout).not.toContain(sentinel);
    }
  });

  test("offline JSON makes no network requests or local file changes", async () => {
    await writeAllProviders();
    const registry = createRegistry();
    registry.accounts[0]!.default_model = "";
    await saveRegistry(registry);
    const before = await snapshotTree(TEST_HOME);
    const fetchCalls: string[] = [];
    globalThis.fetch = (async (input: unknown) => {
      fetchCalls.push(String(input));
      throw new Error("network sentinel");
    }) as typeof fetch;

    await list({ json: true, usage: false });

    expect(fetchCalls).toEqual([]);
    expect(await snapshotTree(TEST_HOME)).toBe(before);
  });

  test("serializes quota windows as numeric data and omits provider error notes", async () => {
    await writeAllProviders();
    globalThis.fetch = (async () =>
      new Response("unavailable", { status: 404 })) as typeof fetch;
    const codexError = "codex provider error sentinel";
    const openCodeError = "opencode provider error sentinel";

    await list({
      json: true,
      codexUsageFetcher: async () => ({
        usage: {
          fiveHourUsedPercent: 23.5,
          fiveHourResetsAt: 1_800_000_000,
          weeklyUsedPercent: 41,
          weeklyResetsAt: null,
        },
        note: codexError,
      }),
      openCodeUsageFetcher: async () => ({
        usage: {
          fiveHourUsedPercent: 10,
          fiveHourResetsAt: 1_810_000_000,
          weeklyUsedPercent: 20,
          weeklyResetsAt: 1_820_000_000,
          monthlyUsedPercent: 30,
          monthlyResetsAt: 1_830_000_000,
        },
        note: openCodeError,
      }),
    });

    const output = console.log.mock.calls.flat().join("\n");
    const payload = JSON.parse(output);
    expect(payload.accounts[1].usage).toEqual({
      fiveHourUsedPercent: 23.5,
      fiveHourResetsAt: 1_800_000_000,
      weeklyUsedPercent: 41,
      weeklyResetsAt: null,
      monthlyUsedPercent: null,
      monthlyResetsAt: null,
    });
    expect(payload.accounts[3].usage).toEqual({
      fiveHourUsedPercent: 10,
      fiveHourResetsAt: 1_810_000_000,
      weeklyUsedPercent: 20,
      weeklyResetsAt: 1_820_000_000,
      monthlyUsedPercent: 30,
      monthlyResetsAt: 1_830_000_000,
    });
    expect(output).not.toContain(codexError);
    expect(output).not.toContain(openCodeError);
  });

  test("handles missing credentials and legacy Claude profiles without profile.json", async () => {
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "legacy-claude",
          target: { provider: "claude", profileName: "legacy" },
          createdAt: 1,
        },
        {
          alias: "no-credential",
          target: { provider: "claude", profileName: "empty" },
          createdAt: 2,
        },
        {
          alias: "missing-codex-auth",
          target: { provider: "codex", accountKey: CODEX_ACCOUNT_KEY },
          createdAt: 3,
        },
      ],
    });
    const legacyCredentialsPath = claudeProfileCredentials("legacy");
    await mkdir(dirname(legacyCredentialsPath), { recursive: true });
    await writeFile(
      legacyCredentialsPath,
      JSON.stringify(makeClaudeCredentials("pro")),
    );
    await mkdir(dirname(claudeProfileDataFile("empty")), { recursive: true });
    await writeFile(
      claudeProfileDataFile("empty"),
      JSON.stringify({ type: "oauth" }),
    );
    await saveRegistry(createRegistry());
    // Intentionally do not create this Codex account's auth snapshot.
    const result = runCli(["list", "--json", "--no-usage"]);

    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.accounts).toEqual([
      expect.objectContaining({
        alias: "legacy-claude",
        provider: "claude",
        plan: "pro",
        status: "configured",
      }),
      expect.objectContaining({
        alias: "no-credential",
        status: "missing-credential",
      }),
      expect.objectContaining({
        alias: "missing-codex-auth",
        status: "missing-credential",
      }),
    ]);
  });

  test("represents missing provider records without throwing or exposing raw errors", async () => {
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "dangling-codex",
          target: { provider: "codex", accountKey: "missing::account" },
          createdAt: 1,
        },
        {
          alias: "gone-opencode",
          target: { provider: "opencode", profileId: CODEX_PROFILE_ID },
          createdAt: 2,
        },
        {
          alias: "bad-open-code",
          target: { provider: "opencode", profileId: "../../secret" },
          createdAt: 3,
        },
      ],
    });
    await mkdir(dirname(CODEX_REGISTRY_FILE), { recursive: true });
    await writeFile(CODEX_REGISTRY_FILE, "{ malformed json");
    await mkdir(dirname(openCodeProfileDataFile(CODEX_PROFILE_ID)), {
      recursive: true,
    });
    await writeFile(openCodeProfileDataFile(CODEX_PROFILE_ID), "{ malformed json");
    const result = runCli(["list", "--json", "--no-usage"]);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    const payload = JSON.parse(result.stdout);
    expect(payload.accounts).toHaveLength(2);
    expect(payload.accounts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          alias: "dangling-codex",
          status: "missing-profile",
        }),
        expect.objectContaining({
          alias: "gone-opencode",
          status: "missing-profile",
          authMode: "missing-profile",
        }),
      ]),
    );
    expect(result.stdout).not.toContain("malformed json");
  });

  test("sends generic errors to stderr and never leaks an invalid option", () => {
    const result = runCli(["list", "--json", API_KEY_SENTINEL]);

    expect(result.status).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Unsupported list option");
    expect(result.stderr).not.toContain(API_KEY_SENTINEL);
  });

  test("keeps the default list command human-readable", async () => {
    await writeAllProviderAliases();
    await writeCodexFixture();
    const result = runCli(["list", "--no-usage"]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Accounts");
    expect(result.stdout).toContain("b-codex");
    expect(result.stdout).not.toContain('"schemaVersion"');
  });
});
