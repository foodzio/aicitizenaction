// How current the content is — per country, per section, per language — and how balanced the
// Resources collection is across perspectives. Shared by scripts/freshness.mjs (weekly report),
// scripts/charter.mjs (a steward's queue) and the site's /freshness/ page.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadContent, walk, readYaml, I18N, ROOT, rel } from './content.mjs';
import { englishHashes, stringsOf, hash } from './i18n.mjs';
import { contactRoute, eligibleContactRoute, isUsableValue, placeToContact } from './routing.mjs';
import { ownersOf } from './codeowners.mjs';

export const DIRECTORY = ['bodies', 'channels', 'orgs'];
const today = () => new Date().toISOString().slice(0, 10);
const daysSince = (date, now) => Math.floor((new Date(`${now}T00:00:00Z`) - new Date(`${date}T00:00:00Z`)) / 86400000);

export function recordState(r, now = today()) {
  if (r.meta?.unsourced) return 'unsourced';
  if (r.meta?.review_by && r.meta.review_by < now) return 'overdue';
  return 'current';
}

function tally(list, keyOf, now) {
  const out = {};
  for (const r of list) {
    const k = keyOf(r);
    out[k] ??= { total: 0, current: 0, overdue: 0, unsourced: 0 };
    out[k].total++;
    out[k][recordState(r, now)]++;
  }
  for (const v of Object.values(out)) v.percent = v.total ? Math.round((v.current / v.total) * 100) : 100;
  return out;
}

/** Translation coverage per language: share of English strings with a current translation. */
export function translationCoverage(records) {
  const hashes = englishHashes(records);
  const total = [...hashes.values()].reduce((n, m) => n + m.size, 0);
  const out = {};
  for (const p of walk(I18N)) {
    const m = rel(p).match(/^i18n\/([a-z]{2,3})\/content\//);
    if (!m) continue;
    const t = readYaml(p) ?? {};
    const englishRel = rel(p).replace(/^i18n\/[a-z]{2,3}\//, '');
    const rec = records.find(r => r._path === englishRel);
    if (!rec) continue;
    out[m[1]] ??= { current: 0, stale: 0, machine: 0 };
    for (const [key, entry] of stringsOf(t.strings ?? {})) {
      const en = hashes.get(rec.id)?.get(key);
      if (!en || typeof entry?.value !== 'string') continue;
      if (entry.src === en) { out[m[1]].current++; if (entry.machine) out[m[1]].machine++; }
      else out[m[1]].stale++;
    }
  }
  for (const [lang, v] of Object.entries(out)) v.percent = total ? Math.round((v.current / total) * 1000) / 10 : 0;
  return { totalEnglishStrings: total, languages: out };
}

export function perspectiveBalance() {
  const sources = loadContent('resources/sources');
  const media = loadContent('resources/media');
  const persp = new Map(sources.map(s => [s.id, s.facts.perspective]));
  const count = (list, key) => list.reduce((m, x) => { const k = key(x) ?? 'unknown'; m[k] = (m[k] ?? 0) + 1; return m; }, {});
  return {
    sources: count(sources.filter(s => s.facts.enabled), s => s.facts.perspective),
    published: count(media.filter(m => m.meta.status === 'published'), m => persp.get(m.facts.source)),
    pending: media.filter(m => m.meta.status === 'pending').length
  };
}

function exclusionReason(record, route, now) {
  const contact = route.contact;
  if (contact?.review !== 'reviewed') return 'unreviewed';
  if (contact.disposition && contact.disposition !== 'keep') return 'reference_only';
  if (route.verified !== true) return 'unverified';
  if (!isUsableValue(route.value)) return 'no_usable_destination';
  if (!contact?.checked_on || !contact.evidence_url || !contact.eligible_users?.length || !contact.accepted_subjects?.length) return 'missing_evidence';
  if (contact.status === 'closed' || contact.closes_on && contact.closes_on < now) return 'closed';
  if (!['open', 'limited'].includes(contact.status)) return 'unknown_status';
  if (daysSince(contact.checked_on, now) > 180) return 'expired';
  if (record.facts?.recommend === false || record.meta?.unsourced || record.facts?.public_input === 'none') return 'record_excluded';
  return 'other';
}

/** Public, denominator-rich directory integrity metrics; no synthetic quality score. */
export function directoryIntegrity(directory, now = today()) {
  const candidates = readYaml(join(ROOT, 'docs', 'directory-identity-candidates.yml')) ?? {};
  const ledger = readYaml(join(ROOT, 'docs', 'directory-identity-decisions.yml')) ?? {};
  const decisions = ledger.decisions ?? [];
  const byKey = new Map(decisions.map(row => [row.key, { ...(ledger.defaults ?? {}), ...row }]));
  const unresolved = (candidates.candidates ?? []).filter(row => !byKey.has(row.key) || byKey.get(row.key).decision === 'pending');
  const decisionCounts = decisions.reduce((out, row) => { out[row.decision] = (out[row.decision] ?? 0) + 1; return out; }, { same: 0, distinct: 0, related: 0, pending: 0 });

  const channels = directory.filter(record => record._section === 'channels');
  const routes = channels.flatMap(record => (record.facts.routes ?? []).map(route => ({ record, route })));
  const current = routes.filter(({ record, route }) => eligibleContactRoute(record, route, now));
  const excluded = routes.filter(item => !current.includes(item));
  const exclusionReasons = excluded.reduce((out, { record, route }) => {
    const reason = exclusionReason(record, route, now);
    out[reason] = (out[reason] ?? 0) + 1;
    return out;
  }, {});
  const ages = current.map(({ route }) => daysSince(route.contact?.checked_on ?? route.verified_on, now)).sort((a, b) => a - b);
  const medianAge = ages.length ? (ages.length % 2 ? ages[(ages.length - 1) / 2] : Math.round((ages[ages.length / 2 - 1] + ages[ages.length / 2]) / 2)) : null;

  const contactRecords = directory.filter(record => !!contactRoute(record, now));
  const allCountries = new Set(directory.map(record => record.geo.country));
  const coveredCountries = new Set(contactRecords.map(record => record.geo.country));
  const allTopics = new Set(directory.flatMap(record => record.facts.tags ?? []));
  const coveredTopics = new Set(contactRecords.flatMap(record => record.facts.tags ?? []));
  const overdueRecords = directory.filter(record => record.meta.review_by < now);
  const overdueSeats = directory.flatMap(record => (record.facts.seats ?? []).map(seat => ({ record, seat })))
    .filter(({ seat }) => daysSince(seat.verified_on, now) > 90);
  const expiredDecisions = decisions.map(row => ({ ...(ledger.defaults ?? {}), ...row }))
    .filter(row => !row.permanent && row.review_by < now);
  const ownerCovered = directory.filter(record => ownersOf(record._path).length).length;

  return {
    canonical_entities: directory.length,
    public_directory_rows: directory.filter(record => record._section !== 'channels' || placeToContact(record)).length,
    redirects: directory.reduce((sum, record) => sum + (record.meta.redirect_from?.length ?? 0), 0),
    identity: { candidates: candidates.totals ?? {}, unresolved: unresolved.length, decisions: decisionCounts },
    contacts: {
      total: routes.length, current: current.length, excluded: excluded.length,
      current_percent: routes.length ? Math.round(current.length / routes.length * 1000) / 10 : 0,
      exclusion_reasons: exclusionReasons,
      evidence_age_days: { median: medianAge, oldest: ages.at(-1) ?? null }
    },
    coverage: {
      entities_with_current_contact: contactRecords.length,
      entities_without_current_contact: directory.length - contactRecords.length,
      countries_with_current_contact: coveredCountries.size,
      countries_without_current_contact: [...allCountries].filter(country => !coveredCountries.has(country)).sort(),
      topics_with_current_contact: coveredTopics.size,
      topics_without_current_contact: [...allTopics].filter(topic => !coveredTopics.has(topic)).sort()
    },
    backlog: {
      total: unresolved.length + overdueRecords.length + overdueSeats.length + expiredDecisions.length,
      unresolved_identity: unresolved.length,
      overdue_records: overdueRecords.length,
      overdue_seats: overdueSeats.length,
      expired_identity_decisions: expiredDecisions.length
    },
    owner_coverage: { covered: ownerCovered, total: directory.length }
  };
}

export function freshness({ now = today(), linkState } = {}) {
  const all = loadContent();
  const directory = all.filter(r => DIRECTORY.includes(r._section));
  const windows = loadContent('resources/windows');
  const seats = directory.flatMap(r => (r.facts.seats ?? []).map(s => ({ ...s, record: r.id })));
  const seatOverdue = seats.filter(s => {
    const due = new Date(`${s.verified_on}T00:00:00Z`); due.setUTCDate(due.getUTCDate() + 90);
    return due.toISOString().slice(0, 10) < now;
  });
  let broken = [];
  if (linkState && existsSync(linkState)) {
    const st = JSON.parse(readFileSync(linkState, 'utf8'));
    broken = Object.entries(st).filter(([, v]) => v.status === 'broken' && v.count >= 2).map(([url]) => url);
  }
  return {
    generated: new Date().toISOString(),
    now,
    overall: tally(directory, () => 'all', now).all,
    bySection: tally(directory, r => r._section, now),
    byCountry: tally(directory, r => r.geo.country, now),
    seats: { total: seats.length, overdue: seatOverdue.length },
    windows: { open: windows.filter(w => w.facts.opens_on <= now && w.facts.closes_on >= now).length, closed: windows.filter(w => w.facts.closes_on < now).length },
    translations: translationCoverage(directory),
    balance: perspectiveBalance(),
    integrity: directoryIntegrity(directory, now),
    confirmedBrokenLinks: broken
  };
}

export function freshnessMarkdown(f) {
  const row = (k, v) => `| ${k} | ${v.total} | ${v.current} | ${v.overdue} | ${v.unsourced} | ${v.percent}% |`;
  const table = obj => ['| | Records | Current | Overdue | Unsourced | Current % |', '| --- | --- | --- | --- | --- | --- |',
    ...Object.entries(obj).sort((a, b) => a[1].percent - b[1].percent || b[1].total - a[1].total).map(([k, v]) => row(k, v))];
  return [
    `# Freshness report — ${f.now}`,
    '',
    `${f.overall.percent}% of ${f.overall.total} directory records are within their review date. ${f.seats.overdue} of ${f.seats.total} named seat-holders are past their 90-day check. ${f.windows.open} windows open.`,
    '',
    '## Directory integrity', '',
    `${f.integrity.canonical_entities} canonical entities produce ${f.integrity.public_directory_rows} public directory rows; ${f.integrity.redirects} retired ids redirect to canonical records.`, '',
    `Current audited contact routes: ${f.integrity.contacts.current}/${f.integrity.contacts.total} (${f.integrity.contacts.current_percent}%); excluded: ${f.integrity.contacts.excluded}. Evidence age among included routes: median ${f.integrity.contacts.evidence_age_days.median ?? 'n/a'} days, oldest ${f.integrity.contacts.evidence_age_days.oldest ?? 'n/a'} days.`, '',
    `Coverage: ${f.integrity.coverage.entities_with_current_contact}/${f.integrity.canonical_entities} entities have a current contact; ${f.integrity.coverage.countries_with_current_contact} places and ${f.integrity.coverage.topics_with_current_contact} concern categories have at least one.`, '',
    `Identity decisions: ${f.integrity.identity.decisions.same} merged, ${f.integrity.identity.decisions.distinct} distinct, ${f.integrity.identity.decisions.related} related; ${f.integrity.identity.unresolved} current candidates unresolved. Human-review backlog: ${f.integrity.backlog.total}.`,
    '',
    '## By section', '', ...table(f.bySection), '',
    '## By country (least current first)', '', ...table(f.byCountry), '',
    '## Resources — balance of perspectives', '',
    `Sources watched: ${Object.entries(f.balance.sources).map(([k, v]) => `${k} ${v}`).join(' · ')}`, '',
    `Published items: ${Object.entries(f.balance.published).map(([k, v]) => `${k} ${v}`).join(' · ') || 'none'}`, '',
    `Waiting for an editor: ${f.balance.pending}`, '',
    '## Translations', '',
    ...(Object.keys(f.translations.languages).length
      ? Object.entries(f.translations.languages).map(([l, v]) => `- ${l}: ${v.percent}% of ${f.translations.totalEnglishStrings} English strings current (${v.stale} stale, ${v.machine} machine)`)
      : ['- No translations yet.']),
    '',
    ...(f.confirmedBrokenLinks.length ? ['## Confirmed broken links', '', ...f.confirmedBrokenLinks.map(u => `- ${u}`), ''] : [])
  ].join('\n');
}
