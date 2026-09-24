# Directory integrity and recurring maintenance plan

**Status:** implemented, verified, and deployed to production 2026-09-24

**Created:** 2026-09-24

**Revised:** 2026-09-24

**Scope:** the public directory, contact recommendations, and the evidence that supports them

**Estimated likelihood of achieving sustained directory accuracy and credibility:** **87/100** if
all controls in this revision are implemented and staffed. Automation can enforce structure,
freshness and publication gates; semantic accuracy still depends on source-based human review.

## 1. Problem and baseline

The directory must represent a real-world entity once, and must only describe a contact route as
current when there is recent evidence that the route accepts the stated audience and subject.
Reachability alone is not evidence of either fact.

The current maintenance tools cover parts of this promise, but there is no single safe command that
checks it end to end. The weekly workflow checks links, reports freshness and contacts inactive
stewards. It does not reconcile duplicate entities, re-confirm the meaning of a contact route, run
the contact-audit invariant, or fail closed when contact evidence becomes old.

The duplicate shown in the directory is real:

- `global-access-now` and `global-access-now-2` both describe **Access Now** in the same geography;
- each came from a different input dataset and exposes different facts about the same organisation;
- the migration report identified the pair, but nothing prevented both records being published.

A deterministic scan of the current 423 directory records finds **26 exact normalized-name groups
covering 52 records**. Exact names are a strong signal, not sufficient proof: two bodies may have a
generic name such as “Subcommittee on Energy,” while suffixes such as `-2` reflect import history,
not identity.

## 2. Integrity contract

These rules are the public contract and the basis of every automated check.

1. **One listing per real-world entity.** A legal organisation, institution, committee, or other
   independently addressable body has one canonical directory record.
2. **A subunit is separate only when it has a distinct mandate or contact route.** Its record must
   identify its parent. A second research profile, campaign description, or imported row is not a
   separate entity.
3. **Resources are not directory identities.** A publisher may have one canonical directory record
   and also appear as a Resource source or article author. That is not duplicate directory
   publication. References from Resources must point to the canonical directory id.
4. **No automatic semantic merge.** Automation may identify candidates and apply already-reviewed
   decisions, but it must not infer that two institutions are identical merely from similar names.
5. **Contact claims fail closed.** A route is recommended only when recent evidence establishes its
   recipient, inbound mechanism, acceptance, eligible users, relevant scope, and current
   availability. A working homepage or article never satisfies those rules.
6. **Every exception is explicit.** Intentionally separate same-name entities and parent/subunit
   relationships are recorded as reviewed decisions, so the same alert does not return each week.
7. **History remains recoverable.** A merged id redirects to the canonical record; sources, legacy
   ids, translations, and inbound references are preserved.
8. **Identity and classification are separate.** One canonical entity may have several roles. A
   second role or research perspective must not create a second entity record.
9. **Measured accuracy includes coverage.** Excluding every uncertain record is not success. Reports
   must show where the directory has no current contact and how large the review backlog is.

## 3. Deterministic identity model

Add structured identity fields shared by bodies, channels, and organisations:

| Field | Purpose |
| --- | --- |
| `facts.entity_key` | Stable opaque identity for one real-world entity |
| `facts.roles` | One or more reviewed classifications for the entity; replaces duplicate records created solely to carry another `type` |
| `facts.parent_id` | Canonical parent for a genuinely distinct subunit |
| `meta.aliases` | Former names, abbreviations, and merged legacy ids |
| `meta.redirect_from` | Old public ids that must resolve to the canonical page |
| `meta.identity_review` | Identity evidence, reviewer, independent approver where required, review date, and next review date |

The entity key is not derived from the current name or URL: those can change. New records receive a
key during editorial review. A validation error occurs when two publishable records share one
entity key. During migration, the existing `type` remains as a compatibility field, but public
classification and filtering move to `facts.roles`; once every consumer uses roles, the singular
field can be removed. This permits Access Now to carry civil-society, campaign and support roles
without being published more than once.

### Candidate signals

`scripts/directory-dedupe.mjs` will produce candidate pairs using normalized, explainable signals:

- exact normalized name;
- exact local name or known alias;
- same geography plus the same official registrable domain;
- the same canonical contact endpoint or official source URL;
- matching stable external identifier, when one exists;
- a generated numeric suffix such as `-2`;
- substantial overlap in names, domains, routes, and source provenance.

Normalization is deterministic: Unicode NFKD, case folding, punctuation and whitespace removal,
leading articles removed, common organisational suffixes normalized, URLs stripped of fragments,
tracking parameters and superficial slash differences, and hostnames reduced to their registrable
domain where appropriate.

Signals produce a review queue, not a merge. The following decisions are permitted:

- `same`: merge into the named canonical record;
- `distinct`: keep both, with evidence explaining the distinction;
- `related`: keep both and record the parent/child or successor relationship;
- `pending`: not yet safe to decide.

Do not mix generated candidates with editorial decisions:

- `docs/directory-identity-candidates.yml` is generated and tracked. It contains stable sorted-pair
  keys, both ids, matched signals and severity, but no authoritative decision.
- `docs/directory-identity-decisions.yml` is hand-maintained and tracked. It contains the pair key,
  decision, canonical id or relationship, evidence, reviewer, independent approver when required,
  `reviewed_on`, and `review_by`.

The audit joins the two files by pair key. Regeneration may replace the candidate file but must
never write the decision file. It fails if either inventory is stale, a decision points to a
missing candidate or record, or a high-confidence candidate has no current decision.

Identity decisions expire so reorganisations do not remain silently authoritative:

- ordinary organisations: review within 365 days;
- government bodies and committees: review within 180 days;
- an unresolved merger, successor or abolition: review every 90 days until conclusive;
- an official legal identifier with conclusive continuity may be marked permanent, with the
  evidence retained.

### Enforcement levels

- **Hard error:** duplicate `entity_key`; a reviewed `same` pair still published twice; redirect to
  an unknown id; or a Resource/guidance reference to a retired id.
- **Review-blocking error:** same normalized name, same geography, and same official domain without
  a recorded identity decision.
- **Warning/queue:** one or two weaker signals, including name-only matches or shared generic forms.
- **Allowed:** a reviewed `distinct` or `related` pair whose evidence remains current.

Domain matching must use a maintained Public Suffix List implementation rather than naive string
splitting. Shared government hosts and shared submission platforms are signals only: they never
prove identity by themselves.

## 4. Resolve the existing duplicate backlog

1. Generate the complete candidate inventory from the current directory tree. The present baseline
   is 423 records, but no script may hard-code that count.
2. Start with the 26 exact normalized-name groups, then reconcile all 40 pairs already reported by
   the migration. De-duplicate overlapping candidates before review.
3. For each pair, open both cited official sources and decide `same`, `distinct`, or `related`.
4. For `same`, choose the record with the most stable id and strongest current official evidence as
   canonical. Merge field by field: every retained value keeps its source, check date and origin
   record in `meta.merge_provenance`. A conflicting value blocks the merge until re-verified; never
   select a value merely because its prose is longer or one source record is richer overall.
5. Update every reference in content, Resources, guides, translations, routing rules and tests.
6. Require two distinct identities for a destructive or ambiguous merge: one reviewer proposes
   `same`, and one approver confirms the official evidence and canonical record. Mechanical merges
   of exact duplicate files may use maintainer approval as the second check, but never self-approve.
7. Add the retired id to `aliases`/`redirect_from`, generate its redirect, then remove its duplicate
   listing and source file. The redirect registry must cover every published language and preserve
   the old section/id path even when the canonical section changes.
8. For `distinct` or `related`, add the evidence-backed identity decision and parent/successor data.

The production server must return a permanent HTTP redirect (`308`, or `301` where platform
constraints require it) for retired record URLs. A static HTML link or client-side redirect is not
sufficient. Redirect chains and loops fail validation.

### Required Access Now outcome

- `global-access-now` is the provisional canonical record because it already contains the richer
  contact and remit evidence; the reviewer must confirm this against Access Now's official pages.
- Merge the perspective, action guidance, warnings and provenance from `global-access-now-2` where
  they remain accurate.
- Represent all retained classifications as roles on that one canonical entity.
- Change all references to the canonical id.
- Every language variant of `/orgs/global-access-now-2/` must permanently redirect to its canonical
  `/orgs/global-access-now/` page with no intermediate hop.
- Searching the directory for “Access Now” must return exactly one row.

## 5. One recurring audit command

Add a read-only command as the normal maintenance entry point:

```text
npm run directory-audit
```

It orchestrates, in order:

1. schema and reference validation;
2. identity/duplicate inventory freshness and unresolved-candidate checks;
3. deterministic contact-audit reconciliation;
4. review-date and route-evidence age checks;
5. closed-window and named-seat expiry checks;
6. translation freshness and Resource perspective balance;
7. focused tests for directory, contact eligibility, redirects and API uniqueness.

It writes machine-readable JSON and a concise Markdown queue under `tmp/directory-audit/`, exits
non-zero for integrity failures, and never changes content. Output groups work into:

- `block_publication` — duplicate identities, invalid references, or unsafe contact claims;
- `needs_human_review` — semantic identity/contact checks;
- `maintenance_due` — records, seats, translations and sources approaching review dates;
- `informational` — coverage and balance metrics.

All reconciliation is dynamic. Remove the existing assumptions that contact content must always be
exactly 74 records and 234 routes. The audit instead requires every discovered record and route to
appear exactly once, no inventory row to refer to missing content, and no publishable route to lack
a current decision. To catch accidental mass deletion without blocking legitimate growth, compare
counts with the previous committed audit and require an explicit reviewed baseline update when any
section drops by more than 5% or ten records, whichever is smaller.

Add a slower command:

```text
npm run directory-audit:full
```

This also performs the stateful full link check, production build, and browser/API regression
checks. A separate `--apply-reviewed` mode may enact decisions already present in the identity
audit, but there is no general `--fix` and no automatic deletion or semantic merge.

CI uploads both reports as workflow artifacts and includes stable finding keys in the GitHub
summary. Weekly issue filing updates an existing open issue with the same key rather than creating
duplicates. Reports must remain available long enough to compare at least two 180-day contact
cycles.

## 6. Freshness that fails closed

The present freshness report warns about old records but does not consistently remove an old
contact from recommendations. Change the shared eligibility predicate so that:

- a contact route is current for at most 180 days after `contact.checked_on`;
- a route with `closes_on` becomes ineligible immediately after that date;
- a named seat-holder is current for at most 90 days;
- an overdue contact remains visible on its reference page with an explicit warning, but is removed
  from recommendations and the “currently verified contact routes” filter;
- a channel with no current eligible route is not published as a Place to Contact;
- re-verification requires the reviewer to open the official evidence and confirm audience,
  accepted subject, mechanism, restrictions and availability—not merely receive HTTP 200.

The 180-day limit is a maximum, not an assurance. A confirmed failure or official closure takes
effect immediately.

### Production enforcement

Because the site is statically built, build-time filtering alone does not expire a route already
deployed to production. Implement one of these before claiming fail-closed freshness:

1. enforce the date in a shared runtime response used by recommendations, APIs and the verified
   filter; or
2. run a scheduled daily rebuild and production rollout from unchanged content.

The same eligibility function and clock fixture must drive build, runtime and tests. The weekly
workflow verifies the deployed result at dates immediately before and after expiry. The owner's
standing rule requires explicit approval for each production deployment, so automatic scheduled
deployment is not authorized by this plan. Until the owner separately approves it, prefer runtime
enforcement; a scheduled workflow may build, report and prepare a deployment, but not release it.

## 7. Schedule and human review

| Frequency | Automated work | Human work |
| --- | --- | --- |
| Every pull request | Fast `directory-audit`, validation and focused tests | Resolve blocking identity/content decisions introduced by the change |
| Weekly | Full links with two-failure confirmation, duplicate scan, audit reconciliation, freshness report, open/update one issue per finding | Triage new identity candidates and confirmed route failures |
| Monthly | Review hostname/name drift and unresolved duplicate queue; summarize directory integrity metrics | Sample recently verified routes for evidence quality |
| Every 90 days | Queue named seat-holders | Reopen official membership source and confirm name/role |
| Every 180 days | Exclude expired contact evidence and queue the route | Reopen official contact evidence and repeat all six contact rules |

The existing weekly GitHub workflow becomes the scheduler for `directory-audit:full`. Repeated runs
update existing issues rather than opening duplicates. Reports name the canonical record owner from
`CODEOWNERS` and link directly to the relevant evidence fields.

### Ownership, service levels and escalation

- Every finding has one owner resolved from `CODEOWNERS`; unowned paths fall back to the maintainer.
- Publication blockers introduced by a pull request must be resolved before merge.
- Confirmed broken or misleading contact routes are excluded immediately and reviewed within seven
  days; high-confidence identity candidates within 14 days; ordinary warnings within 30 days.
- Destructive/ambiguous merges require the distinct second reviewer described above.
- Each steward has at most 20 open review items. Overflow is assigned to the maintainer backlog and
  shown publicly rather than silently accruing under an inactive owner.
- Findings older than their service level appear in the weekly summary and one escalation issue.
  If nobody can review a contact route, it remains excluded; uncertainty is never converted into a
  positive claim.
- A monthly human sample reopens at least 10% of routes marked current during that month (minimum
  five where available) to detect weak evidence or review shortcuts.

## 8. Credibility metrics

Publish and track these counts without turning them into a misleading score:

- canonical entities and public directory rows;
- unresolved identity candidates, by severity;
- confirmed merges and reviewed distinct/related pairs;
- contact routes current, overdue, closed, unknown, and excluded;
- percentage of public contact routes with current evidence, audience, scope and restrictions;
- countries and concern categories with at least one current contact, and those with none;
- total candidate contacts before exclusions, with exclusions broken down by reason;
- median and oldest evidence age for included routes;
- open human-review backlog, oldest item, service-level breaches and owner coverage;
- records and named seats past review;
- confirmed broken links;
- Resource perspective distribution and stale translations.

Every percentage includes its numerator and denominator. The public freshness page must explain the
definitions and dates. “100% reachable” must never be presented as “100% accurate,” and “100% of
recommended contacts current” must appear beside coverage and exclusion counts so removing all
uncertain routes cannot masquerade as success.

Before enabling the gate, commit a reviewed baseline of country and concern coverage. A release
fails when it reduces either coverage measure by more than 5% without an explicit reviewed
explanation, or when it leaves the entire recommendation set empty. These are regression guards,
not quality targets; the owner sets improvement targets after seeing the baseline.

## 9. Tests and acceptance criteria

### Required regression tests

- Access Now yields one public row, one canonical API entity, and a working old-id redirect.
- Retired Access Now URLs in every published language return a single-hop permanent HTTP redirect.
- Two records with one `entity_key` fail validation.
- One canonical entity may carry multiple roles without generating multiple directory rows.
- An undecided same-name/same-country/same-domain pair blocks publication.
- A reviewed same-name but distinct pair remains visible and does not warn until its decision ages.
- Regenerating candidates leaves the human decision file byte-for-byte unchanged.
- Expired identity decisions return to the review queue at their entity-specific interval.
- Merging a record leaves no references to the retired id except the redirect/alias registry.
- Every merged field retains source, check date and origin; an unresolved conflict blocks merging.
- A destructive merge without two distinct reviewers fails validation.
- Overdue or closed contact evidence cannot enter recommendations or the verified-only filter.
- The production-facing result changes at the 180-day boundary without depending on a manual
  content edit, and build/runtime eligibility agree under the same test clock.
- A reachable article, homepage, bill attachment or outbound policy cannot satisfy contact rules.
- Adding a legitimate record or route does not require changing a hard-coded total; an unexplained
  mass deletion does require a reviewed baseline update.
- Reports expose coverage, exclusions and backlog denominators, so an empty recommendation set does
  not pass credibility acceptance criteria.
- Audit output is deterministic: an unchanged tree produces byte-identical decision rows and the
  same exit status.

### Completion criteria

- all current duplicate candidates have `same`, `distinct`, or `related` decisions; zero `pending`
  high-confidence pairs;
- all confirmed same-entity pairs are merged and redirected;
- the directory and APIs contain one row per canonical entity;
- entity identity supports multiple roles and no duplicate is retained merely to preserve a second
  classification;
- candidate generation and human decisions are stored separately, with current decision evidence;
- every destructive/ambiguous merge has two distinct reviewers and field-level provenance;
- 100% of recommended contacts pass the six contact rules and the 180-day freshness rule;
- production enforces expiry at the correct date without waiting indefinitely for a manual deploy;
- coverage and backlog measures meet explicit owner-approved minimums; correctness alone is not a
  launch criterion;
- `npm run directory-audit` and `npm run directory-audit:full` exist, are documented, and pass;
- pull-request and weekly workflows run the appropriate command;
- the freshness page exposes the resulting integrity counts and definitions;
- the complete suite, production build and focused browser/accessibility checks pass.

## 10. Recommended implementation order and confidence

| Order | Recommendation | Confidence |
| --- | --- | --- |
| 1 | Separate generated candidates from human-reviewed decisions | 99/100 |
| 2 | Support multiple roles on one canonical entity | 91/100 |
| 3 | Remove fixed record and route count assumptions | 100/100 |
| 4 | Preserve field-level sources, dates and origin during merges | 98/100 |
| 5 | Require a second reviewer for destructive or ambiguous merges | 94/100 |
| 6 | Enforce expiry in production without relying on an old static build | 99/100 |
| 7 | Report coverage and backlog beside correctness percentages | 97/100 |
| 8 | Define owners, service levels, capacity and escalation for human review | 96/100 |
| 9 | Expire identity decisions according to entity risk | 88/100 |
| 10 | Implement and test permanent redirects across languages and sections | 90/100 |
| 11 | Review and merge the current duplicate backlog, beginning with Access Now | 100/100 |
| 12 | Add the read-only `directory-audit` orchestrator and CI gate | 98/100 |
| 13 | Require source-based human re-verification for contact meaning | 100/100 |
| 14 | Run the fast audit on pull requests and the full audit weekly | 95/100 |

Automatic semantic merging is deliberately excluded: confidence **15/100**. It would make the
directory look cleaner while creating a serious risk of erasing legitimately distinct bodies.
