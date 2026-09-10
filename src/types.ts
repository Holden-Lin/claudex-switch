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

export type ProfileType = "oauth" | "api-key" | "local-cliproxyapi";

// Extra Claude Code environment variables a profile owns beyond the fixed
// CLAUDE_ENV_KEYS set (e.g. CLAUDE_CODE_EFFORT_LEVEL). Keys written from here
// are tracked in managed-env.json so switching accounts can clear exactly the
// ones claudex-switch wrote, and never a user's own settings.json entries.
export type CustomEnv = Record<string, string>;

export interface ClaudeOAuthProfileConfig {
  defaultModel?: string;
  env?: CustomEnv;
}


export interface ClaudeApiProfileConfig {
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

export interface OAuthProfileData {
  type: "oauth";
  defaultModel?: string;
  env?: CustomEnv;
}

export interface ApiKeyProfileData extends ClaudeApiProfileConfig {
  type: "api-key";
}

// OAuth credentials for this profile are owned by CLIProxyAPI in its private
// auth directory. Only a stable managed id and a non-secret executable path
// are stored in the regular Claude profile registry.
export interface LocalCLIProxyAPIProfileData {
  type: "local-cliproxyapi";
  profileId: string;
  binaryPath: string;
  defaultModel: string;
  env?: CustomEnv;
  // One-way identity fingerprint of the one credential in the managed auth
  // directory. It lets refresh reject a different ChatGPT account before it
  // replaces the existing login, without persisting tokens or account metadata.
  authIdentity?: string;
}

export type ProfileData =
  | OAuthProfileData
  | ApiKeyProfileData
  | LocalCLIProxyAPIProfileData;

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
  default_model?: string | null;
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
  account_id?: string;
}

export interface CodexChatGptAuthFile {
  auth_mode: "chatgpt";
  OPENAI_API_KEY: null;
  tokens: CodexAuthTokens;
  last_refresh: string;
  [key: string]: unknown;
}

export interface CodexApiKeyAuthFile {
  auth_mode: "apikey";
  OPENAI_API_KEY: string;
  tokens?: CodexAuthTokens;
  last_refresh?: string;
  [key: string]: unknown;
}

export type CodexAuthFile = CodexChatGptAuthFile | CodexApiKeyAuthFile;

// -- Unified display model --
export interface AccountInfo {
  alias: string;
  provider: Provider;
  email: string | null;
  plan: string | null;
  authMode: string;
  apiProvider: string | null;
  defaultModel: string | null;
  isActive: boolean;
  usage: UsageInfo | null;
  usageNote: string | null;
  balance: RelayBalance | null;
}

// Used percent per rate-limit window, as reported by the provider.
export interface UsageInfo {
  fiveHourUsedPercent: number | null;
  fiveHourResetsAt: number | null;
  weeklyUsedPercent: number | null;
  weeklyResetsAt: number | null;
}

export interface UsageFetchResult {
  usage: UsageInfo | null;
  note: string | null;
  plan?: string | null;
}

// One balance figure from a one-api/new-api relay.
export interface RelayBalanceSide {
  remainingUsd: number | null;
  usedUsd: number | null;
  unlimited: boolean;
}

// Relay balances shown in list: `key` is the sk key's own quota (from the
// OpenAI-compatible billing endpoints), `account` is the user wallet balance
// (needs a console access token in relays.json).
export interface RelayBalance {
  key: RelayBalanceSide | null;
  account: RelayBalanceSide | null;
}

// Optional per-relay user credentials (~/.claudex-switch/relays.json, keyed
// by origin). With a console access token the list command can show the
// account's real wallet balance instead of the token-level quota.
export interface RelayConfig {
  accessToken: string;
  userId?: number | string;
  quotaPerUnit?: number;
}

// -- webconfig types --
// One editable account as the local web UI sees it. `fields` is a flat string
// map so the page can render inputs generically; `readonly` names the ones it
// must display but never submit.
export interface WebConfigAccount {
  provider: Provider;
  alias: string;
  profileName?: string;
  accountKey?: string;
  type: string;
  label: string;
  isActive: boolean;
  email: string | null;
  fields: Record<string, string>;
  env: CustomEnv;
  supportsEnv: boolean;
  secretFields: string[];
  readonly: string[];
}

export interface WebConfigSnapshot {
  version: 1;
  generatedAt: number;
  claude: WebConfigAccount[];
  codex: WebConfigAccount[];
}

export interface WebConfigChange {
  provider: Provider;
  alias: string;
  fields?: Record<string, string>;
  env?: CustomEnv;
}

export interface WebConfigChangeResult {
  alias: string;
  ok: boolean;
  reapplied: boolean;
  error?: string;
}
