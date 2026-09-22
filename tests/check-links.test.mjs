// The link check must separate real breakage from sites that merely block automated requests.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tree, runScript, body } from './helpers.mjs';

let server, base;
before(async () => {
  server = createServer((req, res) => {
    const routes = {
      '/ok': [200], '/gone': [404], '/blocked': [403], '/limited': [429], '/boom': [500],
      '/head-hater': req.method === 'HEAD' ? [405] : [200],
      '/challenge': [503, '<html><div id="challenge-platform">checking your browser</div></html>'],
      '/hop': [301, '', { location: '/ok' }]
    };
    const [code, text = '', headers = {}] = routes[req.url] ?? [404];
    res.writeHead(code, headers); res.end(text);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

function treeWithUrls(paths) {
  const b = body();
  b.facts.routes = paths.map((p, i) => ({ id: `r${i}`, type: 'form', value: `${base}${p}`, verified: null }));
  b.strings.routes = {};
  b.meta.sources = [{ url: `${base}/ok` }];
  return tree({ 'content/bodies/us/federal/us-test-committee.yml': b });
}

async function check(dir, extra = []) {
  const out = join(dir, 'out.json');
  // runScript is synchronous, but the server runs in this process — so spawn asynchronously.
  const { spawn } = await import('node:child_process');
  const { ROOT } = await import('../scripts/lib/content.mjs');
  const code = await new Promise(resolve => {
    const p = spawn(process.execPath, [join(ROOT, 'scripts/check-links.mjs'), '--out', out, '--timeout', '3000', ...extra], {
      env: { ...process.env, AICA_CONTENT: join(dir, 'content'), AICA_I18N: join(dir, 'i18n') }, stdio: 'ignore'
    });
    p.on('exit', resolve);
  });
  const { readFileSync } = await import('node:fs');
  return { code, ...JSON.parse(readFileSync(out, 'utf8')) };
}

test('classifies ok, broken, blocked, rate-limited, challenge and HEAD-refusing servers', async () => {
  const dir = treeWithUrls(['/ok', '/gone', '/blocked', '/limited', '/boom', '/head-hater', '/challenge', '/hop']);
  const r = await check(dir);
  const urls = xs => xs.map(x => new URL(x.url).pathname).sort();
  assert.deepEqual(urls(r.broken), ['/boom', '/gone']);
  assert.deepEqual(urls(r.unknown), ['/blocked', '/challenge', '/limited']);
  assert.equal(r.checked, 8);
  assert.deepEqual(urls(r.moved), []);  // same-host redirect is plain ok
});

test('a failure is confirmed only on the second consecutive run', async () => {
  const dir = treeWithUrls(['/gone']);
  const state = join(dir, 'state.json');
  const first = await check(dir, ['--state', state]);
  assert.equal(first.broken.length, 1);
  assert.equal(first.confirmed.length, 0);
  const second = await check(dir, ['--state', state]);
  assert.equal(second.confirmed.length, 1);
});

test('pull-request mode fails on a broken URL but not on a blocked one', async () => {
  const blocked = treeWithUrls(['/blocked']);
  const f1 = join(blocked, 'content/bodies/us/federal/us-test-committee.yml');
  assert.equal((await check(blocked, ['--files', f1])).code, 0);
  const gone = treeWithUrls(['/gone']);
  const f2 = join(gone, 'content/bodies/us/federal/us-test-committee.yml');
  assert.equal((await check(gone, ['--files', f2])).code, 1);
});
