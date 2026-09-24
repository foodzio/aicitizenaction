#!/usr/bin/env node
// Apply only reviewed, independently approved `same` decisions. Default is a read-only dry run.

import { randomUUID, createHash } from 'node:crypto';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { ROOT, loadContent } from './lib/content.mjs';
import { validateIdentityDecisions } from './directory-identity-review.mjs';

const DIRECTORY = new Set(['bodies', 'channels', 'orgs']);
const clone = value => structuredClone(value);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const uniq = values => [...new Set(values.filter(value => value !== undefined && value !== null))];
const entityKey = () => `entity-${randomUUID()}`;
const hash = value => createHash('sha256').update(value).digest('hex').slice(0, 8);
const yaml = value => YAML.stringify(value, { lineWidth: 0 });

function sourceEntry(record) {
  const source = record.meta?.sources?.[0];
  if (!source?.url) return null;
  return { record_id: record.id, source_url: source.url, checked_on: source.checked ?? record.meta?.verified_on };
}

function mergeArray(left = [], right = []) {
  const result = clone(left);
  for (const value of right) if (!result.some(existing => same(existing, value))) result.push(clone(value));
  return result;
}

function mergeObject(left = {}, right = {}) {
  const result = clone(left);
  for (const [key, value] of Object.entries(right ?? {})) {
    if (result[key] === undefined || result[key] === null || result[key] === '') result[key] = clone(value);
    else if (Array.isArray(result[key]) && Array.isArray(value)) result[key] = mergeArray(result[key], value);
    else if (result[key] && value && typeof result[key] === 'object' && typeof value === 'object' && !Array.isArray(value)) result[key] = mergeObject(result[key], value);
  }
  return result;
}

function prepareRoutes(canonical, retired) {
  const used = new Map((canonical.facts?.routes ?? []).map(route => [route.id, route]));
  const routes = clone(retired.facts?.routes ?? []);
  const routeStrings = clone(retired.strings?.routes ?? {});
  for (const route of routes) {
    const current = used.get(route.id);
    if (!current) { used.set(route.id, route); continue; }
    if (same(current, route)) continue;
    if (current.type === route.type && current.value === route.value) {
      Object.assign(route, mergeObject(current, route));
      continue;
    }
    const old = route.id;
    route.id = `${old}-${hash(retired.id)}`.slice(0, 90).replace(/-+$/, '');
    if (routeStrings[old]) { routeStrings[route.id] = routeStrings[old]; delete routeStrings[old]; }
    used.set(route.id, route);
  }
  retired.facts.routes = routes;
  retired.strings.routes = routeStrings;
}

function fieldProvenance(canonical, retired) {
  const out = clone(canonical.meta?.merge_provenance ?? {});
  for (const record of [canonical, retired]) {
    const source = sourceEntry(record);
    if (!source) continue;
    for (const area of ['geo', 'facts', 'strings']) for (const key of Object.keys(record[area] ?? {})) {
      const path = `${area}.${key}`;
      out[path] ??= [];
      if (!out[path].some(item => same(item, source))) out[path].push(source);
    }
  }
  return out;
}

export function mergeRecords(canonicalInput, retiredInput, decision, keyFactory = entityKey) {
  const canonical = clone(canonicalInput), retired = clone(retiredInput);
  prepareRoutes(canonical, retired);
  const canonicalSource = sourceEntry(canonical), retiredSource = sourceEntry(retired);
  const provenance = fieldProvenance(canonical, retired);
  canonical.facts = mergeObject(canonical.facts, retired.facts);
  canonical.strings = mergeObject(canonical.strings, retired.strings);
  canonical.meta = mergeObject(canonical.meta, retired.meta);
  canonical.facts.entity_key ??= keyFactory();
  canonical.facts.roles = uniq([canonical.type, retired.type, ...(canonical.facts.roles ?? []), ...(retired.facts.roles ?? [])]);
  canonical.meta.legacy_ids = uniq([canonical.meta.legacy_id, retired.meta.legacy_id, ...(canonical.meta.legacy_ids ?? []), ...(retired.meta.legacy_ids ?? [])]);
  canonical.meta.aliases = uniq([...(canonical.meta.aliases ?? []), ...(retired.meta.aliases ?? []), retired.id, retired.strings?.name]);
  canonical.meta.redirect_from = mergeArray(canonical.meta.redirect_from, [
    ...(retired.meta.redirect_from ?? []), { section: retiredInput._section, id: retired.id }
  ]);
  canonical.meta.sources = mergeArray(canonical.meta.sources, retired.meta.sources);
  canonical.meta.identity_review = {
    evidence_urls: decision.evidence_urls,
    reviewed_by: decision.reviewed_by,
    approved_by: decision.approved_by,
    reviewed_on: decision.reviewed_on,
    review_by: decision.review_by,
    note: decision.note
  };
  canonical.meta.merge_provenance = provenance;
  // If both records had sources, every retained top-level field can be traced to both reviewed
  // inputs. sourceEntry is deliberately strict: unsourced destructive merges are rejected below.
  if (!canonicalSource || !retiredSource) throw new Error(`${decision.key}: both records need cited sources before merge`);
  return canonical;
}

function replaceIds(value, replacements) {
  if (typeof value === 'string') return replacements.get(value) ?? value;
  if (Array.isArray(value)) return value.map(item => replaceIds(item, replacements));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceIds(item, replacements)]));
}

function effectiveDecision(item, defaults) { return { ...defaults, ...item }; }

function rewriteLedger(ledger, replacements) {
  const byKey = new Map();
  for (const original of ledger.decisions ?? []) {
    if (original.decision === 'same') { byKey.set(original.key, original); continue; }
    const records = original.records.map(id => replacements.get(id) ?? id);
    if (records[0] === records[1]) continue;
    const key = [...records].sort().join('--');
    const row = { ...original, key, records };
    const prior = byKey.get(key);
    if (!prior) byKey.set(key, row);
    else {
      const related = [prior, row].find(item => item.decision === 'related');
      byKey.set(key, {
        ...(related ?? prior),
        evidence_urls: uniq([...(prior.evidence_urls ?? []), ...(row.evidence_urls ?? [])]),
        note: uniq([prior.note, row.note]).join(' ')
      });
    }
  }
  return { ...ledger, decisions: [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key)) };
}

export function buildMergePlan(records, ledger) {
  const active = new Map(records.filter(record => DIRECTORY.has(record._section)).map(record => [record.id, record]));
  const decisions = (ledger.decisions ?? []).map(item => effectiveDecision(item, ledger.defaults));
  const merges = [], errors = [];
  for (const decision of decisions.filter(row => row.decision === 'same')) {
    const retiredId = decision.records.find(id => id !== decision.canonical_id);
    const canonical = active.get(decision.canonical_id), retired = active.get(retiredId);
    if (!decision.approved_by || decision.approved_by === decision.reviewed_by) errors.push(`${decision.key}: merge lacks independent approval`);
    if (!canonical || !retired) errors.push(`${decision.key}: active canonical and retired records are required`);
    else merges.push({ decision, canonical, retired });
  }
  return { merges, errors };
}

function serializable(record) {
  return Object.fromEntries(Object.entries(record));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const inventoryPath = join(ROOT, 'docs', 'directory-identity-candidates.yml');
  const ledgerPath = join(ROOT, 'docs', 'directory-identity-decisions.yml');
  const inventory = YAML.parse(readFileSync(inventoryPath, 'utf8'));
  const ledger = YAML.parse(readFileSync(ledgerPath, 'utf8'));
  const records = loadContent();
  const review = validateIdentityDecisions({ inventory, ledger, records });
  if (review.errors.length) throw new Error(`identity decision ledger is invalid:\n${review.errors.join('\n')}`);
  const plan = buildMergePlan(records, ledger);
  if (plan.errors.length) throw new Error(plan.errors.join('\n'));
  const replacements = new Map(plan.merges.map(item => [item.retired.id, item.canonical.id]));
  console.log(`${plan.merges.length} approved merges; ${replacements.size} records will retire; ${records.filter(r => DIRECTORY.has(r._section)).length - replacements.size} canonical records remain`);
  if (!process.argv.includes('--apply')) {
    for (const item of plan.merges) console.log(`DRY-RUN ${item.retired._section}/${item.retired.id} -> ${item.canonical._section}/${item.canonical.id}`);
    console.log('No files changed. Re-run with --apply after reviewing this plan.');
    process.exit(0);
  }

  const merged = new Map(plan.merges.map(item => [item.canonical.id, mergeRecords(item.canonical, item.retired, item.decision)]));
  for (const record of records) {
    if (!DIRECTORY.has(record._section) || replacements.has(record.id)) continue;
    let output = merged.get(record.id) ?? clone(record);
    output = replaceIds(output, replacements);
    output.facts.entity_key ??= entityKey();
    output.facts.roles = uniq([output.type, ...(output.facts.roles ?? [])]);
    writeFileSync(join(ROOT, record._path), yaml(serializable(output)));
  }
  // References in Resources and guides are exact ids, never prose substitutions.
  for (const record of records.filter(record => !DIRECTORY.has(record._section))) {
    const output = replaceIds(clone(record), replacements);
    if (!same(serializable(record), output)) writeFileSync(join(ROOT, record._path), yaml(serializable(output)));
  }
  for (const item of plan.merges) {
    const path = join(ROOT, item.retired._path);
    if (existsSync(path)) unlinkSync(path);
  }
  writeFileSync(ledgerPath, yaml(rewriteLedger(ledger, replacements)));
  console.log(`Applied ${plan.merges.length} merges and assigned stable entity keys/roles to every canonical directory record.`);
}
