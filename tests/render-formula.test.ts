import { describe, expect, test } from "bun:test";
import { spawnSync } from "child_process";
import { createHash } from "crypto";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

describe("render-formula.sh", () => {
  test("renders release urls and checksums for every platform asset", async () => {
    const assetDir = await mkdtemp(
      join(tmpdir(), "claudex-switch-formula-test-"),
    );

    try {
      const assets = {
        "claudex-switch-darwin-arm64.tar.gz": "darwin-arm64",
        "claudex-switch-darwin-x64.tar.gz": "darwin-x64",
        "claudex-switch-linux-arm64.tar.gz": "linux-arm64",
        "claudex-switch-linux-x64.tar.gz": "linux-x64",
      };

      for (const [file, content] of Object.entries(assets)) {
        await writeFile(join(assetDir, file), content);
      }

      const result = spawnSync(
        "bash",
        ["./scripts/render-formula.sh", "v1.2.3", assetDir],
        {
          cwd: process.cwd(),
          encoding: "utf-8",
        },
      );

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('class ClaudexSwitch < Formula');
      expect(result.stdout).toContain('version "1.2.3"');
      expect(result.stdout).toContain(
        "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.2.3/claudex-switch-darwin-arm64.tar.gz",
      );

      const darwinArm64Sha = createHash("sha256")
        .update("darwin-arm64")
        .digest("hex");
      const linuxX64Sha = createHash("sha256")
        .update("linux-x64")
        .digest("hex");

      expect(result.stdout).toContain(darwinArm64Sha);
      expect(result.stdout).toContain(linuxX64Sha);
    } finally {
      await rm(assetDir, { recursive: true, force: true });
    }
  });
});
