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
  assert(events.filter((event) => event.type === "chat").every((event) => event.model === "claude-sonnet-5-5"), "The account-specific synthetic model must reach the real plugin.");
  assert(events.some((event) => event.type === "result" && event.proof === nonce && event.toolResults === 2));
  assert.equal(events.filter((event) => event.type === "blocked").length, 0, "Unexpected external request attempted.");
  const receipt = { passed: true, syntheticUpstream: true, realSubscriptionVerified: false,
    realClaudeCode: claude, realCLIProxyAPI: binary, builtEntrypoint: entry,
    claudeCodeVersion: initialization?.claude_code_version, permissionMode: initialization?.permissionMode,
    extensionlessNodeLauncher: true, separateReadTurns: readTurns.length, proof: nonce,
    evidenceDirectory: output };
  await writeFile(evidenceFile, JSON.stringify(receipt, null, 2) + "\n");
  console.log(JSON.stringify(receipt, null, 2));
} finally {
  await managed.stopManagedCLIProxyAPI(profile);
  await rm(home, { recursive: true, force: true });
}
