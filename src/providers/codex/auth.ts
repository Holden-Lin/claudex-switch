import { chmod, copyFile, mkdir, unlink, writeFile } from "fs/promises";
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
  const auth = await readAccountAuth(accountKey);
  if (auth?.auth_mode === "apikey") {
    const normalized = normalizeAuthForCodexCli(auth);
    await writeAuthFile(srcPath, normalized);
    await writeAuthFile(CODEX_AUTH_FILE, normalized);
    return;
  }
  await copyFile(srcPath, CODEX_AUTH_FILE);
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

function normalizeAuthForCodexCli(authData: CodexAuthFile): CodexAuthFile {
  if (authData.auth_mode !== "apikey") return authData;
  return {
    auth_mode: "apikey",
    OPENAI_API_KEY: authData.OPENAI_API_KEY,
  };
}

/**
 * Decode the id_token JWT to extract user metadata.
 * No crypto verification — we're reading our own local files.
 */
export function decodeIdToken(idToken: string): {
  email?: string;
  chatgpt_user_id?: string;
  chatgpt_account_id?: string;
  plan_type?: string;
} | null {
  try {
    const parts = idToken.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8"),
    );

    // OpenAI stores auth info at https://api.openai.com/auth
    const authInfo = payload["https://api.openai.com/auth"] ?? {};

    return {
      email: payload.email ?? undefined,
      chatgpt_user_id: authInfo.user_id ?? payload.sub ?? undefined,
      chatgpt_account_id:
        authInfo.account_id ?? payload.account_id ?? undefined,
      plan_type: authInfo.plan_type ?? undefined,
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
