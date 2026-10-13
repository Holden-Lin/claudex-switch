# 本机 CLIProxyAPI：设计与使用

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
| Antigravity | 关键字 `agy` / `antigravity` | 风险确认后 `-antigravity-login`（回调 51121） | 仅公共头部；登录后从代理 `/v1/models` 选默认映射 |

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
