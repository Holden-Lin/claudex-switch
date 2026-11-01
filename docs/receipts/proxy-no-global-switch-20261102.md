# 代理账号禁止全局切换：交付清单

- Dispatch：`CLAUDEX-NO-GLOBAL-SWITCH-20261102`
- Contract：`CLAUDEX-NO-GLOBAL-SWITCH-20261102-v1`
- 合同 SHA-256：`192c82f1e888434752bc63d71b442a0dbc666886f55220f9989bb4ed9a57879a`
- ACK：2026-11-01T22:12:51.081405Z，已通过合同指定的 `signal ack` 写入 worker.txt。
- 基线提交：`31e96db1c242c4fa346a6a616459b8ef063c3f2e`。
- 修复分支：`fix/proxy-no-global-switch-20261102`。
- 发布提交：`v1.26.12^{commit}`（本清单随发布提交落库，以 tag 解析完整 SHA，避免自引用）。
- 发布版本：`v1.26.12`；发布地址：https://github.com/Holden-Lin/claudex-switch/releases/tag/v1.26.12 。CI 负责创建资产与更新 Formula；实际发布终态以 worker FINAL 前的 CI 核对为准。

## 用户原话与边界

合同引用用户原话：「claudex-switch的修复方法是，workbuddy,agy这种运行，不能切profile，其他的正常切。你找个session做一下」

ROOT 补充要求：`<alias> --help` / `-h` 只显示帮助；禁止在真实 HOME 执行无 `--run` 的切换。合同授权 worker 合并、推送、发布与更新本地安装。未改动主 checkout 的用户 `.gitignore` 修改；未读取真实凭据或秘密配置，未切换真实全局账号。

## 最终行为

- 全部 Claude `local-cliproxyapi` 类型禁止全局切换，涵盖 WorkBuddy、WorkBuddy AI、Cursor、Antigravity/agy、Codex/OpenCode Go 桥接以及未显式填写 upstream 的旧 profile。
- `switchProfile` 在读取旧账号状态、备份旧凭据、启动代理和写入任何文件之前拒绝；`activateProfile` 共用同一保护函数。提示会从别名表解析用户可用的别名与 `--run` 命令。
- 代理账号新增仍探测专用代理，只保存 profile；不再激活或更改全局 state。配置编辑遇到旧 active 代理标记时只保存配置，不重写全局设置。
- OAuth / API Key 的原有切换行为保留；Codex/OpenCode 切换代码与所有 `--run` 路径未改。
- 别名后面的 `--help` / `-h` 在处理账号前直接返回帮助；位于 `--run` / `-run` 后的参数仍交给子程序。

## 验证证据

- `TZ=UTC bun run verify`：427 pass / 0 fail，1,990 断言；文档检查、构建、打包 CLI help 通过。
- `bunx tsc --noEmit`：通过。
- 新增 11 项测试覆盖底层切换、CLI 别名与 use、旧 active 标记、配置编辑、帮助参数、API Key 正常切换。原有 OAuth 恢复与代理 `--run` 测试通过。
- `git diff --check`：通过。
- 本地安装路径：`~/.bun/install/global/node_modules/claudex-switch`；安装实际构建的 package 文件，安装命令沿用项目已有 remove-then-install 模式。
- `claudex-switch --version`：`1.26.12`。
- 下列验收使用已安装命令和完全合成的临时 HOME；检查所有 fixture 文件而非只检查 settings。

```text
workbuddy: exit=1; all fixture files byte-identical
Error: Profile "workbuddy" only supports isolated runs. Use "claudex-switch workbuddy --run" instead.
agy: exit=1; all fixture files byte-identical
Error: Profile "agy" only supports isolated runs. Use "claudex-switch agy --run" instead.
use workbuddy: exit=1; all fixture files byte-identical
Error: Profile "workbuddy" only supports isolated runs. Use "claudex-switch workbuddy --run" instead.
workbuddy --help: exit=0; all fixture files byte-identical
native -h: exit=0; all fixture files byte-identical
```

复验命令（从本 worktree 执行；脚本自行创建/删除临时 HOME，不读取真实账号）：

```sh
TZ=UTC bun run test
node tests/fixtures/proxy-no-global-switch.mjs
```

如需指定已安装命令：`node tests/fixtures/proxy-no-global-switch.mjs /Users/holden/.local/bin/claudex-switch`。

## 审查与保留

- 记录 `--without-review R0`：范围明确的拒绝切换修复，按合同自主落地；已自审共享入口、调用点、差异及现有运行路径。验收仍由 ROOT 负责。
- 保留本 worktree 供 ROOT 复验，截止 `2026-11-03T00:00:00Z`；未在 worktree 存放需保留的忽略数据。临时测试日志位于 `/tmp/claudex-no-global-switch-*`。
- 不修改共享 TODO / req_changelog / memory（派发 worker 的所有权边界）。建议 integrator 记录：用户原话见上；代理账号仅允许独立运行，v1.26.12 发布，本地安装与临时 HOME 验收通过。

## 已知问题

- 原有 activity.test.ts 在本机默认时区出现 `added` 期望 10、实际 4 的失败；UTC 单测与完整套件通过。本修复未改动活动统计逻辑。
- 默认沙箱禁止 loopback listener，完整测试需允许本机监听；未隔离运行或绕过测试 HOME 保护。
- 预期拒绝沿用 CLI 当前异常展示形式，会包含错误堆栈；退出码和操作提示符合合同。
