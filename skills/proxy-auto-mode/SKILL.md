---
name: proxy-auto-mode
description: Diagnose and repair Claude Code auto-mode startup eligibility or unusable tool permission verdicts through claudex-switch proxy providers, including Antigravity, WorkBuddy and Cursor. Use for classifier routing, transport or response failures; ordinary chat errors alone do not establish a classifier failure.
---

# Proxied Claude Code auto mode

Restore a usable permission verdict while keeping auto-mode checks. Never substitute a fabricated approval, extract a verdict from hidden reasoning, or switch to bypassPermissions to call the repair successful. Installation, release, account changes and paid calls require the authority of the current task; this skill does not grant them.

## Identify the failing boundary

| Observed symptom | First evidence to collect |
| --- | --- |
| Startup says auto mode is unavailable, or the session starts in Manual | Claude Code version, effective permission mode, `permissions.disableAutoMode`, supported model, fast-mode and account eligibility. A model change alone does not establish eligibility. |
| Startup says the proxy cannot provide server review | Effective `CLAUDE_CODE_AUTO_MODE_SERVER`; translating proxies normally need `0`, retaining the client's classifier. |
| A tool says `no usable answer`, `cannot determine the safety`, or `could not evaluate this action` | The classifier's actual request and response, separately from the main chat. Successful chat/tool generation does not prove successful classification. |

Follow the first external failure that explains the symptom. A catalog entry proves registration, not sufficient credits or a parseable answer. Stop retrying once the failure is captured; repeated requests may spend quota without producing new evidence.

## Capture the classifier safely

1. Record the actual Claude Code and account-specific CLIProxyAPI binary versions. Read only whitelisted fields from proxy state/settings: version, bridgeRevision, model IDs, tier mappings, classifier knobs, and loopback base URL. Never dump runtime YAML, settings, auth files, environment files, process environments or HTTP headers; they may contain live credentials.
2. From a worktree build, add `--debug-file <scratch>/classifier-debug.log` to the normal launch. For example, when the task authorizes the real WorkBuddy account:

   ```sh
   CLAUDEX_ALLOW_REAL_HOME=1 CLAUDEX_DISABLE_AUTO_UPDATE=1 \
     node dist/claudex-switch.js workbuddy cc --model hy4free \
     --debug-file /tmp/cxs-auto-check/classifier-debug.log
   ```

   Create the scratch directory first. Search for `classifier_request_started`, `classifier_request_finished`, and `ignoring CLAUDE_CODE_AUTO_MODE_MODEL`. Record the model and stage. A read-only `ls` may skip the classifier; a harmless interpreter command such as `uv run --no-project --python 3.13 python -c "print(6*7)"` reaches it.
3. If the debug log is insufficient, place a temporary HTTP forwarding proxy on loopback before the account's existing proxy. Set `HTTP_PROXY`/`HTTPS_PROXY` and clear `NO_PROXY` **only on the Claude child**, using a temporary `claude` wrapper in PATH. Do not proxy the subscription bridge's vendor requests. Forward to the one expected loopback origin, carry authentication headers only in memory, and never log them. The native Claude Code 2.1.318 client honored this setup.
4. Capture request metadata: path, model, stream, max_tokens, tool count, stop_sequences, thinking, output_config. Classifier XML stages can use `</block>` or `</severity>` stops; confirm with the debug stage rather than assuming every tool-free query is a classifier. Record response HTTP status, stop_reason, usage, content block types, text length, and the actual verdict text for the harmless probe. Keep private transcripts out of committed evidence. For an exact prompt capture, prefer the synthetic account in `scripts/verify-proxy-auto-mode.ts`; its fake proxy records request bodies without real credentials.

Useful diagnosis example:

```text
hy4free, non-stream, max_tokens=2112, stop=["</block>"]
HTTP 200, stop_reason=max_tokens, output_tokens=2112
content=[thinking], text_blocks=0
```

This is answer-budget exhaustion, even though HTTP succeeded. A 400 unknown-model response, 429 quota refusal, empty SSE conversion, or text with invalid classifier XML needs a different correction.

## Controls and repair boundaries

| Control | What to check |
| --- | --- |
| `CLAUDE_CODE_AUTO_MODE_MODEL` | Overrides the client classifier model on supported Claude versions. Verify the effective model in the debug log, not just the saved value. claudex-switch's historical WorkBuddy deepseek pin is conditional on the catalog; explicit profile env overrides it. |
| `CLAUDE_CODE_AUTO_MODE_SERVER=0` | Uses client checks where the gateway cannot provide server review. It neither disables permission checks nor makes classifier calls free. Keep the default in account-private run settings and honor explicit overrides. |
| Catalog and tier mappings | Use full registered IDs, including suffixes. Check the real binary's settled remote catalog and shared saved `/model` value. Do not invent a model ID or silently select a paid substitute. |
| Stream / non-stream | Claude's classifier can request one JSON answer while WorkBuddy accepts only SSE. The WorkBuddy bridge requests a stream and folds text, thinking, tool calls, usage and errors into the non-stream response. |
| Reasoning effort | WorkBuddy's unrequested default thinking can consume a small side-query budget. Non-stream requests without explicit `reasoning_effort` use `none`; explicit efforts and streaming chats pass through. Keep this correction in the subscription bridge, not in global settings. |
| Credits / frequency | `14018` is exhausted credits for a priced route; other catalog-free routes may still work. `6004` is a usage window: use its written reset/Retry-After, without a retry loop. Do not buy credits or change accounts without authorization. |

When bridge behavior changes, bump `SUBSCRIPTION_BRIDGE_REVISION` in `managed.ts`. Old daemons outlive builds; the next idle launch replaces them. Do not terminate someone else's live session to force migration.

## Worked cases

- **agy, v1.25.7–v1.25.8:** model routing and protocol compatibility mattered. Real CLIProxyAPI 7.3.20 initially served a stale built-in catalog; a later remote catalog included the newer Claude model. The user's shared settings still selected `claude-opus-5-5`, so a clean temporary HOME missed the failure. Wait for catalog settlement, map saved and classifier IDs to registered models, and verify with the account's actual binary/settings. See [the proxy guide](../../docs/local-cliproxyapi.md).
- **Translating proxies, v1.26.0:** server-side auto review was unavailable through the gateway. Account-private `CLAUDE_CODE_AUTO_MODE_SERVER=0` kept client classification working. Check eligibility and the classifier separately; this knob does not repair an invalid client response.
- **WorkBuddy, v1.26.3:** the classifier followed the Auto/sonnet tier until the user chose a dedicated `deepseek-v4.1-flash` classifier. That WorkBuddy-private default applies when the catalog lists it. Later catalogs/credit availability can invalidate this choice; inspect what actually reaches the provider.
- **WorkBuddy, v1.26.4:** `stream=false` returned `11101`; sending SSE and collecting the response fixed the transport. See `collectedChat` and `scripts/verify-subscription-bridge.ts`.
- **WorkBuddy hy4free, 2026-11-06:** the classifier already reached hy4free with server review off, but both 2112-token attempts returned thinking only. The bridge now sends unrequested non-stream effort as `none`. The live classifier returned `<block>no</block>` in 8 tokens, and the requested Python command printed `42`. Main-chat xhigh thinking remained enabled. See [the measured receipt](../../docs/receipts/hy4-automode-20261106.md).

## Verify the user path

- Run tests via `bun run test`, preserving `bunfig.toml`'s temporary-HOME preload. Exercise the real bridge with a provider fixture that returns thinking-only/length unless effort is disabled. Check explicit effort, normal streaming, other providers, upstream errors, and deny responses remain intact.
- Run `bun scripts/verify-subscription-bridge.ts` for real Claude Code + CLIProxyAPI + real plugin against synthetic vendor transport. Use `bun scripts/verify-proxy-auto-mode.ts` for synthetic agy classification. These tests do not prove the real subscription.
- In an authorized, visible tmux test window, launch the worktree build normally in auto mode. Run at least `git log -1 --oneline`, `ls`, and the harmless Python command above. Preserve the screen results **and** a successful actual classifier reply; read-only tools alone are insufficient. Do not add an allowlist or approval hook that bypasses the failing check.
- Close the owned session, capture proxy and test window. Report versions, effective model/mode, before/after response metadata, real tool results, remaining limits, and the verification scope. Keep release/install separate when ROOT owns them.

Current upstream semantics: [Claude permission modes](https://code.claude.com/docs/en/permission-modes), [environment variables](https://code.claude.com/docs/en/env-vars). Recheck these when a client version changes behavior.
