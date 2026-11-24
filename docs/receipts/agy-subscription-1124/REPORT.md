# agy 订阅入口与 Claude Code 启动交付

已将 WorkBuddy、Antigravity（agy / Gemini）和 Cursor 作为独立订阅展示，移除三个「Claude Code · 订阅」菜单项，并统一提示使用 `--cliproxy claudecode` 启动。旧组合创建的别名继续复用原有登录。全量 522 项测试通过，真实 PTY 已完成 agy 菜单选择、保存及真实 Claude Code 启动；本次使用隔离测试代理，没有验证厂商模型响应。

## 合同与原话

- Dispatch：`CX-AGYSUB-1124`，合同版本：`CX-AGYSUB-1124-v1`。
- 合同：`/Users/holden/code/cc_chats/docs/orchestration/evidence/2026-11-24/cx-agy-sub/contract.md`。
- 已核对 SHA-256：`5150bb1e267d54c39bc4034ff1c943a9bffc05432717be362b1af08c1b3c50b9`。
- 工作树：`/Users/holden/code/claudex-switch/.worktrees/agy-subscription-1124`；分支：`feat/agy-subscription-1124`；起点：`8cc8a40`。
- 用户原话（来自合同 `goal_source`，非本 worker 直接收到的会话消息）：「开个claudex-switch session，把增加agy subscription加进去。另外，不应该有这种选项[Image #10] ，他们应该通过--cliproxy claudecode自动实现」。
- ROOT 对截图的转录：三行「Claude Code · WorkBuddy」「Claude Code · Antigravity」「Claude Code · Cursor」。此转录与用户原话分开记录。

## 决策与范围

- Worker 在合同授予的设计权限内决定：沿用已有 agy 登录、动态模型目录和代理管理实现，只将新增账号入口改为订阅名称；已读 WorkBuddy 区域选择、Cursor 共享插件接入及 Antigravity 登录实现。没有引入新的依赖或账号 schema。
- 菜单值直接使用 `workbuddy`、`antigravity`、`cursor`，传入已有共享创建流程；保存提示和 agy 确认提示也改为订阅表述。新增后的命令示例为 `claudex-switch <alias> --run --cliproxy claudecode`。
- 旧组合只存在于旧版菜单中，不是持久化账号类型；原有 `local-cliproxyapi` 记录及别名不变。因此选择兼容复用，无需搬迁凭据或重新登录；旧的 `<alias> -run` 和 `<alias> cc` 继续支持。
- 中英文 README 和订阅接入文档已说明入口、agy 示例及旧别名兼容方式；已从源码重新生成受版本控制的 `dist/claudex-switch.js`。
- 未修改 main 工作区、真实账号凭据或设置；未读真实凭据内容或任何私有环境文件内容。没有发版、打 tag、修改 Homebrew formula 或推送。

## 自动验证

| 检查 | 结果 |
| --- | --- |
| `bun run test tests/add.test.ts tests/cliproxy-dispatch.test.ts tests/subscription-profiles.test.ts tests/cliproxy-link.test.ts` | 71 pass，0 fail，422 assertions，11.61 秒 |
| `bun run test` | 522 pass，0 fail，2661 assertions，47 个文件，38.92 秒 |
| `bun x tsc --noEmit` | 退出码 0 |
| `bun run build` | 成功，162 modules，生成 dist |
| `bun run docs:check` | 必需文件和本地链接通过 |
| `git diff --check` | 通过 |

新增回归覆盖三个订阅的菜单分发与启动提示，以及 Antigravity、WorkBuddy 国内版、WorkBuddy 国际版、Cursor 四种旧组合账号经 `--cliproxy` 复用原 profile 和登录。菜单断言确认不再有「Claude Code ·」组合和旧的 `claude-<subscription>` 菜单值。既有集成测试继续覆盖 agy 首次登录、动态目录、共享默认模型、代理启动和失败回滚。

第一次在受限沙箱内运行时，两个 WorkBuddy 目录刷新测试被 `127.0.0.1` listen 的 `EPERM` 阻止；随后在允许本机回环监听的执行环境中，聚焦测试和全量测试均通过。每次测试都通过 `bun run test` 使用仓库 preload 的隔离 HOME。

## 真实终端证据（2026-11-24）

通过 `exec_command` 的 `tty: true` 分配 PTY，再用 macOS `script -q` 保存输出。运行的是本次构建的 `dist/claudex-switch.js`。`CLAUDEX_TEST_HOME` 指向临时目录，PATH 中的 CLIProxyAPI 是仓库 `tests/fixtures/fake-cliproxyapi`；登录和模型目录来自测试代理，Claude 可执行文件为本机真实安装版本。以下删除 ANSI 控制码，并将随机隔离目录简写为 `<test-home>`。

### 选择与保存

执行 `claudex-switch add agy`，向下选择 Antigravity 并确认。初始可见菜单与完成输出：

```text
? What type of account?
❯ Claude OAuth — Claude subscription (Pro, Max, Team, etc.)
  Claude API Key — Anthropic API key
  WorkBuddy Subscription — international / China
  Antigravity Subscription — agy (Gemini)
  Cursor Subscription
  Codex ChatGPT — ChatGPT login (Plus, Pro, Team, etc.)
  Codex API Key — OpenAI API key

✔ What type of account? Antigravity Subscription — agy (Gemini)
✔ Continue with Antigravity subscription? Yes
  ● Opening Antigravity login in your browser...
  ✓ Saved as alias agy  Antigravity subscription
  opus/default → claude-opus-5-5-high · sonnet → claude-sonnet-5-5-high · haiku → gemini-3.8-flash-high
  Run claudex-switch agy --run --cliproxy claudecode to use this subscription in Claude Code.
```

退出码 0。原有的风险告知仍在确认前展示；测试代理模拟登录成功，没有打开真实厂商授权流程。

### 按提示启动 Claude Code

在同一隔离账号中执行 `claudex-switch agy --run --cliproxy claudecode --version`：

```text
  ● Running claude --permission-mode auto --settings <test-home>/.claudex-switch/cliproxyapi/<profile-id>/claude-settings.json --version
2.1.331 (Claude Code)
```

退出码 0。这条命令经过真实 CLI 参数分发、保存的 agy profile、代理目录同步、私有 Claude 设置及真实 Claude 子进程。`--version` 未发送模型请求。

再执行旧用法 `claudex-switch agy -run --version`：

```text
  ● Running claude --permission-mode auto --model claude-opus-5-5-high --settings <test-home>/.claudex-switch/cliproxyapi/<profile-id>/claude-settings.json --version
2.1.331 (Claude Code)
```

退出码 0。`list --no-usage` 也实际渲染出订阅分区和刚保存的账号：

```text
  Accounts

  ── Antigravity ──
    agy  fixture@example.com  stopped  claude-opus-5-5-high
```

## 交接与清理

- 合同内工作完成。ROOT 审核后合并；安装用户需要新版本才能看到菜单变更，版本号、tag、发布和 Homebrew formula 按合同由 ROOT 决定。
- 按 worker 边界，未改共享 `docs/TODO.md`、`docs/req_changelog.md` 或 memory。建议 integrator 的需求记录保留：用户要求订阅与前端分开；worker 选择复用已有代理账号格式，旧别名继续兼容；验证为 522 测试及上述 PTY 路径。原话从合同来源回查，勿把 worker 决策记成用户要求。
- 没有新增待办或需沉淀的长期 memory。本次属于已有能力的菜单修正，现有隔离测试规则足以避免同类验证越界。
- Manifest：工作树内没有保留的 ignored 数据；dist 是从源文件重建的 tracked 产物。终端与测试运行数据在 `/tmp`；隔离代理已停止，临时账号目录已删除。未创建工作树锁。
- 本分支留给 ROOT 审核、合并和后续 worktree GC；worker 不合并、不删除工作树。
