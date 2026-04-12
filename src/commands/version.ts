import chalk from "chalk";
import { getVersionCheck } from "../lib/update";

type VersionCommandOptions = {
  fetchLatestVersion?: () => Promise<string | null>;
  writeLine?: (line?: string) => void;
};

export async function version(
  options: VersionCommandOptions = {},
): Promise<void> {
  const writeLine = options.writeLine ?? console.log;
  const result = await getVersionCheck(options.fetchLatestVersion);

  writeLine();
  writeLine(`  claudex-switch v${result.currentVersion}`);

  if (!result.latestVersion) {
    writeLine(chalk.dim("  Latest release: unavailable"));
    writeLine(
      chalk.dim("  Status: unable to determine whether this is the latest version"),
    );
    writeLine();
    return;
  }

  writeLine(`  Latest release: v${result.latestVersion}`);

  switch (result.status) {
    case "latest":
      writeLine(chalk.green("  Status: up to date"));
      break;

    case "outdated":
      writeLine(chalk.yellow("  Status: update available"));
      writeLine(chalk.dim("  Run any claudex-switch command to auto-update"));
      break;

    case "ahead":
      writeLine(chalk.cyan("  Status: ahead of the latest GitHub release"));
      break;

    case "unknown":
      writeLine(
        chalk.dim("  Status: unable to determine whether this is the latest version"),
      );
      break;
  }

  writeLine();
}
