import { spawn, spawnSync, type ChildProcess } from "child_process";
import { realpathSync } from "fs";
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
  localCLIProxyAPIAuthEnv,
  localCLIProxyAPIExtraEnv,
  type LocalCLIProxyAPISettings,
} from "../claude/settings";
import type { LocalCLIProxyAPIProfileData } from "../../types";
import { assertCLIProxyAPICompatibility } from "./version";
import {
  CLI_PROXY_API_UPSTREAMS,
  OPENCODE_GO_ANTHROPIC_BASE_URL,
  OPENCODE_GO_OPENAI_BASE_URL,
  isOpenCodeGoMessagesModel,
  parseUpstream,
  isSupersededAntigravityClaude,
  matchAntigravityModel,
  antigravityModelBase,
  reconcileAntigravityModels,
  pickSubscriptionModels,
  type CLIProxyAPIModel,
  type CLIProxyAPIModelMap,
  type CLIProxyAPIUpstream,
} from "./upstreams";
import {
  hasSubscriptionLogin,
  isSubscriptionUpstream,
  listSubscriptionModels,
  loginSubscriptionPlugin,
  serveSubscriptionBridge,
  subscriptionLoginMethods,
  SUBSCRIPTION_AUTH_FILE,
} from "../subscription-plugins";
import { select } from "@inquirer/prompts";
import { info } from "../../lib/ui";

export const CLI_PROXY_API_DEFAULTS = {
  ...CLI_PROXY_API_UPSTREAMS.codex.defaults,
  subagentModel: "claudex-terra-max",
} as const;

const ENV_CLIENT_KEY = "CLAUDEX_CLIPROXYAPI_CLIENT_API_KEY";
const ENV_FABLE_MODEL = "CLAUDEX_CLIPROXYAPI_FABLE_MODEL";
const ENV_SONNET_MODEL = "CLAUDEX_CLIPROXYAPI_SONNET_MODEL";
const ENV_OPUS_MODEL = "CLAUDEX_CLIPROXYAPI_OPUS_MODEL";
const ENV_HAIKU_MODEL = "CLAUDEX_CLIPROXYAPI_HAIKU_MODEL";
// Absent in .env files written before other upstreams existed (= codex).
const ENV_UPSTREAM = "CLAUDEX_CLIPROXYAPI_UPSTREAM";
// API-key upstreams (OpenCode Go): the upstream key and the models to expose.
const ENV_UPSTREAM_KEY = "CLAUDEX_CLIPROXYAPI_UPSTREAM_KEY";
const ENV_UPSTREAM_MODELS = "CLAUDEX_CLIPROXYAPI_UPSTREAM_MODELS";
const ENV_SUBSCRIPTION_PORT = "CLAUDEX_CLIPROXYAPI_SUBSCRIPTION_PORT";
// Subscription catalogs' context windows, as id=tokens pairs.
const ENV_UPSTREAM_CONTEXT = "CLAUDEX_CLIPROXYAPI_UPSTREAM_CONTEXT";
const ENV_ANTIGRAVITY_SENSITIVE_WORDS = "CLAUDEX_CLIPROXYAPI_ANTIGRAVITY_SENSITIVE_WORDS";
const ANTIGRAVITY_SENSITIVE_WORDS = ["Claude Agent SDK", "Claude Code"];
// Older accounts had the then-default Luna written into their .env. That
// value was never a user choice, so read it as "use the current default".
const LEGACY_HAIKU_DEFAULT = "gpt-5.6-luna";
const STARTUP_TIMEOUT_MS = 12_000;
// Measured 2026-10-22 on 7.3.20: built-in list at ~2s, remote catalog at ~6s.
export const ANTIGRAVITY_CATALOG = { settleMs: 12_000 };
const settledAntigravityDaemons = new Set<string>();
const LOCK_TIMEOUT_MS = 20_000;
const ORPHAN_LOCK_GRACE_MS = 60_000;
const LOCK_HEARTBEAT_MS = 10_000;
const LOOPBACK_HOST = "127.0.0.1";
const PROFILE_ID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

interface ManagedEnv extends CLIProxyAPIModelMap {
  apiKey: string;
  upstream: CLIProxyAPIUpstream;
  upstreamKey: string | null;
  upstreamModels: string[];
  // null: written before windows were recorded; an idle daemon restarts to fetch them.
  upstreamContext: Record<string, number> | null;
  antigravitySensitiveWords: string[];
  subscriptionPort: number | null;
}

export interface ManagedCLIProxyAPISetup {
  upstream: CLIProxyAPIUpstream;
  models?: CLIProxyAPIModelMap;
  upstreamKey?: string;
  upstreamModels?: string[];
  upstreamContext?: Record<string, number>;
  antigravitySensitiveWords?: string[];
  subscriptionPort?: number;
}

// Bump when the subscription bridge changes behavior: 1 = WorkBuddy non-stream chats are collected from a stream.
const SUBSCRIPTION_BRIDGE_REVISION = 1;

interface ManagedRuntimeState {
  pid: number;
  port: number;
  binaryPath: string;
  configPath: string;
  startedAt: number;
  // Subscription daemons outlive upgrades; a bridge older than SUBSCRIPTION_BRIDGE_REVISION restarts when idle.
  bridgeRevision?: number;
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
  models?: CLIProxyAPIModel[];
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

/** Non-secret account the login must belong to (a linked Codex alias). */
export interface ExpectedCLIProxyAPIAccount {
  accountId?: string | null;
  email?: string | null;
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

  const upstream = parseUpstream(values[ENV_UPSTREAM]?.trim());
  const defaults = CLI_PROXY_API_UPSTREAMS[upstream].defaults;
  const upstreamKey = values[ENV_UPSTREAM_KEY]?.trim() || null;
  const subscriptionPort = values[ENV_SUBSCRIPTION_PORT] ? Number(values[ENV_SUBSCRIPTION_PORT]) : null;
  if (subscriptionPort !== null && (!Number.isInteger(subscriptionPort) || subscriptionPort < 1 || subscriptionPort > 65535)) {
    throw new Error("Invalid subscription bridge port");
  }
  if (upstream === "opencode-go" && !upstreamKey) {
    throw new Error(`Managed CLIProxyAPI configuration is missing ${ENV_UPSTREAM_KEY}`);
  }
  return {
    apiKey: requireEnvValue(values, ENV_CLIENT_KEY),
    upstream,
    upstreamKey,
    subscriptionPort,
    antigravitySensitiveWords: (values[ENV_ANTIGRAVITY_SENSITIVE_WORDS] ?? ANTIGRAVITY_SENSITIVE_WORDS.join(","))
      .split(",").map((word) => word.trim()).filter(Boolean),
    upstreamModels: (values[ENV_UPSTREAM_MODELS] ?? "")
      .split(",")
      .map((model) => model.trim())
      .filter(Boolean),
    upstreamContext: values[ENV_UPSTREAM_CONTEXT] === undefined ? null : Object.fromEntries(values[ENV_UPSTREAM_CONTEXT].split(",").flatMap((pair) => {
      const separator = pair.lastIndexOf("=");
      const tokens = Number(pair.slice(separator + 1));
      return separator > 0 && Number.isSafeInteger(tokens) && tokens > 0 ? [[pair.slice(0, separator).trim(), tokens]] : [];
    })),
    fableModel: values[ENV_FABLE_MODEL]?.trim() || defaults.fableModel,
    sonnetModel: values[ENV_SONNET_MODEL]?.trim() || defaults.sonnetModel,
    opusModel: values[ENV_OPUS_MODEL]?.trim() || defaults.opusModel,
    haikuModel: currentHaikuModel(upstream, values[ENV_HAIKU_MODEL]),
  };
}

function currentHaikuModel(upstream: CLIProxyAPIUpstream, value: string | undefined): string {
  const model = value?.trim();
  const fallback = CLI_PROXY_API_UPSTREAMS[upstream].defaults.haikuModel;
  if (!model || (upstream === "codex" && model === LEGACY_HAIKU_DEFAULT)) {
    return fallback;
  }
  return model;
}

function renderManagedEnv(
  apiKey: string,
  setup: ManagedCLIProxyAPISetup = { upstream: "codex" },
): string {
  const models = setup.models ?? CLI_PROXY_API_UPSTREAMS[setup.upstream].defaults;
  return [
    "# Managed by claudex-switch. Keep this directory private.",
    `${ENV_CLIENT_KEY}=${apiKey}`,
    // Codex files keep their original shape; the marker is only needed to
    // tell the newer upstreams apart.
    ...(setup.upstream === "codex" ? [] : [`${ENV_UPSTREAM}=${setup.upstream}`]),
    ...(setup.upstream === "antigravity" ? [
      `${ENV_ANTIGRAVITY_SENSITIVE_WORDS}=${(setup.antigravitySensitiveWords ?? ANTIGRAVITY_SENSITIVE_WORDS).join(",")}`,
    ] : []),
    ...(setup.upstreamKey ? [`${ENV_UPSTREAM_KEY}=${setup.upstreamKey}`] : []),
    ...(setup.subscriptionPort ? [`${ENV_SUBSCRIPTION_PORT}=${setup.subscriptionPort}`] : []),
    ...(setup.upstreamModels?.length
      ? [`${ENV_UPSTREAM_MODELS}=${setup.upstreamModels.join(",")}`]
      : []),
    ...(setup.upstreamContext
      ? [`${ENV_UPSTREAM_CONTEXT}=${Object.entries(setup.upstreamContext).map(([id, tokens]) => `${id}=${tokens}`).join(",")}`]
      : []),
    `${ENV_FABLE_MODEL}=${models.fableModel}`,
    `${ENV_SONNET_MODEL}=${models.sonnetModel}`,
    `${ENV_OPUS_MODEL}=${models.opusModel}`,
    `${ENV_HAIKU_MODEL}=${models.haikuModel}`,
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
  managed: ManagedEnv,
  port: number,
): string {
  const header = [
    `host: ${yaml(LOOPBACK_HOST)}`,
    `port: ${port}`,
    `auth-dir: ${yaml(authDir)}`,
    "api-keys:",
    `  - ${yaml(managed.apiKey)}`,
    "remote-management:",
    "  allow-remote: false",
    '  secret-key: ""',
    "  disable-control-panel: true",
    "logging-to-file: false",
    "usage-statistics-enabled: false",
  ];
  if (isSubscriptionUpstream(managed.upstream)) {
    if (!managed.subscriptionPort || !managed.upstreamModels.length) {
      throw new Error("Subscription models and bridge port must be discovered before proxy startup.");
    }
    return [...header,
      "openai-compatibility:",
      `  - name: ${yaml(managed.upstream)}`,
      `    base-url: ${yaml(`${baseUrl(managed.subscriptionPort)}/v1`)}`,
      "    headers:",
      `      x-claudex-session: ${yaml("$X-Claude-Code-Session-Id")}`,
      "    api-key-entries:", `      - api-key: ${yaml(managed.apiKey)}`,
      "    models:",
      ...managed.upstreamModels.flatMap((id) => [`      - name: ${yaml(id)}`, `        alias: ${yaml(id)}`]),
      "",
    ].join("\n");
  }
  if (managed.upstream === "antigravity") {
    // CLIProxyAPI applies this only to system instructions, preserving user
    // text and tool results. Both Claude Code and Agent SDK identity lines
    // otherwise trigger upstream RESOURCE_EXHAUSTED despite available quota.
    // The legacy key is accepted by both the supported 7.x and 8.x binaries.
    return [...header, "antigravity:",
      ...(managed.antigravitySensitiveWords.length
        ? ["  sensitive-words:", ...managed.antigravitySensitiveWords.map((word) => `    - ${yaml(word)}`)]
        : ["  sensitive-words: []"]),
      "",
    ].join("\n");
  }
  if (managed.upstream === "opencode-go") {
    return [...header, ...renderOpenCodeGoUpstream(managed), ""].join("\n");
  }
  // Codex: byte-for-byte what earlier releases generated, so doctor does not
  // report drift for existing accounts.
  return [
    ...header,
    "oauth-model-alias:",
    "  codex:",
    `    - name: ${yaml(CLI_PROXY_API_DEFAULTS.opusModel)}`,
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

// OpenCode Go answers most models over OpenAI chat completions and a few only
// over Anthropic Messages, so each model is routed to the provider entry that
// speaks its wire format. CLIProxyAPI translates Claude Code's requests.
function renderOpenCodeGoUpstream(
  managed: Pick<ManagedEnv, "upstreamKey" | "upstreamModels" | keyof CLIProxyAPIModelMap>,
): string[] {
  const key = managed.upstreamKey ?? "";
  const models = [
    ...new Set([
      managed.fableModel,
      managed.opusModel,
      managed.sonnetModel,
      managed.haikuModel,
      ...managed.upstreamModels,
    ]),
  ];
  const chat = models.filter((model) => !isOpenCodeGoMessagesModel(model));
  const messages = models.filter(isOpenCodeGoMessagesModel);
  const modelLines = (list: string[], indent: string) =>
    list.flatMap((model) => [
      `${indent}- name: ${yaml(model)}`,
      `${indent}  alias: ${yaml(model)}`,
    ]);
  // Go rejects requests without a stable per-conversation id
  // (`x-opencode-session`, used for cache-friendly routing). Claude Code sends
  // one per session; "$" makes CLIProxyAPI copy it from the incoming request.
  const sessionHeader = [
    "    headers:",
    `      ${yaml("x-opencode-session")}: ${yaml("$X-Claude-Code-Session-Id")}`,
  ];
  const lines: string[] = [];
  if (chat.length > 0) {
    lines.push(
      "openai-compatibility:",
      `  - name: ${yaml("opencode-go")}`,
      `    base-url: ${yaml(OPENCODE_GO_OPENAI_BASE_URL)}`,
      ...sessionHeader,
      "    api-key-entries:",
      `      - api-key: ${yaml(key)}`,
      "    models:",
      ...modelLines(chat, "      "),
    );
  }
  if (messages.length > 0) {
    lines.push(
      "claude-api-key:",
      `  - api-key: ${yaml(key)}`,
      `    base-url: ${yaml(OPENCODE_GO_ANTHROPIC_BASE_URL)}`,
      ...sessionHeader,
      // CLIProxyAPI sends Bearer to a custom base-url; Go's Messages route
      // reads the key from x-api-key like Anthropic's own API.
      `      ${yaml("x-api-key")}: ${yaml(key)}`,
      "    models:",
      ...modelLines(messages, "      "),
    );
  }
  return lines;
}

export function createManagedCLIProxyAPIProfileId(): string {
  return randomUUID();
}

export async function initializeManagedCLIProxyAPI(
  profileId: string,
  setup: ManagedCLIProxyAPISetup = { upstream: "codex" },
): Promise<void> {
  const paths = profilePaths(profileId);
  await mkdirPrivate(paths.dir);
  await mkdirPrivate(paths.authDir);
  // Exclusive creation makes first-use safe when two terminals race to launch
  // the same alias. A losing process must use the winner's key, never replace
  // a key already accepted by a daemon.
  const apiKey = randomBytes(32).toString("base64url");
  await writePrivateOnce(paths.envFile, renderManagedEnv(apiKey, setup));
}

/**
 * Rewrite the private .env with new model mappings or upstream key while
 * keeping its generated client key. Callers stop an idle daemon first when the
 * change affects runtime.yaml; a running one keeps its loaded config.
 */
export async function updateManagedCLIProxyAPISetup(
  profileId: string,
  patch: Partial<Omit<ManagedCLIProxyAPISetup, "upstream">>,
): Promise<void> {
  const paths = profilePaths(profileId);
  const current = await readExistingManagedEnv(profileId);
  await writePrivate(
    paths.envFile,
    renderManagedEnv(current.apiKey, {
      upstream: current.upstream,
      models: patch.models ?? current,
      upstreamKey: patch.upstreamKey ?? current.upstreamKey ?? undefined,
      upstreamModels: patch.upstreamModels ?? current.upstreamModels,
      upstreamContext: patch.upstreamContext ?? current.upstreamContext ?? undefined,
      antigravitySensitiveWords: patch.antigravitySensitiveWords ?? current.antigravitySensitiveWords,
      subscriptionPort: patch.subscriptionPort ?? current.subscriptionPort ?? undefined,
    }),
  );
}

export async function readManagedCLIProxyAPIUpstream(
  profileId: string,
): Promise<{ upstream: CLIProxyAPIUpstream; upstreamKey: string | null } | null> {
  try {
    const config = await readManagedEnv(profileId);
    return { upstream: config.upstream, upstreamKey: config.upstreamKey };
  } catch {
    return null;
  }
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
    renderRuntimeConfig(paths.authDir, config, port),
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
    return raw === renderRuntimeConfig(paths.authDir, managed, port);
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
    model: await resolveManagedLocalCLIProxyAPIDefaultModel(profile),
    fableModel: config.fableModel,
    sonnetModel: config.sonnetModel,
    opusModel: config.opusModel,
    haikuModel: config.haikuModel,
    subagentModel: config.upstream === "codex" ? CLI_PROXY_API_DEFAULTS.subagentModel : null,
  };
}

// Claude Code's own current IDs; it sends one when the shared settings saved a
// /model default (2026-10-22: "claude-opus-5-5" → "unknown provider").
const CLAUDE_CODE_MODEL_IDS = ["claude-fable-5-1", "claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"];

// A saved Claude model or a version-specific agent can still use a bare
// Anthropic ID. Map it to the same registered version, including its tier;
// an unlisted Claude version falls back to its family's tier mapping.
export function antigravityModelOverrides(
  ids: string[],
  tiers: Pick<ManagedEnv, "fableModel" | "sonnetModel" | "opusModel" | "haikuModel">,
  savedModel?: string,
): Record<string, string> {
  const overrides: Record<string, string> = {};
  for (const id of ids) {
    const bare = antigravityModelBase(id);
    if (bare !== id && !ids.includes(bare)) overrides[bare] = matchAntigravityModel(bare, ids)!;
  }
  // A pinned retired Claude version would only get "no longer available".
  for (const id of ids) {
    const family = id.match(/^claude-(fable|opus|sonnet|haiku)-/i)?.[1]?.toLowerCase();
    if (family && isSupersededAntigravityClaude(id, ids)) {
      overrides[id] = resolveLocalCLIProxyAPIModelFromConfig(family, tiers);
      const bare = antigravityModelBase(id);
      if (overrides[bare]) overrides[bare] = overrides[id];
    }
  }
  for (const id of [...CLAUDE_CODE_MODEL_IDS, typeof savedModel === "string" ? savedModel.trim() : ""]) {
    const family = id.match(/^claude-(fable|opus|sonnet|haiku)-\d/i)?.[1]?.toLowerCase();
    if (!family || ids.includes(id) || overrides[id]) continue;
    overrides[id] = matchAntigravityModel(id, ids)
      ?? resolveLocalCLIProxyAPIModelFromConfig(family, tiers);
  }
  return overrides;
}

// WorkBuddy AI listed it free (x0.00) with a 1M window on 2026-10-23.
const WORKBUDDY_AUTO_MODE_MODEL = "deepseek-v4.1-flash";

// Claude Code accepts a settings file path. Keeping the generated client API
// key in this 0600 file prevents it from appearing in argv, shell history, or
// the `Running ...` line that claudex-switch prints for a session.
export async function prepareLocalCLIProxyAPIClaudeSettings(
  profile: LocalCLIProxyAPIProfileData,
  runtime: ManagedCLIProxyAPIRuntime,
  options: { inheritModel?: boolean; savedModel?: string } = {},
): Promise<string> {
  const config = await getLocalCLIProxyAPISettings(profile, runtime);
  const paths = profilePaths(profile.profileId);
  const env: Record<string, string> = {
    ...localCLIProxyAPIAuthEnv(config.apiKey),
    ANTHROPIC_BASE_URL: config.baseUrl,
    ANTHROPIC_MODEL: options.inheritModel ? "" : config.model,
    ANTHROPIC_DEFAULT_FABLE_MODEL: config.fableModel,
    ANTHROPIC_DEFAULT_SONNET_MODEL: config.sonnetModel,
    ANTHROPIC_DEFAULT_OPUS_MODEL: config.opusModel,
    ANTHROPIC_DEFAULT_HAIKU_MODEL: config.haikuModel,
    // Empty values also neutralize a subagent pin left in the global settings
    // by a ChatGPT-backed account when this upstream does not use one.
    CLAUDE_CODE_SUBAGENT_MODEL: config.subagentModel ?? "",
    CLAUDE_CODE_SUBAGENT_MODEL_FORCE: config.subagentModel ? "1" : "",
  };
  // A global ~/.claude/settings.json can contain a short-lived OAuth token or
  // cloud-provider selector. Empty values in this higher-precedence settings
  // file neutralize them without modifying the user's global configuration.
  for (const key of CLAUDE_LOCAL_PROXY_NEUTRALIZED_ENV_KEYS) {
    env[key] = "";
  }
  const overrides = runtime.models
    ? profile.upstream === "antigravity"
      ? antigravityModelOverrides(runtime.models.map(({ id }) => id), config, options.savedModel)
      : subscriptionModelOverrides(runtime.models.map(({ id }) => id), config, options.savedModel)
    : {};
  const windows = runtime.models && isSubscriptionUpstream(profile.upstream)
    ? subscriptionCompactWindows((await readExistingManagedEnv(profile.profileId)).upstreamContext ?? {}, runtime.models.map(({ id }) => id), overrides)
    : null;
  if (windows) env.CLAUDE_CODE_MAX_CONTEXT_TOKENS = String(windows.maxContext);
  // The auto mode classifier otherwise follows the sonnet tier, WorkBuddy's
  // Auto router (unknown credits, 176K), on every tool call it judges.
  if ((profile.upstream === "workbuddy" || profile.upstream === "workbuddy-ai")
    && runtime.models?.some(({ id }) => id === WORKBUDDY_AUTO_MODE_MODEL)) {
    env.CLAUDE_CODE_AUTO_MODE_MODEL = WORKBUDDY_AUTO_MODE_MODEL;
  }
  // Extra env the user attached to this profile (e.g. CLAUDE_CODE_EFFORT_LEVEL)
  // is applied after the managed keys, and can never shadow one of them.
  for (const [key, value] of Object.entries(localCLIProxyAPIExtraEnv(profile.env))) {
    env[key] = value;
  }
  await writePrivateJson(paths.claudeSettingsFile, {
    model: options.inheritModel ? undefined : config.model,
    ...(runtime.models ? {
      // Curate the picker from this proxy's catalog. This removes the duplicate
      // Fable→Opus row and exposes Gemini without inventing Claude model IDs.
      modelPicker: {
        replaceBuiltInOptions: true,
        // Retired Claude versions only answer "no longer available".
        options: runtime.models.filter((model) => !/image/i.test(model.id)
          && (profile.upstream !== "antigravity"
            || !isSupersededAntigravityClaude(model.id, runtime.models!.map(({ id }) => id)))).map((model) => ({
          model: model.id,
          label: model.display_name ?? model.id,
          description: `${CLI_PROXY_API_UPSTREAMS[profile.upstream ?? "codex"].label} · ${model.id}`,
        })),
      },
      modelOverrides: overrides,
      ...(windows ? { modelSettings: windows.modelSettings } : {}),
    } : {}),
    env,
  });
  return paths.claudeSettingsFile;
}

// Claude Code assumes 200K for a model ID it does not know, so a 1M model
// compacted at 72K under a 40% override. CLAUDE_CODE_MAX_CONTEXT_TOKENS raises
// that assumption for every unknown ID; each model's autoCompactWindow then
// caps it at the window the subscription reports (Claude Code takes 100K-1M).
// A [1m] suffix instead switches off proactive compaction (2.1.309).
const UNKNOWN_MODEL_WINDOW = 200_000;
const MIN_COMPACT_WINDOW = 100_000;
const MAX_COMPACT_WINDOW = 1_000_000;

function subscriptionCompactWindows(
  context: Record<string, number>,
  ids: string[],
  overrides: Record<string, string>,
): { maxContext: number; modelSettings: Record<string, { autoCompactWindow: number }> } | null {
  if (!ids.some((id) => context[id])) return null;
  const windowOf = (id: string) =>
    Math.min(MAX_COMPACT_WINDOW, Math.max(MIN_COMPACT_WINDOW, context[id] ?? UNKNOWN_MODEL_WINDOW));
  const modelSettings = Object.fromEntries([
    ...ids.map((id) => [id, { autoCompactWindow: windowOf(id) }] as const),
    // Claude Code's own IDs are mapped to a catalog model; compact at its window.
    ...Object.entries(overrides).map(([id, target]) => [id, { autoCompactWindow: windowOf(target) }] as const),
  ]);
  return { maxContext: Math.max(...ids.map(windowOf)), modelSettings };
}

function subscriptionModelOverrides(ids: string[], tiers: CLIProxyAPIModelMap, savedModel?: string): Record<string, string> {
  const overrides: Record<string, string> = {};
  for (const id of [...CLAUDE_CODE_MODEL_IDS, ...(savedModel ? [savedModel] : [])]) {
    if (ids.includes(id)) continue;
    const family = id.match(/^claude-(fable|opus|sonnet|haiku)(?:-|$)/i)?.[1]?.toLowerCase();
    overrides[id] = family ? tiers[`${family}Model` as keyof CLIProxyAPIModelMap] : tiers.fableModel;
  }
  return overrides;
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
  const model = resolveLocalCLIProxyAPIModelFromConfig(input, config);
  if (isSubscriptionUpstream(config.upstream)) {
    if (config.upstreamModels.includes(model)) return model;
    throw new Error(`${CLI_PROXY_API_UPSTREAMS[config.upstream].label} model "${input}" is not in the account catalog. Use /model or one of: ${config.upstreamModels.join(", ")}`);
  }
  if (config.upstream !== "antigravity") return model;
  if (!config.upstreamModels.length) {
    throw new Error("Antigravity's model catalog has not been synchronized. Start this account with --run --cliproxy claudecode once before setting its default model.");
  }
  const matched = matchAntigravityModel(model, config.upstreamModels);
  if (matched) return matched;
  throw new Error(`Antigravity model "${input}" is not in the proxy catalog. Use /model or one of: ${config.upstreamModels.join(", ")}`);
}

export async function resolveManagedLocalCLIProxyAPIDefaultModel(
  profile: LocalCLIProxyAPIProfileData,
): Promise<string> {
  const config = await readExistingManagedEnv(profile.profileId);
  const model = resolveLocalCLIProxyAPIDefaultModelFromConfig(profile, config);
  if (isSubscriptionUpstream(config.upstream)) return config.upstreamModels.includes(model) ? model : config.fableModel;
  if (config.upstream !== "antigravity") return model;
  return matchAntigravityModel(model, config.upstreamModels) ?? config.fableModel;
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

/** Model ids the running proxy exposes (for picking an upstream's defaults). */
export async function listManagedCLIProxyAPIModels(
  runtime: ManagedCLIProxyAPIRuntime,
): Promise<string[]> {
  return (await listManagedCLIProxyAPICatalog(runtime)).map((model) => model.id);
}

async function listManagedCLIProxyAPICatalog(
  runtime: ManagedCLIProxyAPIRuntime,
): Promise<CLIProxyAPIModel[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`${runtime.baseUrl}/v1/models`, {
      headers: credentialHeaders(runtime.apiKey),
      signal: controller.signal,
    });
    if (!response.ok) return [];
    const body = (await response.json()) as { data?: Array<{ id?: unknown; display_name?: unknown }> };
    const models = (body.data ?? []).flatMap((model) =>
      typeof model.id === "string" && model.id.trim()
        ? [{ id: model.id, ...(typeof model.display_name === "string" ? { display_name: model.display_name } : {}) }]
        : [],
    );
    return [...new Map(models.map((model) => [model.id, model])).values()]
      .sort((a, b) => a.id.localeCompare(b.id));
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

// Called under the lifecycle lock for new and reused daemons, before exposing
// any model to a client. Failure leaves existing mappings and sessions intact.
async function syncAntigravityModels(
  profileId: string,
  managed: ManagedEnv,
  runtime: ManagedCLIProxyAPIRuntime,
  startedAt: number,
): Promise<ManagedCLIProxyAPIRuntime> {
  if (isSubscriptionUpstream(managed.upstream)) {
    const catalog = await listManagedCLIProxyAPICatalog({ ...runtime, baseUrl: baseUrl(managed.subscriptionPort!) });
    const models = catalog.filter(({ id }) => managed.upstreamModels.includes(id));
    if (!models.length) throw new Error("The subscription adapter has no available models. Check its login, then restart this account's proxy.");
    return { ...runtime, models };
  }
  if (managed.upstream !== "antigravity") return runtime;
  // HTTP readiness can precede auth/model registration on a new daemon. Then
  // CLIProxyAPI first serves the list compiled into its binary (retired Opus
  // 4.6, no Opus 5.5) and swaps in its remote catalog seconds later. A young
  // daemon is therefore polled until its list changes or the window closes.
  const hasClaude = (list: CLIProxyAPIModel[]) => list.some(({ id }) => /^claude-(opus|sonnet)-/i.test(id));
  const key = (list: CLIProxyAPIModel[]) => list.map(({ id }) => id).join(",");
  // First use syncs twice in one process (alias creation, then launch).
  const daemon = `${profileId}:${startedAt}`;
  const settleUntil = settledAntigravityDaemons.has(daemon) ? 0 : startedAt + ANTIGRAVITY_CATALOG.settleMs;
  let models = await listManagedCLIProxyAPICatalog(runtime);
  let first = hasClaude(models) ? key(models) : null;
  for (let attempt = 0; ; attempt += 1) {
    const young = Date.now() < settleUntil;
    if (hasClaude(models) && (!young || key(models) !== first)) break;
    if (!young && attempt >= 3) break;
    await delay(250);
    models = await listManagedCLIProxyAPICatalog(runtime);
    first ??= hasClaude(models) ? key(models) : null;
  }
  settledAntigravityDaemons.add(daemon);
  const ids = [...new Set(models.map((model) => model.id))];
  const mappings = reconcileAntigravityModels(ids, managed);
  if (Object.entries(mappings).some(([tier, id]) => managed[tier as keyof CLIProxyAPIModelMap] !== id)
    || JSON.stringify(ids) !== JSON.stringify(managed.upstreamModels)) {
    await updateManagedCLIProxyAPISetup(profileId, { models: mappings, upstreamModels: ids });
  }
  return { ...runtime, models };
}

export async function verifyManagedCLIProxyAPILive(
  runtime: ManagedCLIProxyAPIRuntime,
  model: string,
): Promise<boolean> {
  return (await probeManagedCLIProxyAPILive(runtime, model)).ok;
}

export async function probeManagedCLIProxyAPILive(
  runtime: ManagedCLIProxyAPIRuntime,
  model: string,
): Promise<{ ok: boolean; status: number | null }> {
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
        // What Claude Code itself sends; OpenCode Go requires a session id.
        "X-Claude-Code-Session-Id": randomUUID(),
      },
      body: JSON.stringify({
        model,
        max_tokens: 1,
        messages: [{ role: "user", content: "Reply with OK." }],
      }),
      signal: controller.signal,
    });
    return { ok: response.ok, status: response.status };
  } catch {
    return { ok: false, status: null };
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
    "GEMINI_API_KEY",
    "GOOGLE_API_KEY",
    "OPENCODE_API_KEY",
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
  subscriptionProfileId?: string,
): ChildProcess {
  const script = process.argv[1];
  // Node preserves an extensionless installed bin symlink in argv[1]. Bun
  // compiled executables instead carry a virtual $bunfs entrypoint.
  const scriptEntrypoint = subscriptionProfileId && script && !script.includes("$bunfs")
    && (!process.versions.bun || /\.[cm]?[jt]s$/.test(realpathSync(script)));
  const args = subscriptionProfileId
    ? [...(scriptEntrypoint ? [resolve(script!)] : []),
      "__subscription-proxy", subscriptionProfileId, binaryPath, configPath]
    : ["-config", configPath];
  const proc = spawnCommand(subscriptionProfileId ? process.execPath : binaryPath, args, {
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

/** One supervised process owns both the adapter and converter for a profile. */
export async function runManagedSubscriptionProxy(profileId: string, binaryPath: string, configPath: string): Promise<void> {
  const paths = profilePaths(profileId);
  const managed = await readExistingManagedEnv(profileId);
  if (resolve(configPath) !== paths.configFile || !isSubscriptionUpstream(managed.upstream) || !managed.subscriptionPort) {
    throw new Error("Invalid managed subscription proxy invocation");
  }
  const server = await serveSubscriptionBridge({ directory: paths.dir, upstream: managed.upstream,
    apiKey: managed.apiKey, port: managed.subscriptionPort });
  const child = spawn(binaryPath, ["-config", configPath], { cwd: paths.dir, stdio: "ignore", env: proxyProcessEnvironment() });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const stop = () => {
    server.close();
    child.kill("SIGTERM");
    timer ??= setTimeout(() => child.kill("SIGKILL"), 3_000);
    timer.unref();
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
  try {
    await new Promise<void>((resolveExit, reject) => {
      child.once("error", reject);
      child.once("exit", () => resolveExit());
    });
  } finally {
    if (timer) clearTimeout(timer);
    process.off("SIGTERM", stop);
    process.off("SIGINT", stop);
    server.closeAllConnections();
    await new Promise<void>((resolveClose) => server.close(() => resolveClose()));
  }
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
  return withStartupLock(profile.profileId, () => ensureManagedCLIProxyAPIUnlocked(profile));
}

async function ensureManagedCLIProxyAPIUnlocked(
  profile: ManagedCLIProxyAPIProfile,
): Promise<ManagedCLIProxyAPIRuntime> {
  const paths = profilePaths(profile.profileId);
  const state = await readState(profile.profileId);
  let managed = await readExistingManagedEnv(profile.profileId);

  assertCLIProxyAPICompatibility(profile.binaryPath, managed.upstream);

  if (state) {
    const alive = isPidAlive(state.pid);
    const owned =
      alive &&
      state.binaryPath === profile.binaryPath &&
      state.configPath === paths.configFile &&
      (await isOwnedProcess(state));

    if (owned) {
      if (managed.upstream === "antigravity" && !(await isExpectedRuntimeConfig(paths, state, managed))) {
        throw new Error("Antigravity's running proxy needs updated compatibility settings. End its Claude Code sessions, then run `claudex-switch doctor <alias> --restart` before launching again.");
      }
      if (await probeProxy(state.port, managed.apiKey)) {
        return syncAntigravityModels(profile.profileId, managed, {
          port: state.port,
          baseUrl: baseUrl(state.port),
          apiKey: managed.apiKey,
        }, state.startedAt);
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

  if (isSubscriptionUpstream(managed.upstream)) {
    const models = await listSubscriptionModels(paths.dir, managed.upstream);
    const ids = models.map(({ id }) => id);
    await updateManagedCLIProxyAPISetup(profile.profileId, {
      models: pickSubscriptionModels(ids, managed), upstreamModels: ids,
      upstreamContext: Object.fromEntries(models.flatMap(({ id, context_window }) => context_window ? [[id, context_window]] : [])),
      subscriptionPort: await findAvailablePort(),
    });
    managed = await readExistingManagedEnv(profile.profileId);
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt > 0 && isSubscriptionUpstream(managed.upstream)) {
      await updateManagedCLIProxyAPISetup(profile.profileId, { subscriptionPort: await findAvailablePort() });
      managed = await readExistingManagedEnv(profile.profileId);
    }
    const port = await findAvailablePort();
    if (port === managed.subscriptionPort) continue;
    await writeRuntimeConfig(profile.profileId, port);
    const startedAt = Date.now();
    const proc = startProxy(profile.binaryPath, paths.configFile, paths.dir, spawn,
      isSubscriptionUpstream(managed.upstream) ? profile.profileId : undefined);
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
      startedAt,
      ...(isSubscriptionUpstream(managed.upstream) ? { bridgeRevision: SUBSCRIPTION_BRIDGE_REVISION } : {}),
    });
    return syncAntigravityModels(profile.profileId, managed, { port, baseUrl: baseUrl(port), apiKey: managed.apiKey }, startedAt);
  }

  throw new Error(
    "CLIProxyAPI did not become ready. Check `claudex-switch doctor <alias>` after fixing its login or binary.",
  );
}

// Keep replacement, readiness and the profile writer in the same lifecycle
// lock so a new session cannot acquire a lease in the middle of an upgrade.
export async function replaceManagedCLIProxyAPIBinary(
  profile: ManagedCLIProxyAPIProfile,
  binaryPath: string,
  persist: () => Promise<void>,
): Promise<void> {
  await withStartupLock(profile.profileId, async () => {
    const managed = await readExistingManagedEnv(profile.profileId);
    assertCLIProxyAPICompatibility(binaryPath, managed.upstream);
    await stopManagedCLIProxyAPIUnlocked(profile);
    const next = { ...profile, binaryPath };
    await ensureManagedCLIProxyAPIUnlocked(next);
    try {
      await persist();
    } catch (err) {
      await stopManagedCLIProxyAPIUnlocked(next);
      throw err;
    }
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
    const managed = await readExistingManagedEnv(profile.profileId);
    if (!(await hasManagedCLIProxyAPILogin(profile.profileId))) {
      throw new Error(
        `No valid CLIProxyAPI ${CLI_PROXY_API_UPSTREAMS[managed.upstream].label} login is available. Run \`claudex-switch refresh <alias>\` before starting Claude Code.`,
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

async function readSingleAuthFile(
  authDir: string,
  authType: string,
): Promise<Record<string, unknown> | null> {
  const files = await authFiles(authDir);
  // One account per managed proxy prevents upstream round-robin across the
  // user's accounts. Treat any additional credential JSON as an error.
  if (files.length !== 1) return null;
  try {
    // Programmatic validation of a file generated in this managed auth
    // directory. Values are reduced to a one-way fingerprint or compared with
    // non-secret registry fields; they are never logged or copied elsewhere.
    const parsed = JSON.parse(await readFile(files[0]!, "utf-8")) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const auth = parsed as Record<string, unknown>;
    if (
      auth.type !== authType ||
      typeof auth.access_token !== "string" ||
      !auth.access_token.trim()
    ) {
      return null;
    }
    return auth;
  } catch {
    return null;
  }
}

async function inspectAuthDirectory(
  authDir: string,
  authType: string,
): Promise<{ valid: boolean; identity: string | null }> {
  const auth = await readSingleAuthFile(authDir, authType);
  if (!auth) return { valid: false, identity: null };
  const values = [
    ...collectIdentityValues(auth),
    ...collectIdentityValues(decodeJwtPayload(auth.id_token)),
  ].sort();
  if (values.length === 0) return { valid: false, identity: null };
  return {
    valid: true,
    identity: createHash("sha256").update(values.join("\n")).digest("hex"),
  };
}

function stagedAccountMatches(
  auth: Record<string, unknown>,
  expected: ExpectedCLIProxyAPIAccount,
): boolean {
  const claims = decodeJwtPayload(auth.id_token);
  const openai = claims?.["https://api.openai.com/auth"];
  const nestedId =
    openai && typeof openai === "object" && !Array.isArray(openai)
      ? (openai as Record<string, unknown>).chatgpt_account_id
      : undefined;
  const accountId = [auth.account_id, auth.chatgpt_account_id, nestedId].find(
    (value): value is string => typeof value === "string" && value.length > 0,
  );
  const email = [auth.email, claims?.email].find(
    (value): value is string => typeof value === "string" && value.length > 0,
  );
  if (expected.accountId && accountId) return expected.accountId === accountId;
  if (expected.email && email) return expected.email.toLowerCase() === email.toLowerCase();
  return false;
}

export async function hasManagedCLIProxyAPILogin(
  profileId: string,
): Promise<boolean> {
  let managed: ManagedEnv;
  try {
    managed = await readManagedEnv(profileId);
  } catch {
    // Pre-upstream callers checked only the auth dir; keep that for a missing
    // .env so status still distinguishes "no login" from "invalid env".
    return (await inspectAuthDirectory(profilePaths(profileId).authDir, "codex")).valid;
  }
  const spec = CLI_PROXY_API_UPSTREAMS[managed.upstream];
  if (isSubscriptionUpstream(managed.upstream)) return hasSubscriptionLogin(profilePaths(profileId).dir, managed.upstream);
  if (!spec.authType) return Boolean(managed.upstreamKey);
  return (await inspectAuthDirectory(profilePaths(profileId).authDir, spec.authType)).valid;
}

export async function runManagedCLIProxyAPILogin(
  profile: ManagedCLIProxyAPIProfile,
  spawnCommand: SpawnCommand = spawn,
  expectedIdentity?: string,
  expectedAccount?: ExpectedCLIProxyAPIAccount,
): Promise<ManagedCLIProxyAPILoginResult> {
  assertProfileId(profile.profileId);
  const paths = profilePaths(profile.profileId);
  await mkdirPrivate(CLI_PROXY_API_DIR);
  const upstream = (await readExistingManagedEnv(profile.profileId)).upstream;
  const spec = CLI_PROXY_API_UPSTREAMS[upstream];
  if (isSubscriptionUpstream(upstream)) {
    if (!process.stdin.isTTY) {
      throw new Error(`${spec.label} login needs an interactive terminal to choose a login method. Run the same command in your terminal first.`);
    }
    return withStartupLock(profile.profileId, async () => {
      if (await managedCLIProxyAPIHasActiveLeases(profile.profileId)) {
        throw new Error("End this account's Claude Code sessions before refreshing its login.");
      }
      await stopManagedCLIProxyAPIUnlocked(profile);
      const staging = join(paths.dir, `.login-${randomUUID()}`);
      await mkdirPrivate(staging);
      try {
        const methods = await subscriptionLoginMethods(staging, upstream);
        if (!methods.length) throw new Error(`${spec.label} has no supported login methods.`);
        const method = await select({ message: `${spec.label} login`,
          choices: methods.map(({ label }, value) => ({ name: label, value })) });
        const identity = await loginSubscriptionPlugin(staging, upstream, method, info);
        if (expectedIdentity && identity !== expectedIdentity) {
          return { success: false, identity: null, identityMismatch: true };
        }
        await rename(join(staging, SUBSCRIPTION_AUTH_FILE), join(paths.dir, SUBSCRIPTION_AUTH_FILE));
        return { success: true, identity, identityMismatch: false };
      } finally {
        await rm(staging, { recursive: true, force: true });
      }
    });
  }
  if (!spec.loginFlag || !spec.authType) {
    throw new Error(`${spec.label} accounts use an API key and have no CLIProxyAPI login.`);
  }
  const { loginFlag, authType, callbackPort } = spec;

  return withStartupLock(profile.profileId, async () => withLock(CLI_PROXY_API_LOGIN_LOCK, async () => {
    if (await managedCLIProxyAPIHasActiveLeases(profile.profileId)) {
      throw new Error(
        "A Claude Code session launched by claudex-switch is still using this CLIProxyAPI account. End it before refreshing the login.",
      );
    }

    const stagingAuthDir = join(paths.dir, `.login-${randomUUID()}`);
    const loginConfig = join(paths.dir, "login-runtime.yaml");
    const apiPort = await findAvailablePort();
    if (callbackPort && !(await portIsAvailable(callbackPort))) {
      throw new Error(
        `CLIProxyAPI ${spec.label} OAuth needs localhost:${callbackPort}, but that callback port is already in use. Stop the process using it and retry.`,
      );
    }
    await mkdirPrivate(stagingAuthDir);
    const config = await readExistingManagedEnv(profile.profileId);
    await writePrivate(
      loginConfig,
      renderRuntimeConfig(stagingAuthDir, config, apiPort),
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
          loginFlag,
        ],
        { stdio: "inherit", cwd: paths.dir, env },
      );
      const exitCode = await new Promise<number | null>((resolveCode, reject) => {
        proc.on("close", resolveCode);
        proc.on("error", reject);
      });
      const staged = await inspectAuthDirectory(stagingAuthDir, authType);
      if (exitCode !== 0 || !staged.valid || !staged.identity) {
        return { success: false, identity: null, identityMismatch: false };
      }
      const stagedAuth = expectedAccount
        ? await readSingleAuthFile(stagingAuthDir, authType)
        : null;
      if (
        (expectedIdentity && staged.identity !== expectedIdentity) ||
        (expectedAccount && (!stagedAuth || !stagedAccountMatches(stagedAuth, expectedAccount)))
      ) {
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

/**
 * Stop an idle daemon whose runtime.yaml no longer matches what this release
 * generates from the private .env (a newer template or a changed upstream
 * key), so the next ensure starts it with the current config. A daemon that
 * still serves a session is left alone.
 */
export async function stopStaleManagedCLIProxyAPI(
  profile: ManagedCLIProxyAPIProfile,
): Promise<boolean> {
  assertProfileId(profile.profileId);
  return withStartupLock(profile.profileId, async () => {
    if (await managedCLIProxyAPIHasActiveLeases(profile.profileId)) return false;
    const paths = profilePaths(profile.profileId);
    let managed: ManagedEnv;
    try {
      managed = await readManagedEnv(profile.profileId);
    } catch {
      return false;
    }
    const state = await readState(profile.profileId);
    if (!state || !isPidAlive(state.pid)) return false;
    // Subscription windows are read with the catalog when the daemon starts.
    const outdated = isSubscriptionUpstream(managed.upstream)
      && (managed.upstreamContext === null || state.bridgeRevision !== SUBSCRIPTION_BRIDGE_REVISION);
    if (!outdated && await isExpectedRuntimeConfig(paths, state, managed)) return false;
    return stopManagedCLIProxyAPIUnlocked(profile);
  });
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
