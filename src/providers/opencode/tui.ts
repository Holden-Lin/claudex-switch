import { spawn, spawnSync, type ChildProcess } from "child_process";
import { openCodeSetupEnvironment } from "./profiles";

type SpawnCommand = (
  command: string,
  args: string[],
  options: { stdio: "inherit"; env: NodeJS.ProcessEnv },
) => ChildProcess;

export function hasOpenCodeTui(): boolean {
  const result = spawnSync("opencode", ["--version"], { encoding: "utf-8" });
  return result.status === 0;
}

/** Launch the native TUI only for private /connect or refresh operations. */
export async function runOpenCodeTui(
  profileId: string,
  spawnCommand: SpawnCommand = spawn,
): Promise<number> {
  const proc = spawnCommand("opencode", [], {
    stdio: "inherit",
    env: openCodeSetupEnvironment(profileId),
  });

  return new Promise((resolve) => {
    proc.once("error", () => resolve(127));
    proc.once("close", (code) => resolve(code ?? 1));
  });
}
