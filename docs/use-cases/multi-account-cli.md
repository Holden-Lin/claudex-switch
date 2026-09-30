# Manage several local CLI accounts with aliases

中文摘要：如果你已在本机配置多个有权使用的账号，可以用别名统一查看和选择；切换仍会更新对应 CLI 的本地有效认证 / 配置。

Use this when you regularly move among your own Claude Code, Codex, or OpenCode Go profiles on one workstation. The tool keeps a shared alias registry that points to provider-specific account records; it does not create a provider identity or make an account transferable between people.

## Start with existing profiles

```sh
claudex-switch import
claudex-switch list --no-usage
claudex-switch work
claudex-switch work -run
```

`import` scans existing Claude profiles under `~/.claude-profiles/` and Codex accounts in `~/.codex/accounts/registry.json`. OpenCode Go accounts are added through `claudex-switch add <alias>` or imported from the current Go credential when offered. `list --no-usage` avoids quota HTTP requests; `list` without that flag can refresh OAuth credentials to report live quota.

## What selecting an account does

The alias is only a name for a stored account target. A normal switch updates provider-specific active state: Claude writes its current credentials and settings, Codex updates the active auth/config, and OpenCode Go records the selected Go profile for `-run`. For the exact files and session behavior, read [Claude parallel launches](./claude-parallel.md), [Codex accounts](./codex-accounts.md), and [OpenCode Go](./opencode-go.md).

`remove <alias>` removes the alias. `purge <alias>` deletes the underlying account profile and all aliases pointing to it; inspect the prompt before confirming. Don't use `purge` as a way to switch or troubleshoot.

## Boundaries

- Use only accounts whose credentials you are authorized to use
- A CLI account switch is not a quota reset or usage-limit workaround
- A provider may share settings, sessions, or live auth between accounts; aliases do not make these fully separate workspaces
- Credentials are stored locally in provider-specific files or macOS Keychain-backed locations; protect the user account and any backups
