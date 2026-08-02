import type {
  CodexAuthTokens,
  UsageFetchResult,
  UsageInfo,
} from "../../types";
import {
  authMatchesAccount,
  decodeIdToken,
  decodeJwtPayload,
  readActiveAuth,
  readAccountAuth,
  sameAuthCredentialVersion,
  sameChatGptIdentity,
  saveAccountAuth,
  switchToAccount,
} from "./auth";
import {
  CodexRateLimitsReadError,
  readCodexRateLimits,
  type CodexRateLimitSnapshotResponse,
  type CodexRateLimitsResponse,
} from "./app-server";
import { findAccountByKey, loadRegistry } from "./registry";

function accessAuthClaims(tokens: CodexAuthTokens): Record<string, unknown> {
  const claims = decodeJwtPayload(tokens.access_token);
  return (claims?.["https://api.openai.com/auth"] ?? {}) as Record<
    string,
    unknown
  >;
}

function isFreePlan(tokens: CodexAuthTokens): boolean {
  return (
    decodeIdToken(tokens.id_token)?.plan_type === "free" ||
    accessAuthClaims(tokens).chatgpt_plan_type === "free"
  );
}

/** Read quota through Codex's supported auth and rate-limit boundary. */
export async function fetchCodexUsage(
  accountKey: string,
  isActive: boolean,
  rateLimitsReader: typeof readCodexRateLimits = readCodexRateLimits,
): Promise<UsageFetchResult> {
  const auth = await readAccountAuth(accountKey);
  if (!auth || auth.auth_mode !== "chatgpt" || !auth.tokens?.access_token) {
    return { usage: null, note: null };
  }
  if (isFreePlan(auth.tokens)) return { usage: null, note: null };

  try {
    const { response, refreshedAuth } = await rateLimitsReader(auth);
    await persistRefreshedAuth(accountKey, isActive, auth, refreshedAuth);

    const usage = parseRateLimitsResponse(response);
    return usage
      ? { usage, note: null }
      : { usage: null, note: "usage n/a" };
  } catch (err) {
    if (err instanceof CodexRateLimitsReadError) {
      await persistRefreshedAuth(
        accountKey,
        isActive,
        auth,
        err.refreshedAuth,
      );
    }
    const message = err instanceof Error ? err.message : String(err);
    const expired = /auth|login|refresh.token|unauthorized|forbidden/i.test(
      message,
    );
    return { usage: null, note: expired ? "login expired" : "usage n/a" };
  }
}

async function persistRefreshedAuth(
  accountKey: string,
  isActive: boolean,
  originalAuth: Awaited<ReturnType<typeof readAccountAuth>>,
  refreshedAuth: Awaited<ReturnType<typeof readAccountAuth>>,
): Promise<void> {
  if (
    !originalAuth ||
    !refreshedAuth ||
    refreshedAuth.auth_mode !== "chatgpt" ||
    !sameChatGptIdentity(originalAuth, refreshedAuth)
  ) {
    return;
  }

  const currentSnapshot = await readAccountAuth(accountKey);
  if (
    !currentSnapshot ||
    !sameAuthCredentialVersion(currentSnapshot, originalAuth)
  ) {
    return;
  }

  if (!isActive) {
    await saveAccountAuth(accountKey, refreshedAuth);
    return;
  }

  const registry = await loadRegistry();
  const account = findAccountByKey(registry, accountKey);
  if (registry.active_account_key !== accountKey || !account) {
    await saveAccountAuth(accountKey, refreshedAuth);
    return;
  }

  const activeAuth = await readActiveAuth();
  if (!activeAuth || !authMatchesAccount(activeAuth, account)) return;
  if (!sameAuthCredentialVersion(activeAuth, originalAuth)) {
    await saveAccountAuth(accountKey, activeAuth);
    return;
  }

  await saveAccountAuth(accountKey, refreshedAuth);
  await switchToAccount(accountKey);
}

export function parseRateLimitsResponse(
  response: CodexRateLimitsResponse,
): UsageInfo | null {
  const snapshot =
    response.rateLimitsByLimitId?.codex ?? response.rateLimits ?? null;
  if (!snapshot) return null;
  return parseSnapshot(snapshot);
}

function parseSnapshot(snapshot: CodexRateLimitSnapshotResponse): UsageInfo | null {
  const info: UsageInfo = {
    fiveHourUsedPercent: null,
    fiveHourResetsAt: null,
    weeklyUsedPercent: null,
    weeklyResetsAt: null,
  };
  let any = false;

  for (const [index, window] of [snapshot.primary, snapshot.secondary].entries()) {
    if (!window || typeof window.usedPercent !== "number") continue;
    const isWeekly =
      typeof window.windowDurationMins === "number"
        ? window.windowDurationMins > 1_440
        : index === 1;
    const resetsAt =
      typeof window.resetsAt === "number" ? window.resetsAt * 1000 : null;

    if (isWeekly) {
      info.weeklyUsedPercent = window.usedPercent;
      info.weeklyResetsAt = resetsAt;
    } else {
      info.fiveHourUsedPercent = window.usedPercent;
      info.fiveHourResetsAt = resetsAt;
    }
    any = true;
  }

  return any ? info : null;
}
