import { mkdir, rm } from "fs/promises";
import { tmpdir } from "os";

export const TEST_HOME = process.env.CLAUDEX_TEST_HOME ?? "";

// Fail-fast guard for any test that deletes/overwrites a real config path.
// If tests/preload.ts did not run (e.g. someone bypassed bunfig), CLAUDEX_TEST_HOME
// is unset and paths resolve to the real ~/.codex or ~/.claude — refuse to touch
// those instead of nuking the developer's actual config.
export function assertIsolatedHome(targetPath: string): void {
  if (!TEST_HOME) {
    throw new Error(
      "Test HOME is not isolated (CLAUDEX_TEST_HOME unset). " +
        "tests/preload.ts must run first — it is configured in bunfig.toml.",
    );
  }
  if (!targetPath.startsWith(tmpdir())) {
    throw new Error(
      `Refusing to modify ${targetPath}: it is outside the temp test HOME.`,
    );
  }
}

export async function resetTestHome(): Promise<void> {
  if (!TEST_HOME) {
    throw new Error("CLAUDEX_TEST_HOME is not set");
  }

  await rm(TEST_HOME, { recursive: true, force: true });
  await mkdir(TEST_HOME, { recursive: true });
}

export function fileMode(mode: number): number {
  return mode & 0o777;
}

export function makeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "none", typ: "JWT" }),
  ).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.`;
}
