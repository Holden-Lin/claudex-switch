import { chmod, mkdir } from "fs/promises";
import { dirname } from "path";
import {
  SETTINGS_FILE,
  claudeProfileClaudeSettingsFile,
  claudeProfileDir,
} from "../../lib/paths";
import { readJson, writeJsonSecure } from "../../lib/fs";
import type { ClaudeApiProfileConfig } from "../../types";

type Settings = Record<string, unknown>;
type SettingsEnv = Record<string, string>;

export interface LocalCLIProxyAPISettings {
  apiKey: string;
  baseUrl: string;
  model: string;
  fableModel: string;
  sonnetModel: string;
  opusModel: string;
  haikuModel: string;
  subagentModel: string;
}

export const CLAUDE_ENV_KEYS = [
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_BASE_URL",
  "ANTHROPIC_AUTH_TOKEN",
  "ANTHROPIC_MODEL",
  "ANTHROPIC_DEFAULT_FABLE_MODEL",
  "ANTHROPIC_DEFAULT_SONNET_MODEL",
  "ANTHROPIC_DEFAULT_OPUS_MODEL",
  "ANTHROPIC_DEFAULT_HAIKU_MODEL",
  "CLAUDE_CODE_SUBAGENT_MODEL",
  "CLAUDE_CODE_SUBAGENT_MODEL_FORCE",
] as const;

// These settings choose a Claude authentication/provider path before the
// generated loopback API key can be used. They are neutralized only for the
// local CLIProxyAPI launch (both process env and its private --settings file),
// rather than changing the user's normal OAuth/API account behavior.
export const CLAUDE_LOCAL_PROXY_NEUTRALIZED_ENV_KEYS = [
  "CLAUDE_CODE_OAUTH_TOKEN",
  "CLAUDE_CODE_USE_BEDROCK",
  "CLAUDE_CODE_USE_VERTEX",
  "CLAUDE_CODE_USE_FOUNDRY",
] as const;

export type ClaudeEnvKey = (typeof CLAUDE_ENV_KEYS)[number];

async function read(): Promise<Settings> {
  return readJson<Settings>(SETTINGS_FILE, {});
}

async function write(settings: Settings): Promise<void> {
  await mkdir(dirname(SETTINGS_FILE), { recursive: true });
  await writeJsonSecure(SETTINGS_FILE, settings);
  try {
    // writeFile's mode only applies at creation. Local proxy activation writes
    // a generated client key here, so also repair legacy permissive files.
    await chmod(SETTINGS_FILE, 0o600);
  } catch {
    // Windows ACLs remain authoritative where POSIX chmod is unavailable.
  }
}

function normalizeEnv(
  settings: Settings,
): SettingsEnv {
  const env = settings.env;
  if (!env || typeof env !== "object" || Array.isArray(env)) {
    return {};
  }

  const result: SettingsEnv = {};
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === "string") {
      result[key] = value;
    }
  }
  return result;
}

function setEnvValue(
  env: SettingsEnv,
  key: ClaudeEnvKey,
  value: string | undefined,
): void {
  if (value) {
    env[key] = value;
    return;
  }

  delete env[key];
}

function normalizeModelValue(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function setTopLevelModel(
  settings: Settings,
  model: string | undefined,
): void {
  if (model) {
    settings.model = model;
    return;
  }

  delete settings.model;
}

export async function applyApiConfig(
  config: ClaudeApiProfileConfig,
): Promise<void> {
  const settings = await read();
  const env = normalizeEnv(settings);

  // A previous local CLIProxyAPI selection may have written Fable/subagent
  // mappings that ordinary API-key profiles do not own. Start from a clean
  // managed-key set so returning to this profile cannot retain proxy routing.
  for (const key of CLAUDE_ENV_KEYS) {
    delete env[key];
  }

  setEnvValue(env, "ANTHROPIC_API_KEY", config.apiKey);
  setEnvValue(env, "ANTHROPIC_BASE_URL", config.baseUrl);
  setEnvValue(env, "ANTHROPIC_AUTH_TOKEN", config.authToken);
  setEnvValue(env, "ANTHROPIC_MODEL", config.model);
  setEnvValue(
    env,
    "ANTHROPIC_DEFAULT_SONNET_MODEL",
    config.defaultSonnetModel,
  );
  setEnvValue(
    env,
    "ANTHROPIC_DEFAULT_OPUS_MODEL",
    config.defaultOpusModel,
  );
  setEnvValue(
    env,
    "ANTHROPIC_DEFAULT_HAIKU_MODEL",
    config.defaultHaikuModel,
  );

  if (Object.keys(env).length === 0) {
    delete settings.env;
  } else {
    settings.env = env;
  }

  setTopLevelModel(settings, config.model);

  await write(settings);
}

export async function applyOAuthConfig(
  model?: string,
): Promise<void> {
  const settings = await read();
  const env = normalizeEnv(settings);

  for (const key of CLAUDE_ENV_KEYS) {
    delete env[key];
  }

  if (Object.keys(env).length === 0) {
    delete settings.env;
  } else {
    settings.env = env;
  }

  setTopLevelModel(settings, model);
  await write(settings);
}

// The loopback proxy uses a generated client key, never a Claude OAuth
// snapshot. Apply every mapping for a normal `claude` launch after a global
// switch; applyOAuthConfig clears the same keys when returning to other types.
export async function applyLocalCLIProxyAPIConfig(
  config: LocalCLIProxyAPISettings,
): Promise<void> {
  const settings = await read();
  const env = normalizeEnv(settings);

  for (const key of CLAUDE_ENV_KEYS) {
    delete env[key];
  }

  setEnvValue(env, "ANTHROPIC_API_KEY", config.apiKey);
  setEnvValue(env, "ANTHROPIC_BASE_URL", config.baseUrl);
  setEnvValue(env, "ANTHROPIC_MODEL", config.model);
  setEnvValue(env, "ANTHROPIC_DEFAULT_FABLE_MODEL", config.fableModel);
  setEnvValue(env, "ANTHROPIC_DEFAULT_SONNET_MODEL", config.sonnetModel);
  setEnvValue(env, "ANTHROPIC_DEFAULT_OPUS_MODEL", config.opusModel);
  setEnvValue(env, "ANTHROPIC_DEFAULT_HAIKU_MODEL", config.haikuModel);
  setEnvValue(env, "CLAUDE_CODE_SUBAGENT_MODEL", config.subagentModel);
  setEnvValue(env, "CLAUDE_CODE_SUBAGENT_MODEL_FORCE", "1");

  settings.env = env;
  setTopLevelModel(settings, config.model);
  await write(settings);
}

// Claude Code applies `~/.claude/settings.json` env *over* the environment its
// process was spawned with, so an isolated API-key `-run` cannot rely on child
// env alone: whatever routing the globally active profile left in settings.json
// would silently win and send the session to the wrong provider. Write the
// profile's own routing into a private higher-precedence settings file instead,
// blanking every managed key this profile does not own. `--bare` does not skip
// settings files, and inline `--settings` JSON would expose the key in `ps`.
export async function prepareApiProfileClaudeSettings(
  name: string,
  config: ClaudeApiProfileConfig,
): Promise<string> {
  const env: Record<string, string> = {};
  for (const key of CLAUDE_ENV_KEYS) {
    env[key] = "";
  }
  for (const key of CLAUDE_LOCAL_PROXY_NEUTRALIZED_ENV_KEYS) {
    env[key] = "";
  }

  env.ANTHROPIC_API_KEY = config.apiKey;
  env.ANTHROPIC_BASE_URL = config.baseUrl ?? "";
  env.ANTHROPIC_AUTH_TOKEN = config.authToken ?? "";
  env.ANTHROPIC_MODEL = config.model ?? "";
  env.ANTHROPIC_DEFAULT_SONNET_MODEL = config.defaultSonnetModel ?? "";
  env.ANTHROPIC_DEFAULT_OPUS_MODEL = config.defaultOpusModel ?? "";
  env.ANTHROPIC_DEFAULT_HAIKU_MODEL = config.defaultHaikuModel ?? "";

  const settings: Settings = { env };
  // Only override the picker's model when the profile names one; otherwise the
  // user's own global choice stays in effect.
  if (config.model) {
    settings.model = config.model;
  }

  const file = claudeProfileClaudeSettingsFile(name);
  await mkdir(claudeProfileDir(name), { recursive: true });
  await writeJsonSecure(file, settings);
  try {
    await chmod(file, 0o600);
  } catch {
    // Windows ACLs remain authoritative where POSIX chmod is unavailable.
  }
  return file;
}

export async function clearApiConfig(): Promise<void> {
  await applyOAuthConfig();
}

export async function getConfiguredModel(): Promise<string | undefined> {
  const settings = await read();
  return normalizeModelValue(settings.model);
}

// Env vars in the global settings.json override a spawned session's process
// env, so an isolated OAuth `-run` must neutralize any Anthropic API config
// the active API-key profile wrote there. `--settings` env entries deep-merge
// over settings.json, and Claude Code treats empty strings as unset.
export async function getClaudeEnvNeutralizer(): Promise<string | null> {
  const settings = await read();
  const env = normalizeEnv(settings);
  const present = CLAUDE_ENV_KEYS.filter((key) => env[key]);
  if (present.length === 0) return null;

  const override: SettingsEnv = {};
  for (const key of present) {
    override[key] = "";
  }
  return JSON.stringify({ env: override });
}

export async function getApiConfig(): Promise<ClaudeApiProfileConfig | null> {
  const settings = await read();
  const env = normalizeEnv(settings);
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const topLevelModel = normalizeModelValue(settings.model);
  const envModel = env.ANTHROPIC_MODEL;
  const model = topLevelModel ?? envModel;

  return {
    apiKey,
    baseUrl: env.ANTHROPIC_BASE_URL,
    authToken: env.ANTHROPIC_AUTH_TOKEN,
    model,
    defaultSonnetModel: env.ANTHROPIC_DEFAULT_SONNET_MODEL,
    defaultOpusModel: env.ANTHROPIC_DEFAULT_OPUS_MODEL,
    defaultHaikuModel: env.ANTHROPIC_DEFAULT_HAIKU_MODEL,
  };
}
