import { createServer, type IncomingMessage, type Server, type ServerResponse } from "http";
import { randomBytes, timingSafeEqual } from "crypto";
import { renderPage } from "./page";
import { applyChanges, buildSnapshot } from "./snapshot";
import type { WebConfigChange } from "../types";

const MAX_BODY_BYTES = 1_000_000;

export interface WebConfigServer {
  url: string;
  port: number;
  token: string;
  close: () => Promise<void>;
}

export interface StartWebConfigServerOptions {
  port?: number;
  host?: string;
}

export async function startWebConfigServer(
  options: StartWebConfigServerOptions = {},
): Promise<WebConfigServer> {
  // Loopback only. This page renders live API keys, so it must never be
  // reachable from another machine, and there is no CORS header anywhere.
  const host = options.host ?? "127.0.0.1";
  const token = randomBytes(32).toString("base64url");

  const server = createServer((req, res) => {
    void handleRequest(req, res, token, host).catch(() => {
      sendJson(res, 500, { error: "internal error" });
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(options.port ?? 0, host, () => {
      server.removeListener("error", reject);
      resolve();
    });
  });

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;

  return {
    url: `http://${host}:${port}/?t=${token}`,
    port,
    token,
    close: () => closeServer(server),
  };
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve) => {
    server.closeAllConnections?.();
    server.close(() => resolve());
  });
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  token: string,
  host: string,
): Promise<void> {
  if (!isAllowedHost(req.headers.host, host)) {
    sendJson(res, 403, { error: "forbidden host" });
    return;
  }

  const url = new URL(req.url ?? "/", `http://${host}`);

  if (!isAuthorized(req, url, token)) {
    sendJson(res, 403, { error: "invalid or missing token" });
    return;
  }

  if (req.method === "GET" && url.pathname === "/") {
    const body = renderPage();
    res.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      // The page holds credentials; keep it out of any embedding context.
      "x-frame-options": "DENY",
      "referrer-policy": "no-referrer",
    });
    res.end(body);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/accounts") {
    sendJson(res, 200, await buildSnapshot());
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/accounts") {
    const payload = await readJsonBody(req);
    const changes = Array.isArray((payload as { changes?: unknown })?.changes)
      ? ((payload as { changes: WebConfigChange[] }).changes)
      : null;
    if (!changes) {
      sendJson(res, 400, { error: "expected { changes: [...] }" });
      return;
    }

    const results = await applyChanges(changes);
    sendJson(res, 200, { results, snapshot: await buildSnapshot() });
    return;
  }

  sendJson(res, 404, { error: "not found" });
}

// Blocks DNS rebinding: a hostile page can point a name at 127.0.0.1, but the
// browser still sends that name in the Host header.
function isAllowedHost(header: string | undefined, host: string): boolean {
  if (!header) return false;
  const name = header.replace(/:\d+$/, "").replace(/^\[|\]$/g, "");
  return name === host || name === "localhost" || name === "127.0.0.1";
}

function isAuthorized(
  req: IncomingMessage,
  url: URL,
  token: string,
): boolean {
  const header = req.headers.authorization ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const provided = bearer || url.searchParams.get("t") || "";
  return safeEqual(provided, token);
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) throw new Error("request body too large");
    chunks.push(buffer);
  }

  if (chunks.length === 0) return null;
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf-8"));
  } catch {
    return null;
  }
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(payload);
}
