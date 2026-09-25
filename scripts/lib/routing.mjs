// Chooses recipients for an outcome and a place. Pure functions over loaded records, so the
// site build and the tests share one implementation.
//
// First version (before phase 1b): matches on record type, concern tags and route types from
// content/guides/global/outcomes.yml. Records with meta.unsourced, or with no usable contact
// route, are never recommended. When nothing matches in the user's country the result says so
// (the "honest floor") and falls back to the bloc (EU) and then to global bodies.

export const CONTACT_TYPES = ['submission', 'consultation', 'evidence', 'form', 'email', 'complaint', 'disclosure',
  'reporting', 'whistleblowing', 'docket', 'petition', 'bounty', 'feedback', 'action', 'program'];
const INPUT_RANK = { open: 0, limited: 1, none: 2 };

export function dateAfter(date, days) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date ?? ''))) return null;
  const value = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(value.getTime())) return null;
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

/** Last calendar day on which a route's evidence permits a current recommendation. */
export function contactValidThrough(route) {
  const evidenceExpiry = dateAfter(route?.contact?.checked_on ?? route?.verified_on, 180);
  if (!evidenceExpiry) return null;
  const closes = route?.contact?.closes_on;
  return closes && closes < evidenceExpiry ? closes : evidenceExpiry;
}

/** Last calendar day on which a named office-holder may be presented as current. */
export const seatValidThrough = seat => dateAfter(seat?.verified_on, 90);

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

/** Structural mechanism represented by a route value; never inferred from its display label. */
export function contactValueKind(value) {
  const v = String(value ?? '').trim();
  if (/^https?:\/\/\S+$/i.test(v)) return 'web';
  if (/^[^\s@/]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) return 'email';
  if (/^\+?[\d().\s-]{7,}(?:\s*(?:x|ext\.?|extension)\s*\d+)?$/i.test(v)) return 'phone';
  return isUsableValue(v) ? 'details' : 'none';
}

/** Safe actionable href where the mechanism supports one-click contact. */
export function contactHref(route) {
  const value = String(route?.value ?? '').trim();
  const kind = contactValueKind(value);
  if (kind === 'web') return value;
  if (kind === 'email') return `mailto:${value}`;
  if (kind === 'phone') return `tel:${value.replace(/(?:\s*(?:x|ext\.?|extension)\s*\d+)?$/i, '').replace(/[^\d+]/g, '')}`;
  return null;
}

/** Controlled label family for the primary action. */
export function contactActionKind(route) {
  const kind = contactValueKind(route?.value);
  if (kind === 'email' || kind === 'phone' || kind === 'details') return kind;
  if (route?.type === 'consultation') return 'consultation';
  if (['submission', 'evidence', 'docket'].includes(route?.type)) return 'submission';
  if (['complaint', 'reporting', 'whistleblowing', 'disclosure', 'bounty'].includes(route?.type)) return 'report';
  if (route?.type === 'petition') return 'petition';
  if (route?.type === 'feedback') return 'feedback';
  return 'form';
}

// A conservative compatibility gate used while legacy records are being given structured
// contact evidence. These phrases are an explicit statement that the record is not a current
// inbound destination; a route must never outrank the record's own warning.
const CONTRADICTION = /^(?:n\/?a\b|nothing\b|not enacted\b)|\b(?:no (?:identified |verified |public )?(?:contact|channel|submission)|does not accept|doesn't accept|accepts nothing|outbound[- ]only|window has closed|no open consultation|could not confirm an open|most recent (?:verified )?(?:one|window|consultation) closed)\b/i;

function legacyContradiction(record, route) {
  const s = record.strings ?? {};
  const rs = s.routes?.[route.id] ?? {};
  return [s.accepts, s.how, s.timing, s.reality_check, s.note, rs.scope, rs.note]
    .filter(Boolean).some(x => CONTRADICTION.test(String(x).trim()));
}

export const CONTACT_PRESENTATION_STATES = Object.freeze([
  'verified', 'unverified', 'expired', 'closed', 'unusable', 'reference_only'
]);

const assessment = (state, reason, validThrough = null) => Object.freeze({
  state, reason, actionable: state === 'verified', validThrough
});

/**
 * One authoritative interpretation of a route for both policy and presentation.
 *
 * `state` is deliberately small and stable for UI use; `reason` preserves the exact factual
 * cause for tests, audits and explanatory copy. Components must render this result rather than
 * reconstructing eligibility from raw fields.
 */
export function contactRouteAssessment(record = {}, route, today = new Date().toISOString().slice(0, 10)) {
  if (!route || !isUsableValue(route.value)) return assessment('unusable', route ? 'unusable_value' : 'missing_route');

  const c = route.contact;
  if (c?.status === 'closed' || (c?.closes_on && c.closes_on < today)) return assessment('closed', 'window_closed', contactValidThrough(route));
  if (c?.opens_on && c.opens_on > today) return assessment('closed', 'window_not_open', contactValidThrough(route));

  if (record.facts?.recommend === false) return assessment('reference_only', 'record_not_recommended', contactValidThrough(route));
  if (record.facts?.public_input === 'none') return assessment('reference_only', 'no_public_input', contactValidThrough(route));
  if (!CONTACT_TYPES.includes(route.type)) return assessment('reference_only', 'not_contact_type', contactValidThrough(route));
  if (c?.status === 'none' || ['reference-only', 'remove'].includes(c?.disposition)) return assessment('reference_only', 'route_reference_only', contactValidThrough(route));
  if (legacyContradiction(record, route)) return assessment('reference_only', 'record_contradiction', contactValidThrough(route));

  // `verified` means the destination was actually opened. Unchecked and failed routes are useful
  // research leads, but must never be handed to a user as the place to send a finished message.
  if (record.meta?.unsourced) return assessment('unverified', 'record_unsourced', contactValidThrough(route));
  if (route.verified !== true) return assessment('unverified', 'route_unverified', contactValidThrough(route));

  // A route is a current recommendation only while its own evidence is current. Structured
  // contact reviews use checked_on; legacy reviewed routes use verified_on. Missing dates are an
  // evidence failure; elapsed dates get the distinct expired state.
  const expiresOn = contactValidThrough(route);
  if (!expiresOn) return assessment('unverified', 'missing_check_date');
  if (today > expiresOn) return assessment('expired', 'evidence_expired', expiresOn);

  if (c) {
    if (c.review !== 'reviewed') return assessment('unverified', 'review_pending', expiresOn);
    if (c.disposition !== 'keep') return assessment('unverified', 'disposition_not_keep', expiresOn);
    if (c.status === 'unknown') return assessment('unverified', 'status_unknown', expiresOn);
    if (!['open', 'limited'].includes(c.status)) return assessment('unverified', 'status_unsupported', expiresOn);
    if (!c.evidence_url || !c.checked_on) return assessment('unverified', 'missing_evidence', expiresOn);
    if (!c.eligible_users?.length) return assessment('unverified', 'missing_eligible_users', expiresOn);
    if (!c.accepted_subjects?.length) return assessment('unverified', 'missing_accepted_subjects', expiresOn);
    if (c.status === 'limited' && !c.restrictions) return assessment('unverified', 'missing_restrictions', expiresOn);
  }

  return assessment('verified', 'current_contact', expiresOn);
}

/**
 * Normalized, non-localized information contract consumed by every contact presentation.
 * Raw controlled terms are translated at the final UI boundary.
 */
export function contactRouteContract(record = {}, route, today = new Date().toISOString().slice(0, 10)) {
  const state = contactRouteAssessment(record, route, today);
  const valueKind = contactValueKind(route?.value);
  const c = route?.contact;
  const routeStrings = record.strings?.routes?.[route?.id] ?? {};
  const legacyAudience = record.facts?.public_input === 'open' ? ['public']
    : record.facts?.public_input === 'limited' ? ['users-meeting-published-eligibility']
      : ['users-following-published-instructions'];
  const legacyNote = routeStrings.note ?? routeStrings.scope ?? record.strings?.public_route
    ?? record.strings?.how ?? record.strings?.accepts ?? record.strings?.newcomer_action
    ?? record.strings?.the_ask ?? record.strings?.what_they_do ?? record.strings?.remit ?? null;
  const valueIsUrl = contactValueKind(route?.value) === 'web';
  return Object.freeze({
    recordId: record.id ?? null,
    routeId: route?.id ?? null,
    routeType: route?.type ?? null,
    state,
    mechanism: Object.freeze({
      kind: valueKind,
      value: route?.value ?? null,
      href: state.actionable ? contactHref(route) : null,
      actionKind: state.actionable ? contactActionKind(route) : null
    }),
    audience: Object.freeze([...(c?.eligible_users?.length ? c.eligible_users : legacyAudience)]),
    acceptedSubjects: Object.freeze([...(c?.accepted_subjects?.length ? c.accepted_subjects : record.facts?.tags ?? [])]),
    restrictions: c?.restrictions ?? null,
    evidence: Object.freeze({
      url: c?.evidence_url ?? record.meta?.sources?.[0]?.url ?? (valueIsUrl ? route.value : null),
      note: c?.evidence_note ?? legacyNote,
      checkedOn: c?.checked_on ?? route?.verified_on ?? null,
      basis: c ? 'structured' : 'legacy'
    })
  });
}

/** Whether one route is safe to present as a current inbound contact mechanism. */
export function eligibleContactRoute(record, route, today = new Date().toISOString().slice(0, 10)) {
  return contactRouteAssessment(record, route, today).actionable;
}

/** The route a user should use to reach this record, or null. */
export function contactRoute(record, today) {
  const routes = (record.facts?.routes ?? []).filter(r => eligibleContactRoute(record, r, today));
  const rank = r => CONTACT_TYPES.indexOf(r.type);
  return routes.sort((a, b) => rank(a) - rank(b))[0] ?? null;
}

export const membershipRoute = record => (record.facts?.routes ?? []).find(r => r.type === 'membership' && r.value) ?? null;

export function matches(record, match) {
  if (match.sections && !match.sections.includes(record._section)) return false;
  const roles = record.facts?.roles?.length ? record.facts.roles : [record.type];
  if (match.types && !match.types.some(type => roles.includes(type))) return false;
  const tags = new Set(record.facts?.tags ?? []);
  if (match.tags_any && !match.tags_any.some(t => tags.has(t))) return false;
  if (match.route_types_any && !(record.facts?.routes ?? []).some(r => r.value && match.route_types_any.includes(r.type))) return false;
  return true;
}

export const recommendable = record => record.facts?.recommend !== false && !record.meta?.unsourced && !!contactRoute(record);

/** Public Places to Contact contains only audited channel records with an eligible route. */
export const placeToContact = record => record._section === 'channels'
  && record.facts?.contact_disposition === 'keep'
  && !!contactRoute(record);

/** A seat-holder name that is a real person, not a placeholder like "Not applicable". */
export const isNamedPerson = name => !!name && !/^(not applicable|none|n\/a|vacant|not verified|unknown)/i.test(String(name).trim());

/** Whether a named office-holder has been checked within the 90-day seat horizon. */
export function isCurrentSeat(seat, today = new Date().toISOString().slice(0, 10)) {
  const expiresOn = seatValidThrough(seat);
  return isNamedPerson(seat?.name) && !!expiresOn && today <= expiresOn;
}

// Until phase 1b adds powers and topics, prefer full committees with a named chair over
// subcommittees, caucuses, task forces and participation systems. The brief's first insight:
// aim at the seat that decides what gets heard.
export function seatWeight(r) {
  const roles = r.facts?.roles?.length ? r.facts.roles : [r.type];
  if (!roles.includes('seat')) return 2;
  const name = r.strings?.name ?? '';
  if (/caucus|task force|route|system|method|portal|platform/i.test(name)) return 3;
  const chair = (r.facts?.seats ?? []).some(s => s.role === 'chair' && isCurrentSeat(s));
  if (/\bsubcommittee\b/i.test(name)) return chair ? 1 : 2;
  if (/\bcommittee\b|commission|\bcomit|委員会|위원회/i.test(name)) return chair ? 0 : 1;
  return chair ? 1 : 2;
}

function rank(outcome) {
  const prefer = outcome.prefer_types ?? [];
  return (a, b) => {
    const roles = r => r.facts?.roles?.length ? r.facts.roles : [r.type];
    const score = r => [
      prefer.some(type => roles(r).includes(type)) ? 0 : 1,
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

/** Routing fields count only once a person has reviewed them (phase 1b). */
export const reviewed = r => r.facts?.routing_review === 'reviewed';

/**
 * Topic fit for a reviewed record: 0 covers the topic, 1 unknown/not reviewed, 2 explicitly not here.
 * Unreviewed drafts never change the result.
 */
export function topicFit(r, topic) {
  if (!topic || !reviewed(r)) return 1;
  if ((r.facts.not_topics ?? []).includes(topic)) return 2;
  if ((r.facts.topics ?? []).includes(topic)) return 0;
  return 1;
}

/**
 * @param {object} outcome   one entry of outcomes.facts.outcomes
 * @param {{country?: string, sub?: string, topic?: string}} where   the user's place (country may be empty)
 *        and, optionally, what the concern is about — used only for reviewed records
 * @param {object[]} records all directory records
 * @param {{euMembers?: string[], max?: number}} opts
 * @returns {{ recipients: object[], scope: 'country'|'sub'|'bloc'|'global'|'any', floor: boolean, total: number }}
 */
export function route(outcome, where, records, { euMembers = [], max = 3 } = {}) {
  if (outcome.stop) return { recipients: [], scope: 'any', floor: false, total: 0 };
  const excluded = new Set(outcome.exclude_perspectives ?? []);
  const topic = where?.topic;
  const pool = records
    .filter(r => matches(r, outcome.match ?? {}) && recommendable(r) && !excluded.has(r.facts?.perspective))
    .filter(r => topicFit(r, topic) < 2)                    // a reviewed "NOT here" removes the record
    .sort((a, b) => topicFit(a, topic) - topicFit(b, topic) || rank(outcome)(a, b));
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
  const floorPool = outcome.floor_match
    ? records.filter(r => matches(r, outcome.floor_match) && recommendable(r)).sort(rank(outcome))
    : pool;
  return take(floorPool.filter(r => r.geo.country === 'global'), 'global', true);
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
