import chalk from "chalk";
import { confirm } from "@inquirer/prompts";
import { loadAliases, findAlias, removeAlias } from "../alias/store";
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
    message: `Remove alias "${aliasName}"? The ${formatProvider(provider)} account will be kept.`,
    default: false,
  });

  if (!ok) {
    console.log(chalk.dim("  Cancelled"));
    blank();
    return;
  }

  await removeAlias(aliasName);

  blank();
  success(`${chalk.bold(aliasName)} alias removed`);
  blank();
}
