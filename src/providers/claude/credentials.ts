import { platform } from "os";
import { spawnSync } from "child_process";
import { CREDENTIALS_FILE } from "../../lib/paths";
import { readJson, writeJson } from "../../lib/fs";
import type { CredentialsFile } from "../../types";

const IS_MACOS = platform() === "darwin";
const KEYCHAIN_SERVICE = "Claude Code-credentials";
const HEX_PATTERN = /^[0-9a-f]+$/i;

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

async function readKeychain(): Promise<CredentialsFile | null> {
  const result = spawnSync("security", [
    "find-generic-password",
    "-s",
    KEYCHAIN_SERVICE,
    "-a",
    getKeychainAccount(),
    "-w",
  ]);

  if (result.status !== 0) return null;
  return parseKeychainCredentials(result.stdout.toString("utf-8"));
}

async function writeKeychain(creds: CredentialsFile): Promise<void> {
  const payload = JSON.stringify(creds);
  const account = getKeychainAccount();

  const result = spawnSync("security", [
    "add-generic-password",
    "-U",
    "-s",
    KEYCHAIN_SERVICE,
    "-a",
    account,
    "-w",
    payload,
  ]);

  if (result.status !== 0) {
    throw new Error("Failed to write to macOS Keychain");
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
  await writeJson(path, creds);
}

export async function readCredentials(
  path: string = CREDENTIALS_FILE,
): Promise<CredentialsFile | null> {
  if (IS_MACOS && path === CREDENTIALS_FILE) {
    return readKeychain();
  }
  return readJsonFile(path);
}

export async function writeCredentials(
  creds: CredentialsFile,
  path: string = CREDENTIALS_FILE,
): Promise<void> {
  if (IS_MACOS && path === CREDENTIALS_FILE) {
    return writeKeychain(creds);
  }
  await writeJsonFile(creds, path);
}

export async function copyCredentials(
  from: string,
  to: string,
): Promise<void> {
  const creds = await readCredentials(from);
  if (!creds) throw new Error(`No credentials found at ${from}`);
  await writeCredentials(creds, to);
}
