import { execFile } from "child_process";
import { promisify } from "util";
import { join } from "path";
import { OPENCODE_GLOBAL_DATA_DIR } from "../../lib/paths";
import { fileExists } from "../../lib/fs";

// OpenCode V2 stores provider credentials in its own SQLite database instead of
// V1's auth.json. claudex-switch never exports those credentials on its own;
// `add`/`refresh` only read this database after the user explicitly chooses to
// import a local credential, so a new user who already logged into OpenCode can
// create a working alias without hunting for the raw API key first.

const execFileAsync = promisify(execFile);

export type NativeCredentialReadResult =
  | { status: "ok"; credentials: NativeOpenCodeGoCredential[] }
  | { status: "unavailable" };

export interface NativeOpenCodeGoCredential {
  id: string;
  label: string;
  key: string;
  active: boolean;
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Native OpenCode database path, honoring OpenCode's own OPENCODE_DB override. */
export function nativeOpenCodeDatabaseFile(): string {
  const override = process.env.OPENCODE_DB?.trim();
  if (override) return override;
  return join(OPENCODE_GLOBAL_DATA_DIR, "opencode.db");
}

export async function queryRows(
  dbPath: string,
  sql: string,
): Promise<JsonRecord[] | null> {
  try {
    const mod = await import(["bun", "sqlite"].join(":"));
    const db = new mod.Database(dbPath, { readonly: true });
    try {
      return db.prepare(sql).all() as JsonRecord[];
    } finally {
      db.close();
    }
  } catch {
    // Not running under bun, or the read-only open failed.
  }

  try {
    const { stdout } = await execFileAsync("sqlite3", [
      "-readonly",
      "-json",
      dbPath,
      sql,
    ]);
    const parsed: unknown = JSON.parse(stdout.trim() || "[]");
    return Array.isArray(parsed) ? (parsed as JsonRecord[]) : null;
  } catch {
    // sqlite3 is not installed, or the read-only query failed.
  }

  if (!process.versions.bun) {
    try {
      // Keep Node's experimental SQLite import outside the interactive CLI.
      // Only this SQLite-only reader suppresses its experimental warning;
      // other warnings in the CLI remain visible. argv carries paths/SQL,
      // never credential values, and credentials are returned over stdout.
      const { stdout } = await execFileAsync(process.execPath, [
        "--disable-warning=ExperimentalWarning", "--input-type=module", "-e",
        `import { DatabaseSync } from "node:sqlite";
const db = new DatabaseSync(process.argv[1], { readOnly: true });
try { process.stdout.write(JSON.stringify(db.prepare(process.argv[2]).all())); }
finally { db.close(); }`,
        dbPath, sql,
      ]);
      const parsed: unknown = JSON.parse(stdout.trim() || "[]");
      return Array.isArray(parsed) ? parsed as JsonRecord[] : null;
    } catch {
      // Node < 22.5 or the read-only open failed.
    }
  }
  return null;
}

export interface OpenCodeConsoleCredential {
  id: string;
  label: string;
  active: boolean;
  value: {
    type: "oauth";
    methodID: string;
    access: string;
    refresh: string;
    expires: number;
    metadata: { server: string; accountID: string; email: string; orgID: string; orgName?: string };
  };
}

/** Read only Console OAuth records; never fall back to another provider/key. */
export async function readOpenCodeConsoleCredentials(dbPath: string): Promise<OpenCodeConsoleCredential[]> {
  if (!(await fileExists(dbPath))) return [];
  const rows = await queryRows(dbPath,
    "SELECT id, label, value, active FROM credential WHERE integration_id = 'opencode'");
  if (!rows) throw new Error("Could not read OpenCode's private subscription credentials.");
  return rows.flatMap((row) => {
    try {
      const value = JSON.parse(String(row.value));
      const metadata = value.metadata;
      if (typeof row.id !== "string" || value.type !== "oauth" ||
          typeof value.access !== "string" || !value.access ||
          typeof value.refresh !== "string" || !value.refresh ||
          typeof value.expires !== "number" || !Number.isFinite(value.expires) ||
          typeof value.methodID !== "string" ||
          !isRecord(metadata) || typeof metadata.server !== "string" ||
          typeof metadata.accountID !== "string" || !metadata.accountID ||
          typeof metadata.email !== "string" ||
          typeof metadata.orgID !== "string" || !metadata.orgID) return [];
      return [{ id: row.id, label: String(row.label), active: row.active === 1 || row.active === true, value }];
    } catch { return []; }
  });
}

function parseCredentialRows(rows: JsonRecord[]): NativeOpenCodeGoCredential[] {
  const credentials: NativeOpenCodeGoCredential[] = [];
  for (const row of rows) {
    if (
      typeof row.id !== "string" ||
      row.id.length === 0 ||
      typeof row.value !== "string"
    ) {
      continue;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(row.value);
    } catch {
      continue;
    }
    if (!isRecord(parsed) || typeof parsed.key !== "string" || !parsed.key) {
      continue;
    }
    credentials.push({
      id: row.id,
      label: typeof row.label === "string" && row.label ? row.label : "OpenCode Go",
      key: parsed.key,
      active: row.active === 1 || row.active === true,
    });
  }
  // The credential OpenCode currently uses comes first; ties keep a stable
  // order so repeated prompts do not reshuffle.
  return credentials.toSorted(
    (left, right) =>
      Number(right.active) - Number(left.active) ||
      left.label.localeCompare(right.label) ||
      left.id.localeCompare(right.id),
  );
}

/**
 * Read the Go credentials from the native OpenCode V2 database. Returns
 * `unavailable` when the database or a local SQLite reader cannot be used, so
 * callers fall back to the manual key prompt instead of failing setup.
 */
export async function readNativeOpenCodeGoCredentials(): Promise<NativeCredentialReadResult> {
  const dbFile = nativeOpenCodeDatabaseFile();
  if (!(await fileExists(dbFile))) return { status: "ok", credentials: [] };

  const rows = await queryRows(
    dbFile,
    "SELECT id, label, value, active FROM credential WHERE integration_id = 'opencode-go'",
  );
  if (!rows) return { status: "unavailable" };

  return { status: "ok", credentials: parseCredentialRows(rows) };
}
