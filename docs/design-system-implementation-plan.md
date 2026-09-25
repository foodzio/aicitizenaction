# Design-system implementation plan

**Started:** 2026-09-25  
**Scope:** the directory, record pages and guided path; then reusable presentation safeguards.  
**Goal:** make an actionable contact route unmistakable, keep evidence and background links
visually separate, and prevent the interface from disagreeing with the routing/freshness rules.

## Principles

1. Existing routing and freshness facts remain authoritative. UI code renders a derived state; it
   never invents eligibility rules.
2. Missing, contradictory or stale evidence fails closed.
3. The first release improves contact-related surfaces only. Unrelated forms are not abstracted
   until real repetition demonstrates a stable contract.
4. Status is communicated with text and structure, never colour alone.
5. Evidence links never receive primary contact-action treatment.
6. Refactoring must preserve the current visual identity, URLs, measurement events and language
   behavior unless an acceptance criterion explicitly requires a change.

## Phase 1 — Authoritative presentation state and language

- Inventory the facts already used by `eligibleContactRoute()`.
- Add one pure presentation-state mapper beside that predicate.
- Cover `verified`, `unverified`, `expired`, `closed`, `unusable` and `reference_only`, including
  date boundaries and contradictory records.
- Add controlled English and French labels and explanations.

**Acceptance:** every route maps deterministically; actionable presentation and
`eligibleContactRoute()` cannot disagree; incomplete evidence is never actionable.

## Phase 2 — Contact information contract

For every actionable route require and expose the recipient, accepted subjects, eligible users,
mechanism, verification date, supporting evidence and a mechanism-specific action label. Keep
evidence and further-information links in a separate region. Non-actionable routes explain why an
action is unavailable.

**Acceptance:** validation and tests reject incomplete reviewed contact routes; rendered pages
identify who receives what, who may use the route, its current state and the actual mechanism.

## Phase 3 — Domain components

Add `Button`, `StatusBadge`, `Notice` and `ContactRoute`. Components receive precomputed states and
contain presentation logic only. Do not create generic form controls in this phase.

**Acceptance:** controlled variants, correct anchor/button semantics, non-colour status cues and
tests for every state.

## Phase 4 — Critical-journey migration

Migrate directory results, record pages, recipient selection and the final send-to step. Preserve
analytics. Do not migrate unrelated forms unless necessary to remove a direct inconsistency.

**Acceptance:** one route has one state everywhere; non-actionable routes have no primary action;
articles cannot look like contact mechanisms; canonical entities/routes remain unique; English
and French carry equivalent meaning.

## Phase 5 — Proportional CSS organization

Keep `tokens.css`; retain foundations/layout in `global.css`; move reusable component rules into
`components.css`. Add page files only when growth demonstrates a useful boundary.

**Acceptance:** no intentional redesign, duplicated component selectors or import-order
dependency; light/dark and narrow/wide layouts continue to pass.

## Phase 6 — Reference page

Add an unlisted, `noindex` English reference page using real components and explicitly fictional
fixtures. Include every state, actions versus evidence, long content, missing optional data and
responsive/theme coverage.

**Acceptance:** every supported variant is visible and no real draft route can be confused with a
directory recommendation.

## Phase 7 — Deterministic enforcement

Add a narrow checker for raw colours outside tokens, unsupported component states, legacy contact
markup on migrated surfaces, primary actions on non-actionable states, evidence styled as a
primary action, and incomplete accessible/contact information. Add it to normal checks.

**Acceptance:** failures are actionable; documented exceptions are possible; the tool makes no
claim to measure overall design quality.

## Phase 8 — Visual and accessibility regression

Stabilize browser/version, viewports, scale, fonts, theme, reduced motion, fixtures and dates
before enforcing screenshots. Cover the reference page, directory, actionable and reference-only
records, guided path and mobile layouts. Run axe and horizontal-overflow checks on the same set.

**Acceptance:** two unchanged runs reproduce the same images; reviewed baselines live in Git;
failure diffs are retained by CI.

## Phase 9 — Comprehension validation

Provide a small repeatable test asking reviewers to identify recipient, accepted content,
eligibility, current availability, contact action, evidence links and reasons for unavailable
routes. Target 90% correct action/evidence identification and zero reference-only links mistaken
for submission routes. Do not fabricate participant results; record external testing as pending
until real people complete it.

## Phase 10 — Evidence-led consolidation

After the critical journey is stable, inspect remaining forms/pages and extract or migrate only
where demonstrated duplication makes the system simpler. Defer Storybook or a separate package
until another application consumes the system or the component inventory materially grows.

## Delivery protocol

Each phase is an independently reversible commit. Every commit updates `HANDOVER.md`, runs focused
tests plus the proportionate build/check commands, and records risks and the next step. Deployment
is out of scope without separate owner approval.
