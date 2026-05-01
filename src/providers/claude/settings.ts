import { SETTINGS_FILE } from "../../lib/paths";
import { readJson, writeJson } from "../../lib/fs";

type Settings = Record<string, unknown>;

async function read(): Promise<Settings> {
  return readJson<Settings>(SETTINGS_FILE, {});
}

async function write(settings: Settings): Promise<void> {
  await writeJson(SETTINGS_FILE, settings);
}

export async function setApiKey(key: string): Promise<void> {
  const settings = await read();
  const env = (settings.env as Record<string, string>) ?? {};
  if (env.ANTHROPIC_API_KEY === key) return;
  env.ANTHROPIC_API_KEY = key;
  settings.env = env;
  await write(settings);
}

export async function clearApiKey(): Promise<void> {
  const settings = await read();
  const env = (settings.env as Record<string, string>) ?? {};
  if (!env.ANTHROPIC_API_KEY) return;
  delete env.ANTHROPIC_API_KEY;
  if (Object.keys(env).length === 0) {
    delete settings.env;
  } else {
    settings.env = env;
  }
  await write(settings);
}

export async function getApiKey(): Promise<string | null> {
  const settings = await read();
  const env = settings.env as Record<string, string> | undefined;
  return env?.ANTHROPIC_API_KEY ?? null;
}
