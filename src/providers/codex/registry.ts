import { mkdir } from "fs/promises";
import { CODEX_ACCOUNTS_DIR, CODEX_REGISTRY_FILE } from "../../lib/paths";
import { fileExists, readJson, writeJson } from "../../lib/fs";
import type { CodexRegistry, CodexRegistryAccount } from "../../types";

const DEFAULT_REGISTRY: CodexRegistry = {
  schema_version: 3,
  active_account_key: null,
  active_account_activated_at_ms: null,
  auto_switch: {
    enabled: false,
    threshold_5h_percent: 10,
    threshold_weekly_percent: 5,
  },
  api: { usage: true, account: true },
  accounts: [],
};

async function ensureAccountsDir(): Promise<void> {
  await mkdir(CODEX_ACCOUNTS_DIR, { recursive: true });
}

export async function loadRegistry(): Promise<CodexRegistry> {
  if (!(await fileExists(CODEX_REGISTRY_FILE))) {
    return { ...DEFAULT_REGISTRY, accounts: [] };
  }
  const reg = await readJson<CodexRegistry>(
    CODEX_REGISTRY_FILE,
    DEFAULT_REGISTRY,
  );
  // Ensure accounts is always an array
  if (!Array.isArray(reg.accounts)) {
    reg.accounts = [];
  }
  return reg;
}

export async function saveRegistry(reg: CodexRegistry): Promise<void> {
  await ensureAccountsDir();
  await writeJson(CODEX_REGISTRY_FILE, reg);
}

export function findAccountByKey(
  reg: CodexRegistry,
  accountKey: string,
): CodexRegistryAccount | undefined {
  return reg.accounts.find((a) => a.account_key === accountKey);
}

export function findAccountByAlias(
  reg: CodexRegistry,
  alias: string,
): CodexRegistryAccount | undefined {
  const lower = alias.toLowerCase();
  return reg.accounts.find((a) => a.alias.toLowerCase() === lower);
}

export function findAccountByEmail(
  reg: CodexRegistry,
  query: string,
): CodexRegistryAccount | undefined {
  const lower = query.toLowerCase();
  return reg.accounts.find((a) => a.email.toLowerCase().includes(lower));
}

export function getActiveAccount(
  reg: CodexRegistry,
): CodexRegistryAccount | undefined {
  if (!reg.active_account_key) return undefined;
  return findAccountByKey(reg, reg.active_account_key);
}

export function addAccountToRegistry(
  reg: CodexRegistry,
  account: CodexRegistryAccount,
): void {
  const existing = reg.accounts.findIndex(
    (a) => a.account_key === account.account_key,
  );
  if (existing >= 0) {
    reg.accounts[existing] = account;
  } else {
    reg.accounts.push(account);
  }
}

export function removeAccountFromRegistry(
  reg: CodexRegistry,
  accountKey: string,
): boolean {
  const idx = reg.accounts.findIndex((a) => a.account_key === accountKey);
  if (idx < 0) return false;
  reg.accounts.splice(idx, 1);
  if (reg.active_account_key === accountKey) {
    reg.active_account_key = null;
    reg.active_account_activated_at_ms = null;
  }
  return true;
}

export function setActiveAccount(
  reg: CodexRegistry,
  accountKey: string,
): void {
  reg.active_account_key = accountKey;
  reg.active_account_activated_at_ms = Date.now();
  const account = findAccountByKey(reg, accountKey);
  if (account) {
    account.last_used_at = Math.floor(Date.now() / 1000);
  }
}
