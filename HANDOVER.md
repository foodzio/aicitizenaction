# HANDOVER.md — aicitizenaction

**Scope of this file:** `aicitizenaction` (repo root).

**Purpose:** the single source of truth for what is being implemented right now,
*for this project only*. Any LLM or human developer must be able to read this file
and resume the work without further context. Keep it updated as you go, not just at
the end. This file is tracked in git — commit it with the work it describes.

Structural facts about the repo (layout, tooling, commands) belong in `CLAUDE.md`,
not here.

## One HANDOVER.md per project / study / subproject

If this repo grows to hold several projects, studies, or subprojects, **each one gets
its own `HANDOVER.md` at the root of its own folder** (e.g.
`studies/study-a/HANDOVER.md`, `projects/foo/HANDOVER.md`).

- Write only to the `HANDOVER.md` of the project/subproject you are working on.
- Never edit, reset, merge, or delete another project's `HANDOVER.md` — they are
  independent and must not affect one another.
- Work that spans subprojects means updating each affected subproject's own file
  separately, cross-referencing them by path.
- This root file covers repo-wide work only; it is not a rollup of subproject files.

Handover files in this repo:

| HANDOVER.md path | Covers |
| --- | --- |
| `HANDOVER.md` | `aicitizenaction` (repo-wide) |
| _(add rows as subprojects appear)_ | |

---

## Current Plan
- **Plan / spec / request:** _none yet — link the doc in `docs/` when work starts_
- **Goal:** _what "done" looks like_
- **Started:** _timestamp_

## Status
- **Current phase / task:** _not started_
- **Progress:**

| # | Task | Status | Notes |
| --- | --- | --- | --- |
| 1 | _task_ | not started | |

Status values: `not started` / `in progress` / `done` / `blocked`.

## What Was Actually Implemented
_Record the real changes: files touched, functions added or modified, migrations
run, config changed. Note any deviation from the plan and the reason for it._

- _nothing yet_

## What To Watch
_Risks, gotchas, failing or skipped tests, temporary workarounds, blocked items,
and open decisions for the next developer._

- _nothing yet_

## How To Resume
1. _exact next step_
2. _commands needed to get back to a working state_

---

Last modified: 2026-09-22T16:26:22Z
