#!/usr/bin/env node
// Reconciles actionable directory-audit findings with one GitHub issue per stable finding key.
// Existing issues are updated/reopened; issues whose finding disappeared are closed.

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { ownersOf } from './lib/codeowners.mjs';

export const findingMarker = key => `<!-- directory-finding:${encodeURIComponent(key)} -->`;

function serviceLevel(finding) {
  if (finding.bucket === 'block_publication') return 'Before publication (immediate exclusion where applicable)';
  if (finding.key.startsWith('identity:')) return '14 days';
  if (finding.key.startsWith('contact:') || finding.key.startsWith('link:')) return '7 days';
  return '30 days';
}

export function issueFor(finding, generatedAt) {
  const owners = ownersOf(finding.path ?? 'content/');
  const keyLabel = finding.key.length > 150 ? `${finding.key.slice(0, 147)}…` : finding.key;
  return {
    key: finding.key,
    title: `[directory] ${finding.bucket}: ${keyLabel}`,
    body: [
      findingMarker(finding.key),
      `The recurring directory integrity audit currently reports this **${finding.bucket.replaceAll('_', ' ')}** finding.`,
      '',
      `- **Stable key:** \`${finding.key}\``,
      `- **Finding:** ${finding.message}`,
      ...(finding.path ? [`- **Path:** \`${finding.path}\``] : []),
      `- **Service level:** ${serviceLevel(finding)}`,
      `- **Owners:** ${owners.join(' ') || '(maintainer fallback)'}`,
      `- **Last observed:** ${generatedAt}`,
      '',
      'Resolve the underlying evidence or content issue; do not close this issue merely because a URL responds. The next weekly audit will update this issue or close it automatically when the stable finding disappears.'
    ].join('\n')
  };
}

export function actionableFindings(report) {
  return ['block_publication', 'needs_human_review', 'maintenance_due']
    .flatMap(bucket => (report.findings?.[bucket] ?? []).map(row => ({ ...row, bucket })));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [file] = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
  const dryRun = process.argv.includes('--dry-run');
  if (!file) { console.error('Usage: node scripts/file-directory-issues.mjs <report.json> [--dry-run]'); process.exit(2); }
  const report = JSON.parse(readFileSync(file, 'utf8'));
  const wanted = new Map(actionableFindings(report).map(row => [row.key, issueFor(row, report.generated_at)]));
  if (dryRun) {
    for (const issue of wanted.values()) console.log(`--- ${issue.title}\n${issue.body}\n`);
    process.exit(0);
  }

  const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8' });
  gh('label', 'create', 'directory-integrity', '--color', 'B60205', '--description', 'Recurring directory audit finding', '--force');
  const existing = JSON.parse(gh('issue', 'list', '--state', 'all', '--limit', '1000', '--label', 'directory-integrity', '--json', 'number,state,title,body'));
  const byKey = new Map();
  for (const issue of existing) for (const key of wanted.keys()) if (issue.body?.includes(findingMarker(key))) byKey.set(key, issue);

  for (const [key, issue] of wanted) {
    const prior = byKey.get(key);
    if (prior) {
      gh('issue', 'edit', String(prior.number), '--title', issue.title, '--body', issue.body);
      if (prior.state === 'CLOSED') gh('issue', 'reopen', String(prior.number));
      console.log(`updated: #${prior.number} ${key}`);
    } else {
      console.log(gh('issue', 'create', '--title', issue.title, '--body', issue.body, '--label', 'directory-integrity').trim());
    }
  }

  const currentMarkers = new Set([...wanted.keys()].map(findingMarker));
  for (const issue of existing.filter(row => row.state === 'OPEN')) {
    const marker = issue.body?.match(/<!-- directory-finding:[^>]+ -->/)?.[0];
    if (!marker || currentMarkers.has(marker)) continue;
    gh('issue', 'comment', String(issue.number), '--body', `Resolved automatically: this stable finding was absent from the ${report.now} directory audit.`);
    gh('issue', 'close', String(issue.number), '--reason', 'completed');
    console.log(`closed: #${issue.number}`);
  }
}
