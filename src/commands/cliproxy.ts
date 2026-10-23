import chalk from "chalk";
import { confirm, select } from "@inquirer/prompts";
import { addAlias, checkAlias, describeAliasRejection, findAlias, loadAliases } from "../alias/store";
import { blank, hint, info, success, warn } from "../lib/ui";
import {
  getProfileData,
  profileExists,
  removeProfile,
  saveLocalCLIProxyAPIProfile,
  updateLocalCLIProxyAPIProfileIdentity,
} from "../providers/claude/profiles";
import {
  CLI_PROXY_API_DEFAULTS,
  cleanupFailedManagedCLIProxyAPI,
  createManagedCLIProxyAPIProfileId,
  ensureManagedCLIProxyAPI,
  hasActiveManagedCLIProxyAPI,
  hasManagedCLIProxyAPILogin,
  initializeManagedCLIProxyAPI,
  getLocalCLIProxyAPISettings,
  readManagedCLIProxyAPIUpstream,
  runManagedCLIProxyAPILogin,
  updateManagedCLIProxyAPISetup,
  stopManagedCLIProxyAPI,
  type ExpectedCLIProxyAPIAccount,
  type ManagedCLIProxyAPISetup,
  type ManagedCLIProxyAPIRuntime,
} from "../providers/cliproxyapi/managed";
import {
  getLinkedClaudeProfile,
  setLinkedClaudeProfile,
  type LinkableTarget,
} from "../providers/cliproxyapi/links";
import {
  CLI_PROXY_API_UPSTREAMS,
  pickOpenCodeGoModels,
  type CLIProxyAPIModelMap,
  type CLIProxyAPIUpstream,
} from "../providers/cliproxyapi/upstreams";
import { findAccountByKey, loadRegistry } from "../providers/codex/registry";
import { getOpenCodeProfileData, readOpenCodeGoApiKey } from "../providers/opencode/profiles";
import { fetchOpenCodeGoCatalogIds } from "../providers/opencode/catalog";
import { resolveCLIProxyAPIBinaryForAdd } from "./add";
import type { AliasEntry, LocalCLIProxyAPIProfileData } from "../types";
import { assertCLIProxyAPICompatibility } from "../providers/cliproxyapi/version";
import { isSubscriptionUpstream, type SubscriptionUpstream } from "../providers/subscription-plugins";

// `--cliproxy <client>` names the CLI that consumes the upstream account. Only
// Claude Code exists today; the value leaves room for Codex/OpenCode later.
const CLAUDE_CODE_CLIENTS = new Set(["claudecode", "claude-code", "claude"]);
export const CLIPROXY_CLIENT_NAMES = "claudecode";

// No claudex provider owns Antigravity logins, so these names create a Claude
// alias backed by its own CLIProxyAPI login on first use.
const ANTIGRAVITY_KEYWORDS = new Set(["agy", "antigravity"]);

export function isAntigravityName(name: string): boolean {
  return ANTIGRAVITY_KEYWORDS.has(name.toLowerCase());
}

export function isSubscriptionName(name: string): boolean {
  return isSubscriptionUpstream(name.toLowerCase());
}

export function isClaudeCodeClient(value: string): boolean {
  return CLAUDE_CODE_CLIENTS.has(value.toLowerCase());
}

export interface CLIProxyResolveOptions {
  resolveBinary?: () => Promise<string | null>;
  confirmRisk?: () => Promise<boolean>;
  chooseWorkBuddyRegion?: () => Promise<SubscriptionUpstream>;
}

/**
 * Turn `<alias> --run --cliproxy claudecode` into the Claude profile that runs
 * Claude Code on that alias's subscription, creating it on first use. Throws
 * with a user-facing message; nothing is left behind when setup fails.
 */
export async function resolveCLIProxyClaudeEntry(
  aliasOrName: string,
  options: CLIProxyResolveOptions = {},
): Promise<AliasEntry> {
  const entry = findAlias(await loadAliases(), aliasOrName);

  if (!entry) {
    if (isAntigravityName(aliasOrName)) {
      return createAntigravityAlias(aliasOrName, options);
    }
    if (isSubscriptionName(aliasOrName)) {
      return createSubscriptionAlias(aliasOrName, aliasOrName.toLowerCase() as SubscriptionUpstream, options);
    }
    throw new UserFacingError(`Alias "${aliasOrName}" not found.`, [
      `Use a Codex or OpenCode Go alias, agy for Antigravity, or workbuddy / workbuddy-ai / cursor.`,
    ]);
  }

  if (entry.target.provider === "claude") {
    const data = (await profileExists(entry.target.profileName))
      ? await getProfileData(entry.target.profileName)
      : null;
    // A proxy-backed Claude alias (e.g. one created by `agy`) already runs
    // this way; accept the flag so the same command keeps working.
    if (data?.type === "local-cliproxyapi") {
      if (isSubscriptionUpstream(data.upstream) && !(await hasManagedCLIProxyAPILogin(data.profileId))) {
        const identity = await loginOrThrow(data.profileId, data.binaryPath, upstreamLabel(data.upstream), undefined, data.authIdentity);
        await updateLocalCLIProxyAPIProfileIdentity(entry.target.profileName, identity);
      }
      return entry;
    }
    throw new UserFacingError(`${entry.alias} is already a Claude account.`, [
      `Run ${chalk.cyan(`claudex-switch ${entry.alias} -run`)} without --cliproxy.`,
    ]);
  }

  const target = entry.target;
  const linked = await getLinkedClaudeProfile(target);
  if (linked && (await profileExists(linked))) {
    const data = await getProfileData(linked);
    if (data.type === "local-cliproxyapi") {
      if (target.provider === "codex") {
        await ensureCodexLinkLogin(entry.alias, target, data, linked);
      } else {
        await syncOpenCodeGoKey(target.profileId, data);
      }
      return claudeEntry(entry.alias, linked);
    }
  }

  const profileName =
    target.provider === "codex"
      ? await createCodexLink(entry.alias, target, options)
      : await createOpenCodeGoLink(entry.alias, target, options);
  return claudeEntry(entry.alias, profileName);
}

export class UserFacingError extends Error {
  constructor(message: string, readonly hints: string[] = []) {
    super(message);
  }
}

function claudeEntry(alias: string, profileName: string): AliasEntry {
  return { alias, target: { provider: "claude", profileName }, createdAt: Date.now() };
}

async function requireBinary(options: CLIProxyResolveOptions): Promise<string> {
  const binaryPath = await (options.resolveBinary ?? resolveCLIProxyAPIBinaryForAdd)();
  if (!binaryPath) {
    throw new UserFacingError("CLIProxyAPI was not installed or no valid executable was selected.", [
      "Install it with Homebrew on macOS, or provide an existing cli-proxy-api path.",
    ]);
  }
  return binaryPath;
}

// Create the managed proxy and its unaliased Claude profile, rolling back the
// exact generated directory on any failure.
async function createManagedProfile(
  binaryPath: string,
  setup: ManagedCLIProxyAPISetup,
  login: ((profileId: string) => Promise<string | undefined>) | null,
  save: (profileName: string, profile: LocalCLIProxyAPIProfileData) => Promise<void>,
): Promise<{ profileName: string; profile: LocalCLIProxyAPIProfileData; runtime?: ManagedCLIProxyAPIRuntime }> {
  const profileId = createManagedCLIProxyAPIProfileId();
  const profileName = `cliproxy-${profileId}`;
  const profile: LocalCLIProxyAPIProfileData = {
    type: "local-cliproxyapi",
    profileId,
    binaryPath,
    defaultModel: setup.upstream === "codex" ? CLI_PROXY_API_DEFAULTS.fableModel : "fable",
    upstream: setup.upstream,
  };
  let saved = false;
  try {
    await initializeManagedCLIProxyAPI(profileId, setup);
    const identity = login ? await login(profileId) : undefined;
    if (identity) profile.authIdentity = identity;
    // Discover models before publishing an Antigravity alias. A failed/empty
    // catalog must roll back first use rather than persist guessed IDs.
    const runtime = setup.upstream === "antigravity" || isSubscriptionUpstream(setup.upstream)
      ? await ensureManagedCLIProxyAPI(profile) : undefined;
    await saveLocalCLIProxyAPIProfile(profileName, profile);
    saved = true;
    await save(profileName, profile);
    return { profileName, profile, runtime };
  } catch (err) {
    try {
      if (saved) await removeProfile(profileName);
      else {
        await stopManagedCLIProxyAPI(profile);
        await cleanupFailedManagedCLIProxyAPI(profileId);
      }
    } catch {
      // Keep the original failure; the directory is unreachable without a link.
    }
    throw err;
  }
}

async function loginOrThrow(
  profileId: string,
  binaryPath: string,
  label: string,
  expectedAccount?: ExpectedCLIProxyAPIAccount,
  expectedIdentity?: string,
): Promise<string> {
  const login = await runManagedCLIProxyAPILogin(
    { profileId, binaryPath },
    undefined,
    expectedIdentity,
    expectedAccount,
  );
  if (login.identityMismatch) {
    throw new UserFacingError(`${label} login completed for a different account; nothing was changed.`, [
      "Log in with the same account as the alias and retry.",
    ]);
  }
  if (!login.success || !login.identity) {
    throw new UserFacingError(`CLIProxyAPI ${label} login failed or was cancelled.`);
  }
  return login.identity;
}

async function codexAccountFor(target: Extract<LinkableTarget, { provider: "codex" }>) {
  const account = findAccountByKey(await loadRegistry(), target.accountKey);
  if (!account) throw new UserFacingError("Codex account not found in registry.");
  if (account.auth_mode === "apikey") {
    throw new UserFacingError("--cliproxy needs a ChatGPT-login Codex account; this one uses an API key.");
  }
  return account;
}

async function createCodexLink(
  alias: string,
  target: Extract<LinkableTarget, { provider: "codex" }>,
  options: CLIProxyResolveOptions,
): Promise<string> {
  const account = await codexAccountFor(target);
  const binaryPath = await requireBinary(options);
  info(`First use: Claude Code needs its own ChatGPT login for ${chalk.bold(alias)} (once).`);
  hint("Sharing the Codex login would make each side invalidate the other's refresh token.");
  blank();
  const expected = { accountId: account.chatgpt_account_id, email: account.email };
  const { profileName } = await createManagedProfile(
    binaryPath,
    { upstream: "codex" },
    (profileId) => loginOrThrow(profileId, binaryPath, "ChatGPT", expected),
    (name) => setLinkedClaudeProfile(target, name),
  );
  success(`Linked ${chalk.bold(alias)} to Claude Code`);
  return profileName;
}

async function ensureCodexLinkLogin(
  alias: string,
  target: Extract<LinkableTarget, { provider: "codex" }>,
  profile: LocalCLIProxyAPIProfileData,
  profileName: string,
): Promise<void> {
  if (await hasManagedCLIProxyAPILogin(profile.profileId)) return;
  const account = await codexAccountFor(target);
  info(`Claude Code's ChatGPT login for ${chalk.bold(alias)} is missing; logging in again...`);
  blank();
  const identity = await loginOrThrow(profile.profileId, profile.binaryPath, "ChatGPT", {
    accountId: account.chatgpt_account_id,
    email: account.email,
  });
  await updateLocalCLIProxyAPIProfileIdentity(profileName, identity);
}

async function goKeyOrThrow(alias: string, profileId: string): Promise<string> {
  const go = await getOpenCodeProfileData(profileId);
  if (go.console) {
    throw new UserFacingError(`${alias} is an OpenCode subscription login without a static API key.`, [
      "Create a Go API key in the OpenCode console and add it as an OpenCode Go API Key alias.",
    ]);
  }
  const key = await readOpenCodeGoApiKey(profileId);
  if (!key) {
    throw new UserFacingError(`${alias} has no saved OpenCode Go key.`, [
      `Run ${chalk.cyan(`claudex-switch refresh ${alias}`)} first.`,
    ]);
  }
  return key;
}

async function createOpenCodeGoLink(
  alias: string,
  target: Extract<LinkableTarget, { provider: "opencode" }>,
  options: CLIProxyResolveOptions,
): Promise<string> {
  const key = await goKeyOrThrow(alias, target.profileId);
  const binaryPath = await requireBinary(options);
  const catalog = await fetchOpenCodeGoCatalogIds();
  const models = pickOpenCodeGoModels(catalog);
  const { profileName } = await createManagedProfile(
    binaryPath,
    {
      upstream: "opencode-go",
      models,
      upstreamKey: key,
      upstreamModels: catalog ? [...catalog].sort() : [],
    },
    null,
    (name) => setLinkedClaudeProfile(target, name),
  );
  success(`Linked ${chalk.bold(alias)} to Claude Code`);
  printMapping(models);
  return profileName;
}

// The Go alias stays the source of truth for its key. A changed key is picked
// up at the next launch; a proxy still serving sessions keeps the old one.
async function syncOpenCodeGoKey(
  goProfileId: string,
  profile: LocalCLIProxyAPIProfileData,
): Promise<void> {
  const key = await readOpenCodeGoApiKey(goProfileId);
  const current = await readManagedCLIProxyAPIUpstream(profile.profileId);
  if (!key || !current || current.upstreamKey === key) return;
  const managed = { profileId: profile.profileId, binaryPath: profile.binaryPath };
  if (await hasActiveManagedCLIProxyAPI(managed)) {
    warn("The OpenCode Go key changed; running Claude Code sessions keep the old key until they end.");
    return;
  }
  // run.ts restarts the idle daemon once runtime.yaml no longer matches.
  await updateManagedCLIProxyAPISetup(profile.profileId, { upstreamKey: key });
}

async function createAntigravityAlias(
  alias: string,
  options: CLIProxyResolveOptions,
): Promise<AliasEntry> {
  const rejection = checkAlias(await loadAliases(), alias);
  if (rejection) throw new UserFacingError(describeAliasRejection(rejection, alias));

  blank();
  warn(
    "Google has suspended Antigravity access for accounts used through third-party proxies (Feb 2026), and its terms still forbid it.",
  );
  hint("Consider logging in with a Google account you can afford to lose Antigravity access on.");
  const accepted = await (options.confirmRisk ??
    (() => confirm({ message: "Continue with Antigravity via CLIProxyAPI?", default: false })))();
  if (!accepted) throw new UserFacingError("Cancelled; nothing was created.");

  const binaryPath = await requireBinary(options);
  assertCLIProxyAPICompatibility(binaryPath, "antigravity");
  info("Opening CLIProxyAPI's own Antigravity login in your browser...");
  blank();
  const { profileName, profile, runtime } = await createManagedProfile(
    binaryPath,
    { upstream: "antigravity" },
    (profileId) => loginOrThrow(profileId, binaryPath, "Antigravity"),
    (name) => addAlias(alias, { provider: "claude", profileName: name }),
  );

  const models = await getLocalCLIProxyAPISettings(profile, runtime!);

  success(`Saved as alias ${chalk.bold(alias)}  ${chalk.dim(`Claude Code · ${upstreamLabel("antigravity")}`)}`);
  printMapping(models);
  return findAlias(await loadAliases(), alias) ?? claudeEntry(alias, profileName);
}

async function createSubscriptionAlias(alias: string, upstream: SubscriptionUpstream, options: CLIProxyResolveOptions): Promise<AliasEntry> {
  const rejection = checkAlias(await loadAliases(), alias);
  if (rejection) throw new UserFacingError(describeAliasRejection(rejection, alias));
  const binaryPath = await requireBinary(options);
  // Bare `workbuddy` names the product, not a build: an international account
  // cannot sign in on the China build's page, so ask which one.
  if (upstream === "workbuddy") {
    if (!options.chooseWorkBuddyRegion && !process.stdin.isTTY) {
      throw new UserFacingError("WorkBuddy needs an interactive terminal to choose its region.", [
        `Run it in your terminal, or name the build: ${chalk.cyan("workbuddy-ai")} (international).`,
      ]);
    }
    upstream = await (options.chooseWorkBuddyRegion ?? (() => select<SubscriptionUpstream>({
      message: "WorkBuddy region",
      choices: [
        { name: "International (workbuddy.ai)", value: "workbuddy-ai" },
        { name: "China (workbuddy.cn)", value: "workbuddy" },
      ],
    })))();
  }
  info(`First use: sign in to ${upstreamLabel(upstream)} for Claude Code.`);
  const { profileName, profile, runtime } = await createManagedProfile(
    binaryPath, { upstream },
    (profileId) => loginOrThrow(profileId, binaryPath, upstreamLabel(upstream)),
    (name) => addAlias(alias, { provider: "claude", profileName: name }),
  );
  success(`Saved as alias ${chalk.bold(alias)}  ${chalk.dim(`Claude Code · ${upstreamLabel(upstream)}`)}`);
  printMapping(await getLocalCLIProxyAPISettings(profile, runtime!));
  return findAlias(await loadAliases(), alias) ?? claudeEntry(alias, profileName);
}

function printMapping(models: CLIProxyAPIModelMap): void {
  hint(
    `opus/default → ${models.opusModel} · sonnet → ${models.sonnetModel} · haiku → ${models.haikuModel}`,
  );
}

export function upstreamLabel(upstream: CLIProxyAPIUpstream | undefined): string {
  return CLI_PROXY_API_UPSTREAMS[upstream ?? "codex"].label;
}
