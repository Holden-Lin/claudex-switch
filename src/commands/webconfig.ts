import chalk from "chalk";
import { openExternalUrl } from "../lib/browser";
import { blank, error, hint, info, success } from "../lib/ui";
import { startWebConfigServer } from "../webconfig/server";

export interface WebConfigOptions {
  port?: number;
  open?: boolean;
}

export function parseWebConfigArgs(args: string[]): WebConfigOptions {
  const options: WebConfigOptions = { open: true };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--no-open") {
      options.open = false;
      continue;
    }

    if (arg === "--port" || arg === "-p") {
      const value = Number(args[index + 1]);
      if (!Number.isInteger(value) || value < 0 || value > 65535) {
        throw new Error("--port needs a number between 0 and 65535.");
      }
      options.port = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

export async function webconfig(args: string[] = []): Promise<void> {
  blank();

  let options: WebConfigOptions;
  try {
    options = parseWebConfigArgs(args);
  } catch (err) {
    error(err instanceof Error ? err.message : String(err));
    hint(
      `Usage: ${chalk.cyan("claudex-switch webconfig [--port <n>] [--no-open]")}`,
    );
    blank();
    process.exit(1);
  }

  let server;
  try {
    server = await startWebConfigServer({ port: options.port });
  } catch (err) {
    error(
      `Could not start the config server: ${err instanceof Error ? err.message : String(err)}`,
    );
    blank();
    process.exit(1);
  }

  success(`Config UI running at ${chalk.cyan(server.url)}`);
  hint("The link carries a one-time token and only works from this machine.");
  hint(`Press ${chalk.cyan("Ctrl-C")} to stop.`);
  blank();

  if (options.open !== false && !openExternalUrl(server.url)) {
    info("Could not open a browser automatically — open the link above.");
  }

  await new Promise<void>((resolve) => {
    const stop = (): void => {
      void server.close().then(() => {
        blank();
        resolve();
      });
    };
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
  });
}
