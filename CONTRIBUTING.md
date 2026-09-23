# Contributing to AI Citizen Action

*Created 2026-09-23T00:10:13Z. See `docs/content-architecture.md` for the design this guide puts into practice.*

This site helps an alarmed, non-expert person send one well-aimed message to the institution that can act on their concern about AI. Everything it says is only as good as its addresses and dates. That is where you come in.

## The fastest way to help — no account on this site needed

Every record on the site has a **"Something wrong here?"** link. A dead link, a chair who has left the committee, a form that has moved: tell us in a minute. These reports are worth more than most deliberate edits.

You can also **suggest a resource** (an article, video, report, or an open consultation) with the *Suggest a resource* issue form.

## Ways in

| You want to… | Do this |
| --- | --- |
| Report one problem | Use the link on the record, or open a *Something wrong with a record* issue |
| Fix records yourself | Edit the YAML file and open a pull request (see "Your first change" below) |
| Look after a country, a subject, a language, or the Resources collection | Open a *Volunteer for an area* issue |

A handle is enough. You never need to give your real name. You can commit with GitHub's no-reply email address.

## How the content is organised

Every fact lives in one small YAML file under `content/`. You never edit HTML.

```
content/bodies/<country>/<id>.yml     committees, regulators, agencies, multilateral and standards bodies
content/channels/<country>/<id>.yml   lab safety channels, reporting channels, incident databases
content/orgs/<country>/<id>.yml       campaigns, civil society, academic, professional, industry
content/resources/…                   the Resources collection (editors)
i18n/<lang>/content/…                 translations — strings only
```

Inside each record:

- **`facts`** — addresses, dates, types. Language-independent. Values like `type`, `tags` and route types come from the lists in `schema/vocab/`.
- **`strings`** — the prose, which translators translate.
- **`meta`** — when it was last checked (`verified_on`), when it is next due (`review_by`), and the sources someone actually opened.

## The rules a reviewer rejects on

1. **A URL or address nobody opened.** Not negotiable, and the most common failure in good-faith contributions. If you cannot find a route, say so: `value: null`, `verified: false`, and explain in the route's note.
2. **A route marked verified without being seen.** `verified: true` means *you opened the page and saw the route on it*, and needs today's `verified_on`.
3. **Collapsing the three states.** `true` (opened and seen), `false` (cited by someone else, unread — a lead), `null` (listed, never checked). There is no default.
4. **Prose in a field that should be a list value.** It breaks routing in every language at once.
5. **An advocacy position stated as fact.** The site has no ask of its own. An organisation's position is recorded as *theirs*, in their terms.
6. **Softening or sharpening an organisation's ask** — including when it is unpopular, and including when you agree with it.
7. **An overstated power.** Saying a body can compel when it can only advise destroys the most trust per instance, because the user finds out at the worst moment.

**Conflicts of interest are declared, not prohibited.** If you work for or have ties to a listed organisation, say so in your volunteer profile (`volunteers/<handle>.yml`) and do not review that organisation's record.

## Your first change

1. Pick a record — your charter lists the ones that need it most: `node scripts/charter.mjs --path content/bodies/ie/`
2. Open the institution's own website. Find the fact you are checking.
3. Edit the YAML. Update the route's `value`, set `verified` honestly, set `verified_on` to today, and set `meta.verified_on` and a new `meta.review_by`.
4. Run the checks: `npm install && npm run check`
5. Open a pull request. The checklist in the template repeats the rules above. Automated checks validate the file and test every URL you changed.

A worked example, annotated line by line, is in `docs/stewards/worked-example.md`.

## Roles

| Role | Looks after | Can merge |
| --- | --- | --- |
| Geography steward | One country or region | Their own paths, with a second review |
| Domain steward | One subject across all countries | Their own paths, with a second review |
| Language steward | One language's `i18n/` tree | Their own language |
| Editor | `content/resources/` — publishes items, writes neutral prompts and explainers | Resources, with a second review for explainers |
| Maintainer | Schemas, site, scripts, the source registry, `CODEOWNERS` | Anything |

Stewards are invited after three merged contributions in an area. Stepping back is normal: ask to be removed and your paths go to the co-owner. No explanation is owed.

## Review cycles

| Content | Re-checked every |
| --- | --- |
| Named seat-holders | 90 days |
| Contact routes | 180 days |
| Remits and powers | 365 days |
| Open windows | 14 days, until they close |
| Explainers | 365 days |
| Resource sources | 180 days |

When a record passes `review_by`, it appears in its steward's charter and the site shows it as due for a re-check. Nobody has to notice.

## Tools

```bash
npm run check                              # validate everything + run tests
node scripts/charter.mjs @your-handle      # your queue
node scripts/freshness.mjs                 # how current the whole project is
node scripts/check-links.mjs --files content/bodies/ie/ie-x.yml   # check the URLs in one file
```

## Talking to each other

GitHub Discussions, with one category per role. The weekly freshness report is posted there.
