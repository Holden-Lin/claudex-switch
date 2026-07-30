import chalk from "chalk";
import type {
  ProfileType,
  Provider,
  RelayBalance,
  RelayBalanceSide,
  UsageInfo,
} from "../types";

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

export function maskKey(key: string): string {
  if (key.length <= 12) return "••••";
  return key.slice(0, 7) + "••••" + key.slice(-4);
}

// Remaining quota per window, e.g. "5h 89% · wk 61%".
export function formatUsage(
  usage: UsageInfo | null,
  note: string | null,
): string {
  if (usage) {
    const parts: string[] = [];
    if (usage.fiveHourUsedPercent !== null) {
      parts.push(
        `${chalk.dim("5h")} ${colorRemaining(100 - usage.fiveHourUsedPercent)}`,
      );
    }
    if (usage.weeklyUsedPercent !== null) {
      parts.push(
        `${chalk.dim("wk")} ${colorRemaining(100 - usage.weeklyUsedPercent)}`,
      );
    }
    if (parts.length > 0) return parts.join(chalk.dim(" · "));
  }
  return note ? chalk.dim(note) : "";
}

function colorRemaining(percent: number): string {
  const value = Math.round(Math.min(100, Math.max(0, percent)));
  const text = `${value}%`;
  if (value >= 50) return chalk.green(text);
  if (value >= 20) return chalk.yellow(text);
  return chalk.red(text);
}

// Both balance levels a relay reports, labeled:
// "key $47.34 left · acct $12.36 left" (key = sk key quota, acct = wallet).
// A single known level drops the label when the other is absent.
export function formatBalance(balance: RelayBalance | null): string {
  if (!balance) return "";

  const keyPart = formatBalanceSide(balance.key);
  const acctPart = formatBalanceSide(balance.account);

  if (keyPart && acctPart) {
    return [
      `${chalk.dim("key")} ${keyPart}`,
      `${chalk.dim("acct")} ${acctPart}`,
    ].join(chalk.dim(" · "));
  }
  return keyPart || acctPart;
}

export function formatBalanceSide(side: RelayBalanceSide | null): string {
  if (!side) return "";
  const dollars = (v: number) => `$${v.toFixed(2)}`;
  if (side.unlimited) {
    return side.usedUsd === null
      ? chalk.dim("∞")
      : chalk.dim(`${dollars(side.usedUsd)} used`);
  }
  if (side.remainingUsd === null) return "";
  const colored =
    side.remainingUsd >= 10
      ? chalk.green(dollars(side.remainingUsd))
      : side.remainingUsd >= 1
        ? chalk.yellow(dollars(side.remainingUsd))
        : chalk.red(dollars(side.remainingUsd));
  return `${colored} ${chalk.dim("left")}`;
}
