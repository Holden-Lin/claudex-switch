# 代理账号独立分区：交付清单

已将 Antigravity、WorkBuddy 国内版 / 国际版和 Cursor 放入独立分区，隐藏 ChatGPT 代理的人类界面入口。合成账号的 8 条直接启动路径均已通过；真实浏览器登录和真实上游调用未验证，留为 UNKNOWN。合并、发布和安装由 ROOT 执行。

- Dispatch：`CXS-LIST-PROXY-SECTIONS-20261104`；合同：`CXS-LIST-PROXY-SECTIONS-20261104-v1`。
- 合同 SHA256：`82c9f11a469dfdf01335996d277e8457f133735256c6e4bc5b0a99b1d0d53504`，读取后已核对。
- ACK：`2026-11-04T01:46:22.747641Z`，通过指定 `harnessctl.py signal ack` 写入 worker.txt，之后各阶段追加 CHECKPOINT / PROGRESS。
- 分支：`feat/list-proxy-sections-20261104`；基线：`f293882`（v1.27.1）。实现提交：`a4873c1e27b177687d553024c51e8d18f604fc19`；本清单提交取分支最终 HEAD。

## 需求与落实

| 合同要求 | 结果与证据 |
|---|---|
| 各上游独立分区，空区隐藏 | Claude → Antigravity → WorkBuddy (China) → WorkBuddy AI (international) → Cursor → OpenCode Go → Codex → OpenCode。标题沿用上游定义，只有存在账号的分区才显示；新增渲染测试和下方构建版输出验证。 |
| 列表不出现 CLIProxyAPI 分类 / 前缀 | 代理行只保留套餐、running / stopped / login required / invalid config / invalid private env、模型和原有额度 / 年龄格式。既有 quota 测试继续验证未知字段隐藏、模型组分开、积分和缓存。 |
| 隐藏 ChatGPT 代理 | upstream=codex（包括旧 profile 未写 upstream）从人类 list、无参数选择器和 current 隐藏；add 删除对应选项。原生 Codex ChatGPT 保留。未删除任何账号数据。 |
| JSON 兼容 | schemaVersion=1 及所有既有字段保持不变；保留完整清单，包括隐藏的 ChatGPT 代理，不新增 section / upstream 字段。说明写入 docs/list-json.md。 |
| 登录后自动用代理 | 原实现已自动准备代理，无需改运行逻辑。fixture 从真实 add 菜单创建四类合成账号，再逐一调用 -run 和 cc，假 Claude 均向回环 Messages 接口发请求并取得 OK，共 8 条路径。 |
| 旧 chatgpt 别名仍可运行 | 既有 cliproxyapi.test.ts 的 chatgpt runAliasSession 测试继续通过，验证客户端启动、模型映射、私有设置及认证隔离。remove / rename / purge 代码不变，既有回归继续通过。 |
| 选择器与 current | 复用账号显示分区函数；fixture 实际打开无参数选择器，确认上游名可见、隐藏账号和 CLIProxyAPI 文案不可见；单测依次激活六种 profile 并调用 current 验证。 |

## 验证

- `TZ=UTC bun run verify`：436 pass / 0 fail，2,256 断言，43 个测试文件；文档校验、全量测试、构建和构建版 help。日志：`/tmp/cxs-sections-final-verify.log`。
- `bunx --no-install tsc --noEmit`、`git diff --check`：通过。
- `TZ=UTC node tests/fixtures/proxy-accounts.mjs /tmp/cxs-list-sections-tested.js /tmp/cxs-list-baseline.js`：通过。基线由 `git archive f293882 src package.json` 的源码构建；同一合成 HOME 分别运行基线和修改版 list。日志：`/tmp/cxs-sections-e2e-before-after.log`。
- fixture 除本需求外还验证全局切换、裸 Claude 的回环请求、会话隔离、共享设置重新加载、help / 错误参数不修改账号文件。原测试 HOME 自动清理，后台代理只按该 HOME 的状态 PID 停止。
- 固定验收构建 SHA256：`53023729dafed96d545e3159008d3eebf6b3b8a4d26ba87eadf805254c19fd15`。一轮 fixture 中途恢复 dist 导致后续调用了旧构建，分区断言失败；随后固定 /tmp 构建入口重跑完整验收。
- 初次在沙箱内跑代理测试因回环端口监听受限失败；获自动审批后在沙箱外重跑，仍使用 preload / fixture 的临时 HOME。
- UNKNOWN：真实浏览器登录、真实提供商响应和实际 Claude Code 与这些上游的完整会话。合同禁止读取真实账号和凭据；本轮未访问它们，不以假服务结果宣称真实登录已验证。

复验：

```sh
TZ=UTC bun run verify
TZ=UTC node tests/fixtures/proxy-accounts.mjs dist/claudex-switch.js
bunx --no-install tsc --noEmit
```

## 同一 fixture 的实际渲染

修改前（f293882）：

```text
Accounts

  ── Claude ──
  ▸ native          oauth  Max  claude-opus-5-5
    api             api-key  ••••
    wb-ai           local CLIProxyAPI  WorkBuddy AI (international) · running  deepseek-v4.1-flash
    wb-cn           local CLIProxyAPI  WorkBuddy (China) · running  deepseek-v4.1-flash
    agy             local CLIProxyAPI  Antigravity · running  claude-opus-5-5-high
    cursor          local CLIProxyAPI  Cursor · running  claude-opus-5-5
    legacy-chatgpt  local CLIProxyAPI  CLIProxyAPI · running  fable
```

修改后：

```text
Accounts

  ── Claude ──
  ▸ native  oauth  Max  claude-opus-5-5
    api     api-key  ••••

  ── Antigravity ──
    agy  running  claude-opus-5-5-high

  ── WorkBuddy (China) ──
    wb-cn  running  deepseek-v4.1-flash

  ── WorkBuddy AI (international) ──
    wb-ai  running  deepseek-v4.1-flash

  ── Cursor ──
    cursor  running  claude-opus-5-5
```

此对比使用 `list --no-usage`，因此不显示额度；额度与年龄显示由现有额度测试覆盖。

## 交接给 ROOT

- 未 push、merge、tag、release 或全局安装；未改共享 TODO / req_changelog / memory。工作树无自建锁，无保留的忽略数据；临时日志和基线构建位于 /tmp。
- 构建用于验收；dist 生成物恢复为基线，不纳入 worker 的 src / tests / 用户文档权限范围。ROOT 发版时从本分支源码重新 build，并判断版本号。
- 本轮为界面范围调整，现有显示与 HOME 隔离规则已有文档；无需新增技能或持久记忆。
- 建议 TODO：将本次分区与菜单需求标为完成；合并后按项目既有流程评估发版。

建议 req_changelog 内容（由 ROOT 整合，不在本工作树改共享文件）：

### 用户原话
- 合同 goal_source 核实的用户原话（2026-11-04）：「WorkBuddy / agy / Cursor 进了 add，list也要把他们显示出来，CLIProxyAPI这个类别就可以不显示了。登陆了比如agy,自动就可以用cliproxy」

### 决策与假设
- Decision (ROOT prompt; user selected): each provider gets a section; hide ChatGPT-via-proxy in list and add. The wording of those choices was ROOT's.
- Decision (worker, method): keep JSON schema 1 and complete inventory; align picker/current with human list visibility. Existing aliases and account data remain usable.
- Assumption (worker; checked with synthetic add and eight loopback client paths): saved provider aliases start their proxy through -run or cc without an extra setup flag. Real login remains UNKNOWN under the contract boundary.

### 验证
- 436 tests / 2,256 assertions；构建版 fixture 已验证独立分区、菜单、选择器和 8 条自动代理启动路径。
