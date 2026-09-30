# Switch Codex accounts and preserve `/resume` visibility

中文摘要：Codex 切换会替换全局 auth / config；为保持不同 provider 的旧会话在 `/resume` 中可见，工具只重写受管会话的 provider 可见性元数据，不改消息内容。

Use this when you have multiple Codex ChatGPT logins or API-key profiles and want one local alias per saved account:

```sh
claudex-switch list --no-usage
claudex-switch cx
claudex-switch cx -run
```

`use` copies the selected account auth into `~/.codex/auth.json`, updates the relevant `~/.codex/config.toml` values, and records the active account. For a custom API-key provider, the active bearer credential is written into `config.toml` as `experimental_bearer_token` when available (otherwise the configured `env_key` is used); the config file is set to mode `0600`. Treat `config.toml` as sensitive and don't share it. If you switch between official OpenAI and a managed custom provider, claudex-switch may restamp provider visibility metadata in Codex rollout files and `state_5.sqlite`, so prior sessions remain visible in `/resume`. It does not rewrite their conversation contents.

## Not an isolated Codex session

Unlike Claude's profile-backed `-run`, Codex `-run` calls the regular account switch first, then launches Codex. It changes the global active Codex credentials/config; existing Codex clients should be restarted after switching. Treat the shell environment, project context, tools, and local filesystem as shared unless Codex itself isolates them.

The default launch uses `--approve-for-me` (Codex Auto permission mode with the workspace-write sandbox). `--autoreview on|off` separately toggles the Codex Stop multi-agent completion-review hook for that run; neither flag changes account authorization or makes a run fully isolated.

Codex ChatGPT quota may be fetched from the supported Codex rate-limit boundary when `list` is run with usage enabled. `list --no-usage` skips quota requests but the human-readable path may still synchronize the active auth snapshot; the no-write JSON inventory is planned for 1.14.0 and described in the [JSON reference](../list-json.md).
