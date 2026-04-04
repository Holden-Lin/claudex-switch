import chalk from "chalk";
import { confirm } from "@inquirer/prompts";
import { loadAliases, findAlias, removeAlias } from "../alias/store";
import { removeProfile, profileExists } from "../providers/claude/profiles";
import {
  loadRegistry,
  saveRegistry,
  removeAccountFromRegistry,
} from "../providers/codex/registry";
import { blank, success, error, formatProvider } from "../lib/ui";

export async function remove(aliasName: string): Promise<void> {
  blank();

  const reg = await loadAliases();
  const entry = findAlias(reg, aliasName);

  if (!entry) {
    error(`Alias "${aliasName}" not found.`);
    blank();
    process.exit(1);
  }

  const provider = entry.target.provider;
  const ok = await confirm({
    message: `Remove ${formatProvider(provider)} account "${aliasName}"?`,
    default: false,
  });

  if (!ok) {
    console.log(chalk.dim("  Cancelled"));
    blank();
    return;
  }

  // Remove from provider
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
    } catch {
      // Registry may not exist
    }
  }

  // Remove alias
  await removeAlias(aliasName);

  blank();
  success(`${chalk.bold(aliasName)} removed`);
  blank();
}
