import chalk from "chalk";
import { spawn, type ChildProcess } from "child_process";
import { findAlias, loadAliases } from "../alias/store";
import { use } from "./use";
import { blank, error, hint, info } from "../lib/ui";
import {
  isModelEffort,
  resolveModelShorthand,
  splitModelEffort,
} from "../lib/model-shorthand";
import {
  getProfileData,
  prepareIsolatedOAuthRun,
  syncIsolatedOAuthSnapshot,
} from "../providers/claude/profiles";
import {
  CLAUDE_ENV_KEYS,
  getClaudeEnvNeutralizer,
} from "../providers/claude/settings";
import { readAccountAuth } from "../providers/codex/auth";
import { repairCodexStringifiedArrays } from "../providers/codex/config";
import { findAccountByKey, loadRegistry } from "../providers/codex/registry";
import type {
  AliasEntry,
  ClaudeApiProfileConfig,
  ProfileData,
} from "../types";

const RUN_FLAGS = new Set(["-run", "--run"]);
const HEADER_FLAGS = new Set(["--attribution-header"]);
const MODEL_FLAGS = new Set(["-model", "--model"]);
const CLAUDE_ATTRIBUTION_HEADER_ENV = "CLAUDE_CODE_ATTRIBUTION_HEADER";

type SpawnOptions = {
  stdio: "inherit";
  env?: NodeJS.ProcessEnv;
};

type SpawnCommand = (
  command: string,
  args: string[],
  options: SpawnOptions,
) => ChildProcess;

type RunArgumentOptions = {
  forwardedArgs: string[];
  modelOverride?: string;
  effortOverride?: string;
  headerEnabled?: boolean;
};

export function isRunFlag(value?: string): boolean {
  return value !== undefined && RUN_FLAGS.has(value);
}

export async function runAliasSession(
  aliasOrName: string,
  forwardedArgs: string[] = [],
  spawnCommand: SpawnCommand = spawn,
): Promise<number> {
  const runOptions = parseRunArgumentOptions(forwardedArgs);
  const entry = await resolveAliasOrExit(aliasOrName);
  const claudeProfileName =
    entry.target.provider === "claude" ? entry.target.profileName : null;
  const isClaude = claudeProfileName !== null;
  const profile = claudeProfileName
    ? await getProfileData(claudeProfileName)
    : null;
  const isolatedClaudeApi = profile?.type === "api-key";
  const isolatedClaudeOAuth = isClaude && profile?.type === "oauth";

  // Claude sessions run isolated from the global account state: API-key
  // profiles get their config via env vars, OAuth profiles get a per-profile
  // credential store. Neither touches (or is touched by) the active account,
  // so switching accounts can never flip a running session. Codex still
  // switches globally.
  if (!isClaude) {
    await use(aliasOrName);
    try {
      if (await repairCodexStringifiedArrays()) {
        info("Repaired stringified arrays in ~/.codex/config.toml");
      }
    } catch {
      // Best effort; codex will surface config errors itself.
    }
  }

  let secureStorageDir: string | undefined;
  let configDir: string | undefined;
  let settingsNeutralizer: string | null = null;
  if (isolatedClaudeOAuth && claudeProfileName) {
    try {
      const context = await prepareIsolatedOAuthRun(claudeProfileName);
      secureStorageDir = context.secureStorageDir;
      configDir = context.configDir;
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      hint(
        `Run ${chalk.cyan(`claudex-switch ${aliasOrName}`)} to switch globally, then log in with ${chalk.cyan("claude")}.`,
      );
      blank();
      process.exit(1);
    }
    settingsNeutralizer = await getClaudeEnvNeutralizer();
  }

  const command = isClaude ? "claude" : "codex";
  const defaultPermissionArgs = isClaude
    ? ["--permission-mode", "auto"]
    : ["--dangerously-bypass-approvals-and-sandbox"];
  const resolvedModel = runOptions.modelOverride
    ? resolveModelShorthand(entry.target.provider, runOptions.modelOverride)
    : isolatedClaudeOAuth && profile?.type === "oauth"
      ? profile.defaultModel
      : undefined;
  const effortArgs = runOptions.effortOverride
    ? isClaude
      ? ["--effort", runOptions.effortOverride]
      : ["-c", `model_reasoning_effort=${runOptions.effortOverride}`]
    : [];
  const args = [
    ...(isolatedClaudeApi ? ["--bare"] : []),
    ...defaultPermissionArgs,
    ...(resolvedModel ? ["--model", resolvedModel] : []),
    ...effortArgs,
    ...(settingsNeutralizer ? ["--settings", settingsNeutralizer] : []),
    ...runOptions.forwardedArgs,
  ];
  const env = await getRunEnvironment(
    entry,
    profile,
    runOptions.headerEnabled,
    secureStorageDir,
    configDir,
  );

  info(`Running ${chalk.cyan([command, ...args].join(" "))}`);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (code: number): void => {
      if (settled) return;
      settled = true;
      resolve(code);
    };

    const proc = spawnCommand(command, args, { stdio: "inherit", env });

    proc.on("error", (err) => {
      error(
        `Failed to start ${command}: ${err instanceof Error ? err.message : String(err)}`,
      );
      blank();
      finish(1);
    });

    proc.on("close", (code) => {
      void (async () => {
        if (isolatedClaudeOAuth && claudeProfileName) {
          // The session refreshed tokens in the per-profile store; fold them
          // back into the snapshot so global switches restore live tokens.
          try {
            await syncIsolatedOAuthSnapshot(claudeProfileName);
          } catch {
            // Best effort; the isolated store remains authoritative.
          }
        }
        finish(code ?? 1);
      })();
    });
  });
}

async function getRunEnvironment(
  entry: AliasEntry,
  profile: ProfileData | null,
  headerEnabled?: boolean,
  secureStorageDir?: string,
  configDir?: string,
): Promise<NodeJS.ProcessEnv | undefined> {
  if (entry.target.provider === "claude") {
    if (profile?.type === "api-key") {
      return applyClaudeAttributionHeader(
        buildClaudeApiEnvironment(profile),
        headerEnabled,
      );
    }
    return applyClaudeAttributionHeader(
      buildClaudeOAuthEnvironment(secureStorageDir, configDir),
      headerEnabled,
    );
  }

  const auth = await readAccountAuth(entry.target.accountKey);
  if (auth?.auth_mode !== "apikey" || !auth.OPENAI_API_KEY) {
    return undefined;
  }

  const reg = await loadRegistry();
  const account = findAccountByKey(reg, entry.target.accountKey);
  const envKey = account?.api_provider?.env_key || "OPENAI_API_KEY";

  return {
    ...process.env,
    [envKey]: auth.OPENAI_API_KEY,
  };
}

async function resolveAliasOrExit(aliasOrName: string): Promise<AliasEntry> {
  const aliasReg = await loadAliases();
  const entry = findAlias(aliasReg, aliasOrName);

  if (entry) {
    return entry;
  }

  error(`Alias "${aliasOrName}" not found.`);
  hint(`Run ${chalk.cyan("claudex-switch list")} to see your accounts`);
  blank();
  process.exit(1);
}

function parseRunArgumentOptions(args: string[]): RunArgumentOptions {
  const forwardedArgs: string[] = [];
  let modelOverride: string | undefined;
  let effortOverride: string | undefined;
  let headerEnabled: boolean | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (MODEL_FLAGS.has(arg)) {
      const nextValue = args[index + 1]?.trim();
      if (!nextValue) {
        error(`Missing model name after ${arg}.`);
        hint(
          `Example: ${chalk.cyan("claudex-switch <alias> -run --model 4.8 max")}`,
        );
        blank();
        process.exit(1);
      }

      // An effort tier may follow the model, either inside the same value
      // ("4.8 max") or as the next token (--model 4.8 max).
      const withEffort = splitModelEffort(nextValue);
      modelOverride = withEffort.model;
      effortOverride = withEffort.effort;
      index += 1;
      const follower = args[index + 1]?.trim();
      if (!effortOverride && isModelEffort(follower)) {
        effortOverride = follower.toLowerCase();
        index += 1;
      }
      continue;
    }

    if (HEADER_FLAGS.has(arg)) {
      const nextValue = args[index + 1]?.trim().toLowerCase();
      if (
        !nextValue ||
        !["true", "false", "1", "0"].includes(nextValue)
      ) {
        error("Missing header toggle after --attribution-header.");
        hint(
          `Example: ${chalk.cyan("claudex-switch <alias> -run --attribution-header false")}`,
        );
        blank();
        process.exit(1);
      }

      headerEnabled = nextValue === "true" || nextValue === "1";
      index += 1;
      continue;
    }

    forwardedArgs.push(arg);
  }

  return { forwardedArgs, modelOverride, effortOverride, headerEnabled };
}

function buildClaudeOAuthEnvironment(
  secureStorageDir?: string,
  configDir?: string,
): NodeJS.ProcessEnv | undefined {
  if (
    !secureStorageDir &&
    !configDir &&
    !CLAUDE_ENV_KEYS.some((key) => process.env[key])
  ) {
    return undefined;
  }

  const env = { ...process.env };
  for (const key of CLAUDE_ENV_KEYS) {
    delete env[key];
  }
  if (secureStorageDir) {
    env.CLAUDE_SECURESTORAGE_CONFIG_DIR = secureStorageDir;
  }
  if (configDir) {
    env.CLAUDE_CONFIG_DIR = configDir;
  }
  return env;
}

function buildClaudeApiEnvironment(
  config: ClaudeApiProfileConfig,
): NodeJS.ProcessEnv {
  const env = { ...process.env };

  setOptionalEnv(env, "ANTHROPIC_API_KEY", config.apiKey);
  setOptionalEnv(env, "ANTHROPIC_BASE_URL", config.baseUrl);
  setOptionalEnv(env, "ANTHROPIC_AUTH_TOKEN", config.authToken);
  setOptionalEnv(env, "ANTHROPIC_MODEL", config.model);
  setOptionalEnv(
    env,
    "ANTHROPIC_DEFAULT_SONNET_MODEL",
    config.defaultSonnetModel,
  );
  setOptionalEnv(
    env,
    "ANTHROPIC_DEFAULT_OPUS_MODEL",
    config.defaultOpusModel,
  );
  setOptionalEnv(
    env,
    "ANTHROPIC_DEFAULT_HAIKU_MODEL",
    config.defaultHaikuModel,
  );

  return env;
}

function applyClaudeAttributionHeader(
  baseEnv: NodeJS.ProcessEnv | undefined,
  headerEnabled: boolean | undefined,
): NodeJS.ProcessEnv | undefined {
  if (headerEnabled === undefined) {
    return baseEnv;
  }

  const env = baseEnv ? { ...baseEnv } : { ...process.env };

  if (headerEnabled) {
    delete env[CLAUDE_ATTRIBUTION_HEADER_ENV];
    return env;
  }

  env[CLAUDE_ATTRIBUTION_HEADER_ENV] = "0";
  return env;
}

function setOptionalEnv(
  env: NodeJS.ProcessEnv,
  key: string,
  value: string | undefined,
): void {
  if (value) {
    env[key] = value;
    return;
  }

  delete env[key];
}
