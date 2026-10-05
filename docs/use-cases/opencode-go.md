# 使用 OpenCode Go 订阅账号

OpenCode 2.x 推荐用浏览器授权订阅账号，无需生成或复制 Go API key。已有 API key 的账号仍可沿用旧入口；OpenCode 1.x 继续使用私有 TUI / key 流程。

## 新增第二个订阅账号

```sh
claudex-switch add go-second
# 选择 OpenCode Subscription — browser login (Go / Go Plus)
# 浏览器中登录第二个账号，选择持有 Go 订阅的 workspace，再授权

claudex-switch go-second -run
claudex-switch list
```

添加成功前会检查 workspace 的有效 Go 订阅，并从其 Console 声明的模型与官方 Go 目录中选择可用默认模型。无需首次启动时手填模型。浏览器授权成功但无 Go 订阅、模型不可用或服务不可达，均不创建可用别名；可修正 workspace 后重试。

macOS 优先在支持的浏览器中打开隐私窗口；若仍登录到旧账号，先切换浏览器身份再授权。每个别名都有独立的 OpenCode SQLite 凭据库、会话历史和 XDG 数据 / 状态 / 缓存目录，启动使用 `--standalone`，不改写原生 OpenCode 的全局登录。

## 切换、模型与刷新

```sh
claudex-switch go-first -run
claudex-switch go-second -run
claudex-switch go-second -run --model opencode-go/kimi-k3
claudex-switch model go-second opencode-go/minimax-m3
claudex-switch refresh go-second
```

订阅模型使用 `opencode-go/<model>`；Console 的 OAuth integration 是 `opencode`，但 Go 模型 provider 是 `opencode-go`，`opencode/<model>` 属于 Zen 路由。v1.18.0 误存的 `opencode/` 默认值和旧命令参数会在启动时转为 Go 路由，无需重新登录。实际可用模型以所选 workspace 为准；启动会验证模型，不会把无效的 `-run --model` 保存成下一次默认模型。`model` 命令也先验证再保存。不支持 Claude / Codex 的 effort 参数。

OAuth token 只保存在该别名的原生 OpenCode 数据库中，由 OpenCode 负责续期和写回。`refresh` 在临时私有数据库中重新登录、验证订阅，再通过 OpenCode 支持的本地凭据接口替换；必须是同一账号和 workspace。取消、登录错误账号、无订阅或验证失败会保留原 profile；成功刷新保留已有会话。

不同别名可以同时运行；同一订阅别名的启动、续期和刷新共用锁，以免两个私有服务同时轮换 refresh token。运行中若需要再次打开同一别名、刷新或删除账号，请先退出该别名的 TUI；删除会拒绝正在使用的订阅账号并保留别名和凭据。

## 额度与配置

`list` 查询绑定账号的 Console Go 状态，用该账号的 Bearer token 与 workspace ID 读取 5 小时、周、月窗口，显示剩余百分比。无订阅、需要重新授权、服务不可达或缺失的窗口分别显示状态 / 未知，不将缺失数据视为零用量。过期 token 的续期仍由原生 OpenCode 执行。`list --no-usage` 不联网、不续期；JSON 继续遵循 [既有输出合同](../list-json.md)，不包含账号邮箱或 token。

启动前检查当前项目合并后的 provider、默认 agent 和模型库存；保留权限 / system 设置，拒绝自定义 Go provider 或模型路由覆盖，以及选用非 Go 模型的默认 agent。仅选择 Console 的 `opencode-go` 声明中与官方 Go 目录 ID 匹配的模型；同名 Zen 模型也不选入。Go 端点与授权沿用原生 Console 提供的配置。Console 自己的订阅计费和余额策略仍由服务端决定，本工具不更改 `useBalance` 设置。

TUI 内 `/connect` 可以改变当前别名私有库的活动凭据；`list` 始终查询 claudex 绑定的凭据，下次启动也会恢复该绑定。会话历史不跨别名共享，不自动导入原生 OpenCode 历史。V2 拒绝命令行目录与 resume/session 覆盖；从目标项目目录运行。TUI 的 `/sessions` 可选择同一别名库中其他项目的历史，跳转后的项目不再做启动前检查。

OpenCode 默认以 `--auto` 启动，会自动批准未明确拒绝的权限；在可信项目中运行并检查自己的权限规则。

## 保留的 Go API key 入口

`add` 中选择 **OpenCode Go API Key**：

- V1 可显式复制旧 `auth.json` 中的 Go 凭据，或在私有 TUI 中 `/connect` 登录。常规启动通过 `OPENCODE_AUTH_CONTENT` 注入凭据，保留共享 `/resume` 历史。
- V2 可显式导入本机 SQLite 中的 `opencode-go` 凭据，或遮蔽输入 key；只读取 Go，不静默导出其他 provider。保存前以 Go usage 端点验证，401 / 403 拒绝并重试；网络不可达时提示后仍允许保存，首次模型请求可能失败。
- V2 key 保存在 claudex 私有 profile，启动前通过回环本地 API 同步到别名私有数据库；不经 argv 或子进程环境传入。首次启动仍需 `--model opencode-go/<model>`；`refresh` 保持替换 key 的行为。
- key 别名的 `model` 与 `-run --model` 按官方 Go 目录校正模型 ID：TUI 显示名或大小写不同（如 `GLM-5.3-Flash`）自动转成目录 ID（`glm-5.3-flash`），目录中没有的模型直接拒绝并列出可选 ID；旧版误存的默认值在下次启动时自动更正。目录不可达时保留原输入。
- V2 key 别名启动时把官方 Go 目录全部列入 TUI 模型选择器，可直接切换；目录不可达时只列该别名用过的模型（私有历史）。

## 验证范围

已用保存的账号凭据只读核对真实 Console `/api/v2/config` 与 `/api/go/status`：Go 和 Zen 分属两个 provider，额度与网页已用百分比相符；此核对不刷新或修改凭据。

订阅验收使用真实 OpenCode 2.0.22、隔离 HOME、按生产结构模拟的双 provider Console 和浏览器授权响应，覆盖 Go 端点与 OAuth integration 绑定、同名 Zen 排除、旧默认值迁移、A/B 登录、额度、原生 token 轮换、绑定恢复、错误账号 / 无订阅拒绝、刷新保留会话与 CLI 输出。正常脚本入口也验证没有 Node SQLite 实验性警告；未验证真实订阅的模型响应或生产计费。

开发者可在已安装 OpenCode 2.x 的环境运行 `bun run test:opencode-subscription` 重现此验收；需要本地回环端口，测试目录由脚本临时创建。

旧 API key 路径另有网络隔离 CI fixture，固定 OpenCode v2.0.6，验证本地凭据写入、模型检查与 A/B 私有库隔离；最终交互 TUI 被测试 shim 捕获。交互导航与真实模型请求不属于这两套离线验收的范围。
