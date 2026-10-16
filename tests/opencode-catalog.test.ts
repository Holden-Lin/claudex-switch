import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, readFile, stat, utimes, writeFile } from "fs/promises";
import { join } from "path";
import { prepareOpenCodeModelCatalog } from "../src/providers/opencode/catalog";
import { openCodeConsoleEnvironment } from "../src/providers/opencode/console";
import { createOpenCodeGoProfile } from "../src/providers/opencode/profiles";
import { prepareOpenCodeV2RunEnvironment } from "../src/providers/opencode/runtime";
import { resetTestHome } from "./helpers";

const originalFetch = globalThis.fetch;
const catalog = { opencode: { models: {
  "glm-5.3-flash-free": { id: "glm-5.3-flash-free", cost: { input: 0, output: 0 } },
  "deepseek-v4.1-flash-free": { id: "deepseek-v4.1-flash-free", cost: { input: 0, output: 0 } },
  "new-public-model": { id: "new-public-model", cost: { input: 0, output: 0 } },
} } };
let cache: string;
let requests: string[];

describe("OpenCode private model catalog", () => {
  beforeEach(async () => {
    await resetTestHome();
    cache = join(process.env.CLAUDEX_TEST_HOME!, "catalog-cache");
    await mkdir(cache);
    requests = [];
    globalThis.fetch = (async (url: string | URL | Request) => {
      requests.push(String(url));
      return Response.json(catalog);
    }) as typeof fetch;
  });
  afterEach(() => { globalThis.fetch = originalFetch; });

  test("pins new public models before key and Console discovery with private snapshots", async () => {
    const id = "go-00000000-0000-4000-8000-000000000041";
    await createOpenCodeGoProfile(id, { type: "api", key: "fake-catalog-key" });
    const keyRun = await prepareOpenCodeV2RunEnvironment(id, "opencode-go/kimi-k3", async (_id, _key, env) => {
      expect(JSON.parse(await readFile(env.OPENCODE_MODELS_PATH!, "utf8"))).toEqual(catalog);
    });
    const consoleRun = await openCodeConsoleEnvironment("go-00000000-0000-4000-8000-000000000042");
    for (const env of [keyRun.env, consoleRun]) {
      expect(env.OPENCODE_DISABLE_MODELS_FETCH).toBe("1");
      expect(env.OPENCODE_MODELS_PATH!.startsWith(env.XDG_CACHE_HOME!)).toBe(true);
      expect(JSON.parse(await readFile(env.OPENCODE_MODELS_PATH!, "utf8"))).toEqual(catalog);
      expect((await stat(env.OPENCODE_MODELS_PATH!)).mode & 0o777).toBe(0o600);
    }
    expect(requests.filter(url => url === "https://models.opencode.ai/api.json")).toHaveLength(2);
  });

  test("reuses a fresh snapshot and refreshes a stale one before discovery", async () => {
    const env: NodeJS.ProcessEnv = { XDG_CACHE_HOME: cache };
    await prepareOpenCodeModelCatalog(env);
    await prepareOpenCodeModelCatalog({ XDG_CACHE_HOME: cache });
    expect(requests).toHaveLength(1);
    const path = join(cache, "claudex-models.json");
    await utimes(path, new Date(0), new Date(0));
    const updated = { opencode: { models: { "another-new-model": { id: "another-new-model" } } } };
    globalThis.fetch = (async (url) => { requests.push(String(url)); return Response.json(updated); }) as typeof fetch;
    const next: NodeJS.ProcessEnv = { XDG_CACHE_HOME: cache };
    await prepareOpenCodeModelCatalog(next);
    expect(requests).toHaveLength(2);
    expect(next.OPENCODE_MODELS_PATH).not.toBe(env.OPENCODE_MODELS_PATH);
    expect(JSON.parse(await readFile(env.OPENCODE_MODELS_PATH!, "utf8"))).toEqual(catalog);
    expect(JSON.parse(await readFile(next.OPENCODE_MODELS_PATH!, "utf8"))).toEqual(updated);
  });

  test("keeps the last good snapshot on offline, invalid and HTTP failures", async () => {
    const path = join(cache, "claudex-models.json");
    await writeFile(path, JSON.stringify(catalog));
    await utimes(path, new Date(0), new Date(0));
    for (const fetcher of [
      async () => { throw new Error("offline"); },
      async () => new Response("not JSON"),
      async () => Response.json({ error: "bad catalog" }),
      async () => new Response(null, { status: 503 }),
    ]) {
      globalThis.fetch = fetcher as typeof fetch;
      const env: NodeJS.ProcessEnv = { XDG_CACHE_HOME: cache };
      await prepareOpenCodeModelCatalog(env);
      expect(env.OPENCODE_MODELS_PATH).toContain("claudex-models-");
      expect(JSON.parse(await readFile(env.OPENCODE_MODELS_PATH!, "utf8"))).toEqual(catalog);
      expect(JSON.parse(await readFile(path, "utf8"))).toEqual(catalog);
    }
  });

  test("honors explicit offline, custom file and catalog URL settings", async () => {
    for (const override of [
      { OPENCODE_DISABLE_MODELS_FETCH: "1" },
      { OPENCODE_DISABLE_MODELS_FETCH: "true" },
      { OPENCODE_MODELS_PATH: "/custom/catalog.json" },
    ]) {
      const env = { XDG_CACHE_HOME: cache, ...override };
      await prepareOpenCodeModelCatalog(env);
      expect(env.OPENCODE_MODELS_PATH).toBe(override.OPENCODE_MODELS_PATH);
    }
    expect(requests).toHaveLength(0);
    await prepareOpenCodeModelCatalog({ XDG_CACHE_HOME: cache, OPENCODE_MODELS_URL: "http://127.0.0.1:1234/" });
    expect(requests).toEqual(["http://127.0.0.1:1234/api.json"]);
  });

  test("falls back to the native bundled catalog when the first refresh fails", async () => {
    globalThis.fetch = (async () => { throw new Error("offline"); }) as typeof fetch;
    const env: NodeJS.ProcessEnv = { XDG_CACHE_HOME: cache };
    await prepareOpenCodeModelCatalog(env);
    expect(env.OPENCODE_MODELS_PATH).toBeUndefined();
    expect(env.OPENCODE_DISABLE_MODELS_FETCH).toBe("1");
  });
});
