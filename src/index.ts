#!/usr/bin/env node

import chalk from "chalk";
import { select } from "@inquirer/prompts";
import { loadAliases, findAlias } from "./alias/store";
import { readState } from "./providers/claude/profiles";
import { loadRegistry } from "./providers/codex/registry";
import { add } from "./commands/add";
import { use } from "./commands/use";
import { list } from "./commands/list";
import { remove } from "./commands/remove";
import { rename } from "./commands/rename";
import { purge } from "./commands/purge";
import { current } from "./commands/current";
import { importAccounts } from "./commands/import";
import { blank, formatProvider } from "./lib/ui";

const HELP = `
  ${chalk.bold("claudex-switch")} — Manage Claude Code and Codex accounts

  ${chalk.dim("Usage:")}
    claudex-switch                     Interactive account picker
    claudex-switch <alias>             Switch to an account
    claudex-switch add <alias>         Add a new account
    claudex-switch use <alias>         Switch to an account
    claudex-switch list                List all accounts
    claudex-switch rename <from> <to>  Rename an alias
    claudex-switch remove <alias>      Remove an alias only
    claudex-switch purge <alias>       Delete an account and all linked aliases
    claudex-switch current             Show active accounts
    claudex-switch import              Import existing accounts
    claudex-switch help                Show this help

  ${chalk.dim("Shortcuts:")}
    claudex-switch ls                  Same as 'list'
    claudex-switch rm <alias>          Same as 'remove'
`;

async function interactivePicker(): Promise<void> {
  const aliasReg = await loadAliases();

  if (aliasReg.aliases.length === 0) {
    blank();
    console.log(chalk.bold("  Welcome to claudex-switch"));
    blank();
    console.log(
      chalk.dim(
        `  Run ${chalk.cyan("claudex-switch import")} to import existing accounts`,
      ),
    );
    console.log(
      chalk.dim(
        `  or  ${chalk.cyan("claudex-switch add <alias>")} to add a new one`,
      ),
    );
    blank();
    return;
  }

  blank();

  // Build choices with provider info
  const claudeState = await readState();
  let codexReg = null;
  try {
    codexReg = await loadRegistry();
  } catch {
    // No codex registry
  }

  const choices = aliasReg.aliases.map((entry) => {
    const provider = formatProvider(entry.target.provider);
    let isActive = false;

    if (entry.target.provider === "claude") {
      isActive = claudeState.active === entry.target.profileName;
    } else if (entry.target.provider === "codex" && codexReg) {
      isActive = codexReg.active_account_key === entry.target.accountKey;
    }

    const active = isActive ? chalk.dim(" (active)") : "";

    return {
      name: `${entry.alias}  ${provider}${active}`,
      value: entry.alias,
    };
  });

  const choice = await select({
    message: "Switch to account",
    choices,
  });

  await use(choice);
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);

  try {
    switch (command) {
      case "add":
        if (!args[0]) {
          console.error(
            chalk.red("\n  Usage: claudex-switch add <alias>\n"),
          );
          process.exit(1);
        }
        await add(args[0]);
        break;

      case "use":
        if (!args[0]) {
          console.error(
            chalk.red("\n  Usage: claudex-switch use <alias>\n"),
          );
          process.exit(1);
        }
        await use(args[0]);
        break;

      case "list":
      case "ls":
        await list();
        break;

      case "remove":
      case "rm":
        if (!args[0]) {
          console.error(
            chalk.red("\n  Usage: claudex-switch remove <alias>\n"),
          );
          process.exit(1);
        }
        await remove(args[0]);
        break;

      case "rename":
        if (!args[0] || !args[1]) {
          console.error(
            chalk.red("\n  Usage: claudex-switch rename <from> <to>\n"),
          );
          process.exit(1);
        }
        await rename(args[0], args[1]);
        break;

      case "purge":
        if (!args[0]) {
          console.error(
            chalk.red("\n  Usage: claudex-switch purge <alias>\n"),
          );
          process.exit(1);
        }
        await purge(args[0]);
        break;

      case "current":
        await current();
        break;

      case "import":
        await importAccounts();
        break;

      case "help":
      case "--help":
      case "-h":
        console.log(HELP);
        break;

      case undefined:
        await interactivePicker();
        break;

      default: {
        // Try as alias shortcut
        const aliasReg = await loadAliases();
        const match = findAlias(aliasReg, command);
        if (match) {
          await use(command);
        } else {
          console.error(chalk.red(`\n  Unknown command: "${command}"`));
          console.log(HELP);
          process.exit(1);
        }
      }
    }
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.includes("User force closed")
    ) {
      blank();
      process.exit(0);
    }
    throw err;
  }
}

main();
