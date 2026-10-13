import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import type { ChildProcess } from "child_process";
import { EventEmitter } from "events";
import { readdir, readFile, stat } from "fs/promises";
import { loadAliases, saveAliases } from "../src/alias/store";
import { purgeAccount } from "../src/accounts/purge";
import { resolveCLIProxyClaudeEntry, UserFacingError } from "../src/commands/cliproxy";
import { list } from "../src/commands/list";
import { runAliasSession } from "../src/commands/run";
import {
  CLAUDE_PROFILES_DIR,
  CLI_PROXY_API_LINKS_FILE,
  claudeProfileDataFile,
  cliProxyAPIConfigFile,
  cliProxyAPIEnvFile,
  cliProxyAPIProfileDir,
} from "../src/lib/paths";
import { getProfileData } from "../src/providers/claude/profiles";
import {
  acquireManagedCLIProxyAPILease,
  ensureManagedCLIProxyAPI,
  prepareLocalCLIProxyAPIClaudeSettings,
  stopManagedCLIProxyAPI,
  stopStaleManagedCLIProxyAPI,
} from "../src/providers/cliproxyapi/managed";
import { getLinkedClaudeProfile } from "../src/providers/cliproxyapi/links";
import {
  pickAntigravityModels,
  pickOpenCodeGoModels,
} from "../src/providers/cliproxyapi/upstreams";
import { loadRegistry, saveRegistry } from "../src/providers/codex/registry";
import {
  createOpenCodeGoProfile,
  saveOpenCodeConsoleProfile,
  saveOpenCodeGoCredential,
} from "../src/providers/opencode/profiles";
import type { CodexRegistry, LocalCLIProxyAPIProfileData } from "../src/types";
import { resetTestHome } from "./helpers";
import { join } from "path";
import { randomUUID } from "crypto";

const FIXTURE_BINARY = join(import.meta.dir, "fixtures", "fake-cliproxyapi");
const CODEX_ACCOUNT_KEY = "user-1::acct-1";
const GO_PROFILE_ID = "go-11111111-1111-4111-8111-111111111111";
const options = {
  resolveBinary: async () => FIXTURE_BINARY,
  confirmRisk: async () => true,
};
const originalFetch = globalThis.fetch;
const FAKE_ENV = [
  "CLAUDEX_FAKE_CHATGPT_ACCOUNT_ID",
  "CLAUDEX_FAKE_LOGIN_EXIT",
  "CLAUDEX_FAKE_MODELS",
  "CLAUDEX_FAKE_AUTH_SUB",
];

function codexRegistry(): CodexRegistry {
  return {
    schema_version: 3,
    active_account_key: null,
    active_account_activated_at_ms: null,
    auto_switch: { enabled: false, threshold_5h_percent: 10, threshold_weekly_percent: 5 },
    api: { usage: true, account: true },
    accounts: [
      {
        account_key: CODEX_ACCOUNT_KEY,
        chatgpt_account_id: "acct-1",
        chatgpt_user_id: "user-1",
        email: "one@example.com",
        alias: "cx",
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

async function seedAccounts(): Promise<void> {
  await saveRegistry(codexRegistry());
  await createOpenCodeGoProfile(GO_PROFILE_ID, { type: "api", key: "go-secret-1" });
  await saveAliases({
    version: 1,
    aliases: [
      { alias: "cx", target: { provider: "codex", accountKey: CODEX_ACCOUNT_KEY }, createdAt: 1 },
      { alias: "go", target: { provider: "opencode", profileId: GO_PROFILE_ID }, createdAt: 1 },
    ],
  });
}

async function localProfiles(): Promise<Array<{ name: string; data: LocalCLIProxyAPIProfileData }>> {
  let names: string[] = [];
  try {
    names = await readdir(CLAUDE_PROFILES_DIR);
  } catch {
    return [];
  }
  const result = [];
  for (const name of names) {
    try {
      const data = JSON.parse(await readFile(claudeProfileDataFile(name), "utf-8"));
      if (data.type === "local-cliproxyapi") result.push({ name, data });
    } catch {
      // Not a profile directory.
    }
  }
  return result;
}

async function managedDirs(): Promise<string[]> {
  try {
    return (await readdir(join(cliProxyAPIProfileDir(randomUUID()), ".."))).filter(
      (name) => name !== "locks",
    );
  } catch {
    return [];
  }
}

function fakeClaudeSpawn(calls: Array<{ command: string; args: string[] }>) {
  return (command: string, args: string[]) => {
    calls.push({ command, args });
    const proc = new EventEmitter();
    queueMicrotask(() => proc.emit("close", 0));
    return proc as ChildProcess;
  };
}

describe("--cliproxy claudecode", () => {
  beforeEach(async () => {
    await resetTestHome();
    for (const key of FAKE_ENV) delete process.env[key];
    process.env.CLAUDEX_FAKE_CHATGPT_ACCOUNT_ID = "acct-1";
    // The Go catalog is the only network call; everything else is loopback.
    globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
      const url = String(input instanceof Request ? input.url : input);
      if (url.startsWith("https://opencode.ai/")) {
        return Response.json({
          data: ["kimi-k3", "glm-5.3", "glm-5.3-flash", "deepseek-v4-flash", "minimax-m3"].map(
            (id) => ({ id }),
          ),
        });
      }
      return originalFetch(input as Request, init);
    }) as typeof fetch;
    await seedAccounts();
  });

  afterEach(async () => {
    globalThis.fetch = originalFetch;
    for (const { data } of await localProfiles()) {
      try {
        await stopManagedCLIProxyAPI(data);
      } catch {
        // Already purged or never started.
      }
    }
    for (const key of FAKE_ENV) delete process.env[key];
    await resetTestHome();
  });

  test("Codex alias logs in once, only as the same ChatGPT account, then reuses the link", async () => {
    const entry = await resolveCLIProxyClaudeEntry("cx", options);
    expect(entry.alias).toBe("cx");
    expect(entry.target.provider).toBe("claude");
    const profileName = (entry.target as { profileName: string }).profileName;
    expect(await getLinkedClaudeProfile({ provider: "codex", accountKey: CODEX_ACCOUNT_KEY })).toBe(
      profileName,
    );
    const data = (await getProfileData(profileName)) as LocalCLIProxyAPIProfileData;
    expect(data.upstream).toBe("codex");
    expect(data.authIdentity).toBeString();
    // The link is not an alias and never becomes the global Claude account.
    expect((await loadAliases()).aliases.map((a) => a.alias).sort()).toEqual(["cx", "go"]);

    // A second launch must not log in again.
    process.env.CLAUDEX_FAKE_LOGIN_EXIT = "1";
    const again = await resolveCLIProxyClaudeEntry("cx", options);
    expect(again.target).toEqual(entry.target);
    expect((await readFile(CLI_PROXY_API_LINKS_FILE, "utf-8")).includes(profileName)).toBe(true);
  });

  test("a login for a different ChatGPT account is rejected and leaves nothing behind", async () => {
    process.env.CLAUDEX_FAKE_CHATGPT_ACCOUNT_ID = "acct-someone-else";
    await expect(resolveCLIProxyClaudeEntry("cx", options)).rejects.toThrow("different account");
    expect(await getLinkedClaudeProfile({ provider: "codex", accountKey: CODEX_ACCOUNT_KEY })).toBeNull();
    expect(await localProfiles()).toEqual([]);
    expect(await managedDirs()).toEqual([]);
  });

  test("Codex runtime.yaml stays byte-for-byte what earlier releases generated", async () => {
    const entry = await resolveCLIProxyClaudeEntry("cx", options);
    const data = (await getProfileData(
      (entry.target as { profileName: string }).profileName,
    )) as LocalCLIProxyAPIProfileData;
    const runtime = await ensureManagedCLIProxyAPI(data);
    const raw = await readFile(cliProxyAPIConfigFile(data.profileId), "utf-8");
    const authDir = join(cliProxyAPIProfileDir(data.profileId), "auth");
    expect(raw).toBe(
      [
        'host: "127.0.0.1"',
        `port: ${runtime.port}`,
        `auth-dir: ${JSON.stringify(authDir)}`,
        "api-keys:",
        `  - ${JSON.stringify(runtime.apiKey)}`,
        "remote-management:",
        "  allow-remote: false",
        '  secret-key: ""',
        "  disable-control-panel: true",
        "logging-to-file: false",
        "usage-statistics-enabled: false",
        "oauth-model-alias:",
        "  codex:",
        '    - name: "gpt-5.6-terra"',
        '      alias: "claudex-terra-max"',
        "      fork: true",
        "payload:",
        "  override:",
        "    - models:",
        '        - name: "claudex-terra-max"',
        '          protocol: "codex"',
        "      params:",
        '        "reasoning.effort": "max"',
        "",
      ].join("\n"),
    );
    const env = await readFile(cliProxyAPIEnvFile(data.profileId), "utf-8");
    expect(env).not.toContain("CLAUDEX_CLIPROXYAPI_UPSTREAM");
  });

  test("OpenCode Go alias needs no login, routes both wire formats, and follows key changes", async () => {
    const entry = await resolveCLIProxyClaudeEntry("go", options);
    const profileName = (entry.target as { profileName: string }).profileName;
    const data = (await getProfileData(profileName)) as LocalCLIProxyAPIProfileData;
    expect(data.upstream).toBe("opencode-go");

    const runtime = await ensureManagedCLIProxyAPI(data);
    const raw = await readFile(cliProxyAPIConfigFile(data.profileId), "utf-8");
    expect(raw).toContain("openai-compatibility:");
    expect(raw).toContain('base-url: "https://opencode.ai/zen/go/v1"');
    expect(raw).toContain('api-key: "go-secret-1"');
    expect(raw).toContain('- name: "kimi-k3"');
    // MiniMax only speaks Anthropic Messages on Go.
    expect(raw).toMatch(/claude-api-key:\n  - api-key: "go-secret-1"\n    base-url: "https:\/\/opencode.ai\/zen\/go"\n    headers:\n      "x-opencode-session": "\$X-Claude-Code-Session-Id"\n      "x-api-key": "go-secret-1"\n    models:\n      - name: "minimax-m3"/);
    expect(raw.match(/"x-opencode-session": "\$X-Claude-Code-Session-Id"/g)).toHaveLength(2);
    expect(raw).not.toContain("claudex-terra-max");

    const settingsFile = await prepareLocalCLIProxyAPIClaudeSettings(data, runtime);
    const settings = JSON.parse(await readFile(settingsFile, "utf-8"));
    expect(settings.model).toBe("kimi-k3");
    expect(settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL).toBe("glm-5.3");
    expect(settings.env.ANTHROPIC_DEFAULT_HAIKU_MODEL).toBe("deepseek-v4-flash");
    expect(settings.env.CLAUDE_CODE_SUBAGENT_MODEL).toBe("");
    expect(settings.env.CLAUDE_CODE_SUBAGENT_MODEL_FORCE).toBe("");
    expect(JSON.stringify(settings)).not.toContain("go-secret-1");

    // Rotating the Go alias's key reaches the idle proxy on the next launch.
    await saveOpenCodeGoCredential(GO_PROFILE_ID, { type: "api", key: "go-secret-2" });
    await resolveCLIProxyClaudeEntry("go", options);
    // run.ts does this before every launch: the idle daemon's config is stale.
    expect(await stopStaleManagedCLIProxyAPI(data)).toBe(true);
    expect(await stopStaleManagedCLIProxyAPI(data)).toBe(false);
    await ensureManagedCLIProxyAPI(data);
    const rotated = await readFile(cliProxyAPIConfigFile(data.profileId), "utf-8");
    expect(rotated).toContain('api-key: "go-secret-2"');
    expect(rotated).not.toContain("go-secret-1");
  });

  test("an OpenCode subscription alias without a static key is refused", async () => {
    await saveOpenCodeConsoleProfile(GO_PROFILE_ID, {
      type: "go",
      console: {
        credentialId: "cred",
        accountId: "acc",
        email: "go@example.com",
        orgId: "org",
        orgName: "Org",
      },
    });
    await expect(resolveCLIProxyClaudeEntry("go", options)).rejects.toThrow("without a static API key");
    expect(await localProfiles()).toEqual([]);
  });

  test("agy needs the risk confirmation, then becomes an Antigravity alias with live model ids", async () => {
    await expect(
      resolveCLIProxyClaudeEntry("agy", { ...options, confirmRisk: async () => false }),
    ).rejects.toThrow("nothing was created");
    expect(await localProfiles()).toEqual([]);
    expect((await loadAliases()).aliases.some((a) => a.alias === "agy")).toBe(false);

    process.env.CLAUDEX_FAKE_MODELS =
      "claude-opus-4-6-thinking,claude-opus-5-5,claude-sonnet-5-5,gemini-3.8-flash-high,gemini-3.8-flash,gpt-oss-120b-medium";
    const entry = await resolveCLIProxyClaudeEntry("agy", options);
    const alias = (await loadAliases()).aliases.find((a) => a.alias === "agy");
    expect(alias?.target).toEqual(entry.target);
    const data = (await getProfileData(
      (entry.target as { profileName: string }).profileName,
    )) as LocalCLIProxyAPIProfileData;
    expect(data.upstream).toBe("antigravity");
    const env = await readFile(cliProxyAPIEnvFile(data.profileId), "utf-8");
    expect(env).toContain("CLAUDEX_CLIPROXYAPI_OPUS_MODEL=claude-opus-5-5");
    expect(env).toContain("CLAUDEX_CLIPROXYAPI_HAIKU_MODEL=gemini-3.8-flash\n");

    // The same command keeps working once the alias exists.
    expect((await resolveCLIProxyClaudeEntry("agy", options)).target).toEqual(entry.target);
  });

  test("a regular Claude alias is told to run without --cliproxy", async () => {
    const reg = await loadAliases();
    reg.aliases.push({ alias: "holden", target: { provider: "claude", profileName: "holden" }, createdAt: 1 });
    await saveAliases(reg);
    const err = await resolveCLIProxyClaudeEntry("holden", options).catch((e) => e);
    expect(err).toBeInstanceOf(UserFacingError);
    expect(err.message).toContain("already a Claude account");
  });

  test("-run --cliproxy launches Claude Code without switching Codex and saves the model on the link", async () => {
    await resolveCLIProxyClaudeEntry("cx", options);
    const calls: Array<{ command: string; args: string[] }> = [];
    const code = await runAliasSession(
      "cx",
      ["--cliproxy", "claudecode", "--model", "terra"],
      fakeClaudeSpawn(calls) as never,
    );
    expect(code).toBe(0);
    expect(calls[0]?.command).toBe("claude");
    expect(calls[0]?.args).toContain("--settings");
    expect(calls[0]?.args.join(" ")).toContain("--model terra");
    const registry = await loadRegistry();
    expect(registry.active_account_key).toBeNull();
    expect(registry.accounts[0]?.default_model).toBe("gpt-5.4");
    const linked = await getLinkedClaudeProfile({ provider: "codex", accountKey: CODEX_ACCOUNT_KEY });
    expect(((await getProfileData(linked!)) as LocalCLIProxyAPIProfileData).defaultModel).toBe("terra");
  });

  test("purging the upstream alias removes its Claude Code link, but not while a session runs", async () => {
    const entry = await resolveCLIProxyClaudeEntry("cx", options);
    const data = (await getProfileData(
      (entry.target as { profileName: string }).profileName,
    )) as LocalCLIProxyAPIProfileData;
    await ensureManagedCLIProxyAPI(data);
    const lease = await acquireManagedCLIProxyAPILease(data);
    await expect(purgeAccount("cx")).rejects.toThrow("still using this CLIProxyAPI account");
    expect((await loadRegistry()).accounts).toHaveLength(1);
    await lease.release();

    await purgeAccount("cx");
    expect(await getLinkedClaudeProfile({ provider: "codex", accountKey: CODEX_ACCOUNT_KEY })).toBeNull();
    await expect(stat(cliProxyAPIProfileDir(data.profileId))).rejects.toThrow();
    expect((await loadRegistry()).accounts).toHaveLength(0);
  });

  test("list tags upstream rows with their Claude Code proxy state", async () => {
    await resolveCLIProxyClaudeEntry("go", options);
    const lines: string[] = [];
    const spy = spyOn(console, "log").mockImplementation((...args: unknown[]) => {
      lines.push(args.join(" "));
    });
    try {
      await list({ noUsage: true });
    } finally {
      spy.mockRestore();
    }
    const goLine = lines.find((line) => line.includes(" go "));
    expect(goLine).toContain("claudecode: stopped");
    // The internal profile has no alias and gets no row of its own.
    expect(lines.some((line) => line.includes("cliproxy-"))).toBe(false);
  });
});

describe("upstream model picking", () => {
  test("Antigravity prefers the newest plain Claude ids and a Gemini Flash for haiku", () => {
    expect(
      pickAntigravityModels([
        "claude-opus-4-6-thinking",
        "claude-opus-5-5",
        "claude-sonnet-4-6",
        "claude-sonnet-5-5",
        "gemini-3.1-flash-image",
        "gemini-3.8-flash-high",
        "gemini-3.8-flash",
      ]),
    ).toEqual({
      fableModel: "claude-opus-5-5",
      opusModel: "claude-opus-5-5",
      sonnetModel: "claude-sonnet-5-5",
      haikuModel: "gemini-3.8-flash",
    });
    expect(pickAntigravityModels(["gemini-3.8-flash"])).toBeNull();
  });

  test("OpenCode Go keeps listed defaults and falls back within a family", () => {
    expect(pickOpenCodeGoModels(new Set(["kimi-k4", "glm-5.3", "deepseek-v4-flash"]))).toEqual({
      fableModel: "kimi-k4",
      opusModel: "kimi-k4",
      sonnetModel: "glm-5.3",
      haikuModel: "deepseek-v4-flash",
    });
    expect(pickOpenCodeGoModels(null).sonnetModel).toBe("glm-5.3");
  });
});
