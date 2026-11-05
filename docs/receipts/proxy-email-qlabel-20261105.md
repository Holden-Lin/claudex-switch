# 代理邮箱与额度标签：部分交付清单

人类界面的邮箱与 Gemini 优先标签已实现并验证。JSON 原有隐私契约与派单要求冲突，已向 ROOT 提问，裁定前保留原行为。当前 WorkBuddy 插件不保留独立邮箱字段，因此真实账号邮箱能否显示为 UNKNOWN；没有为补邮箱增加网络请求。

- Dispatch：`CXS-PROXY-EMAIL-QLABEL-20261105`；合同：`CXS-PROXY-EMAIL-QLABEL-20261105-v1`。
- 合同 SHA256：`fcbe0f42c6d4d473c061cfab2b2b2c8483a1f1007f303bee32ba7808e771c319`，已核对。
- 分支：`feat/proxy-email-qlabel-20261105`；基线 `6ccefb30`；实现提交 `c6eca6f`；本清单提交取最终 HEAD。
- ACK 首行写入指定 worker.txt；阶段间经 `signal progress`，每步经 `signal checkpoint`；问题经 `signal ask`。

## 需求映射

| 要求 | 结果 |
|---|---|
| 代理行灰色邮箱，套餐之后 | list 已实现，缺失时省略。读取本地登录记录，无新增第三方请求、无令牌更新。 |
| Gemini 首位，Claude/GPT 单独标注 | 人类列表按 Gemini → 其他模型组显示，缓存同样生效；只有 Claude/GPT 时保留标签，无占位配额。JSON 组顺序保持上游原顺序。 |
| picker / current 一致 | 两者原先仅显示别名与分类，无配额列；现增加灰色邮箱。未增加额度请求。 |
| JSON email 填充 | **待 ROOT 裁定**。现有 JSON 白名单根本没有 email 字段，docs/list-json.md 明确承诺省略邮箱，并非合同假设的 null。裁定前没有新增字段，schemaVersion=1 与所有现有字段不变。 |

## 每个上游的邮箱来源

- Antigravity：CLIProxyAPI 管理的唯一、匹配上游的登录记录 `email`；复用已有认证读取器，认证无效或文件不唯一时省略。
- Cursor：插件本地 `plugin-auth.json` 的 `auth.accountId`，已安装插件的 browser / cursor-agent 登录流程把邮箱存于此字段。
- WorkBuddy 国内 / 国际：读取已有 `auth.email`，或本身符合邮箱格式的 `auth.accountId`。当前已安装 v0.1.30 的浏览器登录调用 `/v2/plugin/login/account` 后，只将 nickname / phoneNumber / uid 保存为 accountId；桌面登录同样只保存显示名。额度读取结果仅有套餐和窗口，无邮箱。**UNKNOWN：真实 WorkBuddy 登录记录是否有邮箱；若昵称不是邮箱，实际列表留空。** 不把 UID、手机号或普通昵称当作邮箱。
- 本次未手工读取真实认证文件、令牌、私有配置；以上字段形状来自项目及已安装插件源码。全部行为验证使用合成临时 HOME。

## 验证证据

- `TZ=UTC bun run verify`：442 pass / 0 fail，2269 断言，43 文件；文档校验、构建和构建版 help 通过。日志 `/tmp/cxs-email-verify.log`。
- `TZ=UTC bun run test tests/cliproxy-usage.test.ts`：11 pass / 0 fail，52 断言，覆盖四类上游邮箱、缺失/昵称省略、current、额度排序及 Claude/GPT 单组。日志 `/tmp/cxs-email-focused.log`。
- `bunx --no-install tsc --noEmit`、`git diff --check` 通过。
- `TZ=UTC node tests/fixtures/proxy-accounts.mjs /tmp/cxs-email-tested.js /tmp/cxs-email-baseline.js`：同一合成 HOME 的基线和修改版渲染通过；4 条邮箱显示、缓存 Gemini 优先、交互选择器邮箱，以及原有 8 条自动代理启动路径全部通过。日志 `/tmp/cxs-email-e2e.log`。
- WorkBuddy 合成登录响应特意使用邮箱形状的 nickname，证明本地 accountId 为邮箱时显示正确；这不证明真实服务会提供邮箱。Antigravity / Cursor fixture 经现有登录路径得到邮箱。
- 沙箱内首次 verify 因禁止回环端口监听失败；自动审批后在沙箱外使用相同临时 HOME 隔离重跑通过。无后台进程保留。
- dist 构建产物已恢复；ROOT 合入或发布时重新构建。

## 同一 fixture 实际输出

修改前：

```text
Accounts

  ── Claude ──
  ▸ native  oauth  Max  claude-opus-5-5
    api     api-key  ••••

  ── Antigravity ──
    agy  running  claude-opus-5-5-high  Claude/GPT 5h 100% · wk 7% · Gemini 5h 92% · wk 40%

  ── WorkBuddy (China) ──
    wb-cn  Free  running  deepseek-v4.1-flash  credits 0% (0/350 left)

  ── WorkBuddy AI (international) ──
    wb-ai  Free  running  deepseek-v4.1-flash  credits 0% (0/350 left)

  ── Cursor ──
    cursor  running  claude-opus-5-5

  5h/wk/mo = remaining quota in the 5-hour / weekly / monthly window
```

修改后：

```text
Accounts

  ── Claude ──
  ▸ native  oauth  Max  claude-opus-5-5
    api     api-key  ••••

  ── Antigravity ──
    agy  fixture@example.com  running  claude-opus-5-5-high  Gemini 5h 92% · wk 40% · Claude/GPT 5h 100% · wk 7%

  ── WorkBuddy (China) ──
    wb-cn  Free  fixture@example.com  running  deepseek-v4.1-flash  credits 0% (0/350 left)

  ── WorkBuddy AI (international) ──
    wb-ai  Free  fixture@example.com  running  deepseek-v4.1-flash  credits 0% (0/350 left)

  ── Cursor ──
    cursor  fixture@example.com  running  claude-opus-5-5

  5h/wk/mo = remaining quota in the 5-hour / weekly / monthly window
```

## ROOT 后续与边界

- `signal ask` 时间 `2026-11-05T00:07:22Z`：是否只为代理 JSON 增加 `email: string|null`，覆盖原来的全局邮箱省略约定。此项尚未获裁定，按合同交付 PARTIAL FINAL，不擅自扩展隐私输出范围。
- 未 push、merge、tag、release 或全局安装；未改共享 TODO、req_changelog、memory。工作树无自建锁。
- 保留忽略目录仅 `node_modules/`（项目依赖，非本次数据）；临时构建和日志在 /tmp。工作树保持干净以便 ROOT 接手。
- 建议 TODO：裁定 JSON email 是否允许暴露；真实 WorkBuddy 邮箱无可用字段时告知用户限制。ROOT 合入时判断发版。
- 无新增技能/记忆建议：现有隐私白名单和插件认证源码已能解释本次限制。

建议 req_changelog（由 ROOT 写共享文件）：

## 2026-11-05 · 代理邮箱与额度归属 · 部分完成：JSON 隐私裁定

### 用户原话
- 合同 goal_source（ROOT 于 2026-11-05 从 Notion TODO 核实）：「这个也要显示邮箱，Claude/GPT是什么东西？」

### 决策与假设
- Decision (ROOT, dispatch): show available proxy email; label Gemini first and keep Claude/GPT quota separate; merge/release/install remain ROOT-owned.
- Decision (worker, method): read local identity only; keep missing email blank; do not infer email from nickname/phone/UID or infer Gemini quota from Claude/GPT.
- Assumption (worker; checked against installed plugin source): current WorkBuddy login usually retains nickname/phone/UID rather than email; real account availability remains UNKNOWN.
- Decision (worker, contract conflict): preserve existing JSON privacy whitelist pending ROOT ruling; no shared metadata edits in the worker branch.

### 验证
- 442 tests / 2269 assertions pass; synthetic built list/picker and eight proxy launch paths pass; real account data untouched.
