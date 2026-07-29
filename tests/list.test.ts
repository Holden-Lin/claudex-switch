import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { saveAliases } from "../src/alias/store";
import { list } from "../src/commands/list";
import { saveRegistry } from "../src/providers/codex/registry";
import { makeJwt, resetTestHome, TEST_HOME } from "./helpers";
import type {
  AliasRegistry,
  CodexAuthFile,
  CodexRegistry,
  CredentialsFile,
} from "../src/types";

const originalFetch = globalThis.fetch;

const CODEX_ACCOUNT_KEY = "user-1::acct-1";
// codexAccountAuthFile base64url-encodes keys containing "::".
const CODEX_AUTH_FILE_NAME = `${Buffer.from(CODEX_ACCOUNT_KEY).toString("base64url")}.auth.json`;

function makeCodexTokens(opts: { expired?: boolean; plan?: string } = {}) {
  const exp =
    Math.floor(Date.now() / 1000) + (opts.expired ? -3600 : 3600);
  return {
    id_token: makeJwt({
      email: "one@example.com",
      "https://api.openai.com/auth": {
        chatgpt_account_id: "acct-1",
        user_id: "user-1",
        plan_type: opts.plan ?? "plus",
      },
    }),
    access_token: makeJwt({
      exp,
      "https://api.openai.com/auth": {
        chatgpt_account_id: "acct-1",
        chatgpt_plan_type: opts.plan ?? "plus",
      },
    }),
    refresh_token: "refresh-1",
    account_id: "acct-1",
  };
}

async function writeCodexAuthFile(
  tokens: ReturnType<typeof makeCodexTokens>,
): Promise<string> {
  const dir = join(TEST_HOME, ".codex", "accounts");
  await mkdir(dir, { recursive: true });
  const path = join(dir, CODEX_AUTH_FILE_NAME);
  const auth: CodexAuthFile = {
    auth_mode: "chatgpt",
    OPENAI_API_KEY: null,
    tokens,
    last_refresh: new Date(0).toISOString(),
  };
  await writeFile(path, JSON.stringify(auth, null, 2));
  return path;
}

function createRegistry(): CodexRegistry {
  return {
    schema_version: 3,
    active_account_key: null,
    active_account_activated_at_ms: null,
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
        email: "one@example.com",
        alias: "one",
        account_name: null,
        plan: "plus",
        auth_mode: "chatgpt",
        default_model: "gpt-5.4",
        created_at: 1,
        last_used_at: null,
        last_usage: null,
        last_usage_at: null,
        last_local_rollout: null,
      },
    ],
  };
}

const codexAliases: AliasRegistry = {
  version: 1,
  aliases: [
    {
      alias: "one",
      target: { provider: "codex", accountKey: CODEX_ACCOUNT_KEY },
      createdAt: 1,
    },
  ],
};

const WHAM_USAGE_BODY = JSON.stringify({
  plan_type: "plus",
  rate_limit: {
    allowed: true,
    limit_reached: false,
    primary_window: {
      used_percent: 15,
      limit_window_seconds: 18000,
      reset_after_seconds: 1000,
      reset_at: 1785912092,
    },
    secondary_window: {
      used_percent: 25,
      limit_window_seconds: 604800,
      reset_after_seconds: 2000,
      reset_at: 1785912092,
    },
  },
});

const CLAUDE_USAGE_BODY = JSON.stringify({
  five_hour: {
    utilization: 11.0,
    resets_at: "2026-07-29T09:39:59.472646+00:00",
  },
  seven_day: {
    utilization: 39.0,
    resets_at: "2026-08-02T04:00:00.472669+00:00",
  },
});

interface FetchCall {
  url: string;
  headers: Record<string, string>;
  body: string | null;
}

function mockFetch(
  handler: (url: string, call: FetchCall) => Response | null,
): FetchCall[] {
  const calls: FetchCall[] = [];
  globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
    const url = String(input);
    const call: FetchCall = {
      url,
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: typeof init?.body === "string" ? init.body : null,
    };
    calls.push(call);
    const response = handler(url, call);
    return response ?? new Response("not found", { status: 404 });
  }) as typeof fetch;
  return calls;
}

async function writeClaudeOAuthProfile(
  name: string,
  creds: CredentialsFile,
): Promise<string> {
  const dir = join(TEST_HOME, ".claude-profiles", name);
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, "profile.json"),
    JSON.stringify({ type: "oauth" }),
  );
  const credsPath = join(dir, ".credentials.json");
  await writeFile(credsPath, JSON.stringify(creds));
  await writeFile(
    join(dir, "account.json"),
    JSON.stringify({ accountUuid: "uuid-1", emailAddress: "c@example.com" }),
  );
  return credsPath;
}

function makeClaudeCreds(opts: { expired?: boolean } = {}): CredentialsFile {
  return {
    claudeAiOauth: {
      accessToken: "at-1",
      refreshToken: "rt-1",
      expiresAt: Date.now() + (opts.expired ? -3600_000 : 3600_000),
      scopes: ["user:inference"],
      subscriptionType: "max",
    },
  };
}

describe("list", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    console.log.mockRestore?.();
    delete process.env.CLAUDEX_FORCE_FILE_CREDENTIALS;
  });

  beforeEach(async () => {
    await resetTestHome();
    // Keep credential reads/writes file-based so tests never touch the real
    // macOS keychain.
    process.env.CLAUDEX_FORCE_FILE_CREDENTIALS = "1";
    spyOn(console, "log").mockImplementation(() => {});
  });

  function output(): string {
    return console.log.mock.calls.flat().join("\n");
  }

  test("shows Codex 5h/weekly remaining quota from wham usage", async () => {
    await saveAliases(codexAliases);
    await saveRegistry(createRegistry());
    await writeCodexAuthFile(makeCodexTokens());

    const calls = mockFetch((url) =>
      url.includes("chatgpt.com/backend-api/wham/usage")
        ? new Response(WHAM_USAGE_BODY, { status: 200 })
        : null,
    );

    await list();

    expect(calls.length).toBe(1);
    expect(calls[0]!.headers["chatgpt-account-id"]).toBe("acct-1");
    expect(calls[0]!.headers.Authorization).toStartWith("Bearer ");
    // primary 15% used -> 85% left; secondary 25% used -> 75% left
    expect(output()).toContain("5h 85%");
    expect(output()).toContain("wk 75%");
  });

  test("refreshes an expired Codex token and writes it back", async () => {
    await saveAliases(codexAliases);
    await saveRegistry(createRegistry());
    const authPath = await writeCodexAuthFile(
      makeCodexTokens({ expired: true }),
    );
    const freshTokens = makeCodexTokens();

    const calls = mockFetch((url) => {
      if (url === "https://auth.openai.com/oauth/token") {
        return new Response(
          JSON.stringify({
            id_token: freshTokens.id_token,
            access_token: freshTokens.access_token,
            refresh_token: "refresh-2",
          }),
          { status: 200 },
        );
      }
      if (url.includes("wham/usage")) {
        return new Response(WHAM_USAGE_BODY, { status: 200 });
      }
      return null;
    });

    await list();

    expect(calls.map((c) => new URL(c.url).hostname)).toEqual([
      "auth.openai.com",
      "chatgpt.com",
    ]);
    const refreshBody = JSON.parse(calls[0]!.body ?? "{}");
    expect(refreshBody.grant_type).toBe("refresh_token");
    expect(refreshBody.refresh_token).toBe("refresh-1");

    const saved = JSON.parse(await readFile(authPath, "utf-8"));
    expect(saved.tokens.access_token).toBe(freshTokens.access_token);
    expect(saved.tokens.refresh_token).toBe("refresh-2");
    expect(output()).toContain("5h 85%");
  });

  test("marks a Codex account whose refresh is rejected as login expired", async () => {
    await saveAliases(codexAliases);
    await saveRegistry(createRegistry());
    await writeCodexAuthFile(makeCodexTokens({ expired: true }));

    mockFetch((url) =>
      url === "https://auth.openai.com/oauth/token"
        ? new Response("{}", { status: 401 })
        : null,
    );

    await list();

    expect(output()).toContain("login expired");
  });

  test("skips usage for free-plan Codex accounts", async () => {
    await saveAliases(codexAliases);
    const registry = createRegistry();
    registry.accounts[0]!.plan = "free";
    await saveRegistry(registry);
    await writeCodexAuthFile(makeCodexTokens({ plan: "free" }));

    const calls = mockFetch(() => null);

    await list();

    expect(calls).toEqual([]);
    expect(output()).toContain("one@example.com");
  });

  test("--no-usage performs no network requests", async () => {
    await saveAliases(codexAliases);
    await saveRegistry(createRegistry());
    await writeCodexAuthFile(makeCodexTokens());

    const calls = mockFetch(() => null);

    await list({ usage: false });

    expect(calls).toEqual([]);
    expect(output()).toContain("one@example.com");
  });

  test("respects the registry api.usage=false kill switch for Codex", async () => {
    await saveAliases(codexAliases);
    const registry = createRegistry();
    registry.api.usage = false;
    await saveRegistry(registry);
    await writeCodexAuthFile(makeCodexTokens());

    const calls = mockFetch(() => null);

    await list();

    expect(calls).toEqual([]);
  });

  test("shows Claude 5h/weekly remaining quota from the oauth usage API", async () => {
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "work",
          target: { provider: "claude", profileName: "work" },
          createdAt: 1,
        },
      ],
    });
    await writeClaudeOAuthProfile("work", makeClaudeCreds());

    const calls = mockFetch((url) =>
      url === "https://api.anthropic.com/api/oauth/usage"
        ? new Response(CLAUDE_USAGE_BODY, { status: 200 })
        : null,
    );

    await list();

    expect(calls.length).toBe(1);
    expect(calls[0]!.headers.Authorization).toBe("Bearer at-1");
    expect(calls[0]!.headers["anthropic-beta"]).toBe("oauth-2025-04-20");
    // 11% used -> 89% left; 39% used -> 61% left
    expect(output()).toContain("5h 89%");
    expect(output()).toContain("wk 61%");
  });

  test("refreshes an expired Claude token and writes the snapshot back", async () => {
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "work",
          target: { provider: "claude", profileName: "work" },
          createdAt: 1,
        },
      ],
    });
    const credsPath = await writeClaudeOAuthProfile(
      "work",
      makeClaudeCreds({ expired: true }),
    );

    const calls = mockFetch((url) => {
      if (url === "https://console.anthropic.com/v1/oauth/token") {
        return new Response(
          JSON.stringify({
            access_token: "at-2",
            refresh_token: "rt-2",
            expires_in: 3600,
          }),
          { status: 200 },
        );
      }
      if (url === "https://api.anthropic.com/api/oauth/usage") {
        return new Response(CLAUDE_USAGE_BODY, { status: 200 });
      }
      return null;
    });

    await list();

    expect(calls.map((c) => new URL(c.url).hostname)).toEqual([
      "console.anthropic.com",
      "api.anthropic.com",
    ]);
    const refreshBody = JSON.parse(calls[0]!.body ?? "{}");
    expect(refreshBody.grant_type).toBe("refresh_token");
    expect(refreshBody.refresh_token).toBe("rt-1");
    expect(calls[1]!.headers.Authorization).toBe("Bearer at-2");

    const saved = JSON.parse(await readFile(credsPath, "utf-8"));
    expect(saved.claudeAiOauth.accessToken).toBe("at-2");
    expect(saved.claudeAiOauth.refreshToken).toBe("rt-2");
    expect(saved.claudeAiOauth.expiresAt).toBeGreaterThan(Date.now());
    expect(output()).toContain("5h 89%");
  });

  test("shows one-api relay balance for api-key accounts", async () => {
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "relay",
          target: { provider: "claude", profileName: "relay" },
          createdAt: 1,
        },
      ],
    });
    const dir = join(TEST_HOME, ".claude-profiles", "relay");
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, "profile.json"),
      JSON.stringify({
        type: "api-key",
        apiKey: "sk-test-key-12345678",
        baseUrl: "https://relay.example.com/v1",
      }),
    );

    mockFetch((url) => {
      if (url === "https://relay.example.com/v1/dashboard/billing/subscription") {
        return new Response(
          JSON.stringify({
            object: "billing_subscription",
            hard_limit_usd: 50,
          }),
          { status: 200 },
        );
      }
      if (url.startsWith("https://relay.example.com/v1/dashboard/billing/usage")) {
        return new Response(
          JSON.stringify({ object: "list", total_usage: 265.6932 }),
          { status: 200 },
        );
      }
      return null;
    });

    await list();

    expect(output()).toContain("$47.34 left");
  });

  test("shows key and account balances together when relays.json has an access token", async () => {
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "relay",
          target: { provider: "claude", profileName: "relay" },
          createdAt: 1,
        },
      ],
    });
    const dir = join(TEST_HOME, ".claude-profiles", "relay");
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, "profile.json"),
      JSON.stringify({
        type: "api-key",
        apiKey: "sk-test-key-12345678",
        baseUrl: "https://relay.example.com/v1",
      }),
    );
    await mkdir(join(TEST_HOME, ".claudex-switch"), { recursive: true });
    await writeFile(
      join(TEST_HOME, ".claudex-switch", "relays.json"),
      JSON.stringify({
        "https://relay.example.com": { accessToken: "console-token", userId: 7 },
      }),
    );

    const calls = mockFetch((url) => {
      if (url === "https://relay.example.com/api/user/self") {
        return new Response(
          JSON.stringify({
            success: true,
            data: { id: 7, quota: 6_180_000, used_quota: 461_887_971 },
          }),
          { status: 200 },
        );
      }
      if (url === "https://relay.example.com/api/status") {
        return new Response(
          JSON.stringify({ success: true, data: { quota_per_unit: 500000 } }),
          { status: 200 },
        );
      }
      if (url === "https://relay.example.com/v1/dashboard/billing/subscription") {
        return new Response(
          JSON.stringify({ object: "billing_subscription", hard_limit_usd: 50 }),
          { status: 200 },
        );
      }
      if (url.startsWith("https://relay.example.com/v1/dashboard/billing/usage")) {
        return new Response(
          JSON.stringify({ object: "list", total_usage: 265.6932 }),
          { status: 200 },
        );
      }
      return null;
    });

    await list();

    const selfCall = calls.find((c) => c.url.endsWith("/api/user/self"));
    expect(selfCall?.headers.Authorization).toBe("console-token");
    expect(selfCall?.headers["New-Api-User"]).toBe("7");
    // key: $50 limit - $2.66 used = $47.34; acct: 6,180,000 / 500,000 = $12.36
    expect(output()).toContain("key $47.34 left");
    expect(output()).toContain("acct $12.36 left");
  });

  test("falls back to token-level billing when the relay access token is rejected", async () => {
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "relay",
          target: { provider: "claude", profileName: "relay" },
          createdAt: 1,
        },
      ],
    });
    const dir = join(TEST_HOME, ".claude-profiles", "relay");
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, "profile.json"),
      JSON.stringify({
        type: "api-key",
        apiKey: "sk-test-key-12345678",
        baseUrl: "https://relay.example.com",
      }),
    );
    await mkdir(join(TEST_HOME, ".claudex-switch"), { recursive: true });
    await writeFile(
      join(TEST_HOME, ".claudex-switch", "relays.json"),
      JSON.stringify({
        "https://relay.example.com": { accessToken: "stale-token" },
      }),
    );

    mockFetch((url) => {
      if (url === "https://relay.example.com/api/user/self") {
        return new Response(
          JSON.stringify({ success: false, message: "Unauthorized" }),
          { status: 200 },
        );
      }
      if (url === "https://relay.example.com/v1/dashboard/billing/subscription") {
        return new Response(
          JSON.stringify({ object: "billing_subscription", hard_limit_usd: 50 }),
          { status: 200 },
        );
      }
      if (url.startsWith("https://relay.example.com/v1/dashboard/billing/usage")) {
        return new Response(
          JSON.stringify({ object: "list", total_usage: 265.6932 }),
          { status: 200 },
        );
      }
      return null;
    });

    await list();

    expect(output()).toContain("$47.34 left");
  });

  test("shows no balance when the relay answers with HTML", async () => {
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "relay",
          target: { provider: "claude", profileName: "relay" },
          createdAt: 1,
        },
      ],
    });
    const dir = join(TEST_HOME, ".claude-profiles", "relay");
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, "profile.json"),
      JSON.stringify({
        type: "api-key",
        apiKey: "sk-test-key-12345678",
        baseUrl: "https://relay.example.com",
      }),
    );

    mockFetch(() => new Response("<!doctype html><html></html>", { status: 200 }));

    await list();

    expect(output()).not.toContain("left");
    expect(output()).toContain("relay");
  });
});
