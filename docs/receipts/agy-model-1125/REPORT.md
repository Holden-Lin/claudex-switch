# AGY 原生终端的模型选择修复

结论：已修复，修复在提交 `980de20`（分支 `fix/agy-model-1125`，未合并、未推送、未发版）。用修复后的构建在真实环境做了只读验证：`claudex-switch agylam42 --run` 的横幅显示 `claude-opus-5-5-high`，`claudex-switch agy -run --model gemini-4-neon xhigh` 的横幅显示 `Gemini 4 Neon (XHigh)`，都没有发消息。

需要发补丁版本。已安装的 v1.29.5 下，所有带档位后缀的 Gemini 模型发消息都会 400。`agy` 账号保存的默认模型 `gemini-3.8-flash-high` 也在其中。

## 合同

- Dispatch：`CX-AGYMODEL-1125`；合同 `CX-AGYMODEL-1125-v1`，SHA256 `6f23bdd36a0affede79ef949bd129a9fbec16c4a85bd92ef4db727387249bc0f`，已核对。
- 需求原话（引自合同）：「还是不对。用opus high解决一下」，附截图。
- 边界：未读取任何账号凭据、token 或登录文件内容；读代理私有配置时只用脚本取模型字段。没有删除登录，没有发版或推送。

## 根因（三个，相互独立）

1. **agy 网关模式会去掉 Gemini 的档位后缀（400 的来源）。** 在本机用 agy 1.5.17 和假网关逐个实测了真实目录里的每个模型。agy 对 `gemini-*-(low|medium|high|xhigh)` 发出的请求路径是基名，档位改放在 `thinkingLevel` 里。例如 `gemini-4-neon-xhigh` 发成 `gemini-4-neon` 加 `XHIGH`。Claude、gpt-oss、`-tiered`、`-lite` 原样发送。agy 自己的更新日志里也写了这条：「no longer leaves the Low, Medium, or High suffix in the model ID it sends to the gateway」。CLIProxyAPI 的 Antigravity 目录里只有带后缀的 ID，所以返回 `unknown provider for model gemini-4-neon`。名字不是被 claudex-switch 截断或存坏的：两个账号保存的模型名都是完整的，例如 `gemini-3.8-flash-high`。
2. **claudex-switch 把参数原样交给 agy。** `--model gemini-4-neon xhigh` 里的 `xhigh` 变成 agy 的多余参数（报 unexpected argument）。`--effort` 也原样传了过去，可网关目录里每个 ID 已经带档位，agy 就拒绝这个 effort，回落到 settings 里存的模型：日志显示 `Gemini 4 Neon (Medium)` 又被解析成目录第一项 `claude-opus-4-6-thinking`。
3. **agy 启动早期会回落到自己的 settings.json（截图那次）。** agy 在网关目录加载前先解析 `--model`。日志里每次都有 `failed to apply model override ... not recognized as a known model`，这时它先用 `~/.gemini/antigravity-cli/settings.json` 里存的 `model`，当时是 `Gemini 4 Carbon (High)`，之后才切到 `--model`。截图那次（日志 `cli-20261125_171128.log`）后端其实收到了 `claude-opus-5-5-high`。但那次 agy 恢复了一个被中断的会话，并报了 `unknown model key MODEL_PLACEHOLDER_M535`，界面停在了 Carbon。这是偶发竞态：我在真实环境用已安装的 1.29.5 重跑，横幅是正确的。

问题不是 v1.29.4/1.29.5 带来的。参数原样透传是 v1.29.4 的「原生 AGY 绑定别名账号」（`630aae9`）引入的；去后缀是 agy 自己网关协议的行为，只要走网关就会出现。

## 改动

- **代理别名**（`src/providers/cliproxyapi/managed.ts`、`upstreams.ts`）：Antigravity 账号的 runtime.yaml 里新增 `oauth-model-alias.antigravity`，把基名映射到目录 ID，例如 `gemini-4-neon` → `gemini-4-neon-xhigh`，并设 `fork: true` 保留原 ID。这是 CLIProxyAPI 文档里给 antigravity 的同款用法。
  - 别名随目录同步生成：同一系列有多个档位时，基名指向最高档；目录里已经有真实基名的，不建别名。
  - 守护进程正在运行、而配置只差别名块时，就地改写配置，靠 CLIProxyAPI 热加载生效，并在 5 秒内确认别名出现在模型列表里。超时会报错，报错给出原因和命令 `claudex-switch doctor <alias> --restart`。其他任何配置差异仍按漂移拒绝。8.x 追加的 `server-id` 块会保留。
  - 代理会把别名也列在 `/v1/models` 里，同步目录时按配置里的别名剔除，所以 agy 和 Claude Code 看到的仍只是账号自己的 ID。
  - 7.3.20 和 8.1.2 两个真实二进制都实测过热加载：日志有 `oauth-model-alias[antigravity]: added (1 entries)`。
- **参数规范化**（`src/commands/run.ts`）：
  - 下面几种写法都收敛成一个目录 ID，统一用 `--model <ID>` 传给 agy，不再传 `--effort`：`--model X [effort]`、`--model "X effort"`、`--model=X`、`--effort X`、`--effort=X`。规则是去掉已有档位后接 effort，例如 `gemini-4-neon-high` 加 `xhigh` 得到 `gemini-4-neon-xhigh`。
  - 不带 `--model` 时用账号保存的模型。账号目录里没有的档位或模型直接报错，并列出可选档位或模型，不会悄悄换模型。
- **会话级 settings**：先用同一套网关环境跑 `agy models`，取到该 ID 的 agy 显示名（实测约 0.3–1 秒），再传 `--settings '{"model":"<显示名>"}'`。这样早期回落与 `--model` 是同一个模型。
  - agy 的说明是 `--settings`「Settings for this session only, never saved」。实测运行后用户的 settings.json 仍是 `Gemini 4 Carbon (High)`。
  - 用户自己传了 `--settings` 时不追加。拿不到显示名时只传 `--model`。
  - settings 里写 slug 不行：实测 agy 会提示 "no longer available" 并换成目录第一项，所以必须用显示名。
- README 中英文补了一句模型选择的行为说明。`dist/claudex-switch.js` 已重新构建。

输出示例（真实运行）：

```text
● Using Antigravity account saved as agy.
● Running agy --model gemini-4-neon-xhigh --settings {"model":"Gemini 4 Neon (XHigh)"}
  Antigravity CLI 1.5.17 / Enterprise Gateway / Gemini 4 Neon (XHigh)
```

## 行为与对应测试

全部新测试都在基线 `f4114f7` 的独立 worktree 上跑过，7 条全红，日志见 `.tmp/new-tests-on-base-f4114f7.log`。改动后全绿。

| 行为 | 证明它的测试 |
|---|---|
| `--model gemini-4-neon xhigh`、`"gemini-4-neon xhigh"`、`gemini-4-neon-high --effort xhigh`、`--model=gemini-4-neon-xhigh`、`--effort=xhigh --model gemini-4-neon` 都启动 `gemini-4-neon-xhigh`，且按真实 agy 方式去后缀后的请求能到达该模型 | `tests/native-subscription-run.test.ts::every spelling of gemini-4-neon at xhigh ...` |
| `--model claude-sonnet-5-5 high` 拼成 `claude-sonnet-5-5-high`，其他参数原样保留，目录里不出现别名 | `...::Antigravity native run binds the saved account, joins model and effort, and keeps other arguments` |
| 不带 `--model` 时用账号保存的模型，包括带档位的 Gemini 默认值 | `...::bare --run uses the account's saved model, also when it is a tiered Gemini model` |
| 账号没有的档位或模型会被拒绝并列出可选项，agy 不启动 | `...::a tier the account lacks is refused ...` |
| 用户自己传 `--settings` 时原样保留、不追加 | `...::a user --settings is passed through untouched and not doubled` |
| 代理别名让基名路由到带档位的 ID；对已在运行的旧配置守护进程，热更新而非拒绝；server-id 保留；其他漂移仍拒绝 | `tests/cliproxyapi.test.ts::Antigravity gateway aliases route agy's tier-stripped Gemini names, and reach a daemon started before them` |
| 热加载没生效时，报错给出原因和 `doctor <alias> --restart` | `tests/cliproxyapi.test.ts::a proxy that does not load refreshed Gemini aliases names the restart command` |
| 别名表与真实 agy 探针表逐项一致；目录里已有真实基名时不建别名；基名能匹配仅有 xhigh 的档位 | `tests/cliproxy-link.test.ts::gateway aliases map exactly the names agy sends for tiered Gemini IDs` |

guard tests：`tests/cliproxyapi.test.ts::Antigravity gateway aliases route ...` 和 `::a proxy that does not load refreshed Gemini aliases ...` 在 `f4114f7` 上是红的。

假 agy 的行为按真实 agy 1.5.17 写：`models` 输出 `<id>\t<显示名>`，带档位 ID 收到 `--effort` 会拒绝，Gemini 请求会去掉档位后缀。假代理会热读配置里的别名，目录外的模型返回与真实一致的 400。

## 验证证据

- 全套：`bun run test` 结果是 538 pass、1 fail，日志 `.tmp/suite-final.log`，JUnit 在 `.tmp/suite-final.xml`。
  - 唯一失败是 `run alias session > RelayRouter GLM selection persists ...`。在基线 `f4114f7` 上它同样失败，报 `Received: ""`，就是 TODO 里登记的「main 上已红」那条。
  - suite：1 failed ⊆ base f4114f7。
- 其他检查：`tsc --noEmit` 通过；`bun run docs:check` 通过；`bun run build` 成功；`git diff --check` 通过。
- **真实环境只读验证**：用修复后的构建 `bun dist/claudex-switch.js`，并显式设置 `CLAUDEX_ALLOW_REAL_HOME=1`，在 `~/code/cc_chats` 中用伪终端启动，看到横幅后退出，不发消息。
  - `agylam42 --run`：`Running agy --model claude-opus-5-5-high --settings {"model":"claude-opus-5-5-high"}`，横幅 `claude-opus-5-5-high`。见 `.tmp/real-agylam42-run.txt`。
  - `agy -run --model gemini-4-neon xhigh`：`Running agy --model gemini-4-neon-xhigh --settings {"model":"Gemini 4 Neon (XHigh)"}`，横幅 `Gemini 4 Neon (XHigh)`，agy 日志里传给后端的是 `Gemini 4 Neon (XHigh)`。见 `.tmp/real-agy-neon-xhigh.txt`。
  - 两个真实守护进程（7.3.20 pid 98773、8.1.2 pid 67202）都没有重启就热加载了别名，包括 `gemini-4-neon` 和 `gemini-3.8-flash` 等 5 个。依据是别名轮询要在真实 `/v1/models` 里看到它们才会通过，否则会报错。8.1.2 的 server-id 块保留了。见 `.tmp/real-alias-state.txt`。
- **验证后的复原**：已安装的 v1.29.5 不认识别名块，会把它当漂移，拒绝启动这两个账号。所以我把两份真实 runtime.yaml 的别名块删掉了（只删这一块，权限仍是 0600），守护进程随即热加载回原状。复原后用已安装的 1.29.5 跑 `agylam42 --run` 和 `agy --run`，都正常启动，见 `.tmp/installed-after-restore.txt`。新版本第一次运行会自动加回别名。

## 未验证与风险

- **没有用真实订阅发消息。** 这是合同要求的「看到就退出，不发消息」。所以「真实上游接受『别名 ID 加 thinkingLevel』」还没有端到端证明。已证明的部分：别名在真实代理里注册成功；agy 发出的 thinkingLevel 和目录 ID 的档位一致（xhigh 对应 XHIGH）；同类映射是 CLIProxyAPI 官方文档的 antigravity 示例。建议发版后由 ROOT 或用户各跑一次 `claudex-switch agy -run --model gemini-4-neon xhigh -p 'Reply OK'` 和 `claudex-switch agylam42 --run -p 'Reply OK'`。
- 截图那种「恢复中断会话时界面停在 settings 模型」的竞态没能复现，0/4 次。修复让回落值本身就是目标模型，所以即使竞态再次发生，界面也停在正确的模型上；但这一点没有在竞态现场测过。
- 当前目录里每个 Gemini 系列只有一个档位。以后若同时出现多个档位，基名一律指向最高档，agy 发来的 thinkingLevel 仍照样带上。
- 每次 `--run` 多一次 `agy models` 调用，约 0.3–1 秒。
- 走 `--cliproxy claudecode` 的 Claude Code 路径不受影响：别名不进它的模型选择器。另外 `antigravityModelBase` 新识别 `-xhigh`，所以 Claude Code 的 modelOverrides 里多了 `gemini-4-neon` → `gemini-4-neon-xhigh` 这类映射。

## 给集成人

- 需要发补丁版本，由 ROOT 决定。合并后见仓库 CLAUDE.md「push 时检查是否需要发版」。
- 建议加的 TODO：发版后两个账号各发一条真实消息，完成条件是 Gemini 带档位模型（如 `gemini-4-neon-xhigh`）回复成功。
- 记忆或技能建议：现有记忆「agy verify under real conditions」可以补一句：看横幅不够，还要实际发请求，因为 agy 网关会改写模型名。是否写入由集成人决定，本 worker 不写共享 memory、TODO 或 req_changelog。
- 临时文件：本工作树 `.tmp/` 下是验证日志（未跟踪）；草稿区里的基线 worktree 已移除。
