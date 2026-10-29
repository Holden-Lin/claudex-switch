/**
 * Exercise real Claude Code -> installed-style built launcher -> CLIProxyAPI ->
 * real WorkBuddy plugin, with synthetic vendor fetch only. No subscription proof.
 * Run after build: bun scripts/verify-subscription-bridge.ts [--binary PATH]
 *   [--claude PATH] [--entry PATH] [--fixture PATH] [--output DIRECTORY]
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const options: Record<string, string> = {};
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index]!;
  assert(["--binary", "--claude", "--entry", "--fixture", "--output"].includes(key) && process.argv[index + 1], `Unknown or incomplete option: ${key}`);
  options[key] = process.argv[index + 1]!;
}
const binary = Bun.which(options["--binary"] ?? "cliproxyapi");
const claude = Bun.which(options["--claude"] ?? "claude");
const node = Bun.which("node");
assert(binary && claude && node, "Install Claude Code, Node, and CLIProxyAPI, or supply --binary and --claude.");
const entry = await realpath(resolve(options["--entry"] ?? join(repo, "dist/claudex-switch.js")));
const fixture = await realpath(resolve(options["--fixture"] ?? join(repo, "tests/fixtures/subscription-upstream.mjs")));
const output = options["--output"] ? resolve(options["--output"]) : await mkdtemp(join(tmpdir(), "claudex-subscription-evidence-"));
await mkdir(output, { recursive: true });
const home = await mkdtemp(join(tmpdir(), "claudex-subscription-home-"));
const evidenceFile = join(output, "receipt.json");
const fixtureLog = join(output, "upstream.jsonl");
const proofFile = join(home, "proof.txt");
const nonce = `SYNTHETIC_PROOF_${randomUUID()}`;
await writeFile(proofFile, `${nonce}\n`, { mode: 0o600 });
await writeFile(fixtureLog, "");

// All source helpers are imported only after their HOME has been isolated.
Object.assign(process.env, {
  HOME: home, USERPROFILE: home, CLAUDEX_TEST_HOME: home,
  XDG_CONFIG_HOME: join(home, "config"), XDG_DATA_HOME: join(home, "data"),
  XDG_STATE_HOME: join(home, "state"), XDG_CACHE_HOME: join(home, "cache"),
  CLAUDEX_DISABLE_AUTO_UPDATE: "1", CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1",
  DISABLE_AUTOUPDATER: "1", DISABLE_TELEMETRY: "1", DISABLE_ERROR_REPORTING: "1",
  CLAUDEX_SUBSCRIPTION_FIXTURE_LOG: fixtureLog, CLAUDEX_SUBSCRIPTION_PROOF_FILE: proofFile,
  NODE_OPTIONS: `--import=${pathToFileURL(fixture).href}`,
  // Native clients also fail closed if they try an unexpected external call.
  HTTP_PROXY: "http://127.0.0.1:9", HTTPS_PROXY: "http://127.0.0.1:9", ALL_PROXY: "http://127.0.0.1:9",
  NO_PROXY: "127.0.0.1,localhost,::1", no_proxy: "127.0.0.1,localhost,::1",
});
for (const key of Object.keys(process.env)) {
  if (/^(ANTHROPIC_|CLAUDE_CODE_OAUTH_TOKEN$|CLAUDE_CODE_USE_|OPENAI_|CODEX_|GEMINI_API_KEY$|GOOGLE_API_KEY$)/.test(key)) delete process.env[key];
}
process.chdir(home);
await import(pathToFileURL(fixture).href);
const managed = await import(join(repo, "src/providers/cliproxyapi/managed.ts"));
const { saveLocalCLIProxyAPIProfile } = await import(join(repo, "src/providers/claude/profiles.ts"));
const { saveAliases } = await import(join(repo, "src/alias/store.ts"));
const { cliProxyAPIProfileDir } = await import(join(repo, "src/lib/paths.ts"));
const profileId = managed.createManagedCLIProxyAPIProfileId();
const profileName = `cliproxy-${profileId}`;
const profile = { type: "local-cliproxyapi" as const, profileId, binaryPath: binary,
  upstream: "workbuddy" as const, defaultModel: "fable" };
const bin = join(home, "bin");
await mkdir(bin);
await symlink(claude, join(bin, "claude"));
await symlink(entry, join(bin, "claudex-switch"));
process.env.PATH = `${bin}:${process.env.PATH}`;
await managed.initializeManagedCLIProxyAPI(profileId, { upstream: "workbuddy" });
await writeFile(join(cliProxyAPIProfileDir(profileId), "plugin-auth.json"), JSON.stringify({
  version: 1, upstream: "workbuddy", auth: { type: "oauth", uid: "synthetic-account",
    accountId: "synthetic-account", access: "synthetic-access-no-vendor-validity", refresh: "synthetic-refresh",
    expires: Date.now() + 365 * 24 * 60 * 60 * 1000 },
}), { mode: 0o600 });
await saveLocalCLIProxyAPIProfile(profileName, profile);
await saveAliases({ version: 1, aliases: [{ alias: "synthetic-workbuddy", target: { provider: "claude", profileName }, createdAt: Date.now() }] });
await mkdir(join(home, ".claude"), { recursive: true });
await writeFile(join(home, ".claude.json"), JSON.stringify({ hasCompletedOnboarding: true,
  projects: { [home]: { hasTrustDialogAccepted: true } } }));

const args = [node, join(bin, "claudex-switch"), "synthetic-workbuddy", "--run", "--cliproxy", "claudecode",
  "--bare", "-p", `Read ${proofFile} twice in two separate Read tool rounds. Then return SUBSCRIPTION_BRIDGE_OK and the proof contents.`,
  "--output-format", "stream-json", "--verbose", "--tools", "Read", "--allowedTools", "Read", "--max-turns", "5"];
let child: ReturnType<typeof Bun.spawn> | undefined;
try {
  console.log("Running real Claude Code and CLIProxyAPI against synthetic WorkBuddy transport...");
  child = Bun.spawn(args, { env: process.env, cwd: home, stdout: "pipe", stderr: "pipe" });
  const timeout = setTimeout(() => child?.kill("SIGTERM"), 90_000);
  const stdout = new Response(child.stdout).text();
  const stderr = new Response(child.stderr).text();
  const code = await child.exited;
  clearTimeout(timeout);
  const [text, errors] = await Promise.all([stdout, stderr]);
  await writeFile(join(output, "claude-stream.jsonl"), text);
  await writeFile(join(output, "stderr.txt"), errors);
  assert.equal(code, 0, `Real launcher failed with exit ${code}; see ${output}`);
  const messages = text.split("\n").flatMap((line) => { try { return [JSON.parse(line)]; } catch { return []; } });
  const readTurns = messages.filter((message) => message.type === "assistant"
    && message.message?.content?.some((part: { type: string; name?: string }) => part.type === "tool_use" && part.name === "Read"));
  const result = messages.findLast((message) => message.type === "result");
  const initialization = messages.find((message) => message.type === "system" && message.subtype === "init");
  assert.equal(initialization?.permissionMode, "auto", "The real launcher must retain auto permission mode.");
  assert.equal(readTurns.length, 2, "Expected two separate Read assistant events.");
  assert.equal(result?.is_error, false);
  assert(result?.result?.includes(`SUBSCRIPTION_BRIDGE_OK ${nonce}`), "Final client result must contain the nonce read from disk.");
  const events = (await readFile(fixtureLog, "utf8")).trim().split("\n").map((line) => JSON.parse(line));
  assert.equal(events.filter((event) => event.type === "read").length, 2);
  // Claude Code's default tier reaches the real plugin as the account's free model, not the paid or unpriced ones.
  assert(events.filter((event) => event.type === "chat").every((event) => event.model === "free-flash"), "The account's free model must reach the real plugin.");
  assert(events.some((event) => event.type === "result" && event.proof === nonce && event.toolResults === 2));
  assert.equal(events.filter((event) => event.type === "blocked").length, 0, "Unexpected external request attempted.");
  const settings = JSON.parse(await readFile(join(cliProxyAPIProfileDir(profileId), "claude-settings.json"), "utf8"));
  assert.equal(settings.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS, "1000000", "The catalog's context window must reach Claude Code.");
  assert.equal(settings.modelSettings?.["claude-sonnet-5-5"]?.autoCompactWindow, 200000);
  // Tiers and Claude Code's own unlisted IDs use the widest x0.00 model, never the unpriced Auto.
  for (const tier of ["FABLE", "OPUS", "SONNET", "HAIKU"]) assert.equal(settings.env[`ANTHROPIC_DEFAULT_${tier}_MODEL`], "free-flash", `${tier} must map to the free model.`);
  assert.equal(settings.modelOverrides?.["claude-opus-5-5"], "free-flash");
  // Side queries and Claude Code's non-streaming fallback reach stream-only WorkBuddy as one JSON answer.
  const runtime = await managed.ensureManagedCLIProxyAPI(profile);
  const single = await fetch(`${runtime.baseUrl}/v1/messages`, { method: "POST",
    headers: { "x-api-key": runtime.apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-5-5", max_tokens: 50, stream: false, messages: [{ role: "user", content: "Classify." }] }) });
  const answer = await single.json();
  assert.equal(single.status, 200, `Non-stream request failed: ${JSON.stringify(answer)}`);
  assert.equal(answer.content?.[0]?.text, "allow");
  // A written 6004 reset becomes the proxy's cooldown: the next call is refused locally until then.
  const message = (model: string) => fetch(`${runtime.baseUrl}/v1/messages`, { method: "POST",
    headers: { "x-api-key": runtime.apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model, max_tokens: 50, stream: true, messages: [{ role: "user", content: "Hi." }] }) });
  const limited = await message("limited-model");
  assert.equal(limited.status, 429, await limited.clone().text());
  const cooling = await message("limited-model");
  const coolingText = await cooling.text();
  const coolingSeconds = Number(cooling.headers.get("retry-after"));
  assert.equal(cooling.status, 429);
  assert(/cooling down/.test(coolingText) && coolingSeconds > 100 && coolingSeconds <= 120,
    `Expected a ~120s cooldown from the written reset, got ${coolingSeconds}: ${coolingText}`);
  const limitedCalls = (await readFile(fixtureLog, "utf8")).trim().split("\n").map((line) => JSON.parse(line))
    .filter((event) => event.type === "chat" && event.model === "limited-model").length;
  assert.equal(limitedCalls, 1, "The cooled-down model must not be retried upstream.");
  // 14018 names the models that still answer instead of claiming free ones need credits too.
  const exhausted = await message("paid-model");
  const exhaustedText = await exhausted.text();
  assert.equal(exhausted.status, 429, exhaustedText);
  assert(exhaustedText.includes("models at x0.00 still answer: free-flash, limited-model") && !exhaustedText.includes("even for 0-rate free models"),
    `14018 must name the free models: ${exhaustedText}`);
  // A bridge started before the current revision restarts on the next idle launch.
  const stateFile = join(cliProxyAPIProfileDir(profileId), "state.json");
  const { bridgeRevision, ...oldState } = JSON.parse(await readFile(stateFile, "utf8"));
  assert.equal(bridgeRevision, 2);
  assert.equal(await managed.stopStaleManagedCLIProxyAPI(profile), false);
  await writeFile(stateFile, JSON.stringify(oldState), { mode: 0o600 });
  assert.equal(await managed.stopStaleManagedCLIProxyAPI(profile), true);
  const receipt = { passed: true, syntheticUpstream: true, realSubscriptionVerified: false,
    realClaudeCode: claude, realCLIProxyAPI: binary, builtEntrypoint: entry,
    claudeCodeVersion: initialization?.claude_code_version, permissionMode: initialization?.permissionMode,
    extensionlessNodeLauncher: true, separateReadTurns: readTurns.length, proof: nonce,
    freeTier: settings.env.ANTHROPIC_DEFAULT_OPUS_MODEL, writtenResetCooldownSeconds: coolingSeconds,
    evidenceDirectory: output };
  await writeFile(evidenceFile, JSON.stringify(receipt, null, 2) + "\n");
  console.log(JSON.stringify(receipt, null, 2));
} finally {
  await managed.stopManagedCLIProxyAPI(profile);
  await rm(home, { recursive: true, force: true });
}
