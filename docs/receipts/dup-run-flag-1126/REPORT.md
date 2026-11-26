需要用户：无

已修复重复启动开关被转发的问题，并按追加合同只保留 `--run`。构建后的 CLI 已实跑：`holdenx --run --model 6.1 --run` 向 Codex 转发的参数只有 `--approve-for-me --model gpt-6.1-sol`。本分支全套 552 项通过，基线全套 544 项通过；未发版、打 tag、安装、推送或修改主 checkout，交 ROOT 审查上线。

## 合同与需求

- 派发：CXS-DUPRUN-1126 / CXS-DUPRUN-1126-v1。
- 原合同 SHA-256：`dd526d0f92aee0278fe232fa29a4413e70115f1d90b7daa54015c3f55fe9fef4`，读取后已核对一致。
- 已重读修订后的 `addendum-1.md`。其中用户原话：「都用--run吧。」「去掉一个杠的」。
- ROOT 决策：只去掉单杠 run，不改 `-model` / `--model`。原合同的“单个 -run 行为不变”由追加合同覆盖。

## 实现与逐条验收

1. **重复 `--run` 不传给下游：已做。** 在 `src/commands/run.ts` 的公共 `runAliasSession` 入口过滤，早于 AGY/Cursor 原生客户端分支，因此覆盖 Codex、Claude、OpenCode、AGY、Cursor。
   - Codex：`tests/run-flags.test.ts` 的 `Codex CLI forwards canonical model without run flags` 三个命令案例，经真实 CLI 入口验证单个开关、重复开关、`use` 入口及模型展开。
   - Claude：`tests/run.test.ts` 的 `runs Claude Code with auto permission mode and consumes repeated --run flags`。
   - OpenCode：`tests/opencode.test.ts` 的 `runs the native TUI with private auth and the shared session store, consuming repeated --run flags`。
   - Cursor：`tests/native-subscription-run.test.ts` 的 `cursor launches native frontend and preserves native arguments, consuming repeated --run flags without creating proxy state`。
   - AGY：同文件的 `Antigravity consumes repeated --run flags, preserves native arguments and normalizes model effort without consulting the proxy catalog`。
2. **只认 `--run`，遇到 `-run` 提示迁移：已做。** `isRunFlag` 只认 `--run`；`src/index.ts` 与可直接调用的启动入口拒绝 `-run`，返回 1 并输出 `-run is no longer supported. Use --run instead.`。`src/alias/store.ts` 已移除单杠保留项。
   - 证据：`tests/run-flags.test.ts` 的 `rejects removed single-dash run before launching` 五个案例，覆盖别名、`use`、合法开关后夹带旧开关、代理入口及 `cc` 快捷方式。
3. **模型参数不改：已做。** `MODEL_FLAGS` 仍是 `-model` / `--model`。现有模型测试通过；构建后分别实跑两种写法，均转成 `gpt-6.1-sol`，见 [built-cli.log](evidence/built-cli.log)。
4. **帮助、提示、README/docs 的启动示例统一双杠：已做。** 同步当前指南、FAQ、代理说明、历史发布说明中的命令示例、内置提示、仓库内 skill 和验证脚本。原有回执/测试证据保留历史原文；共享 TODO/需求记录由集成者负责，未改。
5. **构建后实跑：已做。** 使用临时 HOME、合成 `holdenx` 账号和只打印参数的假 Codex，可见链路为 CLI 分派 → 模型解析/账号配置 → 子进程启动 → 客户端实际收到的参数。单个 `--run`、重复 `--run`、`use`、单杠报错及 `--help` 均有输出记录。未在真实账号会话上跑；无上游登录和真实交互会话。

## 验证命令与证据

工作目录：`/Users/holden/code/claudex-switch/.worktrees/dup-run-flag-1126`。

| 验证 | 命令及结果 | 输出文件 |
| --- | --- | --- |
| 旧实现回归复现 | 修改生产代码前，`bun run test tests/run-flags.test.ts`：1 通过、7 失败 | [regression-red.log](evidence/regression-red.log) |
| 最终入口测试 | `bun run test tests/run-flags.test.ts --timeout 30000`：8 通过、0 失败 | [run-flags.log](evidence/run-flags.log) |
| 最终全套 | `bun run test --timeout 30000 --reporter junit --reporter-outfile /tmp/cxs-dup-run-suite-unrestricted.xml`：552 通过、0 失败 | [suite.log](evidence/suite.log)、[suite.xml](evidence/suite.xml) |
| 基线对照 | 对 `a2cef6f336f184bec53154d44d100e6593d6dadd` 的临时源码快照运行同一全套命令：544 通过、0 失败 | [base-suite.log](evidence/base-suite.log)、[base-suite.xml](evidence/base-suite.xml) |
| 构建 | `bun run build`：通过；生成 `dist/claudex-switch.js`，未手改 | [build.log](evidence/build.log) |
| 成品实跑 | `node dist/claudex-switch.js holdenx --run --model 6.1 --run` 等 6 个案例：全部符合预期 | [built-cli.log](evidence/built-cli.log) |
| 文档 | `bun run docs:check`：通过 | [docs-check.log](evidence/docs-check.log) |
| 补丁格式 | `git diff --check`：通过 | 本回执 |

`suite: 0 failed ⊆ base a2cef6f336f184bec53154d44d100e6593d6dadd`

合同提醒的 RelayRouter GLM 测试在最终全套和基线全套均通过。早期受限环境全套因回环服务器 `EPERM` 等环境错误失败，最初定向测试还有默认 5 秒超时；获准启用回环网络并统一使用 30 秒超时后完成上述对照。最终日志完整，未截断。基线是 `/tmp/cxs-dup-run-base-1126` 中的 `git archive` 快照，未创建或修改其他 worktree。未调用 Python 专用的 `suite_baseline.py`；此项目使用 Bun，已直接运行两套完整测试比较。

## 文件与交接

- 核心：`src/commands/run.ts`、`src/index.ts`、`src/alias/store.ts`。
- 回归：新增 `tests/run-flags.test.ts`；扩展 Claude/OpenCode/AGY/Cursor 测试；原有测试和脚本中的启动示例改成双杠。
- 文档：两个 README、使用指南、FAQ、代理说明、发布说明及 skill 示例；其他源文件只更新提示或注释里的 run 拼写。
- 构建：`dist/claudex-switch.js` 由 `bun run build` 生成。
- 完整业务文件列表见 [changed-files.txt](evidence/changed-files.txt)，另加本回执目录与新增入口测试。
- 工作树保留给 ROOT 审查/合并，清理由 ROOT 按 landing 流程决定；worker 未加锁。工作树内没有新增且需保留的忽略数据。临时测试输出位于 `/tmp/cxs-dup-run-*`，最终证据已复制到本目录。
- 集成者记录建议：登记用户追加原话；将共享 TODO 中仍供用户执行的单杠 run 命令改成双杠。未修改共享 TODO、需求日志或 memory。
- 复盘：已有 `skills/claudex-switch/SKILL.md`，本次同步其命令示例；启动开关问题由真实 CLI 入口回归测试覆盖，无需再建重复 skill。
- 发布判断交 ROOT：本次含用户明确要求的旧参数移除，应在发布说明中告知迁移。本 worker 按冻结边界未发版。
