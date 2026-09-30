# claudex-switch use cases

claudex-switch is a local CLI account switcher and quota viewer for authorized Claude Code, Codex, and OpenCode Go accounts. These guides explain where account state is stored and what a switch actually changes; the same `-run` flag does not mean the same isolation for every provider.

中文摘要：claudex-switch 在本机为 Claude Code、Codex 和 OpenCode Go 的已授权账号建立别名、查看可用额度并启动 CLI。各 provider 的认证、设置和会话隔离方式不同，请先看对应场景。

## Choose a task

- [Manage several CLI accounts with aliases](./use-cases/multi-account-cli.md) — import or name existing local profiles and choose an account intentionally
- [Run Claude Code with a profile credential](./use-cases/claude-parallel.md) — use `-run` for profile-specific auth, with explicit shared-state limits
- [Switch Codex accounts and keep `/resume` visibility](./use-cases/codex-accounts.md) — understand global auth/config changes and provider metadata syncing
- [Use OpenCode Go accounts with shared history](./use-cases/opencode-go.md) — choose private Go credentials while retaining the normal shared TUI session store
- [Check provider quota and relay balances](./use-cases/quota.md) — distinguish local inventory from live usage requests
- [Configure API keys and compatible relays](./use-cases/api-relays.md) — set provider endpoints and understand the optional relay wallet lookup

## Before acting

`claudex-switch list --json --no-usage` requires claudex-switch v1.14.0 or later; v1.13.2 does not support `--json`. This mode reads local profiles but does not switch accounts, fetch quota, refresh credentials, or sync the active Codex auth snapshot. Its allowlisted output omits email fields, credentials, raw endpoints, and provider error text; alias values are user-chosen and may identify an account. See the [JSON output reference](./list-json.md) before building automation around it.

The ordinary `claudex-switch list` requests provider usage where available. It can refresh OAuth credentials and persist account data. `list --no-usage` skips quota requests, but a human-readable Codex listing may still synchronize an active auth snapshot; use JSON `--no-usage` when you specifically need the no-network, no-write inventory path after installing a version that supports it.

These tools select accounts you are authorized to use. They do not bypass provider authentication, terms, rate limits, or quota. They also do not provide full environment isolation: see the provider-specific guide before parallel use.
