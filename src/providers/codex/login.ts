import { spawn } from "child_process";
import { cleanupOpenShimDir, createOpenShimDir } from "../../lib/browser";
import type { CodexAuthFile } from "../../types";
import {
  cleanupIsolatedCodexHome,
  prepareIsolatedCodexHome,
  readIsolatedCodexAuth,
} from "./isolated-home";

export interface CodexLoginResult {
  exitCode: number | null;
  auth: CodexAuthFile | null;
}

/** Run browser login without exposing the currently active credentials. */
export async function runIsolatedCodexLogin(): Promise<CodexLoginResult> {
  const codexHome = await prepareIsolatedCodexHome();
  const shimDir = createOpenShimDir();
  const env: NodeJS.ProcessEnv = { ...process.env, CODEX_HOME: codexHome };
  if (shimDir) env.PATH = `${shimDir}:${process.env.PATH}`;
  delete env.OPENAI_API_KEY;
  delete env.CODEX_API_KEY;
  delete env.CODEX_ACCESS_TOKEN;

  try {
    const proc = spawn(
      "codex",
      ["login", "-c", 'cli_auth_credentials_store="file"'],
      { stdio: "inherit", env },
    );
    const exitCode = await new Promise<number | null>((resolve, reject) => {
      proc.on("close", resolve);
      proc.on("error", reject);
    });
    const auth = exitCode === 0
      ? await readIsolatedCodexAuth(codexHome)
      : null;
    return { exitCode, auth };
  } finally {
    cleanupOpenShimDir(shimDir);
    await cleanupIsolatedCodexHome(codexHome);
  }
}
