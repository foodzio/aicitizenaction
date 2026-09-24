import test from 'node:test';
import assert from 'node:assert/strict';
import { redirectManifest } from '../scripts/build-redirects.mjs';
import { loadDirectory } from '../scripts/lib/content.mjs';

test('every retired id redirects directly in every built language', () => {
  const records = loadDirectory();
  const retired = records.reduce((sum, record) => sum + (record.meta.redirect_from?.length ?? 0), 0);
  const manifest = redirectManifest(records, ['en', 'fr']);
  assert.equal(Object.keys(manifest.redirects).length, retired * 2);
  assert.equal(manifest.redirects['/en/orgs/global-access-now-2/'], '/en/orgs/global-access-now/');
  for (const [from, to] of Object.entries(manifest.redirects)) {
    assert.notEqual(from, to);
    assert.equal(manifest.redirects[to], undefined, `${from} forms a chain`);
  }
});

test('redirect generation rejects active retired paths, which also prevents chains', () => {
  const active = { id: 'a', _section: 'orgs', meta: {} };
  const conflict = { id: 'b', _section: 'orgs', meta: { redirect_from: [{ section: 'orgs', id: 'a' }] } };
  assert.throws(() => redirectManifest([active, conflict], ['en']), /still active/);
  const chain = { id: 'c', _section: 'orgs', meta: { redirect_from: [{ section: 'orgs', id: 'b' }] } };
  assert.throws(() => redirectManifest([conflict, chain], ['en']), /still active/);
});
