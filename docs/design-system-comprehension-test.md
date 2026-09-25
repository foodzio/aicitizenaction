# Contact-action comprehension test

**Purpose:** verify that people can distinguish a usable contact action from its supporting
evidence and from reference-only information. This protocol tests the contact presentation, not
the participant. It complements, but does not replace, the broader path test in
`docs/phase-a-test-kit.md`.

## Participants and setup

- Recruit at least five people matching the primary user in `docs/ux-brief.md`: non-technical,
  without policy experience, arriving on a phone because an AI issue concerned them.
- Use a production build or owner-approved preview. Do not deploy solely for this test without the
  owner's approval.
- Show one current actionable contact card and one reference-only card in counterbalanced order.
  Use real pages as they appear to users; never use the fictional design-reference page as content
  evidence.
- Record anonymous IDs such as `P01`; do not record names, contact details or the participant's
  underlying concern. Ask permission before recording verbatim comments.
- The facilitator may repeat a question but must not explain labels, point to a link or teach the
  action/evidence distinction.

## Script

Say: “We are testing this page, not you. Please look at it as if you wanted to report an AI-related
problem. I will ask what the page means; there are no trick questions.”

For the actionable card, ask these questions in order:

1. Who would receive something sent through this route?
2. What kinds of issue does it accept?
3. Who is allowed to use it?
4. Is this route currently available? What on the page tells you that?
5. What would you use to contact the recipient?
6. What is the evidence link for? Would clicking it submit your report?

For the reference-only card, ask:

7. Why can you not contact someone through this card right now?
8. If you clicked its source or evidence link, would that send or start a report?

## Deterministic coding rubric

Code each field `true` only when the unprompted answer conveys the displayed fact; otherwise code
it `false`. Synonyms are acceptable, but topical plausibility is not enough. The facilitator must
quote the on-page answer in the notes before coding a paraphrase as correct.

| Field | True only when the answer identifies… |
| --- | --- |
| `recipient` | the named recipient, not merely the website or article publisher |
| `accepted_content` | at least one displayed accepted subject or its faithful paraphrase |
| `eligibility` | the displayed eligible audience, including any limiting condition |
| `availability` | whether the route is currently usable and the visible state/evidence date supporting that answer |
| `contact_action` | the actual mechanism/button used to contact the recipient |
| `evidence_link` | the source as proof/context and explicitly not the submission action |
| `unavailable_reason` | the reason shown on the non-actionable card |
| `reference_only_mistaken_for_action` | `true` if the participant says a reference/evidence link sends, starts or constitutes a report |

When an answer is ambiguous, code it `false`. A second reviewer independently checks the coding;
disagreements are resolved against the rubric before scoring.

## Results file and scoring

Store genuine observations in an untracked working file unless participants consent to publication:

```json
{
  "participants": [
    {
      "id": "P01",
      "recipient": true,
      "accepted_content": true,
      "eligibility": true,
      "availability": true,
      "contact_action": true,
      "evidence_link": true,
      "unavailable_reason": true,
      "reference_only_mistaken_for_action": false
    }
  ]
}
```

Run `node scripts/score-contact-comprehension.mjs <results.json>`. The scorer rejects missing or
non-boolean observations and duplicate participant IDs.

The predeclared goal is:

- at least five completed participants;
- at least 90% correct across `contact_action` and `evidence_link`; and
- zero participants mistaking a reference-only/evidence link for a submission route.

Report every dimension rate, not only the aggregate. A missed target is a product finding, not a
participant failure: revise the labels/structure, update regression baselines, and rerun with new
participants. Never reuse answers after teaching the distinction.

## Current result

**Pending external testing.** No participant observations have been collected or fabricated as
part of implementation. Automated tests prove only that the fields, action boundary and scoring
rules exist; they do not establish human comprehension.
