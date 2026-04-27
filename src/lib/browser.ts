import { spawnSync } from "child_process";
import { platform } from "os";
import { join } from "path";
import { tmpdir } from "os";
import { mkdirSync, writeFileSync, unlinkSync, rmdirSync } from "fs";

export const CODEX_DEVICE_AUTH_URL = "https://auth.openai.com/codex/device";

const MACOS_SCRIPT = `#!/bin/bash
URL="$1"
if [ -d "/Applications/Google Chrome.app" ]; then
  open -na "Google Chrome" --args --incognito "$URL"
elif [ -d "/Applications/Firefox.app" ]; then
  open -na "Firefox" --args --private-window "$URL"
elif [ -d "/Applications/Microsoft Edge.app" ]; then
  open -na "Microsoft Edge" --args --inprivate "$URL"
else
  open "$URL"
fi
`;

const MACOS_OPEN_SHIM = `#!/bin/bash
# Intercept \`open\` calls: auth URLs go to incognito, everything else to real open.
AUTH_URL=""
PASSTHROUGH_ARGS=()
for arg in "$@"; do
  case "$arg" in
    https://auth.openai.com/*|https://auth0.openai.com/*)
      AUTH_URL="$arg" ;;
    *)
      PASSTHROUGH_ARGS+=("$arg") ;;
  esac
done
if [ -n "$AUTH_URL" ]; then
  if [ -d "/Applications/Google Chrome.app" ]; then
    /usr/bin/open -na "Google Chrome" --args --incognito "$AUTH_URL"
  elif [ -d "/Applications/Firefox.app" ]; then
    /usr/bin/open -na "Firefox" --args --private-window "$AUTH_URL"
  elif [ -d "/Applications/Microsoft Edge.app" ]; then
    /usr/bin/open -na "Microsoft Edge" --args --inprivate "$AUTH_URL"
  else
    /usr/bin/open "$AUTH_URL"
  fi
else
  /usr/bin/open "\${PASSTHROUGH_ARGS[@]}"
fi
`;

/**
 * Create a temporary script that opens URLs in a private/incognito window.
 * Returns the script path (set it as the BROWSER env var), or null on
 * unsupported platforms.
 */
export function createPrivateBrowserScript(): string | null {
  if (platform() !== "darwin") return null;

  const path = join(tmpdir(), `claudex-private-browser-${process.pid}.sh`);
  writeFileSync(path, MACOS_SCRIPT, { mode: 0o755 });
  return path;
}

export function cleanupBrowserScript(path: string | null): void {
  if (!path) return;
  try {
    unlinkSync(path);
  } catch {}
}

/**
 * Create a temp directory with an `open` shim that redirects auth URLs
 * to an incognito window. Returns the directory path to prepend to PATH,
 * or null on unsupported platforms.
 */
export function createOpenShimDir(): string | null {
  if (platform() !== "darwin") return null;

  const dir = join(tmpdir(), `claudex-open-shim-${process.pid}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "open"), MACOS_OPEN_SHIM, { mode: 0o755 });
  return dir;
}

export function cleanupOpenShimDir(dir: string | null): void {
  if (!dir) return;
  try {
    unlinkSync(join(dir, "open"));
    rmdirSync(dir);
  } catch {}
}

function getBrowserOpenCommand(
  url: string,
): { command: string; args: string[] } | null {
  switch (platform()) {
    case "darwin":
      return { command: "open", args: [url] };
    case "linux":
      return { command: "xdg-open", args: [url] };
    case "win32":
      return { command: "cmd", args: ["/c", "start", "", url] };
    default:
      return null;
  }
}

export function openExternalUrl(
  url: string,
  privateWindow = false,
): boolean {
  const browserScript = privateWindow ? createPrivateBrowserScript() : null;
  const openCommand = browserScript
    ? { command: browserScript, args: [url] }
    : getBrowserOpenCommand(url);

  if (!openCommand) return false;

  try {
    const result = spawnSync(openCommand.command, openCommand.args, {
      stdio: "ignore",
    });
    return result.status === 0 && !result.error;
  } catch {
    return false;
  } finally {
    cleanupBrowserScript(browserScript);
  }
}
