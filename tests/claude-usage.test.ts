import { describe, expect, test } from "bun:test";
import { parseUsageResponse } from "../src/providers/claude/usage";

const weekly = { utilization: 38, resets_at: "2026-11-22T07:00:00Z" };
const fable = {
  kind: "weekly_scoped",
  group: "weekly",
  percent: 42,
  resets_at: "2026-11-23T08:00:00Z",
  scope: { model: { id: null, display_name: "Fable" }, surface: null },
};

describe("Claude usage parser", () => {
  test("reads the model-scoped weekly percentage and its own reset", () => {
    expect(parseUsageResponse({
      seven_day: weekly,
      limits: [null, { ...fable, scope: null }, fable],
      weekly_scoped_shares: [{ limit_index: 2, used_percent_of_weekly: 21, allowance_percent_of_weekly: 50 }],
    })).toEqual({
      fiveHourUsedPercent: null,
      fiveHourResetsAt: null,
      weeklyUsedPercent: 38,
      weeklyResetsAt: Date.parse(weekly.resets_at),
      fableWeeklyUsedPercent: 42,
      fableWeeklyResetsAt: Date.parse(fable.resets_at),
    });
  });

  test("keeps legacy responses unchanged without deriving a Fable quota", () => {
    const result = parseUsageResponse({ seven_day: weekly, weekly_scoped_shares: [{ allowance_percent_of_weekly: 50 }] });
    expect(result?.weeklyUsedPercent).toBe(38);
    expect(result).not.toHaveProperty("fableWeeklyUsedPercent");
  });

  test("does not confuse another model or a session limit with Fable weekly", () => {
    const result = parseUsageResponse({
      seven_day: weekly,
      limits: [
        { ...fable, scope: { model: { display_name: "Other" } } },
        { ...fable, kind: "session" },
      ],
    });
    expect(result).not.toHaveProperty("fableWeeklyUsedPercent");
  });

  test("accepts zero usage and an unknown reset in a standalone Fable window", () => {
    const result = parseUsageResponse({ limits: [{ ...fable, percent: 0, resets_at: "invalid" }] });
    expect(result?.fableWeeklyUsedPercent).toBe(0);
    expect(result?.fableWeeklyResetsAt).toBeNull();
  });

  test.each([null, "42", NaN, Infinity, -1, 101])("ignores invalid Fable percentage %s", (percent) => {
    expect(parseUsageResponse({ limits: [{ ...fable, percent }] })).toBeNull();
  });

  test.each([null, {}, { limits: {} }, { limits: [null, 1, {}] }])("tolerates absent or malformed windows %j", (payload) => {
    expect(parseUsageResponse(payload)).toBeNull();
  });
});
