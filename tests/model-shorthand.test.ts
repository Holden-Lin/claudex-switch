import { describe, expect, test } from "bun:test";
import { resolveModelShorthand } from "../src/lib/model-shorthand";

describe("resolveModelShorthand", () => {
  test("expands a bare claude version into the opus series", () => {
    expect(resolveModelShorthand("claude", "4.8")).toBe("claude-opus-4-8");
    expect(resolveModelShorthand("claude", "4.7")).toBe("claude-opus-4-7");
    expect(resolveModelShorthand("claude", "4.6")).toBe("claude-opus-4-6");
  });

  test("accepts an explicit claude series prefix", () => {
    expect(resolveModelShorthand("claude", "opus-4.8")).toBe(
      "claude-opus-4-8",
    );
    expect(resolveModelShorthand("claude", "sonnet-4.6")).toBe(
      "claude-sonnet-4-6",
    );
    expect(resolveModelShorthand("claude", "haiku-4.5")).toBe(
      "claude-haiku-4-5",
    );
    expect(resolveModelShorthand("claude", "fable-5")).toBe("claude-fable-5");
    expect(resolveModelShorthand("claude", "opus4.8")).toBe("claude-opus-4-8");
  });

  test("expands a bare codex version into the gpt series", () => {
    expect(resolveModelShorthand("codex", "5.5")).toBe("gpt-5.5");
    expect(resolveModelShorthand("codex", "5.4")).toBe("gpt-5.4");
    expect(resolveModelShorthand("codex", "5")).toBe("gpt-5");
  });

  test("accepts an explicit gpt prefix", () => {
    expect(resolveModelShorthand("codex", "gpt-5.5")).toBe("gpt-5.5");
    expect(resolveModelShorthand("codex", "gpt5.5")).toBe("gpt-5.5");
  });

  test("passes through fully qualified model ids unchanged", () => {
    expect(
      resolveModelShorthand("claude", "claude-sonnet-4-20250514"),
    ).toBe("claude-sonnet-4-20250514");
    expect(resolveModelShorthand("codex", "gpt-5-mini")).toBe("gpt-5-mini");
    expect(resolveModelShorthand("codex", "gpt-5-codex")).toBe("gpt-5-codex");
  });

  test("trims whitespace and preserves empty input", () => {
    expect(resolveModelShorthand("claude", "  4.8  ")).toBe(
      "claude-opus-4-8",
    );
    expect(resolveModelShorthand("codex", "")).toBe("");
  });
});
