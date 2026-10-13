import { mkdir } from "fs/promises";
import { CLAUDEX_DIR, CLI_PROXY_API_LINKS_FILE } from "../../lib/paths";
import { readJson, writeJsonSecure } from "../../lib/fs";
import { profileExists, removeProfile } from "../claude/profiles";
import type { AliasTarget } from "../../types";

// Upstream accounts keep their own alias; the Claude Code side is an internal
// profile reached through this map. Keys use the stable account id, so a
// rename of the upstream alias never orphans its proxy login.
interface LinkFile {
  version: 1;
  links: Record<string, string>;
}

export type LinkableTarget = Extract<AliasTarget, { provider: "codex" | "opencode" }>;

export function linkKey(target: LinkableTarget): string {
  return target.provider === "codex"
    ? `codex:${target.accountKey}`
    : `opencode:${target.profileId}`;
}

async function readLinks(): Promise<LinkFile> {
  const file = await readJson<LinkFile | null>(CLI_PROXY_API_LINKS_FILE, null);
  if (file?.version !== 1 || !file.links || typeof file.links !== "object") {
    return { version: 1, links: {} };
  }
  return file;
}

async function writeLinks(file: LinkFile): Promise<void> {
  await mkdir(CLAUDEX_DIR, { recursive: true });
  await writeJsonSecure(CLI_PROXY_API_LINKS_FILE, file);
}

export async function getLinkedClaudeProfile(target: LinkableTarget): Promise<string | null> {
  return (await readLinks()).links[linkKey(target)] ?? null;
}

export async function setLinkedClaudeProfile(
  target: LinkableTarget,
  profileName: string,
): Promise<void> {
  const file = await readLinks();
  file.links[linkKey(target)] = profileName;
  await writeLinks(file);
}

export async function removeLinkedClaudeProfile(target: LinkableTarget): Promise<void> {
  const file = await readLinks();
  if (!(linkKey(target) in file.links)) return;
  delete file.links[linkKey(target)];
  await writeLinks(file);
}

export async function linkedClaudeProfileNames(): Promise<Set<string>> {
  return new Set(Object.values((await readLinks()).links));
}

/** Purge the Claude Code profile linked to an upstream account, if any. */
export async function purgeLinkedClaudeProfile(target: LinkableTarget): Promise<void> {
  const linked = await getLinkedClaudeProfile(target);
  if (!linked) return;
  // Refuses while a linked Claude Code session is running, before anything
  // (including the upstream account) is removed.
  if (await profileExists(linked)) await removeProfile(linked);
  await removeLinkedClaudeProfile(target);
}
