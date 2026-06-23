import chalk from "chalk";
import { spawn, type ChildProcess } from "child_process";
import { findAlias, loadAliases } from "../alias/store";
import { use } from "./use";
import { blank, error, hint, info } from "../lib/ui";
import { resolveModelShorthand } from "../lib/model-shorthand";
import { getProfileData } from "../providers/claude/profiles";
import { CLAUDE_ENV_KEYS } from "../providers/claude/settings";
import { readAccountAuth } from "../providers/codex/auth";
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
  const profile =
    entry.target.provider === "claude"
      ? await getProfileData(entry.target.profileName)
      : null;
  const isolatedClaudeApi = profile?.type === "api-key";

  if (!isolatedClaudeApi) {
    await use(aliasOrName);
  }

  const command = entry.target.provider === "claude" ? "claude" : "codex";
  const defaultPermissionArgs =
    entry.target.provider === "claude"
      ? ["--permission-mode", "auto"]
      : ["--dangerously-bypass-approvals-and-sandbox"];
  const resolvedModel = runOptions.modelOverride
    ? resolveModelShorthand(entry.target.provider, runOptions.modelOverride)
    : undefined;
  const args = [
    ...(isolatedClaudeApi ? ["--bare"] : []),
    ...defaultPermissionArgs,
    ...(resolvedModel ? ["--model", resolvedModel] : []),
    ...runOptions.forwardedArgs,
  ];
  const env = await getRunEnvironment(entry, profile, runOptions.headerEnabled);

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
      finish(code ?? 1);
    });
  });
}

async function getRunEnvironment(
  entry: AliasEntry,
  profile: ProfileData | null,
  headerEnabled?: boolean,
): Promise<NodeJS.ProcessEnv | undefined> {
  if (entry.target.provider === "claude") {
    if (profile?.type === "api-key") {
      return applyClaudeAttributionHeader(
        buildClaudeApiEnvironment(profile),
        headerEnabled,
      );
    }
    return applyClaudeAttributionHeader(
      stripClaudeApiEnvironment(),
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
  let headerEnabled: boolean | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (MODEL_FLAGS.has(arg)) {
      const nextValue = args[index + 1]?.trim();
      if (!nextValue) {
        error(`Missing model name after ${arg}.`);
        hint(
          `Example: ${chalk.cyan("claudex-switch <alias> -run --model 4.8")}`,
        );
        blank();
        process.exit(1);
      }

      modelOverride = nextValue;
      index += 1;
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

  return { forwardedArgs, modelOverride, headerEnabled };
}

function stripClaudeApiEnvironment(): NodeJS.ProcessEnv | undefined {
  if (!CLAUDE_ENV_KEYS.some((key) => process.env[key])) {
    return undefined;
  }

  const env = { ...process.env };
  for (const key of CLAUDE_ENV_KEYS) {
    delete env[key];
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
