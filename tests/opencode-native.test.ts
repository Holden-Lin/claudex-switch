import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdir, rm, writeFile } from "fs/promises";
import { dirname, join, resolve } from "path";
import { mkdtemp } from "fs/promises";
import { tmpdir } from "os";
import { pathToFileURL } from "url";
import { OPENCODE_GLOBAL_DATA_DIR } from "../src/lib/paths";
import {
  nativeOpenCodeDatabaseFile,
  readNativeOpenCodeGoCredentials,
} from "../src/providers/opencode/native";
import { resetTestHome } from "./helpers";

const DB_FILE = join(OPENCODE_GLOBAL_DATA_DIR, "opencode.db");
const originalOpenCodeDb = process.env.OPENCODE_DB;

type CredentialRow = {
  id: string;
  integration: string;
  label: string;
  value: string;
  active: number;
};

function createDatabase(file: string, rows: CredentialRow[]): void {
  const db = new Database(file);
  try {
    db.exec(
      "CREATE TABLE credential (id text PRIMARY KEY, integration_id text, label text NOT NULL, value text NOT NULL, connector_id text, method_id text, active integer, time_created integer NOT NULL, time_updated integer NOT NULL)",
    );
    const insert = db.prepare(
      "INSERT INTO credential (id, integration_id, label, value, connector_id, method_id, active, time_created, time_updated) VALUES (?, ?, ?, ?, NULL, NULL, ?, 0, 0)",
    );
    for (const row of rows) {
      insert.run(row.id, row.integration, row.label, row.value, row.active);
    }
  } finally {
    db.close();
  }
}

describe("native OpenCode credential import", () => {
  beforeEach(async () => {
    await resetTestHome();
    delete process.env.OPENCODE_DB;
    await mkdir(dirname(DB_FILE), { recursive: true });
  });

  afterEach(() => {
    if (originalOpenCodeDb === undefined) delete process.env.OPENCODE_DB;
    else process.env.OPENCODE_DB = originalOpenCodeDb;
  });

  test("Node reads SQLite without sqlite3 or experimental warnings and retains unrelated warnings", async () => {
    createDatabase(DB_FILE, [{ id: "cred_node", integration: "opencode-go", label: "Node fixture", value: JSON.stringify({ type: "key", key: "fake-node-key" }), active: 1 }]);
    const temporary = await mkdtemp(join(tmpdir(), "claudex-node-sqlite-"));
    try {
      const build = await Bun.build({ entrypoints: [resolve(import.meta.dir, "../src/providers/opencode/native.ts")],
        outdir: temporary, naming: "reader.mjs", target: "node", format: "esm" });
      expect(build.success).toBe(true);
      const node = Bun.which("node");
      expect(node).not.toBeNull();
      const code = `import { queryRows } from ${JSON.stringify(pathToFileURL(join(temporary, "reader.mjs")).href)};
const rows = await queryRows(${JSON.stringify(DB_FILE)}, "SELECT id FROM credential");
console.log(JSON.stringify(rows));`;
      // No sqlite3 on PATH: exercise the built-in Node SQLite fallback.
      const options = { env: { ...process.env, PATH: temporary }, stdout: "pipe" as const, stderr: "pipe" as const };
      const result = Bun.spawnSync([node!, "--input-type=module", "-e", code], options);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout.toString())).toEqual([{ id: "cred_node" }]);
      expect(result.stderr.toString()).toBe("");
      const unrelated = Bun.spawnSync([node!, "--input-type=module", "-e", `${code}\nprocess.emitWarning("fixture unrelated warning");`], options);
      expect(unrelated.exitCode).toBe(0);
      expect(unrelated.stderr.toString()).toContain("fixture unrelated warning");
      expect(unrelated.stderr.toString()).not.toContain("SQLite is an experimental feature");
    } finally { await rm(temporary, { recursive: true, force: true }); }
  });

  test("reads Go credentials active-first and ignores other integrations", async () => {
    createDatabase(DB_FILE, [
      {
        id: "cred_backup",
        integration: "opencode-go",
        label: "Backup",
        value: JSON.stringify({ type: "key", key: "backup-key" }),
        active: 0,
      },
      {
        id: "cred_main",
        integration: "opencode-go",
        label: "OpenCode Go",
        value: JSON.stringify({ type: "api", key: "main-key" }),
        active: 1,
      },
      {
        id: "cred_other",
        integration: "anthropic",
        label: "Anthropic",
        value: JSON.stringify({ type: "api", key: "must-not-import" }),
        active: 1,
      },
      {
        id: "cred_broken",
        integration: "opencode-go",
        label: "Broken",
        value: "not json",
        active: 0,
      },
    ]);

    await expect(readNativeOpenCodeGoCredentials()).resolves.toEqual({
      status: "ok",
      credentials: [
        { id: "cred_main", label: "OpenCode Go", key: "main-key", active: true },
        { id: "cred_backup", label: "Backup", key: "backup-key", active: false },
      ],
    });
  });

  test("honors OPENCODE_DB and reports an empty store without a database", async () => {
    await rm(DB_FILE, { force: true });
    await expect(readNativeOpenCodeGoCredentials()).resolves.toEqual({
      status: "ok",
      credentials: [],
    });

    const alternate = join(
      await mkdtemp(join(tmpdir(), "opencode-native-")),
      "custom.db",
    );
    createDatabase(alternate, [
      {
        id: "cred_custom",
        integration: "opencode-go",
        label: "Custom",
        value: JSON.stringify({ type: "key", key: "custom-key" }),
        active: 1,
      },
    ]);
    process.env.OPENCODE_DB = alternate;

    expect(nativeOpenCodeDatabaseFile()).toBe(alternate);
    await expect(readNativeOpenCodeGoCredentials()).resolves.toEqual({
      status: "ok",
      credentials: [
        { id: "cred_custom", label: "Custom", key: "custom-key", active: true },
      ],
    });
  });

  test("reports unavailable for an unreadable database instead of failing setup", async () => {
    await writeFile(DB_FILE, "this is not a sqlite database");

    await expect(readNativeOpenCodeGoCredentials()).resolves.toEqual({
      status: "unavailable",
    });
  });
});
