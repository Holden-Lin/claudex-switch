import chalk from "chalk";
import { spawn, type ChildProcess } from "child_process";
import { findAlias, loadAliases } from "../alias/store";
import { ensureOpenCodeProfileReady } from "./use";
import { updateDefaultModel } from "./model";
import {
  CLIPROXY_CLIENT_NAMES,
  UserFacingError,
  isClaudeCodeClient,
  resolveCLIProxyClaudeEntry,
} from "./cliproxy";
import { blank, error, hint, info } from "../lib/ui";
import { readJson } from "../lib/fs";
import { join } from "path";
import {
  isModelEffort,
  providerEffortLevels,
  resolveModelShorthand,
  splitModelEffort,
} from "../lib/model-shorthand";
import {
  getProfileData,
  prepareIsolatedLocalCLIProxyAPIRun,
  prepareIsolatedOAuthRun,
  syncIsolatedOAuthSnapshot,
} from "../providers/claude/profiles";
import {
  CLAUDE_ENV_KEYS,
  CLAUDE_LOCAL_PROXY_NEUTRALIZED_ENV_KEYS,
  getClaudeEnvNeutralizer,
  normalizeCustomEnv,
  prepareApiProfileClaudeSettings,
  prepareOAuthProfileClaudeSettings,
} from "../providers/claude/settings";
import {
  acquireManagedCLIProxyAPILease,
  ensureManagedCLIProxyAPI,
  prepareLocalCLIProxyAPIClaudeSettings,
  resolveManagedLocalCLIProxyAPIDefaultModel,
  resolveManagedLocalCLIProxyAPIModel,
  stopStaleManagedCLIProxyAPI,
  type ManagedCLIProxyAPILease,
} from "../providers/cliproxyapi/managed";
import {
  readAccountAuth,
  syncActiveAuthSnapshot,
} from "../providers/codex/auth";
import {
  repairCodexStringifiedArrays,
  resolveCodexModel,
} from "../providers/codex/config";
import {
  finishCodexRunHome,
  isDefaultCodexAccount,
  prepareCodexRunHome,
} from "../providers/codex/run-home";
import { findAccountByKey, loadRegistry } from "../providers/codex/registry";
import {
  getOpenCodeProfileData,
  normalizeOpenCodeGoModel,
  openCodeRunEnvironment,
  updateOpenCodeProfileDefaultModel,
} from "../providers/opencode/profiles";
import { resolveOpenCodeGoModel } from "../providers/opencode/catalog";
import {
  prepareOpenCodeV2RunEnvironment,
  type OpenCodeCompactionGuard,
  type OpenCodeV2CredentialSync,
} from "../providers/opencode/runtime";
import { normalizeOpenCodeConsoleModel, prepareOpenCodeConsoleRun } from "../providers/opencode/console";
import {
  detectOpenCodeVersion,
  isSupportedOpenCodeVersion,
  type OpenCodeVersion,
} from "../providers/opencode/version";
import type {
  AliasEntry,
  ClaudeApiProfileConfig,
  CodexRegistryAccount,
  CustomEnv,
  ProfileData,
} from "../types";

const RUN_FLAGS = new Set(["-run", "--run"]);
const HEADER_FLAGS = new Set(["--attribution-header"]);
const MODEL_FLAGS = new Set(["-model", "--model"]);
const CLAUDE_ATTRIBUTION_HEADER_ENV = "CLAUDE_CODE_ATTRIBUTION_HEADER";
const CODEX_COMPLETION_REVIEW_DISABLED_ENV =
  "CODEX_COMPLETION_REVIEW_DISABLED";

type SpawnOptions = {
  stdio: "inherit";
  env?: NodeJS.ProcessEnv;
};

type SpawnCommand = (
  command: string,
  args: string[],
  options: SpawnOptions,
) => ChildProcess;

type RunArgumentOptions = {
  forwardedArgs: string[];
  modelOverride?: string;
  effortOverride?: string;
  headerEnabled?: boolean;
  autoreviewOverride?: boolean;
  cliproxyClient?: string;
};

export function isRunFlag(value?: string): boolean {
  return value !== undefined && RUN_FLAGS.has(value);
}

/**
 * `--cliproxy` can name an alias that does not exist yet: `agy` creates itself
 * on first use. The dispatcher must send those invocations to the run path
 * instead of rejecting them as unknown commands.
 */
export function isCliproxyRunInvocation(args: string[]): boolean {
  return args.includes("--cliproxy") && isRunFlag(args[0]);
}

function requestsRemoteOpenCodeServer(args: string[]): boolean {
  return args.some(
    (arg) => arg === "--server" || arg === "-server" || arg.startsWith("--server="),
  );
}

function requestsUnsafeOpenCodeV2Override(args: string[]): boolean {
  return args.some((arg) =>
    ["--attach", "-attach", "--config", "-config", "--model", "-model", "--standalone", "-standalone"].some(
      (flag) => arg === flag || arg.startsWith(`${flag}=`),
    ),
  );
}

function requestsUnsafeOpenCodeV2Target(args: string[]): boolean {
  const safeBooleanFlags = new Set([
    "--auto",
    "--yolo",
    "--dangerously-skip-permissions",
    "--print-logs",
  ]);
  const resumeFlags = new Set(["--continue", "-c", "--session", "-s"]);

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (resumeFlags.has(arg) || arg.startsWith("--session=") || /^-s.+/.test(arg)) {
      return true;
    }
    if (arg === "--prompt") {
      // The root command's prompt value is not a directory/session selector.
      // Let OpenCode validate a missing value itself.
      index += 1;
      continue;
    }
    if (arg.startsWith("--prompt=")) continue;
    if (safeBooleanFlags.has(arg)) continue;

    // The V2 root command's optional positional argument is a directory. Any
    // other forwarded argument is unknown to this adapter, so fail closed.
    return true;
  }
  return false;
}

type OpenCodeV2RunArgsCheck =
  | { ok: true }
  | { ok: false; message: string; hint: string };

// `opencode run` is the V2 headless one-shot. The alias owns the standalone
// server, the managed Go model, and the private session database, so resume,
// model, agent, and server flags stay refused; only output and message flags
// are forwarded.
const OPENCODE_V2_RUN_VALUE_FLAGS = new Set([
  "--format",
  "--title",
  "--file",
  "-f",
]);
const OPENCODE_V2_RUN_BOOLEAN_FLAGS = new Set([
  "--auto",
  "--print-logs",
  "--thinking",
]);
const OPENCODE_V2_RUN_RESUME_FLAGS = new Set([
  "--continue",
  "-c",
  "--session",
  "-s",
  "--fork",
]);

function isOpenCodeV2HeadlessRun(args: string[]): boolean {
  // OpenCode's root parser rejects the standalone/auto flags before a
  // subcommand, so the adapter recognizes `run` only as the first token.
  return args[0] === "run";
}

function validateOpenCodeV2RunArgs(args: string[]): OpenCodeV2RunArgsCheck {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (OPENCODE_V2_RUN_VALUE_FLAGS.has(arg)) {
      const value = args[index + 1];
      // OpenCode's parser treats a following flag-like token as a missing
      // value, so refuse it here instead of forwarding a dangling flag.
      if (value === undefined || value.startsWith("-")) {
        return {
          ok: false,
          message: `Missing value after ${arg}.`,
          hint: "Pass a value after the headless run flag, or remove the flag.",
        };
      }
      index += 1;
      continue;
    }
    if (
      arg.startsWith("--format=") ||
      arg.startsWith("--title=") ||
      arg.startsWith("--file=")
    ) {
      continue;
    }
    if (OPENCODE_V2_RUN_BOOLEAN_FLAGS.has(arg)) continue;
    if (
      OPENCODE_V2_RUN_RESUME_FLAGS.has(arg) ||
      arg.startsWith("--session=") ||
      arg.startsWith("--fork=") ||
      /^-s.+/.test(arg)
    ) {
      return {
        ok: false,
        message:
          "OpenCode V2 headless runs cannot resume or fork a session through CLI arguments.",
        hint: "Start a fresh run from the intended project directory; the alias preflight only covers the current directory.",
      };
    }
    if (arg === "-m" || /^-m.+/.test(arg)) {
      return {
        ok: false,
        message:
          "OpenCode V2 aliases control the standalone server, config, and model selection.",
        hint: "Remove -m; use -run --model opencode-go/<model> to select a Go model.",
      };
    }
    if (arg === "--agent" || arg.startsWith("--agent=")) {
      return {
        ok: false,
        message:
          "OpenCode V2 headless runs cannot switch agents through CLI arguments.",
        hint: "Set the intended agent as this project's default; the alias preflights its default agent.",
      };
    }
    if (arg.startsWith("-")) {
      return {
        ok: false,
        message: `Unsupported OpenCode V2 headless run argument: ${arg}.`,
        hint: "Supported: the message, --format, --thinking, --title, --file, and --print-logs.",
      };
    }
    // A plain token is part of the message.
  }
  return { ok: true };
}

export async function runAliasSession(
  aliasOrName: string,
  forwardedArgs: string[] = [],
  spawnCommand: SpawnCommand = spawn,
  openCodeVersionDetector: () => OpenCodeVersion | null = detectOpenCodeVersion,
  openCodeCredentialSync?: OpenCodeV2CredentialSync,
): Promise<number> {
  const runOptions = parseRunArgumentOptions(forwardedArgs);
  const entry = runOptions.cliproxyClient
    ? await resolveCLIProxyEntryOrExit(aliasOrName)
    : await resolveAliasOrExit(aliasOrName);
  const supportsAutoreview =
    entry.target.provider === "codex" || entry.target.provider === "opencode";
  if (
    runOptions.autoreviewOverride !== undefined &&
    !supportsAutoreview
  ) {
    error("--autoreview is only supported for Codex and OpenCode sessions.");
    blank();
    process.exit(1);
  }
  // The CLIs support different effort tiers, so validate once the
  // provider is known.
  if (runOptions.effortOverride) {
    const valid = providerEffortLevels(entry.target.provider);
    if (!valid.has(runOptions.effortOverride)) {
      const providerName =
        entry.target.provider === "claude"
          ? "Claude"
          : entry.target.provider === "codex"
            ? "Codex"
            : "OpenCode";
      error(
        `${providerName} doesn't support effort "${runOptions.effortOverride}".`,
      );
      if (valid.size > 0) hint(`Valid tiers: ${[...valid].join(", ")}`);
      blank();
      process.exit(1);
    }
  }
  const claudeProfileName =
    entry.target.provider === "claude" ? entry.target.profileName : null;
  const isClaude = claudeProfileName !== null;
  const openCodeProfileId =
    entry.target.provider === "opencode" ? entry.target.profileId : null;
  const isOpenCode = openCodeProfileId !== null;
  const openCodeVersion = isOpenCode ? openCodeVersionDetector() : null;
  if (isOpenCode && !openCodeVersion) {
    error("Could not detect a supported OpenCode version on PATH.");
    hint("Install OpenCode 1.x or 2.x, then retry.");
    blank();
    return 1;
  }
  if (isOpenCode && !isSupportedOpenCodeVersion(openCodeVersion)) {
    error(`OpenCode ${openCodeVersion?.raw ?? "unknown"} is not supported by this version of claudex-switch.`);
    hint("Supported OpenCode major versions are 1.x and 2.x.");
    blank();
    return 1;
  }
  const isOpenCodeV2 = isOpenCode && openCodeVersion?.major === 2;
  const openCodeV2HeadlessRun =
    isOpenCodeV2 && isOpenCodeV2HeadlessRun(runOptions.forwardedArgs);
  if (isOpenCodeV2 && requestsRemoteOpenCodeServer(runOptions.forwardedArgs)) {
    error("OpenCode V2 account aliases cannot connect to a remote server.");
    hint("Remove --server so the selected key stays with the private standalone OpenCode process.");
    blank();
    return 1;
  }
  if (isOpenCodeV2 && requestsUnsafeOpenCodeV2Override(runOptions.forwardedArgs)) {
    error("OpenCode V2 aliases control the standalone server, config, and model selection.");
    hint("Remove --attach, --config, --standalone, or --model=<value>; use -run --model opencode-go/<model> to select a Go model.");
    blank();
    return 1;
  }
  if (openCodeV2HeadlessRun) {
    const runArgsCheck = validateOpenCodeV2RunArgs(
      runOptions.forwardedArgs.slice(1),
    );
    if (!runArgsCheck.ok) {
      error(runArgsCheck.message);
      hint(runArgsCheck.hint);
      blank();
      return 1;
    }
  } else if (isOpenCodeV2 && requestsUnsafeOpenCodeV2Target(runOptions.forwardedArgs)) {
    error("OpenCode V2 aliases cannot target another directory or resume a session through CLI arguments.");
    hint("Run claudex-switch from the intended project directory and start a fresh alias session. Use /sessions only with the same managed alias; in-app project switching isn't preflighted.");
    blank();
    return 1;
  }
  let profile = claudeProfileName
    ? await getProfileData(claudeProfileName)
    : null;
  const openCodeProfile = openCodeProfileId
    ? await getOpenCodeProfileData(openCodeProfileId)
    : null;
  const inheritProxyModel =
    profile?.type === "local-cliproxyapi" &&
    !!runOptions.cliproxyClient &&
    !runOptions.modelOverride;
  let resolvedModel = runOptions.modelOverride
    ? profile?.type === "local-cliproxyapi"
      ? undefined // Resolve only after leased startup has synchronized its catalog.
      : isOpenCode
        ? openCodeProfile?.console
          ? normalizeOpenCodeConsoleModel(runOptions.modelOverride)
          : normalizeOpenCodeGoModel(runOptions.modelOverride)
        : resolveModelShorthand(entry.target.provider, runOptions.modelOverride)
    : profile?.type === "oauth" || profile?.type === "local-cliproxyapi"
      ? profile.type === "local-cliproxyapi"
        ? undefined
        : profile.defaultModel
      : openCodeProfile?.defaultModel;
  if (openCodeProfileId && openCodeProfile && !openCodeProfile.console && resolvedModel) {
    // Key-based Go aliases take the model ID verbatim; resolve display names
    // and casing against the official catalog before the upstream rejects it.
    try {
      const canonical = await resolveOpenCodeGoModel(resolvedModel);
      if (!runOptions.modelOverride && canonical !== resolvedModel) {
        await updateOpenCodeProfileDefaultModel(openCodeProfileId, canonical);
        info(`Corrected the saved default model to ${chalk.cyan(canonical)}.`);
      }
      resolvedModel = canonical;
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      blank();
      return 1;
    }
  }
  if (runOptions.modelOverride && resolvedModel && !isOpenCode) {
    await updateDefaultModel(entry, resolvedModel);
    if (claudeProfileName) {
      profile = await getProfileData(claudeProfileName);
    }
  }
  const isolatedClaudeApi = profile?.type === "api-key";
  const isolatedClaudeOAuth = isClaude && profile?.type === "oauth";
  const isolatedLocalCLIProxyAPI =
    isClaude && profile?.type === "local-cliproxyapi";

  // No run changes the global default account. Claude sessions run isolated
  // from the global account state: API-key profiles get their config via env
  // vars, OAuth profiles get a per-profile credential store. Neither touches
  // (or is touched by) the active account, so switching accounts can never
  // flip a running session. A Codex account that is already the default runs
  // on ~/.codex; any other gets a private CODEX_HOME sharing everything but
  // its login. OpenCode V1 injects the selected key per process. OpenCode V2
  // uses a private standalone server and a managed provider ID while retaining
  // an alias-private SQLite session database. V2 preflights the launch
  // directory and rejects CLI directory/session overrides; a headless
  // `run` one-shot stays in the current directory with the managed account,
  // model, and server, and in-app navigation can still select sessions created
  // in another project under this alias.
  let codexHome: string | undefined;
  let codexRunAccount: CodexRegistryAccount | undefined;
  if (entry.target.provider === "codex") {
    try {
      if (await repairCodexStringifiedArrays()) {
        info("Repaired stringified arrays in ~/.codex/config.toml");
      }
    } catch {
      // Best effort; codex will surface config errors itself.
    }
    const reg = await loadRegistry();
    const account = findAccountByKey(reg, entry.target.accountKey);
    if (!account) {
      error("Codex account not found in registry.");
      hint("The account may have been removed by codex-auth.");
      blank();
      return 1;
    }
    if (!(await isDefaultCodexAccount(reg, account))) {
      try {
        codexHome = await prepareCodexRunHome(account);
        codexRunAccount = account;
      } catch (err) {
        error(err instanceof Error ? err.message : String(err));
        hint(`Run ${chalk.cyan(`claudex-switch refresh ${aliasOrName}`)} to log in again.`);
        blank();
        return 1;
      }
      // The shared config keeps the default account's model.
      resolvedModel ??= resolveCodexModel(
        account.default_model,
        account.auth_mode === "apikey" ? account.api_provider?.model : null,
      );
    }
  } else if (isOpenCode && openCodeProfileId) {
    await ensureOpenCodeProfileReady(aliasOrName, openCodeProfileId);
  }

  let secureStorageDir: string | undefined;
  let configDir: string | undefined;
  let settingsNeutralizer: string | null = null;
  let localSettingsFile: string | undefined;
  let localLease: ManagedCLIProxyAPILease | undefined;
  if (isolatedClaudeOAuth && claudeProfileName) {
    try {
      const context = await prepareIsolatedOAuthRun(claudeProfileName);
      secureStorageDir = context.secureStorageDir;
      configDir = context.configDir;
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      hint(
        `Run ${chalk.cyan(`claudex-switch ${aliasOrName}`)} to switch globally, then log in with ${chalk.cyan("claude")}.`,
      );
      blank();
      process.exit(1);
    }
    // A profile that owns extra env needs a private 0600 file rather than the
    // inline neutralizer JSON, which `ps` exposes. Everything else keeps the
    // cheaper inline form.
    if (
      profile?.type === "oauth" &&
      Object.keys(normalizeCustomEnv(profile.env)).length > 0
    ) {
      localSettingsFile = await prepareOAuthProfileClaudeSettings(
        claudeProfileName,
        profile,
      );
    } else {
      settingsNeutralizer = await getClaudeEnvNeutralizer();
    }
  }

  if (isolatedClaudeApi && claudeProfileName && profile?.type === "api-key") {
    // settings.json env outranks the child environment, so the profile's own
    // routing has to be written into a private settings file of its own.
    localSettingsFile = await prepareApiProfileClaudeSettings(
      claudeProfileName,
      profile,
    );
  }

  if (isolatedLocalCLIProxyAPI && profile?.type === "local-cliproxyapi") {
    try {
      const context = await prepareIsolatedLocalCLIProxyAPIRun(
        claudeProfileName!,
      );
      secureStorageDir = context.secureStorageDir;
      configDir = context.configDir;
      await stopStaleManagedCLIProxyAPI({
        profileId: profile.profileId,
        binaryPath: profile.binaryPath,
      });
      // Acquire the lease before startup so a simultaneous purge/refresh
      // cannot remove the account while this launch is preparing its private
      // settings file. The lease is released when the real Claude process
      // exits (including a failed spawn below).
      localLease = await acquireManagedCLIProxyAPILease({
        profileId: profile.profileId,
        binaryPath: profile.binaryPath,
      });
      const runtime = await ensureManagedCLIProxyAPI({
        profileId: profile.profileId,
        binaryPath: profile.binaryPath,
      });
      resolvedModel = runOptions.modelOverride
        ? await resolveManagedLocalCLIProxyAPIModel(profile, runOptions.modelOverride)
        : inheritProxyModel ? undefined : await resolveManagedLocalCLIProxyAPIDefaultModel(profile);
      if (runOptions.modelOverride && resolvedModel) {
        await updateDefaultModel(entry, resolvedModel);
        profile = await getProfileData(claudeProfileName!) as typeof profile;
      }
      localSettingsFile = await prepareLocalCLIProxyAPIClaudeSettings(
        profile,
        runtime,
        {
          inheritModel: inheritProxyModel,
          // The isolated config links the shared settings, where /model saves
          // a Claude ID that Antigravity does not list.
          savedModel: (await readJson<{ model?: string }>(join(configDir!, "settings.json"), {})).model,
        },
      );
    } catch (err) {
      try {
        await localLease?.release();
      } catch {
        // A stale lease is cleaned only after its owner PID exits; retain the
        // original startup error as the useful recovery message.
      }
      error(err instanceof Error ? err.message : String(err));
      hint(`Run ${chalk.cyan(`claudex-switch doctor ${aliasOrName}`)} after fixing the local proxy.`);
      blank();
      process.exit(1);
    }
  }

  const command = isClaude ? "claude" : isOpenCode ? "opencode" : "codex";
  const defaultPermissionArgs = isClaude
    ? ["--permission-mode", "auto"]
    : isOpenCode
      ? ["--auto"]
      : ["--approve-for-me"];
  const effortArgs = runOptions.effortOverride
    ? isClaude
      ? ["--effort", runOptions.effortOverride]
      : isOpenCode
        ? []
        : ["-c", `model_reasoning_effort=${runOptions.effortOverride}`]
    : [];
  // The headless `run` subcommand must come before the V2 root's standalone
  // flag: OpenCode's root parser rejects root flags placed before a
  // subcommand. Its own validated arguments follow the managed flags.
  const openCodeV2ManagedArgs = openCodeV2HeadlessRun
    ? ["run", "--standalone"]
    : isOpenCodeV2
      ? ["--standalone"]
      : [];
  const spawnForwardedArgs = openCodeV2HeadlessRun
    ? runOptions.forwardedArgs.slice(1)
    : runOptions.forwardedArgs;
  const args = [
    ...openCodeV2ManagedArgs,
    ...(isolatedClaudeApi ? ["--bare"] : []),
    ...defaultPermissionArgs,
    ...(!isOpenCodeV2 && resolvedModel ? ["--model", resolvedModel] : []),
    ...effortArgs,
    ...(localSettingsFile ? ["--settings", localSettingsFile] : []),
    ...(settingsNeutralizer ? ["--settings", settingsNeutralizer] : []),
    ...spawnForwardedArgs,
  ];
  let baseEnv: NodeJS.ProcessEnv | undefined;
  let releaseOpenCode: (() => Promise<void>) | undefined;
  let openCodeCompactionGuard: OpenCodeCompactionGuard | undefined;
  try {
    if (openCodeProfile?.console && openCodeVersion?.major !== 2) {
      throw new Error("OpenCode subscription accounts require OpenCode 2.x.");
    }
    if (isOpenCodeV2 && openCodeProfileId && openCodeProfile?.console) {
      const prepared = await prepareOpenCodeConsoleRun(openCodeProfileId, resolvedModel);
      baseEnv = prepared.env;
      releaseOpenCode = prepared.release;
      openCodeCompactionGuard = prepared.compactionGuard;
    } else if (isOpenCodeV2 && openCodeProfileId) {
      const prepared = await prepareOpenCodeV2RunEnvironment(
        openCodeProfileId,
        resolvedModel,
        openCodeCredentialSync,
      );
      baseEnv = prepared.env;
      openCodeCompactionGuard = prepared.compactionGuard;
    } else {
      baseEnv = await getRunEnvironment(
        entry,
        profile,
        runOptions.headerEnabled,
        secureStorageDir,
        configDir,
      );
    }
    if (isOpenCode && runOptions.modelOverride && resolvedModel) {
      await updateDefaultModel(entry, resolvedModel);
    }
  } catch (err) {
    await releaseOpenCode?.();
    error(err instanceof Error ? err.message : String(err));
    blank();
    return 1;
  }
  const autoreviewEnabled = supportsAutoreview
    ? runOptions.autoreviewOverride ?? false
    : undefined;
  const env = applyAutoreview(
    codexHome ? { ...(baseEnv ?? process.env), CODEX_HOME: codexHome } : baseEnv,
    autoreviewEnabled,
  );
  if (codexHome) {
    info(`Default Codex account unchanged; this session uses ${chalk.dim(codexHome)}`);
  }
  if (openCodeCompactionGuard) {
    const { id, context, buffer, managed } = openCodeCompactionGuard;
    const triggerPercent = Math.round(((context - buffer) / context) * 100);
    info(
      managed
        ? `OpenCode auto-compaction stays on for this session (model "${id}" window ${context} < 500000 tokens; session buffer ${buffer}, fires near ${triggerPercent}%).`
        : `OpenCode auto-compaction stays on for this session (model "${id}" window ${context} < 500000 tokens; keeping your buffer ${buffer}, fires near ${triggerPercent}%).`,
    );
  }

  info(`Running ${chalk.cyan([command, ...args].join(" "))}`);
  // Codex reads the env in its Stop hook; OpenCode V2 in the cc_chats
  // completion-review plugin, which delegates to the same review script.
  if (supportsAutoreview) {
    const source =
      runOptions.autoreviewOverride === undefined
        ? "default"
        : "this session";
    info(`Autoreview: ${autoreviewEnabled ? "on" : "off"} (${source})`);
  }

  return new Promise((resolve) => {
    let settled = false;
    let removeSignalHandlers = () => {};
    const finish = async (code: number): Promise<void> => {
      if (settled) return;
      settled = true;
      removeSignalHandlers();
      try {
        await localLease?.release();
        await releaseOpenCode?.();
      } catch {
        // A failed cleanup leaves only a PID-scoped lease; manager lifecycle
        // code removes it after this launcher has exited.
      }
      resolve(code);
    };

    let proc: ChildProcess;
    try {
      proc = spawnCommand(command, args, { stdio: "inherit", env });
    } catch (err) {
      error(
        `Failed to start ${command}: ${err instanceof Error ? err.message : String(err)}`,
      );
      blank();
      void finish(1);
      return;
    }

    // Keep the launcher's leases until its client exits on timeout/terminal
    // closure. In a TTY, Ctrl-C already reaches the entire foreground group;
    // forwarding it again would turn the first Ctrl-C into a double tap.
    const signals = ["SIGINT", "SIGTERM", "SIGHUP"] as const;
    const handlers = signals.map((signal) => () => {
      if (signal === "SIGINT" && process.stdin.isTTY) return;
      try { proc.kill(signal); } catch { /* The child may already be gone. */ }
    });
    for (let i = 0; i < signals.length; i += 1) process.on(signals[i]!, handlers[i]!);
    removeSignalHandlers = () => {
      for (let i = 0; i < signals.length; i += 1) process.off(signals[i]!, handlers[i]!);
    };

    proc.on("error", (err) => {
      error(
        `Failed to start ${command}: ${err instanceof Error ? err.message : String(err)}`,
      );
      blank();
      void finish(1);
    });

    proc.on("close", (code, signal) => {
      void (async () => {
        if (isolatedClaudeOAuth && claudeProfileName) {
          // The session refreshed tokens in the per-profile store; fold them
          // back into the snapshot so global switches restore live tokens.
          try {
            await syncIsolatedOAuthSnapshot(claudeProfileName);
          } catch {
            // Best effort; the isolated store remains authoritative.
          }
        } else if (codexRunAccount) {
          try {
            await finishCodexRunHome(codexRunAccount);
          } catch {
            // Best effort; the run home keeps the refreshed login for next time.
          }
        } else if (entry.target.provider === "codex") {
          try {
            await syncActiveAuthSnapshot(await loadRegistry());
          } catch {
            // Best effort; Codex's active auth file remains authoritative.
          }
        }
        const signalExitCode = signal === "SIGINT" ? 130 : signal === "SIGTERM" ? 143 : signal === "SIGHUP" ? 129 : 1;
        await finish(code ?? signalExitCode);
      })();
    });
  });
}

async function getRunEnvironment(
  entry: AliasEntry,
  profile: ProfileData | null,
  headerEnabled?: boolean,
  secureStorageDir?: string,
  configDir?: string,
): Promise<NodeJS.ProcessEnv | undefined> {
  if (entry.target.provider === "claude") {
    if (profile?.type === "api-key") {
      return applyClaudeAttributionHeader(
        buildClaudeApiEnvironment(profile),
        headerEnabled,
      );
    }
    if (profile?.type === "local-cliproxyapi") {
      return applyClaudeAttributionHeader(
        buildClaudeLocalCLIProxyAPIEnvironment(
          secureStorageDir,
          configDir,
          profile.env,
        ),
        headerEnabled,
      );
    }
    return applyClaudeAttributionHeader(
      buildClaudeOAuthEnvironment(secureStorageDir, configDir, profile?.env),
      headerEnabled,
    );
  }

  if (entry.target.provider === "opencode") {
    return await openCodeRunEnvironment(entry.target.profileId);
  }

  const auth = await readAccountAuth(entry.target.accountKey);
  if (auth?.auth_mode !== "apikey" || !auth.OPENAI_API_KEY) {
    return undefined;
  }

  const reg = await loadRegistry();
  const account = findAccountByKey(reg, entry.target.accountKey);
  const envKey = account?.api_provider?.env_key || "OPENAI_API_KEY";

  return {
    ...process.env,
    [envKey]: auth.OPENAI_API_KEY,
  };
}

async function resolveAliasOrExit(aliasOrName: string): Promise<AliasEntry> {
  const aliasReg = await loadAliases();
  const entry = findAlias(aliasReg, aliasOrName);

  if (entry) {
    return entry;
  }

  error(`Alias "${aliasOrName}" not found.`);
  hint(`Run ${chalk.cyan("claudex-switch list")} to see your accounts`);
  blank();
  process.exit(1);
}

// `<alias> --run --cliproxy claudecode`: run Claude Code on a Codex / OpenCode
// Go / Antigravity account through a managed local CLIProxyAPI.
async function resolveCLIProxyEntryOrExit(aliasOrName: string): Promise<AliasEntry> {
  try {
    return await resolveCLIProxyClaudeEntry(aliasOrName);
  } catch (err) {
    error(err instanceof Error ? err.message : String(err));
    if (err instanceof UserFacingError) {
      for (const line of err.hints) hint(line);
    }
    blank();
    process.exit(1);
  }
}

function parseRunArgumentOptions(args: string[]): RunArgumentOptions {
  const forwardedArgs: string[] = [];
  let cliproxyClient: string | undefined;
  let modelOverride: string | undefined;
  let effortOverride: string | undefined;
  let headerEnabled: boolean | undefined;
  let autoreviewOverride: boolean | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (MODEL_FLAGS.has(arg)) {
      const nextValue = args[index + 1]?.trim();
      if (!nextValue) {
        error(`Missing model name after ${arg}.`);
        hint(
          `Example: ${chalk.cyan("claudex-switch <alias> -run --model 4.8 max")}`,
        );
        blank();
        process.exit(1);
      }

      // An effort tier may follow the model, either inside the same value
      // ("4.8 max") or as the next token (--model 4.8 max).
      const withEffort = splitModelEffort(nextValue);
      modelOverride = withEffort.model;
      effortOverride = withEffort.effort;
      index += 1;
      const follower = args[index + 1]?.trim();
      if (!effortOverride && isModelEffort(follower)) {
        effortOverride = follower.toLowerCase();
        index += 1;
      }
      continue;
    }

    if (HEADER_FLAGS.has(arg)) {
      const nextValue = args[index + 1]?.trim().toLowerCase();
      if (
        !nextValue ||
        !["true", "false", "1", "0"].includes(nextValue)
      ) {
        error("Missing header toggle after --attribution-header.");
        hint(
          `Example: ${chalk.cyan("claudex-switch <alias> -run --attribution-header false")}`,
        );
        blank();
        process.exit(1);
      }

      headerEnabled = nextValue === "true" || nextValue === "1";
      index += 1;
      continue;
    }

    if (arg === "--cliproxy") {
      const nextValue = args[index + 1]?.trim();
      if (!nextValue || !isClaudeCodeClient(nextValue)) {
        error(
          nextValue
            ? `--cliproxy currently supports: ${CLIPROXY_CLIENT_NAMES}`
            : "Missing client after --cliproxy.",
        );
        hint(`Example: ${chalk.cyan("claudex-switch cx -run --cliproxy claudecode")}`);
        blank();
        process.exit(1);
      }
      cliproxyClient = "claudecode";
      index += 1;
      continue;
    }

    if (arg === "--autoreview") {
      const nextValue = args[index + 1]?.trim().toLowerCase();
      if (nextValue !== "on" && nextValue !== "off") {
        error("Expected 'on' or 'off' after --autoreview.");
        hint(
          `Example: ${chalk.cyan("claudex-switch cx -run --autoreview off")}`,
        );
        blank();
        process.exit(1);
      }

      autoreviewOverride = nextValue === "on";
      index += 1;
      continue;
    }

    forwardedArgs.push(arg);
  }

  return {
    forwardedArgs,
    modelOverride,
    effortOverride,
    headerEnabled,
    autoreviewOverride,
    cliproxyClient,
  };
}

function applyAutoreview(
  baseEnv: NodeJS.ProcessEnv | undefined,
  override?: boolean,
): NodeJS.ProcessEnv | undefined {
  if (override === undefined) return baseEnv;

  const env = { ...(baseEnv ?? process.env) };
  if (override) {
    delete env[CODEX_COMPLETION_REVIEW_DISABLED_ENV];
  } else {
    env[CODEX_COMPLETION_REVIEW_DISABLED_ENV] = "1";
  }
  return env;
}

function buildClaudeOAuthEnvironment(
  secureStorageDir?: string,
  configDir?: string,
  extraEnv?: CustomEnv,
): NodeJS.ProcessEnv | undefined {
  if (
    !secureStorageDir &&
    !configDir &&
    !CLAUDE_ENV_KEYS.some((key) => process.env[key]) &&
    Object.keys(normalizeCustomEnv(extraEnv)).length === 0
  ) {
    return undefined;
  }

  const env = { ...process.env };
  for (const key of CLAUDE_ENV_KEYS) {
    delete env[key];
  }
  applyCustomEnv(env, extraEnv);
  if (secureStorageDir) {
    env.CLAUDE_SECURESTORAGE_CONFIG_DIR = secureStorageDir;
  }
  if (configDir) {
    env.CLAUDE_CONFIG_DIR = configDir;
  }
  return env;
}

function buildClaudeApiEnvironment(
  config: ClaudeApiProfileConfig,
): NodeJS.ProcessEnv {
  const env = { ...process.env };

  // Do not inherit the local profile's Fable/subagent routing from a shell.
  // API profiles then selectively restore only fields they explicitly own.
  for (const key of CLAUDE_ENV_KEYS) {
    delete env[key];
  }

  setOptionalEnv(env, "ANTHROPIC_API_KEY", config.apiKey);
  setOptionalEnv(env, "ANTHROPIC_BASE_URL", config.baseUrl);
  setOptionalEnv(env, "ANTHROPIC_AUTH_TOKEN", config.authToken);
  setOptionalEnv(env, "ANTHROPIC_MODEL", config.model);
  setOptionalEnv(
    env,
    "ANTHROPIC_DEFAULT_FABLE_MODEL",
    config.defaultFableModel,
  );
  setOptionalEnv(
    env,
    "ANTHROPIC_DEFAULT_SONNET_MODEL",
    config.defaultSonnetModel,
  );
  setOptionalEnv(
    env,
    "ANTHROPIC_DEFAULT_OPUS_MODEL",
    config.defaultOpusModel,
  );
  setOptionalEnv(
    env,
    "ANTHROPIC_DEFAULT_HAIKU_MODEL",
    config.defaultHaikuModel,
  );
  setOptionalEnv(env, "CLAUDE_CODE_SUBAGENT_MODEL", config.subagentModel);
  applyCustomEnv(env, config.env);

  return env;
}

function buildClaudeLocalCLIProxyAPIEnvironment(
  secureStorageDir?: string,
  configDir?: string,
  extraEnv?: CustomEnv,
): NodeJS.ProcessEnv {
  const env = { ...process.env };
  // The generated 0600 `--settings` file is authoritative for all managed
  // Claude routing values. Clearing shell inheritance here prevents a prior
  // account's force/subagent settings from leaking into this run, without
  // disabling normal Claude configuration, skills, MCP, hooks, or CLAUDE.md.
  for (const key of CLAUDE_ENV_KEYS) {
    delete env[key];
  }
  for (const key of CLAUDE_LOCAL_PROXY_NEUTRALIZED_ENV_KEYS) {
    delete env[key];
  }
  applyCustomEnv(env, extraEnv);
  if (secureStorageDir) {
    env.CLAUDE_SECURESTORAGE_CONFIG_DIR = secureStorageDir;
  }
  if (configDir) {
    env.CLAUDE_CONFIG_DIR = configDir;
  }
  return env;
}

function applyCustomEnv(
  env: NodeJS.ProcessEnv,
  extraEnv: CustomEnv | undefined,
): void {
  for (const [key, value] of Object.entries(normalizeCustomEnv(extraEnv))) {
    env[key] = value;
  }
}

function applyClaudeAttributionHeader(
  baseEnv: NodeJS.ProcessEnv | undefined,
  headerEnabled: boolean | undefined,
): NodeJS.ProcessEnv | undefined {
  if (headerEnabled === undefined) {
    return baseEnv;
  }

  const env = baseEnv ? { ...baseEnv } : { ...process.env };

  if (headerEnabled) {
    delete env[CLAUDE_ATTRIBUTION_HEADER_ENV];
    return env;
  }

  env[CLAUDE_ATTRIBUTION_HEADER_ENV] = "0";
  return env;
}

function setOptionalEnv(
  env: NodeJS.ProcessEnv,
  key: string,
  value: string | undefined,
): void {
  if (value) {
    env[key] = value;
    return;
  }

  delete env[key];
}
