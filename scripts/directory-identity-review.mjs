#!/usr/bin/env node
// Validate the hand-maintained identity decision ledger against the generated candidate inventory.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { ROOT, loadContent } from './lib/content.mjs';

const DIRECTORY = new Set(['bodies', 'channels', 'orgs']);
const VALID = new Set(['same', 'distinct', 'related', 'pending']);
const today = () => new Date().toISOString().slice(0, 10);

function readYaml(path) { return YAML.parse(readFileSync(path, 'utf8')) ?? {}; }

export function validateIdentityDecisions({ inventory, ledger, records, now = today() }) {
  const errors = [], warnings = [];
  const candidates = new Map((inventory.candidates ?? []).map(row => [row.key, row]));
  const active = new Map(records.filter(row => DIRECTORY.has(row._section)).map(row => [row.id, row]));
  const redirects = new Map();
  for (const row of active.values()) for (const old of row.meta?.redirect_from ?? []) redirects.set(old.id, row.id);
  const decisions = new Map();

  for (const item of ledger.decisions ?? []) {
    const row = { ...(ledger.defaults ?? {}), ...item };
    const at = `decision ${row.key ?? '(missing key)'}`;
    if (!row.key) { errors.push(`${at}: missing key`); continue; }
    if (decisions.has(row.key)) errors.push(`${at}: duplicate decision`);
    decisions.set(row.key, row);
    if (!VALID.has(row.decision)) errors.push(`${at}: invalid decision "${row.decision}"`);
    if (!Array.isArray(row.records) || row.records.length !== 2 || new Set(row.records).size !== 2) errors.push(`${at}: records must contain two distinct ids`);
    const expectedKey = [...(row.records ?? [])].sort().join('--');
    if (row.records?.length === 2 && row.key !== expectedKey) errors.push(`${at}: key does not match sorted records`);
    if (!row.evidence_urls?.length || row.evidence_urls.some(url => { try { new URL(url); return false; } catch { return true; } })) errors.push(`${at}: evidence_urls must contain valid URLs`);
    if (!row.reviewed_by || !row.reviewed_on) errors.push(`${at}: reviewed_by and reviewed_on are required`);
    if (row.reviewed_on > now) errors.push(`${at}: reviewed_on is in the future`);
    if (!row.permanent && !row.review_by) errors.push(`${at}: review_by is required unless permanent`);
    if (row.review_by && row.review_by < row.reviewed_on) errors.push(`${at}: review_by is before reviewed_on`);
    if (!row.permanent && row.review_by < now) errors.push(`${at}: decision expired on ${row.review_by}`);

    const candidate = candidates.get(row.key);
    if (candidate) {
      const pair = [candidate.left.id, candidate.right.id].sort();
      if (JSON.stringify(pair) !== JSON.stringify([...(row.records ?? [])].sort())) errors.push(`${at}: records do not match current candidate`);
    } else {
      const historicalSame = row.decision === 'same' && row.canonical_id && active.has(row.canonical_id)
        && (row.records ?? []).filter(id => id !== row.canonical_id).every(id => redirects.get(id) === row.canonical_id);
      if (!historicalSame) errors.push(`${at}: no current candidate or completed canonical redirect`);
    }

    if (row.decision === 'same') {
      if (!row.canonical_id || !row.records?.includes(row.canonical_id)) errors.push(`${at}: same decision needs canonical_id from the pair`);
      if (!row.approved_by) errors.push(`${at}: same decision needs an independent approved_by`);
      if (row.approved_by && row.approved_by === row.reviewed_by) errors.push(`${at}: approver must differ from reviewer`);
      const bothActive = (row.records ?? []).every(id => active.has(id));
      if (bothActive) warnings.push(`${at}: approved same pair is still published twice`);
    }
    if (row.decision === 'related' && !row.relationship) errors.push(`${at}: related decision needs relationship`);
    if (row.decision === 'related' && row.relationship === 'parent-child') {
      if (!row.parent_id || !row.child_id || !row.records?.includes(row.parent_id) || !row.records?.includes(row.child_id)) errors.push(`${at}: parent-child decision needs parent_id and child_id from the pair`);
      else if (active.get(row.child_id)?.facts?.parent_id !== row.parent_id) errors.push(`${at}: child record does not name the reviewed parent_id`);
    }
    if (row.decision === 'pending' && !row.note) errors.push(`${at}: pending decision needs a note`);
  }

  for (const candidate of inventory.candidates ?? []) {
    const row = decisions.get(candidate.key);
    if (candidate.severity === 'high' && (!row || row.decision === 'pending')) errors.push(`candidate ${candidate.key}: high-confidence candidate needs a current decision`);
  }

  const resolved = [...candidates.keys()].filter(key => decisions.has(key) && decisions.get(key).decision !== 'pending').length;
  return {
    errors, warnings,
    totals: { candidates: candidates.size, decisions: decisions.size, resolved, unresolved: candidates.size - resolved }
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const inventory = readYaml(join(ROOT, 'docs', 'directory-identity-candidates.yml'));
  const ledger = readYaml(join(ROOT, 'docs', 'directory-identity-decisions.yml'));
  const result = validateIdentityDecisions({ inventory, ledger, records: loadContent() });
  if (process.argv.includes('--json')) console.log(JSON.stringify(result, null, 2));
  else {
    for (const message of result.errors) console.error(`ERROR  ${message}`);
    for (const message of result.warnings) console.warn(`WARN   ${message}`);
    console.log(`${result.totals.candidates} candidates · ${result.totals.resolved} resolved · ${result.totals.unresolved} unresolved · ${result.errors.length} errors`);
  }
  process.exitCode = result.errors.length ? 1 : 0;
}
