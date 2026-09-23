# Phase A — five-person test kit

*Created 2026-09-23T00:18:10Z. The test the brief asks for before the path is finalised (`docs/ux-brief.md`, "What to test with users"). Everything needed to run it except the people. Findings go in `docs/validation-findings.md`.*

## Before you start

- **Who:** five people who match the primary user — not technical, no policy background, no affiliation, worried about AI after something they read or watched. Not colleagues, not people who know the project.
- **What they use:** their own phone, the built site (`npm run build && npx serve dist -l 4321`, or a private preview URL — ask before deploying anywhere).
- **Where they start:** send them the door link as if a friend had shared it. Do not show them around.
- **Open decisions still to settle first:** brief questions 1–4. The current build assumes: location is asked on step 1 (Q1); cross-border drafts are allowed and flagged (Q2); "Join" is one of six equal answers (Q3); industry lobbying is reference-only (Q4). Change `content/guides/global/outcomes.yml` before testing if you decide otherwise.

## The script (about 20 minutes per person)

1. **Set-up (1 min).** "We're testing the website, not you. There are no wrong answers. Please think aloud. I won't help unless you're completely stuck."
2. **Prompt (read exactly).** "Imagine you've just read something about AI that worried you, and a friend sent you this link. Do whatever you'd naturally do."
3. **Watch silently.** Note the time at each step. Do not explain anything.
4. **At the door — after about 10 seconds, ask:** "What is this site for? Who is it for?"
5. **On the "who can act" screen, ask:** "Why do you think it suggested this one?" (Do not prompt further.)
6. **On the message screen, watch:** Do they type in the "Why does this matter to you?" box, or skip it?
7. **End:** Did they copy or download? Ask: "Would you send it? Why or why not?"
8. **Last question:** "Was there any moment you felt like leaving?"

## What to record, per person

| # | Measure | How |
| --- | --- | --- |
| 1 | Understood within ~10 s it is for them | Their answer to step 4, verbatim |
| 2 | Could say why the recipient was chosen, unprompted | Their answer to step 5, verbatim — does it mention the body's power or remit? |
| 3 | Wrote their own words | Yes / no; what they wrote (with permission) |
| 4 | Reached a copied or downloaded draft | Yes / no; time from door to copy |
| 5 | Drop-off point | Which step, and what they said |
| 6 | Would send it | Yes / no / maybe, and why |
| 7 | Moments of confusion | Quotes, with the screen |

The brief expects #3 to be the one most likely to fail, and it is the one that matters most.

## Reading the results

- Three or more people fail #1 → the door's wording or look is wrong. Revise before anything else.
- Three or more fail #2 → the recipient card is not explaining power and mechanism well enough (screen 2 "is where trust is won or lost").
- Three or more skip #3 → the own-words prompt needs to move, grow, or be explained differently. Do not remove it.
- Time to copy over 15 minutes → content has accreted; cut.

## Findings template (`docs/validation-findings.md`)

```markdown
# Validation findings — <date>

| # | Understood (10 s) | Why this recipient | Own words | Copied | Time | Would send | Dropped at |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | | | | | | | |

## What failed
## What to change in the brief / plan
```
