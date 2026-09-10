import chalk from "chalk";
import { confirm } from "@inquirer/prompts";
import { planPurge, purgeAccount } from "../accounts/purge";
import { blank, success, error, formatProvider } from "../lib/ui";

export async function purge(aliasName: string): Promise<void> {
  blank();

  let plan;
  try {
    plan = await planPurge(aliasName);
  } catch (err) {
    error(err instanceof Error ? err.message : String(err));
    blank();
    process.exit(1);
  }

  const { linkedAliases } = plan;
  const aliasLabel =
    linkedAliases.length === 1
      ? `This will also remove alias "${aliasName}".`
      : `This will also remove ${linkedAliases.length} aliases: ${linkedAliases.join(", ")}.`;

  const ok = await confirm({
    message: `Purge ${formatProvider(plan.entry.target.provider)} account "${aliasName}"? ${aliasLabel}`,
    default: false,
  });

  if (!ok) {
    console.log(chalk.dim("  Cancelled"));
    blank();
    return;
  }

  try {
    await purgeAccount(aliasName);
  } catch (err) {
    // In particular, an active local CLIProxyAPI run refuses removal. Surface
    // it and leave the alias and its managed login untouched.
    error(err instanceof Error ? err.message : String(err));
    blank();
    process.exit(1);
  }

  blank();
  success(`${chalk.bold(aliasName)} account purged`);
  blank();
}
