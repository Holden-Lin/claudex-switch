# 本机 CLIProxyAPI：设计与使用

## WorkBuddy / Cursor 订阅

```bash
claudex-switch workbuddy --run --cliproxy claudecode
claudex-switch workbuddy-ai --run --cliproxy claudecode
claudex-switch cursor --run --cliproxy claudecode
```

`workbuddy` 是国内版，`workbuddy-ai` 是国际版；两者登录与模型目录分别保存。首次运行选择登录方式，成功后建立别名；后续直接启动 Claude Code，在 `/model` 中选择该账号目录提供的模型。未指定 `--model` 时仍由 Claude Code 选择，不强制主模型；已保存但该订阅不存在的默认模型映射到该订阅的对应档位。不同版本的模型只要仍在订阅目录中就保留。

内部复用 [Cursor](https://github.com/magpie-community/plugins/tree/main/packages/cursor) 与 [WorkBuddy](https://github.com/magpie-community/plugins/tree/main/packages/workbuddy) 独立插件，随 claudex-switch 分发，无需安装完整 magpie。插件负责订阅登录、续期和原生协议；CLIProxyAPI 负责 Anthropic Messages 转换。请求由本机发往对应订阅服务。

浏览器登录使用 claudex-switch 私有目录中的 `plugin-auth.json`（0600）。选择沿用桌面应用 / Cursor Agent 登录时，只保存引用，**之后会跟随原应用当前登录的账号**，不复制其轮换令牌；希望账号固定时用浏览器登录。`refresh <alias>` 可重新登录，取消或登录错账号不会替换原凭据；使用中的会话会阻止刷新及删除。

希望保存多个同类账号时，可先 `rename cursor cursor-work`，再运行首次命令建立另一个 `cursor` 别名。`--run` 不改变全局活跃账号。模型目录在代理启动时获取；订阅增加新模型后，结束该账号会话并运行 `doctor <alias> --restart` 刷新。已有代理供多窗口复用，不因另开窗口而重启。

验证证据：[真实客户端配合合成上游](receipts/subscription-bridge-synthetic.json)，覆盖安装命令入口、auto 模式及两个独立 Read 回合。可在构建后运行 `bun scripts/verify-subscription-bridge.ts --binary <cliproxyapi路径> --claude <claude路径>` 复测；它使用临时 HOME 和合成授权，阻断外部请求，不验证真实订阅授权或额度。

## auto mode 提示与 429 配额错误

出现 “this session isn't eligible … requests go through 127.0.0.1” 表示网关无法提供新版服务端分类器，并非模型请求失败。对于本项目的协议转换上游，默认设置 `CLAUDE_CODE_AUTO_MODE_SERVER=0`，使用 Claude Code 原有的客户端分类检查。auto mode 保持可用；这**不会获得免费的服务端分类器，也不会免除客户端分类请求的用量**。需要显式覆盖时，可在账号自定义环境变量中设置该值；切换到其他类型账号会清理本项目生成的默认值。[官方说明](https://code.claude.com/docs/en/auto-mode-classifier-billing)

截图中的 `429 / Individual quota reached / RESOURCE_EXHAUSTED` 是另一件事：Antigravity 个人配额耗尽，错误当时显示约 97 小时后重置。重启代理、重新登录及上述分类器设置都不能恢复配额；等待重置，或自行切换有可用额度的账号 / 模型。`doctor <alias> --live` 会消耗少量额度，配额耗尽时不应反复运行。

本功能让已有 `claudex-switch <alias> --run` 工作流可在 Claude Code 中使用 ChatGPT 登录。v1.21.0 起同一套代理还支持 OpenCode Go 和 Antigravity，并可通过 `--cliproxy claudecode` 直接借用已有别名的额度，见文末[「多上游与 `--cliproxy`」](#多上游与---cliproxy)。新增账号时完成一次独立 OAuth 登录，此后代理启动、端口选择、客户端密钥和模型映射由项目管理。既有 Claude OAuth、Claude API Key 和 Codex 账号类型保持原用途。

## 输出约定

```text
$ claudex-switch add chatgpt
? Account type: Claude Code · ChatGPT（本机 CLIProxyAPI）
  …安装检测、浏览器登录…
  ✓ chatgpt created  ChatGPT via local CLIProxyAPI

$ claudex-switch chatgpt --run
  ● Running claude --permission-mode auto --model gpt-6-astra --settings <私有配置路径>
```

上述为格式示例，提示符和本机路径可随终端不同。启动输出不包含生成的客户端密钥。`--model` 会按项目既有规则保存为该账号下次启动的默认模型；其后的 effort 只影响本次运行。用 `claudex-switch model chatgpt fable` 可恢复默认。

## 执行方案与配置边界

1. 在新增账号流程中提供 `local-cliproxyapi` 类型；优先检测 `cliproxyapi` / `cli-proxy-api`，macOS 缺少时允许确认后由 Homebrew 安装。不运行 `brew services`，不自行安装 Homebrew。
2. 为每个账号生成稳定 UUID，作为独立存储和代理的标识；显示别名仅指向该 profile。重命名不搬迁登录态，删除别名后复用名称不会覆盖旧账号。
3. CLIProxyAPI 自己完成 ChatGPT OAuth，不读取或复制现有 Codex 登录。先写临时认证目录，检查仅有一个有效 Codex 凭据，再替换。刷新时核验同一账号的单向身份指纹，登录失败、取消或换错账号不覆盖原登录。
4. 每账号一个回环代理，同账号的多个会话复用它，不同账号不混池。生成配置固定监听 `127.0.0.1`，使用随机客户端密钥，禁用管理接口和控制面板；密钥不会放到命令行参数。
5. `--run` 给 Claude 独立配置和凭据目录，通过私有 `--settings` 文件注入路由。保留正常配置发现，不加 `--bare`；中和继承的 OAuth token、Bedrock/Vertex/Foundry 路由，避免走错账号。
6. 列表和普通 doctor 不请求上游模型。doctor 检查本机配置、认证文件、进程归属，运行中的代理另做本机鉴权探测；`--live` 明确只验证 Luna，不代表所有模型或剩余额度均可用。
7. 并发启动、登录和生命周期操作用锁串行化；`--run` 持有会话租约，防止使用中被刷新、重启或清理。停止进程前核验其归属；不按模糊进程名杀进程。

## 模型与 FORCE 的含义

| 入口 | 映射 | effort |
|---|---|---|
| 默认 / Fable | `gpt-6-astra` | 正常继承 Claude 当前设置 |
| Opus / Sonnet | `gpt-5.6-terra` | 正常继承 Claude 当前设置 |
| Haiku | `gpt-6-luna` | 正常继承 Claude 当前设置 |
| 普通子代理 | `claudex-terra-max` → `gpt-5.6-terra` | 仅该私有别名强制 `max` |

`CLAUDE_CODE_SUBAGENT_MODEL` 设置子代理模型；`CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` 要求 Claude Code 强制使用它，包括通常自行指定模型的 Explore、Plan 等。FORCE 自身不设置推理强度，因此代理还对私有别名添加精确的 `reasoning.effort=max` 覆盖。主对话直接调用 Terra 时不匹配这条覆盖规则。

需要 Claude Code 2.1.257+；fork 模式以及 skill 子代理中显式的 `model: inherit` 仍存在继承主模型的上游例外，不能承诺所有继承机制均被 FORCE 改写。参见 [Claude Code 子代理文档](https://code.claude.com/docs/en/sub-agents)。

## 本机数据与手动配置

账号私有目录是 `~/.claudex-switch/cliproxyapi/<profile-id>/`，不是用户给别名的名称。

- `.env`：项目生成的客户端密钥和可选主模型映射，是配置源；目录 `0700`，敏感文件 `0600`。不要把它提交到版本库或粘贴到聊天中。
- `auth/`：CLIProxyAPI 的独立 OAuth 凭据。不要手动放入其他账号文件；多个凭据会被视为异常。
- `runtime.yaml`：根据私有配置生成，含仅供本机客户端使用的密钥。修改生成文件会被 doctor 识别为漂移；应修改配置源后重启。
- `claude-settings.json`：供 Claude Code 加载的私有配置文件，命令行只传其路径。

默认无需修改任何值。需要自定义时，用户可自行编辑私有 `.env` 中的 `CLAUDEX_CLIPROXYAPI_FABLE_MODEL`、`CLAUDEX_CLIPROXYAPI_OPUS_MODEL`、`CLAUDEX_CLIPROXYAPI_SONNET_MODEL`、`CLAUDEX_CLIPROXYAPI_HAIKU_MODEL`。不要随意更换 `CLAUDEX_CLIPROXYAPI_CLIENT_API_KEY`；停止相关会话，重启代理，再运行账号。子代理的 Terra/max 规则固定，不提供账号池或远端代理部署设置。

代理以该私有目录为工作目录，并清理上游远端凭据存储、部署和管理环境变量；项目工作目录的 `.env` 不会被 CLIProxyAPI 当作部署配置加载。正常网络代理环境变量仍可继承。

## 登录失败与日常维护

### 工具调用后报 400 / concurrency

这条错误不一定意味着实际运行了多个工具。CLIProxyAPI 7.3.15 的 Antigravity 转换会把提示文本放在工具结果之前，导致上游认为结果未紧接调用；一个 Bash 也可触发。7.3.19 的[上游修复](https://github.com/router-for-me/CLIProxyAPI/commit/3de5709db14c43e147025bcc27ae61ff4821fc0d)同时处理混合文本、system/developer 提醒与带签名思考块的结果顺序。

Antigravity 现在要求可识别的 CLIProxyAPI 稳定版 ≥ 7.3.19，本项目验证过 7.3.20。启动及 `doctor` 会拦截已知旧版；不靠关闭工具并发或自动重放工具来规避。`claudex-switch update` 只更新管理器，不会自动升级外部代理。

先从[官方 v7.3.20 资产](https://github.com/router-for-me/CLIProxyAPI/releases/tag/v7.3.20)下载对应系统的二进制，并按同页 `checksums.txt` 校验。结束该账号的会话后执行：

```bash
claudex-switch doctor agy --binary /path/to/cli-proxy-api
claudex-switch agy --run --cliproxy claudecode
```

替换只影响该账号，保留模型映射、客户端密钥及上游登录。操作与会话启动共用生命周期锁：有会话时拒绝，验证新进程就绪后才保存路径，保存失败会清理新进程。不会改 Homebrew 的全局二进制。

启动器收到 SIGTERM 或 SIGHUP 时会转发给客户端，并等客户端退出后释放会话。非交互环境的 SIGINT 也会转发；交互终端的 Ctrl-C 由终端直接送达客户端，避免重复发送。这样超时或关闭终端时不会因启动器先退出而提前释放代理会话。

旧会话若仍重复发送已损坏的历史，可用 `/rewind` **只回退对话**到失败工具之前；工具可能已经执行，不应自动重放。新会话也会保留磁盘上的改动。`doctor --live` 只检查最小模型请求；429 会单独提示上游限流或资源不足，不能用反复重登、重启解决。

离线验收：[对照结果及校验和](receipts/cliproxy-tool-history-ab.json)、[macOS arm64 复现脚本](receipts/cliproxy-tool-history-reproduce-macos-arm64.sh)。同样五例中旧版四败、修复版全过；另有相关翻译器包 339 项测试及子测试通过。这不代表所有可能的 400 都已消除。

CLIProxyAPI 7.2.x 的 Codex 授权地址固定回到 `localhost:1455/auth/callback`；部分版本即使接受自定义 callback-port，授权地址仍不跟随。项目因此使用真实的 1455 端口，登录前检查占用，并将多个登录请求串行化。遇到端口冲突时先结束占用该端口的登录进程，再运行 `claudex-switch refresh <alias>`；不要分享包含 `code` 的回调地址。

`doctor --restart` 只重启对应账号的代理，并可从有效私有配置重建生成文件；它不能替代登录或修复账号额度。建议日常始终使用 `--run`：单独全局切换后直接运行 `claude` 不持有项目会话租约，手工重启代理后也应重新执行别名切换以同步本机端口。

`remove` 仅删除别名，保留底层登录；`purge` 经确认后删除该账号及关联别名、凭据与管理文件，并停止经过归属核验的空闲代理，不卸载共享 CLIProxyAPI。通过 `--run` 运行的会话未结束时会拒绝清理。

## 验收记录（2026-09-08）

- 自动化回归：`bun run verify`，164 项通过、0 失败、554 个断言；`bunx --no-install tsc --noEmit`、`git diff --check` 通过。
- 实机：Claude Code 2.1.263、Homebrew CLIProxyAPI 7.2.150；另校验过官方 7.2.154 二进制及校验和。
- 真实浏览器登录完成，真实 ChatGPT 上游分别通过 GPT-6、Terra、Luna 的最小调用；默认主模型恢复为 GPT-6。
- 真实 Claude Explore 子代理读取测试项目的 CLAUDE.md 并返回标记；统计为启动 1、完成 1、失败 0、无权限拒绝，主对话及子代理分别使用 GPT-6 与私有 Terra 别名。
- 原生代理配合本机假上游，直接检查转换后的请求体：主对话 `low` 保持不变，子代理为 Terra `max`；实际经过项目 `--run` 和 `-run` 两个入口，Agent/Skill 工具及项目指令发现保留，全局配置不被隔离运行改写。
- 原生生命周期测试覆盖同账号并发复用、不同账号密钥与端口隔离、权限、会话租约阻止清理、空闲清理不影响另一账号、受控重启。
- 不把 Claude 输出中的估算美元金额当成 ChatGPT 订阅账单；本功能未实现该账号类型的额度查询。保留 MCP 配置发现不等于已经逐个调用用户所有外部 MCP 服务。

本功能仅为第三方兼容桥接；官方 ChatGPT 登录支持不代表官方保证此桥接长期可用。上游模型、OAuth 或请求协议变化可能需要后续维护。参考：[CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI)、[OpenAI 登录说明](https://learn.chatgpt.com/docs/auth)。

## 多上游与 `--cliproxy`

`claudex-switch agy --run --cliproxy claudecode` 等带 `--cliproxy` 的启动，在没有显式 `--model` 时不传模型参数，也不在私有配置中固定主模型；可在 Claude Code 中用 `/model` 选择。显式 `--model` 和普通代理别名启动仍沿用原规则。

代理生成的本地客户端密钥通过 `ANTHROPIC_AUTH_TOKEN` 传递，并清空继承的 `ANTHROPIC_API_KEY`，避免 Claude Code 弹出默认拒绝的 API Key 确认框。Antigravity 已登录而 Claude 提示 `Not logged in` 时，先升级并重新运行上述命令，无需在 Claude 中重新 `/login`。此处是 Claude 到本地代理的认证，上游登录仍由 CLIProxyAPI 管理。参见 [Claude Code 网关认证说明](https://code.claude.com/docs/en/llm-gateway-connect#conflicts-with-an-existing-login)。

参考 [magpie](https://github.com/yetone/magpie) 的思路：本机 gateway 做协议翻译，订阅本身充当 provider。本项目沿用每账号一个 CLIProxyAPI 的生命周期（UUID 目录、私有 `.env`、端口、锁、租约、归属校验、隔离 `--run`），只把上游差异收进 `src/providers/cliproxyapi/upstreams.ts`。

```text
$ claudex-switch cx --run --cliproxy claudecode        # 别名 = 额度来源；Claude Code 只是客户端
  First use: Claude Code needs its own ChatGPT login for cx (once).
  ● Running claude --permission-mode auto --model gpt-6-astra --settings <私有配置路径>
```

| 上游 | 来源 | 登录 | 运行配置要点 |
|---|---|---|---|
| Codex / ChatGPT | Codex 别名（仅 ChatGPT 登录） | 首次自动 `-codex-login`，必须与别名同一 `chatgpt_account_id`（无则比 email） | 与 v1.20 逐字节相同，含 Terra/max 子代理别名 |
| OpenCode Go | key 型 Go 别名 | 无；每次启动从 Go 别名读 key | `openai-compatibility`（`https://opencode.ai/zen/go/v1`）+ `claude-api-key`（`https://opencode.ai/zen/go`，MiniMax / Qwen / claude-*，附 `x-api-key`），两者都把 Claude Code 的 `X-Claude-Code-Session-Id` 转成 Go 要求的 `x-opencode-session` |
| Antigravity | 关键字 `agy` / `antigravity` | 风险确认后 `-antigravity-login`（回调 51121） | 每次启动从 `/v1/models` 校正映射；保留完整模型后缀，并配置 Claude Code / Agent SDK 系统身份提示兼容 |

### Antigravity 模型与 Claude Code 兼容

v1.25.7 起，每次启动核对代理当前注册的模型 ID，保留仍有效的自定义映射，修正旧映射。例如代理提供 `claude-opus-5-5-high` 时，旧 `claude-opus-5-5` 会迁移为完整 ID；显式 `--model claude-opus-5-5` 也会解析到该版本的已注册变体。目录暂不可用时短暂重试，失败则停止启动，不再保存猜测值或要求重新登录。

v1.25.8 起，新启动的代理会先等待目录稳定。CLIProxyAPI 7.3.20 启动约 2 秒先返回二进制内置的旧目录（只有已停用的 Opus / Sonnet 4.6），约 4 秒后换成远程目录（含 `claude-opus-5-5-high`、`claude-sonnet-5-5-high`）。旧版取第一份目录，于是默认映射停在 Opus 4.6，`claude-opus-5-5` 无对应项。若共享 `settings.json` 用 `/model` 存了该默认值，就报 `400 unknown provider for model claude-opus-5-5`。现在最多等 12 秒，目录变化即继续；已运行的代理不再等待。此外：
- 有新版本时，旧 Claude 版本的档位映射改到同系列最新版；Gemini 等其它系列仍按原设定。
- `/model` 菜单隐藏已被取代的 Claude 版本，因为它们只回复 "no longer available"。
- `modelOverrides` 把 Claude Code 自己的 ID（`claude-opus-5-5`、`claude-sonnet-5-5`、`claude-haiku-5-5`、`claude-fable-5-1`、已保存的 `/model` 默认值）映射到代理的真实 ID。

Claude Code ≥2.1.242 的 `/model` 菜单由本次目录生成，显示完整 ID、去除重复的 Fable→Opus 项，并列出 Gemini 等文本模型。图片模型不放入编码会话菜单。更早客户端仍使用四档环境变量映射。目录表示代理注册情况，不保证账号对每个模型都有使用资格；上游权限及额度错误仍保留。

另一个已复现问题是：最小请求成功，完整 Claude Code / Agent SDK 请求却返回 `429 RESOURCE_EXHAUSTED`。本机四项对照中，去掉工具、思考参数、降低输出上限均无效，去掉系统提示后成功。现使用 CLIProxyAPI 原生 `antigravity.sensitive-words`，对系统提示中的 `Claude Agent SDK` / `Claude Code` 插入零宽字符；用户消息及工具结果由原生代理保持原样。该行为可在账号私有 `.env` 的 `CLAUDEX_CLIPROXYAPI_ANTIGRAVITY_SENSITIVE_WORDS` 配置，逗号分隔，设为空则关闭。已有代理需结束旧会话后重新启动，运行中的会话不会被升级过程终止。此兼容不能保证绕过所有未来的上游变更，也不消除首次登录已提示的账号使用风险。

社区参考：[CLIProxyAPI 模型后缀问题](https://github.com/router-for-me/CLIProxyAPI/issues/6366)、[Agent SDK 429 与原生兼容配置](https://github.com/router-for-me/CLIProxyAPI/issues/5695)、[magpie 的系统提示对照调查](https://github.com/yetone/magpie/issues/666)。本项目沿用现有代理生命周期，无需另装一套网关。

真实验收：Claude Code 2.1.306 + CLIProxyAPI 8.0.30，经构建版 CLI 验证默认 Opus、Sonnet、Gemini 流式对话及两轮 Read 工具调用；实际 TUI 菜单去重并显示完整 ID。证据见[验收结果](receipts/agy-claude-code-live.json)。复测使用 `bun scripts/verify-antigravity.ts --auth-dir <现有代理的auth目录> --binary <代理路径> [--claude <客户端路径>]`；脚本只复制登录到临时 HOME，结束后清理，真实调用会消耗少量上游用量，不读取 `.env` 或修改原账号文件。

设计取舍：

- **链接而非别名**：Codex / Go 侧建一个不挂别名的内部 Claude profile `cliproxy-<uuid>`，映射存在 `~/.claudex-switch/cliproxy-links.json`（0600），键是 accountKey / profileId，改别名不影响。它不会成为全局活跃 Claude 账号，`import` 也跳过它。Antigravity 没有对应 provider，所以首次使用直接建一个带别名的 Claude 账号。
- **Codex 不共用登录**：ChatGPT refresh token 轮换，共用会让一方失效，因此为 Claude Code 单独登录一次，并用 registry 里的非机密 `chatgpt_account_id` 核对身份。
- **Go key 单一来源**：key 只认 Go 别名。变化后改写私有 `.env`；启动前如代理空闲且 `runtime.yaml` 与当前生成结果不一致，就停掉它再按新配置启动（`stopStaleManagedCLIProxyAPI`，同样覆盖今后模板变化）；有会话在用时保留旧进程并提示。
- **子代理**：只有 ChatGPT 上游固定 `claudex-terra-max`；其它上游不设 `CLAUDE_CODE_SUBAGENT_MODEL` / `FORCE`，并在私有 settings 中置空，以免沿用全局 ChatGPT 账号留下的值。
- **生命周期**：`purge` 上游别名先删其链接的代理，有会话租约时整体拒绝；`remove` 只删别名。`doctor <上游别名>` 诊断链接的代理。
- **不做**：Codex / OpenCode 作为客户端（`--cliproxy codex|opencode`）留待后续；把 Claude 订阅借给其它工具违反 Anthropic 条款，不做。Go 浏览器订阅登录没有静态 key，暂不支持。

### 验收记录（2026-10-13）

- 自动化：`tests/cliproxy-link.test.ts` 12 项，覆盖首次登录与复用、换错账号零残留、Codex `runtime.yaml` 逐字节 golden、Go 双 wire 与会话头、key 轮换后空闲重启、订阅型 Go 拒绝、Antigravity 风险确认与模型选择、Claude 别名拒绝、`-run` 不切 Codex 且模型存到链接、purge 租约保护、list 标签。全量 304 项通过。
- 实机（OpenCode Go，真实 key 型别名，CLIProxyAPI 7.3.15）：`-p` 短请求依次通过 `kimi-k3`（chat）、`minimax-m3`（Messages）、`glm-5.3` 与 `kimi-k3` 的 Read 工具调用；`doctor --live` 用 `deepseek-v4-flash` 通过。首次请求暴露的两个上游要求（`x-opencode-session`、Messages 路由读 `x-api-key`）已补上并实测。
- 未实测：Codex 与 Antigravity 的真实浏览器 OAuth 需用户本人操作（fake 二进制已覆盖流程；CLIProxyAPI 源码确认 Codex 凭据 `account_id` 取自 id_token 的 `chatgpt_account_id`，Antigravity 凭据 `type: "antigravity"`、默认回调 51121）。
