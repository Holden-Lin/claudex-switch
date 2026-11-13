# REPORT — `fable` 简写默认指向 Fable 5.2（CXS-FABLE52-20261113）

分支 `feat/fable-5-2-default`（基于 origin/main b82c365），未合并、未发布、未安装。

## 改动

| 位置 | 变化 |
| --- | --- |
| `src/lib/model-shorthand.ts` `CLAUDE_LATEST_FABLE` | `claude-fable-5-1` → `claude-fable-5-2` |
| `src/providers/cliproxyapi/managed.ts` `CLAUDE_CODE_MODEL_IDS` | 新增 `claude-fable-5-2`，保留 `claude-fable-5-1` |
| `docs/local-cliproxyapi.md` | `modelOverrides` 说明补上 5-2 |
| 测试 | `tests/model-shorthand.test.ts`、`tests/run.test.ts`、`tests/cliproxy-link.test.ts` |
| 发版准备 | `package.json` 1.28.6、`docs/release-notes/v1.28.6.md`、重建 `dist/claudex-switch.js` |

全 src 搜索 "fable" 后，会解析成具体 Fable ID 的只有以上两处。其余命中是档位字段名（`fableModel`、`ANTHROPIC_DEFAULT_FABLE_MODEL`）或代理账号自己的映射（如 codex 的 `gpt-6-astra`），与 Fable 版本无关，未改。帮助文本只写 `fable`，无版本号。

行为：
- `--model fable` / `claudex-switch model <alias> fable` → `claude-fable-5-2`
- `fable5.1`、`claude-fable-5-1` 仍原样可用（有测试）
- 已保存的账号默认模型不改写；本地 CLIProxyAPI 账号的 `fable` 仍走该账号自己的映射

## 验证

- 先改测试，旧代码上失败：`Expected "claude-fable-5-2" / Received "claude-fable-5-1"`（model-shorthand、run、cliproxy-link 各一项）；改 src 后通过。
- 干净环境 `env -i PATH HOME TMPDIR bun run test`：485 通过，0 失败。
- `bun run build` 成功；`node dist/claudex-switch.js --version` → 1.28.6，产物内含 `claude-fable-5-2`。

## 需要知道的一点

在 Claude Code 会话的 shell 里直接跑 `bun run test` 是 484 通过、1 失败：`run alias session > RelayRouter GLM selection persists…`（`tests/run.test.ts:717`，`CLAUDE_CODE_MAX_CONTEXT_TOKENS` 期望 undefined，得到 ""）。该测试与本次改动无关，干净环境下通过；原因是测试继承了会话 shell 里的 Claude 环境变量，具体是哪一个变量未定位。本次未修。

## 发版判断

需要发版：这是随二进制分发的用户可见行为变化。建议 patch 版本 **v1.28.6**，版本号、发布说明和 dist 已在分支上备好。合并到 main 后打 tag `v1.28.6` 并推送即可，Formula 未改。

## 提交

- 4b26634 feat: bare fable shorthand resolves to Claude Fable 5.2
- 其后一条：release prep v1.28.6（含本报告）
