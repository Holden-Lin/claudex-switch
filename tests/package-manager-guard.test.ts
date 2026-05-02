import { describe, expect, test } from "bun:test";
import { spawnSync } from "child_process";

describe("package manager guard", () => {
  test("rejects npm installs with installer guidance", () => {
    const result = spawnSync("node", ["./scripts/guard-package-manager.js"], {
      cwd: process.cwd(),
      encoding: "utf-8",
      env: {
        ...process.env,
        npm_config_user_agent: "npm/10.9.0 node/v20.9.0 darwin arm64",
      },
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("does not support npm installs");
    expect(result.stderr).toContain("install.sh");
    expect(result.stderr).toContain("bun install -g");
  });

  test("allows bun installs", () => {
    const result = spawnSync("node", ["./scripts/guard-package-manager.js"], {
      cwd: process.cwd(),
      encoding: "utf-8",
      env: {
        ...process.env,
        npm_config_user_agent: "bun/1.3.11 npm/? node/v24.3.0 darwin arm64",
      },
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
  });
});
