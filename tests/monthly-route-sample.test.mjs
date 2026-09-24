import { test } from 'node:test';
import assert from 'node:assert/strict';
import { previousMonth, routeSample, sampleMarkdown } from '../scripts/monthly-route-sample.mjs';

const record = n => ({
  id: `record-${n}`, _section: 'channels', _path: `content/channels/global/record-${n}.yml`, meta: {}, strings: {},
  facts: { public_input: 'open', routes: [{
    id: 'route', type: 'form', value: `https://example.org/${n}`, verified: true,
    contact: { status: 'open', review: 'reviewed', directness: 'direct', checked_on: '2026-08-15', evidence_url: `https://example.org/${n}`, eligible_users: ['public'], accepted_subjects: ['harm'] }
  }] }
});

test('monthly sample is deterministic, at least five, and ten percent for larger populations', () => {
  const records = Array.from({ length: 60 }, (_, i) => record(i));
  const first = routeSample(records, '2026-08');
  const second = routeSample(records, '2026-08');
  assert.equal(first.population, 60);
  assert.equal(first.sample_size, 6);
  assert.deepEqual(first, second);
  assert.match(sampleMarkdown(first), /HTTP 200 alone is not a pass/);
  assert.equal(routeSample(records, '2026-07').sample_size, 0);
});

test('previousMonth handles a year boundary in UTC', () => {
  assert.equal(previousMonth(new Date('2026-01-05T00:00:00Z')), '2025-12');
});
