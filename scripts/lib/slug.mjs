// Stable, readable ids: lower-case ASCII words joined by hyphens.

const STOP = new Set(['the', 'of', 'and', 'for', 'on', 'a', 'an', 'in', 'to', 'de', 'la', 'le', 'du', 'des', 'per', 'del', 'di']);

export function slugify(text, maxWords = 6) {
  const words = String(text)
    .replace(/\([^)]*\)/g, ' ')          // drop parentheticals
    .replace(/\bU\.S\.\s*/g, '')           // the geo prefix already says us-
    .split(/:|,/)[0]                     // keep the part before a colon or comma
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ')
    .trim().split(/\s+/).filter(Boolean);
  const kept = words.filter(w => !STOP.has(w));
  return (kept.length ? kept : words).slice(0, maxWords).join('-') || 'record';
}

/** Returns `base`, or `base-2`, `base-3`… if already taken. Records the result in `taken`. */
export function uniqueId(base, taken) {
  let id = base, n = 2;
  while (taken.has(id)) id = `${base}-${n++}`;
  taken.add(id);
  return id;
}
