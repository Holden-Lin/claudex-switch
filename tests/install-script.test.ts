import { describe, expect, test } from "bun:test";
import { spawnSync } from "child_process";
import {
  chmod,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

async function writeExecutable(
  filePath: string,
  content: string,
): Promise<void> {
  await writeFile(filePath, content);
  await chmod(filePath, 0o755);
}

async function createFakeInstallerEnv() {
  const rootDir = await mkdtemp(
    join(tmpdir(), "claudex-switch-install-test-"),
  );
  const fakeBinDir = join(rootDir, "fake-bin");
  const bunInstallDir = join(rootDir, "bun-home");
  const logFile = join(rootDir, "commands.log");

  await mkdir(fakeBinDir, { recursive: true });
  await mkdir(join(bunInstallDir, "bin"), { recursive: true });

  await writeExecutable(
    join(fakeBinDir, "curl"),
    `#!/usr/bin/env bash
set -euo pipefail

printf 'curl %s\\n' "$*" >>"$CLAUDEX_FAKE_LOG"

if [[ "$*" == *"/releases/latest"* ]]; then
  if [ -n "\${CLAUDEX_FAKE_LATEST_TAG:-}" ]; then
    printf '{"tag_name":"%s"}\\n' "$CLAUDEX_FAKE_LATEST_TAG"
    exit 0
  fi

  exit 1
fi

printf 'unexpected curl invocation: %s\\n' "$*" >&2
exit 1
`,
  );

  await writeExecutable(
    join(fakeBinDir, "bun"),
    `#!/usr/bin/env bash
set -euo pipefail

printf 'bun %s\\n' "$*" >>"$CLAUDEX_FAKE_LOG"

if [ "\${1:-}" = "remove" ] && [ "\${2:-}" = "-g" ] && [ "\${3:-}" = "claudex-switch" ]; then
  exit 0
fi

if [ "\${1:-}" = "install" ] && [ "\${2:-}" = "-g" ]; then
  mkdir -p "$BUN_INSTALL/bin"
  cat >"$BUN_INSTALL/bin/claudex-switch" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF
  chmod +x "$BUN_INSTALL/bin/claudex-switch"
  exit 0
fi

printf 'unexpected bun invocation: %s\\n' "$*" >&2
exit 1
`,
  );

  return {
    bunInstallDir,
    fakeBinDir,
    logFile,
    rootDir,
  };
}

function runInstallScript(env: Record<string, string | undefined>) {
  return spawnSync("bash", ["./install.sh"], {
    cwd: process.cwd(),
    encoding: "utf-8",
    env: {
      ...process.env,
      ...env,
    },
  });
}

describe("install.sh", () => {
  test("installs the latest release by default when one exists", async () => {
    const fakeEnv = await createFakeInstallerEnv();

    try {
      const result = runInstallScript({
        BUN_INSTALL: fakeEnv.bunInstallDir,
        CLAUDEX_FAKE_LOG: fakeEnv.logFile,
        CLAUDEX_FAKE_LATEST_TAG: "v9.8.7",
        HOME: fakeEnv.rootDir,
        PATH: `${fakeEnv.fakeBinDir}:${process.env.PATH ?? ""}`,
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toContain(
        "Installing claudex-switch from v9.8.7",
      );

      const log = await readFile(fakeEnv.logFile, "utf-8");

      expect(log).toContain(
        "curl -fsSL https://api.github.com/repos/Holden-Lin/claudex-switch/releases/latest",
      );
      expect(log).toContain(
        "bun install -g git+https://github.com/Holden-Lin/claudex-switch.git#v9.8.7",
      );
    } finally {
      await rm(fakeEnv.rootDir, { recursive: true, force: true });
    }
  });

  test("removes the existing global install before reinstalling a pinned version", async () => {
    const fakeEnv = await createFakeInstallerEnv();

    try {
      const result = runInstallScript({
        BUN_INSTALL: fakeEnv.bunInstallDir,
        CLAUDEX_FAKE_LOG: fakeEnv.logFile,
        HOME: fakeEnv.rootDir,
        PATH: `${fakeEnv.fakeBinDir}:${process.env.PATH ?? ""}`,
        VERSION: "1.1.1",
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toContain(
        "Installing claudex-switch from v1.1.1",
      );

      const log = await readFile(fakeEnv.logFile, "utf-8");
      const lines = log
        .trim()
        .split("\n")
        .filter((line) => line.length > 0);

      expect(lines).toEqual([
        "bun remove -g claudex-switch",
        "bun install -g git+https://github.com/Holden-Lin/claudex-switch.git#v1.1.1",
      ]);
    } finally {
      await rm(fakeEnv.rootDir, { recursive: true, force: true });
    }
  });
});
