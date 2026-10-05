# 待办

## Now

待发 v1.18.4（PR 待合并）：V2 key 别名的 TUI 模型选择器列出完整 Go 目录，可切换模型。先合 PR #8 修复 main CI 契约断言，再合本 PR 并打 tag。

## Next

- [ ] 用户升级 v1.18.3 后运行 `claudex-switch opensatoshi -run`，确认提示已更正默认模型为 `opencode-go/glm-5.3-flash`、TUI 选择器只剩小写 ID 且短请求成功（真实 HOME 有防护，本次未改动该别名）。
- [ ] 用户在 v1.18.2 重试失败的第二账号 `add`，选择 Subscription 并授权它的 Go workspace，再 `-run` 发短请求、查 `/sessions`；真实订阅模型响应和计费仍待用户实测。已只读核对生产 Console 双 provider 结构与 `openlam42` 额度，并以真实 OpenCode 2.0.22 + 对应结构 fixture 验 Go 端点、OAuth 绑定、旧默认值转换和 A/B 隔离；不自行刷新已有账号。
- [ ] 拿到第二账号 key 后，在隔离 HOME 用真实 key 走一次新 `add` 导入/验证流程，再 `-run` 发短请求并查 `/sessions` A/B 隔离；本机 `openlam42` 已导入真钥并验额度，但真 key `-run` 短测仍缺。
- [ ] 在真实 HOME 上跑一次 `claudex-switch webconfig`，确认自己的账号列表和密钥显示无误（本次仅在隔离测试 HOME 中验证）。
- [ ] 用户返回后，在日常项目中运行 `claudex-switch chatgpt --run` 试用交互体验；无需为了测试主动重新登录。
- [ ] 全局 active 的 Claude 账号目前仍是 `chatgpt`（本机 CLIProxyAPI），所以裸 `claude` 会走 gpt 路由。若想让裸 `claude` 回到别的账号，由用户自行 `claudex-switch <alias>`。

## Done

- [x] 2026-10-05：评审 PR #8（仅改 CI 契约脚本里非 Go 模型的报错断言，适配 v1.18.3 提前校验；两个 CI job 通过），可合并，但自动模式拦截了 agent 合并，留给用户。V2 选择器只显示历史模型：受管 provider 只暴露 overlay 列出的模型；真实 OpenCode 2.0.21 隔离实测 44 个目录 ID（含虚构 ID）均能通过启动检查，遂启动时并入在线 Go 目录（不写入历史）。282 项测试、1,180 断言、类型检查通过；真实 2.0.21 假 key 启动检查 43 个模型入选择器、耗时约 1.2 秒。
- [x] 2026-10-05：合并远端 v1.17.0–v1.18.2 并解决 TODO 冲突；修复 key 型 Go 别名把显示名 `GLM-5.3-Flash` 当模型 ID 发给上游被拒的问题：`model`、`-run --model` 与已存默认值均按官方 Go 目录（与订阅路径共用抽取的 catalog 模块）解析，未知模型拒绝并列出可选；V2 历史去大小写重复。281 项测试、1,177 断言、类型 / 文档 / 构建通过；隔离 HOME 下打包 CLI 对真实目录验证显示名、含空格名转换及未知模型拒绝。
- [x] 2026-10-04：修正 v1.18.0 把 Console OAuth integration `opencode` 误当 Go model provider 的错误，Go 使用 `opencode-go` 与原生 Go 端点，排除同名 Zen 模型；旧默认值显示和启动均转 Go，无需重新登录。277 项测试、1,163 断言、类型 / 文档 / 构建 / 发布守卫通过；原生 2.0.22 双 provider fixture 14 项验收通过，包括正常 Node 脚本入口无 SQLite 警告。PTY 检查发现 Bun 入口乱码，已恢复 Node；无 sqlite3 的 Node SQLite 回退也验证无实验性警告，其他警告仍保留。`openlam42` 真额度与截图相符，用户确认只看剩余，无须改显示；只读诊断未刷新或写入真实凭据。
- [x] 2026-10-04：完成 OpenCode 浏览器订阅入口；273 项测试、1,144 断言、类型检查、文档检查、构建与发布守卫皆过；真实 OpenCode 2.0.22 在隔离 HOME 的 13 项模拟 Console 验收全过。覆盖 A/B 登录与额度、原生 token 轮换、绑定恢复、错误账号 / 无订阅 / 取消拒绝、刷新保留历史、打包 CLI list 和 -run；运行中 purge 保留账号，正常退出 / 启动失败均释放锁。版本升至 `1.18.0`，未读写真实账号。
- [x] 2026-10-04：OpenCode Go `add`/`refresh` 支持显式导入本机 OpenCode V2 库中 `opencode-go` 凭据，并在保存前以 usage 端点验证（401/403 重试、离线告警仍存）；用户 `openlam42` 已用原生真钥修好并验证额度。262 项测试、文档检查、构建通过；隔离 HOME PTY 实测无效 key 被拒且不落盘；版本升至 `1.17.0`。
- [x] 2026-10-02：完成 v1.16.0 发布前验证并发布：CI 离线合同（固定 OpenCode 2.0.6）与本机 macOS 合同（真实 OpenCode 2.0.21、假 key，覆盖私有 API 连接、启动配置、A/B 库隔离、`/connect` 恢复、refresh 同步、fail-closed 及无 key 日志）皆过；254 项测试 1,044 断言、类型检查、文档检查、构建通过。真实 key 短测因暂无 key 未做。四平台安装包及 Homebrew 配方经 tag workflow 发布。发布后校验：macOS arm64 下载校验和相符、含两份许可、`--version` 得 `1.16.0`、隔离 HOME 离线 JSON 得空清单；本地 Formula 与发布资产一致，release guard 通过。本次验证下载该安装包 1 次，曝光统计应排除。
- [x] 2026-10-02：按隔离验收包核对并合并 [PR #6](https://github.com/Holden-Lin/claudex-switch/pull/6)：候选补丁 SHA-256 相符、应用后 git tree 与 head `433359c` 逐字节一致，本机 254 项测试 1,044 断言、类型检查、文档检查、142 模块构建与 CLI help 通过，CI run #120 双 job 成功；合并提交 `688c3e2`，main 已同步，版本升至 `1.16.0`（暂不发布）。
- [x] 2026-10-01：v1.15.0 已发布并设为 latest，四平台安装包和 Homebrew 配方齐备，release workflow 与 main CI 通过；macOS arm64 下载校验和、许可文件、版本及隔离 HOME 离线 JSON 验证通过。本次验证下载该安装包 1 次，曝光统计应排除。
- [x] 2026-10-01：审核并合并 [PR #5](https://github.com/Holden-Lin/claudex-switch/pull/5)，本地 main 已同步；审核验证为 232 项测试、895 断言、类型检查及打包许可文件核对通过。
- [x] 2026-09-30：完成 v1.14.0 发布前验证：230 项测试、855 断言、类型检查、文档检查、构建及隔离 HOME 下打包 CLI 的离线 JSON 输出通过；通过 tag workflow 发布四个平台安装包及 Homebrew 配方。
- [x] 2026-09-30：Codex `sol` 默认指向 `gpt-6.1-sol`；版本升至 `1.13.2`。221 项测试、类型检查、构建及隔离 HOME 下打包 CLI 的模型保存、启动和下次默认读取验证通过。
- [x] 2026-09-29：Codex `-run` 默认使用 `--approve-for-me`（workspace-write sandbox + Auto-review），不再默认 Full Access；`--autoreview` hook 仍独立；版本升至 `1.13.1`。221 项测试、786 断言、类型检查、构建与 CLI 帮助验证通过。
- [x] 2026-09-25：Codex `-run` 增 `--autoreview on/off`，仅控制本次子进程；版本升至 `1.13.0`。221 项测试、类型检查、构建、发布守卫及临时 HOME / 假 Codex / Stop hook 联测通过。
- [x] 2026-09-23：本机 CLIProxyAPI 的 haiku 默认映射升为 `gpt-6-luna`，旧账号自动沿用；CLIProxyAPI 升至 7.3.15，真实 `doctor --live` 通过；版本升至 `1.12.4`。
- [x] 2026-09-23：新增 Opus 5.5 / GPT-6 Sol、Luna 模型别名（`sol`/`luna` 改指 GPT-6，新增 `astra`，裸 `fable` 指 Fable 5.1）；版本升至 `1.12.3`，213 项测试 0 失败。
- [x] 2026-09-15：更新检查增加 GitHub Releases API 备用查询，兼容 release URL 尾斜杠；版本升至 `1.12.2`；210 项测试 0 失败。
- [x] 2026-09-15：OpenCode `-run` 默认以 `--auto` 启动；版本升至 `1.12.1`，209 项测试 0 失败。
- [x] 2026-09-14：OpenCode Go 的 `list` 改显服务端 5 小时 / 周 / 月剩余额度，删去私有凭据/共享历史提示；真实端点无鉴权返回 401，209 项测试 0 失败。
- [x] 2026-09-14：OpenCode Go 改为私有凭据、全局共享会话历史；不同别名均可在 `/resume` 继续同一会话。真实 CLI 以 `OPENCODE_AUTH_CONTENT` 注入假凭据识别为 Go，49 项针对性测试 0 失败。
- [x] 2026-09-14：新增 OpenCode Go 订阅账号：可私有导入现有凭据或在原生 TUI `/connect` 登录，`-run` 以每账号独立 XDG 数据目录启动 TUI；205 项测试 0 失败，真实本机 `opencode` 1.18.30 隔离数据目录验证通过。
- [x] 2026-09-10：`webconfig` 分区标题加 `+` 新增账号（Claude / Codex API Key），抽 `src/accounts/create.ts` 供 CLI add 与网页共用。199 项测试 0 失败，浏览器实测两条创建路径 + 校验失败路径。余下三种需浏览器授权的类型（Claude OAuth / Codex ChatGPT / 本机 CLIProxyAPI）待做。
- [x] 2026-09-10：`webconfig` 账号行加铅笔改别名 + 删除（purge 语义，二次确认列出代价）；抽 `src/accounts/purge.ts` 供 CLI 与网页共用，别名校验收敛为一处。190 项测试 0 失败，浏览器实测改/删/取消/拒绝四条路径。
- [x] 2026-09-10：新增 `claudex-switch webconfig` 本机网页，批量查看/修改账号配置；Claude 账号支持自定义 env 与子代理/Fable 模型字段。181 项测试 0 失败，浏览器实测两类账号保存均落盘。
- [x] 2026-09-10：修复 API Key 账号 `-run` 被全局 `~/.claude/settings.json` 路由劫持；改为注入 0600 私有 `--settings` 文件。真实 deepseek 会话验证通过，165 项测试 0 失败。
- [x] 2026-09-08：本机 CLIProxyAPI 已合入；最终回归 164 项通过、0 失败，类型检查、构建、打包命令和发布版本检查通过。
- [x] 2026-09-08：完成真实 ChatGPT 登录、GPT-6/Terra/Luna 调用、Explore 只读子任务；原生请求体确认主模型 effort 与 Terra/max 子代理互不干扰。详见 [验收说明](local-cliproxyapi.md)。
