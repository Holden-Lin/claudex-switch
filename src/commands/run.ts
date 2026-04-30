import chalk from "chalk";
import { spawn, type ChildProcess } from "child_process";
import { use } from "./use";
import { blank, error, info } from "../lib/ui";
import { readAccountAuth } from "../providers/codex/auth";
import { findAccountByKey, loadRegistry } from "../providers/codex/registry";

const RUN_FLAGS = new Set(["-run", "--run"]);

type SpawnOptions = {
  stdio: "inherit";
  env?: NodeJS.ProcessEnv;
};

type SpawnCommand = (
  command: string,
  args: string[],
  options: SpawnOptions,
) => ChildProcess;

export function isRunFlag(value?: string): boolean {
  return value !== undefined && RUN_FLAGS.has(value);
}

export async function runAliasSession(
  aliasOrName: string,
  forwardedArgs: string[] = [],
  spawnCommand: SpawnCommand = spawn,
): Promise<number> {
  const entry = await use(aliasOrName);
  const command = entry.target.provider === "claude" ? "claude" : "codex";
  const bypassArg =
    entry.target.provider === "claude"
      ? "--dangerously-skip-permissions"
      : "--dangerously-bypass-approvals-and-sandbox";
  const args = [bypassArg, ...forwardedArgs];
  const env = await getRunEnvironment(entry);

  info(`Running ${chalk.cyan([command, ...args].join(" "))}`);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (code: number): void => {
      if (settled) return;
      settled = true;
      resolve(code);
    };

    const proc = spawnCommand(command, args, { stdio: "inherit", env });

    proc.on("error", (err) => {
      error(
        `Failed to start ${command}: ${err instanceof Error ? err.message : String(err)}`,
      );
      blank();
      finish(1);
    });

    proc.on("close", (code) => {
      finish(code ?? 1);
    });
  });
}

async function getRunEnvironment(
  entry: Awaited<ReturnType<typeof use>>,
): Promise<NodeJS.ProcessEnv | undefined> {
  if (entry.target.provider !== "codex") return undefined;

  const auth = await readAccountAuth(entry.target.accountKey);
  if (auth?.auth_mode !== "apikey" || !auth.OPENAI_API_KEY) {
    return undefined;
  }

  const reg = await loadRegistry();
  const account = findAccountByKey(reg, entry.target.accountKey);
  const envKey = account?.api_provider?.env_key || "OPENAI_API_KEY";

  return {
    ...process.env,
    [envKey]: auth.OPENAI_API_KEY,
  };
}
