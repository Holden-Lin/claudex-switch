import { spawn } from "child_process";
import chalk from "chalk";
import { findAlias, loadAliases } from "../alias/store";
import { createPrivateBrowserScript, cleanupBrowserScript } from "../lib/browser";
import { readJson } from "../lib/fs";
import { blank, error, formatPlan, formatProvider, formatType, hint, info, success } from "../lib/ui";
import { claudeProfileAccountFile } from "../lib/paths";
import { readOAuthAccount } from "../providers/claude/account";
import { readCredentials } from "../providers/claude/credentials";
import {
  getProfileData,
  profileExists,
  snapshotActiveOAuthProfile,
  switchProfile,
} from "../providers/claude/profiles";
import {
  decodeIdToken,
  readActiveAuth,
  snapshotActiveAuth,
  switchToAccount,
} from "../providers/codex/auth";
import { runCodexDeviceAuthLogin } from "../providers/codex/login";
import {
  findAccountByKey,
  loadRegistry,
  saveRegistry,
  setActiveAccount,
} from "../providers/codex/registry";
import type { OAuthAccount } from "../types";

export async function refresh(aliasOrName: string): Promise<void> {
  blank();

  const aliasReg = await loadAliases();
  const entry = findAlias(aliasReg, aliasOrName);

  if (!entry) {
    error(`Alias "${aliasOrName}" not found.`);
    hint(
      `Run ${chalk.cyan("claudex-switch list")} to see your accounts`,
    );
    blank();
    process.exit(1);
  }

  if (entry.target.provider === "claude") {
    await refreshClaude(entry.alias, entry.target.profileName);
  } else {
    await refreshCodex(entry.alias, entry.target.accountKey);
  }
}

async function refreshClaude(
  alias: string,
  profileName: string,
): Promise<void> {
  if (!(await profileExists(profileName))) {
    error(`Claude profile "${profileName}" no longer exists.`);
    hint("The underlying profile may have been removed.");
    blank();
    process.exit(1);
  }

  const profile = await getProfileData(profileName);
  if (profile.type !== "oauth") {
    error("Claude API key accounts do not need refresh.");
    blank();
    process.exit(1);
  }

  const savedAccount = await readJson<OAuthAccount | null>(
    claudeProfileAccountFile(profileName),
    null,
  );

  await switchProfile(profileName);

  info(`Opening Claude login for ${chalk.bold(alias)}...`);
  blank();

  const exitCode = await runLoginCommand("claude", [
    "auth",
    "login",
  ]);
  if (exitCode !== 0) {
    blank();
    error("Claude login failed or was cancelled.");
    hint(
      `If Claude refuses the current session, run ${chalk.cyan("claude auth logout")} and retry.`,
    );
    blank();
    process.exit(1);
  }

  const currentAccount = await readOAuthAccount();
  if (!matchesClaudeAccount(savedAccount, currentAccount)) {
    await switchProfile(profileName);
    blank();
    error(
      `Claude login completed for a different account (${formatClaudeIdentity(currentAccount)}).`,
    );
    hint(
      `Retry and sign in as ${chalk.cyan(savedAccount?.emailAddress ?? savedAccount?.accountUuid ?? alias)}.`,
    );
    blank();
    process.exit(1);
  }

  try {
    await snapshotActiveOAuthProfile(profileName);
  } catch (err) {
    await switchProfile(profileName);
    blank();
    error(
      `Could not save refreshed Claude credentials: ${err instanceof Error ? err.message : String(err)}`,
    );
    blank();
    process.exit(1);
  }

  const creds = await readCredentials();
  const account = await readOAuthAccount();
  const label = formatPlan(
    creds?.claudeAiOauth?.subscriptionType ?? null,
  );
  const email = account?.emailAddress
    ? `  ${chalk.dim(account.emailAddress)}`
    : "";

  success(
    `Refreshed ${chalk.bold(alias)}  ${formatProvider("claude")}  ${formatType("oauth")}  ${label}${email}`,
  );
  blank();
}

async function refreshCodex(
  alias: string,
  accountKey: string,
): Promise<void> {
  const reg = await loadRegistry();
  const account = findAccountByKey(reg, accountKey);

  if (!account) {
    error("Codex account not found in registry.");
    hint("The account may have been removed by codex-auth.");
    blank();
    process.exit(1);
  }

  if (account.auth_mode === "apikey") {
    error("Codex API key accounts do not need refresh.");
    blank();
    process.exit(1);
  }

  try {
    await switchToAccount(accountKey);
  } catch (err) {
    error(
      `Failed to prepare Codex auth: ${err instanceof Error ? err.message : String(err)}`,
    );
    blank();
    process.exit(1);
  }

  setActiveAccount(reg, accountKey);
  await saveRegistry(reg);

  info(`Opening Codex login for ${chalk.bold(alias)}...`);
  blank();

  const exitCode = await runCodexDeviceAuthLogin();
  if (exitCode !== 0) {
    blank();
    error("Codex login failed or was cancelled.");
    hint(
      `If Codex reports an expired refresh token, run ${chalk.cyan("codex logout")} and retry.`,
    );
    blank();
    process.exit(1);
  }

  const auth = await readActiveAuth();
  if (!auth || !auth.tokens) {
    await switchToAccount(accountKey);
    blank();
    error("Could not read Codex auth after login.");
    blank();
    process.exit(1);
  }

  const tokenInfo = decodeIdToken(auth.tokens.id_token);
  const email = tokenInfo?.email ?? account.email ?? "unknown";
  const userId = tokenInfo?.chatgpt_user_id ?? auth.tokens.account_id ?? "unknown";
  const accountId = tokenInfo?.chatgpt_account_id ?? auth.tokens.account_id ?? "unknown";
  const refreshedKey = `${userId}::${accountId}`;

  if (refreshedKey !== accountKey) {
    await switchToAccount(accountKey);
    blank();
    error(
      `Codex login completed for a different account (${email}).`,
    );
    hint(
      `Retry and sign in as ${chalk.cyan(account.email || alias)}.`,
    );
    blank();
    process.exit(1);
  }

  await snapshotActiveAuth(accountKey);

  account.email = tokenInfo?.email ?? account.email;
  account.chatgpt_user_id = userId;
  account.chatgpt_account_id = accountId;
  account.plan = tokenInfo?.plan_type ?? account.plan;
  account.auth_mode = "chatgpt";
  setActiveAccount(reg, accountKey);
  await saveRegistry(reg);

  success(
    `Refreshed ${chalk.bold(alias)}  ${formatProvider("codex")}  ${formatPlan(account.plan ?? null)}  ${chalk.dim(account.email || "")}`,
  );
  blank();
}

function matchesClaudeAccount(
  expected: OAuthAccount | null,
  actual: OAuthAccount | null,
): boolean {
  if (!expected || !actual) return true;

  const expectedId = expected.accountUuid ?? expected.emailAddress ?? null;
  const actualId = actual.accountUuid ?? actual.emailAddress ?? null;
  if (!expectedId || !actualId) return true;

  return expectedId === actualId;
}

function formatClaudeIdentity(account: OAuthAccount | null): string {
  return account?.emailAddress ?? account?.accountUuid ?? "unknown";
}

async function runLoginCommand(
  command: string,
  args: string[],
): Promise<number | null> {
  const browserScript = createPrivateBrowserScript();
  const env = browserScript
    ? { ...process.env, BROWSER: browserScript }
    : undefined;
  try {
    const proc = spawn(command, args, { stdio: "inherit", env });
    return await new Promise<number | null>((resolve, reject) => {
      proc.on("close", resolve);
      proc.on("error", reject);
    });
  } catch (err) {
    error(
      `Failed to start ${command}: ${err instanceof Error ? err.message : String(err)}`,
    );
    blank();
    process.exit(1);
  } finally {
    cleanupBrowserScript(browserScript);
  }
}
