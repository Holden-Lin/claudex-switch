# 代理账号显示修正：worker 回执

三项合同修复完成，完整验证及合成 HOME 验收通过。工作分支为 `fix/leftover-polish-20261106`，版本仍为 1.28.2；ROOT 负责评审、合并及补丁发版。真实账号、全局安装和 LaunchAgent 均未操作。

- Dispatch：`CXS-LEFTOVER-POLISH-20261106`；合同版本：`CXS-LEFTOVER-POLISH-20261106-v1`。
- 合同 SHA-256：`6c9fec607a4647ca3c4a537fb0f7b5eccfcd09fb2302ad964df33d63e522cfe8`，读取后已核对。
- 基线：`569e730`。本回执随最终实现提交；最终提交号由 `signal final --commit` 记录，避免回执自引用。

## 结果与边界

- Antigravity 确认、浏览器登录提示、登录失败消息、webconfig 标签及 doctor 帮助采用提供商名称。基线的添加成功行已经是提供商名，保留该行为并增加断言。
- WorkBuddy 两版仅接受有效的 `auth.email`；`accountId` 来源是昵称、手机号或 UID，长得像邮箱也不使用。Cursor 的邮箱型 `accountId` 和其它上游原有读取行为保留。当前 WorkBuddy 插件没有邮箱字段，因此正常资料留空；测试另行覆盖明确邮箱字段及邮箱型昵称。
- Antigravity 按实际显示的默认模型排序：`claude*` / `gpt*` 优先 Claude/GPT，其余保持 Gemini 优先。只调整人读输出；两个标签、缓存和 JSON 数据顺序保留。
- `docs/release-notes/unreleased.md` 已准备；不改版本号。推送工作分支后需要发版，由 ROOT 在合并时处理。
- doctor 诊断中的二进制名称仍为 CLIProxyAPI；这是所检查组件的名称，本次替换的是帮助里的账号描述。

## 验证

- `bun run test tests/cliproxy-usage.test.ts tests/cli-version.test.ts`：30 pass、0 fail、111 assertions。覆盖两版 WorkBuddy 邮箱型昵称、真实邮箱字段、Cursor 邮箱来源、四种模型家族的即时及缓存排序、webconfig 快照标签、doctor 帮助。
- 构建后 `bun run verify`：454 pass、0 fail、2,322 assertions；文档检查、160 模块构建、构建版 help 全通过。通过仓库 preload 隔离 HOME，未裸跑测试。
- `node tests/fixtures/proxy-accounts.mjs dist/claudex-switch.js dist/leftover-before.js`：PASS。四个上游添加成功、8 条自动代理启动路径、list / picker / current / doctor、切换与会话隔离均通过；旧构建用于同一合成资料的前后对比。fixture 禁止非回环网络，临时 HOME 由 fixture 创建并删除。
- 基线旧 fixture 另跑一次，保留旧邮箱型 WorkBuddy 昵称的反例；补充基线采集仅增加打印并适配已修正的正常昵称 fixture。
- 复现日志（临时证据）：`/tmp/cxs-leftover-before.log`、`/tmp/cxs-leftover-baseline-extra.log`、`/tmp/cxs-leftover-after.log`、`/tmp/cxs-leftover-focused.log`、`/tmp/cxs-leftover-verify.log`。关键输出抄录如下，审查无需依赖日志存续。
- 沙箱拒绝假代理的回环监听后，使用已授权提权重跑合成验证；初次将旧 bundle 放到 `/tmp` 导致包解析失败，改放项目 dist 后基线通过。无产品问题遗留。

## 前后输出

添加确认及成功行（去掉终端交互重绘）：

```text
before: Continue with Antigravity via CLIProxyAPI?
after:  Continue with Antigravity for Claude Code?
before: Opening CLIProxyAPI's own Antigravity login in your browser...
after:  Opening Antigravity login in your browser...
before: ✓ Saved as alias agy  Claude Code · Antigravity
after:  ✓ Saved as alias agy  Claude Code · Antigravity
after:  ✓ Saved as alias wb-ai  Claude Code · WorkBuddy AI (international)
after:  ✓ Saved as alias wb-cn  Claude Code · WorkBuddy (China)
after:  ✓ Saved as alias cursor  Claude Code · Cursor
```

list，Opus 行使用同一份模型和额度资料；WorkBuddy before 来自旧邮箱型昵称 fixture，after 使用修正后的正常昵称：

```text
before: agy  fixture@example.com  running  claude-opus-5-5-high  Gemini 5h 92% · wk 40% · Claude/GPT 5h 100% · wk 7%
after:  agy  fixture@example.com  running  claude-opus-5-5-high  Claude/GPT 5h 100% · wk 7% · Gemini 5h 92% · wk 40%
before: wb-cn  Free  fixture@example.com  running  deepseek-v4.1-flash  credits 0% (0/350 left)
after:  wb-cn  Free  running  deepseek-v4.1-flash  credits 0% (0/350 left)
before: wb-ai  Free  fixture@example.com  running  deepseek-v4.1-flash  credits 0% (0/350 left)
after:  wb-ai  Free  running  deepseek-v4.1-flash  credits 0% (0/350 left)
```

picker / current，在修正后的同一正常昵称资料上，旧版与新版均为以下行。邮箱型昵称的拒绝另由两版 WorkBuddy 回归测试直接覆盖：

```text
before/after picker: wb-ai  WorkBuddy AI (international)
before/after picker: wb-cn  WorkBuddy (China)
before/after picker: agy  Antigravity  fixture@example.com
before/after picker: cursor  Cursor  fixture@example.com
before/after current: WorkBuddy AI (international):  wb-ai
before/after current: WorkBuddy (China):  wb-cn
before/after current: Antigravity:  agy  fixture@example.com
before/after current: Cursor:  cursor  fixture@example.com
```

doctor help（命令参数不变），及新版合成诊断：

```text
before: Check or update this account's local CLIProxyAPI
after:  Check or update this account's local provider proxy (Antigravity / WorkBuddy / Cursor)
after doctor agy: Antigravity login: available
after doctor agy: Managed environment: valid
after doctor agy: Managed configuration: valid
after doctor agy: Local authenticated probe: passed
```

webconfig 提供商标签（由 `buildSnapshot()` 回归验证；现有页面直接以 `account.label` 渲染 badge）：

```text
before: 本机 CLIProxyAPI · Antigravity
after:  Antigravity
before: 本机 CLIProxyAPI · WorkBuddy AI (international)
after:  WorkBuddy AI (international)
before: 本机 CLIProxyAPI · WorkBuddy (China)
after:  WorkBuddy (China)
before: 本机 CLIProxyAPI · Cursor
after:  Cursor
```

## 交接与清理

- 按 `session-close` / `landing` 的 worker 规则，只写本回执及合同内文件；共享 TODO、需求沿革与 memory 留给 ROOT。
- 无主动创建的 worktree 锁；无需保留的忽略数据。临时旧 bundle 及基线采集脚本已删除；构建产物由构建命令生成并提交。合成子进程均由 fixture 清理。
- ROOT 建议 TODO：合并并发补丁版本；沿用当前发布流程重命名 unreleased 发布说明。无额外用户待办，无新增 memory 建议。

## 建议需求沿革条目（由 ROOT 整合）

```markdown
## 2026-11-06 · 代理账号提示、邮箱来源和额度排序 · 完成

### 用户原话
- 11-06 状态页（合同核实来源）：「下次发版顺带改掉剩余的 CLIProxyAPI 字样：Antigravity 添加成功提示、webconfig 标签、doctor 帮助」
- 11-05 Notion 行（合同核实来源）：「这个也要显示邮箱，Claude/GPT是什么东西？」

### 决策与假设
- Decision (worker, contract method): WorkBuddy email requires a real email field; email-shaped nicknames stay blank. Antigravity quota order follows the displayed default model family; unknown models retain Gemini-first order.
- Decision (ROOT, contract boundary): merge and release remain ROOT-owned; no real-account mutation or global install by worker.

### 验证
- 454 tests / 2,322 assertions, docs, build and help passed; synthetic HOME covered add/list/picker/current/doctor and 8 automatic proxy launches. Receipt: docs/receipts/leftover-polish-20261106.md.
```

## Fix request 1（修复轮，FINAL v2）

已按 `root-fix-request-1.md` 补齐账号提示旧称，合同版本仍为 v1；交付版本为 `CXS-LEFTOVER-POLISH-20261106-v2`。本轮不改版本号，最终提交号由 FINAL 信号记录。

### 修改范围与保留理由

- 指定五处全部覆盖：切换成功、刷新登录失败、doctor 汇总、webconfig 二进制字段、删除确认。
- 再扫描整个 `src/` 后，补改刷新缺少身份信息、doctor 账号适用范围及配置错误、底层登录缺失、OAuth 端口占用、账号被会话占用、资料类型错误、旧资料列表标签等账号描述。
- 保留的用户可见 `CLIProxyAPI` 均指实际组件：`commands/add.ts` / `commands/cliproxy.ts` 的安装与可执行文件选择；`commands/doctor.ts` 的二进制更新、版本和缺失检查；`providers/claude/profiles.ts` 的替换可执行文件错误；`providers/cliproxyapi/version.ts` / `upstreams.ts` 的实际组件版本兼容性；`providers/cliproxyapi/managed.ts` 的组件操作锁等待、守护进程健康、PID 核验、启动就绪与停止失败。这些提示用于定位安装或进程故障，保留真实组件名。内部标识、注释、环境变量名和路径不属于账号显示文案。
- 延伸现有断言：合成 fixture 检查切换成功及刷新失败完全不含旧称，doctor 仅允许二进制版本行含旧称；webconfig 的真实 HTTP 响应检查两个新文案并拒绝旧称。账号占用测试继续执行真实实现，期望值同步更新。
- 发布说明已扩大提示修正范围。推送本工作分支后仍需补丁发版，由 ROOT 合并与发布；worker 未 merge、tag、release 或全局安装。

### 验证证据

- 先 `bun run build`，再 `bun run verify`：454 pass、0 fail、2,325 assertions，43 个测试文件；文档检查、160 模块构建及构建版 help 均通过。
- `node tests/fixtures/proxy-accounts.mjs dist/claudex-switch.js dist/leftover-before.js`：PASS；同一合成 HOME 对比上一轮构建与本轮构建，新增切换成功、刷新失败及 doctor 汇总断言，同时保留 add / list / picker / current、8 条自动代理启动和会话隔离验证。
- webconfig 经真实 HTTP 入口返回页面，响应包含新字段标签及删除确认文案，不含 `CLIProxyAPI`。额外启动合成 webconfig 尝试浏览器验收，但 CUA 返回 `The browser access host is unavailable`，因此浏览器交互未完成；已停止临时服务器并清理其合成 HOME。
- 初次沙箱运行因回环监听 `EPERM` 失败，获准放开本地监听后重跑上述验证全部通过；真实账号及外部服务未操作。一次 `uv` 脚本因缓存目录读取被沙箱拒绝、尚未执行，随后用 Bun 完成文案编辑。
- 临时日志：`/tmp/cxs-leftover-v2-verify.log`、`/tmp/cxs-leftover-v2-fixture.log`。旧 bundle `dist/leftover-before.js` 已删除；生成的主 bundle 由 build 更新。`git diff --check` 通过。

### 前后输出

前三组来自同一合成 HOME 的新旧构建实际输出；webconfig 两组来自对应页面文案，新版经 HTTP 测试确认：

```text
before: ✓ Switched to agy  Claude  proxy  CLIProxyAPI · local Antigravity login
after:  ✓ Switched to agy  Claude  proxy  local Antigravity login
before: ✗ CLIProxyAPI Antigravity login failed or was cancelled; the existing local account was left unchanged.
after:  ✗ Antigravity login failed or was cancelled; the existing local account was left unchanged.
before: ✓ agy basic local CLIProxyAPI checks passed
after:  ✓ agy basic local Antigravity proxy checks passed
before/after: ● CLIProxyAPI binary: v7.3.20
before: CLIProxyAPI 可执行文件
after:  本机代理可执行文件
before: 本机 CLIProxyAPI 的登录与配置会被删除，需要重新登录
after:  该服务商的本机代理登录与配置会被删除，需要重新登录
```

### 交接

按 session-close / landing 的 worker 边界，只更新合同内文件与本回执；共享 TODO、req_changelog 和 memory 仍由 ROOT 整合。上一节用户原话与决策继续适用；ROOT 可将验证更新为 454 tests / 2,325 assertions，并记录本修复轮扩展了剩余账号提示。无新增用户需求、遗留问题或 memory 建议；无自建 worktree 锁或需保留的临时证据数据，现有依赖不变。工作树留给 ROOT 评审与合并，后续清理由 ROOT 按 landing 流程处理。
