import { test } from 'node:test';
import assert from 'node:assert/strict';
import { actionableFindings, assignFindingOwners, findingMarker, issueFor, serviceLevel } from '../scripts/file-directory-issues.mjs';

test('directory findings produce stable marked issues with ownership and service levels', () => {
  const finding = { bucket: 'needs_human_review', key: 'contact:example:route', message: 'Re-check the route.', path: 'content/channels/us/example.yml' };
  const issue = issueFor(finding, '2026-09-24T12:00:00Z');
  assert.match(issue.title, /^\[directory\] needs_human_review:/);
  assert.ok(issue.body.includes(findingMarker(finding.key)));
  assert.match(issue.body, /7 days/);
  assert.match(issue.body, /aicitizenaction-maintainers/);
});

test('service levels are executable durations and owner queues overflow after twenty items', () => {
  assert.deepEqual(serviceLevel({ bucket: 'needs_human_review', key: 'contact:x' }), { label: '7 days', days: 7 });
  assert.deepEqual(serviceLevel({ bucket: 'needs_human_review', key: 'identity:x' }), { label: '14 days', days: 14 });
  assert.deepEqual(serviceLevel({ bucket: 'maintenance_due', key: 'record:x' }), { label: '30 days', days: 30 });
  const rows = Array.from({ length: 22 }, (_, i) => ({ key: `x:${i}`, path: 'content/channels/us/example.yml' }));
  const assigned = assignFindingOwners(rows, 20, path => path === 'HANDOVER.md' ? ['@maintainer'] : ['@steward']);
  assert.equal(assigned.filter(row => row.overflow).length, 2);
  assert.deepEqual(assigned.at(-1).owners, ['@maintainer']);
});

test('only actionable buckets become issues', () => {
  const report = { findings: {
    block_publication: [{ key: 'a' }], needs_human_review: [{ key: 'b' }],
    maintenance_due: [{ key: 'c' }], informational: [{ key: 'd' }]
  } };
  assert.deepEqual(actionableFindings(report).map(row => row.key), ['a', 'b', 'c']);
});
