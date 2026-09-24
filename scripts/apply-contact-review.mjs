#!/usr/bin/env node
// Applies the deterministic six-rule review to every channel route using the source facts already
// stored in the record. Conservative by design: missing or failed evidence becomes unknown/none,
// never an inferred contact route. Run without --apply for a summary.
import { writeFileSync } from 'node:fs';
import YAML from 'yaml';
import { loadContent, ROOT } from './lib/content.mjs';
import { CONTACT_TYPES, isUsableValue } from './lib/routing.mjs';
import { join } from 'node:path';

const APPLY = process.argv.includes('--apply');
const TODAY = '2026-09-24';
const REVIEWER = 'codex:deterministic-contact-audit';
const NON_CONTACT_TYPES = new Set(['homepage', 'framework', 'program', 'membership', 'action']);
const RECLASSIFY = new Set([
  'gb-uk-parliament-find-inquiry-accepting-written',
  'global-ai-incident-database-editor-s-guide',
  'global-err-is-ai-evidence-what-makes',
  'global-house-evaluation-is-not-enough-third',
  'global-mit-ai-incident-tracker',
  'global-openai-outbound-coordinated-disclosure-policy',
  'global-perils-ai-safety-s-insularity-why',
  'us-ai-whistleblower-protection-act-federal'
]);
const CONTRADICTION = /^(?:n\/?a\b|nothing\b|not enacted\b)|\b(?:no (?:identified |verified |public )?(?:contact|channel|submission)|does not accept|doesn't accept|accepts nothing|outbound[- ]only)\b/i;
const CLOSED = /\b(?:window has closed|closed (?:on|since|to)|no longer (?:open|accepting)|deadline (?:was|passed)|expired)\b/i;

const compact = (value, max = 700) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
function evidence(record, route) {
  const s = record.strings ?? {};
  const rs = s.routes?.[route.id] ?? {};
  return compact(rs.scope || s.accepts || rs.note || s.public_route || s.how || s.reality_check || s.remit);
}
function routeText(record, route) {
  const s = record.strings ?? {}, rs = s.routes?.[route.id] ?? {};
  return [s.accepts, s.how, s.timing, s.reality_check, rs.scope, rs.note].filter(Boolean).map(compact).join(' ');
}
function audience(record, text) {
  if (record.facts.public_input === 'open') return ['public'];
  if (/employee|worker|whistle/i.test(text)) return ['employees-and-workers'];
  if (/researcher|hacker|security expert/i.test(text)) return ['researchers'];
  if (/customer|user|account/i.test(text)) return ['customers-and-users'];
  if (/resident|citizen|constituent/i.test(text)) return ['residents-or-citizens'];
  if (/organisation|organization|eligible entit/i.test(text)) return ['eligible-organisations'];
  return ['users-meeting-published-eligibility'];
}
function evidenceUrl(record, route) {
  if (/^https?:\/\//.test(String(route.value ?? ''))) return route.value;
  return record.meta?.sources?.find(x => x.url)?.url;
}
function reviewRoute(record, route) {
  const text = routeText(record, route);
  const note = evidence(record, route);
  const reference = NON_CONTACT_TYPES.has(route.type) || RECLASSIFY.has(record.id);
  let status;
  if (CLOSED.test(text)) status = 'closed';
  else if (reference || record.facts.public_input === 'none' || CONTRADICTION.test(text)) status = 'none';
  else if (!CONTACT_TYPES.includes(route.type) || !isUsableValue(route.value) || route.verified !== true || !note) status = 'unknown';
  else status = record.facts.public_input === 'limited' ? 'limited' : 'open';

  const direct = new Set(['email', 'form', 'complaint', 'submission', 'reporting', 'feedback', 'docket', 'petition', 'evidence', 'consultation', 'bounty']);
  const c = {
    status,
    directness: reference ? 'indirect' : direct.has(route.type) ? 'direct' : 'official-instructions',
    review: 'reviewed',
    reviewed_by: REVIEWER,
    reviewed_on: TODAY,
    disposition: status === 'open' || status === 'limited' ? 'keep' : status === 'unknown' ? 'fix' : status === 'closed' ? 'remove' : 'reference-only'
  };
  const url = evidenceUrl(record, route);
  if (url) c.evidence_url = url;
  if (note) c.evidence_note = note;
  if (route.verified_on) c.checked_on = route.verified_on;
  if (status === 'open' || status === 'limited') {
    c.eligible_users = audience(record, text);
    c.accepted_subjects = [...new Set([...(record.facts.tags ?? []), route.type])];
    if (status === 'limited') c.restrictions = note;
  }
  return c;
}

const records = loadContent('channels').sort((a, b) => a.id.localeCompare(b.id));
const stats = { records: records.length, routes: 0, open: 0, limited: 0, closed: 0, none: 0, unknown: 0, keep: 0, fix: 0, reclassify: 0 };
for (const record of records) {
  for (const route of record.facts.routes ?? []) {
    route.contact = reviewRoute(record, route);
    stats.routes++;
    stats[route.contact.status]++;
  }
  const contacts = record.facts.routes.filter(r => ['open', 'limited'].includes(r.contact.status));
  const unknown = record.facts.routes.some(r => r.contact.status === 'unknown');
  record.facts.contact_disposition = RECLASSIFY.has(record.id) ? 'reclassify' : contacts.length ? 'keep' : unknown ? 'fix' : 'reclassify';
  record.facts.contact_reviewed_by = REVIEWER;
  record.facts.contact_reviewed_on = TODAY;
  stats[record.facts.contact_disposition]++;
  if (APPLY) writeFileSync(join(ROOT, record._path), YAML.stringify(record, { lineWidth: 0 }));
}
console.log(JSON.stringify(stats, null, 2));
if (!APPLY) console.log('Dry run only; pass --apply to write content.');
if (stats.records !== 74 || stats.routes !== 234) process.exit(1);
