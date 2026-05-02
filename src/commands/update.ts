import chalk from "chalk";
import {
  checkForLatestUpdate,
  installLatestUpdate,
} from "../lib/update";
import { blank, error, hint, info, success } from "../lib/ui";

export async function update(): Promise<void> {
  blank();

  const result = await checkForLatestUpdate({}, {
    respectDisableEnv: false,
  });

  switch (result.status) {
    case "available": {
      info(
        `Updating claudex-switch from v${result.currentVersion} to v${result.latestVersion}`,
      );
      hint("Running self-update...");

      const installed = installLatestUpdate(result);
      if (!installed.ok) {
        blank();
        error("Update failed.");
        hint(
          `If this install is managed externally, reinstall it manually or retry ${chalk.cyan("claudex-switch update")}.`,
        );
        blank();
        process.exit(1);
      }

      success(`Updated to v${result.latestVersion}`);
      blank();
      return;
    }

    case "up-to-date":
      info(`claudex-switch is already up to date (v${result.currentVersion})`);
      blank();
      return;

    case "unsupported":
      if (result.unsupportedInstallMethod === "npm") {
        error("This claudex-switch command is installed through npm/nvm, which is not supported.");
        hint(
          `Reinstall with the installer script or ${chalk.cyan("bun install -g git+https://github.com/Holden-Lin/claudex-switch.git")}.`,
        );
      } else {
        error("Could not determine how this claudex-switch install was installed.");
        hint("Automatic update currently supports Bun and Homebrew installs.");
      }
      blank();
      process.exit(1);

    case "unavailable":
      error("Could not determine the latest release version.");
      hint("Check your network connection and GitHub Release availability.");
      blank();
      process.exit(1);

    case "disabled":
      info(`claudex-switch is already up to date (v${result.currentVersion})`);
      blank();
      return;
  }
}
