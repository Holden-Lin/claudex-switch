import { spawn, spawnSync, type ChildProcess } from "child_process";
import {
  chmod,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  rmdir,
  stat,
  writeFile,
} from "fs/promises";
import { createServer } from "net";
import { platform } from "os";
import { basename, dirname, join, resolve } from "path";
import { createHash, randomBytes, randomUUID } from "crypto";
import {
  CLI_PROXY_API_DIR,
  CLI_PROXY_API_LOGIN_LOCK,
  cliProxyAPIAuthDir,
  cliProxyAPIClaudeSettingsFile,
  cliProxyAPIConfigFile,
  cliProxyAPIEnvFile,
  cliProxyAPIProfileDir,
  cliProxyAPISessionsDir,
  cliProxyAPIStartupLock,
  cliProxyAPIStateFile,
} from "../../lib/paths";
import { fileExists, readJson, writeJsonSecure } from "../../lib/fs";
import {
  cleanupOpenShimDir,
  createOpenShimDir,
} from "../../lib/browser";
import {
  CLAUDE_LOCAL_PROXY_NEUTRALIZED_ENV_KEYS,
  type LocalCLIProxyAPISettings,
} from "../claude/settings";
import type { LocalCLIProxyAPIProfileData } from "../../types";

export const CLI_PROXY_API_DEFAULTS = {
  fableModel: "gpt-6-astra",
  sonnetModel: "gpt-5.6-terra",
  opusModel: "gpt-5.6-terra",
  haikuModel: "gpt-5.6-luna",
  subagentModel: "claudex-terra-max",
} as const;

const ENV_CLIENT_KEY = "CLAUDEX_CLIPROXYAPI_CLIENT_API_KEY";
const ENV_FABLE_MODEL = "CLAUDEX_CLIPROXYAPI_FABLE_MODEL";
const ENV_SONNET_MODEL = "CLAUDEX_CLIPROXYAPI_SONNET_MODEL";
const ENV_OPUS_MODEL = "CLAUDEX_CLIPROXYAPI_OPUS_MODEL";
const ENV_HAIKU_MODEL = "CLAUDEX_CLIPROXYAPI_HAIKU_MODEL";
const STARTUP_TIMEOUT_MS = 12_000;
const LOCK_TIMEOUT_MS = 20_000;
const ORPHAN_LOCK_GRACE_MS = 60_000;
const LOCK_HEARTBEAT_MS = 10_000;
const LOOPBACK_HOST = "127.0.0.1";
// CLIProxyAPI v7.2.x accepts `-oauth-callback-port`, but its Codex authorize
// URL still hard-codes this redirect URI. Do not pass a misleading random
// flag: preflight the actual port and serialize login attempts globally.
const CODEX_OAUTH_CALLBACK_PORT = 1455;
const PROFILE_ID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

interface ManagedEnv {
  apiKey: string;
  fableModel: string;
  sonnetModel: string;
  opusModel: string;
  haikuModel: string;
}

interface ManagedRuntimeState {
  pid: number;
  port: number;
  binaryPath: string;
  configPath: string;
  startedAt: number;
}

interface LockOwner {
  pid: number;
  token: string;
  createdAt: number;
  heartbeatAt: number;
}

interface ManagedSessionLease {
  pid: number;
  createdAt: number;
}

export interface ManagedCLIProxyAPILease {
  release(): Promise<void>;
}

export interface ManagedCLIProxyAPIProfile {
  profileId: string;
  binaryPath: string;
}

export interface ManagedCLIProxyAPIRuntime {
  port: number;
  baseUrl: string;
  apiKey: string;
}

export interface ManagedCLIProxyAPIStatus {
  installed: boolean;
  loggedIn: boolean;
  // Whether the private .env can be parsed and contains its generated key.
  // A restart can rebuild runtime.yaml from this source of truth.
  environmentValid: boolean;
  // `configured` means the generated key/config file still matches the
  // profile's expected loopback configuration, not merely that a file exists.
  running: boolean;
  configured: boolean;
  // Probed only when requested by diagnostics; list/status stays read-only and
  // labels a live PID as "running", never as an unearned "ready" claim.
  healthy: boolean | null;
  port: number | null;
}

export interface ManagedCLIProxyAPILoginResult {
  success: boolean;
  identity: string | null;
  identityMismatch: boolean;
}

type SpawnCommand = typeof spawn;

function assertProfileId(profileId: string): void {
  if (!PROFILE_ID_PATTERN.test(profileId)) {
    throw new Error("Invalid managed CLIProxyAPI profile id");
  }
}

function profilePaths(profileId: string): {
  dir: string;
  authDir: string;
  envFile: string;
  configFile: string;
  claudeSettingsFile: string;
  stateFile: string;
  sessionsDir: string;
  lock: string;
} {
  assertProfileId(profileId);
  return {
    dir: cliProxyAPIProfileDir(profileId),
    authDir: cliProxyAPIAuthDir(profileId),
    envFile: cliProxyAPIEnvFile(profileId),
    configFile: cliProxyAPIConfigFile(profileId),
    claudeSettingsFile: cliProxyAPIClaudeSettingsFile(profileId),
    stateFile: cliProxyAPIStateFile(profileId),
    sessionsDir: cliProxyAPISessionsDir(profileId),
    lock: cliProxyAPIStartupLock(profileId),
  };
}

async function mkdirPrivate(path: string): Promise<void> {
  await mkdir(path, { recursive: true, mode: 0o700 });
  try {
    await chmod(path, 0o700);
  } catch {
    // Windows does not expose POSIX modes. Its ACL remains the platform's
    // authority, while POSIX hosts get the explicit restrictive mode above.
  }
}

async function writePrivate(path: string, data: string): Promise<void> {
  await writeFile(path, data, { mode: 0o600 });
  try {
    await chmod(path, 0o600);
  } catch {
    // See mkdirPrivate's platform note.
  }
}

async function writePrivateOnce(path: string, data: string): Promise<boolean> {
  try {
    await writeFile(path, data, { mode: 0o600, flag: "wx" });
    try {
      await chmod(path, 0o600);
    } catch {
      // See mkdirPrivate's platform note.
    }
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "EEXIST") return false;
    throw err;
  }
}

async function writePrivateJson(path: string, data: unknown): Promise<void> {
  await writeJsonSecure(path, data);
  try {
    await chmod(path, 0o600);
  } catch {
    // See mkdirPrivate's platform note.
  }
}

function requireEnvValue(values: Record<string, string>, key: string): string {
  const value = values[key]?.trim();
  if (!value) {
    throw new Error(`Managed CLIProxyAPI configuration is missing ${key}`);
  }
  return value;
}

function parseManagedEnv(content: string): ManagedEnv {
  const values: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator <= 0) continue;
    values[line.slice(0, separator)] = line.slice(separator + 1);
  }

  return {
    apiKey: requireEnvValue(values, ENV_CLIENT_KEY),
    fableModel: values[ENV_FABLE_MODEL]?.trim() || CLI_PROXY_API_DEFAULTS.fableModel,
    sonnetModel: values[ENV_SONNET_MODEL]?.trim() || CLI_PROXY_API_DEFAULTS.sonnetModel,
    opusModel: values[ENV_OPUS_MODEL]?.trim() || CLI_PROXY_API_DEFAULTS.opusModel,
    haikuModel: values[ENV_HAIKU_MODEL]?.trim() || CLI_PROXY_API_DEFAULTS.haikuModel,
  };
}

function renderManagedEnv(apiKey: string): string {
  return [
    "# Managed by claudex-switch. Keep this directory private.",
    `${ENV_CLIENT_KEY}=${apiKey}`,
    `${ENV_FABLE_MODEL}=${CLI_PROXY_API_DEFAULTS.fableModel}`,
    `${ENV_SONNET_MODEL}=${CLI_PROXY_API_DEFAULTS.sonnetModel}`,
    `${ENV_OPUS_MODEL}=${CLI_PROXY_API_DEFAULTS.opusModel}`,
    `${ENV_HAIKU_MODEL}=${CLI_PROXY_API_DEFAULTS.haikuModel}`,
    "",
  ].join("\n");
}

function yaml(value: string): string {
  // JSON strings are valid YAML scalars and safely cover spaces, quotes, and
  // Windows paths without needing a YAML dependency for this small config.
  return JSON.stringify(value);
}

function renderRuntimeConfig(
  authDir: string,
  apiKey: string,
  port: number,
): string {
  return [
    `host: ${yaml(LOOPBACK_HOST)}`,
    `port: ${port}`,
    `auth-dir: ${yaml(authDir)}`,
    "api-keys:",
    `  - ${yaml(apiKey)}`,
    "remote-management:",
    "  allow-remote: false",
    '  secret-key: ""',
    "  disable-control-panel: true",
    "logging-to-file: false",
    "usage-statistics-enabled: false",
    "oauth-model-alias:",
    "  codex:",
    `    - name: ${yaml("gpt-5.6-terra")}`,
    `      alias: ${yaml(CLI_PROXY_API_DEFAULTS.subagentModel)}`,
    "      fork: true",
    "payload:",
    "  override:",
    "    - models:",
    `        - name: ${yaml(CLI_PROXY_API_DEFAULTS.subagentModel)}`,
    '          protocol: "codex"',
    "      params:",
    '        "reasoning.effort": "max"',
    "",
  ].join("\n");
}

export function createManagedCLIProxyAPIProfileId(): string {
  return randomUUID();
}

export async function initializeManagedCLIProxyAPI(
  profileId: string,
): Promise<void> {
  const paths = profilePaths(profileId);
  await mkdirPrivate(paths.dir);
  await mkdirPrivate(paths.authDir);
  // Exclusive creation makes first-use safe when two terminals race to launch
  // the same alias. A losing process must use the winner's key, never replace
  // a key already accepted by a daemon.
  const apiKey = randomBytes(32).toString("base64url");
  await writePrivateOnce(paths.envFile, renderManagedEnv(apiKey));
}

async function readManagedEnv(profileId: string): Promise<ManagedEnv> {
  const paths = profilePaths(profileId);
  const content = await readFile(paths.envFile, "utf-8");
  return parseManagedEnv(content);
}

async function readExistingManagedEnv(profileId: string): Promise<ManagedEnv> {
  const paths = profilePaths(profileId);
  if (!(await fileExists(paths.envFile))) {
    throw new Error(
      "Managed CLIProxyAPI data is missing. The account may have been purged; add it again instead of recreating its private login state.",
    );
  }
  try {
    return await readManagedEnv(profileId);
  } catch {
    throw new Error(
      "Managed CLIProxyAPI private environment is invalid. Do not recreate it automatically; add the account again.",
    );
  }
}

async function writeRuntimeConfig(
  profileId: string,
  port: number,
): Promise<ManagedEnv> {
  const paths = profilePaths(profileId);
  const config = await readManagedEnv(profileId);
  await writePrivate(
    paths.configFile,
    renderRuntimeConfig(paths.authDir, config.apiKey, port),
  );
  return config;
}

async function isExpectedRuntimeConfig(
  paths: ReturnType<typeof profilePaths>,
  state: ManagedRuntimeState | null,
  managed: ManagedEnv | null,
): Promise<boolean> {
  if (!managed) return false;
  try {
    const raw = await readFile(paths.configFile, "utf-8");
    const configuredPort = raw.match(/^port:\s*(\d+)\s*$/m)?.[1];
    const port = state?.port ?? Number(configuredPort);
    if (!Number.isInteger(port) || port < 1 || port > 65_535) return false;
    // We generate this small YAML document ourselves. Exact reconstruction
    // validates the host, auth-dir, literal local key and payload override as
    // a coherent config without introducing a YAML parser just for doctor.
    return raw === renderRuntimeConfig(paths.authDir, managed.apiKey, port);
  } catch {
    return false;
  }
}

export async function getLocalCLIProxyAPISettings(
  profile: LocalCLIProxyAPIProfileData,
  runtime: ManagedCLIProxyAPIRuntime,
): Promise<LocalCLIProxyAPISettings> {
  const config = await readManagedEnv(profile.profileId);
  return {
    apiKey: runtime.apiKey,
    baseUrl: runtime.baseUrl,
    model: resolveLocalCLIProxyAPIDefaultModelFromConfig(profile, config),
    fableModel: config.fableModel,
    sonnetModel: config.sonnetModel,
    opusModel: config.opusModel,
    haikuModel: config.haikuModel,
    subagentModel: CLI_PROXY_API_DEFAULTS.subagentModel,
  };
}

// Claude Code accepts a settings file path. Keeping the generated client API
// key in this 0600 file prevents it from appearing in argv, shell history, or
// the `Running ...` line that claudex-switch prints for a session.
export async function prepareLocalCLIProxyAPIClaudeSettings(
  profile: LocalCLIProxyAPIProfileData,
  runtime: ManagedCLIProxyAPIRuntime,
): Promise<string> {
  const config = await getLocalCLIProxyAPISettings(profile, runtime);
  const paths = profilePaths(profile.profileId);
  const env: Record<string, string> = {
    ANTHROPIC_API_KEY: config.apiKey,
    ANTHROPIC_BASE_URL: config.baseUrl,
    ANTHROPIC_AUTH_TOKEN: "",
    ANTHROPIC_MODEL: config.model,
    ANTHROPIC_DEFAULT_FABLE_MODEL: config.fableModel,
    ANTHROPIC_DEFAULT_SONNET_MODEL: config.sonnetModel,
    ANTHROPIC_DEFAULT_OPUS_MODEL: config.opusModel,
    ANTHROPIC_DEFAULT_HAIKU_MODEL: config.haikuModel,
    CLAUDE_CODE_SUBAGENT_MODEL: config.subagentModel,
    CLAUDE_CODE_SUBAGENT_MODEL_FORCE: "1",
  };
  // A global ~/.claude/settings.json can contain a short-lived OAuth token or
  // cloud-provider selector. Empty values in this higher-precedence settings
  // file neutralize them without modifying the user's global configuration.
  for (const key of CLAUDE_LOCAL_PROXY_NEUTRALIZED_ENV_KEYS) {
    env[key] = "";
  }
  await writePrivateJson(paths.claudeSettingsFile, {
    model: config.model,
    env,
  });
  return paths.claudeSettingsFile;
}

function resolveLocalCLIProxyAPIModelFromConfig(
  input: string,
  config: Pick<ManagedEnv, "fableModel" | "sonnetModel" | "opusModel" | "haikuModel">,
): string {
  const normalized = input.trim();
  switch (normalized.toLowerCase()) {
    case "fable":
      return config.fableModel;
    case "sonnet":
      return config.sonnetModel;
    case "opus":
      return config.opusModel;
    case "haiku":
      return config.haikuModel;
    default:
      return normalized;
  }
}

function resolveLocalCLIProxyAPIDefaultModelFromConfig(
  profile: LocalCLIProxyAPIProfileData,
  config: Pick<ManagedEnv, "fableModel" | "sonnetModel" | "opusModel" | "haikuModel">,
): string {
  // Newly created profiles persist the canonical initial GPT-6 id. Treat that
  // value as the Fable default so editing the generated private .env keeps
  // ordinary startup and `--model fable` on one source of truth. An explicit
  // stored model continues to win after `claudex-switch model`.
  if (profile.defaultModel === CLI_PROXY_API_DEFAULTS.fableModel) {
    return config.fableModel;
  }
  return resolveLocalCLIProxyAPIModelFromConfig(profile.defaultModel, config);
}

// Retain a synchronous default-only helper for callers that do not have a
// managed profile yet (notably initial UI text). Runtime commands use the
// profile-aware variant below so generated .env model mappings remain aligned.
export function resolveLocalCLIProxyAPIModel(input: string): string {
  return resolveLocalCLIProxyAPIModelFromConfig(input, CLI_PROXY_API_DEFAULTS);
}

export async function resolveManagedLocalCLIProxyAPIModel(
  profile: LocalCLIProxyAPIProfileData,
  input: string,
): Promise<string> {
  const config = await readExistingManagedEnv(profile.profileId);
  return resolveLocalCLIProxyAPIModelFromConfig(input, config);
}

export async function resolveManagedLocalCLIProxyAPIDefaultModel(
  profile: LocalCLIProxyAPIProfileData,
): Promise<string> {
  const config = await readExistingManagedEnv(profile.profileId);
  return resolveLocalCLIProxyAPIDefaultModelFromConfig(profile, config);
}

function baseUrl(port: number): string {
  return `http://${LOOPBACK_HOST}:${port}`;
}

function credentialHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    "x-api-key": apiKey,
  };
}

async function probeProxy(port: number, apiKey: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1_500);
  try {
    const response = await fetch(`${baseUrl(port)}/v1/models`, {
      headers: credentialHeaders(apiKey),
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function verifyManagedCLIProxyAPILive(
  runtime: ManagedCLIProxyAPIRuntime,
): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    // This is intentionally an explicit doctor-only request. `/v1/models`
    // proves local reachability but not account/model capability; this tiny
    // message is the opt-in live validation that may consume a small quota.
    const response = await fetch(`${runtime.baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        ...credentialHeaders(runtime.apiKey),
        "content-type": "application/json",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLI_PROXY_API_DEFAULTS.haikuModel,
        max_tokens: 1,
        messages: [{ role: "user", content: "Reply with OK." }],
      }),
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForProxy(port: number, apiKey: string): Promise<boolean> {
  const until = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < until) {
    if (await probeProxy(port, apiKey)) return true;
    await delay(150);
  }
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

async function portIsAvailable(port: number): Promise<boolean> {
  return new Promise((resolveAvailable) => {
    const server = createServer();
    const closeAndResolve = (available: boolean) => {
      server.close(() => resolveAvailable(available));
    };
    server.once("error", () => resolveAvailable(false));
    server.listen({ host: LOOPBACK_HOST, port, exclusive: true }, () => {
      closeAndResolve(true);
    });
  });
}

async function findAvailablePort(): Promise<number> {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen({ host: LOOPBACK_HOST, port: 0, exclusive: true }, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : null;
      server.close((error) => {
        if (error) {
          reject(error);
        } else if (port) {
          resolvePort(port);
        } else {
          reject(new Error("Could not allocate a loopback port"));
        }
      });
    });
  });
}

function isPidAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function processCommandLine(pid: number): Promise<string | null> {
  if (process.platform === "linux") {
    try {
      return (await readFile(`/proc/${pid}/cmdline`, "utf-8")).replaceAll("\0", " ");
    } catch {
      return null;
    }
  }

  try {
    const result = spawnSync("ps", ["-p", String(pid), "-o", "command="], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    if (result.status !== 0) return null;
    return result.stdout.trim() || null;
  } catch {
    return null;
  }
}

async function isOwnedProcess(state: ManagedRuntimeState): Promise<boolean> {
  if (!isPidAlive(state.pid)) return false;
  const command = await processCommandLine(state.pid);
  if (!command) return false;
  return (
    command.includes(state.configPath) &&
    command.includes(basename(state.binaryPath))
  );
}

async function readState(profileId: string): Promise<ManagedRuntimeState | null> {
  const paths = profilePaths(profileId);
  const state = await readJson<ManagedRuntimeState | null>(paths.stateFile, null);
  if (
    !state ||
    !Number.isInteger(state.pid) ||
    !Number.isInteger(state.port) ||
    state.port < 1 ||
    state.port > 65_535 ||
    typeof state.binaryPath !== "string" ||
    typeof state.configPath !== "string"
  ) {
    return null;
  }
  return state;
}

async function writeState(
  profileId: string,
  state: ManagedRuntimeState,
): Promise<void> {
  const paths = profilePaths(profileId);
  await writePrivateJson(paths.stateFile, state);
}

async function withLock<T>(
  lock: string,
  action: () => Promise<T>,
): Promise<T> {
  const until = Date.now() + LOCK_TIMEOUT_MS;
  const token = randomUUID();
  let createdAt = 0;

  await mkdirPrivate(dirname(lock));

  for (;;) {
    try {
      await mkdir(lock, { mode: 0o700 });
      createdAt = Date.now();
      try {
        await writePrivateJson(join(lock, "owner.json"), {
          pid: process.pid,
          token,
          createdAt,
          heartbeatAt: createdAt,
        } satisfies LockOwner);
      } catch (err) {
        // Do not strand an unreclaimable lock if the owner record cannot be
        // written after mkdir succeeds (e.g. a transient disk error).
        await rm(lock, { recursive: true, force: true });
        throw err;
      }
      break;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== "EEXIST") throw err;

      if (await canReclaimLock(lock)) {
        await rm(lock, { recursive: true, force: true });
        continue;
      }

      if (Date.now() >= until) {
        throw new Error("Timed out waiting for another CLIProxyAPI operation");
      }
      await delay(75);
    }
  }

  const heartbeat = setInterval(() => {
    void refreshOwnedLock(lock, token, createdAt);
  }, LOCK_HEARTBEAT_MS);

  try {
    return await action();
  } finally {
    clearInterval(heartbeat);
    await removeLockIfOwned(lock, token);
  }
}

async function refreshOwnedLock(
  lock: string,
  token: string,
  createdAt: number,
): Promise<void> {
  try {
    const owner = await readJson<LockOwner | null>(join(lock, "owner.json"), null);
    if (owner?.token !== token || owner.pid !== process.pid) return;
    await writePrivateJson(join(lock, "owner.json"), {
      pid: process.pid,
      token,
      createdAt,
      heartbeatAt: Date.now(),
    } satisfies LockOwner);
  } catch {
    // A missing/replaced lock must not be recreated by a stale heartbeat.
  }
}

async function removeLockIfOwned(lock: string, token: string): Promise<void> {
  try {
    const owner = await readJson<LockOwner | null>(join(lock, "owner.json"), null);
    if (owner?.token !== token || owner.pid !== process.pid) return;
    await rm(lock, { recursive: true, force: true });
  } catch {
    // Another process may have reclaimed the lock after an owner crash. Never
    // remove an unknown replacement from an old caller's finally block.
  }
}

async function canReclaimLock(lock: string): Promise<boolean> {
  const owner = await readJson<LockOwner | null>(
    join(lock, "owner.json"),
    null,
  );
  if (owner && Number.isInteger(owner.pid) && owner.pid > 0) {
    // Do not use an elapsed-time heuristic for a known live owner: Codex OAuth
    // can legitimately wait in a browser for far longer than a startup timeout.
    return !isPidAlive(owner.pid);
  }

  try {
    const lockStat = await stat(lock);
    // This only covers a process that died between creating the directory and
    // writing owner.json. A live owner is never reclaimed on age alone.
    return Date.now() - lockStat.mtimeMs > ORPHAN_LOCK_GRACE_MS;
  } catch {
    return false;
  }
}

async function withStartupLock<T>(
  profileId: string,
  action: () => Promise<T>,
): Promise<T> {
  return withLock(profilePaths(profileId).lock, action);
}

function proxyProcessEnvironment(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  for (const key of [
    "OPENAI_API_KEY",
    "CODEX_API_KEY",
    "CODEX_ACCESS_TOKEN",
    "ANTHROPIC_API_KEY",
    "ANTHROPIC_AUTH_TOKEN",
  ]) {
    delete env[key];
  }
  // CLIProxyAPI loads cwd/.env on startup and can select a remote auth/token
  // store from these deployment variables even when -config is supplied. Its
  // managed cwd is the private profile directory; scrub only those upstream
  // store/deployment selectors while retaining ordinary HTTPS proxy variables.
  for (const key of Object.keys(env)) {
    const upper = key.toUpperCase();
    if (
      upper === "HOME_JWT" ||
      upper === "MANAGEMENT_PASSWORD" ||
      upper === "DEPLOY" ||
      upper.startsWith("PGSTORE_") ||
      upper.startsWith("GITSTORE_") ||
      upper.startsWith("OBJECTSTORE_") ||
      upper.startsWith("DEPLOY_")
    ) {
      delete env[key];
    }
  }
  return env;
}

function startProxy(
  binaryPath: string,
  configPath: string,
  managedDirectory: string,
  spawnCommand: SpawnCommand = spawn,
): ChildProcess {
  const proc = spawnCommand(binaryPath, ["-config", configPath], {
    detached: true,
    stdio: "ignore",
    cwd: managedDirectory,
    env: proxyProcessEnvironment(),
  });
  // Avoid an unhandled error event when an executable disappears between
  // detection and launch; readiness probing will surface a recoverable error.
  proc.on("error", () => {});
  proc.unref?.();
  return proc;
}

function stopChildWeStarted(proc: ChildProcess): void {
  // This is intentionally limited to the direct child handle from this startup
  // attempt. We never signal a PID recovered from a state file.
  try {
    if (proc.pid && !proc.killed) proc.kill("SIGTERM");
  } catch {
    // The child may already have exited.
  }
}

export async function ensureManagedCLIProxyAPI(
  profile: ManagedCLIProxyAPIProfile,
): Promise<ManagedCLIProxyAPIRuntime> {
  assertProfileId(profile.profileId);

  return withStartupLock(profile.profileId, async () => {
    const paths = profilePaths(profile.profileId);
    const state = await readState(profile.profileId);
    const managed = await readExistingManagedEnv(profile.profileId);

    if (state) {
      const alive = isPidAlive(state.pid);
      const owned =
        alive &&
        state.binaryPath === profile.binaryPath &&
        state.configPath === paths.configFile &&
        (await isOwnedProcess(state));

      if (owned) {
        if (await probeProxy(state.port, managed.apiKey)) {
          return {
            port: state.port,
            baseUrl: baseUrl(state.port),
            apiKey: managed.apiKey,
          };
        }
        // Do not rewrite runtime.yaml or start a second daemon while a known
        // managed process still owns it. That would create two watchers using
        // the same auth directory and turn a recoverable failure into drift.
        throw new Error(
          "Managed CLIProxyAPI is running but unhealthy. Run `claudex-switch doctor <alias> --restart` after ending its sessions.",
        );
      }

      if (alive) {
        throw new Error(
          "Refusing to replace CLIProxyAPI state because its PID is not a verified managed process.",
        );
      }

      await rm(paths.stateFile, { force: true });
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const port = await findAvailablePort();
      await writeRuntimeConfig(profile.profileId, port);
      const proc = startProxy(profile.binaryPath, paths.configFile, paths.dir);
      const ready = await waitForProxy(port, managed.apiKey);
      if (!ready) {
        stopChildWeStarted(proc);
        continue;
      }
      if (!proc.pid) {
        stopChildWeStarted(proc);
        throw new Error("CLIProxyAPI started without a process id");
      }

      await writeState(profile.profileId, {
        pid: proc.pid,
        port,
        binaryPath: profile.binaryPath,
        configPath: paths.configFile,
        startedAt: Date.now(),
      });
      return { port, baseUrl: baseUrl(port), apiKey: managed.apiKey };
    }

    throw new Error(
      "CLIProxyAPI did not become ready. Check `claudex-switch doctor <alias>` after fixing its login or binary.",
    );
  });
}

async function managedCLIProxyAPIHasActiveLeases(
  profileId: string,
): Promise<boolean> {
  const paths = profilePaths(profileId);
  let entries;
  try {
    entries = await readdir(paths.sessionsDir, { withFileTypes: true });
  } catch {
    return false;
  }

  let active = false;
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    const leasePath = join(paths.sessionsDir, entry.name);
    const lease = await readJson<ManagedSessionLease | null>(leasePath, null);
    if (lease && Number.isInteger(lease.pid) && isPidAlive(lease.pid)) {
      active = true;
      continue;
    }
    // A crashed launcher cannot release its own lease; clear only the stale
    // record after its owning PID is gone.
    await rm(leasePath, { force: true });
  }
  return active;
}

export async function acquireManagedCLIProxyAPILease(
  profile: ManagedCLIProxyAPIProfile,
): Promise<ManagedCLIProxyAPILease> {
  assertProfileId(profile.profileId);

  return withStartupLock(profile.profileId, async () => {
    const paths = profilePaths(profile.profileId);
    await readExistingManagedEnv(profile.profileId);
    if (!(await hasManagedCLIProxyAPILogin(profile.profileId))) {
      throw new Error(
        "No valid CLIProxyAPI ChatGPT login is available. Run `claudex-switch refresh <alias>` before starting Claude Code.",
      );
    }
    await mkdirPrivate(paths.sessionsDir);
    const leasePath = join(paths.sessionsDir, `${randomUUID()}.json`);
    await writePrivateJson(leasePath, {
      pid: process.pid,
      createdAt: Date.now(),
    } satisfies ManagedSessionLease);
    return {
      async release(): Promise<void> {
        await rm(leasePath, { force: true });
      },
    };
  });
}

async function authFiles(path: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(path, { withFileTypes: true });
  } catch {
    return [];
  }

  const result: string[] = [];

  for (const entry of entries) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await authFiles(child)));
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    try {
      if ((await stat(child)).size > 0) result.push(child);
    } catch {
      // A concurrent refresh may rotate files; keep looking.
    }
  }
  return result;
}

function collectIdentityValues(value: unknown, result: string[] = []): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return result;
  }

  for (const [key, child] of Object.entries(value)) {
    const lower = key.toLowerCase();
    const identityKey = /^(email|sub|account_?id|user_?id|chatgpt_account_?id|chatgpt_user_?id|organization_?id)$/.test(
      lower,
    );
    if (identityKey && (typeof child === "string" || typeof child === "number")) {
      result.push(`${lower}=${String(child)}`);
    }
  }
  return result;
}

function decodeJwtPayload(token: unknown): Record<string, unknown> | null {
  if (typeof token !== "string") return null;
  const encoded = token.split(".")[1];
  if (!encoded) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

async function inspectAuthDirectory(
  authDir: string,
): Promise<{ valid: boolean; identity: string | null }> {
  const files = await authFiles(authDir);
  // One account per managed proxy prevents upstream round-robin across the
  // user's ChatGPT accounts. Treat any additional credential JSON as an error.
  if (files.length !== 1) return { valid: false, identity: null };

  try {
    // This is programmatic validation of a file generated in this managed auth
    // directory. Values are reduced to a one-way fingerprint and never logged,
    // saved verbatim, or copied into another auth store.
    const parsed = JSON.parse(await readFile(files[0]!, "utf-8")) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { valid: false, identity: null };
    }
    const auth = parsed as Record<string, unknown>;
    if (
      auth.type !== "codex" ||
      typeof auth.access_token !== "string" ||
      !auth.access_token.trim()
    ) {
      return { valid: false, identity: null };
    }
    const values = [
      ...collectIdentityValues(auth),
      ...collectIdentityValues(decodeJwtPayload(auth.id_token)),
    ].sort();
    if (values.length === 0) return { valid: false, identity: null };
    return {
      valid: true,
      identity: createHash("sha256").update(values.join("\n")).digest("hex"),
    };
  } catch {
    return { valid: false, identity: null };
  }
}

export async function hasManagedCLIProxyAPILogin(
  profileId: string,
): Promise<boolean> {
  return (await inspectAuthDirectory(profilePaths(profileId).authDir)).valid;
}

export async function runManagedCLIProxyAPICodexLogin(
  profile: ManagedCLIProxyAPIProfile,
  spawnCommand: SpawnCommand = spawn,
  expectedIdentity?: string,
): Promise<ManagedCLIProxyAPILoginResult> {
  assertProfileId(profile.profileId);
  const paths = profilePaths(profile.profileId);
  await mkdirPrivate(CLI_PROXY_API_DIR);

  return withStartupLock(profile.profileId, async () => withLock(CLI_PROXY_API_LOGIN_LOCK, async () => {
    if (await managedCLIProxyAPIHasActiveLeases(profile.profileId)) {
      throw new Error(
        "A Claude Code session launched by claudex-switch is still using this CLIProxyAPI account. End it before refreshing the login.",
      );
    }

    const stagingAuthDir = join(paths.dir, `.login-${randomUUID()}`);
    const loginConfig = join(paths.dir, "login-runtime.yaml");
    const apiPort = await findAvailablePort();
    if (!(await portIsAvailable(CODEX_OAUTH_CALLBACK_PORT))) {
      throw new Error(
        `CLIProxyAPI Codex OAuth needs localhost:${CODEX_OAUTH_CALLBACK_PORT}, but that callback port is already in use. Stop the process using it and retry.`,
      );
    }
    await mkdirPrivate(stagingAuthDir);
    const config = await readExistingManagedEnv(profile.profileId);
    await writePrivate(
      loginConfig,
      renderRuntimeConfig(stagingAuthDir, config.apiKey, apiPort),
    );

    const shimDir = createOpenShimDir();
    const env = proxyProcessEnvironment();
    if (shimDir) env.PATH = `${shimDir}:${env.PATH ?? ""}`;

    try {
      const proc = spawnCommand(
        profile.binaryPath,
        [
          "-config",
          loginConfig,
          "-codex-login",
        ],
        { stdio: "inherit", cwd: paths.dir, env },
      );
      const exitCode = await new Promise<number | null>((resolveCode, reject) => {
        proc.on("close", resolveCode);
        proc.on("error", reject);
      });
      const staged = await inspectAuthDirectory(stagingAuthDir);
      if (exitCode !== 0 || !staged.valid || !staged.identity) {
        return { success: false, identity: null, identityMismatch: false };
      }
      if (expectedIdentity && staged.identity !== expectedIdentity) {
        // Do this before touching the active auth directory. A different login
        // must not silently turn this one-account proxy into another account.
        return {
          success: false,
          identity: staged.identity,
          identityMismatch: true,
        };
      }

      // The existing daemon may retain the old auth directory inode and refresh
      // its token while we swap. With no claudex-managed session lease, safely
      // stop only a verified idle daemon before the atomic directory replace.
      await stopManagedCLIProxyAPIUnlocked(profile);

      const backup = join(paths.dir, `.auth-backup-${randomUUID()}`);
      let movedCurrent = false;
      try {
        if (await fileExists(paths.authDir)) {
          await rename(paths.authDir, backup);
          movedCurrent = true;
        }
        await rename(stagingAuthDir, paths.authDir);
        if (movedCurrent) await rm(backup, { recursive: true, force: true });
      } catch (err) {
        // A failed refresh/cancel must leave the old account usable, never add
        // the staged account to its pool.
        if (movedCurrent && !(await fileExists(paths.authDir))) {
          try {
            await rename(backup, paths.authDir);
          } catch {
            // Surface the original error below; do not guess which auth is safe.
          }
        }
        throw err;
      }
      return { success: true, identity: staged.identity, identityMismatch: false };
    } finally {
      cleanupOpenShimDir(shimDir);
      await rm(stagingAuthDir, { recursive: true, force: true });
      await rm(loginConfig, { force: true });
    }
  }));
}

export async function inspectManagedCLIProxyAPI(
  profile: ManagedCLIProxyAPIProfile,
  options: { probe?: boolean } = {},
): Promise<ManagedCLIProxyAPIStatus> {
  assertProfileId(profile.profileId);
  const paths = profilePaths(profile.profileId);
  let managed: ManagedEnv | null = null;
  try {
    managed = await readManagedEnv(profile.profileId);
  } catch {
    // A missing or malformed generated .env must not be reported as healthy.
  }
  const state = managed ? await readState(profile.profileId) : null;
  const configured = await isExpectedRuntimeConfig(paths, state, managed);
  const running = Boolean(
    state &&
      state.binaryPath === profile.binaryPath &&
      state.configPath === paths.configFile &&
      (await isOwnedProcess(state)),
  );
  const healthy =
    options.probe && running && state && managed
      ? await probeProxy(state.port, managed.apiKey)
      : null;
  return {
    installed: Boolean(findCLIProxyAPIBinary(profile.binaryPath)),
    loggedIn: await hasManagedCLIProxyAPILogin(profile.profileId),
    environmentValid: managed !== null,
    running,
    configured,
    healthy,
    port: state?.port ?? null,
  };
}

export async function hasActiveManagedCLIProxyAPI(
  profile: ManagedCLIProxyAPIProfile,
): Promise<boolean> {
  return managedCLIProxyAPIHasActiveLeases(profile.profileId);
}

async function waitForProcessExit(pid: number, timeoutMs = 5_000): Promise<boolean> {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    if (!isPidAlive(pid)) return true;
    await delay(50);
  }
  return !isPidAlive(pid);
}

async function stopManagedCLIProxyAPIUnlocked(
  profile: ManagedCLIProxyAPIProfile,
): Promise<boolean> {
  assertProfileId(profile.profileId);
  if (await managedCLIProxyAPIHasActiveLeases(profile.profileId)) {
    throw new Error(
      "A Claude Code session launched by claudex-switch is still using this CLIProxyAPI account. End it before stopping or purging the proxy.",
    );
  }

  const paths = profilePaths(profile.profileId);
  const state = await readState(profile.profileId);
  if (!state) return false;
  if (!isPidAlive(state.pid)) {
    await rm(paths.stateFile, { force: true });
    return false;
  }
  if (
    state.binaryPath !== profile.binaryPath ||
    state.configPath !== paths.configFile ||
    !(await isOwnedProcess(state))
  ) {
    throw new Error(
      "Refusing to stop a PID that is not a verified CLIProxyAPI process owned by this profile.",
    );
  }

  try {
    process.kill(state.pid, "SIGTERM");
  } catch (err) {
    throw new Error(
      `Could not stop the managed CLIProxyAPI process: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (!(await waitForProcessExit(state.pid))) {
    throw new Error(
      "Managed CLIProxyAPI did not stop in time; it was left intact and the profile was not removed.",
    );
  }
  await rm(paths.stateFile, { force: true });
  return true;
}

export async function stopManagedCLIProxyAPI(
  profile: ManagedCLIProxyAPIProfile,
): Promise<boolean> {
  return withStartupLock(profile.profileId, () =>
    stopManagedCLIProxyAPIUnlocked(profile),
  );
}

export async function restartManagedCLIProxyAPI(
  profile: ManagedCLIProxyAPIProfile,
): Promise<ManagedCLIProxyAPIRuntime> {
  await stopManagedCLIProxyAPI(profile);
  return ensureManagedCLIProxyAPI(profile);
}

export async function purgeManagedCLIProxyAPI(
  profile: ManagedCLIProxyAPIProfile,
): Promise<void> {
  assertProfileId(profile.profileId);
  const paths = profilePaths(profile.profileId);
  // A previously interrupted purge may already have removed managed state
  // while the regular profile registry still exists. Treat that exact missing
  // directory as idempotent rather than trying to mkdir a lock beneath it.
  if (!(await fileExists(paths.dir))) return;
  await withStartupLock(profile.profileId, async () => {
    await stopManagedCLIProxyAPIUnlocked(profile);
    await rm(paths.dir, { recursive: true, force: true });
  });
}

export async function cleanupFailedManagedCLIProxyAPI(
  profileId: string,
): Promise<void> {
  // Setup has no registered alias yet. This only removes the exact generated
  // profile directory and never touches a shared binary or another account.
  assertProfileId(profileId);
  const paths = profilePaths(profileId);
  await rm(paths.dir, { recursive: true, force: true });
  // The profile lock itself has already been released by the failed setup
  // operation. Best-effort removal keeps a cancelled first setup from leaving
  // an otherwise empty managed root behind. This is deliberately nonrecursive:
  // locks for another account make it a harmless no-op instead of a shared
  // state deletion.
  try {
    await rmdir(dirname(paths.lock));
  } catch {
    // The directory is either shared/non-empty or was already removed.
  }
}

function commandWorks(command: string): boolean {
  try {
    // CLIProxyAPI currently advertises its version in `--help`; `--version`
    // is not a supported flag in every released binary.
    return spawnSync(command, ["--help"], {
      stdio: "ignore",
    }).status === 0;
  } catch {
    return false;
  }
}

function resolvedCommand(command: string): string {
  if (command.includes("/") || command.includes("\\")) {
    return resolve(command);
  }

  const locator = platform() === "win32" ? "where" : "which";
  try {
    const result = spawnSync(locator, [command], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const first = result.stdout.trim().split(/\r?\n/)[0]?.trim();
    return first || command;
  } catch {
    return command;
  }
}

export function findCLIProxyAPIBinary(
  explicitPath?: string,
): string | null {
  const candidates = explicitPath
    ? [explicitPath]
    : ["cliproxyapi", "cli-proxy-api"];
  for (const candidate of candidates) {
    if (commandWorks(candidate)) return resolvedCommand(candidate);
  }
  return null;
}

export async function installCLIProxyAPIWithHomebrew(
  spawnCommand: SpawnCommand = spawn,
): Promise<boolean> {
  const proc = spawnCommand("brew", ["install", "cliproxyapi"], {
    stdio: "inherit",
    env: process.env,
  });
  const exitCode = await new Promise<number | null>((resolveCode, reject) => {
    proc.on("close", resolveCode);
    proc.on("error", reject);
  });
  return exitCode === 0;
}
