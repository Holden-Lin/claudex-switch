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

  test("compaction follows each model's subscription window instead of Claude Code's 200K guess", async () => {
    // A 40% override compacted WorkBuddy AI's 1M deepseek-v4.1-flash at 72K.
    const ids = ["default-model", "deepseek-v4.1-flash", "kimi-k2.6", "unsized"];
    const profile: LocalCLIProxyAPIProfileData = {
      type: "local-cliproxyapi", profileId: randomUUID(), binaryPath: "/unused/cliproxyapi",
      defaultModel: "fable", upstream: "workbuddy-ai",
    };
    await initializeManagedCLIProxyAPI(profile.profileId, {
      upstream: "workbuddy-ai", models: pickSubscriptionModels(ids), upstreamModels: ids, subscriptionPort: 12345,
      upstreamContext: { "default-model": 176_000, "deepseek-v4.1-flash": 1_000_000, "kimi-k2.6": 256_000 },
    });
    const path = await prepareLocalCLIProxyAPIClaudeSettings(profile, {
      port: 12346, baseUrl: "http://127.0.0.1:12346", apiKey: "fixture-client",
      models: ids.map((id) => ({ id })),
    }, { inheritModel: true });
    const settings = JSON.parse(await readFile(path, "utf8"));
    expect(settings.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS).toBe("1000000");
    const windows = Object.fromEntries(Object.entries(settings.modelSettings as Record<string, { autoCompactWindow: number }>)
      .map(([id, value]) => [id, value.autoCompactWindow]));
    expect(windows).toMatchObject({
      "default-model": 176_000, "deepseek-v4.1-flash": 1_000_000, "kimi-k2.6": 256_000, unsized: 200_000,
    });
    // Claude Code's own IDs compact at the window of the catalog model they map to.
    expect(windows[settings.modelOverrides["claude-opus-5-5"]]).toBe(windows["claude-opus-5-5"]);
  });

  test("WorkBuddy's auto mode classifier runs on deepseek-v4.1-flash only inside its own session settings", async () => {
    const settingsFor = async (upstream: "workbuddy" | "workbuddy-ai" | "cursor", ids: string[], env?: Record<string, string>) => {
      const profile: LocalCLIProxyAPIProfileData = {
        type: "local-cliproxyapi", profileId: randomUUID(), binaryPath: "/unused/cliproxyapi",
        defaultModel: "fable", upstream, ...(env ? { env } : {}),
      };
      await initializeManagedCLIProxyAPI(profile.profileId, { upstream, models: pickSubscriptionModels(ids), upstreamModels: ids, subscriptionPort: 12345 });
      const path = await prepareLocalCLIProxyAPIClaudeSettings(profile, {
        port: 12346, baseUrl: "http://127.0.0.1:12346", apiKey: "fixture-client", models: ids.map((id) => ({ id })),
      }, { inheritModel: true });
      return JSON.parse(await readFile(path, "utf8")).env as Record<string, string>;
    };
    const ids = ["default-model", "deepseek-v4.1-flash"];
    expect((await settingsFor("workbuddy-ai", ids)).CLAUDE_CODE_AUTO_MODE_MODEL).toBe("deepseek-v4.1-flash");
    expect((await settingsFor("workbuddy", ids)).CLAUDE_CODE_AUTO_MODE_MODEL).toBe("deepseek-v4.1-flash");
    // The main model is still Claude Code's own choice.
    expect((await settingsFor("workbuddy-ai", ids)).ANTHROPIC_MODEL).toBe("");
    expect((await settingsFor("workbuddy-ai", ids, { CLAUDE_CODE_AUTO_MODE_MODEL: "kimi-k3" })).CLAUDE_CODE_AUTO_MODE_MODEL).toBe("kimi-k3");
    expect((await settingsFor("workbuddy-ai", ["default-model"])).CLAUDE_CODE_AUTO_MODE_MODEL).toBeUndefined();
    expect((await settingsFor("cursor", ids)).CLAUDE_CODE_AUTO_MODE_MODEL).toBeUndefined();
  });

  test("subscription catalogs without windows keep Claude Code's defaults", async () => {
    const ids = ["auto"];
    const profile: LocalCLIProxyAPIProfileData = {
      type: "local-cliproxyapi", profileId: randomUUID(), binaryPath: "/unused/cliproxyapi",
      defaultModel: "fable", upstream: "cursor",
    };
    await initializeManagedCLIProxyAPI(profile.profileId, { upstream: "cursor", models: pickSubscriptionModels(ids), upstreamModels: ids, subscriptionPort: 12345 });
    const path = await prepareLocalCLIProxyAPIClaudeSettings(profile, {
      port: 12346, baseUrl: "http://127.0.0.1:12346", apiKey: "fixture-client", models: [{ id: "auto" }],
    }, { inheritModel: true });
    const settings = JSON.parse(await readFile(path, "utf8"));
    expect(settings.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS).toBeUndefined();
    expect(settings.modelSettings).toBeUndefined();
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
