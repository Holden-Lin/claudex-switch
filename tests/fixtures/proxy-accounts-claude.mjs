// Reload the actual launcher's settings sources as Claude Code does. All data
// comes from the acceptance script's synthetic HOME, including loopback keys.
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
assert(process.env.CLAUDEX_TEST_HOME?.includes("claudex-proxy-accounts-"));
const args = process.argv.slice(2);
const settingsIndex = args.indexOf("--settings");
const source = settingsIndex < 0 ? undefined : args[settingsIndex + 1];
async function json(file) {
  try { return JSON.parse(await readFile(file, "utf8")); } catch { return {}; }
}
async function effective() {
  const shared = await json(join(process.env.CLAUDE_CONFIG_DIR ?? join(process.env.HOME, ".claude"), "settings.json"));
  const overlay = source ? source.startsWith("{") ? JSON.parse(source) : await json(source) : {};
  const env = { ...process.env, ...shared.env, ...overlay.env };
  const modelIndex = args.indexOf("--model");
  return { env, model: modelIndex < 0 ? env.ANTHROPIC_MODEL || overlay.model || shared.model || "default" : args[modelIndex + 1] };
}
async function report(phase) {
  const { env, model } = await effective();
  const value = { phase, model, route: env.ANTHROPIC_BASE_URL || "oauth",
    opus: env.ANTHROPIC_DEFAULT_OPUS_MODEL, subagent: env.CLAUDE_CODE_SUBAGENT_MODEL || "",
    force: env.CLAUDE_CODE_SUBAGENT_MODEL_FORCE || "", classifier: env.CLAUDE_CODE_AUTO_MODE_SERVER || "" };
  console.log(`SESSION_REPORT ${JSON.stringify(value)}`);
  return { env, model };
}
if (process.env.CLAUDEX_SESSION_SIGNAL_FILE) {
  let previous = "";
  for (;;) {
    const phase = await readFile(process.env.CLAUDEX_SESSION_SIGNAL_FILE, "utf8");
    if (phase === "exit") break;
    if (phase !== previous) {
      if (phase === "write-model") {
        const file = join(process.env.CLAUDE_CONFIG_DIR, "settings.json");
        const settings = await json(file);
        settings.model = `fixture-private-${process.env.CLAUDEX_SESSION_ALIAS}`;
        await writeFile(file, JSON.stringify(settings));
      }
      await report(phase);
      previous = phase;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
} else {
  const { env, model } = await report("bare");
  const url = new URL(env.ANTHROPIC_BASE_URL);
  assert.equal(url.hostname, "127.0.0.1");
  const response = await fetch(`${url.origin}/v1/messages`, { method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${env.ANTHROPIC_AUTH_TOKEN}` },
    body: JSON.stringify({ model, max_tokens: 10, messages: [{ role: "user", content: "fixture" }] }) });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).content[0].text, "OK");
  console.log("BARE_CLAUDE_OK");
}
