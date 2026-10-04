import { mkdir, rm } from "fs/promises";
import { dirname, join } from "path";
import { tmpdir } from "os";
import { Database } from "bun:sqlite";
import { OPENCODE_GLOBAL_DATA_DIR } from "../src/lib/paths";

export const TEST_HOME = process.env.CLAUDEX_TEST_HOME ?? "";

export interface NativeOpenCodeCredentialRow {
  id: string;
  label: string;
  key: string;
  active: number;
  integration?: string;
}

/**
 * Build the OpenCode V2 SQLite credential store the real OpenCode writes, so
 * `add`/`refresh` import tests exercise the same reader.
 */
export async function createNativeOpenCodeCredentialDatabase(
  rows: NativeOpenCodeCredentialRow[],
): Promise<void> {
  const file = join(OPENCODE_GLOBAL_DATA_DIR, "opencode.db");
  await mkdir(dirname(file), { recursive: true });
  const db = new Database(file);
  try {
    db.exec(
      "CREATE TABLE credential (id text PRIMARY KEY, integration_id text, label text NOT NULL, value text NOT NULL, connector_id text, method_id text, active integer, time_created integer NOT NULL, time_updated integer NOT NULL)",
    );
    const insert = db.prepare(
      "INSERT INTO credential (id, integration_id, label, value, connector_id, method_id, active, time_created, time_updated) VALUES (?, ?, ?, ?, NULL, NULL, ?, 0, 0)",
    );
    for (const row of rows) {
      insert.run(
        row.id,
        row.integration ?? "opencode-go",
        row.label,
        JSON.stringify({ type: "key", key: row.key }),
        row.active,
      );
    }
  } finally {
    db.close();
  }
}

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
