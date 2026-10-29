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
    // Like WorkBuddy AI: an unpriced Auto first, paid models, and x0.00 ones.
    const priced = (id, name, maxInputTokens, credits) => ({ id, name, maxInputTokens,
      maxOutputTokens: 8192, supportsImages: false, supportsTools: true, ...(credits ? { credits } : {}) });
    return Response.json({ code: 0, data: {
      agents: [{ name: "cli", models: ["default-model", model, "free-flash", "limited-model", "paid-model"] }],
      models: [
        priced("default-model", "Auto", 176000),
        priced(model, "Synthetic Claude Sonnet", 200000, "x1.00"),
        priced("free-flash", "Synthetic Free Flash", 1000000, "x0.00"),
        priced("limited-model", "Synthetic Limited", 200000, "x0.00"),
        priced("paid-model", "Synthetic Paid", 200000, "x2.00"),
      ],
    } });
  }
  if (url.pathname === "/v2/chat/completions") {
    const chat = JSON.parse(typeof init?.body === "string" ? init.body : new TextDecoder().decode(init.body));
    if (!chat.stream) throw new Error("Acceptance fixture requires streaming.");
    const read = chat.tools?.find((tool) => /^(?:read|read_file)$/i.test(tool.function?.name ?? ""));
    const results = chat.messages.filter((message) => message.role === "tool");
    log({ type: "chat", model: chat.model, toolResults: results.length, readAvailable: !!read });
    // WorkBuddy's frequency window (6004) and its out-of-credits refusal (14018).
    if (chat.model === "limited-model") {
      const reset = new Date(Date.now() + 120_000 + 8 * 3600_000).toISOString().replace("T", " ").slice(0, 19);
      return Response.json({ error: { message: `WorkBuddy AI: usage exceeds frequency limit, but don't worry, your usage will reset at ${reset} UTC+8, alternatively, you can switch to the other models to continue using it.`, code: "6004" } }, { status: 429 });
    }
    if (chat.model === "paid-model") {
      return Response.json({ code: 14018, msg: "Credits exhausted. Please visit the link below to purchase add-on packs and get more credits: https://www.codebuddy.ai/profile/usage" }, { status: 429 });
    }
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
