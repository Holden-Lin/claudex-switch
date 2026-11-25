# agylam42「invalid config」修复报告（CX-AGYCFG-1125）

## 结论
已修复，待 ROOT 评审后发版（未发版）。根因不是配置格式不兼容，而是 `runtime.yaml` 的「是否漂移」判定过严：CLIProxyAPI 8.x 启动后会在它读到的配置文件末尾追加

```
server:
  server-id: <数字>
```

而 `isExpectedRuntimeConfig` 要求文件与 claudex-switch 渲染结果逐字节相等，于是任何一次启动后都判为 `missing or needs rebuild`；`doctor --restart` 重建后二进制立刻又追加一遍，所以永远「could not be rebuilt」，`list` 显示 invalid config。

## 证据
- 真实账号 runtime.yaml 比渲染结果多 58 字节；仅按白名单取结构（值全部隐去）确认多出的正是末尾的 `server:` / `server-id:` 两行，其余行与渲染一致。未读任何密钥内容。
- 同一个函数还被 `stopStaleManagedCLIProxyAPI` 使用：8.x 下空闲守护进程会被误判为陈旧而被反复停掉（顺带修复）。

## 改动
- `src/providers/cliproxyapi/managed.ts`：比较前剥掉末尾由二进制追加的 `server:\n  server-id: …` 块；其他任何多出内容仍判为漂移。
- `tests/fixtures/fake-cliproxyapi.mjs`：`CLAUDEX_FAKE_SERVER_ID` 开关，模拟 8.x 追加行为。
- `tests/cliproxyapi.test.ts`：新增用例（启动后 configured=true、`doctor --restart` 后仍为 true、追加 `debug: true` 仍为 false）。
- `dist/claudex-switch.js`：重新构建。

## 验证
- 新用例在旧代码上红（`configured` 期望 true 得 false），新代码上绿。
- `bun run test`：531 过 / 1 红；红的是 docs/TODO 已记录的 main 上既有 RelayRouter GLM 持久化测试，与本改动无关。
- 真实环境（修复版 dist，仅 doctor/list，未启动交互 agy）：`doctor agylam42` 全绿，Managed configuration: valid；`doctor agylam42 --restart` 成功；`doctor agy` 正常；`list` 中 agylam42 显示 running，不再 invalid config。
- 未改其他别名账号目录，未删任何登录。

## 注意
- 需发版后用户机器才会带上修复；本机 brew 装的仍是 v1.29.4，会继续显示 invalid，直到升级。
- 「--run 仍是旧账号」问题与本项无关，已由 v1.29.4 处理；配置误判不会影响账号绑定。
