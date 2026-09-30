# `claudex-switch list --json` reference

**Release status:** the JSON output is planned for 1.14.0 and is not available in the released v1.13.2 CLI. Check `claudex-switch help` for `list --json` support before relying on this interface; `claudex-switch --version` may trigger an automatic update.

Use JSON output when a script needs structured account inventory. For an offline local read with no quota requests or local account writes, use:

```sh
claudex-switch list --json --no-usage
```

On success, standard output contains exactly one JSON object:

```json
{
  "schemaVersion": 1,
  "accounts": [
    {
      "alias": "work",
      "provider": "claude",
      "authMode": "oauth",
      "plan": "max",
      "defaultModel": "claude-opus-5-5",
      "isActive": true,
      "status": "configured",
      "usage": null,
      "balance": null
    }
  ]
}
```

The example values are illustrative. The empty inventory is `{ "schemaVersion": 1, "accounts": [] }`.

## Schema version 1

The `accounts` array contains one record per alias:

| Key | Shape | Meaning |
|---|---|---|
| `alias` | string | User-chosen local alias; it may identify an account or person |
| `provider` | `claude`, `codex`, `opencode` | Provider family |
| `authMode` | `oauth`, `api-key`, `local-cliproxyapi`, `chatgpt`, `apikey`, `subscription`, `missing-credential`, `missing-profile`, `unknown` | Account type / local credential mode |
| `plan` | canonical lowercase string or `null` | Provider plan where locally available or returned by the service |
| `defaultModel` | string or `null` | Account's safe model identifier |
| `isActive` | boolean | Whether the account is currently selected for that provider |
| `status` | `configured`, `missing-profile`, `missing-credential`, `login-required` | Local profile / credential state only; this is not quota health |
| `usage` | object or `null` | Provider usage windows when fetched; fixed fields listed below |
| `balance` | object or `null` | Supported relay billing values, shown below |

`usage` uses fixed keys `fiveHourUsedPercent`, `fiveHourResetsAt`, `weeklyUsedPercent`, `weeklyResetsAt`, `monthlyUsedPercent`, and `monthlyResetsAt`. Percentages are provider-reported used-percent values from 0 to 100; reset values are Unix epoch milliseconds or `null`. Providers may omit a window. With `--no-usage`, `usage` is `null` and no provider quota request is made.

`balance` is either `null` or `{ "key": <side-or-null>, "account": <side-or-null> }`. Each populated side is `{ "remainingUsd": <number-or-null>, "usedUsd": <number-or-null>, "unlimited": <boolean> }`. With `--no-usage`, no relay billing request is made and `balance` is `null`.

## Offline mode and data handling

`--json --no-usage` does not switch accounts, contact quota / billing endpoints, refresh credentials, synchronize the active Codex auth snapshot, or normalize / persist Codex registry tiers. It can read local account files and provider auth stores to build the inventory. It omits email fields, credential fields, raw endpoints, and provider error text. Alias values are chosen by the user and should still be treated as private account metadata.

Without `--no-usage`, JSON mode performs the same live usage work as human-readable `list`: requests supported provider / relay endpoints and may refresh OAuth credentials or persist account metadata. It still does not switch the active account.

`usage: null` means not requested or unavailable; never interpret it as 0% used, 0% remaining, or proof that login is invalid. `status` describes local account configuration, not service availability or quota. Use `schemaVersion` to reject or explicitly handle incompatible output in automation; don't infer future fields.

Errors are reported on standard error using generic CLI messages. Do not use human-readable terminal output as a machine interface or log this output in a public location without reviewing aliases.
