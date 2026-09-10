import { homedir } from "os";
import { join } from "path";

const HOME = process.env.CLAUDEX_TEST_HOME ?? homedir();

// Claude paths
export const CLAUDE_DIR = join(HOME, ".claude");
export const CLAUDE_JSON = join(HOME, ".claude.json");
export const CREDENTIALS_FILE = join(CLAUDE_DIR, ".credentials.json");
export const SETTINGS_FILE = join(CLAUDE_DIR, "settings.json");
export const CLAUDE_PROFILES_DIR = join(HOME, ".claude-profiles");
export const CLAUDE_STATE_FILE = join(CLAUDE_PROFILES_DIR, "state.json");

// Codex paths
export const CODEX_DIR = join(HOME, ".codex");
export const CODEX_AUTH_FILE = join(CODEX_DIR, "auth.json");
export const CODEX_CONFIG_FILE = join(CODEX_DIR, "config.toml");
export const CODEX_ACCOUNTS_DIR = join(CODEX_DIR, "accounts");
export const CODEX_REGISTRY_FILE = join(CODEX_ACCOUNTS_DIR, "registry.json");

// claudex-switch paths
export const CLAUDEX_DIR = join(HOME, ".claudex-switch");
export const ALIAS_REGISTRY_FILE = join(CLAUDEX_DIR, "aliases.json");
export const RELAYS_FILE = join(CLAUDEX_DIR, "relays.json");
export const CLI_PROXY_API_DIR = join(CLAUDEX_DIR, "cliproxyapi");
export const CLI_PROXY_API_LOGIN_LOCK = join(CLI_PROXY_API_DIR, "login.lock");

// Claude profile helpers
export function claudeProfileDir(name: string): string {
  return join(CLAUDE_PROFILES_DIR, name);
}

export function claudeProfileCredentials(name: string): string {
  return join(claudeProfileDir(name), ".credentials.json");
}

export function claudeProfileConfigDir(name: string): string {
  return join(claudeProfileDir(name), "config");
}

// A local CLIProxyAPI run must not inherit the real Claude OAuth store. This
// empty per-profile secure-storage root is intentionally separate from the
// normal profile directory and its snapshot files.
export function claudeProfileSecureStorageDir(name: string): string {
  return join(claudeProfileDir(name), "secure-storage");
}

export function claudeProfileConfigJson(name: string): string {
  return join(claudeProfileConfigDir(name), ".claude.json");
}

export function claudeProfileDataFile(name: string): string {
  return join(claudeProfileDir(name), "profile.json");
}

export function claudeProfileAccountFile(name: string): string {
  return join(claudeProfileDir(name), "account.json");
}

// A private, higher-precedence settings file for an isolated API-key `-run`.
// Claude Code lets `~/.claude/settings.json` env override a spawned process's
// env, so an API profile's routing has to be injected here rather than only
// through the child environment. It holds a secret, so it is never passed as
// inline `--settings` JSON (visible in `ps`).
export function claudeProfileClaudeSettingsFile(name: string): string {
  return join(claudeProfileDir(name), "claude-settings.json");
}

// CLIProxyAPI data is keyed by an opaque profile id rather than the user-facing
// alias. Renaming an alias must never move, replace, or disconnect its login.
export function cliProxyAPIProfileDir(profileId: string): string {
  return join(CLI_PROXY_API_DIR, profileId);
}

export function cliProxyAPIAuthDir(profileId: string): string {
  return join(cliProxyAPIProfileDir(profileId), "auth");
}

export function cliProxyAPIEnvFile(profileId: string): string {
  return join(cliProxyAPIProfileDir(profileId), ".env");
}

export function cliProxyAPIConfigFile(profileId: string): string {
  return join(cliProxyAPIProfileDir(profileId), "runtime.yaml");
}

export function cliProxyAPIClaudeSettingsFile(profileId: string): string {
  return join(cliProxyAPIProfileDir(profileId), "claude-settings.json");
}

export function cliProxyAPISessionsDir(profileId: string): string {
  return join(cliProxyAPIProfileDir(profileId), "sessions");
}

export function cliProxyAPIStateFile(profileId: string): string {
  return join(cliProxyAPIProfileDir(profileId), "state.json");
}

export function cliProxyAPIStartupLock(profileId: string): string {
  // Locks live outside removable per-account data. A purge can then delete an
  // exact profile directory without deleting a lock still owned by its caller.
  return join(CLI_PROXY_API_DIR, "locks", `${profileId}.lock`);
}

// Codex account helpers - matches codex-auth's file naming convention
export function codexAccountAuthFile(accountKey: string): string {
  const needsEncoding =
    !accountKey ||
    accountKey === "." ||
    accountKey === ".." ||
    [...accountKey].some((ch) => !/[a-zA-Z0-9\-_.]/.test(ch));
  const fileKey = needsEncoding
    ? Buffer.from(accountKey).toString("base64url")
    : accountKey;
  return join(CODEX_ACCOUNTS_DIR, `${fileKey}.auth.json`);
}
