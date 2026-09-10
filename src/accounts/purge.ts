import { unlink } from "fs/promises";
import {
  findAlias,
  findAliasesByTarget,
  loadAliases,
  removeAliasesByTarget,
} from "../alias/store";
import { fileExists } from "../lib/fs";
import { codexAccountAuthFile } from "../lib/paths";
import { profileExists, removeProfile } from "../providers/claude/profiles";
import {
  loadRegistry,
  removeAccountFromRegistry,
  saveRegistry,
} from "../providers/codex/registry";
import type { AliasEntry } from "../types";

// Purging deletes an account *and* every alias pointing at it, including its
// stored login. It lives here rather than in commands/ so the CLI (which asks
// for confirmation on the terminal first) and the local web UI (which asks in
// the browser) share one implementation instead of two that can drift.
export interface PurgePlan {
  entry: AliasEntry;
  /** Every alias this purge will remove, including the one being targeted. */
  linkedAliases: string[];
}

/**
 * Work out what a purge would destroy without changing anything, so a caller
 * can spell out the consequences before the user confirms.
 */
export async function planPurge(aliasName: string): Promise<PurgePlan> {
  const reg = await loadAliases();
  const entry = findAlias(reg, aliasName);
  if (!entry) {
    throw new Error(`Alias "${aliasName}" not found`);
  }

  return {
    entry,
    linkedAliases: findAliasesByTarget(reg, entry.target).map((a) => a.alias),
  };
}

/**
 * Destroy the account behind an alias and every alias pointing at it. Throws
 * before removing anything when the underlying profile cannot be deleted — in
 * particular an active local CLIProxyAPI session refuses removal, and that
 * refusal must leave the alias and its managed login intact.
 */
export async function purgeAccount(aliasName: string): Promise<PurgePlan> {
  const plan = await planPurge(aliasName);
  const { entry } = plan;

  if (entry.target.provider === "claude") {
    if (await profileExists(entry.target.profileName)) {
      await removeProfile(entry.target.profileName);
    }
  } else {
    try {
      const codexReg = await loadRegistry();
      const removed = removeAccountFromRegistry(
        codexReg,
        entry.target.accountKey,
      );
      if (removed) {
        await saveRegistry(codexReg);
      }

      const authFile = codexAccountAuthFile(entry.target.accountKey);
      if (await fileExists(authFile)) {
        await unlink(authFile);
      }
    } catch {
      // Registry may not exist
    }
  }

  await removeAliasesByTarget(entry.target);
  return plan;
}
