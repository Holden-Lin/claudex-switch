import { describe, expect, test } from "bun:test";
import {
  isModelEffort,
  resolveModelShorthand,
  splitModelEffort,
} from "../src/lib/model-shorthand";

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

  test("expands a bare claude 5.x version into the fable series", () => {
    expect(resolveModelShorthand("claude", "5")).toBe("claude-fable-5");
    expect(resolveModelShorthand("claude", "5.1")).toBe("claude-fable-5-1");
    expect(resolveModelShorthand("claude", "fable5")).toBe("claude-fable-5");
    expect(resolveModelShorthand("claude", "opus-5")).toBe("claude-opus-5");
  });

  test("expands a bare codex version into the gpt series", () => {
    expect(resolveModelShorthand("codex", "5.5")).toBe("gpt-5.5");
    expect(resolveModelShorthand("codex", "5.4")).toBe("gpt-5.4");
    expect(resolveModelShorthand("codex", "5")).toBe("gpt-5");
  });

  test("maps aliased codex versions to their full model id", () => {
    expect(resolveModelShorthand("codex", "5.6")).toBe("gpt-5.6-sol");
    expect(resolveModelShorthand("codex", "gpt-5.6")).toBe("gpt-5.6-sol");
    expect(resolveModelShorthand("codex", "gpt5.6")).toBe("gpt-5.6-sol");
    expect(resolveModelShorthand("codex", "gpt-5.6-sol")).toBe("gpt-5.6-sol");
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

describe("splitModelEffort", () => {
  test("splits a trailing effort tier off the model", () => {
    expect(splitModelEffort("4.8 max")).toEqual({
      model: "4.8",
      effort: "max",
    });
    expect(splitModelEffort("5.6 XHigh")).toEqual({
      model: "5.6",
      effort: "xhigh",
    });
  });

  test("leaves non-effort suffixes untouched", () => {
    expect(splitModelEffort("4.8")).toEqual({ model: "4.8" });
    expect(splitModelEffort("gpt-5 turbo")).toEqual({ model: "gpt-5 turbo" });
  });
});

describe("isModelEffort", () => {
  test("recognizes effort tiers case-insensitively", () => {
    expect(isModelEffort("max")).toBe(true);
    expect(isModelEffort("XHIGH")).toBe(true);
    expect(isModelEffort("minimal")).toBe(true);
    expect(isModelEffort("turbo")).toBe(false);
    expect(isModelEffort(undefined)).toBe(false);
  });
});
