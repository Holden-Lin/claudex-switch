import { expect, test } from "bun:test";
import { join } from "node:path";

test("built subscription launcher never migrates missing free DS tiers to paid SG", async () => {
  const child = Bun.spawn(["bun", join(import.meta.dir, "../scripts/verify-subscription-catalog-refresh.ts")], {
    stdout: "pipe", stderr: "pipe",
  });
  const stdout = new Response(child.stdout).text(), stderr = new Response(child.stderr).text();
  const code = await child.exited;
  const [text, errors] = await Promise.all([stdout, stderr]);
  expect(errors).toBe("");
  expect(code).toBe(0);
  const proof = JSON.parse(text);
  expect(proof.vendorChatRequests).toBe(0);
  expect(proof.results.map((result: { upstream: string }) => result.upstream)).toEqual(["workbuddy", "workbuddy-ai"]);
}, 90_000);
