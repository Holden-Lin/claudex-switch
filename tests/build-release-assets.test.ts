import { describe, expect, test } from "bun:test";
import { spawnSync } from "child_process";
import { createHash } from "crypto";
import { existsSync } from "fs";
import { copyFile, mkdtemp, mkdir, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

describe("build-release-assets.sh", () => {
  test("bundles the binary and license notices in every platform archive", async () => {
    const root = await mkdtemp(join(tmpdir(), "claudex-switch-release-test-"));
    const binDir = join(root, "bin");
    const outputDir = join(root, "release");
    const fakeBun = join(binDir, "bun");

    try {
      await mkdir(binDir);
      await writeFile(
        fakeBun,
        `#!/usr/bin/env bash
set -euo pipefail
out=""
for arg in "$@"; do
  case "$arg" in
    --outfile=*) out="\${arg#--outfile=}" ;;
  esac
done
test -n "$out"
printf 'fixture binary\\n' > "$out"
chmod +x "$out"
`,
        { mode: 0o755 },
      );

      const result = spawnSync(
        "bash",
        ["./scripts/build-release-assets.sh", outputDir],
        {
          cwd: process.cwd(),
          encoding: "utf-8",
          env: { ...process.env, PATH: `${binDir}:${process.env.PATH ?? ""}` },
        },
      );

      expect(result.status).toBe(0);
      expect(result.stderr).toBe("");

      const expectedArchives = [
        "claudex-switch-darwin-arm64.tar.gz",
        "claudex-switch-darwin-x64.tar.gz",
        "claudex-switch-linux-arm64.tar.gz",
        "claudex-switch-linux-x64.tar.gz",
      ];
      for (const archive of expectedArchives) {
        const listing = spawnSync("tar", ["-tzf", join(outputDir, archive)], {
          encoding: "utf-8",
        });
        expect(listing.status).toBe(0);
        expect(listing.stdout.split("\n")).toEqual([
          "claudex-switch",
          "LICENSE",
          "COMMERCIAL-LICENSING.md",
          "",
        ]);

        for (const noticeFile of ["LICENSE", "COMMERCIAL-LICENSING.md"]) {
          const archivedNotice = spawnSync(
            "tar",
            ["-xOzf", join(outputDir, archive), noticeFile],
            { encoding: "utf-8" },
          );
          expect(archivedNotice.status).toBe(0);
          expect(archivedNotice.stdout).toBe(
            await readFile(join(process.cwd(), noticeFile), "utf-8"),
          );
        }
      }

      const releaseLicense = await readFile(join(outputDir, "LICENSE"), "utf-8");
      const notice = await readFile(
        join(outputDir, "COMMERCIAL-LICENSING.md"),
        "utf-8",
      );
      expect(releaseLicense).toContain("Commons Clause");
      expect(notice).toContain("public v1.14.0 release retains its prior MIT declaration");
      const checksumLines = (await readFile(
        join(outputDir, "checksums.txt"),
        "utf-8",
      )).trim().split("\n");
      expect(checksumLines).toHaveLength(expectedArchives.length);
      for (const archive of expectedArchives) {
        const line = checksumLines.find((entry) => entry.endsWith(archive));
        expect(line?.split(/\s+/)[0]).toBe(
          createHash("sha256")
            .update(await readFile(join(outputDir, archive)))
            .digest("hex"),
        );
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  test("fails before packaging when a required license notice is absent", async () => {
    const workspace = await mkdtemp(
      join(tmpdir(), "claudex-switch-missing-license-test-"),
    );
    const outputDir = join(workspace, "release");

    try {
      await mkdir(join(workspace, "scripts"));
      await copyFile(
        join(process.cwd(), "scripts/build-release-assets.sh"),
        join(workspace, "scripts/build-release-assets.sh"),
      );
      await writeFile(join(workspace, "LICENSE"), "fixture license\n");

      const result = spawnSync(
        "bash",
        ["./scripts/build-release-assets.sh", outputDir],
        {
          cwd: workspace,
          encoding: "utf-8",
          env: { ...process.env, PATH: "/usr/bin:/bin" },
        },
      );

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Missing required release notice: COMMERCIAL-LICENSING.md");
      expect(existsSync(outputDir)).toBe(false);
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });
});
