import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT, loadDirectory } from '../scripts/lib/content.mjs';
import { checkDesignSystem, dataContractIssues, rawColourIssues, sourceContractIssues } from '../scripts/check-design-system.mjs';

test('design-system guardrails pass the project', () => {
  assert.deepEqual(checkDesignSystem(ROOT), []);
});

test('raw colours are rejected outside tokens and documented line exceptions work', () => {
  const root = mkdtempSync(join(tmpdir(), 'aica-design-'));
  mkdirSync(join(root, 'styles'), { recursive: true });
  writeFileSync(join(root, 'styles/tokens.css'), ':root { --ink: #012345; }\n');
  writeFileSync(join(root, 'bad.css'), '.bad { color: #abcdef; }\n.ok { color: #fedcba; } /* design-check-allow: raw-color */\n');
  assert.deepEqual(rawColourIssues(root), ['bad.css:1: move raw colour to site/styles/tokens.css']);
});

test('source contracts reject a removed guided-path marker', () => {
  const source = join(ROOT, 'site/pages/[lang]/start/[outcome]/index.astro');
  const original = readFileSync(source, 'utf8');
  const fakeRoot = mkdtempSync(join(tmpdir(), 'aica-design-source-'));
  for (const file of [
    'site/components/StatusBadge.astro', 'site/components/ContactRoute.astro',
    'site/pages/[lang]/[section]/[id]/index.astro', 'site/pages/[lang]/directory/index.astro',
    'site/pages/[lang]/start/[outcome]/index.astro'
  ]) {
    const target = join(fakeRoot, file);
    mkdirSync(target.slice(0, target.lastIndexOf('/')), { recursive: true });
    const content = file.endsWith('start/[outcome]/index.astro') ? original.replace('data-contact-evidence="true"', '') : readFileSync(join(ROOT, file), 'utf8');
    writeFileSync(target, content);
  }
  assert.ok(sourceContractIssues(fakeRoot).some(issue => issue.includes('data-contact-evidence')));
});

test('all published contact data satisfies the action/evidence contract', () => {
  assert.deepEqual(dataContractIssues(loadDirectory()), []);
});
