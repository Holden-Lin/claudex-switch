import chalk from "chalk";
import { loadAliases } from "../alias/store";
import { readState } from "../providers/claude/profiles";
import { readCredentials } from "../providers/claude/credentials";
import { fetchClaudeUsage } from "../providers/claude/usage";
import {
  claudeProfileAccountFile,
  claudeProfileCredentials,
  claudeProfileDataFile,
} from "../lib/paths";
import { readJson } from "../lib/fs";
import { loadRegistry } from "../providers/codex/registry";
import { resolveCodexModel } from "../providers/codex/config";
import { readAccountAuth } from "../providers/codex/auth";
import { fetchCodexUsage } from "../providers/codex/usage";
import { fetchRelayBalance } from "../lib/oneapi";
import {
  blank,
  header,
  hint,
  icons,
  sectionHeader,
  formatType,
  formatPlan,
  formatUsage,
  formatBalance,
  maskKey,
} from "../lib/ui";
import type {
  AliasEntry,
  OAuthAccount,
  AccountInfo,
  CodexRegistryAccount,
  ProfileData,
} from "../types";

export interface ListOptions {
  usage?: boolean;
}

export async function list(options: ListOptions = {}): Promise<void> {
  const withUsage = options.usage !== false;
  const aliasReg = await loadAliases();

  if (aliasReg.aliases.length === 0) {
    blank();
    console.log(header("  No accounts yet"));
    blank();
    hint(
      `Run ${chalk.cyan("claudex-switch import")} to import existing accounts`,
    );
    hint(
      `or  ${chalk.cyan("claudex-switch add <alias>")} to add a new one`,
    );
    blank();
    return;
  }

  // Separate by provider
  const claudeAliases = aliasReg.aliases.filter(
    (a) => a.target.provider === "claude",
  );
  const codexAliases = aliasReg.aliases.filter(
    (a) => a.target.provider === "codex",
  );

  // Load provider states
  const claudeState = await readState();
  let codexReg = null;
  try {
    codexReg = await loadRegistry();
  } catch {
    // No codex registry
  }
  const codexUsage = withUsage && codexReg?.api?.usage !== false;

  // All account lookups (and their usage requests) run in parallel so the
  // list renders after the slowest single account, not the sum of all.
  const [claudeInfos, codexInfos] = await Promise.all([
    Promise.all(
      claudeAliases.map((entry) =>
        getClaudeAccountInfo(entry, claudeState.active, withUsage),
      ),
    ),
    Promise.all(
      codexAliases.map((entry) =>
        getCodexAccountInfo(entry, codexReg, codexUsage),
      ),
    ),
  ]);

  blank();
  console.log(header("  Accounts"));

  if (claudeInfos.length > 0) {
    blank();
    sectionHeader("Claude");
    renderSection(claudeInfos);
  }

  if (codexInfos.length > 0) {
    blank();
    sectionHeader("Codex");
    renderSection(codexInfos);
  }

  const anyUsage = [...claudeInfos, ...codexInfos].some((info) => info.usage);
  if (anyUsage) {
    blank();
    hint("5h/wk = remaining quota in the 5-hour / weekly window");
  }

  blank();
}

function renderSection(infos: AccountInfo[]): void {
  const maxAliasLen = Math.max(...infos.map((info) => info.alias.length));

  for (const info of infos) {
    const icon = info.isActive ? icons.active : icons.inactive;
    const name = info.isActive
      ? chalk.green.bold(info.alias)
      : info.alias;
    const paddedName =
      name + " ".repeat(Math.max(0, maxAliasLen - info.alias.length));
    const type = formatType(info.authMode);
    const plan = formatPlan(info.plan);
    const email = info.email ? chalk.dim(info.email) : "";
    const apiProvider = info.apiProvider
      ? `  ${chalk.dim(info.apiProvider)}`
      : "";
    const model = info.defaultModel
      ? `  ${chalk.dim(info.defaultModel)}`
      : "";
    const usage = formatUsage(info.usage, info.usageNote);
    const balance = formatBalance(info.balance);
    const quota = usage || balance;
    const quotaStr = quota ? `  ${quota}` : "";

    console.log(
      `  ${icon} ${paddedName}  ${type}  ${plan}  ${email}${apiProvider}${model}${quotaStr}`,
    );
  }
}

async function getClaudeAccountInfo(
  entry: AliasEntry,
  activeProfile: string | null,
  withUsage: boolean,
): Promise<AccountInfo> {
  if (entry.target.provider !== "claude") throw new Error("Not a claude alias");
  const profileName = entry.target.profileName;
  const isActive = activeProfile === profileName;

  const info: AccountInfo = {
    alias: entry.alias,
    provider: "claude",
    email: null,
    plan: null,
    authMode: "oauth",
    apiProvider: null,
    defaultModel: null,
    isActive,
    usage: null,
    usageNote: null,
    balance: null,
  };

  try {
    const profileData = await readJson<ProfileData>(
      claudeProfileDataFile(profileName),
      { type: "oauth" },
    );
    info.authMode = profileData.type;
    info.defaultModel =
      profileData.type === "api-key"
        ? profileData.model ?? null
        : profileData.defaultModel ?? null;

    if (profileData.type === "api-key" && profileData.apiKey) {
      info.plan = maskKey(profileData.apiKey);
      if (withUsage && profileData.baseUrl) {
        info.balance = await fetchRelayBalance(
          profileData.baseUrl,
          profileData.apiKey,
        );
      }
    } else {
      const creds = await readCredentials(
        claudeProfileCredentials(profileName),
      );
      info.plan = creds?.claudeAiOauth?.subscriptionType ?? null;

      const account = await readJson<OAuthAccount | null>(
        claudeProfileAccountFile(profileName),
        null,
      );
      info.email = account?.emailAddress ?? null;

      if (withUsage) {
        const result = await fetchClaudeUsage(profileName, isActive);
        info.usage = result.usage;
        info.usageNote = result.note;
      }
    }
  } catch {
    // Profile may not exist anymore
  }

  return info;
}

async function getCodexAccountInfo(
  entry: AliasEntry,
  codexReg: Awaited<ReturnType<typeof loadRegistry>> | null,
  withUsage: boolean,
): Promise<AccountInfo> {
  if (entry.target.provider !== "codex") throw new Error("Not a codex alias");

  const accountKey = entry.target.accountKey;
  const account = codexReg?.accounts?.find(
    (a: CodexRegistryAccount) => a.account_key === accountKey,
  );

  const isActive = codexReg?.active_account_key === accountKey;

  if (!account) {
    return {
      alias: entry.alias,
      provider: "codex",
      email: null,
      plan: null,
      authMode: "unknown",
      apiProvider: null,
      defaultModel: null,
      isActive,
      usage: null,
      usageNote: null,
      balance: null,
    };
  }

  const info: AccountInfo = {
    alias: entry.alias,
    provider: "codex",
    email: account.email || null,
    plan: account.plan ?? null,
    authMode: account.auth_mode ?? "chatgpt",
    apiProvider:
      account.auth_mode === "apikey"
        ? account.api_provider?.type === "custom"
          ? account.api_provider.name
          : "official"
        : null,
    defaultModel: resolveCodexModel(
      account.default_model,
      account.api_provider?.model ?? null,
    ),
    isActive,
    usage: null,
    usageNote: null,
    balance: null,
  };

  if (withUsage) {
    if (account.auth_mode === "apikey") {
      const baseUrl = account.api_provider?.base_url;
      if (baseUrl) {
        const auth = await readAccountAuth(accountKey);
        if (auth?.OPENAI_API_KEY) {
          info.balance = await fetchRelayBalance(baseUrl, auth.OPENAI_API_KEY);
        }
      }
    } else {
      // Registry plan can be stale; fetchCodexUsage skips free-plan
      // accounts based on the stored token itself.
      const result = await fetchCodexUsage(accountKey, isActive);
      info.usage = result.usage;
      info.usageNote = result.note;
    }
  }

  return info;
}
