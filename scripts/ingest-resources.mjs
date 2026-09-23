#!/usr/bin/env node
// Collects new media items from the Resources source registry. Metadata only: title, link,
// publisher, date, language. Never bodies, transcripts, embeds or images.
//
//   node scripts/ingest-resources.mjs [--since 21] [--limit 20] [--dry-run] [--summary file.md]
//
// Each new item becomes one file under content/resources/media/<yyyy>/<mm>/<id>.yml with
// meta.status `published` if its source has auto_publish, otherwise `pending` for an editor.
// Duplicates are dropped by a hash of the canonical URL. A failing feed is reported and leaves
// earlier items untouched. The RSS/Atom parser is adapted from the stockspanic project's
// dependency-free discussion ingester.
import { writeFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import YAML from 'yaml';
import { CONTENT, loadContent } from './lib/content.mjs';
import { slugify, uniqueId } from './lib/slug.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const SINCE_DAYS = Number(opt('--since', 21));
const LIMIT = Number(opt('--limit', 20));
const DRY = args.includes('--dry-run');
const UA = 'Mozilla/5.0 (compatible; aicitizenaction-ingest/1.0; +https://github.com/foodzio/aicitizenaction)';

const decodeEntities = v => String(v ?? '')
  .replace(/&(?:amp|#38);/gi, '&').replace(/&(?:lt|#60);/gi, '<').replace(/&(?:gt|#62);/gi, '>')
  .replace(/&(?:quot|#34);/gi, '"').replace(/&(?:apos|#39);/gi, "'").replace(/&nbsp;/gi, ' ')
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, c) => String.fromCodePoint(Number(c)));
const decode = v => decodeEntities(String(v ?? '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
const tag = (block, names) => { for (const n of names) { const m = block.match(new RegExp(`<${n}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${n}>`, 'i')); if (m) return decode(m[1]); } return ''; };
const atomLink = block => {
  const links = [...block.matchAll(/<link\b([^>]*)\/?>/gi)].map(m => m[1]);
  const pick = links.find(a => /rel=["']alternate["']/i.test(a)) ?? links.find(a => !/rel=/i.test(a)) ?? links[0];
  return decode(pick?.match(/href=["']([^"']+)["']/i)?.[1] ?? '');
};
const validUrl = v => { try { const u = new URL(v); return ['http:', 'https:'].includes(u.protocol) ? u.href : null; } catch { return null; } };
const isoDate = v => { const d = new Date(v); return Number.isFinite(d.valueOf()) ? d.toISOString().slice(0, 10) : null; };
// Feeds are not always single-language (AlgorithmWatch's English feed carries German items).
// A small stopword vote is enough to label a title's language; otherwise the source's language.
const STOPWORDS = {
  de: ['der', 'die', 'und', 'das', 'nicht', 'für', 'mit', 'zur', 'zum', 'über', 'im', 'sollten', 'gegen', 'eine', 'ist'],
  fr: ['le', 'la', 'les', 'des', 'et', 'pour', 'une', 'dans', 'sur', 'est', 'du', 'aux'],
  es: ['el', 'los', 'las', 'del', 'y', 'para', 'una', 'con', 'por', 'que', 'es'],
  en: ['the', 'and', 'of', 'to', 'for', 'in', 'on', 'with', 'is', 'how', 'why', 'what', 'a']
};
export function guessLanguage(title, fallback) {
  const words = String(title).toLowerCase().split(/[^a-zà-ÿß]+/).filter(Boolean);
  let best = fallback, top = 1;
  for (const [lang, list] of Object.entries(STOPWORDS)) {
    const n = words.filter(w => list.includes(w)).length;
    if (n > top) { best = lang; top = n; }
  }
  return best;
}
export const urlHash = url => createHash('sha256').update(url.replace(/[?#].*$/, '').replace(/\/$/, '')).digest('hex').slice(0, 12);

/** Parses RSS 2.0, RSS 1.0 (RDF) or Atom into [{ title, url, author, published_at }]. */
export function parseFeed(xml, { limit = LIMIT } = {}) {
  const atom = /<feed\b/i.test(xml);
  const blocks = [...xml.matchAll(atom ? /<entry\b[^>]*>([\s\S]*?)<\/entry>/gi : /<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map(m => m[1]);
  const seen = new Set(), items = [];
  for (const b of blocks) {
    const title = tag(b, ['title']);
    const url = validUrl(atom ? atomLink(b) : tag(b, ['link']) || tag(b, ['guid']));
    if (!title || !url || seen.has(url)) continue;
    seen.add(url);
    items.push({ title: title.slice(0, 300), url, author: tag(b, ['dc:creator', 'name', 'author']).slice(0, 120), published_at: isoDate(tag(b, ['published', 'pubDate', 'dc:date', 'updated'])) });
    if (items.length >= limit) break;
  }
  return items;
}

export async function ingest({ now = new Date(), fetchImpl = fetch, dry = DRY, sinceDays = SINCE_DAYS } = {}) {
  const sources = loadContent('resources/sources').filter(s => s.facts.enabled && s.facts.feed_url);
  const existing = loadContent('resources/media');
  const hashes = new Set(existing.map(m => m.facts.url_hash ?? urlHash(m.facts.url)));
  const ids = new Set(loadContent().map(r => r.id));
  const cutoff = new Date(now.getTime() - sinceDays * 864e5).toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);
  const report = { sources: [], added: [], failures: [] };

  for (const s of sources) {
    const row = { id: s.id, perspective: s.facts.perspective, found: 0, added: 0 };
    try {
      const res = await fetchImpl(s.facts.feed_url, { headers: { 'user-agent': UA, accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' }, signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const items = parseFeed(await res.text());
      row.found = items.length;
      for (const it of items) {
        const h = urlHash(it.url);
        if (hashes.has(h)) continue;
        const published = it.published_at ?? today;
        if (published < cutoff || published > today) continue;
        hashes.add(h);
        const id = uniqueId(`${s.id}-${slugify(it.title, 5)}`.slice(0, 80).replace(/-+$/, ''), ids);
        const record = {
          id,
          facts: { source: s.id, url: it.url, url_hash: h, kind: s.facts.kind, language: guessLanguage(it.title, s.facts.language), published_at: published, ...(it.author ? { author: it.author } : {}) },
          strings: { title: it.title },
          meta: { status: s.facts.auto_publish ? 'published' : 'pending', added_by: 'ingest', added_on: today }
        };
        const [y, m] = published.split('-');
        const path = join(CONTENT, 'resources', 'media', y, m, `${id}.yml`);
        if (!dry) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, YAML.stringify(record, { lineWidth: 0 })); }
        report.added.push({ id, source: s.id, perspective: s.facts.perspective, status: record.meta.status, title: it.title, url: it.url });
        row.added++;
      }
    } catch (e) {
      report.failures.push({ source: s.id, error: String(e.message ?? e).slice(0, 200) });
    }
    report.sources.push(row);
  }
  return report;
}

export function summaryMarkdown(r) {
  const byPersp = {};
  for (const a of r.added) byPersp[a.perspective] = (byPersp[a.perspective] ?? 0) + 1;
  const pending = r.added.filter(a => a.status === 'pending').length;
  return [
    '## Resource intake',
    '',
    `${r.added.length} new items (${pending} waiting for an editor, ${r.added.length - pending} from auto-publish sources) · ${r.failures.length} feeds failed`,
    '',
    '### Balance of new items by source perspective',
    '',
    ...(Object.keys(byPersp).length ? Object.entries(byPersp).sort((a, b) => b[1] - a[1]).map(([p, n]) => `- ${p}: ${n}`) : ['- none']),
    '',
    'Editors: for each pending item, set `meta.status` to `published` or `rejected`, add `topics`, and write a neutral `prompt` that turns the story into a decision. Pending and rejected items are never shown on the site.',
    '',
    ...(r.failures.length ? ['### Feeds that failed (earlier items are untouched)', '', ...r.failures.map(f => `- ${f.source}: ${f.error}`), ''] : []),
    ...(r.added.length ? ['### New items', '', ...r.added.map(a => `- [${a.status}] ${a.title} — ${a.source}`)] : [])
  ].join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = await ingest();
  const md = summaryMarkdown(r);
  const sum = opt('--summary');
  if (sum) appendFileSync(sum, md + '\n');
  console.log(md);
  const out = opt('--out');
  if (out) writeFileSync(out, JSON.stringify(r, null, 2));
}
