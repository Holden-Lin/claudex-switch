import { spawn, spawnSync, type ChildProcess } from "child_process";
import { openCodeRunEnvironment } from "./profiles";

type SpawnCommand = (
  command: string,
  args: string[],
  options: { stdio: "inherit"; env: NodeJS.ProcessEnv },
) => ChildProcess;

export function hasOpenCodeTui(): boolean {
  const result = spawnSync("opencode", ["--version"], { encoding: "utf-8" });
  return result.status === 0;
}

/** Launch OpenCode's native no-argument TUI with one private Go profile. */
export async function runOpenCodeTui(
  profileId: string,
  spawnCommand: SpawnCommand = spawn,
): Promise<number> {
  const proc = spawnCommand("opencode", [], {
    stdio: "inherit",
    env: openCodeRunEnvironment(profileId),
  });

  return new Promise((resolve) => {
    proc.once("error", () => resolve(127));
    proc.once("close", (code) => resolve(code ?? 1));
  });
}
