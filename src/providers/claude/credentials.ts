import { platform } from "os";
import { createHash } from "crypto";
import { spawnSync } from "child_process";
import { rm } from "fs/promises";
import { join } from "path";
import { CREDENTIALS_FILE } from "../../lib/paths";
import { readJson, writeJsonSecure } from "../../lib/fs";
import type { CredentialsFile } from "../../types";

const KEYCHAIN_SERVICE = "Claude Code-credentials";
const HEX_PATTERN = /^[0-9a-f]+$/i;

function keychainEnabled(): boolean {
  return (
    platform() === "darwin" &&
    process.env.CLAUDEX_FORCE_FILE_CREDENTIALS !== "1"
  );
}

function useKeychain(path: string): boolean {
  return keychainEnabled() && path === CREDENTIALS_FILE;
}

// Claude Code launched with CLAUDE_SECURESTORAGE_CONFIG_DIR=<dir> stores its
// OAuth credentials under the Keychain service
// "Claude Code-credentials-<first 8 hex of sha256(NFC-normalized dir)>" on
// macOS, and under <dir>/.credentials.json elsewhere. These helpers mirror
// that naming so a profile directory can act as an isolated live store.
export function isolatedKeychainService(dir: string): string {
  const hash = createHash("sha256")
    .update(dir.normalize("NFC"))
    .digest("hex")
    .slice(0, 8);
  return `${KEYCHAIN_SERVICE}-${hash}`;
}

function getKeychainAccount(): string {
  return process.env.USER ?? spawnSync("whoami").stdout.toString().trim();
}

function parseKeychainCredentials(raw: string): CredentialsFile | null {
  const payload = raw.trim();
  if (!payload) return null;

  try {
    return JSON.parse(payload) as CredentialsFile;
  } catch {
    // Fall back to legacy hex-encoded payload
  }

  if (!HEX_PATTERN.test(payload) || payload.length % 2 !== 0) {
    return null;
  }

  try {
    const json = Buffer.from(payload, "hex").toString("utf-8");
    return JSON.parse(json) as CredentialsFile;
  } catch {
    return null;
  }
}

async function readKeychain(
  service: string = KEYCHAIN_SERVICE,
): Promise<CredentialsFile | null> {
  const result = spawnSync("security", [
    "find-generic-password",
    "-s",
    service,
    "-a",
    getKeychainAccount(),
    "-w",
  ]);

  if (result.status !== 0) return null;
  return parseKeychainCredentials(result.stdout.toString("utf-8"));
}

async function writeKeychain(
  creds: CredentialsFile,
  service: string = KEYCHAIN_SERVICE,
): Promise<void> {
  const payload = JSON.stringify(creds);
  const account = getKeychainAccount();

  const result = spawnSync("security", [
    "add-generic-password",
    "-U",
    "-s",
    service,
    "-a",
    account,
    "-w",
    payload,
  ]);

  if (result.status !== 0) {
    throw new Error("Failed to write to macOS Keychain");
  }
}

async function deleteKeychain(
  service: string = KEYCHAIN_SERVICE,
): Promise<void> {
  const result = spawnSync("security", [
    "delete-generic-password",
    "-s",
    service,
    "-a",
    getKeychainAccount(),
  ]);

  if (result.status !== 0 && (await readKeychain(service))) {
    throw new Error("Failed to delete macOS Keychain credentials");
  }
}

async function readJsonFile(
  path: string,
): Promise<CredentialsFile | null> {
  return readJson<CredentialsFile | null>(path, null);
}

async function writeJsonFile(
  creds: CredentialsFile,
  path: string,
): Promise<void> {
  await writeJsonSecure(path, creds);
}

async function deleteJsonFile(path: string): Promise<void> {
  await rm(path, { force: true });
}

export async function readCredentials(
  path: string = CREDENTIALS_FILE,
): Promise<CredentialsFile | null> {
  if (useKeychain(path)) {
    return readKeychain();
  }
  return readJsonFile(path);
}

export async function writeCredentials(
  creds: CredentialsFile,
  path: string = CREDENTIALS_FILE,
): Promise<void> {
  if (useKeychain(path)) {
    return writeKeychain(creds);
  }
  await writeJsonFile(creds, path);
}

export async function deleteCredentials(
  path: string = CREDENTIALS_FILE,
): Promise<void> {
  if (useKeychain(path)) {
    return deleteKeychain();
  }
  await deleteJsonFile(path);
}

export async function copyCredentials(
  from: string,
  to: string,
): Promise<void> {
  const creds = await readCredentials(from);
  if (!creds) throw new Error(`No credentials found at ${from}`);
  await writeCredentials(creds, to);
}

// Live store for a Claude session running with
// CLAUDE_SECURESTORAGE_CONFIG_DIR=<dir>. On non-macOS platforms this is the
// same file the profile snapshot already lives in, so the two stay unified.
export async function readIsolatedCredentials(
  dir: string,
): Promise<CredentialsFile | null> {
  if (keychainEnabled()) {
    return readKeychain(isolatedKeychainService(dir));
  }
  return readJson<CredentialsFile | null>(join(dir, ".credentials.json"), null);
}

export async function writeIsolatedCredentials(
  creds: CredentialsFile,
  dir: string,
): Promise<void> {
  if (keychainEnabled()) {
    return writeKeychain(creds, isolatedKeychainService(dir));
  }
  await writeJsonSecure(join(dir, ".credentials.json"), creds);
}

export async function deleteIsolatedCredentials(dir: string): Promise<void> {
  if (keychainEnabled()) {
    return deleteKeychain(isolatedKeychainService(dir));
  }
  await rm(join(dir, ".credentials.json"), { force: true });
}
