import { describe, expect, test } from "bun:test";
import {
  parseCLIProxyAPIVersion,
  readCLIProxyAPIVersion,
  supportsAntigravityToolHistory,
} from "../src/providers/cliproxyapi/version";
import { join } from "path";

describe("CLIProxyAPI tool-history compatibility", () => {
  test("parses the official help banner rather than config or log numbers", () => {
    expect(parseCLIProxyAPIVersion("CLIProxyAPI Version: 7.3.20, Commit: ef9e7120")).toBe("7.3.20");
    expect(parseCLIProxyAPIVersion("CLIProxyAPI Version: v7.3.19, BuiltAt: 2026-09-26")).toBe("7.3.19");
    expect(parseCLIProxyAPIVersion("fake proxy on port 7315")).toBeNull();
    expect(readCLIProxyAPIVersion(join(import.meta.dir, "fixtures", "fake-cliproxyapi"))).toBe("7.3.20");
    expect(readCLIProxyAPIVersion("/no/such/cliproxyapi")).toBeNull();
  });

  test.each(["7.3.15", "7.3.18", "7.2.999", "7.3.19-rc1", null])("rejects an unverified tool-history runtime: %s", (version) => {
    expect(supportsAntigravityToolHistory(version)).toBe(false);
  });

  test.each(["7.3.19", "7.3.20", "7.4.0", "8.0.0"])("recognizes versions containing the fix: %s", (version) => {
    expect(supportsAntigravityToolHistory(version)).toBe(true);
  });
});
