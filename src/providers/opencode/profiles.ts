import { chmod, mkdir, rename, rm, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import { dirname } from "path";
import {
  OPENCODE_GLOBAL_AUTH_FILE,
  OPENCODE_PROFILES_DIR,
  OPENCODE_STATE_FILE,
  openCodeProfileAuthFile,
  openCodeProfileDataFile,
  openCodeProfileDataHome,
  openCodeProfileDir,
  openCodeProfileV2DatabaseFile,
  OPENCODE_LOCKS_DIR,
  openCodeProfileConsoleLock,
} from "../../lib/paths";
import { fileExists, readJson, writeJsonSecure } from "../../lib/fs";
import type { OpenCodeGoProfileData, OpenCodeProfileState } from "../../types";
import { readOpenCodeConsoleCredentials } from "./native";
import { acquireProfileLock } from "./lock";

export const OPENCODE_GO_PROVIDER_ID = "opencode-go";
// V2 accounts use a separate, stable provider ID rather than the native
// opencode-go integration. This keeps its SQLite credentials from winning
// over the account selected by claudex-switch for this standalone process.
export const OPENCODE_V2_MANAGED_PROVIDER_ID = "claudex-switch-opencode-go";

type OpenCodeAuthFile = Record<string, unknown>;
type OpenCodeAuthInfo = { type: "api"; key: string } & Record<string, unknown>;

function emptyState(): OpenCodeProfileState {
  return { active: null };
}

function isOpenCodeAuthInfo(value: unknown): value is OpenCodeAuthInfo {
  if (!value || typeof value !== "object") return false;
  const info = value as Record<string, unknown>;
  // This is the public OpenCode auth schema for API keys. Requiring the shape
  // turns an early TUI exit (or an unrelated config file) into a clear failed
  // setup instead of a broken alias.
  return info.type === "api" && typeof info.key === "string" && info.key.length > 0;
}

async function ensureProfileDir(profileId: string): Promise<void> {
  const directory = openCodeProfileDir(profileId);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await chmod(directory, 0o700);
}

async function writeProfileData(profileId: string, data: OpenCodeGoProfileData): Promise<void> {
  await ensureProfileDir(profileId);
  await writeJsonSecure(openCodeProfileDataFile(profileId), data);
}

export function createOpenCodeProfileId(): string {
  return `go-${randomUUID()}`;
}

export function normalizeOpenCodeGoModel(input: string): string {
  const model = input.trim();
  if (!model.startsWith(`${OPENCODE_GO_PROVIDER_ID}/`) || model.length <= OPENCODE_GO_PROVIDER_ID.length + 1) {
    throw new Error(
      "OpenCode Go models must use the form opencode-go/<model> (for example opencode-go/kimi-k3).",
    );
  }
  return model;
}

export async function readOpenCodeState(): Promise<OpenCodeProfileState> {
  return readJson<OpenCodeProfileState>(OPENCODE_STATE_FILE, emptyState());
}

async function writeOpenCodeState(state: OpenCodeProfileState): Promise<void> {
  await mkdir(OPENCODE_PROFILES_DIR, { recursive: true, mode: 0o700 });
  await writeJsonSecure(OPENCODE_STATE_FILE, state);
}

export async function setActiveOpenCodeProfile(profileId: string): Promise<void> {
  const state = await readOpenCodeState();
  state.active = profileId;
  await writeOpenCodeState(state);
}

export async function openCodeProfileExists(profileId: string): Promise<boolean> {
  return fileExists(openCodeProfileDataFile(profileId));
}

export async function getOpenCodeProfileData(
  profileId: string,
): Promise<OpenCodeGoProfileData> {
  const data = await readJson<OpenCodeGoProfileData | null>(
    openCodeProfileDataFile(profileId),
    null,
  );
  if (!data || data.type !== "go") {
    throw new Error("OpenCode Go profile no longer exists.");
  }
  return data;
}

export async function updateOpenCodeProfileDefaultModel(
  profileId: string,
  defaultModel: string,
): Promise<OpenCodeGoProfileData> {
  const current = await getOpenCodeProfileData(profileId);
  const next = { ...current, defaultModel };
  await writeProfileData(profileId, next);
  return next;
}

/**
 * Environment used only while connecting or refreshing an account. The TUI
 * writes auth.json into this private XDG root, so /connect cannot modify the
 * user's normal OpenCode credential file.
 */
export function openCodeSetupEnvironment(profileId: string): NodeJS.ProcessEnv {
  const env = { ...process.env };
  // A parent auth-content value wins over auth.json. It must not leak into a
  // fresh /connect session for this profile.
  delete env.OPENCODE_AUTH_CONTENT;
  env.XDG_DATA_HOME = openCodeProfileDataHome(profileId);
  return env;
}

/**
 * Keep OpenCode's normal XDG data directory intact so every Go account sees
 * the same sessions in /resume. Authentication alone is selected per launch
 * through OpenCode's documented higher-precedence auth-content environment.
 */
export async function openCodeRunEnvironment(
  profileId: string,
): Promise<NodeJS.ProcessEnv> {
  const auth = await readJson<OpenCodeAuthFile>(
    openCodeProfileAuthFile(profileId),
    {},
  );
  const credential = auth[OPENCODE_GO_PROVIDER_ID];
  if (!isOpenCodeAuthInfo(credential)) {
    throw new Error("OpenCode Go credential is missing from this profile.");
  }

  const env = { ...process.env };
  env.OPENCODE_AUTH_CONTENT = JSON.stringify({
    [OPENCODE_GO_PROVIDER_ID]: credential,
  });
  return env;
}

export async function hasOpenCodeGoCredential(profileId: string): Promise<boolean> {
  const profile = await readJson<OpenCodeGoProfileData | null>(openCodeProfileDataFile(profileId), null);
  if (!profile || profile.type !== "go") return false;
  if (profile.console) {
    const credentials = await readOpenCodeConsoleCredentials(openCodeProfileV2DatabaseFile(profileId));
    return credentials.some((credential) => credential.id === profile.console!.credentialId &&
      credential.value.metadata.accountID === profile.console!.accountId &&
      credential.value.metadata.orgID === profile.console!.orgId);
  }
  return (await readOpenCodeGoApiKey(profileId)) !== null;
}

export async function saveOpenCodeConsoleProfile(
  profileId: string,
  profile: OpenCodeGoProfileData,
): Promise<void> {
  if (!profile.console) throw new Error("Subscription identity is missing.");
  await writeProfileData(profileId, profile);
}

/** Read one private Go key for an authenticated provider request. */
export async function readOpenCodeGoApiKey(
  profileId: string,
): Promise<string | null> {
  const auth = await readJson<OpenCodeAuthFile>(openCodeProfileAuthFile(profileId), {});
  const credential = auth[OPENCODE_GO_PROVIDER_ID];
  return isOpenCodeAuthInfo(credential) ? credential.key : null;
}

export async function createOpenCodeGoProfile(
  profileId: string,
  credential?: unknown,
): Promise<void> {
  await writeProfileData(profileId, { type: "go" });

  if (credential !== undefined) {
    await saveOpenCodeGoCredential(profileId, credential);
  }
}

/** Save only the selected Go API credential in claudex-switch's private profile. */
export async function saveOpenCodeGoCredential(
  profileId: string,
  credential: unknown,
): Promise<void> {
  if (!isOpenCodeAuthInfo(credential)) {
    throw new Error("The saved OpenCode Go credential is invalid.");
  }
  const authFile = openCodeProfileAuthFile(profileId);
  await mkdir(openCodeProfileDataHome(profileId), {
    recursive: true,
    mode: 0o700,
  });
  await mkdir(dirname(authFile), {
    recursive: true,
    mode: 0o700,
  });
  const temporaryFile = `${authFile}.${randomUUID()}.tmp`;
  try {
    await writeFile(
      temporaryFile,
      JSON.stringify({ [OPENCODE_GO_PROVIDER_ID]: credential }, null, 2),
      { mode: 0o600, flag: "wx" },
    );
    await chmod(temporaryFile, 0o600);
    await rename(temporaryFile, authFile);
  } finally {
    await rm(temporaryFile, { force: true });
  }
}

/** Return only the Go credential, never the user's other OpenCode providers. */
export async function readGlobalOpenCodeGoCredential(): Promise<unknown | null> {
  const auth = await readJson<OpenCodeAuthFile>(OPENCODE_GLOBAL_AUTH_FILE, {});
  const credential = auth[OPENCODE_GO_PROVIDER_ID];
  return isOpenCodeAuthInfo(credential) ? credential : null;
}

export async function removeOpenCodeProfile(profileId: string): Promise<void> {
  const directory = openCodeProfileDir(profileId);
  // profileId is generated internally and stored in an alias target; refuse a
  // malformed value before recursive removal so purge cannot escape profiles.
  if (!/^go-[0-9a-f-]{36}$/i.test(profileId)) {
    throw new Error("Refusing to remove an invalid OpenCode profile id.");
  }
  const profile = await readJson<OpenCodeGoProfileData | null>(openCodeProfileDataFile(profileId), null);
  let release: (() => Promise<void>) | undefined;
  if (profile?.console) {
    await mkdir(OPENCODE_LOCKS_DIR, { recursive: true, mode: 0o700 });
    release = await acquireProfileLock(openCodeProfileConsoleLock(profileId), "subscription account", 100);
  }
  try {
    await rm(directory, { recursive: true, force: true });
    const state = await readOpenCodeState();
    if (state.active === profileId) {
      state.active = null;
      await writeOpenCodeState(state);
    }
  } finally { await release?.(); }
}
