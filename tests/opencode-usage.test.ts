import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { createOpenCodeGoProfile } from "../src/providers/opencode/profiles";
import {
  fetchOpenCodeUsage,
  parseOpenCodeUsageResponse,
} from "../src/providers/opencode/usage";
import { resetTestHome } from "./helpers";

const PROFILE_ID = "go-00000000-0000-4000-8000-000000000009";
const originalFetch = globalThis.fetch;

describe("OpenCode Go usage", () => {
  beforeEach(async () => {
    await resetTestHome();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("maps all three official usage windows and sends the private Go key only as Bearer auth", async () => {
    await createOpenCodeGoProfile(PROFILE_ID, {
      type: "api",
      key: "go-secret",
    });
    let authorization: string | null = null;
    globalThis.fetch = (async (_input: unknown, init?: RequestInit) => {
      authorization = (init?.headers as Record<string, string>).Authorization;
      return new Response(
        JSON.stringify({
          usage: {
            rolling: {
              status: "ok",
              percent: 10,
              resetsAt: "2026-09-14T10:00:00Z",
            },
            weekly: {
              status: "ok",
              percent: 20,
              resetsAt: "2026-09-15T00:00:00Z",
            },
            monthly: {
              status: "rate-limited",
              percent: 0,
              resetsAt: "2026-10-01T00:00:00Z",
            },
          },
        }),
        { status: 200 },
      );
    }) as typeof fetch;

    await expect(fetchOpenCodeUsage(PROFILE_ID)).resolves.toEqual({
      usage: {
        fiveHourUsedPercent: 10,
        fiveHourResetsAt: Date.parse("2026-09-14T10:00:00Z"),
        weeklyUsedPercent: 20,
        weeklyResetsAt: Date.parse("2026-09-15T00:00:00Z"),
        monthlyUsedPercent: 100,
        monthlyResetsAt: Date.parse("2026-10-01T00:00:00Z"),
      },
      note: null,
    });
    expect(authorization).toBe("Bearer go-secret");
  });

  test("rejects malformed server data and degrades an invalid key to reconnect required", async () => {
    expect(
      parseOpenCodeUsageResponse({ usage: { rolling: { percent: "no" } } }),
    ).toBeNull();
    await createOpenCodeGoProfile(PROFILE_ID, {
      type: "api",
      key: "go-secret",
    });
    globalThis.fetch = (async () =>
      new Response("", { status: 401 })) as typeof fetch;

    await expect(fetchOpenCodeUsage(PROFILE_ID)).resolves.toEqual({
      usage: null,
      note: "reconnect required",
    });
  });

  test("reports an unsubscribed workspace without mislabeling it as a bad key", async () => {
    await createOpenCodeGoProfile(PROFILE_ID, {
      type: "api",
      key: "go-secret",
    });
    globalThis.fetch = (async () =>
      new Response("", { status: 403 })) as typeof fetch;

    await expect(fetchOpenCodeUsage(PROFILE_ID)).resolves.toEqual({
      usage: null,
      note: "Go subscription required",
    });
  });
});
