import { test } from 'node:test';
import assert from 'node:assert/strict';
import { actionableFindings, findingMarker, issueFor } from '../scripts/file-directory-issues.mjs';

test('directory findings produce stable marked issues with ownership and service levels', () => {
  const finding = { bucket: 'needs_human_review', key: 'contact:example:route', message: 'Re-check the route.', path: 'content/channels/us/example.yml' };
  const issue = issueFor(finding, '2026-09-24T12:00:00Z');
  assert.match(issue.title, /^\[directory\] needs_human_review:/);
  assert.ok(issue.body.includes(findingMarker(finding.key)));
  assert.match(issue.body, /7 days/);
  assert.match(issue.body, /aicitizenaction-maintainers/);
});

test('only actionable buckets become issues', () => {
  const report = { findings: {
    block_publication: [{ key: 'a' }], needs_human_review: [{ key: 'b' }],
    maintenance_due: [{ key: 'c' }], informational: [{ key: 'd' }]
  } };
  assert.deepEqual(actionableFindings(report).map(row => row.key), ['a', 'b', 'c']);
});
