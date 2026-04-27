import { spawn } from "child_process";
import {
  CODEX_DEVICE_AUTH_URL,
  cleanupOpenShimDir,
  createOpenShimDir,
  openExternalUrl,
} from "../../lib/browser";
import { blank, error } from "../../lib/ui";

export async function runCodexDeviceAuthLogin(): Promise<number | null> {
  const shimDir = createOpenShimDir();
  const env = shimDir
    ? { ...process.env, PATH: `${shimDir}:${process.env.PATH}` }
    : undefined;
  try {
    const proc = spawn("codex", ["login", "--device-auth"], {
      stdio: "inherit",
      env,
    });

    openExternalUrl(CODEX_DEVICE_AUTH_URL, true);

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
  } finally {
    cleanupOpenShimDir(shimDir);
  }
}
