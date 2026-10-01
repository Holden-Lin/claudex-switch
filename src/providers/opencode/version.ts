import { spawnSync } from "child_process";

export interface OpenCodeVersion {
  major: number;
  minor: number;
  patch: number;
  raw: string;
}

export function parseOpenCodeVersion(output: string): OpenCodeVersion | null {
  // Both current families print forms like `1.18.30` or `opencode v2.0.6`.
  // Require a complete semver triplet so unrelated startup text cannot be
  // mistaken for a runtime version.
  const match = output.match(/(?:^|\s)v?(\d+)\.(\d+)\.(\d+)(?:[-+][\w.-]+)?(?=\s|$)/i);
  if (!match) return null;

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    raw: match[0].trim(),
  };
}

export function isSupportedOpenCodeVersion(
  version: OpenCodeVersion | null,
): boolean {
  return version !== null && (version.major === 1 || version.major === 2);
}

export function detectOpenCodeVersion(): OpenCodeVersion | null {
  try {
    const result = spawnSync("opencode", ["--version"], {
      encoding: "utf-8",
      windowsHide: true,
      timeout: 5_000,
      killSignal: "SIGTERM",
    });
    if (result.status !== 0 || result.error) return null;
    return parseOpenCodeVersion(`${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  } catch {
    return null;
  }
}
