# claudex-switch

**Languages:** [中文](./README.md) | [English](./README.en.md)

A unified CLI tool for managing both Claude Code and Codex accounts. Supports alias-based switching and quota display — ideal for frequently switching between personal, team, and API key accounts.

## Features

- Manage Claude Code and Codex accounts in one place
- Custom aliases for every account — `claudex-switch <alias>` to switch instantly
- `claudex-switch <alias> -run` switches accounts and starts a session; Claude Code defaults to `--permission-mode auto`
- `claudex-switch <alias> -run --model <model> [effort]` starts with the selected model and saves it as that account's default for the next run. Bare Claude versions still map to Opus, with series forms such as `sonnet5` and `fable5.1`; Codex supports `sol` / `terra` / `luna` for the three GPT-5.6 models and `6` for `gpt-6-astra`. A trailing effort tier applies only to the current run; Codex also supports `ultra` (proactive multi-agent behavior with faster quota consumption)
- Switching Codex accounts automatically syncs the provider metadata of historical sessions (rollout files + `state_5.sqlite`), so old sessions stay visible in `/resume` after switching between the official provider and a relay (same approach as [codex-provider-sync](https://github.com/Dailin521/codex-provider-sync): visibility metadata only, session content untouched)
- `claudex-switch <alias> -run --attribution-header false` temporarily sets `CLAUDE_CODE_ATTRIBUTION_HEADER=0` for this Claude run only
- `claudex-switch list` fetches remaining quota for all accounts in parallel, updates the Codex tier from the live rate-limit response, and updates the Claude tier from the freshest matching credentials. Claude OAuth / Codex ChatGPT accounts show the remaining percentage of the 5-hour and weekly windows (`5h 89% · wk 61%`), with expired tokens refreshed automatically and written back; API key accounts behind a one-api / new-api relay show the key-level balance, plus the account wallet balance once a console access token is configured (`key $47.34 left · acct $114.71 left`, see "Relay Account Balance" below). Pass `--no-usage` to skip network requests while still refreshing tiers from local credentials
- Thin alias layer — does not touch native storage (`~/.claude-profiles/`, `~/.codex/accounts/`)
- Checks the latest GitHub Release only on `claudex-switch --version` and auto-updates before showing version info for Bun and Homebrew installs
- `claudex-switch webconfig` opens a local web page for viewing and editing every account's base URL, key and model configuration in one place, including pasting a whole `export ANTHROPIC_*` block (see "Web Config" below)
- Claude: OAuth subscriptions + Anthropic API keys, including custom base URLs, Fable / Sonnet / Opus / Haiku model mapping, a subagent model, and arbitrary custom environment variables
- Codex: ChatGPT OAuth + OpenAI API keys
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
VERSION=1.0.0 curl -fsSL https://raw.githubusercontent.com/Holden-Lin/claudex-switch/main/install.sh | bash

# Install a specific branch / commit / tag
INSTALL_REF=main curl -fsSL https://raw.githubusercontent.com/Holden-Lin/claudex-switch/main/install.sh | bash
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
#   ▸ work    oauth  Max   work@example.com   5h 96% · wk 65%
#     relay   api-key  sk-xPXb••••eTmP  $47.34 left
#   ── Codex ──
#     cx      chatgpt  Plus  cx@example.com  gpt-5.4  5h 85% · wk 75%

# Switch by alias
claudex-switch holden

# Switch and start a session; Claude Code defaults to auto permission mode
claudex-switch holden -run

# Select the model and save it as this account's default for the next run
# Claude: bare versions → Opus; series forms include sonnet5 and fable5.1
# Codex: sol / terra / luna → the three GPT-5.6 models; 6 → gpt-6-astra
claudex-switch holden -run --model 5
claudex-switch holden -run --model fable5.1
claudex-switch cx -run --model terra

# An effort tier may follow the model
# Claude: low/medium/high/xhigh/max; Codex: minimal/low/medium/high/xhigh/max/ultra
# Mapped to --effort for Claude, -c model_reasoning_effort=... for Codex; availability still depends on the selected model
claudex-switch holden -run --model 5 max
claudex-switch cx -run --model 5.6 xhigh
claudex-switch cx -run --model 5.6 ultra # proactive multi-agent mode, consumes quota faster

# Disable the attribution header for this Claude run only
claudex-switch holden -run --attribution-header false

# Add a new account
claudex-switch add my-claude
claudex-switch add my-codex

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

After choosing Codex API Key, choose the API source:

- **OpenAI official** — saves only the API key and does not write custom provider config
- **Custom OpenAI-compatible provider** — also writes `model_provider`, `model`, and `[model_providers.<name>]` to `~/.codex/config.toml`, with file permissions set to `0600`

When switching accounts, `claudex-switch` also syncs the saved default model for that account:

- Claude OAuth / API Key accounts write to Claude Code `settings.model`
- Codex ChatGPT / API Key accounts write to `~/.codex/config.toml` `model`
- Existing local Codex accounts get `default_model` backfilled on first load

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
| `claudex-switch <alias> -run` | Switch and start a Claude Code / Codex session; Claude Code defaults to `--permission-mode auto` |
| `claudex-switch <alias> -run --model <model>` | Start with the selected model and save it as this account's default for the next run; shorthand: Claude `5` / `sonnet5` / `fable5.1`, Codex `sol` / `terra` / `luna` / `6` |
| `claudex-switch <alias> -run --attribution-header <true\|false>` | Set or remove `CLAUDE_CODE_ATTRIBUTION_HEADER` for this Claude `-run` session only |
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
    holden   oauth  Pro  holden@example.com
  ▸ satoshi  oauth  Pro  satoshi@example.com

  ── Codex ──
  ▸ cx-main    chatgpt  Plus  alice@gmail.com
    cx-team    chatgpt  Team  bob@company.com
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

Day-to-day switching and alias management only operate on this mapping layer. Underlying account data is only deleted when you explicitly run `claudex-switch purge <alias>`.

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
- Codex API key accounts update `~/.codex/config.toml` based on the saved API source; custom providers write the active account bearer token so raw `codex` commands work after switching
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

MIT
