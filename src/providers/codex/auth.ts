import { chmod, copyFile, mkdir, readFile, rename, unlink, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import { dirname } from "path";
import {
  CODEX_AUTH_FILE,
  CODEX_ACCOUNTS_DIR,
  codexAccountAuthFile,
} from "../../lib/paths";
import { fileExists, readJson } from "../../lib/fs";
import type {
  CodexAuthFile,
  CodexRegistry,
  CodexRegistryAccount,
} from "../../types";

async function ensureAccountsDir(): Promise<void> {
  await mkdir(CODEX_ACCOUNTS_DIR, { recursive: true });
}

export async function readActiveAuth(): Promise<CodexAuthFile | null> {
  if (!(await fileExists(CODEX_AUTH_FILE))) return null;
  return readJson<CodexAuthFile | null>(CODEX_AUTH_FILE, null);
}

export async function readAccountAuth(
  accountKey: string,
): Promise<CodexAuthFile | null> {
  const path = codexAccountAuthFile(accountKey);
  if (!(await fileExists(path))) return null;
  return readJson<CodexAuthFile | null>(path, null);
}

export async function switchToAccount(accountKey: string): Promise<void> {
  const srcPath = codexAccountAuthFile(accountKey);
  if (!(await fileExists(srcPath))) {
    throw new Error(`Auth file not found for account: ${accountKey}`);
  }

  const srcContent = await readFile(srcPath, "utf-8");
  const auth = parseAuthContent(srcContent);
  if (auth?.auth_mode === "apikey") {
    const normalized = normalizeAuthForCodexCli(auth);
    await writeAuthFileIfChanged(srcPath, normalized);
    await writeAuthFileIfChanged(CODEX_AUTH_FILE, normalized);
    return;
  }
  await writeRawAuthFileIfChanged(CODEX_AUTH_FILE, srcContent);
}

export async function saveAccountAuth(
  accountKey: string,
  authData: CodexAuthFile,
): Promise<void> {
  await ensureAccountsDir();
  const destPath = codexAccountAuthFile(accountKey);
  await writeAuthFile(destPath, normalizeAuthForCodexCli(authData));
}

async function writeAuthFile(
  path: string,
  authData: CodexAuthFile,
): Promise<void> {
  await writeRawAuthFile(path, JSON.stringify(authData, null, 2));
}

async function writeAuthFileIfChanged(
  path: string,
  authData: CodexAuthFile,
): Promise<void> {
  await writeRawAuthFileIfChanged(path, JSON.stringify(authData, null, 2));
}

async function writeRawAuthFileIfChanged(
  path: string,
  content: string,
): Promise<void> {
  try {
    if ((await readFile(path, "utf-8")) === content) {
      await chmod(path, 0o600);
      return;
    }
  } catch {
    // Missing or unreadable target should be rewritten below.
  }
  await writeRawAuthFile(path, content);
}

async function writeRawAuthFile(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tempPath = `${path}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(tempPath, content, { mode: 0o600 });
    await rename(tempPath, path);
    await chmod(path, 0o600);
  } catch (err) {
    try {
      await unlink(tempPath);
    } catch {}
    throw err;
  }
}

function normalizeAuthForCodexCli(authData: CodexAuthFile): CodexAuthFile {
  if (authData.auth_mode !== "apikey") return authData;
  return {
    auth_mode: "apikey",
    OPENAI_API_KEY: authData.OPENAI_API_KEY,
  };
}

function parseAuthContent(content: string): CodexAuthFile | null {
  try {
    return JSON.parse(content) as CodexAuthFile;
  } catch {
    return null;
  }
}

/**
 * Decode a JWT payload without verifying the signature — we're reading our
 * own local files.
 */
export function decodeJwtPayload(
  token: string,
): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

/**
 * Decode the id_token JWT to extract user metadata.
 */
export function decodeIdToken(idToken: string): {
  email?: string;
  chatgpt_user_id?: string;
  chatgpt_account_id?: string;
  plan_type?: string;
} | null {
  try {
    const payload = decodeJwtPayload(idToken);
    if (!payload) return null;

    const authInfo = (payload["https://api.openai.com/auth"] ?? {}) as Record<
      string,
      unknown
    >;
    const profileInfo = (payload["https://api.openai.com/profile"] ?? {}) as Record<
      string,
      unknown
    >;

    const str = (v: unknown): string | undefined =>
      typeof v === "string" ? v : undefined;

    return {
      email: str(payload.email) ?? str(profileInfo.email),
      chatgpt_user_id:
        str(authInfo.chatgpt_user_id) ??
        str(authInfo.user_id) ??
        str(payload.sub),
      chatgpt_account_id:
        str(authInfo.chatgpt_account_id) ??
        str(authInfo.account_id) ??
        str(payload.account_id),
      plan_type: str(authInfo.chatgpt_plan_type) ?? str(authInfo.plan_type),
    };
  } catch {
    return null;
  }
}

export function authMatchesAccount(
  auth: CodexAuthFile,
  account: CodexRegistryAccount,
): boolean {
  if (auth.auth_mode !== "chatgpt" || !auth.tokens?.id_token) return false;
  const identity = decodeIdToken(auth.tokens.id_token);
  const userId = identity?.chatgpt_user_id;
  const accountId = identity?.chatgpt_account_id ?? auth.tokens.account_id;

  if (userId && accountId) {
    return (
      userId === account.chatgpt_user_id &&
      accountId === account.chatgpt_account_id
    );
  }

  return Boolean(
    identity?.email &&
      account.email &&
      identity.email.toLowerCase() === account.email.toLowerCase(),
  );
}

export function sameChatGptIdentity(
  left: CodexAuthFile,
  right: CodexAuthFile,
): boolean {
  if (left.auth_mode !== "chatgpt" || right.auth_mode !== "chatgpt") {
    return false;
  }
  const leftIdentity = decodeIdToken(left.tokens.id_token);
  const rightIdentity = decodeIdToken(right.tokens.id_token);
  const leftUser = leftIdentity?.chatgpt_user_id;
  const rightUser = rightIdentity?.chatgpt_user_id;
  const leftAccount =
    leftIdentity?.chatgpt_account_id ?? left.tokens.account_id;
  const rightAccount =
    rightIdentity?.chatgpt_account_id ?? right.tokens.account_id;

  if (leftUser && rightUser && leftAccount && rightAccount) {
    return leftUser === rightUser && leftAccount === rightAccount;
  }

  return Boolean(
    leftIdentity?.email &&
      rightIdentity?.email &&
      leftIdentity.email.toLowerCase() === rightIdentity.email.toLowerCase(),
  );
}

export function sameAuthCredentialVersion(
  left: CodexAuthFile,
  right: CodexAuthFile,
): boolean {
  if (left.auth_mode !== right.auth_mode) return false;
  if (left.auth_mode === "apikey" && right.auth_mode === "apikey") {
    return left.OPENAI_API_KEY === right.OPENAI_API_KEY;
  }
  if (left.auth_mode !== "chatgpt" || right.auth_mode !== "chatgpt") {
    return false;
  }
  return (
    left.tokens.id_token === right.tokens.id_token &&
    left.tokens.access_token === right.tokens.access_token &&
    left.tokens.refresh_token === right.tokens.refresh_token &&
    left.last_refresh === right.last_refresh
  );
}

/** Persist Codex CLI token rotation before another account replaces auth.json. */
export async function syncActiveAuthSnapshot(
  reg: CodexRegistry,
): Promise<boolean> {
  const account = reg.accounts.find(
    (candidate) => candidate.account_key === reg.active_account_key,
  );
  if (!account || account.auth_mode !== "chatgpt") return false;

  const activeAuth = await readActiveAuth();
  if (!activeAuth || !authMatchesAccount(activeAuth, account)) return false;

  await saveAccountAuth(account.account_key, activeAuth);
  return true;
}

export async function removeAccountAuthFile(
  accountKey: string,
): Promise<void> {
  const path = codexAccountAuthFile(accountKey);
  try {
    await unlink(path);
  } catch {
    // ignore if already gone
  }
}

/**
 * Copy the current active auth to a new account snapshot file.
 */
export async function snapshotActiveAuth(
  accountKey: string,
): Promise<void> {
  if (!(await fileExists(CODEX_AUTH_FILE))) {
    throw new Error("No active Codex auth file found");
  }
  await ensureAccountsDir();
  const destPath = codexAccountAuthFile(accountKey);
  await copyFile(CODEX_AUTH_FILE, destPath);
  await chmod(destPath, 0o600);
}
