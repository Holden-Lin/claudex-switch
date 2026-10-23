import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { request as httpRequest } from "node:http";
import {
  hasSubscriptionLogin,
  isSubscriptionUpstream,
  listSubscriptionModels,
  loginSubscriptionPlugin,
  serveSubscriptionBridge,
  SUBSCRIPTION_AUTH_FILE,
  subscriptionLoginMethods,
  type SubscriptionPlugin,
  type SubscriptionBridgeServer,
  type SubscriptionPluginOptions,
  type SubscriptionUpstream,
} from "../src/providers/subscription-plugins";

const directories: string[] = [];
const servers: SubscriptionBridgeServer[] = [];
async function directory() {
  const dir = await mkdtemp(join(tmpdir(), "claudex-subscription-"));
  directories.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => {
    server.close(() => resolve());
    server.closeAllConnections();
  })));
  await Promise.all(directories.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

type Client = Parameters<NonNullable<SubscriptionPluginOptions["pluginFactory"]>>[0]["client"];
type GetAuth = Parameters<SubscriptionPlugin["auth"]["loader"]>[0];
function fake(options: {
  upstream?: SubscriptionUpstream;
  result?: Record<string, unknown>;
  fetch?: (input: string, init: RequestInit, auth: GetAuth, client: Client) => Promise<Response>;
  models?: SubscriptionPlugin["provider"];
} = {}): SubscriptionPluginOptions {
  const upstream = options.upstream ?? "cursor";
  return {
    openUrl: () => {},
    pluginFactory: async ({ client }) => ({
      auth: {
        provider: upstream,
        methods: [
          { type: "api", label: "Hidden API key" },
          { type: "oauth", label: "Browser", authorize: async () => ({
            method: "auto", url: "https://example.com/login", instructions: "Sign in in browser.",
            callback: async () => ({ type: "success", access: "secret-access", refresh: "secret-refresh", accountId: "account-one", ...options.result }),
          }) },
        ],
        loader: async (auth) => ({ baseURL: "https://example.com/v1", fetch: async (input, init) => options.fetch ? options.fetch(input, init, auth, client) : Response.json({ choices: [] }) }),
      },
      config: async (config) => { config.provider[upstream] = { models: { "real-model": { name: "Real model" } } }; },
      provider: options.models ?? { models: async (provider) => ({ ...provider.models }) },
      "chat.headers": async (input, output) => { output.headers["plugin-session"] = input.sessionID; },
    }),
  };
}

async function bridge(dir: string, options: SubscriptionPluginOptions, upstream: SubscriptionUpstream = "cursor") {
  const server = await serveSubscriptionBridge({ directory: dir, upstream, apiKey: "test-key", port: 0, ...options });
  servers.push(server);
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing listener address");
  expect(address.address).toBe("127.0.0.1");
  return `http://127.0.0.1:${address.port}`;
}

const authorization = { authorization: "Bearer test-key" };
function chat(url: string, body: unknown = { model: "real-model", messages: [] }, extra: RequestInit = {}) {
  return fetch(`${url}/v1/chat/completions`, { method: "POST", headers: { ...authorization }, body: JSON.stringify(body), ...extra });
}

describe("subscription plugin adapter", () => {
  test("loads the three actual plugin factories and lists only OAuth methods offline", async () => {
    const dir = await directory();
    for (const upstream of ["cursor", "workbuddy", "workbuddy-ai"] as const) {
      const methods = await subscriptionLoginMethods(dir, upstream);
      expect(methods).toHaveLength(2);
      expect(methods[0].label.toLowerCase()).toContain("browser");
      expect(methods[1].label).toMatch(/sign-in/);
      expect(methods[1].label).toContain("follows the app account");
    }
    expect(isSubscriptionUpstream("workbuddy-ai")).toBe(true);
    expect(isSubscriptionUpstream("constructor")).toBe(false);
    expect(await hasSubscriptionLogin(dir, "cursor")).toBe(false);
    await expect(listSubscriptionModels(dir, "cursor")).rejects.toThrow("not signed in");
  });

  test("stores private atomic auth and stable hashed account identity", async () => {
    const dir = await directory();
    const notices: string[] = [];
    const options = fake();
    expect(await subscriptionLoginMethods(dir, "cursor", options)).toEqual([{ label: "Browser" }]);
    const first = await loginSubscriptionPlugin(dir, "cursor", 0, (notice) => notices.push(notice), options);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(notices).toEqual(["Sign in in browser.", "https://example.com/login"]);
    const second = await loginSubscriptionPlugin(dir, "cursor", 0, () => {}, fake({ result: { access: "rotated-access" } }));
    expect(second).toBe(first);
    const file = join(dir, SUBSCRIPTION_AUTH_FILE);
    expect((await stat(file)).mode & 0o777).toBe(0o600);
    expect(await hasSubscriptionLogin(dir, "cursor")).toBe(true);
    expect(await hasSubscriptionLogin(dir, "workbuddy")).toBe(false);
    expect(await listSubscriptionModels(dir, "cursor", options)).toEqual([{ id: "real-model", display_name: "Real model" }]);
    await expect(loginSubscriptionPlugin(dir, "cursor", -1, () => {}, options)).rejects.toThrow("Unknown");
    await writeFile(file, "bad json");
    expect(await hasSubscriptionLogin(dir, "cursor")).toBe(false);
  });

  test("desktop login keeps only the plugin marker, with no imported rotating tokens", async () => {
    const dir = await directory();
    await loginSubscriptionPlugin(dir, "workbuddy", 0, () => {}, fake({ upstream: "workbuddy", result: { source: "desktop", uid: "desktop-uid" } }));
    const stored = JSON.parse(await readFile(join(dir, SUBSCRIPTION_AUTH_FILE), "utf8"));
    expect(stored.auth).toMatchObject({ source: "desktop", access: "", refresh: "", expires: 0 });
    expect(await hasSubscriptionLogin(dir, "workbuddy")).toBe(true);
  });

  test("normalizes numeric account IDs and refuses an access token as an account identity", async () => {
    const dir = await directory();
    const numeric = await loginSubscriptionPlugin(dir, "workbuddy", 0, () => {}, fake({ upstream: "workbuddy", result: { uid: 123 } }));
    const text = await loginSubscriptionPlugin(dir, "workbuddy", 0, () => {}, fake({ upstream: "workbuddy", result: { uid: "123" } }));
    expect(numeric).toBe(text);
    await expect(loginSubscriptionPlugin(dir, "cursor", 0, () => {}, fake({ result: { accountId: undefined } }))).rejects.toThrow("did not identify");
  });

  test("rejects configured fallback and empty catalogs rather than presenting guessed models", async () => {
    const dir = await directory();
    await loginSubscriptionPlugin(dir, "cursor", 0, () => {}, fake());
    await expect(listSubscriptionModels(dir, "cursor", fake({ models: { models: async (provider) => provider.models } }))).rejects.toThrow("catalog is unavailable");
    await expect(listSubscriptionModels(dir, "cursor", fake({ models: { models: async () => ({}) } }))).rejects.toThrow("catalog is unavailable");
    expect(await listSubscriptionModels(dir, "cursor", fake())).toEqual([{ id: "real-model", display_name: "Real model" }]);
  });

  test("authenticates every endpoint and returns the plugin model IDs", async () => {
    const dir = await directory();
    await loginSubscriptionPlugin(dir, "cursor", 0, () => {}, fake());
    const url = await bridge(dir, fake());
    for (const path of ["/health", "/v1/models", "/v1/chat/completions"]) {
      expect((await fetch(url + path)).status).toBe(401);
      expect((await fetch(url + path, { headers: { authorization: "Bearer wrong" } })).status).toBe(401);
    }
    expect(await (await fetch(url + "/health", { headers: { "x-api-key": "test-key" } })).json()).toEqual({ status: "ok", upstream: "cursor" });
    expect(await (await fetch(url + "/v1/models", { headers: authorization })).json()).toEqual({ object: "list", data: [{ id: "real-model", display_name: "Real model", object: "model", owned_by: "cursor" }] });
    expect((await fetch(url + "/other", { headers: authorization })).status).toBe(404);
  });

  test("streams without buffering, forwards session headers, and preserves upstream errors", async () => {
    const dir = await directory();
    await loginSubscriptionPlugin(dir, "cursor", 0, () => {}, fake());
    let finish: (() => void) | undefined;
    const url = await bridge(dir, fake({ fetch: async (input, init) => {
      expect(input).toBe("https://example.com/v1/chat/completions");
      expect(new Headers(init.headers).get("authorization")).toBeNull();
      const body = JSON.parse(String(init.body));
      if (body.model === "rejected") return new Response('{"error":{"message":"quota exhausted"}}', { status: 429, headers: { "retry-after": "10", "content-type": "application/json" } });
      expect(new Headers(init.headers).get("plugin-session")).toBe("conversation-one");
      return new Response(new ReadableStream({ start(controller) {
        controller.enqueue(new TextEncoder().encode("data: first\n\n"));
        finish = () => { controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n")); controller.close(); };
      } }), { headers: { "content-type": "text/event-stream", "content-encoding": "gzip" } });
    } }));
    const response = await chat(url, undefined, { headers: { ...authorization, "x-claudex-session": "conversation-one" } });
    expect(response.headers.get("content-encoding")).toBeNull();
    const reader = response.body!.getReader();
    expect(new TextDecoder().decode((await reader.read()).value)).toBe("data: first\n\n");
    finish!();
    expect(new TextDecoder().decode((await reader.read()).value)).toBe("data: [DONE]\n\n");
    expect((await reader.read()).done).toBe(true);
    const error = await chat(url, { model: "rejected" });
    expect(error.status).toBe(429);
    expect(error.headers.get("retry-after")).toBe("10");
    expect(await error.text()).toBe('{"error":{"message":"quota exhausted"}}');
  });

  test("WorkBuddy answers a non-stream chat by collecting its stream, and passes stream chats through", async () => {
    const dir = await directory();
    const options = fake({ upstream: "workbuddy-ai", fetch: async (_input, init) => {
      const body = JSON.parse(String(init.body));
      expect(body.stream).toBe(true);
      if (body.model === "broken") return new Response('data: {"error":{"message":"quota exhausted"}}\n\n', { headers: { "content-type": "text/event-stream" } });
      if (body.model === "rejected") return new Response('{"code":11101}', { status: 400, headers: { "content-type": "application/json" } });
      const chunks = [
        { id: "c1", created: 7, model: "deepseek-v4.1-flash", choices: [{ index: 0, delta: { role: "assistant", reasoning_content: "thin" } }] },
        { id: "c1", choices: [{ index: 0, delta: { reasoning_content: "king", content: "Hel" } }] },
        { id: "c1", choices: [{ index: 0, delta: { content: "lo", tool_calls: [{ index: 0, id: "call-1", type: "function", function: { name: "Read", arguments: '{"file' } }] } }] },
        { id: "c1", choices: [{ index: 0, delta: { tool_calls: [{ index: 0, function: { arguments: '_path":"a"}' } }] }, finish_reason: "tool_calls" }] },
        { id: "c1", choices: [], usage: { prompt_tokens: 3, completion_tokens: 4, total_tokens: 7 } },
      ];
      const sse = body.stream_options?.include_usage ? chunks.map((c) => `data: ${JSON.stringify(c)}\n\n`).join("") + "data: [DONE]\n\n" : "data: passthrough\n\n";
      return new Response(sse, { headers: { "content-type": "text/event-stream" } });
    } });
    await loginSubscriptionPlugin(dir, "workbuddy-ai", 0, () => {}, options);
    const url = await bridge(dir, options, "workbuddy-ai");
    const collected = await chat(url, { model: "deepseek-v4.1-flash", messages: [], stream: false });
    expect(collected.status).toBe(200);
    expect(await collected.json()).toEqual({
      id: "c1", object: "chat.completion", created: 7, model: "deepseek-v4.1-flash",
      choices: [{ index: 0, finish_reason: "tool_calls", message: {
        role: "assistant", content: "Hello", reasoning_content: "thinking",
        tool_calls: [{ id: "call-1", type: "function", function: { name: "Read", arguments: '{"file_path":"a"}' } }],
      } }],
      usage: { prompt_tokens: 3, completion_tokens: 4, total_tokens: 7 },
    });
    expect(await (await chat(url, { model: "deepseek-v4.1-flash", messages: [], stream: true })).text()).toBe("data: passthrough\n\n");
    const broken = await chat(url, { model: "broken", messages: [] });
    expect(broken.status).toBe(502);
    expect(await broken.json()).toEqual({ error: { message: "quota exhausted" } });
    const rejected = await chat(url, { model: "rejected", messages: [] });
    expect(rejected.status).toBe(400);
    expect(await rejected.text()).toBe('{"code":11101}');
  });

  test("serializes concurrent auth.set updates and reads the latest auth on the next request", async () => {
    const dir = await directory();
    await loginSubscriptionPlugin(dir, "cursor", 0, () => {}, fake());
    let calls = 0;
    const url = await bridge(dir, fake({ fetch: async (_input, _init, auth, client) => {
      if (++calls === 1) {
        await Promise.all([
          client.auth.set({ path: { id: "cursor" }, body: { access: "renewed-access" } }),
          client.auth.set({ path: { id: "cursor" }, body: { refresh: "renewed-refresh", expires: 123456 } }),
        ]);
      }
      return Response.json(await auth());
    } }));
    await Promise.all([chat(url), chat(url)]);
    const latest = await (await chat(url)).json();
    expect(latest).toMatchObject({ access: "renewed-access", refresh: "renewed-refresh", expires: 123456, accountId: "account-one" });
    const disk = JSON.parse(await readFile(join(dir, SUBSCRIPTION_AUTH_FILE), "utf8"));
    expect(disk.auth).toEqual(latest);
  });

  test("the real WorkBuddy plugin refresh callback persists rotated tokens once across parallel model calls", async () => {
    const dir = await directory();
    await loginSubscriptionPlugin(dir, "workbuddy", 0, () => {}, fake({ upstream: "workbuddy", result: { uid: "wb-user", expires: 1 } }));
    const nativeFetch = globalThis.fetch;
    let refreshes = 0;
    globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      if (url.pathname === "/v2/plugin/auth/token/refresh") {
        refreshes++;
        expect(new Headers(init?.headers).get("x-refresh-token")).toBe("secret-refresh");
        await new Promise((resolve) => setTimeout(resolve, 10));
        return Response.json({ code: 0, data: { accessToken: "workbuddy-renewed", refreshToken: "workbuddy-next-refresh", expiresIn: 3600 } });
      }
      if (url.pathname === "/v3/config") {
        expect(new Headers(init?.headers).get("authorization")).toBe("Bearer workbuddy-renewed");
        return Response.json({ code: 0, data: { agents: [{ name: "cli", models: ["real-wb-model"] }], models: [{ id: "real-wb-model", name: "WorkBuddy live model", maxInputTokens: 1_000_000 }] } });
      }
      throw new Error("Unexpected network request in offline test.");
    }) as typeof fetch;
    try {
      const lists = await Promise.all([listSubscriptionModels(dir, "workbuddy"), listSubscriptionModels(dir, "workbuddy")]);
      const live = { id: "real-wb-model", display_name: "WorkBuddy live model", context_window: 1_000_000 };
      expect(lists).toEqual([[live], [live]]);
      expect(refreshes).toBe(1);
      const stored = JSON.parse(await readFile(join(dir, SUBSCRIPTION_AUTH_FILE), "utf8"));
      expect(stored.auth).toMatchObject({ type: "oauth", uid: "wb-user", accountId: "account-one", access: "workbuddy-renewed", refresh: "workbuddy-next-refresh" });
      expect(stored.auth.expires).toBeGreaterThan(Date.now());
    } finally {
      globalThis.fetch = nativeFetch;
    }
  });

  test("aborts an upstream stream when the downstream client disconnects", async () => {
    const dir = await directory();
    await loginSubscriptionPlugin(dir, "cursor", 0, () => {}, fake());
    let didAbort!: () => void;
    let didCancel!: () => void;
    const aborted = new Promise<void>((resolve) => { didAbort = resolve; });
    const cancelled = new Promise<void>((resolve) => { didCancel = resolve; });
    const url = await bridge(dir, fake({ fetch: async (_input, init) => {
      init.signal!.addEventListener("abort", didAbort, { once: true });
      return new Response(new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode("data: first\n\n")); }, cancel() { didCancel(); } }));
    } }));
    await new Promise<void>((resolve, reject) => {
      const req = httpRequest(url + "/v1/chat/completions", { method: "POST", headers: { ...authorization } }, (res) => {
        res.once("data", () => { res.destroy(); req.destroy(); resolve(); });
      });
      req.on("error", (error) => { if ((error as NodeJS.ErrnoException).code !== "ECONNRESET") reject(error); });
      req.end(JSON.stringify({ model: "real-model", messages: [] }));
    });
    await Promise.race([Promise.all([aborted, cancelled]), new Promise((_, reject) => setTimeout(() => reject(new Error("Cancellation timed out")), 2000))]);
  });

  test("validates JSON, rejects oversized bodies, and hides internal exceptions", async () => {
    const dir = await directory();
    await loginSubscriptionPlugin(dir, "cursor", 0, () => {}, fake());
    const url = await bridge(dir, fake({ fetch: async () => { throw new Error("secret-access must never reach response"); } }));
    expect((await chat(url, [])).status).toBe(400);
    expect((await chat(url, undefined, { body: "invalid" })).status).toBe(400);
    const failed = await chat(url);
    expect(failed.status).toBe(502);
    expect(await failed.text()).not.toContain("secret-access");
    const oversized = await chat(url, undefined, { body: "x".repeat(16 * 1024 * 1024 + 1) });
    expect(oversized.status).toBe(413);
    const chunked = await new Promise<{ status: number; body: string }>((resolve, reject) => {
      // Bun 1.3's default HTTP agent can reuse the rejected upload connection and
      // get a parser-level 400 before the server sees this request. Use a fresh connection.
      const req = httpRequest(url + "/v1/chat/completions", {
        method: "POST",
        agent: false,
        headers: { ...authorization, "transfer-encoding": "chunked" },
      }, (res) => {
        let body = "";
        res.on("data", (chunk) => { body += chunk; });
        res.on("end", () => resolve({ status: res.statusCode!, body }));
        res.on("error", reject);
      });
      req.on("error", reject);
      for (let i = 0; i < 256; i++) req.write(Buffer.alloc(64 * 1024));
      req.end(Buffer.alloc(1));
    });
    expect(chunked.status).toBe(413);
    expect(JSON.parse(chunked.body)).toEqual({ error: { message: "Request body is too large." } });
  });
});
