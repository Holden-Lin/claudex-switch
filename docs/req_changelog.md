# 需求变更记录

## 2026-04-13

- “我现在运行refresh它没有打开无痕模式，是不是上个版本和合代码把这个功能去掉了”
- “我是运行curl -fsSL https://raw.githubusercontent.com/Holden-Lin/claudex-switch/main/install.sh | bash 更新的 是不是因为release没更新导致？”
- “以后push都要更新release”

## 2026-04-16

- “现在我本地电脑已经安装了当前项目，但refresh的时候不会打开无痕模式，看看是什么问题”
- “我不记得了，先把这个调研写进docs 然后push吧”

## 2026-04-17

- “只需要--version检查版本的时候更新，不需要在运行其他命令的时候自动更新”

## 2026-04-21

- “现在refresh codex账号还是不会用无痕模式打开。你看看是我本地安装有问题还是本身代码没实现好”
- “做好计划直接改”
- “先把bun run verify的问题修复了”

## 2026-04-27

- “claudex-switch refresh holdenx 登录成功但报错 'Codex login completed for a different account'，实际邮箱是对的” → 当邮箱一致但 account key 变化（org/team 变更）时，自动迁移 registry 和 alias，而不是报错退出
- “现在codex login的时候不会打开无痕模式” → 通过 PATH shim 拦截 macOS `open` 命令 + 主动打开 device auth URL 到无痕窗口

## 2026-04-28

- “增加一个功能，可以直接通过claudex-switch alias -run 直接跑pass permission的对应的claudecode/codex session”
- “还有一个，有办法每次list的时候获取所有账号的用量吗”

## 2026-04-30

- “这是我的api供应商提供的配置方法，现在这个项目支持这么配置吗”
- “相当于当前项目只存apikey，但是接口打的还是API官方的？”
- “那增加一个添加供应商的功能吧，先从codex开始”
- “交互和现在的添加一样，add的时候让用户选到底是oauth/api, api的话选官方还是provider”
- “switch to api后遇到这个问题” → 修复 Codex API Key auth.json 写入格式，不再写空 tokens；切换 API 账号时自动迁移旧快照；`-run` 自动向 Codex 子进程注入保存的 API key 环境变量
- “这样的话我不是每次都手工注入？” → 自定义 Codex API provider 切换时写入 `experimental_bearer_token` 并收紧 `config.toml` 权限，确保裸跑 `codex` 也不需要手工 export
- “我升级以后，选添加OpenAI API ，并没让我选provider” → 修复自更新安装方式误判：只有当前可执行文件确实来自 Bun 全局 bin 时才用 Bun 更新，避免更新了 Bun 包但继续运行 nvm/npm link 下的旧版本

## 2026-05-01

- “现在list的速度很慢，把获取用量的功能去掉吧，因为看起来也是不准的”
- “另外，把整体性能优化一下，比如每次switch后，都要1.5秒才成功”
- “claudex-switch update ... error: Package "claudex-switch@github:Holden-Lin/claudex-switch#ddeae39" has a dependency loop ... 把这个error修复一下” → Bun 自更新先移除旧全局包，再安装目标 release，避免同包自依赖解析错误

## 2026-05-02

- “claudex-switch update ... Could not determine how this claudex-switch install was installed. Automatic update currently supports Bun and Homebrew installs. met this” → 识别 npm/nvm 全局安装并明确提示不支持，阻止之后通过 npm 安装，引导用户改用安装脚本 / Bun / Homebrew
- “I don't think we want to support npm install, instead we should make sure that no user would install via npm and that is ok” → 移除 npm 自更新支持，保留 npm/nvm 检测仅用于错误提示，并新增 preinstall guard 拦截 npm 安装

## 2026-05-04

- “现在如果切了codex api后，会出现无法再切回oauth账号的情况” → 修复 activateCodexOfficialProvider 未清理 model 和 bearer-token provider 条目导致切回 chatgpt OAuth 账号时 codex CLI 报错；同时修复 TOML renderer 丢失非 model_providers 配置段的问题

## 2026-05-05

- “昨天改好codex api切换后，现在切换claude账号不行了” → 修复 Claude profile 状态与真实 Claude Code 配置漂移时的同名切换 no-op；状态显示已激活但实际凭据、oauthAccount 或 ANTHROPIC_API_KEY 不一致时会重新应用目标 Claude 账号
- “claude的api应该支持配置多模型，比如它的sonnet对应什么，opus对应什么等。可以参考一下cc switch”
- “可以，那些交互如果不填的话是要把默认值删掉再按enter吗？另外auth token是什么”
- “I am using this project to switch to api. I want this project to handle this issue well”
- “you refer to how cc switch project handle this issue” → 切换到 Claude API Key profile 时清理 active OAuth token 和 oauthAccount，切回 OAuth 时恢复；`-run` 会按目标 Claude profile 注入或移除 Anthropic API 环境变量，避免 Claude Code auth conflict warning
- “我现在的claude这个已有的冲突是不是要帮我手工解决一下” → 修复已处于 active Claude API profile 时旧 OAuth token 残留不会触发重应用的问题，并用本地新逻辑清理当前机器上的 Keychain OAuth token / oauthAccount 冲突状态
