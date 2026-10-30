import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { cliProxyAPIAuthDir, cliProxyAPIProfileDir } from "../../lib/paths";
import type { LocalCLIProxyAPIProfileData, UsageFetchResult, UsageInfo } from "../../types";
import { fetchSubscriptionUsage } from "../subscription-plugins";

export async function fetchCLIProxyAPIUsage(profile: LocalCLIProxyAPIProfileData): Promise<UsageFetchResult> {
  if (profile.upstream === "workbuddy" || profile.upstream === "workbuddy-ai") {
    return fetchSubscriptionUsage(cliProxyAPIProfileDir(profile.profileId), profile.upstream);
  }
  if (profile.upstream !== "antigravity") return { usage: null, note: null };
  try {
    const directory = cliProxyAPIAuthDir(profile.profileId);
    const files = (await readdir(directory)).filter((name) => name.endsWith(".json"));
    if (files.length !== 1) return { usage: null, note: "usage n/a" };
    const auth = JSON.parse(await readFile(join(directory, files[0]!), "utf8"));
    if (auth.type !== "antigravity" || typeof auth.access_token !== "string" || !auth.access_token) {
      return { usage: null, note: "usage n/a" };
    }
    // CLIProxyAPI owns token refresh; list never becomes another auth-file writer.
    const response = await fetch("https://daily-cloudcode-pa.googleapis.com/v1internal:retrieveUserQuotaSummary", {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.access_token}`, "Content-Type": "application/json", "User-Agent": "antigravity/1.19.6 darwin/arm64" },
      body: JSON.stringify({ project: auth.project_id }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return { usage: null, note: "usage n/a" };
    const usage = parseAntigravityQuota(await response.json());
    return { usage, note: usage ? null : "usage n/a" };
  } catch {
    return { usage: null, note: "usage n/a" };
  }
}

export function parseAntigravityQuota(raw: unknown): UsageInfo | null {
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as { groups?: unknown }).groups)) return null;
  const groups: NonNullable<UsageInfo["groups"]> = [];
  for (const group of (raw as { groups: unknown[] }).groups) {
    if (!group || typeof group !== "object") continue;
    const { displayName, buckets } = group as { displayName?: unknown; buckets?: unknown };
    if (typeof displayName !== "string" || !displayName.trim() || displayName.length > 80 || /[\x00-\x1f\x7f]/.test(displayName) || !Array.isArray(buckets)) continue;
    const usage: UsageInfo = { fiveHourUsedPercent: null, fiveHourResetsAt: null, weeklyUsedPercent: null, weeklyResetsAt: null };
    for (const bucket of buckets) {
      if (!bucket || typeof bucket !== "object") continue;
      const { window, remainingFraction, resetTime } = bucket;
      if (typeof remainingFraction !== "number" || !Number.isFinite(remainingFraction) || remainingFraction < 0 || remainingFraction > 1) continue;
      const reset = typeof resetTime === "string" ? Date.parse(resetTime) : NaN;
      if (window === "5h") {
        usage.fiveHourUsedPercent = 100 * (1 - remainingFraction);
        usage.fiveHourResetsAt = Number.isFinite(reset) ? reset : null;
      } else if (window === "weekly") {
        usage.weeklyUsedPercent = 100 * (1 - remainingFraction);
        usage.weeklyResetsAt = Number.isFinite(reset) ? reset : null;
      }
    }
    if (usage.fiveHourUsedPercent !== null || usage.weeklyUsedPercent !== null) {
      groups.push({ name: displayName.replace(/ models$/i, "").replace(/ and /gi, "/"), usage });
    }
  }
  return groups.length ? { fiveHourUsedPercent: null, fiveHourResetsAt: null, weeklyUsedPercent: null, weeklyResetsAt: null, groups } : null;
}
