import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";
import packageJson from "../package.json";

describe("dist bundle metadata", () => {
  test("keeps the committed dist version in sync with package.json", () => {
    const bundle = readFileSync("./dist/claudex-switch.js", "utf-8");
    const match = bundle.match(
      /name:\s*"claudex-switch",\s+version:\s*"([^"]+)"/,
    );

    expect(match?.[1]).toBe(packageJson.version);
  });
});
