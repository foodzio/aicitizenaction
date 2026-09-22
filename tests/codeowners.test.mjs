import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCodeowners, ownersOf, loadCodeowners } from '../scripts/lib/codeowners.mjs';

const rules = parseCodeowners(`
*                         @maint
/content/bodies/us/ca/    @geo-us-ca @domain-leg
/content/resources/       @editors
*.md                      @docs
`);

test('last matching pattern wins', () => {
  assert.deepEqual(ownersOf('content/bodies/us/ca/us-x.yml', rules), ['@geo-us-ca', '@domain-leg']);
  assert.deepEqual(ownersOf('content/bodies/us/ny/us-y.yml', rules), ['@maint']);
  assert.deepEqual(ownersOf('content/resources/media/2026/09/a.yml', rules), ['@editors']);
  assert.deepEqual(ownersOf('docs/x.md', rules), ['@docs']);
});

test('the repository CODEOWNERS gives every content path an owner', () => {
  assert.ok(ownersOf('content/bodies/us/federal/us-a.yml', loadCodeowners()).length > 0);
});
