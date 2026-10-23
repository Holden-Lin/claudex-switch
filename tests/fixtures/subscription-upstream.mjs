// Synthetic vendor transport for verify-subscription-bridge.ts. Node imports
// this before the real built launcher and its managed adapter supervisor.
import { appendFileSync } from "node:fs";

const originalFetch = globalThis.fetch;
const model = "claude-sonnet-5-5";
const allowedHosts = new Set(["copilot.tencent.com", "www.workbuddy.ai"]);
const loopback = new Set(["127.0.0.1", "localhost", "[::1]"]);
const log = (event) => appendFileSync(process.env.CLAUDEX_SUBSCRIPTION_FIXTURE_LOG, `${JSON.stringify(event)}\n`);

function completion(chat, delta, finish = null) {
  return { id: "chatcmpl-synthetic", object: "chat.completion.chunk", created: 1,
    model: chat.model, choices: [{ index: 0, delta, finish_reason: finish }] };
}

function streamed(chat, deltas, finish) {
  const frames = [completion(chat, { role: "assistant" }),
    ...deltas.map((delta) => completion(chat, delta)), completion(chat, {}, finish),
    { id: "chatcmpl-synthetic", object: "chat.completion.chunk", created: 1,
      model: chat.model, choices: [], usage: { prompt_tokens: 20, completion_tokens: 15, total_tokens: 35 } }];
  let index = 0;
  return new Response(new ReadableStream({
    async pull(controller) {
      // Distinct chunks exercise the real SSE conversion and client parser.
      await new Promise((resolve) => setTimeout(resolve, 5));
      if (index < frames.length) controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(frames[index++])}\n\n`));
      else { controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n")); controller.close(); }
    },
  }), { headers: { "content-type": "text/event-stream", "cache-control": "no-cache" } });
}

globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  if (loopback.has(url.hostname)) return originalFetch(input, init);
  if (!allowedHosts.has(url.hostname)) {
    log({ type: "blocked", host: url.hostname, path: url.pathname });
    throw new Error("Synthetic acceptance fixture forbids external network requests.");
  }
  if (url.pathname === "/v3/config") {
    log({ type: "catalog", host: url.hostname });
    return Response.json({ code: 0, data: {
      agents: [{ name: "cli", models: [model] }],
      models: [{ id: model, name: "Synthetic Claude Sonnet", maxInputTokens: 200000,
        maxOutputTokens: 8192, supportsImages: false, supportsTools: true }],
    } });
  }
  if (url.pathname === "/v2/chat/completions") {
    const chat = JSON.parse(typeof init?.body === "string" ? init.body : new TextDecoder().decode(init.body));
    if (!chat.stream) throw new Error("Acceptance fixture requires streaming.");
    const read = chat.tools?.find((tool) => /^(?:read|read_file)$/i.test(tool.function?.name ?? ""));
    const results = chat.messages.filter((message) => message.role === "tool");
    log({ type: "chat", model: chat.model, toolResults: results.length, readAvailable: !!read });
    if (!read) return streamed(chat, [{ content: "allow" }], "stop");
    if (results.length < 2) {
      const round = results.length + 1;
      const args = JSON.stringify({ file_path: process.env.CLAUDEX_SUBSCRIPTION_PROOF_FILE, offset: 1, limit: 1 });
      const middle = Math.floor(args.length / 2);
      log({ type: "read", round });
      return streamed(chat, [
        { tool_calls: [{ index: 0, id: `synthetic_read_${round}`, type: "function", function: { name: read.function.name, arguments: args.slice(0, middle) } }] },
        { tool_calls: [{ index: 0, function: { arguments: args.slice(middle) } }] },
      ], "tool_calls");
    }
    const observed = results.map((result) => typeof result.content === "string" ? result.content : JSON.stringify(result.content)).join("\n");
    const proof = observed.match(/SYNTHETIC_PROOF_[a-f0-9-]+/)?.[0];
    if (!proof) throw new Error("Read tool results did not contain the proof nonce.");
    log({ type: "result", proof, toolResults: results.length });
    return streamed(chat, [{ content: "SUBSCRIPTION_BRIDGE_OK " }, { content: proof }], "stop");
  }
  log({ type: "blocked", host: url.hostname, path: url.pathname });
  throw new Error("Synthetic acceptance fixture rejected an unexpected vendor endpoint.");
};
