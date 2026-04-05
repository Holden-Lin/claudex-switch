import chalk from "chalk";
import { confirm } from "@inquirer/prompts";
import {
  loadAliases,
  findAlias,
  aliasExists,
  isReservedAlias,
  isValidAlias,
  renameAlias,
} from "../alias/store";
import { blank, success, error } from "../lib/ui";

export async function rename(currentAlias: string, nextAlias: string): Promise<void> {
  blank();

  const reg = await loadAliases();
  const entry = findAlias(reg, currentAlias);

  if (!entry) {
    error(`Alias "${currentAlias}" not found.`);
    blank();
    process.exit(1);
  }
  if (!isValidAlias(nextAlias)) {
    if (isReservedAlias(nextAlias)) {
      error(`"${nextAlias}" is a reserved command name.`);
    } else {
      error(
        "Invalid alias. Use letters, numbers, hyphens, or underscores.",
      );
    }
    blank();
    process.exit(1);
  }
  if (
    currentAlias.toLowerCase() !== nextAlias.toLowerCase() &&
    aliasExists(reg, nextAlias)
  ) {
    error(`Alias "${nextAlias}" already exists.`);
    blank();
    process.exit(1);
  }

  const ok = await confirm({
    message: `Rename alias "${currentAlias}" to "${nextAlias}"?`,
    default: true,
  });

  if (!ok) {
    console.log(chalk.dim("  Cancelled"));
    blank();
    return;
  }

  await renameAlias(currentAlias, nextAlias);

  blank();
  success(`${chalk.bold(currentAlias)} renamed to ${chalk.bold(nextAlias)}`);
  blank();
}
