import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMergePlan, mergeRecords } from '../scripts/apply-identity-decisions.mjs';

const record = (id, section, type, route) => ({
  id, type, geo: { country: 'global' },
  facts: { routes: [route] }, strings: { name: id, routes: { [route.id]: { label: route.id } } },
  meta: { verified_on: '2026-09-24', review_by: '2027-03-23', sources: [{ url: `https://example.org/${id}`, checked: '2026-09-24' }], legacy_id: `legacy-${id}` },
  _section: section, _path: `content/${section}/global/${id}.yml`
});
const a = record('a', 'orgs', 'organisation', { id: 'contact', type: 'email', value: 'a@example.org', verified: true, verified_on: '2026-09-24' });
const b = record('b', 'channels', 'reporting-channel', { id: 'contact', type: 'form', value: 'https://example.org/form', verified: true, verified_on: '2026-09-24' });
const decision = { key: 'a--b', records: ['a', 'b'], decision: 'same', canonical_id: 'a', evidence_urls: ['https://example.org/a'], reviewed_by: 'reviewer', approved_by: 'approver', reviewed_on: '2026-09-24', review_by: '2027-03-23', note: 'same' };

test('merge preserves roles, legacy ids, routes, redirects and field provenance', () => {
  const merged = mergeRecords(a, b, decision, () => 'entity-fixed');
  assert.equal(merged.facts.entity_key, 'entity-fixed');
  assert.deepEqual(merged.facts.roles, ['organisation', 'reporting-channel']);
  assert.equal(merged.facts.routes.length, 2);
  assert.notEqual(merged.facts.routes[0].id, merged.facts.routes[1].id);
  assert.deepEqual(merged.meta.legacy_ids, ['legacy-a', 'legacy-b']);
  assert.deepEqual(merged.meta.redirect_from, [{ section: 'channels', id: 'b' }]);
  assert.equal(merged.meta.merge_provenance['facts.routes'].length, 2);
});

test('merge plan accepts approved same decisions and rejects self approval', () => {
  const good = buildMergePlan([a, b], { decisions: [decision] });
  assert.equal(good.merges.length, 1);
  assert.deepEqual(good.errors, []);
  const bad = buildMergePlan([a, b], { decisions: [{ ...decision, approved_by: 'reviewer' }] });
  assert.match(bad.errors.join('\n'), /independent approval/);
});

test('identical routes retain every indexed source without a duplicate public route', () => {
  const first = record('a', 'orgs', 'organisation', { id: 'contact', type: 'form', value: 'https://example.org/form', verified: true, verified_on: '2026-09-24', source_id: 'source-a' });
  const second = record('b', 'orgs', 'organisation', { id: 'contact', type: 'form', value: 'https://example.org/form', verified: true, verified_on: '2026-09-24', source_id: 'source-b' });
  const merged = mergeRecords(first, second, decision, () => 'entity-fixed');
  assert.equal(merged.facts.routes.length, 1);
  assert.deepEqual(merged.facts.routes[0].source_ids, ['source-a', 'source-b']);
});
