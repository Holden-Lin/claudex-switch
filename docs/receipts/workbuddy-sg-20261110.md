# WorkBuddy DS 路由与计费核验 · v3

**当前账号不能证明 DS 免费，因此本轮为 PARTIAL FINAL。** 真实 auto mode 评审已运行成功：7 次上游请求及响应全是 `deepseek-v4.1-flash`，没有 SG，但实际扣了 **1.53 积分**。已停止调用、撤回拟补入的“免费 DS”目录项，保留菜单去重及防止基础 DS 静默转到收费档位的修复；尚未合并、发布。

## 合同、用户要求与范围

- Dispatch：`CXS-WB-SG-20261110`；原合同版本 `CXS-WB-SG-20261110-v1`，SHA256 `13910024aa057231b861d4a0cb882945c9a279fd3db7cb535562f2d17bae9019`。
- 本回执版本：`CXS-WB-SG-20261110-v3`，取代 v2；后续合同为 ROOT 的 `followup-v3.md`。
- 用户原话（v3）：「claudex-switch workbuddy --run --cliproxy claudecode 必须要能选（x0.00 免费）的ds，然后我们拿它来review。现在之所以会耗额度是因为每次用的都是sg的」。
- 用户原话（原合同引用）：「Claudex-switch我之前是不是让修过为什么模型列表是有ds sg的问题？」「修好了吗」「workbuddy模型列表」。10-23：「为什么我在codebuddy里看模型列表只有1个deepseek,claudex-switch workbuddy --run --cliproxy claudecode还会有一个sg地区的」。
- ROOT 已确认：底层 CLIProxyAPI `/v1/models` 可以保留 SG 注册，以支持显式 SG 路由；订阅桥目录和 Claude 选择器去重。list / webconfig 只有档位映射，没有待改的 WorkBuddy 目录菜单；当前没有 WorkBuddy → Codex / OpenCode 变体。
- ROOT 后续授权：真实 HOME 中正常 CLI / 插件可自己读取现有登录；agent 不打开、复制、软链或打印凭据文件。用户原守护进程不重启。

## 真实证据与结论

证据文件：[白名单请求与额度记录](workbuddy-ds-v3-evidence.json)。组件：Claude Code **2.1.321**、CLIProxyAPI **7.3.15**、WorkBuddy 插件 **0.1.30**。

| 观测 | 结果 |
| --- | --- |
| 真实账号 `/v3/config` | DS 只有 `deepseek-v4.1-flash-sg`，`credits=x0.11`；免费目录项仅 `hy4free`、`hy3` |
| 已装正常命令 `claudex-switch workbuddy --run --cliproxy claudecode --model deepseek-v4.1-flash -p 'Reply exactly DS_FREE_OK.'` | 本地拒绝：`model "deepseek-v4.1-flash" is not in the account catalog`；没有聊天上游调用 |
| 一次直接通过真实插件发送基础 DS，14 输入 / 2 输出 token | HTTP 200，请求与响应都是基础 ID，`usage.credit=0`；额度仍 100 / 130 |
| 随后的真实 auto mode review | 7 次请求与响应都为基础 DS，无 SG、无其他模型；各次 credit 为 0.01、0.47、0.04、0.04、0.84、0.06、0.07，合计 **1.53** |
| CLI 自己的实际额度读取 | 评审前已用 **100 / 130**；评审后 **101.53 / 130**，增量与上游用量精确相同 |
| 分类器 | 01:29:11.596Z `classifier_request_started`，model=基础 DS，stage=`xml_s1`；01:29:13.537Z finished，outcome=`ok`，耗时 1941ms；实际 34953 输入 / 4 输出 token，credit **0.84** |
| 标题 / 无工具旁路 | 一次 tools=0、max_tokens=64000 的基础 DS 请求，763 输入 / 12 输出，credit **0.01**；非分类器 |

极小调用的 credit=0 **不能证明免费**：它与较大请求实际扣费并存，符合小额计费取整的表现，但供应商具体取整规则未核实。先前据该小请求拟补入免费目录项的判断已撤回，最终代码没有该补项。

结论：本次不是“基础 ID 必然被本地插件改成 SG”。真实抓包已证明基础 ID 原样到上游、也原样返回，仍产生扣费。当前账号的基础 DS 不能标为已验证的 x0.00 免费评审路线；成功运行 auto mode 不等于免费。

## 历史调查与代码根因

- 插件 `provider.models` 用 `Object.fromEntries(ms.map(m => [m.id, ...]))`，按 ID 建表；重名只会改显示名，未发现名字覆盖成 SG 的代码。插件 `loader.fetch` 保留请求体中的 model。
- 当前原代理配置仅注册 SG，没有 `base → SG` alias；四档目前都是 hy4free。原守护进程 PID **51883**、bridgeRevision **3**，整个调查前后未变。
- 11-05 原始代理错误日志已不在当前保留范围内；现存 10 份是 11-09 日志，只有 hy4free / 6004 相关记录。不能据此还原那一天所有上游请求，更不能把今天的抓包冒充过去的抓包。
- 共享 Claude 会话记录找到基础 DS 响应和 14018 报错，但记录跨账号共享，且响应模型字段不能证明原始请求或实际计费，故不据此断言历史调用均走 SG。
- **已复现的静默回退缺陷**：保存的基础 DS 缺席目录时，`resolveManagedLocalCLIProxyAPIDefaultModel` 回退到 Fable 档位；生成设置的 `subscriptionModelOverrides` 也会把缺席的保存模型映射到 Fable。若该档位是 SG，基础 DS 就会静默变成 SG。基线单测已复现；历史那批请求是否经过这两处仍缺原始抓包。

## 最终修改

1. 共用筛选器只处理 WorkBuddy 两版：有基础 ID 时隐藏相应 SG；只有 SG 则保留并标地区与插件费率。CLIProxyAPI 的完整路由注册表保留，显式 SG 可用。
2. 基础 DS 缺席时，默认模型解析明确报错；共享设置中保存的基础 DS 也不再被重写成收费档位。两处共用同一条禁止回退规则。
3. **只有上游目录明确标记基础 DS 免费时**，菜单显示 `x0.00 (free)`，会话的四档和分类器默认使用基础 DS；显式模型 ID 与显式 profile env 仍保留。当前真实目录没有这样的免费 DS，所以不会凭 SG 条目推断或补造一个。
4. 桥版本升至 4。下一次空闲启动更新旧桥，不强停活动会话；隐藏的 SG 路由保留自己的压缩窗口。
5. 新增受保护的真实探测脚本 `scripts/verify-workbuddy-free-ds.ts`：只让插件运行时使用既有登录，在真实 HOME 建立自有桥 / converter、生成生产设置；没有免费 DS 目录项则在任何聊天前拒绝，一旦观察到非零 credit 就阻止后续调用。它直接启动 Claude，不宣称覆盖正常 managed CLI 的登录 / 启动路径。

## review 功能证据及限制

为了不重启用户代理、不复制登录，真实 review 使用本轮自建桥和 CLIProxyAPI，以及 `prepareLocalCLIProxyAPIClaudeSettings` 生成的设置。其正常 CLI 临时 alias 因没有独立登录文件而被拒，未伪造登录；随后直接用真实 Claude Code 读取生产生成的设置运行。测试时曾拟补基础 DS 目录项，计费证据出现后已从最终代码撤回。

屏幕摘录：

```text
Claude Code v2.1.321
DeepSeek V4.1 Flash · x0.00 (free) with xhigh effort
⏵⏵ auto mode on

Bash(git log -1 --oneline)
5b6ff18 docs: record ROOT approval of WorkBuddy routing catalog scope

Bash(ls) → AGENTS.md ... src tests tsconfig.json

Bash(uv run --no-project python -c "print(6*7)")
42
Allowed by auto mode

REVIEW_DS_OK
```

**屏幕当时的 free 标签来自后来撤回的补项，不是免费证据。** git / ls 属于只读命令，不要求每次调用分类器；Python 确实经过分类器，debug outcome=ok。没有添加 allowedTools、审批 hook 或 bypassPermissions。

这证明真实基础 DS 的 review 功能可用，但同时证明该评审扣了 1.53 积分。当前不能把这条路线交给 ROOT 当免费评审：

```sh
claudex-switch workbuddy --run --cliproxy claudecode --model deepseek-v4.1-flash
```

这是最终应使用的精确模型选择命令，**当前真实目录会拒绝它，不能作为已可用的免费评审启动线**。不要替换为 SG，也不要通过补造免费目录项绕过。只有供应商 / 当前登录账号真正恢复基础 DS 免费目录及免费计费后，才用此命令验收并启用 review route。未改 ROOT 的 routing.json。

## 检查与交付

- 最终基线回归：替换两个实现文件为 `4d49b57` 后，`30 pass / 8 fail / 211 expect()`；还原后新增用例通过。覆盖遗漏基础 DS 的付费回退、所有默认旁路档位、免费标签、SG-only 不补造免费项、Cursor 不受影响、显式 SG 及隐藏窗口。
- `bun run verify` 最终：**463 pass / 0 fail / 2369 expect()**，43 文件、35.16 秒；文档检查、构建、构建版 help 通过。
- `bunx tsc --noEmit` 和 `git diff --check` 通过。
- 最终合成全链路：真实 Claude Code + CLIProxyAPI + 真实插件，`--run --cliproxy claudecode` 生成一个免费 DS 菜单项，默认四档与旁路为基础 DS，显式 SG 完成两轮 Read；这不证明当前真实账号免费。
- 最终真实 helper 在当前目录返回 `No free DS entry.`，聊天前拒绝；没有再次收费验证。
- 私有原始材料：`/tmp/cxs-wb-v3/`；可分享的白名单模型、状态、用量、额度及分类器结果已存入本回执旁的 JSON。未提交原始调试日志或会话正文。
- 本轮自有 alias / profile、桥、converter、Claude 和 tmux 测试窗口已清理；真实用户原守护进程不变。忽略数据仅 `node_modules/`（约 32 MB，可重建）；工作树保留待 ROOT 决策，未手动加锁。

## ROOT 接续、发布判断与改进建议

- **未完成项**：当前账号没有已证明免费的 DS；正常 CLI 的真实免费 DS review 无法完成。因此提交 **PARTIAL FINAL v3**，不是成功免费路线的 FINAL。
- 不再尝试可能收费的请求；请 ROOT 向供应商 / 用户确认该账号的 DS 免费权益及真实费率，或由用户明确选择别的已确认免费路线。当前只保留免费目录证据，不把 hy4free 冒充 DS，不切换账户。
- 防止静默付费回退和菜单标价值得发布，但必须先有 ROOT review ACCEPT 和明确发布通知。现版本 1.28.3，建议下一个可用补丁号；未 merge、bump、tag、release 或安装。
- 发布步骤仍为：整合共享 TODO / req_changelog → merge 分支 → 将 package.json 改为下一补丁号（例如 1.28.4）→ `bun run build` → `bun run verify` → `git add package.json dist/claudex-switch.js` → `git commit -m 'release: v1.28.4'` → `git tag v1.28.4` → `git push origin main v1.28.4`。CI 创建 Release / 资产 / formula，之后拉取 formula 提交并跑 `bun run release:guard`；不要手动创建 Release 或手改 formula。
- 建议 integrator 的 TODO / 沿革：原话按本回执记录；2026-11-10 实测基础 DS 本身扣费（100→101.53），并非每次费用都来自 SG；免费 DS 目标待供应商 / 权益确认。代码已防止缺席目录的保存 DS 静默落到收费档位，发布待评审。
- 建议更新 proxy-auto-mode 技能：单次极小请求 credit=0 不足以证明免费；必须核对足够代表实际 review 的请求和真实额度增量，发现非零费用后停止。不能从名字、旧截图、缺失目录或 SG 后缀推断免费权益。
- 审批记录：隔离 HOME + 软链登录最初被 auto-review 拒绝（原因：仍触发凭据文件读取）；未执行该方案。ROOT 澄清运行时认证允许后，改为真实 HOME 正常 CLI / 插件读取，无凭据打开、复制或软链。正常路径后续受原代理不重启的合同边界限制，不是新的自动审批拒绝。
