# Places to Contact — Audit and Correction Plan

*Created 2026-09-24T00:26:34Z. This plan incorporates every recommendation rated at least 80/100 in the review prompted by the incorrect “Places to report” listings.*

## 1. Problem and objective

The directory currently presents all 74 records in `content/channels/` as “Places to report.” Some are articles, papers, guidance, discovery tools, unenacted proposals, outbound-only policies, indirect trackers, or organisations without a verified inbound route. A URL being reachable is currently enough for the directory to call a record verified, even when the URL cannot receive a concern.

This defeats the purpose of the directory and can also contaminate the action-routing flow.

The objective is to ensure that every public “Place to contact”:

1. identifies a real recipient;
2. cites an explicit means of contacting that recipient;
3. states what the recipient accepts and who may use the route;
4. is relevant to the concern for which it may be recommended;
5. is currently available; and
6. has been reviewed against deterministic rules.

The current finite audit scope is:

- 74 channel records;
- 234 routes within those records;
- 107 routes currently marked `verified: true`, 23 marked `false`, and 104 unchecked;
- all directory display, record-page, API, translation, and recommendation behavior that consumes those records.

## 2. Product terminology

Change the public category label from **“Places to report”** to **“Places to contact.”**

Use this supporting definition:

> Organisations and services that explicitly accept concerns, complaints, reports, evidence, or feedback. Every listing cites who may contact them, what they accept, and a currently available route.

Change the verified-only control to **“Only show currently verified contact routes.”**

The internal directory name `channels` may remain during this correction to avoid needless URL, API, and reference churn. Renaming the storage section is a separate architectural decision and is not required to restore correctness.

Before final release, test “Places to contact” against the alternative “Where to send a concern” with representative users. This wording test must not delay enforcement of the eligibility rules.

## 3. Deterministic qualification rules

### 3.1 Record-level rule

A record qualifies as a Place to Contact if and only if it has at least one route that passes every mandatory route rule below.

One valid route does not validate the record’s other routes. Every route is reviewed independently, and failed routes are removed from the contact choices or clearly retained only as non-contact references.

### 3.2 Mandatory route rules

A qualifying route must pass all six rules:

1. **Identifiable recipient** — a named organisation, authority, company, database, programme, or responsible team receives the contact.
2. **Explicit inbound mechanism** — the route provides a form, email address, complaint system, submission system, reporting tool, disclosure programme, petition, consultation, docket, call for evidence, bounty, feedback mechanism, or documented telephone/postal method.
3. **Acceptance evidence** — an official or authoritative source explicitly says what the recipient accepts. Successfully fetching a page is not evidence that it accepts contact.
4. **Eligible user** — the general public may use it, or the exact restriction is recorded, such as employee, customer, affected person, researcher, resident, or eligible organisation.
5. **Relevant scope** — the cited accepted subjects include the stated AI concern, or a documented general jurisdiction clearly covers it.
6. **Currently usable** — the route is open now. If it is time-limited, its opening and closing dates are recorded and the current date falls within them.

Failure of any mandatory rule makes the route ineligible.

### 3.3 Explicit exclusions

The following do not qualify by themselves:

- articles, newsletters, academic papers, reports, or commentary;
- homepages or generic sales/contact pages that do not explicitly accept the relevant concern;
- policy or legal frameworks without an independent inbound mechanism;
- outbound-only disclosure policies;
- unenacted bills or proposed protections;
- closed consultations, expired evidence calls, and archived bounties;
- directories, discovery tools, and instructions that only point to another recipient;
- trackers that ingest material indirectly from another database;
- a route whose text says `N/A`, “nothing,” “not enacted,” “does not accept,” or an equivalent contradiction;
- a reachable URL mislabeled as a submission, disclosure, or reporting route;
- an unchecked or failed route;
- a route with unknown eligibility or unknown accepted subject.

Discovery tools and official instructions may remain useful Resources. They are not themselves contact destinations unless they also provide and evidence the actual inbound mechanism.

### 3.4 Allowed outcomes for restricted routes

A restricted route may qualify with `contact_status: limited` when its eligible users and restrictions are explicit. For example, an employee-only whistleblower route may qualify, but it must never be presented to a general user without the restriction.

`public_input: none` cannot qualify a record for the public contact category. If research finds a valid restricted audience, correct the status to `limited` and cite the eligibility evidence; otherwise reclassify or remove the record.

## 4. Verification model

Do not use one boolean to represent several different claims. Preserve or introduce separate facts for:

- **Reachability:** was the URL or destination technically accessed?
- **Contact validity:** does cited evidence show that this is an inbound contact route?
- **Availability:** is the route open now?
- **Eligibility:** who may use it?
- **Scope:** what subjects does it accept?
- **Review state:** has a human applied this rubric?

The implementation should add route-level structured data equivalent to:

```yaml
contact:
  status: open              # open | limited | closed | none | unknown
  directness: direct        # direct | official-instructions | indirect
  eligible_users:
    - public
  accepted_subjects:
    - ai-incident
  restrictions: null
  evidence_url: https://example.org/reporting-policy
  evidence_note: Official page states that members of the public may report AI incidents.
  checked_on: 2026-09-24
  opens_on: null
  closes_on: null
  review: reviewed          # pending | reviewed
```

The exact field nesting may be adjusted while updating the schema, but no required fact may be dropped. Evidence notes should summarize the relevant statement rather than copying long passages.

The existing `verified` value may continue to describe technical retrieval for compatibility. It must not, alone, make a route eligible or make the directory’s contact-verification filter pass.

## 5. Shared eligibility predicate

Implement one pure function used by validation tests, directory data, APIs, and action routing. Its behavior should be equivalent to:

```text
eligibleContactRoute(route, record, today) =
  route has a usable URL/email/telephone/postal value
  AND route type is an allowed inbound mechanism
  AND route was technically verified
  AND contact review is reviewed
  AND contact status is open or limited
  AND evidence URL and checked date exist
  AND eligible users are recorded
  AND accepted subjects are recorded
  AND limited routes state their restrictions
  AND any opening/closing dates include today
```

Then:

```text
placeToContact(record, today) =
  record has at least one eligible contact route
```

Neither route type nor URL shape can substitute for the contact evidence. The directory and recommendation flow must not maintain separate, weaker definitions.

## 6. Complete audit procedure

### 6.1 Freeze unsafe assumptions

Before editing records:

1. Add tests reproducing the known false positives.
2. Prevent unreviewed contact routes from being newly recommended.
3. Decide whether to temporarily hide all pending records or show them outside the contact category as unverified research records. Pending records must not be labeled contact destinations.
4. Do not rerun `npm run migrate`; `content/` is the source of truth.

### 6.2 Generate the inventory

Create a tracked audit report with one row for each of the 234 routes. It must contain:

| Field | Purpose |
| --- | --- |
| Record ID, name, type, and country | Identity and coverage |
| Route ID, claimed type, and value | The existing claim |
| Recipient | Who actually receives contact |
| Inbound contact explicitly accepted? | Yes/no |
| Eligible users | Public or exact restricted audience |
| Accepted subjects | What may be sent |
| Availability | Open, limited, closed, none, or unknown |
| Directness | Direct, official instructions, or indirect |
| Evidence URL, note, and checked date | Reproducibility |
| Six rule results | One pass/fail value per mandatory rule |
| Deterministic result | Eligible only if all six pass |
| Disposition | Keep, fix, reclassify, merge, or remove |
| Reviewer and review date | Accountability |

The audit summary must always reconcile:

```text
74 original records = kept + fixed + reclassified + merged + removed
234 original routes = eligible + corrected + reference-only + removed
```

### 6.3 Review every record and route

Review alphabetically within country so coverage is obvious. For each route:

1. Open the claimed route and its cited source.
2. Identify the actual recipient.
3. Find explicit acceptance language from an official or authoritative source.
4. Record eligible users, accepted subjects, restrictions, and availability.
5. Apply each mandatory rule as yes/no; do not substitute an overall impression.
6. Assign a disposition.
7. Update the route data and audit row together.
8. Have a second reviewer confirm ambiguous or high-impact decisions before setting `review: reviewed`.

A second review is risk-based rather than mandatory for every straightforward route. It is mandatory when sources conflict, applicability is inferred from broad jurisdiction, the route exposes a whistleblower or vulnerable user, or the decision would make a high-ranked recommendation disappear.

## 7. Deterministic dispositions

Every record receives exactly one primary disposition:

- **Keep** — already passes all rules; add any missing structured evidence.
- **Fix** — a real contact destination whose route, eligibility, scope, status, or evidence is incomplete or wrong.
- **Reclassify** — useful article, paper, guide, framework, law, directory, or diagnostic material that belongs in Resources rather than Places to Contact.
- **Merge** — supporting guidance or a duplicate belongs on an existing valid contact entry.
- **Remove/archive** — obsolete, misleading, unsupported, or redundant material with no continuing public value.

When reclassifying or merging:

1. update every internal reference to the old channel ID;
2. preserve useful provenance and source dates;
3. add a redirect or explicit successor where an existing public URL has value;
4. ensure Resources point to an actual action destination where one exists; and
5. pass reference-integrity validation before deleting the old record.

Known examples that the audit must encode as regression cases:

- the Transformer article, “In-House Evaluation Is Not Enough,” and “To Err is AI” are Resources, not contact destinations;
- the AI Incident Database editor’s guide is guidance for the actual AI Incident Database submission route;
- the MIT tracker is not a separate destination if reports must be submitted to another database;
- OpenAI’s outbound coordinated-disclosure policy accepts nothing inbound;
- the unenacted US whistleblower bill is legal-status information, not a current contact route;
- a “find an inquiry” page is a discovery Resource, while a currently open evidence call is a time-limited contact route;
- a company homepage or generic contact form fails without explicit acceptance evidence.

## 8. Schema and validation enforcement

Update the channel schema and validator so an ineligible contact cannot merge.

For every route claimed as a contact mechanism, require:

- an allowed inbound route type;
- a usable destination value;
- successful technical verification;
- `open` or `limited` contact status;
- reviewed contact evidence with URL and checked date;
- nonempty eligible-user and accepted-subject values;
- restrictions when status is `limited`;
- opening and closing dates for time-limited routes; and
- a closing date that has not passed.

Validation must reject or exclude:

- placeholder and contradictory contact prose;
- `public_input: none` records presented as Places to Contact;
- homepage-only and framework-only records;
- outbound-only, indirect-only, closed, unknown, or unreviewed routes;
- expired routes still presented as open;
- evidence dates in the future;
- acceptance evidence that points only to the same mislabeled article URL without establishing an inbound recipient;
- contact records with no eligible route; and
- recommendation of a record that fails the shared predicate.

Keyword checks for `N/A`, “nothing,” and similar contradictions are a safety net, not the semantic proof. The structured fields and reviewed evidence are authoritative.

## 9. Product and routing changes

### Directory

- Rename the public filter and explanatory copy.
- Include only qualifying records in Places to Contact.
- Make the verified-only filter use the shared contact predicate.
- Show what the destination accepts, who may use it, restrictions, current status, and last contact review date in each result or its immediate detail view.

### Record pages

- Distinguish contact routes from reference links.
- Display contact evidence and its check date.
- Put eligibility and restrictions before the user clicks.
- Never apply a positive “Verified” badge merely because an article or homepage loaded.

### Routing

- Make `recommendable()` depend on at least one eligible contact route.
- Return only eligible routes as the proposed action.
- Ensure topic matching cannot rehabilitate an invalid contact route.
- Preserve an honest floor when no valid route exists instead of offering a topical but unusable page.

### APIs and translations

- Expose contact status and eligibility consistently in the API.
- Update English and French labels and explanations.
- Preserve translation integrity by keeping URLs and language-independent contact facts outside translated strings.

## 10. Tests and quality assurance

Add unit and integration tests proving that:

1. an article cannot qualify because its URL loads;
2. an arXiv paper mislabeled `disclosure` fails;
3. a homepage-only company fails;
4. a generic contact or sales form without acceptance evidence fails;
5. an outbound-only policy fails;
6. an unenacted bill fails;
7. a closed or expired route fails on the current date;
8. an indirect tracker fails as a direct destination;
9. a public complaint form with reviewed evidence passes;
10. a restricted employee whistleblower route passes as `limited` and exposes its restriction;
11. a record qualifies when at least one route passes, while its failed routes remain unavailable;
12. directory, API, and action routing agree on the eligible record set;
13. the verified-only filter uses contact verification rather than URL reachability;
14. resource reclassification leaves no broken references; and
15. the audit report reconciles all 74 records and 234 routes.

Run at minimum:

```bash
npm run validate
npm test
npm run build
```

Then execute the directory and routing scenarios in `docs/test-scenarios.md`, adding explicit false-positive and restricted-route cases. Run accessibility checks on the changed labels, badges, filters, and disclosures.

## 11. Delivery phases

### Phase 1 — Contract and containment

- Finalize the six-rule rubric and structured fields.
- Add known-failure regression tests.
- Implement the shared predicate.
- Stop pending and failed routes from being recommended.

**Done when:** the known article examples fail the predicate and cannot be recommended.

### Phase 2 — Schema and audit tooling

- Update schemas, vocabularies, validation, and test helpers.
- Generate the complete tracked audit inventory.
- Add reconciliation checks.

**Done when:** every original record and route has exactly one pending audit row and CI detects omissions.

### Phase 3 — Full content audit

- Review all 74 records and 234 routes.
- Record evidence and deterministic outcomes.
- Apply second review where risk requires it.
- Keep unsafe pending entries out of the contact category.

**Done when:** there are no pending routes and the counts reconcile.

### Phase 4 — Correct and reclassify content

- Keep or fix valid destinations.
- Move informational material to Resources.
- Merge supporting guidance into valid destinations.
- Remove or archive unsupported material.
- Repair references and redirects.

**Done when:** every retained contact record has an eligible route and reference integrity passes.

### Phase 5 — Public interface and routing

- Rename and explain the category.
- Display eligibility, scope, restrictions, status, and evidence dates.
- Apply the shared predicate to the directory, API, and recommendation flow.
- Update English and French UI strings.

**Done when:** every public surface presents the same eligible set and no route is oversold.

### Phase 6 — Verification and release

- Run validation, tests, build, browser scenarios, accessibility checks, and a final audit reconciliation.
- Perform a focused user wording test.
- Document before/after counts and all dispositions.
- Request owner approval before any deployment.

**Done when:** all completion criteria below pass and the owner has approved deployment.

## 12. Completion criteria

This correction is complete only when:

- all 74 records and all 234 routes have a documented outcome;
- every retained Place to Contact passes all six mandatory rules;
- no public contact entry depends only on a homepage, article, framework, indirect tracker, closed route, or unenacted proposal;
- every retained route records its recipient, eligible users, accepted subjects, availability, evidence, and check date;
- all restricted routes disclose their restrictions before a user acts;
- informational material has been reclassified, merged, or removed without broken references;
- directory, API, and routing use the same eligibility predicate;
- automated validation prevents recurrence;
- regression, integration, build, accessibility, and browser checks pass;
- the final audit report reconciles the complete original inventory; and
- the deployment is performed only after explicit owner approval.

## 13. Main risks and mitigations

| Risk | Mitigation |
| --- | --- |
| A technically reachable page is mistaken for a contact route | Separate reachability from reviewed contact evidence |
| A broad regulator’s relevance is overstated | Require cited jurisdiction and second review for inferred applicability |
| Restricted routes mislead general users | Structured eligibility and restrictions displayed before action |
| A time-limited route silently expires | Structured dates, date-aware predicate, freshness checks |
| Reclassification breaks IDs or Resource references | Reference-integrity validation and redirects/successor mapping |
| Audit judgments drift between reviewers | Six binary rules, cited evidence, deterministic disposition, risk-based second review |
| The directory and routing disagree | One shared predicate consumed by every surface |
| The correction stalls with unsafe pending entries public | Pending entries remain outside Places to Contact and recommendations |

