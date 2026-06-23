export type ModelProvider = "claude" | "codex";

const CLAUDE_SHORTHAND = /^(?:(opus|sonnet|haiku|fable)[-]?)?(\d+(?:\.\d+)*)$/i;
const CODEX_SHORTHAND = /^(?:gpt-?)?(\d+(?:\.\d+)*)$/i;

export function resolveModelShorthand(
  provider: ModelProvider,
  input: string,
): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;

  if (provider === "claude") {
    const match = trimmed.match(CLAUDE_SHORTHAND);
    if (match) {
      const series = (match[1] ?? "opus").toLowerCase();
      const version = match[2].replace(/\./g, "-");
      return `claude-${series}-${version}`;
    }
    return trimmed;
  }

  const match = trimmed.match(CODEX_SHORTHAND);
  if (match) {
    return `gpt-${match[1]}`;
  }
  return trimmed;
}
