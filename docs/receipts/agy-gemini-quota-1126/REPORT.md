需要用户：无

已完成主合同和 addendum-1。Antigravity 人类列表只显示 Gemini 额度；旧客户端请求头导致漏组的问题已修复。Codex 纯数字模型统一选择 Sol。建议 ROOT 评审后合并、同批发布 **v1.30.1**；本 worker 未发版、未推 tag、未改 formula。

## 合同逐项回执

- 修改限于合同工作树、分支 `fix/agy-gemini-quota-1126`。未编辑主 checkout、registry、共享 TODO/需求记录/memory；这些由 ROOT 集成。
- 已核对合同 SHA256，并通过 `harnessctl signal ack` 写回 ACK；阶段间已发 progress。
- `src/commands/list.ts` 直接取 `Gemini` 分组的窗口，去掉默认模型排序及组名前缀。证明：`tests/cliproxy-usage.test.ts` 的 `reads Gemini windows through live, cached and JSON list without a group prefix`、`shows only Gemini quota for model %s in live and cached output`（四种默认模型）。JSON 保留完整数据分组，测试也核对了缓存与 JSON 取数。
- 根因：同一真实接口、凭据、project，旧 User-Agent `antigravity/1.19.6 darwin/arm64` 只返回 Claude/GPT；改成 `antigravity/hub/2.25.0 darwin/arm64` 后两个真实账号均返回 Gemini。对照证据：`evidence/quota-diagnostic.log` 与 `evidence/quota-new-client.log`，仅含额度分组，没有凭据。生产请求头有单测核对。研究线索见[实现方的客户端兼容性记录](https://github.com/JerryGong1002/antigravity-weekly-quota/blob/main/README.md#data-source-and-compatibility)；结论以本机同条件复测为准。
- Gemini 缺失时，取数返回 `usage n/a`，不让只有 Claude/GPT 的结果替换最后有效额度。没有有效缓存时，按其它账号规则省略不可用额度。证明：`Claude/GPT-only quota omits unavailable Gemini windows without fallback`、`a refresh missing Gemini keeps the last valid Gemini quota`。上游只报告周额度时不补造 5h：`Gemini weekly-only summary does not invent a five-hour window`。
- Codex 数字 `6.1/6.2/6/5.6` 以及其它数字版本统一展开为 `gpt-<数字>-sol`。**行为变化：`6` 从 `gpt-6-astra` 改为 `gpt-6-sol`**。证明：`tests/model-shorthand.test.ts` 的 `bare Codex %s always selects sol`、其它裸版本用例。显式 GPT ID 和命名别名由该文件原有用例覆盖。
- 启动参数与默认值持久化由 `tests/run.test.ts` 的 `maps -model %s to %s in spawned Codex arguments and saved default` 覆盖（6.1、6、完整 ID）。另实际运行 CLI：`bun run src/index.ts cx -run --model 6.1`，使用隔离的合成 Codex 账号与只打印参数的 codex 替身；捕获 `Running codex --approve-for-me --model gpt-6.1-sol`。证据：`evidence/codex-cli.log`。没有启动真实 Codex 会话，也没有修改真实账号默认值。
- 已执行 `git fetch origin main` 和 `git merge --no-edit origin/main`，结果 Already up to date（基线 `8a2e55effaf290b8fa57c2406269bcb386b5601c`）。

## 真实用户输出

通过 `CLAUDEX_ALLOW_REAL_HOME=1 bun run src/index.ts list` 完成真实账号验证；此开关用于合同授权的本次验证。仅让应用正常取数，未手动读取 token/凭据内容。

改前（`evidence/agy-before-live.log`）：

```text
agy       gemini-3.8-flash-high  Claude/GPT 5h 100% · wk 99% Wed19
agylam42  claude-opus-5-5-high  Claude/GPT 5h 100% · wk 100% Wed19
```

改后（`evidence/agy-after.log`）：

```text
agy       gemini-3.8-flash-high  5h 94% · wk 70% Tue16
agylam42  claude-opus-5-5-high  wk 95% Thu10
```

以上摘录去掉了邮箱、运行状态及对齐空白，证据文件保留 Antigravity 原始段落。已逐行对照真实响应：agy 的 Gemini 剩余 0.94801867 / 0.701186 对应 94% / 70%；agylam42 的 Gemini 只有 weekly=0.9507656，所以显示 wk 95%，不猜 5h。没有对照 Antigravity 官方客户端页面（未测）；已核对用户实际使用的 claudex-switch 终端输出。

## 验证

- `bun run test tests/model-shorthand.test.ts tests/cliproxy-usage.test.ts`：41 pass / 0 fail（`evidence/focused.log`）。修改前同批显示与模型测试 11 fail，见 `evidence/red.log`。
- 全套 `bun run test --reporter=junit --reporter-outfile=.tmp/suite.xml`：542 pass / 0 fail（`evidence/suite.log`、`evidence/suite.xml`）。之后将既有启动参数测试扩展为三组，再单独跑：4 pass / 0 fail（`evidence/codex-integration.log`，含原有 Claude 用例）。
- 所有测试使用仓库 preload 隔离 HOME。首次受限沙箱因本地端口权限失败的运行已中止；上述完整全套在允许监听本地测试端口后通过。
- 基线工具复用上述 JUnit：`suite: 0 failed ⊆ base 8a2e55effaf290b8fa57c2406269bcb386b5601c`（`evidence/suite-comparison.log`）。
- 将新增测试放到基线源码的独立副本重跑：数字 6.1/6.2/6 与缺失 Gemini 刷新共 4 fail，5.6 原本就通过（`evidence/base-regression.log`）。`guard tests: tests/cliproxy-usage.test.ts::a refresh missing Gemini keeps the last valid Gemini quota red@8a2e55e`。
- `bun run build` 通过（`evidence/build.log`），已由构建重新生成 dist，没有手改生成文件。当前 Bun 1.3.5 与基线生成器版本/依赖解析路径不同，dist 包含额外的构建器输出差异。
- 构建产物：隔离合成 Antigravity 账号缓存同时放入 Claude/GPT 与 Gemini，再运行 `node dist/claudex-switch.js list --cached`，输出 `5h 92% · wk 40% Wed19`，无组名前缀（`evidence/built-list.log`）。合成 profile 未完整配置，状态文字是 invalid config；本次核验针对实际 dist 的缓存→列表渲染。真实账号完整数据源→请求→解析→缓存→CLI 渲染由前述 `agy-after.log` 覆盖。
- 额外手动运行的历史 `node tests/fixtures/proxy-accounts.mjs dist/claudex-switch.js` 未通过：116 行仍要求新增订阅输出旧的 `Claude Code · …` 文案，当前原生订阅流程已不如此输出。相同基线脚本+基线 dist 在同一行失败（`evidence/proxy-cli.log`、`evidence/proxy-cli-base.log`）。它不属于默认测试套件，并在额度断言之前退出；没有宣称此脚本通过。本次仅同步该脚本末尾的 Gemini 额度预期，不改其无关的新增订阅流程。

## 交付与 ROOT 集成建议

- 代码提交：`d278242`。
- 建议版本 v1.30.1：两个修复可同批发布；最终版本号与 release 由 ROOT 决定。
- 需求原话供 ROOT 记录：「claudex-switch把agy额度只显示gemini模型额度，和其他一样，5h和周。」「codex --model只输入数字，指sol」。worker 不重写共享 req_changelog。
- 无新增用户待办。没有新增技能或 memory：本次问题及验证路径可以由代码、测试和本报告推导。
- 工作树留给 ROOT 评审与合并；未加工作树锁，未推分支。临时诊断、合成账号和基线副本在提交前清理；保留证据全在本目录，无忽略数据需要另行保留。
