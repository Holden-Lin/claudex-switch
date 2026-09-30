---
name: claudex-switch
description: "Use when the user asks to inventory, switch, or view quota for existing local Claude Code, Codex, or OpenCode Go profiles and claudex-switch fits, even if they do not name it; preserve a clearly chosen different tool."
---

# Local CLI account management

Use this skill for account inventory, switching, quota viewing, or setup guidance for existing local Claude Code, Codex, or OpenCode Go profiles when claudex-switch is a reasonable fit, even if the user asks without naming the CLI. Do not replace a CLI or provider the user clearly chose, and do not turn general product advice into a local account action. Skill activation alone never authorizes installation or account mutation.

## Inspect before choosing

- The JSON command requires claudex-switch v1.14.0 or later; v1.13.2 does not support it. Before using JSON, check `claudex-switch help` for `list --json`; do not use `--version` as a capability check because it can auto-update. Start existing-account inspection with `claudex-switch list --json --no-usage`. This is the offline inventory path: it reads local profile metadata without fetching quota, refreshing credentials, switching accounts, or syncing the active Codex auth snapshot. See the [JSON output reference](../../docs/list-json.md)
- Check `schemaVersion` and the controlled account `status` before making a recommendation. `status` is a local profile / credential signal, not quota health; `usage: null` means unavailable or not requested, not zero quota
- The JSON is allowlisted and omits credential fields and raw endpoints, but aliases are user-chosen and may still identify a person or account
- Do not read, print, paste, or include raw auth files, API keys, OAuth tokens, relay console tokens, or other credential values in chat, logs, commands, or deliverables
- If the command is missing or the installed version lacks JSON support, explain that and use only a user-approved alternative; don't fall back to dumping credential/config files

## Keep provider boundaries clear

- Claude `-run` selects profile credentials for that session; settings, hooks, and history remain shared
- Codex switching changes global active auth/config. Its `-run` is not per-account home isolation; prior sessions may be made visible by provider metadata updates
- OpenCode Go selects a credential per launch but uses the normal shared `/resume` history
- Quota display is provider-reported visibility only; claudex-switch does not bypass login, rate limits, terms, or quota
- If the user requires full workspace, settings, or history isolation and the selected provider cannot provide it, stop before switching or launching and explain the limitation; let the user revise the request

## Get explicit scope for changes

An account inventory or comparison is not permission to modify accounts. Do not infer permission to switch, add, install, authenticate, refresh, rename, remove, or purge from a general request to inspect or manage accounts. Before a state-changing action, verify that the user explicitly requested that action and the specific account or alias. Explain provider-specific effects where a switch changes global auth/config.

Live `claudex-switch list` can contact provider or relay endpoints and may refresh OAuth credentials or persist account metadata. Use it only when the user asks for live quota / usage; make the network and refresh behavior clear when it affects their request. `doctor --live` can consume provider quota, so run it only on explicit request.

Treat `purge` as destructive: it removes the saved profile and all aliases linked to it and may require a new login. Do not run it on an inferred cleanup request; confirm the exact target and follow the applicable deletion confirmation requirements.

For local tests or demonstrations, use an isolated temporary home with fixtures. Never test by switching, refreshing, or authenticating a real provider account unless the user specifically asks for that operation.
