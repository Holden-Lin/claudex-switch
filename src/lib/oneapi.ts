import type { RelayBalance } from "../types";

const FETCH_TIMEOUT_MS = 4_000;
// one-api/new-api report "unlimited" token quota as an absurdly large
// hard_limit_usd (observed: 100000000). Treat anything at this scale as
// unlimited rather than a real dollar cap.
const UNLIMITED_THRESHOLD_USD = 10_000_000;

/**
 * Query the OpenAI-compatible billing endpoints that one-api/new-api relays
 * expose (/dashboard/billing/subscription + /dashboard/billing/usage) to
 * compute the remaining balance for an API key. Returns null when the
 * provider does not implement them (official vendors usually 404 or serve
 * an HTML page).
 */
export async function fetchRelayBalance(
  baseUrl: string,
  apiKey: string,
): Promise<RelayBalance | null> {
  let origin: string;
  try {
    origin = new URL(baseUrl).origin;
  } catch {
    return null;
  }

  const headers = { Authorization: `Bearer ${apiKey}` };

  // new-api serves the billing API under /v1; some one-api deployments only
  // route the bare path. A relay's SPA can answer 200 with HTML on either,
  // so require a JSON body with the expected numeric field.
  for (const prefix of ["/v1", ""]) {
    const subscription = await getJson(
      `${origin}${prefix}/dashboard/billing/subscription`,
      headers,
    );
    const totalUsd = subscription?.hard_limit_usd;
    if (typeof totalUsd !== "number") continue;

    const end = new Date();
    const start = new Date(end.getTime() - 90 * 86_400_000);
    const day = (d: Date) => d.toISOString().slice(0, 10);
    const usage = await getJson(
      `${origin}${prefix}/dashboard/billing/usage?start_date=${day(start)}&end_date=${day(end)}`,
      headers,
    );
    // total_usage is in cents, per the OpenAI billing API convention.
    const usedUsd =
      typeof usage?.total_usage === "number" ? usage.total_usage / 100 : null;

    const unlimited = totalUsd >= UNLIMITED_THRESHOLD_USD;
    return {
      unlimited,
      usedUsd,
      remainingUsd:
        unlimited || usedUsd === null
          ? null
          : Math.max(0, totalUsd - usedUsd),
    };
  }

  return null;
}

async function getJson(
  url: string,
  headers: Record<string, string>,
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data: unknown = JSON.parse(await res.text());
    return data && typeof data === "object"
      ? (data as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
