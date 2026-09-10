import { isValidCustomEnvKey } from "../providers/claude/settings";
import type { CustomEnv } from "../types";

// Field validation shared by the two ways the page writes an account: editing an
// existing one and creating a new one. Kept together so the same bad input
// cannot be rejected on one path and silently accepted on the other.

export function optional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function requireValidUrl(value: string): void {
  const trimmed = value.trim();
  if (!trimmed) return;
  try {
    new URL(trimmed);
  } catch {
    throw new Error(`请求地址不是合法 URL：${trimmed}`);
  }
}

/**
 * Reject bad custom env keys rather than dropping them. Dropping would be
 * silent data loss: the user typed a variable, the form said it saved, and the
 * account never carries it.
 */
export function validateCustomEnv(env: CustomEnv | undefined): CustomEnv {
  const result: CustomEnv = {};
  for (const [rawKey, rawValue] of Object.entries(env ?? {})) {
    const key = String(rawKey).trim();
    if (!key) continue;
    if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
      throw new Error(
        `环境变量名 "${key}" 无效：只能用大写字母、数字和下划线，且不能以数字开头`,
      );
    }
    if (!isValidCustomEnvKey(key)) {
      throw new Error(`"${key}" 上面已有专门的输入框，请填在那里`);
    }
    result[key] = typeof rawValue === "string" ? rawValue.trim() : "";
  }
  return result;
}
