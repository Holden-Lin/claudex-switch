import { acquireProfileLock } from "./lock";
import { fetchOpenCodeGoCatalogIds } from "./catalog";
export { acquireProfileLock } from "./lock";
import { randomBytes, randomUUID } from "crypto";
import { spawn, type ChildProcess } from "child_process";
import { join } from "path";
import { chmod, mkdir, readFile, rename, rm, writeFile } from "fs/promises";
import {
  openCodeProfileV2DatabaseFile,
  openCodeProfileV2DataHome,
  openCodeProfileV2CredentialStateFile,
  openCodeProfileV2ModelInventoryFile,
  openCodeProfileV2RuntimeDir,
} from "../../lib/paths";
import { fileExists } from "../../lib/fs";
import {
  OPENCODE_GO_PROVIDER_ID,
  OPENCODE_V2_MANAGED_PROVIDER_ID,
  normalizeOpenCodeGoModel,
  readOpenCodeGoApiKey,
} from "./profiles";

type JsonRecord = Record<string, unknown>;
type SpawnCommand = typeof spawn;
type FetchFunction = typeof fetch;

const OPENCODE_NATIVE_GO_KEY_ENV = "OPENCODE_API_KEY";
export const OPENCODE_FREE_PROVIDER_ID = "opencode";

/** Check every price tier; names containing "free" are not a price guarantee. */
export function isOpenCodeFreeModel(model: JsonRecord): boolean {
  return model.providerID === OPENCODE_FREE_PROVIDER_ID &&
    Array.isArray(model.cost) && model.cost.length > 0 &&
    model.cost.every((tier) => isRecord(tier) && tier.input === 0 && tier.output === 0 &&
      (tier.cache === undefined || isRecord(tier.cache) && Object.values(tier.cache).every((price) => price === 0)));
}

export interface PreparedOpenCodeRunEnvironment {
  env: NodeJS.ProcessEnv;
  /** Set when the session's small-window compaction buffer was managed. */
  compactionGuard?: OpenCodeCompactionGuard;
}

export type OpenCodeV2CredentialSync = (
  profileId: string,
  key: string,
  env: NodeJS.ProcessEnv,
) => Promise<OpenCodeV2CompactionRouting | void>;

export function mapOpenCodeGoModelForV2(model: string): string {
  const normalized = normalizeOpenCodeGoModel(model);
  const modelId = normalized.slice(OPENCODE_GO_PROVIDER_ID.length + 1);
  return `${OPENCODE_V2_MANAGED_PROVIDER_ID}/${modelId}`;
}

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseConfigContent(content: string | undefined): JsonRecord {
  if (!content?.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(content);
    if (!isRecord(parsed)) throw new Error("Configuration must be a JSON object.");
    return parsed;
  } catch {
    throw new Error(
      "Could not merge OpenCode V2 launch settings with OPENCODE_CONFIG_CONTENT. Use valid JSON in that environment variable and retry.",
    );
  }
}

function stringArray(value: unknown, field: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`OpenCode V2 ${field} must be an array of provider IDs.`);
  }
  return value;
}

function providerPatternMatches(pattern: string, providerID: string): boolean {
  const escaped = pattern.replace(/[|\\{}()[\]^$+?.]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`).test(providerID);
}

function modelForV2(config: JsonRecord, selectedModel?: string): string {
  const candidate = selectedModel ?? config.model;
  if (typeof candidate !== "string" || !candidate.trim()) {
    throw new Error(
      "OpenCode V2 aliases require an OpenCode Go model. Set this alias's default model or pass -run --model opencode-go/<model> before starting the TUI.",
    );
  }

  let normalized: string;
  try {
    normalized = normalizeOpenCodeGoModel(candidate);
  } catch {
    throw new Error(
      "OpenCode V2 aliases only bind credentials for OpenCode Go models. Set an opencode-go/<model> default or pass -run --model opencode-go/<model>; other-provider sessions are outside this alias's account-selection guarantee.",
    );
  }
  return mapOpenCodeGoModelForV2(normalized);
}

/**
 * Build the temporary V2 config needed to select the Go alias without changing
 * OpenCode's saved credentials. The key itself is never written to this JSON.
 */
export function buildOpenCodeV2Config(
  source: string | undefined,
  selectedModel?: string,
  managedModels: string[] = [],
): JsonRecord {
  const config = parseConfigContent(source);
  const providersValue = config.providers;
  if (providersValue !== undefined && !isRecord(providersValue)) {
    throw new Error("OpenCode V2 providers config must be an object.");
  }
  const providers = isRecord(providersValue) ? { ...providersValue } : {};
  if (Object.hasOwn(providers, OPENCODE_V2_MANAGED_PROVIDER_ID)) {
    throw new Error(
      "OpenCode V2 config already uses claudex-switch's reserved provider ID; refusing to override it.",
    );
  }

  const mappedModel = modelForV2(config, selectedModel);
  config.model = mappedModel;
  const modelIds = new Set<string>([
    mappedModel.slice(OPENCODE_V2_MANAGED_PROVIDER_ID.length + 1),
  ]);
  for (const model of managedModels) {
    const normalized = normalizeOpenCodeGoModel(model);
    modelIds.add(normalized.slice(OPENCODE_GO_PROVIDER_ID.length + 1));
  }
  const models: JsonRecord = Object.fromEntries([...modelIds].map((modelId) => [modelId, {}]));

  providers[OPENCODE_V2_MANAGED_PROVIDER_ID] = {
    name: "OpenCode Go (claudex-switch)",
    canonical: OPENCODE_GO_PROVIDER_ID,
    // V2 canonical providers inherit catalog metadata. The selected account
    // model is explicitly included as an overlay so its source metadata is
    // copied under the managed provider ID.
    models,
  };
  config.providers = providers;

  return restrictOpenCodeProviders(config, OPENCODE_V2_MANAGED_PROVIDER_ID);
}

export function restrictOpenCodeProviders(config: JsonRecord, providerId: string): JsonRecord {
  // Keep the selected Go account and native public models available.
  // User permission rules are otherwise preserved by the merged config.
  const experimentalValue = config.experimental;
  if (experimentalValue !== undefined && !isRecord(experimentalValue)) {
    throw new Error("OpenCode V2 experimental config must be an object.");
  }
  const experimental = isRecord(experimentalValue) ? { ...experimentalValue } : {};
  const existingPolicies = experimental.policies;
  if (existingPolicies !== undefined && !Array.isArray(existingPolicies)) {
    throw new Error("OpenCode V2 experimental.policies must be an array.");
  }
  const sourcePolicies = Array.isArray(existingPolicies) ? existingPolicies : [];
  const userDeniesManaged = sourcePolicies.some(
    (policy) =>
      isRecord(policy) &&
      policy.action === "provider.use" &&
      policy.effect === "deny" &&
      typeof policy.resource === "string" &&
      providerPatternMatches(policy.resource, providerId),
  );
  if (userDeniesManaged) {
    throw new Error(
      "OpenCode V2 configuration denies claudex-switch's managed Go provider; refusing to weaken that restriction.",
    );
  }
  const denyOtherProviders = {
    action: "provider.use",
    resource: "*",
    effect: "deny",
  };
  const allowManagedProvider = {
    action: "provider.use",
    resource: providerId,
    effect: "allow",
  };
  const policies = sourcePolicies.filter(
    (policy) =>
      !isRecord(policy) ||
      (policy.action !== denyOtherProviders.action ||
        policy.resource !== denyOtherProviders.resource ||
        policy.effect !== denyOtherProviders.effect) &&
      (policy.action !== allowManagedProvider.action ||
        policy.resource !== allowManagedProvider.resource ||
        policy.effect !== allowManagedProvider.effect),
  );
  // Policy order is user-defined denies first, then this alias's provider
  // allowlist, with any deny for the managed ID kept last so it is never
  // weakened by the alias adapter.
  const userDenies = sourcePolicies.filter(
    (policy) =>
      isRecord(policy) &&
      policy.action === "provider.use" &&
      policy.effect === "deny",
  );
  const userNonDenies = policies.filter(
    (policy) =>
      !isRecord(policy) ||
      policy.action !== "provider.use" ||
      policy.effect !== "deny",
  );
  const disabledProviders = stringArray(config.disabled_providers, "disabled_providers");
  const enabledProviders = stringArray(config.enabled_providers, "enabled_providers");
  if (disabledProviders.includes(providerId)) {
    throw new Error(
      "OpenCode V2 configuration disables claudex-switch's managed Go provider; refusing to weaken that restriction.",
    );
  }
  if (config.enabled_providers !== undefined && !enabledProviders.includes(providerId)) {
    throw new Error(
      "OpenCode V2 configuration does not enable claudex-switch's managed Go provider; refusing to override the allowlist.",
    );
  }
  const freeDenied = disabledProviders.includes(OPENCODE_FREE_PROVIDER_ID) ||
    (config.enabled_providers !== undefined && !enabledProviders.includes(OPENCODE_FREE_PROVIDER_ID)) ||
    userDenies.some((policy) => isRecord(policy) && typeof policy.resource === "string" &&
      providerPatternMatches(policy.resource, OPENCODE_FREE_PROVIDER_ID));
  experimental.policies = [
    ...userNonDenies,
    denyOtherProviders,
    allowManagedProvider,
    ...(!freeDenied ? [{ action: "provider.use", resource: OPENCODE_FREE_PROVIDER_ID, effect: "allow" }] : []),
    ...userDenies,
  ];
  config.experimental = experimental;
  config.enabled_providers = freeDenied ? [providerId] : [providerId, OPENCODE_FREE_PROVIDER_ID];
  if (config.disabled_providers !== undefined) config.disabled_providers = disabledProviders;

  return config;
}


async function readModelInventory(file: string): Promise<string[]> {
  let contents: string;
  try {
    contents = await readFile(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw new Error("Could not read this alias's private OpenCode model history.");
  }
  let value: unknown;
  try {
    value = JSON.parse(contents);
  } catch {
    throw new Error("This alias's private OpenCode model history is malformed; refusing to overwrite it.");
  }
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error("This alias's private OpenCode model history has an unexpected schema.");
  }
  try {
    return [...new Set(value.map((item) => normalizeOpenCodeGoModel(item)))];
  } catch {
    throw new Error("This alias's private OpenCode model history contains an invalid model ID.");
  }
}

async function writeModelInventory(file: string, models: string[]): Promise<void> {
  const temporaryFile = `${file}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryFile, JSON.stringify(models, null, 2), { flag: "wx", mode: 0o600 });
    await chmod(temporaryFile, 0o600);
    await rename(temporaryFile, file);
  } catch {
    throw new Error("Could not save this alias's private OpenCode model history.");
  } finally {
    await rm(temporaryFile, { force: true });
  }
}

async function rememberOpenCodeV2Model(
  profileId: string,
  source: string | undefined,
  selectedModel?: string,
): Promise<string[]> {
  // Validate the selected model and all inherited config before writing the
  // per-alias inventory. A malformed setting must not poison future runs.
  const selectedConfig = buildOpenCodeV2Config(source, selectedModel);
  const managedModel = selectedConfig.model;
  if (typeof managedModel !== "string" || !managedModel.startsWith(`${OPENCODE_V2_MANAGED_PROVIDER_ID}/`)) {
    throw new Error("OpenCode V2 could not resolve a managed Go model.");
  }
  const selectedGoModel = `${OPENCODE_GO_PROVIDER_ID}/${managedModel.slice(OPENCODE_V2_MANAGED_PROVIDER_ID.length + 1)}`;
  const runtimeRoot = openCodeProfileV2RuntimeDir(profileId);
  await mkdir(runtimeRoot, { recursive: true, mode: 0o700 });
  await chmod(runtimeRoot, 0o700);
  const inventoryFile = openCodeProfileV2ModelInventoryFile(profileId);
  const release = await acquireProfileLock(`${inventoryFile}.lock`, "model history");
  try {
    // Drop a differently-cased spelling of the selected model (for example a
    // display name saved before IDs were resolved against the catalog), so
    // the picker does not keep offering an ID the upstream rejects.
    const existing = (await readModelInventory(inventoryFile)).filter((model) =>
      model === selectedGoModel || model.toLowerCase() !== selectedGoModel.toLowerCase());
    const next = [...new Set([...existing, selectedGoModel])];
    buildOpenCodeV2Config(source, selectedGoModel, next);
    await writeModelInventory(inventoryFile, next);
    return next;
  } finally {
    await release();
  }
}

async function readOwnedCredentialIds(file: string): Promise<string[]> {
  let contents: string;
  try {
    contents = await readFile(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw new Error("Could not read this alias's private OpenCode credential index.");
  }
  let value: unknown;
  try {
    value = JSON.parse(contents);
  } catch {
    throw new Error("This alias's private OpenCode credential index is malformed; refusing cleanup.");
  }
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !Array.isArray(value.credentialIds) ||
    value.credentialIds.some((id) => typeof id !== "string" || id.length === 0)
  ) {
    throw new Error("This alias's private OpenCode credential index has an unexpected schema.");
  }
  return [...new Set(value.credentialIds as string[])];
}

async function writeOwnedCredentialIds(file: string, credentialIds: string[]): Promise<void> {
  const temporaryFile = `${file}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryFile, JSON.stringify({ version: 1, credentialIds }, null, 2), {
      flag: "wx",
      mode: 0o600,
    });
    await chmod(temporaryFile, 0o600);
    await rename(temporaryFile, file);
  } catch {
    throw new Error("Could not update this alias's private OpenCode credential index.");
  } finally {
    await rm(temporaryFile, { force: true });
  }
}

function serverUrlFromLine(line: string): string | null {
  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch {
    return null;
  }
  if (!isRecord(value) || typeof value.url !== "string") return null;
  let url: URL;
  try {
    url = new URL(value.url);
  } catch {
    throw new Error("OpenCode V2 returned an invalid local server address.");
  }
  if (
    url.protocol !== "http:" ||
    url.hostname !== "127.0.0.1" ||
    !url.port ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("OpenCode V2 did not bind its credential API to the expected loopback address.");
  }
  return url.origin;
}

function waitForLocalServer(child: ChildProcess, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let output = "";
    let settled = false;
    const finish = (error?: Error, url?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.stdout?.off("data", onData);
      child.off("error", onError);
      child.off("close", onClose);
      if (error) reject(error);
      else resolve(url!);
    };
    const onData = (chunk: Buffer | string) => {
      output += chunk.toString();
      const lines = output.split(/\r?\n/);
      output = lines.pop() ?? "";
      for (const line of lines) {
        try {
          const url = serverUrlFromLine(line);
          if (url) return finish(undefined, url);
        } catch (error) {
          return finish(error instanceof Error ? error : new Error("OpenCode V2 local server failed."));
        }
      }
    };
    const onError = () => finish(new Error("Could not start OpenCode V2's private credential service."));
    const onClose = () => finish(new Error("OpenCode V2's private credential service exited before it was ready."));
    const timer = setTimeout(
      () => finish(new Error("Timed out starting OpenCode V2's private credential service.")),
      timeoutMs,
    );
    child.stdout?.on("data", onData);
    child.stderr?.on("data", () => {});
    child.once("error", onError);
    child.once("close", onClose);
  });
}

function waitForChildClose(child: ChildProcess, timeoutMs: number): Promise<boolean> {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve(true);
  return new Promise((resolve) => {
    const finish = (closed: boolean) => {
      clearTimeout(timer);
      child.off("close", onClose);
      resolve(closed);
    };
    const onClose = () => finish(true);
    const timer = setTimeout(() => finish(false), timeoutMs);
    child.once("close", onClose);
  });
}

async function stopLocalServer(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.stdin?.end();
  if (await waitForChildClose(child, 1_500)) return;
  child.kill("SIGTERM");
  if (await waitForChildClose(child, 1_500)) return;
  child.kill("SIGKILL");
  if (await waitForChildClose(child, 1_500)) return;
  throw new Error("Could not stop OpenCode V2's private credential service; refusing to launch the TUI.");
}

function authHeaders(password: string): Record<string, string> {
  return {
    authorization: `Basic ${Buffer.from(`opencode:${password}`).toString("base64")}`,
    "content-type": "application/json",
  };
}

export async function fetchOpenCodeApi(
  fetcher: FetchFunction,
  baseUrl: string,
  path: string,
  password: string,
  init: RequestInit = {},
): Promise<Response> {
  try {
    return await fetcher(new URL(path, baseUrl), {
      ...init,
      headers: { ...authHeaders(password), ...(init.headers ?? {}) },
      signal: AbortSignal.timeout(15_000),
      redirect: "error",
    });
  } catch {
    throw new Error("Could not sync the selected OpenCode Go key to this alias's private database.");
  }
}

/** One lifecycle for all writers/readers of an alias-private native store. */
export async function withOpenCodePrivateServer<T>(
  env: NodeJS.ProcessEnv,
  callback: (baseUrl: string, password: string) => Promise<T>,
  spawnCommand: SpawnCommand = spawn,
): Promise<T> {
  const password = randomBytes(32).toString("base64url");
  const serverEnv = { ...env };
  delete serverEnv.OPENCODE_AUTH_CONTENT;
  delete serverEnv[OPENCODE_NATIVE_GO_KEY_ENV];
  serverEnv.OPENCODE_PASSWORD = password;
  serverEnv.OPENCODE_DISABLE_AUTOUPDATE = "1";
  serverEnv.OPENCODE_DISABLE_MODELS_FETCH = "1";
  const child = spawnCommand("opencode",
    ["serve", "--stdio", "--hostname", "127.0.0.1", "--port", "0"],
    { stdio: ["pipe", "pipe", "pipe"], windowsHide: true, env: serverEnv });
  try {
    const baseUrl = await waitForLocalServer(child, 15_000);
    child.stdout?.on("data", () => {});
    return await callback(baseUrl, password);
  } finally {
    await stopLocalServer(child);
  }
}

export function locationData(value: unknown): unknown {
  if (
    !isRecord(value) ||
    !isRecord(value.location) ||
    typeof value.location.directory !== "string" ||
    value.data === undefined
  ) {
    throw new Error("OpenCode V2 returned an unexpected location-scoped API response.");
  }
  return value.data;
}

async function responseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new Error("OpenCode V2 returned invalid local API data.");
  }
}

function configuredDefaultAgent(configEntries: unknown): string {
  if (!Array.isArray(configEntries)) {
    throw new Error("Could not verify OpenCode V2's effective local configuration.");
  }
  let defaultAgent = "build";
  for (const entry of configEntries) {
    if (isRecord(entry) && entry.type === "document" && isRecord(entry.info)) {
      if (entry.info.default_agent !== undefined) {
        if (typeof entry.info.default_agent !== "string" || !entry.info.default_agent) {
          throw new Error("OpenCode V2 has an invalid default agent setting.");
        }
        defaultAgent = entry.info.default_agent;
      }
    }
  }
  return defaultAgent;
}

type EffectiveCompactionSettings = {
  auto: boolean;
  buffer?: number;
};

/** Later documents override earlier ones, matching OpenCode's config merge order. */
function effectiveCompactionSettings(configEntries: unknown): EffectiveCompactionSettings {
  if (!Array.isArray(configEntries)) {
    throw new Error("Could not verify OpenCode V2's effective local configuration.");
  }
  let auto = true;
  let buffer: number | undefined;
  for (const entry of configEntries) {
    if (!isRecord(entry) || entry.type !== "document" || !isRecord(entry.info)) continue;
    const compaction = entry.info.compaction;
    if (compaction === undefined) continue;
    if (!isRecord(compaction)) {
      throw new Error("OpenCode V2 has an invalid compaction setting.");
    }
    if (compaction.auto !== undefined) {
      if (typeof compaction.auto !== "boolean") {
        throw new Error("OpenCode V2 has an invalid compaction setting.");
      }
      auto = compaction.auto;
    }
    // OpenCode normalizes the deprecated `reserved` alias to `buffer`.
    const value = compaction.buffer ?? compaction.reserved;
    if (value !== undefined) {
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        throw new Error("OpenCode V2 has an invalid compaction buffer setting.");
      }
      buffer = value;
    }
  }
  return { auto, buffer };
}

/**
 * Session-scoped compaction state resolved from OpenCode's effective config,
 * plus every managed model's effective compaction window.
 */
export type OpenCodeV2CompactionRouting = {
  auto: boolean;
  buffer?: number;
  /**
   * Effective compaction window per model: OpenCode's trigger formula uses
   * `limit.input || limit.context`, so entries store that basis.
   */
  windows: Map<string, number>;
  agentModelId?: string;
  /** Native free models can be selected later in the same TUI session. */
  freeModelIds?: string[];
};

// Managed sessions keep auto-compaction on for windows below the reserved
// budget the user configures (500,000 tokens): OpenCode's trigger is
// `window - buffer`, so the user's larger reserved budget would either
// compact on every turn or never fit. A session-only buffer makes compaction
// fire at about 90% of the window instead.
const OPENCODE_COMPACTION_WINDOW_FLOOR = 500_000;
// OpenCode resolves models without limit metadata to this fallback window
// itself (`cO` in the v2.0.29 bundle; /api/model reports context 200000).
const OPENCODE_COMPACTION_FALLBACK_WINDOW = 200_000;
// OpenCode's own minimum default compaction buffer (`G5`): windows of at
// least 32,000 tokens always reserve this many tokens, even when 10% would
// be smaller.
const OPENCODE_MINIMUM_COMPACTION_BUFFER = 16_000;

/**
 * OpenCode's own default compaction buffer for a window: 10% of the window,
 * never below its 16,000-token minimum for windows of at least 32,000
 * tokens. Reproducing the formula keeps the ~90% trigger point while the
 * 16,000-token floor leaves the same room for the compaction request itself
 * that OpenCode reserves by default.
 */
function defaultCompactionBuffer(window: number): number {
  const tenPercent = Math.floor(window * 0.1);
  return window >= 2 * OPENCODE_MINIMUM_COMPACTION_BUFFER
    ? Math.max(tenPercent, OPENCODE_MINIMUM_COMPACTION_BUFFER)
    : tenPercent;
}

export type OpenCodeCompactionGuard = {
  id: string;
  /** Effective compaction window (limit.input || limit.context) in tokens. */
  context: number;
  /** Buffer this session compacts with (managed, or the user's own). */
  buffer: number;
  /** False when the user's own smaller buffer was kept as-is. */
  managed: boolean;
};

/**
 * Keep auto-compaction on in the managed config content when the smallest
 * model window this session can use (the selected model, the default agent's
 * model, and native free models) is below the reserved budget (500,000
 * tokens). A session-only buffer is written so compaction fires at about 90%
 * of that window (buffer ≈ 10%, floored at OpenCode's own 16,000-token
 * minimum so the trigger stays > 0 and the compaction request still fits).
 * A user buffer that is smaller than the computed one but still leaves at
 * least OpenCode's minimum margin is kept (it compacts later than 90% but
 * stays safe). Windows >= 500,000 and sessions with auto-compaction
 * disabled keep the user's own settings. The user's own OpenCode
 * configuration is untouched. Returns the possibly rewritten content plus
 * the applied guard.
 */
export function applyManagedCompactionPolicy(
  configContent: string,
  routing: OpenCodeV2CompactionRouting,
  selectedModelId?: string,
): { configContent: string; guard?: OpenCodeCompactionGuard } {
  if (!routing.auto) return { configContent };
  let smallest: { id: string; window: number } | undefined;
  const checked = new Set(
    [selectedModelId, routing.agentModelId, ...(routing.freeModelIds ?? [])].filter(
      (value): value is string => value !== undefined,
    ),
  );
  for (const id of checked) {
    const reported = routing.windows.get(id);
    // OpenCode resolves models without limit metadata to a 200,000-token
    // fallback window itself, so an unresolved entry behaves the same.
    const window =
      reported !== undefined && reported > 0
        ? reported
        : OPENCODE_COMPACTION_FALLBACK_WINDOW;
    if (!smallest || window < smallest.window) smallest = { id, window };
  }
  if (!smallest || smallest.window >= OPENCODE_COMPACTION_WINDOW_FLOOR) {
    return { configContent };
  }
  const target = defaultCompactionBuffer(smallest.window);
  const configured = routing.buffer;
  if (
    configured !== undefined &&
    configured > 0 &&
    configured < target &&
    configured >= Math.min(target, OPENCODE_MINIMUM_COMPACTION_BUFFER)
  ) {
    // The user's own buffer compacts later than the 90% target but still
    // fires above zero and keeps at least OpenCode's own minimum margin;
    // respect it instead of compacting earlier.
    return {
      configContent,
      guard: { id: smallest.id, context: smallest.window, buffer: configured, managed: false },
    };
  }
  const config = parseConfigContent(configContent);
  const compaction = isRecord(config.compaction) ? { ...config.compaction } : {};
  compaction.auto = true;
  compaction.buffer = target;
  config.compaction = compaction;
  return {
    configContent: JSON.stringify(config),
    guard: { id: smallest.id, context: smallest.window, buffer: target, managed: true },
  };
}

export async function verifyEffectiveOpenCodeRouting(
  fetcher: FetchFunction,
  baseUrl: string,
  password: string,
  managedModels: string[],
  providerId = OPENCODE_V2_MANAGED_PROVIDER_ID,
  validateConfig?: (entries: unknown) => void,
): Promise<OpenCodeV2CompactionRouting> {
  const configResponse = await fetchOpenCodeApi(fetcher, baseUrl, "/api/config", password, {
    method: "GET",
  });
  if (!configResponse.ok) throw new Error("Could not verify OpenCode V2's effective local configuration.");
  const configEntries = await responseJson(configResponse);
  validateConfig?.(configEntries);
  const defaultAgentId = configuredDefaultAgent(configEntries);
  const compaction = effectiveCompactionSettings(configEntries);

  // The location's agent inventory is populated asynchronously after the
  // private server boots; an early query can return an empty list even though
  // the effective default agent appears moments later. Poll until it is
  // present with its permission set, then keep failing closed if it never
  // arrives.
  let agent: JsonRecord | undefined;
  const agentTimeoutAt = Date.now() + 10_000;
  while (Date.now() < agentTimeoutAt) {
    const agentResponse = await fetchOpenCodeApi(fetcher, baseUrl, "/api/agent", password, {
      method: "GET",
    });
    if (!agentResponse.ok) throw new Error("Could not verify OpenCode V2's selected agent.");
    const agentData = locationData(await responseJson(agentResponse));
    if (!Array.isArray(agentData)) {
      throw new Error("OpenCode V2 returned an unexpected agent inventory.");
    }
    const candidate = agentData.find((item) => isRecord(item) && item.id === defaultAgentId);
    if (isRecord(candidate) && Array.isArray(candidate.permissions)) {
      agent = candidate;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!agent) {
    throw new Error("OpenCode V2's configured default agent is unavailable in this location.");
  }
  let agentModelId: string | undefined;
  if (agent.model !== undefined) {
    if (!isRecord(agent.model) || typeof agent.model.providerID !== "string" || typeof agent.model.id !== "string") {
      throw new Error("OpenCode V2's default agent has an invalid model setting.");
    }
    if (agent.model.providerID !== providerId && agent.model.providerID !== OPENCODE_FREE_PROVIDER_ID) {
      throw new Error(
        `OpenCode V2 default agent "${defaultAgentId}" selects another provider. Set its model to this alias's Go model or a native free OpenCode model.`,
      );
    }
    agentModelId = agent.model.providerID === OPENCODE_FREE_PROVIDER_ID
      ? `${OPENCODE_FREE_PROVIDER_ID}/${agent.model.id}` : agent.model.id;
    const managedModelIds = managedModels.map((model) =>
      model.slice(model.indexOf("/") + 1),
    );
    if (agent.model.providerID === providerId && !managedModelIds.includes(agentModelId)) {
      throw new Error(
        `OpenCode V2 default agent "${defaultAgentId}" selects a Go model not in this alias's private model history.`,
      );
    }
  }

  const expected = new Set(
    managedModels.map((model) => model.slice(model.indexOf("/") + 1)),
  );
  const timeoutAt = Date.now() + 10_000;
  let previousSignature = "";
  let stablePolls = 0;
  let lastUnexpectedProvider = false;
  while (Date.now() < timeoutAt) {
    let response: Response;
    try {
      response = await fetchOpenCodeApi(fetcher, baseUrl, "/api/model", password, {
        method: "GET",
      });
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
      continue;
    }
    if (!response.ok) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      continue;
    }
    const modelData = locationData(await responseJson(response));
    if (!Array.isArray(modelData)) {
      throw new Error("OpenCode V2 returned an unexpected model inventory.");
    }
    const models: Array<{ providerID: string; id: string; context?: number }> = [];
    const windows = new Map<string, number>();
    const freeModelIds: string[] = [];
    for (const item of modelData) {
      if (!isRecord(item) || typeof item.providerID !== "string" || typeof item.id !== "string") {
        throw new Error("OpenCode V2 returned an unexpected model inventory.");
      }
      if (item.enabled === false) continue;
      // OpenCode's compaction trigger uses `limit.input || limit.context`;
      // store that basis so the managed buffer tracks the real trigger.
      const basis =
        isRecord(item.limit) && typeof item.limit.input === "number" && item.limit.input > 0
          ? item.limit.input
          : isRecord(item.limit) && typeof item.limit.context === "number" && item.limit.context > 0
            ? item.limit.context
            : undefined;
      // Free models keep their native provider and never use the selected Go
      // credential. Do not include them in the Go inventory equality check.
      if (item.providerID === OPENCODE_FREE_PROVIDER_ID) {
        if (!isOpenCodeFreeModel(item)) {
          throw new Error("OpenCode V2 exposes a paid or unpriced native OpenCode model; refusing this Go alias launch.");
        }
        const id = `${OPENCODE_FREE_PROVIDER_ID}/${item.id}`;
        freeModelIds.push(id);
        windows.set(id, basis ?? OPENCODE_COMPACTION_FALLBACK_WINDOW);
        continue;
      }
      models.push({ providerID: item.providerID, id: item.id, context: basis });
      if (basis !== undefined) windows.set(item.id, basis);
    }
    const signature = JSON.stringify({
      go: models.toSorted((left, right) => `${left.providerID}/${left.id}`.localeCompare(`${right.providerID}/${right.id}`)),
      free: freeModelIds.toSorted().map((id) => [id, windows.get(id)]),
    });
    const onlyManaged = models.every((model) => model.providerID === providerId);
    const actual = new Set(models.map((model) => model.id));
    const sameInventory =
      onlyManaged &&
      (!agentModelId?.startsWith(`${OPENCODE_FREE_PROVIDER_ID}/`) || freeModelIds.includes(agentModelId)) &&
      actual.size === expected.size &&
      [...expected].every((id) => actual.has(id));
    lastUnexpectedProvider = !onlyManaged;
    stablePolls = sameInventory && signature === previousSignature ? stablePolls + 1 : sameInventory ? 1 : 0;
    previousSignature = signature;
    if (stablePolls >= 3) {
      return {
        auto: compaction.auto,
        buffer: compaction.buffer,
        windows,
        agentModelId,
        freeModelIds,
      };
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  if (lastUnexpectedProvider) {
    throw new Error(
      "OpenCode V2's effective provider inventory includes another provider; refusing this Go alias launch.",
    );
  }
  throw new Error(
    "OpenCode V2 did not load this alias's complete Go model inventory in the current location; refusing to launch.",
  );
}

async function waitForManagedIntegrationKeyMethod(
  fetcher: FetchFunction,
  baseUrl: string,
  password: string,
): Promise<void> {
  const timeoutAt = Date.now() + 15_000;
  const path = `/api/integration/${encodeURIComponent(OPENCODE_V2_MANAGED_PROVIDER_ID)}`;
  while (Date.now() < timeoutAt) {
    let response: Response;
    try {
      response = await fetchOpenCodeApi(fetcher, baseUrl, path, password, { method: "GET" });
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
      continue;
    }
    if (response.status === 404 || response.status === 503) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      continue;
    }
    if (!response.ok) {
      throw new Error("Could not verify OpenCode V2's managed Go integration.");
    }
    const integration = locationData(await responseJson(response));
    if (
      !isRecord(integration) ||
      integration.id !== OPENCODE_V2_MANAGED_PROVIDER_ID ||
      !Array.isArray(integration.methods) ||
      !Array.isArray(integration.connections)
    ) {
      throw new Error("OpenCode V2 returned an unexpected managed integration response.");
    }
    if (
      integration.methods.some((method) => isRecord(method) && method.type === "key")
    ) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("OpenCode V2's managed Go key method did not become ready; refusing to launch.");
}

/**
 * Persist the sidecar's selected key through OpenCode's supported integration
 * API, using a short-lived server bound to IPv4 loopback and this alias's DB.
 */
export async function syncOpenCodeV2CredentialToPrivateDatabase(
  profileId: string,
  key: string,
  env: NodeJS.ProcessEnv,
  spawnCommand: SpawnCommand = spawn,
  fetcher: FetchFunction = fetch,
): Promise<OpenCodeV2CompactionRouting | void> {
  const runtimeRoot = openCodeProfileV2RuntimeDir(profileId);
  await mkdir(runtimeRoot, { recursive: true, mode: 0o700 });
  await chmod(runtimeRoot, 0o700);
  const credentialStateFile = openCodeProfileV2CredentialStateFile(profileId);
  const release = await acquireProfileLock(`${credentialStateFile}.lock`, "credential sync");
  try {
    return await syncLocked();
  } finally {
    await release();
  }

  async function syncLocked(): Promise<OpenCodeV2CompactionRouting> {
    const ownedIds = await readOwnedCredentialIds(credentialStateFile);
    const label = `claudex-switch-${profileId}-${randomUUID()}`;
    return await withOpenCodePrivateServer(env, async (baseUrl, password) => {
      await waitForManagedIntegrationKeyMethod(fetcher, baseUrl, password);

      const config = parseConfigContent(env.OPENCODE_CONFIG_CONTENT);
      const model = config.model;
      if (
        typeof model !== "string" ||
        !model.startsWith(`${OPENCODE_V2_MANAGED_PROVIDER_ID}/`)
      ) {
        throw new Error("OpenCode V2's managed Go model is not configured for this alias.");
      }
      const providers = isRecord(config.providers) ? config.providers : {};
      const managedProvider = providers[OPENCODE_V2_MANAGED_PROVIDER_ID];
      const managedModelMap = isRecord(managedProvider) ? managedProvider.models : undefined;
      const modelIds = isRecord(managedModelMap) ? Object.keys(managedModelMap) : [];
      if (modelIds.length === 0) {
        throw new Error("OpenCode V2's managed Go model inventory is empty for this alias.");
      }
      const routing = await verifyEffectiveOpenCodeRouting(
        fetcher,
        baseUrl,
        password,
        modelIds.map((id) => `${OPENCODE_GO_PROVIDER_ID}/${id}`),
      );

      const encodedId = encodeURIComponent(OPENCODE_V2_MANAGED_PROVIDER_ID);
      const connected = await fetchOpenCodeApi(
        fetcher,
        baseUrl,
        `/api/integration/${encodedId}/connect/key`,
        password,
        { method: "POST", body: JSON.stringify({ key, label }) },
      );
      // A failed or ambiguous write is never retried: fail closed so we don't
      // accidentally rotate or duplicate credentials after a lost response.
      if (connected.status !== 204) {
        throw new Error("OpenCode V2 could not store the selected key in this alias's private database.");
      }

      const current = await fetchOpenCodeApi(
        fetcher,
        baseUrl,
        `/api/integration/${encodedId}`,
        password,
        { method: "GET" },
      );
      if (!current.ok) {
        throw new Error("Could not verify the selected key in this alias's private database.");
      }
      const integration = locationData(await responseJson(current));
      if (
        !isRecord(integration) ||
        integration.id !== OPENCODE_V2_MANAGED_PROVIDER_ID ||
        !Array.isArray(integration.connections)
      ) {
        throw new Error("OpenCode V2 returned an unexpected private credential response.");
      }
      const connections = integration.connections;
      const active = connections[0];
      if (
        !isRecord(active) ||
        active.type !== "credential" ||
        active.label !== label ||
        typeof active.id !== "string" ||
        active.id.length === 0
      ) {
        throw new Error("OpenCode V2 did not activate the selected key in this alias's private database.");
      }

      // Track ownership before cleanup. Only credentials created by this
      // adapter are eligible for removal; user-created /connect credentials
      // remain untouched in the alias-private database.
      let tracked = [...new Set([...ownedIds, active.id])];
      await writeOwnedCredentialIds(credentialStateFile, tracked);
      const currentIds = new Set(
        connections.flatMap((connection) =>
          isRecord(connection) && connection.type === "credential" && typeof connection.id === "string"
            ? [connection.id]
            : [],
        ),
      );
      for (const id of ownedIds) {
        if (id === active.id) continue;
        if (!currentIds.has(id)) {
          tracked = tracked.filter((credentialId) => credentialId !== id);
          await writeOwnedCredentialIds(credentialStateFile, tracked);
          continue;
        }
        try {
          const removed = await fetchOpenCodeApi(
            fetcher,
            baseUrl,
            `/api/credential/${encodeURIComponent(id)}`,
            password,
            { method: "DELETE" },
          );
          if (removed.ok || removed.status === 204 || removed.status === 404) {
            tracked = tracked.filter((credentialId) => credentialId !== id);
            await writeOwnedCredentialIds(credentialStateFile, tracked);
          }
        } catch {
          // Failed cleanup is retried next run; the active key was verified.
        }
      }
      return routing;
    }, spawnCommand);
  }
}

export async function prepareOpenCodeV2RunEnvironment(
  profileId: string,
  selectedModel?: string,
  credentialSync: OpenCodeV2CredentialSync = (id, key, env) =>
    syncOpenCodeV2CredentialToPrivateDatabase(id, key, env),
): Promise<PreparedOpenCodeRunEnvironment> {
  const key = await readOpenCodeGoApiKey(profileId);
  if (!key) throw new Error("OpenCode Go credential is missing from this profile.");
  const sourceConfig = process.env.OPENCODE_CONFIG_CONTENT;
  const history = await rememberOpenCodeV2Model(profileId, sourceConfig, selectedModel);
  // The managed provider only exposes models listed in its overlay, so add the
  // live Go catalog to make every Go model selectable in the TUI picker.
  // Offline, the alias's own model history still works.
  const catalog = await fetchOpenCodeGoCatalogIds();
  const managedModels = [...new Set([
    ...history,
    ...[...(catalog ?? [])].map((id) => `${OPENCODE_GO_PROVIDER_ID}/${id}`),
  ])];
  const managedConfig = buildOpenCodeV2Config(sourceConfig, selectedModel, managedModels);
  const serializedConfig = JSON.stringify(managedConfig);
  const selectedManagedModelId =
    typeof managedConfig.model === "string" &&
    managedConfig.model.startsWith(`${OPENCODE_V2_MANAGED_PROVIDER_ID}/`)
      ? managedConfig.model.slice(OPENCODE_V2_MANAGED_PROVIDER_ID.length + 1)
      : undefined;

  const privateRoot = openCodeProfileV2RuntimeDir(profileId);
  const dataHome = openCodeProfileV2DataHome(profileId);
  const stateHome = join(privateRoot, "state");
  const cacheHome = join(privateRoot, "cache");
  const legacyAuthFile = join(dataHome, "opencode", "auth.json");

  if (await fileExists(legacyAuthFile)) {
    throw new Error(
      "OpenCode V2 found a legacy auth.json in this alias's private runtime data. It will not import that file into this alias's SQLite database; preserve or remove it before retrying.",
    );
  }

  await mkdir(privateRoot, { recursive: true, mode: 0o700 });
  await chmod(privateRoot, 0o700);
  await Promise.all(
    [dataHome, join(dataHome, "opencode"), stateHome, cacheHome].map((path) =>
      mkdir(path, { recursive: true, mode: 0o700 }),
    ),
  );

  const env = { ...process.env };
  delete env.OPENCODE_AUTH_CONTENT;
  delete env[OPENCODE_NATIVE_GO_KEY_ENV];
  delete env.OPENCODE_PASSWORD;
  // Never inherit an explicit database path from the user's environment.
  // Each OpenCode Go alias owns its credential/history database.
  env.OPENCODE_DB = openCodeProfileV2DatabaseFile(profileId);
  env.XDG_DATA_HOME = dataHome;
  env.XDG_STATE_HOME = stateHome;
  env.XDG_CACHE_HOME = cacheHome;
  env.OPENCODE_CONFIG_CONTENT = serializedConfig;
  env.OPENCODE_DISABLE_MODELS_FETCH = "1";
  const routing = await credentialSync(profileId, key, env);
  if (!routing) return { env };
  // Small-window models get a session-only ~90% compaction buffer in this
  // run's managed config content only; the user's own OpenCode configuration
  // is untouched.
  const applied = applyManagedCompactionPolicy(
    serializedConfig,
    routing,
    selectedManagedModelId,
  );
  env.OPENCODE_CONFIG_CONTENT = applied.configContent;
  return { env, compactionGuard: applied.guard };
}
