import chalk from "chalk";
import { stripVTControlCharacters } from "util";
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
import {
  acquireRefreshLock,
  formatAge,
  isRefreshRunning,
  nextCacheEntry,
  quotaFromCache,
  readUsageCache,
  spawnBackgroundRefresh,
  usageCacheMtime,
  writeUsageCache,
  type UsageCache,
} from "../lib/usage-cache";
import { readActivityCache, renderActivityLines, type ActivityCache } from "../lib/activity";
import { loadRegistry, saveRegistry } from "../providers/codex/registry";
import { resolveCodexModel } from "../providers/codex/config";
import {
  readAccountAuth,
  decodeCodexPlan,
  syncActiveAuthSnapshot,
} from "../providers/codex/auth";
import { fetchCodexUsage } from "../providers/codex/usage";
import { fetchRelayBalance } from "../lib/oneapi";
import {
  inspectManagedCLIProxyAPI,
  resolveManagedLocalCLIProxyAPIDefaultModel,
} from "../providers/cliproxyapi/managed";
import { getLinkedClaudeProfile } from "../providers/cliproxyapi/links";
import { CLI_PROXY_API_UPSTREAMS } from "../providers/cliproxyapi/upstreams";
import { fetchCLIProxyAPIUsage } from "../providers/cliproxyapi/usage";
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
  Provider,
  OAuthAccount,
  AccountInfo,
  CodexRegistryAccount,
  CodexAuthFile,
  ProfileData,
  UsageInfo,
} from "../types";

export interface ListOptions {
  usage?: boolean;
  json?: boolean;
  /** Render cached quota only and refresh it in the background (shell startup). */
  cached?: boolean;
  /**
   * Fetch quota in a detached `list --refresh-cache` process (the CLI).
   * Without it the refresh runs inline before rendering (tests, embedding).
   */
  background?: boolean;
  /** How long a human `list` waits for the background refresh. */
  waitMs?: number;
  /** Starts the detached refresher; injectable for tests. */
  spawnRefresh?: () => void;
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
  /** Status of the Claude Code proxy behind `--cliproxy claudecode`, if linked. */
  linkedClient?: string | null;
  /** When the shown quota was fetched, if it came from an earlier refresh. */
  quotaAt?: number | null;
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
  usage: UsageInfo | null;
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

  const ctx = await loadListContext(validAliases, offlineJson);

  if (options.json) {
    // Machine output keeps its live contract: one inline fetch per account.
    const infos = await Promise.all(
      ctx.entries.map((entry) => accountInfo(ctx, entry, withUsage, options, true)),
    );
    if (!offlineJson) await persistDisplayedCodexPlans(ctx.entries, infos, ctx.codexReg);
    const result: JsonListResult = {
      schemaVersion: 1,
      accounts: infos.map(toJsonListAccount).sort(compareJsonAccounts),
    };
    console.log(JSON.stringify(result));
    return;
  }

  // Everything below renders from local files only; quota comes from the
  // usage cache so a slow or dead endpoint never blocks the terminal.
  const baseInfos = await Promise.all(
    ctx.entries.map((entry) => accountInfo(ctx, entry, false, options, false)),
  );
  const activity = await readActivityCache();

  if (!withUsage) {
    // With usage on, the refresher persists the live plan instead; persisting
    // the token plan here too would make the two flip-flop.
    await persistDisplayedCodexPlans(ctx.entries, baseInfos, ctx.codexReg);
    printLines(renderLines(baseInfos, false, activity));
    return;
  }

  if (!options.background) {
    await refreshUsageCache(options);
    printLines(renderLines(withCachedQuota(ctx.entries, baseInfos, await readUsageCache()), false, activity));
    return;
  }

  const spawnRefresh = options.spawnRefresh ?? spawnBackgroundRefresh;
  if (options.cached) {
    const cache = await readUsageCache();
    printLines(renderLines(withCachedQuota(ctx.entries, baseInfos, cache), false, activity));
    await startBackgroundRefreshIfIdle(cache, spawnRefresh);
    return;
  }

  const startedAt = Date.now();
  spawnRefresh();
  await renderWhileRefreshing(
    ctx.entries,
    baseInfos,
    activity,
    startedAt,
    options.waitMs ?? DEFAULT_WAIT_MS,
  );
}

/**
 * The only network path for human output. Runs detached from the terminal
 * (`list --refresh-cache`) so token refreshes always run to completion, and
 * writes each account's result as soon as it arrives.
 */
export async function refreshUsageCache(
  options: Pick<ListOptions, "codexUsageFetcher" | "openCodeUsageFetcher"> = {},
): Promise<boolean> {
  const release = await acquireRefreshLock();
  if (!release) return false;
  try {
    const ctx = await loadListContext((await loadAliases()).aliases, false);
    const cache = await readUsageCache();
    const keys = new Set(ctx.entries.map(cacheKey));
    cache.entries = Object.fromEntries(
      Object.entries(cache.entries).filter(([key]) => keys.has(key)),
    );
    cache.refreshStartedAt = Date.now();

    let writes: Promise<void> = writeUsageCache(cache);
    const save = (): Promise<void> => {
      writes = writes.catch(() => {}).then(() => writeUsageCache(cache));
      return writes;
    };

    const infos = await Promise.all(
      ctx.entries.map(async (entry) => {
        const info = await accountInfo(ctx, entry, true, options, false);
        if (info.status === "configured") {
          const key = cacheKey(entry);
          cache.entries[key] = nextCacheEntry(
            cache.entries[key],
            {
              usage: info.usage,
              balance: info.balance,
              note: info.usageNote,
              plan:
                info.authMode === "chatgpt" || info.authMode === "local-cliproxyapi"
                  ? info.plan
                  : null,
            },
            Date.now(),
          );
          await save().catch(() => {});
        }
        return info;
      }),
    );
    await persistDisplayedCodexPlans(ctx.entries, infos, ctx.codexReg);

    cache.refreshFinishedAt = Date.now();
    await save();
    return true;
  } finally {
    await release();
  }
}

const DEFAULT_WAIT_MS = 2_000;
const POLL_MS = 100;
// Opening several shells at once should not start several refreshes.
const CACHED_REFRESH_MIN_INTERVAL_MS = 30_000;

interface ListContext {
  /** Display order: Claude, Codex, OpenCode. */
  entries: AliasEntry[];
  claudeActive: string | null;
  openCodeActive: string | null;
  codexReg: Awaited<ReturnType<typeof loadRegistry>> | null;
  codexUsage: boolean;
}

async function loadListContext(
  aliases: AliasEntry[],
  offlineJson: boolean,
): Promise<ListContext> {
  const byProvider = (provider: string) =>
    aliases.filter((a) => a.target.provider === provider);

  const claudeState = await readState();
  const openCodeState = await readOpenCodeState();
  let codexReg = null;
  try {
    codexReg = await loadRegistry({ persistNormalization: !offlineJson });
    if (!offlineJson) await syncActiveAuthSnapshot(codexReg);
  } catch {
    // No codex registry
  }

  return {
    entries: [
      ...byProvider("claude"),
      ...byProvider("codex"),
      ...byProvider("opencode"),
    ],
    claudeActive: claudeState.active,
    openCodeActive: openCodeState.active,
    codexReg,
    codexUsage: codexReg?.api?.usage !== false,
  };
}

async function accountInfo(
  ctx: ListContext,
  entry: AliasEntry,
  withUsage: boolean,
  options: ListOptions,
  inspectCredentials: boolean,
): Promise<ListAccountInfo> {
  const info = await providerAccountInfo(ctx, entry, withUsage, options, inspectCredentials);
  if (entry.target.provider !== "claude") {
    info.linkedClient = await linkedClaudeCodeStatus(entry.target);
  }
  return info;
}

// Local only (state file + ps); never probes the proxy or its upstream.
async function linkedClaudeCodeStatus(
  target: Extract<AliasEntry["target"], { provider: "codex" | "opencode" }>,
): Promise<string | null> {
  const profileName = await getLinkedClaudeProfile(target);
  if (!profileName) return null;
  const data = await readJson<ProfileData | null>(claudeProfileDataFile(profileName), null);
  if (data?.type !== "local-cliproxyapi") return null;
  const status = await inspectManagedCLIProxyAPI({
    profileId: data.profileId,
    binaryPath: data.binaryPath,
  });
  return `claudecode: ${!status.loggedIn ? "login required" : status.running ? "running" : "stopped"}`;
}

function providerAccountInfo(
  ctx: ListContext,
  entry: AliasEntry,
  withUsage: boolean,
  options: ListOptions,
  inspectCredentials: boolean,
): Promise<ListAccountInfo> {
  switch (entry.target.provider) {
    case "claude":
      return getClaudeAccountInfo(entry, ctx.claudeActive, withUsage);
    case "codex":
      return getCodexAccountInfo(
        entry,
        ctx.codexReg,
        withUsage && ctx.codexUsage,
        options.codexUsageFetcher ?? fetchCodexUsage,
        inspectCredentials,
      );
    default:
      return getOpenCodeAccountInfo(
        entry,
        ctx.openCodeActive,
        withUsage,
        options.openCodeUsageFetcher ?? fetchOpenCodeUsage,
      );
  }
}

function cacheKey(entry: AliasEntry): string {
  const target = entry.target;
  switch (target.provider) {
    case "claude":
      return `claude:${target.profileName}`;
    case "codex":
      return `codex:${target.accountKey}`;
    default:
      return `opencode:${target.profileId}`;
  }
}

function withCachedQuota(
  entries: AliasEntry[],
  baseInfos: ListAccountInfo[],
  cache: UsageCache,
): ListAccountInfo[] {
  return baseInfos.map((info, index) => {
    const entry = entries[index];
    if (!entry || info.status !== "configured") return info;
    const quota = quotaFromCache(cache.entries[cacheKey(entry)]);
    if (!quota) return info;
    return {
      ...info,
      usage: quota.usage,
      balance: quota.balance,
      usageNote: quota.note ?? info.usageNote,
      plan:
        (info.authMode === "chatgpt" || info.authMode === "local-cliproxyapi") && quota.plan
          ? quota.plan
          : info.plan,
      quotaAt: quota.dataAt,
    };
  });
}

async function startBackgroundRefreshIfIdle(
  cache: UsageCache,
  spawnRefresh: () => void,
): Promise<void> {
  const last = Math.max(cache.refreshStartedAt ?? 0, cache.refreshFinishedAt ?? 0);
  if (Date.now() - last < CACHED_REFRESH_MIN_INTERVAL_MS) return;
  if (await isRefreshRunning()) return;
  spawnRefresh();
}

/**
 * Show cached quota at once, then redraw in place as the background refresh
 * lands each account. Gives up after `waitMs`; the refresh keeps going and the
 * next `list` shows its results.
 */
async function renderWhileRefreshing(
  entries: AliasEntry[],
  baseInfos: ListAccountInfo[],
  activity: ActivityCache,
  startedAt: number,
  waitMs: number,
): Promise<void> {
  let cache = await readUsageCache();
  const finished = () => (cache.refreshFinishedAt ?? 0) >= startedAt;
  const current = (refreshing: boolean) =>
    renderLines(withCachedQuota(entries, baseInfos, cache), refreshing, activity);

  const initial = current(true);
  const live =
    process.stdout.isTTY === true &&
    visualLineCount(initial) < (process.stdout.rows || 24);
  let drawn = live ? redraw(initial, 0) : 0;

  let lastMtime = await usageCacheMtime();
  while (!finished() && Date.now() - startedAt < waitMs) {
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    const mtime = await usageCacheMtime();
    if (mtime === lastMtime) continue;
    lastMtime = mtime;
    cache = await readUsageCache();
    if (live) drawn = redraw(current(!finished()), drawn);
  }

  if (live) redraw(current(false), drawn);
  else printLines(current(false));
}

function redraw(lines: string[], previousLineCount: number): number {
  const clear = previousLineCount > 0 ? `\x1b[${previousLineCount}A\x1b[0J` : "";
  process.stdout.write(`${clear}${lines.join("\n")}\n`);
  return visualLineCount(lines);
}

function visualLineCount(lines: string[]): number {
  const columns = process.stdout.columns || 80;
  return lines.reduce(
    (total, line) =>
      total + Math.max(1, Math.ceil(stripVTControlCharacters(line).length / columns)),
    0,
  );
}

function printLines(lines: string[]): void {
  console.log(lines.join("\n"));
}

/** Render the account table as lines, reusing the console-based UI helpers. */
function renderLines(
  infos: ListAccountInfo[],
  refreshing: boolean,
  activity: ActivityCache,
): string[] {
  const lines: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    lines.push(...args.map(String).join(" ").split("\n"));
  };
  try {
    blank();
    console.log(header("  Accounts"));

    const sections: Array<[string, Provider]> = [
      ["Claude", "claude"],
      ["Codex", "codex"],
      ["OpenCode", "opencode"],
    ];
    for (const [title, provider] of sections) {
      const sectionInfos = infos.filter((info) => info.provider === provider);
      if (sectionInfos.length === 0) continue;
      blank();
      sectionHeader(title);
      renderSection(sectionInfos);
    }

    if (infos.some((info) => info.usage)) {
      blank();
      hint("5h/wk/mo = remaining quota in the 5-hour / weekly / monthly window");
    }
    if (refreshing) hint("refreshing quota…");

    const trend = renderActivityLines(activity);
    if (trend.length > 0) {
      blank();
      for (const line of trend) console.log(line);
    }

    blank();
  } finally {
    console.log = originalLog;
  }
  return lines;
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

function renderSection(infos: ListAccountInfo[]): void {
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
      ? chalk.dim(info.apiProvider)
      : "";
    const linkedClient = info.provider !== "opencode" && info.linkedClient
      ? chalk.dim(`· ${info.linkedClient}`)
      : "";
    const model = info.provider !== "opencode" && info.defaultModel
      ? chalk.dim(info.defaultModel)
      : "";
    const usage = formatUsage(info.usage, info.usageNote);
    const balance = formatBalance(info.balance);
    const quota = usage || balance;
    const age =
      quota && info.quotaAt && Date.now() - info.quotaAt >= 60_000
        ? chalk.dim(` · ${formatAge(Date.now() - info.quotaAt)}`)
        : "";
    const details = [type, plan, email, apiProvider, linkedClient, model, quota ? `${quota}${age}` : ""]
      .filter(Boolean).join("  ");

    console.log(
      `  ${icon} ${paddedName}  ${details}`,
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
      // The auth type already names CLIProxyAPI; only name the upstream here.
      const upstream = profileData.upstream ?? "codex";
      const prefix =
        upstream === "codex"
          ? "CLIProxyAPI"
          : CLI_PROXY_API_UPSTREAMS[upstream].label;
      info.apiProvider = status.loggedIn
        ? !status.environmentValid
          ? `${prefix} · invalid private env`
          : !status.configured
          ? `${prefix} · invalid config`
          : status.running
          ? `${prefix} · running`
          : `${prefix} · stopped`
        : `${prefix} · login required`;
      if (upstream !== "codex") {
        try {
          info.defaultModel = await resolveManagedLocalCLIProxyAPIDefaultModel(profileData);
        } catch {
          // Keep the stored value; status above already flags a broken env.
        }
      }
      if (withUsage && status.loggedIn) {
        const result = await fetchCLIProxyAPIUsage(profileData);
        info.usage = result.usage;
        info.usageNote = result.note;
        info.plan = result.plan ?? null;
      }
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
    usage: jsonUsage(info.usage),
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

function jsonUsage(usage: UsageInfo | null): UsageInfo | null {
  if (!usage) return null;
  return {
    fiveHourUsedPercent: safePercent(usage.fiveHourUsedPercent),
    fiveHourResetsAt: safeTimestamp(usage.fiveHourResetsAt),
    weeklyUsedPercent: safePercent(usage.weeklyUsedPercent),
    weeklyResetsAt: safeTimestamp(usage.weeklyResetsAt),
    monthlyUsedPercent: safePercent(usage.monthlyUsedPercent),
    monthlyResetsAt: safeTimestamp(usage.monthlyResetsAt),
    ...(usage.groups ? { groups: usage.groups.map(({ name, usage }) => ({ name, usage: jsonUsage(usage)! })) } : {}),
    ...(usage.credits ? { credits: { used: usage.credits.used, total: usage.credits.total } } : {}),
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
