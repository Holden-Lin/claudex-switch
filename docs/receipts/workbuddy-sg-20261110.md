# WorkBuddy 模型去重回执

默认 Claude Code 模型菜单现在只显示一个 DeepSeek V4.1 Flash；显式指定 SG 仍可运行。ROOT 已确认底层 CLIProxyAPI 路由注册表保留 SG 的范围，实施与验证均完成。候选分支等待 ROOT 评审，尚未合并或发布。

## 合同与原因

- Dispatch：`CXS-WB-SG-20261110`，版本 `CXS-WB-SG-20261110-v1`；合同 SHA256：`13910024aa057231b861d4a0cb882945c9a279fd3db7cb535562f2d17bae9019`。
- 回执版本：`CXS-WB-SG-20261110-v2`，替代范围确认前的 PARTIAL FINAL。
- ROOT 范围确认原话：「可以。CLIProxyAPI 原始路由目录（/v1/models）保留 -sg，因为显式 --model 指定 -sg 要能路由；用户看到的列表（订阅桥目录 + Claude 选择器）隐藏同名重复项即可。WorkBuddy 没有 Codex/OpenCode 变体、list/webconfig 只显示档位映射，就不用改。继续实现和真实验证。」
- 用户原话（合同引用）：「Claudex-switch我之前是不是让修过为什么模型列表是有ds sg的问题？」「修好了吗」「workbuddy模型列表」。10-23：「为什么我在codebuddy里看模型列表只有1个deepseek,claudex-switch workbuddy --run --cliproxy claudecode还会有一个sg地区的」。
- WorkBuddy AI 插件的 cli 目录同时提供基础模型与 `-sg`，显示名相同；10-23 仅解释了上游差异，没有修改菜单。桥接目录和 Claude Code 选择器均直接展示两个 ID。

## 修改与界面范围

- 一个共用筛选器服务桥接 `/v1/models` 和 Claude Code `modelPicker.options`；只对 `workbuddy` / `workbuddy-ai` 生效。有基础 ID 时隐藏相应 `-sg`；基础 ID 缺席则保留 SG，显示 `DeepSeek V4.1 Flash · Singapore · x0.03`，费率来自插件。Cursor 与 Antigravity 不变。
- `listSubscriptionModels` 保留完整路由库存。受管配置继续注册 SG，因此 `--model`、档位映射及共享设置中保存的 SG ID 都继续有效；SG 自己的压缩窗口也保留。桥接修订号升至 4，旧桥在下一次空闲启动时更新，不强停活动会话。
- `list` 只显示已选档位映射；webconfig 仅编辑 defaultModel 文本，没有 WorkBuddy 目录菜单。当前只支持 WorkBuddy → Claude Code；Codex / OpenCode 的反向代理仍未实现，不共享此模型目录。没有 `availableModels` 写入路径，实际使用 `modelPicker.options`。
- **ROOT 已确认**：CLIProxyAPI 自身 `/v1/models` 是其静态路由注册表，保留 SG 以支持显式路由；用户看到的菜单与桥接目录均已去重。该范围确认不等同于代码评审 ACCEPT。

## 验证证据

- 新增 6 项回归：两版 WorkBuddy 与 Cursor；覆盖隐藏重复、仅 SG 时地域及费率、显式请求透传、已保存 SG 不被重映射、隐藏模型窗口不丢失。
- 将两个实现文件临时替换为合同基线 `4d49b57` 后运行新增测试：`30 pass / 5 fail / 208 expect()`；还原修复后聚焦测试：`35 pass / 0 fail / 220 expect()`。随后补充窗口断言，纳入最终完整检查。
- `bun run verify`：`460 pass / 0 fail / 2355 expect()`，43 文件，36.59 秒；文档检查、构建与构建版 help 均通过。最终日志 `/tmp/cxs-wb-verify-final.log`。`bunx tsc --noEmit` 退出 0，`git diff --check` 无输出。
- 真实 Claude Code **2.1.321**、CLIProxyAPI **7.3.15**、真实 WorkBuddy AI 插件，临时 HOME + 合成供应商响应；构建版通过 `--run --cliproxy claudecode` 启动。真实订阅可用性不在此证据范围；未读取真实凭据或修改用户守护进程。
- 实际启动读取的设置：`[{"model":"deepseek-v4.1-flash","label":"DeepSeek V4.1 Flash","description":"WorkBuddy AI (international) · deepseek-v4.1-flash"}]`。不是手工构造菜单；由完整启动链路生成后读取。
- 第二次由同一构建版加 `--model deepseek-v4.1-flash-sg` 启动：真实 Claude Code 完成两轮 Read，供应商传输捕获连续三个 `model=deepseek-v4.1-flash-sg` 请求，返回 `SUBSCRIPTION_BRIDGE_OK` 和磁盘随机 nonce。脚本还验证免费档位、非流式转换、6004 冷却与 14018 文案。
- 可复现：`bun run build`，然后 `bun scripts/verify-subscription-bridge.ts --output /tmp/cxs-wb-sg-recheck`。最终实测日志及非敏感 JSON：`/tmp/cxs-wb-live-final.log`、`/tmp/cxs-wb-sg-live-final/{receipt.json,picker.json,upstream.jsonl,claude-sg-stream.jsonl}`。

## 发布与交接

需要发布：当前包版本 1.28.3，用户全局安装不会自动获得源码修复。遵守合同，ROOT ACCEPT 前只提交并推送 `fix/wb-sg-dup-20261110`，不合并、不打 tag。

ROOT ACCEPT 并明确通知合并后，按仓库 landing 流程合并到 main；由整合者先更新共享 TODO / req_changelog，再执行以下发布步骤（若 main 已有更新版本，改用下一个补丁号）：

```sh
bun -e 'const p="package.json"; const j=await Bun.file(p).json(); j.version="1.28.4"; await Bun.write(p,JSON.stringify(j,null,2)+"\n")'
bun run build
bun run verify
git add package.json dist/claudex-switch.js
git commit -m 'release: v1.28.4'
git tag v1.28.4
git push origin main v1.28.4
```

随后由 CI 创建 Release、资产和 Homebrew formula；不要手动创建 Release 或编辑 formula。检查 Release / CI 后拉取 formula 提交，运行 `bun run release:guard`。用户退出旧 WorkBuddy 会话后重开即可更新菜单。

整合者可用的 TODO / 沿革摘要：2026-11-10 修复 WorkBuddy 同名 DeepSeek SG 菜单重复；基础模型在场时隐藏 SG，仅 SG 时标地区和费率；显式 SG 及窗口保留。用户原话见本回执，决策与原话分开记录；ROOT 已确认保留底层路由注册表中的 SG。

收尾清单：仅保留忽略目录 `node_modules/`（约 32 MB，依赖安装，可重建），无真实账号数据、个人锁或本任务仍运行的守护进程。工作树保留用于本分支评审与后续合并，清理由 ROOT 在落地主流程决定。
