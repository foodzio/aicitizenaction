import test from 'node:test';
import assert from 'node:assert/strict';
import { validateIdentityDecisions } from '../scripts/directory-identity-review.mjs';

const candidate = { key: 'a--b', severity: 'high', left: { id: 'a' }, right: { id: 'b' } };
const records = [
  { id: 'a', _section: 'orgs', meta: {} },
  { id: 'b', _section: 'orgs', meta: {} }
];
const valid = {
  key: 'a--b', records: ['a', 'b'], decision: 'same', canonical_id: 'a',
  evidence_urls: ['https://example.org/about'], reviewed_by: 'reviewer', approved_by: 'approver',
  reviewed_on: '2026-09-24', review_by: '2027-09-24'
};

test('an independently approved current same decision resolves a high candidate', () => {
  const result = validateIdentityDecisions({ inventory: { candidates: [candidate] }, ledger: { decisions: [valid] }, records, now: '2026-09-24' });
  assert.deepEqual(result.errors, []);
  assert.equal(result.warnings.length, 1);
  assert.equal(result.totals.resolved, 1);
});

test('high candidates cannot be absent, pending, expired, or self-approved', () => {
  const absent = validateIdentityDecisions({ inventory: { candidates: [candidate] }, ledger: { decisions: [] }, records, now: '2026-09-24' });
  assert.match(absent.errors.join('\n'), /needs a current decision/);
  const broken = { ...valid, decision: 'pending', approved_by: 'reviewer', review_by: '2026-09-23', note: 'researching' };
  const result = validateIdentityDecisions({ inventory: { candidates: [candidate] }, ledger: { decisions: [broken] }, records, now: '2026-09-24' });
  assert.match(result.errors.join('\n'), /expired/);
  assert.match(result.errors.join('\n'), /high-confidence candidate/);
});

test('a completed merge remains valid after the retired record becomes a redirect', () => {
  const merged = [{ id: 'a', _section: 'orgs', meta: { redirect_from: [{ section: 'orgs', id: 'b' }] } }];
  const result = validateIdentityDecisions({ inventory: { candidates: [] }, ledger: { decisions: [valid] }, records: merged, now: '2026-09-24' });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
});

test('ledger defaults reduce repetition without weakening required fields', () => {
  const { reviewed_by, reviewed_on, review_by, ...short } = valid;
  const ledger = { defaults: { reviewed_by, reviewed_on, review_by }, decisions: [short] };
  const result = validateIdentityDecisions({ inventory: { candidates: [candidate] }, ledger, records, now: '2026-09-24' });
  assert.deepEqual(result.errors, []);
});

test('parent-child decisions require the child record to name the reviewed parent', () => {
  const related = { ...valid, decision: 'related', relationship: 'parent-child', parent_id: 'a', child_id: 'b', canonical_id: undefined, approved_by: undefined };
  const missing = validateIdentityDecisions({ inventory: { candidates: [{ ...candidate, severity: 'low' }] }, ledger: { decisions: [related] }, records, now: '2026-09-24' });
  assert.match(missing.errors.join('\n'), /does not name the reviewed parent_id/);
  const linked = [records[0], { ...records[1], facts: { parent_id: 'a' } }];
  const result = validateIdentityDecisions({ inventory: { candidates: [{ ...candidate, severity: 'low' }] }, ledger: { decisions: [related] }, records: linked, now: '2026-09-24' });
  assert.deepEqual(result.errors, []);
});
