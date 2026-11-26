import { spawnSync } from "child_process";
import { tmpdir, userInfo } from "os";
import { resolve, sep } from "path";

// Test runs (bun test, scripts and probes that set CLAUDEX_TEST_HOME) must
// never write the developer's real account files. On 11-26 a review probe
// that imported the stores before changing HOME overwrote the real
// aliases.json and Codex registry; these checks turn that into an error.

export function isTestRuntime(): boolean {
  return Boolean(process.env.CLAUDEX_TEST_HOME) || process.env.NODE_ENV === "test";
}

// The account's home from the user database rather than $HOME, so neither a
// probe that rewrites HOME nor a test child started with HOME=<temp> can move
// it. Node's userInfo() reads the database; Bun's echoes $HOME, so under Bun
// the shell's ~user expansion (getpwnam) answers instead. Asked once, and
// only by a test run.
let realHomeCache: string | null | undefined;

export function realHomeDir(): string | null {
  if (realHomeCache !== undefined) return realHomeCache;
  realHomeCache = null;
  if (typeof Bun === "undefined") {
    try {
      realHomeCache = userInfo().homedir || null;
    } catch {}
    return realHomeCache;
  }
  try {
    const result = spawnSync("/bin/sh", ["-c", 'eval echo ~"$(id -un)"'], {
      encoding: "utf-8",
      timeout: 5000,
    });
    const home = result.status === 0 ? result.stdout.trim() : "";
    realHomeCache = home.startsWith("/") ? home : null;
  } catch {}
  return realHomeCache;
}

function isInside(path: string, root: string): boolean {
  const target = resolve(path);
  const base = resolve(root);
  return target === base || target.startsWith(base.endsWith(sep) ? base : base + sep);
}

function refusal(what: string, realHome: string): Error {
  return new Error(
    `Refusing to ${what}: this is a test run (CLAUDEX_TEST_HOME or NODE_ENV=test) ` +
      `and the path is inside the real home ${realHome}. ` +
      "Set CLAUDEX_TEST_HOME=$(mktemp -d) before the run; paths are resolved per call, " +
      "so setting it after import also works.",
  );
}

/** Home resolution for src/lib/paths.ts: a test run may not resolve to the real home. */
export function assertTestHomeIsolated(home: string): string {
  if (!isTestRuntime()) return home;
  const realHome = realHomeDir();
  if (realHome && resolve(home) === resolve(realHome)) {
    throw refusal(`use ${home} as HOME`, realHome);
  }
  return home;
}

/**
 * Last check before a store write. Catches a path captured before the test
 * HOME was set; allows the test home and the temp directory.
 */
export function assertTestWriteTarget(path: string): void {
  if (!isTestRuntime()) return;
  const realHome = realHomeDir();
  if (!realHome || !isInside(path, realHome)) return;
  const testHome = process.env.CLAUDEX_TEST_HOME;
  if (testHome && resolve(testHome) !== resolve(realHome) && isInside(path, testHome)) return;
  if (!isInside(realHome, tmpdir()) && isInside(path, tmpdir())) return;
  throw refusal(`write ${path}`, realHome);
}
