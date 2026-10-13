import {
  chmod,
  lstat,
  mkdir,
  readdir,
  readlink,
  rename,
  symlink,
  unlink,
  writeFile,
} from "fs/promises";
import { join } from "path";
import { CODEX_DIR, codexRunHome } from "../../lib/paths";
import { fileExists, readJson } from "../../lib/fs";
import {
  authMatchesAccount,
  normalizeAuthForCodexCli,
  readAccountAuth,
  readActiveAuth,
  saveAccountAuth,
  sameAuthCredentialVersion,
} from "./auth";
import { renderCodexRunConfig } from "./config";
import type {
  CodexAuthFile,
  CodexRegistry,
  CodexRegistryAccount,
} from "../../types";

// `<alias> -run` for a Codex account that isn't the global default runs with
// CODEX_HOME pointed at a private directory, so the default account in
// ~/.codex stays selected. Only auth.json (and config.toml when the provider
// routing differs) is private; every other entry links back into ~/.codex, so
// sessions, history, skills, hooks and AGENTS.md stay shared.

const AUTH_FILE = "auth.json";
const CONFIG_FILE = "config.toml";
// `accounts` holds every other account's login snapshot; a run never needs it.
const PRIVATE_ENTRIES = new Set([AUTH_FILE, CONFIG_FILE, "accounts"]);

/** The default account runs on ~/.codex itself; nothing to isolate. */
export async function isDefaultCodexAccount(
  reg: CodexRegistry,
  account: CodexRegistryAccount,
): Promise<boolean> {
  if (reg.active_account_key !== account.account_key) return false;
  const active = await readActiveAuth();
  if (!active) return false;
  if (account.auth_mode === "chatgpt") {
    return authMatchesAccount(active, account);
  }
  const snapshot = await readAccountAuth(account.account_key);
  return (
    active.auth_mode === "apikey" &&
    Boolean(active.OPENAI_API_KEY) &&
    active.OPENAI_API_KEY === snapshot?.OPENAI_API_KEY
  );
}

export async function prepareCodexRunHome(
  account: CodexRegistryAccount,
): Promise<string> {
  const home = codexRunHome(account.account_key);
  await mkdir(home, { recursive: true, mode: 0o700 });
  await chmod(home, 0o700);
  await mkdir(CODEX_DIR, { recursive: true });

  // A previous run may have refreshed tokens after the snapshot was taken.
  await syncCodexRunAuth(account);
  const auth = await readAccountAuth(account.account_key);
  if (!auth) {
    throw new Error(`Auth file not found for account: ${account.account_key}`);
  }
  await writeFile(
    join(home, AUTH_FILE),
    JSON.stringify(normalizeAuthForCodexCli(auth), null, 2),
    { mode: 0o600 },
  );
  await chmod(join(home, AUTH_FILE), 0o600);

  const privateConfig = await renderCodexRunConfig(
    account.auth_mode === "apikey" ? account.api_provider : null,
    auth.auth_mode === "apikey" ? (auth.OPENAI_API_KEY ?? undefined) : undefined,
  );
  const configPath = join(home, CONFIG_FILE);
  await removeEntry(configPath);
  if (privateConfig === null) {
    if (await fileExists(join(CODEX_DIR, CONFIG_FILE))) {
      await linkEntry(join(CODEX_DIR, CONFIG_FILE), configPath);
    }
  } else {
    await writeFile(configPath, privateConfig, { mode: 0o600 });
    await chmod(configPath, 0o600);
  }

  await linkSharedEntries(home);
  return home;
}

/** Fold tokens a run refreshed back into the account snapshot. */
export async function syncCodexRunAuth(
  account: CodexRegistryAccount,
): Promise<void> {
  if (account.auth_mode !== "chatgpt") return;
  const runAuth = await readJson<CodexAuthFile | null>(
    join(codexRunHome(account.account_key), AUTH_FILE),
    null,
  );
  if (!runAuth || !authMatchesAccount(runAuth, account)) return;
  const snapshot = await readAccountAuth(account.account_key);
  if (snapshot && sameAuthCredentialVersion(runAuth, snapshot)) return;
  if (
    snapshot?.last_refresh &&
    (!runAuth.last_refresh || runAuth.last_refresh < snapshot.last_refresh)
  ) {
    return;
  }
  await saveAccountAuth(account.account_key, runAuth);
}

/** Share anything Codex created only in the run home once the run exits. */
export async function finishCodexRunHome(
  account: CodexRegistryAccount,
): Promise<void> {
  await syncCodexRunAuth(account);
  await linkSharedEntries(codexRunHome(account.account_key));
}

async function linkSharedEntries(home: string): Promise<void> {
  // Codex created these here because ~/.codex lacked them (a first-ever run);
  // move them into ~/.codex so the next default-account session sees them.
  for (const entry of await readdir(home, { withFileTypes: true })) {
    if (PRIVATE_ENTRIES.has(entry.name) || entry.isSymbolicLink()) continue;
    const shared = join(CODEX_DIR, entry.name);
    if (await exists(shared)) continue;
    try {
      await rename(join(home, entry.name), shared);
    } catch {
      // Leave it private rather than fail the launch.
    }
  }

  for (const entry of await readdir(CODEX_DIR, { withFileTypes: true })) {
    if (PRIVATE_ENTRIES.has(entry.name)) continue;
    await linkEntry(join(CODEX_DIR, entry.name), join(home, entry.name));
  }
}

async function linkEntry(source: string, destination: string): Promise<void> {
  try {
    const stat = await lstat(destination);
    if (!stat.isSymbolicLink()) return;
    if ((await readlink(destination)) === source) return;
    await unlink(destination);
  } catch {
    // Missing destination; create it below.
  }
  const sourceStat = await lstat(source);
  const type = sourceStat.isDirectory()
    ? process.platform === "win32"
      ? "junction"
      : "dir"
    : "file";
  try {
    await symlink(source, destination, type);
  } catch {
    // Symlinks can be unavailable; the run still works without shared extras.
  }
}

async function removeEntry(path: string): Promise<void> {
  try {
    await unlink(path);
  } catch {
    // Already absent.
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch {
    return false;
  }
}
