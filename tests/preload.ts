import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { mock } from "bun:test";
import * as os from "os";

const testHome = mkdtempSync(join(tmpdir(), "claudex-switch-test-home-"));

process.env.HOME = testHome;
process.env.USERPROFILE = testHome;
process.env.CLAUDEX_TEST_HOME = testHome;
// OpenCode v2 uses XDG roots and can resolve them before a test resets HOME.
// Keep every path inside the temporary fixture directory as well.
process.env.XDG_CONFIG_HOME = join(testHome, ".config");
process.env.XDG_DATA_HOME = join(testHome, ".local", "share");
process.env.XDG_STATE_HOME = join(testHome, ".local", "state");
process.env.XDG_CACHE_HOME = join(testHome, ".cache");
process.env.NO_COLOR = "1";

mock.module("os", () => ({
  ...os,
  homedir: () => testHome,
}));

process.on("exit", () => {
  rmSync(testHome, { recursive: true, force: true });
});
