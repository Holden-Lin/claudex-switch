import chalk from "chalk";
import { loadAliases, findAlias } from "../alias/store";
import { switchProfile, profileExists } from "../providers/claude/profiles";
import { readCredentials } from "../providers/claude/credentials";
import { claudeProfileCredentials } from "../lib/paths";
import {
  loadRegistry,
  saveRegistry,
  setActiveAccount,
  findAccountByKey,
} from "../providers/codex/registry";
import { readAccountAuth, switchToAccount } from "../providers/codex/auth";
import { applyCodexApiProvider } from "../providers/codex/config";
import {
  blank,
  success,
  error,
  hint,
  formatType,
  formatPlan,
  maskKey,
  formatProvider,
} from "../lib/ui";
import type { AliasEntry } from "../types";

export async function use(aliasOrName: string): Promise<AliasEntry> {
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
    await switchClaude(entry.alias, entry.target.profileName);
  } else {
    await switchCodex(entry.alias, entry.target.accountKey);
  }

  return entry;
}

async function switchClaude(
  alias: string,
  profileName: string,
): Promise<void> {
  if (!(await profileExists(profileName))) {
    error(
      `Claude profile "${profileName}" no longer exists.`,
    );
    hint("The underlying profile may have been removed.");
    blank();
    process.exit(1);
  }

  const data = await switchProfile(profileName);
  let label: string;

  if (data.type === "api-key" && data.apiKey) {
    label = chalk.dim(maskKey(data.apiKey));
  } else {
    const creds = await readCredentials(
      claudeProfileCredentials(profileName),
    );
    label = formatPlan(
      creds?.claudeAiOauth?.subscriptionType ?? null,
    );
  }

  success(
    `Switched to ${chalk.bold(alias)}  ${formatProvider("claude")}  ${formatType(data.type)}  ${label}`,
  );
  blank();
}

async function switchCodex(
  alias: string,
  accountKey: string,
): Promise<void> {
  const reg = await loadRegistry();
  const account = findAccountByKey(reg, accountKey);

  if (!account) {
    error(
      `Codex account not found in registry.`,
    );
    hint("The account may have been removed by codex-auth.");
    blank();
    process.exit(1);
  }

  try {
    const auth =
      account.auth_mode === "apikey" ? await readAccountAuth(accountKey) : null;
    await switchToAccount(accountKey);
    await applyCodexApiProvider(
      account.auth_mode === "apikey" ? account.api_provider : null,
      auth?.auth_mode === "apikey" ? auth.OPENAI_API_KEY : undefined,
    );
  } catch (err) {
    error(
      `Failed to switch: ${err instanceof Error ? err.message : String(err)}`,
    );
    blank();
    process.exit(1);
  }

  setActiveAccount(reg, accountKey);
  await saveRegistry(reg);

  const plan = formatPlan(
    account.plan ?? account.last_usage?.plan_type ?? null,
  );
  const email = account.email ? chalk.dim(account.email) : "";

  success(
    `Switched to ${chalk.bold(alias)}  ${formatProvider("codex")}  ${plan}  ${email}`,
  );
  if (
    account.auth_mode === "apikey" &&
    account.api_provider?.type === "custom"
  ) {
    const envKey = account.api_provider.env_key || "OPENAI_API_KEY";
    if (!process.env[envKey]) {
      hint(
        `Raw ${chalk.cyan("codex")} needs ${chalk.cyan(envKey)} in the shell; ${chalk.cyan(`claudex-switch ${alias} -run`)} injects it automatically.`,
      );
    }
  }
  blank();
}
