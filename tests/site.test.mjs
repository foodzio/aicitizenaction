// Builds the site once and holds it against the brief's testable principles (docs/ux-brief.md).
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT, loadDirectory } from '../scripts/lib/content.mjs';
import { placeToContact } from '../scripts/lib/routing.mjs';

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
    // canonical / alternate links name the page's public address; browsers never fetch them.
    const external = [...html.matchAll(/<(?:script|link|img|iframe)[^>]+(?:src|href)="(https?:\/\/[^"]+)"[^>]*>/g)]
      .filter(m => !/rel="(canonical|alternate)"/.test(m[0])).map(m => m[1]);
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
    const all = records.filter(r => r._section === s);
    const expected = s === 'channels' ? all.filter(placeToContact) : all;
    assert.equal(j.count, expected.length);
    assert.equal(j.excluded_count, all.length - expected.length);
  }
  assert.ok(JSON.parse(page('version.json')).version);
});

test('Places to contact publishes only audited destinations', () => {
  const html = page('en/directory/index.html');
  assert.match(html, /Places to contact/);
  assert.match(html, /Only show currently verified contact routes/);
  assert.ok(!html.includes('The perils of AI safety&#39;s insularity'), 'article is absent from the directory');
  const api = JSON.parse(page('api/channels.json'));
  assert.equal(api.count, 52);
  assert.equal(api.excluded_count, 22);
  assert.ok(api.records.every(r => r.facts.contact_disposition === 'keep'));
  assert.match(page('en/channels/global-perils-ai-safety-s-insularity-why/index.html'), /not a current contact destination/i);
  const valid = page('en/channels/global-ai-incident-database/index.html');
  assert.match(valid, /Open contact route|Limited contact route/);
  assert.match(valid, /Evidence that this route accepts contact/);
});

test('regression: Argentina bill attachment is never offered as the send-to address', () => {
  const json = JSON.parse(page('en/start/record/index.html').match(/id="payload">([\s\S]*?)<\/script>/)[1]);
  const argentina = json.byPlace.ar;
  assert.ok(!argentina || argentina.recipients.every(r => r.id !== 'ar-argentina-ai-governance'));
  for (const result of Object.values(json.byPlace)) assert.ok(result.recipients.every(r => r.contact?.verified === true));
});

test('Resources: only published items get pages', async () => {
  const { loadContent } = await import('../scripts/lib/content.mjs');
  const media = loadContent('resources/media');
  for (const m of media) {
    const built = existsSync(join(out, 'en/resources/media', m.id, 'index.html'));
    assert.equal(built, m.meta.status === 'published', `${m.id} (${m.meta.status})`);
  }
  // (Owner decision 2026-09-24: the top menu is the same on every page, door included.)
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

test('design system: tokens, self-hosted Figtree, logo, and the door uses its components', () => {
  const door = page('en/index.html');
  for (const cls of ['class="display"', 'aca-steps', 'aca-card', 'aca-disc', 'aca-reassure', 'aca-header']) assert.ok(door.includes(cls), cls);
  assert.ok(existsSync(join(out, 'brand/aicitizenaction-lockup.png')));
  const css = readdirSync(join(out, '_astro')).filter(f => f.endsWith('.css')).map(f => readFileSync(join(out, '_astro', f), 'utf8')).join('\n');
  assert.match(css, /--teal:\s*#2a6d82/);
  assert.match(css, /font-family:\s*Figtree/);
  assert.ok(!/fonts\.googleapis|fonts\.gstatic/.test(css), 'fonts must be served from the site');
  assert.ok(readdirSync(join(out, '_astro')).some(f => f.endsWith('.woff2')), 'Figtree woff2 files are bundled');
  const harm = door.indexOf('/en/start/harm/'), join_ = door.indexOf('/en/start/join/');
  assert.ok(harm > 0 && join_ > 0);
});

test('the top menu is identical on every page, in each language', () => {
  const navOf = html => (html.match(/<header class="aca-header">[\s\S]*?<\/header>/) ?? [''])[0]
    .replace(/ class="aca-nav-link is-active"/g, ' class="aca-nav-link"').replace(/ aria-current="page"/g, '');
  for (const lang of ['en', 'fr']) {
    const pages = [`${lang}/index.html`, `${lang}/start/law/index.html`, `${lang}/directory/index.html`, `${lang}/resources/index.html`,
      `${lang}/about/index.html`, `${lang}/feedback/index.html`, `${lang}/get-involved/index.html`, `${lang}/bodies/us-senate-committee-commerce-2/index.html`];
    const menus = pages.map(p => navOf(page(p)).replace(/href="\/(en|fr)\/[^"]*"/g, m => m.replace(/\/(en|fr)\/.*"/, '/$1/…"')));
    for (const [i, m] of menus.entries()) assert.equal(m, menus[0], `${pages[i]} menu differs`);
    for (const link of ['/start', '/resources/', '/directory/', '/about/', '/get-involved/']) assert.ok(page(`${lang}/index.html`).includes(`href="/${lang}${link === '/start' ? '/' : link}"`), link);
  }
  // Language dropdown, top right, on every page: both languages, the current one marked.
  for (const [lang, other, name] of [['en', 'fr', 'Français'], ['fr', 'en', 'English']]) {
    const html = page(`${lang}/directory/index.html`);
    assert.match(html, /<details class="aca-lang">/);
    assert.match(html, new RegExp(`<a href="/${other}/directory/" lang="${other}" hreflang="${other}">${name}</a>`));
    assert.match(html, new RegExp(`href="/${lang}/directory/" lang="${lang}" hreflang="${lang}" aria-current="true"`));
  }
});

test('feedback and contributor pages post to the site, never to GitHub', () => {
  assert.match(page('en/feedback/index.html'), /<form class="form" method="post" action="\/api\/feedback"/);
  assert.match(page('en/get-involved/index.html'), /<form class="form" method="post" action="\/api\/contribute"/);
  for (const f of ['en/index.html', 'en/feedback/index.html', 'en/get-involved/index.html', 'en/about/index.html', 'en/contributors/index.html', 'fr/index.html'])
    assert.ok(!page(f).includes('github.com/foodzio'), `${f} links to the repository`);
  assert.match(page('en/bodies/us-senate-committee-commerce-2/index.html'), /href="\/en\/feedback\/\?topic=wrong&amp;page=/);
});
