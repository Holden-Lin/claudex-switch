import chalk from "chalk";
import { unlink } from "fs/promises";
import { confirm } from "@inquirer/prompts";
import {
  loadAliases,
  findAlias,
  findAliasesByTarget,
  removeAliasesByTarget,
} from "../alias/store";
import { removeProfile, profileExists } from "../providers/claude/profiles";
import {
  loadRegistry,
  saveRegistry,
  removeAccountFromRegistry,
} from "../providers/codex/registry";
import { codexAccountAuthFile } from "../lib/paths";
import { fileExists } from "../lib/fs";
import { blank, success, error, formatProvider } from "../lib/ui";

export async function purge(aliasName: string): Promise<void> {
  blank();

  const reg = await loadAliases();
  const entry = findAlias(reg, aliasName);

  if (!entry) {
    error(`Alias "${aliasName}" not found.`);
    blank();
    process.exit(1);
  }

  const linkedAliases = findAliasesByTarget(reg, entry.target).map((item) => item.alias);
  const aliasCount = linkedAliases.length;
  const aliasLabel =
    aliasCount === 1
      ? `This will also remove alias "${aliasName}".`
      : `This will also remove ${aliasCount} aliases: ${linkedAliases.join(", ")}.`;

  const ok = await confirm({
    message: `Purge ${formatProvider(entry.target.provider)} account "${aliasName}"? ${aliasLabel}`,
    default: false,
  });

  if (!ok) {
    console.log(chalk.dim("  Cancelled"));
    blank();
    return;
  }

  if (entry.target.provider === "claude") {
    try {
      if (await profileExists(entry.target.profileName)) {
        await removeProfile(entry.target.profileName);
      }
    } catch {
      // Profile may already be gone
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

  blank();
  success(`${chalk.bold(aliasName)} account purged`);
  blank();
}
