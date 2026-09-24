import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { candidateInventory, inventoryText, normalizeName } from '../scripts/directory-dedupe.mjs';
import { body, tree, runScript } from './helpers.mjs';

const record = (id, name, source, extra = {}) => body({
  id,
  geo: { country: 'us', sub: 'federal' },
  facts: { routes: [] },
  strings: { ...body().strings, name },
  meta: { ...body().meta, sources: [{ url: source, checked: '2026-09-22' }] },
  ...extra,
  _section: 'bodies',
  _path: `content/bodies/us/federal/${id}.yml`
});

test('name normalization is deterministic across punctuation and articles', () => {
  assert.equal(normalizeName('The Access—Now'), 'access now');
  assert.equal(normalizeName('Énergie & AI'), 'energie and ai');
});

test('candidate inventory flags same-entity evidence without deciding a merge', () => {
  const records = [
    record('us-access-now', 'Access Now', 'https://www.accessnow.org/contact/'),
    record('us-access-now-2', 'Access Now', 'https://accessnow.org/help/'),
    record('us-other', 'Other Body', 'https://other.example/contact/')
  ];
  const inventory = candidateInventory(records);
  assert.equal(inventory.totals.records, 3);
  assert.equal(inventory.totals.candidates, 1);
  assert.equal(inventory.candidates[0].severity, 'high');
  assert.deepEqual(inventory.candidates[0].signals, [
    'exact-normalized-name', 'numeric-suffix-sibling', 'shared-official-domain'
  ]);
  assert.equal(inventoryText(records), inventoryText(records), 'unchanged input must produce byte-identical output');
  assert.equal('decision' in inventory.candidates[0], false);
});

test('regenerating candidates cannot overwrite the human decision file', () => {
  const dir = tree({
    'content/bodies/us/federal/us-access-now.yml': record('us-access-now', 'Access Now', 'https://www.accessnow.org/contact/'),
    'content/bodies/us/federal/us-access-now-2.yml': record('us-access-now-2', 'Access Now', 'https://accessnow.org/help/')
  });
  const docs = join(dir, 'docs');
  mkdirSync(docs, { recursive: true });
  const decisions = join(docs, 'directory-identity-decisions.yml');
  writeFileSync(decisions, 'version: 1\ndecisions:\n  - key: human-kept\n');
  const before = readFileSync(decisions, 'utf8');
  const out = join(docs, 'directory-identity-candidates.yml');
  const result = runScript('directory-dedupe.mjs', dir, ['--out', out]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(decisions, 'utf8'), before);
  assert.match(readFileSync(out, 'utf8'), /us-access-now--us-access-now-2/);
});
