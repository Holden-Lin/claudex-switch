import { randomUUID } from "crypto";
import { open, readFile, rm, stat } from "fs/promises";

export async function acquireProfileLock(
  lockPath: string,
  resourceName: string,
  timeoutMs = 10_000,
): Promise<() => Promise<void>> {
  const timeoutAt = Date.now() + timeoutMs;
  const token = randomUUID();
  while (Date.now() < timeoutAt) {
    try {
      const handle = await open(lockPath, "wx", 0o600);
      await handle.writeFile(JSON.stringify({ pid: process.pid, token, createdAt: Date.now() }));
      await handle.close();
      return async () => {
        try {
          const current = JSON.parse(await readFile(lockPath, "utf8")) as { token?: unknown };
          if (current.token === token) await rm(lockPath, { force: true });
        } catch {
          // If the lock changed or disappeared, leave it alone.
        }
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
        throw new Error(`Could not lock this alias's private OpenCode ${resourceName}.`);
      }
    }

    try {
      const owner = JSON.parse(await readFile(lockPath, "utf8")) as {
        pid?: unknown;
        token?: unknown;
        createdAt?: unknown;
      };
      if (typeof owner.pid === "number" && Number.isInteger(owner.pid)) {
        try {
          process.kill(owner.pid, 0);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ESRCH") {
            await rm(lockPath, { force: true });
            continue;
          }
        }
      } else {
        const age = Date.now() - (await stat(lockPath)).mtimeMs;
        if (age > 30_000) {
          await rm(lockPath, { force: true });
          continue;
        }
      }
    } catch {
      // Another process may still be writing the lock contents; retry briefly.
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(`Timed out waiting for this alias's private OpenCode ${resourceName} lock.`);
}
