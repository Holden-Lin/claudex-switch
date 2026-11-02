// Synthetic vendor endpoints for the installed CLI acceptance check.
import assert from "node:assert/strict";
assert(process.env.CLAUDEX_TEST_HOME?.includes("claudex-proxy-accounts-"));
if (process.env.CLAUDEX_FIXTURE_INTERACTIVE === "1") {
  Object.defineProperty(process.stdin, "isTTY", { value: true });
  process.stdin.setRawMode = () => process.stdin;
}

const originalFetch = globalThis.fetch;
const jwt = `x.${Buffer.from(JSON.stringify({ sub: "fixture-user", exp: 4_102_444_800 })).toString("base64url")}.x`;
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  if (["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) return originalFetch(input, init);
  if (["copilot.tencent.com", "www.workbuddy.ai"].includes(url.hostname)) {
    const data = url.pathname === "/v2/plugin/auth/state"
      ? { state: "fixture-state", authUrl: "https://fixture.invalid/login" }
      : url.pathname === "/v2/plugin/auth/token"
        ? { accessToken: "fixture-access", refreshToken: "fixture-refresh", expiresIn: 86_400 }
        : url.pathname === "/v2/plugin/login/account"
          ? { uid: "fixture-user", nickname: "Fixture", type: "personal" }
          : url.pathname === "/v3/config"
            ? { agents: [{ name: "cli", models: ["deepseek-v4.1-flash", "claude-opus-5-5"] }], models: [
              { id: "deepseek-v4.1-flash", name: "Fixture free model", maxInputTokens: 1_000_000, maxOutputTokens: 8192, supportsTools: true, credits: "x0.00" },
              { id: "claude-opus-5-5", name: "Fixture Opus", maxInputTokens: 200_000, maxOutputTokens: 8192, supportsTools: true, credits: "x1.00" },
            ] }
            : undefined;
    if (data) return Response.json({ code: 0, data });
  }
  if (url.hostname === "api2.cursor.sh") {
    if (url.pathname === "/auth/poll") return Response.json({ accessToken: jwt, refreshToken: "fixture-refresh" });
    if (url.pathname.endsWith("/GetMe")) return Response.json({ email: "fixture@example.com" });
    if (url.pathname.endsWith("/GetPlanInfo")) return Response.json({ planInfo: { planName: "Pro" } });
    if (url.pathname.endsWith("/AvailableModels")) return Response.json({ models: [
      { name: "claude-opus-5-5", clientDisplayName: "Fixture Opus", contextTokenLimit: 200_000, supportsAgent: true },
    ] });
    if (url.pathname.endsWith("/GetUsableModels")) return Response.json({ models: [{ modelId: "claude-opus-5-5" }] });
  }
  throw new Error(`Acceptance fixture blocked external request: ${url.hostname}${url.pathname}`);
};
