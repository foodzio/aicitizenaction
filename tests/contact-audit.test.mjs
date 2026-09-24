import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import YAML from 'yaml';
import { runScript } from './helpers.mjs';
import { loadContent } from '../scripts/lib/content.mjs';

test('contact audit accounts for every channel record and route', () => {
  const out = join(mkdtempSync(join(tmpdir(), 'aica-contact-audit-')), 'audit.yml');
  const r = runScript('contact-audit.mjs', null, ['--out', out]);
  assert.equal(r.status, 0, r.stderr);
  const report = YAML.parse(readFileSync(out, 'utf8'));
  const channels = loadContent('channels');
  const routeCount = channels.reduce((sum, record) => sum + record.facts.routes.length, 0);
  assert.equal(report.totals.records, channels.length);
  assert.equal(report.totals.routes, routeCount);
  assert.equal(report.routes.length, routeCount);
  assert.equal(new Set(report.routes.map(x => `${x.record_id}:${x.route_id}`)).size, routeCount);
  assert.equal(Object.values(report.totals.dispositions).reduce((a, b) => a + b, 0), routeCount);
  assert.equal(Object.values(report.totals.record_dispositions).reduce((a, b) => a + b, 0), channels.length);
  assert.equal(report.totals.dispositions.pending, 0);
  assert.equal(report.totals.record_dispositions.pending, 0);
});
