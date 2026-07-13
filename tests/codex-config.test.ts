import { describe, expect, test, beforeEach } from "bun:test";
import { mkdir, readFile, writeFile, rm } from "fs/promises";
import { dirname } from "path";

const { CODEX_CONFIG_FILE } = await import("../src/lib/paths");
const { activateCodexOfficialProvider, repairCodexStringifiedArrays } =
  await import("../src/providers/codex/config");

async function writeConfig(content: string): Promise<void> {
  await mkdir(dirname(CODEX_CONFIG_FILE), { recursive: true });
  await writeFile(CODEX_CONFIG_FILE, content);
}

describe("codex config arrays", () => {
  beforeEach(async () => {
    await rm(CODEX_CONFIG_FILE, { force: true });
  });

  test("rewriting config preserves mcp_servers args arrays", async () => {
    await writeConfig(`model = "gpt-5.4"

[mcp_servers.node_repl]
args = []
command = "/bin/node_repl"

[mcp_servers.computer-use]
args = ["mcp", "--flag"]
command = "/bin/cu"
`);
    await activateCodexOfficialProvider();
    const content = await readFile(CODEX_CONFIG_FILE, "utf-8");
    expect(content).toContain("args = []");
    expect(content).toContain('args = ["mcp", "--flag"]');
    expect(content).not.toContain('args = "');
  });

  test("repairCodexStringifiedArrays fixes stringified args", async () => {
    await writeConfig(`[mcp_servers.node_repl]
args = "[]"
command = "/bin/node_repl"

[mcp_servers.computer-use]
args = "[\\"mcp\\"]"
`);
    expect(await repairCodexStringifiedArrays()).toBe(true);
    const content = await readFile(CODEX_CONFIG_FILE, "utf-8");
    expect(content).toContain("args = []");
    expect(content).toContain('args = ["mcp"]');
  });

  test("repairCodexStringifiedArrays fixes stringified top-level notify", async () => {
    await writeConfig(`model = "gpt-5.4"
notify = "[\\"/path/with spaces/SkyComputerUseClient\\", \\"turn-ended\\"]"
`);
    expect(await repairCodexStringifiedArrays()).toBe(true);
    const content = await readFile(CODEX_CONFIG_FILE, "utf-8");
    expect(content).toContain(
      'notify = ["/path/with spaces/SkyComputerUseClient", "turn-ended"]',
    );
    expect(content).not.toContain('notify = "[');
  });

  test("repairCodexStringifiedArrays leaves valid config untouched", async () => {
    await writeConfig(`[mcp_servers.node_repl]
args = ["mcp"]
note = "[not an args key]"
`);
    expect(await repairCodexStringifiedArrays()).toBe(false);
    const content = await readFile(CODEX_CONFIG_FILE, "utf-8");
    expect(content).toContain('note = "[not an args key]"');
  });

  test("repairCodexStringifiedArrays is a no-op without a config file", async () => {
    expect(await repairCodexStringifiedArrays()).toBe(false);
  });
});
