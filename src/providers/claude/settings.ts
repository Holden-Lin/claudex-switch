import { chmod, mkdir } from "fs/promises";
import { dirname } from "path";
import {
  MANAGED_ENV_FILE,
  SETTINGS_FILE,
  claudeProfileClaudeSettingsFile,
  claudeProfileDir,
} from "../../lib/paths";
import { readJson, writeJson, writeJsonSecure } from "../../lib/fs";
import type {
  ClaudeApiProfileConfig,
  CustomEnv,
  OAuthProfileData,
} from "../../types";

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

const CUSTOM_ENV_KEY_PATTERN = /^[A-Z_][A-Z0-9_]*$/;

interface ManagedEnvRecord {
  keys: string[];
}

// Which extra keys the previously activated profile wrote. Only these are
// cleared on the next switch, so env entries the user added to settings.json
// by hand survive untouched.
async function readManagedExtraEnvKeys(): Promise<string[]> {
  const record = await readJson<ManagedEnvRecord>(MANAGED_ENV_FILE, {
    keys: [],
  });
  if (!Array.isArray(record.keys)) return [];
  return record.keys.filter((key): key is string => typeof key === "string");
}

async function writeManagedExtraEnvKeys(keys: string[]): Promise<void> {
  await mkdir(dirname(MANAGED_ENV_FILE), { recursive: true });
  await writeJson(MANAGED_ENV_FILE, { keys } satisfies ManagedEnvRecord);
}

export function isReservedClaudeEnvKey(key: string): boolean {
  return (
    (CLAUDE_ENV_KEYS as readonly string[]).includes(key) ||
    (CLAUDE_LOCAL_PROXY_NEUTRALIZED_ENV_KEYS as readonly string[]).includes(key)
  );
}

// A key is only usable as extra env when it looks like a shell variable and
// does not shadow a field the profile already owns through a dedicated slot.
export function isValidCustomEnvKey(key: string): boolean {
  return CUSTOM_ENV_KEY_PATTERN.test(key) && !isReservedClaudeEnvKey(key);
}

export function normalizeCustomEnv(env: CustomEnv | undefined): CustomEnv {
  const result: CustomEnv = {};
  for (const [rawKey, rawValue] of Object.entries(env ?? {})) {
    const key = rawKey.trim();
    if (!isValidCustomEnvKey(key)) continue;
    const value = typeof rawValue === "string" ? rawValue.trim() : "";
    if (!value) continue;
    result[key] = value;
  }
  return result;
}

// Every global apply path goes through this pair. `begin` strips the fixed
// managed keys plus whatever extra keys the previous profile owned; `commit`
// writes this profile's extra env and records the new key set for the next
// switch to clear.
async function beginManagedEnv(settings: Settings): Promise<SettingsEnv> {
  const env = normalizeEnv(settings);
  for (const key of CLAUDE_ENV_KEYS) {
    delete env[key];
  }
  for (const key of await readManagedExtraEnvKeys()) {
    delete env[key];
  }
  return env;
}

async function commitManagedEnv(
  settings: Settings,
  env: SettingsEnv,
  extraEnv: CustomEnv | undefined,
): Promise<void> {
  const extra = normalizeCustomEnv(extraEnv);
  for (const [key, value] of Object.entries(extra)) {
    env[key] = value;
  }

  if (Object.keys(env).length === 0) {
    delete settings.env;
  } else {
    settings.env = env;
  }

  await writeManagedExtraEnvKeys(Object.keys(extra));
  await write(settings);
}

export async function applyApiConfig(
  config: ClaudeApiProfileConfig,
): Promise<void> {
  const settings = await read();
  // A previous local CLIProxyAPI selection may have written Fable/subagent
  // mappings that ordinary API-key profiles do not own. Start from a clean
  // managed-key set so returning to this profile cannot retain proxy routing.
  const env = await beginManagedEnv(settings);

  setEnvValue(env, "ANTHROPIC_API_KEY", config.apiKey);
  setEnvValue(env, "ANTHROPIC_BASE_URL", config.baseUrl);
  setEnvValue(env, "ANTHROPIC_AUTH_TOKEN", config.authToken);
  setEnvValue(env, "ANTHROPIC_MODEL", config.model);
  setEnvValue(
    env,
    "ANTHROPIC_DEFAULT_FABLE_MODEL",
    config.defaultFableModel,
  );
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
  setEnvValue(env, "CLAUDE_CODE_SUBAGENT_MODEL", config.subagentModel);

  setTopLevelModel(settings, config.model);
  await commitManagedEnv(settings, env, config.env);
}

export async function applyOAuthConfig(
  model?: string,
  extraEnv?: CustomEnv,
): Promise<void> {
  const settings = await read();
  const env = await beginManagedEnv(settings);

  setTopLevelModel(settings, model);
  await commitManagedEnv(settings, env, extraEnv);
}

// The loopback proxy uses a generated client key, never a Claude OAuth
// snapshot. Apply every mapping for a normal `claude` launch after a global
// switch; applyOAuthConfig clears the same keys when returning to other types.
export async function applyLocalCLIProxyAPIConfig(
  config: LocalCLIProxyAPISettings,
  extraEnv?: CustomEnv,
): Promise<void> {
  const settings = await read();
  const env = await beginManagedEnv(settings);

  setEnvValue(env, "ANTHROPIC_API_KEY", config.apiKey);
  setEnvValue(env, "ANTHROPIC_BASE_URL", config.baseUrl);
  setEnvValue(env, "ANTHROPIC_MODEL", config.model);
  setEnvValue(env, "ANTHROPIC_DEFAULT_FABLE_MODEL", config.fableModel);
  setEnvValue(env, "ANTHROPIC_DEFAULT_SONNET_MODEL", config.sonnetModel);
  setEnvValue(env, "ANTHROPIC_DEFAULT_OPUS_MODEL", config.opusModel);
  setEnvValue(env, "ANTHROPIC_DEFAULT_HAIKU_MODEL", config.haikuModel);
  setEnvValue(env, "CLAUDE_CODE_SUBAGENT_MODEL", config.subagentModel);
  setEnvValue(env, "CLAUDE_CODE_SUBAGENT_MODEL_FORCE", "1");

  setTopLevelModel(settings, config.model);
  await commitManagedEnv(settings, env, extraEnv);
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
  env.ANTHROPIC_DEFAULT_FABLE_MODEL = config.defaultFableModel ?? "";
  env.ANTHROPIC_DEFAULT_SONNET_MODEL = config.defaultSonnetModel ?? "";
  env.ANTHROPIC_DEFAULT_OPUS_MODEL = config.defaultOpusModel ?? "";
  env.ANTHROPIC_DEFAULT_HAIKU_MODEL = config.defaultHaikuModel ?? "";
  env.CLAUDE_CODE_SUBAGENT_MODEL = config.subagentModel ?? "";

  for (const [key, value] of Object.entries(normalizeCustomEnv(config.env))) {
    env[key] = value;
  }

  const settings: Settings = { env };
  // Only override the picker's model when the profile names one; otherwise the
  // user's own global choice stays in effect.
  if (config.model) {
    settings.model = config.model;
  }

  return writePrivateRunSettings(name, settings);
}

// An OAuth profile that owns extra env cannot use the inline `--settings` JSON
// neutralizer: inline JSON is visible in `ps` and these values are
// user-supplied. Write the same kind of private 0600 file the API-key path
// uses instead. Profiles without extra env keep the cheaper inline neutralizer.
export async function prepareOAuthProfileClaudeSettings(
  name: string,
  profile: OAuthProfileData,
): Promise<string> {
  const env: Record<string, string> = {};
  for (const key of CLAUDE_ENV_KEYS) {
    env[key] = "";
  }
  for (const key of await readManagedExtraEnvKeys()) {
    env[key] = "";
  }
  for (const [key, value] of Object.entries(normalizeCustomEnv(profile.env))) {
    env[key] = value;
  }

  const settings: Settings = { env };
  if (profile.defaultModel) {
    settings.model = profile.defaultModel;
  }

  return writePrivateRunSettings(name, settings);
}

async function writePrivateRunSettings(
  name: string,
  settings: Settings,
): Promise<string> {
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
  const present: string[] = CLAUDE_ENV_KEYS.filter((key) => env[key]);
  // Extra keys the active profile wrote (e.g. CLAUDE_CODE_EFFORT_LEVEL) would
  // otherwise leak into an OAuth session the same way the fixed keys do.
  for (const key of await readManagedExtraEnvKeys()) {
    if (env[key] && !present.includes(key)) present.push(key);
  }
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

  const extraEnv: CustomEnv = {};
  for (const key of await readManagedExtraEnvKeys()) {
    if (env[key]) extraEnv[key] = env[key];
  }

  return {
    apiKey,
    baseUrl: env.ANTHROPIC_BASE_URL,
    authToken: env.ANTHROPIC_AUTH_TOKEN,
    model,
    defaultFableModel: env.ANTHROPIC_DEFAULT_FABLE_MODEL,
    defaultSonnetModel: env.ANTHROPIC_DEFAULT_SONNET_MODEL,
    defaultOpusModel: env.ANTHROPIC_DEFAULT_OPUS_MODEL,
    defaultHaikuModel: env.ANTHROPIC_DEFAULT_HAIKU_MODEL,
    subagentModel: env.CLAUDE_CODE_SUBAGENT_MODEL,
    ...(Object.keys(extraEnv).length > 0 ? { env: extraEnv } : {}),
  };
}
