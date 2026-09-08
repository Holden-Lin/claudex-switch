# 本机 CLIProxyAPI：设计与使用

本功能让已有 `claudex-switch <alias> --run` 工作流可在 Claude Code 中使用 ChatGPT 登录。新增账号时完成一次独立 OAuth 登录，此后代理启动、端口选择、客户端密钥和模型映射由项目管理。既有 Claude OAuth、Claude API Key 和 Codex 账号类型保持原用途。

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
| Haiku | `gpt-5.6-luna` | 正常继承 Claude 当前设置 |
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
