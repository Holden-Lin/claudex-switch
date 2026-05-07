import { beforeEach, describe, expect, test } from "bun:test";
import { stat } from "fs/promises";
import {
  addAlias,
  isValidAlias,
  loadAliases,
  renameAlias,
} from "../src/alias/store";
import { ALIAS_REGISTRY_FILE } from "../src/lib/paths";
import { fileMode, resetTestHome } from "./helpers";

describe("alias store", () => {
  beforeEach(async () => {
    await resetTestHome();
  });

  test("returns a fresh fallback registry and writes secure files", async () => {
    const first = await loadAliases();
    first.aliases.push({
      alias: "mutated",
      target: { provider: "claude", profileName: "mutated" },
      createdAt: 1,
    });

    const second = await loadAliases();
    expect(second.aliases).toHaveLength(0);

    await addAlias("work", {
      provider: "claude",
      profileName: "work",
    });

    const saved = await loadAliases();
    expect(saved.aliases.map((entry) => entry.alias)).toEqual(["work"]);

    const stats = await stat(ALIAS_REGISTRY_FILE);
    expect(fileMode(stats.mode)).toBe(0o600);
  });

  test("rejects duplicate targets and conflicting renames", async () => {
    await addAlias("work", {
      provider: "claude",
      profileName: "work",
    });

    await expect(
      addAlias("work-copy", {
        provider: "claude",
        profileName: "work",
      }),
    ).rejects.toThrow('Account already imported as alias "work"');

    await addAlias("codex-main", {
      provider: "codex",
      accountKey: "account-1",
    });

    await expect(renameAlias("codex-main", "work")).rejects.toThrow(
      'Alias "work" already exists',
    );
  });

  test("rejects reserved version flags as aliases", () => {
    expect(isValidAlias("update")).toBe(false);
    expect(isValidAlias("model")).toBe(false);
    expect(isValidAlias("--version")).toBe(false);
    expect(isValidAlias("-V")).toBe(false);
  });
});
