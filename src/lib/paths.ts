import { homedir } from "os";
import { join } from "path";

// Claude paths
export const CLAUDE_DIR = join(homedir(), ".claude");
export const CLAUDE_JSON = join(homedir(), ".claude.json");
export const CREDENTIALS_FILE = join(CLAUDE_DIR, ".credentials.json");
export const SETTINGS_FILE = join(CLAUDE_DIR, "settings.json");
export const CLAUDE_PROFILES_DIR = join(homedir(), ".claude-profiles");
export const CLAUDE_STATE_FILE = join(CLAUDE_PROFILES_DIR, "state.json");

// Codex paths
export const CODEX_DIR = join(homedir(), ".codex");
export const CODEX_AUTH_FILE = join(CODEX_DIR, "auth.json");
export const CODEX_CONFIG_FILE = join(CODEX_DIR, "config.toml");
export const CODEX_ACCOUNTS_DIR = join(CODEX_DIR, "accounts");
export const CODEX_REGISTRY_FILE = join(CODEX_ACCOUNTS_DIR, "registry.json");

// claudex-switch paths
export const CLAUDEX_DIR = join(homedir(), ".claudex-switch");
export const ALIAS_REGISTRY_FILE = join(CLAUDEX_DIR, "aliases.json");

// Claude profile helpers
export function claudeProfileDir(name: string): string {
  return join(CLAUDE_PROFILES_DIR, name);
}

export function claudeProfileCredentials(name: string): string {
  return join(claudeProfileDir(name), ".credentials.json");
}

export function claudeProfileDataFile(name: string): string {
  return join(claudeProfileDir(name), "profile.json");
}

export function claudeProfileAccountFile(name: string): string {
  return join(claudeProfileDir(name), "account.json");
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
