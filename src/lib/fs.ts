import { readFile, writeFile, access } from "fs/promises";
import { assertTestWriteTarget } from "./home-guard";

export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const content = await readFile(path, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson(path: string, data: unknown): Promise<void> {
  assertTestWriteTarget(path);
  await writeFile(path, JSON.stringify(data, null, 2));
}

/** Write JSON with restricted file permissions (0o600) for sensitive data */
export async function writeJsonSecure(path: string, data: unknown): Promise<void> {
  assertTestWriteTarget(path);
  await writeFile(path, JSON.stringify(data, null, 2), { mode: 0o600 });
}
