# Check provider quota and relay balances

中文摘要：`list` 展示服务端支持的额度或中转站余额；人类可读的 `--no-usage` 跳过网络请求，但可能同步本地 Codex 快照。计划于 1.14.0 提供的 JSON `--no-usage` 才是无额度网络请求且不写本地账号状态的清单模式。额度仍由服务商决定。

`claudex-switch list` is an account inventory plus optional live usage check. What it can display depends on account type and provider response:

- Claude OAuth: provider-reported five-hour and weekly usage windows; expired credentials may be refreshed and written back
- Codex ChatGPT: provider-reported primary and secondary rate-limit windows; refreshed auth and plan data may be persisted
- OpenCode Go: server-reported rolling five-hour, weekly, and monthly windows
- Claude / Codex API keys: supported relay billing endpoints can show key-level balance; configured one-api / new-api-family consoles can additionally show account-wallet balance. This billing support is separate from inference API compatibility: Claude endpoints must speak Anthropic-compatible API, while custom Codex providers speak OpenAI-compatible API
- Managed local CLIProxyAPI: local process/config status only; no account quota is inferred from a running proxy

For local automation inventory without usage requests, the new JSON mode is planned for 1.14.0; the released v1.13.2 CLI does not support `--json` yet. After installing a version that includes it, use:

```sh
claudex-switch list --json --no-usage
```

This JSON mode reads local account profile data and returns an allowlisted summary. It does not switch accounts, make quota HTTP requests, refresh credentials, or sync the active Codex auth snapshot. It omits credential fields, raw endpoints, and provider error text; aliases remain caller-chosen identifiers. The schema is versioned; don't treat omitted or `null` usage as zero quota. Read the [JSON output reference](../list-json.md). The human-readable `list` command remains the quick interactive view.

Usage windows are provider-specific and may not be available for free tiers, unsupported endpoints, or transient network failures. A relay's reported key quota is distinct from account-wallet balance. No command changes provider quotas or bypasses provider enforcement.
