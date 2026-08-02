import { chmod, copyFile, mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { CODEX_CONFIG_FILE } from "../../lib/paths";
import { fileExists } from "../../lib/fs";
import type { CodexAuthFile } from "../../types";

const AUTH_FILE_NAME = "auth.json";

export async function prepareIsolatedCodexHome(
  auth: CodexAuthFile | null = null,
): Promise<string> {
  const home = await mkdtemp(join(tmpdir(), "claudex-codex-"));
  await chmod(home, 0o700);

  if (await fileExists(CODEX_CONFIG_FILE)) {
    await copyFile(CODEX_CONFIG_FILE, join(home, "config.toml"));
  }

  if (auth) {
    await writeFile(
      join(home, AUTH_FILE_NAME),
      JSON.stringify(auth, null, 2),
      { mode: 0o600 },
    );
  }

  return home;
}

export async function readIsolatedCodexAuth(
  home: string,
): Promise<CodexAuthFile | null> {
  try {
    return JSON.parse(
      await readFile(join(home, AUTH_FILE_NAME), "utf-8"),
    ) as CodexAuthFile;
  } catch {
    return null;
  }
}

export async function cleanupIsolatedCodexHome(home: string): Promise<void> {
  await rm(home, { recursive: true, force: true });
}
