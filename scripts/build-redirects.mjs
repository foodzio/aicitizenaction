#!/usr/bin/env node
// Build the permanent redirect registry for retired directory ids.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { ROOT, I18N, loadDirectory, walk } from './lib/content.mjs';

export function builtLanguages() {
  const languages = new Set(['en']);
  for (const path of walk(I18N)) {
    const match = path.match(/i18n\/([a-z]{2,3})\/status\.yml$/);
    if (match) languages.add(match[1]);
  }
  return [...languages].sort();
}

export function redirectManifest(records = loadDirectory(), languages = builtLanguages()) {
  const active = new Set(records.map(record => `${record._section}/${record.id}`));
  const redirects = {};
  for (const record of records) for (const old of record.meta?.redirect_from ?? []) {
    const retired = `${old.section}/${old.id}`;
    if (active.has(retired)) throw new Error(`retired path is still active: ${retired}`);
    for (const lang of languages) {
      const from = `/${lang}/${old.section}/${old.id}/`;
      const to = `/${lang}/${record._section}/${record.id}/`;
      if (redirects[from] && redirects[from] !== to) throw new Error(`redirect source has two targets: ${from}`);
      redirects[from] = to;
    }
  }
  for (const [from, to] of Object.entries(redirects)) {
    if (from === to) throw new Error(`self redirect: ${from}`);
    if (redirects[to]) throw new Error(`redirect chain: ${from} -> ${to} -> ${redirects[to]}`);
  }
  return { version: 1, status: 308, generated_on: new Date().toISOString().slice(0, 10), redirects };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const valueAfter = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
  const out = valueAfter('--out') ?? join(ROOT, 'dist', 'redirects.json');
  const text = JSON.stringify(redirectManifest(), null, 2) + '\n';
  if (args.includes('--check')) {
    if (!existsSync(out) || readFileSync(out, 'utf8') !== text) throw new Error(`${out} is stale; rebuild redirects`);
  } else {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, text);
    console.log(`Wrote ${out}: ${Object.keys(JSON.parse(text).redirects).length} permanent language-specific redirects`);
  }
}
