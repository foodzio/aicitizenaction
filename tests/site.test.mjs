// Builds the site once and holds it against the brief's testable principles (docs/ux-brief.md).
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT, loadDirectory } from '../scripts/lib/content.mjs';

const out = mkdtempSync(join(tmpdir(), 'aica-site-'));
const page = p => readFileSync(join(out, p), 'utf8');
const walkHtml = d => readdirSync(d).flatMap(n => { const p = join(d, n); return statSync(p).isDirectory() ? walkHtml(p) : p.endsWith('.html') ? [p] : []; });
const records = loadDirectory();

before(() => {
  const r = spawnSync(process.execPath, [join(ROOT, 'node_modules/astro/bin/astro.mjs'), 'build'], { cwd: ROOT, env: { ...process.env, AICA_OUT: out }, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr || r.stdout);
});

test('every directory record has a page', () => {
  for (const r of records) assert.ok(existsSync(join(out, 'en', r._section, r.id, 'index.html')), r.id);
});

test('the door: one question, at most six choices, no institution names, no counts', () => {
  const html = page('en/index.html');
  const choices = (html.match(/href="\/en\/start\//g) ?? []).length;
  assert.ok(choices > 0 && choices <= 6, `${choices} choices`);
  const main = html.split('<main')[1].split('</main>')[0].replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/&[a-z]+;|&#\d+;/g, ' ');
  for (const r of records) assert.ok(!main.includes(r.strings.name), `door names ${r.strings.name}`);
  assert.ok(!/\b\d{2,}\b/.test(main), 'door shows a number');
  assert.match(main, /don't need to be an expert/i);
});

test('the path states its length before it begins', () => {
  assert.match(page('en/index.html'), /Three steps/);
});

test('no page loads anything from a third party (no tracking, no consent wall)', () => {
  for (const f of walkHtml(out)) {
    const html = readFileSync(f, 'utf8');
    const external = [...html.matchAll(/<(?:script|link|img|iframe)[^>]+(?:src|href)="(https?:\/\/[^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(external, [], f);
  }
});

test('the insider outcome routes nowhere', () => {
  const html = page('en/start/insider/index.html');
  assert.ok(!html.includes('id="payload"'));
  assert.match(html, /legal advice/i);
});

test('path pages carry precomputed routing and the draft keeps the user\'s own words', () => {
  const html = page('en/start/law/index.html');
  const json = JSON.parse(html.match(/<script type="application\/json" id="payload">([\s\S]*?)<\/script>/)[1]);
  assert.ok(json.byPlace.us.recipients.length > 0);
  assert.match(json.template, /\{own_words\}/);
});

test('the data is published: /api/*.json match the content', () => {
  for (const s of ['bodies', 'channels', 'orgs']) {
    const j = JSON.parse(page(`api/${s}.json`));
    assert.equal(j.count, records.filter(r => r._section === s).length);
  }
  assert.ok(JSON.parse(page('version.json')).version);
});

test('Resources: only published items get pages; the door has no Resources link', async () => {
  const { loadContent } = await import('../scripts/lib/content.mjs');
  const media = loadContent('resources/media');
  for (const m of media) {
    const built = existsSync(join(out, 'en/resources/media', m.id, 'index.html'));
    assert.equal(built, m.meta.status === 'published', `${m.id} (${m.meta.status})`);
  }
  const door = page('en/index.html').split('<main')[0] + page('en/index.html').split('<main')[1];
  assert.ok(!door.includes('/en/resources/'), 'door links to Resources');
});

test('Resources: every published item and explainer page leads into the path', () => {
  const idx = page('en/resources/index.html');
  for (const m of [...idx.matchAll(/href="\/en\/resources\/(media|explainers)\/([^/"]+)\/"/g)]) {
    assert.match(page(`en/resources/${m[1]}/${m[2]}/index.html`), /href="\/en\/(start\/[a-z]+\/[^"]*|)"[^>]*class="btn"|class="btn" href="\/en\/(start\/|)/);
  }
});

test('language gate: an approved language is indexed and offered; an unapproved one is hidden', async () => {
  const { readYaml, I18N } = await import('../scripts/lib/content.mjs');
  const approved = readYaml(join(I18N, 'fr', 'status.yml')).ui_approved === true;
  const fr = page('fr/index.html'), en = page('en/index.html');
  assert.match(fr, /<html lang="fr"/);
  assert.ok(!en.includes('noindex'), 'English pages are always indexed');
  if (approved) {
    assert.ok(!fr.includes('name="robots" content="noindex"'), 'approved French is indexed');
    assert.ok(en.includes('href="/fr/"'), 'English pages offer French');
    assert.ok(fr.includes('href="/en/"'), 'French pages offer English');
    assert.ok(!fr.includes('Traduction automatique, pas encore relue'), 'no machine notice once approved');
  } else {
    assert.match(fr, /<meta name="robots" content="noindex"/);
    assert.ok(!en.includes('href="/fr/'), 'English pages link to an unapproved language');
  }
});

test('the "fix" outcome asks which company, and offers independent channels alongside', () => {
  const html = page('en/start/fix/index.html');
  assert.match(html, /id="company"/);
  const json = JSON.parse(html.match(/<script type="application\/json" id="payload">([\s\S]*?)<\/script>/)[1]);
  const recips = json.byPlace[''].recipients;
  assert.ok(recips.filter(r => r.isCompany).length >= 10);
  assert.ok(recips.some(r => !r.isCompany), 'an independent channel is available');
});

test('regression (QA): a 404 page exists; the French salutation is grammatical; drafts never greet "Not applicable"', () => {
  assert.match(page('404.html'), /This page isn't here|This page isn&#39;t here/);
  const fr = JSON.parse(page('fr/start/law/index.html').match(/id="payload">([\s\S]*?)<\/script>/)[1]);
  assert.match(fr.template, /^À l'attention de : \{recipient\}\n\nMadame, Monsieur,/);
  for (const f of ['en/start/law/index.html', 'en/start/record/index.html', 'en/start/harm/index.html']) {
    const j = JSON.parse(page(f).match(/id="payload">([\s\S]*?)<\/script>/)[1]);
    for (const place of Object.values(j.byPlace)) for (const r of place.recipients) assert.ok(!/Not applicable/i.test(r.recipient), `${f}: ${r.recipient}`);
  }
});
