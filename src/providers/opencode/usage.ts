import type { UsageFetchResult, UsageInfo } from "../../types";
import { readOpenCodeGoApiKey } from "./profiles";

const OPENCODE_GO_USAGE_URL = "https://opencode.ai/zen/go/v1/usage";
const FETCH_TIMEOUT_MS = 5_000;

/** Read server-side Go quota, including usage from other OpenCode clients. */
export async function fetchOpenCodeUsage(
  profileId: string,
): Promise<UsageFetchResult> {
  const apiKey = await readOpenCodeGoApiKey(profileId);
  if (!apiKey) return { usage: null, note: "reconnect required" };

  try {
    const response = await fetch(OPENCODE_GO_USAGE_URL, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (response.status === 401) {
      return { usage: null, note: "reconnect required" };
    }
    if (response.status === 403) {
      return { usage: null, note: "Go subscription required" };
    }
    if (!response.ok) return { usage: null, note: "quota unavailable" };

    const usage = parseOpenCodeUsageResponse(await response.json());
    return usage
      ? { usage, note: null }
      : { usage: null, note: "quota unavailable" };
  } catch {
    return { usage: null, note: "quota unavailable" };
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
