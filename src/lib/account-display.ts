import type { AliasEntry, ProfileData } from "../types";
import { getProfileData } from "../providers/claude/profiles";
import { CLI_PROXY_API_UPSTREAMS } from "../providers/cliproxyapi/upstreams";

/** A null section hides legacy ChatGPT proxy accounts in human account views. */
export function claudeAccountSection(profile: ProfileData): string | null {
  if (profile.type !== "local-cliproxyapi") return "Claude";
  const upstream = profile.upstream ?? "codex";
  return upstream === "codex" ? null : CLI_PROXY_API_UPSTREAMS[upstream].label;
}

export async function aliasSection(entry: AliasEntry): Promise<string | null> {
  if (entry.target.provider === "codex") return "Codex";
  if (entry.target.provider === "opencode") return "OpenCode";
  return claudeAccountSection(await getProfileData(entry.target.profileName));
}
