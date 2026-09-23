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
| 1b — Routing research | **drafted; human review not started** | 222 of 250 bodies have drafted topics/not_topics/powers with verbatim evidence (`routing_review: drafted`). Routing ignores them until a person marks a record `reviewed`. Reviewer guide + notes: `docs/routing-drafts-report.md` |
| 2 — CI checks, CODEOWNERS | **done** (local) | Workflows written, not run on GitHub (nothing pushed). GitHub settings documented in `docs/github-setup.md`, not applied |
| 3a — Reference site | **done** | Directory, record pages, about, data API, version endpoint. Measurement hook built in, sends nothing (decision 6 still open) |
| 3b — Door, path, draft | **built as a testable first version** | Door, 4-step path with URL state, draft with own words, insider stop, honest floor. Usable for phase A testing; revise after phase A and 1b |
| 4 — Resources | **done** | 15 sources, 99 ingested items (8 published as drafts, 91 pending), 2 windows, 2 explainers, pages, intake workflow (not run on GitHub) |
| 5a — Volunteer system (git) | **done** (local) | CONTRIBUTING, worked example, charters, freshness report + public page, inactivity check-ins, volunteer profiles, contributors page. Discussions not enabled (owner) |
| 5b — Web CMS | deferred | Until the first non-git volunteer |
| 6 — Second language | **done (pilot)** | French: 173 UI strings + 45 guide strings, all machine drafts; gated (noindex, not in switcher) until a steward sets `ui_approved: true`. Tier 2 (French/EU records) not started |
| 7 — Launch | **in progress** | Accessibility pass done (0 axe violations, light + dark, `docs/accessibility.md`). Deploy needs the owner |

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
15. **Open decision 6 handled as a hook, not a choice**: `site/lib/measure.js` fires `aica:measure` events (path_step, recipient_chosen, draft_copied, draft_downloaded, path_done) and sends nothing. The owner picks the counting method; it attaches to the event.
16. **Phases 3a and 3b built together**: the path is needed for phase A testing, and the door is the only acceptable home page (the brief forbids landing newcomers on the reference).
17. **"How it works", insider stop and interface copy written by me** (drafts, flagged on the page with a notice).
19. **Eight media items published by me as an editor draft** (`meta.reviewed_by: "draft: …"`), spread across six perspectives, each with a neutral prompt and an action — so the collection can be seen and tested. An editor should review, re-prompt or reject them. The other 91 ingested items are `pending` (hidden).
20. **Two windows and two explainers written by me from verified research records** (Colorado AG ADMT/chatbot rules, closes 2026-10-26; FDA-2026-N-7874, closes 2026-10-19). Explainers are `status: draft`.
21. **Recorded absences are not addresses**: ~25 routes hold "none published" etc. in `value` (with `verified: true` meaning a verified absence). Research data left unchanged; `isUsableValue()` in routing keeps them out of the path.
22. **Resources link hidden on the door** (the plan: the front door never links to Resources); visible in the nav everywhere else.
23. **The maintainer (catch-all CODEOWNERS owner) is never sent inactivity check-ins.** Team/alumni membership changes stay manual — the script only opens issues.
24. **Freshness report posts to Discussions only if the owner sets repo variable `DISCUSSION_CATEGORY_ID`**; otherwise it goes to the workflow summary.
25. **Open decision 8 given a reversible default: French as the pilot language**, fully gated. All French text is my machine draft (`machine: true`); nothing is public or indexed until a French steward approves.
26. **Routing drafts made by five language-model agents** from each record's own text only, then machine-checked (every value backed by an exact quote; 0 dropped). Marked `drafted`; nothing uses them until reviewed. Topic vocabulary gained `online-safety`, `environment`, `finance` from gaps the agents reported.
18. **Report links point at GitHub issue forms**, which only work for the public once the repo is public — the repo is private today.

## Implementation log (newest first)

### 2026-09-23T00:19:54Z — Phase 1b: routing drafts applied

- Applied `/tmp/claude-503/drafts-*.json` with `scripts/apply-routing-drafts.mjs`: 222 of 250 bodies; 415 topics, 31 excluded topics, 407 powers; 0 values dropped by the quote check. 28 bodies got nothing (portals, methods, bodies not yet constituted, policy-only ministries) — they keep `meta.needs_research`.
- `docs/routing-drafts-report.md`: how to review, plus every agent's reviewer note per record (e.g. powers_text overstating compel/investigate for several bodies; future-tense powers; merged three-agency California record).
- Agents' recurring observation worth a human decision: the research field `powers_text` often claims stronger powers than the rest of the record supports.

### 2026-09-23T00:18:56Z — Path improvement + phase A kit

- "An AI company fixes something I saw" now asks **which company's product it was** (`ask: company` in outcomes.yml) instead of showing the same three companies to everyone; the chosen company's channel comes first, two independent channels (incident database, watchdog) alongside. URL state `?company=`. Browser-checked. Site test added.
- `docs/phase-a-test-kit.md`: moderator script, measures, decision thresholds, findings template for the five-person test.

### 2026-09-23T00:17:45Z — Phase 1b groundwork + phase 7 accessibility

- `schema/vocab/powers.yml` (16 powers, draft). `scripts/apply-routing-drafts.mjs`: vocab check + every value needs an exact quote from the record, else dropped; never overwrites `reviewed`; writes `docs/routing-drafts-report.md`.
- Routing: `reviewed()`, `topicFit()`; `route()` accepts `where.topic` — a reviewed "not here" removes a record, a reviewed topic ranks it first; drafted values have no effect. Tests added.
- Accessibility: axe-core dev dependency; 9 pages scanned light and dark; freshness table fixes (hidden header text, focusable scroll region, `.sr-only`). `docs/accessibility.md`.
- In flight: five background agents drafting routing fields from each record's own text, brief at /tmp/claude-503/routing-brief.md (outputs /tmp/claude-503/drafts-{seat-0,seat-1,seat-2,body-0,body-1}.json). If interrupted: re-run them from the brief, or skip — nothing depends on them yet.

### 2026-09-23T00:14:54Z — Phase 6: second language (French pilot)

- `scripts/i18n-sync.mjs`: status gate file, UI sync, content mirrors (`--scaffold`), `--stamp` for new translations; never overwrites a translated value. `syncStrings()` exported and tested.
- `i18n/ui/fr.yml` (173 strings), `i18n/fr/content/guides/global/*.yml` (door answers, templates, insider stop, how it works), `i18n/fr/status.yml` (`ui_approved: false`).
- Site: `guideText()` resolves guide strings per language; door, path (incl. draft templates) and about use it; unapproved languages show a machine-translation notice and `noindex`; fallback prose carries `lang="en"`.
- Validator: untranslated placeholders allowed; nested UI strings checked for URLs.
- Tests: `i18n.test.mjs` (stale → English, machine label, sync behaviour, validator rules), site test for the language gate. 60 pass. Browser check of `/fr/`: fully French door with both notices.

### 2026-09-23T00:11:19Z — Phase 5a: volunteer system (git path)

- `CONTRIBUTING.md` (ways in without an account, editorial rejection rules, first change, roles, cycles, tools); `docs/stewards/worked-example.md`.
- `scripts/lib/freshness.mjs` + `scripts/freshness.mjs`: current/overdue/unsourced per section and country, seat-holders past 90 days, open windows, translation coverage, Resources perspective balance. Today: 99% current (2 overdue, 2 unsourced), 2 of 177 seat-holders past 90 days.
- `scripts/charter.mjs`: a steward's queue from CODEOWNERS or a path, with one small first task.
- `scripts/inactivity.mjs`: 60 days quiet + overdue → polite issue; 30 days no reply → maintainer handover issue. Pure `decide()` tested.
- `schema/volunteer.schema.json`, `volunteers/README.md`; validator checks profiles (paths exist, conflicts are real ids).
- Site: `/en/freshness/` (public), `/en/contributors/` (opt-in, empty), footer links.
- Weekly workflow: + freshness report (summary, optional Discussions post) + check-ins.
- `tests/volunteers.test.mjs`. 55 pass.

### 2026-09-23T00:08:13Z — Phase 4: Resources

- `schema/vocab/topics.yml` (draft, 23 topics — to be finalised in 1b); schemas `source`, `media`, `explainer`, `window`.
- `content/resources/sources/`: 15 sources, every feed fetched and confirmed as RSS/Atom on 2026-09-23, homepages checked: journalism 3, civil liberties 4, safety advocacy 2, industry 2, industry lobby 1, government 1, academic 2. All `auto_publish: false`.
- `scripts/ingest-resources.mjs`: RSS/Atom parser (adapted from stockspanic), metadata only, URL-hash dedupe (ignores query strings), per-item language guess, per-feed failure isolation, balance summary. First run: 99 items, 0 failures.
- `.github/workflows/ingest.yml`: twice daily, rolling `resource-intake` branch + PR, auto-merge only with `INTAKE_TOKEN` and all items auto-publish.
- Pages: `/en/resources/` (open windows, explainers, media with topic/type/language filters; closed windows hidden client-side too), item pages with prompt + path handoff, windows archive.
- Validator: media must live in `media/<yyyy>/<mm>/` by `published_at`. Routing: `isUsableValue()`.
- Tests: `resources.test.mjs` (parser, ingest end-to-end against a local feed server incl. failing feed and dedupe, validation rules), site tests (only published items built, door has no Resources link, every item leads into the path). 51 pass.

### 2026-09-23T00:00:46Z — Phases 3a + 3b: the site

- Astro 7 static site (`astro.config.mjs`, `site/`), `serve` + `nixpacks.toml` for Railway (not deployed).
- Pages: door (`/en/`), path (`/en/start/<outcome>/`, steps with `?where=&sub=&to=&step=`), directory with search/filters (`/en/directory/`), 423 record pages (`/en/<section>/<id>/`), how it works (`/en/about/`), Resources placeholder, `/api/{bodies,channels,orgs}.json`, `/version.json`.
- Routing precomputed per place at build time (`site/lib/data.mjs#outcomePayload`); the browser only switches views. Draft assembled in the browser from templates + the user's own words; copy / download; nothing leaves the device.
- `i18n/ui/en.yml` holds all interface strings (ready for phase 6). `scripts/lib/content.mjs` root discovery made bundle-safe.
- Browser check (Chrome for Testing via /browser-init, 390 px): door, US law step 2 (Senate Commerce first, chair + dates + membership link), UK draft step, record page; no console errors, no horizontal overflow. Fixed during the check: a false footer claim ("every address was opened by a person" — untrue for 396 routes), research tags ("VERIFIED —") leaking into cards, bracketed research asides in the salutation.
- `tests/site.test.mjs` builds the site and checks brief principles (door ≤6 choices, no institution names or numbers, "don't need to be an expert", no third-party requests, insider routes nowhere, every record has a page, API counts). 43 tests pass.

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
- **Nothing has run on GitHub.** The repo is empty on the remote; `check.yml`, `weekly.yml` and `ingest.yml` are untested there. Expect first-run fixes (permissions, cache keys).
- **Report and volunteer links point at a private repo** — they only work for the public once the repo is public.
- **Site rebuilds are needed for time-based content** (windows closing, overdue badges). Client-side scripts hide closed windows meanwhile; a scheduled rebuild/deploy would keep it exact.
- **Routing heuristics** (`seatWeight`, `research_order`) stand in until drafted topics/powers are reviewed; once some are, add a "what is it about?" question to step 1 (routing already supports `where.topic`).
- **`powers_text` in the research often overstates** compel/investigate powers (agents' finding). Don't display it as fact without review; the record page shows it under "Its powers" today.
- **Local-only artefacts:** `tmp/` (link-check state, screenshots) is gitignored. The first weekly run starts the two-consecutive-failures state afresh.

## Open decisions (owner)

1. **Brief Q1–4** — current defaults: location asked on step 1; cross-border drafts allowed; "join" is one of six equal answers; industry lobbying reference-only. Confirm or change `content/guides/global/outcomes.yml`, then run phase A.
2. **Brief Q5** — answered by the architecture (geography stewards, 90-day cycle). Confirm.
3. **Completion counting** — the hook exists (`site/lib/measure.js`, sends nothing). Choose a method (e.g. a cookieless counter) or none.
4. **Second language** — French is a gated pilot; confirm or pick another.
5. **GitHub** — push; move to an organisation (enables teams + intake-bot bypass) or add `INTAKE_TOKEN`; branch protection; Discussions (`docs/github-setup.md`).
6. **Public repo?** Needed for report/volunteer links to work for readers.
7. **Deploy** — Railway via `nixpacks.toml` + `serve` is ready; not deployed. Domain undecided.
8. **Tooling in use, not formally confirmed:** Astro, YAML + JSON Schema, GitHub Actions, own link checker (replaced lychee), axe-core for accessibility checks.
9. **Visitor discussion on Resources** — out of scope unless chosen.

## How to resume

1. `npm install && npm run check` — must show 0 errors and all tests passing.
2. Remaining work needs people: review routing drafts (`docs/routing-drafts-report.md`), confirm the 40 suspected duplicates (`docs/migration-report.md`), editor review of the 8 draft-published and 91 pending Resources items, run phase A (`docs/phase-a-test-kit.md`), French steward review, and the owner decisions below. Engineering follow-ups are listed under \"What to watch\".
3. Never edit `input/`. Never deploy without asking the owner.

Reference prototypes (published, private):
- Concern Register — https://claude.ai/artifact/9BhNrXsW43HJ4rjH5fSuNy
- Where to Take an AI Concern — https://claude.ai/artifact/XQTFNvgEsNuNxfvbqXcnsL

---

Last modified: 2026-09-23T00:20:17Z
