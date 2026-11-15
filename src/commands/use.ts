import chalk from "chalk";
import { CLI_PROXY_API_UPSTREAMS } from "../providers/cliproxyapi/upstreams";
import { loadAliases, findAlias } from "../alias/store";
import { switchProfile, profileExists } from "../providers/claude/profiles";
import { readCredentials } from "../providers/claude/credentials";
import { claudeProfileCredentials } from "../lib/paths";
import {
  loadRegistry,
  saveRegistry,
  setActiveAccount,
  findAccountByKey,
  codexAccountProviderName,
  managedProviderNames,
  managedSessionCreators,
} from "../providers/codex/registry";
import {
  readAccountAuth,
  switchToAccount,
  syncActiveAuthSnapshot,
} from "../providers/codex/auth";
import { applyCodexApiProvider } from "../providers/codex/config";
import { syncCodexSessions } from "../providers/codex/sessions";
import {
  getOpenCodeProfileData,
  hasOpenCodeGoCredential,
  openCodeProfileExists,
  setActiveOpenCodeProfile,
} from "../providers/opencode/profiles";
import {
  blank,
  success,
  error,
  hint,
  formatType,
  formatPlan,
  maskKey,
  formatProvider,
  info,
} from "../lib/ui";
import type { AliasEntry, CodexRegistry, CodexRegistryAccount } from "../types";

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

  switch (entry.target.provider) {
    case "claude":
      await switchClaude(entry.alias, entry.target.profileName);
      break;
    case "codex":
      await switchCodex(entry.alias, entry.target.accountKey);
      break;
    case "opencode":
      await switchOpenCode(entry.alias, entry.target.profileId);
      break;
  }

  return entry;
}

async function switchOpenCode(alias: string, profileId: string): Promise<void> {
  await ensureOpenCodeProfileReady(alias, profileId);
  await setActiveOpenCodeProfile(profileId);
  success(
    `Selected ${chalk.bold(alias)}  ${formatProvider("opencode")}  ${formatType("subscription")}  ${formatPlan("Go")}`,
  );
  hint(
    `Run ${chalk.cyan(`claudex-switch ${alias} -run`)} to open OpenCode with this credential; session history behavior depends on the installed OpenCode version.`,
  );
  blank();
}

export async function ensureOpenCodeProfileReady(
  alias: string,
  profileId: string,
): Promise<void> {
  if (!(await openCodeProfileExists(profileId))) {
    error("OpenCode Go profile no longer exists.");
    hint("The underlying profile may have been purged.");
    blank();
    process.exit(1);
  }
  if (!(await hasOpenCodeGoCredential(profileId))) {
    error("OpenCode Go credential is missing from this profile.");
    hint(`Run ${chalk.cyan(`claudex-switch refresh ${alias}`)} to reconnect it.`);
    blank();
    process.exit(1);
  }

  await getOpenCodeProfileData(profileId);
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
  } else if (data.type === "local-cliproxyapi") {
    label = chalk.dim(
      `local ${CLI_PROXY_API_UPSTREAMS[data.upstream ?? "codex"].label} login`,
    );
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
    await syncActiveAuthSnapshot(reg);
    const auth =
      account.auth_mode === "apikey" ? await readAccountAuth(accountKey) : null;
    await switchToAccount(accountKey);
    await applyCodexApiProvider(
      account.auth_mode === "apikey" ? account.api_provider : null,
      auth?.auth_mode === "apikey" ? auth.OPENAI_API_KEY : undefined,
      account.default_model,
    );
  } catch (err) {
    error(
      `Failed to switch: ${err instanceof Error ? err.message : String(err)}`,
    );
    blank();
    process.exit(1);
  }

  if (reg.active_account_key !== accountKey) {
    setActiveAccount(reg, accountKey);
    await saveRegistry(reg);
  }

  await syncCodexSessionVisibility(reg, account);

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

// Resume uses the session's recorded provider even when the CLI config picks
// another one, and Codex 0.169+ hides sessions created by other ChatGPT
// accounts. Global switches and private runs restamp managed sessions to the
// account's provider and share the scoped ones; `account` null (after a run
// exits) only shares the sessions that run created.
export async function syncCodexSessionVisibility(
  reg: CodexRegistry,
  account: CodexRegistryAccount | null,
): Promise<void> {
  const targetProvider = account ? codexAccountProviderName(account) : null;
  if (account && !targetProvider) return;

  try {
    const result = await syncCodexSessions({
      provider: targetProvider
        ? { target: targetProvider, managed: managedProviderNames(reg) }
        : null,
      sharedCreators: managedSessionCreators(reg),
    });
    if (result.providerStamped > 0 || result.sqliteRowsUpdated > 0) {
      info(
        `Synced ${result.providerStamped} session file(s) and ${result.sqliteRowsUpdated} thread row(s) to provider "${targetProvider}"`,
      );
      hint("Managed sessions now resume with this account's provider.");
    }
    if (result.sessionsShared > 0) {
      info(
        `Shared ${result.sessionsShared} Codex session(s) across your accounts`,
      );
    }
    if (result.rolloutsRepaired > 0) {
      info(
        `Repaired ${result.rolloutsRepaired} session file(s) shortened by an earlier sync`,
      );
    }
    if (result.providerSkipped > 0 && account) {
      hint(
        `${result.providerSkipped} older session(s) keep their provider: a longer name would shift Codex's history offsets. Resume them from the account that created them.`,
      );
    }
  } catch {
    // Session visibility sync is best effort.
  }
}
