import { describe, expect, test } from "bun:test";
import packageJson from "../package.json";
import {
  checkForLatestUpdate,
  compareVersions,
  detectInstallMethod,
  extractVersionFromReleaseUrl,
  getVersionCheck,
  installLatestUpdate,
  runAutoUpdateIfNeeded,
} from "../src/lib/update";

describe("auto update", () => {
  test("compares semantic versions correctly", () => {
    expect(compareVersions("1.2.0", "1.1.9")).toBe(1);
    expect(compareVersions("1.1.1", "v1.1.1")).toBe(0);
    expect(compareVersions("1.1.0", "1.1.1")).toBe(-1);
  });

  test("extracts release versions from redirect URLs", () => {
    expect(
      extractVersionFromReleaseUrl(
        "https://github.com/Holden-Lin/claudex-switch/releases/tag/v1.2.3",
      ),
    ).toBe("1.2.3");
    expect(
      extractVersionFromReleaseUrl(
        "https://github.com/Holden-Lin/claudex-switch/releases/latest",
      ),
    ).toBeNull();
  });

  test("reports when the installed version is already the latest", async () => {
    const result = await getVersionCheck(async () => packageJson.version);

    expect(result).toEqual({
      currentVersion: packageJson.version,
      latestVersion: packageJson.version,
      status: "latest",
    });
  });

  test("reports when an update is available", async () => {
    const result = await getVersionCheck(async () => "1.2.0");

    expect(result).toEqual({
      currentVersion: packageJson.version,
      latestVersion: "1.2.0",
      status: "outdated",
    });
  });

  test("reports unknown when the latest release cannot be checked", async () => {
    const result = await getVersionCheck(async () => null);

    expect(result).toEqual({
      currentVersion: packageJson.version,
      latestVersion: null,
      status: "unknown",
    });
  });

  test("detects a homebrew install from the executable path", () => {
    const commands: string[] = [];
    const method = detectInstallMethod(
      ["/opt/homebrew/bin/claudex-switch"],
      "/opt/homebrew/Cellar/claudex-switch/1.1.1/bin/claudex-switch",
      (command, args) => {
        commands.push(`${command} ${args.join(" ")}`);
        if (command === "brew") {
          return { status: 0, stdout: "/opt/homebrew\n" };
        }
        return { status: 1 };
      },
    );

    expect(method).toBe("brew");
    expect(commands).toEqual(["brew --prefix"]);
  });

  test("detects a bun install from the executable path", () => {
    const commands: string[] = [];
    const method = detectInstallMethod(
      [
        "/Users/test/.bun/bin/claudex-switch",
        "list",
      ],
      "/Users/test/.bun/bin/bun",
      (command, args) => {
        commands.push(`${command} ${args.join(" ")}`);
        if (command === "brew") {
          return { status: 1 };
        }

        if (command === "bun" && args[0] === "--version") {
          return { status: 0 };
        }

        if (command === "bun" && args.join(" ") === "pm bin -g") {
          return { status: 0, stdout: "/Users/test/.bun/bin\n" };
        }

        return { status: 1 };
      },
    );

    expect(method).toBe("bun");
    expect(commands).toEqual([
      "brew --prefix",
      "bun --version",
      "bun pm bin -g",
    ]);
  });

  test("does not mis-detect bun when the executable path is outside bun", () => {
    const method = detectInstallMethod(
      [
        "/opt/homebrew/bin/node",
        "/Users/test/.nvm/versions/node/v20.9.0/lib/node_modules/claudex-switch/dist/claudex-switch.js",
      ],
      "/opt/homebrew/Cellar/node/24.0.0/bin/node",
      (command, args) => {
        if (command === "brew") {
          return { status: 0, stdout: "/opt/homebrew\n" };
        }

        if (command === "bun" && args[0] === "--version") {
          return { status: 0 };
        }

        if (command === "bun" && args.join(" ") === "pm bin -g") {
          return { status: 0, stdout: "/Users/test/.bun/bin\n" };
        }

        return { status: 1 };
      },
    );

    expect(method).toBeNull();
  });

  test("updates with bun and restarts the original command", async () => {
    const calls: string[] = [];

    const result = await runAutoUpdateIfNeeded({
      argv: ["/Users/test/.bun/bin/claudex-switch", "list"],
      env: {},
      execPath: "/Users/test/.bun/bin/bun",
      fetchLatestVersion: async () => "9.8.7",
      runCommand: (command, args, options) => {
        calls.push(`${command} ${args.join(" ")}`);

        if (command === "brew") {
          return { status: 1 };
        }

        if (
          command === "bun" &&
          args[0] === "--version"
        ) {
          return { status: 0 };
        }

        if (command === "bun" && args.join(" ") === "pm bin -g") {
          return { status: 0, stdout: "/Users/test/.bun/bin\n" };
        }

        if (command === "bun" && args.join(" ") === "remove -g claudex-switch") {
          expect(options?.env?.CLAUDEX_SKIP_AUTO_UPDATE).toBe("1");
          return { status: 0 };
        }

        if (command === "bun" && args[0] === "install") {
          expect(options?.env?.CLAUDEX_SKIP_AUTO_UPDATE).toBe("1");
          return { status: 0 };
        }

        if (command === "/Users/test/.bun/bin/claudex-switch") {
          expect(options?.env?.CLAUDEX_SKIP_AUTO_UPDATE).toBe("1");
          expect(args).toEqual(["list"]);
          return { status: 0 };
        }

        throw new Error(`Unexpected command: ${command} ${args.join(" ")}`);
      },
    });

    expect(result).toEqual({ action: "restart", exitCode: 0 });
    expect(calls).toEqual([
      "brew --prefix",
      "bun --version",
      "bun pm bin -g",
      "bun remove -g claudex-switch",
      "bun install -g git+https://github.com/Holden-Lin/claudex-switch.git#v9.8.7",
      "/Users/test/.bun/bin/claudex-switch list",
    ]);
  });

  test("manual update ignores the auto-update disable env flag", async () => {
    const calls: string[] = [];

    const available = await checkForLatestUpdate(
      {
        argv: ["/Users/test/.bun/bin/claudex-switch", "update"],
        env: { CLAUDEX_DISABLE_AUTO_UPDATE: "1" },
        execPath: "/Users/test/.bun/bin/bun",
        fetchLatestVersion: async () => "9.8.7",
        runCommand: (command, args, options) => {
          calls.push(`${command} ${args.join(" ")}`);

          if (command === "brew") {
            return { status: 1 };
          }

          if (command === "bun" && args[0] === "--version") {
            return { status: 0 };
          }

          if (command === "bun" && args.join(" ") === "pm bin -g") {
            return { status: 0, stdout: "/Users/test/.bun/bin\n" };
          }

          if (command === "bun" && args.join(" ") === "remove -g claudex-switch") {
            expect(options?.env?.CLAUDEX_SKIP_AUTO_UPDATE).toBe("1");
            expect(options?.env?.CLAUDEX_DISABLE_AUTO_UPDATE).toBe("1");
            return { status: 0 };
          }

          if (command === "bun" && args[0] === "install") {
            expect(options?.env?.CLAUDEX_SKIP_AUTO_UPDATE).toBe("1");
            expect(options?.env?.CLAUDEX_DISABLE_AUTO_UPDATE).toBe("1");
            return { status: 0 };
          }

          throw new Error(`Unexpected command: ${command} ${args.join(" ")}`);
        },
      },
      { respectDisableEnv: false },
    );

    expect(available.status).toBe("available");

    if (available.status !== "available") {
      throw new Error(`Expected available update, received ${available.status}`);
    }

    const installed = installLatestUpdate(available);

    expect(installed.ok).toBe(true);
    expect(installed.env.CLAUDEX_SKIP_AUTO_UPDATE).toBe("1");
    expect(calls).toEqual([
      "brew --prefix",
      "bun --version",
      "bun pm bin -g",
      "bun remove -g claudex-switch",
      "bun install -g git+https://github.com/Holden-Lin/claudex-switch.git#v9.8.7",
    ]);
  });

  test("continues when auto update is disabled", async () => {
    const result = await runAutoUpdateIfNeeded({
      env: { CLAUDEX_DISABLE_AUTO_UPDATE: "1" },
      fetchLatestVersion: async () => {
        throw new Error("should not fetch");
      },
    });

    expect(result).toEqual({ action: "continue" });
  });
});
