import chalk from "chalk";
import { spawn, type ChildProcess } from "child_process";
import { use } from "./use";
import { blank, error, info } from "../lib/ui";

const RUN_FLAGS = new Set(["-run", "--run"]);

type SpawnCommand = (
  command: string,
  args: string[],
  options: { stdio: "inherit" },
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

  info(`Running ${chalk.cyan([command, ...args].join(" "))}`);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (code: number): void => {
      if (settled) return;
      settled = true;
      resolve(code);
    };

    const proc = spawnCommand(command, args, { stdio: "inherit" });

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
