# GitHub setup

*Created 2026-09-22T23:49:58Z. Updated 2026-09-23T15:53:13Z: steps 1, 2 and 4 applied; the repository now lives at foodzio/aicitizenaction.*

**Status:** public at `foodzio/aicitizenaction` (organisation `foodzio`), default branch `main`. Team `foodzio/aicitizenaction-maintainers` (admin) owns everything in CODEOWNERS. Branch protection on `main`: 1 approving review, code-owner review, required check `check`, admins may bypass. Labels created, Discussions enabled, Actions allowed to open pull requests.

## 1. Push

```bash
git push -u origin main
git push -u origin research-and-ux-brief
```

## 2. Branch protection — one approval with owner bypass

The plan (phase 2) starts with **one** approval while there is one maintainer, and moves to two (one from a path owner) once there are two or more maintainers. Two required approvals with a single maintainer would lock the owner out.

```bash
gh api -X PUT repos/foodzio/aicitizenaction/branches/main/protection --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["check"] },
  "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 1, "require_code_owner_reviews": true },
  "restrictions": null
}
JSON
```

`enforce_admins: false` is the owner bypass: an admin can merge their own pull request. When a second maintainer joins, raise `required_approving_review_count` to 2.

## 3. The Resources intake bot — a decision for the owner

The plan says the ingest bot is exempt from review for the *Resource intake* pull request, so items from trusted sources publish without a human each day. On a **personal** repository GitHub offers no way to exempt the Actions bot from required reviews; that exemption exists only for organisation repositories (rulesets with bypass actors).

Options:

| Option | Effect |
| --- | --- |
| A. Move the repository to an organisation | Enables teams (CODEOWNERS) and a ruleset bypass for the bot. Recommended before recruiting stewards anyway |
| B. Add a fine-grained personal access token of the owner as the secret `INTAKE_TOKEN` | The intake workflow merges with the owner's admin bypass. A credential decision — not made on the owner's behalf |
| C. Neither | The intake PR waits for the owner's approval every day |

The intake workflow auto-merges only if `INTAKE_TOKEN` is present; otherwise it leaves the PR open for review (option C). Nothing is configured.

## 4. Discussions and labels

```bash
gh repo edit foodzio/aicitizenaction --enable-discussions
gh label create record-report --color FBCA04
gh label create resource-suggestion --color 0E8A16
gh label create volunteer --color 5319E7
gh label create broken-link --color B60205
```

Create one Discussions category per role: Stewards, Editors, Translators, Maintainers, and Announcements (for the weekly freshness report).
