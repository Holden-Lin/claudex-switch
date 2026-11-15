# 45x 会话转到 holdenx 后无法恢复

已修复：Codex `--run` 启动前也同步受管会话的 provider 元数据，旧会话可以用所选账号继续。45x 仍是 hybaliez 中转账号，没有改名或移除；截图中的 403 是中转余额不足，随后出现的锁卡是另一层 provider 配置不匹配。分支交给 ROOT 评审、合并和发布，未改真实账号、配置或会话。

- 合同：`CXS-RESUME-PROVIDER-20261114-v1`，SHA-256 `715b82fc7a53f41fc6125140a836c04096b74ad8879790c30021b93b096fca0b`。
- 分支：`fix/resume-provider-20261114`，基于 `origin/main` 的 v1.28.6。
- 发布判断：需要补丁版本。按合同，版本号、合并、Homebrew formula 和发布由 ROOT 负责。

## 根因与用户实际遇到的两件事

只读提取别名及 registry 中的 provider 元数据，未读取真实登录文件或密钥：

| 别名 | 登录类别 | Provider | 配置模型 |
| --- | --- | --- | --- |
| `45x` | API key | `hybaliez`，端点 `https://newapi.hybaliez.com/v1` | `gpt-5.4` |
| `holdenx` | ChatGPT | `openai` | `gpt-6.1-sol` |
| `satoshix` | ChatGPT | `openai` | `gpt-6.1-sol` |

1. 45x 的请求按其配置发往 hybaliez。截图原文写明余额 `$0.113234`、本次预扣要求 `$0.119666`，相差 `$0.006432`，因而返回 403。这不是 Codex 账号的周额度错误。截图本身不能证明恢复后 holdenx 又发出了一次中转请求；旧报错会保留在会话历史里。
2. `--run` 使用账号私有登录/配置，但共享 rollout 和 SQLite 历史。之前只有全局 `use` 同步历史 provider；`--run` 没有同步。官方账号的私有配置会移除含中转密钥的 provider 定义，而旧会话仍记录 `hybaliez`，所以 Codex 锁住会话。
3. 本机 Codex 0.167.0 实测：单独加 `-c 'model_provider="openai"'` 仍出现同样锁卡。改 rollout 首行及 SQLite 的 provider 元数据后可恢复。官方[配置参考](https://learn.chatgpt.com/docs/config-file/config-reference)说明内置默认 provider 为 `openai`；锁卡与覆盖优先级的结论来自本次实测。

## 用户现在怎么继续

先退出原来仍打开该会话的 45x 窗口。现有 v1.28.6 可用这一行恢复：

```sh
claudex-switch holdenx && codex resume --all
```

它会先把 **holdenx 设为全局默认账号**，触发现有的 provider 同步，再打开全部目录的会话列表。截图没有会话 ID，因此应在列表中选择原会话。

本修复发布后，使用下面这一条即可，并保留全局默认账号：

```sh
claudex-switch holdenx --run resume --all
```

知道 ID 时，将 `--all` 替换为 ID。进入后保留原消息，使用 holdenx 的 provider；私有启动沿用所选账号的默认模型。此修复不会补充 hybaliez 余额或增加 holdenx 周额度。

## 实现与保留的边界

- `run` 和全局 `use` 共用同一同步入口，底层仍由已有的 `syncCodexSessionProviders` 写入；没有新增另一套会话写入器。
- 同步范围为全部受管 provider 的闲置会话及线程索引，包含归档；不是只改传入 ID 的一条历史。未受管 provider（如手动配置的 ollama）不动。
- 原有打开文件检测、时间戳保留、繁忙数据库的尽力处理继续生效。正在打开的 rollout 会跳过；检测失败且仍有 Codex 进程时也跳过，因此需要先退出原窗口，系统需能运行 `lsof`。
- `--run` 不切换全局默认账号，不复制旧中转凭据到官方账号。消息正文保留。
- 更新 Codex 使用文档、FAQ 和项目自带的账号管理 skill，明确缺失 provider 的处理方式，避免下次只尝试配置覆盖。

## 验证证据

- 新增三个启动路径回归：非默认 ChatGPT、默认 ChatGPT、中转账号。修复前 3 个均失败；修复后通过。测试在启动子进程的边界检查 SQLite provider，另核对 rollout、归档、正文、未受管会话及全局 auth/config/active 不变。
- 完整 `bun run verify`：**488 tests / 2,566 assertions，0 failures**；文档检查、构建和构建版 help 通过。第一轮一项现有全局切换测试超过默认 5 秒；同命令复跑全部通过，未放宽超时或修改该测试。
- 类型检查：`bun /Users/holden/code/claudex-switch/node_modules/typescript/bin/tsc --noEmit` 通过。`git diff --check` 通过。
- 构建版 CLI → 真实 Codex 0.167.0 PTY → 渲染结果：见 [旧版终端](before.txt)、[修复后终端](after.txt)、[结构化核对](checks.json)。验收使用临时 HOME、合成的中转/官方 API 登录，并以 `--no-daemon` 避免后台服务影响；没有发送模型提示。显示就绪后结束测试客户端。

| 真实 TUI 的检查 | 修复前 | 修复后 |
| --- | --- | --- |
| 缺失 hybaliez 锁卡 | 有 | 无 |
| 旧问题、旧回复 | 显示 | 显示 |
| 可输入的 GPT-6.1-Sol 界面 | 无 | 有 |
| rollout / SQLite provider | `hybaliez` | `openai` |
| 全局 provider / 默认账号 / 登录 | 保留 | 保留 |
| 私有配置保留旧中转定义 | 无 | 无 |

原历史正文 SHA-256 `ff96ac2af361a458d9fa2d41b60f794ab1ffe2a4913159aeb524fcf4b1fd07e8` 的内容完整保留。恢复后 Codex 自行追加一条 `thread_settings_applied` 元数据，这是客户端正常行为。

真实 holdenx OAuth 刷新、真实模型响应及计费未验证；合同禁止读取真实凭据。ChatGPT 启动路径由隔离回归覆盖，真实 TUI 则以合成官方 API 登录验证同一个 `openai` provider 恢复路径。

## 给 ROOT 的收尾材料

建议 TODO：`[x] 2026-11-14：修复 Codex --run 跨 provider 恢复仍锁在旧 hybaliez；488 tests、类型检查及真实 Codex 0.167.0 合成账号 TUI 前后对比通过。待 ROOT 评审后发补丁版。`

建议 req_changelog 新条目（worker 未编辑共享文档）：

```markdown
## 2026-11-14 · Codex 跨账号恢复使用所选 provider · 完成

### 用户原话
- （ROOT 合同 goal_source 核验，11-14）「开个claudex-switch 的session看看这个问题。我用holdenx的会话resume 45x的会话时出现这个」

### 决策与假设
- Decision (worker, delegated diagnosis/fix): share the existing managed-session provider sync between global switches and --run; CLI config overrides alone leave Codex 0.167.0 locked to the saved provider. Preserve global account selection and conversation content.
- Finding (worker, metadata + screenshot): 45x still maps to hybaliez; the earlier 403 reports insufficient relay pre-consumption balance, separate from the missing-provider lock.
- 有意不做：真实登录、配置和会话保持不动；merge/release 由 ROOT 负责。

### 验证
- 488 tests / 2,566 assertions; typecheck, docs/build/help; real Codex synthetic-home TUI restores saved messages and OpenAI provider. Real holdenx inference not tested.
```

工作树清单：代码、构建产物、测试、文档及本目录证据均提交；无需要保留的 ignored 数据，无 worker 自设锁。共享 TODO / req_changelog / memory 未修改。工作树留给 ROOT 评审和合并，之后按 landing 流程清理；本 worker 不执行 merge/release。
