// The whole UI is one self-contained document: no build step, no bundler, no
// CDN. It is served from a loopback-only server and rendered entirely through
// DOM APIs (never innerHTML with account data), so a value like an API key or
// a model name can't turn into markup.
const PAGE = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>claudex-switch 配置</title>
<link rel="icon" href="data:,">
<style>
  :root {
    color-scheme: light dark;
    --bg: #f6f6f4;
    --surface: #ffffff;
    --border: #e2e0da;
    --text: #1d1c1a;
    --muted: #78746c;
    --accent: #b8552a;
    --accent-soft: #fdf1ea;
    --danger: #b3261e;
    --ok: #2f6f3e;
    --field-bg: #fbfbf9;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #17171a;
      --surface: #1f1f23;
      --border: #33333a;
      --text: #ececec;
      --muted: #9b968d;
      --accent: #e08b5f;
      --accent-soft: #2a211c;
      --danger: #f2837b;
      --ok: #7cc98d;
      --field-bg: #26262b;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0 16px 120px;
    background: var(--bg);
    color: var(--text);
    font: 14px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
      "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  }
  .wrap { max-width: 900px; margin: 0 auto; }
  header { padding: 28px 0 16px; }
  h1 { margin: 0; font-size: 19px; letter-spacing: .2px; }
  .sub { color: var(--muted); font-size: 13px; margin-top: 5px; }
  h2 {
    margin: 26px 0 10px; font-size: 12px; font-weight: 600;
    letter-spacing: .12em; text-transform: uppercase; color: var(--muted);
  }
  .card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; margin-bottom: 10px; overflow: hidden;
  }
  .card.dirty { border-color: var(--accent); }
  .card-head {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    padding: 12px 14px; cursor: pointer; user-select: none;
  }
  .card-head:hover { background: var(--accent-soft); }
  .caret { color: var(--muted); width: 10px; flex: none; font-size: 11px; }
  .alias { font-weight: 600; }
  .badge {
    font-size: 11px; color: var(--muted); border: 1px solid var(--border);
    border-radius: 20px; padding: 1px 8px; white-space: nowrap;
  }
  .badge.active { color: var(--ok); border-color: currentColor; }
  .badge.changed { color: var(--accent); border-color: currentColor; }
  .email { color: var(--muted); font-size: 12px; }
  .spacer { flex: 1 1 auto; }
  .card-body { padding: 4px 14px 16px; border-top: 1px solid var(--border); }
  .grid {
    display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 16px; margin-top: 14px;
  }
  @media (max-width: 620px) { .grid { grid-template-columns: 1fr; } }
  .field label { display: block; font-size: 12px; color: var(--muted); margin-bottom: 4px; }
  .field label code { font-size: 11px; opacity: .75; }
  .row { display: flex; gap: 6px; }
  input, textarea {
    width: 100%; padding: 7px 9px; font: inherit; font-size: 13px;
    color: var(--text); background: var(--field-bg);
    border: 1px solid var(--border); border-radius: 6px;
  }
  input:focus, textarea:focus { outline: 2px solid var(--accent); outline-offset: -1px; }
  input:disabled { color: var(--muted); cursor: not-allowed; }
  textarea { resize: vertical; min-height: 68px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  button {
    font: inherit; font-size: 13px; padding: 7px 12px; cursor: pointer;
    border: 1px solid var(--border); border-radius: 6px;
    background: var(--surface); color: var(--text);
  }
  button:hover { border-color: var(--accent); color: var(--accent); }
  button.primary {
    background: var(--accent); border-color: var(--accent); color: #fff; font-weight: 600;
  }
  button.primary:hover { color: #fff; opacity: .9; }
  button:disabled { opacity: .45; cursor: not-allowed; }
  button.icon { padding: 7px 9px; flex: none; }
  .section-label {
    margin: 18px 0 8px; font-size: 12px; color: var(--muted);
    display: flex; align-items: center; gap: 8px;
  }
  .env-row { display: flex; gap: 6px; margin-bottom: 6px; }
  .env-row input:first-child { flex: 0 0 42%; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  @media (max-width: 520px) {
    .env-row { flex-wrap: wrap; }
    .env-row input:first-child { flex: 1 1 100%; }
  }
  .hint { color: var(--muted); font-size: 12px; margin-top: 6px; }
  .err {
    color: var(--danger); font-size: 12px; margin-top: 10px;
    border-left: 2px solid currentColor; padding-left: 8px;
  }
  details.paste { margin-top: 18px; }
  details.paste summary { color: var(--muted); font-size: 12px; cursor: pointer; }
  details.paste .row { margin-top: 8px; }
  button.mini { padding: 4px 9px; font-size: 12px; }
  button.danger { color: var(--danger); border-color: var(--danger); }
  button.danger:hover { background: var(--danger); border-color: var(--danger); color: #fff; }
  button.confirm-delete { background: var(--danger); border-color: var(--danger); color: #fff; font-weight: 600; }
  button.confirm-delete:hover { color: #fff; opacity: .9; }
  .alias-input { width: 190px; padding: 4px 8px; font-size: 13px; font-weight: 600; }
  .alias-wrap { display: inline-flex; align-items: center; gap: 3px; min-width: 0; }
  /* Icon-only affordances: no chrome until hovered, so the header stays quiet. */
  button.icon-btn {
    display: inline-flex; align-items: center; line-height: 0;
    padding: 3px; border-color: transparent; background: none;
    color: var(--muted); border-radius: 5px;
  }
  button.icon-btn:hover { color: var(--accent); border-color: transparent; background: none; }
  button.icon-btn.accept:hover { color: var(--ok); }
  button.icon-btn.reject:hover { color: var(--danger); }
  button.icon-btn svg { display: block; }
  .danger-panel {
    margin-top: 14px; padding: 12px 14px;
    border: 1px solid var(--danger); border-radius: 8px;
  }
  .danger-title { color: var(--danger); font-weight: 600; font-size: 13px; }
  .danger-facts { margin: 8px 0 12px; padding-left: 18px; color: var(--muted); font-size: 12.5px; }
  .danger-facts li { margin: 3px 0; }
  footer {
    position: fixed; left: 0; right: 0; bottom: 0;
    background: var(--surface); border-top: 1px solid var(--border);
    padding: 12px 16px;
  }
  .bar {
    max-width: 900px; margin: 0 auto; display: flex;
    align-items: center; gap: 12px; flex-wrap: wrap;
  }
  .status { font-size: 13px; color: var(--muted); }
  .status.ok { color: var(--ok); }
  .status.bad { color: var(--danger); }
  .empty { color: var(--muted); padding: 24px 0; }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>claudex-switch 配置</h1>
    <div class="sub" id="sub">加载中…</div>
  </header>
  <div id="list"></div>
</div>
<footer>
  <div class="bar">
    <button class="primary" id="save" disabled>保存修改</button>
    <button id="reload">放弃改动并重新读取</button>
    <span class="status" id="status"></span>
  </div>
</footer>
<script>
(function () {
  "use strict";

  var token = new URL(location.href).searchParams.get("t") || "";
  // Keep the token out of the visible address bar, history and screenshots.
  history.replaceState(null, "", location.pathname);

  var FIELD_LABELS = {
    apiKey: ["API Key", "ANTHROPIC_API_KEY"],
    baseUrl: ["请求地址", "ANTHROPIC_BASE_URL"],
    authToken: ["Auth Token", "ANTHROPIC_AUTH_TOKEN"],
    model: ["主模型", "ANTHROPIC_MODEL"],
    defaultFableModel: ["Fable 映射", "ANTHROPIC_DEFAULT_FABLE_MODEL"],
    defaultOpusModel: ["Opus 映射", "ANTHROPIC_DEFAULT_OPUS_MODEL"],
    defaultSonnetModel: ["Sonnet 映射", "ANTHROPIC_DEFAULT_SONNET_MODEL"],
    defaultHaikuModel: ["Haiku 映射", "ANTHROPIC_DEFAULT_HAIKU_MODEL"],
    subagentModel: ["子代理模型", "CLAUDE_CODE_SUBAGENT_MODEL"],
    defaultModel: ["默认模型", ""],
    binaryPath: ["CLIProxyAPI 可执行文件", ""],
    providerName: ["Provider 名称", "model_providers"],
    envKey: ["环境变量名", "env_key"]
  };
  var CODEX_FIELD_LABELS = {
    baseUrl: ["请求地址", "base_url"],
    model: ["Provider 模型", "model"],
    apiKey: ["API Key", "OPENAI_API_KEY"]
  };
  var FIELD_ORDER = [
    "apiKey", "baseUrl", "authToken", "model",
    "defaultFableModel", "defaultOpusModel", "defaultSonnetModel",
    "defaultHaikuModel", "subagentModel",
    "defaultModel", "providerName", "envKey", "binaryPath"
  ];
  var ENV_TO_FIELD = {
    ANTHROPIC_API_KEY: "apiKey",
    ANTHROPIC_BASE_URL: "baseUrl",
    ANTHROPIC_AUTH_TOKEN: "authToken",
    ANTHROPIC_MODEL: "model",
    ANTHROPIC_DEFAULT_FABLE_MODEL: "defaultFableModel",
    ANTHROPIC_DEFAULT_OPUS_MODEL: "defaultOpusModel",
    ANTHROPIC_DEFAULT_SONNET_MODEL: "defaultSonnetModel",
    ANTHROPIC_DEFAULT_HAIKU_MODEL: "defaultHaikuModel",
    CLAUDE_CODE_SUBAGENT_MODEL: "subagentModel"
  };

  var snapshot = null;
  var drafts = {};
  var errors = {};
  var expanded = {};
  // Alias-level state for the two identity operations, which apply on their
  // own rather than through the batch save.
  var renaming = {};
  var pendingDelete = {};
  var busy = {};

  var listEl = document.getElementById("list");
  var subEl = document.getElementById("sub");
  var saveEl = document.getElementById("save");
  var statusEl = document.getElementById("status");
  document.getElementById("reload").addEventListener("click", function () {
    load(true);
  });
  saveEl.addEventListener("click", save);

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function iconPath(svg, d) {
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.7");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(path);
  }

  function icon(name) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("width", "14");
    svg.setAttribute("height", "14");
    svg.setAttribute("aria-hidden", "true");
    if (name === "pencil") {
      iconPath(svg, "M11.1 2.3l2.6 2.6-8.3 8.3-3.3.7.7-3.3 8.3-8.3zM10.2 3.2l2.6 2.6");
    } else if (name === "check") {
      iconPath(svg, "M3 8.5l3.2 3.2L13 5");
    } else {
      iconPath(svg, "M4 4l8 8M12 4l-8 8");
    }
    return svg;
  }

  function iconButton(name, title, className) {
    var button = el("button", "icon-btn" + (className ? " " + className : ""));
    button.type = "button";
    button.title = title;
    button.setAttribute("aria-label", title);
    button.appendChild(icon(name));
    return button;
  }

  function api(path, options) {
    var opts = options || {};
    opts.headers = Object.assign({}, opts.headers, {
      authorization: "Bearer " + token
    });
    return fetch(path, opts).then(function (res) {
      return res.json().then(function (body) {
        if (!res.ok) throw new Error(body && body.error ? body.error : "请求失败");
        return body;
      });
    });
  }

  function accounts() {
    if (!snapshot) return [];
    return snapshot.claude.concat(snapshot.codex);
  }

  function draftOf(account) {
    var draft = drafts[account.alias];
    if (!draft) {
      draft = {
        fields: Object.assign({}, account.fields),
        env: Object.keys(account.env).map(function (key) {
          return { key: key, value: account.env[key] };
        }),
        reveal: {}
      };
      drafts[account.alias] = draft;
    }
    return draft;
  }

  function envToObject(rows) {
    var out = {};
    rows.forEach(function (row) {
      var key = row.key.trim();
      if (key) out[key] = row.value;
    });
    return out;
  }

  function sameObject(a, b) {
    var ka = Object.keys(a);
    var kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every(function (key) { return a[key] === b[key]; });
  }

  function isDirty(account) {
    var draft = draftOf(account);
    var fieldsChanged = Object.keys(account.fields).some(function (key) {
      return account.readonly.indexOf(key) < 0 &&
        (draft.fields[key] || "") !== (account.fields[key] || "");
    });
    if (fieldsChanged) return true;
    if (!account.supportsEnv) return false;
    return !sameObject(envToObject(draft.env), account.env);
  }

  function dirtyAccounts() {
    return accounts().filter(isDirty);
  }

  function refreshFooter() {
    var count = dirtyAccounts().length;
    saveEl.disabled = count === 0;
    saveEl.textContent = count > 0 ? "保存修改 (" + count + ")" : "保存修改";
  }

  function setStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = "status" + (kind ? " " + kind : "");
  }

  function fieldLabel(account, key) {
    var entry = (account.provider === "codex" && CODEX_FIELD_LABELS[key]) ||
      FIELD_LABELS[key] || [key, ""];
    return entry;
  }

  function buildField(account, key, onChange) {
    var draft = draftOf(account);
    var labels = fieldLabel(account, key);
    var wrap = el("div", "field");
    var label = el("label", null, labels[0]);
    if (labels[1]) {
      label.appendChild(document.createTextNode("  "));
      label.appendChild(el("code", null, labels[1]));
    }
    wrap.appendChild(label);

    var row = el("div", "row");
    var input = document.createElement("input");
    var isSecret = account.secretFields.indexOf(key) >= 0;
    input.type = isSecret && !draft.reveal[key] ? "password" : "text";
    input.value = draft.fields[key] || "";
    input.autocomplete = "off";
    input.spellcheck = false;
    if (account.readonly.indexOf(key) >= 0) input.disabled = true;
    input.addEventListener("input", function () {
      draft.fields[key] = input.value;
      onChange();
    });
    row.appendChild(input);

    if (isSecret) {
      var toggle = el("button", "icon", draft.reveal[key] ? "隐藏" : "显示");
      toggle.type = "button";
      toggle.addEventListener("click", function () {
        draft.reveal[key] = !draft.reveal[key];
        input.type = draft.reveal[key] ? "text" : "password";
        toggle.textContent = draft.reveal[key] ? "隐藏" : "显示";
      });
      row.appendChild(toggle);
    }

    wrap.appendChild(row);
    return wrap;
  }

  function buildEnvSection(account, rerender, onChange) {
    var draft = draftOf(account);
    var box = document.createElement("div");
    var label = el("div", "section-label", "自定义环境变量");
    box.appendChild(label);

    draft.env.forEach(function (row, index) {
      var line = el("div", "env-row");
      var keyInput = document.createElement("input");
      keyInput.value = row.key;
      keyInput.placeholder = "CLAUDE_CODE_EFFORT_LEVEL";
      keyInput.autocomplete = "off";
      keyInput.spellcheck = false;
      keyInput.setAttribute("data-env-key", String(index));
      keyInput.addEventListener("input", function () {
        row.key = keyInput.value;
        onChange();
      });

      var valueInput = document.createElement("input");
      valueInput.value = row.value;
      valueInput.placeholder = "max";
      valueInput.autocomplete = "off";
      valueInput.spellcheck = false;
      valueInput.addEventListener("input", function () {
        row.value = valueInput.value;
        onChange();
      });

      var remove = el("button", "icon", "删除");
      remove.type = "button";
      remove.addEventListener("click", function () {
        draft.env.splice(index, 1);
        rerender();
      });

      line.appendChild(keyInput);
      line.appendChild(valueInput);
      line.appendChild(remove);
      box.appendChild(line);
    });

    var add = el("button", null, "+ 添加变量");
    add.type = "button";
    add.addEventListener("click", function () {
      draft.env.push({ key: "", value: "" });
      rerender({ env: draft.env.length - 1 });
    });
    box.appendChild(add);
    box.appendChild(el("div", "hint",
      "这些变量会写进该账号自己的配置；切换到别的账号时会被自动清理。"));
    return box;
  }

  function buildPasteBox(account, rerender) {
    var draft = draftOf(account);
    var details = el("details", "paste");
    details.appendChild(el("summary", null, "从 export 代码块粘贴导入"));

    var area = document.createElement("textarea");
    area.placeholder = "export ANTHROPIC_BASE_URL=https://api.example.com/anthropic\\nexport ANTHROPIC_MODEL=some-model";
    details.appendChild(area);

    var row = el("div", "row");
    var apply = el("button", null, "解析并填入");
    apply.type = "button";
    apply.addEventListener("click", function () {
      var parsed = parseExportBlock(area.value);
      var known = 0;
      var extra = 0;
      Object.keys(parsed).forEach(function (envKey) {
        var field = ENV_TO_FIELD[envKey];
        if (field && Object.prototype.hasOwnProperty.call(account.fields, field)) {
          draft.fields[field] = parsed[envKey];
          known += 1;
          return;
        }
        var existing = draft.env.filter(function (r) { return r.key === envKey; })[0];
        if (existing) existing.value = parsed[envKey];
        else draft.env.push({ key: envKey, value: parsed[envKey] });
        extra += 1;
      });
      setStatus("已填入 " + known + " 个字段、" + extra + " 个自定义变量，确认后点保存。");
      rerender();
    });
    row.appendChild(apply);
    details.appendChild(row);
    return details;
  }

  function parseExportBlock(text) {
    var out = {};
    text.split(/\\r?\\n/).forEach(function (raw) {
      var line = raw.trim();
      if (!line || line.charAt(0) === "#") return;
      if (line.indexOf("export ") === 0) line = line.slice(7).trim();
      var eq = line.indexOf("=");
      if (eq <= 0) return;
      var key = line.slice(0, eq).trim();
      var value = line.slice(eq + 1).trim();
      if (value.length > 1) {
        var first = value.charAt(0);
        var last = value.charAt(value.length - 1);
        if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
          value = value.slice(1, -1);
        }
      }
      if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) out[key.toUpperCase()] = value;
    });
    return out;
  }

  function buildHead(account) {
    var alias = account.alias;
    var head = el("div", "card-head");
    var renamingThis = Object.prototype.hasOwnProperty.call(renaming, alias);
    var open = expanded[alias] === true || pendingDelete[alias] === true;

    head.appendChild(el("span", "caret", open ? "▼" : "▶"));

    if (renamingThis) {
      var input = document.createElement("input");
      input.className = "alias-input";
      input.value = renaming[alias];
      input.setAttribute("aria-label", "别名");
      input.autocomplete = "off";
      input.spellcheck = false;
      input.addEventListener("input", function () {
        renaming[alias] = input.value;
      });
      input.addEventListener("click", function (event) {
        event.stopPropagation();
      });
      input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          submitRename(account);
        } else if (event.key === "Escape") {
          event.preventDefault();
          cancelRename(alias);
        }
      });
      head.appendChild(input);

      var accept = iconButton("check", "保存", "accept");
      accept.addEventListener("click", function (event) {
        event.stopPropagation();
        submitRename(account);
      });
      head.appendChild(accept);

      var reject = iconButton("reject", "取消", "reject");
      reject.addEventListener("click", function (event) {
        event.stopPropagation();
        cancelRename(alias);
      });
      head.appendChild(reject);
      // Keep the type badge next to the input; the spacer belongs at the end so
      // the row does not visibly come apart while the name is being edited.
      head.appendChild(el("span", "badge", account.label));
      head.appendChild(el("span", "spacer"));
      return head;
    }

    var aliasWrap = el("span", "alias-wrap");
    aliasWrap.appendChild(el("span", "alias", account.alias));
    if (pendingDelete[alias] !== true) {
      var pencil = iconButton("pencil", "修改别名");
      pencil.addEventListener("click", function (event) {
        event.stopPropagation();
        startRename(account);
      });
      aliasWrap.appendChild(pencil);
    }
    head.appendChild(aliasWrap);
    head.appendChild(el("span", "badge", account.label));
    if (account.isActive) head.appendChild(el("span", "badge active", "当前生效"));
    if (isDirty(account)) head.appendChild(el("span", "badge changed", "已修改"));
    if (account.email) head.appendChild(el("span", "email", account.email));
    head.appendChild(el("span", "spacer"));

    if (pendingDelete[alias] !== true) {
      var remove = el("button", "mini danger", "删除");
      remove.type = "button";
      remove.title = "删除账号（不可撤销）";
      remove.addEventListener("click", function (event) {
        event.stopPropagation();
        pendingDelete[alias] = true;
        expanded[alias] = true;
        rerenderCard(alias);
      });
      head.appendChild(remove);
    }

    head.addEventListener("click", function () {
      expanded[alias] = !open;
      rerenderCard(alias);
    });
    return head;
  }

  function buildCard(account) {
    var alias = account.alias;
    var card = el("div", "card" + (isDirty(account) ? " dirty" : ""));
    card.appendChild(buildHead(account));

    var open = expanded[alias] === true || pendingDelete[alias] === true;
    if (!open) return card;

    var body = el("div", "card-body");

    // A pending delete replaces the form entirely: this is a confirmation
    // state, and the form's fields are not what the user is being asked about.
    if (pendingDelete[alias] === true) {
      body.appendChild(buildDeletePanel(account));
      card.appendChild(body);
      return card;
    }

    var onChange = function () {
      refreshFooter();
      card.className = "card" + (isDirty(account) ? " dirty" : "");
    };
    var rerender = function (focus) {
      rerenderCard(account.alias, focus);
    };

    var grid = el("div", "grid");
    FIELD_ORDER.forEach(function (key) {
      if (!Object.prototype.hasOwnProperty.call(account.fields, key)) return;
      grid.appendChild(buildField(account, key, onChange));
    });
    body.appendChild(grid);

    if (account.supportsEnv) {
      body.appendChild(buildEnvSection(account, rerender, onChange));
      body.appendChild(buildPasteBox(account, rerender));
    } else {
      body.appendChild(el("div", "hint",
        "Codex 从 ~/.codex/config.toml 读取配置，不使用 Claude Code 的环境变量。"));
    }

    if (errors[account.alias]) {
      body.appendChild(el("div", "err", errors[account.alias]));
    }

    card.appendChild(body);
    return card;
  }

  function rerenderCard(alias, focus) {
    var account = accounts().filter(function (a) { return a.alias === alias; })[0];
    if (!account) return render();
    var current = listEl.querySelector('[data-alias="' + cssEscape(alias) + '"]');
    if (!current) return render();
    var next = buildCard(account);
    next.setAttribute("data-alias", alias);
    current.replaceWith(next);
    refreshFooter();

    if (focus && focus.alias === true) {
      var aliasInput = next.querySelector(".alias-input");
      if (aliasInput) {
        aliasInput.focus();
        aliasInput.select();
      }
    } else if (focus && focus.env !== undefined) {
      var input = next.querySelector('[data-env-key="' + focus.env + '"]');
      if (input) input.focus();
    }
  }

  function startRename(account) {
    // Only the flag is set here; the input itself is built by buildHead, so
    // there is exactly one construction site for it. The card deliberately does
    // not expand — the name is swapped in place.
    renaming[account.alias] = account.alias;
    rerenderCard(account.alias, { alias: true });
  }

  function cancelRename(alias) {
    delete renaming[alias];
    rerenderCard(alias);
  }

  function submitRename(account) {
    var alias = account.alias;
    // Re-entrancy guard: Enter held down would otherwise fire a second rename
    // against the alias the first one is already moving.
    if (busy[alias] === true) return;
    var next = (renaming[alias] || "").trim();

    if (!next || next === alias) {
      cancelRename(alias);
      return;
    }

    busy[alias] = true;
    api("/api/accounts/rename", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ alias: alias, newAlias: next })
    }).then(function (data) {
      delete busy[alias];
      if (!data.ok) throw new Error(data.error || "重命名失败");
      delete renaming[alias];
      delete drafts[alias];
      delete expanded[alias];
      delete errors[alias];
      snapshot = data.snapshot;
      render();
      setStatus("已重命名为 " + data.alias, "ok");
    }).catch(function (err) {
      delete busy[alias];
      // Keep the input open so the name can be corrected in place.
      errors[alias] = err.message;
      expanded[alias] = true;
      rerenderCard(alias);
    });
  }

  function submitDelete(account) {
    var alias = account.alias;
    if (busy[alias] === true) return;
    busy[alias] = true;
    rerenderCard(alias);

    api("/api/accounts/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ alias: alias })
    }).then(function (data) {
      delete busy[alias];
      if (!data.ok) throw new Error(data.error || "删除失败");
      var removed = data.removedAliases || [alias];
      delete pendingDelete[alias];
      delete drafts[alias];
      delete expanded[alias];
      delete errors[alias];
      snapshot = data.snapshot;
      render();
      setStatus("已删除 " + removed.join("、"), "ok");
    }).catch(function (err) {
      delete busy[alias];
      errors[alias] = err.message;
      rerenderCard(alias);
    });
  }

  // Spells out exactly what is about to be lost. A refusal (an active local
  // CLIProxyAPI session, say) surfaces in the same panel and removes nothing.
  function buildDeletePanel(account) {
    var alias = account.alias;
    var panel = el("div", "danger-panel");
    panel.appendChild(el("div", "danger-title",
      '删除账号 "' + alias + '"？此操作不可撤销。'));

    var facts = el("ul", "danger-facts");
    var linked = account.linkedAliases || [alias];
    if (linked.length > 1) {
      facts.appendChild(el("li", null,
        "会同时删除 " + linked.length + " 个指向它的别名：" + linked.join("、")));
    } else {
      facts.appendChild(el("li", null, "会删除别名 " + alias));
    }
    facts.appendChild(el("li", null, deleteCredentialFact(account)));
    if (account.isActive) {
      facts.appendChild(el("li", null,
        "该账号当前生效，删除后裸 " +
        (account.provider === "claude" ? "claude" : "codex") +
        " 将没有可用账号"));
    }
    panel.appendChild(facts);

    var row = el("div", "row");
    var keep = el("button", null, "取消");
    keep.type = "button";
    keep.addEventListener("click", function () {
      delete pendingDelete[alias];
      delete errors[alias];
      rerenderCard(alias);
    });
    row.appendChild(keep);

    var confirmDelete = el("button", "confirm-delete",
      account.isActive ? "仍然删除" : "确认删除");
    confirmDelete.type = "button";
    confirmDelete.disabled = busy[alias] === true;
    confirmDelete.addEventListener("click", function () {
      submitDelete(account);
    });
    row.appendChild(confirmDelete);
    panel.appendChild(row);

    if (errors[alias]) panel.appendChild(el("div", "err", errors[alias]));
    return panel;
  }

  function deleteCredentialFact(account) {
    if (account.provider === "claude") {
      if (account.type === "oauth") return "保存的登录凭据会被删除，需要重新登录";
      if (account.type === "api-key") return "API Key 与其账号配置会被删除";
      return "本机 CLIProxyAPI 的登录与配置会被删除，需要重新登录";
    }
    if (account.type === "chatgpt") return "Codex 登录文件会被删除，需要重新登录";
    return "API Key 与 Codex 登录文件会被删除";
  }

  function cssEscape(value) {
    return String(value).replace(/["\\\\]/g, "\\\\$&");
  }

  function renderGroup(title, items) {
    var box = document.createDocumentFragment();
    box.appendChild(el("h2", null, title));
    if (items.length === 0) {
      box.appendChild(el("div", "empty", "没有账号"));
      return box;
    }
    items.forEach(function (account) {
      var card = buildCard(account);
      card.setAttribute("data-alias", account.alias);
      box.appendChild(card);
    });
    return box;
  }

  function render() {
    listEl.textContent = "";
    if (!snapshot) return;
    listEl.appendChild(renderGroup("Claude", snapshot.claude));
    listEl.appendChild(renderGroup("Codex", snapshot.codex));
    subEl.textContent = "共 " + accounts().length + " 个账号 · " +
      "改完点底部保存；当前生效的账号会立即同步到全局配置";
    refreshFooter();
  }

  function load(announce) {
    api("/api/accounts").then(function (data) {
      snapshot = data;
      drafts = {};
      errors = {};
      render();
      if (announce) setStatus("已重新读取", "ok");
    }).catch(function (err) {
      setStatus("读取失败：" + err.message, "bad");
    });
  }

  function save() {
    var dirty = dirtyAccounts();
    if (dirty.length === 0) return;

    var changes = dirty.map(function (account) {
      var draft = draftOf(account);
      var fields = {};
      Object.keys(account.fields).forEach(function (key) {
        if (account.readonly.indexOf(key) >= 0) return;
        fields[key] = draft.fields[key] || "";
      });
      var change = {
        provider: account.provider,
        alias: account.alias,
        fields: fields
      };
      if (account.supportsEnv) change.env = envToObject(draft.env);
      return change;
    });

    saveEl.disabled = true;
    setStatus("保存中…");

    api("/api/accounts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ changes: changes })
    }).then(function (data) {
      errors = {};
      var failed = [];
      data.results.forEach(function (result) {
        if (!result.ok) {
          errors[result.alias] = result.error || "保存失败";
          failed.push(result.alias);
          expanded[result.alias] = true;
        }
      });

      snapshot = data.snapshot;
      // Keep unsaved edits for the accounts that failed so the user can fix
      // them in place; everything else reloads from the fresh snapshot.
      Object.keys(drafts).forEach(function (alias) {
        if (failed.indexOf(alias) < 0) delete drafts[alias];
      });
      render();

      if (failed.length === 0) {
        var reapplied = data.results.filter(function (r) { return r.reapplied; });
        setStatus(
          "已保存 " + data.results.length + " 个账号" +
          (reapplied.length > 0 ? "，其中 " + reapplied.length + " 个已同步到全局配置" : ""),
          "ok"
        );
      } else {
        setStatus(failed.length + " 个账号保存失败：" + failed.join("、"), "bad");
      }
    }).catch(function (err) {
      setStatus("保存失败：" + err.message, "bad");
      refreshFooter();
    });
  }

  load(false);
})();
</script>
</body>
</html>
`;

export function renderPage(): string {
  return PAGE;
}
