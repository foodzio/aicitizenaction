// How current the content is — per country, per section, per language — and how balanced the
// Resources collection is across perspectives. Shared by scripts/freshness.mjs (weekly report),
// scripts/charter.mjs (a steward's queue) and the site's /freshness/ page.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadContent, walk, readYaml, I18N, rel } from './content.mjs';
import { englishHashes, stringsOf, hash } from './i18n.mjs';

export const DIRECTORY = ['bodies', 'channels', 'orgs'];
const today = () => new Date().toISOString().slice(0, 10);

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
