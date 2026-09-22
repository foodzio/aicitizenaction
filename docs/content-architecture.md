# AI Citizen Action — Content Architecture

*As of 22 September 2026 — last modified 2026-09-22T23:46:14Z (ISO `gb`, file named by id, `unsourced` rule); earlier 2026-09-22T20:37:19Z (Resources layer added, record format corrected, volunteer lifecycle added). Implementation plan: `docs/implementation-plan.md`.*

A structure for a site maintained by volunteers who each hold one domain or one country, in any number of languages, where nothing goes stale quietly.

## Content is data, never pages

Every fact on the site lives in one small file that a non-programmer can read, and no volunteer ever edits HTML.

This is the decision everything else follows from. A committee is a file. An organisation is a file. A news item is a file. The site is generated from those files; nobody hand-writes a page.

Four things fall out of it, and each one is a problem this project would otherwise have.

1. **Work can be split without collision.** If the EU steward and the India steward edit pages, they queue behind each other. If they edit `content/bodies/eu/` and `content/bodies/in/`, they never touch the same file and never conflict.
2. **A machine can check the work.** A stranger's contribution can be validated against a schema, its URLs fetched, its dates checked — before a human looks at it. That is what makes accepting help from people you have not met possible at all.
3. **Translation becomes copying one folder**, not rebuilding a site.
4. **Staleness becomes visible.** A field holding a review date can be queried; a paragraph buried in markup cannot.

The cost is real and worth naming: contributors have to work in a structured format rather than a document, and someone has to maintain the schemas. That cost is paid once. The alternative — volunteers editing pages — gets more expensive every month the project survives.

## Repository layout

The path is the assignment. A volunteer is given a folder, and the folder is the whole of their responsibility.

```
content/
  bodies/                      bodies with power: committees, regulators,
    us/federal/us-senate-commerce.yml    agencies, institutes, multilateral, standards
    us/ca/us-assembly-privacy.yml
    gb/gb-commons-science-tech.yml
    eu/eu-ep-imco.yml
    in/in-standing-committee-it.yml
  channels/                    places to report: lab safety channels, bounties,
    us/anthropic.yml                     incident databases, whistleblower and
    global/ai-incident-database.yml      public complaint routes
  orgs/                        campaigns, civil society, academic, professional,
    global/control-ai.yml                industry
    us/encode.yml
  guides/                      the filing format, draft templates, the generic
    filing-format.yml                    "any parliament" method
  resources/                   the Resources layer — see "Resources" below
    sources/                   registry of watched publishers and channels
      global/ai-frontiers.yml
    media/2026/09/             external articles, videos, podcasts, reports
      ai-frontiers-lab-channels-review.yml
    explainers/                our own articles, with facts and sources
      what-a-committee-chair-can-do.yml
    windows/                   dated, closing opportunities to act
      2026-10-eu-ai-office-consultation.yml

i18n/
  fr/content/bodies/eu/ep-imco.yml        strings only
  es/content/bodies/eu/ep-imco.yml
  ui/fr.yml                               buttons, labels, enum names

schema/                        JSON Schema per content type
  route.schema.json            shared by bodies, channels and orgs
  body.schema.json
  channel.schema.json
  org.schema.json
  guide.schema.json
  source.schema.json
  media.schema.json
  explainer.schema.json
  window.schema.json
  translation.schema.json
  vocab/                       the controlled vocabularies: topics, powers,
    topics.yml                           route types, perspectives, roles
    powers.yml

volunteers/                    one optional file per steward: paths, languages,
  jan-bxl.yml                            declared conflicts of interest

site/                          templates and styles — developers only
scripts/                       migrate, validate, ingest, charter, freshness
```

**Where each existing record goes.** The 229 institutions in `input/data/institutions.json` split by their `group`: Government, Multilateral and Standards become `bodies/`; Companies, "How to file" and Watchdog become `channels/`; Civil society and Academic become `orgs/`. The 144 committees become `bodies/`. The 50 organisations become `orgs/`. A record that appears in more than one dataset becomes one file; the migration script reports every merge for a human to confirm.

Three rules hold this together.

**Geography is the first path segment under each type**, using ISO 3166-1 country codes in lower case (so the United Kingdom is `gb`, not `uk`), plus `eu` for the European Union and `global` for bodies that belong to nobody. Sub-national layers get a second segment (`us/ca`, `de/by`). This is what lets a country steward be handed `content/**/us/ca/` and nothing else.

**One entity, one file, named after its id** — the file is `<id>.yml`, and the id starts with the country code (`us-senate-commerce`). Never a file holding several bodies — that reintroduces the collision problem the layout exists to prevent.

**`site/` is off limits to content volunteers**, and `content/` is off limits to nobody. The separation is what lets you accept a contributor without also granting them the ability to break the site.

## The record format: facts apart from strings

Inside every record, language-independent facts sit in one block and translatable prose in another. A translator opens a file with no URLs in it and cannot break one.

`content/bodies/us/federal/us-senate-commerce.yml` (illustrative; the migrated record is `us-senate-committee-commerce-2.yml`)

```yaml
id: us-senate-commerce
type: seat                                      # enum from vocab/record-types
geo: { country: us, sub: federal }

facts:
  routes:                                       # every route carries its own state
    - id: membership
      type: membership
      value: https://www.commerce.senate.gov/about/members
      verified: true
      verified_on: 2026-09-22
    - id: contact
      type: form                                # enum from vocab/route-types
      value: https://www.commerce.senate.gov/contact
      verified: true                            # true | false | null — required, no default
      verified_on: 2026-09-22
      language: en
  powers: [compel, hearings, appropriate]      # enums, not prose
  public_input: limited                         # enum
  accepts_foreign: false
  effort_minutes: 12                            # a number; the interface formats it
  topics: [frontier-ai, safety-testing, preemption, ftc]
  not_topics: [copyright, liability, military-ai, export-controls]
  seats:
    - role: chair
      name: Ted Cruz
      party: R
      region: TX
      verified_on: 2026-09-22
    - role: ranking
      name: Maria Cantwell
      party: D
      region: WA
      verified_on: 2026-09-22

strings:
  name: Senate Commerce, Science and Transportation
  remit: >
    Frontier AI rules land here, along with the FTC, NIST and CAISI.
  mechanism: >
    Staff log a constituent position against the bill and report the
    count to the chair before markup.

meta:
  verified_on: 2026-09-22
  review_by: 2026-12-22
  owners: ["@geo-us-federal", "@domain-legislatures"]   # quoted: a bare @ is invalid YAML
  sources:
    - { url: https://www.senate.gov/general/committee_membership/..., checked: 2026-09-22 }
```

**Everything that drives logic is an enum, never prose.** `powers: [compel]` and `public_input: limited` are identifiers. The interface decides what to show from them, and each one is translated once in `i18n/ui/<lang>.yml` rather than 229 times across the records. `topics` and `not_topics` are the same idea: they drive the routing that tells a user copyright belongs at Judiciary, and they are matched by id, not by matching English words.

**`verified_on` appears at three levels on purpose** — per named seat, per route, and for the record. People churn fastest, addresses next, institutions slowest, and the interface shows the nearest date beside the fact it applies to.

**Routes are objects, never bare URLs.** The existing dataset records a three-state verification on every one of its 1,170 sources; a record format that stored `contact_url` as a plain string would lose that on migration. Every route has an `id`, a `type`, a `value`, a `verified` state and a `language`, and the schema is shared by bodies, channels and organisations.

**Controlled vocabularies live in `schema/vocab/`.** Topics, powers, route types, perspectives and roles are each one list, with an English label per id. Adding a topic is a maintainer change because every record, the routing and every language depend on the list.

**`sources` is not optional.** A claim without a source someone actually opened is the thing that erodes a directory like this. The schema requires at least one. The only exception is a record where research found no URL at all: it carries `meta.unsourced` with the reason instead, is shown as unsourced, and is never recommended by routing.

## Ownership without a coordinator

A volunteer is assigned a path, and the tooling routes review to them automatically. Nobody has to remember who covers what.

One file does this — `CODEOWNERS` at the repository root:

```
/content/bodies/us/ca/      @maria-sf @domain-legislatures
/content/bodies/eu/         @jan-bxl  @domain-legislatures
/content/bodies/in/         @priya-blr
/content/orgs/              @domain-campaigns
/content/channels/          @domain-incidents
/content/resources/         @editors
/content/resources/sources/ @editors @maintainers
/i18n/fr/                   @lang-fr
/i18n/es/                   @lang-es
/volunteers/                @maintainers
/schema/  /site/  /scripts/ @maintainers
/CODEOWNERS  /.github/      @maintainers
```

A change to a Californian committee requests review from the California steward and the legislatures steward at once, without anyone being asked. A change to `schema/` or `site/` can only be merged by a maintainer.

**Two axes, both real.** Some volunteers know a place; some know a subject. A person who understands incident-reporting channels understands them everywhere, and a person in Bengaluru understands Indian committees better than any subject expert will. The layout supports both because a path can have several owners, and because domain ownership is expressed as a *cross-cutting* line rather than a competing folder tree.

**A steward's charter is one short page**, generated from their own paths: which records are theirs, which are overdue for review, which have failing links. It is their queue, and it is the entire job description.

**Nobody owns a language and a country at the same time** unless they ask for both. Keeping translation separate from sourcing means a French speaker can help without knowing anything about French institutions, which is most of the translator pool.

## Translation

English is the source of truth. Every other language mirrors only the `strings` block, at the same path, and carries a fingerprint of the English it was made from.

`i18n/fr/content/bodies/us/federal/senate-commerce.yml`

```yaml
strings:
  name:
    value: Commission du commerce, des sciences et des transports du Sénat
    src: 9f2a1c      # hash of the English at translation time
  remit:
    value: >
      Les règles sur l'IA de frontière relèvent de cette commission…
    src: 4b7e08
  mechanism:
    value: >
      Le personnel enregistre la position d'un électeur…
    src: c1d930
```

**The fingerprint is what keeps translations honest.** When the English `remit` changes, its hash no longer matches `src`, and that string is marked stale automatically. No translator has to notice; no maintainer has to track it.

**A stale translation is never shown.** The site falls back to English with a visible marker — *not yet translated into French* — rather than displaying an outdated version. This is not fussiness. Several strings carry deadlines, submission windows and legal thresholds, and a French reader acting on last year's deadline is worse off than one who had to read English.

**Three tiers, translated in this order**, because the cost of being wrong differs sharply:

| Tier | What | Why first |
| --- | --- | --- |
| 1 | Interface: buttons, labels, enum names, the filing format | ~200 strings, translated once, and they make the whole site usable in a language even with untranslated records |
| 2 | Records for that language's own jurisdictions | A French speaker needs the French and EU bodies, not the Texan ones |
| 3 | Everything else | Nice to have; never blocks a launch |

**Language stewards never touch facts.** Their files contain no URLs, no dates, no enum values. The worst a mistranslation can do is read badly — it cannot send someone to the wrong address.

Machine translation is allowed as a first pass and must be labelled as such in the file (`machine: true`), so a reader knows what they are getting and a human steward knows what still needs review.

**A language goes public only when its steward approves it.** `i18n/<lang>/status.yml` records the tier reached and who reviewed it. Until tier 1 is approved, that language's pages build with `noindex` and are not linked from the language switcher — reachable for reviewers, invisible to search and to newcomers.

## Resources: media, explainers and open windows

The site also keeps a collection of relevant media and information: what is being reported, argued and decided about AI, collected in one place. It serves the engaged user and the returning one, and gives a newcomer who arrives from a news story somewhere to land that leads to an action rather than to more alarm.

It follows the pattern of the *Markets Panic* resources desk (`stockspanic` project: a registry of watched sources, automatic collection of metadata only, hand-picked featured items, an original prompt on every item, and articles that hand off to the tool), adapted to a static site with volunteer review.

**Three kinds of resource, one folder each.**

| Kind | What it is | Who writes it | Lifetime |
| --- | --- | --- | --- |
| Media | Someone else's article, video, podcast or report — title, link, publisher, date, language. Never the body | Collected automatically from `sources/`, or submitted by anyone | Permanent; leaves the front page after 60 days |
| Explainer | Our own short article — how a committee works, what a consultation is, what happened to a bill | Editors and domain stewards | Permanent; reviewed yearly |
| Window | A dated, closing opportunity: an open consultation, a hearing, a bill before markup | Geography and domain stewards | Expires on `closes_on`, then archived automatically |

**Every resource points at an action.** This is what separates the collection from a news feed. Each item carries `topics`, and may carry `bodies` and `orgs` — ids of records in the directory — plus an original `prompt`: one neutral question that turns the story into a decision (*"This article is about testing requirements. Who in your country could require them?"*). The item page ends with a link that opens the path with the outcome and recipient already chosen. An explainer or window with no action link fails validation.

**The source registry is where neutrality is decided.** `resources/sources/<geo>/<id>.yml` names a publisher or channel, its kind, its feed URL if it has one, its language, and its `perspective` from the same vocabulary as organisations (safety advocacy, industry, academic, journalism, government, civil liberties). A source enters the registry only with a declared perspective and a maintainer's approval. The freshness page shows the balance of perspectives, so a collection that has drifted towards one side is visible to everyone.

```yaml
# content/resources/sources/global/ai-frontiers.yml
id: ai-frontiers
facts:
  kind: article                 # article | video | podcast | report | newsletter
  site_url: https://...
  feed_url: https://...         # optional; without it the source is manual-only
  language: en
  perspective: journalism
  auto_publish: false           # true only after a trial period with no rejections
meta:
  added_by: "@editor-handle"
  verified_on: 2026-09-22
```

```yaml
# content/resources/media/2026/09/ai-frontiers-lab-channels-review.yml
id: ai-frontiers-lab-channels-review
facts:
  source: ai-frontiers
  url: https://...
  kind: article
  language: en                  # the title stays in its original language
  published_at: 2026-09-18
  topics: [frontier-ai, whistleblowing]
  bodies: []
  channels: [us-anthropic, us-openai]
strings:
  title: How AI labs handle public safety reports   # as published; not translated
  prompt: >
    If you saw a model do something dangerous, which of these channels would
    actually reach someone who can act?
meta:
  status: published             # pending | published | rejected
  featured: false
  added_by: ingest              # ingest | "@handle"
```

**Collection is a scheduled job, not a server.** A GitHub Action runs `scripts/ingest-resources.mjs` twice a day. It reads every source with a feed, parses RSS/Atom, keeps title, link, publisher, date and language, drops duplicates by a hash of the canonical URL, and writes one file per new item. All new items go into a single rolling pull request, *Resource intake*. Items from `auto_publish` sources arrive as `published` and the PR merges itself when checks pass; anything else arrives as `pending` and waits for an editor. A feed that fails leaves earlier items untouched and is reported in the PR. Featured items are ordinary files with `featured: true`, so they stay visible after the feed moves on.

**What is never stored or shown**, following the brief's constraint of no tracking and no consent wall: article bodies, transcripts, third-party embeds, and hotlinked thumbnails. Each would load a third party's code or image into the reader's browser. A media item is a title, a publisher, a date, our prompt and a link out.

**Anyone can suggest an item.** A *suggest a resource* form opens a pre-filled issue; an editor turns it into a file. No account on the site, no posting, no comments — visitor discussion would need a server and a moderation queue, and is out of scope unless decided otherwise.

**The collection obeys the brief's rules.** The newcomer's front door never shows it. It has no counters, no urgency bars, no *"breaking"* label. A headline written to alarm is balanced by a prompt written to steady. Explainers state positions as the positions of whoever holds them.

**Translation.** Media titles stay in their original language, labelled with it, and readers can filter by language. Prompts, explainers and windows are translatable strings like any other and follow the same hash-and-fallback rules. Explainers are tier 2 for their own jurisdiction's language and tier 3 otherwise.

## Freshness as a field, not a hope

Every record carries `review_by`. When it passes, the system acts — nobody has to notice.

Three things happen automatically on the day a record goes overdue: it appears in its steward's queue, the site marks it visibly as unverified since its date, and if it stays overdue past a grace period the contested fields are hidden rather than shown as current.

That last one is the important one. **A directory that quietly serves stale contacts is worse than one that admits a gap**, because the user discovers the error only after they have spent their effort.

Review cycles differ by what decays:

| Content | Cycle | Why |
| --- | --- | --- |
| Named seat-holders | 90 days | Elections, reshuffles, annual committee reconstitutions; EU rapporteurs change per file |
| Windows | Until `closes_on`, re-checked every 14 days | A window exists only while its door is open; expiry is the point |
| Media items | Never reviewed; link-checked weekly | They record what was published, not a current fact |
| Explainers | 365 days | They describe how institutions work, which changes slowly |
| Resource sources | 180 days | Feeds move and publishers change direction |
| Contact routes | 180 days | Forms and addresses move, but slowly |
| Remits and powers | 365 days | Institutional structure is the stable layer — which is why the design leans on it |
| Guides and the filing format | 365 days | Changes only when practice does |

**Every record shows its date in the interface**, beside the fact it applies to, with the institution's own live page one tap away. When a name is wrong the structure still works, because the reader can click through and get the right one. Designing for graceful decay is cheaper than trying to prevent it, and it is the only honest posture for a volunteer project.

**A public freshness page** — what percentage of records are current, per country, per domain — does two jobs: it tells readers how much to trust what they are reading, and it shows stewards where the project is thin without anyone having to chase.

## What runs before a stranger's change can merge

Automated checks are what make an open contribution model survivable. Each one below catches a failure this project would otherwise ship.

| Check | Catches |
| --- | --- |
| Schema validation | Invented fields, missing `sources`, an enum that is not in the list, a malformed date |
| Link check on changed records | A URL that 404s, redirects somewhere else, or was mistyped |
| Verification-state rule | A route marked `verified` whose `sources` is empty — the single most damaging error possible here |
| Date sanity | `verified_on` in the future, `review_by` before `verified_on` |
| Translation integrity | A translated file containing a URL or an enum value; a `src` hash that does not match any English string |
| Orphan check | A translation whose English record was deleted or renamed |
| Duplicate id | Two records claiming the same `id` |
| Reference integrity | A resource, window or explainer naming a body, channel, org or topic id that does not exist |
| Resource rules | An explainer or window with no action link; a window without `closes_on`; a media item holding body text or an embed |
| Balance report (resources) | Not a blocker — posted on the intake PR: how today's items split by source perspective |
| Preview build | A rendered preview of the changed records, linked in the pull request, so a reviewer sees the result rather than the diff |

**Three states, not two.** `verified` means someone opened the page and saw the route. `unverified` means it is cited but unconfirmed — a lead, not an address. `unchecked` means nobody has looked. The schema requires one explicitly; there is no default, because a default is how everything silently becomes "verified".

**The link check is the project's core promise.** Everything else here is hygiene; this is the thing the site exists to get right. It runs on every change and weekly across the whole corpus, opening an issue per failure, assigned by `CODEOWNERS` to whoever holds that path.

**No invented URLs or addresses. Ever.** This is a rule in the contributor guide, enforced by the sources requirement, and the one thing a reviewer should reject on sight. Where a route cannot be found, the record says so — `public_input: none` is a finding, not a gap.

## For volunteers who do not use git

Most people who know an Indian parliamentary committee or speak Portuguese have never opened a pull request. The structure above is worthless if it only admits developers.

Three paths in, all landing in the same place:

**A web editor over the repository.** A CMS such as Decap or TinaCMS reads the schemas and renders a form: dropdowns for enums, date pickers for dates, a text area for prose. The volunteer never sees YAML. On save it opens a pull request in their name, and the same checks run. This is the main path, and the schemas are what make the form generate itself.

**A report button on every record.** The highest-value contribution is someone telling you a link is dead, and it should take ten seconds. Each record on the site carries a small *something wrong here?* control that opens a pre-filled issue — record id, the field, what they saw. No account beyond one on the host, no format to learn. Most of these will come from ordinary readers rather than volunteers, and they are worth more than most deliberate edits.

**A translation interface.** Weblate or Crowdin, pointed at `i18n/`, gives translators side-by-side English and target, marks stale strings from the `src` hashes, and commits back. Translators never see the repository at all.

**A new steward's first hour** is covered in the next section.

## The volunteer lifecycle

The structure above decides what a volunteer can touch. This section decides how people arrive, grow, and leave without the project depending on any one of them.

**The ladder.** Each step is earned by the previous one and none needs a meeting.

| Step | How someone gets there | What they can do |
| --- | --- | --- |
| Reader | Arrives | Report a problem on any record; suggest a resource |
| Contributor | Opens any pull request or CMS edit | Propose changes anywhere in `content/` or `i18n/`; reviewed by the path owners |
| Steward or editor | Three merged contributions in an area, then invited by a maintainer or an existing steward | Owns a path in `CODEOWNERS`; is the first reviewer for it |
| Maintainer | Sustained stewardship and an invitation from the existing maintainers | Schemas, site, scripts, registry, `CODEOWNERS` |

**Permissions follow teams, not people.** `CODEOWNERS` names GitHub teams (`@geo-us-ca`, `@lang-fr`), and people join or leave teams. Handing over a country is a change of team membership, not an edit to every file.

**Every path has at least two owners** — its geography team and its domain team — so no area stops when one person does.

**A steward's first hour**, which is the thing that decides whether they stay: a one-page charter naming their paths, a list of their overdue records, one worked example record in their area, and a first task small enough to finish — usually *re-verify these five links*. Not a handbook.

**Stepping back is normal and cheap.** A steward leaves by asking to be removed from a team; their paths fall back to the other owner automatically. No explanation is owed.

**Inactivity is handled by the system, not by chasing.** When a steward has had no activity for 60 days *and* their paths hold overdue records, the weekly freshness job opens one polite issue asking whether they want to continue. With no reply in 30 days they move to an alumni team, keep their credit, and their paths revert to the co-owner. Nobody has to have the awkward conversation.

**Volunteer privacy.** A handle is enough; real names are never required. `volunteers/<handle>.yml` is optional and holds only what the project needs: paths, languages, and declared conflicts of interest. A public contributors page lists people who opt in, and nothing more — no counts, no leaderboards, no badges, for the same reason the brief refuses them for users.

**One place to talk.** GitHub Discussions, with one category per role. The weekly freshness report is posted there, so every steward sees the state of the whole project without being asked to look.

**Safety of volunteers.** Some stewards will work on countries where engaging with AI policy carries risk. Pseudonymity is supported throughout; commits can use a GitHub no-reply address; and no volunteer's location is ever inferred or published from the paths they hold.

## Build and hosting

A static site generated from the content files, one build per language, rebuilt on every merge. No database, no server, no runtime dependency on anything.

The reasons are practical rather than ideological. A static site survives a traffic spike from a viral news story without anyone being awake. It costs nothing to host. It can be forked, mirrored or archived by anyone who worries the project might disappear — which, for a civic resource, is a feature. And it has almost no attack surface, which matters when the whole product is a set of addresses people will trust and act on.

```
content/*.yml  +  i18n/<lang>/*.yml
        ↓  build
   /en/  /fr/  /es/  …        one static tree per language
   /api/bodies.json           the same data, published for reuse
```

**Publish the data as well as the site.** The JSON that builds the pages should be downloadable. Other people should be able to build on this without scraping it, and a project that makes itself reusable gets contributions it would not otherwise see.

**Language by URL prefix**, not by browser detection or a cookie. `/fr/bodies/us-senate-commerce` is linkable, shareable and indexable; a language chosen invisibly is none of those.

**Every route has a URL**, including a chosen outcome and jurisdiction. Someone should be able to send a friend the page for *testifying on a California AI bill* and have it open there, not at the front door.

Running cost at this scale is effectively zero — static hosting free tiers cover it. The real cost is the maintainer hours the CI is designed to reduce.

## Roles and the rules that decide rejections

Five roles, deliberately few. A volunteer project dies of process before it dies of neglect.

| Role | Holds | Can merge |
| --- | --- | --- |
| Geography steward | One country or sub-national region | Their own paths, with a second review |
| Domain steward | One subject across all countries | Their own paths, with a second review |
| Language steward | One language's `i18n/` tree | Their own language |
| Editor | `content/resources/` — approves pending items, writes prompts and explainers, picks featured items | Resources, with a second review for explainers |
| Maintainer | `schema/`, `site/`, `scripts/`, `CODEOWNERS`, the source registry | Anything |

Two approvals to merge a content change, one of which must be an owner of that path. A maintainer alone can merge a link fix.

**The editorial rules — the things a reviewer rejects on:**

- **A URL or address nobody opened.** Not negotiable, and the most common failure in good-faith contributions.
- **A route marked verified without a source.** See above.
- **Prose in a field that should be an enum.** It breaks routing in every language at once.
- **An advocacy position stated as fact.** The project's distinguishing claim is that it has no ask of its own; an organisation's position is recorded as *theirs*, plainly, and never adopted.
- **Softening or sharpening an organisation's ask.** Record what they want in their own terms, including when it is unpopular and including when it is one you agree with.
- **An overstated channel.** Saying a body can compel when it can only advise is the error that destroys the most trust per instance, because the user discovers it at the worst moment.

**Conflicts of interest are declared, not prohibited.** Someone who works at a listed organisation is often the best-informed volunteer available. They declare it in their profile and do not review their own employer's record.

**Decided: Resources are editorial; everything else is open.** Anyone can suggest a media item, but only editors publish, and only maintainers add sources. Windows are written by the geography and domain stewards who know the institution, and reviewed by an editor. The collection is the surface most capable of turning into advocacy, so it carries the tightest review.

## What to do first

The phased, testable version of this list is `docs/implementation-plan.md`.

The content already exists as JSON in `input/data/`. The work is converting it into the per-record structure, and most of that is scriptable.

1. **Write the schemas and vocabularies** — `route`, `body`, `channel`, `org` first; the Resources schemas once the directory is migrated. They are the contract everything else depends on, and writing them will surface fields the current data conflates.
2. **Split the JSON into files.** 229 institutions, 144 committees, 50 organisations become individual records under `content/`, with the existing verification states carried across as the three-state field.
3. **Separate facts from strings** in the split. Doing it now is a script; doing it after translation starts is a migration.
4. **Set `review_by` on every record** from the cycles above, dated from each record's existing `verified_on`. A third of them will be overdue immediately — that is accurate, and better seen than hidden.
5. **Stand up CI**: schema validation and the link check. Nothing else until these two run, because they are what let you open the repository.
6. **Write `CODEOWNERS`** with the maintainer owning everything, then hand paths over as stewards arrive.
7. **Build one language** end to end and publish `/api/bodies.json` alongside.

**Then, and only then, recruit.** A volunteer who arrives before the checks exist has to be supervised by hand, which is how maintainers burn out in the first month.

**What can wait:** the web CMS (the first stewards will manage with a text editor and the worked example), the translation platform (until there is a second language), and the freshness dashboard (a generated markdown list is enough for the first year).

**Decided: Resources live in this repository**, under `content/resources/`. Collection is batched into one rolling pull request twice a day, so the churn is at most two merges a day, and keeping everything together is what lets a resource link to a body id and have the link checked. Revisit if intake passes about fifty items a day; the folder is self-contained and can move to its own repository without changing its format.
