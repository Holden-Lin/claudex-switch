import { spawnSync } from "child_process";
import type { CLIProxyAPIUpstream } from "./upstreams";

// 7.3.19 fixes Claude tool-result adjacency after system/developer reminders
// and across parallel results. 7.3.20 is the validated 7.x build.
export const CLI_PROXY_API_ANTIGRAVITY_MIN_VERSION = "7.3.19";
export const CLI_PROXY_API_RECOMMENDED_VERSION = "7.3.20";

export function parseCLIProxyAPIVersion(output: string): string | null {
  return output.match(/CLIProxyAPI\s+Version[:\s]+v?(\d+\.\d+\.\d+(?:-[\w.-]+)?)/i)?.[1] ?? null;
}

export function readCLIProxyAPIVersion(binaryPath: string): string | null {
  try {
    const result = spawnSync(binaryPath, ["--help"], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 5_000,
    });
    if (result.error || result.status !== 0) return null;
    return parseCLIProxyAPIVersion(`${result.stdout}\n${result.stderr}`);
  } catch {
    return null;
  }
}

export function supportsAntigravityToolHistory(version: string | null): boolean {
  if (!version || !/^\d+\.\d+\.\d+$/.test(version)) return false;
  const actual = version.split(".").map(Number);
  const required = CLI_PROXY_API_ANTIGRAVITY_MIN_VERSION.split(".").map(Number);
  for (let i = 0; i < required.length; i += 1) {
    if (actual[i]! > required[i]!) return true;
    if (actual[i]! < required[i]!) return false;
  }
  return true;
}

export function assertCLIProxyAPICompatibility(
  binaryPath: string,
  upstream: CLIProxyAPIUpstream | undefined,
): void {
  if (upstream !== "antigravity") return;
  const version = readCLIProxyAPIVersion(binaryPath);
  if (!supportsAntigravityToolHistory(version)) {
    throw new Error(
      `CLIProxyAPI ${version ?? "(unknown version)"} lacks the verified Antigravity tool-history fixes. ` +
      `Use v${CLI_PROXY_API_ANTIGRAVITY_MIN_VERSION} or newer (validated: v${CLI_PROXY_API_RECOMMENDED_VERSION}). ` +
      "Install a compatible binary; for an existing account, end its sessions, then run `claudex-switch doctor <alias> --binary /path/to/cli-proxy-api`. " +
      "A reachable proxy or text-only response does not verify tool compatibility.",
    );
  }
}
