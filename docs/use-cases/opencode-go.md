# Use OpenCode Go accounts with V1 and V2

中文摘要：OpenCode V1 使用隔离的 `auth.json` 登录流程，并保留常规 `/resume` 历史；V2 用遮蔽输入保存 key，通过 OpenCode 支持的本地集成 API 同步到每个别名独立的 SQLite 数据库。V2 历史按别名隔离，不会自动导入其他别名或原生 OpenCode 历史。

Use this when you manage OpenCode Go subscription keys with claudex-switch aliases. OpenCode V1 and V2 have different credential storage and launch behavior.

Both versions launch OpenCode with `--auto` by default. OpenCode auto-approves permissions that are not explicitly denied; review your permission rules before using it.

```sh
claudex-switch add go-work
claudex-switch go-work -run
claudex-switch go-work -run --model opencode-go/kimi-k3
claudex-switch model go-work opencode-go/deepseek-v4-flash
claudex-switch refresh go-work
```

## OpenCode V1

V1 can import a Go credential from the legacy disk `auth.json` after confirmation or open a private TUI for `/connect`. Each alias keeps its Go credential in a claudex-switch profile. A normal launch injects the selected credential through `OPENCODE_AUTH_CONTENT` and leaves OpenCode's normal XDG data directory in place, so V1 aliases share `/resume` history.

The normal launch does not rewrite the global `auth.json`. Saving auth with `/connect` in a shared TUI may rewrite that file, however, so use the private `add` or `refresh` login flow to change a Go credential.

## OpenCode V2

V2 add and refresh prompt for the Go API key with masked input. They do not export credentials from OpenCode's SQLite database and do not contact OpenCode Go to validate the key. The key is saved in the alias's private claudex-switch profile; entering an invalid key may not fail until the first provider request. Refresh rejects an unchanged key rather than reporting a successful replacement.

For a managed run, claudex-switch starts OpenCode with `--standalone` and assigns the alias its own XDG data/state/cache roots and SQLite database. It overrides inherited `OPENCODE_DB` so the alias cannot reuse another profile's database or OpenCode's normal global database. OpenCode's legacy `auth.json` migration therefore runs only against this alias-private data root; existing global/native sessions are not imported. The key is stored atomically in claudex-switch's private profile, then synced through OpenCode's supported local integration API into the alias-private SQLite credential store before each TUI launch. The short-lived sync server binds to `127.0.0.1`; the Go key is sent in its local request body, never argv or child environment. Refresh changes the claudex sidecar; the next run syncs it into OpenCode's private database.

V2 refuses to start unless a Go model is selected by the alias default, `OPENCODE_CONFIG_CONTENT.model`, or `-run --model opencode-go/<model>`. It checks the effective default agent and model inventory in the launch working directory before storing the key; a non-Go default-agent model, an unavailable Go model, or another provider in the effective model inventory stops the launch. The current agent and its permission/system settings are left intact. To keep that preflight aligned with the TUI, V2 aliases reject a positional directory, `--continue`/`-c`, `--session`/`-s`, and unknown forwarded arguments. Start claudex-switch from the intended project directory and begin a fresh session; `--prompt` is still supported.

The alias-private database can contain sessions from more than one project. OpenCode's in-app `/sessions` navigation can select a session from another project in that database, and that destination is not re-preflighted by claudex-switch. Treat V2 as per-alias database isolation, not a continuous same-project/session guarantee. History is not automatically shared with other aliases or imported from OpenCode's normal/native history. If you use `/connect` during a TUI session, that can change the active credential in this alias's private OpenCode database for the rest of that session. It does not change the claudex sidecar, and the next claudex launch syncs the sidecar key again. `list` quota reflects the saved claudex key, not a credential manually connected in the current TUI.

The Go key is persisted in OpenCode's alias-private SQLite credential store and is not passed to terminal tools as an environment variable. Other OpenCode settings and environment variables may still be inherited according to OpenCode's normal behavior. Use V2 aliases only in trusted workspaces, especially with `--auto` enabled. Use `add` or `refresh` to change the claudex Go key. `/connect` changes only OpenCode's current alias-private credential; the next claudex launch restores the claudex sidecar as the active key.

The repository includes a network-disabled CI fixture against the digest-pinned OpenCode v2.0.6 binary. It checks upstream private-store API primitives and also runs the built claudex-switch CLI against real private OpenCode servers. A PATH shim delegates `--version` and local `serve` commands to the official binary, then intercepts the final `--standalone` TUI invocation to capture nonsecret launch metadata and exit deterministically. It verifies product config generation, readiness checks, credential sync and owned-record cleanup, alias A/B database separation, preservation of the normal auth/database sentinels, manual `/connect` reset to the saved sidecar, refreshed-sidecar use on the next launch, fail-closed policy/model cases, shutdown, and absence of fake keys in logs. The interactive add/refresh prompt commands are covered by unit tests; interactive TUI behavior, session navigation/resume, and live model requests remain unverified.

## Usage and models

`claudex-switch list` can query OpenCode Go's server-reported rolling five-hour, weekly, and monthly usage windows. It sends the selected profile's Go key to the OpenCode usage endpoint. Use `list --no-usage` to skip that request. The displayed values report service usage, not extra quota or a mechanism to change plan limits.

Go model overrides use the full `opencode-go/<model>` form. claudex-switch maps this to OpenCode V2's managed provider; if no Go model can be resolved, the launch fails closed rather than inheriting a non-Go OpenCode default. OpenCode V2's root TUI does not accept `--model`, so `claudex-switch <alias> -run --model opencode-go/<model>` applies the model through its V2 config. Claude / Codex effort flags are not supported for OpenCode Go.

`claudex-switch <alias>` records a selected alias but does not launch OpenCode. Use `<alias> -run` to open the TUI.
