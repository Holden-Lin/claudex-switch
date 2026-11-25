# AGY 原生终端按别名选择账号

已修复 `--run` 忽略别名账号的问题。原生 `agy` 通过该别名专属的 CLIProxyAPI 使用保存的订阅账号，保留 AGY 界面和原生参数；不再依赖 AGY 的全局登录。代码和测试待 ROOT 评审后发版，本 worker 不合并、不推送、不发版。

## 合同与需求

- Dispatch：`CX-AGYRUNACCT-1125`；合同：`CX-AGYRUNACCT-1125-v1`。
- 合同 SHA256：`cf85d60876fac9d738bc3c859eacd17ec4ff87ab7e8d6b3185598974ea5a4be4`，已核对。
- ROOT 合同引用用户原话：「claudex-switch agylam42 --run 跑出来还是旧账号」。本 worker 未直接取得原始用户会话。
- 修改范围：本工作树 `fix/agy-run-account-1125`。未读取真实凭据内容，未修改真实 Claude profiles、Gemini 或 Antigravity 登录目录。

## 根因与选择

旧入口 `runAliasSession` 识别到 Antigravity 后只执行裸 `agy`，未传递 profile，也没有启动别名的账号代理。`runNativeSubscription` 还明确提示使用原生 CLI 自己的登录。故 CLIProxyAPI 升级和新建别名都不能改变原生终端使用的旧账号。

本 worker 在合同授权内选择 AGY 内置网关：`AGY_LLM_GATEWAY_URL` 指向该 profile 的本地代理根地址，`AGY_LLM_GATEWAY_API_KEY` 使用其本地客户端 key，`AGY_LLM_GATEWAY_MODELS` 使用其实际模型目录。真实 AGY 实测发出的协议是 Gemini `streamGenerateContent`，URL 必须用根地址，不能加 OpenAI 的 `/v1`。本机 CLIProxyAPI 8.1.2 已验证支持该路由。

没有转换或导入原生 OAuth 凭据。调查时发给 ROOT 的“是否允许运行时转换凭据”问题已被此实现消除，不再需要放宽边界。原生 AGY 的 `AGY_ACCOUNT` 用于它调用的第三方 CLI，不能用来选择 AGY 本身登录；实机 `--help` 也未提供账号选择参数。

## 行为与隔离

- 启动前取得该 profile 的现有会话租约，退出、启动报错后释放；沿用现有代理启动与账号隔离机制。
- 原生进程独有的环境覆盖旧网关配置；清除继承的网关自定义 headers 和 proxy URL，避免错误路由或授权覆盖。key 不写入 argv、日志或 AGY 设置。
- 未指定 `--model` 时传入该账号已解析的默认模型，避免全局原生模型设置选到该账号没有的模型。显式原生模型、effort 和其他参数原样传递。
- 缺少该别名的有效登录时明确失败，不启动原生 AGY 去使用旧登录。
- Cursor 仍按原生登录启动；WorkBuddy 显式 Claude 路由保持原有行为。

用户可见输出示例：

```text
● Using Antigravity account saved as agylam42.
● Running agy --model <该账号可用模型>
```

## 验证证据

1. `bun run test tests/native-subscription-run.test.ts`：9 pass，0 fail；最终完整套件再次通过这些测试。覆盖两个别名并发命中各自账号与独立地址、账号缺失拒绝启动、原生参数与默认模型、旧网关环境覆盖、正常退出与启动失败释放租约、Cursor、WorkBuddy。
2. `bunx --no-install tsc --noEmit`：退出 0。`bun run build`：成功。`git diff --check`：通过。
3. 构建产物 → 原生 AGY → Gemini 请求 → 测试账号代理 → AGY 终端输出：成功。本机 `/Users/holden/.local/bin/agy`，测试 HOME 为 `/tmp/cx-agy-app-smoke.4LTkiY`。账号与服务均为本地测试数据，实际输出：

   ```text
   ● Using Antigravity account saved as synthetic-new.
   ● Running agy --model claude-opus-5-5-high -p Reply OK --print-timeout 20s
   ACCOUNT:new@example.invalid
   EXIT 0
   ```

4. 本机 CLIProxyAPI `8.1.2 / Homebrew / 2026-11-23T14:46:33Z`，使用临时 HOME `/tmp/cx-agy-proxy-route.hulu2z`、空 auth 目录和虚拟 key。POST `/v1beta/models/synthetic-no-provider:streamGenerateContent` 返回 HTTP 400，`code=model_not_found`、`unknown provider for model synthetic-no-provider`。说明已进入 Gemini 模型路由；无真实订阅请求。
5. 全量 `bun run verify`：退出 0；531 pass，0 fail，2724 个断言，48 个测试文件，85.02 秒；文档检查、构建和构建产物 help 均通过。最终验证日志：`/tmp/cx-agy-run-account-verify.log`。

首次在受限沙箱运行测试时 loopback bind 被禁止；允许本地测试 socket 后上述定向测试全部通过。未将沙箱限制计为业务缺陷。

## 限制与 ROOT 后续

- 未使用 agylam42 / agy 的真实凭据发请求。实机证明覆盖已安装原生 AGY 和 8.1.2 路由，订阅服务端端到端验证仍需用户在修复版上执行 `claudex-switch agylam42 --run -p 'Reply OK'`，核对该账号用量或身份。本次没有验证交互界面的账号身份展示。
- 本次验证是原生终端的本地请求路径；没有验证 `--remote-agent` 等由远程服务执行的路径。
- 需要发布补丁版本，否则安装版仍保留旧行为；版本号、release 和合并由 ROOT 评审后处理。本 worker 未更改版本号。
- 工作树留给 ROOT 评审、合并；无自建锁。共享 TODO、req_changelog、memory 留给集成人。

## 供集成人采纳的记录

- 需求记录：使用合同所引用户原话，标明其来自 ROOT 合同；决策归属 worker，在授权内使用原生 AGY 网关复用别名专属代理，原因是原生启动忽略代理登录；没有转换真实凭据。
- 后续 TODO：修复版安装后运行 agylam42 与旧 agy 的原生命令，核对账号用量分离及旧会话继续可用；完成条件为真实请求分别计入对应账号。
- 工作流建议：以后新增订阅原生入口时，验收至少覆盖“两个不同账号别名的实际请求身份”，不能只验 executable 名称或启动成功。本次已将双账号并发请求加入回归测试，无需另建技能。
- 保留的忽略项：`dist/claudex-switch.js` 是仓库跟踪的构建产物，已从源码重新生成；没有新增需保留的忽略数据。`/tmp/cx-agy-*` 是临时验证脚本、测试 HOME 与日志，不是运行服务或发布依赖。
