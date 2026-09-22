# HANDOVER.md — aicitizenaction

**Scope of this file:** `aicitizenaction` (repo root). Single-project repo: this is the only
HANDOVER.md. Structural facts (layout, commands) live in `CLAUDE.md`; live progress lives here.
Tracked in git and committed with every step.

| HANDOVER.md path | Covers |
| --- | --- |
| `HANDOVER.md` | `aicitizenaction` (repo-wide) |

---

## Current plan

- **Plan:** `docs/implementation-plan.md` — implements `docs/ux-brief.md` (the product) and
  `docs/content-architecture.md` (content as data, translation, freshness, Resources, volunteers).
- **Goal:** a site that turns alarm about AI into one well-aimed action in one sitting, ending with
  a draft the user sends themselves — maintained by volunteers, multilingual, with a Resources
  collection modelled on the stockspanic resources desk.
- **Mode:** on 2026-09-23 (local) the owner asked for the plan to be implemented autonomously:
  "perform all logical steps… use your best judgement… if you really get stuck move on to the next
  independent topic… commit after every step". Judgement calls made under that instruction are
  listed below so the owner can reverse any of them.

## Phase status

| Phase | Status | Notes |
| --- | --- | --- |
| 0 — Architecture fixed | done | |
| A — Validate with five users | blocked | Needs owner answers to brief Q1–4 and five real participants. A testable path prototype can still be built (see phase 3b) |
| 1 — Schemas and migration | **done** | 423 records, all counts preserved, 22 tests pass |
| 1b — Routing research | not started | Next after phase 2 scaffolding; drafted values must be marked `routing_review: drafted` |
| 2 — CI checks, CODEOWNERS | **done** (local) | Workflows written, not run on GitHub (nothing pushed). GitHub settings documented in `docs/github-setup.md`, not applied |
| 3a — Reference site | not started | Open decision 6 (completion counting) was meant to be decided first — see judgement calls |
| 3b — Door, path, draft | not started | Blocked on phase A findings and 1b routing for the real thing |
| 4 — Resources | not started | |
| 5a — Volunteer system (git) | not started | |
| 5b — Web CMS | deferred | Until the first non-git volunteer |
| 6 — Second language | not started | |
| 7 — Launch | not started | Deploys need the owner's approval |

## Judgement calls made without the owner (reverse any of them)

1. **Removed the stale `.git/HEAD.lock`** (empty, 2026-09-22 19:34, no git process) so commits could proceed.
2. **ISO country codes**: the UK is `gb` (the architecture example said `uk`). Architecture doc updated.
3. **File name = full id** (`us-senate-committee-commerce-2.yml`), not a short slug; id starts with the country code.
4. **Duplicates reported, not merged** — 40 suspected pairs in `docs/migration-report.md`, as the plan requires human confirmation. The site will show both until merged.
5. **`meta.unsourced`** allowed for the 2 records where research found no URL at all, instead of inventing a source. Validator warns; routing must never recommend them.
6. **Enum checks live in `scripts/validate.mjs`**, reading `schema/vocab/`, not duplicated inside the JSON Schemas. One source of truth per list; the Decap CMS (phase 5b) will need enums generated into its config.
7. **Seat prose kept under original field names** (`ai_jurisdiction`, `business`, …) rather than renamed to `remit`, to avoid changing meaning during migration.
8. **Own link checker instead of lychee** (`scripts/check-links.mjs`): the plan's two-consecutive-failures rule, unknown-vs-broken classification and owner routing need state. TLS-chain and HTTP/2 client errors count as unknown.
9. **CODEOWNERS names `@sinscrit`**, not teams: the repo belongs to a personal account and GitHub teams need an organisation. Team lines are left commented.
10. **Intake bot auto-merge is conditional on a secret `INTAKE_TOKEN`** that is not created: personal repos cannot exempt the Actions bot from reviews. Decision for the owner (`docs/github-setup.md` §3).
11. **Nothing pushed, no GitHub settings changed** — outward-facing; left for the owner.
12. **First-version routing without phase 1b** (`scripts/lib/routing.mjs`, `content/guides/global/outcomes.yml`): outcomes match on record type + concern tags + route types; ranking prefers full committees with a named chair, then the researchers' own ordering (`meta.research_order`, new field). Phase 1b topics/powers will replace the heuristics.
13. **Open decision 4 given a reversible default**: industry-lobby organisations are excluded from the newcomer "join" outcome (`exclude_perspectives` in outcomes.yml), following the brief's lean; they remain in the reference. "Join" shows one organisation per perspective.
14. **Outcome labels and draft templates written by me**, marked `meta.status: draft` for owner review.

## Implementation log (newest first)

### 2026-09-22T23:54:23Z — Routing for the path (start of phases 3a/3b)

- `schema/guide.schema.json`; `content/guides/global/outcomes.yml` (six outcomes incl. insider stop; EU members; max 3 recipients) and `draft-templates.yml` (every template must contain `{own_words}` — validator enforces).
- `scripts/lib/routing.mjs`: `route()` (country → US state → national → EU bloc → global, with `floor` flag for the honest floor), `contactRoute()` (verified first), `recommendable()` (never unsourced / unreachable), `seatWeight()`, `diversify()`, `fillTemplate()`.
- `meta.research_order` added to every record by the migration (re-run was safe: no hand edits yet).
- Spot checks: US law → Senate Commerce, Senate Judiciary, Senate HSGAC; UK law → Commons Science & Tech, Business & Trade, Lords Communications; US harm → FTC, FDA, CISA; Sweden law → EU committees (floor).
- `tests/routing.test.mjs`. 36 tests pass.

### 2026-09-22T23:51:33Z — Phase 2: checks that let strangers contribute — done locally

- `scripts/check-links.mjs`: collects every URL in content, HEAD→GET, retries with backoff, classifies ok / moved / unknown / broken, two-consecutive-failures state, `--files` PR mode fails on broken only, exclusion list `scripts/linkcheck-exclude.yml` (empty).
- `scripts/file-link-issues.mjs` + `scripts/lib/codeowners.mjs`: one issue per confirmed failure, owners from CODEOWNERS, skips if already open.
- `.github/workflows/check.yml` (validate, test, build when Astro exists, link-check changed files), `weekly.yml` (full check with cached state, issues). Not yet run on GitHub.
- `CODEOWNERS`, issue forms (report a record, suggest a resource, volunteer), PR checklist with the editorial rules.
- `docs/github-setup.md`: push, branch protection (1 approval, owner bypass), intake-bot options, labels, Discussions — **not applied**.
- Trial run over 784 unique URLs: 11 × 404 and 1 unresolvable domain (leads, listed in `docs/link-check-trial.md`), 111 unknown (100 × 403 from parliament and government sites, 11 timeouts) — none would open an issue; 12 TLS-chain/HTTP2 client errors reclassified as unknown after the trial. 26 cross-host redirects listed for review.
- Tests: `check-links.test.mjs` (local HTTP server: 404/403/429/500/challenge/HEAD-refusal/redirect; consecutive rule; PR mode), `codeowners.test.mjs`. 27 tests pass.

### 2026-09-22T23:46Z — Phase 1: schemas and migration — done

- `package.json` (Node ≥20, ESM; deps `ajv`, `ajv-formats`, `yaml`), scripts `migrate`, `validate`, `test`, `check`.
- `schema/vocab/*.yml`: `route-types` (18), `record-types` (10, each with its folder), `public-input`, `verification`, `perspectives`, `levels`, `action-tags`, `seat-roles`. `topics` and `powers` intentionally **not** created yet — phase 1b.
- `schema/common.schema.json` (id, date, url, geo, route, source, meta, routeStrings, vocabList), `record.schema.json` (envelope), `body`, `channel`, `org`.
- `scripts/lib/`: `content.mjs` (loaders; `AICA_CONTENT`/`AICA_I18N` overrides), `geo.mjs` (free-text jurisdiction → ISO path), `slug.mjs`, `i18n.mjs` (hashes, stale/fallback resolution — used by validate now and phase 6 later).
- `scripts/migrate-input.mjs`: reads `input/data/`, writes `content/{bodies,channels,orgs}/…` and `docs/migration-report.md`. Verification taken from `sources-index.json`. Result: 423 records (bodies 250, channels 74, orgs 99); 1,177 routes = 1,170 indexed (774 / 145 / 251 preserved) + 7 "looked for, not found" (`value: null`, `verified: false`); 177 named seat-holders.
- `scripts/validate.mjs`: schema, vocab, file name = id, path matches geo, type in right folder, duplicate ids, verified-route rule, route strings match routes, dates, needs_research consistency, Resources rules (ready for phase 4), translation integrity (ready for phase 6). Current result: 0 errors, 4 warnings (2 overdue Indian bodies, 2 unsourced).
- `tests/`: `migration.test.mjs` (counts, verification, seat-holders, validity), `validate.test.mjs` (each check catches its failure), `helpers.mjs`. 22 pass.
- Docs: `CLAUDE.md` sections 1–2 filled; architecture doc aligned (gb, id file names, unsourced rule, example record matches implementation).

### 2026-09-22T20:37Z–23:37Z — architecture fixed, plan written and revised

See `docs/implementation-plan.md` section 7 for the revision log. Read-only access to the
stockspanic project (`../stockspanic`) was
authorized by the owner; nothing there was changed and its `.env` was not read.

### 2026-09-22 — research and UX brief (before this plan)

229 institutions, 144 seat-holding bodies, 50 organisations, 1,170 sources, two published prototype
Artifacts, and `docs/ux-brief.md`. Details in `input/README.md`. Deviations then: scope narrowed to
contact routing, committee seats and non-US coverage after existing field maps were found; audience
re-aimed at the alarmed non-expert rather than someone with evidence.

## What to watch

- **Three-state verification.** `true` / `false` / `null` are different. Never collapse `null` into `false`.
- **`content/` is now the source of truth.** Re-running `npm run migrate` overwrites `content/bodies|channels|orgs`. Do not re-run it once anyone has edited content by hand.
- **Duplicates** (40 pairs) need a human decision; see `docs/migration-report.md`.
- **Seat-holder decay** is a known gap: nothing detects a changed chair automatically (plan risk table).
- **Two Indian bodies are already overdue** for review (their input `verified_on` dates were June and April 2026).
- **Data decay notes from research:** UK DSIT abolished July 2026; International Network of AI Safety Institutes renamed Dec 2025; Indian and Japanese committee chairs reconstituted annually.
- **Prototype pages in `input/src/` are Artifact-format** (no doctype/head/body).
- **Product trade-off:** helping each person write their own message produces authentic participation but less concentrated force than campaign tools. Deliberate; revisit.

## Open decisions (owner)

1. Brief Q1–4 (location first?, cross-border drafts?, prominence of "join", lobbying layer for newcomers) — block phase A and 3b.
2. Brief Q5 answered by the architecture (geography stewards, 90 days) — confirm.
3. How draft completion is counted without a consent wall — meant to block phase 3a.
4. Second language; GitHub organisation/team names; domain; visitor discussion (out of scope unless chosen).
5. Tooling recommendations not yet confirmed: Astro, YAML + JSON Schema (now in use), GitHub Actions + lychee, Railway static hosting via `serve`.

## How to resume

1. `npm install && npm run check` — must show 0 errors and all tests passing.
2. Next step: **phase 3a** (Astro site, reference layer), then **phase 1b** routing research drafts, **phase 4** Resources, **phase 5a** volunteer tooling, **phase 6** i18n.
3. Never edit `input/`. Never deploy without asking the owner.

Reference prototypes (published, private):
- Concern Register — https://claude.ai/artifact/9BhNrXsW43HJ4rjH5fSuNy
- Where to Take an AI Concern — https://claude.ai/artifact/XQTFNvgEsNuNxfvbqXcnsL

---

Last modified: 2026-09-22T23:54:23Z
