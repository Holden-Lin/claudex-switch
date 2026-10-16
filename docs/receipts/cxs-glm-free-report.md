# OpenCode GLM 免费模型修复交接

已修复：受管 OpenCode 会话可看到并选择 `opencode/glm-5.3-flash-free`。原因是私有会话一直使用旧模型目录，并非 GLM 被零价规则误判。修复已在特性分支完成；待 ROOT 审核，未发布。

## 契约与边界

- dispatch_id：`CXS-GLM-FREE-20261016`；版本：`CXS-GLM-FREE-20261016-v1`。
- 契约 SHA-256：`1bc852581372672a2b58f212a334681605adeeea3386f9041388093d48ecc684`，已核对一致。
- 用户原话：「用6.1sol再看看为什么claudex switch现在能看到ds的免费模型，但是看不到glm的。直接opencode 运行是可以的」。
- 基线：`85620016aab8a00e5a1332daa5f96c25ec2aaff9`；分支：`fix/opencode-glm-free-20261016`。
- 未修改真实账号、默认模型、全局安装、版本、tag、Homebrew 或 main；未推送。所有可写验证均使用临时 HOME、假 Go key / 假 Console；未读取真实凭据、key 或密钥配置。

## 原因与定位

先检查外部依赖：本机 OpenCode 为 `v2.0.30`。临时 HOME 下，原生 `opencode models --standalone` 首次返回二进制内置目录；公共目录刷新后再次运行，出现 GLM 免费模型与 LL Alpha 免费模型。[官方公共目录](https://models.opencode.ai/api.json) 中两者均为零价。

v1.23.2 的 `src/providers/opencode/runtime.ts:1081` 与 `src/providers/opencode/console.ts:34` 强制设置 `OPENCODE_DISABLE_MODELS_FETCH=1`；私有 server 又在 `runtime.ts:485` 强制禁止刷新。受管会话的私有目录 / 数据库不复用原生会话的最新目录缓存，因而始终停在二进制内置目录。API key 与 Console 两条路径均受影响。

DeepSeek 的 `opencode/deepseek-v4.1-flash-free` 已在内置目录中，故通过 v1.23.2 的放行规则；GLM 的 `opencode/glm-5.3-flash-free` 不在内置目录中，根本没有进入免费价格检查。相同原因还隐藏了 `opencode/ll-alpha-free`。两者与 DeepSeek 都属于 `opencode` provider，不是 Go / Zen 前缀、命名正则、缓存价格或 `model.json` variant 导致。

`runtime.ts:31` 的全部价格档位零价判断及 `console.ts:211` 的付费禁用规则无需放宽。`-run --model` 仍只接受 Go 启动模型；此次按既有产品约定，在原生 TUI `/models` 选择免费模型，不把免费 ID 改存为账号默认值。

## 修复

- `src/providers/opencode/catalog.ts:13` 提供两条路径共用的公共目录准备函数；key 路径在 `runtime.ts:1081` 校验前调用，Console 在 `console.ts:34` 发现模型前调用。
- 公共目录请求最长 5 秒，私有缓存 5 分钟有效。失败保留上次有效目录；首次离线则继续使用 OpenCode 内置目录。显式禁用联网、自带 `OPENCODE_MODELS_PATH`、自定义 `OPENCODE_MODELS_URL` 均受尊重。
- 按内容 SHA-256 保存不可变目录文件，通过 `OPENCODE_MODELS_PATH` 贯穿发现、路由检查和最终 TUI。原生后台刷新仍禁止，避免 Console 的付费禁用清单与启动时目录不一致；并发启动也不改写另一启动已固定的目录。
- 不硬编码模型 ID，不修改 Go 模型解析、用户禁用规则、零价检查及压缩保护。仅新增目录数据来源，并重建 `dist/claudex-switch.js`。

## 验证证据

- `bun run test`：320 通过、0 失败、1,469 断言，34 个测试文件；按项目 preload 隔离 HOME。沙箱内全量首次被回环监听限制中断，允许本机测试端口后完整重跑通过。
- 新增 5 项测试覆盖 key / Console 校验前目录准备、新模型与不含 free 的零价模型、缓存有效期、离线 / 非法响应 / HTTP 失败回退、自定义设置、并发刷新后旧启动的目录不变；Console 既有测试另覆盖 GLM 与不含 free 的零价模型，并保留付费 / 显式禁用断言。
- `bun run node_modules/typescript/bin/tsc --noEmit`、`bun run build`、`bun run docs:check`、`git diff --check` 均通过。
- 原版打包 CLI 与修复版打包 CLI，分别通过真实 OpenCode 私有 server / 凭据同步，再将最终 TUI 替换为原生 `models --standalone`，完成前后对照，见 [模型清单](cxs-glm-model-list.txt)。两次子进程均退出 0。
- 最终构建真实 TUI：`glm-proof -run` → `/models` 显示 GLM、DeepSeek 与 LL Alpha 免费模型 → 选择 GLM / 默认 variant → 主界面显示 `Build auto · GLM-5.3-Flash Free OpenCode` → Ctrl+C 退出 0，见 [PTY 摘录](cxs-glm-tui-proof.txt)。私有 `model.json` 的 recent 确认为 `opencode/glm-5.3-flash-free`；退出后 `lsof +D <临时 HOME>` 无进程。
- 临时 profile 的默认模型前后均为 `opencode-go/kimi-k3`，文件 SHA-256 均为 `0aa7b6bf34906c2d70e3424c555b8ce9fd0c53ac4199b89e54d5c04d143d9508`。真实 profile 未调用，未运行全局 claudex-switch。
- 真实 OpenCode + 假 Console 完整验收通过，使用最新公共目录：付费模型过滤、Go 端点 / OAuth、A/B 隔离、token 续期、错误账号拒绝及无凭据泄漏均通过，见 [Console 证据](cxs-glm-console-proof.txt)。

| 模型样例 | 原版构建 | 修复构建 |
| --- | --- | --- |
| `opencode/deepseek-v4.1-flash-free` | 可见 | 可见 |
| `opencode/glm-5.3-flash-free` | 缺失 | 可见、TUI 可选择 |
| `opencode/ll-alpha-free` | 缺失 | 可见 |
| `claudex-switch-opencode-go/glm-5.3-flash` | 可见 | 可见 |
| `opencode/glm-5.3-flash`（付费 Zen） | 隐藏 | 隐藏 |

此次只验证模型发现、路由校验、界面选择及退出，未发模型推理请求。初次离线且没有新缓存时，新模型仍须等网络恢复后启动才可发现；每个不同目录内容会留一份私有缓存快照，供已启动会话保持一致。

## 交给整合者的记录建议

- TODO：审查本分支后决定是否合入 / 发版；本契约明确要求由 ROOT 审核后发布。共享 TODO / req_changelog / memory 由整合者维护，本 worker 未修改。
- req_changelog 建议：保留上述用户原话；原因记为「私有目录禁刷，GLM 新模型未入旧快照；今于启动前取新目录，校验与 TUI 同用定本，付费过滤及默认模型不改」；验证记为「320 测试、1,469 断言、真实 TUI 选 GLM 并退出、Console 完整验收皆过」。
- 复盘建议：遇到“原生工具可见、受管工具不可见”，先比较真实 API / 公共目录与隔离会话目录，再查价格过滤；不凭某个已有免费模型通过便认定目录同步无碍。现有测试已锁住这条跨层路径，无需另建技能。
