import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
} from "bun:test";
import type { ChildProcess } from "child_process";
import { EventEmitter } from "events";
import { createServer } from "net";
import { randomUUID } from "crypto";
import { dirname, join } from "path";
import { lstat, mkdir, readFile, realpath, stat, writeFile } from "fs/promises";
import { loadAliases, saveAliases } from "../src/alias/store";
import { buildSnapshot, deleteAccount } from "../src/webconfig/snapshot";
import { doctor } from "../src/commands/doctor";
import { model as updateModel } from "../src/commands/model";
import { runAliasSession } from "../src/commands/run";
import {
  CLAUDE_DIR,
  CLAUDE_JSON,
  claudeProfileConfigJson,
  claudeProfileDataFile,
  claudeProfileSecureStorageDir,
  cliProxyAPIConfigFile,
  cliProxyAPIEnvFile,
  cliProxyAPIProfileDir,
} from "../src/lib/paths";
import {
  prepareIsolatedLocalCLIProxyAPIRun,
  getProfileData,
} from "../src/providers/claude/profiles";
import {
  acquireManagedCLIProxyAPILease,
  CLI_PROXY_API_DEFAULTS,
  ensureManagedCLIProxyAPI,
  hasManagedCLIProxyAPILogin,
  initializeManagedCLIProxyAPI,
  inspectManagedCLIProxyAPI,
  prepareLocalCLIProxyAPIClaudeSettings,
  purgeManagedCLIProxyAPI,
  resolveLocalCLIProxyAPIModel,
  resolveManagedLocalCLIProxyAPIModel,
  runManagedCLIProxyAPICodexLogin,
  stopManagedCLIProxyAPI,
  verifyManagedCLIProxyAPILive,
} from "../src/providers/cliproxyapi/managed";
import type {
  LocalCLIProxyAPIProfileData,
} from "../src/types";
import { fileMode, resetTestHome } from "./helpers";

const FIXTURE_BINARY = join(import.meta.dir, "fixtures", "fake-cliproxyapi");
const managedProfiles: Array<{ profileId: string; binaryPath: string }> = [];

function makeProfile(): LocalCLIProxyAPIProfileData {
  const profile = {
    type: "local-cliproxyapi" as const,
    profileId: randomUUID(),
    binaryPath: FIXTURE_BINARY,
    defaultModel: CLI_PROXY_API_DEFAULTS.fableModel,
  };
  managedProfiles.push({
    profileId: profile.profileId,
    binaryPath: profile.binaryPath,
  });
  return profile;
}

async function saveLocalProfile(
  name: string,
  profile: LocalCLIProxyAPIProfileData,
): Promise<void> {
  const dataFile = claudeProfileDataFile(name);
  await mkdir(dirname(dataFile), { recursive: true });
  await writeFile(dataFile, JSON.stringify(profile));
}

function createClaudeSpawn(calls: Array<{ args: string[]; env?: NodeJS.ProcessEnv }>) {
  return (_command: string, args: string[], options: { env?: NodeJS.ProcessEnv }) => {
    calls.push({ args, env: options.env });
    const proc = new EventEmitter();
    queueMicrotask(() => proc.emit("close", 0));
    return proc as ChildProcess;
  };
}

async function listenOnCallbackPort(): Promise<ReturnType<typeof createServer> | null> {
  const server = createServer();
  const didListen = await new Promise<boolean>((resolve) => {
    server.once("error", () => resolve(false));
    server.listen(1455, "127.0.0.1", () => resolve(true));
  });
  if (!didListen) {
    server.close();
    return null;
  }
  return server;
}

describe("managed local CLIProxyAPI", () => {
  beforeEach(async () => {
    await resetTestHome();
    delete process.env.CLAUDEX_FAKE_AUTH_SUB;
  });

  afterEach(async () => {
    delete process.env.CLAUDEX_FAKE_AUTH_SUB;
    for (const profile of managedProfiles.splice(0)) {
      try {
        await stopManagedCLIProxyAPI(profile);
      } catch {
        // A failed startup or an already-purged test profile has no process to
        // stop. It remains confined to the disposable test home.
      }
    }
    await resetTestHome();
  });

  test("creates a private loopback runtime with fixed subagent override", async () => {
    const profile = makeProfile();
    await initializeManagedCLIProxyAPI(profile.profileId);
    const runtime = await ensureManagedCLIProxyAPI(profile);
    const reused = await ensureManagedCLIProxyAPI(profile);

    expect(reused).toEqual(runtime);
    expect(runtime.baseUrl).toStartWith("http://127.0.0.1:");
    expect(await verifyManagedCLIProxyAPILive(runtime)).toBe(true);

    const rawConfig = await readFile(
      cliProxyAPIConfigFile(profile.profileId),
      "utf-8",
    );
    expect(rawConfig).toContain('host: "127.0.0.1"');
    expect(rawConfig).toContain('alias: "claudex-terra-max"');
    expect(rawConfig).toContain('"reasoning.effort": "max"');
    expect(fileMode((await stat(cliProxyAPIProfileDir(profile.profileId))).mode)).toBe(0o700);
    expect(fileMode((await stat(cliProxyAPIConfigFile(profile.profileId))).mode)).toBe(0o600);

    const settingsPath = await prepareLocalCLIProxyAPIClaudeSettings(
      profile,
      runtime,
    );
    const settings = JSON.parse(await readFile(settingsPath, "utf-8")) as {
      model?: string;
      env?: Record<string, string>;
    };
    expect(settings.model).toBe(CLI_PROXY_API_DEFAULTS.fableModel);
    expect(settings.env?.CLAUDE_CODE_SUBAGENT_MODEL).toBe(
      "claudex-terra-max",
    );
    expect(settings.env?.CLAUDE_CODE_SUBAGENT_MODEL_FORCE).toBe("1");
    expect(settings.env?.CLAUDE_CODE_OAUTH_TOKEN).toBe("");
    expect(settings.env?.CLAUDE_CODE_USE_BEDROCK).toBe("");
    expect(fileMode((await stat(settingsPath)).mode)).toBe(0o600);
  });

  test("starts the upstream binary in its private cwd without remote-store selectors", async () => {
    const profile = makeProfile();
    await initializeManagedCLIProxyAPI(profile.profileId);
    const previous = {
      homeJwt: process.env.HOME_JWT,
      pgstore: process.env.PGSTORE_FIXTURE,
      deploy: process.env.DEPLOY,
      managementPassword: process.env.MANAGEMENT_PASSWORD,
    };
    process.env.HOME_JWT = "fixture-home-jwt";
    process.env.PGSTORE_FIXTURE = "fixture-store";
    process.env.DEPLOY = "fixture-deploy";
    process.env.MANAGEMENT_PASSWORD = "fixture-password";
    try {
      const runtime = await ensureManagedCLIProxyAPI(profile);
      const debug = await fetch(`${runtime.baseUrl}/fixture-debug`).then(
        (response) => response.json() as Promise<{
          cwd: string;
          hasHomeJwt: boolean;
          hasPgstore: boolean;
          hasDeploymentSelector: boolean;
        }>,
      );
      expect(debug.cwd).toBe(await realpath(cliProxyAPIProfileDir(profile.profileId)));
      expect(debug.hasHomeJwt).toBe(false);
      expect(debug.hasPgstore).toBe(false);
      expect(debug.hasDeploymentSelector).toBe(false);
    } finally {
      if (previous.homeJwt === undefined) delete process.env.HOME_JWT;
      else process.env.HOME_JWT = previous.homeJwt;
      if (previous.pgstore === undefined) delete process.env.PGSTORE_FIXTURE;
      else process.env.PGSTORE_FIXTURE = previous.pgstore;
      if (previous.deploy === undefined) delete process.env.DEPLOY;
      else process.env.DEPLOY = previous.deploy;
      if (previous.managementPassword === undefined) delete process.env.MANAGEMENT_PASSWORD;
      else process.env.MANAGEMENT_PASSWORD = previous.managementPassword;
    }
  });

  test("keeps one staged Codex auth and rejects a different refreshed identity", async () => {
    const profile = makeProfile();
    await initializeManagedCLIProxyAPI(profile.profileId);
    const initial = await runManagedCLIProxyAPICodexLogin(profile);
    expect(initial.success).toBe(true);
    expect(initial.identity).toBeTruthy();
    expect(await hasManagedCLIProxyAPILogin(profile.profileId)).toBe(true);

    process.env.CLAUDEX_FAKE_AUTH_SUB = "different-fixture-user";
    const mismatch = await runManagedCLIProxyAPICodexLogin(
      profile,
      undefined,
      initial.identity!,
    );
    expect(mismatch).toEqual({
      success: false,
      identity: expect.any(String),
      identityMismatch: true,
    });
    expect(await hasManagedCLIProxyAPILogin(profile.profileId)).toBe(true);
  });

  test("reports the real fixed OAuth callback-port collision before login", async () => {
    const profile = makeProfile();
    await initializeManagedCLIProxyAPI(profile.profileId);
    const server = await listenOnCallbackPort();
    try {
      await expect(runManagedCLIProxyAPICodexLogin(profile)).rejects.toThrow(
        "localhost:1455",
      );
    } finally {
      if (server) {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    }
  });

  test("refuses purge while a run lease is active, then removes only its profile", async () => {
    const profile = makeProfile();
    await initializeManagedCLIProxyAPI(profile.profileId);
    expect((await runManagedCLIProxyAPICodexLogin(profile)).success).toBe(true);
    await ensureManagedCLIProxyAPI(profile);
    const lease = await acquireManagedCLIProxyAPILease(profile);
    await expect(purgeManagedCLIProxyAPI(profile)).rejects.toThrow(
      "still using this CLIProxyAPI account",
    );
    await lease.release();
    await purgeManagedCLIProxyAPI(profile);
    await expect(stat(cliProxyAPIProfileDir(profile.profileId))).rejects.toThrow();
    await expect(acquireManagedCLIProxyAPILease(profile)).rejects.toThrow(
      "may have been purged",
    );
    await expect(ensureManagedCLIProxyAPI(profile)).rejects.toThrow(
      "may have been purged",
    );
    await expect(stat(cliProxyAPIProfileDir(profile.profileId))).rejects.toThrow();
  });

  test("a web-config delete is refused while a run lease is active", async () => {
    // The web UI's delete is the same purge the CLI runs, so it must honour the
    // same guard: an account with a live session cannot be torn out from under
    // it, and the alias has to survive so the account stays reachable.
    const profile = makeProfile();
    await initializeManagedCLIProxyAPI(profile.profileId);
    expect((await runManagedCLIProxyAPICodexLogin(profile)).success).toBe(true);
    await ensureManagedCLIProxyAPI(profile);
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "busy",
          target: { provider: "claude", profileName: "busy-profile" },
          createdAt: 1,
        },
      ],
    });
    await saveLocalProfile("busy-profile", profile);

    const lease = await acquireManagedCLIProxyAPILease(profile);
    await expect(deleteAccount("busy")).rejects.toThrow(
      "still using this CLIProxyAPI account",
    );

    // Nothing was removed: alias, profile and its private login all remain.
    expect((await buildSnapshot()).claude.map((a) => a.alias)).toEqual(["busy"]);
    expect(
      (await loadAliases()).aliases.map((item) => item.alias),
    ).toEqual(["busy"]);
    expect((await stat(cliProxyAPIProfileDir(profile.profileId))).isDirectory()).toBe(
      true,
    );

    // Once the session ends the delete goes through and takes everything.
    await lease.release();
    expect(await deleteAccount("busy")).toEqual(["busy"]);
    expect((await buildSnapshot()).claude).toEqual([]);
  });

  test("uses an isolated Claude context without losing shared customizations", async () => {
    const profile = makeProfile();
    const name = `cliproxy-${profile.profileId}`;
    await saveLocalProfile(name, profile);
    await mkdir(join(CLAUDE_DIR, "skills", "fixture-skill"), {
      recursive: true,
    });
    await writeFile(join(CLAUDE_DIR, "skills", "fixture-skill", "SKILL.md"), "fixture");
    await writeFile(
      CLAUDE_JSON,
      JSON.stringify({ oauthAccount: { emailAddress: "global@example.com" }, keep: true }),
    );

    const context = await prepareIsolatedLocalCLIProxyAPIRun(name);
    expect(context.secureStorageDir).toBe(claudeProfileSecureStorageDir(name));
    expect(fileMode((await stat(context.secureStorageDir)).mode)).toBe(0o700);
    expect(await lstat(join(context.configDir, "skills"))).toBeDefined();
    expect(
      JSON.parse(await readFile(claudeProfileConfigJson(name), "utf-8")),
    ).toEqual({ keep: true });
  });

  test("runs Claude without --bare, clears inherited provider auth, and keeps the key out of argv", async () => {
    const profile = makeProfile();
    const name = `cliproxy-${profile.profileId}`;
    await saveLocalProfile(name, profile);
    await initializeManagedCLIProxyAPI(profile.profileId);
    expect((await runManagedCLIProxyAPICodexLogin(profile)).success).toBe(true);
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "chatgpt",
          target: { provider: "claude", profileName: name },
          createdAt: 1,
        },
      ],
    });

    const priorOauth = process.env.CLAUDE_CODE_OAUTH_TOKEN;
    const priorBedrock = process.env.CLAUDE_CODE_USE_BEDROCK;
    process.env.CLAUDE_CODE_OAUTH_TOKEN = "shell-oauth";
    process.env.CLAUDE_CODE_USE_BEDROCK = "1";
    try {
      const calls: Array<{ args: string[]; env?: NodeJS.ProcessEnv }> = [];
      const exitCode = await runAliasSession(
        "chatgpt",
        ["--model", "fable", "--continue"],
        createClaudeSpawn(calls),
      );

      expect(exitCode).toBe(0);
      expect(calls).toHaveLength(1);
      expect(calls[0]?.args).not.toContain("--bare");
      expect(calls[0]?.args).toContain("gpt-6-astra");
      expect(calls[0]?.args).toContain("--settings");
      expect(calls[0]?.env?.CLAUDE_CODE_OAUTH_TOKEN).toBeUndefined();
      expect(calls[0]?.env?.CLAUDE_CODE_USE_BEDROCK).toBeUndefined();
      expect(calls[0]?.env?.CLAUDE_CONFIG_DIR).toBeDefined();
      expect(calls[0]?.env?.CLAUDE_SECURESTORAGE_CONFIG_DIR).toBeDefined();

      const settingsIndex = calls[0]?.args.indexOf("--settings") ?? -1;
      const settingsPath = calls[0]?.args[settingsIndex + 1];
      expect(settingsPath).toBeDefined();
      expect(calls[0]?.args.join(" ")).not.toContain("CLAUDEX_CLIPROXYAPI_CLIENT_API_KEY");
      const settings = JSON.parse(await readFile(settingsPath!, "utf-8")) as {
        env: Record<string, string>;
      };
      expect(settings.env.ANTHROPIC_API_KEY).toBeTruthy();
      expect(settings.env.CLAUDE_CODE_SUBAGENT_MODEL).toBe("claudex-terra-max");
    } finally {
      if (priorOauth === undefined) delete process.env.CLAUDE_CODE_OAUTH_TOKEN;
      else process.env.CLAUDE_CODE_OAUTH_TOKEN = priorOauth;
      if (priorBedrock === undefined) delete process.env.CLAUDE_CODE_USE_BEDROCK;
      else process.env.CLAUDE_CODE_USE_BEDROCK = priorBedrock;
    }
  });

  test("doctor keeps basic checks local and uses a live request only when requested", async () => {
    const profile = makeProfile();
    const name = `cliproxy-${profile.profileId}`;
    await saveLocalProfile(name, profile);
    await initializeManagedCLIProxyAPI(profile.profileId);
    const login = await runManagedCLIProxyAPICodexLogin(profile);
    expect(login.success).toBe(true);
    await ensureManagedCLIProxyAPI(profile);
    await stopManagedCLIProxyAPI(profile);
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "doctor-chatgpt",
          target: { provider: "claude", profileName: name },
          createdAt: 1,
        },
      ],
    });

    await doctor("doctor-chatgpt");
    expect((await inspectManagedCLIProxyAPI(profile)).running).toBe(false);
    await doctor("doctor-chatgpt", { live: true });
    expect((await inspectManagedCLIProxyAPI(profile)).running).toBe(true);
  });

  test("resolves local mapping without changing existing Claude shorthand", () => {
    expect(resolveLocalCLIProxyAPIModel("fable")).toBe("gpt-6-astra");
    expect(resolveLocalCLIProxyAPIModel("opus")).toBe("gpt-5.6-terra");
    expect(resolveLocalCLIProxyAPIModel("haiku")).toBe("gpt-5.6-luna");
    expect(resolveLocalCLIProxyAPIModel("custom-model")).toBe("custom-model");
  });

  test("uses the managed .env mapping for --model and the saved model command", async () => {
    const profile = makeProfile();
    const name = `cliproxy-${profile.profileId}`;
    await saveLocalProfile(name, profile);
    await initializeManagedCLIProxyAPI(profile.profileId);
    const envFile = cliProxyAPIEnvFile(profile.profileId);
    const env = await readFile(envFile, "utf-8");
    await writeFile(
      envFile,
      env.replace(
        "CLAUDEX_CLIPROXYAPI_OPUS_MODEL=gpt-5.6-terra",
        "CLAUDEX_CLIPROXYAPI_OPUS_MODEL=custom-terra",
      ),
    );
    await saveAliases({
      version: 1,
      aliases: [
        {
          alias: "custom-models",
          target: { provider: "claude", profileName: name },
          createdAt: 1,
        },
      ],
    });

    expect(await resolveManagedLocalCLIProxyAPIModel(profile, "opus")).toBe(
      "custom-terra",
    );
    await updateModel("custom-models", "opus");
    expect((await getProfileData(name)).defaultModel).toBe("custom-terra");
  });
});
