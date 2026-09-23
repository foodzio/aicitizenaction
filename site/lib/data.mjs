// Build-time data for the site. Everything is read from content/ and i18n/ through the same
// loaders the scripts use, so the site can never disagree with the validator.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadDirectory, loadContent, loadVocab, vocabLabel, readYaml, walk, I18N, ROOT } from '../../scripts/lib/content.mjs';
import { stringsOf, resolveString } from '../../scripts/lib/i18n.mjs';
import { route, places, contactRoute, membershipRoute, fillTemplate, isNamedPerson } from '../../scripts/lib/routing.mjs';

export const REPO = 'https://github.com/sinscrit/aicitizenaction';
export const SECTIONS = ['bodies', 'channels', 'orgs'];

let cache;
export function data() {
  if (cache) return cache;
  const records = loadDirectory();
  const guides = loadContent('guides');
  const byId = new Map(records.map(r => [r.id, r]));
  cache = { records, guides, byId, vocab: loadVocab(), guide: id => guides.find(g => g.id === id) };
  return cache;
}

/** Languages the site builds. English always; others when i18n/<lang>/status.yml exists. */
export function languages() {
  const out = [{ code: 'en', public: true, name: 'English' }];
  for (const p of walk(I18N)) {
    const m = p.match(/i18n\/([a-z]{2,3})\/status\.yml$/);
    if (!m) continue;
    const s = readYaml(p) ?? {};
    out.push({ code: m[1], public: s.ui_approved === true, name: s.name ?? m[1] });
  }
  return out;
}

const flat = obj => Object.fromEntries(stringsOf(obj ?? {}));
const EN_UI = flat(readYaml(join(I18N, 'ui', 'en.yml')).strings);

/** t(key) for a language: translated if current, otherwise English. */
export function ui(lang) {
  const tr = lang !== 'en' && existsSync(join(I18N, 'ui', `${lang}.yml`)) ? flat(readYaml(join(I18N, 'ui', `${lang}.yml`)).strings) : {};
  const t = key => {
    const en = EN_UI[key];
    if (en === undefined) return key;
    return resolveString(en, tr[key], lang).text;
  };
  t.state = key => resolveString(EN_UI[key], tr[key], lang).state;
  return t;
}

/** A record's strings for a language, each { text, lang, state }. */
export function recordStrings(record, lang) {
  const out = {};
  let tr = {};
  if (lang !== 'en') {
    const p = join(I18N, lang, record._path);
    if (existsSync(p)) tr = flat(readYaml(p)?.strings);
  }
  for (const [key, value] of stringsOf(record.strings ?? {})) {
    if (typeof value === 'string') out[key] = resolveString(value, tr[key], lang);
  }
  return out;
}

/** g(key) for one guide's strings in a language, e.g. g('outcomes.law.label'). Falls back to English. */
export function guideText(id, lang) {
  const s = recordStrings(data().guide(id), lang);
  const g = key => s[key]?.text ?? key;
  g.lang = key => s[key]?.lang ?? 'en';
  return g;
}

const STATES = { ca: 'California', co: 'Colorado', ct: 'Connecticut', il: 'Illinois', ma: 'Massachusetts', md: 'Maryland',
  mn: 'Minnesota', nj: 'New Jersey', ny: 'New York', tx: 'Texas', ut: 'Utah', va: 'Virginia', wa: 'Washington', multistate: 'Several states', federal: 'Federal' };

export function placeName(geo, lang = 'en') {
  const c = geo?.country;
  let name;
  if (c === 'global') name = 'International';
  else if (c === 'eu') name = 'European Union';
  else { try { name = new Intl.DisplayNames([lang, 'en'], { type: 'region' }).of(c.toUpperCase()); } catch { name = c; } }
  if (geo?.sub && geo.sub !== 'federal') name = `${STATES[geo.sub] ?? geo.sub}, ${name}`;
  return name;
}

export const stateName = s => STATES[s] ?? s;

export function firstSentences(text, n = 2, max = 420) {
  if (!text) return '';
  // Research notes open with working tags ("VERIFIED:", "UNVERIFIED —"); the card shows the
  // verification as a label instead, so drop the tag from the prose.
  const parts = String(text).replace(/\s+/g, ' ').replace(/^(UN)?VERIFIED\b[:\s—–-]*/, '').split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/);
  let out = parts.slice(0, n).join(' ');
  if (out.length > max) out = out.slice(0, max).replace(/\s+\S*$/, '') + '…';
  return out;
}

export const recordUrl = (lang, r) => `/${lang}/${r._section}/${r.id}/`;
export const reportUrl = r => `${REPO}/issues/new?template=report-record.yml&record=${encodeURIComponent(r.id)}&title=${encodeURIComponent(`Record: ${r.id}`)}`;

export function isOverdue(r, now = new Date().toISOString().slice(0, 10)) {
  return r.meta?.review_by && r.meta.review_by < now;
}

// Salutations drop research asides in brackets: "(committee id 135; formerly …)".
const plain = s => String(s).replace(/\s*\([^)]*\)/g, '').split(' / ')[0].replace(/\s+/g, ' ').trim();

/** The compact card the path shows for a recipient. */
export function card(r, lang) {
  const s = recordStrings(r, lang);
  const text = k => s[k]?.text ?? '';
  const chair = (r.facts.seats ?? []).find(x => x.role === 'chair' && isNamedPerson(x.name));
  const contact = contactRoute(r);
  const member = membershipRoute(r);
  const { vocab } = data();
  return {
    id: r.id,
    section: r._section,
    name: text('name'),
    type: vocabLabel(vocab, 'record-types', r.type),
    place: placeName(r.geo, lang),
    canDo: firstSentences(text('ai_jurisdiction') || text('remit') || text('what_they_do') || text('the_ask'), 2),
    leverage: firstSentences(text('realistic') || text('reality_check') || text('caution') || text('newcomer_action'), 2),
    how: firstSentences(text('public_route') || text('how') || text(`routes.${contact?.id}.note`) || text(`routes.${contact?.id}.scope`), 2),
    contact: contact && {
      type: vocabLabel(vocab, 'route-types', contact.type),
      label: text(`routes.${contact.id}.label`),
      value: contact.value,
      verified: contact.verified,
      verifiedOn: contact.verified_on ?? null,
      language: contact.language ?? null,
      isUrl: /^https?:\/\//.test(contact.value)
    },
    membership: member?.value ?? null,
    seats: (r.facts.seats ?? []).filter(x => isNamedPerson(x.name)).map(x => ({ role: x.role, name: x.name, party: x.party ?? '', region: x.region ?? '', verifiedOn: x.verified_on })),
    checked: r.meta.verified_on,
    overdue: isOverdue(r),
    recipient: chair ? `${plain(chair.name)}, Chair, ${plain(text('name'))}` : plain(text('name')),
    url: recordUrl(lang, r)
  };
}

/** Everything one outcome page needs, precomputed for every place so the browser does no routing. */
export function outcomePayload(outcome, lang) {
  const { records, guide } = data();
  const oc = guide('outcomes').facts;
  const opts = { euMembers: oc.eu_members, max: oc.max_recipients };
  const result = where => {
    const r = route(outcome, where, records, opts);
    return { scope: r.scope, floor: r.floor, total: r.total, recipients: r.recipients.map(x => card(x, lang)) };
  };
  if (outcome.ask === 'company') {
    const all = route(outcome, {}, records, { ...opts, max: 200 }).recipients;
    const cards = all.map(x => ({ ...card(x, lang), isCompany: x.type === 'company' }));
    return { '': { scope: 'any', floor: false, total: cards.length, recipients: cards } };
  }
  const byPlace = { '': result({}) };
  if (!outcome.ignore_geo && !outcome.stop) {
    for (const [c, subs] of places(records)) {
      byPlace[c] = result({ country: c });
      for (const s of subs) byPlace[`${c}/${s}`] = result({ country: c, sub: s });
    }
    for (const c of oc.eu_members) if (!byPlace[c]) byPlace[c] = result({ country: c });
    byPlace.zz = result({ country: 'zz' });
  }
  return byPlace;
}

export function placeOptions(lang) {
  const { records, guide } = data();
  const oc = guide('outcomes').facts;
  const pl = places(records);
  const codes = new Set([...pl.keys(), ...oc.eu_members].filter(c => c !== 'eu'));
  const countries = [...codes].map(c => ({ code: c, name: placeName({ country: c }, lang) })).sort((a, b) => a.name.localeCompare(b.name, lang));
  const states = [...(pl.get('us') ?? [])].map(s => ({ code: s, name: stateName(s) })).sort((a, b) => a.name.localeCompare(b.name));
  return { countries, states };
}

export { fillTemplate, ROOT };
