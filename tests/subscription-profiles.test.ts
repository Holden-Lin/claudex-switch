import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { initializeManagedCLIProxyAPI, prepareLocalCLIProxyAPIClaudeSettings, resolveManagedLocalCLIProxyAPIModel } from "../src/providers/cliproxyapi/managed";
import { CLI_PROXY_API_UPSTREAMS, parseUpstream, pickSubscriptionModels } from "../src/providers/cliproxyapi/upstreams";
import { isSubscriptionName } from "../src/commands/cliproxy";
import type { LocalCLIProxyAPIProfileData } from "../src/types";
import { resetTestHome } from "./helpers";

describe("Claude Code subscription profiles", () => {
  beforeEach(resetTestHome);
  afterEach(resetTestHome);

  test.each(["cursor", "workbuddy", "workbuddy-ai"] as const)("%s uses the account's exact model IDs and preserves older available versions", async (upstream) => {
    const ids = ["claude-opus-4-6", "claude-opus-5-5", "claude-sonnet-5-5", "gemini-3.8-flash"];
    const models = pickSubscriptionModels(ids);
    const profile: LocalCLIProxyAPIProfileData = {
      type: "local-cliproxyapi", profileId: randomUUID(), binaryPath: "/unused/cliproxyapi",
      defaultModel: "fable", upstream,
    };
    await initializeManagedCLIProxyAPI(profile.profileId, { upstream, models, upstreamModels: ids, subscriptionPort: 12345 });
    const path = await prepareLocalCLIProxyAPIClaudeSettings(profile, {
      port: 12346, baseUrl: "http://127.0.0.1:12346", apiKey: "fixture-client",
      models: ids.map((id) => ({ id, display_name: `Plan ${id}` })),
    }, { inheritModel: true, savedModel: "claude-opus-4-6" });
    const settings = JSON.parse(await readFile(path, "utf8"));
    expect(settings.model).toBeUndefined();
    expect(settings.env.ANTHROPIC_MODEL).toBe("");
    expect(settings.env.CLAUDE_CODE_AUTO_MODE_SERVER).toBe("0");
    expect(settings.modelPicker.options.map((option: { model: string }) => option.model)).toEqual(ids);
    expect(settings.modelPicker.options[0].description).toContain(CLI_PROXY_API_UPSTREAMS[upstream].label);
    expect(settings.modelOverrides["claude-opus-4-6"]).toBeUndefined();
    expect(await resolveManagedLocalCLIProxyAPIModel(profile, "opus")).toBe("claude-opus-5-5");
    expect(await resolveManagedLocalCLIProxyAPIModel(profile, "claude-opus-4-6")).toBe("claude-opus-4-6");
    await expect(resolveManagedLocalCLIProxyAPIModel(profile, "unlisted-model")).rejects.toThrow("not in the account catalog");
  });

  test("Cursor Auto and opaque model IDs are selected only from its catalog", () => {
    const ids = ["auto", "claude-4.6-opus-high", "gpt-5.5-high-fast"];
    expect(pickSubscriptionModels(ids).fableModel).toBe("auto");
    expect(pickSubscriptionModels(ids, { fableModel: ids[1]!, opusModel: "retired", sonnetModel: "missing", haikuModel: "missing" }).fableModel).toBe(ids[1]!);
    expect(() => pickSubscriptionModels([])).toThrow("empty or invalid");
    expect(() => pickSubscriptionModels(["model\nINJECT=value"])).toThrow("empty or invalid");
  });

  test("provider markers round-trip and unknown markers cannot silently become ChatGPT", () => {
    for (const id of ["cursor", "workbuddy", "workbuddy-ai"]) {
      expect(parseUpstream(id)).toBe(id);
      expect(isSubscriptionName(id.toUpperCase())).toBe(true);
    }
    expect(parseUpstream(undefined)).toBe("codex");
    expect(() => parseUpstream("typo")).toThrow("Unknown managed proxy upstream");
  });
});
