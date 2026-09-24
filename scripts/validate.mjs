#!/usr/bin/env node
// Checks every content and translation file before it can merge.
//
//   node scripts/validate.mjs            all files
//   node scripts/validate.mjs --json     machine-readable result
//
// Errors fail the run. Warnings (for example, a record past review_by) are reported only.
// Checks, per docs/content-architecture.md "What runs before a stranger's change can merge":
// schema, vocabularies, file placement, duplicate ids, date sanity, the verification-state rule,
// reference integrity, Resources rules, and translation integrity.
import { readFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { ROOT, CONTENT, I18N, walk, readYaml, rel, loadContent, loadVocab } from './lib/content.mjs';
import { englishHashes, stringsOf, URL_OR_EMAIL } from './lib/i18n.mjs';

const SCHEMA_BY_SECTION = {
  bodies: 'body', channels: 'channel', orgs: 'org',
  'resources/sources': 'source', 'resources/media': 'media',
  'resources/explainers': 'explainer', 'resources/windows': 'window',
  guides: 'guide'
};
const DIRECTORY = new Set(['bodies', 'channels', 'orgs']);

export function makeAjv() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  for (const f of walk(join(ROOT, 'schema'), '.schema.json')) ajv.addSchema(JSON.parse(readFileSync(f, 'utf8')));
  return ajv;
}

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => { const t = new Date(`${d}T00:00:00Z`); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };

export function validateAll({ now = today() } = {}) {
  const errors = [], warnings = [];
  const err = (path, msg) => errors.push({ path, msg });
  const warn = (path, msg) => warnings.push({ path, msg });
  const ajv = makeAjv();
  const vocab = loadVocab();
  const records = loadContent();
  const tomorrow = addDays(now, 1);

  const ids = new Map();
  for (const r of records) {
    if (!r.id) { err(r._path, 'missing id'); continue; }
    if (ids.has(r.id)) err(r._path, `duplicate id "${r.id}" (also ${ids.get(r.id)})`);
    ids.set(r.id, r._path);
  }
  const idsIn = section => new Set(records.filter(r => r._section === section).map(r => r.id));
  const known = { bodies: idsIn('bodies'), channels: idsIn('channels'), orgs: idsIn('orgs'), sources: idsIn('resources/sources') };

  const inVocab = (path, list, value, field) => {
    if (value === undefined || value === null) return;
    if (!vocab[list]) return err(path, `${field}: vocabulary "${list}" does not exist yet — add schema/vocab/${list}.yml before using this field`);
    if (!vocab[list].ids.has(String(value))) err(path, `${field}: "${value}" is not in schema/vocab/${list}.yml`);
  };

  for (const r of records) {
    const p = r._path;
    const schemaName = SCHEMA_BY_SECTION[r._section];
    if (!schemaName) { err(p, `no schema for section "${r._section}"`); continue; }
    const validate = ajv.getSchema(`https://aicitizenaction/schema/${schemaName}.schema.json`);
    if (!validate) { err(p, `schema ${schemaName}.schema.json not found`); continue; }
    if (!validate(r)) for (const e of validate.errors) err(p, `schema: ${e.instancePath || '/'} ${e.message}${e.params?.allowedValues ? ` (${e.params.allowedValues.join(', ')})` : ''}${e.params?.additionalProperty ? ` "${e.params.additionalProperty}"` : ''}`);

    if (basename(p) !== `${r.id}.yml`) err(p, `file name must be "${r.id}.yml"`);

    // Geography is the first path segment under each section.
    if (r.geo?.country) {
      const parts = p.split('/');
      const depth = r._section.split('/').length + 1;          // content/<section...>/
      const geoPath = parts.slice(depth, -1).join('/');
      const expected = [r.geo.country, r.geo.sub].filter(Boolean).join('/');
      if (geoPath !== expected) err(p, `path geography "${geoPath}" does not match geo "${expected}"`);
    }

    if (DIRECTORY.has(r._section)) {
      inVocab(p, 'record-types', r.type, 'type');
      const folder = vocab['record-types']?.values.find(v => v.id === r.type)?.folder;
      if (folder && folder !== r._section) err(p, `type "${r.type}" belongs in content/${folder}/`);
      const f = r.facts ?? {};
      const routeIds = new Set();
      for (const route of f.routes ?? []) {
        if (routeIds.has(route.id)) err(p, `duplicate route id "${route.id}"`);
        routeIds.add(route.id);
        inVocab(p, 'route-types', route.type, `route ${route.id} type`);
        // The single most damaging error: a route marked verified that nobody could have opened.
        if (route.verified === true && !route.value) err(p, `route ${route.id}: verified true but has no value`);
        if (route.verified === true && !route.verified_on) err(p, `route ${route.id}: verified true needs verified_on`);
        if (route.verified_on && route.verified_on > tomorrow) err(p, `route ${route.id}: verified_on is in the future`);
        const c = route.contact;
        if (c) {
          if (c.checked_on && c.checked_on > tomorrow) err(p, `route ${route.id}: contact.checked_on is in the future`);
          if (c.opens_on && c.closes_on && c.closes_on < c.opens_on) err(p, `route ${route.id}: contact.closes_on is before opens_on`);
          if (c.review === 'reviewed' && ['open', 'limited'].includes(c.status)) {
            if (route.verified !== true) err(p, `route ${route.id}: reviewed contact route must be verified true`);
            if (!c.evidence_url || !c.checked_on || !c.evidence_note) err(p, `route ${route.id}: reviewed contact route needs evidence_url, evidence_note and checked_on`);
            if (!c.eligible_users?.length) err(p, `route ${route.id}: reviewed contact route needs eligible_users`);
            if (!c.accepted_subjects?.length) err(p, `route ${route.id}: reviewed contact route needs accepted_subjects`);
            if (c.status === 'limited' && !c.restrictions) err(p, `route ${route.id}: limited contact route needs restrictions`);
          }
          if (c.review === 'reviewed' && (!c.reviewed_by || !c.reviewed_on || !c.disposition)) err(p, `route ${route.id}: reviewed contact decision needs reviewed_by, reviewed_on and disposition`);
        }
      }
      for (const id of Object.keys(r.strings?.routes ?? {})) if (!routeIds.has(id)) err(p, `strings.routes.${id} has no matching route`);
      for (const t of f.tags ?? []) inVocab(p, 'action-tags', t, 'tags');
      inVocab(p, 'levels', f.level, 'level');
      inVocab(p, 'perspectives', f.perspective, 'perspective');
      for (const x of f.powers ?? []) inVocab(p, 'powers', x, 'powers');
      for (const x of f.topics ?? []) inVocab(p, 'topics', x, 'topics');
      for (const x of f.not_topics ?? []) inVocab(p, 'topics', x, 'not_topics');
      for (const s of f.seats ?? []) if (s.verified_on > tomorrow) err(p, `seat ${s.name}: verified_on is in the future`);
      for (const key of ['powers', 'topics', 'not_topics']) {
        if (f[key]?.length && r.meta?.needs_research?.includes(key)) err(p, `${key} is filled but still listed in meta.needs_research`);
      }
      if (f.routing_review === 'drafted' && !f.routing_evidence) err(p, 'routing_review drafted needs routing_evidence');
      if (r._section === 'channels') {
        if (!f.contact_disposition || !f.contact_reviewed_by || !f.contact_reviewed_on) err(p, 'channel needs contact_disposition, contact_reviewed_by and contact_reviewed_on');
        for (const route of f.routes ?? []) if (!route.contact || route.contact.review !== 'reviewed') err(p, `route ${route.id}: every channel route needs a reviewed contact decision`);
      }
    }

    // Resources: every resource points at an action; ids it names must exist.
    if (r._section?.startsWith('resources/')) {
      const f = r.facts ?? {};
      for (const t of f.topics ?? []) inVocab(p, 'topics', t, 'topics');
      for (const [field, set] of [['bodies', known.bodies], ['channels', known.channels], ['orgs', known.orgs]]) {
        for (const id of f[field] ?? []) if (!set.has(id)) err(p, `${field}: unknown id "${id}"`);
      }
      if (r._section === 'resources/media') {
        if (f.source && !known.sources.has(f.source)) err(p, `source: unknown source "${f.source}"`);
        const ym = (f.published_at ?? '').slice(0, 7).replace('-', '/');
        if (ym && !p.startsWith(`content/resources/media/${ym}/`)) err(p, `media items live in content/resources/media/${ym}/ (by published_at)`);
      }

      if (r._section === 'resources/sources') inVocab(p, 'perspectives', f.perspective, 'perspective');
      if (r._section === 'resources/windows' && f.opens_on && f.closes_on && f.closes_on < f.opens_on) err(p, 'closes_on is before opens_on');
      if (['resources/explainers', 'resources/windows'].includes(r._section)) {
        const hasAction = (f.bodies?.length || f.channels?.length || f.orgs?.length || f.action);
        if (!hasAction) err(p, 'an explainer or window must point at an action: set bodies, channels, orgs or action');
      }
    }

    // Guides: outcome templates must exist; placeholders must be known.
    if (r._section === 'guides' && r.type === 'draft-templates') {
      const allowed = new Set(r.facts?.placeholders ?? []);
      for (const [k, tpl] of Object.entries(r.strings?.templates ?? {})) {
        for (const m of String(tpl).matchAll(/\{([a-z_]+)\}/g)) if (!allowed.has(m[1])) err(p, `template ${k}: unknown placeholder {${m[1]}}`);
        if (!String(tpl).includes('{own_words}')) err(p, `template ${k}: must include {own_words} — the user's own words are the centrepiece`);
      }
    }

    // Dates.
    const m = r.meta ?? {};
    if (m.verified_on && m.verified_on > tomorrow) err(p, 'meta.verified_on is in the future');
    if (m.verified_on && m.review_by && m.review_by < m.verified_on) err(p, 'meta.review_by is before meta.verified_on');
    if (m.review_by && m.review_by < now) warn(p, `overdue: review_by ${m.review_by}`);
    if (m.unsourced) warn(p, 'unsourced: no source can be cited yet');
  }

  // Translation integrity: strings only, no URLs or emails, hashes must match an English string,
  // no orphans.
  const hashes = englishHashes(records);
  for (const path of walk(I18N)) {
    const p = rel(path);
    if (p.startsWith('i18n/ui/') || p.endsWith('/status.yml')) continue;
    const t = readYaml(path) ?? {};
    const m = p.match(/^i18n\/([a-z]{2,3})\/(content\/.+)$/);
    if (!m) { err(p, 'translation files live at i18n/<lang>/content/<same path as English>'); continue; }
    const englishPath = join(CONTENT, m[2].slice('content/'.length));
    if (!existsSync(englishPath)) { err(p, `orphan: ${m[2]} does not exist`); continue; }
    const extra = Object.keys(t).filter(k => k !== 'strings');
    if (extra.length) err(p, `translation files hold only "strings" (found ${extra.join(', ')})`);
    const id = readYaml(englishPath).id;
    for (const [key, entry] of stringsOf(t.strings ?? {})) {
      if (typeof entry?.value !== 'string') { err(p, `${key}: needs value and src`); continue; }
      if (!entry.value.trim()) continue;                  // not yet translated: English is shown
      if (URL_OR_EMAIL.test(entry.value)) err(p, `${key}: a translation must not contain a URL or email address`);
      if (!hashes.get(id)?.has(key)) err(p, `${key}: no English string with this key`);
      else if (!entry.src) err(p, `${key}: missing src hash`);
    }
  }
  for (const path of walk(join(I18N, 'ui'))) {
    const t = readYaml(path) ?? {};
    for (const [k, v] of stringsOf(t.strings ?? {})) {
      const text = typeof v === 'string' ? v : v?.value;
      if (typeof text === 'string' && URL_OR_EMAIL.test(text)) err(rel(path), `${k}: UI strings must not contain URLs or email addresses`);
    }
  }

  // Volunteers: optional profiles; paths must exist, conflicts must name real records.
  const volunteerSchema = ajv.getSchema('https://aicitizenaction/schema/volunteer.schema.json');
  for (const path of walk(join(ROOT, 'volunteers'))) {
    const v = readYaml(path) ?? {};
    const p = rel(path);
    if (!volunteerSchema(v)) for (const e of volunteerSchema.errors) err(p, `schema: ${e.instancePath || '/'} ${e.message}`);
    if (v.handle && basename(p) !== `${v.handle}.yml`) err(p, `file name must be "${v.handle}.yml"`);
    for (const vp of v.paths ?? []) if (!existsSync(join(ROOT, vp))) err(p, `path ${vp} does not exist`);
    for (const c of v.conflicts ?? []) if (!ids.has(c.record)) err(p, `conflict names unknown record "${c.record}"`);
  }

  return { errors, warnings, count: records.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { errors, warnings, count } = validateAll();
  if (process.argv.includes('--json')) { console.log(JSON.stringify({ errors, warnings, count }, null, 2)); process.exit(errors.length ? 1 : 0); }
  for (const e of errors) console.error(`ERROR  ${e.path}: ${e.msg}`);
  const overdue = warnings.filter(w => w.msg.startsWith('overdue')).length;
  for (const w of warnings.filter(w => !w.msg.startsWith('overdue'))) console.warn(`WARN   ${w.path}: ${w.msg}`);
  console.log(`${count} files checked · ${errors.length} errors · ${warnings.length} warnings${overdue ? ` (${overdue} overdue for review)` : ''}`);
  process.exit(errors.length ? 1 : 0);
}
