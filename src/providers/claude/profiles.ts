import { mkdir, readdir, rm } from "fs/promises";
import {
  CLAUDE_PROFILES_DIR,
  CLAUDE_STATE_FILE,
  CREDENTIALS_FILE,
  claudeProfileDir,
  claudeProfileCredentials,
  claudeProfileDataFile,
  claudeProfileAccountFile,
} from "../../lib/paths";
import {
  readCredentials,
  writeCredentials,
  copyCredentials,
  deleteCredentials,
  readIsolatedCredentials,
  writeIsolatedCredentials,
  deleteIsolatedCredentials,
} from "./credentials";
import { readOAuthAccount, writeOAuthAccount } from "./account";
import { fileExists, readJson, writeJson } from "../../lib/fs";
import {
  applyApiConfig,
  applyOAuthConfig,
  clearApiConfig,
  getApiConfig,
  getConfiguredModel,
} from "./settings";
import { maskKey } from "../../lib/ui";
import type {
  ProfileState,
  ProfileInfo,
  ProfileData,
  OAuthAccount,
  ClaudeApiProfileConfig,
  ClaudeOAuthProfileConfig,
  ApiKeyProfileData,
  CredentialsFile,
} from "../../types";

async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function readState(): Promise<ProfileState> {
  return readJson<ProfileState>(CLAUDE_STATE_FILE, { active: null });
}

async function writeState(state: ProfileState): Promise<void> {
  await ensureDir(CLAUDE_PROFILES_DIR);
  await writeJson(CLAUDE_STATE_FILE, state);
}

async function readProfileData(name: string): Promise<ProfileData> {
  return readJson<ProfileData>(claudeProfileDataFile(name), { type: "oauth" });
}

async function writeProfileData(
  name: string,
  data: ProfileData,
): Promise<void> {
  await writeJson(claudeProfileDataFile(name), data);
}

export async function listProfiles(): Promise<ProfileInfo[]> {
  await ensureDir(CLAUDE_PROFILES_DIR);
  const state = await readState();
  const entries = await readdir(CLAUDE_PROFILES_DIR, { withFileTypes: true });
  const profiles: ProfileInfo[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const data = await readProfileData(entry.name);
    let label: string | null = null;

    if (data.type === "api-key" && data.apiKey) {
      label = maskKey(data.apiKey);
    } else {
      const creds = await readCredentials(
        claudeProfileCredentials(entry.name),
      );
      label = creds?.claudeAiOauth?.subscriptionType ?? null;
    }

    profiles.push({
      name: entry.name,
      type: data.type,
      label,
      isActive: state.active === entry.name,
    });
  }

  return profiles.sort((a, b) => a.name.localeCompare(b.name));
}

export async function profileExists(name: string): Promise<boolean> {
  return fileExists(claudeProfileDataFile(name));
}

export async function getProfileData(name: string): Promise<ProfileData> {
  return readProfileData(name);
}

export async function updateProfileDefaultModel(
  name: string,
  model: string,
): Promise<ProfileData> {
  if (!(await profileExists(name))) {
    throw new Error(`Profile "${name}" does not exist`);
  }

  const currentData = await readProfileData(name);
  const normalizedModel = normalizeOptionalValue(model);
  if (!normalizedModel) {
    throw new Error("Default model cannot be empty");
  }

  const nextData =
    currentData.type === "api-key"
      ? normalizeApiKeyProfileData({
          ...currentData,
          model: normalizedModel,
        })
      : normalizeOAuthProfileData({ defaultModel: normalizedModel });

  await writeProfileData(name, nextData);

  const state = await readState();
  if (state.active === name) {
    await activateProfile(name, nextData);
  }

  return nextData;
}

export async function addOAuthProfile(
  name: string,
  fromCredentials: string = CREDENTIALS_FILE,
  config: ClaudeOAuthProfileConfig = {},
): Promise<void> {
  const data = normalizeOAuthProfileData(config);
  await ensureDir(claudeProfileDir(name));
  await copyCredentials(fromCredentials, claudeProfileCredentials(name));
  await writeProfileData(name, data);

  const account = await readOAuthAccount();
  if (account) {
    await writeJson(claudeProfileAccountFile(name), account);
  }

  await activateProfile(name, data);
  await writeState({ active: name });
}

export async function addApiKeyProfile(
  name: string,
  config: ClaudeApiProfileConfig,
): Promise<void> {
  const state = await readState();
  if (
    state.active &&
    state.active !== name &&
    (await profileExists(state.active))
  ) {
    const oldData = await readProfileData(state.active);
    if (oldData.type === "oauth") {
      await snapshotCurrentOAuthProfileIfLiveMatches(state.active);
    }
  }

  await ensureDir(claudeProfileDir(name));
  const data = normalizeApiKeyProfileData(config);
  await writeProfileData(name, data);
  await activateProfile(name, data);
  await writeState({ active: name });
}

export async function switchProfile(name: string): Promise<ProfileData> {
  if (!(await profileExists(name))) {
    throw new Error(`Profile "${name}" does not exist`);
  }

  const state = await readState();
  const targetData = await readProfileData(name);
  if (state.active === name && (await isProfileApplied(name, targetData))) {
    return targetData;
  }

  // Save current credentials back before loading target
  if (state.active && state.active !== name) {
    const oldData = await readProfileData(state.active);
    if (oldData.type === "oauth") {
      await snapshotCurrentOAuthProfileIfLiveMatches(state.active);
    }
  }

  await activateProfile(name, targetData);
  await writeState({ active: name });
  return targetData;
}

async function snapshotCurrentOAuthProfile(name: string): Promise<void> {
  const currentCreds = await readCredentials(CREDENTIALS_FILE);
  if (currentCreds) {
    await ensureDir(claudeProfileDir(name));
    await copyCredentials(
      CREDENTIALS_FILE,
      claudeProfileCredentials(name),
    );
  }

  const currentAccount = await readOAuthAccount();
  if (currentAccount) {
    await writeJson(claudeProfileAccountFile(name), currentAccount);
  }
}

async function snapshotCurrentOAuthProfileIfLiveMatches(
  name: string,
): Promise<boolean> {
  const savedAccount = await readJson<OAuthAccount | null>(
    claudeProfileAccountFile(name),
    null,
  );

  if (savedAccount) {
    const liveAccount = await readOAuthAccount();
    if (!sameOAuthSession(savedAccount, liveAccount)) {
      return false;
    }
  }

  await snapshotCurrentOAuthProfile(name);
  return true;
}

async function activateProfile(
  name: string,
  targetData: ProfileData,
): Promise<void> {
  if (targetData.type === "api-key") {
    await deleteCredentials(CREDENTIALS_FILE);
    await writeOAuthAccount(null);
    await applyApiConfig(targetData);
  } else {
    await applyOAuthConfig(targetData.defaultModel);
    await restoreOAuthCredentials(name);
  }
}

async function restoreOAuthCredentials(name: string): Promise<void> {
  const savedAccount = await readJson<OAuthAccount | null>(
    claudeProfileAccountFile(name),
    null,
  );

  // A running session for this same account keeps refreshing its OAuth token in
  // the live store, and Anthropic rotates the refresh token on every refresh so
  // the previous one is invalidated. The on-disk snapshot only updates when we
  // switch away, so it can hold a rotated-out (dead) refresh token. If the live
  // credentials already belong to this profile's account, they are the fresher
  // copy: keep them and refresh the snapshot instead of clobbering the live
  // token, which would otherwise force the running session to log in again.
  if (savedAccount) {
    const liveCreds = await readCredentials(CREDENTIALS_FILE);
    const liveAccount = await readOAuthAccount();
    if (liveCreds && sameOAuthSession(savedAccount, liveAccount)) {
      await snapshotCurrentOAuthProfile(name);
      return;
    }
  }

  const creds = await readFreshestProfileCredentials(name);
  if (!creds) {
    throw new Error(
      `No credentials found at ${claudeProfileCredentials(name)}`,
    );
  }
  await writeCredentials(creds, CREDENTIALS_FILE);
  await writeOAuthAccount(savedAccount);
}

function oauthExpiresAt(creds: CredentialsFile | null): number {
  return creds?.claudeAiOauth?.expiresAt ?? 0;
}

function pickFresherCredentials(
  a: CredentialsFile | null,
  b: CredentialsFile | null,
): CredentialsFile | null {
  if (!a) return b;
  if (!b) return a;
  return oauthExpiresAt(b) > oauthExpiresAt(a) ? b : a;
}

// Rotated refresh tokens mean an older copy of the same account's credentials
// may already be dead. A profile can have two copies: the file snapshot and
// the isolated live store that `-run` sessions refresh in place. Prefer
// whichever was refreshed last (expiresAt is bumped on every refresh).
async function readFreshestProfileCredentials(
  name: string,
): Promise<CredentialsFile | null> {
  const snapshot = await readCredentials(claudeProfileCredentials(name));
  const isolated = await readIsolatedCredentials(claudeProfileDir(name));
  return pickFresherCredentials(snapshot, isolated);
}

// Seed the profile's isolated live credential store for a `-run` session
// launched with CLAUDE_SECURESTORAGE_CONFIG_DIR pointing at the profile dir.
// Once the session is running, Claude Code reads and refreshes tokens directly
// in that per-profile store, so global account switches can no longer flip the
// session's account (and the session can no longer clobber other accounts).
// Returns the directory to pass via CLAUDE_SECURESTORAGE_CONFIG_DIR.
export async function prepareIsolatedOAuthRun(name: string): Promise<string> {
  if (!(await profileExists(name))) {
    throw new Error(`Profile "${name}" does not exist`);
  }

  const dir = claudeProfileDir(name);
  const snapshot = await readCredentials(claudeProfileCredentials(name));
  const isolated = await readIsolatedCredentials(dir);
  let freshest = pickFresherCredentials(snapshot, isolated);

  // If this profile is also the active global one and the global live session
  // still belongs to it, the global store may hold newer rotated tokens.
  const state = await readState();
  if (state.active === name) {
    const savedAccount = await readJson<OAuthAccount | null>(
      claudeProfileAccountFile(name),
      null,
    );
    if (savedAccount && sameOAuthSession(savedAccount, await readOAuthAccount())) {
      freshest = pickFresherCredentials(
        freshest,
        await readCredentials(CREDENTIALS_FILE),
      );
    }
  }

  if (!freshest) {
    throw new Error(
      `No credentials stored for Claude profile "${name}". Switch to it and log in first.`,
    );
  }

  await ensureDir(dir);
  if (oauthExpiresAt(freshest) > oauthExpiresAt(isolated) || !isolated) {
    await writeIsolatedCredentials(freshest, dir);
  }
  if (oauthExpiresAt(freshest) > oauthExpiresAt(snapshot)) {
    await writeCredentials(freshest, claudeProfileCredentials(name));
  }

  return dir;
}

// After an isolated `-run` session ends, fold any tokens it refreshed back
// into the profile snapshot so later global switches restore a live refresh
// token instead of a rotated-out one.
export async function syncIsolatedOAuthSnapshot(name: string): Promise<void> {
  const isolated = await readIsolatedCredentials(claudeProfileDir(name));
  if (!isolated) return;
  const snapshot = await readCredentials(claudeProfileCredentials(name));
  if (oauthExpiresAt(isolated) > oauthExpiresAt(snapshot)) {
    await writeCredentials(isolated, claudeProfileCredentials(name));
  }
}

async function isProfileApplied(
  name: string,
  targetData: ProfileData,
): Promise<boolean> {
  if (targetData.type === "api-key") {
    if (!sameApiConfig(targetData, await getApiConfig())) return false;
    if (await readCredentials(CREDENTIALS_FILE)) return false;
    if (await readOAuthAccount()) return false;
    return true;
  }

  if (await getApiConfig()) return false;
  if (
    normalizeOptionalValue(targetData.defaultModel) !==
      normalizeOptionalValue(await getConfiguredModel())
  ) {
    return false;
  }
  if (!(await readCredentials(CREDENTIALS_FILE))) return false;

  const savedAccount = await readJson<OAuthAccount | null>(
    claudeProfileAccountFile(name),
    null,
  );
  if (!savedAccount) return true;

  return sameOAuthSession(savedAccount, await readOAuthAccount());
}

function sameOAuthAccount(
  expected: OAuthAccount,
  actual: OAuthAccount | null,
): boolean {
  const expectedId = expected.accountUuid ?? expected.emailAddress ?? null;
  const actualId = actual?.accountUuid ?? actual?.emailAddress ?? null;
  return Boolean(expectedId && actualId && expectedId === actualId);
}

// Whether the live credentials belong to the exact same login *and*
// organization as the target profile. Two profiles can share a login
// (accountUuid/email) but point at different orgs; those must not be treated as
// interchangeable, otherwise we would keep the wrong org's live session and
// overwrite the target profile's snapshot with it.
function sameOAuthSession(
  expected: OAuthAccount,
  actual: OAuthAccount | null,
): boolean {
  return (
    sameOAuthAccount(expected, actual) &&
    expected.organizationUuid === actual?.organizationUuid
  );
}

export async function snapshotActiveOAuthProfile(
  name: string,
): Promise<void> {
  if (!(await profileExists(name))) {
    throw new Error(`Profile "${name}" does not exist`);
  }

  const data = await readProfileData(name);
  if (data.type !== "oauth") {
    throw new Error(`Profile "${name}" is not an OAuth profile`);
  }

  const currentCreds = await readCredentials(CREDENTIALS_FILE);
  if (!currentCreds) {
    throw new Error("No active Claude credentials found");
  }

  await ensureDir(claudeProfileDir(name));
  await copyCredentials(CREDENTIALS_FILE, claudeProfileCredentials(name));

  const currentAccount = await readOAuthAccount();
  if (currentAccount) {
    await writeJson(claudeProfileAccountFile(name), currentAccount);
  }
}

export async function removeProfile(name: string): Promise<void> {
  if (!(await profileExists(name))) {
    throw new Error(`Profile "${name}" does not exist`);
  }

  const state = await readState();
  const data = await readProfileData(name);

  if (state.active === name && data.type === "api-key") {
    await clearApiConfig();
  }

  if (data.type === "oauth") {
    await deleteIsolatedCredentials(claudeProfileDir(name));
  }

  await rm(claudeProfileDir(name), { recursive: true });

  if (state.active === name) {
    await writeState({ active: null });
  }
}

function normalizeOptionalValue(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeApiKeyProfileData(
  config: ClaudeApiProfileConfig,
): ApiKeyProfileData {
  return {
    type: "api-key",
    apiKey: config.apiKey.trim(),
    ...(normalizeOptionalValue(config.baseUrl)
      ? { baseUrl: normalizeOptionalValue(config.baseUrl) }
      : {}),
    ...(normalizeOptionalValue(config.authToken)
      ? { authToken: normalizeOptionalValue(config.authToken) }
      : {}),
    ...(normalizeOptionalValue(config.model)
      ? { model: normalizeOptionalValue(config.model) }
      : {}),
    ...(normalizeOptionalValue(config.defaultSonnetModel)
      ? { defaultSonnetModel: normalizeOptionalValue(config.defaultSonnetModel) }
      : {}),
    ...(normalizeOptionalValue(config.defaultOpusModel)
      ? { defaultOpusModel: normalizeOptionalValue(config.defaultOpusModel) }
      : {}),
    ...(normalizeOptionalValue(config.defaultHaikuModel)
      ? { defaultHaikuModel: normalizeOptionalValue(config.defaultHaikuModel) }
      : {}),
  };
}

function normalizeOAuthProfileData(
  config: ClaudeOAuthProfileConfig,
): ProfileData {
  const defaultModel = normalizeOptionalValue(config.defaultModel);
  if (defaultModel) {
    return { type: "oauth", defaultModel };
  }

  return { type: "oauth" };
}

function sameApiConfig(
  expected: ClaudeApiProfileConfig,
  actual: ClaudeApiProfileConfig | null,
): boolean {
  if (!actual) return false;

  return (
    expected.apiKey === actual.apiKey &&
    normalizeOptionalValue(expected.baseUrl) ===
      normalizeOptionalValue(actual.baseUrl) &&
    normalizeOptionalValue(expected.authToken) ===
      normalizeOptionalValue(actual.authToken) &&
    normalizeOptionalValue(expected.model) ===
      normalizeOptionalValue(actual.model) &&
    normalizeOptionalValue(expected.defaultSonnetModel) ===
      normalizeOptionalValue(actual.defaultSonnetModel) &&
    normalizeOptionalValue(expected.defaultOpusModel) ===
      normalizeOptionalValue(actual.defaultOpusModel) &&
    normalizeOptionalValue(expected.defaultHaikuModel) ===
      normalizeOptionalValue(actual.defaultHaikuModel)
  );
}
