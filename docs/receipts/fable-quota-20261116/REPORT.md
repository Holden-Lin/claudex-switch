# Fable 周额度交付报告

已完成：两个账号的真实 API 都返回独立 Fable 周窗口，列表现在显示其剩余百分比与重置时间。现有 `wk NN% DayHH` 保持原样。API 未返回用户所述的 full reset / Fable reset 次数；本次没有推算或展示次数。

## 合同与分支

- dispatch_id：`CXS-FABLEQ-20261116`；版本：`CXS-FABLEQ-20261116-v1`。
- 合同 SHA-256：`5553f76ce30efdbb79e494cb1ce69fd20ced7fe3f2d685632003000105804b99`，已校验。
- 分支：`feat/fable-quota-20261116`；实现提交：`cd543d1`。本报告随后单独提交；最终分支 HEAD 记录在 worker FINAL 信号的 `commit` 字段。
- 未合并、未推送、未改版本。ROOT 负责 review、合并、推送与发布。

## 实际字段与含义

2026-11-16 08:21–08:25 UTC，使用现有 `fetchClaudeUsage` 的凭据选择、刷新流程与 OAuth usage endpoint 查询 satoshi、hmanka，两者均返回 HTTP 200。未读取凭据配置文件内容到工具输出，未输出 token/key。响应检查仅输出字段结构、数值及明确白名单的限额元数据。

| API 字段 | 实测含义与用法 |
| --- | --- |
| `five_hour.utilization` / `resets_at` | 原有 5h 用量与重置 |
| `seven_day.utilization` / `resets_at` | 原有全模型周用量与重置 |
| `limits[].kind` / `group` | Fable 条目为 `weekly_scoped` / `weekly` |
| `limits[].scope.model.display_name` | 两者都是 `Fable`；`model.id` 为 null |
| `limits[].percent` | Fable 自身窗口已用百分比；初次 satoshi 0、hmanka 42；最终验证 satoshi 1、hmanka 42 |
| `limits[].resets_at` | Fable 自身重置时间，独立解析；两者目前分别与自身全模型周窗口同一重置时段 |
| `weekly_scoped_shares[].limit_index` | 两者均为 2，指向上述 Fable limit |
| `weekly_scoped_shares[].used_percent_of_weekly` | 初次 satoshi 0、hmanka 21 |
| `weekly_scoped_shares[].allowance_percent_of_weekly` | 两者均为 50，证实 Fable 上限占全周额度 50%；实现不以此推算 Fable 用量 |

其他顶层字段包括 `seven_day_oauth_apps`、`seven_day_opus`、`seven_day_sonnet`、`seven_day_cowork`、`seven_day_omelette`、`extra_usage`、`spend`、`member_dashboard_available`、`seven_day_breakdown`，以及若干值为 null 的内部字段。旧 `seven_day_*` 模型字段均为 null；Fable 数据来自新的 `limits` 数组。

完整结构检查没有发现 reset 次数／剩余 reset credits 字段。`promo_credits` 为 null，`extra_usage.used_credits` 为 null；`spend.can_purchase_credits=false`，这些消费额度字段不是 reset 次数。不能从当前 endpoint 证实用户所述 hmanka 1 full / 2 Fable、satoshi 3 Fable reset。

## 用户可见输出

真实响应经过生产解析器后，将数值用量写入临时 HOME 的生产缓存结构，配以虚拟 OAuth 凭据与账号元数据；执行构建产物 `bun ./dist/claudex-switch.js list --cached`，`TZ=Asia/Tokyo`。实际显示如下（无邮箱，图标未激活）：

```text
  Accounts

  ── Claude ──
    satoshi  oauth  Max  5h 28% · wk 98% Mon17 · fable 99% Mon17
    hmanka   oauth  Max  5h 54% · wk 62% Sun16 · fable 58% Sun16
```

新 token 为 `fable NN% DayHH`；缺少有效 reset 时只显示 `fable NN%`。缺少 Fable 窗口时整个 token 省略。百分比沿用现有四舍五入方式，重置时区沿用本地时区。`wk` token 未更改，已有解析器可继续读取它。

JSON 追加可选数值字段 `usage.fableWeeklyUsedPercent`、`usage.fableWeeklyResetsAt`（毫秒时间戳）。旧响应与其他 provider 不增加这些字段。

## 验证

- `bun run test tests/claude-usage.test.ts tests/list.test.ts tests/list-json.test.ts`：50 pass、0 fail。
- `bun run verify`：文档检查通过；513 tests / 47 files、0 fail；构建通过；构建产物 help 检查通过。
- 解析覆盖真实形状、无 Fable 的旧响应、不匹配模型／窗口、零使用率、独立／无效 reset、畸形值；列表覆盖 endpoint → parser → refresh cache → render、缓存读取与 JSON。
- 真实数据端到端：两账号 OAuth usage → 生产解析器 → 隔离缓存 → 构建 CLI 列表，输出如上；无需向真实缓存写入测试数据。
- 首次全量检查受沙箱本地端口监听限制而失败，允许本地测试服务后完整通过；首次新增测试的 mock 清理变量名错误已修复，随后 focused 与 full 均通过。
- `git diff --check` 通过。生成的 `dist/claudex-switch.js` 由 `bun run build` 更新。

## 发布与移交

建议 ROOT 合并后发一个补丁版本：这是 CLI 用户可见功能，已安装用户需要发布后才能通过更新获取。当前 package 版本仍为 `1.28.8`，worker 未执行 push/tag/release。

工作树保留供 ROOT review／landing；worker 未加锁。工作树内无保留的 ignored 数据。临时测试 HOME 与日志位于 `/tmp/cxs-fable-e2e-PiNKsW`、`/tmp/cxs-fable-quota-{e2e,focused,verify}.log`，仅含隔离虚拟凭据或非敏感测试证据。

共享 TODO、req_changelog、memory 留给 integrator；本次不需要新增长期 memory 或 skill。建议集成记录：

```markdown
## 2026-11-16 · Fable 周额度 · 完成
### 用户原话
- 11-16，合同 goal_source 验证：「现在manka账号有1次full reset, 2 fable reset; satoshi 3 fable reset.你在claudex-switch里做个优化，把fable剩余额度也加上。」「fable额度是占每周50%，根据claude官方。」
### 决策与假设
- Decision (worker, method): use the API model-scoped weekly percent and reset; preserve wk output; do not derive usage from the 50% share. Reset-credit counts were absent from both live responses.
### 验证
- 513 tests passed; built CLI rendered both accounts with real parsed quotas in an isolated HOME. Release remains ROOT-owned.
```

建议 TODO：勾选 Fable 周剩余额度展示；若需要 reset 次数，后续应先确认可读取该数据的官方接口，再另行实现。
