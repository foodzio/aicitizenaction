#!/usr/bin/env node
// Converts the frozen research datasets in input/data/ into one YAML record per entity
// under content/{bodies,channels,orgs}/, per docs/content-architecture.md.
//
//   node scripts/migrate-input.mjs            write content/ and docs/migration-report.md
//   node scripts/migrate-input.mjs --dry-run  report only
//
// input/ is never modified. Verification states are taken from input/data/sources-index.json,
// which is the authority for all 1,170 sources. Routes that were looked for and not found
// (value '') are kept with value: null. Suspected duplicates across datasets are reported,
// never merged: a human confirms each one.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import YAML from 'yaml';
import { ROOT } from './lib/content.mjs';
import { mapGeo } from './lib/geo.mjs';
import { slugify, uniqueId } from './lib/slug.mjs';

const DRY = process.argv.includes('--dry-run');
const load = f => JSON.parse(readFileSync(join(ROOT, 'input/data', f), 'utf8'));
const INST = load('institutions.json');
const { seats: SEATS, orgs: ORGS } = load('committees-and-organisations.json');
const INDEX = load('sources-index.json');
const COMPILED = INDEX.meta.compiled;                       // 2026-09-22

const CYCLE = { seats: 90, routes: 180 };                   // days; docs/content-architecture.md
const addDays = (d, n) => { const t = new Date(`${d}T00:00:00Z`); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };

const TYPE_BY_GROUP = {
  Government: 'government', Multilateral: 'multilateral', Standards: 'standards',
  Companies: 'company', 'How to file': 'reporting-channel', Watchdog: 'watchdog',
  'Civil society': 'civil-society', Academic: 'academic'
};
const FOLDER_BY_TYPE = {
  seat: 'bodies', government: 'bodies', multilateral: 'bodies', standards: 'bodies',
  company: 'channels', 'reporting-channel': 'channels', watchdog: 'channels',
  'civil-society': 'orgs', academic: 'orgs', organisation: 'orgs'
};
const ROLE = { Chair: 'chair', 'Ranking / minority': 'ranking' };

const report = { geoFallback: [], unconsumed: [], unmatchedRoutes: [], duplicates: [], idCollisions: [] };
const taken = new Set();
const consumed = new Set();

// Remove empty strings, empty arrays/objects and undefined, recursively.
function clean(v) {
  if (Array.isArray(v)) { const a = v.map(clean).filter(x => x !== undefined); return a.length ? a : undefined; }
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, x] of Object.entries(v)) { const c = clean(x); if (c !== undefined) o[k] = c; }
    return Object.keys(o).length ? o : undefined;
  }
  if (v === '' || v === undefined) return undefined;
  return v;
}

function geoFor(text, ctx, name) {
  const g = mapGeo(text, ctx);
  if (!g) { report.geoFallback.push({ name, text }); return { country: 'global', label: text || undefined }; }
  return { ...g, label: text || undefined };
}

function makeId(geo, name) {
  const base = `${geo.country}-${slugify(name)}`;
  const id = uniqueId(base, taken);
  if (id !== base) report.idCollisions.push({ name, id });
  return id;
}

// Builds a route from a sources-index entry (the authority for verification).
function fromIndex(src, id, extra = {}) {
  consumed.add(src.source_id);
  return {
    id, type: src.route_type, value: src.value || null,
    verified: src.verified ?? null,
    verification_method: src.verification_method,
    verified_on: src.verified === true ? COMPILED : null,
    language: src.language || extra.language || undefined,
    source_id: src.source_id
  };
}

function sourcesFrom(routes) {
  const urls = routes.filter(r => r.verified === true && /^https?:\/\//.test(r.value ?? ''));
  const pool = urls.length ? urls : routes.filter(r => /^https?:\/\//.test(r.value ?? ''));
  return [...new Map(pool.map(r => [r.value, { url: r.value, checked: r.verified_on ?? null }])).values()];
}

const byEntity = new Map();
for (const s of INDEX.sources) {
  const k = `${s.dataset}|${s.entity}`;
  if (!byEntity.has(k)) byEntity.set(k, []);
  byEntity.get(k).push(s);
}
const takeSource = (dataset, entity, pred) => {
  const list = byEntity.get(`${dataset}|${entity}`) ?? [];
  return list.find(s => !consumed.has(s.source_id) && pred(s));
};

const records = [];

// ── Institutions (register) ─────────────────────────────────────────────────────────────
for (const x of INST) {
  const type = TYPE_BY_GROUP[x.group];
  const folder = FOLDER_BY_TYPE[type];
  const geo = geoFor(x.jurisdiction, { federalBody: folder === 'bodies' && x.group === 'Government' }, x.name);
  const id = makeId(geo, x.name);
  const routeIds = new Set();
  const routes = [], routeStrings = {};

  for (const r of x.routes) {
    const rid = uniqueId(slugify(r.label || r.type, 4), routeIds);
    const src = r.value ? takeSource('register', x.name, s => s.value === r.value && s.label === r.label) : null;
    let route;
    if (src) route = fromIndex(src, rid, { language: r.language });
    else {
      if (r.value) report.unmatchedRoutes.push({ entity: x.name, label: r.label, value: r.value });
      route = { id: rid, type: r.type, value: r.value || null, verified: r.value ? r.verified : false,
        verification_method: r.value ? undefined : 'secondary_citation', verified_on: null, language: r.language || undefined };
    }
    routes.push(route);
    routeStrings[rid] = { label: r.label, scope: r.scope, note: r.note };
  }
  for (const kind of ['homepage', 'framework']) {
    const src = takeSource('register', x.name, s => s.route_type === kind);
    if (!src) continue;
    const rid = uniqueId(kind, routeIds);
    routes.push(fromIndex(src, rid));
    routeStrings[rid] = { label: kind === 'framework' ? x.framework?.title || src.label : src.label };
  }

  records.push({
    folder,
    record: {
      id, type, geo,
      facts: {
        routes, local_name: x.local_name, region: x.region, public_input: x.public_input, tags: x.tags
      },
      strings: {
        name: x.name, remit: x.remit, powers_text: x.powers, threat_model: x.threat_model,
        reality_check: x.reality_check, notes: x.notes, gov_channel: x.gov_channel,
        accepts: x.accepts, does_not_accept: x.does_not_accept, how: x.how, format: x.format,
        timing: x.timing, after: x.after, operator: x.operator, routes: routeStrings
      },
      meta: {
        verified_on: COMPILED, review_by: addDays(COMPILED, CYCLE.routes), sources: sourcesFrom(routes),
        needs_research: folder === 'orgs' ? ['topics'] : ['powers', 'topics', 'not_topics'],
        legacy_id: x.id, migrated_from: 'input/data/institutions.json'
      }
    }
  });
}

// ── Committees and other seat-holding bodies ────────────────────────────────────────────
for (const s of SEATS) {
  const geo = geoFor(s.jurisdiction, { level: s.level_raw }, s.body);
  const id = makeId(geo, s.body);
  const routes = [], routeStrings = {};
  const mem = takeSource('seats', s.body, x => x.route_type === 'membership' && x.value === s.membership_url);
  if (mem) { routes.push(fromIndex(mem, 'membership')); routeStrings.membership = { label: mem.label }; }
  const sub = takeSource('seats', s.body, x => x.route_type === 'submission' && x.value === s.public_route_url);
  if (sub) { routes.push(fromIndex(sub, 'public-route')); routeStrings['public-route'] = { label: sub.label }; }

  const holders = INDEX.named_seat_holders.filter(h => h.body === s.body && h.authoritative_list === s.membership_url);
  const seats = holders.map(h => ({ role: ROLE[h.role] ?? 'other', name: h.name, party: h.party, region: h.constituency_or_state, verified_on: h.verified_on }));
  const seatNotes = Object.fromEntries(holders.filter(h => h.detail).map(h => [ROLE[h.role] ?? 'other', h.detail]));
  const verifiedOn = holders[0]?.verified_on || s.chair?.verified_on || COMPILED;

  records.push({
    folder: 'bodies',
    record: {
      id, type: 'seat', geo,
      facts: {
        routes, local_name: s.local_name, level: s.level_raw, chamber: s.chamber, parent: s.parent,
        tags: s.tags, seats
      },
      strings: {
        name: s.body, ai_jurisdiction: s.ai_jurisdiction, business: s.business, status: s.status,
        public_route: s.public_route, format_rules: s.format_rules, agency_route: s.agency_route,
        key_people: s.key_people, realistic: s.realistic, language_note: s.language, note: s.note,
        seat_notes: seatNotes, routes: routeStrings
      },
      meta: {
        verified_on: verifiedOn, review_by: addDays(verifiedOn, seats.length ? CYCLE.seats : CYCLE.routes),
        sources: sourcesFrom(routes), needs_research: ['powers', 'topics', 'not_topics'],
        legacy_id: s.id, migrated_from: 'input/data/committees-and-organisations.json#seats'
      }
    }
  });
}

// ── Organisations ───────────────────────────────────────────────────────────────────────
for (const o of ORGS) {
  const geo = geoFor(o.geography, { multiMeansGlobal: true }, o.name);
  const id = makeId(geo, o.name);
  const routes = [], routeStrings = {};
  const act = takeSource('organisations', o.name, x => x.route_type === 'action');
  if (act) { routes.push(fromIndex(act, 'action')); routeStrings.action = { label: act.label }; }

  records.push({
    folder: 'orgs',
    record: {
      id, type: 'organisation', geo,
      facts: { routes, perspective: o.side, volunteers: o.volunteers, tags: o.tags },
      strings: {
        name: o.name, the_ask: o.the_ask, what_they_do: o.what_they_do, newcomer_action: o.newcomer_action,
        tips: o.tips, geography: o.geography, scale: o.scale, spending: o.spending, caution: o.caution,
        routes: routeStrings
      },
      meta: {
        verified_on: COMPILED, review_by: addDays(COMPILED, CYCLE.routes), sources: sourcesFrom(routes),
        needs_research: ['topics'], legacy_id: o.id, migrated_from: 'input/data/committees-and-organisations.json#orgs'
      }
    }
  });
}

// ── Checks and report ───────────────────────────────────────────────────────────────────
for (const s of INDEX.sources) if (!consumed.has(s.source_id)) report.unconsumed.push(s);

const norm = n => n.toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const domain = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return null; } };
const all = records.map(r => r.record);
for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
  const a = all[i], b = all[j];
  if (a.meta.migrated_from === b.meta.migrated_from) continue;
  const na = norm(a.strings.name), nb = norm(b.strings.name);
  const sameName = na === nb || (na.length > 12 && nb.length > 12 && (na.includes(nb) || nb.includes(na)));
  const da = new Set(a.facts.routes.filter(r => r.type === 'homepage' || r.type === 'action').map(r => domain(r.value)).filter(Boolean));
  const shared = b.facts.routes.filter(r => r.type === 'homepage' || r.type === 'action').map(r => domain(r.value)).filter(d => d && da.has(d));
  if (sameName || shared.length) report.duplicates.push({ a: a.id, b: b.id, why: sameName ? 'name' : `domain ${shared[0]}` });
}

const counts = {
  records: all.length,
  bySection: all.reduce((m, r, i) => (m[records[i].folder] = (m[records[i].folder] ?? 0) + 1, m), {}),
  routes: all.reduce((n, r) => n + r.facts.routes.length, 0),
  indexedRoutes: all.reduce((n, r) => n + r.facts.routes.filter(x => x.source_id).length, 0),
  verified: { true: 0, false: 0, null: 0 },
  seatHolders: all.reduce((n, r) => n + (r.facts.seats?.length ?? 0), 0)
};
for (const r of all) for (const x of r.facts.routes) if (x.source_id) counts.verified[String(x.verified)]++;

const md = [
  '# Migration report',
  '',
  `*Generated by \`scripts/migrate-input.mjs\` on ${new Date().toISOString()}. Regenerated on every run — do not edit by hand.*`,
  '',
  '## Counts',
  '',
  `- Records: ${counts.records} (${Object.entries(counts.bySection).map(([k, v]) => `${k} ${v}`).join(', ')}) — input: 229 institutions + 144 seats + 50 organisations = 423`,
  `- Routes: ${counts.routes}, of which ${counts.indexedRoutes} come from the source index (input: 1,170) and ${counts.routes - counts.indexedRoutes} are routes looked for and not found`,
  `- Verification of indexed routes: ${counts.verified.true} verified, ${counts.verified.false} unverified, ${counts.verified.null} unchecked (input: 774 / 145 / 251)`,
  `- Named seat-holders: ${counts.seatHolders} (input: ${INDEX.named_seat_holders.length})`,
  '',
  `## Source-index entries not attached to any record (${report.unconsumed.length})`,
  '',
  ...(report.unconsumed.length ? report.unconsumed.map(s => `- ${s.dataset} · ${s.entity} · ${s.route_type} · ${s.value}`) : ['None.']),
  '',
  `## Routes with a value but no source-index match (${report.unmatchedRoutes.length})`,
  '',
  ...(report.unmatchedRoutes.length ? report.unmatchedRoutes.map(r => `- ${r.entity} · ${r.label} · ${r.value}`) : ['None.']),
  '',
  `## Jurisdictions that could not be mapped — filed under \`global\` (${report.geoFallback.length})`,
  '',
  ...(report.geoFallback.length ? report.geoFallback.map(g => `- ${g.name} — "${g.text}"`) : ['None.']),
  '',
  `## Suspected duplicates across datasets — confirm or reject each (${report.duplicates.length})`,
  '',
  'Nothing was merged. For each pair, a human decides whether they are the same entity. If they are, merge by hand into the richer record, keep both `legacy_id`s in a comment, and delete the other file.',
  '',
  '| Record A | Record B | Why flagged |',
  '| --- | --- | --- |',
  ...report.duplicates.map(d => `| \`${d.a}\` | \`${d.b}\` | ${d.why} |`),
  '',
  `## Id collisions resolved with a numeric suffix (${report.idCollisions.length})`,
  '',
  ...(report.idCollisions.length ? report.idCollisions.map(c => `- \`${c.id}\` — ${c.name}`) : ['None.']),
  ''
].join('\n');

console.log(JSON.stringify(counts));
if (DRY) { console.log(md); process.exit(0); }

for (const section of ['bodies', 'channels', 'orgs']) {
  const p = join(ROOT, 'content', section);
  if (existsSync(p)) rmSync(p, { recursive: true });
}
for (const { folder, record } of records) {
  if (!record.meta.sources.length) {
    delete record.meta.sources;
    record.meta.unsourced = `No URL was found for this entity during research (${record.meta.migrated_from}). It needs a source before it can be relied on.`;
  }
  const r = clean(record);
  // routes and seat lists keep explicit nulls: `verified: null` and `value: null` carry meaning.
  r.facts.routes = record.facts.routes.map(x => Object.fromEntries(Object.entries(x).filter(([, v]) => v !== undefined)));
  const path = join(ROOT, 'content', folder, record.geo.country, ...(record.geo.sub ? [record.geo.sub] : []), `${record.id}.yml`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, YAML.stringify(r, { lineWidth: 0 }));
}
writeFileSync(join(ROOT, 'docs/migration-report.md'), md);
console.log(`Wrote ${records.length} records and docs/migration-report.md`);
