import chalk from "chalk";
import type { ProfileType, Provider } from "../types";

export const icons = {
  active: chalk.green("▸"),
  inactive: chalk.dim(" "),
  success: chalk.green("✓"),
  error: chalk.red("✗"),
  arrow: chalk.cyan("→"),
  info: chalk.blue("●"),
} as const;

export function header(text: string): string {
  return chalk.bold(text);
}

export function success(text: string): void {
  console.log(`  ${icons.success} ${text}`);
}

export function error(text: string): void {
  console.error(`  ${icons.error} ${chalk.red(text)}`);
}

export function info(text: string): void {
  console.log(`  ${icons.info} ${text}`);
}

export function hint(text: string): void {
  console.log(chalk.dim(`  ${text}`));
}

export function blank(): void {
  console.log();
}

export function sectionHeader(text: string): void {
  console.log(`  ${chalk.dim("──")} ${chalk.bold(text)} ${chalk.dim("──")}`);
}

export function formatType(type: ProfileType | string): string {
  switch (type) {
    case "oauth":
      return chalk.blue("oauth");
    case "api-key":
      return chalk.yellow("api-key");
    case "chatgpt":
      return chalk.green("chatgpt");
    case "apikey":
      return chalk.yellow("apikey");
    default:
      return chalk.dim(type);
  }
}

export function formatPlan(plan: string | null): string {
  if (!plan) return chalk.dim("unknown");
  const map: Record<string, string> = {
    max: chalk.magenta("Max"),
    pro: chalk.cyan("Pro"),
    free: chalk.dim("Free"),
    plus: chalk.green("Plus"),
    team: chalk.blue("Team"),
    business: chalk.blue("Business"),
    enterprise: chalk.yellow("Enterprise"),
    edu: chalk.cyan("Edu"),
  };
  return map[plan.toLowerCase()] ?? chalk.dim(plan);
}

export function formatProvider(provider: Provider): string {
  return provider === "claude"
    ? chalk.magenta("Claude")
    : chalk.green("Codex");
}

export function formatUsage(usedPercent: number | null): string {
  if (usedPercent === null || usedPercent === undefined)
    return chalk.dim("n/a");
  const remaining = Math.max(0, 100 - usedPercent);
  if (remaining > 50) return chalk.green(`${remaining.toFixed(0)}%`);
  if (remaining > 20) return chalk.yellow(`${remaining.toFixed(0)}%`);
  return chalk.red(`${remaining.toFixed(0)}%`);
}

export function maskKey(key: string): string {
  if (key.length <= 12) return "••••";
  return key.slice(0, 7) + "••••" + key.slice(-4);
}
