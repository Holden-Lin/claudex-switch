# Use OpenCode Go accounts with shared history

中文摘要：每个 Go 别名单独保存凭据；正常 `-run` 仅为本次启动注入 Go 凭据，仍使用 OpenCode 常规数据目录，所以各账号可继续共享 `/resume` 历史。

Use this when you subscribe to OpenCode Go and want per-account credential selection while staying in OpenCode's normal TUI and session history:

```sh
claudex-switch add go-work
claudex-switch go-work -run
claudex-switch go-work -run --model opencode-go/kimi-k3
claudex-switch refresh go-work
```

Each alias stores a private Go credential. A normal `-run` injects that credential through `OPENCODE_AUTH_CONTENT`, while leaving OpenCode's standard XDG data directory in place. Therefore Go aliases share the same session history and can see the same conversations in `/resume`. This is deliberate credential selection, not per-account history isolation.

Initial login and `refresh` run the TUI with a private XDG data root so `/connect` won't write the Go credential into the normal global auth file. Regular launches use shared session storage. `claudex-switch <alias>` records a selected alias but does not launch OpenCode; use `-run` to launch the TUI.

`claudex-switch list` can query OpenCode Go's server-reported rolling five-hour, weekly, and monthly usage windows. It sends the selected profile's Go key to the OpenCode usage endpoint. Use `list --no-usage` to skip that network request. Displayed values report service usage, not extra quota or a mechanism to change plan limits.

OpenCode Go model overrides use the full `opencode-go/<model>` form. Claude / Codex effort flags are not supported for this provider.
