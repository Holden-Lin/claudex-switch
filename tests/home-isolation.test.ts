import { afterEach, beforeEach, describe, expect, setSystemTime, test } from "bun:test";
import { spawnSync } from "child_process";
import { existsSync, mkdtempSync } from "fs";
import { mkdir, readFile, readdir, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { loadAliases, saveAliases } from "../src/alias/store";
import { listBackups, BACKUP_KEEP } from "../src/lib/backup";
import { writeJson } from "../src/lib/fs";
import { realHomeDir } from "../src/lib/home-guard";
import {
  ALIAS_BACKUP_DIR,
  ALIAS_REGISTRY_FILE,
  CODEX_REGISTRY_BACKUP_DIR,
  CODEX_REGISTRY_FILE,
} from "../src/lib/paths";
import { loadRegistry, saveRegistry } from "../src/providers/codex/registry";
import type { AliasRegistry, CodexRegistry } from "../src/types";
import { resetTestHome, TEST_HOME } from "./helpers";

const repo = join(import.meta.dir, "..");

function aliases(...names: string[]): AliasRegistry {
  return {
    version: 1,
    aliases: names.map((alias) => ({
      alias,
      target: { provider: "claude", profileName: alias },
      createdAt: 1,
    })),
  };
}

function registry(alias: string, lastUsageAt: number | null = null): CodexRegistry {
  return {
    schema_version: 3,
    active_account_key: null,
    active_account_activated_at_ms: null,
    auto_switch: { enabled: false, threshold_5h_percent: 10, threshold_weekly_percent: 5 },
    api: { usage: true, account: true },
    accounts: [{
      account_key: "account-1",
      chatgpt_account_id: "acct-1",
      chatgpt_user_id: "user-1",
      email: "dev@example.com",
      alias,
      account_name: null,
      plan: "plus",
      auth_mode: "chatgpt",
      default_model: "gpt-5.4",
      created_at: 1,
      last_used_at: null,
      last_usage: null,
      last_usage_at: lastUsageAt,
      last_local_rollout: null,
    }],
  };
}

async function listFiles(root: string): Promise<string[]> {
  try {
    return (await readdir(root, { recursive: true })).map(String).sort();
  } catch {
    return [];
  }
}

describe("home isolation", () => {
  beforeEach(async () => {
    await resetTestHome();
  });

  afterEach(() => {
    process.env.CLAUDEX_TEST_HOME = TEST_HOME;
    setSystemTime();
  });

  test("paths follow a CLAUDEX_TEST_HOME set after import", async () => {
    const later = mkdtempSync(join(tmpdir(), "claudex-switch-later-home-"));
    try {
      process.env.CLAUDEX_TEST_HOME = later;
      await saveAliases(aliases("later"));
      expect(ALIAS_REGISTRY_FILE()).toBe(join(later, ".claudex-switch", "aliases.json"));
      expect(existsSync(join(later, ".claudex-switch", "aliases.json"))).toBe(true);
      expect(existsSync(join(TEST_HOME, ".claudex-switch", "aliases.json"))).toBe(false);
    } finally {
      process.env.CLAUDEX_TEST_HOME = TEST_HOME;
      await rm(later, { recursive: true, force: true });
    }
  });

  test("incident probe (import stores, then set HOME) writes only the probe home", async () => {
    const standInRealHome = mkdtempSync(join(tmpdir(), "claudex-switch-standin-home-"));
    const probeHome = mkdtempSync(join(tmpdir(), "claudex-switch-probe-home-"));
    try {
      const env: Record<string, string> = {};
      for (const [key, value] of Object.entries(process.env)) {
        if (value !== undefined && !key.startsWith("CLAUDEX_") && !key.startsWith("XDG_")) {
          env[key] = value;
        }
      }
      env.HOME = standInRealHome;
      env.USERPROFILE = standInRealHome;
      delete env.NODE_ENV;
      const result = spawnSync(
        process.execPath,
        [join(repo, "tests/fixtures/import-then-set-home.ts"), probeHome],
        { cwd: repo, env, encoding: "utf-8" },
      );
      expect(result.status).toBe(0);
      expect(await listFiles(standInRealHome)).toEqual([]);
      const written = await listFiles(probeHome);
      expect(written).toContain(join(".claudex-switch", "aliases.json"));
      expect(written).toContain(join(".codex", "accounts", "registry.json"));
      expect(written.some((name) => name.endsWith(".auth.json"))).toBe(true);
    } finally {
      await rm(standInRealHome, { recursive: true, force: true });
      await rm(probeHome, { recursive: true, force: true });
    }
  });

  test("a test run never resolves paths to the real home", () => {
    const realHome = realHomeDir()!;
    process.env.CLAUDEX_TEST_HOME = realHome;
    expect(() => ALIAS_REGISTRY_FILE()).toThrow(/Refusing to use .* as HOME/);
    expect(() => CODEX_REGISTRY_FILE()).toThrow(/CLAUDEX_TEST_HOME=\$\(mktemp -d\)/);
  });

  test("NODE_ENV=test with the real HOME is refused before any path is used", () => {
    const realHome = realHomeDir()!;
    const env: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined && !key.startsWith("CLAUDEX_")) env[key] = value;
    }
    env.HOME = realHome;
    env.NODE_ENV = "test";
    const result = spawnSync(
      process.execPath,
      ["-e", 'const p = await import("./src/lib/paths.ts"); console.log(p.ALIAS_REGISTRY_FILE());'],
      { cwd: repo, env, encoding: "utf-8" },
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Refusing to use");
  });

  test("a store write aimed at the real home is refused and nothing is written", async () => {
    // A path captured before the test HOME existed; the write must stop here.
    const target = join(realHomeDir()!, ".claudex-switch", `guard-probe-${process.pid}.json`);
    try {
      await expect(writeJson(target, { probe: true })).rejects.toThrow(/Refusing to write/);
      expect(existsSync(target)).toBe(false);
    } finally {
      await rm(target, { force: true });
    }
  });
});

describe("store backups", () => {
  beforeEach(async () => {
    await resetTestHome();
  });

  afterEach(() => {
    setSystemTime();
  });

  test("aliases.json is copied before an alias change, not before a no-op rewrite", async () => {
    await saveAliases(aliases("a", "b"));
    expect(await listBackups(ALIAS_BACKUP_DIR())).toEqual([]);

    await saveAliases(aliases("a")); // fixture-overwrite shape: entries vanish
    const backups = await listBackups(ALIAS_BACKUP_DIR());
    expect(backups).toHaveLength(1);
    const saved = JSON.parse(await readFile(join(ALIAS_BACKUP_DIR(), backups[0]!), "utf-8"));
    expect(saved.aliases.map((entry: { alias: string }) => entry.alias)).toEqual(["a", "b"]);

    await saveAliases(aliases("a"));
    expect(await listBackups(ALIAS_BACKUP_DIR())).toHaveLength(1);
    expect((await loadAliases()).aliases.map((entry) => entry.alias)).toEqual(["a"]);
  });

  test("registry usage refreshes do not rotate backups out; account changes do", async () => {
    await saveRegistry(registry("work"));
    await saveRegistry(registry("work", 100));
    await saveRegistry(registry("work", 200));
    // Only the first copy of an existing store, taken because none existed.
    expect(await listBackups(CODEX_REGISTRY_BACKUP_DIR())).toHaveLength(1);

    await saveRegistry(registry("renamed", 200));
    expect(await listBackups(CODEX_REGISTRY_BACKUP_DIR())).toHaveLength(2);
    expect((await loadRegistry()).accounts[0]!.alias).toBe("renamed");
  });

  test("an unchanged store is still copied once a day", async () => {
    setSystemTime(new Date("2026-11-01T00:00:00Z"));
    await saveRegistry(registry("work"));
    await saveRegistry(registry("other"));
    expect(await listBackups(CODEX_REGISTRY_BACKUP_DIR())).toHaveLength(1);

    setSystemTime(new Date("2026-11-02T01:00:00Z"));
    await saveRegistry(registry("other", 300));
    expect(await listBackups(CODEX_REGISTRY_BACKUP_DIR())).toHaveLength(2);
  });

  test(`keeps only the newest ${BACKUP_KEEP} backups`, async () => {
    const start = Date.parse("2026-11-01T00:00:00Z");
    for (let i = 0; i <= BACKUP_KEEP + 4; i++) {
      setSystemTime(new Date(start + i * 1000));
      await saveAliases(aliases(`alias${i}`));
    }
    const backups = await listBackups(ALIAS_BACKUP_DIR());
    expect(backups).toHaveLength(BACKUP_KEEP);
    const oldest = JSON.parse(await readFile(join(ALIAS_BACKUP_DIR(), backups[0]!), "utf-8"));
    expect(oldest.aliases[0].alias).toBe("alias4");
  });

  test("a failed backup does not block the store write", async () => {
    await saveAliases(aliases("a", "b"));
    await mkdir(join(TEST_HOME, ".claudex-switch", "backups"), { recursive: true });
    // A file where the backup directory should be makes the copy fail.
    await rm(ALIAS_BACKUP_DIR(), { recursive: true, force: true });
    await Bun.write(ALIAS_BACKUP_DIR(), "not a directory");
    await saveAliases(aliases("a"));
    expect((await loadAliases()).aliases.map((entry) => entry.alias)).toEqual(["a"]);
  });
});
