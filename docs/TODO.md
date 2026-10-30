# 待办

## Now

- [x] 2026-10-30：v1.26.10 接入已实测的 agy 模型组额度与 WorkBuddy 套餐 / 积分；查不到的套餐和额度隐藏占位文字，保留有效登录与配置提示。416 项测试、类型 / 文档检查、构建通过；隔离 HOME 的构建版命令从真实接口拉数、写缓存并渲染，源登录文件哈希未变。

- [x] 2026-10-30：v1.26.9 精简 list：agy / WorkBuddy 状态去掉重复 CLIProxyAPI；OpenCode 隐藏代理状态与模型，保留套餐及额度。代理渲染回归覆盖实际 list 输出。

本次版本 v1.26.7：修 WorkBuddy 常报 `429 … 14018 Credits exhausted` / `6004`。不带 `--model` 时 Claude Code 用自身的 `claude-opus-5-5` 等 ID，旧映射把主档位指向目录第一项 Auto（`default-model`，按路由扣积分、窗口 176K），haiku 档指向 `glm-5.3-flash`（x0.08）；免费计划积分用完即 14018，而 x0.00 模型照常可用。现在目录标出免费模型时，四档默认映射到窗口最大的免费模型（WorkBuddy AI 为 `deepseek-v4.1-flash`），旧的自动付费档位迁移一次，此后手动改的付费档位保留。本地桥把 6004 写明的重置时间转成 `Retry-After`，CLIProxyAPI 只冷却到重置时刻；14018 报错改为列出仍可用的免费模型。旧版桥在代理空闲时下次启动自动重启。406 项测试、类型 / 文档检查、构建通过；真实 Claude Code 2.1.312 + CLIProxyAPI 7.3.15 + 真实 WorkBuddy 插件（合成上游）端到端核对：四档均为免费模型、6004 冷却 120 秒且上游只请求一次、14018 列出免费模型。

本次版本 v1.26.6：原生 Claude OAuth 与未显式配置 Opus 映射的 API 账号，`opus` 默认指向 `claude-opus-5-5`；已保存的 API / 本地代理映射保留。403 项测试、类型 / 文档检查和构建通过；复制 satoshi 必要配置至临时 HOME，真实 Claude Code 2.1.312 非交互 `--model opus -p` 的初始化及响应模型皆为 `claude-opus-5-5`，答 `OPUS55_OK`，源账号文件哈希未变。

本次版本 v1.26.5：Codex `terra` 指向 `gpt-6.1-terra`；新建 ChatGPT 本地代理的 Opus / Sonnet 和子代理映射也更新，已有保存的主模型映射保留。400 项测试、类型与文档检查、构建通过；隔离账号经构建版 `model cx terra` → `list --no-usage` 显示新模型。

本次版本 v1.26.4：修 WorkBuddy 报 `11101 Non-stream chat request is currently not supported`。WorkBuddy 只接受流式请求，本地桥把 Claude Code 的非流式请求改为流式再合并成完整回复（含思考、工具调用、用量）；旧版桥空闲时下次启动自动重启。400 项测试通过；真实 WorkBuddy AI 账号经新桥的非流式文本与工具调用均返回完整 JSON；真实 Claude Code 2.1.309 + CLIProxyAPI 订阅端到端脚本新增非流式与旧桥重启核对并通过。

本次版本 v1.26.3：WorkBuddy 的 auto mode 分类器默认用 `deepseek-v4.1-flash`，只写入该账号 `--run` 私有设置，账号 env 可覆盖。真实 Claude Code 2.1.309（含非 bare）核对分类请求全部走该模型。

本次版本 v1.26.2：订阅模型按目录窗口压缩。Claude Code 把未知模型 ID 当 200K，WorkBuddy 的 1M deepseek 在 40% 设置下约 72K 即压缩；现写入 `CLAUDE_CODE_MAX_CONTEXT_TOKENS` 与逐模型 `modelSettings.autoCompactWindow`，deepseek 约 392K 压缩。真实 Claude Code 2.1.309 逐模型核对有效窗口，订阅端到端脚本通过。

本次版本 v1.26.1：裸 `workbuddy` 首次使用先选国际版（workbuddy.ai）或国内版（workbuddy.cn），修复国际版账号被带到国内版登录页的问题；`workbuddy-ai` 仍直达国际版。396 项测试、类型检查通过；两版登录接口实测均返回 HTTPS 登录页，选择国际版后实际进入 WorkBuddy AI 登录流程。

本次版本 v1.26.0：支持 `workbuddy`、`workbuddy-ai`、`cursor --run --cliproxy claudecode`，复用独立订阅插件，无需安装 magpie。首次选择浏览器或原应用登录，模型菜单取账号目录，凭据及代理生命周期按账号隔离。本地转换代理默认采用官方客户端分类器兼容设置；截图 429 是独立的 agy 配额耗尽。395 项测试、1,835 断言、类型 / 文档检查及构建通过；真实 Claude Code + CLIProxyAPI + WorkBuddy 插件在合成上游完成两轮 Read，Node 与 Bun 编译版的流式回复、断线取消及代理启停皆通过。真实订阅登录仍待账号验证。

本次版本 v1.25.8：修 agy 仍报 `unknown provider for model claude-opus-5-5`。CLIProxyAPI 新启动时先给内置旧目录，数秒后才换远程目录；现等目录稳定，停用的 Claude 4.6 改到最新版，并映射 Claude Code 自身及已保存的模型 ID。升级后结束旧 agy 会话再运行 `claudex-switch agy --run --cliproxy claudecode`。

本次版本 v1.25.7：补齐 Antigravity 的模型目录同步、旧映射迁移、去重菜单与 Claude Code / Agent SDK 系统提示兼容。真实客户端与两轮工具调用已通过，发布后重开 `claudex-switch agy --run --cliproxy claudecode` 即可；若旧会话仍占用代理，先退出旧会话。

本次版本 v1.25.1：修 `claudex-switch agy --run --cliproxy claudecode` 报 `Unknown command: "agy"`（v1.25.0 的分发只在别名已存在时转运行路径，而 `agy` 首次使用要靠解析器自建别名）。发版后请用该命令实测一次 Antigravity 首用流程。

## Next

- [ ] v1.26.4：结束现有 workbuddy 会话后重新运行，确认不再出现 11101 报错。
- [ ] v1.26.2：结束现有 workbuddy 会话后重新运行 `claudex-switch workbuddy --run --cliproxy claudecode`，确认启动时无 “doesn't recognize the model” 警告，deepseek-v4.1-flash 长会话不再在约 70K 压缩。
- [ ] v1.26.1：在本人终端运行 `claudex-switch workbuddy --run --cliproxy claudecode`，区域选国际版，完成浏览器登录，核对 `/model` 并做一次短对话及 Read 调用。
- [ ] v1.26.0：在本人终端运行 `claudex-switch cursor --run --cliproxy claudecode`，完成真实订阅登录，核对 `/model` 并做一次短对话及 Read 调用；本机 Cursor 未登录、未检测到 WorkBuddy，当前证据为真实客户端配合合成上游。浏览器登录保存独立账号，原应用登录引用会跟随账号切换。

- [ ] 用户升级 v1.25.0 后跑 `claudex-switch list`，核对 `wk` 后的重置时间与各家官网/`/status` 显示一致（本次仅以测试数据验证，真实 HOME 被仓库保护拦截）。
- [ ] 用户升级 v1.24.0 后开新终端，确认 `.zshrc` 里的 `list --cached` 第一次没有走势（缓存尚未生成），第二次起出现走势且启动无明显变慢。
- [ ] 用户自行在 `~/.claude/settings.json` 加 `"cleanupPeriodDays": 3650`（本次被权限拦截，未改），否则 Claude Code 日志 30 天后被清，走势与年度统计都会缺这部分。

- [ ] 用户升级 v1.22.0 后，在默认 Codex 账号之外运行一次 `claudex-switch <另一个codex别名> -run`，在 Codex 里 `/status` 核对身份，退出后 `claudex-switch list` 确认默认账号未变、裸 `codex` 仍是原账号（本次仅在隔离 HOME 用真实 `codex login status` 验证）。
- [ ] 用户首次运行 `claudex-switch holdenx --run --cliproxy claudecode`（或 satoshix）完成浏览器登录，确认同账号核对通过、Claude Code 能对话（本次只用 fake 二进制验证；真实 OAuth 需本人操作）。
- [ ] 用户决定是否接 Antigravity：运行 `claudex-switch agy --run --cliproxy claudecode`，确认风险提示后登录，核对 `list`/`.env` 里选出的真实模型 ID 和一次短对话（本次未做真实登录）。
- [ ] 用户升级 v1.25.1 后重试 `claudex-switch agy --run --cliproxy claudecode`（v1.25.0 该命令报 `Unknown command: "agy"`，分发缺陷已修）：确认风险提示后登录，核对 `list`/`.env` 里选出的真实模型 ID 和一次短对话。升级前可用 `claudex-switch use agy --run --cliproxy claudecode`（`use` 分支不查别名表，已在已装 1.25.0 上实测可达风险提示）。
- [ ] 反向客户端：`--cliproxy codex|opencode`（让 Codex / OpenCode 经 CLIProxyAPI 用 Antigravity、OpenCode Go 等上游；Codex 需走代理的 Responses 接口）。Claude 订阅借给其它工具违反 Anthropic 条款，不做。
- [ ] 用户在 Warp 里新开 tab，确认不再卡在 "starting zsh..."（本机只在 zsh 子进程里测到启动 0.3 秒，Warp 本身未测）。
- [ ] 修复版装好后，在用户日常目录重试 `claudex-switch openlam42 -run`，确认不再出现 "configured default agent is unavailable in this location"（本机复现：私有 server 启动约 2 秒内 `/api/agent` 可 200 返空表）。

- [ ] 用户升级 v1.18.4 后运行 `claudex-switch opensatoshi -run`，确认选择器列出全部 Go 模型、切换其他模型短请求成功（真实 HOME 有防护，本次未改动该别名）。
- [ ] 用户在 v1.18.2 重试失败的第二账号 `add`，选择 Subscription 并授权它的 Go workspace，再 `-run` 发短请求、查 `/sessions`；真实订阅模型响应和计费仍待用户实测。已只读核对生产 Console 双 provider 结构与 `openlam42` 额度，并以真实 OpenCode 2.0.22 + 对应结构 fixture 验 Go 端点、OAuth 绑定、旧默认值转换和 A/B 隔离；不自行刷新已有账号。
- [ ] 拿到第二账号 key 后，在隔离 HOME 用真实 key 走一次新 `add` 导入/验证流程，再 `-run` 发短请求并查 `/sessions` A/B 隔离；本机 `openlam42` 已导入真钥并验额度，但真 key `-run` 短测仍缺。
- [ ] 在真实 HOME 上跑一次 `claudex-switch webconfig`，确认自己的账号列表和密钥显示无误（本次仅在隔离测试 HOME 中验证）。
- [ ] 用户返回后，在日常项目中运行 `claudex-switch chatgpt --run` 试用交互体验；无需为了测试主动重新登录。
- [ ] 全局 active 的 Claude 账号目前仍是 `chatgpt`（本机 CLIProxyAPI），所以裸 `claude` 会走 gpt 路由。若想让裸 `claude` 回到别的账号，由用户自行 `claudex-switch <alias>`。

## Done

- [x] 2026-10-22：修 agy 选/存 Opus 5.5 后仍报 `400 unknown provider for model claude-opus-5-5`（v1.25.8）。根因实测：CLIProxyAPI 7.3.20 启动约 2 秒先给内置旧目录（无 Opus 5.5），约 4 秒后才换远程目录，旧同步取第一份，默认停在已停用的 Opus 4.6，共享 `settings.json` 存的 `claude-opus-5-5` 无映射。现新代理等目录变化（≤12 秒），停用 Claude 版本迁至同系列最新、菜单隐藏，`modelOverrides` 覆盖 Claude Code 自身及已保存 ID。368 项测试、1,658 断言、类型 / 文档检查、构建通过；真实 Claude Code 2.1.308 + 本机 agy 代理：旧配置重现 400，新配置答 `AGY_E2E_OK`，Read 工具两轮通过。

- [x] 2026-10-21：修复 agy 选 Opus 后 `unknown provider` 及完整 SDK 请求 429（v1.25.7）。不猜模型 ID，保留完整后缀，每次启动修正失效映射；菜单由注册目录生成；采用原生系统提示兼容配置，升级不终止活跃会话。Claude Code 2.1.306 + CLIProxyAPI 8.0.30：默认 Opus、Sonnet、Gemini、连续两轮 Read、实际 `/model` 选择与 `AGY_UI_OK` 皆通过。复测脚本与脱敏证据见 `scripts/verify-antigravity.ts`、`docs/receipts/agy-claude-code-live.json`；原账号文件未改。

- [x] 2026-10-21：启动器中断时转发退出信号，并等待客户端退出后释放代理会话（v1.25.6），避免超时或终端关闭留下后台请求。360 项测试、1,607 断言、类型 / 文档检查、构建通过；构建版 CLI 隔离 HOME 实测向启动器发送 OS SIGTERM，客户端收到信号并退出、无孤儿进程、代理会话已释放。未终止的客户端仍持有会话，期间代理替换被拒绝。

- [x] 2026-10-21：Antigravity 工具历史兼容性与代理升级保护（v1.25.5）。旧 CLIProxyAPI 7.3.15 的转换会让混合文本、system/developer 提醒及签名思考块破坏工具结果顺序；相同上游回归旧版四败、新版 7.3.20 全过，相关包 339 项测试 / 子测试通过。新增 ≥7.3.19 版本守卫、`doctor --binary` 按账号替换（生命周期锁、会话保护、就绪后保存、保存失败清理），以及 HTTP 错误分流。项目 357 项测试、类型 / 文档检查与构建通过；构建版 CLI 在隔离 HOME 验证旧版拒绝、升级保留数据、429 提示及无模型强制的 Bearer 启动，均通过。离线证据见 `docs/receipts/cliproxy-tool-history-ab.json`。

- [x] 2026-10-21：修复 `agy --run --cliproxy claudecode` 模型强制及交互未登录问题（v1.25.4）。`--cliproxy` 无显式模型时不传 `--model`、不在私有配置固定主模型，仍可 `/model` 自选；本地代理统一用 Bearer token，避免 API Key 确认默认拒绝后无凭据。337 项测试、1,554 断言、类型 / 文档检查与构建通过；真实 Claude Code 2.1.305 交互复现旧错，改后无需登录、会话内选 Opus 5.5 并收到 `AGY_AUTH_OK`。

- [x] 2026-10-21：autoreview 改为默认关闭（v1.25.3），Codex / OpenCode 统一仅以 `--autoreview on` 为本次会话开启；默认显示 `Autoreview: off (default)`，不改父环境或 Codex 权限审批模式。334 项测试、1,528 断言、类型 / 文档检查、构建通过；隔离 HOME + 构建版 CLI + 假 Codex 验证 alias / use 两入口的默认、on、off 共 6 例，子进程环境与显示一致。

- [x] 2026-10-21：修复 `claudex-switch update` 将 Bun 安装误判为 npm/nvm（v1.25.2）。当 `~/.local/bin/claudex-switch` 链接到 Bun 且 `~/.local` 也是 npm prefix 时，原检测只认 bin 目录，漏认链接最终目标；现比对 Bun 全局入口的真实目标。回归覆盖外部链接、Node 解析后的包内路径，以及 Bun 共存时真正的 npm 安装仍被拒绝；334 项测试、类型 / 文档检查、构建通过，本机真实路径已正确识别为 Bun。

- [x] 2026-10-19：修 `claudex-switch agy --run --cliproxy claudecode` 报 `Unknown command: "agy"`，随 v1.25.1 发布。根因：dispatcher 仅在别名已存在时转 run 路径，而 `agy` 首次使用要靠 cliproxy 解析器自建别名，故永远走不到解析器（单测直调解析器，未覆盖 CLI 入口）。修法：带 `--cliproxy` 的 run 调用即使别名不存在亦转 run 路径，判定权归解析器；`agy` 漏 `--cliproxy` 时提示正确命令。新增 4 项 CLI 级用例；`bun run verify` 331 项 0 失败；v1.25.1 已发布，CI 绿；已装 1.25.1 实测 `agy --run --cliproxy claudecode` 达风险提示、`nope --run --cliproxy claudecode` 报 `Alias "nope" not found.`。
- [ ] 本机跑测试前先清掉 shell 里的 `OPENCODE_DB` / `OPENCODE_CONFIG_CONTENT` / `XDG_*`（OpenCode V2 受管会话残留）：不清会读真实 HOME 的 `opencode.db`，add.test.ts 与 13 项 OpenCode 用例假失败（CI 干净环境不复现）。

- [x] 2026-10-17：`list` 每周额度后加本地重置时间 `Wed16`（v1.25.0）。取已有 `weeklyResetsAt`，按最近整点取整、小时补零；无重置时间不显示。新增单测（周几/取整/补零/空值）与 list 集成断言（Claude usage API → 渲染），LA 时区复跑通过；`bun run verify` 327 项全过。

- [x] 2026-10-17：`list` 新增近 30 天 token / 源码行走势（v1.24.0）。token 取本机 Claude Code（含各 profile，按消息 id 去重）、Codex（累计值取增量）、OpenCode（原生库 + V2 私有库按消息）日志，含缓存；代码行取这些会话 cwd 对应仓库中本仓库 `user.email` 的提交，git pathspec 只 diff 源码（单仓库 9–11 秒降到 0.2–0.6 秒），排除产出目录，跨仓库按 hash 去重。后台每 10 分钟最多算一次，真实数据约 3.2 秒；临时 HOME 下构建版 `list --cached` 0.31 秒出走势。326 项测试、文档检查、构建通过。

- [x] 2026-10-16：修复受管 OpenCode 会话看不到 GLM-5.3-Flash-Free / LL Alpha Free 的问题，随 v1.23.3 发布。原因：私有会话强制禁用目录刷新，只用 OpenCode 二进制内置目录（DeepSeek Free 在内置目录中，故此前可见）；两者与 DeepSeek 同属 `opencode` provider，非 Go / Zen 前缀或价格过滤所致。修复：key 与 Console 两条路径在模型发现前共用目录准备（公共目录、5 秒超时、5 分钟缓存，按内容 SHA-256 固定快照并经 `OPENCODE_MODELS_PATH` 贯穿发现 / 路由检查 / 最终 TUI；失败保留上次有效、首次离线回退内置；不硬编码模型 ID，Go 解析、显式禁用、零价检查与压缩保护不变）。320 项测试、1,469 断言、34 个测试文件、类型 / 文档检查、构建、发布守卫通过；真实 OpenCode 2.0.30 + 临时 HOME 前后对照：原版构建缺失 GLM / LL Alpha，修复版 `/models` 可见并实际选择 GLM-5.3-Flash-Free 后退出；真实 Console 假账号完整验收通过（付费过滤、A/B 隔离、token 续期）。

- [x] 2026-10-16：修复 OpenCode V2 别名看不到免费模型，随 v1.23.2 发布。免费资格按全部输入 / 输出 / 缓存价格档位为零判断，Go 凭据与原生免费路由分离；保留显式禁用规则，并为可切换的小窗口免费模型设置会话压缩余量。315 项测试、1,433 断言、类型 / 文档检查、构建、发布守卫通过；真实 OpenCode 2.0.30 + 临时 HOME + 假 Go key：构建版 CLI → TUI `/models` 搜索并选择 DeepSeek V4.1 Flash Free → 实际对话显示 `TUI_FREE_OK`；独立无交互免费调用返回 `FREE_MODEL_OK`。真实 OpenCode + 假 Console 完整验收通过，含免费可见、付费过滤、A/B 账号隔离及 token 续期。

- [x] 2026-10-16：修复 v1.23.0 的“小窗口模型写满报错、不再压缩”代价，随 v1.23.1 发布。受管 V2 会话在起始模型有效窗口（`limit.input || limit.context`，与 OpenCode 触发公式一致；元数据缺失按 OpenCode 200K 回退）< 500,000 token 时保持自动压缩开启，写入会话级 `compaction.buffer`（约窗口 10%、不低于 OpenCode 自身 16,000 token 下限），压缩在约 90% 窗口处触发；用户自带更小但仍 ≥ OpenCode 最小余量的 buffer 维持不变；不改用户全局 `opencode.jsonc`，≥ 500,000 保留用户设置。311 项测试、1,414 断言、类型检查、文档检查、构建、发布守卫通过；3 项新/改测试在 v1.23.0 源码上失败、修复后全过。隔离 HOME + 真实 OpenCode 2.0.29 冒烟（shipped 代码生成受管内容 + 全局 `reserved=500000`）：`/api/config` 文档序为文件 `{buffer:500000}` → 内容 `{auto:true,buffer:20000}`，有效 `buffer=20000`、`auto=true`，200k 模型触发点 180000（90%）。触发点与合并公式取证：v2.0.29 bundle 字节偏移 120846611（常量）/120850886（compact）/120861715（`im()`）/120585507（`reserved`→`buffer` 归一化）/120863136（按文档序应用）。

- [x] 2026-10-16：查清并修复免费模型“无限自动压缩”，随 OpenCode V2 无交互 `run` 一起发布 v1.23.0。根因：2026-10-15 window 11 的会话 `ses_ebfdf4ea0ffevgBrO4d1Rsn4pK` 使用 `opencode/deepseek-v4.1-flash-free`（窗口 200,000），用户全局 `compaction.reserved=500000`，OpenCode 自动压缩触发点 `窗口 − reserved` ≤ 0，首条消息 27ms 后即触发压缩（session DB 记录 status=failed / reason=auto / compaction.interrupted；OpenCode 2.0.21 代码 SessionCompaction.compact 的 `im()` 触发点）。修复：受管 V2 会话在起始模型（选中模型 + 默认 agent 模型）窗口 < 500,000 token 时把 `compaction.auto=false` 写进本次 `OPENCODE_CONFIG_CONTENT`，不改用户全局配置；≥ 500,000 保留用户设置；写满窗口改为报错、不再压缩。311 项测试、1,402 断言、类型检查、文档检查、构建通过；隔离 HOME + 真实 OpenCode 2.0.21 冒烟：minimax-m2.7（204,800）与无元数据的 omen-alpha（200,000 回退）捕获到 `compaction.auto=false` 与提示行，kimi-k3（1,048,576）配置内容不含 compaction、保留用户设置；真实私有 server 合并结果为文件 `{buffer:500000}` + 内容 `{auto:false}`。
- [x] 2026-10-15：OpenCode V2 别名支持无交互一次性 `opencode run`（`claudex-switch <alias> -run run [--format json] "<提示词>"`）：`run` 与 `--standalone --auto` 置于子命令位置（根解析器拒绝子命令前的根 flag），只放行消息与 `--format` / `--thinking` / `--title` / `--file` / `--print-logs`，仍拒绝目录、resume/session（`-c` / `-s` / `--session` / `--fork`）、`--model` / `-m`、`--agent`、`--server` 与未知参数；308 项测试、1,385 断言、类型检查、文档检查、构建通过。隔离 HOME 下验证：固定版 OpenCode v2.0.6 的 `run` 参数集与 `run --standalone --auto` 布局均可解析（假 provider 仅失败在模型路由），真实 2.0.21 上构建版 CLI 的 `serve` 凭据同步与最终 `run --standalone --auto` 启动参数、私有库 / 配置环境经 shim 捕获核对，全局库哨兵未动。
- [x] 2026-10-13：`<alias> -run` 保留默认账号（Codex 私有 `CODEX_HOME`、OpenCode 不改 active 标记），版本升至 `1.22.0`。305 项测试、类型检查、文档检查、构建通过；新增用例覆盖非默认账号隔离启动（全局 auth/config/active 不变、仅 auth 私有、sessions/config 链接、首次生成条目回收到 `~/.codex`）、默认账号直连 `~/.codex` 并回写 token、私有 home 的 token 回写、中转 provider 私有 config、purge 只删链接不删共享会话。隔离 HOME 下打包 CLI + 真实 codex 0.162.1 `login status` 在私有 `CODEX_HOME` 中识别登录，全局文件哈希不变。
- [x] 2026-10-13：新增 `--cliproxy claudecode`（参考 magpie），本机 CLIProxyAPI 支持 Codex / OpenCode Go / Antigravity 三种上游，版本升至 `1.21.0`。304 项测试、类型检查、文档检查、构建通过；新增 12 项覆盖首次登录与复用、换错账号零残留、Codex 配置逐字节不变、Go 双 wire、key 轮换空闲重启、purge 租约保护等。真实 `openlam42`（Go key）经代理用 `claude -p` 实测 kimi-k3（chat）、minimax-m3（Messages）、glm-5.3 / kimi-k3 工具调用、`doctor --live` 均通过；首次实测暴露的 `x-opencode-session` 与 Messages 路由 `x-api-key` 要求已修。Codex / Antigravity 真实浏览器登录未测。
- [x] 2026-10-13：修复 zsh 启动偶发 10–33 秒（`.zshrc` 里的 `claudex-switch list` 被个别额度接口 4–10 秒超时拖住）。改为缓存 + 后台刷新，版本升至 `1.20.0`。292 项测试、类型检查、文档检查、构建通过；真实 HOME 上 `--cached` 0.15 秒出全量额度、缓存 0600 且无密钥；带尺寸 PTY 下手动 `list` 先出缓存帧、8 次原地重绘、1.8 秒结束；临时 zshrc 副本启动 0.30 秒（原 1.3–33 秒）。
- [x] 2026-10-11：修复 OpenCode V2 启动校验对 agent 清单的就绪竞态（agent 校验改轮询、超时仍 fail-closed），随 v1.19.1 发布；285 项测试、类型检查、构建通过，真实 2.0.22 探针复现空表；默认与定版 installer 双验证通过。详见 req_changelog 2026-10-11 条。
- [x] 2026-10-06：`--autoreview` 扩至 OpenCode 别名，仅设/清本次启动的 `CODEX_COMPLETION_REVIEW_DISABLED`，Claude 仍拒绝。283 项测试、`bun run verify` 通过；真实 HOME 上用 `opensatoshi`（OpenCode 2.0.21 TUI）配假 reviewer 实测：`on` 时走完 CONTINUE→改文件→STOP，`off` 时显示 `Autoreview: off (this session)` 且不审。
- [x] 2026-10-05：评审 PR #8（仅改 CI 契约脚本里非 Go 模型的报错断言，适配 v1.18.3 提前校验；两个 CI job 通过），经用户授权合并（`daa0e40`）；该提交 main CI 的 release guard 失败属未升版中间态。V2 选择器只显示历史模型：受管 provider 只暴露 overlay 列出的模型；真实 OpenCode 2.0.21 隔离实测 44 个目录 ID（含虚构 ID）均能通过启动检查，遂启动时并入在线 Go 目录（不写入历史）。282 项测试、1,180 断言、类型检查通过；真实 2.0.21 假 key 启动检查 43 个模型入选择器、耗时约 1.2 秒。PR #9 rebase 后两 CI job 通过，合并 `907c598` 并发布 v1.18.4：release workflow 成功、6 项资产、latest 为 v1.18.4、release guard 通过。
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
