// Explicit live smoke test. Copy an existing login into a private temporary
// HOME; never refresh or edit the source account. Requires a built dist CLI.
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import { join, resolve } from "path";
import { spawn } from "child_process";

const args = process.argv.slice(2);
const option = (name: string) => args[args.indexOf(name) + 1];
if (!args.includes("--auth-dir") || !args.includes("--binary")) {
  console.error("Usage: bun scripts/verify-antigravity.ts --auth-dir <existing-auth-dir> --binary <cliproxyapi> [--claude <claude>]");
  process.exit(2);
}
const sourceAuth = resolve(option("--auth-dir")!);
const binaryPath = resolve(option("--binary")!);
const claudePath = args.includes("--claude") ? resolve(option("--claude")!) : "claude";
const root = await mkdtemp("/tmp/claudex-agy-live-");
const realEnv = { ...process.env };
process.env.HOME = root;
process.env.CLAUDEX_TEST_HOME = root;
// Import paths only after establishing isolation.
const paths = await import("../src/lib/paths");
const managed = await import("../src/providers/cliproxyapi/managed");
const { saveLocalCLIProxyAPIProfile } = await import("../src/providers/claude/profiles");
const { saveAliases } = await import("../src/alias/store");
const profile = { type: "local-cliproxyapi" as const, profileId: randomUUID(), binaryPath, upstream: "antigravity" as const, defaultModel: "fable" };
const profileName = "agy-smoke";
const nonce = randomUUID();
const proof = join(root, "proof.txt");
await writeFile(proof, nonce);
const env = { ...realEnv, HOME: root, CLAUDEX_TEST_HOME: root, CLAUDE_CONFIG_DIR: paths.claudeProfileConfigDir(profileName), CLAUDE_SECURESTORAGE_CONFIG_DIR: paths.claudeProfileSecureStorageDir(profileName) };
for (const key of Object.keys(env)) {
  if (/^(ANTHROPIC_|CLAUDE_CODE_|CODEX_|OPENCODE_|XDG_)/.test(key)) delete (env as Record<string, string | undefined>)[key];
}
const cli = resolve(import.meta.dir, "../dist/claudex-switch.js");
const receipt: Record<string, unknown> = { date: new Date().toISOString(), originalAccountModified: false };
let passed = false;

async function run(model: string | null, prompt: string) {
  console.error(`Checking Antigravity ${model ?? "default"}...`);
  const command = [cli, "agy", "--run", "--cliproxy", "claudecode", ...(model ? ["--model", model] : []), "-p", prompt, "--output-format", "stream-json", "--verbose", "--tools", "Read", "--allowedTools", "Read", "--no-session-persistence"];
  const proc = spawn(process.execPath, command, { cwd: root, env, stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "", stderr = "";
  proc.stdout!.on("data", (chunk) => { stdout += chunk; });
  proc.stderr!.on("data", (chunk) => { stderr += chunk; });
  const timer = setTimeout(() => proc.kill("SIGTERM"), 90_000);
  const code = await new Promise<number | null>((resolve, reject) => { proc.on("close", resolve); proc.on("error", reject); });
  clearTimeout(timer);
  const events = stdout.split("\n").flatMap((line) => { try { return [JSON.parse(line)]; } catch { return []; } });
  const result = events.find((event) => event.type === "result");
  const models = [...new Set(events.filter((event) => event.type === "assistant").map((event) => event.message?.model))];
  const tools = events.filter((event) => event.type === "assistant").flatMap((event) => event.message?.content ?? []).filter((block) => block.type === "tool_use").map((block) => block.name);
  if (code !== 0 || result?.is_error || !result?.result?.includes("AGY_")) throw new Error(`Live ${model ?? "default"} failed (exit ${code}): ${result?.result ?? stderr.slice(-1500)}`);
  return { model: model ?? "default", responseModels: models, tools, result: result.result as string };
}

try {
  await mkdir(join(root, "bin"));
  // Use a shim only to select the real Claude executable; requests and UI are real.
  const shim = join(root, "bin/claude");
  await writeFile(shim, `#!/bin/sh\nexec '${claudePath.replaceAll("'", "'\\''")}' "$@"\n`, { mode: 0o700 });
  env.PATH = `${join(root, "bin")}:${realEnv.PATH}`;
  await writeFile(paths.CLAUDE_JSON, JSON.stringify({ hasCompletedOnboarding: true, theme: "light" }));
  await managed.initializeManagedCLIProxyAPI(profile.profileId, { upstream: "antigravity", models: {
    fableModel: "claude-opus-5-5", opusModel: "claude-opus-5-5", sonnetModel: "claude-sonnet-5-5", haikuModel: "gemini-3.8-flash",
  } });
  await cp(sourceAuth, paths.cliProxyAPIAuthDir(profile.profileId), { recursive: true, dereference: true });
  await saveLocalCLIProxyAPIProfile(profileName, profile);
  await saveAliases({ version: 1, aliases: [{ alias: "agy", target: { provider: "claude", profileName }, createdAt: Date.now() }] });
  const runtime = await managed.ensureManagedCLIProxyAPI(profile);
  const settings = await managed.getLocalCLIProxyAPISettings(profile, runtime);
  receipt.catalog = runtime.models;
  receipt.mappings = Object.fromEntries(Object.entries(settings).filter(([key]) => key.endsWith("Model")));
  const checks = [];
  checks.push(await run(null, "Reply exactly AGY_DEFAULT_OK"));
  checks.push(await run("sonnet", "Reply exactly AGY_SONNET_OK"));
  checks.push(await run("haiku", "Reply exactly AGY_GEMINI_OK"));
  const tool = await run("claude-opus-5-5", `Use Read to read ${proof}. Then use Read to read it a second time in a separate tool turn. Reply AGY_TOOLS_OK and its exact contents.`);
  if (tool.tools.filter((name) => name === "Read").length < 2 || !tool.result.includes(nonce)) throw new Error("Multi-turn tool verification did not read the proof twice");
  checks.push({ ...tool, result: tool.result.replaceAll(nonce, "<nonce>") });
  receipt.checks = checks;
  const clientSettings = JSON.parse(await readFile(paths.cliProxyAPIClaudeSettingsFile(profile.profileId), "utf8"));
  receipt.picker = clientSettings.modelPicker;
  if (args.includes("--keep")) {
    receipt.temporaryHome = root;
    receipt.profileId = profile.profileId;
    receipt.message = "Temporary login copy retained for manual TUI verification; stop daemon and delete this directory afterward.";
  }
  passed = true;
  console.log(JSON.stringify(receipt, null, 2));
} finally {
  if (!passed || !args.includes("--keep")) {
    await managed.stopManagedCLIProxyAPI(profile);
    await rm(root, { recursive: true, force: true });
  }
}
