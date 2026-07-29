import { chmod, copyFile, mkdir, readFile, unlink, writeFile } from "fs/promises";
import {
  CODEX_AUTH_FILE,
  CODEX_ACCOUNTS_DIR,
  codexAccountAuthFile,
} from "../../lib/paths";
import { fileExists, readJson } from "../../lib/fs";
import type { CodexAuthFile } from "../../types";

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
  await writeFile(path, JSON.stringify(authData, null, 2), { mode: 0o600 });
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
  await writeFile(path, content, { mode: 0o600 });
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

    // OpenAI stores auth info at https://api.openai.com/auth
    const authInfo = (payload["https://api.openai.com/auth"] ?? {}) as Record<
      string,
      unknown
    >;

    const str = (v: unknown): string | undefined =>
      typeof v === "string" ? v : undefined;

    return {
      email: str(payload.email),
      chatgpt_user_id: str(authInfo.user_id) ?? str(payload.sub),
      chatgpt_account_id: str(authInfo.account_id) ?? str(payload.account_id),
      plan_type: str(authInfo.plan_type),
    };
  } catch {
    return null;
  }
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
