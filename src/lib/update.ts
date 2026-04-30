import { realpathSync } from "fs";
import { spawnSync, type SpawnSyncOptions } from "child_process";
import packageJson from "../../package.json";
import { hint, info } from "./ui";

const REPO = "Holden-Lin/claudex-switch";
const LATEST_RELEASE_URL = `https://github.com/${REPO}/releases/latest`;
const BUN_INSTALL_SPEC = `git+https://github.com/${REPO}.git`;
const HOMEBREW_FORMULA_URL = `https://raw.githubusercontent.com/${REPO}/main/Formula/claudex-switch.rb`;
const SKIP_AUTO_UPDATE_ENV = "CLAUDEX_SKIP_AUTO_UPDATE";
const DISABLE_AUTO_UPDATE_ENV = "CLAUDEX_DISABLE_AUTO_UPDATE";

export const CURRENT_VERSION = normalizeVersion(packageJson.version);

export type InstallMethod = "brew" | "bun";

type CommandResult = {
  error?: Error;
  status: number | null;
  stdout?: string | Buffer;
};

type RunCommand = (
  command: string,
  args: string[],
  options?: SpawnSyncOptions,
) => CommandResult;

type UpdateOptions = {
  argv?: string[];
  env?: NodeJS.ProcessEnv;
  execPath?: string;
  fetchLatestVersion?: () => Promise<string | null>;
  runCommand?: RunCommand;
};

export type AvailableUpdate = {
  status: "available";
  currentVersion: string;
  latestVersion: string;
  installMethod: InstallMethod;
  argv: string[];
  env: NodeJS.ProcessEnv;
  execPath: string;
  runCommand: RunCommand;
};

export type UpdateCheckResult =
  | {
      status: "disabled" | "unavailable";
      currentVersion: string;
    }
  | {
      status: "up-to-date" | "unsupported";
      currentVersion: string;
      latestVersion: string;
    }
  | AvailableUpdate;

export type AutoUpdateResult =
  | { action: "continue" }
  | { action: "restart"; exitCode: number };

export type VersionCheckStatus =
  | "latest"
  | "outdated"
  | "ahead"
  | "unknown";

export type VersionCheckResult = {
  currentVersion: string;
  latestVersion: string | null;
  status: VersionCheckStatus;
};

export function normalizeVersion(version: string): string {
  return version.replace(/^v/, "");
}

export function compareVersions(a: string, b: string): number {
  const aParts = normalizeVersion(a).split(/[.-]/);
  const bParts = normalizeVersion(b).split(/[.-]/);
  const length = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < length; i += 1) {
    const aValue = Number.parseInt(aParts[i] ?? "0", 10);
    const bValue = Number.parseInt(bParts[i] ?? "0", 10);

    if (aValue > bValue) return 1;
    if (aValue < bValue) return -1;
  }

  return 0;
}

export function extractVersionFromReleaseUrl(url: string): string | null {
  const match = url.match(/\/tag\/(v?[^/?#]+)$/);
  return match ? normalizeVersion(match[1]) : null;
}

export async function fetchLatestReleaseVersion(
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  try {
    const response = await fetchImpl(LATEST_RELEASE_URL, {
      headers: { "user-agent": "claudex-switch" },
      redirect: "follow",
      signal: AbortSignal.timeout(2500),
    });

    if (!response.ok) {
      return null;
    }

    return extractVersionFromReleaseUrl(response.url);
  } catch {
    return null;
  }
}

export async function getVersionCheck(
  fetchLatestVersion: () => Promise<string | null> = fetchLatestReleaseVersion,
): Promise<VersionCheckResult> {
  const latestVersion = await fetchLatestVersion();

  if (!latestVersion) {
    return {
      currentVersion: CURRENT_VERSION,
      latestVersion: null,
      status: "unknown",
    };
  }

  const comparison = compareVersions(CURRENT_VERSION, latestVersion);

  return {
    currentVersion: CURRENT_VERSION,
    latestVersion,
    status:
      comparison < 0
        ? "outdated"
        : comparison > 0
          ? "ahead"
          : "latest",
  };
}

export function detectInstallMethod(
  argv: string[] = process.argv,
  execPath: string = process.execPath,
  runCommand: RunCommand = spawnSync,
): InstallMethod | null {
  const brewPrefix = readCommandStdout(
    runCommand("brew", ["--prefix"], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }),
  );
  const cliPath = resolveCliPath(argv, execPath);
  const realCliPath = resolveRealPath(cliPath);

  if (
    brewPrefix &&
    (
      pathStartsWith(cliPath, brewPrefix) ||
      pathStartsWith(realCliPath, brewPrefix)
    )
  ) {
    return "brew";
  }

  const bunCheck = runCommand("bun", ["--version"], {
    stdio: ["ignore", "ignore", "ignore"],
  });
  if (bunCheck.status === 0 && !bunCheck.error) {
    const bunGlobalBin = readCommandStdout(
      runCommand("bun", ["pm", "bin", "-g"], {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      }),
    );
    if (
      bunGlobalBin &&
      (
        pathStartsWith(cliPath, bunGlobalBin) ||
        pathStartsWith(realCliPath, bunGlobalBin)
      )
    ) {
      return "bun";
    }
  }

  return null;
}

function pathStartsWith(path: string | null, prefix: string): boolean {
  if (!path) return false;
  return path === prefix || path.startsWith(`${prefix.replace(/\/$/, "")}/`);
}

function resolveRealPath(path: string | null): string | null {
  if (!path) return null;
  try {
    return realpathSync(path);
  } catch {
    return path;
  }
}

export async function checkForLatestUpdate(
  options: UpdateOptions = {},
  settings: { respectDisableEnv?: boolean } = {},
): Promise<UpdateCheckResult> {
  const argv = options.argv ?? process.argv;
  const env = options.env ?? process.env;
  const execPath = options.execPath ?? process.execPath;
  const fetchLatestVersion =
    options.fetchLatestVersion ?? fetchLatestReleaseVersion;
  const runCommand = options.runCommand ?? spawnSync;
  const respectDisableEnv = settings.respectDisableEnv ?? true;

  if (
    respectDisableEnv &&
    (
      env[SKIP_AUTO_UPDATE_ENV] === "1" ||
      env[DISABLE_AUTO_UPDATE_ENV] === "1"
    )
  ) {
    return {
      status: "disabled",
      currentVersion: CURRENT_VERSION,
    };
  }

  const latestVersion = await fetchLatestVersion();
  if (!latestVersion) {
    return {
      status: "unavailable",
      currentVersion: CURRENT_VERSION,
    };
  }

  if (compareVersions(latestVersion, CURRENT_VERSION) <= 0) {
    return {
      status: "up-to-date",
      currentVersion: CURRENT_VERSION,
      latestVersion,
    };
  }

  const installMethod = detectInstallMethod(argv, execPath, runCommand);
  if (!installMethod) {
    return {
      status: "unsupported",
      currentVersion: CURRENT_VERSION,
      latestVersion,
    };
  }

  return {
    status: "available",
    currentVersion: CURRENT_VERSION,
    latestVersion,
    installMethod,
    argv,
    env,
    execPath,
    runCommand,
  };
}

export function installLatestUpdate(
  update: AvailableUpdate,
): { ok: boolean; env: NodeJS.ProcessEnv } {
  const updateEnv = createUpdateEnv(update.env);
  const ok =
    update.installMethod === "brew"
      ? updateWithHomebrew(update.runCommand, updateEnv)
      : updateWithBun(update.latestVersion, update.runCommand, updateEnv);

  return { ok, env: updateEnv };
}

export async function runAutoUpdateIfNeeded(
  options: UpdateOptions = {},
): Promise<AutoUpdateResult> {
  const update = await checkForLatestUpdate(options);

  if (update.status !== "available") {
    return { action: "continue" };
  }

  info(
    `Updating claudex-switch from v${update.currentVersion} to v${update.latestVersion}`,
  );
  hint("Running self-update before continuing...");

  const installed = installLatestUpdate(update);
  if (!installed.ok) {
    hint("Auto-update failed; continuing with current version.");
    return { action: "continue" };
  }

  const restart = update.runCommand(update.argv[0] ?? update.execPath, update.argv.slice(1), {
    env: installed.env,
    stdio: "inherit",
  });

  return { action: "restart", exitCode: restart.status ?? 1 };
}

function createUpdateEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  return {
    ...env,
    [SKIP_AUTO_UPDATE_ENV]: "1",
  };
}

function updateWithHomebrew(
  runCommand: RunCommand,
  env: NodeJS.ProcessEnv,
): boolean {
  const result = runCommand(
    "brew",
    ["install", "--formula", HOMEBREW_FORMULA_URL],
    {
      env,
      stdio: "inherit",
    },
  );

  return result.status === 0 && !result.error;
}

function updateWithBun(
  version: string,
  runCommand: RunCommand,
  env: NodeJS.ProcessEnv,
): boolean {
  const installArgs = [
    "install",
    "-g",
    `${BUN_INSTALL_SPEC}#v${normalizeVersion(version)}`,
  ];
  const directInstall = runCommand("bun", installArgs, {
    env,
    stdio: "inherit",
  });

  if (directInstall.status === 0 && !directInstall.error) {
    return true;
  }

  const remove = runCommand("bun", ["remove", "-g", "claudex-switch"], {
    env,
    stdio: "inherit",
  });
  if (remove.status !== 0 || remove.error) {
    return false;
  }

  const reinstall = runCommand("bun", installArgs, {
    env,
    stdio: "inherit",
  });
  return reinstall.status === 0 && !reinstall.error;
}

function readCommandStdout(result: CommandResult): string {
  return typeof result.stdout === "string" ? result.stdout.trim() : "";
}

function resolveCliPath(argv: string[], execPath: string): string | null {
  const scriptPath = argv[1];

  if (scriptPath && /[\\/]/.test(scriptPath)) {
    return scriptPath;
  }

  return argv[0] || execPath || null;
}
