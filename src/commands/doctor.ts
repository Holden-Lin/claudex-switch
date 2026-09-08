import chalk from "chalk";
import { findAlias, loadAliases } from "../alias/store";
import { blank, error, hint, info, success } from "../lib/ui";
import {
  getProfileData,
  profileExists,
} from "../providers/claude/profiles";
import {
  ensureManagedCLIProxyAPI,
  inspectManagedCLIProxyAPI,
  restartManagedCLIProxyAPI,
  verifyManagedCLIProxyAPILive,
} from "../providers/cliproxyapi/managed";

export interface DoctorOptions {
  live?: boolean;
  restart?: boolean;
}

// Diagnostics deliberately have two levels. The default does not make a model
// request; `--live` explicitly sends the smallest possible message so a user
// can distinguish a reachable local daemon from actual account/model access.
export async function doctor(
  aliasOrName: string,
  options: DoctorOptions = {},
): Promise<void> {
  blank();

  const aliases = await loadAliases();
  const entry = findAlias(aliases, aliasOrName);
  if (!entry) {
    fail(`Alias "${aliasOrName}" not found.`);
    return;
  }
  if (entry.target.provider !== "claude") {
    fail("Doctor is currently available for local CLIProxyAPI Claude accounts only.");
    return;
  }
  if (!(await profileExists(entry.target.profileName))) {
    fail(`Claude profile "${entry.target.profileName}" no longer exists.`);
    return;
  }

  const profile = await getProfileData(entry.target.profileName);
  if (profile.type !== "local-cliproxyapi") {
    fail("Doctor is currently available for local CLIProxyAPI Claude accounts only.");
    return;
  }

  const managedProfile = {
    profileId: profile.profileId,
    binaryPath: profile.binaryPath,
  };
  let status = await inspectManagedCLIProxyAPI(managedProfile, {
    probe: true,
  });

  info(
    `CLIProxyAPI binary: ${status.installed ? "available" : "not found"}`,
  );
  info(`ChatGPT login: ${status.loggedIn ? "available" : "required"}`);
  info(
    `Managed daemon: ${status.running ? `running on 127.0.0.1:${status.port}` : "stopped"}`,
  );
  info(
    `Managed environment: ${status.environmentValid ? "valid" : "invalid or missing"}`,
  );
  info(`Managed configuration: ${status.configured ? "valid" : "missing or needs rebuild"}`);
  if (status.running) {
    info(`Local authenticated probe: ${status.healthy ? "passed" : "failed"}`);
  }

  if (!status.installed) {
    fail("CLIProxyAPI binary is unavailable. Reinstall it or add the account again with a valid executable.");
    return;
  }
  if (!status.loggedIn) {
    fail(`No valid local ChatGPT login is available. Run ${chalk.cyan(`claudex-switch refresh ${entry.alias}`)} to sign in again.`);
    return;
  }
  if (!status.environmentValid) {
    fail("Managed CLIProxyAPI private environment is invalid or missing. Add the account again; a restart cannot safely recreate its client key.");
    return;
  }
  if (!status.configured && !options.restart) {
    fail("Managed CLIProxyAPI runtime configuration is missing or invalid. Run `claudex-switch doctor <alias> --restart` to rebuild it from the private environment.");
    return;
  }
  if (status.running && !status.healthy && !options.restart) {
    fail("The managed daemon is running but did not pass its authenticated loopback probe. Use `claudex-switch doctor <alias> --restart` after ending active sessions.");
    return;
  }

  let runtime;
  try {
    if (options.restart) {
      info("Restarting this account's managed loopback proxy...");
      runtime = await restartManagedCLIProxyAPI(managedProfile);
      status = await inspectManagedCLIProxyAPI(managedProfile, { probe: true });
    } else if (options.live) {
      // Starting/reusing and probing /v1/models is a local availability check,
      // not a quota test. The following explicit live request is opt-in.
      runtime = await ensureManagedCLIProxyAPI(managedProfile);
      status = await inspectManagedCLIProxyAPI(managedProfile, { probe: true });
    }
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
    return;
  }

  if (!status.configured) {
    fail("The managed runtime configuration could not be rebuilt.");
    return;
  }
  if (status.running && !status.healthy) {
    fail("The managed daemon did not pass its authenticated loopback probe after startup.");
    return;
  }

  if (options.live) {
    const liveRuntime = runtime ?? await ensureManagedCLIProxyAPI(managedProfile);
    if (!(await verifyManagedCLIProxyAPILive(liveRuntime))) {
      fail("Luna (gpt-5.6-luna) live verification failed. The local proxy is reachable, but this ChatGPT account or that specific model could not complete the test request.");
      return;
    }
    success(`${chalk.bold(entry.alias)} Luna (gpt-5.6-luna) live verification passed`);
    blank();
    return;
  }

  if (options.restart && status.running) {
    success(`${chalk.bold(entry.alias)} managed proxy restarted`);
  } else {
    success(`${chalk.bold(entry.alias)} basic local CLIProxyAPI checks passed`);
    hint(`Use ${chalk.cyan(`claudex-switch doctor ${entry.alias} --live`)} for a small, quota-consuming model request.`);
  }
  blank();
}

function fail(message: string): void {
  error(message);
  blank();
  process.exit(1);
}
