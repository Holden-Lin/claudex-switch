// node tests/fixtures/proxy-accounts.mjs [installed binary or built .js]
// No real accounts, browser, credentials or vendor network calls are used.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const fixtures = dirname(fileURLToPath(import.meta.url));
const binary = process.argv[2] ?? "claudex-switch";
const home = await mkdtemp(join(tmpdir(), "claudex-proxy-accounts-"));
const bin = join(home, "bin");
const env = { ...process.env, HOME: home, USERPROFILE: home, CLAUDEX_TEST_HOME: home,
  CLAUDE_CONFIG_DIR: join(home, ".claude"), CLAUDEX_FORCE_FILE_CREDENTIALS: "1",
  XDG_CONFIG_HOME: join(home, ".config"), XDG_DATA_HOME: join(home, ".local/share"),
  XDG_STATE_HOME: join(home, ".local/state"), XDG_CACHE_HOME: join(home, ".cache"),
  CLAUDEX_DISABLE_AUTO_UPDATE: "1", NO_COLOR: "1", TERM: "xterm-256color",
  NODE_OPTIONS: `--import=${pathToFileURL(join(fixtures, "proxy-accounts-transport.mjs")).href}`,
  PATH: `${bin}:${process.env.PATH}` };
for (const key of Object.keys(env)) {
  if (/^(ANTHROPIC_|CLAUDE_CODE_|CLAUDE_AUTOCOMPACT_|CLAUDE_SECURESTORAGE_|CODEX_|OPENAI_|GEMINI_|GOOGLE_)/.test(key)) delete env[key];
}
env.CLAUDE_CONFIG_DIR = join(home, ".claude");
const sessions = [];
const launched = [];
const clean = (text) => text.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "");
const put = async (file, value) => {
  const path = join(home, file);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(value, null, 2));
};
const json = async (file) => JSON.parse(await readFile(join(home, file), "utf8"));
function start(args, extra = {}, dialogs = []) {
  const command = binary.endsWith(".js") ? process.execPath : binary;
  const actualArgs = binary.endsWith(".js") ? [resolve(binary), ...args] : args;
  const child = spawn(command, actualArgs, { cwd: home, env: { ...env, ...extra }, stdio: ["pipe", "pipe", "pipe"] });
  launched.push(child);
  let output = "";
  let searchFrom = 0;
  const accept = (chunk) => {
    output += chunk;
    const text = clean(output);
    if (dialogs.length && text.slice(searchFrom).includes(dialogs[0][0])) {
      const [, answer] = dialogs.shift();
      searchFrom = text.length;
      setTimeout(() => child.stdin.write(answer), 20);
    }
  };
  child.stdout.on("data", accept);
  child.stderr.on("data", accept);
  const done = new Promise((resolveExit, reject) => {
    child.once("error", reject);
    child.once("close", (code) => resolveExit({ code, output: clean(output) }));
  });
  return { child, done, output: () => clean(output) };
}
async function run(args, dialogs = []) {
  const task = start(args, dialogs.length ? { CLAUDEX_FIXTURE_INTERACTIVE: "1" } : {}, dialogs);
  const timer = setTimeout(() => task.child.kill("SIGTERM"), 30_000);
  try {
    const result = await task.done;
    assert.equal(result.code, 0, result.output);
    assert.equal(dialogs.length, 0, `Not all prompts were reached: ${result.output}`);
    return result.output;
  } finally { clearTimeout(timer); }
}
async function waitFor(task, match) {
  const deadline = Date.now() + 15_000;
  while (!task.output().includes(match)) {
    assert(Date.now() < deadline && task.child.exitCode === null, task.output());
    await new Promise((resolveWait) => setTimeout(resolveWait, 50));
  }
}
async function tree(dir = home) {
  const result = {};
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) Object.assign(result, await tree(file));
    else result[file] = (await readFile(file)).toString("base64");
  }
  return result;
}
function publicSettings(settings) {
  return { ...settings, env: Object.fromEntries(Object.entries(settings.env ?? {}).map(([key, value]) =>
    [key, /KEY|TOKEN/.test(key) && value ? "<fixture-key>" : value])) };
}

try {
  await mkdir(bin);
  await writeFile(join(bin, "cliproxyapi"), `#!/bin/sh\nexec bun '${join(fixtures, "fake-cliproxyapi.mjs")}' "$@"\n`, { mode: 0o755 });
  for (const name of ["open", "xdg-open"]) await writeFile(join(bin, name), "#!/bin/sh\nexit 0\n", { mode: 0o755 });
  await writeFile(join(bin, "claude"), `#!/bin/sh\nexec '${process.execPath}' '${join(fixtures, "proxy-accounts-claude.mjs")}' "$@"\n`, { mode: 0o755 });
  const credentials = { claudeAiOauth: { accessToken: "fixture-oauth", refreshToken: "fixture-refresh", expiresAt: 4_102_444_800_000, scopes: [], subscriptionType: "max" } };
  await put(".claude/settings.json", { model: "claude-opus-5-5", env: { KEEP: "fixture" } });
  await put(".claude/.credentials.json", credentials);
  await put(".claude.json", { oauthAccount: { accountUuid: "fixture-account", organizationUuid: "fixture-org" } });
  await put(".claude-profiles/state.json", { active: "native" });
  await put(".claude-profiles/native/profile.json", { type: "oauth", defaultModel: "claude-opus-5-5" });
  await put(".claude-profiles/native/.credentials.json", credentials);
  await put(".claude-profiles/native/account.json", { accountUuid: "fixture-account", organizationUuid: "fixture-org" });
  await put(".claude-profiles/api/profile.json", { type: "api-key", apiKey: "fixture-api", baseUrl: "https://api.fixture.invalid" });
  await put(".claudex-switch/aliases.json", { version: 1, aliases: ["native", "api"].map((alias) => ({ alias, target: { provider: "claude", profileName: alias }, createdAt: 1 })) });
  console.log(`version: ${(await run(["--version"])).trim()}`);
  const originalSettings = await json(".claude/settings.json");
  for (const [alias, index, region, upstream] of [
    ["wb-ai", 3, 0, "workbuddy-ai"], ["wb-cn", 3, 1, "workbuddy"],
    ["agy", 4, null, "antigravity"], ["cursor", 5, null, "cursor"],
  ]) {
    const dialogs = [["What type of account?", "\u001b[B".repeat(index) + "\r"]];
    if (region !== null) dialogs.push(["WorkBuddy region", "\u001b[B".repeat(region) + "\r"]);
    if (upstream === "antigravity") dialogs.push(["Continue with Antigravity via CLIProxyAPI?", "y\r"]);
    else dialogs.push([" login", "\r"]);
    const output = await run(["add", alias], dialogs);
    assert(output.includes(`Saved as alias ${alias}`), output);
    const entry = (await json(".claudex-switch/aliases.json")).aliases.find((item) => item.alias === alias);
    const profile = await json(`.claude-profiles/${entry.target.profileName}/profile.json`);
    assert.equal(profile.type, "local-cliproxyapi");
    assert.equal(profile.upstream, upstream);
    assert(profile.authIdentity);
    assert.deepEqual(await json(".claude/settings.json"), originalSettings);
    assert.equal((await json(".claude-profiles/state.json")).active, "native");
    console.log(`add ${alias}: local-cliproxyapi upstream=${upstream}; global unchanged`);
  }
  console.log("menu: WorkBuddy / Antigravity / Cursor; WorkBuddy region: international / China");
  for (const [alias, options] of [["native", []], ["api", []], ["agy", []], ["cursor", ["cc"]]]) {
    const signal = join(home, `signal-${alias}`);
    await writeFile(signal, "before");
    const task = start([alias, ...(options[0] === "cc" ? options : ["-run", ...options])], {
      CLAUDEX_SESSION_SIGNAL_FILE: signal, CLAUDEX_SESSION_ALIAS: alias,
    });
    await waitFor(task, '"phase":"before"');
    sessions.push({ alias, signal, task });
  }
  for (const target of ["wb-ai", "native"]) {
    const before = publicSettings(await json(".claude/settings.json"));
    await run(target === "native" ? ["use", target] : [target]);
    const after = publicSettings(await json(".claude/settings.json"));
    const entry = (await json(".claudex-switch/aliases.json")).aliases.find((item) => item.alias === target);
    assert.equal((await json(".claude-profiles/state.json")).active, entry.target.profileName);
    const inventory = JSON.parse(await run(["list", "--json", "--no-usage"]));
    assert.equal(inventory.accounts.find((item) => item.alias === target).isActive, true);
    console.log(`switch ${target}: state.active=${target}; list active=true`);
    console.log(`settings diff: ${JSON.stringify({ before, after })}`);
    if (target === "wb-ai") {
      const bare = spawn(join(bin, "claude"), [], { cwd: home, env, stdio: ["ignore", "pipe", "pipe"] });
      let output = "";
      bare.stdout.on("data", (chunk) => { output += chunk; });
      bare.stderr.on("data", (chunk) => { output += chunk; });
      const code = await new Promise((resolveExit) => bare.once("close", resolveExit));
      assert.equal(code, 0, output);
      assert(output.includes("BARE_CLAUDE_OK"), output);
      console.log("bare claude: loopback Messages request returned OK after switch command exited");
    } else {
      assert.deepEqual(await json(".claude/.credentials.json"), credentials);
      assert.deepEqual((await json(".claudex-switch/managed-env.json")).keys, []);
      assert.deepEqual(after.env, { KEEP: "fixture", ANTHROPIC_DEFAULT_OPUS_MODEL: "claude-opus-5-5" });
    }
    for (const { alias, signal, task } of sessions) {
      await writeFile(signal, `after-${target}`);
      await waitFor(task, `"phase":"after-${target}"`);
      const reports = task.output().split("\n").filter((line) => line.startsWith("SESSION_REPORT ")).map((line) => JSON.parse(line.slice(15)));
      const { phase: _first, ...initial } = reports[0];
      const { phase: _last, ...latest } = reports.at(-1);
      assert.deepEqual(latest, initial, `${alias} routing changed`);
      console.log(`-run ${alias}: model/provider unchanged after ${target}`);
    }
  }
  const globalBeforeWrite = await json(".claude/settings.json");
  for (const { alias, signal, task } of sessions) {
    await writeFile(signal, "write-model");
    await waitFor(task, '"phase":"write-model"');
    assert.deepEqual(await json(".claude/settings.json"), globalBeforeWrite);
    const entry = (await json(".claudex-switch/aliases.json")).aliases.find((item) => item.alias === alias);
    assert.equal((await json(`.claude-profiles/${entry.target.profileName}/config/settings.json`)).model, `fixture-private-${alias}`);
    console.log(`/model ${alias}: private user settings changed; global unchanged`);
  }
  for (const session of sessions) { await writeFile(session.signal, "exit"); assert.equal((await session.task.done).code, 0); }
  const refreshed = {
    ...globalBeforeWrite,
    hooks: { SessionStart: [{ hooks: [{ type: "command", command: "printf refreshed-hook" }] }] },
    permissions: { deny: ["Bash(fixture-denied:*)"] },
    autoMode: { rules: ["refreshed shared fixture rule"] },
    env: { ...globalBeforeWrite.env, SHARED_RELAUNCH: "latest" },
    sharedOnly: "preserved",
  };
  await put(".claude/settings.json", refreshed);
  for (const { alias, signal } of sessions) {
    await writeFile(signal, "relaunch");
    const task = start([alias, "-run"], { CLAUDEX_SESSION_SIGNAL_FILE: signal, CLAUDEX_SESSION_ALIAS: alias });
    await waitFor(task, '"phase":"relaunch"');
    const report = JSON.parse(task.output().split("\n").find((line) => line.startsWith("SESSION_REPORT ")).slice(15));
    assert.deepEqual(report.hooks, refreshed.hooks);
    assert.deepEqual(report.permissions, refreshed.permissions);
    assert.deepEqual(report.autoMode, refreshed.autoMode);
    assert.equal(report.sharedRelaunch, "latest");
    const entry = (await json(".claudex-switch/aliases.json")).aliases.find((item) => item.alias === alias);
    assert.deepEqual(await json(`.claude-profiles/${entry.target.profileName}/config/settings.json`), refreshed);
    assert.deepEqual(await json(".claude/settings.json"), refreshed);
    await writeFile(signal, "exit");
    assert.equal((await task.done).code, 0);
    console.log(`relaunch ${alias}: current hooks/permissions/autoMode/env loaded; private writes discarded; global unchanged`);
  }
  const before = await tree();
  assert((await run(["wb-ai", "--help"])).includes("Usage:"));
  assert.deepEqual(await tree(), before);
  console.log("wb-ai --help: all fixture files byte-identical");
  for (const args of [["wb-ai", "typo"], ["use", "agy", "unexpected"]]) {
    const task = start(args);
    const result = await task.done;
    assert.equal(result.code, 1, result.output);
    assert(result.output.includes("Usage:"));
    assert.deepEqual(await tree(), before);
    console.log(`${args.join(" ")}: exit=1; all fixture files byte-identical`);
  }
  console.log("PASS: add -> list -> global switch -> bare claude -> OAuth restore -> live -run reload isolation -> refreshed shared settings on relaunch");
} finally {
  for (const task of launched) if (task.exitCode === null) task.kill("SIGTERM");
  // Only PIDs in our private fixture HOME can be signalled here.
  const directory = join(home, ".claudex-switch/cliproxyapi");
  for (const id of await readdir(directory).catch(() => [])) {
    try { const state = await json(`.claudex-switch/cliproxyapi/${id}/state.json`); process.kill(state.pid, "SIGTERM"); } catch {}
  }
  await new Promise((resolveWait) => setTimeout(resolveWait, 300));
  await rm(home, { recursive: true, force: true });
}
