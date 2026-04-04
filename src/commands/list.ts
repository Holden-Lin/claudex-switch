import chalk from "chalk";
import { loadAliases } from "../alias/store";
import { listProfiles, readState } from "../providers/claude/profiles";
import { readCredentials } from "../providers/claude/credentials";
import { claudeProfileAccountFile, claudeProfileCredentials } from "../lib/paths";
import { readJson } from "../lib/fs";
import { loadRegistry, getActiveAccount } from "../providers/codex/registry";
import {
  blank,
  header,
  hint,
  icons,
  sectionHeader,
  formatType,
  formatPlan,
  formatUsage,
  maskKey,
} from "../lib/ui";
import type {
  AliasEntry,
  OAuthAccount,
  AccountInfo,
  CodexRegistryAccount,
} from "../types";

export async function list(): Promise<void> {
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

  blank();
  console.log(header("  Accounts"));

  // Claude section
  if (claudeAliases.length > 0) {
    blank();
    sectionHeader("Claude");

    const maxAliasLen = Math.max(
      ...claudeAliases.map((a) => a.alias.length),
    );

    for (const entry of claudeAliases) {
      const info = await getClaudeAccountInfo(entry, claudeState.active);
      const icon = info.isActive ? icons.active : icons.inactive;
      const name = info.isActive
        ? chalk.green.bold(info.alias)
        : info.alias;
      const paddedName = name + " ".repeat(Math.max(0, maxAliasLen - info.alias.length));
      const type = formatType(info.authMode);
      const plan = formatPlan(info.plan);
      const email = info.email ? chalk.dim(info.email) : "";

      console.log(`  ${icon} ${paddedName}  ${type}  ${plan}  ${email}`);
    }
  }

  // Codex section
  if (codexAliases.length > 0) {
    blank();
    sectionHeader("Codex");

    const maxAliasLen = Math.max(
      ...codexAliases.map((a) => a.alias.length),
    );

    for (const entry of codexAliases) {
      const info = await getCodexAccountInfo(entry, codexReg);
      const icon = info.isActive ? icons.active : icons.inactive;
      const name = info.isActive
        ? chalk.green.bold(info.alias)
        : info.alias;
      const paddedName = name + " ".repeat(Math.max(0, maxAliasLen - info.alias.length));
      const type = formatType(info.authMode);
      const plan = formatPlan(info.plan);
      const email = info.email ? chalk.dim(info.email) : "";

      let usageStr = "";
      if (info.usage) {
        const fiveH = formatUsage(info.usage.primaryPercent);
        const weekly = formatUsage(info.usage.secondaryPercent);
        usageStr = `  5h: ${fiveH}  weekly: ${weekly}`;
      }

      console.log(
        `  ${icon} ${paddedName}  ${type}  ${plan}  ${email}${usageStr}`,
      );
    }
  }

  blank();
}

async function getClaudeAccountInfo(
  entry: AliasEntry,
  activeProfile: string | null,
): Promise<AccountInfo> {
  if (entry.target.provider !== "claude") throw new Error("Not a claude alias");
  const profileName = entry.target.profileName;

  let plan: string | null = null;
  let email: string | null = null;
  let authMode = "oauth";

  try {
    const { readJson: rj } = await import("../lib/fs");
    const profileData = await rj<{ type: string; apiKey?: string }>(
      (await import("../lib/paths")).claudeProfileDataFile(profileName),
      { type: "oauth" },
    );
    authMode = profileData.type;

    if (profileData.type === "api-key" && profileData.apiKey) {
      plan = maskKey(profileData.apiKey);
    } else {
      const creds = await readCredentials(
        claudeProfileCredentials(profileName),
      );
      plan = creds?.claudeAiOauth?.subscriptionType ?? null;

      const account = await readJson<OAuthAccount | null>(
        claudeProfileAccountFile(profileName),
        null,
      );
      email = account?.emailAddress ?? null;
    }
  } catch {
    // Profile may not exist anymore
  }

  return {
    alias: entry.alias,
    provider: "claude",
    email,
    plan,
    authMode,
    isActive: activeProfile === profileName,
    usage: null,
  };
}

async function getCodexAccountInfo(
  entry: AliasEntry,
  codexReg: Awaited<ReturnType<typeof loadRegistry>> | null,
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
      isActive,
      usage: null,
    };
  }

  return {
    alias: entry.alias,
    provider: "codex",
    email: account.email || null,
    plan: account.plan ?? account.last_usage?.plan_type ?? null,
    authMode: account.auth_mode ?? "chatgpt",
    isActive,
    usage: account.last_usage
      ? {
          primaryPercent: account.last_usage.primary?.used_percent ?? null,
          secondaryPercent:
            account.last_usage.secondary?.used_percent ?? null,
          primaryResetsAt:
            account.last_usage.primary?.resets_at ?? null,
          secondaryResetsAt:
            account.last_usage.secondary?.resets_at ?? null,
        }
      : null,
  };
}
