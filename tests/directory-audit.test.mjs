import test from 'node:test';
import assert from 'node:assert/strict';
import { audit, baselineDrops, coverageDrops } from '../scripts/directory-audit.mjs';

test('fast directory audit passes current integrity gates and reports coverage', () => {
  const report = audit({ now: '2026-09-24' });
  assert.equal(report.ok, true);
  assert.deepEqual(report.findings.block_publication, []);
  assert.equal(report.metrics.identity_unresolved, 0);
  assert.equal(report.metrics.contact_routes_reviewed, report.metrics.contact_routes_total);
  assert.ok(report.metrics.no_current_contact_entities > 0, 'coverage must expose missing contacts');
});

test('coverage baseline blocks a reduction greater than five percent', () => {
  const baseline = { countries_with_current_contact: 18, topics_with_current_contact: 14 };
  assert.deepEqual(coverageDrops({ countries_with_current_contact: 18, topics_with_current_contact: 14 }, baseline), []);
  assert.deepEqual(coverageDrops({ countries_with_current_contact: 17, topics_with_current_contact: 13 }, baseline).map(row => row.key), ['countries_with_current_contact', 'topics_with_current_contact']);
});

test('baseline gate catches a drop above the smaller five-percent/ten-record limit', () => {
  const baseline = { counts: { bodies: 230, channels: 70 } };
  assert.deepEqual(baselineDrops({ bodies: 220, channels: 67 }, baseline), []);
  assert.deepEqual(baselineDrops({ bodies: 219, channels: 65 }, baseline).map(x => x.section), ['bodies', 'channels']);
});

test('old contact evidence fails publication rather than merely lowering a score', () => {
  const report = audit({ now: '2027-04-01' });
  assert.equal(report.ok, false);
  assert.ok(report.findings.block_publication.some(item => item.key.startsWith('contact:expired:')));
});
