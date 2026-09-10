import { createHash } from "crypto";
import {
  addAlias,
  checkAlias,
  describeAliasRejection,
  findAliasByTarget,
  loadAliases,
} from "../alias/store";
import { addApiKeyProfile } from "../providers/claude/profiles";
import {
  addAccountToRegistry,
  loadRegistry,
  saveRegistry,
  setActiveAccount,
} from "../providers/codex/registry";
import {
  saveAccountAuth,
  switchToAccount,
  syncActiveAuthSnapshot,
} from "../providers/codex/auth";
import { applyCodexApiProvider } from "../providers/codex/config";
import type {
  ClaudeApiProfileConfig,
  CodexApiProviderConfig,
  CodexRegistryAccount,
  CustomEnv,
} from "../types";

// Creating an account writes the same profile/registry/alias schema the rest of
// the tool reads, so it lives here rather than in commands/ or webconfig/: the
// CLI wizard and the local web UI both call these instead of each growing its
// own copy of the record shape and the order its side effects have to happen in.
//
// Both creators deliberately leave the new account globally active, matching
// what `claudex-switch add` has always done. Callers that must not be interrupted
// mid-flight are expected to pre-validate for user-facing errors; the checks here
// are the backstop, so their wording is the core layer's English.
//
// Deliberately not done here: the relay-console wallet setup
// (maybeSetupRelayBalance) stays a CLI-only interactive flow, since it is an
// optional extra for `list` and needs a loop that re-prompts on rejection.

export interface CreateClaudeApiKeyInput {
  alias: string;
  apiKey: string;
  baseUrl?: string;
  authToken?: string;
  model?: string;
  defaultFableModel?: string;
  defaultSonnetModel?: string;
  defaultOpusModel?: string;
  defaultHaikuModel?: string;
  subagentModel?: string;
  env?: CustomEnv;
}

export async function createClaudeApiKeyAccount(
  input: CreateClaudeApiKeyInput,
): Promise<void> {
  const alias = input.alias.trim();
  await assertAliasUsable(alias);

  const apiKey = input.apiKey.trim();
  if (!apiKey) throw new Error("API key cannot be empty");

  const config: ClaudeApiProfileConfig = {
    apiKey,
    baseUrl: input.baseUrl,
    authToken: input.authToken,
    model: input.model,
    defaultFableModel: input.defaultFableModel,
    defaultSonnetModel: input.defaultSonnetModel,
    defaultOpusModel: input.defaultOpusModel,
    defaultHaikuModel: input.defaultHaikuModel,
    subagentModel: input.subagentModel,
    env: input.env,
  };

  // An API-key profile is named by its alias: the alias *is* the profile's
  // storage identity, so `rename` never needs to move it.
  await addApiKeyProfile(alias, config);
  await addAlias(alias, { provider: "claude", profileName: alias });
}

export interface CreateCodexApiKeyInput {
  alias: string;
  apiKey: string;
  provider: CodexApiProviderConfig;
  defaultModel: string;
}

export async function createCodexApiKeyAccount(
  input: CreateCodexApiKeyInput,
): Promise<void> {
  const alias = input.alias.trim();
  await assertAliasUsable(alias);

  const key = input.apiKey.trim();
  if (!key) throw new Error("API key cannot be empty");

  const defaultModel = input.defaultModel.trim();
  if (!defaultModel) throw new Error("Default model cannot be empty");

  const accountKey = codexApiAccountKey(key);
  const existingAlias = findAliasByTarget(await loadAliases(), {
    provider: "codex",
    accountKey,
  });
  if (existingAlias) {
    throw new Error(
      `This Codex account is already imported as "${existingAlias.alias}"`,
    );
  }

  const registry = await loadRegistry();
  await syncActiveAuthSnapshot(registry);
  await saveAccountAuth(accountKey, {
    auth_mode: "apikey",
    OPENAI_API_KEY: key,
  });

  const account: CodexRegistryAccount = {
    account_key: accountKey,
    chatgpt_account_id: "",
    chatgpt_user_id: "",
    email: "",
    alias,
    account_name: null,
    plan: null,
    auth_mode: "apikey",
    default_model: defaultModel,
    api_provider: input.provider,
    created_at: Math.floor(Date.now() / 1000),
    last_used_at: Math.floor(Date.now() / 1000),
    last_usage: null,
    last_usage_at: null,
    last_local_rollout: null,
  };
  addAccountToRegistry(registry, account);
  setActiveAccount(registry, accountKey);
  await saveRegistry(registry);

  // Order matters: the auth file has to exist before the switch reads it, and
  // config.toml is written last so a failure cannot repoint the CLI at a
  // provider whose credentials were never saved.
  await switchToAccount(accountKey);
  await applyCodexApiProvider(input.provider, key, defaultModel);
  await addAlias(alias, { provider: "codex", accountKey });
}

/**
 * The account key a Codex API key maps to. Derived from a hash rather than the
 * key itself: the account key becomes a file name and a registry entry, and
 * must not leak key material. Exported so callers can check for a duplicate
 * before running the creator.
 */
export function codexApiAccountKey(apiKey: string): string {
  const keyHash = createHash("sha256")
    .update(apiKey.trim())
    .digest("hex")
    .slice(0, 16);
  return `apikey::${keyHash}`;
}

async function assertAliasUsable(alias: string): Promise<void> {
  if (!alias) throw new Error("Alias cannot be empty");

  // Re-read rather than accept a caller's snapshot, so validation and the write
  // below cannot straddle another process taking the same alias.
  const registry = await loadAliases();
  const rejection = checkAlias(registry, alias);
  if (rejection) throw new Error(describeAliasRejection(rejection, alias));
}
