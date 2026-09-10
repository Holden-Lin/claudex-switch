import { checkAlias, findAliasByTarget, loadAliases } from "../alias/store";
import {
  codexApiAccountKey,
  createClaudeApiKeyAccount,
  createCodexApiKeyAccount,
} from "../accounts/create";
import { aliasRejectionMessage } from "./messages";
import type { CodexApiProviderConfig, CustomEnv, Provider } from "../types";

// Request-shaped input for the page's "new account" form. Kept flat and string
// valued like the edit fields, so the page can submit the same shape it renders.
export interface CreateAccountRequest {
  provider: Provider;
  alias: string;
  fields: Record<string, string>;
  env?: CustomEnv;
}

const PROVIDER_NAME_PATTERN = /^[A-Za-z0-9_-]+$/;
const ENV_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Validate everything the user can fix, in the page's own wording, before
 * handing off to the shared creators. The creators re-check as a backstop, but
 * their messages are the core layer's English, so anything a user is likely to
 * hit has to be caught here.
 */
export async function createAccount(
  request: CreateAccountRequest,
): Promise<void> {
  const alias = request.alias.trim();
  const fields = request.fields ?? {};

  const registry = await loadAliases();
  const rejection = checkAlias(registry, alias);
  if (rejection) throw new Error(aliasRejectionMessage(rejection));

  if (request.provider === "claude") {
    await createClaude(request, alias, fields);
    return;
  }
  await createCodex(request, alias, fields);
}

async function createClaude(
  request: CreateAccountRequest,
  alias: string,
  fields: Record<string, string>,
): Promise<void> {
  const apiKey = (fields.apiKey ?? "").trim();
  if (!apiKey) throw new Error("API Key 不能为空");

  const baseUrl = optional(fields.baseUrl);
  if (baseUrl) requireUrl(baseUrl);

  await createClaudeApiKeyAccount({
    alias,
    apiKey,
    baseUrl,
    authToken: optional(fields.authToken),
    model: optional(fields.model),
    defaultFableModel: optional(fields.defaultFableModel),
    defaultSonnetModel: optional(fields.defaultSonnetModel),
    defaultOpusModel: optional(fields.defaultOpusModel),
    defaultHaikuModel: optional(fields.defaultHaikuModel),
    subagentModel: optional(fields.subagentModel),
    env: request.env,
  });
}

async function createCodex(
  request: CreateAccountRequest,
  alias: string,
  fields: Record<string, string>,
): Promise<void> {
  const apiKey = (fields.apiKey ?? "").trim();
  if (!apiKey) throw new Error("API Key 不能为空");

  const defaultModel = (fields.defaultModel ?? "").trim();
  if (!defaultModel) throw new Error("默认模型不能为空");

  const provider = resolveCodexProvider(fields);

  // Check the duplicate here rather than letting the shared creator throw, so a
  // re-added key reads in the page's language instead of English.
  const existing = findAliasByTarget(await loadAliases(), {
    provider: "codex",
    accountKey: codexApiAccountKey(apiKey),
  });
  if (existing) {
    throw new Error(`这个 Codex API Key 已经导入为 "${existing.alias}"`);
  }

  await createCodexApiKeyAccount({ alias, apiKey, provider, defaultModel });
}

function resolveCodexProvider(
  fields: Record<string, string>,
): CodexApiProviderConfig {
  // Require the discriminant explicitly. Defaulting it to "official" would
  // silently discard a relay's base URL and key routing, creating an account
  // that looks fine and sends traffic to the wrong place.
  const providerType = (fields.providerType ?? "").trim();
  if (providerType !== "official" && providerType !== "custom") {
    throw new Error("请选择 Provider 类型（OpenAI 官方 / 自定义中转）");
  }

  if (providerType === "official") {
    return {
      type: "official",
      name: null,
      base_url: null,
      model: null,
      env_key: null,
    };
  }

  const name = (fields.providerName ?? "").trim();
  if (!name) throw new Error("Provider 名称不能为空");
  if (!PROVIDER_NAME_PATTERN.test(name)) {
    throw new Error("Provider 名称只能用字母、数字、连字符和下划线");
  }

  const baseUrl = (fields.baseUrl ?? "").trim();
  if (!baseUrl) throw new Error("中转站的请求地址不能为空");
  requireUrl(baseUrl);

  const model = (fields.model ?? "").trim();
  if (!model) throw new Error("Provider 模型不能为空");

  const envKey = (fields.envKey ?? "OPENAI_API_KEY").trim();
  if (!ENV_KEY_PATTERN.test(envKey)) {
    throw new Error("环境变量名只能是字母、数字和下划线，且不能以数字开头");
  }

  return {
    type: "custom",
    name,
    base_url: baseUrl,
    model,
    env_key: envKey,
  };
}

function optional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function requireUrl(value: string): void {
  try {
    new URL(value);
  } catch {
    throw new Error(`请求地址不是合法 URL：${value}`);
  }
}
