import { mkdir } from "fs/promises";
import { dirname } from "path";
import { SETTINGS_FILE } from "../../lib/paths";
import { readJson, writeJson } from "../../lib/fs";
import type { ClaudeApiProfileConfig } from "../../types";

type Settings = Record<string, unknown>;
type SettingsEnv = Record<string, string>;

export const CLAUDE_ENV_KEYS = [
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_BASE_URL",
  "ANTHROPIC_AUTH_TOKEN",
  "ANTHROPIC_MODEL",
  "ANTHROPIC_DEFAULT_SONNET_MODEL",
  "ANTHROPIC_DEFAULT_OPUS_MODEL",
  "ANTHROPIC_DEFAULT_HAIKU_MODEL",
] as const;

export type ClaudeEnvKey = (typeof CLAUDE_ENV_KEYS)[number];

async function read(): Promise<Settings> {
  return readJson<Settings>(SETTINGS_FILE, {});
}

async function write(settings: Settings): Promise<void> {
  await mkdir(dirname(SETTINGS_FILE), { recursive: true });
  await writeJson(SETTINGS_FILE, settings);
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

export async function applyApiConfig(
  config: ClaudeApiProfileConfig,
): Promise<void> {
  const settings = await read();
  const env = normalizeEnv(settings);

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

  if (config.model) {
    settings.model = config.model;
  } else {
    delete settings.model;
  }

  await write(settings);
}

export async function clearApiConfig(): Promise<void> {
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

  delete settings.model;
  await write(settings);
}

export async function getApiConfig(): Promise<ClaudeApiProfileConfig | null> {
  const settings = await read();
  const env = normalizeEnv(settings);
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const topLevelModel =
    typeof settings.model === "string" ? settings.model : undefined;
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
