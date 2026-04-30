# claudex-switch

**语言 / Languages:** [中文](./README.md) | [English](./README.en.md)

一个统一管理 Claude Code 和 Codex 账号的 CLI 工具。支持别名切换、额度查看，适合在多个订阅账号、团队账号、API Key 之间频繁切换。

## 特点

- 统一管理 Claude Code 和 Codex 两套账号体系
- 每个账号支持自定义别名，`claudex-switch <alias>` 一键切换
- `claudex-switch <alias> -run` 切换账号后直接启动免权限确认的 Claude Code / Codex 会话
- `claudex-switch list` 刷新并显示所有 Codex ChatGPT 账号的当前额度
- 薄别名层架构，不破坏原有工具数据（`~/.claude-profiles/` 和 `~/.codex/accounts/`）
- 只在 `claudex-switch --version` 时检查最新 GitHub Release，并在显示版本前自动升级
- Claude 支持 OAuth 订阅 + API Key
- Codex 支持 ChatGPT OAuth + OpenAI API Key
- macOS Keychain 凭证兼容

## 安装

### 方式一：安装脚本（推荐）

```bash
curl -fsSL https://raw.githubusercontent.com/Holden-Lin/claudex-switch/main/install.sh | bash
```

默认会安装最新 GitHub Release；如果仓库还没有发布过 release，会自动回退到 `main` 分支。

安装后的 `claudex-switch` 只会在执行 `claudex-switch --version` 时检查最新 GitHub Release；如果发现新版本，会先自动更新，再显示版本号。

如果你想手动触发升级，也可以运行：

```bash
claudex-switch update
```

也可以显式指定版本或引用：

```bash
# 安装指定版本 tag
VERSION=1.0.0 curl -fsSL https://raw.githubusercontent.com/Holden-Lin/claudex-switch/main/install.sh | bash

# 安装指定分支 / commit / tag
INSTALL_REF=main curl -fsSL https://raw.githubusercontent.com/Holden-Lin/claudex-switch/main/install.sh | bash
```

### 方式二：Bun 全局安装

```bash
bun install -g git+https://github.com/Holden-Lin/claudex-switch.git
```

### 方式三：Homebrew

推送 `v*` tag 后，release workflow 会自动生成并更新 `Formula/claudex-switch.rb`。之后可以直接：

```bash
brew install --formula https://raw.githubusercontent.com/Holden-Lin/claudex-switch/main/Formula/claudex-switch.rb
```

### 本地开发

```bash
git clone git@github.com:Holden-Lin/claudex-switch.git
cd claudex-switch
bun install
bun run test
bun run verify
bun run build
```

## 快速开始

```bash
# 导入已有的 Claude 和 Codex 账号
claudex-switch import

# 查看所有账号
claudex-switch list

# 切换到指定别名
claudex-switch holden

# 切换账号并直接启动免权限确认的会话
claudex-switch holden -run

# 添加新账号
claudex-switch add my-claude
claudex-switch add my-codex

# 刷新已保存的登录态
claudex-switch refresh holden
claudex-switch refresh satoshix

# 立即升级到最新 release
claudex-switch update
```

### 导入已有账号

如果你已经在用 `claude-switch` 或 `codex-auth`，可以一键导入：

```bash
claudex-switch import
```

工具会自动扫描 `~/.claude-profiles/` 和 `~/.codex/accounts/registry.json`，为每个账号创建别名。

### 手动添加账号

```bash
claudex-switch add work
```

然后选择账号类型：

- **Claude OAuth** — 使用 Claude 订阅（Pro、Max、Team 等）
- **Claude API Key** — 使用 Anthropic API key
- **Codex ChatGPT** — 使用 ChatGPT 登录（Plus、Pro、Team 等）
- **Codex API Key** — 使用 OpenAI API key，可选择官方接口或 OpenAI-compatible 自定义供应商

选择 Codex API Key 后会继续选择接口来源：

- **OpenAI official** — 只保存 API key，不写自定义供应商配置
- **Custom OpenAI-compatible provider** — 同时写入 `~/.codex/config.toml` 的 `model_provider`、`model` 和 `[model_providers.<name>]`

自定义供应商示例配置：

```toml
model_provider = "admin"
model = "gpt-5.3-codex"

[model_providers.admin]
name = "admin"
base_url = "https://newapi.hybaliez.com/v1"
env_key = "OPENAI_API_KEY"
requires_openai_auth = false
```

## 命令

| 命令 | 说明 |
|---|---|
| `claudex-switch` | 交互式账号选择器 |
| `claudex-switch <alias>` | 切换到指定别名（`use` 的快捷写法） |
| `claudex-switch <alias> -run` | 切换账号并启动对应 Claude Code / Codex 免权限确认会话 |
| `claudex-switch add <alias>` | 添加新账号 |
| `claudex-switch use <alias>` | 切换到指定别名 |
| `claudex-switch use <alias> -run` | `claudex-switch <alias> -run` 的显式写法 |
| `claudex-switch list` | 列出所有账号及额度 |
| `claudex-switch rename <old> <new>` | 重命名别名 |
| `claudex-switch refresh <alias>` | 重新登录并更新该别名保存的凭证快照 |
| `claudex-switch current` | 显示当前活跃账号 |
| `claudex-switch remove <alias>` | 只删除别名，不删除底层账号 |
| `claudex-switch purge <alias>` | 删除底层账号及其关联别名 |
| `claudex-switch import` | 从已有数据导入账号 |
| `claudex-switch update` | 升级到最新 GitHub Release |
| `claudex-switch --version` | 显示版本号；如有新 release，会先自动更新 |
| `claudex-switch help` | 显示帮助 |

**快捷方式:** `ls` = `list`，`rm` = `remove`，`-V` = `--version`

### 刷新过期登录

当 Claude OAuth 或 Codex ChatGPT 的本地登录态过期时，可以按别名刷新：

```bash
claudex-switch refresh <alias>
```

- Claude OAuth：切换到对应 profile，执行 `claude auth login`，然后把当前凭证重新保存回该 profile
- Codex ChatGPT：切换到对应账号快照，执行 `codex login --device-auth`，然后把新的 `~/.codex/auth.json` 回写到该别名
- API Key 类型账号不需要 refresh

在 macOS 上，`claudex-switch` 会主动用私密 / 无痕窗口打开 Codex 的 device auth 页面；如果浏览器没有自动打开，终端里也会显示固定地址让你手动访问。

## 输出示例

```
  Accounts

  ── Claude ──
    holden   oauth  Pro  holden@example.com
  ▸ satoshi  oauth  Pro  satoshi@example.com

  ── Codex ──
  ▸ cx-main    chatgpt  Plus  alice@gmail.com       5hrem: 55%  wkrem: 88%
    cx-team    chatgpt  Team  bob@company.com       5hrem: 0%   wkrem: 65%
```

- `▸` 表示当前活跃账号
- `5hrem` / `wkrem` 分别表示 5 小时和每周的剩余额度百分比

## 工作原理

### 架构

claudex-switch 采用「薄别名层」架构：

```
~/.claudex-switch/aliases.json    ← 统一别名注册表
          │
    ┌─────┴─────┐
    ▼           ▼
~/.claude-profiles/    ~/.codex/accounts/
  (Claude 原生存储)      (Codex 原生存储)
```

日常切换和别名管理只操作这层映射关系，不复制或转换底层账号数据。只有显式执行 `claudex-switch purge <alias>` 时，才会删除底层账号数据。

### Claude 账号切换

- macOS 上通过 Keychain 读写 `Claude Code-credentials`
- 其他系统读写 `~/.claude/.credentials.json`
- 同步 `~/.claude.json` 中的 `oauthAccount`
- API Key 模式写入 `~/.claude/settings.json`

### Codex 账号切换

- 将对应的 `<key>.auth.json` 复制到 `~/.codex/auth.json`
- Codex API Key 账号会根据保存的接口来源同步更新 `~/.codex/config.toml`
- 更新 `registry.json` 中的 `active_account_key`
- 执行 `list` 时会刷新 Codex ChatGPT 账号用量，并写回 `registry.json` 中的 `last_usage`

## 兼容性

- 与 `claude-switch`、`codex-auth` 完全兼容，三个工具可以并行使用
- macOS：已验证 Claude Code Keychain JSON 格式 + 旧版 hex 编码格式
- Claude：Pro、Max、Team、Enterprise 订阅 + API Key
- Codex：Free、Plus、Pro、Team 等 + OpenAI API Key / OpenAI-compatible API provider

## 注意事项

- 这是非官方工具，依赖 Claude Code 和 Codex 当前的本地认证存储方式
- 自动更新只会在执行 `claudex-switch --version` 时检查最新 GitHub Release；推送到 `main` 但未发布 release 的变更不会被已安装用户自动获取
- Codex 切换后需要重启客户端才能生效
- 凭证文件权限设置为 `0600`，但请注意 `~/.claude-profiles/` 下的凭证副本的安全风险
- `list` 会尝试刷新 Codex ChatGPT 账号用量；API Key 账号或刷新失败时会显示已有缓存或 `n/a`

如需临时关闭自动更新，可在当前命令前加上：

```bash
CLAUDEX_DISABLE_AUTO_UPDATE=1 claudex-switch --version
```

如果你关闭了自动更新，之后仍然可以随时手动执行：

```bash
claudex-switch update
```

## 发布

- 发布前必须先通过 `bun run verify`
- 推送 `v*` tag 后，GitHub Actions 会自动：
- 用 Bun 编译 macOS / Linux 的单文件二进制
- 上传 `tar.gz` 产物和 `checksums.txt` 到 GitHub Release
- 生成并回写 `Formula/claudex-switch.rb`

## 参考项目

- [Holden-Lin/claude-switch](https://github.com/Holden-Lin/claude-switch)
- [Loongphy/codex-auth](https://github.com/Loongphy/codex-auth)

## License

MIT
