export const WORKBUDDY_DEEPSEEK_MODEL = "deepseek-v4.1-flash";

export function canFallbackSubscriptionModel(upstream: unknown, model: string, target?: string, free: readonly string[] = []): boolean {
  if (upstream !== "workbuddy" && upstream !== "workbuddy-ai") return true;
  if (model === WORKBUDDY_DEEPSEEK_MODEL) return false;
  // Catalog selection supplies a target; compatibility aliases only check the pinned model.
  return target === undefined || free.includes(target);
}
