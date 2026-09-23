// The counting endpoint: only known events, only totals, nothing that identifies anyone.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp, createCounter, summary } from '../server.mjs';

function start(counter, publicDir) {
  const app = createApp({ counter, publicDir });
  return new Promise(r => app.listen(0, '127.0.0.1', () => r({ app, base: `http://127.0.0.1:${app.address().port}` })));
}
const post = (base, body, headers = {}) => fetch(`${base}/api/count`, { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body), headers: { 'content-type': 'application/json', ...headers } });

test('counts known events per day and outcome; rejects everything else', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'aica-count-'));
  const file = join(dir, 'counts.json');
  const counter = createCounter(file);
  const { app, base } = await start(counter, dir);
  assert.equal((await post(base, { e: 'door', o: 'none' })).status, 204);
  assert.equal((await post(base, { e: 'draft_copied', o: 'law' })).status, 204);
  assert.equal((await post(base, { e: 'own_words', o: 'law' })).status, 204);
  assert.equal((await post(base, { e: 'email', o: 'law' })).status, 400);
  assert.equal((await post(base, { e: 'door', o: '<script>' })).status, 400);
  assert.equal((await post(base, 'not json')).status, 400);
  const big = await post(base, { e: 'door', o: 'none', pad: 'x'.repeat(500) }).catch(() => ({ status: 'dropped' }));
  assert.notEqual(big.status, 204);
  counter.flush();
  const saved = JSON.parse(readFileSync(file, 'utf8'));
  const day = Object.keys(saved)[0];
  assert.deepEqual(saved[day], { 'door|none': 1, 'draft_copied|law': 1, 'own_words|law': 1 });
  app.closeAllConnections(); app.close();
});

test('nothing identifying is stored, and no cookie is ever set', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'aica-count-'));
  const file = join(dir, 'counts.json');
  const counter = createCounter(file);
  const { app, base } = await start(counter, dir);
  const r = await post(base, { e: 'door', o: 'none', ip: '1.2.3.4', text: 'my secret words' }, { 'x-forwarded-for': '9.9.9.9', 'user-agent': 'TestAgent/1.0' });
  assert.equal(r.status, 204);
  assert.equal(r.headers.get('set-cookie'), null);
  counter.flush();
  const raw = readFileSync(file, 'utf8');
  for (const s of ['1.2.3.4', '9.9.9.9', 'TestAgent', 'secret', '127.0.0.1']) assert.ok(!raw.includes(s), s);
  const pub = await (await fetch(`${base}/api/counts`)).json();
  assert.equal(pub.totals['door|none'], 1);
  app.closeAllConnections(); app.close();
});

test('the static site is served, with the site 404 page for unknown paths', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'aica-site-'));
  mkdirSync(join(dir, 'en'), { recursive: true });
  writeFileSync(join(dir, 'en', 'index.html'), '<h1>door</h1>');
  writeFileSync(join(dir, '404.html'), '<h1>not here</h1>');
  const { app, base } = await start(createCounter(null), dir);
  assert.match(await (await fetch(`${base}/en/`)).text(), /door/);
  const nf = await fetch(`${base}/nope/`);
  assert.equal(nf.status, 404);
  assert.match(await nf.text(), /not here/);
  app.closeAllConnections(); app.close();
});

test('summary gives completion and own-words rates from totals only', () => {
  const s = summary({ '2026-09-23': { 'door|none': 10, 'draft_copied|law': 2, 'draft_downloaded|harm': 1, 'own_words|law': 2 } });
  assert.equal(s.completion_rate, 30);
  assert.equal(Math.round(s.own_words_rate), 67);
});

test('the page code uses no cookies or device storage', () => {
  const src = readFileSync(new URL('../site/lib/measure.js', import.meta.url), 'utf8').replace(/\/\/.*$/gm, '');
  for (const w of ['document.cookie', 'localStorage', 'sessionStorage', 'indexedDB']) assert.ok(!src.includes(w), w);
  assert.match(src, /credentials: 'omit'/);
});
