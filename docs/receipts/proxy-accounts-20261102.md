# 代理账号管理与独立会话：交付清单

- Dispatch：`CLAUDEX-PROXY-ACCOUNTS-20261102B`（替代同名无 B 的旧派发）
- Contract：`CLAUDEX-PROXY-ACCOUNTS-20261102B-v1`
- v2 合同 SHA-256：`5dfbef8968a01c743b6ac06063b5ff3987f17049a3eb5d379d86548b87b6a5b6`
- 新 ACK：`2026-11-02T10:47:40.182227Z ACK dispatch_id=CLAUDEX-PROXY-ACCOUNTS-20261102B contract_version=CLAUDEX-PROXY-ACCOUNTS-20261102B-v1 worktree=/Users/holden/code/claudex-switch/.worktrees/proxy-accounts-20261102`，已通过指定 signal 写入 worker.txt。
- ACK：`2026-11-02T09:40:59.256431Z ACK dispatch_id=CLAUDEX-PROXY-ACCOUNTS-20261102 contract_version=CLAUDEX-PROXY-ACCOUNTS-20261102-v1 worktree=/Users/holden/code/claudex-switch/.worktrees/proxy-accounts-20261102`，已通过指定 signal 写入 worker.txt。
- 基线：`8229034`（v1.26.12）；分支：`feat/proxy-accounts-20261102`。

## 用户原话与执行边界

合同核实的 ROOT 会话用户原话（11-02）：「今天早上claudex-switch可能没改透，本质上应该增加workbuddy和agy账号管理（add），claudex-switch workbuddy就和claudex-switch hmanka一样的效果」。

v2 补充用户原话：「然后我在另一台电脑上用claudex-switch agy cc的时候，说auto模式不可用，在这台电脑看看是什么原因，也让那个session处理下」。

ROOT 授权补齐 add、恢复代理全局切换、保证独立会话不被后续全局切换改变模型或提供商，并负责合并、发布及本机安装。验收仅使用合成临时 HOME；不读取真实秘密文件，不启动真实浏览器登录，不修改真实全局账号。派发 worker 不编辑共享 TODO / req_changelog / memory；需求原话与建议由本清单交给 integrator。

## 调查记录

- 已读上一轮合同及 `proxy-no-global-switch-20261102.md`。保留别名后 help 无副作用的修复，按新合同撤销代理拒绝切换。
- 隔离缺口：OAuth 内联 neutralizer 仅覆盖启动时已出现的键；顶层 model 和 `/model` 写入仍经过共享用户设置；代理私有设置未清理其他账号的 managed extra env。v2 统一私有用户设置，保留原有未指定主模型时的 Claude Code 选择规则，不额外强制主模型。
- 新账号共用已有 Antigravity / 订阅创建代码；Cursor 同路径，无额外登录实现。

## 版本与提交

- 发布版本：`v1.27.0`；发布提交用 `v1.27.0^{commit}` 解析，避免清单自引用 SHA。
- 发布地址：<https://github.com/Holden-Lin/claudex-switch/releases/tag/v1.27.0>。提交与 tag 推送后，现有 CI 创建 release、6 个资产与 Homebrew formula 提交；FINAL 前核对终态。
- `origin/main` 已出现独立的 `bafa034`（用户本地忽略规则），合并时保留该提交及主 checkout 的所有原有修改。
- 本地安装：`~/.bun/install/global/node_modules/claudex-switch`。已安装实测 `claudex-switch --version` 为 `1.27.0`，安装入口与构建入口 SHA-256 均为 `22d04b3890e8389ad6b6afe2c2a559d3803c25fec0ab5c56f20d4a21f655abbb`。
- Bun 直接替换旧 Git 依赖遇到 `DependencyLoop`；沿用项目 remove-then-install 流程，先移除旧包记录，再装测试过的本地 tarball，成功。未改任何账号数据。

## 最终行为

- `add` 菜单新增 WorkBuddy、Antigravity、Cursor。WorkBuddy 继续选择 International (`workbuddy-ai`) / China (`workbuddy`)，登录方式、模型发现、失败回滚和凭据隔离全部复用首次运行的创建入口；新增只保存账号，不切换全局。
- OAuth、API Key、本机代理均可用别名或 `use` 全局切换。代理在写全局认证前先启动 / 探测，再写 settings 和 active state；重复选择会复用健康代理并同步端口。旧隐式创建别名保持兼容。
- 代理以 `detached: true`、忽略 stdio、`unref()` 后台运行；订阅类型的后台 supervisor 同时持有插件桥与转换进程，CLI 命令退出后继续服务裸 `claude`。代理停止则本机连接失败，固定的 loopback 地址、代理认证和已清除的 OAuth 状态阻止静默换账号。重新执行别名切换即可启动 / 同步端口。裸 `claude` 仍没有项目会话租约，手工重启后应重新选择别名。
- 切回 OAuth 通过原有恢复路径恢复合成 OAuth 凭据与账号，清掉固定路由键及 managed-env 记录的代理额外键；用户自己的 `KEEP` 设置保留。
- OAuth、API Key、代理 `-run` 都使用私有 `CLAUDE_CONFIG_DIR/settings.json`，首用从全局复制，旧 symlink 自动迁移，之后保存账号自己的设置。`/model` 不再写全局。技能、agents、CLAUDE.md 继续共享，hooks 配置保留，项目配置仍从启动目录发现。OAuth 覆盖文件也统一用 0600 私有文件，用户值不出现在 argv。
- `agy cc`、`use agy cc` 明确等价于 `-run --cliproxy claudecode`，支持原来的首次创建。其他未知尾随参数退出 1、显示 usage，所有 fixture 文件不变；help 仍无副作用。Codex / OpenCode 的原有切换实现未改。

## 全局写入与独立运行覆盖表

集合由真实全局配置 writer 产生，测试在切换前准备独立设置，再逐键核对覆盖（包含 ChatGPT 特有的子代理键，避免只验 WorkBuddy 子集）。OAuth 无额外 env、有额外 env、API Key、代理普通运行、代理继承模型运行五条路径都覆盖。

| 全局代理写入项 | OAuth `-run` | API Key `-run` | 代理 `-run` |
| --- | --- | --- | --- |
| 顶层 `model` | 私有用户设置快照 + 可选账号默认模型 | 私有用户设置快照 + 可选账号默认模型 | 私有用户设置快照；普通启动另有账号模型，`--cliproxy` 不强制主模型 |
| `ANTHROPIC_API_KEY`、`ANTHROPIC_AUTH_TOKEN`、`ANTHROPIC_BASE_URL`、`ANTHROPIC_MODEL` | 固定键全部置空 | 账号自己的值或空值 | 自己的本机地址、认证和主模型规则 |
| `ANTHROPIC_DEFAULT_{FABLE,OPUS,SONNET,HAIKU}_MODEL` | 自己的原生 Opus 5.5 映射，其余置空 | 账号映射 / 原生 Opus 默认 / 空值 | 自己的四档映射 |
| `CLAUDE_CODE_SUBAGENT_MODEL`、`CLAUDE_CODE_SUBAGENT_MODEL_FORCE` | 置空 | 账号映射 / 空值 | ChatGPT 私有子代理映射或空值 |
| `CLAUDE_CODE_OAUTH_TOKEN`、`CLAUDE_CODE_USE_{BEDROCK,VERTEX,FOUNDRY}` | 置空 | 置空 | 置空；全局写入也记录 managed-env，切回清除 |
| `CLAUDE_CODE_AUTO_MODE_SERVER` | 保留用户自有启动值；其他账号拥有的值置空 | 同左，账号 env 可覆盖 | 默认 `0`，账号 env 可覆盖 |
| 账号自定义 env（如 `CLAUDE_CODE_EFFORT_LEVEL`） | 已存账号键集合 + managed-env；保留用户自有值 | 同左，应用自己账号值 | 同左，应用自己账号值 |

私有用户设置不会再重载全局文件，因此后续新增的账号键也不会通过全局设置进入已启动会话。回归另外验证：未激活账号恰好用了同名自定义键时，不抹掉用户手写的压缩百分比 / 自定义值。

## auto 模式调查与实测

- 本机真实 Claude Code `2.1.316` 配合合成 Antigravity 登录和假代理，Opus / Gemini 两条主模型均保持 `permissionMode=auto`，实际 classifier 请求成功后执行无害 Node/Bash 文件写入，内容为 `AUTO_MODE_OK`。
- 发现并修复项目的缺口：分类器实际请求 `claude-sonnet-5`，旧映射没有这个 ID；现在映射到账号目录里的 Sonnet 档（fixture 为 `claude-sonnet-5-5-high`）。假代理明确拒绝目录外模型，因此这不是仅检查设置文件。
- 重现设置禁用：`permissions.disableAutoMode="disable"` 时 init 为 `default`，无 classifier 请求、文件未写，未绕过 Claude 的权限限制。
- 另一台电脑的版本、完整错误和真实模型组额度未知，不能认定此缺口就是它的唯一原因。启动时 unavailable 要查版本 / 模型 / fast / disableAutoMode / 账号视图；执行工具时 cannot determine safety 则查 classifier 的模型、429 或回复解析。Antigravity 登录不是 Claude 订阅登录，网关身份及计费视图要区分。
- 可在那台电脑依次运行 `claudex-switch --version`、`claude --version`、`claudex-switch doctor agy`、`claudex-switch agy cc --debug-file /tmp/claudex-agy-auto.log`；在会话 `/status` 核对模式，关闭 fast 并查各层 disableAutoMode；classifier 失败时用 `list` 查对应模型组额度，`doctor agy --live` 查最小请求，429 等待重置。主模型 Gemini 可用不代表 Claude 模型组有额度。日志只本机查看，勿分享含本机密钥或对话的原文件。完整步骤及官方依据已写入 `docs/local-cliproxyapi.md`。

## 验证结果与复验

- `TZ=UTC bun run verify`：437 pass / 0 fail，2,219 断言；文档检查、构建与构建版 help 全通过。
- `bunx --no-install tsc --noEmit`、`git diff --check`：通过。
- 已安装入口临时 HOME 全路径验收通过：`/tmp/claudex-proxy-accounts-installed.log`；构建入口同样通过：`/tmp/claudex-proxy-accounts-e2e.log`。
- 真实 Claude Code + 已安装入口 + 假 agy 分类验证通过：`/tmp/claudex-proxy-auto-installed/receipt.json`。Gemini 与设置禁用分支：`/tmp/claudex-proxy-auto-gemini/receipt.json`、`/tmp/claudex-proxy-auto-disabled/receipt.json`。

从本 worktree 复验（临时 HOME 自动创建 / 删除，全是合成账号）：

```sh
TZ=UTC bun run test
node tests/fixtures/proxy-accounts.mjs /Users/holden/.local/bin/claudex-switch
bun scripts/verify-proxy-auto-mode.ts /tmp/cxs-auto-opus dist/claudex-switch.js opus
bun scripts/verify-proxy-auto-mode.ts /tmp/cxs-auto-gemini dist/claudex-switch.js gemini
bun scripts/verify-proxy-auto-mode.ts /tmp/cxs-auto-disabled dist/claudex-switch.js disabled
```

## 已安装命令验收输出

```text
version: 1.27.0
add wb-ai: local-cliproxyapi upstream=workbuddy-ai; global unchanged
add wb-cn: local-cliproxyapi upstream=workbuddy; global unchanged
add agy: local-cliproxyapi upstream=antigravity; global unchanged
add cursor: local-cliproxyapi upstream=cursor; global unchanged
switch wb-ai: state.active=wb-ai; list active=true
bare claude: loopback Messages request returned OK after switch command exited
-run native/api/agy/cursor: model/provider unchanged after wb-ai
switch native: state.active=native; list active=true
-run native/api/agy/cursor: model/provider unchanged after native
/model native/api/agy/cursor: private user settings changed; global unchanged
wb-ai --help: all fixture files byte-identical
wb-ai typo: exit=1; all fixture files byte-identical
use agy unexpected: exit=1; all fixture files byte-identical
PASS: add -> list -> global switch -> bare claude -> OAuth restore -> live -run reload isolation
```

settings / state 差异（密钥为 fixture，仍省略值；随机端口以 `<port>` 表示）：

```text
native -> wb-ai:
  state.active: native -> cliproxy-<wb-ai-id>（由别名表断言）
  model: claude-opus-5-5 -> deepseek-v4.1-flash
  env.KEEP: fixture（保留）
  env.ANTHROPIC_BASE_URL: 新增 http://127.0.0.1:<port>
  env.ANTHROPIC_AUTH_TOKEN: 新增本机 fixture key
  env.ANTHROPIC_API_KEY / OAUTH_TOKEN / USE_BEDROCK / USE_VERTEX / USE_FOUNDRY: 空值
  env.ANTHROPIC_MODEL / DEFAULT_{FABLE,OPUS,SONNET,HAIKU}_MODEL: deepseek-v4.1-flash
  env.CLAUDE_CODE_AUTO_MODE_SERVER: 0
  global credentials / oauthAccount: 清除
wb-ai -> native:
  state.active: cliproxy-<wb-ai-id> -> native
  model: deepseek-v4.1-flash -> claude-opus-5-5
  env: 只剩 KEEP=fixture 与 ANTHROPIC_DEFAULT_OPUS_MODEL=claude-opus-5-5
  managed-env.keys: []
  global credentials / oauthAccount: 恢复原 fixture，已断言
```

## 审查、收尾与保留

- 外部只读 review 找到用户自有 env 被同名未激活账号清空、全局代理未清掉 OAuth / cloud 选择器的问题；均已修复并加回归。Reviewer 随后遇到账号额度限制，没有最终 ACCEPT；记录 `--without-review R0`，本 worker 按合同做最终自审、全套测试和用户入口验收，ROOT 负责验收。
- shared TODO / req_changelog / memory 属于 integrator，本 worker 未写。建议其按上面的两段用户原话记一条：恢复代理普通账号能力，隔离用户设置与路由，未知尾随词不能切换，auto 分类映射已用真实客户端验证；另一台电脑的确切错误仍待核对。
- 保留本 worktree 供 ROOT 复验至 `2026-11-04T00:00:00Z`。忽略目录 `node_modules/` 仅为可重装依赖；验收包与日志均在 `/tmp/claudex-proxy-*`，没有需备份的真实数据。落地临时工作树采用同一期限保留或按 landing GC 处理。

## 未决事项

- 另一台电脑的具体 auto 不可用原因待该机版本、完整错误、权限设置与模型组额度证据。本机已复现分类器映射缺口和禁用设置两类路径，未使用真实 agy 上游请求，也未启动真实浏览器登录。
- 旧启动器已经运行的会话不会被本次升级追溯隔离，需重开 `-run`。
- activity 测试沿用此前 UTC 验证方式；本次未修改该模块的时区行为。
