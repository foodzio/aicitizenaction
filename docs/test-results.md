# Test results

*Browser scenario runs from `docs/test-scenarios.md`, executed by a QA subagent through Playwright MCP against the local build. Latest update 2026-09-23T01:58:15Z.*

## Run 1 — 2026-09-23

30 PASS · 6 PASS-WITH-NOTE · 1 FAIL (37 scenarios executed). Fixes for every failure and note are in the commit after this run; run 2 re-tests them.

## Scenario results — docs/test-scenarios.md

*Run 2026-09-23 (≈01:20–01:55 UTC) against http://localhost:4321 (site version 0.1.15, build 16, commit 73ee071) in Chrome for Testing via Playwright MCP on CDP 9352. Viewport 390×844 unless stated. Screenshots in `tmp/qa/`.*

**Totals: 37 scenarios — 30 PASS, 1 FAIL, 6 PASS-WITH-NOTE.**

| ID | Result | Evidence |
| --- | --- | --- |
| A1 | PASS | `/` redirected to `/en/`. One h1 "What do you want to happen?". Six outcome links: /en/start/law, harm, fix, record, join, insider (plus a separate "Browse the full directory" link below). No digits anywhere in main text, and no institution names. "You don't need to be an expert" (bottom 407px) and "Three steps…" (bottom 484px) are both above the 844px fold. Header links: Start, Directory, How it works (no Resources). The record page header does include Resources. scrollWidth = clientWidth (375), so no horizontal scroll. `A1-door.png` |
| A2 | PASS | With dark scheme: body bg rgb(17,22,28), text rgb(232,228,220), cards bg rgb(23,30,38) with a visible border. The only stylesheet is a blocking `<link rel=stylesheet>` in head, so there's no unstyled flash. Colour scheme reset to null afterwards. `A2-dark.png` |
| B1 | **FAIL** | Everything passes except the final bullet. Step 1: "Where do you live?" select, and progress item 1 has aria-current="step". Step 2: URL `?where=us&step=2`. Primary card is Senate Committee on Commerce, Science, and Transportation, showing "Ted Cruz (chair…) · Checked 2026-09-22", a "Verified · 2026-09-22" badge and an "Official, up-to-date list of members" link. Two alternatives. Step 3: "Why does this matter to you?" box sits above the message. Typing updates the message. Salutation is "Dear Ted Cruz, Chair, Senate Committee on…" with no bracketed id. "Send it to" shows a URL with a Verified badge. Copy changed the label to "Copied" 24 ms after the click and back after about 2 s (seen with a MutationObserver), and recorded `draft_copied` with `own_words:true`. Step 4 heading is correct, **but the share field holds `…/en/start/law/?where=us&step=3` while the current URL is `…?where=us&step=4`.** `B1-step2.png`, `B1-step4.png` |
| B2 | PASS | US + California gives URL `?where=us&sub=ca&step=2`. Primary: Assembly Committee on Privacy and Consumer Protection (California, United States). |
| B3 | PASS | Clicking alternative "Senate Committee on the Judiciary" made it the primary card (Commerce moved into the alternatives). URL gained `to=us-senate-committee-judiciary`. Step 3 salutation: "Dear Chuck Grassley, Chair, Senate Committee on the Judiciary,". |
| B4 | PASS | Opening `/en/start/law/?where=gb&step=3` directly lands on step 3. Draft: "Dear Dame Chi Onwurah MP, Chair, House of Commons Science and Technology Committee,". |
| B5 | PASS-WITH-NOTE | In-page "Back" on step 3 goes to step 2. Browser back moved 4→3 correctly. Note: in-page Back pushes a new history entry rather than going back, so browser back straight after it returns to step 3, not step 1. |
| B6 | PASS | Sweden: notice reads "No body in your country has this power yet. The European Union's institutions do…". Recipients: EP IMCO (primary), LIBE and ITRE. |
| B7 | PASS-WITH-NOTE | "Somewhere else" (`where=zz`) shows the notice "…These international bodies accept messages from anyone…". **Defect:** the only recipient is a method record titled "GENERIC METHOD — locating the AI policy seat and the public route in an arbitrary jurisdiction", labelled "Body with AI jurisdiction and named seats", with no alternatives. Its step 3 draft opens "Dear Not applicable, Chair, GENERIC METHOD — locating the AI policy seat…". `B7-step2.png` |
| B8 | PASS | With nothing typed, the draft contains "[Your own words — why this matters to you]". Copy recorded `draft_copied` with `own_words:false`. |
| B9 | PASS-WITH-NOTE | Playwright got no `download` event (downloads aren't surfaced over this CDP connection). I checked it two other ways: `draft_downloaded` was recorded in `window.aicaEvents`, and a hooked `HTMLAnchorElement.click` showed an anchor with `download="message.txt"` and a `blob:` href. |
| C1 | PASS | Harm + US gives primary Federal Trade Commission (FTC). Alternatives: FDA CDRH, CISA. |
| C2 | PASS | Step 1 asks "Which company's product was it?" with 30 companies, including Anthropic, OpenAI and Google DeepMind. OpenAI gives `?company=us-openai&step=2` with primary OpenAI and alternatives AI Incident Database and The Midas Project (watchdogs). "I'm not sure" shows only AI Incident Database (primary) and The Midas Project. |
| C3 | PASS | Record + US gives one primary and two alternatives. Draft starts "Submission to Ted Cruz, Chair, Senate Committee on Commerce…". Note: the recipient is a committee, not an open consultation window (FDA and Colorado windows exist but aren't offered here). |
| C4 | PASS | Join + US: PauseAI US (safety/pause campaign), EFF (civil liberties) and IEEE-USA AI Policy Committee (professional body). The three perspectives differ and none is an industry lobby. All three are typed "Campaign". |
| C5 | PASS | Shows "Please stop here, and get legal advice first". No select, no textarea, no recipient article anywhere in main. |
| D1 | PASS | Count went from 423 to 5 results. Ofcom appears (2 bodies plus 2 channels). URL `?q=Ofcom`. |
| D2 | PASS | Places to report + United States gives 27 results, all United States (including California entries). Ticking verified-only drops the count to 25. URL `?section=channels&country=us&verified=1`. |
| D3 | PASS | Named seats show dates. "Official, up-to-date list of members" carries a Verified badge. The route has "Verified · 2026-09-22" with a tooltip. Last checked 2026-09-22, Next check due 2026-12-21. "Something wrong here?" links to GitHub `issues/new?template=report-record.yml&record=us-senate-committee-commerce-2&title=Record%3A%20us-senate-committee-commerce-2`. |
| D4 | PASS | in-indiaai-mission shows "Due for a re-check since 2026-09-03." The cl-chile page shows "No source yet — do not rely on this record". |
| D5 | PASS | in-indiaai-safety-institute has an "Unverified" badge with title "Cited by another source, but we couldn't open the page. Treat it as a lead to confirm, not an address to rely on". Verified and Unchecked badges are on the same page. |
| E1 | PASS | "Arrived here worried?… Start here →" links to `/en/`. Open windows: FDA docket (closes 2026-10-19) and Colorado (closes 2026-10-26). Two explainers. Exactly 8 media items, each showing publisher · perspective · type · date. |
| E2 | PASS | Subject "Frontier and general-purpose AI" cuts the list from 8 to 5. Type "Newsletter" leaves 2, both typed Newsletter (AISN #81, Transformer). |
| E3 | PASS | MIT Tech Review item shows title, publisher, perspective Journalism, "Article · 2026-09-18", a "Read it at MIT Technology Review… ↗" external link, and an "Act on this" neutral question. "Start here →" goes to `/en/start/record/`. |
| E4 | PASS-WITH-NOTE | Colorado window shows Opened 2026-08-11, Closes 2026-10-26, a summary, "Start here →" to `/en/start/record/?where=us&sub=co&step=2`, and "Act on this ↗" to the coag.gov official form. Note: the breadcrumb on this **open** window reads "Closed windows". |
| E5 | PASS | "Why write to a committee…" shows body text, "3 min read", sources with dates (2026-09-22) and "Start here →" to `/en/start/law/`. |
| E6 | PASS | `/en/resources/media/algorithmwatch-statement/` returns HTTP 404 with serve's default "404 The requested path could not be found" (the site has no own 404 page). |
| F1 | PASS | `/fr/`: `<html lang="fr">`, `<meta name="robots" content="noindex">`, h1 "Que voulez-vous qu'il se passe ?", and the notice "Traduction automatique, pas encore relue." |
| F2 | PASS-WITH-NOTE | Interface is in French (Étapes, "Pourquoi est-ce important pour vous ?", Copier le message…). Draft uses the French template ("Madame, Monsieur…", "Veuillez agréer…"). Record data is in English ("Chair, European Parliament — Committee on…"). Notes: the salutation reads "Madame, Monsieur Anna Cavazzini, Chair, …", an ungrammatical mix, and the "Public submission route" label is untranslated. |
| F3 | PASS | Crawled all 448 reachable `/en/` pages over HTTP: zero `/fr` hrefs, zero noindex metas, zero broken internal links. |
| G1 | PASS | `/en/about/`: four numbered step cards "How a concern travels" (`G1-flow.png`), Verified/Unverified/Unchecked explained, "Whose side are we on?", and links to /api/bodies.json, channels.json, orgs.json. |
| G2 | PASS | Shows 99% (419/423), a By-section table, a By-place table, Resources perspective balance (sources and published items) and a Translations line ("No translations yet."). |
| G3 | PASS | bodies.json count 250 (250 items). orgs.json 99. channels.json 74. version.json version 0.1.15, build 16. |
| G4 | PASS | Every request goes to localhost:4321. /en/ made 2 requests (html, css). The law step-2 page made 3 (html, css, js). /en/resources/ made 2. |
| G5 | PASS | Swept 36 URLs, all visited pages plus the api and version endpoints, with console and pageerror listeners: 0 errors, 0 warnings, all HTTP 200. The only console errors in the session came from the intentional 404 in E6 (the 404 itself plus favicon.ico). |
| G6 | PASS | First Tab lands on "Skip to content". Tab order continues: header links, ← Back, #where select, state select, "Show who can act". Every focused element has a 3px solid rgb(43,127,255) outline and :focus-visible. Enter on the button gives step 2 with focus on h2 "The best place to send this". Enter on "Write to them" gives step 3 with focus on h2 "Why does this matter to you?". Next Tabs reach both textareas, each with the ring. |
| G7 | PASS-WITH-NOTE | At 1280×800, door, record and resources all have scrollWidth = clientWidth (1280) and no element overflows. Prose on the door and record pages is capped at 608px (~66–72 chars per line). Note: on Resources, the short small-print lines (intro to "Collected from other publishers", explainer summaries) span the full 992px, about 130–140 chars per line. `G7-door.png`, `G7-record.png`, `G7-resources.png` |

### Failures

#### B1 — share field does not contain the current URL
- **URL:** http://localhost:4321/en/start/law/?where=us&step=4
- **Steps:** at 390×844, open `/en/` and click "A law or rule about AI". Choose "United States" and click "Show who can act". Click "Write to them". Optionally type in the own-words box and click "Copy message". Click "That's it →".
- **Expected:** step 4 "That's it — you've done it." with a share field containing the current URL (`http://localhost:4321/en/start/law/?where=us&step=4`).
- **Actual:** the heading is correct, but the share textbox ("Tell one person how you did it — send them this page.") contains `http://localhost:4321/en/start/law/?where=us&step=3`. This may be deliberate, to send the friend to the writing step, but it doesn't match the scenario as written. Either the code or the scenario text needs to change.

### Other defects seen during passing scenarios (not failures under the written criteria)
1. **B7 / "Somewhere else"**: the recipient is a method record, not a body, with draft salutation "Dear Not applicable, Chair, GENERIC METHOD — locating the AI policy seat…". The notice promises "international bodies" but none are listed. URL: `/en/start/law/?where=zz&step=3`.
2. **F2**: the French salutation "Madame, Monsieur Anna Cavazzini, Chair, …" is ungrammatical, and the "Public submission route" label is untranslated.
3. **E4**: the breadcrumb on an open window page says "Closed windows" (`/en/resources/windows/us-co-admt-chatbot-rules-comment/`).
4. **B5**: in-page Back adds a history entry instead of going back, so browser Back afterwards goes forward a step.
5. **G7**: some Resources small-print lines run to ~130–140 characters at 1280px.
6. **E6**: there is no site-branded 404 page; serve's default is shown.
