// Minimal CODEOWNERS reader: the last matching pattern wins, as on GitHub.
// Supports leading '/', trailing '/', '*' and '**'. Used to route link-check issues,
// steward charters and inactivity notices to whoever owns a path.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './content.mjs';

function toRegex(pattern) {
  let p = pattern;
  const anchored = p.startsWith('/');
  if (anchored) p = p.slice(1);
  if (p.endsWith('/')) p += '**';
  const re = p.split('**').map(part => part.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*')).join('.*');
  return new RegExp(`${anchored || p.includes('/') ? '^' : '(^|/)'}${re}$`);
}

export function parseCodeowners(text) {
  return text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')).map(l => {
    const [pattern, ...owners] = l.split(/\s+/);
    return { pattern, owners, re: toRegex(pattern) };
  });
}

export function loadCodeowners(path = join(ROOT, 'CODEOWNERS')) {
  return existsSync(path) ? parseCodeowners(readFileSync(path, 'utf8')) : [];
}

/** Owners of a repo-relative path, e.g. 'content/bodies/us/ca/x.yml'. */
export function ownersOf(path, rules = loadCodeowners()) {
  let owners = [];
  for (const r of rules) if (r.re.test(path)) owners = r.owners;
  return owners;
}
