import chalk from "chalk";
import { loadAliases, findAlias } from "../alias/store";
import {
  getProfileData,
  updateProfileDefaultModel,
} from "../providers/claude/profiles";
import { readAccountAuth } from "../providers/codex/auth";
import { applyCodexApiProvider } from "../providers/codex/config";
import {
  findAccountByKey,
  loadRegistry,
  saveRegistry,
  updateAccountDefaultModel,
} from "../providers/codex/registry";
import {
  blank,
  error,
  formatProvider,
  formatType,
  hint,
  success,
} from "../lib/ui";
import {
  resolveModelShorthand,
  splitModelEffort,
} from "../lib/model-shorthand";

export async function model(
  aliasOrName: string,
  defaultModel: string,
): Promise<void> {
  blank();

  if (!defaultModel.trim()) {
    error("Default model cannot be empty.");
    blank();
    process.exit(1);
  }

  const aliasReg = await loadAliases();
  const entry = findAlias(aliasReg, aliasOrName);

  if (!entry) {
    error(`Alias "${aliasOrName}" not found.`);
    blank();
    process.exit(1);
  }

  const { model: modelPart, effort } = splitModelEffort(defaultModel);
  if (effort) {
    error("Effort levels aren't stored with the default model.");
    hint(
      `Use ${chalk.cyan(`claudex-switch ${aliasOrName} -run --model "${modelPart} ${effort}"`)} for a one-shot effort override.`,
    );
    blank();
    process.exit(1);
  }

  const normalizedModel = resolveModelShorthand(
    entry.target.provider,
    modelPart,
  );

  if (entry.target.provider === "claude") {
    const profile = await updateProfileDefaultModel(
      entry.target.profileName,
      normalizedModel,
    );
    blank();
    success(
      `Updated ${chalk.bold(entry.alias)}  ${formatProvider("claude")}  ${formatType(profile.type)}  ${chalk.dim(normalizedModel)}`,
    );
    blank();
    return;
  }

  const reg = await loadRegistry();
  const existing = findAccountByKey(reg, entry.target.accountKey);
  if (!existing) {
    error("Codex account not found in registry.");
    blank();
    process.exit(1);
  }

  const account = updateAccountDefaultModel(
    reg,
    entry.target.accountKey,
    normalizedModel,
  );
  await saveRegistry(reg);

  if (reg.active_account_key === entry.target.accountKey) {
    const auth =
      account.auth_mode === "apikey"
        ? await readAccountAuth(entry.target.accountKey)
        : null;
    await applyCodexApiProvider(
      account.auth_mode === "apikey" ? account.api_provider : null,
      auth?.auth_mode === "apikey" ? auth.OPENAI_API_KEY : undefined,
      account.default_model,
    );
  }

  blank();
  success(
    `Updated ${chalk.bold(entry.alias)}  ${formatProvider("codex")}  ${formatType(account.auth_mode ?? "unknown")}  ${chalk.dim(normalizedModel)}`,
  );
  blank();
}
