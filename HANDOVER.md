# HANDOVER.md — aicitizenaction

**Scope of this file:** `aicitizenaction` (repo root). Single-project repo: this is the only
HANDOVER.md. Structural facts (layout, commands) live in `CLAUDE.md`; live progress lives here.
Tracked in git and committed with every step.

| HANDOVER.md path | Covers |
| --- | --- |
| `HANDOVER.md` | `aicitizenaction` (repo-wide) |

---

## Current plan

- **Active design-system plan:** `docs/design-system-implementation-plan.md` — started
  2026-09-25 under the owner's autonomous implementation instruction. It makes contact-action
  state authoritative and consistent, separates action from evidence, introduces narrowly scoped
  components and deterministic visual/accessibility safeguards, then consolidates only where
  evidence supports it. No deployment is authorized by this implementation request.
- **Plan:** `docs/implementation-plan.md` — implements `docs/ux-brief.md` (the product) and
  `docs/content-architecture.md` (content as data, translation, freshness, Resources, volunteers).
- **Corrective plan:** `docs/places-to-contact-audit-plan.md` — deterministic review and correction
  of all 74 channel records and 234 routes before they may be presented or recommended as a
  “Place to contact.” All six phases are complete and deployed to production.
- **Maintenance plan:** `docs/directory-integrity-maintenance-plan.md` — recurring audit,
  canonical-identity and duplicate-resolution system. Autonomous implementation started
  2026-09-24. Baseline: 26 exact normalized-name groups / 52 records, including duplicate Access Now.
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
| Design system 0 — Plan and baseline | **done** | Plan tracked; 118/118 tests and 838-page build pass after daily contact inventory refresh |
| Design system 1 — Presentation state | **done** | Pure assessment drives eligibility; six states/reasons and EN/FR copy tested |
| Design system 2 — Contact contract | **done** | Normalized mechanism/action/audience/subjects/evidence contract plus validation |
| Design system 3 — Domain components | **done** | Presentation-only Button, StatusBadge, Notice and ContactRoute with semantic markers |
| Design system 4 — Critical journey | **done** | Directory, records and guided path share state/contract and action/evidence separation |
| Design system 5 — CSS organization | pending | Proportional split: tokens/global/components |
| Design system 6 — Reference page | pending | Unlisted/noindex, fictional fixtures |
| Design system 7 — Enforcement | pending | Narrow checker plus component/integration tests |
| Design system 8 — Visual/accessibility regression | pending | Stable screenshots, axe and overflow coverage |
| Design system 9 — Comprehension validation | pending | Repeatable protocol; real participant results cannot be fabricated |
| Design system 10 — Evidence-led consolidation | pending | Review remaining duplication only after critical journey is stable |
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
| Contact audit 1 — Contract and containment | **done** | Verified inbound routes only; explicit contradictions fail closed; Argentina attachment and three article regressions covered |
| Contact audit 2 — Schema and inventory | **done** | Route contact schema, validator checks, generated 74-record/234-route reconciliation inventory |
| Contact audit 3 — Full channel audit | **done** | 74 records / 234 routes reviewed; 84 eligible, 150 ineligible; no pending decisions |
| Contact audit 4 — Correct/reclassify | **done** | 8 misleading informational records disabled as recipients and preserved as Resources; reference-only companies retained internally |
| Contact audit 5 — UI/routing convergence | **done** | Public label, directory, API, record pages and send-to cards share audited eligibility and show restrictions/evidence |
| Contact audit 6 — Final verification | **done and deployed** | 85 tests, 920-page build, 25 browser/axe checks, audit freshness and reconciliation pass; production deployment `673a9d41-5eaa-434c-902a-1f5773023513` is running |
| Directory integrity 1 — Identity model and inventories | **done** | Identity/roles/redirect/provenance schema, separate deterministic candidates and human decisions, PSL-aware matching, validation and tests |
| Directory integrity 2 — Backlog resolution | **done** | 78 current pairs reviewed; 41 duplicates merged; provenance, roles, parent links and 82 multilingual redirects preserved |
| Directory integrity 3 — Recurring audit | **done** | Fast/full read-only commands, stable reports, reviewed baseline, coverage/backlog/link metrics |
| Directory integrity 4 — Fail-closed freshness | **done** | Shared 180-day route/90-day seat rules plus per-build runtime validity gate |
| Directory integrity 5 — Workflow and public reporting | **done** | CI/weekly/monthly automation, stable issues, 400-day artifacts, SLA escalation, public integrity metrics |
| Directory integrity 6 — Final verification | **done and deployed** | 118 tests, 838-page build, 914-link stateful audit, 35 browser/axe checks; production deployment `d84b4913-076b-4965-bb81-deb951eaf306` |

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

### 2026-09-25T11:56:37Z — Critical contact journey migrated

- Record pages now render every route through `ContactRoute`; directory rows use the same status
  badge; guided-path recipient and final send-to cards serialize and render the same authoritative
  contract. Existing measurement events and routing decisions are unchanged.
- Primary actions use explicit mechanism labels such as “Open the submission page” or “Email the
  recipient.” Evidence lives in a separately labelled region. Reference-only records such as the
  reported Transformer/arXiv examples expose no primary contact action.
- The first build exposed 254 still-supported legacy routes without structured contact fields.
  Their display contracts now derive audience, accepted subjects and evidence only from existing
  `public_input`, controlled tags, route/record prose, verification date and cited sources. A new
  invariant test proves every routed recipient has a complete contract; this does not relax or
  duplicate eligibility.
- Added all derived terms in current English and machine French and updated older test fixtures to
  the now-required `keep` disposition. Focused routing/site/i18n/validity/sample tests pass 54/54,
  validation has 0 errors/four known warnings, and the 838-page build succeeds.
- Phase 4 is complete. Phase 5 is active: give the new components deliberate responsive styles and
  move reusable component rules out of the foundation stylesheet without changing the identity.

### 2026-09-25T11:54:40Z — Contact-domain component contracts implemented

- Added presentation-only `Button`, `StatusBadge`, `Notice` and `ContactRoute` Astro components.
  Each has a deliberately small controlled variant/state API and stable semantic `data-*` markers
  for deterministic enforcement.
- `ContactRoute` renders the normalized contract: recipient, audience, accepted subjects,
  restrictions and mechanism; it puts the primary action in a dedicated region and evidence in a
  separate labelled aside. Non-actionable states render an explanation and no action href.
- Status badges carry a visible non-colour symbol, text and optional evidence date. Buttons preserve
  anchor/button semantics and external-link safety. The existing stylesheet classes are reused for
  now; dedicated component rules arrive in phase 5.
- The focused site suite passes 19/19 and asserts the controlled APIs/semantic markers. Phase 3 is
  complete. Phase 4 is active: render these components in record, directory and guided-path
  surfaces and replace raw-state reconstruction.

### 2026-09-25T11:52:30Z — Contact information contract formalized

- Added `contactRouteContract()` as the non-localized data contract for every contact
  presentation: route identity, authoritative state, mechanism kind/value/safe action href,
  controlled action family, audience, accepted subjects, restrictions and evidence.
- Added deterministic web/email/phone/details detection. Non-actionable routes never receive an
  action href or label family; mixed postal/phone details remain visible text instead of receiving
  a misleading link.
- Tightened validation and eligibility so reviewed open/limited routes must carry the explicit
  `keep` disposition. Added complete English and machine-French contact-contract terminology,
  including mechanism-specific actions, the two audited audience values and all 17 accepted
  subject values present in actionable routes.
- Focused routing/validation/i18n tests pass 46/46; content validation remains at 0 errors/four
  known warnings. Phase 2 is complete. Phase 3 is active: implement the four presentation-only
  Astro components against this contract.

### 2026-09-25T11:49:10Z — Authoritative contact presentation state implemented

- Added `contactRouteAssessment()` beside the routing predicate. It returns one of six stable UI
  states plus a factual reason, actionability and the evidence horizon. `eligibleContactRoute()`
  now delegates to that assessment, so policy and presentation cannot drift.
- Explicitly covers missing/unusable mechanisms, closed and not-yet-open windows, record- and
  route-level reference-only facts, unverified/incomplete evidence, expired evidence and current
  verified contacts. Legacy contradictions remain fail-closed through the same assessment.
- Added current English and machine-French labels/help for every state. Focused routing/i18n tests
  pass 26/26; validation passes with the same four known warnings.
- Phase 1 is complete. Phase 2 is active: formalize the rendered contact information contract and
  mechanism-specific actions without duplicating the assessment logic.

### 2026-09-25T11:46:35Z — Design-system baseline established

- The first untouched baseline run exposed the generated contact inventory's intentional daily
  freshness gate: it still named 2026-09-24, so the fast directory audit blocked publication.
  Regenerated it for 2026-09-25; the only content change is `generated_on`, with the same 70
  records and 232 routes.
- Baseline now passes: content validation has 0 errors/four known warnings, all 118 tests pass and
  the production build emits 838 pages, 82 redirects and a valid directory snapshot.
- Design-system phase 0 is complete. Phase 1 is active: add and exhaustively test the pure route
  presentation-state mapper without changing eligibility policy.

### 2026-09-25T11:45:15Z — Design-system implementation initialized

- Added the revised, acceptance-driven plan at `docs/design-system-implementation-plan.md` and
  made it the active repo-level implementation track.
- Confirmed a clean worktree on `main`, 25 commits ahead of `origin/main`; those existing commits
  are owner/project work and will be preserved. No deployment or remote mutation is authorized.
- Mandatory skill discovery found no project-specific skill for this Astro refactor. Browser work
  will use the documented `/browser-init` skill before Playwright and will not use native computer
  control.
- Next: capture the current automated baseline and implement a pure authoritative presentation
  state beside `eligibleContactRoute()`.

### 2026-09-24T15:11:40Z — Directory integrity release deployed and verified

- After explicit owner approval, deployed the verified local tree to Railway production using
  deployment `d84b4913-076b-4965-bb81-deb951eaf306`. Railway completed the Node 22 build and
  generated 838 pages, 82 redirects and the runtime validity manifest.
- Production serves version 0.1.67 / build 68. Direct checks pass: exactly one Access Now directory
  row; reported Transformer article absent from the directory and explicitly reference-only on its
  record; channels API 48 public / 22 excluded; public integrity metrics present; retired Access
  Now id returns a direct query-preserving HTTP 308.
- The directory-integrity maintenance plan is now implemented, verified and live. Continue with
  the scheduled audits and human maintenance queue described below.

### 2026-09-24T14:17:57Z — Directory integrity maintenance plan fully implemented

- Final verification passes: content validation 0 errors/four known warnings; 118/118 tests;
  838-page production build; stateful full audit PASS across 914 URLs (13 first observations,
  zero confirmed failures, 149 unknown/blocked and 27 moved).
- Expanded the repeatable Chrome-for-Testing QA to cover canonical Access Now uniqueness, dynamic
  API totals, current contact evidence, false-positive reference classification, expired named
  seats, Argentina attachment exclusion and public integrity denominators. Final result: 35/35
  browser checks, including light/dark axe checks on six affected pages.
- The expanded QA initially found mobile overflow in the new integrity fact grid. Added a <=600px
  single-column facts layout with safe wrapping; the full browser set then passed. Updated stale
  migration-era totals/ids in `docs/test-scenarios.md` and recorded evidence in
  `docs/test-results.md`.
- All six directory-integrity phases are complete. No deployment was attempted because project
  policy requires separate owner approval. The next operational action is the scheduled audit;
  the next release action is an owner-approved Railway deployment.

### 2026-09-24T14:12:45Z — Directory workflow ownership and SLA enforcement complete

- Stable issue reconciliation now enforces executable 7/14/30-day horizons, labels overdue work
  `sla-breach`, adds it to the Actions summary, and maintains one aggregate escalation issue until
  all breaches clear.
- Specialist owners receive at most 20 current findings; overflow is explicitly routed to the
  wildcard maintainer backlog and disclosed in the issue. The maintainer itself is intentionally
  uncapped so findings are never dropped.
- Focused tests pass 3/3, issue dry-run produces six stable unique maintenance issues, and weekly
  workflow YAML parses. Phase 5 is complete; Phase 6 full verification is now active.

### 2026-09-24T14:11:40Z — Coverage gate and monthly evidence sampling are executable

- Expanded the reviewed baseline from section totals to the actual 18-place and 14-topic current
  contact coverage sets. The audit blocks a >5% decline in either coverage count and explicitly
  blocks an empty recommendation set, so exclusion alone cannot manufacture a passing result.
- Added deterministic prior-month sampling of 10% of contact reviews (minimum five where
  available), with JSON/Markdown queues and an explicit six-factor manual evidence checklist. The
  monthly workflow schedule adds the queue to its summary/artifact; September's current population
  would sample 9/82 routes.
- Documented PR/weekly/monthly operations, 7/14/30-day service levels and the reviewed-baseline
  change rule in `CONTRIBUTING.md`. Focused audit/sample tests pass 6/6, workflow YAML parses and
  the current fast audit passes with six unique maintenance findings.
- Phase 5 remains active only for SLA/owner-overflow escalation mechanics, then final verification.

### 2026-09-24T14:10:05Z — Audits are CI gates with stable issue reconciliation

- Pull requests and main pushes now run the fast directory audit before the normal suite, append
  its Markdown to the run summary, retain JSON/Markdown artifacts for 400 days, and fail only after
  preserving the report when a publication blocker exists.
- The weekly workflow now runs the full audit with persistent link state, retains the full report,
  link state/results and freshness report for 400 days, and preserves the existing two-run link
  confirmation rule. It still performs steward check-ins and optional Discussions reporting.
- Added `file-directory-issues.mjs`: actionable findings carry encoded stable-key markers, update
  or reopen the same issue, receive CODEOWNERS/SLA context, and automatically close when resolved.
  Duplicate validator/structured overdue findings were collapsed; the current queue is six unique
  maintenance facts rather than eight overlapping alerts.
- Workflow YAML parses, the fast audit passes, and focused audit/issue tests pass 5/5. Next:
  automate the monthly human evidence sample and document the operating/service-level procedure.

### 2026-09-24T14:08:23Z — Public freshness page exposes directory integrity denominators

- Added shared `directoryIntegrity()` metrics to the public/weekly freshness report: 382 canonical
  entities, 360 public rows, 41 redirects, identity dispositions/unresolved candidates, 82/232
  current audited contact routes (35.3%), 150 exclusions with reason counts, median/oldest evidence
  age, entity/place/topic coverage, review backlog and CODEOWNERS coverage.
- The page explicitly defines “current contact” and displays coverage beside exclusions; it does
  not collapse the measures into a quality score or imply that URL reachability proves acceptance.
  English and current machine-French copy are complete.
- Focused site/i18n/freshness tests pass 26/26, denominator invariants are regression-tested, and
  the 838-page build succeeds. Next: CI/weekly workflow integration and stable-key issue updates.

### 2026-09-24T14:05:56Z — Production freshness now fails closed

- Builds now emit `dist/directory-validity.json` from the same route/seat predicates used by
  routing. It records global contact/recommendation horizons and exact per-language record-page
  horizons; the current build has 612 dated record paths, contact validity through 2027-03-21 and
  recommendation validity through 2026-09-28.
- `server.mjs` refuses expired recommendation pages, directory/API snapshots and affected record
  pages with a non-cacheable 503. Missing/malformed manifests also fail closed on protected
  surfaces; undated reference-only records remain available. Permanent redirects still run first.
- Added a clock fixture and boundary/regression tests for manifest calculation, expiry, missing
  manifests, JSON errors and reference availability. Focused tests pass 31/31 and the 838-page
  build emits both redirect and validity manifests.
- Phase 4 is complete. Phase 5 is active: wire fast/full audits into CI/weekly workflows, retain
  reports, update stable-key issues, and publish integrity metrics on the freshness page.

### 2026-09-24T14:04:13Z — Shared freshness rules now fail closed

- `eligibleContactRoute()` now requires dated route evidence and expires structured and legacy
  contact evidence after 180 days. Missing dates, closed/future windows and expired evidence are
  excluded consistently from routing, Places to contact, the verified directory filter and the
  generated API.
- Added `isCurrentSeat()`: named office-holders expire after 90 days. Stale names no longer affect
  ranking, salutations or guided-path cards; reference pages retain them with an explicit expired
  badge. Expired contact routes likewise remain visible only with a reference-only warning.
- Added current English/French UI copy and boundary tests for both horizons. Focused tests pass
  42/42, validation has 0 errors/four known warnings, and the 838-page production build succeeds.
- Phase 4 remains in progress: next add a build-time validity manifest plus a production-server
  guard so an old static deployment cannot keep serving expired recommendation snapshots.

### 2026-09-24T15:58:20Z — Directory integrity Phase 3 complete

- Executed the slow `directory-audit:full`: PASS with 107/107 tests, 838 generated pages and 914
  URLs checked. Link result: 13 first-observed failures, 0 confirmed consecutive failures, 146
  unknown/blocked responses, 27 cross-host moves and 0 exclusions.
- Full reports now promote confirmed consecutive link failures to publication blockers, first-run
  failures to stable-key human-review items, and cross-host moves to information; aggregate link
  metrics are included in JSON and Markdown instead of being buried in subprocess output.
- Phase 3 is complete. Phase 4 is active: move the existing 180-day audit rule into the shared
  eligibility predicate/public surfaces and add explicit stale-route UI/API evidence.

### 2026-09-24T13:57:31Z — Read-only recurring directory audit implemented

- Added `npm run directory-audit`, producing machine-readable JSON and a concise Markdown queue in
  `tmp/directory-audit/` without changing content. Stable finding keys are grouped into publication
  blockers, human review, maintenance and information.
- The audit orchestrates schema/reference validation, candidate freshness, decision-ledger
  reconciliation, contact-audit freshness, 180-day contact evidence, closed windows, 90-day seats,
  record/decision expiry, redirect integrity, translations, Resource balance and dynamic coverage.
- Added a reviewed post-merge baseline and a >5%/10-record (whichever is smaller) deletion gate.
  Current fast audit passes: 382 entities; 302 with a current route (79.1%); 80 without; 78/78
  identity candidates resolved; 232/232 channel routes reviewed; 41 retired ids redirected. Eight
  pre-existing maintenance items remain visible (two unsourced, two overdue records/two seats,
  with validation/report overlap), but none blocks publication.
- Added `directory-audit:full` for tests, build and full link checking. Focused audit tests pass 3/3,
  including future contact evidence failing closed. Next: execute the slow full audit, then wire both
  modes into CI/weekly retention and stable issue handling.

### 2026-09-24T13:55:35Z — Directory integrity Phase 2 complete

- Added 14 conservative `parent_id` links only where evidence supports an actual parent/subunit
  relationship: government AI institutes and their host bodies plus congressional subcommittees
  and their parent committees. Shared portals and looser programmes remain related without an
  invented hierarchy.
- Parent-child decisions now name `parent_id`/`child_id`, and the ledger validator requires the
  child record to carry that exact reviewed parent. Focused identity/validator tests pass 23/23;
  ledger has 78/78 current candidates resolved and content validation has 0 errors.
- Phase 2 is complete: identity model, complete review ledger, canonical merges, lossless
  provenance, exact references, parent links and permanent multilingual redirects are all in
  place. Phase 3 is active: implement the read-only fast/full recurring audit and metrics.

### 2026-09-24T13:54:42Z — Retired paths have permanent multilingual redirects

- Added build-generated `dist/redirects.json` from canonical `meta.redirect_from` facts. The build
  rejects active retired ids, duplicate sources, self redirects and chains, and generates direct
  mappings for every built language.
- `server.mjs` now returns HTTP 308 before static handling, accepts paths with or without the
  trailing slash, and preserves the query string. Current manifest: 41 retired ids × English and
  French = 82 direct redirects; Access Now is covered in both languages.
- Focused redirect/server tests pass 9/9 and the 838-page production build writes and verifies the
  manifest. Phase 2 still needs explicit `parent_id` values for the evidence-backed parent/subunit
  decisions before it is complete.

### 2026-09-24T13:52:55Z — Duplicate backlog merged with lossless provenance

- Applied 41 confirmed merges and retired 41 duplicate files, leaving 382 canonical directory
  entities. Every survivor now has an opaque `entity_key` and plural `roles`; all exact content
  references were rewritten. Access Now now appears exactly once.
- Reversed one initially approved merge after the routing regression exposed that the federal and
  California Senate Judiciary committees are distinct jurisdictions. The ledger now records them
  `distinct`, and a regression test prevents cross-sub-jurisdiction numeric siblings from ever
  reaching high confidence. The final ledger resolves all 78 current candidates with 0 pending.
- Preserved all 423 imported legacy-record observations and all 1,170 indexed source observations.
  Identical canonical routes retain multiple `source_ids` instead of displaying duplicate routes.
  Source facts, aliases, retired ids, roles and field-level provenance remain on each canonical.
- Routing now matches every canonical role rather than only the compatibility `type`, fixing the
  Senate Commerce ranking after its government/seat profiles were combined. Contact-audit and site
  tests now use dynamic discovered counts; current channel inventory is 70 records / 232 routes.
- Verification: 100/100 tests pass; 838-page production build passes; content validation has 0
  errors/four existing warnings; candidate, decision and contact inventories are current. Phase 2
  still needs permanent multilingual HTTP redirects for the 41 retired public paths.

### 2026-09-24T13:48:10Z — Merge applied; post-apply repair in progress (do not commit yet)

- Applied the reviewed 42-pair merge set: duplicate files are retired, 381 canonical directory
  records remain, and all survivors received opaque entity keys and roles. Candidate regeneration
  currently reports 77 candidates (2 high, 5 medium, 70 low).
- Post-apply validation correctly caught an applicator bug: the general id-reference rewrite also
  rewrote ids inside `meta.redirect_from`, producing self-redirects. It also exposed merged
  `needs_research` flags for newly filled fields and two organisation action routes that need an
  explicit reference-only contact review after moving into channel records.
- Current dirty tree is intentionally **not committed** and validation has 55 errors. Repair the
  applicator first; restore each retired id/section from the pre-merge candidate inventory in git,
  normalize research flags and channel route reviews, regenerate candidates/decisions, and require
  zero validation/ledger errors before committing the merge.

### 2026-09-24T13:47:31Z — Approved merge applicator added and dry-run

- Added `npm run directory-identity-apply`: dry-run by default, explicit `-- --apply` required.
  It accepts only reviewed `same` rows with distinct reviewer/approver identities, refuses missing
  active records or cited sources, resolves route-id collisions, unions facts/routes/sources/roles,
  preserves aliases and legacy ids, records field-level provenance, rewrites exact content
  references, retains historical decisions, creates retired-path metadata, and assigns opaque
  entity keys to every surviving directory entity.
- Dry run is non-mutating and reports exactly 42 approved retirements, leaving 381 canonical
  entities. The full mapping was inspected in `tmp/identity-merge-dry-run.txt`.
- Focused merge and ledger tests pass 6/6, including collision-safe routes, provenance and
  self-approval rejection. Next: apply the reviewed merge set, regenerate candidates, then repair
  any post-merge validation or decision-ledger inconsistencies before committing content.

### 2026-09-24T13:46:08Z — Directory schemas support multi-role canonical entities

- Aligned body, channel and organisation fact schemas on the complementary fields needed by the
  approved cross-section merges. A canonical body may retain reviewed contact metadata; a channel
  may retain perspective/volunteer facts; an organisation may retain powers, seats, routing and
  contact facts. The record still lives in one section and keeps one compatibility `type`.
- This is a schema prerequisite only; no records were merged. All schemas parse, full content
  validation has 0 errors/four existing warnings, and focused validator tests pass 18/18.
- Next: add and dry-run the merge applicator.

### 2026-09-24T13:45:13Z — Complete identity candidate ledger reviewed

- Classified all 126 deterministic candidates from their cited record evidence: 42 `same`, 47
  `distinct`, 37 `related`, and zero `pending`. Evidence URLs are stored per pair; the stricter
  180-day government review horizon (2027-03-23) is used for the whole backlog.
- Shared parliamentary portals, government hosts and submission endpoints were not treated as
  identity proof. The two same-name U.S. subcommittee pairs in different chambers are explicitly
  `distinct`; clear parent/subunit and service/recipient relationships are `related`.
- `same` rows name a canonical id and transparently record the owner's explicit autonomous
  best-judgement instruction as the approval basis; this is not represented as pair-by-pair owner
  source review. The cited source checks in the records are dated 2026-09-22.
- Decision validator: 126/126 resolved, 0 errors, with the expected 42 warnings that approved
  duplicate pairs remain published until the next merge step. Full content validation remains at
  0 errors and four existing warnings.
- Next: implement the deterministic merge applicator, including field-level provenance, reference
  rewrites and retired-path redirects; dry-run it before changing content.

### 2026-09-24T13:42:51Z — Identity decisions now have an executable contract

- Added `npm run directory-identity-review`, a read-only validator joining the generated candidate
  inventory to the hand-maintained decision ledger. It enforces exact pair membership, current
  evidence/review dates, valid dispositions, independent approval for `same`, relationship notes,
  completed historical redirects, and resolution of every high-confidence candidate.
- Added three focused tests covering a valid approved merge, absent/pending/expired decisions,
  self-approval, and the post-merge historical-ledger state; 3/3 pass.
- Expected backlog state: the command currently exits 1 with 126 candidates / 0 decisions and 22
  high-confidence unresolved errors. This is an honest Phase 2 gate, not a test regression.
- Next: populate all 126 decisions from the records' cited evidence; then the merge applicator can
  consume only reviewed `same` decisions.

### 2026-09-24T13:41:39Z — CAISI duplicate is now deterministically discoverable

- Extended identity matching with `centre`/`center` normalization and a conservative shared-acronym
  signal that only admits a pair when country and official registrable domain also match.
- This adds the previously missed duplicate U.S. CAISI disambiguation record to the low-priority
  queue without treating acronym equality as proof of identity. Inventory: 423 records / 126
  candidates (22 high, 21 medium, 83 low).
- Focused candidate tests: 4/4 pass; regenerated inventory passes the byte-for-byte freshness check.
- Next: validate and populate reviewed candidate decisions, then apply only approved `same` merges.

### 2026-09-24T13:41:03Z — Identity validator change recovered and verified

- Recovered the Phase 1 validator edit that had been left uncommitted: directory `entity_key`
  uniqueness, roles vocabulary, parent existence, retired-path ownership, active-record conflicts,
  independent approval and identity review dates are now enforced by the normal validation command.
- Focused validator tests: 18/18 pass. Full content validation: 0 errors and four existing warnings
  (two overdue reviews and two explicitly unsourced records).
- Phase 2 remains active. Next: improve deterministic spelling normalization, regenerate the
  candidate inventory, and then record evidence-backed decisions before applying any merge.

### 2026-09-24T13:38:26Z — Non-Latin identity matching corrected

- Candidate review exposed that ASCII-only name normalization reduced several unrelated Hindi,
  Japanese and Korean local names to the same fragments. `directory-dedupe.mjs` now preserves all
  Unicode letter/number categories after NFKD normalization.
- Deterministic inventory is now 423 records / 125 candidates: 22 high, 21 medium, 82 low. The 10
  false medium candidates disappeared; all 22 high candidates remain.
- Focused candidate tests: 3/3 pass. Candidate output was regenerated and remains deterministic.

### 2026-09-24T13:37:08Z — Directory integrity Phase 1 complete

- Added identity schema for stable entity keys, plural roles, parent ids, aliases, retired-path
  redirects, identity reviews, multiple legacy ids and field-level merge provenance. Validator now
  rejects duplicate entity keys, missing parents, active/duplicate redirects and self-approval.
- Added PSL-aware `scripts/directory-dedupe.mjs` / `npm run directory-dedupe`. Its generated
  `docs/directory-identity-candidates.yml` is structurally separate from the hand-maintained
  `docs/directory-identity-decisions.yml`; regeneration cannot overwrite decisions.
- Current deterministic inventory after the Unicode correction: 423 records, 125 candidates — 22
  high, 21 medium, 82 low.
  Exact/local names plus corroborating domain/suffix evidence are high; a shared endpoint alone is
  low because distinct public bodies often share one portal or inbox.
- Added `tldts@7.4.15` for Public Suffix List domain handling and focused schema/determinism tests.
  Validation: 0 errors (four pre-existing warnings). Focused tests: 21/21 pass; candidate freshness
  check and whitespace check pass.
- Phase 2 is active: review all candidates, record current evidence, merge confirmed duplicates,
  and preserve redirects/provenance. Destructive merges still require an independent approver.

### 2026-09-24T13:33:36Z — Directory integrity implementation started

- The owner explicitly requested autonomous implementation of
  `docs/directory-integrity-maintenance-plan.md`, with a commit and current handover after every
  meaningful step. The plan is now active rather than proposed.
- Execution order: identity schema/inventories; evidence-based duplicate decisions and merges;
  recurring audit; production freshness; workflows/public reporting; final verification.
- No project-specific skill applies. Work uses the repository's documented Node/YAML/Astro tools.
- Current phase: Directory integrity 1. Production deployment remains separately gated by the
  owner's standing approval requirement.

### 2026-09-24T13:06:05Z — Directory maintenance plan strengthened after critique

- Revised `docs/directory-integrity-maintenance-plan.md` with every recommendation rated at least
  80/100: separate generated candidates and human decisions, multi-role canonical entities,
  dynamic reconciliation counts, field-level merge provenance, independent merge approval,
  production-time expiry enforcement, coverage/backlog metrics, operational ownership and service
  levels, identity-decision expiry, and permanent multilingual redirects.
- Added regression tests and completion criteria for each control. The plan now prevents correctness
  percentages from being improved merely by excluding every uncertain destination and explicitly
  respects the owner's separate approval requirement for production deployments.
- Revised estimated likelihood of sustained directory accuracy and credibility: 87/100 if the
  controls are implemented and staffed. Implementation has not started.

### 2026-09-24T13:02:53Z — Directory integrity maintenance plan written

- Added `docs/directory-integrity-maintenance-plan.md`, covering one canonical record per
  real-world entity, a deterministic duplicate decision inventory, safe merge/redirect procedure,
  a read-only recurring `directory-audit` command, fail-closed 180-day contact evidence, scheduled
  automation, human re-verification, credibility metrics and acceptance tests.
- Confirmed the reported Access Now duplication comes from two records imported from different
  datasets. The current 423-record directory contains 26 exact normalized-name groups / 52 records;
  these are candidates rather than automatic merges because some generic same-name subunits may be
  distinct.
- The plan requires Access Now to become one canonical listing, with the retired URL redirected and
  all useful facts and provenance preserved. It explicitly prohibits automatic semantic merges.
- No production content or application behaviour changed in this planning step.

### 2026-09-24T08:56:37Z — Deployed v0.1.42 (owner approved)

- `railway redeploy --from-source` of `c6388a0`: SUCCESS. Live checks: named steps, action titles, external links marked "(opens in a new tab)", logo 200.

### 2026-09-24T08:50:26Z — Clearer steps; action titles on the door (owner)

- Steps were unclear (unlabelled discs; the door said three, the path counted four). The door now names them: "1 Answer one question — 2 See who can act — 3 Write your message", then "About fifteen minutes · you leave with a message ready to send". The path uses the same three steps ("Step 2 of 3 · See who can act"); the finished screen shows all three complete and "Done". `StepMeta` gained a `labelled` variant (stacks vertically under 600px).
- Door titles rewritten as actions answering "What do you want to happen with AI?" (owner asked for the vein of "Request a company fix something I saw"): Ask for an AI law or rule · Report harm an AI system caused · Ask a company to fix something I saw · Put my view on the public record · Join others who want the same thing · Get advice before sharing inside knowledge. French updated to match. Proposed to the owner as suggestions; easy to change in `content/guides/global/outcomes.yml`.
- 86 tests pass. Not yet redeployed.

### 2026-09-24T08:44:54Z — Outside links open in a new tab (owner)

- Every link to another website opens in a new tab with `rel="noopener noreferrer"`: set in the templates (record, media, window, explainer pages, and the path's contact/evidence/membership links) so it works without JavaScript, plus a site-wide script in `Base.astro` that marks any external link (including those the path builds later) and adds a screen-reader note "(opens in a new tab)" / "(s'ouvre dans un nouvel onglet)". Same-site and `mailto:` links are unchanged.
- Browser-checked: path step 2 (2/2 external links), a record page (17/17). Site test added. 86 tests pass. Not yet redeployed.
- Also this session: pushed seven commits from a parallel session (contact audit: "Publish only audited contact destinations" etc.) that were live (v0.1.39, deployed by local upload) but not on GitHub.

### 2026-09-24T08:26:02Z — Contact corrections deployed and verified

- With the owner's explicit approval, deployed the audited contact-routing corrections to Railway
  production as deployment `673a9d41-5eaa-434c-902a-1f5773023513` (`SUCCESS`, instance `RUNNING`).
- The Railway domain serves version `0.1.39`, build 40. Runtime startup is healthy (`node
  server.mjs`, listening on port 8080); the only logged stderr is npm's non-fatal production-config
  deprecation warning.
- Live API verification: 52 included contact records, 22 excluded, and every included record has
  `facts.contact_disposition: keep`.
- Live page verification: “Places to contact” replaces “Places to report”; the directory retains
  401 total entries but excludes the three reported AI articles; the old article URL is preserved
  as a reference-only page with an explicit “not a current contact destination” warning; and the
  Argentina recommendation page no longer contains the dead bill-attachment URL.
- The custom apex `aicitizenaction.org` is independently misconfigured: DNS resolves to
  `13.248.213.45` / `76.223.67.189` and serves a JavaScript redirect to `/lander`, even though
  Railway still lists the domain as attached. The release itself is healthy on the Railway domain;
  fix the apex DNS before treating the canonical URL as live.

### 2026-09-24T00:44:22Z — Contact audit Phase 6 complete locally

- Added a repeatable raw-CDP browser runner, `scripts/qa-contact-audit.mjs`, using the project’s
  Chrome for Testing instance. At 390×844 it checks the directory, a valid contact, a reclassified
  article, the exact Argentina URL, French labels, API contract, mobile overflow, screenshots, and
  axe in light/dark mode.
- Focused browser result: 25/25 pass; zero axe violations on four affected pages in both colour
  schemes; no mobile horizontal overflow. Evidence is in gitignored `tmp/qa-contact/`.
- Defensive sweep covers every outcome in every available jurisdiction. Every routed recipient has
  a technically verified route; article/arXiv/bill-attachment targets fail; instruction PDFs are
  allowed only when the record explicitly explains submission. A MeitY consultation listing whose
  record says no window is currently open was removed from routing.
- Changed the draft section label from “Send it to” to “How to send it” (and French equivalent), so
  a valid official-instructions page is not misrepresented as the form itself.
- Final reconciliation remains 74 records / 234 routes, 84 eligible / 150 ineligible, 52 keep / 3
  fix / 19 reclassify, zero pending. Public API: 52 included / 22 excluded.
- Final checks: validation 0 errors (four pre-existing warnings), 85/85 tests, 920-page production
  build, audit freshness, translation integrity (232/232 French UI strings), and whitespace pass.
- `docs/test-results.md`, `docs/accessibility.md`, and the corrective plan contain the final result.
- **Not deployed.** The owner’s standing rule requires explicit approval for production deployment.

### 2026-09-24T00:41:14Z — Contact audit Phase 5: public surfaces use the audit

- Renamed the public category to “Places to contact” / “Lieux à contacter” and rewrote the lede and
  verified-only control to state the actual contract.
- Added `placeToContact()` as the one public eligibility predicate. Directory and
  `/api/channels.json` now publish only the 52 audited records with a qualifying route; the API
  reports `excluded_count: 22`. All 74 source records remain available internally and by direct
  record URL for provenance.
- Record pages distinguish open/limited contact routes from reference-only, unknown and closed
  routes; they show audience, restrictions, evidence and check date. Reclassified pages carry an
  explicit “not a current contact destination” notice.
- Action cards and “Send it to” now expose structured contact status, audience, restrictions and
  evidence when available. Routing already uses the same eligible route gate; the Argentina bill
  attachment regression proves it is absent even for a manually supplied `where=ar` URL.
- Updated English and French UI with current translation hashes; 232/232 French UI strings current.
- API/directory/article/Argentina regression scenarios added. `npm run check`, production build
  (920 pages), audit freshness and whitespace checks pass.
- Phase 6 next: run final browser and accessibility QA, write the updated results/reconciliation,
  and stop before deployment unless the owner separately approves it.

### 2026-09-24T00:37:39Z — Contact audit Phase 4: misleading destinations reclassified

- Marked the eight known article/paper/guidance/tracker/outbound-policy/unenacted-bill records
  `recommend: false`; their original audited records remain internally for provenance and the
  74/234 reconciliation, but cannot be offered as recipients.
- Preserved their useful content as eight Resource explainers that point to actual actions and,
  where applicable, real contact records: UK inquiry discovery, AIID criteria, actionable flaw
  reports, third-party disclosure, indirect trackers, inbound versus outbound disclosure, outsider
  access, and the status of the proposed US whistleblower bill.
- The other 11 reclassified records are company/watchdog reference profiles with no qualifying
  inbound route. They remain internal company/reference data rather than being falsely relabeled
  as organisations; Phase 5 excludes every non-qualifying record from Places to Contact.
- `npm run validate`: 0 errors; full suite 80/80 passes. Added a regression test that the eight
  Resources exist and their former channel records are disabled as recipients.
- Phase 5 next: change public labels and descriptions, show contact evidence/restrictions, filter
  the directory/API to the shared predicate, and ensure every “Send it to” route uses it.

### 2026-09-24T00:36:02Z — Contact audit Phase 3: all channel routes reviewed

- Added `scripts/apply-contact-review.mjs` (`npm run contact-review`) and applied the six-rule,
  fail-closed review to every route in all 74 channel records using the cited source facts and
  checks already stored in the content.
- Every route now has status, directness, disposition, reviewer and review date. Eligible routes
  also have audience, accepted subjects, evidence URL/note, and check date; limited routes state
  their restrictions. Schema validation requires these facts and rejects incomplete reviewed
  contact claims.
- Reconciled result: 84 eligible routes, 150 ineligible; records: 52 keep, 3 fix (unverified
  candidate routes), 19 reclassify; route dispositions: 84 keep, 16 fix, 134 reference-only; zero
  pending rows. The audit report records all 234 unique route decisions.
- Conservative judgement: technical failure or missing evidence stays `unknown`/fix; homepage,
  framework, program, article, outbound-policy, indirect-tracker and explicit no-channel routes are
  reference-only, never upgraded by inference.
- `npm run validate`: 0 errors. Audit inventory freshness check passes; 33 focused tests pass.
- Phase 4 next: move useful reclassified material to Resources or merge it into a valid contact,
  retain necessary company reference records without exposing them as Places to Contact, and repair
  all references.

### 2026-09-24T00:34:24Z — Contact audit Phase 2: schema and complete inventory

- Added route-level structured contact facts to `schema/common.schema.json`: status, directness,
  eligible users, accepted subjects, restrictions, evidence, dates, and review state.
- Validator enforces evidence/audience/subject requirements for reviewed open or limited routes,
  restrictions for limited routes, verification, and date consistency.
- Added `scripts/contact-audit.mjs` / `npm run contact-audit` and generated the tracked
  `docs/places-to-contact-audit.yml`: exactly 74 records and 234 unique routes, initially all
  pending. The baseline gate finds 87 legacy-eligible and 147 ineligible routes; neither count is
  treated as a completed semantic review.
- Added reconciliation and validation tests. `npm run validate`: 0 errors; 33 focused tests pass.
- Phase 3 next: apply the six-rule review to every audit row, write reviewed contact metadata into
  content, and eliminate all pending dispositions.

### 2026-09-24T00:33:15Z — Contact audit Phase 1: contract and containment

- Added `eligibleContactRoute()` as the shared conservative gate in `scripts/lib/routing.mjs`.
  A recommendation now requires an allowed inbound mechanism, a usable value, `verified: true`,
  public or limited input, and no explicit contradiction such as “N/A,” “accepts nothing,” “not
  enacted,” “no channel,” or a closed window.
- `contactRoute()` now fails closed instead of falling back to unchecked or failed routes. This
  fixes the reported Argentina path, which treated an unverified bill attachment as the address
  for a completed message.
- Added regression tests for that attachment, the three reported article/paper false positives,
  `public_input: none`, contradictions, unchecked routes, and expired structured routes.
- `node --test tests/routing.test.mjs`: 16/16 pass.
- Phase 2 next: add the structured contact schema, complete audit inventory, and reconciliation.

### 2026-09-24T00:28:43Z — Language dropdown, header fit, door wording

- **Logo still broken on the live site**: confirmed the live deployment is v0.1.30, from before the `.gitignore` fix (live `/brand/…png` → 404, local → 200). Fixed by the next redeploy.
- **Language selection is a dropdown at the top right** (`<details class="aca-lang">` in `Base.astro`): current language marked ✓, every public language listed, links to the same page; works without JavaScript; closes on outside click / Escape. Footer language links removed. On phones it sits on the logo row (menu row scrolls sideways beneath); under 400px it shows "EN"/"FR" (full name still announced).
- Header fit: gaps 24px; single row ≥1100px in both languages, two rows below; logo 30px tall on small phones. Measured at 320–1440px: no clipping or overlap; logo + language share a row from 360px.
- Door wording (owner): title "What do you want to happen with AI?"; lede "You don't need to be an expert. Your view counts because you live with the results." French updated to match.
- 74 tests pass; axe light + dark with the menu open: 0 violations. Not yet redeployed.

### 2026-09-24T00:26:34Z — Places to Contact audit plan written

- Added `docs/places-to-contact-audit-plan.md` after the owner reported that topical articles were
  appearing under “Places to report.”
- The plan incorporates every reviewed recommendation scored at least 80/100: six deterministic
  eligibility rules; a route-by-route 74-record/234-route audit; structured acceptance evidence,
  eligibility, scope and availability; one shared directory/routing predicate; fixed dispositions;
  schema enforcement; regression tests; risk-based second review; and full reconciliation.
- Public naming recommendation is “Places to contact”; internal `channels` paths may remain to avoid
  needless URL/API churn. No content, schema, routing, UI, or production changes have been made yet.
- Next step: implement Phase 1 of the corrective plan (contract and containment), starting with
  regression tests for the known article false positives. Do not deploy without owner approval.

### 2026-09-24T00:16:42Z — Feedback, Get Involved, constant menu, French in header, logo fix, no GitHub links

- Owner asked for: a feedback place; a place to request to become a contributor; a top menu that doesn't change between pages; French visible as a locale option; the logo to appear (broken on the live site); no links to GitHub.
- **Logo fix**: `.gitignore` excluded every `*.png`, so `site/public/brand/*.png` was never committed or deployed. Added `!site/public/brand/*.png`.
- **Menu**: the same five items on every page — Take Action · Resources · Directory · How It Works · Get Involved — plus the language switch and "Your Privacy". The door no longer hides Resources (owner decision overrides the plan's "door never links to Resources"). Test asserts the header is identical across pages in each language.
- **French**: a "Français" / "English" link in the header on every page (to the same page in the other language); footer switch kept.
- **Feedback** (`/<lang>/feedback/`) and **Get Involved** (`/<lang>/get-involved/`, roles + request form) — no account; plain HTML forms posting to `server.mjs` (`/api/feedback`, `/api/contribute`), 303 to `/<lang>/thanks/`. Stored in `feedback.jsonl` beside the counts (Railway: `/data`), no IP/cookies; honeypot field; global rate cap; field length limits; whitelisted topics/roles. The pages say plainly that this text, unlike the draft, is sent. Record pages' "Something wrong here?" now opens the feedback form prefilled (topic + page). Footer: "Give feedback". Read with `npm run feedback` / `railway ssh`.
- **No GitHub links**: removed from footer ("Source and data"), about, contributors, feedback, get-involved; `REPO`/`reportUrl` removed. Remaining github.com URLs on the site are listed institutions' own contact routes in the research data (e.g. AI Incident Database's report form) — kept as data.
- "What we count" (How it works) now names the forms as the one exception to "nothing you type is sent".
- Browser-checked (desktop + phone, form submitted end to end); axe light + dark on the new pages: 0 violations. 74 tests pass. Not yet redeployed.

### 2026-09-24T00:10:15Z — Redeployed (owner approved); custom domains attached

- Redeployed from source: **v0.1.30 live** (design system, French published, draft notice and footer sentence removed). Verified on https://web-production-ce384.up.railway.app.
- Custom domains added to the Railway service `web`: `aicitizenaction.org` and `www.aicitizenaction.org`. **Waiting on DNS at GoDaddy** (nameservers ns29/ns30.domaincontrol.com; currently parked):

| Type | Host | Value |
| --- | --- | --- |
| CNAME | @ (apex) | dvrqrdz2.up.railway.app |
| TXT | _railway-verify | railway-verify=d2f36160d8865a2a888fe27a7dd6f6c95a10dc59131706956ef5897d69e83385 |
| CNAME | www | f75ikr18.up.railway.app |
| TXT | _railway-verify.www | railway-verify=85b706501be853bb7c53c3086e69b0342d62bb3460d9a5299f7c1d7039702f6b |

- GoDaddy cannot put a CNAME on the apex. Either move DNS to a provider with CNAME flattening (e.g. Cloudflare, free) and keep `https://aicitizenaction.org` canonical (as the site is built now), or use GoDaddy forwarding from the apex to `https://www.aicitizenaction.org` — then change Astro `site` to the www address so canonical links match.
- Check status: `railway domain status aicitizenaction.org`.

### 2026-09-23T23:32:05Z — Design system applied; domain AICitizenAction.org

- Owner supplied `input/aicitizenaction-design-system.zip` and confirmed the domain **AICitizenAction.org**.
- Tokens copied to `site/styles/tokens.css` (light + the kit's dark theme, also applied for `prefers-color-scheme: dark`). `site/styles/global.css` rewritten on the tokens and the kit's component styles; old palette removed.
- Components as Astro: `Icon` (the kit's eight glyphs), `IconDisc`, `ActionCard`, `StepMeta`, `ReassuranceNote`; header follows `SiteHeader` (lockup, nav, "Your Privacy" → How it works #privacy). Door rebuilt: display question, lead, StepMeta, 2-column ActionCard grid (icon/tone per outcome in outcomes.yml; coral cards never touch), ReassuranceNote. Path progress uses step discs with a spoken "Step N of 4" label.
- Adaptations, with reasons: Figtree **self-hosted** via `@fontsource/figtree` instead of the kit's Google Fonts import (no third-party requests); the logo PNG has the light surface baked in, so dark mode shows a text wordmark instead; on narrow screens the nav is one sideways-scrolling row; the harm card uses `shield-search` so two cards don't share the `people` glyph; the "Unverified" badge uses coral-ink on the warm surface (coral-ink on coral-soft failed contrast).
- Site name is now "AICitizenAction.org"; Astro `site` = https://aicitizenaction.org, with canonical and hreflang links on public pages. Nav labels in title case per the kit ("Take Action", "How It Works"); French equivalents added.
- Checks: browser screenshots (phone, desktop, dark), axe light + dark on 7 pages: 0 violations after the badge fix. 71 tests pass (new design-system site test). Not yet redeployed. The custom domain is not yet attached on Railway (needs DNS at the registrar).

### 2026-09-23T22:41:12Z — French published (owner approved)

- `i18n/fr/status.yml`: `ui_approved: true`, reviewer "owner (published as machine translation)", approved 2026-09-24. Effect: French pages are indexed, every page's footer offers "English · Français" for the same page, and the machine-translation notice no longer shows.
- Content caveat stays true: the French interface and guides are machine drafts; most record prose (committee descriptions, notes, route labels) falls back to English with a "not yet translated" notice.
- Site test rewritten to follow the gate file (approved → indexed and linked; unapproved → noindex and hidden). 70 pass. Not yet redeployed.

### 2026-09-23T22:39:35Z — Footer sentence removed (owner)

- Owner asked to remove "Every address says whether a person has opened it and when." Footer now reads "No account, no mailing list, no tracking." (en + fr). The verification labels themselves (Verified / Unverified / Unchecked) are unchanged and still explained on each badge and on How it works. Not yet redeployed.

### 2026-09-23T22:38:58Z — Draft notice removed (owner)

- Owner asked to remove "This page's wording is a first draft and has not been reviewed yet." Removed from `site/layouts/Base.astro` and the UI strings (en; fr dropped by i18n-sync). Pages still carry `meta.status: draft` / `reviewed_by: draft…` in content, so drafts remain identifiable in the data; only the on-page notice is gone. The machine-translation notice on unapproved languages is unchanged. Not yet redeployed.

### 2026-09-23T16:00:58Z — Deployed to Railway (owner approved)

- **Live: https://web-production-ce384.up.railway.app** (v0.1.25). Railway workspace `iconducteur` (where 50 of the owner's 51 projects live), project `aicitizenaction`, service `web`, GitHub source `foodzio/aicitizenaction@main`, volume at `/data`, `COUNTS_FILE=/data/counts.json`, Railway-generated domain.
- First build failed: Railway used Node 20, Astro 7 needs 22.12+ → `package.json` engines `>=22.12`. Redeployed with `railway redeploy --from-source`: SUCCESS.
- Smoke-tested live: door 200, path/directory/resources/API/fr 200, 404 page, `/api/count` 204 / 400 for bad input, no cookies; browser: US law step 2 shows Senate Commerce, no third-party requests, no console errors. **One test "door" count was added to the live totals by this smoke test.**
- **Pushes do not auto-deploy yet**: the Railway GitHub app needs access to the `foodzio` organisation (GitHub → foodzio → Settings → GitHub Apps → Railway → repository access). Until then: `railway redeploy --from-source -y` (owner rule: ask before deploying).
- Time-based content (closing windows, overdue badges) only updates on rebuild; once auto-deploy works, merges rebuild it. A scheduled rebuild would keep it exact between merges.

### 2026-09-23T15:53:13Z — Moved to the foodzio organisation

- Owner chose `foodzio`. Repository transferred: **github.com/foodzio/aicitizenaction** (public). Local remote and all references updated (site report links, UA strings, .projstuff, docs).
- Team `foodzio/aicitizenaction-maintainers` created (admin on the repo; member: sinscrit). CODEOWNERS now names the team; commented steward lines use `@foodzio/aicitizenaction-<area>` teams.
- Branch protection on `main` applied as planned: 1 approval, code-owner review, required status `check`, admins may bypass (`enforce_admins: false`).
- Next: Railway deploy (owner approved).

### 2026-09-23T15:50:43Z — Workflows running on GitHub

- **Check**: green on GitHub (validate, 70 tests, build). Actions moved to checkout@v5 / setup-node@v5 (Node 20 deprecation warning).
- **Weekly**: green (full link check with fresh state; freshness report; check-ins). First confirmed failures can appear from the second weekly run.
- **Resource intake**: needed the repository setting "Allow GitHub Actions to create and approve pull requests" — enabled via API (required by the plan's intake process; GitHub offers create and approve only as one switch). PR step restructured to open a PR whenever `resource-intake` is ahead of `main`. **PR #1 "Resource intake" is open** with the new items (all `pending`).
- Known GitHub behaviour: PRs opened by the Actions token do not trigger other workflows, so `Check` does not run automatically on intake PRs. Options once in an organisation: a GitHub App token for the intake job, or run `Check` manually on the PR.
- Mistake made and fixed: a `git branch -f` after committing briefly dropped the counting commit from the branch; recovered from the reflog (15d5bd7) before anything was pushed.

### 2026-09-23T15:44:22Z — Published; anonymous counting built

- Owner: move to an organisation, make public, use Railway, no discussion, tooling confirmed; "if the rules don't require it, don't ask".
- History rewritten before the first push (token + local paths removed; local backup branch `backup/pre-publication`, not pushed). `main` = the work; pushed `main` and `research-and-ux-brief`; **repo is public** at github.com/foodzio/aicitizenaction, default branch `main`. Labels created, Discussions enabled.
- **Organisation transfer pending**: needs the owner to pick `foodzio`, `SGCLE`, or create a new organisation in the GitHub web UI (API cannot create one).
- Completion counting (owner: no cookies needed — correct): `server.mjs` + `site/lib/measure.js`. Page sends only `{e, o}` (event, outcome) via sendBeacon with `credentials: omit`; server keeps daily totals only, stores no IP/UA/text, sets no cookie; `/api/counts` publishes totals, completion and own-words rates. "What we count" section on How it works (en + fr). `npm run start` now runs `server.mjs` (serve-handler for `dist/`, clean URLs, no directory listing). Browser-verified; `tests/server.test.mjs`. 70 tests pass.
- Branch protection not applied yet — waits for the organisation transfer (settings move with the repo, but team rules need the org).

### 2026-09-23T02:01:40Z — QA run 2, final fixes, site built

- Run 2 (13 affected scenarios): 9 PASS, 4 PASS-WITH-NOTE, 0 FAIL. Results appended to `docs/test-results.md`.
- Follow-ups: `templates.international` (EN + FR) used when the path falls back to international bodies; salutations trimmed at " / "; windows page title; the generic-method record's name made readable (content edit of our own record title); scenario B1 text updated.
- Final build: 898 pages in `dist/` (en + gated fr + 404). 65 tests pass, validation 0 errors. Not deployed.
- Known, accepted: French pages show English record prose until translated; the first international body offered (UN Global Dialogue) says in its own text that its 2026 window closed — routing can't read prose; will improve once routing drafts are reviewed.

### 2026-09-23T01:58:15Z — QA run 1 and fixes

- Run 1 (QA subagent, 37 scenarios): 30 PASS, 6 PASS-WITH-NOTE, 1 FAIL. Full table in `docs/test-results.md`.
- Fixed: share link on step 4 now points at the path (step 2 for the same place/company); in-page Back uses history; "Somewhere else" offers international bodies via `floor_match` in outcomes.yml (law, record, harm) and links to the any-parliament method; new `facts.recommend: false` (set on the generic-method record) keeps guidance records out of recipient lists; placeholder chairs ("Not applicable") no longer used in salutations or ranking (`isNamedPerson`); Colorado window breadcrumb; French salutation ("À l'attention de : … / Madame, Monsieur,"); site 404 page; long small-print lines capped.
- Regression tests added (routing + site). 65 pass.

### 2026-09-23T01:19:58Z — End-to-end scenarios (owner: "no need for review at the moment")

- Owner instruction: skip human reviews for now; write test scenarios, have a subagent run them, then build the site.
- `docs/test-scenarios.md`: 41 browser scenarios in 7 groups (door, path/law, other outcomes, directory/records, Resources, language, hygiene).
- Site built; QA subagent ran the scenarios (see the QA run entries above).

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
stockspanic project (`../stockspanic` (a sibling project on the owner's machine, not in this repository)) was
authorized by the owner; nothing there was changed and its `.env` was not read.

### 2026-09-22 — research and UX brief (before this plan)

229 institutions, 144 seat-holding bodies, 50 organisations, 1,170 sources, two published prototype
Artifacts, and `docs/ux-brief.md`. Details in `input/README.md`. Deviations then: scope narrowed to
contact routing, committee seats and non-US coverage after existing field maps were found; audience
re-aimed at the alarmed non-expert rather than someone with evidence.

## What to watch

- **Custom apex DNS is not reaching Railway.** As of 2026-09-24, `aicitizenaction.org` resolves to
  `13.248.213.45` / `76.223.67.189` and serves a `/lander` redirect, while Railway lists it as an
  attached custom domain. The Railway service domain is healthy; correct the registrar DNS before
  relying on the canonical URL.
- **Three-state verification.** `true` / `false` / `null` are different. Never collapse `null` into `false`.
- **`content/` is now the source of truth.** Re-running `npm run migrate` overwrites `content/bodies|channels|orgs`. Do not re-run it once anyone has edited content by hand.
- **Identity backlog is resolved, not erased.** All 78 current candidates have reviewed decisions;
  41 duplicates were merged. Re-run `npm run directory-dedupe` and the decision validator after
  identity-affecting changes; never treat a similarity signal as an automatic merge.
- **Seat-holder decay fails closed at 90 days**, but automation cannot discover a changed chair
  before that horizon. The monthly/weekly queues still require a human to reopen official sources.
- **Current maintenance queue:** two unsourced records plus two overdue Indian records and their
  two expired named seats. They are excluded/labelled safely but still need human source review.
- **Data decay notes from research:** UK DSIT abolished July 2026; International Network of AI Safety Institutes renamed Dec 2025; Indian and Japanese committee chairs reconstituted annually.
- **Prototype pages in `input/src/` are Artifact-format** (no doctype/head/body).
- **Product trade-off:** helping each person write their own message produces authentic participation but less concentrated force than campaign tools. Deliberate; revisit.
- **New workflow paths are locally verified but not observed in Actions yet.** In particular,
  confirm that this repository accepts 400-day artifact retention and that issue/cache permissions
  behave as expected on the first fast/full directory-audit runs.
- **Directory recommendations fail closed without a rebuild** via `directory-validity.json` and the
  production server. Other static time-based content (notably window lists) still benefits from a
  scheduled rebuild; automatic deployment remains unauthorized.
- **Routing heuristics** (`seatWeight`, `research_order`) stand in until drafted topics/powers are reviewed; once some are, add a "what is it about?" question to step 1 (routing already supports `where.topic`).
- **`powers_text` in the research often overstates** compel/investigate powers (agents' finding). Don't display it as fact without review; the record page shows it under "Its powers" today.
- **Local-only artefacts:** `tmp/` (link-check state, screenshots) is gitignored. The final local
  link state is in `tmp/final-linkcheck-state/`; Actions maintains its own cached state. There are
  13 first-observed failures and zero confirmed failures as of the final run.

## Owner decisions

**Decided 2026-09-23 (owner):**
- **GitHub organisation:** `foodzio` — done.
- **Public repository:** yes — done.
- **Hosting:** Railway — deployed. Deploying still needs an explicit go-ahead each time (owner's standing rule).
- **Visitor discussion on Resources:** no.
- **Tooling:** confirmed — Astro, YAML + JSON Schema, GitHub Actions, own link checker, axe-core.

**Recommended, not yet decided:** brief Q1–4 as built (location second; cross-border only as fallback; "join" one of six, after direct actions; lobbying reference-only); Q5 geography stewards / 90 days; branch protection 1 approval + owner bypass. Anonymous aggregate completion counting is implemented. French is publicly approved but remains machine-labelled until a human language steward reviews it.

**Pre-publication scan (2026-09-23T15:37:42Z):** no API keys, passwords or private keys in the
then-current files. A Feishu form redirect `auth_token` and absolute local paths were removed from
tracked files, but earlier commits may retain them; reassess history exposure rather than assuming
the remote is empty. Commits also carry the author's configured email. `.projstuff` and
`.claude/settings.local.json` intentionally retain local tooling metadata and permissions.

## How to resume

1. `npm install && npm run check` — must show 0 errors and all tests passing.
2. Run `npm run directory-audit`; triage its six current maintenance facts. On the next scheduled
   full run, let the cached state decide whether the 13 first link failures are consecutive. Run
   the prior-month evidence sample on the monthly schedule.
3. Remaining non-automatable work needs people: review routing drafts
   (`docs/routing-drafts-report.md`), editor review of draft/pending Resources, phase A participants
   (`docs/phase-a-test-kit.md`), and a French language steward.
4. Never edit `input/`. Never deploy a later change without asking the owner. The directory
   integrity release itself is live as deployment `d84b4913-076b-4965-bb81-deb951eaf306`.

Reference prototypes (published, private):
- Concern Register — https://claude.ai/artifact/9BhNrXsW43HJ4rjH5fSuNy
- Where to Take an AI Concern — https://claude.ai/artifact/XQTFNvgEsNuNxfvbqXcnsL

---

Last modified: 2026-09-24T15:11:40Z
