// Real Claude Code, synthetic Antigravity login and loopback proxy only.
// bun scripts/verify-proxy-auto-mode.ts [output directory] [built entrypoint] [opus|gemini|disabled]
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const claude = Bun.which("claude");
const node = Bun.which("node");
assert(claude && node, "Install Claude Code and Node first.");
const repo = resolve(import.meta.dir, "..");
const entry = resolve(process.argv[3] ?? join(repo, "dist/claudex-switch.js"));
const variant = process.argv[4] ?? "opus";
assert(["opus", "gemini", "disabled"].includes(variant));
const output = process.argv[2] ? resolve(process.argv[2]) : await mkdtemp(join(tmpdir(), "claudex-proxy-auto-evidence-"));
const home = await mkdtemp(join(tmpdir(), "claudex-proxy-auto-home-"));
await mkdir(output, { recursive: true });
Object.assign(process.env, {
  HOME: home, USERPROFILE: home, CLAUDEX_TEST_HOME: home,
  XDG_CONFIG_HOME: join(home, ".config"), XDG_DATA_HOME: join(home, ".local/share"),
  XDG_STATE_HOME: join(home, ".local/state"), XDG_CACHE_HOME: join(home, ".cache"),
  CLAUDEX_DISABLE_AUTO_UPDATE: "1", CLAUDEX_FORCE_FILE_CREDENTIALS: "1",
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1", DISABLE_AUTOUPDATER: "1",
  DISABLE_TELEMETRY: "1", DISABLE_ERROR_REPORTING: "1",
  CLAUDEX_FAKE_AUTO_LOG: join(output, "requests.jsonl"),
  HTTP_PROXY: "http://127.0.0.1:9", HTTPS_PROXY: "http://127.0.0.1:9", ALL_PROXY: "http://127.0.0.1:9",
  NO_PROXY: "127.0.0.1,localhost,::1", no_proxy: "127.0.0.1,localhost,::1",
});
for (const key of Object.keys(process.env)) {
  if (/^(ANTHROPIC_|CLAUDE_CODE_OAUTH_TOKEN$|CLAUDE_CODE_USE_|CLAUDE_CONFIG_DIR$|CLAUDE_SECURESTORAGE_|OPENAI_|CODEX_|NODE_OPTIONS$)/.test(key)) delete process.env[key];
}
await writeFile(process.env.CLAUDEX_FAKE_AUTO_LOG!, "");
const bin = join(home, "bin");
await mkdir(bin);
await symlink(claude, join(bin, "claude"));
process.env.PATH = `${bin}:${process.env.PATH}`;
const managed = await import("../src/providers/cliproxyapi/managed");
const profiles = await import("../src/providers/claude/profiles");
const { saveAliases } = await import("../src/alias/store");
const paths = await import("../src/lib/paths");
const profile = { type: "local-cliproxyapi" as const, profileId: managed.createManagedCLIProxyAPIProfileId(),
  binaryPath: join(repo, "tests/fixtures/fake-cliproxyapi"), upstream: "antigravity" as const, defaultModel: "fable" };
const name = `cliproxy-${profile.profileId}`;
await managed.initializeManagedCLIProxyAPI(profile.profileId, { upstream: "antigravity" });
await managed.runManagedCLIProxyAPILogin(profile);
await profiles.saveLocalCLIProxyAPIProfile(name, profile);
await saveAliases({ version: 1, aliases: [{ alias: "agy", target: { provider: "claude", profileName: name }, createdAt: 1 }] });
await mkdir(join(home, ".claude"));
await writeFile(paths.SETTINGS_FILE, JSON.stringify({ model: "claude-opus-5-5", ...(variant === "disabled" ? { permissions: { disableAutoMode: "disable" } } : {}) }));
await writeFile(paths.CLAUDE_JSON, JSON.stringify({ hasCompletedOnboarding: true,
  projects: { [home]: { hasTrustDialogAccepted: true } } }));
let child: ReturnType<typeof Bun.spawn> | undefined;
try {
  console.log(`Claude: ${(await new Response(Bun.spawn([claude, "--version"], { stdout: "pipe" }).stdout).text()).trim()}`);
  child = Bun.spawn([node, entry, "agy", "cc", ...(variant === "gemini" ? ["--model", "gemini-3.8-flash-high"] : []), "--bare", "-p", "Use Bash to write AUTO_MODE_OK into auto-proof.txt, then report completion.",
    "--output-format", "stream-json", "--verbose", "--tools", "Bash", "--max-turns", "3"], {
    env: process.env, cwd: home, stdout: "pipe", stderr: "pipe",
  });
  const timer = setTimeout(() => child?.kill("SIGTERM"), 45_000);
  const out = new Response(child.stdout).text();
  const err = new Response(child.stderr).text();
  const code = await child.exited;
  clearTimeout(timer);
  const [stdout, stderr] = await Promise.all([out, err]);
  await writeFile(join(output, "stdout.jsonl"), stdout);
  await writeFile(join(output, "stderr.txt"), stderr);
  const events = stdout.split("\n").flatMap((line) => { try { return [JSON.parse(line)]; } catch { return []; } });
  const init = events.find((event) => event.type === "system" && event.subtype === "init");
  const result = events.findLast((event) => event.type === "result");
  const requests = (await readFile(process.env.CLAUDEX_FAKE_AUTO_LOG!, "utf8")).split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const receipt = { variant, code, permissionMode: init?.permissionMode, model: init?.model,
    models: requests.map((request) => request.model), tools: requests.map((request) => request.tools?.map((tool: { name: string }) => tool.name)),
    proof: await readFile(join(home, "auto-proof.txt"), "utf8").catch(() => null), resultError: result?.is_error };
  await writeFile(join(output, "receipt.json"), JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify(receipt, null, 2));
  assert.equal(code, 0, `See ${output}`);
  assert.equal(init?.permissionMode, variant === "disabled" ? "default" : "auto");
  assert.equal(receipt.proof, variant === "disabled" ? null : "AUTO_MODE_OK");
  if (variant !== "disabled") assert(requests.some((request) => !request.tools?.length), "The action must reach the actual classifier.");
  assert(requests.every((request) => request.model !== "claude-sonnet-5"), "Classifier model must map to an account model.");
  console.log(`PASS: real Claude Code auto mode through fake agy; evidence ${output}`);
} finally {
  if (child && child.exitCode === null) { child.kill("SIGTERM"); await child.exited; }
  await managed.stopManagedCLIProxyAPI(profile);
  await rm(home, { recursive: true, force: true });
}
