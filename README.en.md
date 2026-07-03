# claudex-switch

**Languages:** [中文](./README.md) | [English](./README.en.md)

A unified CLI tool for managing both Claude Code and Codex accounts. Supports alias-based switching and quota display — ideal for frequently switching between personal, team, and API key accounts.

## Features

- Manage Claude Code and Codex accounts in one place
- Custom aliases for every account — `claudex-switch <alias>` to switch instantly
- `claudex-switch <alias> -run` switches accounts and starts a session; Claude Code defaults to `--permission-mode auto`
- `claudex-switch <alias> -run --model <model>` overrides the model for this run only without changing the saved default; shorthand is supported — Claude defaults to the opus series (e.g. `4.8` → `claude-opus-4-8`, or explicit `sonnet-4.6` / `haiku-4.5`), Codex maps to gpt (e.g. `5.5` → `gpt-5.5`)
- `claudex-switch <alias> -run --attribution-header false` temporarily sets `CLAUDE_CODE_ATTRIBUTION_HEADER=0` for this Claude run only
- `claudex-switch list` refreshes and shows current quota for all Codex ChatGPT accounts
- Thin alias layer — does not touch native storage (`~/.claude-profiles/`, `~/.codex/accounts/`)
- Checks the latest GitHub Release only on `claudex-switch --version` and auto-updates before showing version info for Bun and Homebrew installs
- Claude: OAuth subscriptions + Anthropic API keys, including custom base URLs and Sonnet / Opus / Haiku model mapping
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

# List all accounts
claudex-switch list

# Switch by alias
claudex-switch holden

# Switch and start a session; Claude Code defaults to auto permission mode
claudex-switch holden -run

# Override the model for this run only (shorthand: Claude → opus series, Codex → gpt series)
claudex-switch holden -run --model 4.8
claudex-switch cx -run --model 5.5

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
| `claudex-switch <alias> -run --model <model>` | Override the model for this `-run` session only without changing the saved default model; shorthand ok (Claude `4.8` / `opus-4.7`, Codex `5.5`) |
| `claudex-switch <alias> -run --attribution-header <true\|false>` | Set or remove `CLAUDE_CODE_ATTRIBUTION_HEADER` for this Claude `-run` session only |
| `claudex-switch add <alias>` | Add a new account |
| `claudex-switch use <alias>` | Switch to an account |
| `claudex-switch use <alias> -run` | Explicit form of `claudex-switch <alias> -run` |
| `claudex-switch list` | List all accounts, auth types, and default models |
| `claudex-switch model <alias> <model>` | Update an existing account default model and sync it immediately when active; shorthand ok (Claude `4.8` / `sonnet-4.6`, Codex `5.5`) |
| `claudex-switch rename <old> <new>` | Rename an alias |
| `claudex-switch refresh <alias>` | Re-login and update the saved credential snapshot for that alias |
| `claudex-switch current` | Show active accounts |
| `claudex-switch remove <alias>` | Remove an alias only |
| `claudex-switch purge <alias>` | Delete an account and its linked aliases |
| `claudex-switch import` | Import from existing data |
| `claudex-switch update` | Upgrade to the latest GitHub Release |
| `claudex-switch --version` | Show version and auto-update first when a newer release exists |
| `claudex-switch help` | Show help |

**Shortcuts:** `ls` = `list`, `rm` = `remove`, `-V` = `--version`

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
- `claudex-switch <claude-api-alias> -run` starts an ephemeral session via `claude --bare` + profile env vars without touching the global `~/.claude*` state
- `claudex-switch <claude-oauth-alias> -run` gives the session its own credential store via `CLAUDE_SECURESTORAGE_CONFIG_DIR` (a per-profile Keychain entry `Claude Code-credentials-<hash>` on macOS, `~/.claude-profiles/<name>/.credentials.json` elsewhere) and never touches the global account state; token refreshes happen directly in that per-profile store
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
