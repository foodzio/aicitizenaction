import { mkdtempSync, mkdirSync, writeFileSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import YAML from 'yaml';
import { ROOT } from '../scripts/lib/content.mjs';

/** A throwaway content + i18n tree. `files` maps 'content/...' or 'i18n/...' paths to objects. */
export function tree(files = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'aica-'));
  mkdirSync(join(dir, 'content'), { recursive: true });
  mkdirSync(join(dir, 'i18n'), { recursive: true });
  for (const [path, data] of Object.entries(files)) {
    const p = join(dir, path);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, typeof data === 'string' ? data : YAML.stringify(data));
  }
  return dir;
}

/** Copies one real record into a fresh tree, so a test can break it. */
export function treeWith(realPath, mutate) {
  const dir = tree();
  const dest = join(dir, realPath);
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(join(ROOT, realPath), dest);
  return { dir, dest };
}

export function runScript(script, dir, args = [], env = {}) {
  const r = spawnSync(process.execPath, [join(ROOT, 'scripts', script), ...args], {
    encoding: 'utf8',
    env: { ...process.env, ...(dir ? { AICA_CONTENT: join(dir, 'content'), AICA_I18N: join(dir, 'i18n') } : {}), ...env }
  });
  return r;
}

export function validate(dir) {
  const r = runScript('validate.mjs', dir, ['--json']);
  return { code: r.status, ...JSON.parse(r.stdout) };
}

/** A minimal valid body record at the right path. */
export function body(overrides = {}) {
  const r = {
    id: 'us-test-committee', type: 'seat', geo: { country: 'us', sub: 'federal' },
    facts: { routes: [{ id: 'membership', type: 'membership', value: 'https://example.org/members', verified: true, verified_on: '2026-09-22' }] },
    strings: { name: 'Test Committee', routes: { membership: { label: 'Members' } } },
    meta: { verified_on: '2026-09-22', review_by: '2026-12-21', sources: [{ url: 'https://example.org/members', checked: '2026-09-22' }] },
    ...overrides
  };
  return r;
}
