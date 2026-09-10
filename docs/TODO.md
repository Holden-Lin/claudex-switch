# 待办

## Now

本需求暂无待实施代码项。发布流程与产物见 [v1.9.0](https://github.com/Holden-Lin/claudex-switch/releases/tag/v1.9.0)。

## Next

- [ ] 在真实 HOME 上跑一次 `claudex-switch webconfig`，确认自己的账号列表和密钥显示无误（本次仅在隔离测试 HOME 中验证）。
- [ ] 用户返回后，在日常项目中运行 `claudex-switch chatgpt --run` 试用交互体验；无需为了测试主动重新登录。
- [ ] 全局 active 的 Claude 账号目前仍是 `chatgpt`（本机 CLIProxyAPI），所以裸 `claude` 会走 gpt 路由。若想让裸 `claude` 回到别的账号，由用户自行 `claudex-switch <alias>`。

## Done

- [x] 2026-09-10：`webconfig` 账号行加铅笔改别名 + 删除（purge 语义，二次确认列出代价）；抽 `src/accounts/purge.ts` 供 CLI 与网页共用，别名校验收敛为一处。190 项测试 0 失败，浏览器实测改/删/取消/拒绝四条路径。
- [x] 2026-09-10：新增 `claudex-switch webconfig` 本机网页，批量查看/修改账号配置；Claude 账号支持自定义 env 与子代理/Fable 模型字段。181 项测试 0 失败，浏览器实测两类账号保存均落盘。
- [x] 2026-09-10：修复 API Key 账号 `-run` 被全局 `~/.claude/settings.json` 路由劫持；改为注入 0600 私有 `--settings` 文件。真实 deepseek 会话验证通过，165 项测试 0 失败。
- [x] 2026-09-08：本机 CLIProxyAPI 已合入；最终回归 164 项通过、0 失败，类型检查、构建、打包命令和发布版本检查通过。
- [x] 2026-09-08：完成真实 ChatGPT 登录、GPT-6/Terra/Luna 调用、Explore 只读子任务；原生请求体确认主模型 effort 与 Terra/max 子代理互不干扰。详见 [验收说明](local-cliproxyapi.md)。
