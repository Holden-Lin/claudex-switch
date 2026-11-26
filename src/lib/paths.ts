import { homedir } from "os";
import { join } from "path";
import { assertTestHomeIsolated } from "./home-guard";

// Every path below is resolved when called, never at import. A test or probe
// that sets HOME / CLAUDEX_TEST_HOME after importing this module must still
// land in its own home: on 11-26 a review probe imported first, changed HOME
// second, and overwrote the real aliases.json and Codex registry.
// $HOME is read directly because Bun's os.homedir() keeps the value the
// process started with; Node's homedir() reads $HOME first anyway.
export function homeDir(): string {
  return assertTestHomeIsolated(
    process.env.CLAUDEX_TEST_HOME || process.env.HOME || homedir(),
  );
}

// Claude paths
export const CLAUDE_DIR = (): string => join(homeDir(), ".claude");
export const CLAUDE_JSON = (): string => join(homeDir(), ".claude.json");
export const CREDENTIALS_FILE = (): string => join(CLAUDE_DIR(), ".credentials.json");
export const SETTINGS_FILE = (): string => join(CLAUDE_DIR(), "settings.json");
export const CLAUDE_PROFILES_DIR = (): string => join(homeDir(), ".claude-profiles");
export const CLAUDE_STATE_FILE = (): string => join(CLAUDE_PROFILES_DIR(), "state.json");

// Codex paths
export const CODEX_DIR = (): string => join(homeDir(), ".codex");
export const CODEX_AUTH_FILE = (): string => join(CODEX_DIR(), "auth.json");
export const CODEX_CONFIG_FILE = (): string => join(CODEX_DIR(), "config.toml");
export const CODEX_ACCOUNTS_DIR = (): string => join(CODEX_DIR(), "accounts");
export const CODEX_REGISTRY_FILE = (): string => join(CODEX_ACCOUNTS_DIR(), "registry.json");

// claudex-switch paths
export const CLAUDEX_DIR = (): string => join(homeDir(), ".claudex-switch");
export const ALIAS_REGISTRY_FILE = (): string => join(CLAUDEX_DIR(), "aliases.json");
// Rolling backups of the stores no other file can rebuild (src/lib/backup.ts).
export const ALIAS_BACKUP_DIR = (): string => join(CLAUDEX_DIR(), "backups", "aliases");
export const CODEX_REGISTRY_BACKUP_DIR = (): string =>
  join(CLAUDEX_DIR(), "backups", "codex-registry");
export const RELAYS_FILE = (): string => join(CLAUDEX_DIR(), "relays.json");
// Records which extra (non CLAUDE_ENV_KEYS) env keys claudex-switch last wrote
// into ~/.claude/settings.json. Switching accounts clears exactly those and
// leaves every env entry the user added by hand untouched.
export const MANAGED_ENV_FILE = (): string => join(CLAUDEX_DIR(), "managed-env.json");
// Last known quota per account. `list` renders from it instantly; a detached
// `list --refresh-cache` process is the only writer and does the network work.
export const USAGE_CACHE_FILE = (): string => join(CLAUDEX_DIR(), "usage-cache.json");
export const USAGE_REFRESH_LOCK = (): string => join(CLAUDEX_DIR(), "usage-refresh.lock");
// Last-30-days token / committed-code trend for `list`, written by the same
// detached refresher from local session logs and git history.
export const ACTIVITY_CACHE_FILE = (): string => join(CLAUDEX_DIR(), "activity-cache.json");
export const CLI_PROXY_API_DIR = (): string => join(CLAUDEX_DIR(), "cliproxyapi");
// Codex / OpenCode account -> the unaliased Claude profile that
// `<alias> --run --cliproxy claudecode` launches through a managed proxy.
export const CLI_PROXY_API_LINKS_FILE = (): string => join(CLAUDEX_DIR(), "cliproxy-links.json");
export const CLI_PROXY_API_LOGIN_LOCK = (): string => join(CLI_PROXY_API_DIR(), "login.lock");
export const OPENCODE_PROFILES_DIR = (): string => join(CLAUDEX_DIR(), "opencode", "profiles");
export const OPENCODE_STATE_FILE = (): string => join(CLAUDEX_DIR(), "opencode", "state.json");
export const OPENCODE_LOCKS_DIR = (): string => join(CLAUDEX_DIR(), "opencode", "locks");

export function openCodeProfileConsoleLock(profileId: string): string {
  return join(OPENCODE_LOCKS_DIR(), `${profileId}.lock`);
}

// OpenCode uses the XDG data directory for auth.json. Its default on macOS and
// Linux is ~/.local/share, but honoring XDG_DATA_HOME keeps this aligned with a
// user's own OpenCode installation.
export const OPENCODE_GLOBAL_DATA_DIR = (): string => join(
  process.env.XDG_DATA_HOME ?? join(homeDir(), ".local", "share"),
  "opencode",
);
export const OPENCODE_GLOBAL_AUTH_FILE = (): string => join(
  OPENCODE_GLOBAL_DATA_DIR(),
  "auth.json",
);
// Claude profile helpers
export function claudeProfileDir(name: string): string {
  return join(CLAUDE_PROFILES_DIR(), name);
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

// A private, higher-precedence settings file for an isolated API-key `--run`.
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
  return join(CLI_PROXY_API_DIR(), profileId);
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
  return join(CLI_PROXY_API_DIR(), "locks", `${profileId}.lock`);
}

// Each Go account owns a private XDG data root only for /connect and refresh.
// Normal runs retain OpenCode's shared XDG data directory, letting all Go
// accounts use the same /resume history while auth is injected separately.
export function openCodeProfileDir(profileId: string): string {
  return join(OPENCODE_PROFILES_DIR(), profileId);
}

export function openCodeProfileDataHome(profileId: string): string {
  return join(openCodeProfileDir(profileId), "data");
}

// OpenCode V2 gives each Go profile its own XDG roots and SQLite session/
// credential database. Keep this separate from V1's private auth.json setup
// directory so V2 never migrates that credential into a shared database.
export function openCodeProfileV2RuntimeDir(profileId: string): string {
  return join(openCodeProfileDir(profileId), "v2-runtime");
}

export function openCodeProfileV2DataHome(profileId: string): string {
  return join(openCodeProfileV2RuntimeDir(profileId), "data");
}

export function openCodeProfileV2DatabaseFile(profileId: string): string {
  return join(openCodeProfileV2DataHome(profileId), "opencode", "opencode.db");
}

export function openCodeProfileV2ModelInventoryFile(profileId: string): string {
  return join(openCodeProfileV2RuntimeDir(profileId), "models.json");
}

export function openCodeProfileV2CredentialStateFile(profileId: string): string {
  return join(openCodeProfileV2RuntimeDir(profileId), "credentials.json");
}

export function openCodeProfileAuthFile(profileId: string): string {
  return join(openCodeProfileDataHome(profileId), "opencode", "auth.json");
}

export function openCodeProfileDataFile(profileId: string): string {
  return join(openCodeProfileDir(profileId), "profile.json");
}

// Codex account helpers - matches codex-auth's file naming convention
function codexAccountFileKey(accountKey: string): string {
  const needsEncoding =
    !accountKey ||
    accountKey === "." ||
    accountKey === ".." ||
    [...accountKey].some((ch) => !/[a-zA-Z0-9\-_.]/.test(ch));
  return needsEncoding
    ? Buffer.from(accountKey).toString("base64url")
    : accountKey;
}

export function codexAccountAuthFile(accountKey: string): string {
  return join(CODEX_ACCOUNTS_DIR(), `${codexAccountFileKey(accountKey)}.auth.json`);
}

// Private CODEX_HOME for `<alias> --run` of an account that isn't the global
// default, so the launch never rewrites ~/.codex/auth.json.
export function codexRunHome(accountKey: string): string {
  return join(CLAUDEX_DIR(), "codex-run", codexAccountFileKey(accountKey));
}
