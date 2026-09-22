# input/ — assets developed 22 September 2026

Everything produced during the research and build phase. Nothing here is generated
at build time; all of it is source material a developer or designer can work from.

## data/

| File | Contents |
| --- | --- |
| `institutions.json` | 229 institutions with remits, 589 contact routes, access levels, and an honest assessment of whether each channel works. Backs the Concern Register page |
| `committees-and-organisations.json` | `seats`: 144 bodies with AI jurisdiction across 27 jurisdictions, 126 with named current holders. `orgs`: 50 campaigns, civil society, professional and industry bodies with their asks stated plainly. Backs the routing page |
| `sources-index.json` | Flat index of all 1,170 sources with three-state verification and a self-documenting `qualifiers` block |
| `directory-full.json` | The complete record set behind both pages, with the same qualifiers block |

### data/raw/

Unnormalized output from the ten research agents, before deduplication and tagging.
Expensive to recreate — roughly several hundred page fetches. Keep it.

| File | Contents |
| --- | --- |
| `research-register.json` | Five datasets: frontier labs, US/UK/EU government, global government, multilateral and civil society, public reporting channels |
| `research-routing.json` | Five datasets: US federal committees, US state committees, UK/EU/Canada/Australia, Asia and Latin America, organisations |

## src/

Page sources for the two published artifacts. Each page is assembled from its parts by
concatenating `head.html` + `body.html` + an inlined data `<script>` + `script.html`.
`index.html` is the assembled result and is what was published.

These are Artifact-format pages: no doctype, html, head or body tags — the platform wraps
them at publish time. To host them anywhere else, add a document skeleton.

| Directory | Page |
| --- | --- |
| `src/register/` | AI Safety Concern Register — institutions, filing format, worked example |
| `src/routing/` | Where to Take an AI Concern — outcome routing, committee seats, organisations |

## screenshots/

Render checks taken during the build, desktop and mobile.

## Verification states

Three states, not two. `null` (unchecked) is meaningfully different from `false`.

| State | Count | Meaning |
| --- | --- | --- |
| `true` | 774 | Page was fetched and the contact route was seen on it |
| `false` | 145 | Cited by a secondary source; page could not be read. A lead to confirm, not an address to rely on |
| `null` | 251 | Not independently checked — homepage and framework links, recorded as listed |

No email address or URL in this dataset was generated. Where a route could not be found,
the record says so.

## Known decay

- Named seat-holders change with elections, reshuffles and annual committee reconstitutions; EU rapporteurs change with every file. Every name carries a `verified_on` date and a `membership_url` pointing at the institution's own live list.
- The UK's DSIT was abolished in July 2026; the Commons committee reverted to its former name. Some register entries written against the older structure are partly stale.
- The International Network of AI Safety Institutes was renamed in December 2025, dropping "safety" from its title.
- Indian and Japanese committee chairs rely on bodies reconstituted annually — re-confirm before relying on them.

## Elsewhere

- `docs/ux-brief.md` — the UX brief for this project, left in `docs/` rather than duplicated here.
