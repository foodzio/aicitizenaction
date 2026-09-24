// Resources: metadata-only intake, duplicates dropped, failures isolated, pending never shown,
// windows expire, and every explainer and window points at an action.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import YAML from 'yaml';
import { ROOT, loadContent } from '../scripts/lib/content.mjs';
import { tree, validate } from './helpers.mjs';
import { parseFeed, guessLanguage, urlHash } from '../scripts/ingest-resources.mjs';

const today = new Date().toISOString().slice(0, 10);
const RSS = `<?xml version="1.0"?><rss><channel><title>T</title>
  <item><title><![CDATA[First &amp; best]]></title><link>https://pub.example/a</link><pubDate>${new Date().toUTCString()}</pubDate><description>BODY TEXT MUST NOT BE STORED</description></item>
  <item><title>Old one</title><link>https://pub.example/old</link><pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate></item>
  <item><title>Second</title><link>https://pub.example/b?utm=x</link><pubDate>${new Date().toUTCString()}</pubDate></item>
</channel></rss>`;
const ATOM = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Atom item</title><link rel="alternate" href="https://pub.example/atom"/><published>${new Date().toISOString()}</published><author><name>A. Writer</name></author></entry></feed>`;

let server, base;
before(async () => {
  server = createServer((req, res) => {
    if (req.url === '/rss') { res.writeHead(200, { 'content-type': 'application/rss+xml' }); res.end(RSS); }
    else if (req.url === '/atom') { res.writeHead(200); res.end(ATOM); }
    else { res.writeHead(500); res.end('down'); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const source = (id, feed, extra = {}) => ({
  id, geo: { country: 'global' },
  facts: { kind: 'article', site_url: 'https://pub.example/', feed_url: feed, language: 'en', perspective: 'journalism', auto_publish: false, enabled: true, ...extra },
  strings: { name: id }, meta: { verified_on: '2026-09-23', review_by: '2027-03-22', added_by: '@x' }
});
const runIngest = dir => new Promise(resolve => {
  const p = spawn(process.execPath, [join(ROOT, 'scripts/ingest-resources.mjs'), '--out', join(dir, 'r.json')], { env: { ...process.env, AICA_CONTENT: join(dir, 'content'), AICA_I18N: join(dir, 'i18n') }, stdio: 'ignore' });
  p.on('exit', () => resolve(JSON.parse(readFileSync(join(dir, 'r.json'), 'utf8'))));
});
const mediaFiles = dir => { const out = []; const w = d => { try { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? w(p) : out.push(p); } } catch {} }; w(join(dir, 'content/resources/media')); return out; };

test('parses RSS and Atom, decodes entities, keeps no body text', () => {
  const items = parseFeed(RSS);
  assert.equal(items[0].title, 'First & best');
  assert.ok(!JSON.stringify(items).includes('BODY TEXT'));
  assert.equal(parseFeed(ATOM)[0].url, 'https://pub.example/atom');
  assert.equal(parseFeed(ATOM)[0].author, 'A. Writer');
});

test('ingest writes pending items, skips old ones, and isolates a failing feed', async () => {
  const dir = tree({
    'content/resources/sources/global/good.yml': source('good', `${base}/rss`),
    'content/resources/sources/global/atom.yml': source('atom', `${base}/atom`, { auto_publish: true }),
    'content/resources/sources/global/down.yml': source('down', `${base}/down`)
  });
  const r = await runIngest(dir);
  assert.equal(r.failures.length, 1);
  assert.equal(r.failures[0].source, 'down');
  assert.deepEqual(r.added.map(a => a.title).sort(), ['Atom item', 'First & best', 'Second']);
  const files = mediaFiles(dir).map(f => YAML.parse(readFileSync(f, 'utf8')));
  assert.equal(files.find(f => f.strings.title === 'Atom item').meta.status, 'published');
  assert.equal(files.find(f => f.strings.title === 'Second').meta.status, 'pending');
  for (const f of files) assert.deepEqual(Object.keys(f.strings), ['title']);
  assert.equal(validate(dir).errors.length, 0, JSON.stringify(validate(dir).errors));
  const again = await runIngest(dir);
  assert.equal(again.added.length, 0, 'duplicates are dropped by URL hash');
});

test('language is guessed per title; URL hash ignores tracking parameters', () => {
  assert.equal(guessLanguage('Bundestag und Bundesrat sollten gegen das Paket stimmen', 'en'), 'de');
  assert.equal(urlHash('https://x.org/a?utm=1'), urlHash('https://x.org/a'));
});

test('an explainer or window without an action fails; unknown body ids fail', () => {
  const r = validate(tree({
    'content/resources/explainers/e.yml': { id: 'e', facts: {}, strings: { title: 't', summary: 's', body: 'b' }, meta: { verified_on: '2026-09-23', review_by: '2027-09-23', status: 'draft', sources: [{ url: 'https://x.org' }] } },
    'content/resources/windows/w.yml': { id: 'w', facts: { url: 'https://x.org', opens_on: '2026-09-01', closes_on: '2026-08-01', jurisdiction: { country: 'us' }, bodies: ['nope'] }, strings: { title: 't', summary: 's' }, meta: { verified_on: '2026-09-23', review_by: '2026-10-01', sources: [{ url: 'https://x.org' }] } }
  }));
  const msgs = r.errors.map(e => e.msg).join('\n');
  assert.match(msgs, /must point at an action/);
  assert.match(msgs, /unknown id "nope"/);
  assert.match(msgs, /closes_on is before opens_on/);
});

test('a media item may not carry body text or an embed', () => {
  const r = validate(tree({
    'content/resources/sources/global/s.yml': source('s', 'https://pub.example/feed'),
    [`content/resources/media/${today.slice(0, 4)}/${today.slice(5, 7)}/m.yml`]: { id: 'm', facts: { source: 's', url: 'https://pub.example/a', kind: 'article', language: 'en', published_at: today, embed: '<iframe>' }, strings: { title: 't', body: 'copied article' }, meta: { status: 'published', added_by: 'ingest', added_on: today } }
  }));
  assert.equal(r.code, 1);
});

test('misclassified contact guidance is preserved as Resources and disabled as a recipient', () => {
  const explainers = new Set(loadContent('resources/explainers').map(x => x.id));
  for (const id of [
    'finding-open-uk-parliament-inquiries', 'ai-incident-database-submission-guide',
    'writing-an-actionable-ai-flaw-report', 'third-party-ai-flaw-disclosure',
    'how-ai-incident-trackers-receive-records', 'inbound-and-outbound-disclosure',
    'why-outsider-ai-concerns-go-unheard', 'us-ai-whistleblower-bill-status'
  ]) assert.ok(explainers.has(id), id);

  const channels = loadContent('channels');
  for (const id of [
    'gb-uk-parliament-find-inquiry-accepting-written', 'global-ai-incident-database-editor-s-guide',
    'global-err-is-ai-evidence-what-makes', 'global-house-evaluation-is-not-enough-third',
    'global-mit-ai-incident-tracker', 'global-openai-outbound-coordinated-disclosure-policy',
    'global-perils-ai-safety-s-insularity-why', 'us-ai-whistleblower-protection-act-federal'
  ]) {
    const record = channels.find(x => x.id === id);
    assert.equal(record.facts.contact_disposition, 'reclassify', id);
    assert.equal(record.facts.recommend, false, id);
  }
});
