#!/usr/bin/env node
// Deterministic directory identity candidate inventory. This script never decides or merges:
// reviewed decisions live separately in docs/directory-identity-decisions.yml.
//
//   node scripts/directory-dedupe.mjs
//   node scripts/directory-dedupe.mjs --out tmp/candidates.yml
//   node scripts/directory-dedupe.mjs --check

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { getDomain } from 'tldts';
import { ROOT, loadContent } from './lib/content.mjs';

const DIRECTORY = new Set(['bodies', 'channels', 'orgs']);

export function normalizeName(value) {
  return String(value ?? '')
    .normalize('NFKD').replace(/\p{M}/gu, '')
    .toLowerCase().replace(/&/g, ' and ')
    .replace(/\bthe\b/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
}

function comparableName(value) {
  return normalizeName(value)
    .replace(/\bcentre\b/g, 'center')
    .replace(/\b(incorporated|inc|limited|ltd|llc|plc|association|organisation|organization)\b/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function acronyms(value) {
  return new Set([...String(value ?? '').matchAll(/\(([A-Z][A-Z0-9-]{2,})\)/g)].map(match => match[1]));
}

function normalizedUrl(value) {
  try {
    const u = new URL(value);
    u.hash = '';
    for (const key of [...u.searchParams.keys()]) if (/^(utm_|fbclid|gclid)/i.test(key)) u.searchParams.delete(key);
    u.hostname = u.hostname.toLowerCase();
    u.pathname = u.pathname.replace(/\/+$/, '') || '/';
    return u.toString();
  } catch { return null; }
}

function evidence(record) {
  const urls = new Set();
  const endpoints = new Set();
  for (const source of record.meta?.sources ?? []) {
    const url = normalizedUrl(source.url);
    if (url) urls.add(url);
  }
  for (const route of record.facts?.routes ?? []) {
    const raw = String(route.value ?? '').trim();
    const url = normalizedUrl(raw);
    if (url) { urls.add(url); endpoints.add(url); }
    else if (/^[^\s@]+@[^\s@]+$/i.test(raw)) endpoints.add(raw.toLowerCase());
  }
  const domains = new Set([...urls].map(url => getDomain(url, { allowPrivateDomains: true })).filter(Boolean));
  return { urls, endpoints, domains };
}

function intersection(a, b) {
  return [...a].filter(x => b.has(x)).sort();
}

function tokens(value) { return new Set(normalizeName(value).split(' ').filter(Boolean)); }
function similarity(a, b) {
  const aa = tokens(a), bb = tokens(b);
  if (!aa.size || !bb.size) return 0;
  const both = [...aa].filter(x => bb.has(x)).length;
  return both / (aa.size + bb.size - both);
}

function pairKey(a, b) { return [a.id, b.id].sort().join('--'); }

export function candidateInventory(records = loadContent().filter(r => DIRECTORY.has(r._section))) {
  const rows = records.map(record => ({
    record,
    name: normalizeName(record.strings?.name),
    comparable: comparableName(record.strings?.name),
    local: normalizeName(record.facts?.local_name ?? record.strings?.local_name),
    acronyms: acronyms(record.strings?.name),
    baseId: record.id.replace(/-\d+$/, ''),
    evidence: evidence(record)
  })).sort((a, b) => a.record.id.localeCompare(b.record.id));
  const candidates = [];

  for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) {
    const a = rows[i], b = rows[j];
    const sameCountry = a.record.geo?.country === b.record.geo?.country;
    const sameSub = (a.record.geo?.sub ?? '') === (b.record.geo?.sub ?? '');
    const exactName = !!a.name && a.name === b.name;
    const exactComparable = !!a.comparable && a.comparable === b.comparable;
    const exactLocal = !!a.local && a.local === b.local;
    const numericSibling = a.baseId === b.baseId && a.record.id !== b.record.id;
    const sharedDomains = intersection(a.evidence.domains, b.evidence.domains);
    const sharedEndpoints = intersection(a.evidence.endpoints, b.evidence.endpoints);
    const sharedAcronyms = intersection(a.acronyms, b.acronyms);
    const nameSimilarity = similarity(a.record.strings?.name, b.record.strings?.name);
    const include = exactName || exactLocal || numericSibling || sharedEndpoints.length
      || (sameCountry && sharedDomains.length && (exactComparable || sharedAcronyms.length || nameSimilarity >= 0.82));
    if (!include) continue;

    const signals = [];
    if (exactName) signals.push('exact-normalized-name');
    else if (exactComparable) signals.push('normalized-organisational-name');
    if (exactLocal) signals.push('exact-local-name');
    if (numericSibling) signals.push('numeric-suffix-sibling');
    if (sharedDomains.length) signals.push('shared-official-domain');
    if (sharedEndpoints.length) signals.push('shared-endpoint');
    if (sharedAcronyms.length) signals.push('shared-acronym');
    if (!exactName && nameSimilarity >= 0.82) signals.push('high-name-similarity');
    // A shared form/inbox often serves several genuinely distinct public bodies. It is useful
    // evidence, but never a high-confidence identity match without a matching name.
    const severity = sameCountry && sameSub && (exactName || exactLocal)
      && (sharedDomains.length || sharedEndpoints.length || numericSibling)
      ? 'high'
      : (exactName || exactLocal || numericSibling || (sharedEndpoints.length && nameSimilarity >= 0.5)) ? 'medium' : 'low';
    candidates.push({
      key: pairKey(a.record, b.record),
      left: { id: a.record.id, section: a.record._section, name: a.record.strings?.name ?? '', country: a.record.geo?.country ?? '', sub: a.record.geo?.sub ?? null },
      right: { id: b.record.id, section: b.record._section, name: b.record.strings?.name ?? '', country: b.record.geo?.country ?? '', sub: b.record.geo?.sub ?? null },
      severity,
      signals,
      shared_domains: sharedDomains,
      shared_endpoints: sharedEndpoints,
      name_similarity: Math.round(nameSimilarity * 1000) / 1000
    });
  }

  candidates.sort((a, b) => ({ high: 0, medium: 1, low: 2 })[a.severity] - ({ high: 0, medium: 1, low: 2 })[b.severity] || a.key.localeCompare(b.key));
  return {
    version: 1,
    scope: 'Every bodies/channels/orgs record; generated evidence only. Decisions live in docs/directory-identity-decisions.yml.',
    totals: {
      records: records.length,
      candidates: candidates.length,
      high: candidates.filter(x => x.severity === 'high').length,
      medium: candidates.filter(x => x.severity === 'medium').length,
      low: candidates.filter(x => x.severity === 'low').length
    },
    candidates
  };
}

export function inventoryText(records) {
  return YAML.stringify(candidateInventory(records), { lineWidth: 0 });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const valueAfter = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
  const out = valueAfter('--out') ?? join(ROOT, 'docs', 'directory-identity-candidates.yml');
  const text = inventoryText();
  if (args.includes('--check')) {
    if (!existsSync(out) || readFileSync(out, 'utf8') !== text) {
      console.error(`${out} is stale; run node scripts/directory-dedupe.mjs`);
      process.exit(1);
    }
    console.log(`${out} is current`);
  } else {
    writeFileSync(out, text);
    const t = candidateInventory().totals;
    console.log(`Wrote ${out}: ${t.records} records, ${t.candidates} candidates (${t.high} high, ${t.medium} medium, ${t.low} low)`);
  }
}
