#!/usr/bin/env node
// Reconciles actionable directory-audit findings with one GitHub issue per stable finding key.
// Existing issues are updated/reopened; issues whose finding disappeared are closed.

import { appendFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { ownersOf } from './lib/codeowners.mjs';

export const findingMarker = key => `<!-- directory-finding:${encodeURIComponent(key)} -->`;

export function serviceLevel(finding) {
  if (finding.bucket === 'block_publication') return { label: 'Before publication (immediate exclusion where applicable)', days: 0 };
  if (finding.key.startsWith('identity:')) return { label: '14 days', days: 14 };
  if (finding.key.startsWith('contact:') || finding.key.startsWith('link:')) return { label: '7 days', days: 7 };
  return { label: '30 days', days: 30 };
}

export function assignFindingOwners(findings, cap = 20, resolve = ownersOf) {
  const fallback = resolve('HANDOVER.md');
  const load = new Map();
  return findings.map(finding => {
    const natural = resolve(finding.path ?? 'content/');
    const primary = natural[0] ?? fallback[0];
    const overflow = !!primary && !fallback.includes(primary) && (load.get(primary) ?? 0) >= cap;
    const owners = overflow ? fallback : natural.length ? natural : fallback;
    if (!overflow && primary) load.set(primary, (load.get(primary) ?? 0) + 1);
    return { ...finding, owners, overflow };
  });
}

export function issueFor(finding, generatedAt) {
  const owners = finding.owners ?? ownersOf(finding.path ?? 'content/');
  const sla = serviceLevel(finding);
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
      `- **Service level:** ${sla.label}`,
      `- **Owners:** ${owners.join(' ') || '(maintainer fallback)'}`,
      ...(finding.overflow ? ['- **Capacity:** Steward queue exceeded 20 items; routed to the maintainer backlog.'] : []),
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
  const findings = assignFindingOwners(actionableFindings(report));
  const wanted = new Map(findings.map(row => [row.key, issueFor(row, report.generated_at)]));
  if (dryRun) {
    for (const issue of wanted.values()) console.log(`--- ${issue.title}\n${issue.body}\n`);
    process.exit(0);
  }

  const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8' });
  gh('label', 'create', 'directory-integrity', '--color', 'B60205', '--description', 'Recurring directory audit finding', '--force');
  gh('label', 'create', 'sla-breach', '--color', 'D93F0B', '--description', 'Directory review exceeded its service level', '--force');
  const existing = JSON.parse(gh('issue', 'list', '--state', 'all', '--limit', '1000', '--label', 'directory-integrity', '--json', 'number,state,title,body,createdAt,labels'));
  const byKey = new Map();
  for (const issue of existing) for (const key of wanted.keys()) if (issue.body?.includes(findingMarker(key))) byKey.set(key, issue);

  const breaches = [];
  for (const [key, issue] of wanted) {
    const prior = byKey.get(key);
    if (prior) {
      gh('issue', 'edit', String(prior.number), '--title', issue.title, '--body', issue.body);
      if (prior.state === 'CLOSED') gh('issue', 'reopen', String(prior.number));
      const finding = findings.find(row => row.key === key);
      const sla = serviceLevel(finding);
      const age = Math.floor((new Date(`${report.now}T00:00:00Z`) - new Date(prior.createdAt)) / 86400000);
      if (age > sla.days) {
        gh('issue', 'edit', String(prior.number), '--add-label', 'sla-breach');
        breaches.push({ number: prior.number, key, age, sla: sla.label });
      }
      console.log(`updated: #${prior.number} ${key}`);
    } else {
      console.log(gh('issue', 'create', '--title', issue.title, '--body', issue.body, '--label', 'directory-integrity').trim());
    }
  }

  const summaryIndex = process.argv.indexOf('--summary');
  const summary = summaryIndex >= 0 ? process.argv[summaryIndex + 1] : null;
  if (breaches.length) {
    const lines = ['## Directory service-level breaches', '', ...breaches.map(row => `- #${row.number} \`${row.key}\` — open ${row.age} days (SLA ${row.sla})`), ''];
    if (summary) appendFileSync(summary, lines.join('\n'));
    else console.log(lines.join('\n'));
  }

  const escalationMarker = '<!-- directory-sla-escalation -->';
  const escalation = existing.find(issue => issue.body?.includes(escalationMarker));
  if (breaches.length) {
    const body = [escalationMarker, 'These directory findings are past their documented service level and need maintainer escalation.', '', ...breaches.map(row => `- #${row.number} — \`${row.key}\` — ${row.age} days open (SLA ${row.sla})`)].join('\n');
    if (escalation) {
      gh('issue', 'edit', String(escalation.number), '--title', '[directory] Service-level breaches', '--body', body, '--add-label', 'sla-breach');
      if (escalation.state === 'CLOSED') gh('issue', 'reopen', String(escalation.number));
    } else {
      gh('issue', 'create', '--title', '[directory] Service-level breaches', '--body', body, '--label', 'directory-integrity,sla-breach');
    }
  } else if (escalation?.state === 'OPEN') {
    gh('issue', 'comment', String(escalation.number), '--body', 'All directory findings are back within their service level.');
    gh('issue', 'close', String(escalation.number), '--reason', 'completed');
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
