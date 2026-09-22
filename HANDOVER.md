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
- **Plan / spec / request:** `docs/ux-brief.md` — UX brief for the citizen-facing site
- **Goal:** a site that converts alarm about AI into one specific, well-aimed action in a single sitting, ending with a draft message the user sends themselves to an institution that can actually act on their concern
- **Started:** 2026-09-22

## Status
- **Current phase / task:** research and content complete; UX brief written; no application code written yet
- **Progress:**

| # | Task | Status | Notes |
| --- | --- | --- | --- |
| 1 | Survey existing directories and action tools | done | Field maps exist (AISafety.com, aisecurityandsafety.org); US contact tools exist (CAIS, ControlAI, PauseAI). None do contact routing or non-US coverage |
| 2 | Research institutions and contact routes | done | 229 institutions, 589 routes, `input/data/institutions.json` |
| 3 | Research committees with AI jurisdiction | done | 144 bodies, 27 jurisdictions, 126 named holders, `input/data/committees-and-organisations.json` |
| 4 | Research organisations and campaigns | done | 50 entries with asks stated plainly, incl. industry lobbying |
| 5 | Build prototype: Concern Register | done | Published as an Artifact; source in `input/src/register/` |
| 6 | Build prototype: outcome routing page | done | Published as an Artifact; source in `input/src/routing/` |
| 7 | Export source index with qualifiers | done | 1,170 sources, three-state verification, `input/data/sources-index.json` |
| 8 | Write UX brief | done | `docs/ux-brief.md` |
| 9 | Store all assets in repo | done | `input/`, with `input/README.md` as manifest |
| 10 | Wireframes from the brief | not started | Deliverables listed at the end of `docs/ux-brief.md` |
| 11 | Build the door / path / reference site | not started | No build tooling chosen yet; CLAUDE.md section 2 still TBD |
| 12 | Answer the five open questions in the brief | not started | Blocks wireframing |

Status values: `not started` / `in progress` / `done` / `blocked`.

## What Was Actually Implemented

Research and content only. No application code exists yet.

**Files added**

- `docs/ux-brief.md` — product definition, user portrait, job to be done, information architecture (door / path / reference), five-screen flow, fifteen testable design principles, anti-patterns, edge cases, success measures, deliverables and open questions.
- `input/README.md` — manifest for everything under `input/`, including verification states and known decay.
- `input/data/institutions.json` — 229 institutions, 589 contact routes, remits, access levels, and a per-entry assessment of whether the channel actually works.
- `input/data/committees-and-organisations.json` — `seats`: 144 bodies with AI jurisdiction across 27 jurisdictions, 126 with named current holders and `verified_on` dates. `orgs`: 50 campaigns, civil society, professional and industry bodies with their asks stated plainly.
- `input/data/sources-index.json` — 1,170 sources, three-state verification, self-documenting `qualifiers` block.
- `input/data/directory-full.json` — complete record set behind both prototype pages.
- `input/data/raw/research-register.json`, `input/data/raw/research-routing.json` — unnormalized output from ten research agents.
- `input/src/register/`, `input/src/routing/` — page sources, each as `index.html` plus the `head`/`body`/`script` parts it was assembled from.
- `input/screenshots/` — eight render checks, desktop and mobile.

**Files modified**

- `CLAUDE.md` — directory map extended with `docs/ux-brief.md` and the `input/` tree.
- `.gitignore` — added `!input/screenshots/*.png` so the reference renders are tracked despite the blanket `*.png` rule.

**Deviations from plan**

The first research pass built an institution directory before checking whether one already existed. It largely did — several good field maps are published. The scope was then narrowed to the layers nobody covers: contact routing, committee seats with named holders, and non-US jurisdictions. The original institution dataset was kept because the contact and remit detail in it is not duplicated anywhere.

A second deviation: the initial build assumed a user with evidence to submit. It was redirected after the user clarified that the primary audience is an alarmed non-expert with no evidence, who needs routing and a draft rather than a filing format.

## What To Watch

**Data decay — the main risk to credibility.**

- Named seat-holders change with elections, reshuffles and annual committee reconstitutions; EU rapporteurs change with every file. Every name carries `verified_on` and `membership_url`. The interface must show the date and treat the membership link as first-class, so a stale name degrades gracefully instead of misleading.
- Indian and Japanese committee chairs rely on bodies reconstituted annually — re-confirm before relying on them.
- The UK's DSIT was abolished in July 2026 and the Commons committee reverted to its former name. Some register entries written against the older structure are partly stale.
- The International Network of AI Safety Institutes was renamed in December 2025, dropping "safety" from its title.

**Verification is three-state, not boolean.** 774 verified (page fetched, route seen), 145 unverified (cited but unread — leads, not addresses), 251 unchecked (`null`, homepage and framework links). Treating `null` as `false`, or either as verified, will misrepresent the dataset.

**Prototype pages are Artifact-format.** No doctype, `head` or `body` tags — the platform wraps them at publish time. Hosting them anywhere else requires adding a document skeleton.

**No build tooling chosen.** CLAUDE.md section 2 still says TBD for install / build / test / lint / run. That decision blocks task 11.

**Open decisions, carried from the brief:**

1. Does the door ask for location, or is jurisdiction inferred later from the outcome chosen?
2. Do we let a user draft to a body in a country they do not live in? Several accept foreign submissions, but it may reduce the message's weight.
3. How prominent is the "join an organisation" outcome? Most effective for most people, and also the one that hands them someone else's ask.
4. Is the industry-lobbying layer shown to a first-time user, or only in the reference?
5. Who maintains the named seat-holders, and how often? Credibility decays without an answer.

**Product risk worth naming.** The existing campaign tools are effective partly because they concentrate many people behind one ask. A directory that helps each person articulate their own concern produces more authentic participation and less political force. That trade-off is deliberate, but it should be revisited rather than assumed.

## How To Resume

1. Read `docs/ux-brief.md` end to end. It is the spec.
2. Answer the five open questions above — they block wireframing.
3. Decide build tooling and fill in CLAUDE.md section 2.
4. Wireframe the five screens at phone width, per the deliverables list at the end of the brief.
5. The data is ready to build against: `input/data/institutions.json` and `input/data/committees-and-organisations.json` are the two the interface renders from. `input/README.md` documents the shapes.

Reference prototypes (published, private):
- Concern Register — https://claude.ai/artifact/9BhNrXsW43HJ4rjH5fSuNy
- Where to Take an AI Concern — https://claude.ai/artifact/XQTFNvgEsNuNxfvbqXcnsL

---

Last modified: 2026-09-22T16:50:00Z
