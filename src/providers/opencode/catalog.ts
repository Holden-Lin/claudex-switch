import { normalizeOpenCodeGoModel, OPENCODE_GO_PROVIDER_ID } from "./profiles";
import { createHash, randomUUID } from "crypto";
import { link, readFile, rename, rm, stat, writeFile } from "fs/promises";
import { join } from "path";

const OPENCODE_GO_CATALOG_URL = "https://opencode.ai/zen/go/v1/models";

/** Pin one public catalog for discovery, routing checks and the final TUI.
 * Native background refresh is disabled so Console's paid-model denylist
 * cannot race a catalog update. Refresh our private snapshot before discovery
 * instead; an offline run keeps the last good snapshot or the bundled catalog.
 */
export async function prepareOpenCodeModelCatalog(env: NodeJS.ProcessEnv): Promise<void> {
  const offline = env.OPENCODE_DISABLE_MODELS_FETCH;
  env.OPENCODE_DISABLE_MODELS_FETCH = "1";
  if (env.OPENCODE_MODELS_PATH || !env.XDG_CACHE_HOME) return;
  const path = join(env.XDG_CACHE_HOME, "claudex-models.json");
  let cached: string | undefined;
  let fresh = false;
  const valid = (data: unknown): boolean => {
    if (!data || typeof data !== "object" || Array.isArray(data)) return false;
    const provider = (data as Record<string, unknown>).opencode;
    return !!provider && typeof provider === "object" && !Array.isArray(provider) &&
      !!(provider as Record<string, unknown>).models &&
      typeof (provider as Record<string, unknown>).models === "object" &&
      !Array.isArray((provider as Record<string, unknown>).models) &&
      Object.keys((provider as { models: object }).models).length > 0;
  };
  try {
    const text = await readFile(path, "utf8");
    if (valid(JSON.parse(text))) cached = text;
    fresh = cached !== undefined && Date.now() - (await stat(path)).mtimeMs < 5 * 60_000;
  } catch { /* No usable private snapshot yet. */ }
  if (!fresh && offline !== "1" && offline !== "true") {
    const temporary = `${path}.${randomUUID()}.tmp`;
    try {
      const base = env.OPENCODE_MODELS_URL || "https://models.opencode.ai";
      const response = await fetch(`${base.replace(/\/$/, "")}/api.json`, {
        signal: AbortSignal.timeout(5_000), redirect: "error",
      });
      if (response.ok) {
        const text = await response.text();
        if (valid(JSON.parse(text))) {
          await writeFile(temporary, text, { mode: 0o600 });
          await rename(temporary, path);
          cached = text;
        }
      }
    } catch { /* Keep the last good snapshot or OpenCode's bundled catalog. */ }
    finally { await rm(temporary, { force: true }); }
  }
  if (cached) {
    // A second launch may refresh the shared cache while this TUI starts.
    // Pin by content so that it still uses exactly the catalog we verified.
    const digest = createHash("sha256").update(cached).digest("hex");
    const snapshot = join(env.XDG_CACHE_HOME, `claudex-models-${digest}.json`);
    const temporary = `${path}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, cached, { mode: 0o600 });
      try { await link(temporary, snapshot); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
      env.OPENCODE_MODELS_PATH = snapshot;
    } finally { await rm(temporary, { force: true }); }
  }
}

/** Official Go model IDs, or null when the public catalog is unreachable. */
export async function fetchOpenCodeGoCatalogIds(): Promise<Set<string> | null> {
  try {
    const response = await fetch(OPENCODE_GO_CATALOG_URL, { signal: AbortSignal.timeout(5_000), redirect: "error" });
    if (!response.ok) return null;
    const data: unknown = await response.json();
    const items = data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)
      ? (data as { data: unknown[] }).data
      : [];
    const ids = new Set(items.flatMap((item) =>
      item && typeof item === "object" && typeof (item as { id?: unknown }).id === "string" ? [(item as { id: string }).id] : []));
    return ids.size > 0 ? ids : null;
  } catch {
    return null;
  }
}

/**
 * Map user input to the catalog's exact model ID. The OpenCode picker shows
 * display names such as "GLM-5.3-Flash", but the upstream only accepts the
 * lowercase ID ("glm-5.3-flash") and rejects anything else as unavailable.
 */
export function matchOpenCodeGoModel(input: string, catalog: Set<string>): string {
  const model = normalizeOpenCodeGoModel(input);
  const id = model.slice(OPENCODE_GO_PROVIDER_ID.length + 1);
  if (catalog.has(id)) return model;
  const wanted = id.toLowerCase().replace(/\s+/g, "-");
  const match = [...catalog].find((candidate) => candidate.toLowerCase() === wanted);
  if (match) return `${OPENCODE_GO_PROVIDER_ID}/${match}`;
  throw new Error(
    `OpenCode Go has no model "${id}". Available: ${[...catalog].sort().join(", ")}.`,
  );
}

/** Resolve against the live catalog; offline, keep the syntactically valid input. */
export async function resolveOpenCodeGoModel(input: string): Promise<string> {
  const catalog = await fetchOpenCodeGoCatalogIds();
  return catalog ? matchOpenCodeGoModel(input, catalog) : normalizeOpenCodeGoModel(input);
}
