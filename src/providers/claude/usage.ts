import { readJson } from "../../lib/fs";
import {
  CREDENTIALS_FILE,
  claudeProfileAccountFile,
  claudeProfileCredentials,
  claudeProfileDir,
} from "../../lib/paths";
import {
  readCredentials,
  writeCredentials,
  readIsolatedCredentials,
  writeIsolatedCredentials,
} from "./credentials";
import { readOAuthAccount } from "./account";
import { sameOAuthSession } from "./profiles";
import type {
  CredentialsFile,
  OAuthAccount,
  UsageFetchResult,
  UsageInfo,
} from "../../types";

const USAGE_URL = "https://api.anthropic.com/api/oauth/usage";
const TOKEN_URL = "https://console.anthropic.com/v1/oauth/token";
// Claude Code's public OAuth client id, required by the refresh_token grant.
const CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";
const EXPIRY_SKEW_MS = 60_000;
const FETCH_TIMEOUT_MS = 5_000;

function expiresAt(creds: CredentialsFile | null): number {
  return creds?.claudeAiOauth?.expiresAt ?? 0;
}

/**
 * Fetch 5h/weekly quota for an OAuth profile using its stored credentials.
 * Reads the freshest of the profile snapshot, the isolated `-run` live store,
 * and (for the active profile, same session only) the global live store.
 * If the access token is expired it is refreshed and written back to every
 * store that held credentials, so no store is left with a rotated-out
 * refresh token.
 */
export async function fetchClaudeUsage(
  profileName: string,
  isActiveProfile: boolean,
): Promise<UsageFetchResult> {
  const snapshot = await readCredentials(claudeProfileCredentials(profileName));
  const isolated = await readIsolatedCredentials(claudeProfileDir(profileName));

  let global: CredentialsFile | null = null;
  if (isActiveProfile) {
    const savedAccount = await readJson<OAuthAccount | null>(
      claudeProfileAccountFile(profileName),
      null,
    );
    if (savedAccount && sameOAuthSession(savedAccount, await readOAuthAccount())) {
      global = await readCredentials(CREDENTIALS_FILE);
    }
  }

  let creds = [snapshot, isolated, global]
    .filter((c): c is CredentialsFile => Boolean(c?.claudeAiOauth?.accessToken))
    .sort((a, b) => expiresAt(b) - expiresAt(a))[0];
  if (!creds) return { usage: null, note: null };

  const persist = async (next: CredentialsFile): Promise<void> => {
    await writeCredentials(next, claudeProfileCredentials(profileName));
    if (isolated) {
      await writeIsolatedCredentials(next, claudeProfileDir(profileName));
    }
    if (global) {
      await writeCredentials(next, CREDENTIALS_FILE);
    }
  };

  let refreshed = false;
  if (expiresAt(creds) - EXPIRY_SKEW_MS < Date.now()) {
    const result = await refreshOAuthToken(creds);
    if (result === "denied") return { usage: null, note: "login expired" };
    if (result === "unavailable") return { usage: null, note: "usage n/a" };
    await persist(result);
    creds = result;
    refreshed = true;
  }

  let response = await requestUsage(creds.claudeAiOauth.accessToken);
  if (response === "unauthorized" && !refreshed) {
    const result = await refreshOAuthToken(creds);
    if (result === "denied") return { usage: null, note: "login expired" };
    if (result === "unavailable") return { usage: null, note: "usage n/a" };
    await persist(result);
    response = await requestUsage(result.claudeAiOauth.accessToken);
  }

  if (response === "unauthorized") return { usage: null, note: "login expired" };
  if (response === "unavailable" || !response) {
    return { usage: null, note: "usage n/a" };
  }
  return { usage: response, note: null };
}

async function requestUsage(
  accessToken: string,
): Promise<UsageInfo | null | "unauthorized" | "unavailable"> {
  try {
    const res = await fetch(USAGE_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "anthropic-beta": "oauth-2025-04-20",
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

function parseUsageResponse(data: unknown): UsageInfo | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;

  const window = (value: unknown) => {
    if (!value || typeof value !== "object") return null;
    const w = value as Record<string, unknown>;
    if (typeof w.utilization !== "number") return null;
    const resetsAt =
      typeof w.resets_at === "string" ? Date.parse(w.resets_at) : NaN;
    return {
      usedPercent: w.utilization,
      resetsAt: Number.isFinite(resetsAt) ? resetsAt : null,
    };
  };

  const fiveHour = window(obj.five_hour);
  const weekly = window(obj.seven_day);
  if (!fiveHour && !weekly) return null;

  return {
    fiveHourUsedPercent: fiveHour?.usedPercent ?? null,
    fiveHourResetsAt: fiveHour?.resetsAt ?? null,
    weeklyUsedPercent: weekly?.usedPercent ?? null,
    weeklyResetsAt: weekly?.resetsAt ?? null,
  };
}

async function refreshOAuthToken(
  creds: CredentialsFile,
): Promise<CredentialsFile | "denied" | "unavailable"> {
  const refreshToken = creds.claudeAiOauth?.refreshToken;
  if (!refreshToken) return "denied";

  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: CLIENT_ID,
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return "denied";

    const token = (await res.json()) as Record<string, unknown>;
    if (typeof token.access_token !== "string") return "denied";

    return {
      ...creds,
      claudeAiOauth: {
        ...creds.claudeAiOauth,
        accessToken: token.access_token,
        refreshToken:
          typeof token.refresh_token === "string"
            ? token.refresh_token
            : refreshToken,
        expiresAt:
          Date.now() +
          (typeof token.expires_in === "number" ? token.expires_in : 3600) *
            1000,
      },
    };
  } catch {
    return "unavailable";
  }
}
