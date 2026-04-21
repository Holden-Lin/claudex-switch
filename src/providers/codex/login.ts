import { spawn } from "child_process";
import chalk from "chalk";
import { CODEX_DEVICE_AUTH_URL, openExternalUrl } from "../../lib/browser";
import { blank, error, hint } from "../../lib/ui";

export async function runCodexDeviceAuthLogin(): Promise<number | null> {
  try {
    const proc = spawn("codex", ["login", "--device-auth"], {
      stdio: "inherit",
    });

    if (!openExternalUrl(CODEX_DEVICE_AUTH_URL, true)) {
      hint(`Open ${chalk.cyan(CODEX_DEVICE_AUTH_URL)} in your browser.`);
    }

    return await new Promise<number | null>((resolve, reject) => {
      proc.on("close", resolve);
      proc.on("error", reject);
    });
  } catch (err) {
    error(
      `Failed to start codex: ${err instanceof Error ? err.message : String(err)}`,
    );
    blank();
    process.exit(1);
  }
}
