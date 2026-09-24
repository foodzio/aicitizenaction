#!/usr/bin/env node
// Read-only end-to-end directory integrity audit. Only tmp/directory-audit reports are written.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import YAML from 'yaml';
import { ROOT, loadContent, loadDirectory } from './lib/content.mjs';
import { validateAll } from './validate.mjs';
import { inventoryText } from './directory-dedupe.mjs';
import { validateIdentityDecisions } from './directory-identity-review.mjs';
import { freshness } from './lib/freshness.mjs';
import { contactRoute, eligibleContactRoute } from './lib/routing.mjs';
import { redirectManifest } from './build-redirects.mjs';

const today = () => new Date().toISOString().slice(0, 10);
const daysSince = (date, now) => Math.floor((new Date(`${now}T00:00:00Z`) - new Date(`${date}T00:00:00Z`)) / 86400000);
const finding = (bucket, key, message, path) => ({ bucket, key, message, ...(path ? { path } : {}) });
const readYaml = path => YAML.parse(readFileSync(path, 'utf8')) ?? {};

function run(command, args) {
  const result = spawnSync(command, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  return { ok: result.status === 0, status: result.status, output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim() };
}

export function baselineDrops(counts, baseline) {
  const drops = [];
  for (const [section, previous] of Object.entries(baseline.counts ?? {})) {
    const current = counts[section] ?? 0, allowed = Math.min(Math.ceil(previous * 0.05), 10);
    if (previous - current > allowed) drops.push({ section, previous, current, allowed });
  }
  return drops;
}

export function audit({ now = today(), full = false, linkState } = {}) {
  const findings = [];
  const add = (bucket, key, message, path) => findings.push(finding(bucket, key, message, path));
  const records = loadDirectory();
  const recordByPath = new Map(records.map(record => [record._path, record]));
  const channels = records.filter(record => record._section === 'channels');
  const channelRoutes = channels.flatMap(record => record.facts.routes.map(route => ({ record, route })));
  const validation = validateAll({ now });
  for (const issue of validation.errors) add('block_publication', `schema:${issue.path}:${issue.msg}`, issue.msg, issue.path);
  for (const issue of validation.warnings) {
    // Record/seat expiry gets one structured finding below; do not file a second issue for the
    // validator's summary of the same fact.
    if (issue.msg.startsWith('overdue:')) continue;
    const record = recordByPath.get(issue.path);
    const key = issue.msg.startsWith('unsourced:') && record ? `record:unsourced:${record.id}` : `validation:${issue.path}:${issue.msg}`;
    add('maintenance_due', key, issue.msg, issue.path);
  }

  const inventoryPath = join(ROOT, 'docs', 'directory-identity-candidates.yml');
  const decisionsPath = join(ROOT, 'docs', 'directory-identity-decisions.yml');
  const inventory = readYaml(inventoryPath), ledger = readYaml(decisionsPath);
  if (readFileSync(inventoryPath, 'utf8') !== inventoryText()) add('block_publication', 'identity:candidates-stale', 'Generated identity candidate inventory is stale.');
  const identity = validateIdentityDecisions({ inventory, ledger, records, now });
  for (const message of identity.errors) add('block_publication', `identity:${message}`, message);
  for (const message of identity.warnings) add('needs_human_review', `identity:${message}`, message);

  const contactAudit = run(process.execPath, [join(ROOT, 'scripts', 'contact-audit.mjs'), '--check']);
  if (!contactAudit.ok) add('block_publication', 'contact:inventory-stale', contactAudit.output);
  for (const { record, route } of channelRoutes) {
    if (route.contact?.review !== 'reviewed') add('block_publication', `contact:unreviewed:${record.id}:${route.id}`, 'Contact route has no reviewed disposition.', record._path);
    const checked = route.contact?.checked_on;
    if (checked && daysSince(checked, now) > 180 && eligibleContactRoute(record, route, checked)) add('block_publication', `contact:expired:${record.id}:${route.id}`, `Contact evidence is ${daysSince(checked, now)} days old.`, record._path);
    if (route.contact?.closes_on && route.contact.closes_on < now && eligibleContactRoute(record, route, now)) add('block_publication', `contact:closed:${record.id}:${route.id}`, `Closed contact window is still eligible after ${route.contact.closes_on}.`, record._path);
  }

  const fresh = freshness({ now });
  const baseline = readYaml(join(ROOT, 'docs', 'directory-audit-baseline.yml'));
  const counts = {
    bodies: records.filter(r => r._section === 'bodies').length,
    channels: channels.length,
    orgs: records.filter(r => r._section === 'orgs').length,
    channel_routes: channelRoutes.length
  };
  for (const drop of baselineDrops(counts, baseline)) add('block_publication', `baseline:drop:${drop.section}`, `${drop.section} fell from ${drop.previous} to ${drop.current}; update the reviewed baseline if intentional.`);
  for (const record of records) {
    if (record.meta.review_by < now) add('maintenance_due', `record:overdue:${record.id}`, `Record review was due ${record.meta.review_by}.`, record._path);
    for (const seat of record.facts.seats ?? []) if (daysSince(seat.verified_on, now) > 90) add('maintenance_due', `seat:overdue:${record.id}:${seat.role}:${seat.name}`, `Named seat was checked ${daysSince(seat.verified_on, now)} days ago.`, record._path);
  }
  for (const row of ledger.decisions ?? []) {
    const decision = { ...(ledger.defaults ?? {}), ...row };
    if (!decision.permanent && decision.review_by < now) add('needs_human_review', `identity:expired:${decision.key}`, `Identity decision expired ${decision.review_by}.`);
  }
  try { redirectManifest(records); } catch (error) { add('block_publication', 'redirects:invalid', error.message); }

  const fullChecks = {};
  let linkMetrics = null;
  const linkArgs = [join(ROOT, 'scripts', 'check-links.mjs'), '--out', join(ROOT, 'tmp', 'directory-audit', 'links.json')];
  if (linkState) linkArgs.push('--state', linkState);
  if (full) for (const [key, command, args] of [
    ['tests', 'npm', ['test']], ['build', 'npm', ['run', 'build']],
    ['links', process.execPath, linkArgs]
  ]) {
    fullChecks[key] = run(command, args);
    if (!fullChecks[key].ok) add('block_publication', `full:${key}`, `${key} command failed; see JSON report output.`);
  }
  const linksPath = join(ROOT, 'tmp', 'directory-audit', 'links.json');
  if (full && fullChecks.links?.ok && existsSync(linksPath)) {
    const links = JSON.parse(readFileSync(linksPath, 'utf8'));
    linkMetrics = { checked: links.checked, broken: links.broken.length, confirmed: links.confirmed.length, unknown: links.unknown.length, moved: links.moved.length, excluded: links.excluded };
    for (const row of links.confirmed) add('block_publication', `link:confirmed:${row.url}`, `Link failed on two consecutive full audits: ${row.url}`);
    for (const row of links.broken.filter(row => !links.confirmed.some(item => item.url === row.url))) add('needs_human_review', `link:first-failure:${row.url}`, `First observed link failure; confirm on the next run: ${row.url}`);
    for (const row of links.moved) add('informational', `link:moved:${row.url}`, `Link moved to another host: ${row.url} → ${row.finalUrl}`);
  }

  const buckets = Object.fromEntries(['block_publication', 'needs_human_review', 'maintenance_due', 'informational'].map(bucket => [bucket, findings.filter(item => item.bucket === bucket)]));
  const contactRecords = records.filter(record => !!contactRoute(record, now)).length;
  return {
    generated_at: new Date().toISOString(), now, mode: full ? 'full' : 'fast', ok: !buckets.block_publication.length,
    counts, findings: buckets,
    metrics: {
      canonical_entities: records.length,
      current_contact_entities: contactRecords,
      no_current_contact_entities: records.length - contactRecords,
      contact_coverage_percent: records.length ? Math.round(contactRecords / records.length * 1000) / 10 : 100,
      identity_candidates: inventory.totals,
      identity_unresolved: identity.totals.unresolved,
      contact_routes_reviewed: channelRoutes.filter(x => x.route.contact?.review === 'reviewed').length,
      contact_routes_total: channelRoutes.length,
      freshness: fresh.overall,
      overdue_seats: fresh.seats.overdue,
      translations: fresh.translations,
      resource_perspectives: fresh.balance,
      redirects: records.reduce((sum, record) => sum + (record.meta.redirect_from?.length ?? 0), 0),
      link_check: linkMetrics
    },
    full_checks: Object.fromEntries(Object.entries(fullChecks).map(([key, value]) => [key, { ok: value.ok, status: value.status, output: value.output.slice(-4000) }]))
  };
}

export function auditMarkdown(report) {
  const lines = [
    `# Directory integrity audit — ${report.now}`,
    '', `Mode: **${report.mode}** · Result: **${report.ok ? 'PASS' : 'BLOCK'}**`, '',
    `Canonical entities: ${report.metrics.canonical_entities} · Current contact coverage: ${report.metrics.current_contact_entities}/${report.metrics.canonical_entities} (${report.metrics.contact_coverage_percent}%) · No current contact: ${report.metrics.no_current_contact_entities}`,
    `Identity candidates: ${report.metrics.identity_candidates.candidates} (${report.metrics.identity_candidates.high} high, ${report.metrics.identity_candidates.medium} medium, ${report.metrics.identity_candidates.low} low) · Unresolved: ${report.metrics.identity_unresolved}`,
    `Channel routes reviewed: ${report.metrics.contact_routes_reviewed}/${report.metrics.contact_routes_total} · Retired ids redirected: ${report.metrics.redirects}`,
    ...(report.metrics.link_check ? [`Links: ${report.metrics.link_check.checked} checked · ${report.metrics.link_check.broken} first-run broken · ${report.metrics.link_check.confirmed} confirmed · ${report.metrics.link_check.unknown} unknown · ${report.metrics.link_check.moved} moved`] : []),
    ''
  ];
  for (const bucket of ['block_publication', 'needs_human_review', 'maintenance_due', 'informational']) {
    lines.push(`## ${bucket.replaceAll('_', ' ')}`, '');
    const rows = report.findings[bucket];
    lines.push(...(rows.length ? rows.map(row => `- \`${row.key}\` — ${row.message}${row.path ? ` (\`${row.path}\`)` : ''}`) : ['- None.']), '');
  }
  return lines.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const valueAfter = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
  const report = audit({ full: args.includes('--full'), linkState: valueAfter('--link-state') });
  const out = join(ROOT, 'tmp', 'directory-audit');
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  writeFileSync(join(out, 'report.md'), auditMarkdown(report) + '\n');
  console.log(auditMarkdown(report));
  process.exitCode = report.ok ? 0 : 1;
}
