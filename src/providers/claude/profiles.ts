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
import { readCredentials, copyCredentials } from "./credentials";
import { readOAuthAccount, writeOAuthAccount } from "./account";
import { fileExists, readJson, writeJson } from "../../lib/fs";
import { setApiKey, clearApiKey } from "./settings";
import { maskKey } from "../../lib/ui";
import type {
  ProfileState,
  ProfileInfo,
  ProfileData,
  OAuthAccount,
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
  apiKey: string,
): Promise<void> {
  await ensureDir(claudeProfileDir(name));
  await writeProfileData(name, { type: "api-key", apiKey });
  await writeState({ active: name });
  await setApiKey(apiKey);
}

export async function switchProfile(name: string): Promise<ProfileData> {
  if (!(await profileExists(name))) {
    throw new Error(`Profile "${name}" does not exist`);
  }

  const state = await readState();
  const targetData = await readProfileData(name);
  if (state.active === name) {
    return targetData;
  }

  // Save current credentials back before loading target
  if (state.active) {
    const oldData = await readProfileData(state.active);
    if (oldData.type === "oauth") {
      const currentCreds = await readCredentials(CREDENTIALS_FILE);
      if (currentCreds) {
        await ensureDir(claudeProfileDir(state.active));
        await copyCredentials(
          CREDENTIALS_FILE,
          claudeProfileCredentials(state.active),
        );
      }
      const currentAccount = await readOAuthAccount();
      if (currentAccount) {
        await writeJson(claudeProfileAccountFile(state.active), currentAccount);
      }
    }
  }

  // Activate the target profile
  if (targetData.type === "api-key" && targetData.apiKey) {
    await setApiKey(targetData.apiKey);
  } else {
    await clearApiKey();
    await copyCredentials(claudeProfileCredentials(name), CREDENTIALS_FILE);

    const savedAccount = await readJson<OAuthAccount | null>(
      claudeProfileAccountFile(name),
      null,
    );
    if (savedAccount) {
      await writeOAuthAccount(savedAccount);
    }
  }

  await writeState({ active: name });
  return targetData;
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
    await clearApiKey();
  }

  await rm(claudeProfileDir(name), { recursive: true });

  if (state.active === name) {
    await writeState({ active: null });
  }
}
