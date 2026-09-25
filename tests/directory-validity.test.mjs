import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validityManifest } from '../scripts/build-directory-validity.mjs';

const route = checked => ({
  id: 'report', type: 'form', value: 'https://example.org/report', verified: true,
  contact: {
    status: 'open', review: 'reviewed', directness: 'direct', disposition: 'keep', checked_on: checked,
    eligible_users: ['public'], accepted_subjects: ['ai-incident'], evidence_url: 'https://example.org/report'
  }
});

test('validity manifest uses the earliest contact, closure and seat horizons', () => {
  const records = [{
    id: 'global-example', _section: 'channels', meta: {}, strings: {},
    facts: {
      public_input: 'open', routes: [route('2026-01-01'), { ...route('2026-01-10'), id: 'closing', contact: { ...route('2026-01-10').contact, closes_on: '2026-02-01' } }],
      seats: [{ role: 'chair', name: 'Ada Example', verified_on: '2026-01-15' }]
    }
  }];
  const manifest = validityManifest(records, ['en', 'fr'], '2026-01-20');
  assert.equal(manifest.contact_valid_through, '2026-02-01');
  assert.equal(manifest.recommendation_valid_through, '2026-02-01');
  assert.equal(manifest.paths['/en/channels/global-example/'], '2026-02-01');
  assert.equal(manifest.paths['/fr/channels/global-example/'], '2026-02-01');
});

test('already stale facts do not create a future-valid path', () => {
  const records = [{
    id: 'global-stale', _section: 'channels', meta: {}, strings: {},
    facts: { public_input: 'open', routes: [route('2025-01-01')], seats: [{ role: 'chair', name: 'Ada Example', verified_on: '2025-01-01' }] }
  }];
  const manifest = validityManifest(records, ['en'], '2026-01-20');
  assert.equal(manifest.contact_valid_through, null);
  assert.equal(manifest.recommendation_valid_through, null);
  assert.deepEqual(manifest.paths, {});
});
