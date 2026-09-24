#!/usr/bin/env node
// Generates the complete, deterministic channel-route audit inventory.
//
//   node scripts/contact-audit.mjs
//   node scripts/contact-audit.mjs --out tmp/audit.yml
//   node scripts/contact-audit.mjs --check

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { ROOT, loadContent } from './lib/content.mjs';
import { CONTACT_TYPES, isUsableValue, eligibleContactRoute } from './lib/routing.mjs';

const args = process.argv.slice(2);
const valueAfter = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
const out = valueAfter('--out') ?? join(ROOT, 'docs', 'places-to-contact-audit.yml');
const check = args.includes('--check');
const channels = loadContent('channels').sort((a, b) => a.id.localeCompare(b.id));

function evidenceText(record, route) {
  const s = record.strings ?? {};
  const rs = s.routes?.[route.id] ?? {};
  return rs.scope || s.accepts || rs.note || s.how || '';
}

const rows = channels.flatMap(record => (record.facts?.routes ?? []).map(route => {
  const c = route.contact;
  const failures = [];
  if (!record.strings?.name) failures.push('1-recipient');
  if (!CONTACT_TYPES.includes(route.type) || !isUsableValue(route.value)) failures.push('2-inbound-mechanism');
  if (route.verified !== true || !(c?.evidence_url || evidenceText(record, route))) failures.push('3-acceptance-evidence');
  if (record.facts?.public_input === 'none' || (c && !c.eligible_users?.length)) failures.push('4-eligible-user');
  if (!(c?.accepted_subjects?.length || record.facts?.tags?.length)) failures.push('5-relevant-scope');
  if (c ? !['open', 'limited'].includes(c.status) : route.verified !== true) failures.push('6-currently-usable');
  return {
    record_id: record.id,
    name: record.strings?.name ?? '',
    file: record._path,
    record_type: record.type,
    country: record.geo?.country ?? '',
    public_input: record.facts?.public_input ?? 'unknown',
    route_id: route.id,
    claimed_type: route.type,
    value: route.value,
    verified: route.verified,
    evidence_hint: evidenceText(record, route),
    source_urls: (record.meta?.sources ?? []).map(x => x.url),
    failed_rules: failures,
    current_result: eligibleContactRoute(record, route) ? 'legacy-eligible' : 'ineligible',
    disposition: c?.review === 'reviewed' ? (eligibleContactRoute(record, route) ? 'keep' : 'reference-only') : 'pending',
    reviewer: null,
    reviewed_on: null
  };
}));

const dispositions = Object.fromEntries(['keep', 'fix', 'reclassify', 'merge', 'remove', 'reference-only', 'pending']
  .map(x => [x, rows.filter(r => r.disposition === x).length]));
const report = {
  generated_on: new Date().toISOString().slice(0, 10),
  scope: 'Every route in content/channels; generated rows are reconciled against source content.',
  totals: {
    records: channels.length,
    routes: rows.length,
    eligible: rows.filter(r => r.current_result === 'legacy-eligible').length,
    ineligible: rows.filter(r => r.current_result === 'ineligible').length,
    dispositions
  },
  routes: rows
};
const text = YAML.stringify(report, { lineWidth: 0 });

if (channels.length !== 74 || rows.length !== 234) {
  console.error(`Inventory mismatch: expected 74 records / 234 routes, found ${channels.length} / ${rows.length}`);
  process.exit(1);
}
if (check) {
  const existing = readFileSync(out, 'utf8');
  if (existing !== text) {
    console.error(`${out} is stale; run node scripts/contact-audit.mjs`);
    process.exit(1);
  }
} else {
  writeFileSync(out, text);
  console.log(`Wrote ${out}: ${channels.length} records, ${rows.length} routes`);
}
