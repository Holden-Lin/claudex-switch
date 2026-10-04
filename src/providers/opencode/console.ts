import { spawn } from "child_process";
import { chmod, mkdir } from "fs/promises";
import { join } from "path";
import { cleanupOpenShimDir, createOpenShimDir } from "../../lib/browser";
import { OPENCODE_LOCKS_DIR, openCodeProfileConsoleLock, openCodeProfileV2DatabaseFile, openCodeProfileV2DataHome, openCodeProfileV2RuntimeDir } from "../../lib/paths";
import type { OpenCodeGoProfileData, UsageFetchResult, UsageInfo } from "../../types";
import { readOpenCodeConsoleCredentials, type OpenCodeConsoleCredential } from "./native";
import { createOpenCodeProfileId, getOpenCodeProfileData, removeOpenCodeProfile, saveOpenCodeConsoleProfile } from "./profiles";
import { acquireProfileLock, fetchOpenCodeApi, locationData, restrictOpenCodeProviders, verifyEffectiveOpenCodeRouting, withOpenCodePrivateServer } from "./runtime";

type JsonRecord = Record<string, unknown>;
class ConsoleReconnectError extends Error {}
function record(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export async function openCodeConsoleEnvironment(profileId: string): Promise<NodeJS.ProcessEnv> {
  const root = openCodeProfileV2RuntimeDir(profileId);
  const data = openCodeProfileV2DataHome(profileId);
  for (const path of [root, data, join(data, "opencode"), join(root, "state"), join(root, "cache"), OPENCODE_LOCKS_DIR]) {
    await mkdir(path, { recursive: true, mode: 0o700 });
    await chmod(path, 0o700);
  }
  const env = { ...process.env };
  delete env.OPENCODE_AUTH_CONTENT;
  delete env.OPENCODE_API_KEY;
  delete env.OPENCODE_PASSWORD;
  env.OPENCODE_DB = openCodeProfileV2DatabaseFile(profileId);
  env.XDG_DATA_HOME = data;
  env.XDG_STATE_HOME = join(root, "state");
  env.XDG_CACHE_HOME = join(root, "cache");
  env.OPENCODE_DISABLE_AUTOUPDATE = "1";
  env.OPENCODE_DISABLE_MODELS_FETCH = "1";
  return env;
}

function consoleUrl(credential: OpenCodeConsoleCredential, path: string): URL {
  const url = new URL(`${credential.value.metadata.server.replace(/\/$/, "")}${path}`);
  // Native OpenCode supports self-hosted Consoles. HTTP is local-test only.
  if (url.username || url.password || url.search || url.hash ||
      (url.protocol !== "https:" && !(url.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)))) {
    throw new Error("Invalid OpenCode Console server address.");
  }
  return url;
}

async function consoleGet(credential: OpenCodeConsoleCredential, path: string): Promise<Response> {
  return fetch(consoleUrl(credential, path), {
    headers: { Authorization: `Bearer ${credential.value.access}`, "x-org-id": credential.value.metadata.orgID },
    signal: AbortSignal.timeout(5_000), redirect: "error",
  });
}

/** The Console subscription is active until access.endsAt, including pending cancellation. */
export function parseOpenCodeConsoleStatus(data: unknown, now = Date.now()): { active: boolean; usage: UsageInfo | null } {
  if (!record(data) || !record(data.access)) return { active: false, usage: null };
  const access = data.access;
  const endsAt = typeof access.endsAt === "string" ? Date.parse(access.endsAt) : NaN;
  const startsAt = typeof access.startsAt === "string" ? Date.parse(access.startsAt) : null;
  if (!Number.isFinite(endsAt) || endsAt <= now || (startsAt !== null && (!Number.isFinite(startsAt) || startsAt > now))) {
    return { active: false, usage: null };
  }
  const meters = record(access.meters) ? access.meters : {};
  const meter = (value: unknown) => {
    if (!record(value) || typeof value.limitMicroCents !== "string" || typeof value.usedMicroCents !== "string" ||
        !/^\d+$/.test(value.limitMicroCents) || !/^\d+$/.test(value.usedMicroCents)) return null;
    const limit = Number(value.limitMicroCents), used = Number(value.usedMicroCents);
    if (!Number.isFinite(limit) || limit <= 0 || !Number.isFinite(used)) return null;
    const resetsAt = typeof value.resetsAt === "string" ? Date.parse(value.resetsAt) : NaN;
    return { used: Math.min(100, used / limit * 100), resetsAt: Number.isFinite(resetsAt) ? resetsAt : null };
  };
  const fiveHour = meter(meters.fiveHour), week = meter(meters.week), month = meter(meters.month);
  return { active: true, usage: !fiveHour && !week && !month ? null : {
    fiveHourUsedPercent: fiveHour?.used ?? null, fiveHourResetsAt: fiveHour?.resetsAt ?? null,
    weeklyUsedPercent: week?.used ?? null, weeklyResetsAt: week?.resetsAt ?? null,
    monthlyUsedPercent: month?.used ?? null, monthlyResetsAt: month ? month.resetsAt ?? endsAt : null,
  } };
}

async function requireSubscription(credential: OpenCodeConsoleCredential): Promise<UsageInfo | null> {
  const response = await consoleGet(credential, "/api/go/status");
  if (response.status === 401 || response.status === 403) throw new ConsoleReconnectError("OpenCode Console authorization expired; reconnect this account.");
  if (!response.ok) throw new Error("Could not verify the Go subscription; retry when OpenCode Console is reachable.");
  const status = parseOpenCodeConsoleStatus(await response.json());
  if (!status.active) throw new Error("The selected workspace has no active Go subscription. Sign in again and authorize the workspace that owns Go.");
  return status.usage;
}

export async function readPinnedConsoleCredential(profileId: string, profile?: OpenCodeGoProfileData): Promise<OpenCodeConsoleCredential> {
  const identity = (profile ?? await getOpenCodeProfileData(profileId)).console;
  if (!identity) throw new Error("This profile has no OpenCode subscription login.");
  const credential = (await readOpenCodeConsoleCredentials(openCodeProfileV2DatabaseFile(profileId)))
    .find((item) => item.id === identity.credentialId);
  if (!credential || credential.value.metadata.accountID !== identity.accountId || credential.value.metadata.orgID !== identity.orgId) {
    throw new Error("OpenCode subscription identity is missing or changed; reconnect this alias.");
  }
  return credential;
}

async function nativeModels(env: NodeJS.ProcessEnv, credentialId: string): Promise<JsonRecord[]> {
  return withOpenCodePrivateServer(env, async (baseUrl, password) => {
    const activated = await fetchOpenCodeApi(fetch, baseUrl, `/api/credential/${encodeURIComponent(credentialId)}/activate`, password, { method: "POST" });
    if (activated.status !== 204) throw new Error("Could not select this alias's OpenCode subscription.");
    const deadline = Date.now() + 10_000;
    let signature = "";
    let stable = 0;
    while (Date.now() < deadline) {
      const response = await fetchOpenCodeApi(fetch, baseUrl, "/api/model", password);
      if (response.ok) {
        const models = locationData(await response.json());
        if (Array.isArray(models) && models.some((item) => record(item) && item.providerID === "opencode" && item.enabled !== false)) {
          const integrationResponse = await fetchOpenCodeApi(fetch, baseUrl, "/api/integration/opencode", password);
          const integration = integrationResponse.ok ? locationData(await integrationResponse.json()) : null;
          if (record(integration) && Array.isArray(integration.connections) && record(integration.connections[0]) &&
              integration.connections[0].id === credentialId && record(integration.connections[0].status) &&
              integration.connections[0].status.status === "needs_auth") {
            throw new ConsoleReconnectError("OpenCode subscription authorization needs reconnecting.");
          }
          const stored = (await readOpenCodeConsoleCredentials(env.OPENCODE_DB!)).find((item) => item.id === credentialId);
          if (stored && stored.value.expires > Date.now() + 5 * 60_000 && record(integration) &&
              Array.isArray(integration.connections) && record(integration.connections[0]) &&
              integration.connections[0].id === credentialId && !integration.connections[0].status) {
            const nextSignature = JSON.stringify(models);
            stable = nextSignature === signature ? stable + 1 : 0;
            signature = nextSignature;
            if (stable >= 2) return models.filter(record);
          }
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error("OpenCode could not load this workspace's subscription models; reconnect or retry.");
  });
}

async function goModels(models: JsonRecord[], credential: OpenCodeConsoleCredential): Promise<JsonRecord[]> {
  const configResponse = await consoleGet(credential, "/api/v2/config");
  if (!configResponse.ok) throw new Error("Could not verify the workspace's Console model configuration.");
  const config = await configResponse.json();
  const provider = record(config) && record(config.providers) ? config.providers.opencode : null;
  const declaredModels = record(provider) && record(provider.models) ? new Set(Object.keys(provider.models)) : new Set();
  const response = await fetch("https://opencode.ai/zen/go/v1/models", { signal: AbortSignal.timeout(5_000), redirect: "error" });
  if (!response.ok) throw new Error("Could not load OpenCode's Go model catalog.");
  const data = await response.json();
  const ids = new Set(record(data) && Array.isArray(data.data) ? data.data.flatMap((item: unknown) => record(item) && typeof item.id === "string" ? [item.id] : []) : []);
  // Match declared IDs exactly. A paid/custom alias of a Go model is not a Go route.
  const available = models.filter((item) => item.providerID === "opencode" && declaredModels.has(String(item.id)) &&
    item.enabled !== false && typeof item.id === "string" && ids.has(item.id));
  if (available.length === 0) throw new Error("This Console workspace has no available Go models; check its subscription and retry.");
  return available;
}

export function normalizeOpenCodeConsoleModel(model: string): string {
  const trimmed = model.trim();
  // Existing Go model spelling is convenient for both account types.
  const normalized = trimmed.replace(/^opencode-go\//, "opencode/");
  if (!/^opencode\/[^/\s]+$/.test(normalized)) throw new Error("Subscription models must use opencode/<model> or opencode-go/<model>.");
  return normalized;
}

function validateConsoleProvider(provider: JsonRecord): void {
  if (provider.settings || provider.headers || provider.body || provider.canonical || provider.package || provider.env) {
    throw new Error("Remove custom OpenCode provider routing before using a subscription alias.");
  }
  const overrides = provider.models ?? {};
  if (!record(overrides)) throw new Error("Invalid OpenCode model configuration.");
  for (const previous of Object.values(overrides)) {
    if (!record(previous)) throw new Error("Invalid OpenCode model override.");
    if (previous.settings || previous.headers || previous.body || previous.package || previous.modelID) {
      throw new Error("Remove custom OpenCode model routing before using a subscription alias.");
    }
    if (previous.variants !== undefined && (!Array.isArray(previous.variants) || previous.variants.some((variant) =>
      !record(variant) || variant.settings || variant.headers || variant.body))) {
      throw new Error("Remove custom OpenCode model variant routing before using a subscription alias.");
    }
  }
}

export function buildOpenCodeConsoleConfig(source: string | undefined, model: string, models: JsonRecord[], go: JsonRecord[]): JsonRecord {
  const config: unknown = source?.trim() ? JSON.parse(source) : {};
  if (!record(config)) throw new Error("Invalid OpenCode configuration.");
  const selected = normalizeOpenCodeConsoleModel(model);
  if (!go.some((item) => `opencode/${item.id}` === selected)) throw new Error("The selected model is unavailable through this workspace's Go subscription.");
  const providers = config.providers ?? {};
  if (!record(providers)) throw new Error("Invalid OpenCode provider configuration.");
  const provider = providers.opencode ?? {};
  if (!record(provider)) throw new Error("Invalid OpenCode Console provider configuration.");
  // Do not let user-configured keys/endpoints supersede the selected native OAuth.
  validateConsoleProvider(provider);
  const overrides = provider.models ?? {};
  if (!record(overrides)) throw new Error("Invalid OpenCode model configuration.");
  const allowed = new Set(go.map((item) => item.id));
  const selectedOverrides: JsonRecord = { ...overrides };
  const allIds = new Set([...Object.keys(overrides), ...models.filter((item) => item.providerID === "opencode").map((item) => String(item.id))]);
  for (const id of allIds) {
    const previous = selectedOverrides[id] ?? {};
    if (!record(previous)) throw new Error("Invalid OpenCode model override.");
    selectedOverrides[id] = allowed.has(id) ? previous : { ...previous, disabled: true };
  }
  config.providers = { ...providers, opencode: { ...provider, models: selectedOverrides } };
  config.model = selected;
  return restrictOpenCodeProviders(config, "opencode");
}

/** Login into a disposable native store; publish only a verified account/workspace. */
export async function loginOpenCodeConsole(profileId: string, previous?: OpenCodeGoProfileData): Promise<OpenCodeGoProfileData> {
  const stagedId = createOpenCodeProfileId();
  const stagedEnv = await openCodeConsoleEnvironment(stagedId);
  stagedEnv.OPENCODE_CONFIG_CONTENT = "{}";
  stagedEnv.XDG_CONFIG_HOME = join(openCodeProfileV2RuntimeDir(stagedId), "config");
  stagedEnv.OPENCODE_CONFIG_PROJECT_DISABLE = "1";
  delete stagedEnv.OPENCODE_CONFIG;
  delete stagedEnv.OPENCODE_CONFIG_DIR;
  const shimDir = createOpenShimDir();
  if (shimDir) stagedEnv.PATH = `${shimDir}:${stagedEnv.PATH}`;
  try {
    const child = spawn("opencode", ["auth", "login", "opencode", "--method", "device", "--standalone"], { stdio: "inherit", env: stagedEnv });
    const code = await new Promise<number | null>((resolve, reject) => { child.once("close", resolve); child.once("error", () => reject(new Error("Could not start OpenCode subscription login."))); });
    if (code !== 0) throw new Error("OpenCode subscription login was cancelled or failed; the saved account was not replaced.");
    const credential = (await readOpenCodeConsoleCredentials(openCodeProfileV2DatabaseFile(stagedId))).find((item) => item.active);
    if (!credential) throw new Error("OpenCode did not save a Console subscription credential.");
    const metadata = credential.value.metadata;
    if (previous?.console && (metadata.accountID !== previous.console.accountId || metadata.orgID !== previous.console.orgId)) {
      throw new Error("Login selected a different account or workspace; the saved account was not replaced.");
    }
    await requireSubscription(credential);
    const models = await nativeModels(stagedEnv, credential.id);
    // The native model discovery may have rotated tokens: transfer its latest value.
    const latest = (await readOpenCodeConsoleCredentials(openCodeProfileV2DatabaseFile(stagedId))).find((item) => item.id === credential.id);
    if (!latest) throw new Error("The verified OpenCode credential disappeared.");
    if (latest.value.metadata.accountID !== metadata.accountID || latest.value.metadata.orgID !== metadata.orgID) {
      throw new Error("OpenCode changed the account or workspace during verification; nothing was replaced.");
    }
    const available = await goModels(models, latest);
    const preferred = previous?.defaultModel ? normalizeOpenCodeConsoleModel(previous.defaultModel) : null;
    const defaultModel = available.some((item) => `opencode/${item.id}` === preferred) ? preferred! : `opencode/${available[0]!.id}`;
    const profile: OpenCodeGoProfileData = { type: "go", defaultModel, console: {
      credentialId: latest.id, accountId: metadata.accountID, email: metadata.email, orgId: metadata.orgID, orgName: metadata.orgName ?? metadata.orgID,
    } };
    const env = await openCodeConsoleEnvironment(profileId);
    env.OPENCODE_CONFIG_CONTENT = "{}";
    env.XDG_CONFIG_HOME = stagedEnv.XDG_CONFIG_HOME;
    env.OPENCODE_CONFIG_PROJECT_DISABLE = "1";
    delete env.OPENCODE_CONFIG;
    delete env.OPENCODE_CONFIG_DIR;
    const release = await acquireProfileLock(openCodeProfileConsoleLock(profileId), "subscription account");
    try {
      if (previous?.console) {
        const current = await getOpenCodeProfileData(profileId);
        if (current.console?.credentialId !== previous.console.credentialId) {
          throw new Error("This account changed while browser login was open; retry refresh.");
        }
        if (current.defaultModel && available.some((item) => `opencode/${item.id}` === normalizeOpenCodeConsoleModel(current.defaultModel!))) {
          profile.defaultModel = normalizeOpenCodeConsoleModel(current.defaultModel);
        }
      }
      await withOpenCodePrivateServer(env, async (baseUrl, password) => {
        const request = (path: string, init?: RequestInit) => fetchOpenCodeApi(fetch, baseUrl, path, password, init);
        const response = await request("/api/credential", { method: "POST", body: JSON.stringify({ id: latest.id, integrationID: "opencode", label: latest.label, value: latest.value, activate: false }) });
        if (!response.ok) throw new Error("Could not save the verified OpenCode subscription credential.");
        try {
          const activated = await request(`/api/credential/${encodeURIComponent(latest.id)}/activate`, { method: "POST" });
          if (activated.status !== 204) throw new Error("Could not activate the verified OpenCode subscription.");
          const stored = (await readOpenCodeConsoleCredentials(openCodeProfileV2DatabaseFile(profileId))).find((item) => item.id === latest.id && item.active);
          if (!stored || stored.value.metadata.accountID !== metadata.accountID || stored.value.metadata.orgID !== metadata.orgID) throw new Error("OpenCode stored an unexpected subscription identity.");
          await saveOpenCodeConsoleProfile(profileId, profile);
        } catch (error) {
          if (previous?.console) await request(`/api/credential/${encodeURIComponent(previous.console.credentialId)}/activate`, { method: "POST" }).catch(() => {});
          throw error;
        }
      });
    } finally { await release(); }
    return profile;
  } finally {
    cleanupOpenShimDir(shimDir);
    await removeOpenCodeProfile(stagedId);
  }
}

/** Keep the native refresh writer exclusive until the TUI exits. */
export async function prepareOpenCodeConsoleRun(profileId: string, selectedModel?: string): Promise<{ env: NodeJS.ProcessEnv; release: () => Promise<void> }> {
  const env = await openCodeConsoleEnvironment(profileId);
  const release = await acquireProfileLock(openCodeProfileConsoleLock(profileId), "subscription account");
  try {
    const profile = await getOpenCodeProfileData(profileId);
    const credential = await readPinnedConsoleCredential(profileId, profile);
    const source = env.OPENCODE_CONFIG_CONTENT;
    env.OPENCODE_CONFIG_CONTENT = "{}";
    const models = await nativeModels(env, credential.id);
    const latest = await readPinnedConsoleCredential(profileId, profile);
    await requireSubscription(latest);
    const available = await goModels(models, latest);
    env.OPENCODE_CONFIG_CONTENT = JSON.stringify(buildOpenCodeConsoleConfig(source, selectedModel ?? profile.defaultModel ?? `opencode/${available[0]!.id}`, models, available));
    await withOpenCodePrivateServer(env, async (baseUrl, password) => {
      await verifyEffectiveOpenCodeRouting(fetch, baseUrl, password, available.map((item) => `opencode/${item.id}`), "opencode", (entries) => {
        if (!Array.isArray(entries)) throw new Error("Invalid OpenCode effective configuration.");
        for (const entry of entries) {
          if (record(entry) && record(entry.info) && record(entry.info.providers) && record(entry.info.providers.opencode)) {
            validateConsoleProvider(entry.info.providers.opencode);
          }
        }
      });
      const response = await fetchOpenCodeApi(fetch, baseUrl, "/api/provider/opencode", password);
      const provider = response.ok ? locationData(await response.json()) : null;
      if (!record(provider) || provider.integrationID !== "opencode") throw new Error("OpenCode Console is not using this alias's subscription integration.");
    });
    return { env, release };
  } catch (error) { await release(); throw error; }
}

export async function fetchOpenCodeConsoleUsage(profileId: string): Promise<UsageFetchResult> {
  try {
    let credential = await readPinnedConsoleCredential(profileId);
    if (credential.value.expires <= Date.now() + 5 * 60_000) {
      const env = await openCodeConsoleEnvironment(profileId);
      env.OPENCODE_CONFIG_CONTENT = "{}";
      const release = await acquireProfileLock(openCodeProfileConsoleLock(profileId), "subscription account");
      try { await nativeModels(env, credential.id); credential = await readPinnedConsoleCredential(profileId); }
      finally { await release(); }
    }
    const response = await consoleGet(credential, "/api/go/status");
    if (response.status === 401 || response.status === 403) return { usage: null, note: "reconnect required" };
    if (!response.ok) return { usage: null, note: "quota unavailable" };
    const status = parseOpenCodeConsoleStatus(await response.json());
    return { usage: status.usage, note: !status.active ? "Go subscription required" : status.usage ? null : "quota unavailable" };
  } catch (error) { return { usage: null, note: error instanceof ConsoleReconnectError ? "reconnect required" : "quota unavailable" }; }
}
