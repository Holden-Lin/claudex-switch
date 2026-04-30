// -- Provider types --
export type Provider = "claude" | "codex";

// -- Alias types --
export interface ClaudeTarget {
  provider: "claude";
  profileName: string;
}

export interface CodexTarget {
  provider: "codex";
  accountKey: string;
}

export type AliasTarget = ClaudeTarget | CodexTarget;

export interface AliasEntry {
  alias: string;
  target: AliasTarget;
  createdAt: number;
}

export interface AliasRegistry {
  version: 1;
  aliases: AliasEntry[];
}

// -- Claude types --
export interface OAuthCredentials {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scopes: string[];
  subscriptionType?: string;
  rateLimitTier?: string;
}

export interface CredentialsFile {
  claudeAiOauth: OAuthCredentials;
  mcpOAuth?: unknown;
  [key: string]: unknown;
}

export interface OAuthAccount {
  accountUuid?: string;
  emailAddress?: string;
  organizationUuid?: string;
  displayName?: string;
  organizationRole?: string;
  organizationName?: string;
  workspaceRole?: string | null;
  billingType?: string;
  hasExtraUsageEnabled?: boolean;
  accountCreatedAt?: string;
  subscriptionCreatedAt?: string;
  [key: string]: unknown;
}

export type ProfileType = "oauth" | "api-key";

export interface ProfileData {
  type: ProfileType;
  apiKey?: string;
}

export interface ProfileState {
  active: string | null;
}

export interface ProfileInfo {
  name: string;
  type: ProfileType;
  label: string | null;
  isActive: boolean;
}

// -- Codex types --
export interface CodexRateLimitWindow {
  used_percent: number;
  window_minutes: number | null;
  resets_at: number | null;
}

export interface CodexCredits {
  has_credits: boolean;
  unlimited: boolean;
  balance: string | null;
}

export interface CodexUsageSnapshot {
  primary: CodexRateLimitWindow | null;
  secondary: CodexRateLimitWindow | null;
  credits: CodexCredits | null;
  plan_type: string | null;
}

export interface CodexApiProviderConfig {
  type: "official" | "custom";
  name: string | null;
  base_url: string | null;
  model: string | null;
  env_key: string | null;
}

export interface CodexRegistryAccount {
  account_key: string;
  chatgpt_account_id: string;
  chatgpt_user_id: string;
  email: string;
  alias: string;
  account_name: string | null;
  plan: string | null;
  auth_mode: "chatgpt" | "apikey" | null;
  api_provider?: CodexApiProviderConfig | null;
  created_at: number;
  last_used_at: number | null;
  last_usage: CodexUsageSnapshot | null;
  last_usage_at: number | null;
  last_local_rollout: unknown | null;
}

export interface CodexAutoSwitchConfig {
  enabled: boolean;
  threshold_5h_percent: number;
  threshold_weekly_percent: number;
}

export interface CodexApiConfig {
  usage: boolean;
  account: boolean;
}

export interface CodexRegistry {
  schema_version: number;
  active_account_key: string | null;
  active_account_activated_at_ms: number | null;
  auto_switch: CodexAutoSwitchConfig;
  api: CodexApiConfig;
  accounts: CodexRegistryAccount[];
}

export interface CodexAuthTokens {
  id_token: string;
  access_token: string;
  refresh_token: string;
  account_id: string;
}

export interface CodexAuthFile {
  auth_mode: "chatgpt" | "apikey";
  OPENAI_API_KEY: string | null;
  tokens: CodexAuthTokens;
  last_refresh: string;
}

// -- Unified display model --
export interface AccountInfo {
  alias: string;
  provider: Provider;
  email: string | null;
  plan: string | null;
  authMode: string;
  apiProvider: string | null;
  isActive: boolean;
  usage: UsageInfo | null;
}

export interface UsageInfo {
  primaryPercent: number | null;
  secondaryPercent: number | null;
  primaryResetsAt: number | null;
  secondaryResetsAt: number | null;
}
