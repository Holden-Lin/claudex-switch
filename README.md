# claudex-switch

> **告别多账号管理的繁琐与撕裂。**  
> 一款专为 Claude Code、Codex 和 OpenCode Go 打造的本地 CLI 多账号管理工具与实时额度看板。

**语言 / Languages:** [中文](./README.md) | [English](./README.en.md)

---

## 💡 它解决什么痛点？

在日常使用 Claude Code、Codex 或 OpenCode 进行 AI 编程时，经常需要在多个账号（个人号、公司号、小号、中转 API）之间周旋。原生 CLI 的单账号设计带来了四大核心痛点：

### 1. 凭据切换繁琐，多终端互踩
- **痛点**：换号需要反复网页授权、手动替换配置文件或导出环境变量；如果一个终端在跑长任务，另一个终端切换账号就会覆盖全局凭据导致任务鉴权失败。
- ⚡ **解法**：统一别名管理。`claudex-switch <alias>` 秒切全局默认账号；`claudex-switch <alias> -run` 以独立会话启动，凭证沙箱隔离，多终端真正并行不串号。

### 2. 历史记录丢失，会话上下文无法接续
- **痛点**：在不同账号之间切换，或者在官方服务与中转站之间来回切换时，原有的历史会话往往无法在 `/resume` 中显示，前序项目的代码上下文直接丢失。
- ⚡ **解法**：智能元数据同步。自动维护会话可见性元数据（如 Codex 的 rollout 文件与 SQLite 状态），跨账号、跨 Provider 切换后旧会话依然在 `/resume` 中完整可见，随调随用。

### 3. 额度如同盲盒，写到一半突然限流
- **痛点**：各账号额度分散在不同平台，不知道哪个号还剩多少、5 小时窗口 / 每周限额何时重置，中转站更要频繁登录控制台查余额，写着写着突然撞上 Rate Limit 停工。
- ⚡ **解法**：`claudex-switch list` 并行拉取全账号实时额度看板（5h 窗口百分比、每周本地精确重置时间点如 `Wed16`、中转站 Key 余额与总钱包余额），并展示近 30 天 token 与代码提交趋势。

### 4. 额度无法互通，跨工具配置繁杂
- **痛点**：ChatGPT / Codex / OpenCode Go 上有充足额度，却无法在习惯的 Claude Code 中使用；各平台的 Base URL、模型映射和环境变量散落在各个 JSON/TOML 文件中，修改极其痛苦。
- ⚡ **解法**：原生支持 `--cliproxy claudecode` 跨额度借用；内置 `webconfig` 本地可视化网页，一站式批量查看、修改所有账号配置，支持一键粘贴导入 `export` 环境变量。

---

## ⚡ 极速安装

### 推荐：一键安装脚本
```bash
curl -fsSL https://raw.githubusercontent.com/Holden-Lin/claudex-switch/main/install.sh | bash
```

<details>
<summary>其他安装方式（Homebrew / Bun）</summary>

**Homebrew:**
```bash
brew install --formula https://raw.githubusercontent.com/Holden-Lin/claudex-switch/main/Formula/claudex-switch.rb
```

**Bun 全局安装:**
```bash
bun install -g git+https://github.com/Holden-Lin/claudex-switch.git
```
</details>

---

## 🚀 3 步快速上手

### 1. 添加或导入账号
运行交互式命令，按提示添加 OAuth 订阅账号或 API Key：
```bash
claudex-switch add work      # 添加工作账号
claudex-switch add personal  # 添加个人账号
```
> 💡 **已有账号一键迁移**：如果你之前使用过 `claude-switch` 或 `codex-auth`，直接执行 `claudex-switch import` 即可自动导入现有全部 profile。

### 2. 查看所有账号与实时额度看板
```bash
claudex-switch list
# 快捷别名：claudex-switch ls
```
瞬间展示所有账号状态、5h / 每周额度剩余百分比（如 `5h 89% · wk 61% Wed16`）及中转站余额。

### 3. 启动或切换账号
- **方式 A（推荐）：独立会话运行（凭证隔离，不影响全局默认账号）**
  ```bash
  claudex-switch work -run
  ```
- **方式 B：切换全局默认账号**
  ```bash
  claudex-switch personal
  ```

---

## 🛠️ 常用进阶用法

### 1. 启动时指定模型与思考力度（Effort）
支持直观简写，启动即生效，并自动保存为该账号的偏好：
```bash
# Claude 示例：裸数字直接映射 Opus（5.5 → claude-opus-5-5）
claudex-switch work -run --model 5.5 max

# Codex 示例：支持 astra / sol / luna / terra
claudex-switch cx -run --model sol xhigh
```

### 2. 本地可视化网页配置（Web Config）
不喜欢手动敲命令编辑配置？一键启动本地私有网页后台：
```bash
claudex-switch webconfig
```
- 批量查看与修改所有账号的 Base URL、API Key、默认模型与模型映射。
- 支持直接粘贴整段 `export ANTHROPIC_*` 环境变量文本，自动解析填入。

### 3. 借用 Codex / Go 额度跑 Claude Code（Cliproxy）
手头有充足的 Codex / ChatGPT / OpenCode Go 额度，想在 Claude Code 里跑？无需手写代理配置：
```bash
# 用 Codex (ChatGPT) 账号额度跑 Claude Code
claudex-switch cx --run --cliproxy claudecode

# 用 OpenCode Go 账号额度跑 Claude Code
claudex-switch go-work --run --cliproxy claudecode

# 用 WorkBuddy 或 Cursor 订阅（workbuddy 首次会让你选国际版 / 国内版）
claudex-switch workbuddy --run --cliproxy claudecode
claudex-switch workbuddy-ai --run --cliproxy claudecode  # 直接用国际版
claudex-switch cursor --run --cliproxy claudecode
```

首次选择浏览器登录或沿用原应用登录，之后直接启动；在 Claude Code 的 `/model` 菜单选择该订阅可用的模型。无需安装 magpie。浏览器登录保存独立凭据；沿用原应用登录会跟随该应用的账号切换。详见[订阅接入说明](./docs/local-cliproxyapi.md#workbuddy--cursor-订阅)。

### 4. 刷新已过期登录
当 OAuth 本地登录态过期时，无需重新添加账号，一键刷新：
```bash
claudex-switch refresh <alias>
```

---

## 📖 常用命令速查

| 命令 | 别名 | 功能说明 |
|---|---|---|
| `claudex-switch` | - | 打开交互式账号选择菜单 |
| `claudex-switch list` | `ls` | 查看所有账号、当前状态、5h/周额度与 30 天用量走势 |
| `claudex-switch <alias> -run` | - | **【推荐】** 用该账号独立启动会话（凭证隔离、不影响全局） |
| `claudex-switch <alias>` | `use` | 切换全局生效的默认账号 |
| `claudex-switch add <alias>` | - | 添加新账号（支持 OAuth 登录 / API Key / 中转站） |
| `claudex-switch import` | - | 从 `claude-switch` / `codex-auth` 一键导入旧账号 |
| `claudex-switch refresh <alias>` | - | 重新登录并刷新该账号过期的凭据快照 |
| `claudex-switch webconfig` | - | 打开本地可视化配置网页，批量管理账号与模型 |
| `claudex-switch model <alias> <model>` | - | 修改指定账号的默认模型 |
| `claudex-switch rename <old> <new>` | - | 重命名账号别名 |
| `claudex-switch remove <alias>` | `rm` | 仅删除别名映射（保留底层登录凭证） |
| `claudex-switch purge <alias>` | - | 彻底删除底层账号及其所有关联别名 |
| `claudex-switch update` | - | 检查并升级到最新版本 |

Codex 和 OpenCode 会话的 autoreview 默认关闭；需要时用 `claudex-switch <alias> -run --autoreview on` 为本次会话开启。

---

## 📚 进阶文档与深入了解

如需了解底层隔离边界、高级配置或自动化集成：
- [使用场景详细指南](./docs/use-cases.md)
- [常见问题与技术细节 (FAQ)](./docs/faq.md)
- [本地 CLIProxyAPI 与跨额度机制说明](./docs/local-cliproxyapi.md)
- [JSON 脚本输出参考](./docs/list-json.md)
- [功能解说视频：中文（60 秒）](./docs/media/claudex-switch-explainer-zh-60s.mp4) · [English (60s)](./docs/media/claudex-switch-explainer-en-60s.mp4)

---

## 📄 License

本项目采用 Source-Available 许可：MIT License 附加 Commons Clause v1.0。个人及公司内部使用、普通外包或自由职业项目均可免费使用；未经书面许可不得将本项目核心功能直接包装收费转售。详见 [LICENSE](./LICENSE) 与 [商业许可说明](./COMMERCIAL-LICENSING.md)。
