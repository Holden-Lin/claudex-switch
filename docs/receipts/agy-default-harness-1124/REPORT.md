# 订阅默认前端交付

保存的 AGY 别名现在执行 `claudex-switch agylam42 --run` 会启动原生 `agy`；只有加 `--cliproxy claudecode`（或用 `cc`）才启动 Claude Code。Cursor 默认启动 `cursor agent`；WorkBuddy 的 bare `--run` 明确报错并提示代理用法。评分命令 `claudex-switch workbuddy cc --model hy4free` 及带 `-p` 的一次性调用保留，完整 CLI 回归均通过；全量 528 项测试通过。待 ROOT 评审、合并和发版。

## 合同与用户原话

- Dispatch：`CX-AGYDEFAULT-1124`；合同版本：`CX-AGYDEFAULT-1124-v1`。
- 合同：`/Users/holden/code/cc_chats/docs/orchestration/evidence/2026-11-24/cx-agy-default/contract.md`。
- SHA-256 已核对：`6c5333fcda64d35dc736887471755d3e2370dc5bb5798973fd118961025162e2`。
- 工作树：`/Users/holden/code/claudex-switch/.worktrees/agy-default-harness-1124`；分支：`fix/agy-default-harness-1124`；起点：`f46542b`。
- 合同记录的用户原话（来自 `goal_source`，非 worker 直接收到的原始消息）：

> claudex-switch agylam42 --run
> 我这样跑 AGY 账号的时候，应该默认用 AGY 而不是用 Cloud Code。只有杠-CLI Proxy 的时候，才是指定非默认 Harness 的时候。

- 本会话直接收到的补充原话：

> 可以，就按你说的：AGY 默认起 agy，Cursor 默认起 cursor agent，WorkBuddy 没有确认过的原生命令，bare --run 就明确报错并提示加 --cliproxy，别猜。另外注意我们的评分任务在用 `claudex-switch workbuddy cc --model hy4free`（含 -p 一次性用法），这条一定要继续能用，测试里也覆盖一下。

## 决策与实现

- 已读上次交付 `docs/receipts/agy-subscription-1124/REPORT.md`、相关实现、`run.ts` 历史以及真实 HOME 测试隔离 memory。
- 在旧的 Claude profile 存储上按 `upstream` 选择默认前端，无需更改账号 schema 或迁移登录。Antigravity → `agy`；Cursor → `cursor agent`；WorkBuddy 国内版和国际版 → 明确报错。其余 Claude、Codex、OpenCode 和旧 ChatGPT 代理路径保持既有行为。
- 原生参数直接传给原生 CLI，包括 `--model`、`--effort`、`-p`，不注入 Claude 的权限参数、模型映射或设置文件，也不启动代理。原生子进程退出状态和终端信号由启动器处理。
- 原生终端使用自己的登录，启动输出明确说明这一点。代理别名保存的独立登录仍只用于显式 `--cliproxy claudecode` / `cc`；本次没有实现原生多账号凭据隔离，也不声称代理别名会自动切换原生账号。此边界已先向 ROOT 发 `signal ask`，用户随后确认按建议执行。
- 本机 `agy --help` 确认为原生终端；Cursor 包装器提示使用 `cursor agent`。官方 [AGY 认证说明](https://antigravity.google/docs/install?tab=cli) 说明原生登录使用 OS keyring；[Cursor 认证说明](https://prod.cursor.com/docs/cli/reference/authentication) 说明原生终端有自己的浏览器登录。WorkBuddy 的网站 CLI 链接指向 CodeBuddy，未将两者账号或额度视为等价，按用户补充要求拒绝猜测启动命令。
- 更新新增账号提示、CLI help、中英文 README、订阅说明；从源码重建 `dist/claudex-switch.js`。没有更改版本号、发版、tag、推送或 Homebrew formula。

## 自动验证

| 检查 | 结果 |
| --- | --- |
| `bun run test tests/native-subscription-run.test.ts` | 6 pass，0 fail，41 assertions |
| `bun run test` | 528 pass，0 fail，2702 assertions，48 个文件，32.88 秒 |
| `bun x tsc --noEmit` | 退出码 0 |
| `bun run build` | 从源码生成 dist |
| `bun run docs:check` | 必需文件及本地链接通过 |
| `git diff --check` | 通过 |

新增测试运行真实 CLI 入口和别名分发：AGY / Cursor 原生前端及参数透传、没有生成代理状态、两个 WorkBuddy 区域的明确错误，以及 `workbuddy cc --model hy4free` 的交互式和 `-p "reply OK"` 两种调用。评分命令测试运行真实代理管理器和订阅桥，仅将厂商模型目录传输和 Claude 可执行文件替换为本地 fixture；断言最终子进程为 Claude，参数保留 `hy4free` 和 `-p`。既有集成测试继续覆盖显式 AGY 代理启动和四类旧订阅 profile 的复用。

所有测试均经 `bun run test` 使用仓库 preload 隔离 HOME。受限沙箱不能监听回环端口，代理相关验证改在允许回环监听的执行环境运行。期间测试 fixture 曾未将模拟厂商目录传给 supervisor 子进程；现使用同一 fixture 入口供父子进程执行，最终通过。没有读取真实凭据或私有环境文件内容。

## 真实 PTY 启动证据

运行本工作树构建产物，经 `exec_command(tty: true)` 和 macOS `script -q` 分配 PTY。别名 `agylam42` 是 `/tmp` 隔离目录中新建的同名测试别名，使用仓库 fake CLIProxyAPI 登录和目录；不是用户真实账号。实际子进程分别为本机安装的 `agy` 和 `claude`。以下删除 ANSI 控制符、将隔离目录简写为 `<test-home>`。

### 原生 AGY

执行 `bun ./dist/claudex-switch.js agylam42 --run --help`：

```text
  ● Using the native CLI's own login; the saved proxy alias login is only used with --cliproxy claudecode.
  ● Running agy --help
Usage of agy:
  --agent                         Agent for the current CLI session
  --effort                        Reasoning effort for the current CLI session (low|medium|high|xhigh|max)
  --model                         Model for the current CLI session
  --print                         Run a single prompt non-interactively and print the response
Available subcommands:
  acp             Start the Agent Client Protocol (ACP) stdio server
  models          List available models
```

退出码 0，实际启动 `/Users/holden/.local/bin/agy`。使用 `--help` 作为无模型请求的启动探测；没有进入真实账号交互式 TUI、验证其当前登录身份或发模型请求。

### 显式 Claude Code

执行 `bun ./dist/claudex-switch.js agylam42 --run --cliproxy claudecode --version`：

```text
  ● Running claude --permission-mode auto --settings <test-home>/.claudex-switch/cliproxyapi/<profile-id>/claude-settings.json --version
2.1.331 (Claude Code)
```

退出码 0。路径经过真实 CLI 参数分发、保存的 AGY profile、本地测试代理启动、私有设置生成及本机 Claude Code 子进程。`--version` 没有发模型请求；未以真实代理版本和真实账号默认模型验证厂商响应。本次只验前端选择，不能作为 AGY 模型可用性证据。

## 交接与收尾

- 仅修改工作树内代码、测试、说明和本 REPORT；未修改主检出、真实 `~/.claude-profiles` / `~/.gemini`、凭据或账号设置。
- 共享 `docs/TODO.md`、`docs/req_changelog.md`、memory 留给 integrator。建议需求记录保留上述两段原话，并将原生登录边界、WorkBuddy 明确拒绝启动、评分命令兼容测试记作实现决策和验证证据，不混入用户原话。
- 本次问题是 profile 的存储 provider 被错误用作默认前端；新增入口级回归即可覆盖，不需另建 skill 或长期 memory。
- 临时代理已停止；终端原始日志在 `/tmp/agy-default-native-terminal.txt` 和 `/tmp/agy-default-claude-terminal.txt`，均为合成账号。工作树内无保留的 ignored 数据；没有创建工作树锁。
- 按 `landing` worker 第 1 步提交全部范围内文件并保持工作树干净；不推送、不合并、不删除工作树。ROOT 评审后决定发布新版本，并处理工作树清理。
