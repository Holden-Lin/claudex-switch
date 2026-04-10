import { platform } from "os";
import { join } from "path";
import { tmpdir } from "os";
import { writeFileSync, unlinkSync } from "fs";

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
