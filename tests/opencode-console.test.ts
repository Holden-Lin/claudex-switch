import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { Database } from "bun:sqlite";
import * as childProcess from "child_process";
import { EventEmitter } from "events";
import { mkdir } from "fs/promises";
import { dirname } from "path";
import * as prompts from "@inquirer/prompts";
import * as consoleProvider from "../src/providers/opencode/console";
import { add } from "../src/commands/add";
import { list } from "../src/commands/list";
import { refresh } from "../src/commands/refresh";
import { runAliasSession } from "../src/commands/run";
import { loadAliases, saveAliases } from "../src/alias/store";
import { purgeAccount } from "../src/accounts/purge";
import { OPENCODE_LOCKS_DIR, openCodeProfileConsoleLock, openCodeProfileDataFile, openCodeProfileV2DatabaseFile } from "../src/lib/paths";
import { readJson } from "../src/lib/fs";
import { getOpenCodeProfileData, hasOpenCodeGoCredential, saveOpenCodeConsoleProfile } from "../src/providers/opencode/profiles";
import { readOpenCodeConsoleCredentials } from "../src/providers/opencode/native";
import { fetchOpenCodeUsage } from "../src/providers/opencode/usage";
import { acquireProfileLock } from "../src/providers/opencode/lock";
import type { OpenCodeGoProfileData } from "../src/types";
import { resetTestHome } from "./helpers";

const A = "go-00000000-0000-4000-8000-000000000031";
const B = "go-00000000-0000-4000-8000-000000000032";
const originalFetch = globalThis.fetch;
const profile = (id = "cred_a", account = "user_a", org = "org_a"): OpenCodeGoProfileData => ({
  type: "go", defaultModel: "opencode/minimax-m3",
  console: { credentialId: id, accountId: account, orgId: org, email: `${account}@example.com`, orgName: org },
});
const value = (account = "user_a", org = "org_a") => ({
  type: "oauth", methodID: "device", access: `fake-access-${account}`, refresh: `fake-refresh-${account}`, expires: Date.now() + 3600_000,
  metadata: { server: "https://opencode.ai/console", accountID: account, email: `${account}@example.com`, orgID: org, orgName: org },
});
const status = (used = "25") => ({ product: "go", access: {
  startsAt: "2026-01-01T00:00:00Z", endsAt: "2099-01-01T00:00:00Z", cancelAtPeriodEnd: true,
  meters: { fiveHour: { limitMicroCents: "100", usedMicroCents: used, resetsAt: null }, week: { limitMicroCents: "200", usedMicroCents: "100", resetsAt: "2098-01-01T00:00:00Z" }, month: { limitMicroCents: "300", usedMicroCents: "300" } },
} });

async function seed(path: string, entries = [{ id: "cred_a", active: 1, integration: "opencode", value: value() }]): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const db = new Database(path);
  try {
    db.exec("CREATE TABLE credential (id text PRIMARY KEY, integration_id text, label text, value text, active integer)");
    for (const entry of entries) db.prepare("INSERT INTO credential VALUES (?, ?, ?, ?, ?)").run(entry.id, entry.integration, entry.id, JSON.stringify(entry.value), entry.active);
  } finally { db.close(); }
}

describe("OpenCode browser subscriptions", () => {
  beforeEach(resetTestHome);
  afterEach(() => {
    globalThis.fetch = originalFetch;
    consoleProvider.loginOpenCodeConsole.mockRestore?.();
    consoleProvider.prepareOpenCodeConsoleRun.mockRestore?.();
    prompts.select.mockRestore?.();
    childProcess.spawnSync.mockRestore?.();
    process.exit.mockRestore?.();
    console.log.mockRestore?.();
  });

  test("validates subscription dates independently of quota data and pending cancellation", () => {
    const parsed = consoleProvider.parseOpenCodeConsoleStatus(status());
    expect(parsed.active).toBe(true);
    expect(parsed.usage?.fiveHourUsedPercent).toBe(25);
    expect(parsed.usage?.weeklyUsedPercent).toBe(50);
    expect(parsed.usage?.monthlyUsedPercent).toBe(100);
    expect(parsed.usage?.monthlyResetsAt).toBe(Date.parse("2099-01-01T00:00:00Z"));
    expect(parsed.usage?.fiveHourResetsAt).toBeNull();
    expect(consoleProvider.parseOpenCodeConsoleStatus({ access: { endsAt: "2099-01-01T00:00:00Z" } })).toEqual({ active: true, usage: null });
    for (const data of [null, {}, { access: null }, { access: { endsAt: "bad" } }, { access: { endsAt: "2020-01-01T00:00:00Z" } }, { access: { endsAt: "2099-01-01T00:00:00Z", startsAt: "2098-01-01T00:00:00Z" } }]) {
      expect(consoleProvider.parseOpenCodeConsoleStatus(data)).toEqual({ active: false, usage: null });
    }
  });

  test("clamps exhausted windows and leaves malformed windows unknown", () => {
    const data = status("999");
    (data.access.meters.week as unknown as Record<string, unknown>).limitMicroCents = "0";
    (data.access.meters.month as unknown as Record<string, unknown>).usedMicroCents = "no";
    const result = consoleProvider.parseOpenCodeConsoleStatus(data);
    expect(result.active).toBe(true);
    expect(result.usage?.fiveHourUsedPercent).toBe(100);
    expect(result.usage?.weeklyUsedPercent).toBeNull();
    expect(result.usage?.monthlyUsedPercent).toBeNull();
  });

  test("reads only native Console OAuth and pins the account/workspace instead of active selection", async () => {
    await saveOpenCodeConsoleProfile(A, profile());
    await seed(openCodeProfileV2DatabaseFile(A), [
      { id: "cred_a", active: 0, integration: "opencode", value: value() },
      { id: "cred_other", active: 1, integration: "opencode", value: value("user_b", "org_b") },
      { id: "cred_wrong_provider", active: 1, integration: "anthropic", value: value() },
    ]);
    expect(await hasOpenCodeGoCredential(A)).toBe(true);
    expect((await readOpenCodeConsoleCredentials(openCodeProfileV2DatabaseFile(A))).map((item) => item.id)).toEqual(["cred_a", "cred_other"]);
    expect((await consoleProvider.readPinnedConsoleCredential(A)).id).toBe("cred_a");
    const db = new Database(openCodeProfileV2DatabaseFile(A));
    db.prepare("UPDATE credential SET value = ? WHERE id = ?").run(JSON.stringify(value("user_b", "org_b")), "cred_a");
    db.close();
    await expect(consoleProvider.readPinnedConsoleCredential(A)).rejects.toThrow("identity is missing or changed");
    expect(await hasOpenCodeGoCredential(A)).toBe(false);
  });

  test("uses each pinned token and workspace for quota and renders correct remaining percentages", async () => {
    await saveOpenCodeConsoleProfile(A, profile());
    await saveOpenCodeConsoleProfile(B, profile("cred_b", "user_b", "org_b"));
    await seed(openCodeProfileV2DatabaseFile(A));
    await seed(openCodeProfileV2DatabaseFile(B), [{ id: "cred_b", active: 1, integration: "opencode", value: value("user_b", "org_b") }]);
    await saveAliases({ version: 1, aliases: [
      { alias: "go-a", target: { provider: "opencode", profileId: A } },
      { alias: "go-b", target: { provider: "opencode", profileId: B } },
    ] });
    const headers: unknown[] = [];
    globalThis.fetch = (async (url: unknown, init?: RequestInit) => {
      expect(String(url)).toBe("https://opencode.ai/console/api/go/status");
      headers.push(init?.headers);
      return Response.json(status((init?.headers as Record<string, string>)["x-org-id"] === "org_a" ? "25" : "75"));
    }) as typeof fetch;
    const output: string[] = [];
    spyOn(console, "log").mockImplementation((line) => { output.push(String(line)); });
    await list({ json: true });
    const payload = JSON.parse(output[0]!);
    expect(payload.accounts[0].usage.fiveHourUsedPercent).toBe(25);
    expect(payload.accounts[1].usage.fiveHourUsedPercent).toBe(75);
    expect(JSON.stringify(payload)).not.toContain("fake-access");
    output.length = 0;
    await list();
    expect(output.join("\n")).toContain("user_a@example.com");
    expect(output.join("\n")).toContain("user_b@example.com");
    expect(output.join("\n")).toContain("75%");
    expect(output.join("\n")).toContain("25%");
    expect(output.join("\n")).not.toContain("fake-refresh");
    expect(headers).toContainEqual({ Authorization: "Bearer fake-access-user_a", "x-org-id": "org_a" });
    expect(headers).toContainEqual({ Authorization: "Bearer fake-access-user_b", "x-org-id": "org_b" });
  });

  test("distinguishes unauthorized, no subscription, offline and missing quota", async () => {
    await saveOpenCodeConsoleProfile(A, profile());
    await seed(openCodeProfileV2DatabaseFile(A));
    for (const [response, note] of [[new Response("", { status: 401 }), "reconnect required"], [new Response("", { status: 429 }), "quota unavailable"], [Response.json({ access: null }), "Go subscription required"], [Response.json({ access: { endsAt: "2099-01-01T00:00:00Z" } }), "quota unavailable"]] as const) {
      globalThis.fetch = (async () => response) as typeof fetch;
      expect((await fetchOpenCodeUsage(A)).note).toBe(note);
    }
  });

  test("restricts Console to available Go models, disables other models and retains permission settings", () => {
    const go = [{ providerID: "opencode", id: "minimax-m3" }];
    const models = [...go, { providerID: "opencode", id: "paid" }];
    const config = consoleProvider.buildOpenCodeConsoleConfig(JSON.stringify({ permissions: [{ action: "read", effect: "allow" }], providers: { opencode: { models: { custom: { name: "Custom" } } } } }), "opencode-go/minimax-m3", models, go);
    expect(config.model).toBe("opencode/minimax-m3");
    expect(config.permissions).toEqual([{ action: "read", effect: "allow" }]);
    expect((config.providers as any).opencode.models.paid.disabled).toBe(true);
    expect((config.providers as any).opencode.models.custom.disabled).toBe(true);
    expect(() => consoleProvider.buildOpenCodeConsoleConfig(undefined, "opencode/paid", models, go)).toThrow("unavailable");
    for (const override of [{ settings: { apiKey: "fake" } }, { variants: [{ id: "paid", headers: { Authorization: "fake" } }] }]) {
      expect(() => consoleProvider.buildOpenCodeConsoleConfig(JSON.stringify({ providers: { opencode: { models: { custom: override } } } }), "opencode/minimax-m3", models, go)).toThrow("routing");
    }
    expect(() => consoleProvider.buildOpenCodeConsoleConfig(JSON.stringify({ experimental: { policies: [{ action: "provider.use", resource: "opencode", effect: "deny" }] } }), "opencode/minimax-m3", models, go)).toThrow("refusing to weaken");
  });

  test("adds through the subscription menu without an API key and shows verified identity", async () => {
    spyOn(prompts, "select").mockResolvedValue("opencode-subscription" as never);
    spyOn(childProcess, "spawnSync").mockReturnValue({ status: 0, stdout: "opencode v2.0.22", stderr: "" } as never);
    const login = spyOn(consoleProvider, "loginOpenCodeConsole").mockImplementation(async (id) => {
      await saveOpenCodeConsoleProfile(id, profile());
      return profile();
    });
    const output: string[] = [];
    spyOn(console, "log").mockImplementation((line) => { output.push(String(line)); });
    await add("go-second");
    expect(login).toHaveBeenCalledTimes(1);
    expect((await loadAliases()).aliases[0]?.alias).toBe("go-second");
    expect(output.join("\n")).toContain("Go subscription verified");
    expect(output.join("\n")).toContain("user_a@example.com");
  });

  test("failed or wrong-account refresh keeps the saved metadata and default intact", async () => {
    await saveOpenCodeConsoleProfile(A, profile());
    await saveAliases({ version: 1, aliases: [{ alias: "go-a", target: { provider: "opencode", profileId: A } }] });
    spyOn(childProcess, "spawnSync").mockReturnValue({ status: 0, stdout: "opencode v2.0.22", stderr: "" } as never);
    const login = spyOn(consoleProvider, "loginOpenCodeConsole").mockRejectedValue(new Error("Login selected a different account or workspace"));
    spyOn(process, "exit").mockImplementation((() => { throw new Error("expected exit"); }) as never);
    await expect(refresh("go-a")).rejects.toThrow("expected exit");
    expect(login).toHaveBeenCalledWith(A, profile());
    expect(await readJson(openCodeProfileDataFile(A), null)).toEqual(profile());
  });

  test("rejected run model does not replace the working default", async () => {
    await saveOpenCodeConsoleProfile(A, profile());
    await seed(openCodeProfileV2DatabaseFile(A));
    await saveAliases({ version: 1, aliases: [{ alias: "go-a", target: { provider: "opencode", profileId: A } }] });
    spyOn(consoleProvider, "prepareOpenCodeConsoleRun").mockRejectedValue(new Error("The selected model is unavailable"));
    const spawn = () => { throw new Error("must not launch"); };
    expect(await runAliasSession("go-a", ["--model", "opencode/paid"], spawn as never, () => ({ major: 2, minor: 0, patch: 22, raw: "2.0.22" }))).toBe(1);
    expect((await getOpenCodeProfileData(A)).defaultModel).toBe("opencode/minimax-m3");
  });

  test("purge refuses a running subscription and keeps its alias and credential until release", async () => {
    await saveOpenCodeConsoleProfile(A, profile());
    await seed(openCodeProfileV2DatabaseFile(A));
    await saveAliases({ version: 1, aliases: [{ alias: "go-a", target: { provider: "opencode", profileId: A } }] });
    await mkdir(OPENCODE_LOCKS_DIR, { recursive: true });
    const release = await acquireProfileLock(openCodeProfileConsoleLock(A), "subscription account");
    try {
      await expect(purgeAccount("go-a")).rejects.toThrow("lock");
      expect((await loadAliases()).aliases[0]?.alias).toBe("go-a");
      expect(await hasOpenCodeGoCredential(A)).toBe(true);
    } finally { await release(); }
    await purgeAccount("go-a");
    expect((await loadAliases()).aliases).toEqual([]);
    expect(await hasOpenCodeGoCredential(A)).toBe(false);
  });

  test("run releases the native credential lease on normal exit and launch failure", async () => {
    await saveOpenCodeConsoleProfile(A, profile());
    await seed(openCodeProfileV2DatabaseFile(A));
    await saveAliases({ version: 1, aliases: [{ alias: "go-a", target: { provider: "opencode", profileId: A } }] });
    let releases = 0;
    spyOn(consoleProvider, "prepareOpenCodeConsoleRun").mockResolvedValue({ env: { TEST_ACCOUNT: "a" }, release: async () => { releases++; } });
    const version = () => ({ major: 2, minor: 0, patch: 22, raw: "2.0.22" });
    const spawn = (_command: unknown, _args: unknown, options: any) => {
      expect(options.env.TEST_ACCOUNT).toBe("a");
      const child = new EventEmitter();
      queueMicrotask(() => child.emit("close", 0));
      return child;
    };
    expect(await runAliasSession("go-a", [], spawn as never, version)).toBe(0);
    expect(releases).toBe(1);
    expect(await runAliasSession("go-a", [], (() => { throw new Error("test launch failure"); }) as never, version)).toBe(1);
    expect(releases).toBe(2);
  });
});
