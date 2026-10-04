import { acquireProfileLock } from "./lock";
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

export interface PreparedOpenCodeRunEnvironment {
  env: NodeJS.ProcessEnv;
}

export type OpenCodeV2CredentialSync = (
  profileId: string,
  key: string,
  env: NodeJS.ProcessEnv,
) => Promise<void>;

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
  // Keep managed OpenCode Go as the only provider available to this alias run.
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
  experimental.policies = [
    ...userNonDenies,
    denyOtherProviders,
    allowManagedProvider,
    ...userDenies,
  ];
  config.experimental = experimental;

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
  config.enabled_providers = [providerId];
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
    const existing = await readModelInventory(inventoryFile);
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

export async function verifyEffectiveOpenCodeRouting(
  fetcher: FetchFunction,
  baseUrl: string,
  password: string,
  managedModels: string[],
  providerId = OPENCODE_V2_MANAGED_PROVIDER_ID,
  validateConfig?: (entries: unknown) => void,
): Promise<void> {
  const configResponse = await fetchOpenCodeApi(fetcher, baseUrl, "/api/config", password, {
    method: "GET",
  });
  if (!configResponse.ok) throw new Error("Could not verify OpenCode V2's effective local configuration.");
  const configEntries = await responseJson(configResponse);
  validateConfig?.(configEntries);
  const defaultAgentId = configuredDefaultAgent(configEntries);

  const agentResponse = await fetchOpenCodeApi(fetcher, baseUrl, "/api/agent", password, {
    method: "GET",
  });
  if (!agentResponse.ok) throw new Error("Could not verify OpenCode V2's selected agent.");
  const agentData = locationData(await responseJson(agentResponse));
  if (!Array.isArray(agentData)) {
    throw new Error("OpenCode V2 returned an unexpected agent inventory.");
  }
  const agent = agentData.find((item) => isRecord(item) && item.id === defaultAgentId);
  if (!isRecord(agent) || !Array.isArray(agent.permissions)) {
    throw new Error("OpenCode V2's configured default agent is unavailable in this location.");
  }
  if (agent.model !== undefined) {
    if (!isRecord(agent.model) || typeof agent.model.providerID !== "string" || typeof agent.model.id !== "string") {
      throw new Error("OpenCode V2's default agent has an invalid model setting.");
    }
    if (agent.model.providerID !== providerId) {
      throw new Error(
        `OpenCode V2 default agent "${defaultAgentId}" selects another provider. Set its model to this alias's Go model or choose a Go-compatible default agent.`,
      );
    }
    const agentModelId = agent.model.id;
    const managedModelIds = managedModels.map((model) =>
      model.slice(model.indexOf("/") + 1),
    );
    if (!managedModelIds.includes(agentModelId)) {
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
    const models: Array<{ providerID: string; id: string }> = [];
    for (const item of modelData) {
      if (!isRecord(item) || typeof item.providerID !== "string" || typeof item.id !== "string") {
        throw new Error("OpenCode V2 returned an unexpected model inventory.");
      }
      if (providerId === "opencode" && item.enabled === false) continue;
      models.push({ providerID: item.providerID, id: item.id });
    }
    const signature = JSON.stringify(
      models.toSorted((left, right) => `${left.providerID}/${left.id}`.localeCompare(`${right.providerID}/${right.id}`)),
    );
    const onlyManaged = models.every((model) => model.providerID === providerId);
    const actual = new Set(models.map((model) => model.id));
    const sameInventory =
      onlyManaged &&
      actual.size === expected.size &&
      [...expected].every((id) => actual.has(id));
    lastUnexpectedProvider = !onlyManaged;
    stablePolls = sameInventory && signature === previousSignature ? stablePolls + 1 : sameInventory ? 1 : 0;
    previousSignature = signature;
    if (stablePolls >= 3) return;
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
): Promise<void> {
  const runtimeRoot = openCodeProfileV2RuntimeDir(profileId);
  await mkdir(runtimeRoot, { recursive: true, mode: 0o700 });
  await chmod(runtimeRoot, 0o700);
  const credentialStateFile = openCodeProfileV2CredentialStateFile(profileId);
  const release = await acquireProfileLock(`${credentialStateFile}.lock`, "credential sync");
  try {
    await syncLocked();
  } finally {
    await release();
  }

  async function syncLocked(): Promise<void> {
    const ownedIds = await readOwnedCredentialIds(credentialStateFile);
    const label = `claudex-switch-${profileId}-${randomUUID()}`;
    await withOpenCodePrivateServer(env, async (baseUrl, password) => {
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
      await verifyEffectiveOpenCodeRouting(
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
  const managedModels = await rememberOpenCodeV2Model(profileId, sourceConfig, selectedModel);
  const serializedConfig = JSON.stringify(
    buildOpenCodeV2Config(sourceConfig, selectedModel, managedModels),
  );

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
  await credentialSync(profileId, key, env);
  return { env };
}
