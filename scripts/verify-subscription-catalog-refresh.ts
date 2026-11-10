/** Full built-launcher regression; synthetic vendor catalog and fake Claude/converter only. No model requests. */
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const repo = resolve(import.meta.dir, "..");
const entry = resolve(process.argv[2] ?? join(repo, "dist/claudex-switch.js"));
const home = await mkdtemp(join(tmpdir(), "cxs-refresh-regression-"));
Object.assign(process.env, {
  HOME: home, USERPROFILE: home, CLAUDEX_TEST_HOME: home,
  XDG_CONFIG_HOME: join(home, "config"), XDG_DATA_HOME: join(home, "data"),
  XDG_STATE_HOME: join(home, "state"), XDG_CACHE_HOME: join(home, "cache"),
  CLAUDEX_DISABLE_AUTO_UPDATE: "1", CLAUDEX_SUBSCRIPTION_PAID_ONLY: "1",
  CLAUDEX_SUBSCRIPTION_FIXTURE_LOG: join(home, "upstream.jsonl"),
  NODE_OPTIONS: `--import=${pathToFileURL(join(repo, "tests/fixtures/subscription-upstream.mjs")).href}`,
});
for (const key of Object.keys(process.env)) {
  if (/^(ANTHROPIC_|CLAUDE_CODE_OAUTH_TOKEN$|CLAUDE_CODE_USE_|OPENAI_|CODEX_|GEMINI_API_KEY$|GOOGLE_API_KEY$)/.test(key)) delete process.env[key];
}
const managed = await import(join(repo, "src/providers/cliproxyapi/managed.ts"));
const { saveLocalCLIProxyAPIProfile } = await import(join(repo, "src/providers/claude/profiles.ts"));
const { saveAliases } = await import(join(repo, "src/alias/store.ts"));
const { cliProxyAPIProfileDir } = await import(join(repo, "src/lib/paths.ts"));
const bin = join(home, "bin"), marker = join(home, "claude-launched");
await mkdir(bin);
await writeFile(join(bin, "claude"), `#!/usr/bin/env node\nrequire('node:fs').writeFileSync(${JSON.stringify(marker)},JSON.stringify({args:process.argv.slice(2)}));console.log('FIXTURE_CLAUDE_LAUNCHED');\n`, { mode: 0o755 });
process.env.PATH = `${bin}:${process.env.PATH}`;
const base = "deepseek-v4.1-flash", sg = `${base}-sg`;
const saved = { fableModel: base, opusModel: base, sonnetModel: base, haikuModel: base };
const profiles: Array<{ profileId: string; binaryPath: string }> = [];
const results = [];
try {
  for (const upstream of ["workbuddy", "workbuddy-ai"] as const) {
    const profileId = managed.createManagedCLIProxyAPIProfileId();
    const profile = { type: "local-cliproxyapi" as const, profileId, binaryPath: join(repo, "tests/fixtures/fake-cliproxyapi"), defaultModel: "fable", upstream };
    profiles.push(profile);
    await managed.initializeManagedCLIProxyAPI(profileId, { upstream, models: saved, upstreamModels: [base, sg], upstreamFree: [base] });
    await writeFile(join(cliProxyAPIProfileDir(profileId), "plugin-auth.json"), JSON.stringify({
      version: 1, upstream, auth: { type: "oauth", access: "fixture-access", uid: "fixture-user", expires: Date.now() + 3_600_000 },
    }), { mode: 0o600 });
    const profileName = `cliproxy-${profileId}`;
    await saveLocalCLIProxyAPIProfile(profileName, profile);
    await saveAliases({ version: 1, aliases: [{ alias: "refresh-proof", target: { provider: "claude", profileName }, createdAt: Date.now() }] });
    const run = async (extra: string[] = []) => {
      const child = Bun.spawn(["node", entry, "refresh-proof", "--run", "--cliproxy", "claudecode", ...extra], {
        cwd: repo, env: process.env, stdout: "pipe", stderr: "pipe",
      });
      const timer = setTimeout(() => child.kill("SIGTERM"), 30_000);
      const stdout = new Response(child.stdout).text(), stderr = new Response(child.stderr).text();
      const code = await child.exited;
      clearTimeout(timer);
      return { code, text: (await stdout) + (await stderr) };
    };
    await rm(marker, { force: true });
    const automatic = await run();
    assert.equal(automatic.code, 1, `${upstream} silently launched paid SG: ${automatic.text}`);
    assert(automatic.text.includes("refusing to substitute"), automatic.text);
    assert.equal(await Bun.file(marker).exists(), false, "Claude must not start on an implicit paid route.");
    const runtime = await managed.ensureManagedCLIProxyAPI(profile);
    const stored = await managed.getLocalCLIProxyAPISettings({ ...profile, defaultModel: sg }, runtime);
    for (const tier of ["fableModel", "opusModel", "sonnetModel", "haikuModel"] as const) assert.equal(stored[tier], base);
    await saveLocalCLIProxyAPIProfile(profileName, { ...profile, env: { ANTHROPIC_MODEL: base } });
    const explicit = await run(["--model", sg]);
    assert.equal(explicit.code, 0, explicit.text);
    assert.equal(await Bun.file(marker).exists(), true, "Explicit SG must still launch.");
    const launched = JSON.parse(await readFile(marker, "utf8"));
    assert.equal(launched.args[launched.args.indexOf("--model") + 1], sg);
    results.push({ upstream, automatic: "blocked before Claude", persistedTiers: saved, explicitSG: "launched fake Claude" });
    await managed.stopManagedCLIProxyAPI(profile);
  }
  const events = (await readFile(process.env.CLAUDEX_SUBSCRIPTION_FIXTURE_LOG!, "utf8")).trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  assert(events.some((event) => event.type === "catalog"));
  assert(events.every((event) => event.type === "catalog"), "No chat requests are allowed.");
  console.log(JSON.stringify({ passed: true, vendorChatRequests: 0, results }, null, 2));
} finally {
  for (const profile of profiles) await managed.stopManagedCLIProxyAPI(profile).catch(() => {});
  await rm(home, { recursive: true, force: true });
}
