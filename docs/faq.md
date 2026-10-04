# Frequently asked questions

中文摘要：本页说明支持的账号类型、`-run` 隔离边界、额度读取、JSON 清单与中转站配置。账号切换会写入 provider 对应的本地认证 / 配置；不会绕过登录、条款或额度。

## What is claudex-switch?

It is an unofficial local CLI account switcher and quota viewer for authorized Claude Code, Codex, and OpenCode Go accounts. It uses aliases to select locally stored provider profiles and can launch the corresponding CLI. It does not create provider accounts, transfer account ownership, bypass authentication, change provider quotas, or make separate OS users / workspaces.

## Which account types are supported?

- Claude Code: OAuth subscription, Anthropic API key, and a managed local CLIProxyAPI account using a ChatGPT login
- Codex: ChatGPT OAuth and OpenAI API key, including an OpenAI-compatible custom provider
- OpenCode: OpenCode Go subscription credentials

The account flow and stored paths differ by provider. See the [use-case index](./use-cases.md).

## Does `-run` isolate every provider the same way?

No. `-run` is provider-specific:

- Claude OAuth / API-key profiles use profile-specific auth for the launched Claude session. Claude settings, hooks, and history remain shared; it is not a separate project/workspace or operating-system user
- Codex switches global active authentication and provider config before launching, with `--approve-for-me` by default; restart an already-running Codex client after a switch
- OpenCode V1 injects the chosen credential and shares the normal `/resume` history. OpenCode V2 uses a separate SQLite database per alias. Subscription accounts use native browser OAuth and pin the authorized account/workspace; native OpenCode owns token renewal, and failed or wrong-account refresh keeps the old profile and history. The API-key entry syncs its saved key through OpenCode's supported local integration API before launch; its `add`/`refresh` verifies a key with the server before saving and can explicitly import a login already stored by local OpenCode. V2 history is not automatically shared with other aliases or imported from normal OpenCode history. See the [OpenCode Go guide](./use-cases/opencode-go.md).

OpenCode V2 aliases reject CLI directory and resume/session overrides so the launch preflight uses the intended working directory. The TUI can still navigate to sessions from other projects already stored in that alias's private database; that in-app destination is not re-preflighted.

Read the [Claude](./use-cases/claude-parallel.md), [Codex](./use-cases/codex-accounts.md), and [OpenCode Go](./use-cases/opencode-go.md) guides before running multiple identities in parallel.

## Does it preserve Codex history when switching providers?

When switching between providers managed by claudex-switch, it can update the Codex provider-visibility metadata in rollout files and `state_5.sqlite` so sessions remain discoverable in `/resume`. The session message content is not rewritten. A custom provider configured outside the manager is left alone.

## What does `list` show? Does it make a network request?

The human-readable `claudex-switch list` fetches provider usage where supported: Claude OAuth and Codex ChatGPT windows, OpenCode Go rolling / weekly / monthly windows, and supported relay key / account balances. Requests can fail or return unavailable data; `null` or an unavailable note is not a zero quota. Some usage checks can refresh and persist OAuth credentials or provider account metadata.

The versioned offline inventory command `claudex-switch list --json --no-usage` requires v1.14.0 or later; v1.13.2 does not accept `--json`. It returns allowlisted metadata without quota requests, credential refresh, account switching, or Codex active-snapshot synchronization. Credential fields and raw endpoints are omitted, but alias strings are user-chosen and may identify an account. Local account files (and relevant Keychain-backed profile metadata) may still be read. See the [JSON output reference](./list-json.md); do not parse human-readable terminal formatting as an API.

## Can I use an OpenAI-compatible relay?

Yes, with different protocol requirements: a Claude API-key profile may use a Base URL that serves the Claude / Anthropic-compatible API; a Codex API-key profile may use a custom OpenAI-compatible provider. One does not imply support for the other's protocol. OpenCode Go is a separate subscription credential flow. Some one-api / new-api-family relays expose key billing data; a console system access token is separately required for wallet balance. The token is stored locally in `~/.claudex-switch/relays.json`, created with mode `0600` by the CLI; protect it as a secret and verify permissions if the file already existed. See [API key and relay setup](./use-cases/api-relays.md).

## What is the difference between `remove` and `purge`?

`claudex-switch remove <alias>` removes that alias only. `claudex-switch purge <alias>` deletes the linked stored account profile and every alias that points to it; the login may need to be created again. Don't run `purge` unless you intend to destroy that saved profile.

## 中文速览

- **是否官方工具？** 不是。它管理你已获授权的本地账号配置，不创建账号、不绕过认证，也不修改服务商额度
- **`-run` 是否完全隔离？** 否。Claude 只隔离会话凭据，设置 / hooks / 历史共享；Codex 切换全局认证 / 配置；OpenCode V1 共享正常 `/resume` 历史，V2 使用每个别名独立的 SQLite 数据库，不会自动共享或导入其他历史
- **能否离线检查？** `claudex-switch list --json --no-usage` 不请求额度、不刷新凭据、不切换账号；仍可能读取本地 profile / Keychain 元数据
- **`remove` 和 `purge` 有何区别？** `remove` 只删别名，`purge` 会删除关联账号档案及指向它的所有别名
