// Run against an installed CLI; every profile and credential here is synthetic.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
const home = mkdtempSync(join(tmpdir(), 'claudex-proxy-refusal-'));
const binary = process.argv[2] ?? 'claudex-switch';
function put(file, data) {
  const path = join(home, file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data));
}
function snapshot(dir = home) {
  return Object.fromEntries(readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? Object.entries(snapshot(path)) : [[path, readFileSync(path).toString('base64')]];
  }));
}
try {
  put('.claude/settings.json', { model: 'claude-opus-5-5', env: { KEEP: 'fixture' } });
  put('.claude/.credentials.json', { claudeAiOauth: { accessToken: 'fixture' } });
  put('.claude.json', { oauthAccount: { accountUuid: 'fixture' } });
  put('.claude-profiles/state.json', { active: 'native' });
  put('.claude-profiles/native/profile.json', { type: 'oauth' });
  put('.claude-profiles/native/.credentials.json', { claudeAiOauth: { accessToken: 'saved-fixture' } });
  for (const alias of ['workbuddy', 'agy']) {
    put(`.claude-profiles/${alias}/profile.json`, {
      type: 'local-cliproxyapi', profileId: `fixture-${alias}`,
      binaryPath: '/must-not-start', defaultModel: 'fixture-model',
      upstream: alias === 'agy' ? 'antigravity' : 'workbuddy',
    });
  }
  put('.claudex-switch/aliases.json', { version: 1, aliases: ['workbuddy', 'agy', 'native'].map(alias => ({
    alias, target: { provider: 'claude', profileName: alias }, createdAt: 1,
  })) });
  const before = snapshot();
  for (const args of [['workbuddy'], ['agy'], ['use', 'workbuddy'], ['workbuddy', '--help'], ['native', '-h']]) {
    const help = args.includes('--help') || args.includes('-h');
    const result = spawnSync(binary, args, { encoding: 'utf8', env: {
      ...process.env, HOME: home, USERPROFILE: home, CLAUDEX_TEST_HOME: home,
      CLAUDE_CONFIG_DIR: join(home, '.claude'), CLAUDEX_FORCE_FILE_CREDENTIALS: '1',
      XDG_CONFIG_HOME: join(home, '.config'), XDG_DATA_HOME: join(home, '.local/share'),
      XDG_STATE_HOME: join(home, '.local/state'), XDG_CACHE_HOME: join(home, '.cache'),
      CLAUDEX_DISABLE_AUTO_UPDATE: '1', NO_COLOR: '1',
    } });
    assert.equal(result.status, help ? 0 : 1, result.stderr);
    assert.match(result.stdout + result.stderr, help ? /Usage:/ : /claudex-switch workbuddy --run|claudex-switch agy --run/);
    assert.deepEqual(snapshot(), before);
    console.log(`${args.join(' ')}: exit=${result.status}; all fixture files byte-identical`);
    if (!help) console.log((result.stderr + result.stdout).split('\n').find(line => line.startsWith('Error: Profile')));
  }
} finally {
  rmSync(home, { recursive: true, force: true });
}
