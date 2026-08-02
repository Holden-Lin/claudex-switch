import { spawn, type ChildProcess } from "child_process";
import { createInterface } from "readline";
import type { CodexAuthFile } from "../../types";
import {
  cleanupIsolatedCodexHome,
  prepareIsolatedCodexHome,
  readIsolatedCodexAuth,
} from "./isolated-home";

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_CONCURRENT_SERVERS = 3;

export interface CodexRateLimitWindowResponse {
  usedPercent?: number;
  windowDurationMins?: number | null;
  resetsAt?: number | null;
}

export interface CodexRateLimitSnapshotResponse {
  primary?: CodexRateLimitWindowResponse | null;
  secondary?: CodexRateLimitWindowResponse | null;
}

export interface CodexRateLimitsResponse {
  rateLimits?: CodexRateLimitSnapshotResponse;
  rateLimitsByLimitId?: Record<string, CodexRateLimitSnapshotResponse> | null;
}

export interface CodexRateLimitsReadResult {
  response: CodexRateLimitsResponse;
  refreshedAuth: CodexAuthFile | null;
}

export class CodexRateLimitsReadError extends Error {
  constructor(
    message: string,
    readonly refreshedAuth: CodexAuthFile | null,
  ) {
    super(message);
    this.name = "CodexRateLimitsReadError";
  }
}

type SpawnAppServer = (
  command: string,
  args: string[],
  options: {
    stdio: ["pipe", "pipe", "pipe"];
    env: NodeJS.ProcessEnv;
  },
) => ChildProcess;

let activeServers = 0;
const serverWaiters: Array<() => void> = [];

async function acquireServerSlot(): Promise<() => void> {
  if (activeServers >= MAX_CONCURRENT_SERVERS) {
    await new Promise<void>((resolve) => serverWaiters.push(resolve));
  }
  activeServers += 1;
  return () => {
    activeServers -= 1;
    serverWaiters.shift()?.();
  };
}

export async function readCodexRateLimits(
  auth: CodexAuthFile,
  spawnAppServer: SpawnAppServer = spawn,
): Promise<CodexRateLimitsReadResult> {
  const release = await acquireServerSlot();
  let codexHome: string | null = null;
  try {
    codexHome = await prepareIsolatedCodexHome(auth);
    try {
      const response = await requestRateLimits(codexHome, spawnAppServer);
      return {
        response,
        refreshedAuth: await readIsolatedCodexAuth(codexHome),
      };
    } catch (err) {
      throw new CodexRateLimitsReadError(
        err instanceof Error ? err.message : String(err),
        await readIsolatedCodexAuth(codexHome),
      );
    }
  } finally {
    try {
      if (codexHome) await cleanupIsolatedCodexHome(codexHome);
    } finally {
      release();
    }
  }
}

async function requestRateLimits(
  codexHome: string,
  spawnAppServer: SpawnAppServer,
): Promise<CodexRateLimitsResponse> {
  const env: NodeJS.ProcessEnv = { ...process.env, CODEX_HOME: codexHome };
  delete env.OPENAI_API_KEY;
  delete env.CODEX_API_KEY;
  delete env.CODEX_ACCESS_TOKEN;

  return new Promise<CodexRateLimitsResponse>((resolve, reject) => {
    const proc = spawnAppServer(
      "codex",
      ["app-server", "-c", 'cli_auth_credentials_store="file"'],
      { stdio: ["pipe", "pipe", "pipe"], env },
    );
    const stdout = proc.stdout;
    const stdin = proc.stdin;
    if (!stdout || !stdin) {
      proc.kill();
      reject(new Error("Codex App Server did not expose stdio"));
      return;
    }

    let settled = false;
    let stderr = "";
    const finish = (
      error: Error | null,
      response?: CodexRateLimitsResponse,
    ): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      lines.close();
      stdin.end();
      proc.kill();
      if (error) reject(error);
      else resolve(response ?? {});
    };
    const send = (message: Record<string, unknown>): void => {
      stdin.write(`${JSON.stringify(message)}\n`);
    };

    proc.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });
    proc.on("error", (error) => finish(error));
    proc.on("close", (code) => {
      if (!settled) {
        const detail = stderr.trim();
        finish(
          new Error(
            detail || `Codex App Server exited before replying (${code ?? "unknown"})`,
          ),
        );
      }
    });

    const lines = createInterface({ input: stdout });
    lines.on("line", (line) => {
      let message: Record<string, unknown>;
      try {
        message = JSON.parse(line) as Record<string, unknown>;
      } catch {
        return;
      }

      if (message.id === 0) {
        if (message.error) {
          finish(new Error(jsonRpcErrorMessage(message.error)));
          return;
        }
        send({ method: "initialized" });
        send({ id: 1, method: "account/rateLimits/read" });
        return;
      }

      if (message.id === 1) {
        if (message.error) {
          finish(new Error(jsonRpcErrorMessage(message.error)));
          return;
        }
        finish(null, (message.result ?? {}) as CodexRateLimitsResponse);
      }
    });

    const timer = setTimeout(
      () => finish(new Error("Codex App Server rate-limit request timed out")),
      REQUEST_TIMEOUT_MS,
    );
    send({
      id: 0,
      method: "initialize",
      params: {
        clientInfo: {
          name: "claudex-switch",
          title: "claudex-switch",
          version: "1",
        },
        capabilities: { experimentalApi: true },
      },
    });
  });
}

function jsonRpcErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const message = (error as Record<string, unknown>).message;
    if (typeof message === "string") return message;
  }
  return "Codex App Server request failed";
}
