/** Test-only browser replacement: drive the real native OAuth API, or capture the final TUI launch. */
import { writeFile } from "node:fs/promises";
import {
  fetchOpenCodeApi,
  locationData,
  withOpenCodePrivateServer,
} from "../../src/providers/opencode/runtime";

if (process.argv[2] === "capture") {
  await writeFile(process.env.FAKE_TUI_CAPTURE!, JSON.stringify({
    args: process.argv.slice(3),
    database: process.env.OPENCODE_DB,
    config: JSON.parse(process.env.OPENCODE_CONFIG_CONTENT ?? "{}"),
  }, null, 2));
} else if (process.env.FAKE_LOGIN_MODE === "cancel") {
  process.exitCode = 1;
} else {
  await withOpenCodePrivateServer(process.env, async (baseUrl, password) => {
    // The listener is ready before location-scoped integrations finish initializing.
    let initialized = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      const response = await fetchOpenCodeApi(fetch, baseUrl, "/api/integration/opencode", password);
      if (response.ok) {
        const info = locationData(await response.json()) as { methods?: { id?: string }[] };
        if (info.methods?.some((method) => method.id === "device")) {
          initialized = true;
          break;
        }
      }
      await Bun.sleep(100);
    }
    if (!initialized) throw new Error("Native Console integration did not initialize");

    const response = await fetchOpenCodeApi(fetch, baseUrl,
      "/api/integration/opencode/connect/oauth", password, {
        method: "POST",
        body: JSON.stringify({
          methodID: "device",
          answer: { server: process.env.FAKE_CONSOLE_URL },
        }),
      });
    if (!response.ok) throw new Error(`Native OAuth start failed: ${response.status}`);
    const { attemptID } = locationData(await response.json()) as { attemptID: string };
    for (let attempt = 0; attempt < 150; attempt++) {
      const statusResponse = await fetchOpenCodeApi(fetch, baseUrl,
        `/api/integration/opencode/connect/oauth/${attemptID}`, password);
      const status = locationData(await statusResponse.json()) as { status: string; message?: string };
      if (status.status === "complete") return;
      if (status.status !== "pending") throw new Error(`Native OAuth failed: ${status.message ?? status.status}`);
      await Bun.sleep(100);
    }
    throw new Error("Native OAuth authorization timed out");
  });
}
