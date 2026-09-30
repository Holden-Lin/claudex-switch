# Configure API keys and compatible relays

中文摘要：Claude 可配置 API Key / Base URL；Codex 可用 OpenAI API Key 或兼容 provider。中转站额度取决于其公开接口，系统访问令牌仅用于授权读取钱包余额。

Use these account types only when you have authorization to use the key and endpoint:

- Claude supports an API key with an optional Base URL, Auth Token, model mappings, and custom environment variables. A custom endpoint must implement the Anthropic-compatible API expected by Claude Code; a generic OpenAI-compatible endpoint is not automatically interchangeable
- Codex supports an OpenAI API key or a custom OpenAI-compatible provider configured with provider name, base URL, model, and environment-variable key metadata
- OpenCode Go is a subscription credential flow, not a generic OpenAI-compatible relay account

Create a saved account interactively, then choose the provider's key or relay option:

```sh
claudex-switch add claude-relay
claudex-switch add codex-relay
claudex-switch claude-relay -run
claudex-switch codex-relay -run
```

For a custom Codex provider, switching writes the active provider/model and bearer credential into `~/.codex/config.toml` as `experimental_bearer_token` when the key is available; if not, the provider's configured `env_key` is used. The CLI applies mode `0600` to this file. Treat it as a credential store: don't commit or share it. `-run` also injects the saved key into the configured environment variable for the spawned Codex process. Switching is a local configuration change and can affect subsequent Codex sessions.

## Optional one-api / new-api wallet balance

For supported one-api / new-api-family relays, separate billing endpoints can report API-key-level balance. This billing support does not imply that a relay's inference API is compatible with Claude Code or Codex: Claude needs the Claude-compatible protocol, while a custom Codex provider needs the OpenAI-compatible protocol. A separate relay-console system access token is needed to request account-wallet balance; it is not the `sk-` API key. The token can be saved per origin in `~/.claudex-switch/relays.json`, which the CLI creates with mode `0600`; if the file existed already, verify its permissions. Treat it as a secret: don't paste it into public issues, commit it, or send it to unrelated services.

An optional console entry looks like this with placeholders only:

```json
{
  "https://relay.example.com": {
    "accessToken": "<relay system access token>",
    "userId": 42
  }
}
```

`userId` is required only by relay deployments that expect the `New-Api-User` header. If the console token is not available, skip the account-wallet lookup; the key-level balance may still be available.
