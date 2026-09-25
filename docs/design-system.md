# AICitizenAction design system

This is the implementation source of truth for the site's visual and contact-presentation system.
The product definition remains in `docs/ux-brief.md`; contact eligibility policy remains in
`scripts/lib/routing.mjs`. The design system presents those decisions but does not replace them.

## What the system is for

The primary user is worried, non-technical and likely on a phone. The interface should make one
real next action obvious without making evidence, background reading or stale contact information
look actionable. Calm, direct and credible is more important than decorative variety.

The public term is **Place to contact**. It means an entity with at least one current, audited,
explicit route that accepts a concern, complaint, report, evidence or feedback from the displayed
audience. A page, attachment, article or topical source is not a place to contact. Every actionable
card must show the actual mechanism and its evidence separately.

## Foundations

- `site/styles/tokens.css` owns colour, type, spacing, radii and dark-theme values. Raw colours are
  rejected elsewhere by `npm run design:check`.
- `site/styles/global.css` owns reset, document foundations, site chrome, forms and page layout.
- `site/styles/components.css` owns reusable component presentation and responsive states.
- Figtree is self-hosted. No page loads fonts, tracking or interface assets from another origin.
- Status always has words and a symbol; colour is supplementary.

## Contact state model

`contactRouteAssessment(record, route, today)` is the sole state mapper. The same assessment drives
routing eligibility and presentation.

| State | Actionable | Meaning | Primary contact action |
| --- | --- | --- | --- |
| `verified` | yes | reviewed route, usable mechanism, complete current evidence and audience/subject facts | exactly one |
| `unverified` | no | evidence or review is incomplete/unsupported | none |
| `expired` | no | contact evidence passed its validity horizon | none |
| `closed` | no | a dated intake window is not currently open | none |
| `unusable` | no | no usable mechanism exists | none |
| `reference_only` | no | useful background or a deliberately non-recommended route | none |

Missing and contradictory facts fail closed. `contactRouteContract()` packages the state,
mechanism, action family, audience, accepted subjects, restrictions and evidence. UI code must not
reconstruct those rules.

## Components

| Component | Controlled API | Use |
| --- | --- | --- |
| `Button` | `primary` / `secondary`, anchor or native button, disabled, external | a deliberate next action; never style an evidence link as a button |
| `Notice` | `information` / `caution` / `blocking` | contextual, limiting or stop information; blocking notices use alert semantics |
| `StatusBadge` | the six contact states only | readable state with non-colour symbol, explanation and optional evidence date |
| `ContactRoute` | complete precomputed contact contract | recipient, audience, accepted content, restriction, mechanism, action and separately labelled evidence |
| `ActionCard`, `IconDisc`, `StepMeta`, `ReassuranceNote` | narrow existing props | door choices and guided-path orientation |

Components accept ordinary IDs/data attributes needed by page behavior, but variants remain
controlled. Add a variant only when it represents a repeated semantic distinction, not for a
one-off visual tweak.

The guided path changes recipients in the browser, so its contact-card HTML is a client-side mirror
of `ContactRoute`; stable `data-ds-component` markers and the design checker enforce the same
contract. This is the only intentional contact-presentation duplication.

## Content and interaction rules

1. Name the recipient and say who may use the route and what it accepts before the action.
2. Use mechanism-specific labels: “Open the submission page,” “Email the recipient,” and so on.
3. Put evidence in its own labelled region. An evidence link proves the route; it is not the route.
4. Non-actionable cards explain why and contain no primary contact action.
5. Long URLs and names must wrap; mobile actions fill the available width; no horizontal scroll.
6. English is the source UI language. French carries equivalent controlled terms through the
   existing translation/fallback system.
7. Preserve native anchor and button semantics, visible focus, 48 px actions and reduced motion.

## Reference and checks

- `/en/design-system/` is an unlisted, `noindex` reference built entirely from fictional data. It
  covers every state, action/evidence separation, missing optional values, long text and variants.
- `npm run check` includes validation, `npm run design:check` and all unit/integration tests.
- `npm run visual:check` runs eight reviewed browser screenshots plus axe, overflow and semantic
  action checks. Follow `docs/accessibility.md`; only use `visual:update` after image review.
- `docs/design-system-comprehension-test.md` defines the human test and scoring command. Human
  comprehension remains unproven until at least five genuine participants complete it.

## Exceptions and change process

- A necessary literal colour outside `tokens.css` requires `design-check-allow: raw-color` on that
  line and a reason in the reviewing commit. Prefer a token.
- Visual baseline changes require review of every changed image, not blind regeneration.
- State or contact-contract changes require routing boundary tests, English/French copy and a new
  reference fixture before UI work.
- Do not deploy design-system changes without the owner's separate approval.

## Consolidation audit (2026-09-25)

Repeated server-rendered buttons and notices across the path, feedback/contributor forms,
Resources, thanks and 404 pages now use `Button` and `Notice`. The checker rejects reintroduction of
legacy raw button/notice markup unless it is the marked client-rendered contact mirror.

No generic form-field component was added. Feedback, contributor intake, directory filters and the
guided path share HTML controls but not a stable validation, hint, error or state contract; wrapping
them now would move page differences into a sprawling prop API. Generic cards and tables likewise
remain layout classes until a second semantic consumer appears. Storybook and a separate package
remain deferred until the inventory or number of consuming applications materially grows.
