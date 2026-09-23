#!/usr/bin/env node
// Keeps translations honest (docs/content-architecture.md, "Translation").
//
//   node scripts/i18n-sync.mjs <lang>                       report + refresh i18n/ui/<lang>.yml
//   node scripts/i18n-sync.mjs <lang> --scaffold <prefix>   create empty mirrors for English files
//                                                          under <prefix> (e.g. content/guides/)
//   node scripts/i18n-sync.mjs <lang> --stamp               set `src` on translated strings that have
//                                                          a value but no src yet (just translated)
//
// English is the source of truth. Every translated string carries `src`, the hash of the English it
// was made from. When the English changes the hashes stop matching and the string is stale: the site
// shows English instead, with a notice. This script never overwrites a translated value.
import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import YAML from 'yaml';
import { I18N, loadContent, readYaml, walk, rel, CONTENT } from './lib/content.mjs';
import { stringsOf, hash } from './lib/i18n.mjs';

/** Rebuilds a nested object from flat 'a.b.c' keys. */
function nest(flat) {
  const out = {};
  for (const [k, v] of Object.entries(flat)) {
    const parts = k.split('.');
    let o = out;
    for (const p of parts.slice(0, -1)) o = (o[p] ??= {});
    o[parts.at(-1)] = v;
  }
  return out;
}

/** Merge English keys into a translation: keep values, add missing keys, stamp or flag. */
export function syncStrings(englishFlat, translated, { stamp = false } = {}) {
  const tr = Object.fromEntries(stringsOf(translated ?? {}));
  const out = {}, report = { current: 0, stale: 0, missing: 0, machine: 0, removed: 0 };
  for (const [key, en] of Object.entries(englishFlat)) {
    if (typeof en !== 'string') continue;
    const t = tr[key];
    const h = hash(en);
    if (!t || typeof t.value !== 'string' || !t.value.trim()) { out[key] = { value: '', src: '' }; report.missing++; continue; }
    const entry = { value: t.value, src: t.src || (stamp ? h : ''), ...(t.machine ? { machine: true } : {}) };
    out[key] = entry;
    if (entry.src === h) { report.current++; if (entry.machine) report.machine++; } else report.stale++;
  }
  report.removed = Object.keys(tr).filter(k => !(k in englishFlat)).length;
  return { strings: nest(out), report };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const lang = args.find(a => /^[a-z]{2,3}$/.test(a));
  if (!lang || lang === 'en') { console.error('Usage: node scripts/i18n-sync.mjs <lang> [--scaffold <prefix>] [--stamp]'); process.exit(2); }
  const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  const STAMP = args.includes('--stamp');

  function writeYaml(path, header, obj) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, header + YAML.stringify(obj, { lineWidth: 0 }));
  }

  // Status file: the gate. A language is public only when its steward approves tier 1.
  const statusPath = join(I18N, lang, 'status.yml');
  if (!existsSync(statusPath)) {
    writeYaml(statusPath, `# Gate for ${lang}. Until ui_approved is true, ${lang} pages build with noindex and are not in the language switcher.\n`,
      { name: lang, ui_approved: false, reviewer: null, approved_on: null, tier: 0 });
  }

  // Interface strings.
  const enUi = Object.fromEntries(stringsOf(readYaml(join(I18N, 'ui', 'en.yml')).strings));
  const uiPath = join(I18N, 'ui', `${lang}.yml`);
  const ui = syncStrings(enUi, existsSync(uiPath) ? readYaml(uiPath)?.strings : {}, { stamp: STAMP });
  writeYaml(uiPath, `# Interface strings for ${lang}. Each entry: value (the translation), src (hash of the English it\n# was made from — set by scripts/i18n-sync.mjs --stamp), machine: true for unreviewed machine output.\n`, { strings: ui.strings });
  console.log(`ui: ${ui.report.current} current (${ui.report.machine} machine), ${ui.report.stale} stale, ${ui.report.missing} missing`);

  // Content mirrors.
  const scaffold = opt('--scaffold');
  const records = loadContent();
  let totals = { current: 0, stale: 0, missing: 0 };
  for (const r of records) {
    const mirror = join(I18N, lang, r._path);
    const exists = existsSync(mirror);
    if (!exists && !(scaffold && r._path.startsWith(scaffold))) continue;
    const enFlat = Object.fromEntries(stringsOf(r.strings ?? {}));
    const synced = syncStrings(enFlat, exists ? readYaml(mirror)?.strings : {}, { stamp: STAMP });
    writeYaml(mirror, `# ${lang} strings for ${r._path}. Strings only — no URLs, no dates, no facts.\n`, { strings: synced.strings });
    for (const k of Object.keys(totals)) totals[k] += synced.report[k];
  }
  console.log(`content: ${totals.current} current, ${totals.stale} stale, ${totals.missing} missing across ${walk(join(I18N, lang, 'content')).length} files`);
}
