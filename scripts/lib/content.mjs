// Shared loaders for content/, i18n/ and schema/vocab/. Used by validate, the site build,
// charter, freshness and tests, so every tool reads the tree the same way.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));
// AICA_CONTENT / AICA_I18N point the tools at another tree (used by tests).
export const CONTENT = process.env.AICA_CONTENT ?? join(ROOT, 'content');
export const VOCAB = join(ROOT, 'schema', 'vocab');
export const I18N = process.env.AICA_I18N ?? join(ROOT, 'i18n');

export function walk(dir, ext = '.yml') {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p, ext));
    else if (name.endsWith(ext)) out.push(p);
  }
  return out;
}

export function readYaml(path) {
  return YAML.parse(readFileSync(path, 'utf8'), { prettyErrors: true });
}

/** Path relative to the repo root, always with forward slashes. */
export const rel = p => {
  // Content outside the repo (tests) is reported as if it lived at content/ or i18n/.
  if (p.startsWith(CONTENT)) return 'content' + p.slice(CONTENT.length).split(sep).join('/');
  if (p.startsWith(I18N)) return 'i18n' + p.slice(I18N.length).split(sep).join('/');
  return relative(ROOT, p).split(sep).join('/');
};

/**
 * Loads every record under content/<section>/ (or all sections).
 * Each record gets non-enumerable `_path` and `_section`.
 */
export function loadContent(section) {
  const base = section ? join(CONTENT, section) : CONTENT;
  return walk(base).map(path => {
    const record = readYaml(path) ?? {};
    const parts = rel(path).split('/');
    Object.defineProperty(record, '_path', { value: rel(path), enumerable: false });
    Object.defineProperty(record, '_section', { value: parts.slice(1, parts[1] === 'resources' ? 3 : 2).join('/'), enumerable: false });
    return record;
  });
}

/** { 'route-types': { ids: Set, values: [...] }, ... } */
export function loadVocab() {
  const vocab = {};
  for (const path of walk(VOCAB)) {
    const v = readYaml(path);
    vocab[v.id] = { ids: new Set(v.values.map(x => String(x.id))), values: v.values };
  }
  return vocab;
}

export function vocabLabel(vocab, list, id) {
  return vocab[list]?.values.find(v => String(v.id) === String(id))?.label ?? id;
}

/** Directory records: bodies, channels, orgs. */
export const DIRECTORY_SECTIONS = ['bodies', 'channels', 'orgs'];
export const loadDirectory = () => DIRECTORY_SECTIONS.flatMap(s => loadContent(s));
