# Run Claude Code with a profile credential

中文摘要：Claude `-run` 按 profile 选择账号凭据，可避免切换全局账号影响该运行；项目设置、hooks 和历史记录仍是共享的，不等于完整工作区隔离。

Use `-run` when you want Claude Code to start with a saved Claude OAuth, API-key, or managed local CLIProxyAPI profile without depending on which Claude profile is globally active:

```sh
claudex-switch work -run
claudex-switch relay -run
```

For Claude OAuth, `-run` supplies that profile's own credential store and account metadata. For an API-key profile, it uses `claude --bare`, profile environment values, and a private settings file. A managed local CLIProxyAPI profile also gets isolated Claude login storage and account settings.

## Shared state still matters

Claude profile credentials are isolated for `-run`, but project and user settings, hooks, and conversation history still come from the normal Claude environment. The running `-run` process is not a separate OS user, container, or workspace. Keep project files, tool permissions, and external side effects in mind as usual.

The plain `claudex-switch <alias>` command changes global active account state for bare `claude` sessions. Claude Code may reread that shared global credential during a running bare session, so don't rely on bare sessions remaining on their original account after a global switch. Use `-run` for profile credential separation.

There is one token-rotation caveat: long-running bare Claude and `-run` processes using the same OAuth account can refresh simultaneously. Since refresh rotates the token, one process may need to log in again.

The command passes `--permission-mode auto` by default; that is Claude Code's permission mode, not a promise of tool or filesystem isolation. User settings and forwarded CLI arguments may affect behavior.
