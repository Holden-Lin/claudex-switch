import assert from "node:assert/strict";
import { createServer } from "node:http";
import { startRelayrouterSession } from "../../src/providers/claude/relayrouter";

let cancelled!: () => void;
const upstreamCancelled = new Promise<void>((resolve) => { cancelled = resolve; });
const upstream = createServer(async (request, response) => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  const body = JSON.parse(Buffer.concat(chunks).toString());
  if (body.stream) {
    request.socket.once("close", cancelled);
    response.writeHead(200, { "content-type": "text/event-stream" });
    response.write("data: pending\n\n");
    return;
  }
  assert.equal(request.headers["x-api-key"], "fixture-key");
  assert.deepEqual(body.messages, [
    { role: "assistant", content: [{ type: "tool_use", id: "call-1", name: "calculator", input: {} }] },
    { role: "user", content: [{ type: "tool_result", tool_use_id: "call-1", content: "42" }] },
  ]);
  response.writeHead(200, { "content-type": "text/event-stream" });
  response.end('data: {"type":"thinking","thinking":"response preserved"}\n\n');
});
await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve));
const { port } = upstream.address() as import("node:net").AddressInfo;
const session = await startRelayrouterSession(`http://127.0.0.1:${port}`);
try {
  const response = await fetch(`${session.baseUrl}/v1/messages`, {
    method: "POST", headers: { "x-api-key": "fixture-key", "content-type": "application/json" },
    body: JSON.stringify({ model: "glm-5.3-flash", messages: [
      { role: "assistant", content: [{ type: "thinking", thinking: "old reasoning", signature: "fixture" }] },
      { role: "assistant", content: [{ type: "tool_use", id: "call-1", name: "calculator", input: {} }] },
      { role: "user", content: [{ type: "tool_result", tool_use_id: "call-1", content: "42" }] },
    ] }),
  });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'data: {"type":"thinking","thinking":"response preserved"}\n\n');
  await fetch(`${session.baseUrl}/v1/messages`, { method: "POST", body: JSON.stringify({ model: "glm-5.3-flash", stream: true }) });
  await session.close();
  await Promise.race([upstreamCancelled, new Promise((_, reject) => setTimeout(() => reject(new Error("Node upstream was not cancelled")), 1000))]);
  await assert.rejects(fetch(`${session.baseUrl}/v1/models`));
  console.log("NODE_RELAY_TRANSPORT_OK");
} finally {
  await session.close();
  upstream.closeAllConnections();
  await new Promise<void>((resolve) => upstream.close(() => resolve()));
}
