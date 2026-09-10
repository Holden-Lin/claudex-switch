import { mkdir } from "fs/promises";
import { CLAUDEX_DIR, ALIAS_REGISTRY_FILE } from "../lib/paths";
import { readJson, writeJsonSecure } from "../lib/fs";
import type { AliasRegistry, AliasEntry, AliasTarget } from "../types";

function emptyRegistry(): AliasRegistry {
  return { version: 1, aliases: [] };
}

// Reserved words that cannot be used as aliases
const RESERVED = new Set([
  "add",
  "use",
  "list",
  "ls",
  "remove",
  "rm",
  "rename",
  "purge",
  "current",
  "doctor",
  "model",
  "import",
  "update",
  "webconfig",
  "help",
  "-run",
  "--run",
  "--help",
  "-h",
  "--version",
  "-v",
]);

async function ensureDir(): Promise<void> {
  await mkdir(CLAUDEX_DIR, { recursive: true });
}

export async function loadAliases(): Promise<AliasRegistry> {
  const reg = await readJson<AliasRegistry>(
    ALIAS_REGISTRY_FILE,
    emptyRegistry(),
  );
  if (!Array.isArray(reg.aliases)) {
    reg.aliases = [];
  }
  return reg;
}

export async function saveAliases(reg: AliasRegistry): Promise<void> {
  await ensureDir();
  await writeJsonSecure(ALIAS_REGISTRY_FILE, reg);
}

export function findAlias(
  reg: AliasRegistry,
  alias: string,
): AliasEntry | undefined {
  const lower = alias.toLowerCase();
  return reg.aliases.find((a) => a.alias.toLowerCase() === lower);
}

export function targetsEqual(
  left: AliasTarget,
  right: AliasTarget,
): boolean {
  if (left.provider !== right.provider) return false;
  if (left.provider === "claude" && right.provider === "claude") {
    return left.profileName === right.profileName;
  }
  if (left.provider === "codex" && right.provider === "codex") {
    return left.accountKey === right.accountKey;
  }
  return false;
}

export function findAliasByTarget(
  reg: AliasRegistry,
  target: AliasTarget,
): AliasEntry | undefined {
  return reg.aliases.find((entry) => targetsEqual(entry.target, target));
}

export function findAliasesByTarget(
  reg: AliasRegistry,
  target: AliasTarget,
): AliasEntry[] {
  return reg.aliases.filter((entry) => targetsEqual(entry.target, target));
}

export function aliasExists(reg: AliasRegistry, alias: string): boolean {
  return findAlias(reg, alias) !== undefined;
}

export function isReservedAlias(alias: string): boolean {
  return RESERVED.has(alias.toLowerCase());
}

export function isValidAlias(alias: string): boolean {
  if (!alias) return false;
  if (isReservedAlias(alias)) return false;
  if (/[/\\:*?"<>|.\s]/.test(alias)) return false;
  return true;
}

// Why an alias cannot be used, in language-neutral form so each surface can
// render its own text: the CLI speaks English, the web UI speaks Chinese, and
// neither should own the rule itself. `ignoreAlias` is the alias being renamed,
// which is allowed to keep its own name under a different case.
export type AliasRejection = "empty" | "reserved" | "charset" | "taken";

export function checkAlias(
  reg: AliasRegistry,
  alias: string,
  options: { ignoreAlias?: string } = {},
): AliasRejection | null {
  if (!alias) return "empty";
  if (isReservedAlias(alias)) return "reserved";
  if (!isValidAlias(alias)) return "charset";
  if (
    options.ignoreAlias !== undefined &&
    options.ignoreAlias.toLowerCase() === alias.toLowerCase()
  ) {
    return null;
  }
  if (aliasExists(reg, alias)) return "taken";
  return null;
}

export function describeAliasRejection(
  rejection: AliasRejection,
  alias: string,
): string {
  switch (rejection) {
    case "empty":
      return "Alias cannot be empty";
    case "reserved":
      return `"${alias}" is a reserved command name`;
    case "charset":
      return "Invalid alias. Use letters, numbers, hyphens, or underscores.";
    case "taken":
      return `Alias "${alias}" already exists`;
  }
}

export async function addAlias(
  alias: string,
  target: AliasTarget,
): Promise<void> {
  const reg = await loadAliases();

  if (aliasExists(reg, alias)) {
    throw new Error(`Alias "${alias}" already exists`);
  }

  const existingTarget = findAliasByTarget(reg, target);
  if (existingTarget) {
    throw new Error(
      `Account already imported as alias "${existingTarget.alias}"`,
    );
  }

  reg.aliases.push({
    alias,
    target,
    createdAt: Date.now(),
  });

  await saveAliases(reg);
}

export async function removeAlias(alias: string): Promise<boolean> {
  const reg = await loadAliases();
  const idx = reg.aliases.findIndex(
    (a) => a.alias.toLowerCase() === alias.toLowerCase(),
  );
  if (idx < 0) return false;
  reg.aliases.splice(idx, 1);
  await saveAliases(reg);
  return true;
}

export async function removeAliasesByTarget(
  target: AliasTarget,
): Promise<number> {
  const reg = await loadAliases();
  const before = reg.aliases.length;
  reg.aliases = reg.aliases.filter((entry) => !targetsEqual(entry.target, target));
  const removed = before - reg.aliases.length;
  if (removed > 0) {
    await saveAliases(reg);
  }
  return removed;
}

export async function updateAlias(
  alias: string,
  target: AliasTarget,
): Promise<void> {
  const reg = await loadAliases();
  const entry = findAlias(reg, alias);
  if (!entry) {
    throw new Error(`Alias "${alias}" not found`);
  }
  entry.target = target;
  await saveAliases(reg);
}

export async function renameAlias(
  currentAlias: string,
  nextAlias: string,
): Promise<void> {
  const reg = await loadAliases();
  const entry = findAlias(reg, currentAlias);

  if (!entry) {
    throw new Error(`Alias "${currentAlias}" not found`);
  }
  const rejection = checkAlias(reg, nextAlias, { ignoreAlias: currentAlias });
  if (rejection) {
    throw new Error(describeAliasRejection(rejection, nextAlias));
  }

  entry.alias = nextAlias;
  await saveAliases(reg);
}
