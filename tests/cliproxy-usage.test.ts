import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { saveAliases } from "../src/alias/store";
import { list } from "../src/commands/list";
import { cliProxyAPIAuthDir, cliProxyAPIProfileDir } from "../src/lib/paths";
import { readUsageCache, writeUsageCache } from "../src/lib/usage-cache";
import { saveLocalCLIProxyAPIProfile } from "../src/providers/claude/profiles";
import { initializeManagedCLIProxyAPI } from "../src/providers/cliproxyapi/managed";
import { fetchCLIProxyAPIUsage, parseAntigravityQuota } from "../src/providers/cliproxyapi/usage";
import type { LocalCLIProxyAPIProfileData } from "../src/types";
import { resetTestHome } from "./helpers";

const originalFetch = globalThis.fetch;
const profileId = "11111111-1111-4111-8111-111111111111";
const binaryPath = join(import.meta.dir, "fixtures/fake-cliproxyapi");
const quota = {
  groups: [
    { displayName: "Claude and GPT models", buckets: [
      { window: "5h", remainingFraction: 0.37, resetTime: "2026-10-30T07:23:53Z" },
      { window: "weekly", remainingFraction: 0.21, resetTime: "2026-11-05T11:28:53Z" },
    ] },
    { displayName: "Gemini models", buckets: [{ window: "5h", remainingFraction: 1 }] },
  ],
};

async function seed(upstream: "antigravity" | "workbuddy-ai"): Promise<LocalCLIProxyAPIProfileData> {
  await initializeManagedCLIProxyAPI(profileId, { upstream });
  await saveLocalCLIProxyAPIProfile("proxy", { type: "local-cliproxyapi", profileId, binaryPath, upstream });
  await saveAliases({ version: 1, aliases: [{ alias: "proxy", target: { provider: "claude", profileName: "proxy" }, createdAt: 1 }] });
  if (upstream === "antigravity") {
    await writeFile(join(cliProxyAPIAuthDir(profileId), "account.json"), JSON.stringify({ type: upstream, access_token: "test-access", project_id: "test-project", email: "test@example.com" }));
  } else {
    await writeFile(join(cliProxyAPIProfileDir(profileId), "plugin-auth.json"), JSON.stringify({ version: 1, upstream, auth: { type: "oauth", access: "test-access", uid: "test-user" } }));
  }
  return { type: "local-cliproxyapi", profileId, binaryPath, upstream };
}

describe("proxy quota", () => {
  beforeEach(resetTestHome);
  afterEach(() => {
    globalThis.fetch = originalFetch;
    console.log.mockRestore?.();
  });

  test("reads real Antigravity window shapes, labels separate model groups and caches them", async () => {
    await seed("antigravity");
    let calls = 0;
    globalThis.fetch = (async (url, init) => {
      calls++;
      expect(String(url)).toEndWith(":retrieveUserQuotaSummary");
      expect(new Headers(init?.headers).get("authorization")).toBe("Bearer test-access");
      expect(JSON.parse(String(init?.body))).toEqual({ project: "test-project" });
      return Response.json(quota);
    }) as typeof fetch;
    spyOn(console, "log").mockImplementation(() => {});
    await list();
    const output = console.log.mock.calls.flat().join("\n");
    expect(calls).toBe(1);
    expect(output).toContain("Claude/GPT 5h 37%");
    expect(output).toContain("wk 21%");
    expect(output).toContain("Gemini 5h 100%");
    expect(output).not.toContain("unknown");
    expect(output).not.toContain("quota unavailable");
    expect(output).not.toContain("test-access");

    console.log.mockClear();
    await list({ cached: true, background: true, spawnRefresh: () => {} });
    expect(calls).toBe(1);
    expect(console.log.mock.calls.flat().join("\n")).toContain("Claude/GPT 5h 37%");
    console.log.mockClear();
    await list({ json: true });
    const account = JSON.parse(console.log.mock.calls.flat().join("\n")).accounts[0];
    expect(account.usage.groups[0].name).toBe("Claude/GPT");
    expect(account.usage.groups[1].usage.fiveHourUsedPercent).toBe(0);
  });

  test("reads WorkBuddy plan and credit units through the installed plugin and preserves them in cache", async () => {
    await seed("workbuddy-ai");
    const authPath = join(cliProxyAPIProfileDir(profileId), "plugin-auth.json");
    const before = await readFile(authPath, "utf8");
    const calls: string[] = [];
    globalThis.fetch = (async (url) => {
      const path = new URL(String(url)).pathname;
      calls.push(path);
      return Response.json({ code: 0, data: path.endsWith("get-user-resource-summary")
        ? { IsPaidUser: false, Packages: [{ CycleTotalCapacity: "350", CycleUsedCapacity: "350" }] }
        : {} });
    }) as typeof fetch;
    spyOn(console, "log").mockImplementation(() => {});
    await list();
    const output = console.log.mock.calls.flat().join("\n");
    expect(output).toContain("Free");
    expect(output).toContain("credits 0% (0/350 left)");
    expect(output).not.toContain("unknown");
    expect(output).not.toContain("quota unavailable");
    expect(await readFile(authPath, "utf8")).toBe(before);
    expect(calls).toContain("/billing/meter/get-user-resource-summary");

    const count = calls.length;
    console.log.mockClear();
    await list({ cached: true, background: true, spawnRefresh: () => {} });
    expect(calls).toHaveLength(count);
    expect(console.log.mock.calls.flat().join("\n")).toContain("Free");
    expect(console.log.mock.calls.flat().join("\n")).toContain("credits 0%");
    console.log.mockClear();
    await list({ json: true });
    const account = JSON.parse(console.log.mock.calls.flat().join("\n")).accounts[0];
    expect(account.plan).toBe("free");
    expect(account.usage.credits).toEqual({ used: 350, total: 350 });
  });

  test("no-usage and cached failures omit placeholders and never make quota requests", async () => {
    await seed("antigravity");
    let calls = 0;
    globalThis.fetch = (() => { calls++; throw new Error("must not fetch"); }) as typeof fetch;
    spyOn(console, "log").mockImplementation(() => {});
    await list({ usage: false });
    const cache = await readUsageCache();
    cache.entries["claude:proxy"] = { usage: null, balance: null, plan: null, note: "quota unavailable", dataAt: Date.now() - 120_000, checkedAt: Date.now() };
    await writeUsageCache(cache);
    await list({ cached: true, background: true, spawnRefresh: () => {} });
    const output = console.log.mock.calls.flat().join("\n");
    expect(output).toContain("proxy  local CLIProxyAPI  Antigravity");
    expect(output).not.toContain("unknown");
    expect(output).not.toContain("quota unavailable");
    expect(output).not.toContain("ago");
    expect(calls).toBe(0);
  });

  test("unavailable or expired upstream access returns no quota and does not write credentials", async () => {
    const profile = await seed("antigravity");
    const file = join(cliProxyAPIAuthDir(profileId), "account.json");
    const before = await readFile(file, "utf8");
    globalThis.fetch = (async () => new Response("upstream secret error", { status: 401 })) as typeof fetch;
    expect(await fetchCLIProxyAPIUsage(profile)).toEqual({ usage: null, note: "usage n/a" });
    expect(await readFile(file, "utf8")).toBe(before);
  });

  test("missing or malformed quota is never guessed as zero or unlimited", () => {
    expect(parseAntigravityQuota({})).toBeNull();
    expect(parseAntigravityQuota({ groups: [{ displayName: "Gemini", buckets: [{ window: "5h", remainingFraction: "0.5" }, { window: "weekly", remainingFraction: 1.5 }] }] })).toBeNull();
    const usage = parseAntigravityQuota({ groups: [{ displayName: "Gemini", buckets: [{ window: "5h", remainingFraction: 0, resetTime: "bad" }] }] });
    expect(usage?.groups?.[0]?.usage).toEqual({ fiveHourUsedPercent: 100, fiveHourResetsAt: null, weeklyUsedPercent: null, weeklyResetsAt: null });
  });
});
