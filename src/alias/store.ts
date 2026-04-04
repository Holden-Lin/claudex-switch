import { mkdir } from "fs/promises";
import { CLAUDEX_DIR, ALIAS_REGISTRY_FILE } from "../lib/paths";
import { readJson, writeJson } from "../lib/fs";
import type { AliasRegistry, AliasEntry, AliasTarget } from "../types";

const EMPTY_REGISTRY: AliasRegistry = { version: 1, aliases: [] };

// Reserved words that cannot be used as aliases
const RESERVED = new Set([
  "add",
  "use",
  "list",
  "ls",
  "remove",
  "rm",
  "current",
  "import",
  "help",
  "--help",
  "-h",
]);

async function ensureDir(): Promise<void> {
  await mkdir(CLAUDEX_DIR, { recursive: true });
}

export async function loadAliases(): Promise<AliasRegistry> {
  const reg = await readJson<AliasRegistry>(
    ALIAS_REGISTRY_FILE,
    EMPTY_REGISTRY,
  );
  if (!Array.isArray(reg.aliases)) {
    reg.aliases = [];
  }
  return reg;
}

export async function saveAliases(reg: AliasRegistry): Promise<void> {
  await ensureDir();
  await writeJson(ALIAS_REGISTRY_FILE, reg);
}

export function findAlias(
  reg: AliasRegistry,
  alias: string,
): AliasEntry | undefined {
  const lower = alias.toLowerCase();
  return reg.aliases.find((a) => a.alias.toLowerCase() === lower);
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

export async function addAlias(
  alias: string,
  target: AliasTarget,
): Promise<void> {
  const reg = await loadAliases();

  if (aliasExists(reg, alias)) {
    throw new Error(`Alias "${alias}" already exists`);
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
