import { password, select } from "@inquirer/prompts";
import chalk from "chalk";
import { blank, error, formatUsage, hint, info, maskKey, success } from "../lib/ui";
import {
  readNativeOpenCodeGoCredentials,
  type NativeOpenCodeGoCredential,
} from "../providers/opencode/native";
import { probeOpenCodeGoKey } from "../providers/opencode/usage";

// OpenCode V2 has no TUI /connect step in `add` and no auth.json to import, so
// the key has to come from somewhere. Importing the credential a user already
// logged into OpenCode with (explicitly selected, never automatic) keeps the
// first account one keystroke away; every key is verified against the server
// before it is saved so a typo cannot silently create a broken alias.

const MAX_VALIDATION_ROUNDS = 3;

export interface OpenCodeV2KeyOptions {
  /** Prompt label for manual entry. */
  message: string;
  /** `refresh` rejects re-entering the saved key as an unchanged refresh. */
  previousKey?: string | null;
}

export async function resolveOpenCodeV2Key(
  options: OpenCodeV2KeyOptions,
): Promise<string> {
  const native = await readNativeOpenCodeGoCredentials().catch(() => null);
  const importable =
    native?.status === "ok" ? native.credentials : ([] as NativeOpenCodeGoCredential[]);
  if (importable.length > 0) {
    info("Found an OpenCode Go login in this machine's OpenCode database.");
    hint(
      "Importing reads that credential from OpenCode's local database and saves it in this alias's private claudex-switch profile.",
    );
    blank();
  }

  for (let round = 0; round < MAX_VALIDATION_ROUNDS; round += 1) {
    let key: string;
    let sourceLabel: string;
    if (importable.length > 0) {
      const choice = await select({
        message: "OpenCode Go credential source",
        choices: [
          ...importable.map((credential) => ({
            name: `Import local OpenCode login${credential.active ? " (current)" : ""}  ${chalk.dim(`${credential.label} · ${maskKey(credential.key)}`)}`,
            value: credential.id,
          })),
          { name: "Paste an API key manually", value: null },
        ],
      });
      const imported = choice
        ? importable.find((credential) => credential.id === choice)
        : undefined;
      if (imported) {
        key = imported.key;
        sourceLabel = "imported from the local OpenCode database";
      } else {
        key = await promptForKey(options.message);
        sourceLabel = "entered manually";
      }
    } else {
      key = await promptForKey(options.message);
      sourceLabel = "entered manually";
    }

    if (options.previousKey && key === options.previousKey) {
      error("The entered OpenCode Go API key is unchanged; the profile was not refreshed.");
      blank();
      process.exit(1);
      return key;
    }

    const probe = await probeOpenCodeGoKey(key);
    if (probe.status === "valid") {
      const usage = formatUsage(probe.usage, null);
      success(`OpenCode Go key verified (${sourceLabel})${usage ? `  ${usage}` : ""}`);
      return key;
    }

    if (probe.status === "unreachable") {
      hint(
        "Could not reach OpenCode Go to verify this key right now; it will be saved and checked on first use.",
      );
      return key;
    }

    if (probe.status === "invalid") {
      error("OpenCode Go rejected this API key (invalid API key).");
    } else {
      error("This key is valid but has no OpenCode Go subscription.");
    }
    if (importable.length > 0) {
      hint("Pick another source, paste the account's current API key, or press Ctrl-C to cancel.");
    } else {
      hint("Check the key on opencode.ai and try again, or press Ctrl-C to cancel.");
    }
    blank();
  }

  error("Too many invalid OpenCode Go API keys; nothing was saved.");
  blank();
  process.exit(1);
  return "";
}

async function promptForKey(message: string): Promise<string> {
  const key = await password({
    message,
    validate: (value) =>
      value.trim().length > 0 || "Enter a non-empty OpenCode Go API key.",
  });
  return key.trim();
}
