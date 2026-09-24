# Directory integrity and recurring maintenance plan

**Status:** proposed  
**Created:** 2026-09-24  
**Scope:** the public directory, contact recommendations, and the evidence that supports them

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

## 3. Deterministic identity model

Add structured identity fields shared by bodies, channels, and organisations:

| Field | Purpose |
| --- | --- |
| `facts.entity_key` | Stable opaque identity shared by all facts for one real-world entity |
| `facts.parent_id` | Canonical parent for a genuinely distinct subunit |
| `meta.aliases` | Former names, abbreviations, and merged legacy ids |
| `meta.redirect_from` | Old public ids that must resolve to the canonical page |
| `meta.identity_review` | Decision, evidence URLs, reviewer, and review date |

The entity key is not derived from the current name or URL: those can change. New records receive a
key during editorial review. A validation error occurs when two publishable records share one
entity key.

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

Store every decision in a generated and tracked `docs/directory-identity-audit.yml`. Each candidate
row contains both ids, matched signals, decision, canonical id if applicable, evidence, reviewer,
and date. The check fails if the inventory is stale or a high-confidence candidate has no decision.

### Enforcement levels

- **Hard error:** duplicate `entity_key`; a reviewed `same` pair still published twice; redirect to
  an unknown id; or a Resource/guidance reference to a retired id.
- **Review-blocking error:** same normalized name, same geography, and same official domain without
  a recorded identity decision.
- **Warning/queue:** one or two weaker signals, including name-only matches or shared generic forms.
- **Allowed:** a reviewed `distinct` or `related` pair whose evidence remains current.

## 4. Resolve the existing duplicate backlog

1. Generate the complete candidate inventory from all 423 directory records.
2. Start with the 26 exact normalized-name groups, then reconcile all 40 pairs already reported by
   the migration. De-duplicate overlapping candidates before review.
3. For each pair, open both cited official sources and decide `same`, `distinct`, or `related`.
4. For `same`, choose the record with the most stable id and richest verified facts as canonical;
   union compatible facts, routes, prose, sources, perspective and provenance; resolve conflicts
   from current official evidence rather than choosing the longer text.
5. Update every reference in content, Resources, guides, translations, routing rules and tests.
6. Add the retired id to `aliases`/`redirect_from`, generate its redirect page, then remove its
   duplicate listing and source file.
7. For `distinct` or `related`, add the evidence-backed identity decision and parent/successor data.

### Required Access Now outcome

- `global-access-now` is the provisional canonical record because it already contains the richer
  contact and remit evidence; the reviewer must confirm this against Access Now's official pages.
- Merge the perspective, action guidance, warnings and provenance from `global-access-now-2` where
  they remain accurate.
- Change all references to the canonical id.
- `/en/orgs/global-access-now-2/` must redirect to `/en/orgs/global-access-now/`.
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

Add a slower command:

```text
npm run directory-audit:full
```

This also performs the stateful full link check, production build, and browser/API regression
checks. A separate `--apply-reviewed` mode may enact decisions already present in the identity
audit, but there is no general `--fix` and no automatic deletion or semantic merge.

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

## 8. Credibility metrics

Publish and track these counts without turning them into a misleading score:

- canonical entities and public directory rows;
- unresolved identity candidates, by severity;
- confirmed merges and reviewed distinct/related pairs;
- contact routes current, overdue, closed, unknown, and excluded;
- percentage of public contact routes with current evidence, audience, scope and restrictions;
- records and named seats past review;
- confirmed broken links;
- Resource perspective distribution and stale translations.

The public freshness page must explain the definitions and dates. “100% reachable” must never be
presented as “100% accurate.”

## 9. Tests and acceptance criteria

### Required regression tests

- Access Now yields one public row, one canonical API entity, and a working old-id redirect.
- Two records with one `entity_key` fail validation.
- An undecided same-name/same-country/same-domain pair blocks publication.
- A reviewed same-name but distinct pair remains visible and does not warn until its decision ages.
- Merging a record leaves no references to the retired id except the redirect/alias registry.
- Overdue or closed contact evidence cannot enter recommendations or the verified-only filter.
- A reachable article, homepage, bill attachment or outbound policy cannot satisfy contact rules.
- Audit output is deterministic: an unchanged tree produces byte-identical decision rows and the
  same exit status.

### Completion criteria

- all current duplicate candidates have `same`, `distinct`, or `related` decisions; zero `pending`
  high-confidence pairs;
- all confirmed same-entity pairs are merged and redirected;
- the directory and APIs contain one row per canonical entity;
- 100% of recommended contacts pass the six contact rules and the 180-day freshness rule;
- `npm run directory-audit` and `npm run directory-audit:full` exist, are documented, and pass;
- pull-request and weekly workflows run the appropriate command;
- the freshness page exposes the resulting integrity counts and definitions;
- the complete suite, production build and focused browser/accessibility checks pass.

## 10. Recommended implementation order and confidence

| Order | Recommendation | Confidence |
| --- | --- | --- |
| 1 | Add the identity decision model and deterministic duplicate inventory | 97/100 |
| 2 | Review and merge the current duplicate backlog, beginning with Access Now | 100/100 |
| 3 | Add the read-only `directory-audit` orchestrator and CI gate | 98/100 |
| 4 | Fail closed when contact evidence exceeds 180 days | 96/100 |
| 5 | Require source-based human re-verification for contact meaning | 100/100 |
| 6 | Run the fast audit on pull requests and the full audit weekly | 95/100 |
| 7 | Publish transparent integrity counts rather than one composite score | 94/100 |

Automatic semantic merging is deliberately excluded: confidence **15/100**. It would make the
directory look cleaner while creating a serious risk of erasing legitimately distinct bodies.
