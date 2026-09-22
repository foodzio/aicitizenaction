// Translation helpers. English is the source of truth; each translated string carries `src`,
// a short hash of the English it was made from. When the English changes the hash stops
// matching and the string is stale: never shown, English is shown instead.
import { createHash } from 'node:crypto';

export const URL_OR_EMAIL = /https?:\/\/|www\.|[^\s@]+@[^\s@]+\.[a-z]{2,}/i;

export const hash = text => createHash('sha256').update(String(text)).digest('hex').slice(0, 8);

/** Flattens a strings block to [key, value] pairs: name, remit, routes.contact.label … */
export function stringsOf(obj, prefix = '') {
  const out = [];
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !('value' in v)) out.push(...stringsOf(v, key));
    else out.push([key, v]);
  }
  return out;
}

/** Map of record id → Map of string key → English hash. */
export function englishHashes(records) {
  const out = new Map();
  for (const r of records) {
    const m = new Map();
    for (const [key, value] of stringsOf(r.strings ?? {})) if (typeof value === 'string') m.set(key, hash(value));
    out.set(r.id, m);
  }
  return out;
}

/**
 * Resolves one string for display.
 * @returns {{ text: string, lang: string, state: 'translated'|'fallback'|'stale'|'machine' }}
 */
export function resolveString(englishValue, translated, lang) {
  if (!translated || typeof translated.value !== 'string') return { text: englishValue, lang: 'en', state: 'fallback' };
  if (translated.src !== hash(englishValue)) return { text: englishValue, lang: 'en', state: 'stale' };
  return { text: translated.value, lang, state: translated.machine ? 'machine' : 'translated' };
}
