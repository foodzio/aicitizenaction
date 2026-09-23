// Chooses recipients for an outcome and a place. Pure functions over loaded records, so the
// site build and the tests share one implementation.
//
// First version (before phase 1b): matches on record type, concern tags and route types from
// content/guides/global/outcomes.yml. Records with meta.unsourced, or with no usable contact
// route, are never recommended. When nothing matches in the user's country the result says so
// (the "honest floor") and falls back to the bloc (EU) and then to global bodies.

const CONTACT_TYPES = ['submission', 'consultation', 'evidence', 'form', 'email', 'complaint', 'disclosure',
  'reporting', 'whistleblowing', 'docket', 'petition', 'bounty', 'feedback', 'action', 'program'];
const INPUT_RANK = { open: 0, limited: 1, none: 2 };

// Some routes record a confirmed absence in `value` ("none published", "not accepted"),
// and a few hold fragments. Only a URL, an email address, or a phone number / postal address
// can be offered to a user as a way to reach someone.
const ABSENCE = /^(none|n\/a|no |not |varies|\(an address)|not (yet |separately )?published|none (published|identified)/i;
export function isUsableValue(v) {
  const s = String(v ?? '').trim();
  if (!s || ABSENCE.test(s)) return false;
  if (/^https?:\/\/\S+$/i.test(s)) return true;
  if (/^[^\s@/]+@[^\s@]+\.[a-z]{2,}$/i.test(s)) return true;
  return /\d{3}/.test(s) && /[\s-]/.test(s);             // phone number or postal address
}

/** The route a user should use to reach this record, or null. Verified routes first. */
export function contactRoute(record) {
  const routes = (record.facts?.routes ?? []).filter(r => isUsableValue(r.value) && CONTACT_TYPES.includes(r.type));
  const rank = r => (r.verified === true ? 0 : r.verified === null ? 1 : 2) * 100 + CONTACT_TYPES.indexOf(r.type);
  return routes.sort((a, b) => rank(a) - rank(b))[0] ?? null;
}

export const membershipRoute = record => (record.facts?.routes ?? []).find(r => r.type === 'membership' && r.value) ?? null;

export function matches(record, match) {
  if (match.sections && !match.sections.includes(record._section)) return false;
  if (match.types && !match.types.includes(record.type)) return false;
  const tags = new Set(record.facts?.tags ?? []);
  if (match.tags_any && !match.tags_any.some(t => tags.has(t))) return false;
  if (match.route_types_any && !(record.facts?.routes ?? []).some(r => r.value && match.route_types_any.includes(r.type))) return false;
  return true;
}

export const recommendable = record => !record.meta?.unsourced && !!contactRoute(record);

// Until phase 1b adds powers and topics, prefer full committees with a named chair over
// subcommittees, caucuses, task forces and participation systems. The brief's first insight:
// aim at the seat that decides what gets heard.
export function seatWeight(r) {
  if (r.type !== 'seat') return 2;
  const name = r.strings?.name ?? '';
  if (/caucus|task force|route|system|method|portal|platform/i.test(name)) return 3;
  const chair = (r.facts?.seats ?? []).some(s => s.role === 'chair');
  if (/\bsubcommittee\b/i.test(name)) return chair ? 1 : 2;
  if (/\bcommittee\b|commission|\bcomit|委員会|위원회/i.test(name)) return chair ? 0 : 1;
  return chair ? 1 : 2;
}

function rank(outcome) {
  const prefer = outcome.prefer_types ?? [];
  return (a, b) => {
    const score = r => [
      prefer.includes(r.type) ? 0 : 1,
      seatWeight(r),
      INPUT_RANK[r.facts?.public_input] ?? 1,
      contactRoute(r)?.verified === true ? 0 : 1,
      -(r.facts?.routes ?? []).filter(x => x.verified === true).length,
      r.meta?.research_order ?? 9999
    ];
    const sa = score(a), sb = score(b);
    for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return sa[i] - sb[i];
    return a.strings.name.localeCompare(b.strings.name);
  };
}

/**
 * @param {object} outcome   one entry of outcomes.facts.outcomes
 * @param {{country?: string, sub?: string}} where   the user's place; country may be empty
 * @param {object[]} records all directory records
 * @param {{euMembers?: string[], max?: number}} opts
 * @returns {{ recipients: object[], scope: 'country'|'sub'|'bloc'|'global'|'any', floor: boolean, total: number }}
 */
export function route(outcome, where, records, { euMembers = [], max = 3 } = {}) {
  if (outcome.stop) return { recipients: [], scope: 'any', floor: false, total: 0 };
  const excluded = new Set(outcome.exclude_perspectives ?? []);
  const pool = records
    .filter(r => matches(r, outcome.match ?? {}) && recommendable(r) && !excluded.has(r.facts?.perspective))
    .sort(rank(outcome));
  const take = (list, scope, floor = false) => ({
    recipients: (outcome.diversify_by ? diversify(list, outcome.diversify_by) : list).slice(0, max), scope, floor, total: list.length
  });

  if (outcome.ignore_geo || !where?.country) return take(pool, 'any');
  const c = where.country;
  if (where.sub) {
    const local = pool.filter(r => r.geo.country === c && r.geo.sub === where.sub);
    if (local.length) return take(local, 'sub');
  }
  const national = pool.filter(r => r.geo.country === c && (!r.geo.sub || r.geo.sub === 'federal'));
  if (national.length) return take(national, 'country');
  const anyInCountry = pool.filter(r => r.geo.country === c);
  if (anyInCountry.length) return take(anyInCountry, 'country');
  if (euMembers.includes(c)) {
    const bloc = pool.filter(r => r.geo.country === 'eu');
    if (bloc.length) return take(bloc, 'bloc', true);
  }
  return take(pool.filter(r => r.geo.country === 'global'), 'global', true);
}

/** Round-robin across values of facts[field], keeping rank order within each value. */
export function diversify(list, field) {
  const groups = new Map();
  for (const r of list) {
    const k = r.facts?.[field] ?? '';
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  const out = [];
  const queues = [...groups.values()];
  while (queues.some(q => q.length)) for (const q of queues) if (q.length) out.push(q.shift());
  return out;
}

/** Countries (and US states) that have at least one recommendable record for any outcome. */
export function places(records) {
  const out = new Map();
  for (const r of records) {
    if (!recommendable(r)) continue;
    const c = r.geo.country;
    if (c === 'global') continue;
    if (!out.has(c)) out.set(c, new Set());
    if (r.geo.sub && r.geo.sub !== 'federal' && r.geo.sub !== 'multistate') out.get(c).add(r.geo.sub);
  }
  return out;
}

/** Fills a draft template. Unknown placeholders are left visible so nothing is silently dropped. */
export function fillTemplate(template, values) {
  return template.replace(/\{([a-z_]+)\}/g, (m, k) => (values[k] ?? m));
}
