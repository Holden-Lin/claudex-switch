/** Real-account probe: no login file is opened, copied or linked by this script.
 * The plugin uses its existing login; an owned bridge/converter and production
 * settings let Claude run without restarting user daemons. This is not proof
 * of the normal managed CLI's login/startup path.
 * Run: bun scripts/verify-workbuddy-free-ds.ts workbuddy /tmp/cxs-ds-proof
 * Launch the printed command in a visible terminal, then create OUTPUT/stop.
 */
import { randomUUID } from "node:crypto";
import { appendFile, mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { loadAliases } from "../src/alias/store";
import { getProfileData } from "../src/providers/claude/profiles";
import { cliProxyAPIProfileDir, cliProxyAPIConfigFile } from "../src/lib/paths";
import { initializeManagedCLIProxyAPI, writeRuntimeConfig, prepareLocalCLIProxyAPIClaudeSettings } from "../src/providers/cliproxyapi/managed";
import { listSubscriptionModels, serveSubscriptionBridge, WORKBUDDY_DEEPSEEK_MODEL } from "../src/providers/subscription-plugins";

const [sourceAlias = "workbuddy", destination = "/tmp/cxs-ds-proof"] = process.argv.slice(2);
const output = resolve(destination);
await mkdir(output, { recursive: true });
const entry = (await loadAliases()).aliases.find((entry) => entry.alias === sourceAlias);
if (entry?.target.provider !== "claude") throw new Error("Expected an existing WorkBuddy Claude alias.");
const source = await getProfileData(entry.target.profileName);
if (source.type !== "local-cliproxyapi" || source.upstream !== "workbuddy-ai") throw new Error("Expected an existing WorkBuddy AI login.");
const sourceDirectory = cliProxyAPIProfileDir(source.profileId);
const id = randomUUID();
const directory = cliProxyAPIProfileDir(id), config = cliProxyAPIConfigFile(id);
const originalFetch = globalThis.fetch;
let sequence = 0;
let charged = false;
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  if (url.hostname !== "www.workbuddy.ai" || url.pathname !== "/v2/chat/completions") return originalFetch(input, init);
  if (charged) throw new Error("Live proof halted: upstream reported a credit charge.");
  const request = JSON.parse(String(init?.body ?? "{}"));
  const number = ++sequence;
  const startedAt = new Date().toISOString();
  const response = await originalFetch(input, init);
  const text = await response.clone().text();
  const frames = text.split("\n").flatMap((line) => { try { return [JSON.parse(line.replace(/^data:\s*/, ""))]; } catch { return []; } });
  const content = frames.flatMap((frame) => frame.choices ?? []).map((choice) => choice.delta?.content ?? "").join("");
  const record = {
    number, startedAt, completedAt: new Date().toISOString(), host: url.hostname,
    request: { model: request.model, stream: request.stream, max_tokens: request.max_tokens,
      tools: request.tools?.length ?? 0, stop: request.stop, effort: request.reasoning_effort },
    status: response.status, responseModels: [...new Set(frames.map((frame) => frame.model).filter(Boolean))],
    usage: frames.flatMap((frame) => frame.usage ? [{ input: frame.usage.prompt_tokens, output: frame.usage.completion_tokens, credit: frame.usage.credit }] : []),
    verdicts: content.match(/<(?:block|severity)>[^<]{1,100}<\/(?:block|severity)>/g) ?? [],
    codes: [...new Set(text.match(/\b(?:14018|6004|11101|11153)\b/g) ?? [])],
  };
  await appendFile(join(output, "upstream.jsonl"), JSON.stringify(record) + "\n");
  charged = record.usage.some((usage) => typeof usage.credit === "number" && usage.credit > 0);
  if (charged) console.error("Live proof halted: nonzero usage.credit observed; no further upstream calls will be sent.");
  return response;
};
const ports = [Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: () => new Response() }), Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: () => new Response() })];
const [bridgePort, proxyPort] = ports.map((server) => server.port!);
await Promise.all(ports.map((server) => server.stop(true)));
let bridge: Awaited<ReturnType<typeof serveSubscriptionBridge>> | undefined;
let proxy: ReturnType<typeof Bun.spawn> | undefined;
try {
  const models = await listSubscriptionModels(sourceDirectory, "workbuddy-ai");
  const ids = models.map(({ id }) => id);
  if (!models.some((model) => model.id === WORKBUDDY_DEEPSEEK_MODEL && model.free)) throw new Error("No free DS entry.");
  await writeFile(join(output, "catalog.json"), JSON.stringify(models, null, 2));
  const tiers = Object.fromEntries(["fableModel", "opusModel", "sonnetModel", "haikuModel"].map((tier) => [tier, WORKBUDDY_DEEPSEEK_MODEL])) as any;
  await initializeManagedCLIProxyAPI(id, { upstream: "workbuddy-ai", models: tiers, upstreamModels: ids,
    upstreamFree: models.filter((model) => model.free).map(({ id }) => id),
    upstreamContext: Object.fromEntries(models.flatMap(({ id, context_window }) => context_window ? [[id, context_window]] : [])), subscriptionPort: bridgePort });
  const managed = await writeRuntimeConfig(id, proxyPort);
  bridge = await serveSubscriptionBridge({ directory: sourceDirectory, upstream: "workbuddy-ai", apiKey: managed.apiKey, port: bridgePort });
  proxy = Bun.spawn([source.binaryPath, "-config", config], { stdout: "ignore", stderr: "ignore" });
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { ready = (await fetch(`http://127.0.0.1:${proxyPort}/v1/models`, { headers: { authorization: `Bearer ${managed.apiKey}` } })).ok; } catch {}
    if (ready) break;
    await Bun.sleep(100);
  }
  if (!ready) throw new Error("Owned converter did not start.");
  const settings = await prepareLocalCLIProxyAPIClaudeSettings({ type: "local-cliproxyapi", profileId: id, binaryPath: source.binaryPath,
    upstream: "workbuddy-ai", defaultModel: WORKBUDDY_DEEPSEEK_MODEL }, { port: proxyPort, baseUrl: `http://127.0.0.1:${proxyPort}`, apiKey: managed.apiKey, models });
  const launch = `claude --settings ${settings} --permission-mode auto --model ${WORKBUDDY_DEEPSEEK_MODEL} --debug-file ${join(output, "claude-debug.log")} --tools Bash`;
  await writeFile(join(output, "manifest.json"), JSON.stringify({ id, sourceAlias, launch, settings, proxyPid: proxy.pid, originalProfileId: source.profileId }, null, 2));
  console.log(launch);
  console.log("READY: owned daemon; source login is used only by the plugin. Create output/stop after exiting Claude.");
  while (!await Bun.file(join(output, "stop")).exists()) await Bun.sleep(500);
} finally {
  proxy?.kill("SIGTERM");
  if (proxy) await proxy.exited;
  bridge?.close(); bridge?.closeAllConnections();
  globalThis.fetch = originalFetch;
  await rm(directory, { recursive: true, force: true });
  console.log("CLEANED: owned settings, bridge and converter only.");
}
