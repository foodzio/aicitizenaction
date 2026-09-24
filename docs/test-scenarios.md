# End-to-end test scenarios

*Created 2026-09-23T01:19:23Z. Browser scenarios for the built site, run against `npx serve dist -l 4321` in Chrome for Testing (CDP port from `.projstuff`, started with `/browser-init`). Phone width 390×844 unless stated. Each scenario: steps, then what must be true. Record PASS / FAIL with evidence (what you saw).*

Base URL: `http://localhost:4321`

## A. The door

**A1 — Door is for newcomers.** Open `/`.
- Redirects to `/en/`. One `h1` "What do you want to happen with AI?".
- Six answers, each a link to `/en/start/<outcome>/`. No institution names, no numbers.
- Text "You don't need to be an expert" and "Three steps" visible without scrolling.
- The header has no "Resources" link on this page (it does on other pages).
- No horizontal scroll at 390 px.

**A2 — Door in dark mode.** Emulate `prefers-color-scheme: dark`, open `/en/`.
- Background is dark, text readable; outcome cards visible; no white flashes of unstyled content.

## B. Guided path — "A law or rule about AI"

**B1 — United States, full journey.** From `/en/`, click "A law or rule about AI".
- Step 1 shows "Where do you live?" with a country select. Progress shows step 1 of 4.
- Choose "United States", click "Show who can act".
- Step 2: the first card is the **Senate Committee on Commerce, Science, and Transportation**, showing a chair name with a "Checked" date, a verification badge, and a link "Official, up-to-date list of members". Up to two alternatives listed.
- URL contains `where=us` and `step=2`.
- Click "Write to them". Step 3: a "Why does this matter to you?" box above an editable message.
- Type "My son's school uses an AI tutor and nobody checked it." in the own-words box: the message updates to include that sentence; the salutation contains no bracketed text like "(committee id".
- "Send it to" shows an address or link with a verification badge.
- Click "Copy message": button briefly says "Copied". `window.aicaEvents` contains a `draft_copied` event with `own_words: true`.
- Click the done button: step 4 "That's it — you've done it." with a share field containing the path URL for the same place at step 2 (e.g. `/en/start/law/?where=us&step=2`), so a friend starts where it matters.

**B2 — US state.** Step 1: United States, then state "California". Step 2 shows a California body first (e.g. Assembly Committee on Privacy and Consumer Protection). URL has `sub=ca`.

**B3 — Choose an alternative.** On B1 step 2, click the first alternative. It becomes the primary card; URL gains `to=<id>`. Go to step 3: the salutation names the newly chosen body.

**B4 — Deep link mid-path.** Open `/en/start/law/?where=gb&step=3` directly. Opens at step 3 with a UK recipient (House of Commons committee) in the draft.

**B5 — Back button.** From step 3, press the in-page "Back": returns to step 2. Browser back also moves to the previous step.

**B6 — Honest floor, EU member.** Choose "Sweden". Step 2 shows a notice that no national body has this power and the EU institutions do; recipients are European Parliament/Commission bodies.

**B7 — Honest floor, elsewhere.** Choose "Somewhere else". Step 2 shows the international-bodies notice.

**B8 — Own words left empty.** Go to step 3 without typing. The draft contains the placeholder "[Your own words — why this matters to you]". Copying records `own_words: false`.

**B9 — Download.** Step 3 "Download as a text file" triggers a download named `message.txt` (or at least records `draft_downloaded` in `window.aicaEvents`).

## C. Other outcomes

**C1 — Harm (US).** `/en/start/harm/`, United States → first recipient is the Federal Trade Commission.

**C2 — Fix: which company.** `/en/start/fix/`. Step 1 asks "Which company's product was it?" with a list of companies (Anthropic, OpenAI, Google…). Choose OpenAI → step 2 primary card is OpenAI; alternatives are independent channels (e.g. AI Incident Database). Choosing "I'm not sure" shows independent channels only.

**C3 — Record (public consultation).** `/en/start/record/`, United States → at least one recipient; the draft starts "Submission to".

**C4 — Join.** `/en/start/join/`, United States → three organisations with **different** perspectives; none is an industry lobby.

**C5 — Insider stop.** `/en/start/insider/` → "Please stop here, and get legal advice first". No country select, no recipients, no draft.

## D. Directory and records

**D1 — Search.** `/en/directory/`: type "Ofcom" → the results count drops and Ofcom appears. URL gains `q=Ofcom`.

**D2 — Filters.** Choose type "Places to report" and place "United States" → only US channels; tick "Only records with a verified route" → count does not increase.

**D3 — Record page.** Open `/en/bodies/us-senate-committee-commerce-2/`: named seats with dates; membership link with badge; routes with Verified/Unverified/Unchecked badges and dates; "Last checked" and "Next check due"; a "Something wrong here?" link to a GitHub issue form with the record id prefilled.

**D4 — Overdue and unsourced records.** `/en/bodies/in-indiaai-mission/` shows a "Due for a re-check since" notice. `/en/bodies/cl-chile-artificial-intelligence-bill-ministry-science/` shows the "No source yet" notice.

**D5 — Unverified route labelled.** Find any record with an Unverified route (e.g. `/en/bodies/in-indiaai-safety-institute/`): the badge says "Unverified" and hovering explains it is a lead to confirm.

## E. Resources

**E1 — Collection.** `/en/resources/`: the "Arrived here worried?" line links to `/en/`; open windows listed with closing dates (FDA docket, Colorado rules); two explainers; media list shows publisher, perspective, type and date for each item. Only 8 media items (published ones) are listed.

**E2 — Filters.** Topic filter "Frontier and general-purpose AI" reduces the media list; Type "Newsletter" shows only newsletters.

**E3 — Media item.** Open a media item: title, publisher, perspective, date, a "Read it at …" external link, a neutral question under "Act on this", and a "Start here" button that goes into the path (URL under `/en/start/`).

**E4 — Window.** Open the Colorado window: dates, summary, a "Start here" button into `/en/start/record/` with `where=us&sub=co`, and a link to the official form.

**E5 — Explainer.** Open "Why write to a committee…": body text, sources with dates, "Start here" button into the path.

**E6 — Pending items hidden.** `/en/resources/media/algorithmwatch-statement/` (a pending item) returns a 404 / not found.

## F. Language

**F1 — French pilot.** `/fr/`: page is in French ("Que voulez-vous qu'il se passe ?"), shows the machine-translation notice, and has `<meta name="robots" content="noindex">`. `<html lang="fr">`.

**F2 — French path.** `/fr/start/law/?where=fr&step=3`: interface in French; the draft template is French ("Madame, Monsieur"); record prose falls back to English where not translated.

**F3 — English is never linked to French** while French is unapproved: no `/fr/` links on `/en/` pages; English pages have no noindex.

## G. Other pages and hygiene

**G1 — How it works.** `/en/about/`: four-step flow diagram, the three verification labels explained, "Whose side are we on?", links to `/api/*.json`.

**G2 — Freshness.** `/en/freshness/`: overall percentage, section and country tables, Resources perspective balance, translations line.

**G3 — Data API.** `/api/bodies.json` returns JSON with `count` 250; `/api/orgs.json` 99; `/api/channels.json` 74; `/version.json` has a version.

**G4 — No third-party requests.** On `/en/`, `/en/start/law/?where=us&step=2` and `/en/resources/`, every network request goes to localhost.

**G5 — Console clean.** No console errors on any page visited.

**G6 — Keyboard.** On `/en/start/law/`: Tab reaches the skip link first; the country select, the button and later the textareas are reachable and show a visible focus ring; moving to a new step puts focus on its heading.

**G7 — Desktop layout.** At 1280×800, the door, a record page and the Resources page have no overflow and readable line lengths.

## H. Anonymous counting (run against `node server.mjs`, not `serve`)

**H1 — Totals only.** Open `/en/`, then `/en/start/law/?where=us&step=3`, type own words, click "Copy message". `/api/counts` shows `door|none`, `step_3|law`, `draft_copied|law`, `own_words|law` and one `time_*` bucket. `document.cookie` is empty; `localStorage` and `sessionStorage` are empty; the words typed appear nowhere in the network request body (only `{"e":…,"o":…}`).
