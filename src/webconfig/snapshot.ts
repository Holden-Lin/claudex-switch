import { loadAliases, findAlias } from "../alias/store";
import { readJson } from "../lib/fs";
import { claudeProfileAccountFile } from "../lib/paths";
import {
  getProfileData,
  readState,
  updateClaudeProfileConfig,
} from "../providers/claude/profiles";
import { isValidCustomEnvKey } from "../providers/claude/settings";
import { readAccountAuth, saveAccountAuth } from "../providers/codex/auth";
import { applyCodexApiProvider } from "../providers/codex/config";
import {
  findAccountByKey,
  loadRegistry,
  saveRegistry,
  updateAccountConfig,
} from "../providers/codex/registry";
import type {
  AliasEntry,
  CodexRegistry,
  CustomEnv,
  OAuthAccount,
  WebConfigAccount,
  WebConfigChange,
  WebConfigChangeResult,
  WebConfigSnapshot,
} from "../types";

export async function buildSnapshot(): Promise<WebConfigSnapshot> {
  const aliasReg = await loadAliases();
  const claudeState = await readState();

  let codexReg: CodexRegistry | null = null;
  try {
    codexReg = await loadRegistry();
  } catch {
    // No codex registry on this machine; the Codex section stays empty.
  }

  const claude: WebConfigAccount[] = [];
  const codex: WebConfigAccount[] = [];

  for (const entry of aliasReg.aliases) {
    if (entry.target.provider === "claude") {
      const account = await describeClaudeAccount(entry, claudeState.active);
      if (account) claude.push(account);
    } else if (codexReg) {
      const account = await describeCodexAccount(entry, codexReg);
      if (account) codex.push(account);
    }
  }

  return { version: 1, generatedAt: Date.now(), claude, codex };
}

async function describeClaudeAccount(
  entry: AliasEntry,
  activeProfile: string | null,
): Promise<WebConfigAccount | null> {
  if (entry.target.provider !== "claude") return null;
  const profileName = entry.target.profileName;

  let data;
  try {
    data = await getProfileData(profileName);
  } catch {
    return null;
  }

  const base = {
    provider: "claude" as const,
    alias: entry.alias,
    profileName,
    isActive: activeProfile === profileName,
    env: data.env ?? {},
    supportsEnv: true,
  };

  if (data.type === "api-key") {
    return {
      ...base,
      type: "api-key",
      label: "API Key",
      email: null,
      fields: {
        apiKey: data.apiKey ?? "",
        baseUrl: data.baseUrl ?? "",
        authToken: data.authToken ?? "",
        model: data.model ?? "",
        defaultFableModel: data.defaultFableModel ?? "",
        defaultOpusModel: data.defaultOpusModel ?? "",
        defaultSonnetModel: data.defaultSonnetModel ?? "",
        defaultHaikuModel: data.defaultHaikuModel ?? "",
        subagentModel: data.subagentModel ?? "",
      },
      secretFields: ["apiKey", "authToken"],
      readonly: [],
    };
  }

  if (data.type === "local-cliproxyapi") {
    return {
      ...base,
      type: "local-cliproxyapi",
      label: "本机 CLIProxyAPI",
      email: null,
      fields: {
        defaultModel: data.defaultModel ?? "",
        binaryPath: data.binaryPath ?? "",
      },
      secretFields: [],
      // The proxy owns its own base URL, generated key and model mapping, so
      // only the default model is meaningful to edit here.
      readonly: ["binaryPath"],
    };
  }

  const account = await readJson<OAuthAccount | null>(
    claudeProfileAccountFile(profileName),
    null,
  );

  return {
    ...base,
    type: "oauth",
    label: "OAuth 订阅",
    email: account?.emailAddress ?? null,
    fields: { defaultModel: data.defaultModel ?? "" },
    secretFields: [],
    readonly: [],
  };
}

async function describeCodexAccount(
  entry: AliasEntry,
  registry: CodexRegistry,
): Promise<WebConfigAccount | null> {
  if (entry.target.provider !== "codex") return null;
  const accountKey = entry.target.accountKey;
  const account = findAccountByKey(registry, accountKey);
  if (!account) return null;

  const base = {
    provider: "codex" as const,
    alias: entry.alias,
    accountKey,
    isActive: registry.active_account_key === accountKey,
    email: account.email || null,
    // Codex reads its configuration from config.toml, not from Claude Code
    // environment variables, so the custom env table does not apply.
    env: {} as CustomEnv,
    supportsEnv: false,
  };

  if (account.auth_mode !== "apikey") {
    return {
      ...base,
      type: "chatgpt",
      label: "ChatGPT 订阅",
      fields: { defaultModel: account.default_model ?? "" },
      secretFields: [],
      readonly: [],
    };
  }

  const auth = await readAccountAuth(accountKey);
  const apiKey =
    auth?.auth_mode === "apikey" ? (auth.OPENAI_API_KEY ?? "") : "";
  const provider = account.api_provider;
  const isCustom = provider?.type === "custom";

  return {
    ...base,
    type: "apikey",
    label: isCustom ? `API Key · ${provider?.name ?? ""}` : "API Key · 官方",
    fields: {
      defaultModel: account.default_model ?? "",
      apiKey,
      ...(isCustom
        ? {
            providerName: provider?.name ?? "",
            baseUrl: provider?.base_url ?? "",
            model: provider?.model ?? "",
            envKey: provider?.env_key ?? "OPENAI_API_KEY",
          }
        : {}),
    },
    secretFields: ["apiKey"],
    readonly: isCustom ? ["providerName"] : [],
  };
}

export async function applyChanges(
  changes: WebConfigChange[],
): Promise<WebConfigChangeResult[]> {
  const results: WebConfigChangeResult[] = [];

  // Sequential on purpose: two accounts saved at once would otherwise race on
  // the shared registry.json / settings.json writes.
  for (const change of changes) {
    try {
      results.push(await applyChange(change));
    } catch (err) {
      results.push({
        alias: change?.alias ?? "",
        ok: false,
        reapplied: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
}

async function applyChange(
  change: WebConfigChange,
): Promise<WebConfigChangeResult> {
  const aliasReg = await loadAliases();
  const entry = findAlias(aliasReg, change.alias);
  if (!entry) {
    throw new Error(`别名 "${change.alias}" 不存在`);
  }

  const fields = sanitizeFields(change.fields);
  const env = change.env === undefined ? undefined : validateEnv(change.env);

  if (entry.target.provider === "claude") {
    validateClaudeFields(fields);
    const { reapplied } = await updateClaudeProfileConfig(
      entry.target.profileName,
      { fields, env },
    );
    return { alias: entry.alias, ok: true, reapplied };
  }

  return applyCodexChange(entry.target.accountKey, entry.alias, fields);
}

async function applyCodexChange(
  accountKey: string,
  alias: string,
  fields: Record<string, string>,
): Promise<WebConfigChangeResult> {
  if (fields.baseUrl !== undefined) validateUrl(fields.baseUrl);

  const registry = await loadRegistry();
  const account = updateAccountConfig(registry, accountKey, {
    defaultModel: fields.defaultModel,
    baseUrl: fields.baseUrl,
    model: fields.model,
    envKey: fields.envKey,
  });

  if (fields.apiKey !== undefined && account.auth_mode === "apikey") {
    const key = fields.apiKey.trim();
    if (!key) throw new Error("API Key 不能为空");
    const auth = await readAccountAuth(accountKey);
    await saveAccountAuth(accountKey, {
      ...(auth?.auth_mode === "apikey" ? auth : {}),
      auth_mode: "apikey",
      OPENAI_API_KEY: key,
    });
  }

  await saveRegistry(registry);

  // Only the active account owns config.toml; rewriting it for an inactive one
  // would silently repoint the running CLI at the wrong provider.
  const reapplied = registry.active_account_key === accountKey;
  if (reapplied) {
    const auth =
      account.auth_mode === "apikey" ? await readAccountAuth(accountKey) : null;
    await applyCodexApiProvider(
      account.auth_mode === "apikey" ? account.api_provider : null,
      auth?.auth_mode === "apikey" ? auth.OPENAI_API_KEY : undefined,
      account.default_model,
    );
  }

  return { alias, ok: true, reapplied };
}

function sanitizeFields(
  fields: Record<string, string> | undefined,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields ?? {})) {
    if (typeof value !== "string") continue;
    result[key] = value;
  }
  return result;
}

function validateClaudeFields(fields: Record<string, string>): void {
  if (fields.baseUrl !== undefined) validateUrl(fields.baseUrl);
  if (fields.apiKey !== undefined && !fields.apiKey.trim()) {
    throw new Error("API Key 不能为空");
  }
}

function validateUrl(value: string): void {
  const trimmed = value.trim();
  if (!trimmed) return;
  try {
    new URL(trimmed);
  } catch {
    throw new Error(`请求地址不是合法 URL：${trimmed}`);
  }
}

function validateEnv(env: CustomEnv): CustomEnv {
  const result: CustomEnv = {};
  for (const [rawKey, rawValue] of Object.entries(env ?? {})) {
    const key = String(rawKey).trim();
    if (!key) continue;
    if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
      throw new Error(
        `环境变量名 "${key}" 无效：只能用大写字母、数字和下划线，且不能以数字开头`,
      );
    }
    if (!isValidCustomEnvKey(key)) {
      throw new Error(`"${key}" 上面已有专门的输入框，请填在那里`);
    }
    result[key] = typeof rawValue === "string" ? rawValue.trim() : "";
  }
  return result;
}
