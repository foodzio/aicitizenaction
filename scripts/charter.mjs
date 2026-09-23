#!/usr/bin/env node
// A steward's charter: the one page that is their whole job description, generated from the
// paths they own. Lists their records, what is overdue, links that failed, and — for editors —
// Resources items waiting for review.
//
//   node scripts/charter.mjs @handle-or-team        paths from CODEOWNERS
//   node scripts/charter.mjs --path content/bodies/ie/
//   options: --link-state .linkcheck/state.json  --limit 25
import { existsSync, readFileSync } from 'node:fs';
import { loadContent } from './lib/content.mjs';
import { ownersOf, loadCodeowners } from './lib/codeowners.mjs';
import { recordState } from './lib/freshness.mjs';

const args = process.argv.slice(2);
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const LIMIT = Number(opt('--limit') ?? 25);

export function charter({ owner, path, linkState, now = new Date().toISOString().slice(0, 10) } = {}) {
  const rules = loadCodeowners();
  const all = loadContent();
  const mine = all.filter(r => path ? r._path.startsWith(path) : ownersOf(r._path, rules).includes(owner));
  const broken = linkState && existsSync(linkState)
    ? new Set(Object.entries(JSON.parse(readFileSync(linkState, 'utf8'))).filter(([, v]) => v.status === 'broken').map(([u]) => u))
    : new Set();
  const directory = mine.filter(r => ['bodies', 'channels', 'orgs'].includes(r._section));
  const overdue = directory.filter(r => recordState(r, now) === 'overdue').sort((a, b) => a.meta.review_by.localeCompare(b.meta.review_by));
  const unsourced = directory.filter(r => r.meta.unsourced);
  const unverified = directory.flatMap(r => r.facts.routes.filter(x => x.verified === false && x.value).map(x => ({ r, x })));
  const failing = directory.flatMap(r => r.facts.routes.filter(x => broken.has(x.value)).map(x => ({ r, x })));
  const pending = mine.filter(r => r._section === 'resources/media' && r.meta.status === 'pending');
  const firstTask = failing.length ? 'Re-verify the failing links below.' : overdue.length ? 'Re-check the five oldest overdue records below.' : unverified.length ? 'Try to confirm five unverified routes below.' : pending.length ? 'Review five pending Resources items.' : 'Nothing is waiting. Read the worked example and pick any record to re-check.';
  return { owner, path, directory, overdue, unsourced, unverified, failing, pending, firstTask, now };
}

export function charterMarkdown(c) {
  const list = (items, fmt) => items.length ? [...items.slice(0, LIMIT).map(fmt), ...(items.length > LIMIT ? [`- …and ${items.length - LIMIT} more`] : [])] : ['- None.'];
  return [
    `# Charter — ${c.owner ?? c.path}`,
    '',
    `*Generated ${c.now}. This page is your whole job: the records below are yours, and this list is your queue. See CONTRIBUTING.md and docs/stewards/worked-example.md.*`,
    '',
    `**Your first task:** ${c.firstTask}`,
    '',
    `You look after ${c.directory.length} records: ${c.overdue.length} overdue, ${c.unsourced.length} unsourced, ${c.unverified.length} unverified routes, ${c.failing.length} failing links${c.pending.length ? `, ${c.pending.length} Resources items waiting for review` : ''}.`,
    '',
    '## Failing links', '', ...list(c.failing, ({ r, x }) => `- \`${r._path}\` — ${x.id}: ${x.value}`), '',
    '## Overdue for review (oldest first)', '', ...list(c.overdue, r => `- \`${r._path}\` — due ${r.meta.review_by}`), '',
    '## Unsourced', '', ...list(c.unsourced, r => `- \`${r._path}\``), '',
    '## Unverified routes — leads to confirm', '', ...list(c.unverified, ({ r, x }) => `- \`${r._path}\` — ${x.id}: ${x.value}`), '',
    ...(c.pending.length ? ['## Resources waiting for review', '', ...list(c.pending, r => `- \`${r._path}\` — ${r.strings.title}`), ''] : [])
  ].join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const owner = args.find(a => a.startsWith('@'));
  const path = opt('--path');
  if (!owner && !path) { console.error('Usage: node scripts/charter.mjs @handle | --path content/bodies/ie/'); process.exit(2); }
  console.log(charterMarkdown(charter({ owner, path, linkState: opt('--link-state') })));
}
