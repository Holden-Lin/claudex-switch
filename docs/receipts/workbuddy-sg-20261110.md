# WorkBuddy / CodeBuddy DS 计费核验与修复 · v4 FINAL

**用户关于“实际按 SG 计费”的判断正确。** 账单 API 已确认：前一轮 WorkBuddy 的 7 次上游调用虽然请求和响应都写基础 DS，实际按 SG 扣了 **1.53 积分**；官方 CodeBuddy 自身选 x0.00 基础 DS 后也按 SG 计费，本轮极小提示及自动旁路合计 **0.72 积分**。没有找到按非 SG 免费计费的线路，未接入任何收费 CodeBuddy 路线；按 ROOT 最新范围，只交付禁止静默付费回退、如实标价及**只读账单核对**，不再发聊天探测。

## 合同与原话

- Dispatch：`CXS-WB-SG-20261110`，原 contract version：`CXS-WB-SG-20261110-v1`；原合同 SHA256：`13910024aa057231b861d4a0cb882945c9a279fd3db7cb535562f2d17bae9019`。
- 本回执版本：`CXS-WB-SG-20261110-v4`；按 ROOT 的 `followup-v4.md` 及最新收尾指令执行，取代此前 v2 / v3 回执结论。
- 用户原话：「claudex-switch workbuddy --run --cliproxy claudecode 必须要能选（x0.00 免费）的ds，然后我们拿它来review。现在之所以会耗额度是因为每次用的都是sg的」。
- 用户原话：「用的不是免费的」（附 WorkBuddy 账单截图）；「你让它直接运行 codebuddy并选择免费ds，看看要怎么选到」；「然后再看cliproxy怎么做」。
- ROOT 最终指令：没找到免费计费线路前不接收费 CodeBuddy 路线、不再发聊天；区域 / 账号类型 / 国际国内版 / 套餐有证据写证据，无证据写未知；给用户一步动作；保留不悄悄退到付费模型、如实标价、只读账单核对，测试 / verify 后写 v4 FINAL。
- 原边界不变：不打开、复制、软链或打印凭据文件；CLI / 插件运行时读取自己的现有登录获 ROOT 明确授权；不重启用户运行中的代理，不买套餐、不换账号，不改 ROOT routing.json。合并 / 发版仍需 ROOT review ACCEPT。

## 先纠正 v3 结论

v3 的模型抓包和额度增量是事实，但“没有 SG，因此基础 DS 本身付费 / 与 SG 无关”的推断错误：**请求和响应的 model 可以都是基础 ID，服务端账单却记录为 SG。** 用户截图和本轮独立读取的账单 API 一致，用户判断正确。

16 token 请求显示的 credit=0 只是小额显示 / 取整，账单仍标 `deepseek-v4.1-flash-sg`，不能当作免费证据。也不能从目录 x0.00 推导实际免扣费。原 [v3 白名单记录](workbuddy-ds-v3-evidence.json) 已补入此更正，原始请求 / 响应字段保留，避免改写历史数据。

## 官方 CodeBuddy 的实际结果

使用用户现有登录，直接运行官方 **CodeBuddy Code 2.182.0**，在其 `/model` 选择器选基础 DS；未使用 claudex-switch 代替这一步。选择器与确认屏幕：

```text
Select Model
❯ deepseek-v4.1-flash    ✔ (x0.00)
  deepseek-v4.1-flash-sg   (x0.03)
Switched model to Deepseek-V4.1-Flash.
> Reply OK.
● OK
```

`/status` 显示现有国际版登录，主模型 / Lite / Reasoning 都为基础 DS。官方运行时 trace 的模型与输出模型也为基础 DS。

[完整白名单证据](workbuddy-ds-v4-evidence.json) 中，真实 HTTP 头的 `X-Conversation-Request-ID` 与账单 `requestId` 精确匹配：

| 用途 | 请求 ID | 账单模型 | 积分 |
| --- | --- | --- | --- |
| 主对话 | `01a1c3278d367993b3604ed70449ef76` | `deepseek-v4.1-flash-sg` | 0.69 |
| 标题 `conversation_topic` | `01a1c3278d40724db0a4b83c1c6cc6ee` | `deepseek-v4.1-flash-sg` | 0.02 |
| 建议 `prompt_suggestion` | `01a1c327958473e091c7d0e1ff61f7b5` | `deepseek-v4.1-flash-sg` | 0.01 |

这一次只提交了 `Reply OK.`；官方交互客户端自动附带系统上下文、标题与建议请求，仍产生了 0.72 积分。之后没有再发真实聊天或 review。后续序列化检查全部在发送正文前阻断，不产生新的模型调用。

## 线路差异与“为什么 SG”

| 项目 | 官方 CodeBuddy | WorkBuddy AI 插件 | 国内 WorkBuddy |
| --- | --- | --- | --- |
| 聊天端点 | `www.codebuddy.ai/v2/chat/completions` | `www.workbuddy.ai/v2/chat/completions` | 源码为 `copilot.tencent.com/v2/chat/completions` |
| 账号域 / 构建 | `X-Domain=www.codebuddy.ai`；官方源码对应 External | 实际只读请求头 `X-Domain=www.workbuddy.ai`；国际版 | 源码国内域 `www.workbuddy.cn` / `copilot.tencent.com`，未切换或验证此登录 |
| 客户端 | `X-IDE-Type/Name=CLI`；`CLI/2.182.0 CodeBuddy/2.182.0` | `X-IDE-Type/Name=WorkBuddy`；`WorkBuddy/5.5.6` | 源码 WorkBuddy 客户端头 |
| Agent | 主请求 main / conversation；旁路 auxiliary | main / conversation | 插件国内分支不补国际版的 main 头 |
| 模型选择 | 基础 DS；Lite / Reasoning 也是基础 DS | 前轮 7 次请求 / 响应均为基础 DS | 无真实调用证据 |
| 已验证账单 | SG | SG | **未知** |

官方真实请求使用 gzip。初次被动观察器没有解码真实请求体；随后在官方 `--model deepseek-v4.1-flash` 路径上解码已完整序列化的 gzip 请求，并在发送前阻断：model 为基础 DS，没有额外 region / plan / tier 字段；extra_vars 只有 harnessMetadata、initiator、interactionType。该资料明确标为“发送前捕获”，不冒充已发送请求体。

**已知**：本次登录走国际版域；官方选择器标 x0.00；两种客户端的真实账单均为 SG；WorkBuddy 额度读取曾报告 `plan=free`、总额 130。服务端把这批调用记到 SG 是确定事实。

**未知**：是否由物理 IP 区域、账号注册区域、个人 / 企业账号类型、某个产品专属套餐或服务端计费规则导致。现有 API 没有返回重映射原因；`plan=free` 和国际版域不能证明因果。CodeBuddy 独立产品的具体套餐权益也未核实。国内版是否能免费、需要哪个套餐或另一账号，均无证据，不能保证换国内版或买套餐就能解决。

**用户自己下一步（一句话）**：请把上述主请求 ID 和 `/model` 的 x0.00 截图发给官方客服 `codebuddy@tencent.com`，要求说明该国际版账号为何按 SG 计费，以及获得非 SG 免费 DS 权益的明确条件。

## 保留的代码与只读核对

- 只按实时模型目录显示，不推断免费、不补目录外模型；已知费率按原小数精度标注，明确免费才标 x0.00 (free)。插件把未知价格填成 0，故 free=false 的 0 不当作已知免费价格。
- 仅当基础模型确实在目录中时隐藏同名 SG；基础模型缺席时保留 SG，并标 Singapore / 实际费率。原始路由注册表仍保留显式 SG，Cursor 等其他服务商不受影响。
- 保存的基础 DS 缺席目录时，不再通过默认模型或共享设置映射静默退到 Fable / 收费 SG；两处使用同一禁止回退规则。此修复约束**本地改模型**，不声称能阻止供应商在后端按 SG 计费。
- 如实时目录明确标免费 DS，会话默认档位及分类器使用它；不以旧免费缓存覆盖当前目录。显式模型 / profile env 保留，隐藏的 SG 压缩窗口保留。
- 通过官方前端公开代码找到 `POST /billing/meter/get-user-request-usage`，新增 `listSubscriptionBillingRecords`；由插件自己认证，只返回 requestId、**billedModel**、credit、client、requestTime，丢弃 userPrompt 等字段。两个产品域独立读取的 8 条记录一致。
- 删除会发聊天的 `verify-workbuddy-free-ds.ts`，换为仓库内的只读脚本：不启动代理、不启动登录、不调用聊天端点。

```sh
bun scripts/inspect-workbuddy-billing.ts workbuddy 2026-11-10
```

实际输出示例（仅第一页，最多 50 条）：

```json
{"requestId":"01a1c3278d367993b3604ed70449ef76","billedModel":"deepseek-v4.1-flash-sg","credit":0.69,"client":"CLI","requestTime":"2026-11-10 09:51:49"}
```

当前没有按免费计费的线路，因此没有把官方 CodeBuddy 的收费路径接入 claudex-switch，也没有提供“可免费评审”的启动线。未改用户账号、套餐或 ROOT 的路由。

## 验证与交接

- 最终 `bun run verify`：**467 pass / 0 fail / 2385 expect()**，43 文件、38.35 秒；类型检查、文档检查、构建及构建版 help 均通过。完整日志 `/tmp/cxs-wb-v4/verify-final.log`。
- `tests/subscription-profiles.test.ts` 在基线 `4d49b57` 实测 **9 pass / 5 fail / 66 expect()**，是行为失败而非缺新导出的编译失败；最终聚焦两文件 **42 pass / 0 fail / 253 expect()**。覆盖目录价格、去重、无静默付费回退、实时免费标记，以及“credit=0 但 billedModel=SG”的记录解析；不返回私有提示词。
- 已有真实 Claude Code / CLIProxyAPI + 合成上游启动链路验证通过。v4 不再做真实 review；官方测试只做一次微型用户提示及其自动旁路，后续均为只读 API / 发送前阻断。
- 只读脚本已在现有 WorkBuddy 登录下运行，返回 8 条账单，全部 SG；与官方 CodeBuddy 运行时读到的数据相符，未发送聊天。
- 原用户守护进程 PID **51883**、bridgeRevision **3** 未被重启。自有 CodeBuddy 测试进程 **21755 / 32343** 已正常 SIGTERM 退出；测试 tmux 和新建浏览器标签页均已关闭。CodeBuddy 不在 tmux-ops 的 agent-exit 识别名单，故先验证 pane 身份再终止自有进程，最后用工具收尾；没有操作其他用户会话。
- 原始私有材料 `/tmp/cxs-wb-v4/`；提交的 JSON 不含令牌、鉴权头、提示词正文或账单页面的私人请求内容。工作树忽略数据只有可重建的 `node_modules/`（约 32 MB），保留供 ROOT 评审，无个人锁。
- 需要补丁发布才能交付已装 CLI 的本地回退 / 标价修复；当前版本 1.28.3。仍待 ROOT review ACCEPT 后再合并、bump 下一补丁号、`bun run build`、`bun run verify`、提交、tag、push；CI 建 Release / 资产 / formula，之后拉取 formula 提交并跑 `bun run release:guard`。本轮没有 merge、tag、release 或安装。
- 建议 integrator 的 TODO / 沿革：用户关于 SG 计费判断已证实；官方 CodeBuddy x0.00 选择同样计入 SG。具体区域 / 账号 / 套餐原因未知，由用户携请求 ID 联系官方；代码保留防静默付费回退、真实目录价格及只读账单核对。不更新共享 TODO / req_changelog / memory。
- 建议技能更新：免费判定必须核对账单计费模型与请求 ID；目录标价、回显 model、单次 credit=0 或总额度差值均不能替代该证据。
