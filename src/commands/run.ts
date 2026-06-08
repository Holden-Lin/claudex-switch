import chalk from "chalk";
import { spawn, type ChildProcess } from "child_process";
import { findAlias, loadAliases } from "../alias/store";
import { use } from "./use";
import { blank, error, hint, info } from "../lib/ui";
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
  const args = [
    ...(isolatedClaudeApi ? ["--bare"] : []),
    ...defaultPermissionArgs,
    ...(runOptions.modelOverride
      ? ["--model", runOptions.modelOverride]
      : []),
    ...runOptions.forwardedArgs,
  ];
  const env = await getRunEnvironment(entry, profile);

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
): Promise<NodeJS.ProcessEnv | undefined> {
  if (entry.target.provider === "claude") {
    if (profile?.type === "api-key") {
      return buildClaudeApiEnvironment(profile);
    }
    return stripClaudeApiEnvironment();
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

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg !== "-model") {
      forwardedArgs.push(arg);
      continue;
    }

    const nextValue = args[index + 1]?.trim();
    if (!nextValue) {
      error("Missing model name after -model.");
      hint(
        `Example: ${chalk.cyan("claudex-switch <alias> -run -model claude-sonnet-4-20250514")}`,
      );
      blank();
      process.exit(1);
    }

    modelOverride = nextValue;
    index += 1;
  }

  return { forwardedArgs, modelOverride };
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
