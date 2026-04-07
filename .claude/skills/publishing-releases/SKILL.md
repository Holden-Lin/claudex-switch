---
name: publishing-releases
description: Use when working in the claudex-switch repository and the task involves cutting a release, pushing a version tag, validating installer behavior, or debugging why the installed version does not match main. Covers version bumps, GitHub release workflow, Homebrew formula auto-updates, and post-release verification.
---

# Publishing Releases

Use this skill for release and installer tasks in this repository. The workflow is fragile enough that low-freedom instructions are better than ad hoc judgment.

## File Layout Map

- `package.json`: package version that should match the release you intend to publish.
- `install.sh`: installer entrypoint. It prefers `releases/latest` and only falls back to `main` when no GitHub release exists.
- `.github/workflows/release.yml`: tag-triggered release workflow. Builds assets, publishes the GitHub release, then commits `Formula/claudex-switch.rb` back to `main`.
- `scripts/build-release-assets.sh`: produces platform tarballs and checksums for releases.
- `scripts/render-formula.sh`: renders the Homebrew formula from the release artifacts.
- `Formula/claudex-switch.rb`: generated formula. Normal releases should let the workflow rewrite this file.
- `tests/install-script.test.ts`: installer regression tests for release resolution and upgrade safety.
- `tests/render-formula.test.ts`: formula rendering regression test.

## Preflight

1. Check the working tree and understand any existing changes before editing or tagging.
2. If the release includes user-visible changes, update `package.json` to the intended version first.
3. Run:

```bash
bun run verify
```

Do not tag a release if `bun run verify` fails.

## Canonical Release Flow

1. Commit the release-ready changes on `main`.
2. Push `main`.
3. Create the release tag from the pushed commit:

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

4. Watch the release workflow until it finishes:

```bash
curl -fsSL 'https://api.github.com/repos/Holden-Lin/claudex-switch/actions/runs?per_page=4' | rg '"head_branch": "vX.Y.Z"|"status":|"conclusion":'
curl -fsSL https://api.github.com/repos/Holden-Lin/claudex-switch/releases/latest | rg '"tag_name"|"published_at"'
```

5. After the workflow succeeds, sync local `main` again:

```bash
git fetch origin
git pull --ff-only origin main
```

The extra pull is mandatory. The release workflow auto-commits the generated Homebrew formula back to `main`, so local `main` will often be behind after a successful tag push.

## Post-Release Validation

Run both checks after the release is live:

```bash
curl -fsSL https://raw.githubusercontent.com/Holden-Lin/claudex-switch/main/install.sh | bash
claudex-switch help
```

```bash
VERSION=X.Y.Z bash install.sh
claudex-switch help
```

The first check verifies the default installer path now points at the latest GitHub release. The second check verifies pinned installs and upgrade-over-existing-install behavior.

## Rules That Prevent Repeating Past Mistakes

- Do not assume `install.sh` tracks `main`. It installs `releases/latest` by default. If a feature exists on `main` but not in the latest release, users will keep getting the old behavior.
- Do not hand-edit `Formula/claudex-switch.rb` as part of a normal release. The workflow regenerates it from the release assets and pushes the result back to `main`.
- If `git push origin main` is rejected after a recent release, fetch and rebase or fast-forward first. The usual cause is the workflow-generated formula commit landing on `main`.
- If a user reports `Unknown command` right after reinstalling, compare the latest release tag to the commit where the command was introduced before debugging runtime code.
- If reinstalling over an existing global install fails, verify `install.sh` still removes the old global package before `bun install -g`.

## Fast Diagnosis Checklist

When release behavior looks wrong, check these in order:

1. `git log --oneline --decorate -n 10`
2. `git tag --list --sort=version:refname`
3. `curl -fsSL https://api.github.com/repos/Holden-Lin/claudex-switch/releases/latest | rg '"tag_name"|"published_at"'`
4. `claudex-switch help`
5. `command -v claudex-switch`

This sequence separates "feature exists only on main" from "installer pulled the wrong artifact" and from "PATH still points to an older binary."
