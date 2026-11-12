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

## RelayRouter 的 GLM 5.3 Flash 评审会话

```sh
claudex-switch relayrouter -run --model glm-5.3-flash --effort high
claudex-switch relayrouter -run
```

第一条命令将 GLM 保存为该账号默认模型；第二条沿用这个默认值。启动器仍用 auto 权限模式。账号默认值通过 `claudex-switch model relayrouter glm-5.3-flash` 或启动参数保存，会话内 `/model` 的修改仅保留到本次会话结束。显式运行 `--model gpt-6-astra` 仍可选择 Astra，并将其保存为新的默认值。

当 API 地址为 `https://api.relayrouter.ai` 且账号默认模型为 `glm-5.3-flash` 时，启动器按 [Z.AI 的 1M 窗口规格](https://docs.z.ai/guides/vlm/glm-5.3-flash)，使用 Claude Code [文档中的窗口和压缩设置](https://code.claude.com/docs/en/model-config#correct-the-window-for-a-gateway-or-custom-model-id)：`CLAUDE_CODE_MAX_CONTEXT_TOKENS=1000000`、`CLAUDE_CODE_AUTO_COMPACT_WINDOW=800000`。保留 200K 余量供工具结果与后续回复使用，并清除继承的旧百分比压缩设置。请求使用原始模型 ID，不添加可能影响中转路由的 `[1m]` 后缀。

此组合的 small-fast 辅助请求和 auto 权限分类器默认也用 GLM，分类器使用客户端检查。账号自定义 env 可覆盖这些默认值；其他模型和其他服务商保持原有行为。Opus / Sonnet / Haiku / Fable 和子代理仍使用账号保存的映射，可在 `webconfig` 中单独配置。

RelayRouter 的 GLM 后端无法接受回传的 Anthropic `thinking` 内容块，可能在工具执行后报 `400 … ChatCompletionRequestAssistantMessageContent`。仅对此组合的 `-run` 会话，启动器会创建一个临时本地转发层，从请求的 assistant 历史中移除 `thinking` / `redacted_thinking` 块及由此变空的消息；文本、工具调用、工具结果和返回的思考流均保留，不关闭模型思考，也不改变权限判定。转发层随会话退出，不启动或替换 CLIProxyAPI 守护进程。

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
