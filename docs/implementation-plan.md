# AI Citizen Action — Implementation Plan

*Created 2026-09-22T20:37:19Z. Last modified 2026-09-22T23:51:33Z (implementation deviation: own link checker instead of lychee). Previously 2026-09-22T23:37:38Z — revised after critique: validation moved first, routing research made its own phase, branch protection and link check corrected, analytics decision moved earlier. See section 7.*

How to get from the research and spec in this repo to a live, volunteer-maintained, multilingual site with a Resources collection.

**Specs this plan implements**

- `docs/ux-brief.md` — the citizen-facing product: door, path, draft, reference.
- `docs/content-architecture.md` — content as data, translation, freshness, volunteers, and the Resources layer.

**Reference project for Resources:** `stockspanic` (Markets Panic), at `../stockspanic`. Its resources desk (`server/discussion-sources.json`, `server/discussion-ingest.mjs`, `content/discussions/`) and research hub (`content/research/`) are the model.

---

## 1. What we take from stockspanic, and what we leave

| stockspanic does | Here | Why |
| --- | --- | --- |
| Source registry with `kind`, `feedUrl`, `autoPublish` | **Adopt** as `content/resources/sources/`, one file per source, plus a required `perspective` | Same idea; one file per source fits volunteer ownership, and perspective makes balance checkable |
| Dependency-free RSS/Atom parser, dedupe by hashed id | **Adopt**, ported to `scripts/ingest-resources.mjs` | Proven and has no dependencies |
| Stores metadata only — no bodies, no transcripts, no embeds | **Adopt**, and also drop thumbnails | The brief rules out tracking; a hotlinked image is a third-party request |
| An original prompt on every item | **Adopt**; the prompt points to an action, not a reaction | This turns a news feed into a way into the path |
| Featured items that survive the feed moving on | **Adopt** as `featured: true` on an ordinary file | Same behaviour with no special case |
| Article → simulator handoff with a campaign id | **Adopt** as a resource → path handoff with the outcome and recipient preselected | Every resource ends in an action |
| Translation-invariant facts manifest plus a frozen English SHA-256 | **Adopt**; this is the architecture's `facts`/`strings` split and `src` hashes | Same mechanism, per record |
| Locale review gate: drafts stay noindex until reviewed and approved | **Adopt** as `i18n/<lang>/status.yml` | Keeps unreviewed translations out of search and away from newcomers |
| Node server + SQLite, ingest every 4 hours | **Leave** — a scheduled GitHub Action writes files; the site stays static | The brief requires static pages; files are reviewable, SQLite rows are not |
| Anonymous moderated discussion threads | **Leave** — not requested; listed as an open decision | Needs a server, CAPTCHA and a moderation queue |

---

## 2. Decisions this plan makes

Each is a recommendation; change any of them before the phase that depends on it.

| Decision | Choice | Depends on it |
| --- | --- | --- |
| Site generator | **Astro**, static output only | Phase 3 |
| Content format | YAML, one file per record, validated by JSON Schema (`ajv`) | Phase 1 |
| CI | GitHub Actions; link check with `scripts/check-links.mjs` (replaced `lychee` during implementation: the two-consecutive-failures rule, unknown-vs-broken classification and owner routing need state lychee does not keep), tuned for government sites | Phase 2 |
| Branch protection | One approval, with owner bypass, while there is one maintainer; the ingest bot exempt for *Resource intake*. Two approvals (one from a path owner) once there are two or more maintainers | Phase 2 |
| Tests | `node:test`, like stockspanic | Phase 1 onward |
| Hosting | Static build in `dist/`, served on Railway with `serve dist -l $PORT` per the owner's Railway convention. Always ask before deploying | Phase 7 |
| Resources storage | This repository, `content/resources/` | Phase 4 |
| Resources collection | Scheduled GitHub Action twice daily → one rolling *Resource intake* PR | Phase 4 |
| Resources review | Editorial: anyone suggests, editors publish, maintainers add sources | Phase 4 |
| Web CMS | Decap CMS, deferred until the first non-git steward arrives | Phase 5b |
| Translation platform | Weblate, deferred until a second language has a steward | Phase 6 |
| Frozen input | `input/` is never edited; migration reads it and writes `content/` | Phase 1 |

---

## 3. Open decisions — who blocks what

| # | Question | Source | Blocks |
| --- | --- | --- | --- |
| 1 | Does the door ask for location, or infer jurisdiction later? | Brief | Phase A (validation), then 3b |
| 2 | Can a user draft to a body in another country? | Brief | Phase A, then 3b |
| 3 | How prominent is "join an organisation"? | Brief | Phase A, then 3b |
| 4 | Is the industry-lobbying layer shown to first-time users? | Brief | Phase A, then 3b |
| 5 | Who maintains named seat-holders, and how often? | Brief | **Answered by the architecture**: geography stewards, 90-day cycle. Confirm |
| 6 | How is draft completion counted without a consent wall on a static site? | Brief metrics vs static constraint | **Decide before Phase 3a** — the pages must be built with the chosen measurement in place, not retrofitted at launch. Tool not chosen; cookieless options (e.g. GoatCounter, Plausible) are candidates, subject to the owner's privacy stance |
| 7 | Visitor discussion on Resources — ever? | stockspanic comparison | Nothing now; out of scope unless chosen |
| 8 | Which second language comes first? | Architecture | Phase 6 |
| 9 | GitHub organisation and team names for `CODEOWNERS` | Architecture | Phase 2 |
| 10 | Domain name | — | Phase 7 |

Phase A needs questions 1–4. Phases 1, 1b and 2 are not blocked and can run alongside it. Phase 3a needs question 6.

---

## 4. Phases

Each phase ends with something that runs and a check that proves it. Tasks are small enough to finish and commit one at a time.

### Phase 0 — Architecture fixed *(done in this commit)*

- [x] Record format corrected: routes are objects with their own three-state `verified`, `effort_minutes` is a number, `owners` quoted (the original example was invalid YAML).
- [x] Mapping from the 229 institutions' groups to `bodies/`, `channels/`, `orgs/`.
- [x] Resources layer specified: media, explainers, windows, source registry, collection job, rules.
- [x] Volunteer lifecycle: ladder, teams, inactivity, privacy, stepping back.
- [x] Resources-in-this-repo and editorial-resources decisions recorded.

### Phase A — Validate before building

Goal: find out whether the core bet holds — an alarmed non-expert picks a recipient, writes something in their own words, and leaves with a draft — before building the parts that depend on it. The brief asks for this test before building.

1. The owner answers brief questions 1–4; the test needs those choices made.
2. Build the thinnest thing that can be tested: a paper or clickable version of door → narrow → why this one → draft, covering two or three outcomes with real recipients from `input/data/`. The existing prototypes in `input/src/` were built around an earlier register-and-evidence idea and may not test the path as designed; reuse them only where they match.
3. Test with five people who match the primary user, cold, on a phone. Watch the brief's three things: understanding within ten seconds that this is for them; explaining unprompted why the recipient was chosen; writing something in their own words rather than skipping the field.
4. Write the findings to `docs/validation-findings.md` and revise the brief and this plan before Phase 3b.

**Done when:** five sessions are recorded and the findings are written up, including anything that failed.
**Runs alongside:** Phases 1, 1b and 2, which the findings do not change.

### Phase 1 — Schemas and migration

Goal: every fact in `input/data/` exists as one validated file under `content/`, with nothing lost.

1. Scaffold `package.json` (Node 20+, `"type": "module"`), `ajv`, `yaml`. Fill in CLAUDE.md section 2.
2. Write `schema/vocab/*.yml`: route types (the 18 in `sources-index.json`), topics (from committee `tags` and `not_topics`), powers, perspectives (from the orgs' `side`), roles.
3. Write `schema/route.schema.json`, then `body`, `channel`, `org`, `guide`. Enums reference the vocabularies; `verified` is required and has no default; `sources` has at least one entry.
4. `scripts/migrate-input.mjs`: read `input/data/*.json`, map groups per the architecture, split `facts` from `strings`, carry every route's `verified` state across, set `review_by` from the freshness cycles, and write `content/**.yml`.
5. The migration writes `tmp/migration-report.md`: suspected duplicates between datasets (for a human to confirm), fields it could not map, and prose `powers` that need turning into enums by hand.
6. `scripts/validate.mjs`: schema, duplicate ids, reference integrity, date sanity.
7. Tests: round-trip counts (229 + 144 + 50 minus confirmed merges), route count 589, verification counts 774 / 145 / 251 preserved, every file valid.

**Done when:** `npm run validate` passes on the migrated tree and the tests prove the counts match `input/`.
**Watch:** `powers`, `topics` and `not_topics` are not migrated here — they do not exist as lists in the source data (see Phase 1b). The migration keeps the prose and marks each record `needs-research`.

### Phase 1b — Routing research

Goal: the structured fields that routing depends on exist and are right. This is judgement work, not a script, and is budgeted as its own phase.

**The starting point, corrected.** An earlier version of this plan said routing could fall back to committee `not_topics` data "which is complete". That was wrong. No `not_topics` list exists in the data. What exists is prose: each committee's `ai_jurisdiction` text, which often states what does *not* belong there, plus a loose `tags` list. For institutions, `powers` is free text on 88 of 229 records and empty on the rest.

1. Finalise `schema/vocab/topics.yml` and `powers.yml` first, from a read of the prose, so the lists fit the data rather than the other way round.
2. For each of the 144 committees: `topics` and `not_topics` from `ai_jurisdiction`, each with the sentence it was taken from kept alongside, for review.
3. For each body in `bodies/` (from the 229 institutions): `powers` as enums, sourced; `needs-research` stays where the source does not say.
4. A second person reviews each jurisdiction's routing fields before they are used. An overstated power is the error the architecture says destroys the most trust.
5. Tests: every committee has at least one topic; no enum outside the vocabulary; every `powers` value has a source.

**Done when:** every committee has reviewed `topics` and `not_topics`, and every body either has sourced `powers` or is explicitly `needs-research`.
**Estimate:** weeks, not days. A model-drafted first pass may shorten it, but every field is human-reviewed before routing uses it.
**Blocks:** Phase 3b routing.

### Phase 2 — Checks that let strangers contribute

Goal: a pull request from someone you have never met is validated before a human looks.

1. `.github/workflows/check.yml`: validate, tests, and `lychee` on changed files.
2. Link-check tuning, before the weekly run is switched on:
   - retries with backoff; a browser-like user agent that still identifies the project;
   - `403`, `429` and bot-challenge responses recorded as **unknown**, not broken, and never opened as issues on their own;
   - an issue opens only after a URL fails the same way on two consecutive weekly runs;
   - a per-domain exclusion list for sites that always block automated checks, reviewed by hand on the record's own cycle instead.
3. `.github/workflows/weekly.yml`: link check of the whole tree with the tuning above; one issue per confirmed failure, routed by `CODEOWNERS`.
4. Translation integrity and orphan checks (they pass trivially until Phase 6, and are ready when it starts).
5. `CODEOWNERS` with maintainers owning everything. Branch protection: **one approval with owner bypass** while there is one maintainer, and the ingest bot exempt for the *Resource intake* PR. Switch to the architecture's two approvals (one from a path owner) once there are two or more maintainers. Requiring two approvals with a single maintainer would lock the owner out and block the intake auto-merge.
6. Issue templates: *report a problem with a record*, *suggest a resource*, *volunteer for a path*.

**Done when:** a test PR with a broken URL, an unknown enum and a missing source fails; one with a valid change passes and can be merged by the single maintainer; and a trial weekly run against the migrated tree opens no issues for sites that merely block automated checks.

### Phase 3a — Site skeleton and the reference layer

Goal: the directory is browsable, built only from `content/`.

**Needs:** open decision 6 (how completion is counted), so measurement is built in rather than retrofitted.

1. Astro project in `site/`, static output to `dist/`; build reads `content/` through the validated loader.
2. URL scheme: `/en/bodies/<id>`, `/en/channels/<id>`, `/en/orgs/<id>`, and a language prefix on every route.
3. Record pages: dates shown beside the facts they apply to, membership link first-class, unverified and unchecked routes labelled, route language shown before the click.
4. `/api/bodies.json`, `/api/channels.json`, `/api/orgs.json` published with the build.
5. A *something wrong here?* link on every record, opening the pre-filled issue.
6. Light and dark themes designed, keyboard navigation, contrast checked (brief constraints).

**Done when:** every migrated record has a page, the build fails on invalid content, and a phone-width check of five records passes.

### Phase 3b — Door, path and draft *(needs Phase A findings, Phase 1b routing fields and the wireframes)*

Goal: the product in the brief — one sitting, one draft.

1. Wireframes (HANDOVER task 10) at phone width: door, narrow, why this one, draft, done, plus the honest-floor and insider states — revised by the Phase A findings.
2. Routing from the reviewed `topics` / `not_topics` and `powers` (Phase 1b) to a recipient.
3. The draft is assembled in the browser from `guides/` templates plus the user's own words; nothing is sent anywhere.
4. Every path state has a URL, so a link can open mid-path.
5. Completion counted by the method chosen for open decision 6.
6. Re-test the built path with five new people who match the primary user, on a phone.

**Done when:** a first-time tester reaches a copied draft in under fifteen minutes and can say why that recipient.

### Phase 4 — Resources

Goal: a collection of relevant media and information that leads to action, maintained mostly by a scheduled job and a few editors.

1. Schemas: `source`, `media`, `explainer`, `window`; reference integrity against directory ids.
2. Seed `content/resources/sources/` with 10–15 sources across at least four perspectives; `auto_publish: false` for all to start.
3. `scripts/ingest-resources.mjs`, ported from stockspanic's parser: RSS/Atom, metadata only, dedupe by canonical-URL hash, per-feed failure isolation, one file per new item.
4. `.github/workflows/ingest.yml`: twice daily; commits to a rolling *Resource intake* branch and PR; posts the perspective-balance summary; auto-merges only when every new item is from an `auto_publish` source.
5. Pages: `/en/resources/` with filters by kind, topic, jurisdiction and language; item pages with the prompt and the path handoff; explainer pages; a windows list sorted by `closes_on`.
6. Windows expire: the build hides past-`closes_on` windows from current lists and shows them in an archive.
7. Two or three explainers written by hand, each ending in a path handoff.
8. The front door never links to Resources directly; a newcomer arriving on a resource page gets one line inviting them into the path.

**Done when:** a feed update produces an intake PR with correct files, a pending item stays unpublished until approved, an expired window leaves the current list without anyone touching it, and every explainer and window has a working action link.

### Phase 5a — Volunteer system, git path

Goal: a new steward can be productive in their first hour without a maintainer's help.

1. `CONTRIBUTING.md`: the editorial rules from the architecture, the three verification states, *no invented URLs*, conflict-of-interest declaration.
2. `docs/stewards/worked-example.md`: one complete record, annotated.
3. `scripts/charter.mjs`: for a team, lists its paths, overdue records and failing links → posted as the steward's queue.
4. `scripts/freshness.mjs`: percentage current per country, domain and language, plus the Resources perspective balance → a generated page on the site and a weekly Discussions post.
5. Inactivity job: 60 days quiet with overdue records → one issue; 30 more days → alumni team, paths revert to the co-owner.
6. `volunteers/` schema (optional file: paths, languages, conflicts); opt-in contributors page.
7. GitHub Discussions enabled with one category per role.

**Done when:** someone who has never seen the repo follows the onboarding page and merges a re-verified link within an hour.

### Phase 5b — Volunteer system, no-git path *(when the first non-git volunteer arrives)*

1. Decap CMS over the repo, with forms generated from the schemas; saving opens a PR in the volunteer's name.
2. The *suggest a resource* form feeds the editors' queue.

### Phase 6 — Second language

1. `i18n/ui/<lang>.yml` for all interface strings and vocabulary labels (tier 1).
2. `scripts/i18n-sync.mjs`: computes English hashes and marks stale strings; creates empty mirrors for new records.
3. Build: per-language trees, English fallback with a visible *not yet translated* marker, and stale strings never shown.
4. `i18n/<lang>/status.yml` gate: noindex and hidden from the switcher until tier 1 is approved.
5. Tier 2: records for that language's own jurisdictions, and their explainers and windows.
6. Weblate once a language steward prefers it to files.

**Done when:** changing one English `remit` marks exactly that string stale in the second language and the page falls back to English for it.

### Phase 7 — Launch

1. Accessibility and phone-width pass over every page type.
2. Confirm completion counting works end to end (decided before Phase 3a).
3. Recruit the first stewards only after Phases 2 and 5a are running, as the architecture says.
4. Deploy — **ask the owner before any Railway deploy.**

---

## 5. Order and parallel work

```
Q1–4 ─► Phase A (validate) ─────────────────────────┐
                                                    ▼
Phase 1 ─► Phase 1b (routing research) ───────► Phase 3b ─► Phase 7
   │                                                ▲
   └─► Phase 2 ─► Q6 ─► Phase 3a ───────────────────┘
                           └─► Phase 4 ─► Phase 5a ─► Phase 5b (on demand)
                                              └─► Phase 6 (when a language steward exists)
```

Phase A runs alongside Phases 1, 1b and 2. Phases 3a and 4 can run in parallel once Phase 2 is in place. Phase 3b is the product and waits on three things: the validation findings, the routing research, and the reference layer. Answering brief questions 1–4 is the most valuable thing the owner can do next, because it unblocks Phase A.

## 6. Risks

| Risk | Mitigation |
| --- | --- |
| Migration silently loses the three-state verification | Tests assert 774 / 145 / 251 survive; routes are objects |
| Duplicates between the institution and committee datasets | Migration report; a human confirms each merge |
| Routing research is larger than expected | Its own phase (1b) with its own estimate; records without reviewed fields are marked `needs-research` and not used for routing. There is no complete fallback: committee exclusions exist only as prose in `ai_jurisdiction` |
| The core bet fails — users skip their own words or cannot say why the recipient was chosen | Phase A tests it before the path is built; the plan is revised from the findings |
| Link check floods stewards with false alarms from government sites that block automated requests | Blocked responses count as unknown; an issue needs two consecutive failures; per-domain exclusions |
| A changed seat-holder is not caught — the membership page still loads, only its content changed | **Known gap, not addressed by this plan.** The link check cannot see it; the 90-day review is the only defence (177 names ≈ two checks a day). A membership-page change monitor was considered and not adopted at this stage |
| Branch protection locks out a single maintainer | One approval with owner bypass until there are two maintainers |
| Resources drift towards one perspective | Declared perspective on every source; balance shown on every intake PR and on the freshness page |
| Resources turn into a doom feed | No counters or urgency; a steadying prompt on every item; the door never shows the collection |
| Feeds break or change | Per-feed failure isolation; failures reported in the intake PR; sources reviewed every 180 days |
| Volunteers arrive before the checks exist | Recruit only after Phases 2 and 5a |
| Maintainer burnout | Checks, charters, inactivity handling and freshness reports replace manual chasing |

## 7. Revision log

**2026-09-22T23:37:38Z — revised after critique.** Only recommendations scored 80 or above (out of 100) for confidence were applied:

| Recommendation | Confidence | Change |
| --- | --- | --- |
| Answer brief Q1–4, then test with five users before building | 85 | New Phase A, running alongside Phases 1–2; Phase 3b now depends on its findings |
| Tune the link check for government sites | 85 | Phase 2 task 2; new risk row |
| One approval with owner bypass while there is one maintainer; exempt the ingest bot | 95 | Section 2 decision; Phase 2 task 5; new risk row |
| Decide how completion is counted now, not at launch | 80 | Open decision 6 now blocks Phase 3a; removed from Phase 7. The tool itself is still open |
| Correct the `not_topics` claim and make routing research its own phase | 95 / 80 | New Phase 1b; Phase 1 watch note and risk row corrected |

**Not applied (scored below 80):** ship an English version maintained by the owner before any volunteer tooling (75); a membership-page change monitor (70; the gap is recorded as a known risk instead); gating Resources items on an edited question (65) and model-drafted prompts (55); choosing GoatCounter or Plausible specifically (60); deferring volunteers, translation and the web editor until there is demand (70).
