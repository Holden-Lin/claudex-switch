# claudex-switch

**Languages:** [中文](./README.md) | [English](./README.en.md)

claudex-switch is a local CLI account switcher and quota viewer for authorized Claude Code, Codex, and OpenCode Go accounts. It selects provider-specific local profiles and credentials by alias, then can launch the corresponding CLI; it does not create provider accounts or bypass quota limits.

```bash
# JSON inventory requires claudex-switch v1.14.0 or later; v1.13.2 does not support it
if claudex-switch help 2>&1 | grep -q -- '--json'; then
  claudex-switch list --json --no-usage
else
  printf '%s\n' 'This installed version does not support list --json' >&2
fi
# Replace work with an existing alias; selecting an account updates local provider state
claudex-switch work
# Launch the corresponding CLI; isolation differs by provider
claudex-switch work -run
```

See the [JSON output reference](./docs/list-json.md), [use cases](./docs/use-cases.md), [FAQ](./docs/faq.md), and [local Codex skill guide](./skills/claudex-switch/SKILL.md). The skill file is repository guidance only; committing it does not install or make it discoverable to consumer agents. Users must opt in by installing it into a skill directory supported by their agent.

## Is claudex-switch a fit?

- **Use it when** you manage multiple authorized Claude Code, Codex, or OpenCode Go accounts on one machine and want aliases, provider-reported quota visibility, or account-specific CLI launches
- **Choose another approach when** you need fully separate workspaces, settings, and histories for each identity, centralized team credential management, or a way around provider login, terms, or usage limits
- **Know the differences**: Claude `-run` isolates that session's account credentials, while settings, hooks, and history remain shared; Codex `-run` first changes the global Codex auth/config; OpenCode Go V1 and V2 use different credential and history paths, described below

## Features

- Manage Claude Code, Codex, and OpenCode Go accounts in one place
- Custom aliases for every account — `claudex-switch <alias>` to switch instantly
- `claudex-switch <alias> -run` switches accounts and starts a session; Claude Code defaults to `--permission-mode auto`, Codex defaults to `--approve-for-me` (Auto-review with the workspace-write sandbox), and OpenCode defaults to `--auto`
- `claudex-switch <alias> -run --model <model> [effort]` starts with the selected model and saves it as that account's default for the next run. Bare Claude versions still map to Opus (e.g. `5.5` → `claude-opus-5-5`), with series forms such as `sonnet5` and `fable5.1`, and a bare `fable` means the latest Fable (`claude-fable-5-1`); Codex supports `astra` / `sol` / `luna` for `gpt-6-astra` / `gpt-6.1-sol` / `gpt-6-luna` respectively, `terra` for `gpt-5.6-terra` (GPT-6 has no Terra), and `6` for `gpt-6-astra`; older GPT-5.6 models stay reachable by full id such as `gpt-5.6-sol`. A trailing effort tier applies only to the current run; Codex also supports `ultra` (proactive multi-agent behavior with faster quota consumption)
- Switching Codex accounts automatically syncs the provider metadata of historical sessions (rollout files + `state_5.sqlite`), so old sessions stay visible in `/resume` after switching between the official provider and a relay (same approach as [codex-provider-sync](https://github.com/Dailin521/codex-provider-sync): visibility metadata only, session content untouched)
- `claudex-switch <alias> -run --attribution-header false` temporarily sets `CLAUDE_CODE_ATTRIBUTION_HEADER=0` for this Claude run only
- Codex `-run` defaults to `--approve-for-me` (Auto permission mode); `--autoreview on|off` independently controls the Codex Stop multi-agent review hook without changing the permission mode
- `claudex-switch list` fetches remaining quota for all accounts in parallel, updates the Codex tier from the live rate-limit response, and updates the Claude tier from the freshest matching credentials. Claude OAuth / Codex ChatGPT accounts show the remaining percentage of the 5-hour and weekly windows (`5h 89% · wk 61%`), with expired tokens refreshed automatically and written back; API key accounts behind a one-api / new-api relay show the key-level balance, plus the account wallet balance once a console access token is configured (`key $47.34 left · acct $114.71 left`, see "Relay Account Balance" below). Pass `--no-usage` to skip network requests while still refreshing tiers from local credentials
- Thin alias layer over provider-owned account profiles; switching synchronizes active provider auth/config and may update session-visibility metadata — see the caveats below
- Checks the latest GitHub Release only on `claudex-switch --version` and auto-updates before showing version info for Bun and Homebrew installs
- `claudex-switch webconfig` opens a local web page for viewing and editing every account's base URL, key and model configuration in one place, including pasting a whole `export ANTHROPIC_*` block (see "Web Config" below)
- Claude: OAuth subscriptions + Anthropic API keys, including custom base URLs, Fable / Sonnet / Opus / Haiku model mapping, a subagent model, and arbitrary custom environment variables
- Codex: ChatGPT OAuth + OpenAI API keys
- OpenCode Go: select subscription credentials by alias; V2 add/refresh verifies the key with the server and can explicitly import a login already stored by local OpenCode; V1 shares normal `/resume` history, while V2 keeps a separate SQLite credential store and history for each alias and does not automatically import native or other-alias history; `list` shows server-reported 5-hour / weekly / monthly usage
- macOS Keychain credential support

## Install

### Installer Script (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/Holden-Lin/claudex-switch/main/install.sh | bash
```

By default this installs the latest GitHub Release. If no release exists yet, it falls back to the `main` branch.

After installation, `claudex-switch` checks the latest GitHub Release only when you run `claudex-switch --version`. When a newer release exists, it upgrades itself first and then prints the version.

To trigger an upgrade manually, run:

```bash
claudex-switch update
```

You can also pin a version or ref:

```bash
# Install a specific tag
curl -fsSL https://raw.githubusercontent.com/Holden-Lin/claudex-switch/main/install.sh | VERSION=1.0.0 bash

# Install a specific branch / commit / tag
curl -fsSL https://raw.githubusercontent.com/Holden-Lin/claudex-switch/main/install.sh | INSTALL_REF=main bash
```

### Bun Global Install

```bash
bun install -g git+https://github.com/Holden-Lin/claudex-switch.git
```

### Homebrew

After the first `v*` release, the release workflow will generate and update `Formula/claudex-switch.rb` automatically. Then you can install with:

```bash
brew install --formula https://raw.githubusercontent.com/Holden-Lin/claudex-switch/main/Formula/claudex-switch.rb
```

### Local Development

```bash
git clone git@github.com:Holden-Lin/claudex-switch.git
cd claudex-switch
bun install
bun run test
bun run verify
bun run build
```

## Quick Start

```bash
# Import existing Claude and Codex accounts
claudex-switch import

# List all accounts (with remaining quota; 5h/wk = remaining % of the 5-hour / weekly window)
claudex-switch list
#   ── Claude ──
#   ▸ work    oauth  Max   profile@example.invalid   5h 96% · wk 65%
#     relay   api-key  YOUR_API_KEY  $47.34 left
#   ── Codex ──
#     cx      chatgpt  Plus  profile@example.invalid  gpt-5.4  5h 85% · wk 75%

# Switch by alias
claudex-switch holden

# Switch and start a session; Claude defaults to auto, Codex to Approve for me, and OpenCode to --auto
claudex-switch holden -run

# Select the model and save it as this account's default for the next run
# Claude: bare versions → Opus (5.5 → claude-opus-5-5); series forms include sonnet5 and fable5.1; fable → latest Fable
# Codex: astra → gpt-6-astra; sol → gpt-6.1-sol; luna → gpt-6-luna; terra → gpt-5.6-terra; 6 → gpt-6-astra
claudex-switch holden -run --model 5.5
claudex-switch holden -run --model fable5.1
claudex-switch cx -run --model terra

# An effort tier may follow the model
# Claude: low/medium/high/xhigh/max; Codex: minimal/low/medium/high/xhigh/max/ultra
# Mapped to --effort for Claude, -c model_reasoning_effort=... for Codex; availability still depends on the selected model
claudex-switch holden -run --model 5.5 max
claudex-switch cx -run --model sol xhigh
claudex-switch cx -run --model sol ultra # proactive multi-agent mode, consumes quota faster

# Disable the attribution header for this Claude run only
claudex-switch holden -run --attribution-header false

# Turn the multi-agent completion review off / on for this Codex session only
claudex-switch cx -run --autoreview off
claudex-switch cx -run --autoreview on

# Add a new account
claudex-switch add my-claude
claudex-switch add my-codex
claudex-switch add my-go

# Refresh a saved login
claudex-switch refresh holden
claudex-switch refresh satoshix

# Upgrade to the latest release now
claudex-switch update
```

### Import Existing Accounts

If you already use `claude-switch` or `codex-auth`, import with one command:

```bash
claudex-switch import
```

This scans `~/.claude-profiles/` and `~/.codex/accounts/registry.json` and creates aliases for each account.

### Add Accounts Manually

```bash
claudex-switch add work
```

Then choose an account type:

- **Claude OAuth** — Claude subscription (Pro, Max, Team, etc.)
- **Claude API Key** — Anthropic API key, with optional Base URL, auth token, default model, and Sonnet / Opus / Haiku model mapping
- **Codex ChatGPT** — ChatGPT login (Plus, Pro, Team, etc.), with a saved default model per account
- **Codex API Key** — OpenAI API key, with either the official API or a custom OpenAI-compatible provider, plus a saved default model per account
- **OpenCode Subscription** — OpenCode 2.x browser subscription login; authorize the Go workspace, without an API key
- **OpenCode Go API Key** — existing V1 private-TUI and V2 import/paste-key workflows

After choosing Codex API Key, choose the API source:

- **OpenAI official** — saves only the API key and does not write custom provider config
- **Custom OpenAI-compatible provider** — also writes `model_provider`, `model`, and `[model_providers.<name>]` to `~/.codex/config.toml`, with file permissions set to `0600`

When switching accounts, `claudex-switch` also syncs the saved default model for that account:

- Claude OAuth / API Key accounts write to Claude Code `settings.model`
- Codex ChatGPT / API Key accounts write to `~/.codex/config.toml` `model`
- Existing local Codex accounts get `default_model` backfilled on first load

### Use an OpenCode Go subscription with V1 or V2

On OpenCode 2.x, choose **OpenCode Subscription — browser login**. Sign in to the account to add, select its Go workspace, and authorize; no Go API key is needed. Each alias has its own native OAuth credential and history; OpenCode owns token refresh. Setup verifies active Go access and selects an available Go default model. Refresh must use the same account and workspace; cancellation, a missing subscription, or a different identity does not replace the saved account. `list` reads that workspace’s five-hour, weekly, and monthly quota.

`claudex-switch add go-second` → Subscription → authorize the second account → `claudex-switch go-second -run`. Existing key accounts use **OpenCode Go API Key**.

The V1/V2 details below describe the API-key path. See the [OpenCode guide](docs/use-cases/opencode-go.md) for browser subscriptions.

OpenCode launches with `--auto` by default, which automatically approves permissions not explicitly denied; review the permission rules before using the commands below.

```bash
claudex-switch add go-work
# OpenCode V1 may offer to import the current disk credential or open a private TUI for /connect
# OpenCode V2 can explicitly import a login already stored by local OpenCode, or accept a pasted API key; the key is verified before saving
claudex-switch go-work -run
claudex-switch go-work -run --model opencode-go/kimi-k3
claudex-switch model go-work opencode-go/deepseek-v4-flash
claudex-switch refresh go-work # V1 uses the private TUI; V2 prompts for a replacement key
```

V1 launches inject the selected Go credential through `OPENCODE_AUTH_CONTENT` and retain OpenCode's normal XDG data directory, so Go aliases share `/resume` history. V2 launches use `--standalone`, profile-private XDG roots, and an alias-specific SQLite database; inherited `OPENCODE_DB` is overridden. V2 history stays within each alias and is not automatically imported from normal OpenCode history or another alias. The masked key is stored in claudex-switch's private profile, then synced into that alias's OpenCode credential database through the supported local integration API before the TUI starts; a sync failure prevents launch. A preflight checks the current location's effective Go model, default agent, and model inventory; it refuses incompatible agent models or inventories that expose another provider. It does not rewrite the current agent's permission/system settings. The TUI's `/connect` can change the active credential in that alias's private database for the current session. It does not update the claudex sidecar, and the next claudex launch syncs the sidecar again. Other OpenCode configuration/environment variables may still be inherited under OpenCode's normal behavior. A network-disabled CI fixture launches the pinned v2.0.6 binary and the built claudex-switch CLI against its private server. It checks actual launch config, credential sync/cleanup, alias separation, manual `/connect` reset, refreshed-sidecar use on the next launch, fail-closed policy/model handling, and key-log absence. A PATH shim delegates version and server commands to OpenCode but intercepts only the final `--standalone` TUI invocation. Interactive TUI behavior, the interactive add/refresh prompt flow, session navigation/resume, and live model execution remain unverified.

OpenCode V2 add/refresh verifies the key with OpenCode Go first: 401 (invalid key) and 403 (no Go subscription) are rejected with a retry, while an unreachable server still allows saving after a warning (an invalid key then fails on its first provider request). When the explicit import option is chosen, claudex-switch reads only the `opencode-go` credential from local OpenCode's SQLite database and writes it into that alias's private profile; other providers are never silently exported. The key is not passed in argv or the OpenCode child environment; the temporary sync API binds only to loopback. Use only in trusted workspaces, and remember that `--auto` approves permissions not explicitly denied. `claudex-switch list` uses the saved claudex Go key for server-side 5-hour, weekly, and monthly usage; a manual `/connect` change in the TUI does not change which key `list` uses. `--no-usage` skips the request. Go models must use `opencode-go/<model>` and do not accept Claude/Codex effort tiers. `claudex-switch <alias>` records the selected account; use `<alias> -run` to launch.

Example custom provider config:

```toml
model_provider = "admin"
model = "gpt-5.4"

[model_providers.admin]
name = "admin"
base_url = "https://newapi.hybaliez.com/v1"
env_key = "OPENAI_API_KEY"
requires_openai_auth = false
```

## Commands

| Command | Description |
|---|---|
| `claudex-switch` | Interactive account picker |
| `claudex-switch <alias>` | Switch to alias (shortcut for `use`) |
| `claudex-switch <alias> -run` | Switch and start a Claude Code / Codex session or OpenCode TUI; Claude Code defaults to `--permission-mode auto`, Codex defaults to `--approve-for-me` (Auto), and OpenCode defaults to `--auto` |
| `claudex-switch <alias> -run --model <model>` | Start with the selected model and save it as this account's default for the next run; shorthand: Claude `5.5` / `sonnet5` / `fable` / `fable5.1`, Codex `astra` / `sol` / `terra` / `luna` / `6`; OpenCode Go uses `opencode-go/<model>` |
| `claudex-switch <alias> -run --attribution-header <true\|false>` | Set or remove `CLAUDE_CODE_ATTRIBUTION_HEADER` for this Claude `-run` session only |
| `claudex-switch <codex-alias> -run --autoreview <on\|off>` | Control the completion review hook for this Codex session only; it does not change the permission mode |
| `claudex-switch add <alias>` | Add a new account |
| `claudex-switch use <alias>` | Switch to an account |
| `claudex-switch use <alias> -run` | Explicit form of `claudex-switch <alias> -run` |
| `claudex-switch list` | List all accounts, auth types, default models, and remaining quota (5h / weekly window; one-api relays show balance); `--no-usage` skips quota fetching |
| `claudex-switch model <alias> <model>` | Update an existing account default model and sync it immediately when active; accepts the same shorthands |
| `claudex-switch rename <old> <new>` | Rename an alias |
| `claudex-switch refresh <alias>` | Re-login and update the saved credential snapshot for that alias |
| `claudex-switch webconfig [--port <n>] [--no-open]` | Open the local web UI to view and edit every account's configuration |
| `claudex-switch current` | Show active accounts |
| `claudex-switch remove <alias>` | Remove an alias only |
| `claudex-switch purge <alias>` | Delete an account and its linked aliases |
| `claudex-switch import` | Import from existing data |
| `claudex-switch update` | Upgrade to the latest GitHub Release |
| `claudex-switch --version` | Show version and auto-update first when a newer release exists |
| `claudex-switch help` | Show help |

**Shortcuts:** `ls` = `list`, `rm` = `remove`, `-V` = `--version`

### Web Config

```bash
claudex-switch webconfig
```

Starts a loopback-only server on `127.0.0.1`, opens it in a browser, and prints a link carrying a one-time token (it will not work from another machine, and the token is stripped from the address bar once the page loads). `Ctrl-C` stops it.

The `+` beside each section heading (`CLAUDE` / `CODEX`) creates an account, with the same effect as the CLI's `add` (the new account becomes active immediately). Two credential-based types are supported:

| `+` beside | Types |
|---|---|
| Claude | Claude API key (base URL, auth token, model mappings, custom env, plus paste-an-export-block import) |
| Codex | Codex API key (OpenAI official, or a custom relay: provider name / base URL / model / env key) |

The four interactive-login types — Claude OAuth, Codex ChatGPT login, local CLIProxyAPI, and OpenCode Go — are not in the page yet; use `claudex-switch add <alias>` for those. OpenCode Go credentials are managed by `claudex-switch add` / `refresh` (and `/connect` inside the V1 TUI); the page does not cover them yet.

Each account row carries two actions: a pencil icon that renames the alias in place (Enter saves, Esc cancels), and `删除` / delete, which destroys the account. Expanding a card edits its configuration, and every changed account saves at once:

| Account type | Editable |
|---|---|
| Claude API key | API key, base URL, auth token, main model, Fable / Opus / Sonnet / Haiku mapping, subagent model |
| Claude OAuth | Default model |
| Claude local CLIProxyAPI | Default model (the proxy owns everything else) |
| Codex ChatGPT | Default model |
| Codex API key | Default model, base URL, provider model, env key, API key |

Two extras:

- **Custom environment variables** — a Claude account can carry any `CLAUDE_CODE_*` variable (e.g. `CLAUDE_CODE_EFFORT_LEVEL=max`, `CLAUDE_CODE_AUTO_COMPACT_WINDOW=786432`). They follow the account: cleared when you switch away, injected into isolated `-run` sessions, and env entries you added to `~/.claude/settings.json` by hand are never touched.
- **Paste import** — drop a whole `export ANTHROPIC_BASE_URL=... / export CLAUDE_CODE_EFFORT_LEVEL=...` block in and hit parse; known keys land in their own inputs, everything else in the custom variable table.

Saving an account that is currently active immediately rewrites `~/.claude/settings.json` or `~/.codex/config.toml`; an inactive account only gets its own profile updated and takes effect the next time you switch to it.

**Delete** is the CLI's `purge`: it removes the underlying account **and every alias pointing at it**, including the OAuth credential snapshot or the Codex `.auth.json` — the login is gone and has to be redone. The confirmation lists the cost first (which aliases go, whether a re-login is needed, whether it is the active account) before anything happens.

**Rename** only changes the alias; the account and its login are untouched (the CLI's `rename`).

Two safety boundaries: an account with a live `-run` session refuses deletion and **removes nothing** (the page shows the reason), and deleting the active account clears the global active pointer, leaving bare `claude` / `codex` with no account. The page deliberately offers no "drop the alias but keep the account" action, since that strands data you can no longer reach — use the CLI's `remove` if you want it.

The Codex provider name is read-only: it keys the `[model_providers.<name>]` table in `config.toml`, so renaming it would orphan that config and break session visibility.

### Relay Account Balance (optional)

An sk key on a one-api / new-api relay can only see **its own** quota (an unlimited-quota key only reports its usage), never the account wallet.

When adding an API key account, `claudex-switch add` auto-detects whether the base URL is a one-api / new-api-family relay (via the public `/api/status`) and, if so, prompts for the console's system access token and numeric user ID — validating them live before saving and echoing the balance (press Enter to skip).

You can also configure console credentials per relay origin manually in `~/.claudex-switch/relays.json`:

```json
{
  "https://relay.example.com": {
    "accessToken": "system access token from the console's personal settings page",
    "userId": 42
  }
}
```

- `accessToken`: the **system access token** generated on the relay console's personal settings page (not an `sk-` API key)
- `userId`: your numeric user id (shown on the same page); required when the site expects the `New-Api-User` header
- `quotaPerUnit`: optional override for the site's quota-per-dollar ratio (auto-detected from `/api/status`, usually 500000)

Once configured, both Claude and Codex accounts on that relay show both levels: `key $47.34 left · acct $114.71 left`.

### Refresh Expired Logins

When a local Claude OAuth or Codex ChatGPT login expires, refresh it by alias:

```bash
claudex-switch refresh <alias>
```

- Claude OAuth: switches to the target profile, runs `claude auth login`, then saves the current credentials back into that profile
- Codex ChatGPT: switches to the target auth snapshot, runs `codex login --device-auth`, then writes the new `~/.codex/auth.json` back to that alias
- API key accounts do not need refresh

On macOS, `claudex-switch` opens Codex's device auth page in a private/incognito browser window when possible. If the browser does not open automatically, the CLI still prints the fixed URL so you can open it manually.

## Sample Output

```
  Accounts

  ── Claude ──
    holden   oauth  Pro  profile@example.invalid
  ▸ satoshi  oauth  Pro  profile@example.invalid

  ── Codex ──
  ▸ cx-main    chatgpt  Plus  profile@example.invalid
    cx-team    chatgpt  Team  profile@example.invalid
```

- `▸` marks the currently active account

## How It Works

### Architecture

claudex-switch uses a thin alias layer on top of native storage:

```
~/.claudex-switch/aliases.json    ← unified alias registry
          │
    ┌─────┴─────┐
    ▼           ▼
~/.claude-profiles/    ~/.codex/accounts/
  (Claude native)        (Codex native)
```

Alias creation, renaming, and removal operate on this mapping layer. Switching also writes provider-specific active authentication/configuration as described below; Codex switches can update session-provider visibility metadata. `remove` drops an alias, while `purge` deletes the linked account profile and its aliases.

### Claude Account Switching

- macOS: reads/writes `Claude Code-credentials` via Keychain
- Other platforms: reads/writes `~/.claude/.credentials.json`
- Syncs `oauthAccount` in `~/.claude.json`
- API key mode writes to `~/.claude/settings.json`
- Claude API key accounts always sync `ANTHROPIC_API_KEY`; when configured, switching also writes `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_MODEL`, and `ANTHROPIC_DEFAULT_{SONNET,OPUS,HAIKU}_MODEL`
- Switching to a Claude API key account clears the active Claude OAuth token so Claude Code does not see both a claude.ai token and `ANTHROPIC_API_KEY`; switching back to OAuth restores the token from the profile
- `claudex-switch <claude-api-alias> -run` starts an ephemeral session via `claude --bare` + profile env vars without touching the global `~/.claude*` state, and injects that profile's routing through a private `--settings` file (`~/.claude-profiles/<name>/claude-settings.json`, mode 0600). Claude Code applies `~/.claude/settings.json` env *over* the spawned process env, so env vars alone would let the globally active account hijack the run (a DeepSeek `-run` would answer from gpt models while the global account is the local CLIProxyAPI one); the private file outranks it and blanks every managed key the profile does not own
- `claudex-switch <claude-oauth-alias> -run` gives the session its own credential store via `CLAUDE_SECURESTORAGE_CONFIG_DIR` (a per-profile Keychain entry `Claude Code-credentials-<hash>` on macOS, `~/.claude-profiles/<name>/.credentials.json` elsewhere) and its own account metadata via `CLAUDE_CONFIG_DIR=~/.claude-profiles/<name>/config`; token refreshes happen directly in the profile store, and `/status` and `/usage` point at the same account
- All `-run` sessions (OAuth and API key) are therefore fully isolated from global switching: switching accounts can no longer flip a running `-run` session to the new account, and starting a `-run` session no longer switches other running sessions. Settings, hooks, and history stay shared
- Why this matters: all bare `claude` sessions share one global credential store (macOS Keychain `Claude Code-credentials`) that Claude Code re-reads mid-session (on token refresh and 401 recovery), so a plain `use` switch inevitably affects running bare `claude` sessions — that is inherent to Claude Code's shared storage. To run multiple accounts in parallel, start sessions with `-run`
- When an isolated session ends, refreshed tokens are folded back into the profile snapshot so a later global `use` restores live tokens instead of a rotated-out refresh token
- Remaining edge case: running the same account both as bare `claude` (global) and via `-run` (isolated) for a long time can invalidate one side's refresh token when both refresh (Anthropic rotates refresh tokens on every refresh), forcing that session to log in again

### Codex Account Switching

- Copies the corresponding `<key>.auth.json` to `~/.codex/auth.json`
- Codex API key accounts update `~/.codex/config.toml` based on the saved API source; custom providers store the active bearer token as `experimental_bearer_token` (file mode `0600`) so raw `codex` commands work after switching. Treat the config as sensitive credential material; don't share or commit it
- Updates `active_account_key` in `registry.json`

## Compatibility

- Fully compatible with `claude-switch` and `codex-auth` — all three tools can coexist
- macOS: verified with Claude Code Keychain JSON format + legacy hex encoding
- Claude: Pro, Max, Team, Enterprise subscriptions + API keys
- Codex: Free, Plus, Pro, Team plans + OpenAI API keys / OpenAI-compatible API providers

## Caveats

- Unofficial tool — relies on Claude Code's and Codex's local auth storage formats
- Auto-update only runs on `claudex-switch --version` and only tracks the latest GitHub Release. Changes pushed to `main` are not picked up by installed users until a new release is published
- Codex clients must be restarted after switching for changes to take effect
- `-run --attribution-header false` affects only that Claude launch and does not change your shell config; `true` explicitly removes the env var for that run
- Credential files are set to `0600` permissions, but be aware of the security implications of storing credential copies in `~/.claude-profiles/`

To temporarily disable auto-update for a single run:

```bash
CLAUDEX_DISABLE_AUTO_UPDATE=1 claudex-switch --version
```

Even with auto-update disabled, you can still upgrade manually at any time:

```bash
claudex-switch update
```

## Release

- `bun run verify` must pass before a release is published
- Pushing a `v*` tag triggers GitHub Actions to:
- Build single-file Bun binaries for macOS and Linux
- Upload `tar.gz` assets and `checksums.txt` to GitHub Releases
- Regenerate and commit `Formula/claudex-switch.rb`

## References

- [Holden-Lin/claude-switch](https://github.com/Holden-Lin/claude-switch)
- [Loongphy/codex-auth](https://github.com/Loongphy/codex-auth)

## License

Source-available under the MIT License subject to the Commons Clause License Condition v1.0; this is not OSI open source. Ordinary company/internal work and using the tool in freelance work are permitted subject to the license. Separate written permission is required before offering a product or service to third parties for a fee or other consideration when its value derives entirely or substantially from this tool's functionality, including related hosting, consulting, or support. This is not a blanket restriction on every commercial integration; a genuinely value-added larger product may remain permitted under the exact clause. Request separate written permission through the [project issue tracker](https://github.com/Holden-Lin/claudex-switch/issues); an issue request is not permission. See [LICENSE](./LICENSE) and [commercial licensing notes](./COMMERCIAL-LICENSING.md).
