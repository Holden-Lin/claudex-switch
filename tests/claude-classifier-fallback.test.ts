import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, readFile, stat } from "fs/promises";
import { dirname } from "path";
import { readJson, writeJson } from "../src/lib/fs";
import { MANAGED_ENV_FILE, SETTINGS_FILE } from "../src/lib/paths";
import {
  applyApiConfig,
  applyLocalCLIProxyAPIConfig,
  applyOAuthConfig,
  getClaudeEnvNeutralizer,
  prepareApiProfileClaudeSettings,
  prepareOAuthProfileClaudeSettings,
  type LocalCLIProxyAPISettings,
} from "../src/providers/claude/settings";
import { assertIsolatedHome, fileMode, resetTestHome } from "./helpers";

const AUTO_MODE_SERVER = "CLAUDE_CODE_AUTO_MODE_SERVER";
const proxyConfig: LocalCLIProxyAPISettings = {
  apiKey: "local-client-key",
  baseUrl: "http://127.0.0.1:12345",
  model: "upstream-main",
  fableModel: "upstream-main",
  opusModel: "upstream-main",
  sonnetModel: "upstream-sonnet",
  haikuModel: "upstream-haiku",
  subagentModel: null,
};

async function readSettings() {
  return readJson<{ env?: Record<string, string> }>(SETTINGS_FILE, {});
}

describe("local proxy classifier fallback", () => {
  beforeEach(async () => {
    assertIsolatedHome(SETTINGS_FILE);
    await resetTestHome();
  });
  afterEach(resetTestHome);

  test.each([undefined, "1"])("tracks default or explicit classifier setting %s on activation", async (override) => {
    await applyLocalCLIProxyAPIConfig(proxyConfig, override ? { [AUTO_MODE_SERVER]: override } : undefined);
    expect((await readSettings()).env?.[AUTO_MODE_SERVER]).toBe(override ?? "0");
    expect((await readJson<{ keys: string[] }>(MANAGED_ENV_FILE, { keys: [] })).keys).toContain(AUTO_MODE_SERVER);
  });

  test.each(["api", "oauth"])("clears generated fallback when globally switching to %s", async (kind) => {
    await applyLocalCLIProxyAPIConfig(proxyConfig);
    if (kind === "api") await applyApiConfig({ apiKey: "direct-key" });
    else await applyOAuthConfig();
    expect((await readSettings()).env?.[AUTO_MODE_SERVER]).toBeUndefined();
    expect((await readJson<{ keys: string[] }>(MANAGED_ENV_FILE, { keys: [] })).keys).not.toContain(AUTO_MODE_SERVER);
  });

  test("isolated API and OAuth settings neutralize active fallback and preserve explicit preferences", async () => {
    await applyLocalCLIProxyAPIConfig(proxyConfig);
    const globalBefore = await readFile(SETTINGS_FILE, "utf-8");
    const neutralizer = JSON.parse((await getClaudeEnvNeutralizer())!);
    expect(neutralizer.env[AUTO_MODE_SERVER]).toBe("");

    for (const override of [undefined, "1"]) {
      const extra = override ? { [AUTO_MODE_SERVER]: override } : undefined;
      const api = await prepareApiProfileClaudeSettings("direct", { apiKey: "direct-key", env: extra });
      const oauth = await prepareOAuthProfileClaudeSettings("subscription", { type: "oauth", env: extra });
      for (const file of [api, oauth]) {
        const settings = JSON.parse(await readFile(file, "utf-8"));
        expect(settings.env[AUTO_MODE_SERVER]).toBe(override ?? "");
        expect(fileMode((await stat(file)).mode)).toBe(0o600);
      }
    }
    expect(await readFile(SETTINGS_FILE, "utf-8")).toBe(globalBefore);
  });

  test("direct profiles preserve a user-owned setting outside managed profile ownership", async () => {
    await mkdir(dirname(SETTINGS_FILE), { recursive: true });
    await writeJson(SETTINGS_FILE, { env: { [AUTO_MODE_SERVER]: "1" } });
    await applyApiConfig({ apiKey: "direct-key" });
    expect((await readSettings()).env?.[AUTO_MODE_SERVER]).toBe("1");
    await applyOAuthConfig();
    expect((await readSettings()).env?.[AUTO_MODE_SERVER]).toBe("1");
  });
});
