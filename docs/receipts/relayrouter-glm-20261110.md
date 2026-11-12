# RelayRouter GLM 5.3 Flash 交接回执

已让真实 RelayRouter 账号以 GLM、high effort、auto 权限模式完成工具调用及后续回复，Claude Code 实际报告 1,000,000 token 窗口。模型选择、窗口、压缩和工具历史兼容修复已完成；三次实测共花费 **$0.004674**。分支交 ROOT 评审、合并和发版，worker 未改评审路由表。

## 合约与范围

- Dispatch：`CXS-RELAY-GLM-20261110`；版本：`CXS-RELAY-GLM-20261110-v1`。
- 合约 SHA-256：`4e90c5fb8379ffaea0b67bf62814706d003e1000d771368d3f87c7b3a4b5d2b9`。
- 分支：`fix/relayrouter-glm-20261110`；基线 `30e871f`；实现提交 `3d81119e04a2acc50395bd8a81652d1485f9e71a`。
- 合约核对的用户原话（11-10，`goal_source`）：「你让claudex把relayrouter用glm5.3f优化一下（比如这个context windoe和压缩率问题），现在虽然默认是astra但我看后台是调用成功了的。然后把它也加入到评审列表里。」评审列表属于 ROOT 的 cc_chats 工作范围。
- ROOT 追加授权：先试官方客户端设置；必要时做只随 RelayRouter 会话启动、退出的兼容层；按每次实测的账单总额差、子请求数和模型记账。

## 模型、窗口和压缩

`--model` 原本已有保存账号默认值的逻辑，本次验证并沿用它。截图中的 `/model` 修改只写入临时会话设置，旧账号默认值仍是 Astra；旧启动器据此写入 `ANTHROPIC_MODEL=gpt-6-astra`。现在实际账号已保存 `glm-5.3-flash`，私有设置的 `model` 与 `ANTHROPIC_MODEL` 一致。显式 `--model gpt-6-astra` 仍可选择并保存 Astra；回归同时覆盖随后无 `--model` 的启动。

- 真实 `https://api.relayrouter.ai/v1/models` 的认证只读查询返回 `glm-5.3-flash`、`gpt-6-astra`；该接口未返回窗口数字。
- 数字来自 [Z.AI 官方 GLM 5.3 Flash 规格](https://docs.z.ai/guides/vlm/glm-5.3-flash)：1M。按 1,000,000 tokens 声明，不猜测中转站另有更大额度。
- 按 [Claude Code 自定义模型窗口文档](https://code.claude.com/docs/en/model-config#correct-the-window-for-a-gateway-or-custom-model-id)，对原始未知 ID 写入 `CLAUDE_CODE_MAX_CONTEXT_TOKENS=1000000`；不添加可能改变路由的 `[1m]`。
- `CLAUDE_CODE_AUTO_COMPACT_WINDOW=800000`，保留约 200K 余量供工具结果、摘要和回复使用；清除继承的 `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`。真实 `/autocompact` 报 `800k tokens (from CLAUDE_CODE_AUTO_COMPACT_WINDOW)`，`/context` 显示 800K 压缩窗口及系统缓冲，启动无 200K 假定警告。
- 真实运行的 `modelUsage["glm-5.3-flash"].contextWindow` 为 **1000000**。未做填满 1M 的付费压力测试，也未把短请求当成后端满窗口容量实证。
- small-fast 与 auto 分类器默认 GLM；`CLAUDE_CODE_AUTO_MODE_SERVER=0` 保留客户端分类。仅 `api.relayrouter.ai` 的 GLM 组合获得这些默认值，账号显式 env 可覆盖。
- 通过 claudex-switch 配置代码，将实际 relayrouter 的 Fable / Sonnet / Opus / Haiku / 子代理映射也保存为 GLM；凭据比较确认未变。全局 active 始终为 `satoshi`，未操作其他 provider 或任何已有守护进程。

## 工具回传 400 的根因与修复

首次真实 Bash 已被 auto mode 放行并执行，但后续请求返回：

```text
400 Failed to deserialize the JSON body into the target type:
data did not match any variant of untagged enum
ChatCompletionRequestAssistantMessageContent at line 1 column 6893
```

本次合成会话的 assistant 确实含 **`thinking`** 和 `tool_use` 块。按[官方环境变量说明](https://code.claude.com/docs/ko/env-vars)，再试 `CLAUDE_CODE_DISABLE_THINKING=1`；该开关只省略请求参数，GLM 仍返回 thinking，工具结果后仍报同一 400（column 3058）。相同故障类别在[上游兼容实现的问题记录](https://github.com/open-webui/open-webui/issues/29799)中有明确复现：Anthropic thinking 块被当作 OpenAI assistant content parts 送给严格后端。

新转发层只在 RelayRouter GLM 的 `-run` 中绑定 `127.0.0.1` 随机端口；保留原始模型 ID、请求认证、思考参数、effort、文本、工具调用及结果，仅从 assistant 请求历史移除 `thinking` / `redacted_thinking` 和因此变空的消息。本次实际观察到的是 thinking；redacted_thinking 的同类处理由合成测试覆盖。响应流完全保留，未关闭主对话思考，未改写分类器的允许或拒绝答案，未回退到其他模型。

真实修复运行：auto 分类器 `model=glm-5.3-flash stage=xml_s1 outcome=ok`，Bash stdout 为 `42`，后续 GLM 回答 **`RELAY_GLM_TOOL_OK — result: 42`**，退出 0。该次 GLM 首先产生一次缺少 `command` 的空工具参数，Claude 原生校验拒绝后自行纠正；转发层没有补造参数。该模型输出质量限制保留在此，不通过重试多次筛选验收。

Node 与 Bun 均验证流透传和上游取消；正常退出及启动失败清理路径接入现有 launcher 生命周期。未启动或替换 CLIProxyAPI。所有自建 tmux 测试进程已关闭。

## 实测费用

账单按 500,000 quota / USD 换算（真实 `/api/status`）。`/v1/dashboard/billing/usage` 当时返回陈旧值；后续使用 **Bearer 认证的 `/api/usage/token/`**。第一行起点与最初 dashboard 总额一致，终点及后续两行均取原生 token 计费接口。ROOT 已认可按运行汇总，未取逐条含 key 查询参数的日志；此方案曾被自动审批拒绝，未执行。

| UTC 时间 / 运行 | 模型 | 推理子请求数 | 账单总额前 → 后（USD） | 实际差额 |
| --- | --- | ---: | --- | ---: |
| 05:35，显式模型的 TUI、工具回传原始失败 | glm-5.3-flash | 6（标题 1、主请求 1、分类器 1、失败回传 3） | 0.926956 → 0.928576 | $0.001620 |
| 05:38，无 `--model`、官方关闭思考设置仍失败 | glm-5.3-flash | 4（主请求 1、分类器 1、失败回传 2） | 0.928576 → 0.930054 | $0.001478 |
| 05:44，会话转发层修复后成功 | glm-5.3-flash | 4（主请求 3、分类器 1） | 0.930054 → 0.931630 | $0.001576 |

合计 **14 个推理子请求，$0.004674**；首次 `/context` 另有 4 个 `count_tokens` 请求，其成本已包含在该运行账单差内。只读模型、价格、额度查询未发生成请求。最终剩余额度 **$9.068370**。Claude 的 `costBasis=unknown` 估价未用于这张费用表。

## 验证、启动配方与交接

- `bun install --frozen-lockfile` 成功。新增 launcher 回归在基线代码上失败（缺少 GLM small-fast 设置），修复后通过。
- 最终 `bun run verify`：**484 pass / 0 fail，2,524 assertions，46 files**，包含文档检查、构建及构建版 help；`bunx --no-install tsc --noEmit`、`git diff --check` 成功。
- 测试覆盖选定模型与默认值、进程 env / 私有设置一致、Astra 仍走原端点、显式 env 覆盖、全局切换清理、其他服务商无新默认值、流与错误透传、thinking-only 历史、工具结果保留、Node / Bun 取消和监听端口关闭。
- 实际客户端：Claude Code **2.1.322**、Node **26.6.0**；构建来源为本分支，未更新已安装全局二进制。

ROOT 写入 routing.json 的普通启动行（默认即 auto mode）：

```sh
CLAUDEX_DISABLE_AUTO_UPDATE=1 claudex-switch relayrouter -run --model glm-5.3-flash --effort high
```

评审本分支、尚未发布时，将入口替换为：

```sh
CLAUDEX_ALLOW_REAL_HOME=1 CLAUDEX_DISABLE_AUTO_UPDATE=1 node /Users/holden/code/claudex-switch/.worktrees/relayrouter-glm-20261110/dist/claudex-switch.js relayrouter -run --model glm-5.3-flash --effort high
```

发版判断：这是已安装 v1.28.4 尚不具备的运行修复，ROOT 评审合并后需要发补丁版。worker 只推分支，不 bump、tag、merge 或 release。共享 TODO / req_changelog / memory 未改。

给 integrator 的共享文档提案：TODO 标记 RelayRouter GLM 配置和真实工具往返已完成，待 ROOT 把配方纳入评审路由并发布；req_changelog 保留上述用户原话，另列 ROOT 的会话转发授权、worker 的 1M / 800K 选择、484 项测试及 $0.004674 实测费用。无新 memory 提案：工具往返验收已在现有 proxy-auto-mode skill 中规定。

工作树交接：待 ROOT 评审合并前保留，无 worker 自建锁；忽略数据仅 `node_modules/`，占用 32,336 KiB，可重建。脱敏实测原始输出暂存 `/private/tmp/cxs-relay-glm-live/`，完整回执不依赖这些临时文件。
