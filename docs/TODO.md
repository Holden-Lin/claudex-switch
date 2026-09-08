# 待办

## Now

本需求暂无待实施代码项。发布流程与产物见 [v1.7.0](https://github.com/Holden-Lin/claudex-switch/releases/tag/v1.7.0)。

## Next

- [ ] 用户返回后，在日常项目中运行 `claudex-switch chatgpt --run` 试用交互体验；无需为了测试主动重新登录。

## Done

- [x] 2026-09-08：本机 CLIProxyAPI 已合入；最终回归 164 项通过、0 失败，类型检查、构建、打包命令和发布版本检查通过。
- [x] 2026-09-08：完成真实 ChatGPT 登录、GPT-6/Terra/Luna 调用、Explore 只读子任务；原生请求体确认主模型 effort 与 Terra/max 子代理互不干扰。详见 [验收说明](local-cliproxyapi.md)。
