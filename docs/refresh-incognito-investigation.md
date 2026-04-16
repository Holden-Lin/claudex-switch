# refresh 无痕模式排查记录

日期：2026-04-16

## 背景

本地已安装当前项目，但执行 `claudex-switch refresh <alias>` 时，浏览器没有以无痕 / 私密模式打开，需要确认是：

- 当前项目回归了该功能
- 本地安装版本没有拿到相关修复
- 下游 `claude` / `codex` 登录流程变更，绕过了本项目的浏览器注入逻辑

## 本机环境

排查时本机版本如下：

- `claudex-switch 1.1.2`
- `codex-cli 0.121.0`
- `Claude Code 2.1.110`

安装入口：

- `claudex-switch` 来自 `~/.bun/bin/claudex-switch`
- 该可执行文件链接到全局安装包的 `dist/claudex-switch.js`

## 代码核对结果

当前仓库里，“以无痕模式打开登录页”的逻辑仍然存在，没有被删除：

- `src/lib/browser.ts`
  - macOS 下会生成一个临时脚本
  - 优先尝试：
    - Chrome: `open -na "Google Chrome" --args --incognito "$URL"`
    - Firefox: `open -na "Firefox" --args --private-window "$URL"`
    - Edge: `open -na "Microsoft Edge" --args --inprivate "$URL"`
- `src/commands/refresh.ts`
  - `runLoginCommand()` 会把上面的脚本通过 `BROWSER` 环境变量传给下游登录命令
- `src/commands/add.ts`
  - `claude auth login` 和 `codex login` 的添加流程也走同一套逻辑

已安装版本对应的构建产物 `dist/claudex-switch.js` 中也能看到相同字符串，说明本地安装版本本身已经包含这部分修复。

## 历史提交核对

相关修复来自提交：

- `7a1dea6 fix: open login in private browser, fix same-profile switch, harden cred perms`

这说明“无痕打开登录页”不是最近被删掉的。

## 关键发现

### Claude 路径

`claudex-switch` 对 `claude auth login` 的调用仍然会注入 `BROWSER`。

本机 `Claude Code 2.1.110` 的安装内容里还能看到基于 `process.env.BROWSER` 打开浏览器的代码路径，因此 Claude 这条链路理论上仍然可能继续受控于本项目注入的浏览器脚本。

### Codex 路径

`claudex-switch` 同样会对 `codex login` 注入 `BROWSER`，但本机 `codex-cli 0.121.0` 的行为已经变化。

从本地二进制字符串和上游依赖可见，当前 Codex 在 macOS 上大概率使用 Rust `webbrowser` 库直接通过 Launch Services 打开系统默认浏览器，而不是依赖 `BROWSER` 环境变量。

这意味着：

- `claudex-switch` 代码里虽然仍然传了 `BROWSER`
- 但新版 `codex login` 很可能已经不再读取它
- 所以刷新 Codex 账号时，浏览器会直接按系统默认方式打开，而不是走无痕窗口

## 直接验证

在隔离 `HOME` 环境下执行：

- `codex login --device-auth`

得到的交互是：

- 输出固定设备登录地址：`https://auth.openai.com/codex/device`
- 输出一次性 code
- 不再依赖自动打开浏览器才能继续

这为后续修复提供了一个更稳的方案：不再依赖 `codex login` 自己开浏览器，而是改用 device auth 流程，再由 `claudex-switch` 主动用无痕窗口打开固定地址。

## 结论

结论分两部分：

1. 当前项目没有删掉无痕打开逻辑，本地安装的 `claudex-switch 1.1.2` 也已经包含该逻辑。
2. 对 Codex 账号来说，问题更可能出在下游 `codex-cli 0.121.0` 改变了浏览器打开方式，导致 `BROWSER` 注入失效。

因此，“refresh 不开无痕模式”至少对 Codex 路径来说，不是本项目 release 没更新到修复，而是下游行为变更导致旧兼容方案失效。

## 建议修复方向

如果后续需要恢复 Codex 的无痕登录体验，优先考虑：

1. `Codex refresh/add` 改为走 `codex login --device-auth`
2. 由 `claudex-switch` 自己打开 `https://auth.openai.com/codex/device`
3. macOS 继续复用当前无痕脚本
4. 用户在无痕页里输入 device code 完成授权
5. 完成后继续读取并保存新的 `~/.codex/auth.json`

这样可以避免把“是否能无痕打开浏览器”继续绑定在 `codex` 内部实现细节上。

## 参考

- 仓库源码：
  - `src/lib/browser.ts`
  - `src/commands/refresh.ts`
  - `src/commands/add.ts`
- 相关提交：
  - `7a1dea6 fix: open login in private browser, fix same-profile switch, harden cred perms`
- 上游参考：
  - `webbrowser` macOS 实现：<https://raw.githubusercontent.com/amodm/webbrowser-rs/v1.0.6/src/macos.rs>
  - `webbrowser` changelog：<https://docs.rs/crate/webbrowser/latest/source/CHANGELOG.md>
