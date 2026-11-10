import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { initializeManagedCLIProxyAPI, prepareLocalCLIProxyAPIClaudeSettings, resolveManagedLocalCLIProxyAPIModel, resolveManagedLocalCLIProxyAPIDefaultModel, refreshManagedSubscriptionModels, getLocalCLIProxyAPISettings } from "../src/providers/cliproxyapi/managed";
import { cliProxyAPIProfileDir } from "../src/lib/paths";
import { CLI_PROXY_API_UPSTREAMS, parseUpstream, pickSubscriptionModels } from "../src/providers/cliproxyapi/upstreams";
import { isSubscriptionName } from "../src/commands/cliproxy";
import type { LocalCLIProxyAPIProfileData } from "../src/types";
import { resetTestHome } from "./helpers";

describe("Claude Code subscription profiles", () => {
  beforeEach(resetTestHome);
  afterEach(resetTestHome);

  test.each(["workbuddy", "workbuddy-ai"] as const)("%s real catalog refresh preserves missing free DS tiers and explicit SG still works", async (upstream) => {
    const base = "deepseek-v4.1-flash", sg = `${base}-sg`;
    const saved = { fableModel: base, opusModel: base, sonnetModel: base, haikuModel: base };
    const profile: LocalCLIProxyAPIProfileData = {
      type: "local-cliproxyapi", profileId: randomUUID(), binaryPath: "/unused/cliproxyapi", defaultModel: "fable", upstream,
    };
    await initializeManagedCLIProxyAPI(profile.profileId, { upstream, models: saved, upstreamModels: [base, sg], upstreamFree: [base] });
    await writeFile(join(cliProxyAPIProfileDir(profile.profileId), "plugin-auth.json"), JSON.stringify({
      version: 1, upstream, auth: { type: "oauth", access: "fixture-access", uid: "fixture-user", expires: Date.now() + 3_600_000 },
    }));
    const originalFetch = globalThis.fetch;
    let catalogReads = 0;
    globalThis.fetch = (async (input) => {
      expect(new URL(String(input)).pathname).toBe("/v3/config");
      catalogReads++;
      return Response.json({ code: 0, data: {
        agents: [{ name: "cli", models: [sg] }], models: [{ id: sg, name: "DeepSeek", credits: "x0.11", maxInputTokens: 1_000_000 }],
      } });
    }) as typeof fetch;
    try {
      // This is the real refresh operation invoked by ensureManagedCLIProxyAPIUnlocked;
      // only the vendor catalog transport is replaced, never selection or persistence.
      await refreshManagedSubscriptionModels(profile.profileId);
      await refreshManagedSubscriptionModels(profile.profileId);
      expect(catalogReads).toBe(2);
      const runtime = { port: 12346, baseUrl: "http://127.0.0.1:12346", apiKey: "fixture-client", models: [{ id: sg, free: false }] };
      const stored = await getLocalCLIProxyAPISettings({ ...profile, defaultModel: sg }, runtime);
      for (const tier of ["fableModel", "opusModel", "sonnetModel", "haikuModel"] as const) expect(stored[tier]).toBe(base);
      await expect(resolveManagedLocalCLIProxyAPIDefaultModel(profile)).rejects.toThrow("refusing to substitute");
      await expect(prepareLocalCLIProxyAPIClaudeSettings(profile, runtime, { inheritModel: true })).rejects.toThrow("refusing to substitute");
      expect(await resolveManagedLocalCLIProxyAPIModel(profile, sg)).toBe(sg);
      const path = await prepareLocalCLIProxyAPIClaudeSettings({ ...profile, defaultModel: sg }, runtime);
      const explicit = JSON.parse(await readFile(path, "utf8"));
      expect(explicit.model).toBe(sg);
      for (const tier of ["FABLE", "OPUS", "SONNET", "HAIKU"]) expect(explicit.env[`ANTHROPIC_DEFAULT_${tier}_MODEL`]).toBe(sg);
      await prepareLocalCLIProxyAPIClaudeSettings({ ...profile, env: { ANTHROPIC_MODEL: sg, CLAUDE_CODE_AUTO_MODE_MODEL: sg } }, runtime);
      const envChoice = JSON.parse(await readFile(path, "utf8"));
      expect(envChoice.env.ANTHROPIC_MODEL).toBe(sg);
      expect(envChoice.env.CLAUDE_CODE_AUTO_MODE_MODEL).toBe(sg);
      await prepareLocalCLIProxyAPIClaudeSettings({ ...profile, env: { ANTHROPIC_MODEL: base } }, runtime, { modelOverride: sg });
      const flagChoice = JSON.parse(await readFile(path, "utf8"));
      expect(flagChoice.model).toBe(sg);
      expect(flagChoice.env.ANTHROPIC_MODEL).toBe(sg);
      const unchanged = await getLocalCLIProxyAPISettings({ ...profile, defaultModel: sg }, runtime);
      expect(unchanged.fableModel).toBe(base);
    } finally { globalThis.fetch = originalFetch; }
  });

  test("paid-only WorkBuddy discovery leaves unchosen tiers unset and Cursor keeps its old behavior", () => {
    const sg = "deepseek-v4.1-flash-sg";
    const pricing = { free: [], previousFree: null, context: {} };
    expect(pickSubscriptionModels([sg], undefined, pricing)).toEqual({ fableModel: "fable", opusModel: "opus", sonnetModel: "sonnet", haikuModel: "haiku" });
    expect(pickSubscriptionModels([sg], undefined, { ...pricing, upstream: "cursor" })).toEqual({ fableModel: sg, opusModel: sg, sonnetModel: sg, haikuModel: sg });
  });

  test("an omitted saved free DS never silently falls back to the paid SG tier", async () => {
    const base = "deepseek-v4.1-flash", sg = `${base}-sg`;
    const profile: LocalCLIProxyAPIProfileData = {
      type: "local-cliproxyapi", profileId: randomUUID(), binaryPath: "/unused/cliproxyapi", defaultModel: base, upstream: "workbuddy-ai",
    };
    await initializeManagedCLIProxyAPI(profile.profileId, {
      upstream: "workbuddy-ai", models: { fableModel: sg, opusModel: sg, sonnetModel: sg, haikuModel: sg }, upstreamModels: [sg], subscriptionPort: 12345,
    });
    await expect(resolveManagedLocalCLIProxyAPIDefaultModel(profile)).rejects.toThrow("refusing to substitute");
    profile.defaultModel = sg;
    const path = await prepareLocalCLIProxyAPIClaudeSettings(profile, {
      port: 12346, baseUrl: "http://127.0.0.1:12346", apiKey: "fixture-client", models: [{ id: sg }],
    }, { inheritModel: true, savedModel: base });
    const settings = JSON.parse(await readFile(path, "utf8"));
    expect(settings.modelOverrides[base]).toBeUndefined();
    expect(await resolveManagedLocalCLIProxyAPIModel(profile, sg)).toBe(sg);
  });

  test("free DS sessions keep classifier and all tier side calls off previously saved paid SG", async () => {
    const base = "deepseek-v4.1-flash", sg = `${base}-sg`;
    const profile: LocalCLIProxyAPIProfileData = {
      type: "local-cliproxyapi", profileId: randomUUID(), binaryPath: "/unused/cliproxyapi", defaultModel: base, upstream: "workbuddy-ai",
    };
    const paid = { fableModel: sg, opusModel: sg, sonnetModel: sg, haikuModel: sg };
    await initializeManagedCLIProxyAPI(profile.profileId, {
      upstream: "workbuddy-ai", models: paid, upstreamModels: [base, sg], upstreamFree: [base], subscriptionPort: 12345,
    });
    const path = await prepareLocalCLIProxyAPIClaudeSettings(profile, {
      port: 12346, baseUrl: "http://127.0.0.1:12346", apiKey: "fixture-client", models: [{ id: base, free: true }],
    }, { inheritModel: true, savedModel: "claude-opus-5-5" });
    const settings = JSON.parse(await readFile(path, "utf8"));
    for (const tier of ["FABLE", "OPUS", "SONNET", "HAIKU"]) expect(settings.env[`ANTHROPIC_DEFAULT_${tier}_MODEL`]).toBe(base);
    expect(settings.env.CLAUDE_CODE_AUTO_MODE_MODEL).toBe(base);
    expect(settings.modelOverrides["claude-opus-5-5"]).toBe(base);
    expect(settings.modelOverrides["claude-haiku-5-5"]).toBe(base);
    expect(await resolveManagedLocalCLIProxyAPIModel(profile, sg)).toBe(sg);
    // A cached free list must not override today's catalog price.
    await prepareLocalCLIProxyAPIClaudeSettings(profile, {
      port: 12346, baseUrl: "http://127.0.0.1:12346", apiKey: "fixture-client", models: [{ id: base, free: false }],
    });
    const repriced = JSON.parse(await readFile(path, "utf8"));
    expect(repriced.env.CLAUDE_CODE_AUTO_MODE_MODEL).toBeUndefined();
    expect(repriced.env.ANTHROPIC_DEFAULT_SONNET_MODEL).toBe(sg);
  });

  test.each(["workbuddy", "workbuddy-ai", "cursor"] as const)("%s picker hides duplicate SG while explicit IDs and saved overrides still route", async (upstream) => {
    const base = "deepseek-v4.1-flash";
    const sg = `${base}-sg`;
    const ids = [base, sg];
    const profile: LocalCLIProxyAPIProfileData = {
      type: "local-cliproxyapi", profileId: randomUUID(), binaryPath: "/unused/cliproxyapi", defaultModel: "fable", upstream,
    };
    await initializeManagedCLIProxyAPI(profile.profileId, {
      upstream, models: pickSubscriptionModels(ids), upstreamModels: ids, subscriptionPort: 12345,
      upstreamContext: { [base]: 1_000_000, [sg]: 200_000 },
    });
    const path = await prepareLocalCLIProxyAPIClaudeSettings(profile, {
      port: 12346, baseUrl: "http://127.0.0.1:12346", apiKey: "fixture-client", models: ids.map((id) => ({ id })),
    }, { inheritModel: true, savedModel: sg });
    let settings = JSON.parse(await readFile(path, "utf8"));
    expect(settings.modelPicker.options.map(({ model }: { model: string }) => model)).toEqual(upstream === "cursor" ? ids : [base]);
    expect(await resolveManagedLocalCLIProxyAPIModel(profile, sg)).toBe(sg);
    // Discovery from the bridge no longer contains SG; a shared settings pin must still survive.
    await prepareLocalCLIProxyAPIClaudeSettings(profile, {
      port: 12346, baseUrl: "http://127.0.0.1:12346", apiKey: "fixture-client", models: [{ id: base }],
    }, { savedModel: sg });
    settings = JSON.parse(await readFile(path, "utf8"));
    expect(settings.modelOverrides[sg]).toBeUndefined();
    expect(settings.modelSettings[sg].autoCompactWindow).toBe(200_000);
  });

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
    expect(settings.env.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE).toBeUndefined();
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
      await initializeManagedCLIProxyAPI(profile.profileId, {
        upstream, models: pickSubscriptionModels(ids), upstreamModels: ids, subscriptionPort: 12345,
        upstreamFree: ids.filter((id) => id === "deepseek-v4.1-flash"),
      });
      const path = await prepareLocalCLIProxyAPIClaudeSettings(profile, {
        port: 12346, baseUrl: "http://127.0.0.1:12346", apiKey: "fixture-client", models: ids.map((id) => ({ id, free: id === "deepseek-v4.1-flash" })),
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

  test("a priced catalog maps every tier to its widest free model and moves auto-picked paid tiers once", () => {
    // WorkBuddy AI on 2026-10-29: Auto first and unpriced, two x0.00 models, a cheap paid flash.
    const ids = ["default-model", "fast-model", "hy3", "deepseek-v4.1-flash", "glm-5.3-flash"];
    const pricing = {
      free: ["hy3", "deepseek-v4.1-flash"], previousFree: null,
      context: { "default-model": 176_000, hy3: 192_000, "deepseek-v4.1-flash": 1_000_000, "glm-5.3-flash": 1_000_000 },
    };
    const allFree = { fableModel: "deepseek-v4.1-flash", opusModel: "deepseek-v4.1-flash", sonnetModel: "deepseek-v4.1-flash", haikuModel: "deepseek-v4.1-flash" };
    // Without prices the old rule stands: Auto first, newest flash for haiku.
    expect(pickSubscriptionModels(ids)).toEqual({ fableModel: "default-model", opusModel: "default-model", sonnetModel: "default-model", haikuModel: "glm-5.3-flash" });
    expect(pickSubscriptionModels(ids, undefined, pricing)).toEqual(allFree);
    // Paid tiers saved before prices were recorded were auto-picked: they move.
    const old = pickSubscriptionModels(ids);
    expect(pickSubscriptionModels(ids, old, pricing)).toEqual(allFree);
    // A free choice stays; so does a paid tier that was already paid at the last sync (the user's edit).
    const edited = { ...allFree, opusModel: "hy3", sonnetModel: "default-model" };
    expect(pickSubscriptionModels(ids, edited, { ...pricing, previousFree: pricing.free })).toEqual(edited);
    // A tier that was free at the last sync but costs credits now moves back to a free model.
    expect(pickSubscriptionModels(ids, { ...allFree, haikuModel: "fast-model" }, { ...pricing, previousFree: ["fast-model", ...pricing.free] }).haikuModel)
      .toBe("deepseek-v4.1-flash");
    // A catalog with no free model keeps the old rule and the saved tiers.
    expect(pickSubscriptionModels(ids, edited, { ...pricing, free: [] })).toEqual(edited);
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
