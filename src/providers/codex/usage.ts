import {
  decodeIdToken,
  decodeJwtPayload,
  readAccountAuth,
  saveAccountAuth,
  switchToAccount,
} from "./auth";
import type {
  CodexAuthTokens,
  CodexChatGptAuthFile,
  UsageFetchResult,
  UsageInfo,
} from "../../types";

const USAGE_URL = "https://chatgpt.com/backend-api/wham/usage";
const TOKEN_URL = "https://auth.openai.com/oauth/token";
// Codex CLI's public OAuth client id, required by the refresh_token grant.
const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
const EXPIRY_SKEW_MS = 60_000;
const FETCH_TIMEOUT_MS = 5_000;

function accessTokenExpiresAt(tokens: CodexAuthTokens): number | null {
  const claims = decodeJwtPayload(tokens.access_token);
  return typeof claims?.exp === "number" ? claims.exp * 1000 : null;
}

function accessAuthClaims(tokens: CodexAuthTokens): Record<string, unknown> {
  const claims = decodeJwtPayload(tokens.access_token);
  return (claims?.["https://api.openai.com/auth"] ?? {}) as Record<
    string,
    unknown
  >;
}

function chatgptAccountId(tokens: CodexAuthTokens): string {
  const accountId = accessAuthClaims(tokens).chatgpt_account_id;
  return typeof accountId === "string" ? accountId : tokens.account_id;
}

function isFreePlan(tokens: CodexAuthTokens): boolean {
  return (
    decodeIdToken(tokens.id_token)?.plan_type === "free" ||
    accessAuthClaims(tokens).chatgpt_plan_type === "free"
  );
}

/**
 * Fetch 5h/weekly quota for a ChatGPT-auth Codex account. If the access token
 * is expired it is refreshed and written back to the account auth file (and
 * to the live ~/.codex/auth.json when the account is active). Free-plan
 * accounts are skipped.
 */
export async function fetchCodexUsage(
  accountKey: string,
  isActive: boolean,
): Promise<UsageFetchResult> {
  const auth = await readAccountAuth(accountKey);
  if (!auth || auth.auth_mode !== "chatgpt" || !auth.tokens?.access_token) {
    return { usage: null, note: null };
  }
  if (isFreePlan(auth.tokens)) {
    return { usage: null, note: null };
  }

  const persist = async (tokens: Record<string, unknown>): Promise<void> => {
    auth.tokens.id_token =
      typeof tokens.id_token === "string" ? tokens.id_token : auth.tokens.id_token;
    auth.tokens.access_token = tokens.access_token as string;
    auth.tokens.refresh_token =
      typeof tokens.refresh_token === "string"
        ? tokens.refresh_token
        : auth.tokens.refresh_token;
    auth.last_refresh = new Date().toISOString();
    await saveAccountAuth(accountKey, auth);
    if (isActive) {
      await switchToAccount(accountKey);
    }
  };

  let refreshed = false;
  const expiry = accessTokenExpiresAt(auth.tokens);
  if (expiry !== null && expiry - EXPIRY_SKEW_MS < Date.now()) {
    const result = await refreshTokens(auth);
    if (result === "denied") return { usage: null, note: "login expired" };
    if (result === "unavailable") return { usage: null, note: "usage n/a" };
    await persist(result);
    refreshed = true;
  }

  let response = await requestUsage(auth.tokens);
  if (response === "unauthorized" && !refreshed) {
    const result = await refreshTokens(auth);
    if (result === "denied") return { usage: null, note: "login expired" };
    if (result === "unavailable") return { usage: null, note: "usage n/a" };
    await persist(result);
    response = await requestUsage(auth.tokens);
  }

  if (response === "unauthorized") return { usage: null, note: "login expired" };
  if (response === "unavailable" || !response) {
    return { usage: null, note: "usage n/a" };
  }
  return { usage: response, note: null };
}

async function requestUsage(
  tokens: CodexAuthTokens,
): Promise<UsageInfo | null | "unauthorized" | "unavailable"> {
  try {
    const res = await fetch(USAGE_URL, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "chatgpt-account-id": chatgptAccountId(tokens),
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (res.status === 401 || res.status === 403) return "unauthorized";
    if (!res.ok) return "unavailable";
    return parseUsageResponse(await res.json());
  } catch {
    return "unavailable";
  }
}

// The wham/usage response reports one or two rate-limit windows under
// rate_limit.primary_window / .secondary_window. Which slot holds the 5h
// versus the weekly limit varies by plan, so classify by window length
// instead of position.
function parseUsageResponse(data: unknown): UsageInfo | null {
  if (!data || typeof data !== "object") return null;
  const rateLimit = (data as Record<string, unknown>).rate_limit;
  if (!rateLimit || typeof rateLimit !== "object") return null;
  const rl = rateLimit as Record<string, unknown>;

  const info: UsageInfo = {
    fiveHourUsedPercent: null,
    fiveHourResetsAt: null,
    weeklyUsedPercent: null,
    weeklyResetsAt: null,
  };
  let any = false;

  for (const value of [rl.primary_window, rl.secondary_window]) {
    if (!value || typeof value !== "object") continue;
    const w = value as Record<string, unknown>;
    if (typeof w.used_percent !== "number") continue;

    const windowSeconds =
      typeof w.limit_window_seconds === "number"
        ? w.limit_window_seconds
        : null;
    const resetsAt = typeof w.reset_at === "number" ? w.reset_at * 1000 : null;
    const isWeekly = windowSeconds !== null && windowSeconds > 86_400;

    if (isWeekly) {
      info.weeklyUsedPercent = w.used_percent;
      info.weeklyResetsAt = resetsAt;
    } else {
      info.fiveHourUsedPercent = w.used_percent;
      info.fiveHourResetsAt = resetsAt;
    }
    any = true;
  }

  return any ? info : null;
}

async function refreshTokens(
  auth: CodexChatGptAuthFile,
): Promise<Record<string, unknown> | "denied" | "unavailable"> {
  if (!auth.tokens.refresh_token) return "denied";

  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        grant_type: "refresh_token",
        refresh_token: auth.tokens.refresh_token,
        scope: "openid profile email",
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return "denied";

    const token = (await res.json()) as Record<string, unknown>;
    if (typeof token.access_token !== "string") return "denied";
    return token;
  } catch {
    return "unavailable";
  }
}
