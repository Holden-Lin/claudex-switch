import { readAccountAuth } from "./auth";
import type { CodexUsageSnapshot } from "../../types";

const USAGE_ENDPOINT = "https://chatgpt.com/backend-api/wham/usage";

/**
 * Fetch usage data from the ChatGPT usage API for a specific account.
 * Returns null if the account has no chatgpt auth or if the request fails.
 */
export async function fetchUsage(
  accountKey: string,
): Promise<CodexUsageSnapshot | null> {
  const auth = await readAccountAuth(accountKey);
  if (!auth || auth.auth_mode !== "chatgpt") return null;
  if (!auth.tokens?.access_token || !auth.tokens?.account_id) return null;

  return fetchUsageWithToken(
    auth.tokens.access_token,
    auth.tokens.account_id,
  );
}

export async function fetchUsageWithToken(
  accessToken: string,
  accountId: string,
): Promise<CodexUsageSnapshot | null> {
  try {
    const resp = await fetch(USAGE_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "chatgpt-account-id": accountId,
        "Content-Type": "application/json",
      },
    });

    if (!resp.ok) return null;

    const data = await resp.json();
    return parseUsageResponse(data);
  } catch {
    return null;
  }
}

function parseUsageResponse(data: unknown): CodexUsageSnapshot | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;

  const snapshot: CodexUsageSnapshot = {
    primary: null,
    secondary: null,
    credits: null,
    plan_type: null,
  };

  // Parse rate limit windows
  const rateLimits = obj.rate_limits as Record<string, unknown> | undefined;
  if (rateLimits) {
    if (rateLimits.primary && typeof rateLimits.primary === "object") {
      const p = rateLimits.primary as Record<string, unknown>;
      snapshot.primary = {
        used_percent: typeof p.used_percent === "number" ? p.used_percent : 0,
        window_minutes:
          typeof p.window_minutes === "number" ? p.window_minutes : null,
        resets_at: typeof p.resets_at === "number" ? p.resets_at : null,
      };
    }
    if (rateLimits.secondary && typeof rateLimits.secondary === "object") {
      const s = rateLimits.secondary as Record<string, unknown>;
      snapshot.secondary = {
        used_percent: typeof s.used_percent === "number" ? s.used_percent : 0,
        window_minutes:
          typeof s.window_minutes === "number" ? s.window_minutes : null,
        resets_at: typeof s.resets_at === "number" ? s.resets_at : null,
      };
    }
    if (rateLimits.credits && typeof rateLimits.credits === "object") {
      const c = rateLimits.credits as Record<string, unknown>;
      snapshot.credits = {
        has_credits: !!c.has_credits,
        unlimited: !!c.unlimited,
        balance: typeof c.balance === "string" ? c.balance : null,
      };
    }
    if (typeof rateLimits.plan_type === "string") {
      snapshot.plan_type = rateLimits.plan_type;
    }
  }

  // Some responses have flat structure
  if (!snapshot.primary && typeof obj.used_percent === "number") {
    snapshot.primary = {
      used_percent: obj.used_percent as number,
      window_minutes:
        typeof obj.window_minutes === "number"
          ? (obj.window_minutes as number)
          : null,
      resets_at:
        typeof obj.resets_at === "number" ? (obj.resets_at as number) : null,
    };
  }

  if (typeof obj.plan_type === "string") {
    snapshot.plan_type = obj.plan_type as string;
  }

  return snapshot;
}
