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
  copyCredentials,
  deleteCredentials,
} from "./credentials";
import { readOAuthAccount, writeOAuthAccount } from "./account";
import { fileExists, readJson, writeJson } from "../../lib/fs";
import { applyApiConfig, clearApiConfig, getApiConfig } from "./settings";
import { maskKey } from "../../lib/ui";
import type {
  ProfileState,
  ProfileInfo,
  ProfileData,
  OAuthAccount,
  ClaudeApiProfileConfig,
  ApiKeyProfileData,
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

export async function addOAuthProfile(
  name: string,
  fromCredentials: string = CREDENTIALS_FILE,
): Promise<void> {
  await ensureDir(claudeProfileDir(name));
  await copyCredentials(fromCredentials, claudeProfileCredentials(name));
  await writeProfileData(name, { type: "oauth" });

  const account = await readOAuthAccount();
  if (account) {
    await writeJson(claudeProfileAccountFile(name), account);
  }

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
      await snapshotCurrentOAuthProfile(state.active);
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
      await snapshotCurrentOAuthProfile(state.active);
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

async function activateProfile(
  name: string,
  targetData: ProfileData,
): Promise<void> {
  if (targetData.type === "api-key") {
    await deleteCredentials(CREDENTIALS_FILE);
    await writeOAuthAccount(null);
    await applyApiConfig(targetData);
  } else {
    await clearApiConfig();
    await copyCredentials(claudeProfileCredentials(name), CREDENTIALS_FILE);

    const savedAccount = await readJson<OAuthAccount | null>(
      claudeProfileAccountFile(name),
      null,
    );
    await writeOAuthAccount(savedAccount);
  }
}

async function isProfileApplied(
  name: string,
  targetData: ProfileData,
): Promise<boolean> {
  if (targetData.type === "api-key") {
    return sameApiConfig(targetData, await getApiConfig());
  }

  if (await getApiConfig()) return false;
  if (!(await readCredentials(CREDENTIALS_FILE))) return false;

  const savedAccount = await readJson<OAuthAccount | null>(
    claudeProfileAccountFile(name),
    null,
  );
  if (!savedAccount) return true;

  return sameOAuthAccount(savedAccount, await readOAuthAccount());
}

function sameOAuthAccount(
  expected: OAuthAccount,
  actual: OAuthAccount | null,
): boolean {
  const expectedId = expected.accountUuid ?? expected.emailAddress ?? null;
  const actualId = actual?.accountUuid ?? actual?.emailAddress ?? null;
  return Boolean(expectedId && actualId && expectedId === actualId);
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
