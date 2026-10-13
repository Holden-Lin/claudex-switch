// Which subscription a managed CLIProxyAPI translates for Claude Code. The
// lifecycle (private dir, key, port, locks, leases) is shared; only these
// facts differ per upstream. Profiles written before upstreams existed have
// no marker and are ChatGPT/Codex.
export type CLIProxyAPIUpstream = "codex" | "antigravity" | "opencode-go";

export interface CLIProxyAPIModelMap {
  fableModel: string;
  sonnetModel: string;
  opusModel: string;
  haikuModel: string;
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

export const CLI_PROXY_API_UPSTREAMS: Record<CLIProxyAPIUpstream, CLIProxyAPIUpstreamSpec> = {
  codex: {
    label: "ChatGPT",
    loginFlag: "-codex-login",
    // CLIProxyAPI's Codex authorize URL hard-codes this redirect URI even when
    // `-oauth-callback-port` is accepted, so the real port is preflighted.
    callbackPort: 1455,
    authType: "codex",
    defaults: {
      fableModel: "gpt-6-astra",
      sonnetModel: "gpt-5.6-terra",
      opusModel: "gpt-5.6-terra",
      haikuModel: "gpt-6-luna",
    },
  },
  antigravity: {
    label: "Antigravity",
    loginFlag: "-antigravity-login",
    callbackPort: 51121,
    authType: "antigravity",
    // Starting points only: the real ids are read from the logged-in proxy's
    // /v1/models and written to the private .env (pickAntigravityModels).
    defaults: {
      fableModel: "claude-opus-5-5",
      sonnetModel: "claude-sonnet-5-5",
      opusModel: "claude-opus-5-5",
      haikuModel: "gemini-3.8-flash",
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
  return value === "antigravity" || value === "opencode-go" ? value : "codex";
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

function newest(ids: string[]): string | undefined {
  return [...ids].sort((a, b) => {
    const va = versionKey(a);
    const vb = versionKey(b);
    for (let i = 0; i < Math.max(va.length, vb.length); i++) {
      const diff = (vb[i] ?? -1) - (va[i] ?? -1);
      if (diff !== 0) return diff;
    }
    // Same version: the plain id beats "-thinking"/"-high" style variants,
    // since Claude Code sends its own thinking/effort settings.
    return a.length - b.length;
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
