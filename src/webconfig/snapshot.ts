import {
  checkAlias,
  findAlias,
  findAliasesByTarget,
  loadAliases,
  renameAlias,
} from "../alias/store";
import { purgeAccount } from "../accounts/purge";
import { readJson } from "../lib/fs";
import { claudeProfileAccountFile } from "../lib/paths";
import {
  getProfileData,
  readState,
  updateClaudeProfileConfig,
} from "../providers/claude/profiles";
import { aliasRejectionMessage } from "./messages";
import { requireValidUrl, validateCustomEnv } from "./validation";
import { readAccountAuth, saveAccountAuth } from "../providers/codex/auth";
import {
  applyCodexApiProvider,
  DEFAULT_CODEX_MODEL,
} from "../providers/codex/config";
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
    // A purge removes every alias sharing this target, so the delete prompt
    // has to name them. Computed once here rather than per account.
    const linkedAliases = findAliasesByTarget(aliasReg, entry.target).map(
      (item) => item.alias,
    );

    if (entry.target.provider === "claude") {
      const account = await describeClaudeAccount(
        entry,
        claudeState.active,
        linkedAliases,
      );
      if (account) claude.push(account);
    } else if (codexReg) {
      const account = await describeCodexAccount(entry, codexReg, linkedAliases);
      if (account) codex.push(account);
    }
  }

  return {
    version: 1,
    generatedAt: Date.now(),
    claude,
    codex,
    codexDefaultModel: DEFAULT_CODEX_MODEL,
  };
}

async function describeClaudeAccount(
  entry: AliasEntry,
  activeProfile: string | null,
  linkedAliases: string[],
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
    linkedAliases,
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
  linkedAliases: string[],
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
    linkedAliases,
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

/**
 * Rename one alias, leaving the underlying account and its login untouched.
 * Identity-level, so it applies immediately rather than through the batch save.
 */
export async function renameAccountAlias(
  from: string,
  to: string,
): Promise<string> {
  const target = to.trim();
  const registry = await loadAliases();

  if (!findAlias(registry, from)) {
    throw new Error(`别名 "${from}" 不存在`);
  }

  const rejection = checkAlias(registry, target, { ignoreAlias: from });
  if (rejection) {
    throw new Error(aliasRejectionMessage(rejection));
  }

  // A case-only change still has to land, since checkAlias ignores self.
  await renameAlias(from, target);
  return target;
}

/**
 * Destroy an account and every alias pointing at it. Deliberately re-derives
 * the blast radius from current state rather than trusting what the browser
 * showed, and re-checks the alias still exists.
 */
export async function deleteAccount(alias: string): Promise<string[]> {
  const registry = await loadAliases();
  if (!findAlias(registry, alias)) {
    throw new Error(`别名 "${alias}" 不存在`);
  }

  const { linkedAliases } = await purgeAccount(alias);
  return linkedAliases;
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
  const env =
    change.env === undefined ? undefined : validateCustomEnv(change.env);

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
  if (fields.baseUrl !== undefined) requireValidUrl(fields.baseUrl);

  const registry = await loadRegistry();
  // Validate before the registry write: activateCodexCustomProvider rejects a
  // provider without a base URL, and it runs after saveRegistry.
  const existing = findAccountByKey(registry, accountKey);
  if (
    existing?.api_provider?.type === "custom" &&
    fields.baseUrl !== undefined &&
    !fields.baseUrl.trim()
  ) {
    throw new Error("中转站账号的请求地址不能为空");
  }

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
  if (fields.baseUrl !== undefined) requireValidUrl(fields.baseUrl);
  if (fields.apiKey !== undefined && !fields.apiKey.trim()) {
    throw new Error("API Key 不能为空");
  }
}


