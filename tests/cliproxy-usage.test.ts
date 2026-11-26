import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { saveAliases } from "../src/alias/store";
import { current } from "../src/commands/current";
import { buildSnapshot } from "../src/webconfig/snapshot";
import { list } from "../src/commands/list";
import { CLAUDE_STATE_FILE, cliProxyAPIAuthDir, cliProxyAPIProfileDir } from "../src/lib/paths";
import { readUsageCache, writeUsageCache } from "../src/lib/usage-cache";
import { saveLocalCLIProxyAPIProfile } from "../src/providers/claude/profiles";
import { initializeManagedCLIProxyAPI, updateManagedCLIProxyAPISetup } from "../src/providers/cliproxyapi/managed";
import { fetchCLIProxyAPIUsage, parseAntigravityQuota } from "../src/providers/cliproxyapi/usage";
import type { LocalCLIProxyAPIProfileData } from "../src/types";
import { formatWeeklyReset } from "../src/lib/ui";
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
    { displayName: "Gemini models", buckets: [{ window: "5h", remainingFraction: 1 }, { window: "weekly", remainingFraction: 0.65, resetTime: "2026-12-02T10:15:45Z" }] },
  ],
};

async function seed(upstream: "antigravity" | "workbuddy" | "workbuddy-ai" | "cursor"): Promise<LocalCLIProxyAPIProfileData> {
  await initializeManagedCLIProxyAPI(profileId, { upstream });
  await saveLocalCLIProxyAPIProfile("proxy", { type: "local-cliproxyapi", profileId, binaryPath, upstream });
  await saveAliases({ version: 1, aliases: [{ alias: "proxy", target: { provider: "claude", profileName: "proxy" }, createdAt: 1 }] });
  if (upstream === "antigravity") {
    await writeFile(join(cliProxyAPIAuthDir(profileId), "account.json"), JSON.stringify({ type: upstream, access_token: "test-access", project_id: "test-project", email: "test@example.com" }));
  } else {
    await writeFile(join(cliProxyAPIProfileDir(profileId), "plugin-auth.json"), JSON.stringify({ version: 1, upstream, auth: { type: "oauth", access: "test-access", uid: "test-user", ...(upstream === "cursor" ? { accountId: "test@example.com" } : { accountId: "Nickname", email: "test@example.com" }) } }));
  }
  return { type: "local-cliproxyapi", profileId, binaryPath, upstream };
}

describe("proxy quota", () => {
  beforeEach(resetTestHome);
  afterEach(() => {
    globalThis.fetch = originalFetch;
    console.log.mockRestore?.();
  });

  test("reads Gemini windows through live, cached and JSON list without a group prefix", async () => {
    await seed("antigravity");
    let calls = 0;
    globalThis.fetch = (async (url, init) => {
      calls++;
      expect(String(url)).toEndWith(":retrieveUserQuotaSummary");
      expect(new Headers(init?.headers).get("authorization")).toBe("Bearer test-access");
      expect(new Headers(init?.headers).get("user-agent")).toBe("antigravity/hub/2.25.0 darwin/arm64");
      expect(JSON.parse(String(init?.body))).toEqual({ project: "test-project" });
      return Response.json(quota);
    }) as typeof fetch;
    spyOn(console, "log").mockImplementation(() => {});
    await list();
    const output = console.log.mock.calls.flat().join("\n");
    expect(calls).toBe(1);
    expect(output).toContain(`5h 100% · wk 65%${formatWeeklyReset(Date.parse("2026-12-02T10:15:45Z"))}`);
    expect(output).not.toMatch(/Claude\/GPT|Gemini 5h/);
    expect(output).toContain("test@example.com");
    expect(output).not.toContain("unknown");
    expect(output).not.toContain("quota unavailable");
    expect(output).not.toContain("test-access");

    console.log.mockClear();
    await list({ cached: true, background: true, spawnRefresh: () => {} });
    expect(calls).toBe(1);
    expect(console.log.mock.calls.flat().join("\n")).toContain("5h 100% · wk 65%");
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
    expect(output).toContain("── Antigravity ──");
    expect(output).not.toContain("CLIProxyAPI");
    expect(output).not.toContain("unknown");
    expect(output).not.toContain("quota unavailable");
    expect(output).not.toContain("ago");
    expect(calls).toBe(0);
  });

  for (const upstream of ["antigravity", "workbuddy", "workbuddy-ai", "cursor"] as const) {
    test(`${upstream} reads a local email in list and current without quota requests`, async () => {
      await seed(upstream);
      globalThis.fetch = (() => { throw new Error("must not fetch"); }) as typeof fetch;
      spyOn(console, "log").mockImplementation(() => {});
      await list({ usage: false });
      expect(console.log.mock.calls.flat().join("\n")).toContain("test@example.com");
      const snapshot = await buildSnapshot();
      expect(snapshot.claude[0].label).toBe({ antigravity: "Antigravity", workbuddy: "WorkBuddy (China)", "workbuddy-ai": "WorkBuddy AI (international)", cursor: "Cursor" }[upstream]);
      await writeFile(CLAUDE_STATE_FILE, JSON.stringify({ active: "proxy" }));
      console.log.mockClear();
      await current();
      expect(console.log.mock.calls.flat().join("\n")).toContain("test@example.com");
    });
  }

  test.each(["workbuddy", "workbuddy-ai"] as const)("%s never treats an email-shaped nickname as login email", async (upstream) => {
    await seed(upstream);
    await writeFile(join(cliProxyAPIProfileDir(profileId), "plugin-auth.json"), JSON.stringify({ version: 1, upstream, auth: { type: "oauth", access: "test-access", accountId: "nickname@example.com", uid: "12345" } }));
    spyOn(console, "log").mockImplementation(() => {});
    await list({ usage: false });
    const output = console.log.mock.calls.flat().join("\n");
    expect(output).not.toMatch(/nickname@example.com|12345|unknown|email|n\/a|null/);
    await writeFile(CLAUDE_STATE_FILE, JSON.stringify({ active: "proxy" }));
    console.log.mockClear();
    await current();
    expect(console.log.mock.calls.flat().join("\n")).not.toContain("nickname@example.com");
  });

  test.each(["claude-opus-5-5-high", "gpt-6.1", "gemini-3.8-flash-high", "unknown-model"])("shows only Gemini quota for model %s in live and cached output", async (defaultModel) => {
    const profile = await seed("antigravity");
    await updateManagedCLIProxyAPISetup(profileId, { upstreamModels: [defaultModel] });
    await saveLocalCLIProxyAPIProfile("proxy", { ...profile, defaultModel });
    globalThis.fetch = (async () => Response.json(quota)) as typeof fetch;
    spyOn(console, "log").mockImplementation(() => {});
    for (const options of [{}, { cached: true, background: true, spawnRefresh: () => {} }]) {
      console.log.mockClear();
      await list(options);
      const output = console.log.mock.calls.flat().join("\n");
      expect(output).toContain(defaultModel);
      expect(output).toContain("5h 100% · wk 65%");
      expect(output).not.toMatch(/Claude\/GPT|Gemini 5h/);
    }
  });

  test("Claude/GPT-only quota omits unavailable Gemini windows without fallback", async () => {
    await seed("antigravity");
    globalThis.fetch = (async () => Response.json({ groups: [quota.groups[0]] })) as typeof fetch;
    spyOn(console, "log").mockImplementation(() => {});
    await list();
    const output = console.log.mock.calls.flat().join("\n");
    expect(output).not.toMatch(/Claude\/GPT|5h 37%|wk 21%/);
    expect(output).not.toContain("Gemini");
  });

  test("a refresh missing Gemini keeps the last valid Gemini quota", async () => {
    await seed("antigravity");
    globalThis.fetch = (async () => Response.json(quota)) as typeof fetch;
    spyOn(console, "log").mockImplementation(() => {});
    await list();
    globalThis.fetch = (async () => Response.json({ groups: [quota.groups[0]] })) as typeof fetch;
    console.log.mockClear();
    await list();
    expect(console.log.mock.calls.flat().join("\n")).toContain("5h 100% · wk 65%");
    expect((await readUsageCache()).entries["claude:proxy"].note).toBe("usage n/a");
  });

  test("Gemini weekly-only summary does not invent a five-hour window", async () => {
    await seed("antigravity");
    globalThis.fetch = (async () => Response.json({ groups: [{ displayName: "Gemini Models", buckets: [quota.groups[1].buckets[1]] }] })) as typeof fetch;
    spyOn(console, "log").mockImplementation(() => {});
    await list();
    const row = console.log.mock.calls.flat().join("\n").split("\n").find((line) => line.includes("test@example.com"))!;
    expect(row).toContain("wk 65%");
    expect(row).not.toContain("5h");
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
