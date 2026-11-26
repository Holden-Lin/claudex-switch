需要用户：跑一次 `claudex-switch list` 确认 12 个别名就是你要的；`cursor`、`manka`、`glm` 等没还原的旧名若还要，告诉 ROOT。

# CXS-ALIASFIX-1126 回执（dispatch CXS-ALIASFIX-1126 · contract CXS-ALIASFIX-1126-v1）

## 结论
- A 已完成：真实 `~/.claudex-switch/aliases.json` 重建为 12 个别名，`~/.codex/accounts/registry.json` 重建为 7 个账号（3 个有别名 + 4 个无别名 ChatGPT 账号）。重建后 `claudex-switch list`（已装 v1.31.0）与事故前两次 list（11-25 07:49Z、11-26 ~02:00Z）逐行对上：同样 12 行、同样的 ▸ 当前标记、同样的模型列。
- B 已完成：`src/lib/paths.ts` 全部 home 路径改为调用时求值；测试运行时（`CLAUDEX_TEST_HOME` 或 `NODE_ENV=test`），home 解析到真实 home、或 store 写入落在真实 home（测试 home 和 tmp 除外），都抛错拒写；`aliases.json` / Codex `registry.json` 写前留滚动备份，恢复步骤写进 `docs/faq.md`。
- 套件：基线 a2cef6f 543 pass / 1 fail，本分支 553 pass / 1 fail。唯一失败两边相同：`run alias session > RelayRouter GLM selection…`，main 上已知红。`suite: 1 failed ⊆ base a2cef6f`。
- 未做：没合并、没推 main、没发版、没安装。本分支发版安装之前，已装的 v1.31.0 没有这些保护和备份。

## A. 还原清单
完整映射（含邮箱、账号 key）放在仓库外的 `~/.local/state/claudex-switch/incident-1126/`：`rebuild.py`、`list-after-restore.log`、`*.restored-1631`。本仓是公开仓库，这里只写脱敏目标。

主证据是事故前 `claudex-switch list` 的完整输出：ROOT 转录 `55c5f594…jsonl`（2026-11-25T07:49Z）和 Codex rollout `01a21593…`（2026-11-26 ~02:00Z）。两次列出的别名集合相同。

| 别名 | 目标 | 依据 / 推断 |
|---|---|---|
| satoshi | claude `satoshi`（oauth） | 依据：list 行 + 同名 profile |
| deepseek | claude `deepseek`（api-key） | 依据：list 行 + 同名 profile |
| hmanka | claude `hmanka`（oauth，Claude 当前账号） | 依据：list 行（▸）+ `state.json` active |
| relayrouter | claude `relayrouter`（api-key） | 依据：list 行 + 同名 profile |
| agy | claude `cliproxy-7067c803…`（antigravity） | 依据：list 模型列 gemini-3.8-flash-high 与该 profile 的 defaultModel 相同 |
| agylam42 | claude `cliproxy-64a8ed3c…`（antigravity） | 依据：唯一剩下的 antigravity profile（排除法），list 的账号列、模型列都对得上 |
| workbuddy | claude `cliproxy-2f06624b…`（workbuddy-ai） | 依据：唯一的 workbuddy-ai profile，模型 hy4free 一致 |
| satoshix | codex ChatGPT `user-G3Mo…::b80c…`（prolite，Codex 当前账号） | 依据：list 的邮箱/plan 与 auth 文件 id_token 元数据一致；带 ▸ |
| holdenx | codex ChatGPT `user-Xskz…::e6d3…`（plus） | 依据：同上 |
| 45x | codex apikey `apikey::b9b3…`，provider hybaliez | 依据：唯一有 codex-run 私有 home 的 apikey 账号，它的 config.toml 里 provider/base_url 是 hybaliez；list 里「$1658.58 used」重建后原样出现 |
| openlam42 | opencode `go-c0846422…` | 依据：opencode `state.json` 的 active 是这个 id，事故前 list 中 openlam42 带 ▸；重建后月度剩余 32%，与之前 33%/37% 连续 |
| opensatoshi | opencode `go-3e1136ee…` | 推断（排除法）；重建后额度 5h/wk 100%、mo 70%，与事故前完全相同，可作佐证 |

Codex registry 字段：
- 三个有别名账号的 email/plan/账号 id：从 auth 文件 id_token 的非密字段在进程内解析，只输出元数据。satoshix 的 `created_at` 沿用 4 月 bak。
- default_model：satoshix `gpt-6.1-sol`；holdenx `gpt-6.1`，取 11-26 那次 list 的值（11-25 那次显示 `gpt-6.1-sol`）；45x `gpt-5.4`，推断自 list 模型列。
- 45x 的 `api_provider`：`{type: custom, name: hybaliez, base_url: https://newapi.hybaliez.com/v1, model: gpt-5.4, env_key: null}`。env_key 取 null 是推断：codex-run config 用的是内嵌 bearer，没有 env_key 行。
- `active_account_key` 设为 satoshix（事故前 list 的 ▸）。`~/.codex/auth.json` 没读也没改；`syncActiveAuthSnapshot` 写回前会核对身份，对不上就不动。
- 4 个无别名 ChatGPT 账号（3 个 team、1 个 free）按 contract 从 auth 文件补回，alias 为空。另有 2 个 apikey auth 文件（`apikey::532d…`、`apikey::d005…`）provider 不明，没放进 registry，文件原样保留。

没还原的旧名（推断：事故前已经不是别名）：
- `cursor`：转录里大量 `cursor --run` 都是测试夹具或合同文字，事故前两次 list 都没有它。
- `manka`、`glm`：profile 还在，但两次 list 都没有。
- `cliproxy-1aa60515…`：codex 上游 profile，没挂别名，也不在 links 里。

夹具 `~/.codex/accounts/dXNlci0xOjphY2N0LTE.auth.json` 已移到 incident 目录，没有删除。事故现场的 `aliases.json.overwritten-1544`、`registry.json.overwritten-1544` 也都备份在 incident 目录。

实跑：
- `claudex-switch list`（已装 v1.31.0）：12 个别名都正常显示。
- 本分支构建产物 `CLAUDEX_ALLOW_REAL_HOME=1 bun ./dist/claudex-switch.js list --json --no-usage`，只读跑在真实 home 上：12 个都是 `configured`。
- satoshi、hmanka、satoshix、openlam42 只做了解析，没有开会话。

## B. 代码改动
1. **路径调用时求值**（`src/lib/paths.ts`）：`HOME` 常量改为 `homeDir()`，取值顺序是 `CLAUDEX_TEST_HOME || $HOME || os.homedir()`。直接读 `$HOME`，是因为 Bun 的 `os.homedir()` 会一直返回进程启动时的值。26 个导出常量改成同名函数（如 `ALIAS_REGISTRY_FILE()`），src/tests/scripts 里共 421 处调用点用脚本机械改写，`tsc --noEmit` 通过。
2. **测试运行拒写真实 home**（`src/lib/home-guard.ts`）：
   - `assertTestHomeIsolated`：测试运行时，home 解析到真实 home 就抛错。
   - `assertTestWriteTarget`：测试运行时，写入目标在真实 home 内、又不在测试 home 或 tmp 内，就抛错。它接在 `writeJson`、`writeJsonSecure`、Codex auth 写入、CLIProxyAPI 私有文件写入、Codex config 写入上，兜住 import 时就算好的旧路径。
   - 真实 home 从用户数据库取。Node 用 `userInfo()`；Bun 的 `userInfo()` 只回显 `$HOME`，所以改用 shell 的 `~user` 展开。每个进程只查一次，而且只在测试运行时查。
   - 报错写明原因和继续方式（`CLAUDEX_TEST_HOME=$(mktemp -d)`）。
3. **滚动备份**（`src/lib/backup.ts`，接在 `saveAliases` / `saveRegistry` 上）：
   - 写之前把磁盘上的旧版拷到 `~/.claudex-switch/backups/{aliases,codex-registry}/<UTC>.json`（0600），各留最近 20 份。
   - 只在身份有变化时拷：别名或账号的增删、改名、改目标，以及 active、provider、默认模型的变化。只有用量字段变时，每天最多拷一份，这样例行刷新挤不掉最后一份好备份。
   - 备份失败只在 stderr 报一行，不阻塞写入。
   - 恢复步骤见 `docs/faq.md` 的「How do I restore aliases…」一节和中文速览。
4. 已重新构建 `dist/claudex-switch.js`（仓库惯例：fix 提交带 dist）。

## 测试（行为 → 证明它的测试）
以下测试都在 `tests/home-isolation.test.ts`：
- 先 import 再设 `CLAUDEX_TEST_HOME`，路径跟着变：`::paths follow a CLAUDEX_TEST_HOME set after import`。
- 按事故原样复现（子进程先 import stores，再设 HOME/CLAUDEX_TEST_HOME，然后调 saveAliases/saveRegistry/saveAccountAuth），只写探针 home，替身真实 home 保持为空：`::incident probe (import stores, then set HOME) writes only the probe home`。**red@a2cef6f**：旧代码往替身 home 写了 8 个文件（`evidence/red-at-old.log`）。
- `NODE_ENV=test` 加真实 HOME，在用任何路径之前就被拒：`::NODE_ENV=test with the real HOME is refused before any path is used`。**red@a2cef6f**（同一日志）。
- `CLAUDEX_TEST_HOME` 指向真实 home 被拒：`::a test run never resolves paths to the real home`。未在旧提交上跑，旧代码没有这个导出。
- 写真实 home 的 store 写入被拒，文件没落盘：`::a store write aimed at the real home is refused and nothing is written`。未在旧提交上跑，旧代码会真的写进真实 home。
- 备份：`::aliases.json is copied before an alias change, not before a no-op rewrite`、`::registry usage refreshes do not rotate backups out; account changes do`、`::an unchanged store is still copied once a day`、`::keeps only the newest 20 backups`、`::a failed backup does not block the store write`。

全套与构建：
- `evidence/base-suite.log`（a2cef6f：543 pass / 1 fail）；`evidence/head-suite.log`（553 pass / 1 fail，同一个 RelayRouter GLM 失败）。
- `bun run build`、`bun run docs:check` 通过，`bun ./dist/claudex-switch.js help` 正常。
- 恢复步骤（把备份 cp 回原位）未在真实输入上跑：真实 home 还没有备份，已装版本不会产生备份。

## 合同逐条
- A1 先备份：做了，incident-1126/ 下有 `*.overwritten-1544` 和夹具 auth。
- A2 Codex 账号表：做了；provider 不明的 2 个 apikey 没放进去（见上）。
- A3 别名表：做了，12 个；cliproxy-* 按 links/upstream 归属，没有单独成别名。
- A4 实跑 list，四个主力别名只做解析：做了。
- B1/B2/B3：做了。恢复走文档步骤，没加子命令：加子命令会多占一个保留字，可能和用户别名撞名。
- 边界：
  - 没碰 `~/.claude-profiles/*`、`~/.codex/auth.json`。
  - `~/.claudex-switch/codex-run/*` 只读了一个 config.toml 里的 provider 行。
  - opencode profiles 只读了 `state.json` 和 `profile.json` 的非密字段。

## 给 ROOT 的建议（memory / 流程，不由本 worker 写）
- 这次事故的直接原因是评审员的探针写进了真实 HOME。本分支发版前，评审合同可以加一句：探针必须用子进程跑，启动环境里就设好 `CLAUDEX_TEST_HOME`，不能 import 之后再改 env。
