import { CLAUDE_JSON } from "../../lib/paths";
import { fileExists, readJson, writeJson } from "../../lib/fs";
import type { OAuthAccount } from "../../types";

interface ClaudeJson {
  oauthAccount?: OAuthAccount;
  [key: string]: unknown;
}

export async function readOAuthAccount(): Promise<OAuthAccount | null> {
  if (!(await fileExists(CLAUDE_JSON))) return null;
  const data = await readJson<ClaudeJson>(CLAUDE_JSON, {});
  return data.oauthAccount ?? null;
}

export async function writeOAuthAccount(
  account: OAuthAccount | null,
): Promise<void> {
  const data = await readJson<ClaudeJson>(CLAUDE_JSON, {});
  if (account) {
    data.oauthAccount = account;
  } else {
    delete data.oauthAccount;
  }
  await writeJson(CLAUDE_JSON, data);
}
