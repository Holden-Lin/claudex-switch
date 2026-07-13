import { describe, expect, test, beforeEach } from "bun:test";
import { mkdir, readFile, writeFile, rm } from "fs/promises";
import { dirname } from "path";
import { assertIsolatedHome } from "./helpers";

const { CODEX_CONFIG_FILE } = await import("../src/lib/paths");
const { activateCodexOfficialProvider, repairCodexStringifiedArrays } =
  await import("../src/providers/codex/config");

async function writeConfig(content: string): Promise<void> {
  await mkdir(dirname(CODEX_CONFIG_FILE), { recursive: true });
  await writeFile(CODEX_CONFIG_FILE, content);
}

describe("codex config arrays", () => {
  beforeEach(async () => {
    assertIsolatedHome(CODEX_CONFIG_FILE);
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

  test("repairCodexStringifiedArrays fixes any array-typed key without an allowlist", async () => {
    // No hard-coded key list: any key whose value is a well-formed scalar array
    // is repaired, including deeply nested / less common ones.
    await writeConfig(`[sandbox_workspace_write]
writable_roots = "[\\"/tmp/cache\\"]"

[shell_environment_policy]
exclude = "[\\"AWS_*\\", \\"AZURE_*\\"]"

[computer_use.windows]
always_allowed_app_ids = "[\\"com.apple.Terminal\\"]"
`);
    expect(await repairCodexStringifiedArrays()).toBe(true);
    const content = await readFile(CODEX_CONFIG_FILE, "utf-8");
    expect(content).toContain('writable_roots = ["/tmp/cache"]');
    expect(content).toContain('exclude = ["AWS_*", "AZURE_*"]');
    expect(content).toContain('always_allowed_app_ids = ["com.apple.Terminal"]');
  });

  test("repairCodexStringifiedArrays repairs TOML arrays that aren't strict JSON", async () => {
    // A corrupted value can be a valid TOML array but invalid JSON (trailing
    // comma). It must still be repaired and re-rendered as clean TOML.
    await writeConfig(`[mcp_servers.computer-use]
args = "[\\"mcp\\", \\"--flag\\",]"
`);
    expect(await repairCodexStringifiedArrays()).toBe(true);
    const content = await readFile(CODEX_CONFIG_FILE, "utf-8");
    expect(content).toContain('args = ["mcp", "--flag"]');
    expect(content).not.toContain('args = "');
  });

  test("repairCodexStringifiedArrays leaves real arrays and bracket-looking strings alone", async () => {
    // A genuine array is not double-quoted (won't match); a string whose content
    // is bare words is not a valid scalar array, so it must stay a string.
    await writeConfig(`[mcp_servers.node_repl]
args = ["mcp"]
note = "[not an array]"
prose = "see [1] for details"
`);
    expect(await repairCodexStringifiedArrays()).toBe(false);
    const content = await readFile(CODEX_CONFIG_FILE, "utf-8");
    expect(content).toContain('args = ["mcp"]');
    expect(content).toContain('note = "[not an array]"');
    expect(content).toContain('prose = "see [1] for details"');
  });

  test("repairCodexStringifiedArrays is a no-op without a config file", async () => {
    expect(await repairCodexStringifiedArrays()).toBe(false);
  });
});
