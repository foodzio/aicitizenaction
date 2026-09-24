import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import YAML from 'yaml';
import { runScript } from './helpers.mjs';

test('contact audit accounts for every channel record and route', () => {
  const out = join(mkdtempSync(join(tmpdir(), 'aica-contact-audit-')), 'audit.yml');
  const r = runScript('contact-audit.mjs', null, ['--out', out]);
  assert.equal(r.status, 0, r.stderr);
  const report = YAML.parse(readFileSync(out, 'utf8'));
  assert.equal(report.totals.records, 74);
  assert.equal(report.totals.routes, 234);
  assert.equal(report.routes.length, 234);
  assert.equal(new Set(report.routes.map(x => `${x.record_id}:${x.route_id}`)).size, 234);
  assert.equal(Object.values(report.totals.dispositions).reduce((a, b) => a + b, 0), 234);
});
