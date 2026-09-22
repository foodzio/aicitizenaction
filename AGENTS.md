# AGENTS.md

## Project Context
- Project name: aicitizenaction
- Project ID: 52
- CDP port: 9352
- Canonical Claude Code instructions: `CLAUDE.md`
- Live implementation status / handover notes: `HANDOVER.md`
- Project skills are located in `.claude/skills/`; user/global skills may also
  be located in `~/.claude/skills/`.
- `CLAUDE.md` is the source of truth for durable project knowledge. Information
  that would normally be added to `AGENTS.md`—data paths, instrument universe,
  credential variable names, remote host conventions, provider-specific access
  notes, workflow details, and operational guidance—must be stored in
  `CLAUDE.md` instead. Keep `AGENTS.md` limited to bootstrap instructions and
  pointers so the two files do not drift.
- DO NOT USE BUILT-IN BROWSER by default, instead use playwright MCP browser by default.
- DO NOT USE default computer-use capbilities unless user specifically states "use default computer-use". Do infer authorization in any other way.
  

## Instruction Sources
- Read `CLAUDE.md` for the repo directory map, tooling, commands, and detailed
  browser/data/workflow/remote-host instructions.
- Read `HANDOVER.md` first when resuming or continuing an implementation — it holds
  the current plan, progress, what was actually implemented, and what to watch.
- Use this `AGENTS.md` only for Codex/bootstrap guidance and pointers back to
  `CLAUDE.md`.
  
## Mandatory Local Skill Discovery

  The skills listed in the session prompt are not necessarily exhaustive.

  Before taking any task action—including searching the repository, searching the
  web, using browser automation, or applying a general-purpose workaround—inspect
  the local skill directories and determine whether an applicable skill exists:

  - `.claude/skills/`
  - `~/.claude/skills/` 

## Progress Tracking (MANDATORY)
- When running an implementation, maintain `HANDOVER.md` and update it as you work —
  not just at the end.
- It must always record: the plan being implemented, where we are, what was actually
  implemented, and what to watch (risks, gotchas, blocked items, failing tests).
- It must be complete enough that another LLM or human can pick up the project if the
  session is interrupted at any moment.
- **One `HANDOVER.md` per project / study / subproject**, at the root of that
  project's own folder (e.g. `studies/study-a/HANDOVER.md`). A single-project repo
  has one at the repo root. Write only to the file belonging to the project you are
  working on; never edit, reset, or delete another project's `HANDOVER.md` — they are
  independent and must not affect each other.
- `HANDOVER.md` files are tracked in git. Commit them with the work they describe and
  never add them to `.gitignore`.
- Timestamp every update. Never put live implementation status in `CLAUDE.md`.

## Playwright MCP — Browser Initialization (IMPORTANT)

Before using ANY Playwright MCP browser tools, initialize the browser using the skill:

```
/browser-init
```

This launches Chrome for Testing with remote debugging on CDP port `9352`.

**Manual fallback** (if the skill is unavailable):
```bash
$HOME/Documents/mastuff/proj/utils/bash/start_chrome_debug_mcp_playwright.sh 9352 &
```

If browser MCP calls fail with `connect ECONNREFUSED`, run `/browser-init` again or verify Chrome is running on port `9352`.

## Browser Policy
Never open regular Chrome. Always use `/browser-init` to start using a browser.

## Execution Rules
- Prefer `rg` for search and `rg --files` for file discovery.
- Keep changes minimal and avoid unrelated refactors.
- Run lightweight checks relevant to your edits before finishing.
- Do not overwrite user-authored instructions unless explicitly requested.

## Repository Notes
- Repo directory map and tooling: `CLAUDE.md`
- Implementation status / handover: `HANDOVER.md`
- Version source of truth: `.version.json`
- Public version endpoint file: `version.json`
- Local project metadata: `.projstuff`

Last modified: 2026-09-22T16:26:22Z
