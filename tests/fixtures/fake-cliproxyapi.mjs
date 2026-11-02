#!/usr/bin/env bun

// Tiny local stand-in for the managed-binary contract. It intentionally never
// contacts OpenAI/ChatGPT: tests use it only to exercise config, locking,
// ownership and staging-login behavior against loopback HTTP.
import { appendFile, mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";

const args = process.argv.slice(2);

if (args.includes("--help")) {
  console.log("CLIProxyAPI Version: 7.3.20, Commit: fixture");
  process.exit(0);
}

const configIndex = args.indexOf("-config");
const configPath = configIndex >= 0 ? args[configIndex + 1] : undefined;
if (!configPath) {
  console.error("missing -config");
  process.exit(2);
}

const config = await readFile(configPath, "utf-8");

function yamlScalar(key) {
  const match = config.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return match[1].trim();
  }
}

const authDir = yamlScalar("auth-dir");
const port = Number(yamlScalar("port"));

if (args.includes("-codex-login") || args.includes("-antigravity-login")) {
  if (process.env.CLAUDEX_FAKE_LOGIN_EXIT) {
    process.exit(Number(process.env.CLAUDEX_FAKE_LOGIN_EXIT));
  }
  if (!authDir) {
    console.error("missing auth-dir");
    process.exit(2);
  }
  await mkdir(authDir, { recursive: true });
  if (args.includes("-antigravity-login")) {
    await writeFile(
      join(authDir, "antigravity-fixture.json"),
      JSON.stringify({
        type: "antigravity",
        access_token: "fixture-access-token",
        email: process.env.CLAUDEX_FAKE_AUTH_EMAIL ?? "fixture@example.com",
      }),
    );
    process.exit(0);
  }
  const sub = process.env.CLAUDEX_FAKE_AUTH_SUB ?? "fixture-user";
  const claims = { sub };
  if (process.env.CLAUDEX_FAKE_CHATGPT_ACCOUNT_ID) {
    claims["https://api.openai.com/auth"] = {
      chatgpt_account_id: process.env.CLAUDEX_FAKE_CHATGPT_ACCOUNT_ID,
    };
  }
  const idToken = `x.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.`;
  await writeFile(
    join(authDir, "auth.json"),
    JSON.stringify({
      type: "codex",
      access_token: "fixture-access-token",
      id_token: idToken,
    }),
  );
  process.exit(0);
}

if (!Number.isInteger(port) || port < 1) {
  console.error("missing port");
  process.exit(2);
}

const startedAt = Date.now();
const server = Bun.serve({
  hostname: "127.0.0.1",
  port,
  async fetch(request) {
    const path = new URL(request.url).pathname;
    if (path === "/v1/models") {
      // Optional fixture catalog, e.g. what a logged-in Antigravity lists.
      // Like the real 7.3.20: the built-in list first, the remote catalog later.
      const late = process.env.CLAUDEX_FAKE_MODELS_LATE !== undefined
        && Date.now() - startedAt >= Number(process.env.CLAUDEX_FAKE_MODELS_LATE_MS ?? 0);
      const ids = (late ? process.env.CLAUDEX_FAKE_MODELS_LATE : process.env.CLAUDEX_FAKE_MODELS ?? "claude-opus-5-5-high,claude-sonnet-5-5-high,gemini-3.8-flash-high").split(",").filter(Boolean);
      return Response.json({ object: "list", data: ids.map((id) => ({ id, object: "model" })) });
    }
    if (path === "/v1/messages") {
      if (process.env.CLAUDEX_FAKE_AUTO_LOG) {
        const body = await request.json();
        await appendFile(process.env.CLAUDEX_FAKE_AUTO_LOG, `${JSON.stringify(body)}\n`);
        const catalog = (process.env.CLAUDEX_FAKE_MODELS ?? "claude-opus-5-5-high,claude-sonnet-5-5-high,gemini-3.8-flash-high").split(",");
        if (!catalog.includes(body.model)) return Response.json({ error: { type: "invalid_request_error", message: `unknown provider for model ${body.model}` } }, { status: 400 });
        const toolResult = body.messages?.some((message) => Array.isArray(message.content) && message.content.some((item) => item.type === "tool_result"));
        const content = body.tools?.some((tool) => tool.name === "Bash") && !toolResult
          ? [{ type: "tool_use", id: "fixture-bash", name: "Bash", input: { command: process.env.CLAUDEX_FAKE_BASH_COMMAND ?? "node -e \"require('fs').writeFileSync('auto-proof.txt', 'AUTO_MODE_OK')\"", description: "Write the requested fixture proof" } }]
          : [{ type: "text", text: body.tools?.length ? "AUTO_MODE_OK"
            : body.stop_sequences?.includes("</block>") ? "<block>no</block>" : "<severity>0</severity>" }];
        const message = { id: "msg_fixture", type: "message", role: "assistant", model: body.model,
          content, stop_reason: content[0].type === "tool_use" ? "tool_use" : "end_turn", stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 10 } };
        if (!body.stream) return Response.json(message);
        const frames = [{ type: "message_start", message: { ...message, content: [] } }];
        for (const [index, block] of content.entries()) {
          frames.push({ type: "content_block_start", index, content_block: block.type === "tool_use" ? { ...block, input: {} } : { type: "text", text: "" } });
          frames.push({ type: "content_block_delta", index, delta: block.type === "tool_use" ? { type: "input_json_delta", partial_json: JSON.stringify(block.input) } : { type: "text_delta", text: block.text } });
          frames.push({ type: "content_block_stop", index });
        }
        frames.push({ type: "message_delta", delta: { stop_reason: message.stop_reason, stop_sequence: null }, usage: message.usage }, { type: "message_stop" });
        return new Response(frames.map((frame) => `event: ${frame.type}\ndata: ${JSON.stringify(frame)}\n\n`).join(""), { headers: { "content-type": "text/event-stream" } });
      }
      if (process.env.CLAUDEX_FAKE_LIVE_STATUS) {
        return Response.json({ error: { type: "fixture_error" } }, { status: Number(process.env.CLAUDEX_FAKE_LIVE_STATUS) });
      }
      return Response.json({
        id: "fixture-message",
        type: "message",
        role: "assistant",
        content: [{ type: "text", text: "OK" }],
      });
    }
    if (path === "/fixture-debug") {
      return Response.json({
        cwd: process.cwd(),
        hasHomeJwt: Boolean(process.env.HOME_JWT),
        hasPgstore: Object.keys(process.env).some((key) =>
          key.toUpperCase().startsWith("PGSTORE_"),
        ),
        hasDeploymentSelector: Boolean(
          process.env.DEPLOY || process.env.MANAGEMENT_PASSWORD,
        ),
      });
    }
    return new Response("not found", { status: 404 });
  },
});

function stop() {
  server.stop(true);
  process.exit(0);
}

process.on("SIGTERM", stop);
process.on("SIGINT", stop);
