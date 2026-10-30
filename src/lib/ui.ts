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

export function warn(text: string): void {
  console.log(`  ${chalk.yellow("⚠")} ${chalk.yellow(text)}`);
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
    case "local-cliproxyapi":
      return chalk.green("local CLIProxyAPI");
    case "chatgpt":
      return chalk.green("chatgpt");
    case "apikey":
      return chalk.yellow("apikey");
    default:
      return chalk.dim(type);
  }
}

export function formatPlan(plan: string | null): string {
  if (!plan || plan.toLowerCase() === "unknown") return "";
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
  switch (provider) {
    case "claude":
      return chalk.magenta("Claude");
    case "codex":
      return chalk.green("Codex");
    case "opencode":
      return chalk.cyan("OpenCode");
  }
}

export function maskKey(key: string): string {
  if (key.length <= 12) return "••••";
  return key.slice(0, 7) + "••••" + key.slice(-4);
}

// Remaining quota per window, e.g. "5h 89% · wk 61% Wed16".
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
        `${chalk.dim("wk")} ${colorRemaining(100 - usage.weeklyUsedPercent)}${formatWeeklyReset(usage.weeklyResetsAt)}`,
      );
    }
    if (
      usage.monthlyUsedPercent !== null &&
      usage.monthlyUsedPercent !== undefined
    ) {
      parts.push(
        `${chalk.dim("mo")} ${colorRemaining(100 - usage.monthlyUsedPercent)}`,
      );
    }
    for (const group of usage.groups ?? []) {
      const quota = formatUsage(group.usage, null);
      if (quota) parts.push(`${chalk.dim(group.name)} ${quota}`);
    }
    if (usage.credits) {
      const { used, total } = usage.credits;
      const left = Math.max(0, total - used);
      const count = (value: number) => Number(value.toFixed(2)).toString();
      parts.push(`${chalk.dim("credits")} ${colorRemaining(100 * left / total)} ${chalk.dim(`(${count(left)}/${count(total)} left)`)}`);
    }
    if (parts.length > 0) return parts.join(chalk.dim(" · "));
  }
  return note && note !== "quota unavailable" && note !== "usage n/a"
    ? chalk.dim(note)
    : "";
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Weekly reset as local weekday + hour, e.g. " Wed16". Rounded to the nearest
// hour because providers report resets like 15:59:59.
export function formatWeeklyReset(resetsAt: number | null): string {
  if (resetsAt === null || !Number.isFinite(resetsAt)) return "";
  const date = new Date(Math.round(resetsAt / 3_600_000) * 3_600_000);
  const hour = String(date.getHours()).padStart(2, "0");
  return ` ${chalk.dim(`${WEEKDAYS[date.getDay()]}${hour}`)}`;
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
