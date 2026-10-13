# Switch Codex accounts and preserve `/resume` visibility

中文摘要：`claudex-switch <alias>` 会替换全局 auth / config；`<alias> -run` 不切换默认账号，非默认账号在私有 `CODEX_HOME` 里只隔离登录；为保持不同 provider 的旧会话在 `/resume` 中可见，工具只重写受管会话的 provider 可见性元数据，不改消息内容。

Use this when you have multiple Codex ChatGPT logins or API-key profiles and want one local alias per saved account:

```sh
claudex-switch list --no-usage
claudex-switch cx
claudex-switch cx -run
```

`use` copies the selected account auth into `~/.codex/auth.json`, updates the relevant `~/.codex/config.toml` values, and records the active account. For a custom API-key provider, the active bearer credential is written into `config.toml` as `experimental_bearer_token` when available (otherwise the configured `env_key` is used); the config file is set to mode `0600`. Treat `config.toml` as sensitive and don't share it. If you switch between official OpenAI and a managed custom provider, claudex-switch may restamp provider visibility metadata in Codex rollout files and `state_5.sqlite`, so prior sessions remain visible in `/resume`. It does not rewrite their conversation contents.

## `-run` keeps the default account

`claudex-switch cx` is the only command that changes the default Codex account. `cx -run` launches Codex without touching `~/.codex/auth.json`, `config.toml`, or the active account:

- If `cx` is already the default, Codex runs on `~/.codex` directly.
- Otherwise Codex runs with `CODEX_HOME=~/.claudex-switch/codex-run/<account>`. Only `auth.json` is private (mode `0600`). `config.toml` is linked to the shared one; a private copy is written only when the account's provider routing differs, for example a relay API key. Every other entry (sessions, `state_5.sqlite`, skills, hooks, `AGENTS.md`) links back to `~/.codex`. The account's default model is passed with `--model`. Tokens Codex refreshes during the run are saved back to the account snapshot when it exits.

Session provider metadata is not restamped for a `-run`, so sessions from an official account and from a relay account show up in each other's `/resume` only after a global switch syncs them. Edits Codex makes to a private `config.toml` stay in that copy. Treat the shell environment, project context, tools, and local filesystem as shared.

The default launch uses `--approve-for-me` (Codex Auto permission mode with the workspace-write sandbox). `--autoreview on|off` separately toggles the Codex Stop multi-agent completion-review hook for that run; neither flag changes account authorization or makes a run fully isolated.

Codex ChatGPT quota may be fetched from the supported Codex rate-limit boundary when `list` is run with usage enabled. `list --no-usage` skips quota requests but the human-readable path may still synchronize the active auth snapshot; the no-write JSON inventory requires claudex-switch v1.14.0 or later; v1.13.2 does not support `--json`. See the [JSON reference](../list-json.md).
