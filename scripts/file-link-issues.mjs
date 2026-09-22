#!/usr/bin/env node
// Opens one GitHub issue per confirmed broken URL (broken on two consecutive weekly runs),
// unless an open issue for that URL already exists. Owners come from CODEOWNERS.
//
//   node scripts/file-link-issues.mjs <check-links out.json> [--dry-run]
//
// Needs the GitHub CLI (`gh`) with GH_TOKEN set; in --dry-run it only prints.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { ownersOf } from './lib/codeowners.mjs';

const [file] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const DRY = process.argv.includes('--dry-run');
const { confirmed = [] } = JSON.parse(readFileSync(file, 'utf8'));
const gh = (...a) => execFileSync('gh', a, { encoding: 'utf8' });

export function issueFor(f) {
  const owners = [...new Set(f.refs.flatMap(r => ownersOf(r.path)))];
  return {
    title: `Broken link: ${f.url}`,
    body: [
      `The weekly link check found this URL broken on two consecutive runs (since ${f.since}).`,
      '',
      `- **URL:** ${f.url}`,
      `- **Result:** ${f.code ?? ''} ${f.detail ?? ''}`.trimEnd(),
      `- **Used in:**`,
      ...f.refs.map(r => `  - \`${r.path}\` — ${r.where}`),
      '',
      `**Owners:** ${owners.join(' ') || '(none in CODEOWNERS)'}`,
      '',
      'To fix: open the institution\'s own site, find where the route moved, and update the record with the new URL, `verified: true` and today\'s `verified_on`. If the route no longer exists, set `value: null` and `verified: false` and say so in the route\'s note. Never guess an address.'
    ].join('\n'),
    owners
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!confirmed.length) { console.log('No confirmed failures.'); process.exit(0); }
  if (!DRY) gh('label', 'create', 'broken-link', '--color', 'B60205', '--description', 'Confirmed by the weekly link check', '--force');
  for (const f of confirmed) {
    const issue = issueFor(f);
    if (DRY) { console.log(`--- ${issue.title}\n${issue.body}\n`); continue; }
    const open = JSON.parse(gh('issue', 'list', '--state', 'open', '--label', 'broken-link', '--search', `"${f.url}" in:title`, '--json', 'number'));
    if (open.length) { console.log(`exists: #${open[0].number} ${f.url}`); continue; }
    console.log(gh('issue', 'create', '--title', issue.title, '--body', issue.body, '--label', 'broken-link').trim());
  }
}
