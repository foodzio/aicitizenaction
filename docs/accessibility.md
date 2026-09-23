# Accessibility check

*Run 2026-09-23T00:17:30Z. Chrome for Testing at 390 px width, axe-core 4 (`wcag2a`, `wcag2aa`, `best-practice`), light and dark colour schemes.*

## How to repeat it

1. `npm run build && cp node_modules/axe-core/axe.min.js dist/ && npx serve dist -l 4321`
2. Start the browser with `/browser-init` (CDP port from `.projstuff`).
3. For each page, load it in an iframe, inject `/axe.min.js`, and run `axe.run(document, { runOnly: ['wcag2a','wcag2aa','best-practice'] })`. Repeat with the dark colour scheme emulated.
4. Do not deploy `axe.min.js`: it is copied into `dist/` only for the check (the next build removes it).

## Results

| Page | Light | Dark |
| --- | --- | --- |
| Door `/en/` | 0 violations | 0 |
| Path, step 2 (US, law) | 0 | 0 |
| Path, step 3 (UK, draft) | 0 | 0 |
| Directory | 0 | 0 |
| Record (Senate Commerce) | 0 | 0 |
| Resources | 0 | 0 |
| How it works | 0 | 0 |
| Freshness | 0 after fixes (was: empty table header ×2, scrollable region not focusable ×2) | 0 |
| French door `/fr/` | 0 | — |

## Built in from the start

- Phone-first layout, no horizontal scroll at 390 px; 48 px minimum touch targets on buttons and inputs.
- Skip link; one `h1` per page; focus moves to each path step's heading; visible focus ring.
- Verification labels are text, not colour alone; badges carry a title explaining the state.
- `lang` on the page and on any fallback-English passage inside a translated page, and on media titles in their original language.
- Reduced-motion respected; no animation carries meaning.

## Not yet checked

- Screen-reader walkthrough of the path (VoiceOver, TalkBack) with a real user.
- Zoom to 200% and 400% on desktop.
- The five-person usability test from the brief (phase A).
