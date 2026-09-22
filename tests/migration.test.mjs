// Proves the migration from input/data/ lost nothing, and that content/ is valid.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadDirectory } from '../scripts/lib/content.mjs';
import { validate } from './helpers.mjs';

const input = f => JSON.parse(readFileSync(join(ROOT, 'input/data', f), 'utf8'));
const records = loadDirectory();
const routes = records.flatMap(r => r.facts.routes);

test('every input entity became exactly one record', () => {
  const inst = input('institutions.json').length;
  const { seats, orgs } = input('committees-and-organisations.json');
  assert.equal(records.length, inst + seats.length + orgs.length);
  // Two seat records in the input share an id (same-named House and Senate subcommittees),
  // so each legacy key must appear exactly as often as it does in the input.
  const inputKeys = [
    ...input('institutions.json').map(x => `input/data/institutions.json|${x.id}`),
    ...seats.map(x => `input/data/committees-and-organisations.json#seats|${x.id}`),
    ...orgs.map(x => `input/data/committees-and-organisations.json#orgs|${x.id}`)
  ].sort();
  const legacy = records.map(r => `${r.meta.migrated_from}|${r.meta.legacy_id}`).sort();
  assert.deepEqual(legacy, inputKeys, 'no entity migrated twice or dropped');
});

test('all 1,170 indexed sources survive with their three-state verification', () => {
  const index = input('sources-index.json');
  const indexed = routes.filter(r => r.source_id);
  assert.equal(indexed.length, index.sources.length);
  assert.deepEqual(new Set(indexed.map(r => r.source_id)), new Set(index.sources.map(s => s.source_id)));
  const byId = new Map(index.sources.map(s => [s.source_id, s]));
  for (const r of indexed) {
    const s = byId.get(r.source_id);
    assert.equal(r.verified, s.verified ?? null, `verification of ${s.entity} / ${s.label}`);
    assert.equal(r.value, s.value);
  }
  const count = v => indexed.filter(r => r.verified === v).length;
  assert.deepEqual([count(true), count(false), count(null)], [774, 145, 251]);
});

test('routes that were looked for and not found are kept as value: null, unverified', () => {
  const missing = routes.filter(r => r.value === null);
  const inputMissing = input('institutions.json').flatMap(x => x.routes).filter(r => !r.value);
  assert.equal(missing.length, inputMissing.length);
  for (const r of missing) assert.equal(r.verified, false);
});

test('all 589 institution routes are present', () => {
  const inst = records.filter(r => r.meta.migrated_from === 'input/data/institutions.json');
  const n = inst.reduce((a, r) => a + r.facts.routes.filter(x => !['homepage', 'framework'].includes(x.type)).length, 0);
  assert.equal(n, 589);
});

test('named seat-holders survive with their dates', () => {
  const holders = input('sources-index.json').named_seat_holders;
  const seats = records.flatMap(r => r.facts.seats ?? []);
  assert.equal(seats.length, holders.length);
  for (const s of seats) assert.match(s.verified_on, /^\d{4}-\d{2}-\d{2}$/);
});

test('verified_on is never carried onto unverified or unchecked routes', () => {
  for (const r of routes) if (r.verified !== true) assert.equal(r.verified_on ?? null, null);
});

test('the migrated tree passes validation', () => {
  const r = validate(null);
  assert.deepEqual(r.errors, []);
  assert.equal(r.code, 0);
});

test('routing fields are not guessed: every directory record lists what still needs research', () => {
  for (const r of records) {
    const researched = ['powers', 'topics', 'not_topics'].filter(k => r.facts[k]?.length);
    const pending = r.meta.needs_research ?? [];
    for (const k of researched) assert.ok(!pending.includes(k), `${r.id}: ${k} both filled and pending`);
    if (!researched.length) assert.ok(pending.length, `${r.id}: no routing fields and nothing marked needs_research`);
  }
});
