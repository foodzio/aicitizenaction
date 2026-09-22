# CLAUDE.md — Repo Directory & Tooling Reference

**What this file is:** a *directory* of how this repo is organized and what tooling
it uses. It answers "where does X live?" and "what do I run to do Y?".

**What this file is NOT:** it is not a work log, not a task tracker, and not a place
to record the status of an in-flight implementation. All of that belongs in
`HANDOVER.md` at the repo root. See "Progress Tracking" below.

Keep this file current whenever the repo layout, tooling, or entry points change.

---

Do not access local files, directories, credentials, accounts, configuration,
applications, or other resources outside the project unless they are explicitly
cited by the project's documentation or the user explicitly authorizes that
access. Unrestricted filesystem permissions do not grant permission to discover
or inspect uncited local resources.
---	

## 1. Repo Organization (Directory Map)

Describe every top-level directory and any file an agent or developer needs to find.
Update this table as the repo grows — it is the map, so a stale map is a bug.

| Path | Purpose |
| --- | --- |
| `CLAUDE.md` | This file — repo directory and tooling reference |
| `HANDOVER.md` | Live implementation status / handover notes (see section 4) |
| `AGENTS.md` | Bootstrap pointers for Codex and other agent frameworks |
| `docs/` | Requirements, specs, plans, design notes |
| `docs/ux-brief.md` | UX brief: product definition, user portrait, information architecture, screen flow, testable design principles |
| `input/` | Source assets from the Sept 2026 research and build pass — see `input/README.md` for the manifest |
| `input/data/` | Normalized datasets: institutions, committees and organisations, source index |
| `input/data/raw/` | Unnormalized output from the ten research agents. Expensive to recreate — do not delete |
| `input/src/` | Page sources for the two published prototype pages (Artifact format — no doctype/head/body) |
| `input/screenshots/` | Render checks, desktop and mobile |
| `tmp/` | Scratch output (gitignored; Playwright MCP writes here) |
| `.claude/` | Claude Code settings, skills, agents for this project |
| `.codex/config.toml` | Codex-scoped MCP server config |
| `.mcp.json` | MCP server config (Playwright on CDP port `9352`) |
| `.projstuff` | Local project metadata (id, path, CDP port, repo URL) |
| `.version.json` | Version source of truth (major/minor/patch/build) |
| `version.json` | Public version endpoint, served at `/version.json` |
| `bump-version.sh` | Manual version bump helper |
| _(add rows below)_ | _(src/, tests/, scripts/, etc. — document as created)_ |

### Project identity
- Project name: `aicitizenaction`
- Project ID: `52`
- CDP port: `9352`

---

## 2. Tooling

### Versioning
- `.version.json` is the source of truth. `version.json` is its public mirror.
- Patch version and build number auto-increment on every commit via
  `.git/hooks/pre-commit`.
- Manual bumps: `./bump-version.sh patch|minor|major`.

### Search & file discovery
- Prefer `rg` for content search and `rg --files` for file discovery.

### MCP servers
- Playwright MCP is configured in `.mcp.json` (Claude Code) and
  `.codex/config.toml` (Codex). Both point at CDP port `9352`.
- The port in `.mcp.json`, `.codex/config.toml`, and `.projstuff` must match.

### Build / test / run
_(Document the real commands here as soon as they exist — install, build, test,
lint, typecheck, dev server, and how to run the app locally. An agent should be
able to work in this repo using only what is written in this section.)_

- Install: _TBD_
- Build: _TBD_
- Test: _TBD_
- Lint / typecheck: _TBD_
- Run locally: _TBD_

---

## 3. Playwright MCP — Browser Initialization (IMPORTANT)

Before using ANY Playwright MCP browser tools, you MUST initialize the browser by running the skill:

```
/browser-init
```

This skill launches Chrome for Testing with remote debugging on CDP port `9352` (configured in `.projstuff`). The Playwright MCP server (configured in `.mcp.json`) connects to this port.

**Always use `/browser-init` first.** Do not manually launch Chrome or attempt to use Playwright tools without it.

### Troubleshooting
- `connect ECONNREFUSED` → Browser is not running. Run `/browser-init` again.
- Port conflict → Another Chrome debug instance may be using port 9352. Kill it first or use a different port.
- The port in `.mcp.json` must match the port in `.projstuff`.

### Manual fallback (if skill is unavailable)
```bash
$HOME/Documents/mastuff/proj/utils/bash/start_chrome_debug_mcp_playwright.sh 9352
```

### Do NOT use regular Chrome
Do not try to launch `/Applications/Google Chrome.app` with `--remote-debugging-port`. It conflicts with existing Chrome sessions. The `/browser-init` skill (and the fallback script above) uses Chrome for Testing with an isolated profile.

### Browser Policy
Never open regular Chrome. Always use `/browser-init` to start using a browser.

---

## 4. Progress Tracking — HANDOVER.md (MANDATORY)

**When running an implementation, you MUST maintain a `HANDOVER.md`.**
Update it as you work — not only at the end. If the session is interrupted at any
point, `HANDOVER.md` must be complete enough that another LLM or human developer
can pick up exactly where you left off without asking questions.

### Which HANDOVER.md — one per project/subproject

- A single-project repo has **one** `HANDOVER.md` at the repo root.
- If this repo holds **several projects, studies, or subprojects**, then **each one
  gets its own `HANDOVER.md` at the root of its own folder** —
  e.g. `studies/study-a/HANDOVER.md`, `projects/foo/HANDOVER.md`.
- **Write only to the `HANDOVER.md` of the project/subproject you are working on.**
  Never edit, reset, summarize, merge, or delete another project's `HANDOVER.md` —
  they are independent and must not affect each other. Work in one subproject must
  leave every other subproject's `HANDOVER.md` byte-for-byte unchanged.
- Before you start writing, identify the correct file: walk up from the files you are
  changing to the nearest enclosing project/subproject folder and use the
  `HANDOVER.md` there. Create it if it does not exist yet.
- If a change genuinely spans several subprojects, update each affected
  subproject's own `HANDOVER.md` separately, and cross-reference them by path.
- A root `HANDOVER.md` in a multi-project repo covers only repo-wide work; it is
  **not** a rollup of the subproject files and must not duplicate their status.
- Every `HANDOVER.md` is committed to git — it is a tracked project artifact, never
  gitignored and never left as a local-only scratch file.

### Contents

`HANDOVER.md` tracks, at minimum:
1. **Plan being implemented** — which plan/spec/request, and a link to it in `docs/`.
2. **Where we are** — current phase/task, what is done, what is in progress, what
   remains. Mark each item done / in progress / not started.
3. **What was actually implemented** — the real changes made (files touched,
   functions added or modified), including anything that deviated from the plan and
   why.
4. **What to watch** — known risks, gotchas, failing or skipped tests, temporary
   workarounds, blocked items, and open decisions the next developer must make.
5. **How to resume** — the exact next step, plus any commands needed to get back to
   a working state.

Rules:
- Update `HANDOVER.md` after each meaningful unit of work, before ending a session,
  and before any long-running or risky operation.
- Timestamp every update (system date/time).
- Keep status **honest**: record failures, skipped steps, and partial work as such.
- Commit `HANDOVER.md` along with the work it describes — `git add` it every time.
  It must never be added to `.gitignore`.
- Do not put implementation status in `CLAUDE.md` — structural and tooling facts go
  in `CLAUDE.md`, live progress goes in `HANDOVER.md`.

### Register the handover files here

List every `HANDOVER.md` in this repo and what it covers, so the map stays true:

| HANDOVER.md path | Project / study / subproject it covers |
| --- | --- |
| `HANDOVER.md` | Repo-wide work for `aicitizenaction` |
| _(add rows as subprojects appear)_ | |

Last modified: 2026-09-22T16:26:22Z
