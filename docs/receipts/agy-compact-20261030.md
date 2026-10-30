# agy 压缩阈值修复回执

- Dispatch：`CLAUDEX-AGY-COMPACT-20261030`；contract SHA256：`1459cb8915287b512cd7918dbab4c9c2c37f91d6b5e675f82414bd6a42ccf6ce`。
- 用户原话（contract goal_source，10-30）：「claudex-switch：agy claudecode里用opus,可能因为agy里opus context window小，可能不需要指定压缩率（直接100%就行）。让holdenx做」
- Worker 决策：只在 agy 本次会话的托管设置清空 `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`，覆盖全局及 profile 的 40；不改全局设置。开关按会话生效，agy 内切换 Sonnet / Gemini 也使用默认阈值。其他上游及订阅窗口保持原逻辑。
- 实查修正猜测：CLIProxyAPI 7.3.20 内嵌旧 Opus 4.6 为 200K；[当前公共目录](https://raw.githubusercontent.com/router-for-me/models/refs/heads/main/models.json)的 Opus 5.5 high 为 1M。不能把 agy 的当前 Opus 一概视为小窗口。本次不另改 Claude Code 的窗口识别。
- [Claude Code 文档](https://code.claude.com/docs/en/env-vars)及本机 2.1.314 的真实阈值函数均表明：百分比只能提前压缩，100 与清空相同，仍保留正常摘要余量。执行二进制内的真实函数：有效窗口 200K 时 40→80K、清空/100→187K；1M 时 40→400K、清空/100→987K。此处是给定有效窗口的计算结果，不声称实际 agy 会话已测出该窗口。
- 验证：409 tests / 1915 assertions、TypeScript 检查通过；含 agy、Codex、OpenCode 启动路径及三个订阅上游，检查 agy 清空、其它上游保留继承值、全局文件不变。发布前 `bun run verify` 检查文档、全量测试、重建 dist 和构建版 help。
- 配置生成：应用真实生成函数 + 临时 agy profile + 当前真实公共模型目录 + 已保存 `claude-opus-5-5`，写出的 `env.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` 为 `""`，模型映射为 `claude-opus-5-5-high`。没有付费请求。证据 `/tmp/agy-compact-isolated-result.json`；生成文件路径记在证据中。
- 限制：现有真实账号文件重新生成被自动审批拒绝，因为脚本读取并复用其中的认证 token，与 contract 禁读凭据边界冲突。未执行该脚本，未修改真实账号设置。需用户另行授权后才能完成这一项实账号验证；下次正常启动会走已验证的生成函数。
- Review：`--without-review R0`，单个上游的三行配置修复；worker 自检确认覆盖顺序在 profile extra env 之后，其他上游不写该键，未修改 Codex / WorkBuddy / OpenCode 的窗口或压缩策略。
- 发布：需要 v1.26.8 补丁版，dist 随版本重建；tag 推送后由现有 CI 生成 Release、assets 及 Homebrew formula。
- 交给 ROOT 的 TODO 建议：记入 v1.26.8 agy 恢复默认压缩阈值；保留本回执的实账号验证限制。共享 TODO / req_changelog 由 ROOT 集成，本 worker 不修改。
