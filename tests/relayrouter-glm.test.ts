import { beforeEach, describe, expect, test } from "bun:test";
import { readJson } from "../src/lib/fs";
import { MANAGED_ENV_FILE, SETTINGS_FILE } from "../src/lib/paths";
import {
  apiProfileExtraEnv,
  applyApiConfig,
  applyOAuthConfig,
  prepareApiProfileClaudeSettings,
  prepareOAuthProfileClaudeSettings,
} from "../src/providers/claude/settings";
import { resetTestHome } from "./helpers";

const config = { apiKey: "fixture-key", baseUrl: "https://api.relayrouter.ai", model: "glm-5.3-flash" };
type Settings = { env: Record<string, string> };

describe("RelayRouter GLM profile settings", () => {
  beforeEach(resetTestHome);

  test("explicit profile preferences override generated window and side-query defaults", async () => {
    const env = {
      CLAUDE_CODE_MAX_CONTEXT_TOKENS: "750000", CLAUDE_CODE_AUTO_COMPACT_WINDOW: "600000",
      CLAUDE_AUTOCOMPACT_PCT_OVERRIDE: "70", ANTHROPIC_SMALL_FAST_MODEL: "chosen-fast-model",
      CLAUDE_CODE_AUTO_MODE_MODEL: "chosen-classifier", CLAUDE_CODE_AUTO_MODE_SERVER: "1",
    };
    await applyApiConfig({ ...config, env });
    const privateFile = await prepareApiProfileClaudeSettings("relay", { ...config, env });
    for (const path of [SETTINGS_FILE, privateFile]) {
      expect((await readJson<Settings>(path, { env: {} })).env).toMatchObject(env);
    }
  });

  test("generated settings are tracked, isolated from other profiles, and removed on a global switch", async () => {
    await applyApiConfig(config);
    const settings = await readJson<Settings>(SETTINGS_FILE, { env: {} });
    const { keys } = await readJson<{ keys: string[] }>(MANAGED_ENV_FILE, { keys: [] });
    for (const [key, value] of Object.entries(apiProfileExtraEnv(config))) {
      expect(keys).toContain(key);
      expect(settings.env[key]).toBe(value);
    }
    const otherFile = await prepareOAuthProfileClaudeSettings("other", { type: "oauth" });
    const other = await readJson<Settings>(otherFile, { env: {} });
    for (const key of keys) expect(other.env[key]).toBe("");

    await applyApiConfig({ ...config, model: "gpt-6-astra" });
    const astra = await readJson<Settings>(SETTINGS_FILE, { env: {} });
    expect(astra.env.ANTHROPIC_MODEL).toBe("gpt-6-astra");
    for (const key of keys) expect(astra.env[key]).toBeUndefined();
    await applyOAuthConfig();
    expect((await readJson<Settings>(SETTINGS_FILE, { env: {} })).env).toEqual({ ANTHROPIC_DEFAULT_OPUS_MODEL: "claude-opus-5-5" });
  });

  test.each([
    "https://api.deepseek.com/anthropic", "https://api.relayrouter.org",
    "https://api.relayrouter.ai.example.com", "http://api.relayrouter.ai",
  ])("does not change another endpoint: %s", (baseUrl) => {
    expect(apiProfileExtraEnv({ ...config, baseUrl })).toEqual({});
  });
});
