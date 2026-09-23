// The path's routing: aim at the seat, never recommend what cannot be reached, be honest when
// nothing in the user's country has the power, and never lean towards one side.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadDirectory, loadContent } from '../scripts/lib/content.mjs';
import { route, contactRoute, recommendable, fillTemplate, diversify } from '../scripts/lib/routing.mjs';

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
