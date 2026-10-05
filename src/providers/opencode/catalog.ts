import { normalizeOpenCodeGoModel, OPENCODE_GO_PROVIDER_ID } from "./profiles";

const OPENCODE_GO_CATALOG_URL = "https://opencode.ai/zen/go/v1/models";

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
