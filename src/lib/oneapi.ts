import { mkdir } from "fs/promises";
import { dirname } from "path";
import { RELAYS_FILE } from "./paths";
import { readJson, writeJsonSecure } from "./fs";
import type { RelayBalance, RelayBalanceSide, RelayConfig } from "../types";

const FETCH_TIMEOUT_MS = 4_000;
// one-api/new-api report "unlimited" token quota as an absurdly large
// hard_limit_usd (observed: 100000000). Treat anything at this scale as
// unlimited rather than a real dollar cap.
const UNLIMITED_THRESHOLD_USD = 10_000_000;
// one-api/new-api default: 500000 quota units per dollar.
const DEFAULT_QUOTA_PER_UNIT = 500_000;

/**
 * Fetch both balance levels a one-api/new-api relay can report:
 * - key: the sk key's own quota, via the OpenAI-compatible billing endpoints
 * - account: the user wallet balance, via /api/user/self — only when
 *   relays.json holds a console access token for this origin (an sk key can
 *   never see the wallet; unlimited-quota keys only report their own usage)
 * Returns null when neither is available (official vendors usually 404 or
 * serve an HTML page).
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

  const [key, account] = await Promise.all([
    fetchKeyBalance(origin, apiKey),
    fetchAccountBalance(origin),
  ]);

  if (!key && !account) return null;
  return { key, account };
}

async function fetchKeyBalance(
  origin: string,
  apiKey: string,
): Promise<RelayBalanceSide | null> {
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

// ~/.claudex-switch/relays.json, keyed by relay origin:
//   { "https://relay.example.com": { "accessToken": "...", "userId": 42 } }
// accessToken is the relay console's 系统访问令牌 (system access token, NOT
// an sk API key); userId is optional (sent as the New-Api-User header for
// deployments that require it), quotaPerUnit overrides the site's
// quota-per-dollar ratio (otherwise read from /api/status).
export async function getRelayConfig(
  origin: string,
): Promise<RelayConfig | null> {
  const relays = await readJson<Record<string, RelayConfig>>(RELAYS_FILE, {});
  const config = relays[origin];
  if (!config || typeof config.accessToken !== "string" || !config.accessToken) {
    return null;
  }
  return config;
}

export async function saveRelayConfig(
  origin: string,
  config: RelayConfig,
): Promise<void> {
  const relays = await readJson<Record<string, RelayConfig>>(RELAYS_FILE, {});
  relays[origin] = config;
  await mkdir(dirname(RELAYS_FILE), { recursive: true });
  await writeJsonSecure(RELAYS_FILE, relays);
}

export interface RelayStatus {
  systemName: string | null;
  quotaPerUnit: number | null;
}

/**
 * Detect whether an origin is a one-api/new-api-family relay by its public
 * /api/status endpoint (it always carries quota_per_unit / system_name).
 * Official vendors 404 or answer with HTML, both of which return null.
 */
export async function detectRelay(origin: string): Promise<RelayStatus | null> {
  const status = await getJson(`${origin}/api/status`, {});
  const data =
    status?.data && typeof status.data === "object"
      ? (status.data as Record<string, unknown>)
      : null;
  if (!data) return null;

  const quotaPerUnit = toNumber(data.quota_per_unit);
  const systemName =
    typeof data.system_name === "string" ? data.system_name : null;
  if (quotaPerUnit === null && systemName === null) return null;

  return { systemName, quotaPerUnit };
}

async function fetchAccountBalance(
  origin: string,
): Promise<RelayBalanceSide | null> {
  const config = await getRelayConfig(origin);
  if (!config) return null;
  return fetchAccountBalanceWith(origin, config);
}

/**
 * Fetch the account wallet balance with explicit credentials — also used by
 * `add` to validate a just-entered access token before saving it.
 */
export async function fetchAccountBalanceWith(
  origin: string,
  config: RelayConfig,
): Promise<RelayBalanceSide | null> {
  const headers: Record<string, string> = {
    Authorization: config.accessToken,
  };
  if (config.userId !== undefined) {
    headers["New-Api-User"] = String(config.userId);
  }

  const [self, status] = await Promise.all([
    getJson(`${origin}/api/user/self`, headers),
    typeof config.quotaPerUnit === "number"
      ? Promise.resolve(null)
      : getJson(`${origin}/api/status`, {}),
  ]);

  if (self?.success !== true) return null;
  const data = self.data;
  if (!data || typeof data !== "object") return null;
  const quota = toNumber((data as Record<string, unknown>).quota);
  if (quota === null) return null;
  const usedQuota = toNumber((data as Record<string, unknown>).used_quota);

  const statusData =
    status?.data && typeof status.data === "object"
      ? (status.data as Record<string, unknown>)
      : null;
  const quotaPerUnit =
    typeof config.quotaPerUnit === "number"
      ? config.quotaPerUnit
      : (statusData && toNumber(statusData.quota_per_unit)) ??
        DEFAULT_QUOTA_PER_UNIT;

  return {
    unlimited: false,
    remainingUsd: quota / quotaPerUnit,
    usedUsd: usedQuota === null ? null : usedQuota / quotaPerUnit,
  };
}

// Some relay forks serialize numeric fields as strings.
function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
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
