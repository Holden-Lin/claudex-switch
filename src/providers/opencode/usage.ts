import type { UsageFetchResult, UsageInfo } from "../../types";
import { getOpenCodeProfileData, readOpenCodeGoApiKey } from "./profiles";
import { fetchOpenCodeConsoleUsage } from "./console";

const OPENCODE_GO_USAGE_URL = "https://opencode.ai/zen/go/v1/usage";
const FETCH_TIMEOUT_MS = 5_000;

export type OpenCodeGoKeyProbe =
  | { status: "valid"; usage: UsageInfo | null }
  | { status: "invalid" }
  | { status: "no-subscription" }
  | { status: "unreachable" };

/**
 * Verify a Go API key against the same server endpoint `list` uses. A
 * definitive rejection (401/403) is reported as such; network trouble is
 * reported as `unreachable` so offline setups can still save a key.
 */
export async function probeOpenCodeGoKey(
  apiKey: string,
): Promise<OpenCodeGoKeyProbe> {
  const key = apiKey.trim();
  if (!key) return { status: "invalid" };

  try {
    const response = await fetch(OPENCODE_GO_USAGE_URL, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (response.status === 401) return { status: "invalid" };
    if (response.status === 403) return { status: "no-subscription" };
    if (!response.ok) return { status: "unreachable" };

    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      // A 200 with an unreadable body still proves the key authenticated.
    }
    return { status: "valid", usage: parseOpenCodeUsageResponse(data) };
  } catch {
    return { status: "unreachable" };
  }
}

/** Read server-side Go quota, including usage from other OpenCode clients. */
export async function fetchOpenCodeUsage(
  profileId: string,
): Promise<UsageFetchResult> {
  const profile = await getOpenCodeProfileData(profileId).catch(() => null);
  if (profile?.console) return fetchOpenCodeConsoleUsage(profileId);
  const apiKey = await readOpenCodeGoApiKey(profileId);
  if (!apiKey) return { usage: null, note: "reconnect required" };

  const probe = await probeOpenCodeGoKey(apiKey);
  switch (probe.status) {
    case "invalid":
      return { usage: null, note: "reconnect required" };
    case "no-subscription":
      return { usage: null, note: "Go subscription required" };
    case "unreachable":
      return { usage: null, note: "quota unavailable" };
    case "valid":
      return probe.usage
        ? { usage: probe.usage, note: null }
        : { usage: null, note: "quota unavailable" };
  }
}

/**
 * OpenCode Go returns percentage used (not remaining) for its rolling,
 * weekly, and monthly subscription windows.
 */
export function parseOpenCodeUsageResponse(data: unknown): UsageInfo | null {
  if (!data || typeof data !== "object") return null;
  const usage = (data as Record<string, unknown>).usage;
  if (!usage || typeof usage !== "object") return null;
  const windows = usage as Record<string, unknown>;
  const rolling = parseWindow(windows.rolling);
  const weekly = parseWindow(windows.weekly);
  const monthly = parseWindow(windows.monthly);
  if (!rolling && !weekly && !monthly) return null;

  return {
    fiveHourUsedPercent: rolling?.usedPercent ?? null,
    fiveHourResetsAt: rolling?.resetsAt ?? null,
    weeklyUsedPercent: weekly?.usedPercent ?? null,
    weeklyResetsAt: weekly?.resetsAt ?? null,
    monthlyUsedPercent: monthly?.usedPercent ?? null,
    monthlyResetsAt: monthly?.resetsAt ?? null,
  };
}

function parseWindow(
  value: unknown,
): { usedPercent: number; resetsAt: number | null } | null {
  if (!value || typeof value !== "object") return null;
  const window = value as Record<string, unknown>;
  const rateLimited = window.status === "rate-limited";
  if (
    !rateLimited &&
    (typeof window.percent !== "number" || !Number.isFinite(window.percent))
  ) {
    return null;
  }
  const usedPercent = rateLimited
    ? 100
    : Math.min(100, Math.max(0, window.percent as number));
  const parsedReset =
    typeof window.resetsAt === "string" ? Date.parse(window.resetsAt) : NaN;
  return {
    usedPercent,
    resetsAt: Number.isFinite(parsedReset) ? parsedReset : null,
  };
}
