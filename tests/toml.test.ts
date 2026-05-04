import { describe, expect, test } from "bun:test";

const { parseToml } = await import("../src/lib/toml");

describe("toml parser", () => {
  test("parses top-level scalars", () => {
    const result = parseToml(`
model_provider = "hybaliez"
model = "gpt-5.5"
count = 42
enabled = true
disabled = false
`);
    expect(result).toEqual({
      model_provider: "hybaliez",
      model: "gpt-5.5",
      count: 42,
      enabled: true,
      disabled: false,
    });
  });

  test("parses table headers and nested values", () => {
    const result = parseToml(`
[features]
goals = true

[model_providers.hybaliez]
name = "hybaliez"
base_url = "https://example.com/v1"
requires_openai_auth = false
`);
    expect(result).toEqual({
      features: { goals: true },
      model_providers: {
        hybaliez: {
          name: "hybaliez",
          base_url: "https://example.com/v1",
          requires_openai_auth: false,
        },
      },
    });
  });

  test("handles quoted keys in table headers", () => {
    const result = parseToml(`
[projects."/Users/holden/code"]
trust_level = "trusted"

[tui.model_availability_nux]
"gpt-5.5" = 2
`);
    expect(result).toEqual({
      projects: {
        "/Users/holden/code": { trust_level: "trusted" },
      },
      tui: {
        model_availability_nux: { "gpt-5.5": 2 },
      },
    });
  });

  test("ignores comments and blank lines", () => {
    const result = parseToml(`
# top comment
key = "value" # inline comment

# another comment
num = 1
`);
    expect(result).toEqual({ key: "value", num: 1 });
  });

  test("handles escaped characters in strings", () => {
    const result = parseToml(`path = "C:\\\\Users\\\\test"`);
    expect(result).toEqual({ path: "C:\\Users\\test" });
  });

  test("returns empty object for empty input", () => {
    expect(parseToml("")).toEqual({});
    expect(parseToml("  \n\n  ")).toEqual({});
  });

  test("parses full codex config format", () => {
    const input = `model_provider = "hybaliez"
model = "gpt-5.5"

[features]
goals = true

[projects."/Users/holden/programming/prediction_arbitrage"]
trust_level = "trusted"

[projects."/Users/holden/programming/meta-agent"]
trust_level = "trusted"

[tui.model_availability_nux]
"gpt-5.5" = 2

[model_providers.hybaliez]
name = "hybaliez"
base_url = "https://newapi.hybaliez.com/v1"
requires_openai_auth = false
experimental_bearer_token = "sk-test123"
`;
    const result = parseToml(input);
    expect(result.model_provider).toBe("hybaliez");
    expect(result.model).toBe("gpt-5.5");
    expect((result.features as Record<string, unknown>).goals).toBe(true);
    expect(
      (
        (result.projects as Record<string, unknown>)[
          "/Users/holden/programming/prediction_arbitrage"
        ] as Record<string, unknown>
      ).trust_level,
    ).toBe("trusted");
    expect(
      (
        (result.model_providers as Record<string, unknown>)
          .hybaliez as Record<string, unknown>
      ).experimental_bearer_token,
    ).toBe("sk-test123");
  });
});
