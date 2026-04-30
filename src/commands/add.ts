import { spawn, spawnSync } from "child_process";
import chalk from "chalk";
import { select, confirm, password, input } from "@inquirer/prompts";
import {
  loadAliases,
  addAlias,
  isValidAlias,
  isReservedAlias,
  aliasExists,
  findAliasByTarget,
} from "../alias/store";
import { createPrivateBrowserScript, cleanupBrowserScript } from "../lib/browser";
import {
  profileExists,
  addOAuthProfile,
  addApiKeyProfile,
} from "../providers/claude/profiles";
import { readCredentials } from "../providers/claude/credentials";
import { CREDENTIALS_FILE } from "../lib/paths";
import { applyCodexApiProvider } from "../providers/codex/config";
import {
  loadRegistry,
  saveRegistry,
  addAccountToRegistry,
  setActiveAccount,
} from "../providers/codex/registry";
import {
  readActiveAuth,
  decodeIdToken,
  snapshotActiveAuth,
} from "../providers/codex/auth";
import { runCodexDeviceAuthLogin } from "../providers/codex/login";
import {
  blank,
  success,
  error,
  info,
  hint,
  formatPlan,
  maskKey,
} from "../lib/ui";
import type { CodexRegistryAccount } from "../types";
import type { CodexApiProviderConfig } from "../types";

interface AuthStatus {
  loggedIn?: boolean;
  subscriptionType?: string;
}

function readClaudeAuthStatus(): AuthStatus | null {
  const result = spawnSync("claude", ["auth", "status"], {
    encoding: "utf-8",
  });
  if (result.status !== 0) return null;
  try {
    return JSON.parse(result.stdout) as AuthStatus;
  } catch {
    return null;
  }
}

export async function add(alias: string): Promise<void> {
  blank();

  if (!isValidAlias(alias)) {
    if (isReservedAlias(alias)) {
      error(`"${alias}" is a reserved command name.`);
    } else {
      error(
        "Invalid alias. Use letters, numbers, hyphens, or underscores.",
      );
    }
    blank();
    process.exit(1);
  }

  const reg = await loadAliases();
  if (aliasExists(reg, alias)) {
    error(`Alias "${alias}" already exists.`);
    blank();
    process.exit(1);
  }

  const accountType = await select({
    message: "What type of account?",
    choices: [
      {
        name: "Claude OAuth — Claude subscription (Pro, Max, Team, etc.)",
        value: "claude-oauth" as const,
      },
      {
        name: "Claude API Key — Anthropic API key",
        value: "claude-apikey" as const,
      },
      {
        name: "Codex ChatGPT — ChatGPT login (Plus, Pro, Team, etc.)",
        value: "codex-chatgpt" as const,
      },
      {
        name: "Codex API Key — OpenAI API key",
        value: "codex-apikey" as const,
      },
    ],
  });

  switch (accountType) {
    case "claude-oauth":
      await addClaudeOAuth(alias);
      break;
    case "claude-apikey":
      await addClaudeApiKey(alias);
      break;
    case "codex-chatgpt":
      await addCodexChatGPT(alias);
      break;
    case "codex-apikey":
      await addCodexApiKey(alias);
      break;
  }
}

async function addClaudeOAuth(alias: string): Promise<void> {
  const creds = await readCredentials(CREDENTIALS_FILE);
  const authStatus = readClaudeAuthStatus();

  if (creds || authStatus?.loggedIn) {
    const sub =
      creds?.claudeAiOauth?.subscriptionType ??
      authStatus?.subscriptionType ??
      null;
    info(
      `Found active Claude session${sub ? ` (${formatPlan(sub)})` : ""}`,
    );

    const importCurrent = await confirm({
      message: "Save this session as the new account?",
      default: true,
    });

    if (importCurrent) {
      if (!creds) {
        blank();
        error(
          "Claude reported a session, but credentials could not be read.",
        );
        hint(
          `Try ${chalk.cyan("claude auth logout")} then ${chalk.cyan("claude auth login")}`,
        );
        blank();
        process.exit(1);
      }

      await addOAuthProfile(alias, CREDENTIALS_FILE);
      await addAlias(alias, { provider: "claude", profileName: alias });
      blank();
      success(`${chalk.bold(alias)} created from current Claude session`);
      blank();
      return;
    }

    if (authStatus?.loggedIn) {
      info("Logging out current Claude session...");
      blank();
      const logout = spawnSync("claude", ["auth", "logout"], {
        stdio: "inherit",
      });
      if (logout.status !== 0) {
        blank();
        error("Failed to log out.");
        blank();
        process.exit(1);
      }
    }
  }

  info("Opening Claude login...");
  blank();

  const browserScript = createPrivateBrowserScript();
  const env = browserScript
    ? { ...process.env, BROWSER: browserScript }
    : undefined;
  const proc = spawn("claude", ["auth", "login"], { stdio: "inherit", env });
  const exitCode = await new Promise<number | null>((resolve) =>
    proc.on("close", resolve),
  );
  cleanupBrowserScript(browserScript);

  const newCreds = await readCredentials(CREDENTIALS_FILE);
  if (exitCode !== 0 || !newCreds) {
    blank();
    error("Login failed or was cancelled.");
    blank();
    process.exit(1);
  }

  await addOAuthProfile(alias, CREDENTIALS_FILE);
  await addAlias(alias, { provider: "claude", profileName: alias });
  blank();
  success(`${chalk.bold(alias)} created`);
  blank();
}

async function addClaudeApiKey(alias: string): Promise<void> {
  const key = await password({
    message: "Paste your Anthropic API key",
    mask: "*",
    validate: (v) => {
      if (!v.trim()) return "API key cannot be empty";
      return true;
    },
  });

  await addApiKeyProfile(alias, key.trim());
  await addAlias(alias, { provider: "claude", profileName: alias });
  blank();
  success(
    `${chalk.bold(alias)} created  ${chalk.dim(maskKey(key.trim()))}`,
  );
  blank();
}

async function addCodexChatGPT(alias: string): Promise<void> {
  // Check if codex CLI is available
  const codexCheck = spawnSync("codex", ["--version"], {
    encoding: "utf-8",
  });
  const hasCodex = codexCheck.status === 0;

  if (!hasCodex) {
    error(
      "Codex CLI not found. Install it with: npm install -g @openai/codex",
    );
    blank();
    process.exit(1);
  }

  info("Running codex login...");
  blank();

  const exitCode = await runCodexDeviceAuthLogin();

  if (exitCode !== 0) {
    blank();
    error("Login failed or was cancelled.");
    blank();
    process.exit(1);
  }

  // Read the active auth file that codex just wrote
  const auth = await readActiveAuth();
  if (!auth || auth.auth_mode !== "chatgpt" || !auth.tokens) {
    blank();
    error("Could not read Codex auth after login.");
    blank();
    process.exit(1);
  }

  // Decode id_token to get user metadata
  const tokenInfo = decodeIdToken(auth.tokens.id_token);
  const email = tokenInfo?.email ?? "unknown";
  const userId = tokenInfo?.chatgpt_user_id ?? auth.tokens.account_id ?? "unknown";
  const accountId = tokenInfo?.chatgpt_account_id ?? auth.tokens.account_id ?? "unknown";
  const planType = tokenInfo?.plan_type ?? null;

  if (!userId || userId === "unknown" || !accountId || accountId === "unknown") {
    blank();
    error("Could not extract account info from Codex auth token.");
    blank();
    process.exit(1);
  }

  const accountKey = `${userId}::${accountId}`;
  const existingAlias = findAliasByTarget(await loadAliases(), {
    provider: "codex",
    accountKey,
  });

  if (existingAlias) {
    blank();
    error(`This Codex account is already imported as "${existingAlias.alias}".`);
    blank();
    process.exit(1);
  }

  // Snapshot the auth file
  await snapshotActiveAuth(accountKey);

  // Update registry
  const reg = await loadRegistry();
  const accountRecord: CodexRegistryAccount = {
    account_key: accountKey,
    chatgpt_account_id: accountId ?? "",
    chatgpt_user_id: userId,
    email,
    alias: alias,
    account_name: null,
    plan: planType,
    auth_mode: "chatgpt",
    created_at: Math.floor(Date.now() / 1000),
    last_used_at: Math.floor(Date.now() / 1000),
    last_usage: null,
    last_usage_at: null,
    last_local_rollout: null,
  };
  addAccountToRegistry(reg, accountRecord);
  setActiveAccount(reg, accountKey);
  await saveRegistry(reg);

  await addAlias(alias, { provider: "codex", accountKey });

  blank();
  success(
    `${chalk.bold(alias)} created  ${chalk.dim(email)}`,
  );
  blank();
}

async function addCodexApiKey(alias: string): Promise<void> {
  const apiProvider = await promptCodexApiProvider();
  const key = await password({
    message: "Paste your OpenAI API key",
    mask: "*",
    validate: (v) => {
      if (!v.trim()) return "API key cannot be empty";
      return true;
    },
  });

  // Use a hash of the key for the account key to avoid leaking key material
  const { createHash } = await import("crypto");
  const keyHash = createHash("sha256").update(key.trim()).digest("hex").slice(0, 16);
  const accountKey = `apikey::${keyHash}`;
  const existingAlias = findAliasByTarget(await loadAliases(), {
    provider: "codex",
    accountKey,
  });

  if (existingAlias) {
    blank();
    error(`This Codex account is already imported as "${existingAlias.alias}".`);
    blank();
    process.exit(1);
  }

  // Create auth file
  const { saveAccountAuth } = await import("../providers/codex/auth");
  await saveAccountAuth(accountKey, {
    auth_mode: "apikey",
    OPENAI_API_KEY: key.trim(),
  });

  // Update registry
  const reg = await loadRegistry();
  const accountRecord: CodexRegistryAccount = {
    account_key: accountKey,
    chatgpt_account_id: "",
    chatgpt_user_id: "",
    email: "",
    alias: alias,
    account_name: null,
    plan: null,
    auth_mode: "apikey",
    api_provider: apiProvider,
    created_at: Math.floor(Date.now() / 1000),
    last_used_at: Math.floor(Date.now() / 1000),
    last_usage: null,
    last_usage_at: null,
    last_local_rollout: null,
  };
  addAccountToRegistry(reg, accountRecord);
  setActiveAccount(reg, accountKey);
  await saveRegistry(reg);
  await applyCodexApiProvider(apiProvider, key.trim());

  await addAlias(alias, { provider: "codex", accountKey });

  blank();
  success(
    `${chalk.bold(alias)} created  ${chalk.dim(maskKey(key.trim()))}`,
  );
  blank();
}

async function promptCodexApiProvider(): Promise<CodexApiProviderConfig> {
  const providerType = await select({
    message: "Codex API provider?",
    choices: [
      {
        name: "OpenAI official",
        value: "official" as const,
      },
      {
        name: "Custom OpenAI-compatible provider",
        value: "custom" as const,
      },
    ],
  });

  if (providerType === "official") {
    return {
      type: "official",
      name: null,
      base_url: null,
      model: null,
      env_key: null,
    };
  }

  const name = await input({
    message: "Provider name",
    default: "admin",
    validate: (value) => {
      const trimmed = value.trim();
      if (!trimmed) return "Provider name cannot be empty";
      if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) {
        return "Use letters, numbers, hyphens, or underscores.";
      }
      return true;
    },
  });
  const baseUrl = await input({
    message: "Base URL",
    default: "https://newapi.hybaliez.com/v1",
    validate: (value) => {
      if (!value.trim()) return "Base URL cannot be empty";
      try {
        new URL(value.trim());
        return true;
      } catch {
        return "Base URL must be a valid URL";
      }
    },
  });
  const model = await input({
    message: "Model",
    default: "gpt-5.3-codex",
    validate: (value) => {
      if (!value.trim()) return "Model cannot be empty";
      return true;
    },
  });
  const envKey = await input({
    message: "Env key",
    default: "OPENAI_API_KEY",
    validate: (value) => {
      const trimmed = value.trim();
      if (!trimmed) return "Env key cannot be empty";
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmed)) {
        return "Env key must be a valid environment variable name";
      }
      return true;
    },
  });

  return {
    type: "custom",
    name: name.trim(),
    base_url: baseUrl.trim(),
    model: model.trim(),
    env_key: envKey.trim(),
  };
}
