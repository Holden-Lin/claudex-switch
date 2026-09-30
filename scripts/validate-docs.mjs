#!/usr/bin/env node

import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const requiredFiles = [
  "README.md",
  "README.en.md",
  "docs/use-cases.md",
  "docs/faq.md",
  "docs/list-json.md",
  "docs/promotion-plan.md",
  "docs/use-cases/multi-account-cli.md",
  "docs/use-cases/claude-parallel.md",
  "docs/use-cases/codex-accounts.md",
  "docs/use-cases/opencode-go.md",
  "docs/use-cases/quota.md",
  "docs/use-cases/api-relays.md",
  "skills/claudex-switch/SKILL.md",
];

const missing = [];
for (const relativePath of requiredFiles) {
  try {
    await stat(resolve(root, relativePath));
  } catch {
    missing.push(relativePath);
  }
}

async function listMarkdown(directory) {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) paths.push(...(await listMarkdown(path)));
    else if (entry.isFile() && extname(entry.name).toLowerCase() === ".md") {
      paths.push(path);
    }
  }
  return paths;
}

const markdownPaths = [];
for (const path of ["README.md", "README.en.md", "docs", "skills/claudex-switch"]) {
  const absolute = resolve(root, path);
  try {
    const info = await stat(absolute);
    if (info.isDirectory()) markdownPaths.push(...(await listMarkdown(absolute)));
    else if (extname(absolute).toLowerCase() === ".md") markdownPaths.push(absolute);
  } catch {
    // Required missing files are reported below.
  }
}

const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g;
const brokenLinks = [];
for (const markdownPath of markdownPaths) {
  const contents = await readFile(markdownPath, "utf8");
  for (const match of contents.matchAll(linkPattern)) {
    const rawTarget = match[1].trim();
    const targetMatch = rawTarget.match(/^<([^>]+)>|^([^\s]+)/);
    const target = targetMatch?.[1] ?? targetMatch?.[2];
    if (!target || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(target)) continue;

    const pathname = decodeURIComponent(target.split(/[?#]/, 1)[0]);
    if (!pathname) continue;
    try {
      await stat(resolve(dirname(markdownPath), pathname));
    } catch {
      brokenLinks.push(`${markdownPath.slice(root.length + 1)} -> ${target}`);
    }
  }
}

if (missing.length || brokenLinks.length) {
  if (missing.length) console.error(`Missing required discoverability files:\n- ${missing.join("\n- ")}`);
  if (brokenLinks.length) console.error(`Broken local Markdown links:\n- ${brokenLinks.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log(`Documentation check passed: ${requiredFiles.length} required files, ${markdownPaths.length} Markdown files, local links resolve.`);
}
