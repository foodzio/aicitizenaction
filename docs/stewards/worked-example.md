# Worked example — re-checking one record

*Created 2026-09-23T00:10:13Z. For new stewards: your first hour. Read this, then run your charter and do the first task it gives you.*

We will re-check the US Senate Commerce Committee: `content/bodies/us/federal/us-senate-committee-commerce-2.yml`.

## 1. Read the record

```yaml
id: us-senate-committee-commerce-2        # never change an id; links and translations depend on it
type: seat                                # a body with named seats (schema/vocab/record-types.yml)
geo:
  country: us                             # must match the folder: content/bodies/us/federal/
  sub: federal
facts:
  routes:
    - id: membership                      # the institution's own live member list — first-class on the site
      type: membership
      value: https://www.commerce.senate.gov/about/members
      verified: true                      # true = someone opened this page and saw the list
      verified_on: 2026-09-22             # the day they did
    - id: public-route
      type: submission
      value: https://www.commerce.senate.gov/
      verified: true
      verified_on: 2026-09-22
  seats:
    - role: chair
      name: Ted Cruz
      party: R
      region: TX
      verified_on: 2026-09-22             # people change fastest: 90-day cycle
strings:                                  # prose — translators work here, and never see a URL
  name: Senate Committee on Commerce, Science, and Transportation
  ai_jurisdiction: "…NOT here: copyright, liability … (Judiciary) …"
meta:
  verified_on: 2026-09-22                 # when the record as a whole was last checked
  review_by: 2026-12-21                   # when it is next due; the charter and site use this
  sources:                                # pages someone actually opened
    - url: https://www.commerce.senate.gov/about/members
      checked: 2026-09-22
```

## 2. Check it against the institution's own site

Open the membership URL. Is the chair still Ted Cruz? Is the ranking member still Maria Cantwell? Open the submission route: does it still work, and is it still the committee's public way in?

Never take a name, address or URL from a news article, a search result, or a chatbot. Only from the institution's own pages.

## 3. Update what you checked — and only that

If everything still holds:

```yaml
    - role: chair
      name: Ted Cruz
      verified_on: 2026-12-19             # today
meta:
  verified_on: 2026-12-19
  review_by: 2027-03-19                   # + 90 days, because this record has named seats
```

If the chair has changed, replace the name and party, and set today's date. If a route has moved, put the new URL in `value`, keep `verified: true` only if you saw it, and set `verified_on` to today.

If a route has gone and you cannot find a replacement: `value: null`, `verified: false`, and a note in `strings.routes.<id>.note` saying what you looked for and when. A recorded gap is a finding, not a failure.

## 4. Check and submit

```bash
npm run check
node scripts/check-links.mjs --files content/bodies/us/federal/us-senate-committee-commerce-2.yml
```

Open a pull request. Tick the checklist honestly. That's the whole job.

## What not to do

- Don't rewrite `strings` to sound better. Improving wording is fine; changing meaning — especially an organisation's ask or a body's powers — needs a source.
- Don't mark anything `verified: true` you did not open yourself today.
- Don't delete a record because it looks stale. Mark it, and say what you found.
