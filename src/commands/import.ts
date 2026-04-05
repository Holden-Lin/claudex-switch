import chalk from "chalk";
import { readdir } from "fs/promises";
import { CLAUDE_PROFILES_DIR } from "../lib/paths";
import { fileExists } from "../lib/fs";
import {
  loadAliases,
  saveAliases,
  aliasExists,
  isValidAlias,
  findAliasByTarget,
} from "../alias/store";
import { loadRegistry } from "../providers/codex/registry";
import { blank, success, info, hint } from "../lib/ui";
import type { AliasRegistry } from "../types";

export async function importAccounts(): Promise<void> {
  blank();
  info("Scanning for existing accounts...");
  blank();

  const reg = await loadAliases();
  let imported = 0;
  let skipped = 0;

  // Import Claude profiles
  const claudeResult = await importClaudeProfiles(reg);
  imported += claudeResult.imported;
  skipped += claudeResult.skipped;

  // Import Codex accounts
  const codexResult = await importCodexAccounts(reg);
  imported += codexResult.imported;
  skipped += codexResult.skipped;

  await saveAliases(reg);

  blank();
  if (imported > 0) {
    success(`Imported ${imported} account(s)`);
  } else {
    info("No new accounts to import");
  }
  if (skipped > 0) {
    hint(`${skipped} account(s) skipped`);
  }
  blank();
}

async function importClaudeProfiles(
  reg: AliasRegistry,
): Promise<{ imported: number; skipped: number }> {
  if (!(await fileExists(CLAUDE_PROFILES_DIR))) return { imported: 0, skipped: 0 };

  let imported = 0;
  let skipped = 0;
  const entries = await readdir(CLAUDE_PROFILES_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    const target = { provider: "claude" as const, profileName: name };
    const existing = findAliasByTarget(reg, target);

    if (existing) {
      console.log(
        chalk.dim(`  skip  ${name} (already imported as "${existing.alias}")`),
      );
      skipped++;
      continue;
    }

    if (!isValidAlias(name) || aliasExists(reg, name)) {
      console.log(
        chalk.dim(`  skip  ${name} (${aliasExists(reg, name) ? "alias already exists" : "invalid alias name"})`),
      );
      skipped++;
      continue;
    }

    reg.aliases.push({
      alias: name,
      target,
      createdAt: Date.now(),
    });
    console.log(`  ${chalk.green("+")} ${name}  ${chalk.dim("(claude)")}`);
    imported++;
  }

  return { imported, skipped };
}

async function importCodexAccounts(
  reg: AliasRegistry,
): Promise<{ imported: number; skipped: number }> {
  let imported = 0;
  let skipped = 0;

  try {
    const codexReg = await loadRegistry();
    if (!codexReg.accounts || codexReg.accounts.length === 0) {
      return { imported, skipped };
    }

    for (const account of codexReg.accounts) {
      const target = {
        provider: "codex" as const,
        accountKey: account.account_key,
      };
      const existing = findAliasByTarget(reg, target);
      if (existing) {
        console.log(
          chalk.dim(
            `  skip  ${account.email || account.account_key} (already imported as "${existing.alias}")`,
          ),
        );
        skipped++;
        continue;
      }

      // Determine alias: use codex-auth's alias, then email prefix, then account_key
      let alias = account.alias && account.alias.trim()
        ? account.alias.trim()
        : null;

      if (!alias) {
        // Use email prefix (part before @)
        const emailPrefix = account.email?.split("@")[0];
        if (emailPrefix) {
          // Add plan suffix if it helps disambiguate
          const plan = account.plan ?? "codex";
          alias = `${emailPrefix}-${plan}`;
        } else {
          alias = `codex-${account.account_key.slice(0, 8)}`;
        }
      }

      // Sanitize alias
      alias = alias.replace(/[/\\:*?"<>|.\s]/g, "-");

      // Deduplicate and validate
      let finalAlias = alias;
      let counter = 1;
      while (!isValidAlias(finalAlias) || aliasExists(reg, finalAlias)) {
        finalAlias = `${alias}-${counter}`;
        counter++;
        if (counter > 100) {
          skipped++;
          break;
        }
      }
      if (counter > 100) continue;

      reg.aliases.push({
        alias: finalAlias,
        target,
        createdAt: Date.now(),
      });
      console.log(
        `  ${chalk.green("+")} ${finalAlias}  ${chalk.dim("(codex)")}  ${chalk.dim(account.email || "")}`,
      );
      imported++;
    }
  } catch {
    // Codex registry doesn't exist or can't be read - that's fine
  }

  return { imported, skipped };
}
