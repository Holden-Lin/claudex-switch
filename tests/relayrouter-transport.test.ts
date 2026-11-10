import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startRelayrouterSession } from "../src/providers/claude/relayrouter";

const running: Array<{ close: () => Promise<void> }> = [];
afterEach(async () => { for (const server of running.splice(0).reverse()) await server.close(); });

async function fixture(handler: (request: Request) => Response | Promise<Response>) {
  const upstream = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: handler });
  running.push({ close: async () => { await upstream.stop(true); } });
  const session = await startRelayrouterSession(`http://127.0.0.1:${upstream.port}`);
  running.push(session);
  return session;
}

function history() {
  return {
    model: "glm-5.3-flash", stream: true, max_tokens: 100,
    thinking: { type: "enabled", budget_tokens: 1024 }, output_config: { effort: "high" },
    messages: [
      { role: "user", content: "Use the calculator." },
      { role: "assistant", content: [{ type: "thinking", thinking: "private reasoning", signature: "fixture" }] },
      { role: "assistant", content: [
        { type: "thinking", thinking: "private reasoning", signature: "fixture" },
        { type: "redacted_thinking", data: "opaque" },
        { type: "text", text: "Calculating." },
        { type: "tool_use", id: "call-1", name: "calculator", input: { expression: "6*7" } },
      ] },
      { role: "user", content: [{ type: "tool_result", tool_use_id: "call-1", content: "42" }] },
    ],
  };
}

describe("RelayRouter session transport", () => {
  test("Node runtime preserves responses and cancels the upstream when closing", async () => {
    const directory = await mkdtemp(join(tmpdir(), "relayrouter-node-"));
    try {
      const build = await Bun.build({ entrypoints: [join(import.meta.dir, "fixtures/relayrouter-transport-node.ts")], target: "node" });
      expect(build.success).toBe(true);
      const file = join(directory, "transport.mjs");
      await writeFile(file, await build.outputs[0]!.text());
      const child = Bun.spawn(["node", file], { stdout: "pipe", stderr: "pipe" });
      const [code, output, errors] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()]);
      expect(errors).toBe("");
      expect(code).toBe(0);
      expect(output.trim()).toBe("NODE_RELAY_TRANSPORT_OK");
    } finally { await rm(directory, { recursive: true, force: true }); }
  });

  test.each(["/v1/messages", "/v1/messages/count_tokens"])("strips only assistant reasoning history at %s and preserves the streamed answer", async (path) => {
    let received: ReturnType<typeof history> | undefined;
    const stream = 'event: content_block_start\ndata: {"type":"thinking","thinking":"new reasoning"}\n\nevent: message_stop\ndata: {}\n\n';
    const session = await fixture(async (request) => {
      received = await request.json() as ReturnType<typeof history>;
      expect(new URL(request.url).pathname).toBe(path);
      expect(new URL(request.url).search).toBe("?beta=true");
      expect(request.headers.get("x-api-key")).toBe("fixture-key");
      expect(request.headers.get("anthropic-version")).toBe("2023-06-01");
      if (received.messages.some((m) => m.role === "assistant" && Array.isArray(m.content) && m.content.some((b) => b.type === "thinking"))) {
        return Response.json({ error: "ChatCompletionRequestAssistantMessageContent" }, { status: 400 });
      }
      return new Response(stream, { headers: { "content-type": "text/event-stream", "request-id": "fixture-request" } });
    });
    const original = history();
    const result = await fetch(`${session.baseUrl}${path}?beta=true`, {
      method: "POST", headers: { "x-api-key": "fixture-key", "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify(original),
    });
    expect(result.status).toBe(200);
    expect(result.headers.get("request-id")).toBe("fixture-request");
    expect(await result.text()).toBe(stream);
    expect(received).toEqual({ ...original, messages: [
      original.messages[0], { ...original.messages[2], content: (original.messages[2]!.content as Array<{ type: string }>).slice(2) }, original.messages[3],
    ] });
  });

  test("preserves another selected model and the upstream's denial/error response", async () => {
    const requestBody = { ...history(), model: "gpt-6-astra", stream: false };
    const denied = '{"content":[{"type":"text","text":"<block>yes</block>"}]}';
    const session = await fixture(async (request) => {
      expect(await request.json()).toEqual(requestBody);
      return new Response(denied, { status: 429, headers: { "content-type": "application/json", "retry-after": "120" } });
    });
    const result = await fetch(`${session.baseUrl}/v1/messages`, { method: "POST", body: JSON.stringify(requestBody) });
    expect(result.status).toBe(429);
    expect(result.headers.get("retry-after")).toBe("120");
    expect(await result.text()).toBe(denied);
  });

  test("rejects malformed bodies and unrelated paths without contacting the upstream", async () => {
    let calls = 0;
    const session = await fixture(() => { calls += 1; return new Response("unexpected"); });
    expect((await fetch(`${session.baseUrl}/v1/messages`, { method: "POST", body: "{" })).status).toBe(400);
    expect((await fetch(`${session.baseUrl}/v1/messages`, { method: "POST", body: "null" })).status).toBe(400);
    expect((await fetch(`${session.baseUrl}/api/user/self`)).status).toBe(404);
    expect(calls).toBe(0);
  });

  test("closing a session aborts an in-flight upstream response and removes the listener", async () => {
    let started!: () => void;
    let aborted!: () => void;
    const ready = new Promise<void>((resolve) => { started = resolve; });
    const cancelled = new Promise<void>((resolve) => { aborted = resolve; });
    const session = await fixture((request) => {
      request.signal.addEventListener("abort", aborted, { once: true });
      started();
      return new Response(new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode("data: pending\n\n")); } }), { headers: { "content-type": "text/event-stream" } });
    });
    const response = fetch(`${session.baseUrl}/v1/messages`, { method: "POST", body: JSON.stringify(history()) }).catch(() => undefined);
    await ready;
    await session.close();
    await response;
    await Promise.race([cancelled, new Promise((_, reject) => setTimeout(() => reject(new Error("Upstream was not cancelled")), 1000))]);
    running.splice(running.indexOf(session), 1);
    await expect(fetch(`${session.baseUrl}/v1/models`)).rejects.toThrow();
  });
});
