import { chmod, mkdir, readFile, writeFile } from "fs/promises";
import { dirname } from "path";
import { CODEX_CONFIG_FILE } from "../../lib/paths";
import { fileExists } from "../../lib/fs";
import { parseToml } from "../../lib/toml";
import type { CodexApiProviderConfig } from "../../types";

export const DEFAULT_CODEX_MODEL = "gpt-5.4";

function normalizeCodexModel(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function resolveCodexModel(
  defaultModel?: string | null,
  providerModel?: string | null,
): string {
  return (
    normalizeCodexModel(defaultModel) ??
    normalizeCodexModel(providerModel) ??
    DEFAULT_CODEX_MODEL
  );
}

type TomlValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | TomlValue[]
  | TomlObject;
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
    return cloneConfig(parseToml(content));
  } catch {
    return {};
  }
}

function isSimpleTable(value: unknown): value is TomlObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function formatScalar(value: string | number | boolean | TomlValue[]): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    const items = value
      .filter((item) => item !== null && item !== undefined)
      .map((item) =>
        formatScalar(item as string | number | boolean | TomlValue[]),
      );
    return `[${items.join(", ")}]`;
  }
  return String(value);
}

function isInlineValue(
  value: TomlValue,
): value is string | number | boolean | TomlValue[] {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    Array.isArray(value)
  );
}

const BARE_KEY_RE = /^[A-Za-z0-9_-]+$/;

function formatKey(key: string): string {
  if (BARE_KEY_RE.test(key)) return key;
  return JSON.stringify(key);
}

function renderTable(
  lines: string[],
  table: TomlObject,
  prefix: string,
): void {
  const scalars: [string, string | number | boolean | TomlValue[]][] = [];
  const subtables: [string, TomlObject][] = [];

  for (const [key, value] of Object.entries(table)) {
    if (value === null || value === undefined) continue;
    if (isSimpleTable(value)) {
      subtables.push([key, value]);
    } else if (isInlineValue(value)) {
      scalars.push([key, value]);
    }
  }

  for (const [key, value] of scalars) {
    lines.push(`${formatKey(key)} = ${formatScalar(value)}`);
  }

  for (const [key, subtable] of subtables) {
    const quotedKey = formatKey(key);
    const fullKey = prefix ? `${prefix}.${quotedKey}` : quotedKey;
    if (lines.length > 0 && lines[lines.length - 1] !== "") lines.push("");
    lines.push(`[${fullKey}]`);
    renderTable(lines, subtable, fullKey);
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

  // Top-level scalars (excluding model_provider/model which are already rendered)
  const skipKeys = new Set(["model_provider", "model"]);
  for (const [key, value] of Object.entries(config)) {
    if (skipKeys.has(key)) continue;
    if (value === null || value === undefined || isSimpleTable(value)) continue;
    if (isInlineValue(value)) {
      lines.push(`${key} = ${formatScalar(value)}`);
    }
  }

  // All table sections
  for (const [key, value] of Object.entries(config)) {
    if (skipKeys.has(key)) continue;
    if (!isSimpleTable(value)) continue;
    if (lines.length > 0 && lines[lines.length - 1] !== "") lines.push("");
    lines.push(`[${key}]`);
    renderTable(lines, value, key);
  }

  return `${lines.join("\n")}\n`;
}

export async function activateCodexOfficialProvider(
  defaultModel?: string | null,
): Promise<void> {
  const config = (await fileExists(CODEX_CONFIG_FILE))
    ? await readCodexConfig()
    : {};
  delete config.model_provider;
  config.model = resolveCodexModel(defaultModel);

  // Remove provider entries that have an embedded bearer token
  if (isSimpleTable(config.model_providers)) {
    for (const [name, rawProvider] of Object.entries(config.model_providers)) {
      if (isSimpleTable(rawProvider) && rawProvider.experimental_bearer_token) {
        delete config.model_providers[name];
      }
    }
    if (Object.keys(config.model_providers).length === 0) {
      delete config.model_providers;
    }
  }

  await writeCodexConfig(config);
}

export async function activateCodexCustomProvider(
  provider: CodexApiProviderConfig,
  apiKey?: string,
  defaultModel?: string | null,
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
  config.model = resolveCodexModel(defaultModel, provider.model);
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
  defaultModel?: string | null,
): Promise<void> {
  if (!provider || provider.type === "official") {
    await activateCodexOfficialProvider(defaultModel);
    return;
  }
  await activateCodexCustomProvider(provider, apiKey, defaultModel);
}

// Leaf key names of Codex config options whose value is an inline array of
// scalars. An older buggy serializer (a parseToml that treated every array as a
// string) rewrote all of these as strings on account switch, e.g. `args = "[]"`
// or `notify = "[\"...\", \"...\"]"`, making codex fail to start ("expected a
// sequence"). We repair only these known array-typed keys: matching every key
// would corrupt string-valued settings whose contents happen to be JSON array
// text (e.g. `developer_instructions = "[\"run tests\"]"`) into arrays codex
// then rejects — and after corruption the two cases are indistinguishable
// without the schema. Sourced from the Codex config reference
// (https://learn.chatgpt.com/docs/config-file/config-reference); extend this
// set if a new inline-array option is added. Array-of-tables (`[[...]]`) and map
// options like `env`/`env_http_headers` are unaffected — they never round-trip
// through the buggy inline-scalar serializer — so they are intentionally absent.
const CODEX_ARRAY_KEYS = new Set([
  "args",
  "notify",
  "writable_roots", // sandbox_workspace_write
  "exclude", // shell_environment_policy
  "include_only", // shell_environment_policy
  "enabled_tools", // mcp_servers.<id>
  "disabled_tools", // mcp_servers.<id>
  "env_vars", // mcp_servers.<id>
  "scopes", // mcp_servers.<id>
  "direct_only_tool_namespaces", // features.code_mode
  "excluded_tool_namespaces", // features.code_mode
  "project_root_markers",
  "project_doc_fallback_filenames",
  "nickname_candidates", // agents.<name>
  "workspace_roots", // permissions.<name>
  "status_line", // tui
  "terminal_title", // tui
  "notifications", // tui (boolean | array<string>)
  "always_allowed_app_ids", // computer_use.windows
]);

// Rewrites a stringified value of a known array-typed key back to a real array.
// Returns true if the file changed.
//
// The key allowlist establishes intent (this key IS array-typed), so detection
// can use the project's TOML parser rather than a strict JSON.parse: the old
// writer stored the value's original TOML array text, which may not be valid
// JSON (e.g. a trailing comma `["mcp",]`). We parse the inner text as TOML and,
// if it is an array, re-render it with formatScalar so the output is always
// well-formed TOML regardless of the corrupted text's quirks. Non-array values
// (e.g. `args = "hi"`) leave `trimmed` non-array and are skipped.
export async function repairCodexStringifiedArrays(): Promise<boolean> {
  if (!(await fileExists(CODEX_CONFIG_FILE))) return false;
  const content = await readFile(CODEX_CONFIG_FILE, "utf-8");
  const lines = content.split(/\r?\n/);
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(
      /^(\s*)([A-Za-z0-9_-]+|"(?:[^"\\]|\\.)*")(\s*=\s*)("(?:[^"\\]|\\.)*")\s*$/,
    );
    if (!match) continue;
    const [, indent, rawKey, eq, rawValue] = match;
    let key: unknown = rawKey;
    if (rawKey.startsWith('"')) {
      try {
        key = JSON.parse(rawKey);
      } catch {
        continue;
      }
    }
    if (typeof key !== "string" || !CODEX_ARRAY_KEYS.has(key)) continue;
    let decoded: unknown;
    try {
      decoded = JSON.parse(rawValue);
    } catch {
      continue;
    }
    if (typeof decoded !== "string") continue;
    const trimmed = decoded.trim();
    if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) continue;
    const parsed = parseToml(`probe = ${trimmed}`).probe;
    if (!Array.isArray(parsed)) continue;
    lines[i] = `${indent}${rawKey}${eq}${formatScalar(parsed)}`;
    changed = true;
  }

  if (changed) {
    await writeFile(CODEX_CONFIG_FILE, lines.join("\n"), { mode: 0o600 });
  }
  return changed;
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
