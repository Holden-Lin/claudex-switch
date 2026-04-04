import chalk from "chalk";
import { loadAliases } from "../alias/store";
import { readState } from "../providers/claude/profiles";
import { loadRegistry } from "../providers/codex/registry";
import { blank, hint, formatType, formatPlan, formatProvider } from "../lib/ui";

export async function current(): Promise<void> {
  const aliasReg = await loadAliases();
  const claudeState = await readState();

  let codexReg = null;
  try {
    codexReg = await loadRegistry();
  } catch {
    // No codex registry
  }

  blank();

  let found = false;

  // Claude active
  if (claudeState.active) {
    const alias = aliasReg.aliases.find(
      (a) =>
        a.target.provider === "claude" &&
        a.target.profileName === claudeState.active,
    );
    const displayName = alias ? alias.alias : claudeState.active;
    console.log(
      `  ${formatProvider("claude")}:  ${chalk.green.bold(displayName)}`,
    );
    found = true;
  }

  // Codex active
  if (codexReg?.active_account_key) {
    const alias = aliasReg.aliases.find(
      (a) =>
        a.target.provider === "codex" &&
        a.target.accountKey === codexReg!.active_account_key,
    );
    const account = codexReg.accounts?.find(
      (a) => a.account_key === codexReg!.active_account_key,
    );
    const displayName = alias
      ? alias.alias
      : account?.email ?? codexReg.active_account_key;
    console.log(
      `  ${formatProvider("codex")}:   ${chalk.green.bold(displayName)}`,
    );
    found = true;
  }

  if (!found) {
    console.log(chalk.dim("  No active accounts"));
    hint(
      `Run ${chalk.cyan("claudex-switch add <alias>")} to create one`,
    );
  }

  blank();
}
