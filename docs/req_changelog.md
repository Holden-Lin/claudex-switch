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
