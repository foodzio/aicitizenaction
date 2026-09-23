// Volunteer tooling: charters, freshness, inactivity decisions and volunteer profiles.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { charter, charterMarkdown } from '../scripts/charter.mjs';
import { freshness, recordState } from '../scripts/lib/freshness.mjs';
import { decide } from '../scripts/inactivity.mjs';
import { tree, validate, body } from './helpers.mjs';

test('a charter lists a steward\'s records and gives one small first task', () => {
  const c = charter({ path: 'content/bodies/in/', now: '2026-09-23' });
  assert.ok(c.directory.length > 0);
  assert.ok(c.overdue.every(r => r._path.startsWith('content/bodies/in/')));
  assert.match(charterMarkdown(c), /Your first task:/);
});

test('record state: unsourced beats overdue beats current', () => {
  assert.equal(recordState({ meta: { review_by: '2026-01-01', unsourced: 'x' } }, '2026-09-23'), 'unsourced');
  assert.equal(recordState({ meta: { review_by: '2026-01-01' } }, '2026-09-23'), 'overdue');
  assert.equal(recordState({ meta: { review_by: '2027-01-01' } }, '2026-09-23'), 'current');
});

test('freshness covers every directory record and reports the Resources balance', () => {
  const f = freshness({ now: '2026-09-23' });
  const sum = Object.values(f.bySection).reduce((n, v) => n + v.total, 0);
  assert.equal(sum, f.overall.total);
  assert.ok(Object.keys(f.balance.sources).length >= 4, 'at least four perspectives watched');
});

test('inactivity: check in only when quiet AND overdue; propose handover only after no reply', () => {
  const old = new Date(Date.now() - 90 * 864e5).toISOString();
  const recent = new Date(Date.now() - 5 * 864e5).toISOString();
  assert.equal(decide({ lastActivity: old, overdueCount: 3 }), 'check-in');
  assert.equal(decide({ lastActivity: old, overdueCount: 0 }), 'none');
  assert.equal(decide({ lastActivity: recent, overdueCount: 3 }), 'none');
  assert.equal(decide({ openCheckIn: {}, checkInOpenedAt: old, repliedSince: false }), 'propose-alumni');
  assert.equal(decide({ openCheckIn: {}, checkInOpenedAt: old, repliedSince: true }), 'wait');
  assert.equal(decide({ openCheckIn: {}, checkInOpenedAt: recent, repliedSince: false }), 'wait');
});
