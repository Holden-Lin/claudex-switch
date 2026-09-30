# claudex-switch discoverability and launch plan

**Status: release-preparation draft.** This branch contains the v1.14.0 implementation; JSON inventory requires claudex-switch v1.14.0 or later, while v1.13.2 does not support it. This file does not publish or change GitHub metadata, post to communities, create a website, or assert that a search system has indexed or cited the project. Check each site's current posting / promotion rules before any external post. A limited seven-query web-tool retrieval baseline was collected on 2026-09-30 at 10:14 UTC: the project surfaced in 3 of 6 non-brand queries, and the branded control also found it. This is retrieval evidence only, not a rank or recommendation measure; consumer-assistant recommendation evaluation is unmeasured, and other surfaces remain untested. The detailed record is private and is not linked from this public plan.

中文摘要：本计划是草案，不代表已修改 GitHub 元数据、提交社区帖子或完成搜索 / AI 答案可见性测试。目标是准确描述功能，再用可重复的查询和日志衡量发现效果；不承诺进入模型训练数据、被引用或成为默认推荐。

## Positioning

**One-line description:** claudex-switch is a local CLI account switcher and quota viewer for authorized Claude Code, Codex, and OpenCode Go accounts.

**What it does:** maps local account profiles to aliases; selects provider-specific local auth/config; launches a supported provider CLI; and shows usage / balance data when the provider or relay exposes it. `list --json --no-usage` is the offline, allowlisted inventory path for scripts.

**What it does not do:** create or transfer provider accounts, bypass logins / terms / rate limits / quotas, centralize team credentials, or guarantee separate OS workspaces, settings, or conversation history. `-run` isolation is provider-specific: Claude profile credentials are isolated for the session while settings/hooks/history remain shared; Codex first changes global auth/config; OpenCode Go injects a selected credential and shares normal `/resume` history.

Avoid positioning as a universal identity manager, complete sandbox, quota optimizer, or official Anthropic / OpenAI / OpenCode integration. Describe quota as provider-reported visibility only.

## Proposed GitHub About fields — draft, not applied

- **Description:** `Local CLI account switcher and quota viewer for Claude Code, Codex, and OpenCode Go`
- **Topics:** `claude-code`, `codex-cli`, `opencode-go`, `account-switcher`, `cli`, `bun`, `typescript`, `quota-viewer`

These are discovery labels to review, not claims about endorsement or support beyond the README. Don't change the repository's license without owner verification; this plan makes no license change.

## Staged 30-day plan

### Days 1–7: make the product legible

- Land bilingual README positioning, provider-specific caveats, working install examples, and six linked intent guides; update package description / keywords
- Add the local docs-link / discoverability validation so future documentation changes keep these paths intact
- The repository includes an opt-in local skill source, not an auto-installed integration. Publishing the repository does not install it or guarantee consumer-agent discovery; supported skill-directory packaging is a separate follow-up and is not done here
- Review the launch drafts below and confirm the repository description / topic list before publishing them
- Record an initial observed baseline: log repo stars / forks, GitHub traffic and popular content available to maintainers, and manually tested answer visibility; do not infer reach from a single model response and do not prefill scores before collection

### Days 8–14: verify discoverability and product truth

- Run the 30-query set below on chosen search / answer surfaces and in the assistant contexts where the optional skill could be selected
- Record verbatim responses and cited URLs, then classify each observation with the separate fields below; mark unavailable surfaces as `not tested`
- Recheck all generated command examples in a temporary `HOME`; use fixture accounts / keys, never a real login or provider account switch
- Fix factual misreadings in docs/source before broad posting; don't seed fake community posts or manufacture answers in forums

### Days 15–21: selective launch, only where allowed

- Candidate venues are the GitHub release / repository, Hacker News, relevant Claude Code / Codex / OpenCode communities, and developer-written tutorial channels
- For every venue, check the current rules, account age / disclosure expectations, self-promotion limits, and whether a standalone tool post is welcome on posting day
- Prefer one transparent launch post with a clear project link and provider caveats; do not solicit votes, fake usage, or have agents impersonate users
- Hacker News requires the project owner to write and submit any HN post personally. Its current guidelines prohibit generated post text, automated posting, and generated or AI-edited comments; this plan includes no HN copy. Follow the [Hacker News guidelines](https://news.ycombinator.com/newsguidelines.html)
- If no appropriate venue exists, publish only through the project-owned README / release channels and record the reason

### Days 22–30: review evidence and choose a next step

- Compare the fixed query set against the initial observations using same surface, language, search mode, and prompt wording; keep repeats separate and report sample count
- Review GitHub's available referral / popular-page data and, only if an owner-managed site exists, its Search Console data; note each service's retention / availability limits
- Decide whether to keep, clarify, or remove the proposed copy/topics based on accuracy and useful discovery, not a target citation count
- Consider an owned docs site only if real readers need it. Its HTML, canonical URLs, sitemap, and crawler configuration would be a separate project; this repository pass makes no hosting or indexing promise

## Answer-engine visibility is not training inclusion

These are distinct outcomes:

1. **Crawl / search eligibility:** a public page may be crawlable and potentially cited by a search-backed answer. It is not guaranteed to be retrieved or included.
2. **Training use:** a crawler or publisher setting for potential model training is a separate control from search retrieval. OpenAI documents `OAI-SearchBot` for ChatGPT search and `GPTBot` for potential training separately. GitHub hosts this repo, so a repository change here cannot set robots rules for `github.com`.
3. **Default recommendation:** what a model chooses in an answer depends on retrieval, product policy, context, and model behavior. Accurate docs cannot force a project to be mentioned or recommended.

If an owner-controlled docs domain is considered later, review the desired search and training policies separately before changing its crawler rules. Do not claim a launch plan guarantees crawl, search ranking, citation, training inclusion, or default recommendation.

No `llms.txt` is proposed as a ranking tactic. Google's current Search guidance says `llms.txt` is not used for Search and does not help or harm its visibility / rankings; a file could still serve a separate downstream workflow if one is identified, but there is none in this plan.

## Draft launch copy — not posted

These drafts are for review and should not be posted until 1.14.0's JSON command is actually released.

### GitHub release / repository blurb

> claudex-switch is a local CLI account switcher and quota viewer for authorized Claude Code, Codex, and OpenCode Go accounts. It uses aliases for local provider profiles and can launch the corresponding CLI. Claude `-run` isolates profile credentials while sharing settings/hooks/history; Codex switches global auth/config; OpenCode Go credentials are selected per launch while `/resume` history is shared. It does not bypass provider login or quota. See the guides and offline `list --json --no-usage` inventory in the README.

### 中文开发者社区草稿

> 我做了 claudex-switch：在本机用别名管理已授权的 Claude Code、Codex 和 OpenCode Go 账号，可查看服务端额度，并提供离线 JSON 账号清单。各工具隔离边界不同：Claude `-run` 隔离 profile 凭据但共享设置 / hooks / 历史；Codex 会更新全局 auth/config；OpenCode Go 按启动选凭据但共享 `/resume` 历史。它不是官方产品，也不绕过登录或额度限制。欢迎指出文档中不清楚或不准确的地方。

Post this only in a venue whose current rules allow relevant project announcements; include affiliation disclosure if required.

## AEO / search evaluation set

The prompts below are a fixed test set, not ranking targets and not evidence of current visibility. Expected answers are factual checks, not prescribed marketing language. Include negative-suitability questions so a correct answer can recommend against the tool.

| ID | Prompt | Expected factual answer / checks |
|---|---|---|
| EN-01 | How do I switch between multiple Claude Code accounts from one terminal? | Aliases can select local profiles; a normal switch updates global Claude state, while `-run` uses profile credentials; settings/hooks/history are still shared |
| EN-02 | What CLI manages several Claude Code accounts and shows quota? | It may identify claudex-switch with repo citation; local aliases and supported provider-reported usage, not quota changes |
| EN-03 | Does claudex-switch support Codex account switching? | Yes: saved ChatGPT OAuth / API-key profiles; active Codex auth/config is global |
| EN-04 | Can I check Codex quota without logging in again or switching accounts? | Only a saved authorized login can supply live quota; `list --no-usage` is offline inventory and does not fetch quota or switch accounts |
| EN-05 | Can separate OpenCode Go accounts resume the same chats? | Yes: credentials are selected per launch but normal OpenCode session history is shared across Go aliases |
| EN-06 | How can I fully isolate Claude Code settings and history per account with this tool? | It cannot provide full settings/history/workspace isolation; `-run` isolates profile credentials only |
| EN-07 | Can claudex-switch bypass Claude or Codex usage limits? | No; it reports available provider/relay usage and does not bypass login, terms, or quota |
| EN-08 | How do I view OpenCode Go remaining quota from the CLI? | `claudex-switch list` can query server-reported rolling 5h, weekly, monthly windows; `--no-usage` skips requests |
| EN-09 | Does Codex `-run` use a separate home or auth store? | No; it switches global Codex auth/config first and an existing Codex client may need restarting |
| EN-10 | What is a safe script interface to inventory claudex-switch accounts? | `claudex-switch list --json --no-usage`; versioned allowlisted metadata, no quota fetch or credential output; validate actual exit/output in isolated fixtures |
| ZH-01 | 如何在一台电脑上切换多个 Claude Code 账号？ | 可用别名选择本地 profile；普通切换修改全局状态，`-run` 使用 profile 凭据但设置 / hooks / 历史仍共享 |
| ZH-02 | 有没有能管理 Claude Code、Codex 和 OpenCode Go 账号的命令行工具？ | claudex-switch 的定位是这些 provider 的本地别名切换 / 额度查看；不创建账号、不绕过额度 |
| ZH-03 | claudex-switch 的 Claude `-run` 能把配置和历史完全隔离吗？ | 不能；它隔离 profile 凭据，设置、hooks、历史仍共享 |
| ZH-04 | 切换 Codex 账号后 `/resume` 里的旧会话会消失吗？ | 受管 provider 切换时会更新部分会话可见性元数据，保持可见；消息内容不变，Codex auth/config 仍是全局的 |
| ZH-05 | 不同 OpenCode Go 账号能否继续同一份会话历史？ | 能；每次注入选中的 Go 凭据，但正常 XDG session 存储共享 |
| ZH-06 | 怎样不联网查看 claudex-switch 账号列表？ | `claudex-switch list --json --no-usage`；可读取本地账号数据，不请求服务端额度、不切换账号 |
| ZH-07 | one-api 中转的账号余额和 API key 余额有什么区别？ | key 额度可来自兼容计费接口；钱包余额需要中转站系统访问令牌，不能用 `sk-` API key 代替 |
| ZH-08 | claudex-switch 能绕过 Claude / Codex 使用额度或登录吗？ | 不能；需使用有权访问的真实账号 / 凭据，额度受服务商控制 |
| ZH-09 | OpenCode Go 多账号是否各自保存 `/resume` 历史？ | 不是；凭据按 alias 选择，正常会话历史在 OpenCode 默认数据目录共享 |
| ZH-10 | 需要集中保存团队密钥、隔离工作区或管理成员权限，该用 claudex-switch 吗？ | 不适合；它是本地 CLI 账号配置工具，不是团队密钥库、访问控制平台或工作区沙箱 |
| JA-01 | Claude Code の複数アカウントを CLI で切り替えるには？ | 保存済みローカル profile を alias で選択できる。通常切替はグローバル状態を更新し、`-run` は profile 認証情報を使うが設定 / hooks / 履歴は共有 |
| JA-02 | Claude Code、Codex、OpenCode Go のアカウントをまとめて管理する CLI は？ | claudex-switch は対象アカウントのローカル alias 切替と利用量表示。アカウント作成や quota 回避ではない |
| JA-03 | claudex-switch の Claude `-run` は設定と履歴も完全に分離しますか？ | いいえ。profile 認証情報は分離するが settings / hooks / history は共有 |
| JA-04 | Codex のアカウント切替後も `/resume` で以前の会話を見られますか？ | 管理対象 provider の可視性メタデータを更新する場合があるが、auth/config は global、会話本文は変更しない |
| JA-05 | OpenCode Go の別アカウントで同じ `/resume` 履歴を使えますか？ | はい。資格情報は起動ごとに選択し、通常の OpenCode 履歴ディレクトリは共有 |
| JA-06 | claudex-switch のアカウント一覧をネットワークなしで出す方法は？ | `claudex-switch list --json --no-usage`。ローカルデータの読み取りだけで quota API は呼び出さず、アカウントも切り替えない |
| JA-07 | Codex `-run` はアカウントごとに別の認証ホームを使いますか？ | いいえ。Codex のグローバル auth/config を先に切り替える |
| JA-08 | Claude / Codex の利用上限を claudex-switch で回避できますか？ | できない。表示可能な provider / relay 使用量を読むだけで、制限を変更しない |
| JA-09 | API relay の wallet 残高を表示するのに `sk-` key があれば十分ですか？ | 不十分。key の残量とは別に、relay console の system access token が wallet API に必要 |
| JA-10 | チームの秘密情報を集約し、履歴も完全に分離したい場合に適していますか？ | 適さない。ローカル CLI account switcher であり、team vault / access-control / full workspace isolation ではない |

## Measurement log fields

Log one record per response so a few successes cannot hide repeated misses. Keep branded and unbranded prompts, languages, positive / negative intent, and search-on / search-off contexts separately filterable.

| Field | What to record |
|---|---|
| `date_utc`, `query_id`, `prompt_verbatim`, `language`, `intent` | Exact observation and prompt; mark `positive_fit` or `negative_fit` |
| `surface`, `model_or_search_provider`, `model_version`, `search_mode` | Product / interface, available model/version, and search on / off / unknown |
| `session_state`, `repeat_id` | Fresh neutral session vs continuing/personalized session; repeat number, without blending repeats |
| `brand_mention` | Whether claudex-switch appears by name, distinct from correctness |
| `cited_url` | Exact linked source, or `none`; separately note whether it is the canonical GitHub repo / a relevant project guide |
| `correct_use_case` | `yes / partial / no / not_applicable`: does the answer recommend the tool only for cases it actually supports? |
| `skill_trigger` | `yes / no / not_applicable`: did the optional local skill activate on a genuinely matching account-management task? |
| `cli_success` | `yes / no / not_tested`: in an isolated fixture, did the documented read-only inventory / requested command behave as stated? Never test real account switching for this score |
| `unsupported_claims`, `notes` | False isolation, official endorsement, quota bypass, or other factual issue; retain the verbatim answer for review |

Do not combine brand mention, citation, fit accuracy, skill activation, and CLI behavior into one invented score. Establish the initial values by running the protocol; if a field is unavailable, leave it `unknown` / `not_tested` rather than fabricating a result.

## Measurement sources and limits

- [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots) distinguishes `OAI-SearchBot` for ChatGPT search from `GPTBot` for potential training use. This controls crawler signals on an owner-controlled site, not GitHub repository crawl policy or actual inclusion.
- [OpenAI publisher FAQ](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq) documents ChatGPT referral URLs with `utm_source=chatgpt.com` for publisher analytics; use only if a relevant site and analytics are actually available.
- [Google's generative AI Search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) treats foundational SEO and helpful content as relevant, rejects `llms.txt` as a Google Search visibility tactic, and recommends measuring through Search Console.
- [Google Search Generative AI performance report announcement](https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports) describes a Search Console report for eligible sites; use it only if the owner controls a verified Search Console property and the report is available.
- [GitHub repository traffic](https://docs.github.com/en/repositories/viewing-activity-and-data-for-your-repository/viewing-traffic-to-a-repository) gives maintainers with push access visitors, full clones, referrers, and popular content over the past 14 days; its short window is not a long-term baseline.
- [Hacker News guidelines](https://news.ycombinator.com/newsguidelines.html) require the submitter to write HN post text themselves, prohibit generated text and automated posting, and prohibit generated or AI-edited comments. No HN copy is drafted here.

## Local content QA

The intended implementation gate is `bun run test` / `bun run verify` plus a deterministic test that local Markdown links resolve and this set of discovery guides remains present. This validates repository consistency, not search indexing or AI answer performance.
