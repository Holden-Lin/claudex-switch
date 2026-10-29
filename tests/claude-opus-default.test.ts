import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { readJson } from "../src/lib/fs";
import { SETTINGS_FILE } from "../src/lib/paths";
import {
  applyApiConfig,
  applyOAuthConfig,
  getClaudeEnvNeutralizer,
  prepareApiProfileClaudeSettings,
  prepareOAuthProfileClaudeSettings,
} from "../src/providers/claude/settings";
import { resetTestHome } from "./helpers";

type Settings = { env: Record<string, string> };

describe("Claude opus default", () => {
  beforeEach(resetTestHome);
  afterEach(resetTestHome);

  test("supplies Opus 5.5 for OAuth even with clean global settings", async () => {
    const override = JSON.parse(await getClaudeEnvNeutralizer()) as Settings;
    expect(override.env.ANTHROPIC_DEFAULT_OPUS_MODEL).toBe("claude-opus-5-5");
    const file = await prepareOAuthProfileClaudeSettings("oauth", {
      type: "oauth", env: { CUSTOM_SETTING: "keep" },
    });
    const settings = await readJson<Settings>(file, { env: {} });
    expect(settings.env.ANTHROPIC_DEFAULT_OPUS_MODEL).toBe("claude-opus-5-5");
    expect(settings.env.CUSTOM_SETTING).toBe("keep");
    await applyOAuthConfig("opus");
    expect((await readJson<Settings>(SETTINGS_FILE, { env: {} })).env.ANTHROPIC_DEFAULT_OPUS_MODEL).toBe("claude-opus-5-5");
  });

  test.each([undefined, "relay-opus"])("uses default while preserving explicit API mapping %s", async (defaultOpusModel) => {
    const config = { apiKey: "fake-key", model: "opus", defaultOpusModel };
    await applyApiConfig(config);
    const file = await prepareApiProfileClaudeSettings("api", config);
    for (const path of [SETTINGS_FILE, file]) {
      const settings = await readJson<Settings>(path, { env: {} });
      expect(settings.env.ANTHROPIC_DEFAULT_OPUS_MODEL).toBe(defaultOpusModel ?? "claude-opus-5-5");
    }
  });
});
