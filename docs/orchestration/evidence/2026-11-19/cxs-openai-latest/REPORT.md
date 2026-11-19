# OpenAI 最新模型映射交接

已将 `astra` 更新到 `gpt-6.2-astra`、`sol` 更新到 `gpt-6.2-sol`，并同步新建 Codex 代理的 Fable 默认值。旧完整 ID 仍可使用。515 项测试及隔离 CLI 保存、配置、列表显示验证通过；构建、合并和安装待 ROOT 执行。

## 合同与需求

- dispatch_id: `CXS-OPENAI-LATEST-20261119`
- contract_version: `CXS-OPENAI-LATEST-20261119-v1`
- 合同 SHA256 已核对：`89177b4ef4540ffa1f08bd811a407f7c400b576b4dfa3763596906af021d1ac5`。
- 用户原话（合同 goal_source，2026-11-19）：「把claudex-switch里openai的模型映射都改成最新的。astra和sol」
- worker 决策：用实时 Codex 模型目录确定最新版本；保留数字版本简写的固定版本语义、旧完整 ID、已有账号保存的映射及其他提供商的显式选择。

## 先行发现表与证据

| 别名 | 原映射 | 当前 Codex 上游最新 ID | 是否有差异 |
|---|---|---|---|
| astra | gpt-6-astra | gpt-6.2-astra | 是，已更新 |
| sol | gpt-6.1-sol | gpt-6.2-sol | 是，已更新 |

2026-11-19 01:16–01:17 UTC，启动独立的 `codex app-server --stdio`，发送 JSON-RPC `initialize`、`initialized`、`model/list`（参数 `{"includeHidden":true}`）。只输出模型的 id、model、displayName 与 nextCursor；未读取凭据文件或输出密钥。响应的模型 ID 按顺序为：

```text
gpt-6.2-sol
gpt-6.2-astra
gpt-6.1-terra
gpt-reserve
gpt-6.1-sol
gpt-6-astra
gpt-6-sol
gpt-6-luna
gpt-5.6-sol
gpt-5.6-terra
gpt-5.6-luna
codex-auto-review
nextCursor: null
```

同步核对 `/Users/holden/.codex/models_cache.json` 的模型列表；脱敏白名单快照见 [catalog.json](catalog.json)，只保留来源、抓取时间和模型 ID。新启动的独立 app-server 已退出，未触碰现有会话。

## 映射位置清单与范围判定

扫描命令：`rg -n 'gpt-6.*(astra|sol)|astra.*gpt|sol.*gpt' src tests README.md README.en.md docs`，另检查生成文件 `dist/claudex-switch.js`。

| 位置 | 处理 |
|---|---|
| `src/lib/model-shorthand.ts` | astra/sol 命名别名更新；luna/terra 保留 |
| 同文件 `CODEX_MODEL_ALIASES["gpt-6"]` | 保留 `6 → gpt-6-astra`：数字版本简写固定在第 6 代，只有命名别名承诺跟随最新；显式 `gpt-6` 原本就透传 |
| `src/providers/cliproxyapi/upstreams.ts` | Codex Fable 默认映射更新为 gpt-6.2-astra；其他档位保留 |
| `src/index.ts`、`README.md`、`README.en.md` | 帮助和使用示例明确两个最新 ID |
| `docs/local-cliproxyapi.md` | 新建账号的 Fable 默认表和启动输出示例同步；已有保存映射保留 |
| `tests/model-shorthand.test.ts` | 更新当前命名映射断言；新增新别名与旧完整 ID 同时可用的测试 |
| `tests/model.test.ts`、`tests/run.test.ts` | 更新 sol 保存、启动参数和下次启动断言 |
| `tests/cliproxyapi.test.ts` | 更新默认 Fable 解析和启动断言 |
| `tests/relayrouter-transport.test.ts`、`tests/relayrouter-glm.test.ts`、`tests/run.test.ts` 中 RelayRouter 显式 ID | 保留旧 ID：这是特定提供商的显式模型选择及透传夹具，不是 Codex 最新别名映射 |
| `tests/run.test.ts` 的原生恢复配置夹具 | 保留旧 sol 完整 ID，验证已有保存配置兼容性 |
| `docs/use-cases/api-relays.md` | 保留 RelayRouter 显式 Astra 选择；未证实该提供商支持新版，无权猜测替换 |
| `docs/release-notes/v1.28.5.md`、`docs/receipts/*`、`docs/TODO.md` | 历史证据与旧版本结果保留；worker 不修改共享 TODO |
| `dist/claudex-switch.js` | 生成文件，未手改、未构建，待 ROOT 再生成 |

## 验证

1. 先修改测试，再改生产代码。`bun run test tests/model-shorthand.test.ts tests/model.test.ts`：20 pass / 3 fail，失败均为新旧映射差异。重点失败测试：`named codex aliases track the newest generation of each tier`、`latest astra and sol aliases preserve older full model ids`、`updates an active Codex API key account default model using sol`。
2. 修改生产代码后，同命令：23 pass / 0 fail。
3. 仓库常规命令 `bun run test`：**515 pass / 0 fail**，47 文件、2643 断言，37.13 秒。通过仓库 preload 自动隔离 HOME。最初沙箱内的四文件测试因本地端口绑定等环境限制出现额外失败；完整测试在允许回环监听的执行环境通过，无需修改相关逻辑。
4. 仓库没有 `typecheck` script；执行 `bunx tsc --noEmit`，通过。`bun run docs:check` 通过；`git diff --check` 通过。
5. 隔离临时账号，分别执行 `bun run src/index.ts model cx astra`、`sol`、`gpt-6-astra`、`gpt-6.1-sol`。每次核对 registry 默认值、生成的 Codex config model 字段，再执行 `list --no-usage`，实际渲染值依次为：

```text
cx  chatgpt  Pro  fixture@example.invalid  gpt-6.2-astra
cx  chatgpt  Pro  fixture@example.invalid  gpt-6.2-sol
cx  chatgpt  Pro  fixture@example.invalid  gpt-6-astra
cx  chatgpt  Pro  fixture@example.invalid  gpt-6.1-sol
```

6. `bun run src/index.ts help` 显示两个新版映射。代理集成测试验证 `--model fable` 最终启动参数使用 gpt-6.2-astra，私有设置与配置路径沿用既有实现。未发送付费生成请求，也未启动真实代理或客户端会话。

## ROOT 后续与会话影响

- 审核并合并此分支；按 session-close 更新共享 TODO 和 req_changelog。建议记录本报告的用户原话、worker 决策及上述验证证据。
- 这是用户可见的默认映射变化，需要新发布；版本号由 ROOT 决定：`UNKNOWN(release-version)`。运行 `bun run build` 更新 dist，并复核构建版帮助与隔离账号的 model/list 路径。
- ROOT 负责版本提升、release、Homebrew formula、安装到本机。本 worker 未 push、merge、build、发版或安装。
- 当前正在运行的 Codex / Claude Code 会话已经选择模型，升级启动器不会改变它们；需重新启动并重新指定 `--model astra` / `--model sol` 才使用新别名解析。
- 账号已保存为旧完整 ID 时，重启仍按旧 ID 运行，必须显式重选新别名；该行为保留旧完整 ID 兼容性。已有 Codex 代理保存的 Fable 映射同样不会自动覆盖，需 ROOT 按用户意图更新保存映射后重启相关客户端；新建代理用新的默认值。
- 不曾枚举真实运行会话，因此具体受影响会话清单为 `UNKNOWN(running-session-list)`。
- 工作树保持供 ROOT review/merge，不删除。未创建自己的 worktree lock，无工作树内保留的忽略数据；运行测试的临时 HOME 与日志位于系统临时目录，不含真实账号数据。
- 本次不建议新增 skill 或 memory：既有命名别名与固定版本语义、隔离测试和凭据输出白名单规则足以覆盖流程。
