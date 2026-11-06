# WorkBuddy hy4free auto mode 修复交付

已定位并修复工具检查没有可用判定的原因。真实 WorkBuddy hy4free 在 auto mode 下已执行三条验收命令；主对话仍使用 xhigh 思考。修复位于工作分支，等待 ROOT 评审、合并和发布；本轮未更新全局安装。

## 合约与范围

- Dispatch：`CXS-HY4-AUTOMODE-20261106`；version：`CXS-HY4-AUTOMODE-20261106-v1`。
- 合约 SHA-256：`7b3ac3fca65bf06309deabc1b6feb18a27a263e5308c49d684d4dc0e054a643f`；ACK 已通过 `signal ack` 写入指定 worker.txt。
- 分支：`fix/hy4-automode-20261106`；基线：`fd7c329`。交付提交以 worker.txt 最后的 FINAL `commit` 字段为准。
- 仅处理 WorkBuddy 非流式回复的默认推理、相关回归及项目排查 skill。合并、发版、安装归 ROOT；未充值、未新增账号、未改变其他账号的登录或设置，未读取或输出秘密文件及鉴权头。
- 真实测试由本 worktree 的 `node dist/claudex-switch.js workbuddy cc --model hy4free` 启动；使用账号原有登录，附加 `--tools Bash` 和调试文件；未添加 `allowedTools`、放行 hook 或跳过权限检查的参数。

## 根因证据

2026-11-06 00:19–00:24 UTC，以临时 loopback HTTP 代理转发 Claude 子进程请求至其原有本机网关。只从自己的短测试提取模型、预算、状态和分类回复；鉴权头未记录。真实组件：Claude Code **2.1.318**、账号原有 CLIProxyAPI **7.3.15**、WorkBuddy 插件 **0.1.30**。

当时的目录已没有 `deepseek-v4.1-flash`，私有分类器 pin 因而未生效。Sonnet 档位为 `hy4free`，`CLAUDE_CODE_AUTO_MODE_SERVER=0`。实际分类请求到达 hy4free；这次故障不是旧 deepseek 路由的积分耗尽，也不是服务端分类器不可用。

| 观测 | 修复前 | 修复后 |
| --- | --- | --- |
| 请求模型 / 传输 | hy4free / 非流式 | hy4free / 非流式 |
| 输出预算 / stop | 2112 / `</block>` | 2112 / `</block>` |
| HTTP 状态 | 200 | 200 |
| stop_reason | max_tokens | end_turn |
| 输出 token | 2112 | 8 |
| 内容 | thinking 7761 字符，无 text 块 | text：`<block>no</block>` |

第一次请求 00:19:47.875 开始，00:20:22.584 完成，约 34.7 秒。Claude Code 重试后，第二次仍用满 2112 个 token，只给出 9267 字符的 thinking，没有判定文本。屏幕显示 `Not run · auto mode's check had no usable answer`。主模型随后继续尝试同一命令；已保存失败屏幕后停止本轮基线，避免继续耗费免费额度。

因此，单纯检查 HTTP 成功、模型在目录中、或非流式已转换为 JSON，都无法排除此故障：分类器的整个输出预算被默认思考占满。

原始抓包的白名单字段已提取至 [分类请求 / 回复证据](hy4-automode-classifier.json)，包含前两次失败、修复后判定及主对话思考参数，不包含鉴权头、完整思考或会话正文。

## 修复行为

WorkBuddy 国内版及国际版的非流式请求未明确指定 `reasoning_effort` 时，本地桥补 `none`，再按已有逻辑请求 SSE 并合并为 JSON。请求明确指定的 effort、正常流式主对话和 Cursor 请求继续按原值传递。分类器拒绝回复原样保留，不制造放行判定。

桥版本从 2 升至 3；下一次空闲启动会替换旧桥。正在运行的其他会话不因升级而被终止。无须全局关闭思考或固定另一个付费模型。

## 真实屏幕证据

测试位于私有 tmux `cxs-hy4-test`，通过默认 tmux 中独立的 `hy4-live-proof` 窗口显示。以下为成功会话屏幕摘录；`ls` 的工具折叠显示为 `listed 1 directory`，结果在同一屏幕的最终回复中展开：

```text
Claude Code v2.1.318
Hy4 with xhigh effort · API Usage Billing
⏵⏵ auto mode on (shift+tab to cycle)

⏺ Bash(git log -1 --oneline)
  ⎿  fd7c329 release: update Homebrew formula for v1.28.1

  Thought for 8s, listed 1 directory (ctrl+o to expand)

⏺ Bash(uv run --no-project --python 3.13 python -c "print(6*7)")
  ⎿  42
  ⎿  Allowed by auto mode

⏺ 三条命令均已执行完毕，没有重试，也没有读取文件或运行其他命令。实际结果如下：
  - git log -1 --oneline → fd7c329 release: update Homebrew formula for v1.28.1
  - uv run --no-project --python 3.13 python -c "print(6*7)" → 42
  - ls 输出如下：
  AGENTS.md
  COMMERCIAL-LICENSING.md
  Formula
  LICENSE
  README.en.md
  README.md
  THIRD-PARTY-NOTICES.md
  bun.lock
  bunfig.toml
  claude.md
  dist
  docs
  install.sh
  node_modules
  package.json
  scripts
  skills
  src
  tests
  tsconfig.json

  三条命令都成功返回，无报错。
✻ Crunched for 36s · done 9:24 AM
```

该成功会话中没有 `no usable answer`。抓包同时确认主对话仍发送 adaptive thinking / xhigh，实际分类器返回 8-token 判定；两个只读命令的成功不能单独充当分类器成功的证据。

## 验证

- `TZ=UTC bun run verify`：448 tests / 0 fail，2292 断言；文档检查、构建与构建版 help 通过。其后仅增加分类器拒绝文本原样传递的断言及文档检查范围，相关单测和文档检查另行复验。
- 最终 `bun run test tests/subscription-plugins.test.ts`：20 pass / 0 fail，134 断言（含新增拒绝文本保留核对）；`bun run docs:check`：14 必备文件 / 49 Markdown 文件，链接有效。
- `bunx tsc --noEmit`：通过。
- `bun scripts/verify-subscription-bridge.ts --output <scratch>/synthetic`：真实 Claude Code + CLIProxyAPI + 实际插件，在合成上游完成两轮 Read、非流式短预算回复、6004 冷却 120 秒、14018 免费模型提示，以及旧桥空闲替换。合成上游在未禁用推理时只返回 thinking/length，使回归可被离线验出。
- 新增回归覆盖国内 / 国际 WorkBuddy 的短预算判定、拒绝文本原样返回、显式 effort、普通流式请求、Cursor；使用真实 bridge 入口，未复制实现逻辑。
- `skill-creator/scripts/quick_validate.py skills/proxy-auto-mode`：通过。skill 从 AGENTS.md 和既有 claudex-switch skill 可发现；涵盖启动 / 工具检查症状、抓包、各控制项及 agy / WorkBuddy 历史案例。
- `git diff --check`：通过。真实测试需允许 loopback 监听；默认沙箱拒绝监听时，已在授权范围内重跑，没有改变测试隔离。

测试结束后，以 `/exit` 退出成功会话，停止本轮创建的 WorkBuddy 代理（复用项目的 lease / PID 所有权检查），关闭抓包进程、私有 tmux pane 和显示窗口。测试 PID 均已退出，无本轮测试服务残留。未修改 LaunchAgent。

## ROOT 接续与发布判断

- 建议作为下一个补丁版本发布；当前全局安装仍为旧实现，用户需在 ROOT 合并、发布及安装后重开 WorkBuddy 会话。已准备 `docs/release-notes/unreleased.md`；未 bump 版本、打 tag、发布或安装。
- 建议在 cc_chats `claude-skills/` 增加一份短的全局入口：先区分启动资格与工具时分类失败，先采集实际请求 / 回复，再链接本项目 skill；保留 provider 与版本细节在项目内。ROOT 决定是否同步，本 worker 未写该目录。
- 建议 TODO：合并发布后，从全局安装入口再跑同样三条命令；关闭旧会话才会重建旧桥。共享 TODO / req_changelog / memory 留给 integrator。
- worktree 保留给 ROOT 评审 / 合并；无本轮手动 worktree lock。忽略数据：`node_modules/` 为锁定依赖的本地副本，`du -sk` 为 32336 KiB，可随工作树清理。构建时使用本地依赖以避免生成物带入 symlink 路径差异；未手改生成物。临时私有抓包与屏幕位于 `/private/tmp/cxs-hy4-automode`，不进入提交。

## 建议 req_changelog 文本

```markdown
## 2026-11-06 · WorkBuddy hy4free auto mode 无可用判定 · 完成（发布待 ROOT）

### 用户原话
- （合约 goal_source 核实，2026-11-06）「你看claudex-switch看看能不能把hy4 automode修了，最好总结一个skill，因为类似agy也修过automode的问题」
- （同一合约）「你直接开个session让它去看就好了」

### 决策与假设
- Root cause (worker, measured): hy4free classifier returned HTTP 200 with thinking only, exhausted all 2112 output tokens and supplied no XML verdict; catalog routing and server-classifier fallback were already correct.
- Decision (worker, method): unrequested WorkBuddy non-stream reasoning uses none; preserve explicit effort and streaming main chats. ROOT owns merge/release/install; no credits purchased.
- Decision (worker, scope): keep detailed agy/WorkBuddy repair guidance in the project skill; propose a short global routing skill for ROOT to decide.

### 验证
- Worktree build + real Claude Code 2.1.318 / CLIProxyAPI 7.3.15 / WorkBuddy hy4free in visible tmux: git log, ls, uv Python all ran in auto mode, Python printed 42; classifier returned <block>no</block> in 8 tokens. 448 tests, typecheck, build and synthetic real-plugin integration passed; receipt: docs/receipts/hy4-automode-20261106.md.
```
