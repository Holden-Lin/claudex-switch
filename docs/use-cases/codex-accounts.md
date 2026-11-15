# Switch Codex accounts and preserve `/resume` visibility

中文摘要：`claudex-switch <alias>` 会替换全局 auth / config；`<alias> -run` 不切换默认账号，非默认账号在私有 `CODEX_HOME` 里隔离登录及必要的 provider 配置；全局切换和 `-run` 都会将受管会话的 provider 元数据同步到所选账号，并让 Codex 0.169+ 按账号隐藏的受管会话在各账号间共享，使旧会话可以继续，不改消息内容。

Use this when you have multiple Codex ChatGPT logins or API-key profiles and want one local alias per saved account:

```sh
claudex-switch list --no-usage
claudex-switch cx
claudex-switch cx -run
```

`use` copies the selected account auth into `~/.codex/auth.json`, updates the relevant `~/.codex/config.toml` values, and records the active account. For a custom API-key provider, the active bearer credential is written into `config.toml` as `experimental_bearer_token` when available (otherwise the configured `env_key` is used); the config file is set to mode `0600`. Treat `config.toml` as sensitive and don't share it. If you switch between official OpenAI and a managed custom provider, claudex-switch may restamp provider visibility metadata in Codex rollout files and `state_5.sqlite`, so prior sessions remain visible in `/resume`. Codex 0.169+ also hides sessions created by another ChatGPT login; sessions of managed logins are shared by dropping their `account_scoped` marker. Edits keep each rollout's first line at its exact byte length, because Codex indexes history by byte offset. It does not rewrite their conversation contents.

## `-run` keeps the default account

`claudex-switch cx` is the only command that changes the default Codex account. `cx -run` launches Codex without touching `~/.codex/auth.json`, `config.toml`, or the active account:

- If `cx` is already the default, Codex runs on `~/.codex` directly.
- Otherwise Codex runs with `CODEX_HOME=~/.claudex-switch/codex-run/<account>`. Only `auth.json` is private (mode `0600`). `config.toml` is linked to the shared one; a private copy is written only when the account's provider routing differs, for example a relay API key. Every other entry (sessions, `state_5.sqlite`, skills, hooks, `AGENTS.md`) links back to `~/.codex`. The account's default model is passed with `--model`. Tokens Codex refreshes during the run are saved back to the account snapshot when it exits.

全局切换和 `-run` 都会同步受管会话的 provider 元数据（rollout 首行及 `state_5.sqlite`）。Codex 恢复会话时会沿用记录的 provider，仅覆盖启动配置里的 `model_provider` 不能解除旧 provider 缺失的锁卡。同步后，会话使用所选账号的 provider；全局默认账号、登录和配置不因 `-run` 改变。手动配置、未受管的 provider 会话保持原样；正在被进程打开的 rollout 文件会跳过，请先退出原会话再恢复。

### 跨 ChatGPT 账号可见（Codex 0.169+）

Codex 0.169 起，新会话的 rollout 首行带 `account_scoped` 及创建者的 ChatGPT user / account id；`/resume` 列表只显示当前登录创建的这类会话，旧会话不受影响。claudex-switch 会去掉受管 ChatGPT 账号所建会话的 `account_scoped` 标记（与 Codex 自己写“共享会话”的格式相同），创建者 id 保留。时机：全局切换、`-run` 启动前，以及 `-run` 退出后（让裸 `codex` 在另一个账号下也能看到本次新会话）。非受管账号创建的会话、无创建者的会话、回滚产生的 rollout 保持原样。

### 首行字节长度不变

Codex 的分页历史（`thread_history_1.sqlite`）和 fork 血缘（`history_base.end_byte_offset`）按字节偏移读取 rollout，首行长度一变，后续记录就会错位。因此所有元数据修改都在原文上做最小替换，并用 JSON 空白补齐到原长度；`.jsonl.zst` 压缩会话同样处理，解压后长度不变。若新 provider 名更长且首行没有可用空间（例如旧的 `openai` 会话切到 `hybaliez`），该会话及其线程行保持原 provider，并在切换时提示；可回到创建它的账号恢复。v1.28.7 及更早版本重写首行时会改变长度（如 `hybaliez` → `openai` 少 2 字节），之后的同步会在投影偏移恰好超出文件末尾不多于 64 字节时补回空白，恢复对齐。

例如，从中转账号 `45x` 的会话转到官方账号 `holdenx`，退出原会话后运行：

```sh
claudex-switch holdenx --run resume --all
```

在列表中选择旧会话；已知 ID 时可将 `--all` 换成会话 ID。即使全局默认账号已经是 `holdenx`，启动前仍会同步。中转站此前的余额不足错误会保留在对话历史中；它不会被当作新账号的额度。Codex 对私有 `config.toml` 的编辑留在该副本中；shell 环境、项目、工具和本地文件仍共享。

The default launch uses `--approve-for-me` (Codex Auto permission mode with the workspace-write sandbox). `--autoreview on|off` separately toggles the Codex Stop multi-agent completion-review hook for that run; neither flag changes account authorization or makes a run fully isolated.

Codex ChatGPT quota may be fetched from the supported Codex rate-limit boundary when `list` is run with usage enabled. `list --no-usage` skips quota requests but the human-readable path may still synchronize the active auth snapshot; the no-write JSON inventory requires claudex-switch v1.14.0 or later; v1.13.2 does not support `--json`. See the [JSON reference](../list-json.md).
