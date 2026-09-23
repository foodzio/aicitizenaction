// Translation honesty: a changed English string makes its translation stale, a stale translation is
// never shown, translators cannot introduce URLs, and orphans are caught.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hash, resolveString } from '../scripts/lib/i18n.mjs';
import { syncStrings } from '../scripts/i18n-sync.mjs';
import { tree, validate, body } from './helpers.mjs';

test('a translation made from the current English is shown; after the English changes it is not', () => {
  const en1 = 'Frontier AI rules land here.';
  const tr = { value: 'Les règles sur l’IA de frontière relèvent d’ici.', src: hash(en1) };
  assert.equal(resolveString(en1, tr, 'fr').state, 'translated');
  const en2 = 'Frontier AI rules and the FTC land here.';
  const r = resolveString(en2, tr, 'fr');
  assert.equal(r.state, 'stale');
  assert.equal(r.text, en2);
  assert.equal(r.lang, 'en');
});

test('machine translations are labelled; missing ones fall back to English', () => {
  assert.equal(resolveString('Hi', { value: 'Salut', src: hash('Hi'), machine: true }, 'fr').state, 'machine');
  assert.equal(resolveString('Hi', undefined, 'fr').state, 'fallback');
});

test('sync keeps translated values, adds missing keys, flags stale ones, and stamps only when asked', () => {
  const en = { a: 'One', b: 'Two', c: 'Three' };
  const tr = { a: { value: 'Un', src: hash('One') }, b: { value: 'Deux', src: hash('Old two') }, d: { value: 'orphan', src: 'x' } };
  const { strings, report } = syncStrings(en, tr);
  assert.equal(strings.a.value, 'Un');
  assert.equal(strings.c.value, '');
  assert.deepEqual([report.current, report.stale, report.missing, report.removed], [1, 1, 1, 1]);
  const fresh = syncStrings(en, { c: { value: 'Trois' } }, { stamp: true });
  assert.equal(fresh.strings.c.src, hash('Three'));
});

test('validator: translations hold strings only, no URLs, real keys, and no orphans', () => {
  const P = 'content/bodies/us/federal/us-test-committee.yml';
  const r = validate(tree({
    [P]: body(),
    [`i18n/fr/${P}`]: { strings: { name: { value: 'Voir https://evil.example', src: hash('Test Committee') }, ghost: { value: 'x', src: 'y' } }, facts: { url: 'x' } },
    'i18n/fr/content/bodies/us/federal/deleted.yml': { strings: {} }
  }));
  const msgs = r.errors.map(e => e.msg).join('\n');
  assert.match(msgs, /must not contain a URL/);
  assert.match(msgs, /no English string with this key/);
  assert.match(msgs, /hold only "strings"/);
  assert.match(msgs, /orphan/);
});
