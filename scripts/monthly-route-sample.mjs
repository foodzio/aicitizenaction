#!/usr/bin/env node
// Deterministic 10% (minimum five where available) human sample of contact reviews completed in a
// month. This produces a queue; a human must reopen the cited official evidence and assess quality.

import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { ROOT, loadDirectory } from './lib/content.mjs';
import { eligibleContactRoute } from './lib/routing.mjs';

export function previousMonth(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString().slice(0, 7);
}

export function routeSample(records, month) {
  const candidates = records.flatMap(record => (record.facts?.routes ?? []).map(route => ({ record, route })))
    .filter(({ record, route }) => record._section === 'channels' && route.contact?.checked_on?.startsWith(`${month}-`) && eligibleContactRoute(record, route, route.contact.checked_on))
    .map(({ record, route }) => ({
      key: `${record.id}:${route.id}`,
      record_id: record.id,
      route_id: route.id,
      path: record._path,
      destination: route.value,
      evidence_url: route.contact.evidence_url,
      checked_on: route.contact.checked_on
    }));
  const count = Math.min(candidates.length, Math.max(5, Math.ceil(candidates.length * 0.1)));
  const score = row => createHash('sha256').update(`${month}:${row.key}`).digest('hex');
  return { month, population: candidates.length, sample_size: count, sample: candidates.sort((a, b) => score(a).localeCompare(score(b))).slice(0, count) };
}

export function sampleMarkdown(report) {
  return [
    `# Monthly contact-evidence sample — ${report.month}`,
    '',
    `Reopen and assess ${report.sample_size} of ${report.population} contact routes reviewed in this month. Confirm recipient, inbound mechanism, accepted subject, eligible audience, restrictions and current availability; an HTTP 200 alone is not a pass.`,
    '',
    ...(report.sample.length ? report.sample.map(row => `- [ ] \`${row.key}\` — \`${row.path}\` — checked ${row.checked_on} — evidence: ${row.evidence_url}`) : ['- No eligible contact reviews were completed in this month.']),
    ''
  ].join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const valueAfter = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
  const month = valueAfter('--month') ?? previousMonth();
  if (!/^\d{4}-\d{2}$/.test(month)) { console.error('--month must be YYYY-MM'); process.exit(2); }
  const report = routeSample(loadDirectory(), month);
  const out = valueAfter('--out') ?? join(ROOT, 'tmp', 'directory-audit', `monthly-sample-${month}.json`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
  const markdown = sampleMarkdown(report);
  writeFileSync(out.replace(/\.json$/, '.md'), markdown + '\n');
  const summary = valueAfter('--summary');
  if (summary) appendFileSync(summary, markdown + '\n');
  console.log(markdown);
}
