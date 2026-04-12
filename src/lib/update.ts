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

type InstallMethod = "brew" | "bun";

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

type AutoUpdateOptions = {
  argv?: string[];
  env?: NodeJS.ProcessEnv;
  execPath?: string;
  fetchLatestVersion?: () => Promise<string | null>;
  runCommand?: RunCommand;
};

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

  if (
    brewPrefix &&
    cliPath &&
    cliPath.startsWith(brewPrefix)
  ) {
    return "brew";
  }

  const bunCheck = runCommand("bun", ["--version"], {
    stdio: ["ignore", "ignore", "ignore"],
  });
  if (bunCheck.status === 0 && !bunCheck.error) {
    return "bun";
  }

  return null;
}

export async function runAutoUpdateIfNeeded(
  options: AutoUpdateOptions = {},
): Promise<AutoUpdateResult> {
  const argv = options.argv ?? process.argv;
  const env = options.env ?? process.env;
  const execPath = options.execPath ?? process.execPath;
  const fetchLatestVersion =
    options.fetchLatestVersion ?? fetchLatestReleaseVersion;
  const runCommand = options.runCommand ?? spawnSync;

  if (
    env[SKIP_AUTO_UPDATE_ENV] === "1" ||
    env[DISABLE_AUTO_UPDATE_ENV] === "1"
  ) {
    return { action: "continue" };
  }

  const latestVersion = await fetchLatestVersion();
  if (!latestVersion || compareVersions(latestVersion, CURRENT_VERSION) <= 0) {
    return { action: "continue" };
  }

  const installMethod = detectInstallMethod(argv, execPath, runCommand);
  if (!installMethod) {
    return { action: "continue" };
  }

  info(
    `Updating claudex-switch from v${CURRENT_VERSION} to v${latestVersion}`,
  );
  hint("Running self-update before continuing...");

  const updateEnv = {
    ...env,
    [SKIP_AUTO_UPDATE_ENV]: "1",
  };
  const updated =
    installMethod === "brew"
      ? updateWithHomebrew(runCommand, updateEnv)
      : updateWithBun(latestVersion, runCommand, updateEnv);

  if (!updated) {
    hint("Auto-update failed; continuing with current version.");
    return { action: "continue" };
  }

  const restart = runCommand(argv[0] ?? execPath, argv.slice(1), {
    env: updateEnv,
    stdio: "inherit",
  });

  return { action: "restart", exitCode: restart.status ?? 1 };
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
