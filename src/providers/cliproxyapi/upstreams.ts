// Which subscription a managed CLIProxyAPI translates for Claude Code. The
// lifecycle (private dir, key, port, locks, leases) is shared; only these
// facts differ per upstream. Profiles written before upstreams existed have
// no marker and are ChatGPT/Codex.
import type { SubscriptionUpstream } from "../subscription-plugins";

export type CLIProxyAPIUpstream = "codex" | "antigravity" | "opencode-go" | SubscriptionUpstream;

export interface CLIProxyAPIModelMap {
  fableModel: string;
  sonnetModel: string;
  opusModel: string;
  haikuModel: string;
}

export interface CLIProxyAPIModel {
  id: string;
  display_name?: string;
}

export interface CLIProxyAPIUpstreamSpec {
  label: string;
  /** CLIProxyAPI OAuth flag; null for upstreams configured with an API key. */
  loginFlag: string | null;
  /** Fixed loopback OAuth callback port that must be free before login. */
  callbackPort: number | null;
  /** `type` of the one credential file the login leaves in auth-dir. */
  authType: string | null;
  defaults: CLIProxyAPIModelMap;
}

// Plugin logins and account-specific model discovery happen outside the
// converter. These tier placeholders never reach a running client.
const SUBSCRIPTION_SPEC = {
  loginFlag: null, callbackPort: null, authType: null,
  defaults: { fableModel: "fable", opusModel: "opus", sonnetModel: "sonnet", haikuModel: "haiku" },
};

export const CLI_PROXY_API_UPSTREAMS: Record<CLIProxyAPIUpstream, CLIProxyAPIUpstreamSpec> = {
  cursor: { ...SUBSCRIPTION_SPEC, label: "Cursor" },
  workbuddy: { ...SUBSCRIPTION_SPEC, label: "WorkBuddy (China)" },
  "workbuddy-ai": { ...SUBSCRIPTION_SPEC, label: "WorkBuddy AI (international)" },
  codex: {
    label: "ChatGPT",
    loginFlag: "-codex-login",
    // CLIProxyAPI's Codex authorize URL hard-codes this redirect URI even when
    // `-oauth-callback-port` is accepted, so the real port is preflighted.
    callbackPort: 1455,
    authType: "codex",
    defaults: {
      fableModel: "gpt-6-astra",
      sonnetModel: "gpt-6.1-terra",
      opusModel: "gpt-6.1-terra",
      haikuModel: "gpt-6-luna",
    },
  },
  antigravity: {
    label: "Antigravity",
    loginFlag: "-antigravity-login",
    callbackPort: 51121,
    authType: "antigravity",
    // Placeholders only. Startup must discover registered IDs before these
    // can reach Claude Code; upstream versions and tier suffixes change.
    defaults: {
      fableModel: "fable",
      sonnetModel: "sonnet",
      opusModel: "opus",
      haikuModel: "haiku",
    },
  },
  "opencode-go": {
    label: "OpenCode Go",
    loginFlag: null,
    callbackPort: null,
    authType: null,
    defaults: {
      fableModel: "kimi-k3",
      sonnetModel: "glm-5.3",
      opusModel: "kimi-k3",
      haikuModel: "deepseek-v4-flash",
    },
  },
};

export function parseUpstream(value: string | undefined): CLIProxyAPIUpstream {
  if (!value || value === "codex") return "codex";
  if (Object.hasOwn(CLI_PROXY_API_UPSTREAMS, value)) return value as CLIProxyAPIUpstream;
  throw new Error(`Unknown managed proxy upstream: ${value}`);
}

/** A priced catalog's free (x0.00) models now and at the last sync (null: never recorded). */
export interface SubscriptionPricing {
  free: string[];
  previousFree: string[] | null;
  context: Record<string, number>;
}

const FAST_MODEL = /haiku|flash|mini/i;

/** Pick only IDs supplied by the subscription's account-specific catalog. */
export function pickSubscriptionModels(ids: string[], current?: CLIProxyAPIModelMap, pricing?: SubscriptionPricing): CLIProxyAPIModelMap {
  if (!ids.length || ids.some((id) => !id.trim() || /[\r\n,=]/.test(id))) {
    throw new Error("The subscription returned an empty or invalid model catalog. Sign in again; no guessed models will be used.");
  }
  // WorkBuddy prices models in credits. Its Auto (default-model, first in the
  // catalog) spent a free plan's credits through Claude Code's own IDs and
  // then answered 14018, while x0.00 models kept serving (2026-10-29). When the
  // catalog says which models are free, every tier defaults to the widest one.
  const free = ids.filter((id) => pricing?.free.includes(id));
  const widest = (list: string[]) => [...list].sort((a, b) => (pricing?.context[b] ?? 0) - (pricing?.context[a] ?? 0))[0];
  const strongest = free.length ? widest(free)! : ids.includes("auto") ? "auto"
    : newest(ids.filter((id) => /claude.*opus/i.test(id)))
      ?? newest(ids.filter((id) => /claude.*sonnet/i.test(id))) ?? ids[0]!;
  const sonnet = free.length ? strongest : newest(ids.filter((id) => /claude.*sonnet/i.test(id))) ?? strongest;
  const fast = (free.length ? widest(free.filter((id) => FAST_MODEL.test(id))) : newest(ids.filter((id) => FAST_MODEL.test(id)))) ?? sonnet;
  // A paid tier that was paid at the last sync too was the user's own edit;
  // one never checked against prices, or free until now, moves to a free model.
  const keep = (tier: keyof CLIProxyAPIModelMap, fallback: string) => {
    const kept = current?.[tier];
    if (!kept || !ids.includes(kept)) return fallback;
    if (!free.length || free.includes(kept)) return kept;
    return pricing?.previousFree && !pricing.previousFree.includes(kept) ? kept : fallback;
  };
  return {
    fableModel: keep("fableModel", strongest), opusModel: keep("opusModel", strongest),
    sonnetModel: keep("sonnetModel", sonnet), haikuModel: keep("haikuModel", fast),
  };
}

// OpenCode Go serves one base URL over two wire formats. Most models speak
// OpenAI chat completions; these families only answer Anthropic Messages.
export const OPENCODE_GO_OPENAI_BASE_URL = "https://opencode.ai/zen/go/v1";
export const OPENCODE_GO_ANTHROPIC_BASE_URL = "https://opencode.ai/zen/go";

export function isOpenCodeGoMessagesModel(model: string): boolean {
  return /^(minimax-|qwen|claude-)/i.test(model);
}

function versionKey(id: string): number[] {
  return (id.match(/\d+/g) ?? []).map(Number);
}

const MODEL_VARIANT_ORDER = ["high", "max", "thinking", "medium", "low"];

export function antigravityModelBase(id: string): string {
  return id.replace(/-(thinking|max|high|medium|low)$/i, "");
}

function variantRank(id: string): number {
  const suffix = id.match(/-(thinking|max|high|medium|low)$/i)?.[1]?.toLowerCase();
  return suffix ? MODEL_VARIANT_ORDER.indexOf(suffix) + 1 : 0;
}

function newest(ids: string[]): string | undefined {
  return [...ids].sort((a, b) => {
    const va = versionKey(a);
    const vb = versionKey(b);
    for (let i = 0; i < Math.max(va.length, vb.length); i++) {
      const diff = (vb[i] ?? -1) - (va[i] ?? -1);
      if (diff !== 0) return diff;
    }
    // Keep a plain ID first. Otherwise prefer the normal high tier; string
    // length would accidentally choose low when a provider adds more tiers.
    return variantRank(a) - variantRank(b) || a.localeCompare(b);
  })[0];
}

/** Choose tier mappings from the models the logged-in Antigravity proxy lists. */
export function pickAntigravityModels(ids: string[]): CLIProxyAPIModelMap | null {
  const opus = newest(ids.filter((id) => /^claude-opus-/i.test(id)));
  const sonnet = newest(ids.filter((id) => /^claude-sonnet-/i.test(id)));
  const flash = newest(
    ids.filter((id) => /^gemini-.*flash/i.test(id) && !/(image|lite)/i.test(id)),
  );
  const strongest = opus ?? sonnet;
  if (!strongest) return null;
  return {
    fableModel: strongest,
    opusModel: strongest,
    sonnetModel: sonnet ?? strongest,
    haikuModel: flash ?? sonnet ?? strongest,
  };
}

/** Match an obsolete bare ID only to a registered variant of that version. */
export function matchAntigravityModel(input: string, ids: string[]): string | undefined {
  if (ids.includes(input)) return input;
  const stem = antigravityModelBase(input);
  return newest(ids.filter((id) => antigravityModelBase(id) === stem));
}

// "claude-opus-5-5-high" → "claude-opus-#": same family, any version.
function modelFamily(id: string): string {
  return antigravityModelBase(id).replace(/\d+(?:[.-]\d+)*/g, "#");
}

/** A Claude version Antigravity still lists after a newer one (retired upstream). */
export function isSupersededAntigravityClaude(id: string, ids: string[]): boolean {
  if (!/^claude-/i.test(id)) return false;
  const base = antigravityModelBase(id);
  return ids.some((other) => modelFamily(other) === modelFamily(id)
    && antigravityModelBase(other) !== base && newest([id, other]) === other);
}

/** Keep valid user choices; repair missing or superseded tiers from the catalog. */
export function reconcileAntigravityModels(
  ids: string[],
  current: CLIProxyAPIModelMap,
): CLIProxyAPIModelMap {
  const defaults = pickAntigravityModels(ids);
  if (!defaults) {
    throw new Error("Antigravity's model catalog has no supported Claude models. Check its login and CLIProxyAPI version; no guessed model will be used.");
  }
  // Antigravity keeps listing retired Claude versions (Opus 4.6 answers only
  // "no longer available"); such a tier moves to its family's newest model.
  const pick = (tier: keyof CLIProxyAPIModelMap) => {
    const kept = matchAntigravityModel(current[tier], ids);
    if (!kept) return defaults[tier];
    if (!isSupersededAntigravityClaude(kept, ids)) return kept;
    return newest(ids.filter((id) => modelFamily(id) === modelFamily(kept))) ?? defaults[tier];
  };
  return {
    fableModel: pick("fableModel"), opusModel: pick("opusModel"),
    sonnetModel: pick("sonnetModel"), haikuModel: pick("haikuModel"),
  };
}

/** Keep the OpenCode Go defaults that the live catalog still lists. */
export function pickOpenCodeGoModels(catalog: Set<string> | null): CLIProxyAPIModelMap {
  const defaults = CLI_PROXY_API_UPSTREAMS["opencode-go"].defaults;
  if (!catalog || catalog.size === 0) return defaults;
  const ids = [...catalog];
  const pick = (preferred: string, family: RegExp): string =>
    catalog.has(preferred) ? preferred : newest(ids.filter((id) => family.test(id))) ?? preferred;
  return {
    fableModel: pick(defaults.fableModel, /^kimi-/),
    opusModel: pick(defaults.opusModel, /^kimi-/),
    sonnetModel: pick(defaults.sonnetModel, /^glm-(?!.*flash)/),
    haikuModel: pick(defaults.haikuModel, /^deepseek-.*flash$/),
  };
}
