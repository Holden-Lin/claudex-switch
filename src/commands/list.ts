import chalk from "chalk";
import { loadAliases } from "../alias/store";
import {
  readFreshestOAuthCredentials,
  readState,
} from "../providers/claude/profiles";
import { fetchClaudeUsage } from "../providers/claude/usage";
import {
  claudeProfileAccountFile,
  claudeProfileDataFile,
} from "../lib/paths";
import { readJson } from "../lib/fs";
import { loadRegistry, saveRegistry } from "../providers/codex/registry";
import { resolveCodexModel } from "../providers/codex/config";
import {
  readAccountAuth,
  decodeCodexPlan,
  syncActiveAuthSnapshot,
} from "../providers/codex/auth";
import { fetchCodexUsage } from "../providers/codex/usage";
import { fetchRelayBalance } from "../lib/oneapi";
import { inspectManagedCLIProxyAPI } from "../providers/cliproxyapi/managed";
import {
  getOpenCodeProfileData,
  hasOpenCodeGoCredential,
  readOpenCodeState,
} from "../providers/opencode/profiles";
import { fetchOpenCodeUsage } from "../providers/opencode/usage";
import { normalizeOpenCodeConsoleModel } from "../providers/opencode/console";
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
  CodexAuthFile,
  ProfileData,
} from "../types";

export interface ListOptions {
  usage?: boolean;
  json?: boolean;
  codexUsageFetcher?: typeof fetchCodexUsage;
  openCodeUsageFetcher?: typeof fetchOpenCodeUsage;
}

type ListAccountStatus =
  | "configured"
  | "missing-profile"
  | "missing-credential"
  | "login-required";

interface ListAccountInfo extends AccountInfo {
  status: ListAccountStatus;
}

export interface JsonListAccount {
  alias: string;
  provider: "claude" | "codex" | "opencode";
  authMode:
    | "oauth"
    | "api-key"
    | "local-cliproxyapi"
    | "chatgpt"
    | "apikey"
    | "subscription"
    | "missing-credential"
    | "missing-profile"
    | "unknown";
  plan: string | null;
  defaultModel: string | null;
  isActive: boolean;
  status: ListAccountStatus;
  usage: {
    fiveHourUsedPercent: number | null;
    fiveHourResetsAt: number | null;
    weeklyUsedPercent: number | null;
    weeklyResetsAt: number | null;
    monthlyUsedPercent: number | null;
    monthlyResetsAt: number | null;
  } | null;
  balance: {
    key: {
      remainingUsd: number | null;
      usedUsd: number | null;
      unlimited: boolean;
    } | null;
    account: {
      remainingUsd: number | null;
      usedUsd: number | null;
      unlimited: boolean;
    } | null;
  } | null;
}

export interface JsonListResult {
  schemaVersion: 1;
  accounts: JsonListAccount[];
}

export async function list(options: ListOptions = {}): Promise<void> {
  const withUsage = options.usage !== false;
  const offlineJson = options.json === true && !withUsage;
  const aliasReg = await loadAliases();
  // Preserve the human command's historic tolerance of older registry entries.
  // Machine output validates path-bearing targets before using them.
  const validAliases = options.json
    ? aliasReg.aliases.filter(isWellFormedJsonAlias)
    : aliasReg.aliases;

  if (validAliases.length === 0) {
    if (options.json) {
      console.log(JSON.stringify({ schemaVersion: 1, accounts: [] }));
      return;
    }
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
  const claudeAliases = validAliases.filter(
    (a) => a.target.provider === "claude",
  );
  const codexAliases = validAliases.filter(
    (a) => a.target.provider === "codex",
  );
  const openCodeAliases = validAliases.filter(
    (a) => a.target.provider === "opencode",
  );

  // Load provider states
  const claudeState = await readState();
  const openCodeState = await readOpenCodeState();
  let codexReg = null;
  try {
    codexReg = await loadRegistry({ persistNormalization: !offlineJson });
    if (!offlineJson) await syncActiveAuthSnapshot(codexReg);
  } catch {
    // No codex registry
  }
  const codexUsage = withUsage && codexReg?.api?.usage !== false;

  // All account lookups (and their usage requests) run in parallel so the
  // list renders after the slowest single account, not the sum of all.
  const [claudeInfos, codexInfos, openCodeInfos] = await Promise.all([
    Promise.all(
      claudeAliases.map((entry) =>
        getClaudeAccountInfo(entry, claudeState.active, withUsage),
      ),
    ),
    Promise.all(
      codexAliases.map((entry) =>
        getCodexAccountInfo(
          entry,
          codexReg,
          codexUsage,
          options.codexUsageFetcher ?? fetchCodexUsage,
          options.json === true,
        ),
      ),
    ),
    Promise.all(
      openCodeAliases.map((entry) =>
        getOpenCodeAccountInfo(
          entry,
          openCodeState.active,
          withUsage,
          options.openCodeUsageFetcher ?? fetchOpenCodeUsage,
        ),
      ),
    ),
  ]);
  if (!offlineJson) {
    await persistDisplayedCodexPlans(codexAliases, codexInfos, codexReg);
  }

  if (options.json) {
    const result: JsonListResult = {
      schemaVersion: 1,
      accounts: [...claudeInfos, ...codexInfos, ...openCodeInfos]
        .map(toJsonListAccount)
        .sort(compareJsonAccounts),
    };
    console.log(JSON.stringify(result));
    return;
  }

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

  if (openCodeInfos.length > 0) {
    blank();
    sectionHeader("OpenCode");
    renderSection(openCodeInfos);
  }

  const anyUsage = [...claudeInfos, ...codexInfos, ...openCodeInfos].some(
    (info) => info.usage,
  );
  if (anyUsage) {
    blank();
    hint("5h/wk/mo = remaining quota in the 5-hour / weekly / monthly window");
  }

  blank();
}

async function getOpenCodeAccountInfo(
  entry: AliasEntry,
  activeProfile: string | null,
  withUsage: boolean,
  usageFetcher: typeof fetchOpenCodeUsage,
): Promise<ListAccountInfo> {
  if (entry.target.provider !== "opencode") {
    throw new Error("Not an OpenCode alias");
  }

  const profileId = entry.target.profileId;
  const info: ListAccountInfo = {
    alias: entry.alias,
    provider: "opencode",
    email: null,
    plan: "Go",
    authMode: "subscription",
    apiProvider: null,
    defaultModel: null,
    isActive: activeProfile === profileId,
    usage: null,
    usageNote: null,
    balance: null,
    status: "configured",
  };

  try {
    const profile = await getOpenCodeProfileData(profileId);
    info.defaultModel = profile.console && profile.defaultModel
      ? normalizeOpenCodeConsoleModel(profile.defaultModel)
      : profile.defaultModel ?? null;
    if (profile.console) {
      info.email = profile.console.email;
    }
    if (!(await hasOpenCodeGoCredential(profileId))) {
      info.authMode = "missing credential";
      info.usageNote = "reconnect required";
      info.status = "missing-credential";
    } else if (withUsage) {
      const result = await usageFetcher(profileId);
      info.usage = result.usage;
      info.usageNote = result.note;
    }
  } catch {
    info.authMode = "missing profile";
    info.usageNote = "reconnect required";
    info.status = "missing-profile";
  }

  return info;
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
): Promise<ListAccountInfo> {
  if (entry.target.provider !== "claude") throw new Error("Not a claude alias");
  const profileName = entry.target.profileName;
  const isActive = activeProfile === profileName;

  const info: ListAccountInfo = {
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
    status: "configured",
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

    if (profileData.type === "local-cliproxyapi") {
      const status = await inspectManagedCLIProxyAPI({
        profileId: profileData.profileId,
        binaryPath: profileData.binaryPath,
      });
      info.apiProvider = status.loggedIn
        ? !status.environmentValid
          ? "CLIProxyAPI · invalid private env"
          : !status.configured
          ? "CLIProxyAPI · invalid config"
          : status.running
          ? "CLIProxyAPI · running"
          : "CLIProxyAPI · stopped"
        : "CLIProxyAPI · login required";
      info.usageNote = "quota unavailable";
      if (!status.loggedIn) info.status = "login-required";
    } else if (profileData.type === "api-key" && profileData.apiKey) {
      info.plan = maskKey(profileData.apiKey);
      if (withUsage && profileData.baseUrl) {
        info.balance = await fetchRelayBalance(
          profileData.baseUrl,
          profileData.apiKey,
        );
      }
    } else if (profileData.type === "api-key") {
      info.status = "missing-credential";
    } else {
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

      const creds = await readFreshestOAuthCredentials(profileName, isActive);
      info.plan = creds?.claudeAiOauth?.subscriptionType ?? null;
      if (!creds?.claudeAiOauth) info.status = "missing-credential";
    }
  } catch {
    // Profile may not exist anymore
    info.status = "missing-profile";
  }

  return info;
}

async function getCodexAccountInfo(
  entry: AliasEntry,
  codexReg: Awaited<ReturnType<typeof loadRegistry>> | null,
  withUsage: boolean,
  codexUsageFetcher: typeof fetchCodexUsage,
  inspectCredentials: boolean,
): Promise<ListAccountInfo> {
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
      status: "missing-profile",
    };
  }

  const info: ListAccountInfo = {
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
    status: "configured",
  };
  let serverPlan: string | null = null;

  let auth: CodexAuthFile | null = null;
  if (withUsage) {
    if (account.auth_mode === "apikey") {
      const baseUrl = account.api_provider?.base_url;
      if (baseUrl) {
        auth = await readAccountAuth(accountKey);
        if (auth?.OPENAI_API_KEY) {
          info.balance = await fetchRelayBalance(baseUrl, auth.OPENAI_API_KEY);
        }
      }
    } else {
      // Registry plan can be stale; fetchCodexUsage skips free-plan
      // accounts based on the stored token itself.
      const result = await codexUsageFetcher(accountKey, isActive);
      info.usage = result.usage;
      info.usageNote = result.note;
      serverPlan = result.plan ?? null;
    }
  }

  if (account.auth_mode !== "apikey" || inspectCredentials) {
    info.plan = serverPlan ?? info.plan;
    auth ??= await readAccountAuth(accountKey);
    if (auth?.auth_mode === "chatgpt") {
      info.plan = serverPlan ?? decodeCodexPlan(auth.tokens) ?? info.plan;
    }
  }

  if (inspectCredentials) {
    const hasCredential =
      auth?.auth_mode === "apikey"
        ? Boolean(auth.OPENAI_API_KEY)
        : auth?.auth_mode === "chatgpt" && Boolean(auth.tokens?.access_token);
    if (!hasCredential) info.status = "missing-credential";
  }

  return info;
}

function isWellFormedJsonAlias(value: unknown): value is AliasEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<AliasEntry>;
  if (
    typeof entry.alias !== "string" ||
    entry.alias.length === 0 ||
    /[\u0000-\u001f\u007f]/.test(entry.alias)
  ) {
    return false;
  }
  if (!entry.target || typeof entry.target !== "object") return false;

  const target = entry.target as unknown as Record<string, unknown>;
  if (target.provider === "claude") {
    return isSafePathSegment(target.profileName);
  }
  if (target.provider === "codex") {
    return (
      typeof target.accountKey === "string" &&
      target.accountKey.length > 0 &&
      target.accountKey.length <= 1024
    );
  }
  if (target.provider === "opencode") {
    return (
      typeof target.profileId === "string" &&
      /^go-[0-9a-f-]{36}$/i.test(target.profileId)
    );
  }
  return false;
}

function isSafePathSegment(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value !== "." &&
    value !== ".." &&
    !/[\\/:\u0000]/.test(value)
  );
}

const SAFE_PLANS = new Set([
  "max",
  "pro",
  "plus",
  "team",
  "business",
  "enterprise",
  "edu",
  "free",
  "go",
]);

function safePlan(plan: string | null, authMode: string): string | null {
  if (authMode === "api-key" || authMode === "apikey") return null;
  if (typeof plan !== "string") return null;
  const normalized = plan.trim().toLowerCase();
  return SAFE_PLANS.has(normalized) ? normalized : null;
}

function safeDefaultModel(model: string | null): string | null {
  if (
    typeof model !== "string" ||
    model.length > 128 ||
    !/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/.test(model) ||
    /api[-_]?key|secret|token|credential|bearer|^(?:sk|gh[pousr]|xox[baprs])[-_]/i.test(
      model,
    )
  ) {
    return null;
  }
  return model;
}

function safeAuthMode(provider: string, authMode: string): JsonListAccount["authMode"] {
  const allowed: Record<string, JsonListAccount["authMode"][]> = {
    claude: ["oauth", "api-key", "local-cliproxyapi"],
    codex: ["chatgpt", "apikey"],
    opencode: ["subscription"],
  };
  if (allowed[provider]?.includes(authMode as JsonListAccount["authMode"])) {
    return authMode as JsonListAccount["authMode"];
  }
  if (authMode === "missing credential") return "missing-credential";
  if (authMode === "missing profile") return "missing-profile";
  return "unknown";
}

function safePercent(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100
    ? value
    : null;
}

function safeTimestamp(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function safeMoney(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= 1_000_000_000
    ? value
    : null;
}

function toJsonListAccount(info: ListAccountInfo): JsonListAccount {
  return {
    alias: info.alias,
    provider: info.provider,
    authMode: safeAuthMode(info.provider, info.authMode),
    plan: safePlan(info.plan, info.authMode),
    defaultModel: safeDefaultModel(info.defaultModel),
    isActive: info.isActive,
    status: info.status,
    usage: info.usage
      ? {
          fiveHourUsedPercent: safePercent(info.usage.fiveHourUsedPercent),
          fiveHourResetsAt: safeTimestamp(info.usage.fiveHourResetsAt),
          weeklyUsedPercent: safePercent(info.usage.weeklyUsedPercent),
          weeklyResetsAt: safeTimestamp(info.usage.weeklyResetsAt),
          monthlyUsedPercent: safePercent(info.usage.monthlyUsedPercent),
          monthlyResetsAt: safeTimestamp(info.usage.monthlyResetsAt),
        }
      : null,
    balance: info.balance
      ? {
          key: info.balance.key
            ? {
                remainingUsd: safeMoney(info.balance.key.remainingUsd),
                usedUsd: safeMoney(info.balance.key.usedUsd),
                unlimited: info.balance.key.unlimited === true,
              }
            : null,
          account: info.balance.account
            ? {
                remainingUsd: safeMoney(info.balance.account.remainingUsd),
                usedUsd: safeMoney(info.balance.account.usedUsd),
                unlimited: info.balance.account.unlimited === true,
              }
            : null,
        }
      : null,
  };
}

function compareJsonAccounts(left: JsonListAccount, right: JsonListAccount): number {
  if (left.provider !== right.provider) {
    return left.provider < right.provider ? -1 : 1;
  }
  if (left.alias === right.alias) return 0;
  return left.alias < right.alias ? -1 : 1;
}

async function persistDisplayedCodexPlans(
  entries: AliasEntry[],
  infos: AccountInfo[],
  registry: Awaited<ReturnType<typeof loadRegistry>> | null,
): Promise<void> {
  if (!registry) return;

  const latestRegistry = await loadRegistry();
  let changed = false;
  entries.forEach((entry, index) => {
    if (entry.target.provider !== "codex") return;
    const accountKey = entry.target.accountKey;
    const account = latestRegistry.accounts.find(
      (candidate) => candidate.account_key === accountKey,
    );
    const plan = infos[index]?.plan ?? null;
    if (!account || account.auth_mode === "apikey" || !plan) return;
    if (account.plan !== plan) {
      account.plan = plan;
      changed = true;
    }
  });

  if (changed) await saveRegistry(latestRegistry);
}
