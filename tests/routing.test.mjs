// The path's routing: aim at the seat, never recommend what cannot be reached, be honest when
// nothing in the user's country has the power, and never lean towards one side.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadDirectory, loadContent } from '../scripts/lib/content.mjs';
import { route, contactRoute, eligibleContactRoute, recommendable, fillTemplate, diversify } from '../scripts/lib/routing.mjs';

const records = loadDirectory();
const guides = loadContent('guides');
const oc = guides.find(g => g.id === 'outcomes').facts;
const outcome = id => oc.outcomes.find(o => o.id === id);
const opts = { euMembers: oc.eu_members, max: oc.max_recipients };

test('US law: the Senate Commerce committee, which holds frontier AI, comes first', () => {
  const r = route(outcome('law'), { country: 'us' }, records, opts);
  assert.match(r.recipients[0].strings.name, /Senate Committee on Commerce/);
  assert.equal(r.scope, 'country');
  assert.equal(r.floor, false);
});

test('unsourced records and records with no reachable route are never recommended', () => {
  for (const o of oc.outcomes) for (const c of ['us', 'gb', 'eu', 'cl', 'nl', '']) {
    for (const x of route(o, { country: c }, records, opts).recipients) {
      assert.ok(recommendable(x), `${o.id}/${c}: ${x.id}`);
      assert.ok(!x.meta.unsourced);
    }
  }
});

test('an EU member with no national match falls back to EU bodies, and says so', () => {
  const r = route(outcome('law'), { country: 'se' }, records, opts);
  assert.equal(r.scope, 'bloc');
  assert.equal(r.floor, true);
  assert.ok(r.recipients.every(x => x.geo.country === 'eu'));
});

test('a country with nothing falls back to global bodies, and says so', () => {
  const r = route(outcome('law'), { country: 'zz' }, records, opts);
  assert.equal(r.scope, 'global');
  assert.equal(r.floor, true);
});

test('the insider outcome stops: no recipients at all', () => {
  const r = route(outcome('insider'), { country: 'us' }, records, opts);
  assert.equal(r.recipients.length, 0);
});

test('join shows different perspectives and excludes industry lobbying (open decision 4)', () => {
  const r = route(outcome('join'), { country: 'us' }, records, opts);
  const persp = r.recipients.map(x => x.facts.perspective);
  assert.equal(new Set(persp).size, persp.length);
  assert.ok(!persp.includes('industry-lobby'));
});

test('contact route prefers a verified route over an unverified one', () => {
  const rec = { facts: { routes: [
    { id: 'a', type: 'email', value: 'a@x.org', verified: false },
    { id: 'b', type: 'form', value: 'https://x.org/f', verified: true }
  ] } };
  assert.equal(contactRoute(rec).id, 'b');
});

test('regression: a bill attachment is not a contact route', () => {
  const argentina = records.find(r => r.id === 'ar-argentina-ai-governance');
  assert.ok(argentina);
  assert.equal(argentina.facts.routes[0].verified, false);
  assert.equal(contactRoute(argentina), null);
  assert.equal(recommendable(argentina), false);
});

test('a consultation listing with no currently open window is not a send-to route', () => {
  const meity = records.find(r => r.id === 'in-ministry-electronics-information-technology');
  assert.ok(meity);
  assert.match(meity.strings.note, /could not confirm an open consultation/i);
  assert.equal(contactRoute(meity), null);
});

test('regression: topical articles and papers are not contact destinations', () => {
  for (const id of [
    'global-perils-ai-safety-s-insularity-why',
    'global-house-evaluation-is-not-enough-third',
    'global-err-is-ai-evidence-what-makes'
  ]) {
    const record = records.find(r => r.id === id);
    assert.ok(record, id);
    assert.equal(contactRoute(record), null, id);
    assert.equal(recommendable(record), false, id);
  }
});

test('contact eligibility fails closed for unavailable, contradictory and expired routes', () => {
  const base = {
    facts: { public_input: 'open' }, meta: {}, strings: {},
  };
  const route = { id: 'r', type: 'form', value: 'https://example.org/report', verified: true };
  assert.equal(eligibleContactRoute(base, route, '2026-09-24'), true);
  assert.equal(eligibleContactRoute({ ...base, facts: { public_input: 'none' } }, route, '2026-09-24'), false);
  assert.equal(eligibleContactRoute({ ...base, strings: { accepts: 'Nothing from the public.' } }, route, '2026-09-24'), false);
  assert.equal(eligibleContactRoute(base, { ...route, verified: null }, '2026-09-24'), false);
  assert.equal(eligibleContactRoute(base, { ...route, contact: {
    status: 'open', directness: 'direct', eligible_users: ['public'], accepted_subjects: ['ai-incident'],
    evidence_url: route.value, checked_on: '2026-09-24', review: 'reviewed', closes_on: '2026-09-23'
  } }, '2026-09-24'), false);
});

test('every outcome with a template has one in draft-templates, and templates keep the user\'s words', () => {
  const tpl = guides.find(g => g.id === 'draft-templates').strings.templates;
  for (const o of oc.outcomes.filter(o => !o.stop)) {
    assert.ok(tpl[o.template], `template ${o.template}`);
    assert.match(fillTemplate(tpl[o.template], { recipient: 'X', own_words: 'MINE' }), /MINE/);
  }
});

test('diversify interleaves groups in rank order', () => {
  const r = (id, p) => ({ id, facts: { perspective: p } });
  assert.deepEqual(diversify([r(1, 'a'), r(2, 'a'), r(3, 'b')], 'perspective').map(x => x.id), [1, 3, 2]);
});

test('a recorded absence is never offered as an address', async () => {
  const { isUsableValue } = await import('../scripts/lib/routing.mjs');
  for (const v of ['none published', 'not published on the committee\'s public pages', 'not accepted', 'varies by Member State', 'midasproject.10', '/cms/pub/x.htm', ''])
    assert.equal(isUsableValue(v), false, v);
  for (const v of ['https://x.org/a', 'usersafety@anthropic.com', '1-877-FTC-HELP (1-877-382-4357)', '2321 Rayburn House Office Building, Washington DC 20515'])
    assert.equal(isUsableValue(v), true, v);
  for (const o of oc.outcomes) for (const c of ['us', 'gb', 'eu', '']) for (const x of route(o, { country: c }, records, opts).recipients) assert.ok(isUsableValue(contactRoute(x).value), x.id);
});

test('topics change routing only for reviewed records; a reviewed "not here" removes the record', async () => {
  const { topicFit } = await import('../scripts/lib/routing.mjs');
  const drafted = { facts: { routing_review: 'drafted', topics: ['copyright'], not_topics: ['privacy'] } };
  const done = { facts: { routing_review: 'reviewed', topics: ['copyright'], not_topics: ['privacy'] } };
  assert.equal(topicFit(drafted, 'copyright'), 1);
  assert.equal(topicFit(drafted, 'privacy'), 1);
  assert.equal(topicFit(done, 'copyright'), 0);
  assert.equal(topicFit(done, 'privacy'), 2);
  assert.equal(topicFit(done, undefined), 1);
});

test('apply-routing-drafts keeps only values backed by an exact quote from the record', async () => {
  const { checkDraft } = await import('../scripts/apply-routing-drafts.mjs');
  const { loadVocab } = await import('../scripts/lib/content.mjs');
  const rec = { strings: { ai_jurisdiction: 'Owns the FTC. NOT here: copyright (Judiciary).' } };
  const r = checkDraft(rec, {
    topics: ['consumer-protection', 'made-up', 'elections'],
    not_topics: ['copyright'],
    powers: ['fine'],
    evidence: { 'topics:consumer-protection': 'Owns the FTC.', 'topics:made-up': 'Owns', 'topics:elections': 'Handles elections', 'not_topics:copyright': 'NOT here: copyright', 'powers:fine': '' }
  }, loadVocab());
  assert.deepEqual(r.kept.topics, ['consumer-protection']);
  assert.deepEqual(r.kept.not_topics, ['copyright']);
  assert.deepEqual(r.kept.powers, []);
  assert.equal(r.dropped.length, 3);
});

test('regression (QA B7): "somewhere else" offers international bodies, never a method record or a placeholder chair', async () => {
  const { isNamedPerson } = await import('../scripts/lib/routing.mjs');
  for (const id of ['law', 'record', 'harm']) {
    const r = route(outcome(id), { country: 'zz' }, records, opts);
    assert.equal(r.scope, 'global');
    assert.ok(r.recipients.length > 0);
    for (const x of r.recipients) assert.notEqual(x.facts.recommend, false, x.id);
  }
  assert.equal(isNamedPerson('Not applicable'), false);
  assert.equal(isNamedPerson('Ted Cruz'), true);
});

test('every routed recipient in every available place has a verified, non-document destination or explicit submission instructions', () => {
  const where = [{}, { country: 'zz' }];
  const available = new Map();
  for (const r of records.filter(recommendable)) {
    if (r.geo.country !== 'global') available.set(`${r.geo.country}/${r.geo.sub ?? ''}`, { country: r.geo.country, ...(r.geo.sub && !['federal', 'multistate'].includes(r.geo.sub) ? { sub: r.geo.sub } : {}) });
  }
  where.push(...available.values());
  for (const o of oc.outcomes) for (const w of where) for (const r of route(o, w, records, opts).recipients) {
    const c = contactRoute(r);
    assert.equal(c?.verified, true, `${o.id}/${JSON.stringify(w)}: ${r.id}`);
    assert.notEqual(r.facts.public_input, 'none', r.id);
    const value = String(c.value);
    assert.ok(!/arxiv\.org|transformernews|\/adjuntos\//i.test(value), `${r.id}: ${value}`);
    if (/\.pdf(?:$|\?)/i.test(value)) {
      const instructions = `${r.strings.public_route ?? ''} ${r.strings.routes?.[c.id]?.note ?? ''}`;
      assert.match(instructions, /submit|testimony|witness|upload|email|account/i, `${r.id}: PDF without explicit submission instructions`);
    }
  }
});
