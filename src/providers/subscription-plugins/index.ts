import { CursorAuthPlugin } from "@magpie-community/opencode-cursor-auth";
import { WorkBuddyAuthPlugin, WorkBuddyAIAuthPlugin } from "@magpie-community/opencode-workbuddy-auth";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { chmod, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { createServer, type IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";
import { join, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { openExternalUrl } from "../../lib/browser";

export type SubscriptionUpstream = "cursor" | "workbuddy" | "workbuddy-ai";
type Auth = { type: "oauth"; access?: string; refresh?: string; source?: string; [key: string]: unknown };
type Model = { id: string; display_name?: string; context_window?: number };
type Provider = { id: string; models: Record<string, { name?: string; [key: string]: unknown }>; [key: string]: unknown };
type Authorization = {
  url?: string;
  instructions?: string;
  method?: string;
  callback: () => Promise<{ type: string; error?: string; [key: string]: unknown }>;
};

/** A small structural subset of the OpenCode plugin API; no host tools are exposed. */
export interface SubscriptionPlugin {
  auth: {
    provider: string;
    methods: Array<{ type: string; label: string; authorize?: () => Promise<Authorization> }>;
    loader: (getAuth: () => Promise<Auth | undefined>) => Promise<{
      baseURL?: string;
      fetch?: (input: string, init: RequestInit) => Promise<Response>;
    }>;
  };
  config?: (config: { provider: Record<string, Partial<Provider>> }) => Promise<void>;
  provider?: { models: (provider: Provider, input: { auth: Auth }) => Promise<Provider["models"]> };
  "chat.headers"?: (input: { sessionID: string; model: { providerID: string } }, output: { headers: Record<string, string> }) => Promise<void>;
}

export interface SubscriptionPluginOptions {
  pluginFactory?: (input: {
    client: { auth: { set: (input: { path: { id: string }; body: Partial<Auth> }) => Promise<void> } };
  }) => Promise<SubscriptionPlugin>;
  openUrl?: (url: string) => unknown;
}

const FACTORIES = { cursor: CursorAuthPlugin, workbuddy: WorkBuddyAuthPlugin, "workbuddy-ai": WorkBuddyAIAuthPlugin };
const writes = new Map<string, Promise<void>>();
const contexts = new Map<string, Promise<Context>>();
const MAX_BODY_BYTES = 16 * 1024 * 1024;
// WorkBuddy refuses non-stream chats (error 11101); the Cursor plugin answers them itself.
const STREAM_ONLY = new Set<SubscriptionUpstream>(["workbuddy", "workbuddy-ai"]);
export const SUBSCRIPTION_AUTH_FILE = "plugin-auth.json";

export function isSubscriptionUpstream(value: unknown): value is SubscriptionUpstream {
  return value === "cursor" || value === "workbuddy" || value === "workbuddy-ai";
}

function authPath(directory: string): string {
  return join(resolve(directory), SUBSCRIPTION_AUTH_FILE);
}

async function readAuthFile(file: string, upstream: SubscriptionUpstream): Promise<Auth | undefined> {
  let text: string;
  try {
    text = await readFile(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
  let stored: { version?: number; upstream?: string; auth?: Auth };
  try {
    stored = JSON.parse(text);
  } catch {
    throw new Error("Subscription login file is invalid; sign in again.");
  }
  if (stored?.version !== 1 || stored.upstream !== upstream || stored.auth?.type !== "oauth") {
    throw new Error("Subscription login file does not match this provider; sign in again.");
  }
  return stored.auth;
}

async function getAuth(directory: string, upstream: SubscriptionUpstream): Promise<Auth | undefined> {
  const file = authPath(directory);
  await writes.get(file);
  return readAuthFile(file, upstream);
}

/** Every host auth.set and login uses this writer, preserving concurrent partial updates. */
async function saveAuth(directory: string, upstream: SubscriptionUpstream, update: Partial<Auth>, replace = false): Promise<void> {
  const file = authPath(directory);
  const previous = writes.get(file) ?? Promise.resolve();
  const next = previous.catch(() => {}).then(async () => {
    const old = replace ? undefined : await readAuthFile(file, upstream);
    // A desktop login stores a reference, never the desktop app's rotating tokens.
    if (!replace && old?.source === "desktop") return;
    const auth = { ...old, ...update, type: "oauth" };
    await mkdir(resolve(directory), { recursive: true, mode: 0o700 });
    const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, JSON.stringify({ version: 1, upstream, auth }, null, 2) + "\n", { mode: 0o600 });
      await rename(temporary, file);
      await chmod(file, 0o600);
    } finally {
      await unlink(temporary).catch(() => {});
    }
  });
  writes.set(file, next);
  try {
    await next;
  } finally {
    if (writes.get(file) === next) writes.delete(file);
  }
}

interface Context {
  plugin: SubscriptionPlugin;
  provider: Provider;
  getAuth: () => Promise<Auth | undefined>;
}

async function context(directory: string, upstream: SubscriptionUpstream, options: SubscriptionPluginOptions): Promise<Context> {
  const key = `${resolve(directory)}\n${upstream}`;
  const create = async (): Promise<Context> => {
    const plugin = await (options.pluginFactory ?? FACTORIES[upstream])({
      client: { auth: { set: async ({ path, body }) => {
        if (path.id !== upstream) throw new Error("Plugin attempted to update a different provider's login.");
        await saveAuth(directory, upstream, body);
      } } },
    }) as SubscriptionPlugin;
    if (plugin.auth.provider !== upstream) throw new Error("Subscription plugin provider mismatch.");
    const config = { provider: {} as Record<string, Partial<Provider>> };
    await plugin.config?.(config);
    return {
      plugin,
      provider: { ...config.provider[upstream], id: upstream, models: config.provider[upstream]?.models ?? {} },
      getAuth: () => getAuth(directory, upstream),
    };
  };
  // Injected factories are scoped to their caller; production factories persist for the process.
  if (options.pluginFactory) return create();
  let pending = contexts.get(key);
  if (!pending) {
    pending = create();
    contexts.set(key, pending);
    pending.catch(() => { if (contexts.get(key) === pending) contexts.delete(key); });
  }
  return pending;
}

export async function subscriptionLoginMethods(directory: string, upstream: SubscriptionUpstream, options: SubscriptionPluginOptions = {}): Promise<Array<{ label: string }>> {
  const { plugin } = await context(directory, upstream, options);
  return plugin.auth.methods.filter((method) => method.type === "oauth" && method.authorize).map(({ label }) => ({ label: /desktop|cursor-agent/i.test(label) ? `${label} (follows the app account)` : label }));
}

function identity(upstream: SubscriptionUpstream, auth: Auth): string {
  let subject: unknown;
  if (typeof auth.access === "string") {
    try {
      const claims = JSON.parse(Buffer.from(auth.access.split(".")[1] ?? "", "base64url").toString("utf8"));
      subject = claims.sub;
    } catch {}
  }
  const account = [auth.uid, auth.accountId, subject].map((value) => typeof value === "number" && Number.isFinite(value) ? String(value) : value).find((value) => typeof value === "string" && value.length > 0);
  if (typeof account !== "string") throw new Error("Subscription sign-in did not identify the account.");
  return createHash("sha256").update(`${upstream}\n${account}`).digest("hex");
}

export async function loginSubscriptionPlugin(directory: string, upstream: SubscriptionUpstream, methodIndex: number, notify: (message: string) => void, options: SubscriptionPluginOptions = {}): Promise<string> {
  const { plugin } = await context(directory, upstream, options);
  const methods = plugin.auth.methods.filter((method) => method.type === "oauth" && method.authorize);
  const method = Number.isInteger(methodIndex) ? methods[methodIndex] : undefined;
  if (!method?.authorize) throw new Error("Unknown subscription login method.");
  if (/desktop|cursor-agent/i.test(method.label)) notify("This login follows the account currently signed in to the native app, including later account switches.");
  const authorization = await method.authorize();
  if (authorization.instructions) notify(authorization.instructions);
  if (authorization.url) {
    if (new URL(authorization.url).protocol !== "https:") throw new Error("Subscription sign-in URL must use HTTPS.");
    notify(authorization.url);
    (options.openUrl ?? ((url) => openExternalUrl(url, true)))(authorization.url);
  }
  if (authorization.method && authorization.method !== "auto") throw new Error("This subscription sign-in requires an unsupported manual callback.");
  const result = await authorization.callback();
  if (result.type !== "success") throw new Error(result.error || "Subscription sign-in failed.");
  const { type: _type, error: _error, ...fields } = result;
  const auth: Auth = { ...fields, type: "oauth" };
  if (auth.source === "desktop") {
    auth.access = "";
    auth.refresh = "";
    auth.expires = 0;
  }
  const fingerprint = identity(upstream, auth);
  await saveAuth(directory, upstream, auth, true);
  return fingerprint;
}

export async function hasSubscriptionLogin(directory: string, upstream: SubscriptionUpstream): Promise<boolean> {
  try {
    const auth = await getAuth(directory, upstream);
    return !!auth && (!!auth.access || auth.source === "desktop" || (upstream === "cursor" && auth.refresh === "cursor-agent"));
  } catch {
    return false;
  }
}

async function models(ctx: Context): Promise<Model[]> {
  const auth = await ctx.getAuth();
  if (!auth) throw new Error("Subscription is not signed in.");
  const catalog = ctx.plugin.provider ? await ctx.plugin.provider.models(ctx.provider, { auth }) : ctx.provider.models;
  if (!Object.keys(catalog).length || (ctx.plugin.provider && catalog === ctx.provider.models)) {
    throw new Error("Subscription model catalog is unavailable; retry after checking the account sign-in.");
  }
  return Object.entries(catalog).map(([id, value]) => {
    const context = (value.limit as { context?: unknown } | undefined)?.context;
    return {
      id,
      ...(value.name ? { display_name: value.name } : {}),
      ...(typeof context === "number" && Number.isSafeInteger(context) && context > 0 ? { context_window: context } : {}),
    };
  });
}

export async function listSubscriptionModels(directory: string, upstream: SubscriptionUpstream, options: SubscriptionPluginOptions = {}): Promise<Model[]> {
  return models(await context(directory, upstream, options));
}

function authorized(headers: Headers, key: string): boolean {
  const bearer = headers.get("authorization");
  const token = bearer?.startsWith("Bearer ") ? bearer.slice(7) : headers.get("x-api-key");
  if (typeof token !== "string") return false;
  const expected = Buffer.from(key);
  const actual = Buffer.from(token);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function json(status: number, body: unknown): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

class HTTPError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

async function requestBody(request: IncomingMessage): Promise<string> {
  if (Number(request.headers["content-length"]) > MAX_BODY_BYTES) throw new HTTPError(413, "Request body is too large.");
  return new Promise((resolveBody, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    const cleanup = () => {
      request.removeListener("data", data);
      request.removeListener("end", end);
      request.removeListener("error", fail);
      request.removeListener("aborted", aborted);
    };
    const fail = (error: Error) => { cleanup(); reject(error); };
    const aborted = () => fail(new Error("Request aborted."));
    const data = (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        request.pause();
        fail(new HTTPError(413, "Request body is too large."));
      } else chunks.push(chunk);
    };
    const end = () => { cleanup(); resolveBody(Buffer.concat(chunks).toString("utf8")); };
    request.on("data", data);
    request.once("end", end);
    request.once("error", fail);
    request.once("aborted", aborted);
  });
}

async function webRequestBody(request: Request): Promise<string> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return Buffer.concat(chunks).toString("utf8");
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        throw new HTTPError(413, "Request body is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
}

const HOP_HEADERS = new Set(["connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade", "content-length", "content-encoding"]);

export interface SubscriptionBridgeServer {
  close(callback?: (error?: Error) => void): unknown;
  closeAllConnections(): void;
  address(): AddressInfo | string | null;
}

type BridgeOptions = {
  directory: string;
  upstream: SubscriptionUpstream;
  apiKey: string;
  port: number;
} & SubscriptionPluginOptions;

async function bridgeResponse(input: {
  method: string;
  url: string;
  headers: Headers;
  body: () => Promise<string>;
  signal: AbortSignal;
}, ctx: Context, pluginFetch: NonNullable<Awaited<ReturnType<SubscriptionPlugin["auth"]["loader"]>>["fetch"]>, endpoint: string, options: BridgeOptions): Promise<Response> {
  if (!authorized(input.headers, options.apiKey)) return json(401, { error: { message: "Invalid API key." } });
  const path = new URL(input.url, "http://127.0.0.1").pathname;
  if (input.method === "GET" && path === "/health") return json(200, { status: "ok", upstream: options.upstream });
  if (input.method === "GET" && path === "/v1/models") {
    return json(200, { object: "list", data: (await models(ctx)).map((model) => ({ ...model, object: "model", owned_by: options.upstream })) });
  }
  if (input.method !== "POST" || path !== "/v1/chat/completions") return json(404, { error: { message: "Unknown endpoint." } });
  if (Number(input.headers.get("content-length")) > MAX_BODY_BYTES) throw new HTTPError(413, "Request body is too large.");
  const body = await input.body();
  if (Buffer.byteLength(body) > MAX_BODY_BYTES) throw new HTTPError(413, "Request body is too large.");
  let chat: unknown;
  try { chat = JSON.parse(body); } catch { throw new HTTPError(400, "Request body must be valid JSON."); }
  if (!chat || typeof chat !== "object" || Array.isArray(chat)) throw new HTTPError(400, "Request body must be a JSON object.");
  const headers: Record<string, string> = { "content-type": "application/json" };
  const session = input.headers.get("x-claudex-session");
  if (session) await ctx.plugin["chat.headers"]?.({ sessionID: session.slice(0, 256), model: { providerID: options.upstream } }, { headers });
  // Claude Code's side queries (auto mode classifier, titles) and its non-streaming fallback ask for one JSON answer.
  const collect = STREAM_ONLY.has(options.upstream) && (chat as { stream?: unknown }).stream !== true;
  const sent = collect ? JSON.stringify({ ...chat, stream: true, stream_options: { include_usage: true } }) : body;
  const upstream = await pluginFetch!(endpoint, { method: "POST", headers, body: sent, signal: input.signal });
  if (collect && upstream.ok && !/json/i.test(upstream.headers.get("content-type") ?? "")) return collectedChat(await upstream.text());
  const responseHeaders = new Headers();
  const connectionHeaders = new Set((upstream.headers.get("connection") ?? "").toLowerCase().split(",").map((h) => h.trim()));
  upstream.headers.forEach((value, name) => {
    if (!HOP_HEADERS.has(name) && !connectionHeaders.has(name)) responseHeaders.set(name, value);
  });
  return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: responseHeaders });
}

type ChunkChoice = {
  index?: number;
  delta?: { content?: string | null; reasoning_content?: string | null; tool_calls?: Array<{ index?: number; id?: string; type?: string; function?: { name?: string; arguments?: string } }> };
  finish_reason?: string | null;
};

// collectedChat folds a chat completion SSE stream into the chat.completion a non-stream request expects.
function collectedChat(sse: string): Response {
  let head: { id?: string; created?: number; model?: string } = {};
  let usage: unknown;
  const choices = new Map<number, { content: string; reasoning: string; calls: Map<number, { id?: string; type: string; function: { name: string; arguments: string } }>; finish: string | null }>();
  for (const line of sse.split("\n")) {
    const data = /^data:\s?(.*)$/.exec(line.trim())?.[1];
    if (!data || data === "[DONE]") continue;
    let chunk: { id?: string; created?: number; model?: string; usage?: unknown; error?: unknown; choices?: ChunkChoice[] };
    try { chunk = JSON.parse(data); } catch { continue; }
    if (chunk.error) return json(502, { error: typeof chunk.error === "object" ? chunk.error : { message: String(chunk.error) } });
    if (!head.id && chunk.id) head = { id: chunk.id, created: chunk.created, model: chunk.model };
    if (chunk.usage) usage = chunk.usage;
    for (const c of chunk.choices ?? []) {
      const index = c.index ?? 0;
      const choice = choices.get(index) ?? { content: "", reasoning: "", calls: new Map(), finish: null };
      choices.set(index, choice);
      choice.content += c.delta?.content ?? "";
      choice.reasoning += c.delta?.reasoning_content ?? "";
      for (const t of c.delta?.tool_calls ?? []) {
        const call = choice.calls.get(t.index ?? 0) ?? { type: "function", function: { name: "", arguments: "" } };
        choice.calls.set(t.index ?? 0, call);
        if (t.id) call.id = t.id;
        if (t.function?.name) call.function.name = t.function.name;
        call.function.arguments += t.function?.arguments ?? "";
      }
      if (c.finish_reason) choice.finish = c.finish_reason;
    }
  }
  return json(200, {
    id: head.id ?? `chatcmpl-${randomUUID()}`,
    object: "chat.completion",
    created: head.created ?? Math.floor(Date.now() / 1000),
    model: head.model,
    choices: [...choices].sort(([a], [b]) => a - b).map(([index, c]) => ({
      index,
      message: {
        role: "assistant",
        content: c.content || (c.calls.size ? null : ""),
        ...(c.reasoning ? { reasoning_content: c.reasoning } : {}),
        ...(c.calls.size ? { tool_calls: [...c.calls].sort(([a], [b]) => a - b).map(([, call]) => call) } : {}),
      },
      finish_reason: c.finish ?? "stop",
    })),
    ...(usage ? { usage } : {}),
  });
}

function failure(error: unknown): Response {
  const result = json(error instanceof HTTPError ? error.status : 502, { error: { message: error instanceof HTTPError ? error.message : "Subscription upstream request failed." } });
  if (error instanceof HTTPError && error.status === 413) result.headers.set("connection", "close");
  return result;
}

export async function serveSubscriptionBridge(options: {
  directory: string;
  upstream: SubscriptionUpstream;
  apiKey: string;
  port: number;
} & SubscriptionPluginOptions): Promise<SubscriptionBridgeServer> {
  if (!options.apiKey) throw new Error("Subscription bridge requires an API key.");
  const ctx = await context(options.directory, options.upstream, options);
  const loader = await ctx.plugin.auth.loader(ctx.getAuth);
  if (!loader.fetch || !loader.baseURL) throw new Error("Subscription is not signed in.");
  const pluginFetch = loader.fetch;
  const endpoint = `${loader.baseURL.replace(/\/$/, "")}/chat/completions`;
  // Bun 1.3's node:http loses disconnect events after the request body ends.
  // Native Request.signal keeps upstream cancellation working in compiled binaries.
  if (typeof Bun !== "undefined") {
    const native = Bun.serve({
      hostname: "127.0.0.1",
      port: options.port,
      idleTimeout: 0,
      maxRequestBodySize: MAX_BODY_BYTES + 64 * 1024,
      fetch: async (request) => {
        try {
          return await bridgeResponse({ method: request.method, url: request.url, headers: request.headers, body: () => webRequestBody(request), signal: request.signal }, ctx, pluginFetch, endpoint, options);
        } catch (error) {
          if (request.signal.aborted) return new Response(null, { status: 499 });
          return failure(error);
        }
      },
      error: () => failure(new Error("HTTP request failed.")),
    });
    let closing = false;
    return {
      address: () => closing ? null : { address: "127.0.0.1", family: "IPv4", port: native.port! },
      close: (callback) => {
        closing = true;
        void native.stop(false).then(() => callback?.(), (error: Error) => callback?.(error));
      },
      closeAllConnections: () => { closing = true; void native.stop(true); },
    };
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
      const upstream = await bridgeResponse({ method: request.method ?? "GET", url: request.url ?? "/", headers, body: () => requestBody(request), signal: abort.signal }, ctx, pluginFetch, endpoint, options);
      const responseHeaders: Record<string, string> = {};
      upstream.headers.forEach((value, name) => { responseHeaders[name] = value; });
      response.writeHead(upstream.status, responseHeaders);
      if (upstream.body) {
        await pipeline(Readable.fromWeb(upstream.body as unknown as import("node:stream/web").ReadableStream), response, { signal: abort.signal });
      } else response.end();
    } catch (error) {
      if (abort.signal.aborted || response.destroyed) return;
      if (response.headersSent) response.destroy();
      else {
        if (error instanceof HTTPError && error.status === 413) {
          response.shouldKeepAlive = false;
          response.once("finish", () => request.destroy());
        }
        const result = failure(error);
        response.writeHead(result.status, Object.fromEntries(result.headers));
        response.end(await result.text());
      }
    } finally {
      request.removeListener("aborted", disconnected);
      response.removeListener("close", disconnected);
      request.socket.removeListener("close", disconnected);
    }
  });
  server.requestTimeout = 60_000;
  server.headersTimeout = 15_000;
  await new Promise<void>((resolveListening, reject) => {
    server.once("error", reject);
    server.listen(options.port, "127.0.0.1", () => {
      server.removeListener("error", reject);
      resolveListening();
    });
  });
  return server;
}
