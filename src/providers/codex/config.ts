import { chmod, mkdir, readFile, writeFile } from "fs/promises";
import { dirname } from "path";
import { CODEX_CONFIG_FILE } from "../../lib/paths";
import { fileExists } from "../../lib/fs";
import type { CodexApiProviderConfig } from "../../types";

type TomlValue = string | number | boolean | null | undefined | TomlObject;
type TomlObject = { [key: string]: TomlValue };

interface CodexTomlConfig extends TomlObject {
  model_provider?: string | null;
  model?: string | null;
  model_providers?: TomlObject;
}

function cloneConfig(value: unknown): CodexTomlConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return JSON.parse(JSON.stringify(value)) as CodexTomlConfig;
}

async function readCodexConfig(): Promise<CodexTomlConfig> {
  if (!(await fileExists(CODEX_CONFIG_FILE))) return {};
  try {
    const content = await readFile(CODEX_CONFIG_FILE, "utf-8");
    return cloneConfig(Bun.TOML.parse(content));
  } catch {
    return {};
  }
}

function isSimpleTable(value: unknown): value is TomlObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function formatScalar(value: string | number | boolean): string {
  if (typeof value === "string") return JSON.stringify(value);
  return String(value);
}

function writeScalarLines(
  lines: string[],
  table: TomlObject,
  skipKeys: Set<string>,
): void {
  for (const [key, value] of Object.entries(table)) {
    if (skipKeys.has(key)) continue;
    if (value === null || value === undefined || isSimpleTable(value)) continue;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      lines.push(`${key} = ${formatScalar(value)}`);
    }
  }
}

function renderCodexConfig(config: CodexTomlConfig): string {
  const lines: string[] = [];

  if (config.model_provider) {
    lines.push(`model_provider = ${formatScalar(config.model_provider)}`);
  }
  if (config.model) {
    lines.push(`model = ${formatScalar(config.model)}`);
  }

  writeScalarLines(lines, config, new Set(["model_provider", "model", "model_providers"]));

  const providers = isSimpleTable(config.model_providers)
    ? config.model_providers
    : {};

  for (const [name, rawProvider] of Object.entries(providers)) {
    if (!isSimpleTable(rawProvider)) continue;
    if (lines.length > 0 && lines[lines.length - 1] !== "") lines.push("");
    lines.push(`[model_providers.${name}]`);
    writeScalarLines(lines, rawProvider, new Set());
  }

  return `${lines.join("\n")}\n`;
}

export async function activateCodexOfficialProvider(): Promise<void> {
  if (!(await fileExists(CODEX_CONFIG_FILE))) return;
  const config = await readCodexConfig();
  if (!config.model_provider) return;
  delete config.model_provider;
  await writeCodexConfig(config);
}

export async function activateCodexCustomProvider(
  provider: CodexApiProviderConfig,
  apiKey?: string,
): Promise<void> {
  if (
    provider.type !== "custom" ||
    !provider.name ||
    !provider.base_url ||
    !provider.env_key
  ) {
    throw new Error("Invalid Codex custom provider config");
  }

  const config = await readCodexConfig();
  const providers = isSimpleTable(config.model_providers)
    ? config.model_providers
    : {};
  config.model_providers = providers;
  config.model_provider = provider.name;
  if (provider.model) {
    config.model = provider.model;
  }
  const providerConfig: TomlObject = {
    name: provider.name,
    base_url: provider.base_url,
    requires_openai_auth: false,
  };
  if (apiKey) {
    providerConfig.experimental_bearer_token = apiKey;
  } else {
    providerConfig.env_key = provider.env_key;
  }
  providers[provider.name] = providerConfig;

  await writeCodexConfig(config);
}

export async function applyCodexApiProvider(
  provider: CodexApiProviderConfig | null | undefined,
  apiKey?: string,
): Promise<void> {
  if (!provider || provider.type === "official") {
    await activateCodexOfficialProvider();
    return;
  }
  await activateCodexCustomProvider(provider, apiKey);
}

async function writeCodexConfig(config: CodexTomlConfig): Promise<void> {
  const content = renderCodexConfig(config);
  try {
    if ((await readFile(CODEX_CONFIG_FILE, "utf-8")) === content) {
      await chmod(CODEX_CONFIG_FILE, 0o600);
      return;
    }
  } catch {
    // Missing or unreadable config should be rewritten below.
  }
  await mkdir(dirname(CODEX_CONFIG_FILE), { recursive: true });
  await writeFile(CODEX_CONFIG_FILE, content, { mode: 0o600 });
  await chmod(CODEX_CONFIG_FILE, 0o600);
}
