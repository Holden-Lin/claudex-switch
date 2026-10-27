# claudex-switch

> **Say goodbye to multi-account chaos and quota anxiety.**  
> A local CLI multi-account manager and real-time quota dashboard built for Claude Code, Codex, and OpenCode Go.

**Languages:** [中文](./README.md) | [English](./README.en.md)

---

## 💡 What Pain Points Does It Solve?

When using Claude Code, Codex, or OpenCode for daily AI coding, developers often juggle multiple accounts (personal, work, backup, and relay APIs). Single-account native CLIs lead to four major pain points:

### 1. Tedious Auth Switching & Multi-Terminal Conflicts
- **The Pain**: Switching accounts requires repeating browser OAuth, modifying config files, or exporting environment variables. Running tasks in multiple terminals causes global credentials to overwrite each other, causing authentication failures or task aborts.
- ⚡ **The Solution**: Unified alias management. `claudex-switch <alias>` instantly switches your default account; `claudex-switch <alias> -run` launches an isolated session with its own credential sandbox—true multi-terminal parallel runs without collision.

### 2. Lost History & Broken Context Resume
- **The Pain**: When switching accounts or hopping between official endpoints and relays, historical sessions often vanish from `/resume`, breaking prior conversation context.
- ⚡ **The Solution**: Intelligent metadata synchronization. Automatically maintains session visibility metadata (e.g. Codex rollout files and SQLite state), ensuring historical sessions stay fully visible and resumable via `/resume` across accounts and providers.

### 3. Quota as a Black Box & Mid-Work Rate Limits
- **The Pain**: Account quotas are scattered across different platforms. You rarely know how much quota remains or when 5-hour / weekly limits reset, and checking relay balances requires visiting web consoles. You end up hitting sudden rate limits right in the middle of a coding flow.
- ⚡ **The Solution**: `claudex-switch list` pulls live quota across all accounts in parallel (5h window percentages, exact local weekly reset times like `Wed16`, and relay key/wallet balances), plus a 30-day token and git commit activity trend.

### 4. Siloed Quotas & Fragmented Configuration
- **The Pain**: You have abundant quota on ChatGPT / Codex / OpenCode Go, but can't use it in Claude Code. Custom Base URLs, model mappings, and environment variables are scattered across disparate JSON/TOML files.
- ⚡ **The Solution**: Built-in `--cliproxy claudecode` lets you bridge Codex/Go quota into Claude Code. Built-in `webconfig` provides a local web UI to view, edit, and paste-import `export` env blocks in one place.

---

## ⚡ Quick Install

### Recommended: One-line Installer Script
```bash
curl -fsSL https://raw.githubusercontent.com/Holden-Lin/claudex-switch/main/install.sh | bash
```

<details>
<summary>Other Installation Methods (Homebrew / Bun)</summary>

**Homebrew:**
```bash
brew install --formula https://raw.githubusercontent.com/Holden-Lin/claudex-switch/main/Formula/claudex-switch.rb
```

**Bun Global:**
```bash
bun install -g git+https://github.com/Holden-Lin/claudex-switch.git
```
</details>

---

## 🚀 3-Step Quick Start

### 1. Add or Import Accounts
Run the interactive command to add OAuth subscriptions or API keys:
```bash
claudex-switch add work      # Add work account
claudex-switch add personal  # Add personal account
```
> 💡 **Migrating from older tools**: If you previously used `claude-switch` or `codex-auth`, simply run `claudex-switch import` to bring over all existing profiles.

### 2. Check All Accounts & Live Quota Dashboard
```bash
claudex-switch list
# Shortcut: claudex-switch ls
```
Instantly displays account status, 5-hour / weekly remaining quota percentages (e.g., `5h 89% · wk 61% Wed16`), and relay balances.

### 3. Launch a Session or Switch Account
- **Option A (Recommended): Isolated Session (does not alter global default, safe for parallel terminals)**
  ```bash
  claudex-switch work -run
  ```
- **Option B: Switch Global Default Account**
  ```bash
  claudex-switch personal
  ```

---

## 🛠️ Common Workflows

### 1. Specify Model & Reasoning Effort on Launch
Supports clean shorthand names, takes effect immediately, and saves as the account's default:
```bash
# Claude: bare numbers map to Opus (5.5 → claude-opus-5-5)
claudex-switch work -run --model 5.5 max

# Codex: supports astra / sol / luna / terra (terra → gpt-6.1-terra)
claudex-switch cx -run --model sol xhigh
```

### 2. Local Visual Web Configuration (Web Config)
Prefer a GUI over editing configs by hand? Launch a local-only private web dashboard:
```bash
claudex-switch webconfig
```
- Batch view and update Base URLs, API keys, default models, and model mappings.
- Directly paste an entire `export ANTHROPIC_*` block to auto-parse and populate fields.

### 3. Run Claude Code Using Codex / Go Quota (Cliproxy)
Have spare quota on Codex / ChatGPT / OpenCode Go and want to use it in Claude Code? No manual proxy setup required:
```bash
# Run Claude Code with Codex (ChatGPT) quota
claudex-switch cx --run --cliproxy claudecode

# Run Claude Code with OpenCode Go quota
claudex-switch go-work --run --cliproxy claudecode
```

### 4. Refresh Expired Logins
When an OAuth session expires locally, refresh it in one command without re-adding the account:
```bash
claudex-switch refresh <alias>
```

---

## 📖 Command Cheat Sheet

| Command | Alias | Description |
|---|---|---|
| `claudex-switch` | - | Open interactive account selection menu |
| `claudex-switch list` | `ls` | List all accounts, active status, 5h/weekly quota, and 30-day trends |
| `claudex-switch <alias> -run` | - | **[Recommended]** Launch isolated session (credential sandbox, no global conflict) |
| `claudex-switch <alias>` | `use` | Switch active global default account |
| `claudex-switch add <alias>` | - | Add a new account (OAuth, API Key, or Relay) |
| `claudex-switch import` | - | One-click import from `claude-switch` / `codex-auth` |
| `claudex-switch refresh <alias>` | - | Re-authenticate and update credentials snapshot |
| `claudex-switch webconfig` | - | Open local web UI for batch configuration |
| `claudex-switch model <alias> <model>` | - | Change default model for an account |
| `claudex-switch rename <old> <new>` | - | Rename an alias |
| `claudex-switch remove <alias>` | `rm` | Remove alias only (preserves underlying credentials) |
| `claudex-switch purge <alias>` | - | Delete account data and all associated aliases |
| `claudex-switch update` | - | Check and update to latest release |

Autoreview defaults to off for Codex and OpenCode sessions. Use `claudex-switch <alias> -run --autoreview on` to enable it for one session.

---

## 📚 Deep Dive & Documentation

For platform-specific isolation boundaries, advanced settings, and automation:
- [Use Cases & Architecture Guide](./docs/use-cases.md)
- [Frequently Asked Questions (FAQ)](./docs/faq.md)
- [CLIProxyAPI Cross-Quota Bridge Details](./docs/local-cliproxyapi.md)
- [JSON Automation Reference](./docs/list-json.md)
- [Explainer Videos: 中文 (60s)](./docs/media/claudex-switch-explainer-zh-60s.mp4) · [English (60s)](./docs/media/claudex-switch-explainer-en-60s.mp4)

---

## 📄 License

Source-Available under the MIT License with the Commons Clause v1.0. Free for personal, internal company, and client/freelance work; commercial resale or charging for products/services whose value derives substantially from this tool is prohibited without a separate license. See [LICENSE](./LICENSE) and [Commercial Licensing](./COMMERCIAL-LICENSING.md).
