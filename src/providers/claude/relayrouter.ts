import { createServer } from "node:http";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ClaudeApiProfileConfig } from "../../types";

export function isRelayrouterGLMProfile(config: ClaudeApiProfileConfig): boolean {
  return config.model === "glm-5.3-flash"
    && /^https:\/\/api\.relayrouter\.ai(?::443)?(?:\/|$)/i.test(config.baseUrl ?? "");
}

export interface RelayrouterSession {
  baseUrl: string;
  close: () => Promise<void>;
}

export async function startRelayrouterSession(upstreamBaseUrl: string): Promise<RelayrouterSession> {
  const upstream = new URL(upstreamBaseUrl);
  if (typeof Bun !== "undefined") {
    // Bun's node:http disconnect events can disappear after the body ends.
    const server = Bun.serve({
      hostname: "127.0.0.1", port: 0, idleTimeout: 0, maxRequestBodySize: 64 * 1024 * 1024,
      fetch: (request) => forward(request, upstream),
      error: () => gatewayError(),
    });
    return { baseUrl: `http://127.0.0.1:${server.port}`, close: async () => { await server.stop(true); } };
  }

  const server = createServer(async (request, response) => {
    const abort = new AbortController();
    const disconnected = () => { if (!response.writableFinished) abort.abort(); };
    request.once("aborted", disconnected);
    response.once("close", disconnected);
    request.socket.once("close", disconnected);
    try {
      const headers = new Headers();
      for (const [name, value] of Object.entries(request.headers)) {
        if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(", ") : value);
      }
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(Buffer.from(chunk));
      const result = await forward(new Request(`http://127.0.0.1${request.url}`, {
        method: request.method, headers, signal: abort.signal,
        ...(chunks.length ? { body: Buffer.concat(chunks) } : {}),
      }), upstream);
      response.writeHead(result.status, Object.fromEntries(result.headers));
      if (result.body) {
        await pipeline(Readable.fromWeb(result.body as unknown as import("node:stream/web").ReadableStream), response, { signal: abort.signal });
      } else response.end();
    } catch {
      if (abort.signal.aborted || response.destroyed) return;
      if (response.headersSent) response.destroy();
      else {
        const result = gatewayError();
        response.writeHead(result.status, Object.fromEntries(result.headers));
        response.end(await result.text());
      }
    } finally {
      request.removeListener("aborted", disconnected);
      response.removeListener("close", disconnected);
      request.socket.removeListener("close", disconnected);
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => { server.removeListener("error", reject); resolve(); });
  });
  const address = server.address() as import("node:net").AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve) => { server.close(() => resolve()); server.closeAllConnections(); }),
  };
}

async function forward(request: Request, upstream: URL): Promise<Response> {
  const incoming = new URL(request.url);
  const messages = request.method === "POST" && ["/v1/messages", "/v1/messages/count_tokens"].includes(incoming.pathname);
  if (!messages && !(request.method === "GET" && incoming.pathname === "/v1/models")) return new Response(null, { status: 404 });
  const target = new URL(upstream);
  target.pathname = `${upstream.pathname.replace(/\/$/, "")}${incoming.pathname}`;
  target.search = incoming.search;
  let body: string | undefined;
  if (messages) {
    let payload: Record<string, unknown>;
    try { payload = JSON.parse(await request.text()); }
    catch { return new Response(null, { status: 400 }); }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return new Response(null, { status: 400 });
    if (payload.model === "glm-5.3-flash" && Array.isArray(payload.messages)) {
      // The relay forwards these Anthropic-only blocks as OpenAI content parts,
      // which its GLM backend rejects. Keep visible text and tool history intact.
      payload.messages = payload.messages.flatMap((message) => {
        if (message?.role !== "assistant" || !Array.isArray(message.content)) return [message];
        const content = message.content.filter((block: { type?: string }) => block?.type !== "thinking" && block?.type !== "redacted_thinking");
        if (!content.length && message.content.length) return [];
        return [{ ...message, content }];
      });
    }
    body = JSON.stringify(payload);
  }
  const headers = transportHeaders(request.headers);
  headers.delete("host");
  headers.delete("accept-encoding");
  const result = await fetch(target, { method: request.method, headers, body, signal: request.signal, redirect: "manual" });
  return new Response(result.body, { status: result.status, headers: transportHeaders(result.headers) });
}

function transportHeaders(original: Headers): Headers {
  const headers = new Headers(original);
  for (const name of ["connection", "keep-alive", "transfer-encoding", "content-length", "content-encoding"]) headers.delete(name);
  return headers;
}

function gatewayError(): Response {
  return Response.json({ error: { type: "api_error", message: "RelayRouter request failed." } }, { status: 502 });
}
