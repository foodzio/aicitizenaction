#!/usr/bin/env node
// Inactivity handled by the system, not by chasing (docs/content-architecture.md,
// "The volunteer lifecycle"). For each owner in CODEOWNERS:
//   - no activity for 60 days AND their paths hold overdue records → open one polite issue;
//   - that issue open 30 more days with no reply from them → open a maintainer issue to move
//     them to the alumni team and hand their paths to the co-owner.
// Membership changes stay a maintainer action; this script only opens issues.
//
//   node scripts/inactivity.mjs [--dry-run] [--quiet-days 60] [--grace-days 30]
// Needs the GitHub CLI with GH_TOKEN; --dry-run prints what it would open.
import { execFileSync } from 'node:child_process';
import { loadContent } from './lib/content.mjs';
import { loadCodeowners, ownersOf } from './lib/codeowners.mjs';
import { recordState } from './lib/freshness.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? Number(args[i + 1]) : d; };
const DRY = args.includes('--dry-run');
const QUIET = opt('--quiet-days', 60), GRACE = opt('--grace-days', 30);
const gh = (...a) => JSON.parse(execFileSync('gh', a, { encoding: 'utf8' }) || 'null');
const daysSince = iso => iso ? (Date.now() - new Date(iso).getTime()) / 864e5 : Infinity;

/** Pure decision, so it can be tested without GitHub. */
export function decide({ owner, lastActivity, overdueCount, openCheckIn, checkInOpenedAt, repliedSince }) {
  if (openCheckIn) {
    if (!repliedSince && daysSince(checkInOpenedAt) > GRACE) return 'propose-alumni';
    return 'wait';
  }
  if (daysSince(lastActivity) > QUIET && overdueCount > 0) return 'check-in';
  return 'none';
}

export function ownersWithOverdue(now = new Date().toISOString().slice(0, 10)) {
  const rules = loadCodeowners();
  const out = new Map();
  for (const r of loadContent().filter(r => ['bodies', 'channels', 'orgs'].includes(r._section))) {
    if (recordState(r, now) !== 'overdue') continue;
    for (const o of ownersOf(r._path, rules)) out.set(o, (out.get(o) ?? 0) + 1);
  }
  // The catch-all owner is the maintainer, who is not checked in on.
  const maintainers = new Set(rules.filter(r => r.pattern === '*').flatMap(r => r.owners));
  const all = new Set(rules.flatMap(r => r.owners).filter(o => !maintainers.has(o)));
  return [...all].map(o => ({ owner: o, overdueCount: out.get(o) ?? 0 }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const repo = DRY ? 'OWNER/REPO' : gh('repo', 'view', '--json', 'nameWithOwner').nameWithOwner;
  for (const { owner, overdueCount } of ownersWithOverdue()) {
    const handle = owner.replace(/^@/, '');
    if (handle.includes('/')) continue;                 // teams: check their members once teams exist
    let lastActivity = null, openCheckIn = null, repliedSince = false;
    if (!DRY) {
      const commits = gh('api', `repos/${repo}/commits?author=${handle}&per_page=1`);
      lastActivity = commits?.[0]?.commit?.author?.date ?? null;
      const issues = gh('issue', 'list', '--label', 'steward-check-in', '--state', 'open', '--search', `${handle} in:title`, '--json', 'number,createdAt,comments');
      openCheckIn = issues?.[0] ?? null;
      repliedSince = !!openCheckIn?.comments?.some(c => c.author?.login === handle);
    }
    const action = decide({ owner, lastActivity, overdueCount, openCheckIn, checkInOpenedAt: openCheckIn?.createdAt, repliedSince });
    const title = action === 'check-in' ? `Checking in — ${handle}` : action === 'propose-alumni' ? `Hand over ${handle}'s paths` : null;
    if (!title) { console.log(`${owner}: ${action}`); continue; }
    const body = action === 'check-in'
      ? `Hi @${handle} — no pressure at all. Your paths have ${overdueCount} records past their review date, and we haven't seen you here for a while. Would you like to keep looking after them? If you'd rather step back, just say so — your credit stays, and the co-owner picks them up. Run \`node scripts/charter.mjs @${handle}\` to see your queue.`
      : `@${handle} hasn't replied to the check-in for ${GRACE} days. Maintainers: move them to the alumni team (keeping their credit) and hand their paths to the co-owner in CODEOWNERS.`;
    if (DRY) { console.log(`--- ${title}\n${body}\n`); continue; }
    execFileSync('gh', ['issue', 'create', '--title', title, '--body', body, '--label', 'steward-check-in']);
    console.log(`${owner}: opened "${title}"`);
  }
}
