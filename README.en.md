# claudex-switch

**Languages:** [中文](./README.md) | [English](./README.en.md)

A unified CLI tool for managing both Claude Code and Codex accounts. Supports alias-based switching and quota display — ideal for frequently switching between personal, team, and API key accounts.

## Features

- Manage Claude Code and Codex accounts in one place
- Custom aliases for every account — `claudex-switch <alias>` to switch instantly
- `claudex-switch list` shows all accounts with current quota
- Thin alias layer — does not touch native storage (`~/.claude-profiles/`, `~/.codex/accounts/`)
- Checks the latest GitHub Release only on `claudex-switch --version` and auto-updates before showing version info
- Claude: OAuth subscriptions + Anthropic API keys
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
- **Claude API Key** — Anthropic API key
- **Codex ChatGPT** — ChatGPT login (Plus, Pro, Team, etc.)
- **Codex API Key** — OpenAI API key

## Commands

| Command | Description |
|---|---|
| `claudex-switch` | Interactive account picker |
| `claudex-switch <alias>` | Switch to alias (shortcut for `use`) |
| `claudex-switch add <alias>` | Add a new account |
| `claudex-switch use <alias>` | Switch to an account |
| `claudex-switch list` | List all accounts with quota info |
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
- Codex ChatGPT: switches to the target auth snapshot, runs `codex login`, then writes the new `~/.codex/auth.json` back to that alias
- API key accounts do not need refresh

## Sample Output

```
  Accounts

  ── Claude ──
    holden   oauth  Pro  holden@example.com
  ▸ satoshi  oauth  Pro  satoshi@example.com

  ── Codex ──
  ▸ cx-main    chatgpt  Plus  alice@gmail.com       5hrem: 55%  wkrem: 88%
    cx-team    chatgpt  Team  bob@company.com       5hrem: 0%   wkrem: 65%
```

- `▸` marks the currently active account
- `5hrem` / `wkrem` show remaining quota percentage for 5-hour and weekly windows

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

### Codex Account Switching

- Copies the corresponding `<key>.auth.json` to `~/.codex/auth.json`
- Updates `active_account_key` in `registry.json`
- Quota data comes from cached `last_usage` in `registry.json`

## Compatibility

- Fully compatible with `claude-switch` and `codex-auth` — all three tools can coexist
- macOS: verified with Claude Code Keychain JSON format + legacy hex encoding
- Claude: Pro, Max, Team, Enterprise subscriptions + API keys
- Codex: Free, Plus, Pro, Team plans + OpenAI API keys

## Caveats

- Unofficial tool — relies on Claude Code's and Codex's local auth storage formats
- Auto-update only runs on `claudex-switch --version` and only tracks the latest GitHub Release. Changes pushed to `main` are not picked up by installed users until a new release is published
- Codex clients must be restarted after switching for changes to take effect
- Credential files are set to `0600` permissions, but be aware of the security implications of storing credential copies in `~/.claude-profiles/`
- Codex quota display uses cached data from `registry.json`; use `codex-auth`'s API mode for real-time refresh

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
