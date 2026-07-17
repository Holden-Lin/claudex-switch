export type ModelProvider = "claude" | "codex";

const CLAUDE_SHORTHAND = /^(?:(opus|sonnet|haiku|fable)[-]?)?(\d+(?:\.\d+)*)$/i;
const CODEX_SHORTHAND = /^(?:gpt-?)?(\d+(?:\.\d+)*)$/i;

// Effort tiers accepted right after a model shorthand ("--model 4.8 max").
// Claude gets them via --effort, codex via -c model_reasoning_effort=...;
// the two CLIs support different tiers, so run.ts validates per provider
// after parsing (the union below only decides what parses as an effort).
const CLAUDE_EFFORT_LEVELS = new Set([
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
  "ultracode",
]);
const CODEX_EFFORT_LEVELS = new Set([
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
]);
const MODEL_EFFORT_LEVELS = new Set([
  ...CLAUDE_EFFORT_LEVELS,
  ...CODEX_EFFORT_LEVELS,
]);

// Codex model ids that differ from the bare gpt-<version> pattern.
const CODEX_MODEL_ALIASES: Record<string, string> = {
  "gpt-5.6": "gpt-5.6-sol",
};

// Claude 5+ ships under the fable series, 4.x and older under opus.
function defaultClaudeSeries(version: string): string {
  const major = Number.parseInt(version, 10);
  return major >= 5 ? "fable" : "opus";
}

export function isModelEffort(value: string | undefined): value is string {
  return value !== undefined && MODEL_EFFORT_LEVELS.has(value.toLowerCase());
}

export function providerEffortLevels(provider: ModelProvider): Set<string> {
  return provider === "claude" ? CLAUDE_EFFORT_LEVELS : CODEX_EFFORT_LEVELS;
}

export interface ModelWithEffort {
  model: string;
  effort?: string;
}

export function splitModelEffort(input: string): ModelWithEffort {
  const parts = input.trim().split(/\s+/);
  if (parts.length === 2 && isModelEffort(parts[1])) {
    return { model: parts[0], effort: parts[1].toLowerCase() };
  }
  return { model: input.trim() };
}

export function resolveModelShorthand(
  provider: ModelProvider,
  input: string,
): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;

  if (provider === "claude") {
    const match = trimmed.match(CLAUDE_SHORTHAND);
    if (match) {
      const series = (
        match[1] ?? defaultClaudeSeries(match[2])
      ).toLowerCase();
      const version = match[2].replace(/\./g, "-");
      return `claude-${series}-${version}`;
    }
    return trimmed;
  }

  const match = trimmed.match(CODEX_SHORTHAND);
  if (match) {
    const model = `gpt-${match[1]}`;
    // An explicitly typed gpt-* id is honored verbatim — the alias table only
    // expands bare version shorthands, so "gpt-5.6" remains requestable.
    if (/^gpt/i.test(trimmed)) return model;
    return CODEX_MODEL_ALIASES[model] ?? model;
  }
  return trimmed;
}
