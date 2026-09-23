#!/usr/bin/env node
// Applies phase 1b routing drafts (topics, not_topics, powers) to records, with checks that make a
// first pass safe to hand to reviewers:
//   - every id must exist in schema/vocab/topics.yml or powers.yml;
//   - every id needs an evidence quote that is an EXACT substring of the record's own strings —
//     anything else is dropped and reported (no paraphrase, no outside knowledge);
//   - a record already marked `routing_review: reviewed` is never overwritten.
// Applied values are marked `routing_review: drafted`; routing ignores them until a person reviews.
//
//   node scripts/apply-routing-drafts.mjs drafts.json [more.json …] [--dry-run] [--report docs/routing-drafts-report.md]
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { ROOT, CONTENT, loadVocab, readYaml } from './lib/content.mjs';
import { stringsOf } from './lib/i18n.mjs';

const args = process.argv.slice(2);
const files = args.filter(a => a.endsWith('.json'));
const DRY = args.includes('--dry-run');
const reportIdx = args.indexOf('--report');
const REPORT = reportIdx >= 0 ? args[reportIdx + 1] : null;
const FIELDS = { topics: 'topics', not_topics: 'topics', powers: 'powers' };

export function checkDraft(record, draft, vocab) {
  const text = stringsOf(record.strings ?? {}).map(([, v]) => (typeof v === 'string' ? v : '')).join('\n\u0000\n');
  const norm = s => String(s).replace(/\s+/g, ' ').trim();
  const haystack = norm(text);
  const kept = { topics: [], not_topics: [], powers: [] }, evidence = {}, dropped = [];
  for (const [field, list] of Object.entries(FIELDS)) {
    for (const id of new Set(draft[field] ?? [])) {
      const key = `${field}:${id}`;
      const quote = draft.evidence?.[key];
      if (!vocab[list]?.ids.has(id)) { dropped.push({ key, why: 'not in vocabulary' }); continue; }
      if (!quote) { dropped.push({ key, why: 'no evidence quote' }); continue; }
      if (!haystack.includes(norm(quote))) { dropped.push({ key, why: 'quote is not in the record' }); continue; }
      if (field === 'topics' && (draft.not_topics ?? []).includes(id)) { dropped.push({ key, why: 'both topic and not_topic' }); continue; }
      kept[field].push(id);
      evidence[key] = norm(quote);
    }
  }
  return { kept, evidence, dropped };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const vocab = loadVocab();
  const drafts = Object.assign({}, ...files.map(f => JSON.parse(readFileSync(f, 'utf8'))));
  const stats = { records: 0, applied: 0, skippedReviewed: 0, topics: 0, not_topics: 0, powers: 0, dropped: 0 };
  const lines = [];
  for (const [path, draft] of Object.entries(drafts)) {
    stats.records++;
    const abs = join(CONTENT, path.replace(/^content\//, ''));
    const record = readYaml(abs);
    if (record.facts.routing_review === 'reviewed') { stats.skippedReviewed++; continue; }
    const { kept, evidence, dropped } = checkDraft(record, draft, vocab);
    stats.dropped += dropped.length;
    for (const d of dropped) lines.push(`- \`${path}\` — dropped \`${d.key}\`: ${d.why}`);
    const filled = Object.entries(kept).filter(([, v]) => v.length);
    if (!filled.length) continue;
    for (const [k, v] of filled) { record.facts[k] = v; stats[k] += v.length; }
    record.facts.routing_evidence = evidence;
    record.facts.routing_review = 'drafted';
    const pending = (record.meta.needs_research ?? []).filter(k => !kept[k]?.length);
    if (pending.length) record.meta.needs_research = pending; else delete record.meta.needs_research;
    if (draft.uncertain) lines.push(`- \`${path}\` — reviewer note: ${draft.uncertain}`);
    stats.applied++;
    if (!DRY) writeFileSync(abs, YAML.stringify(record, { lineWidth: 0 }));
  }
  const md = [
    '# Routing drafts — report',
    '',
    `*Generated ${new Date().toISOString()} by \`scripts/apply-routing-drafts.mjs\`. First-pass drafts from each record's own text, made by language-model agents and machine-checked: every value has a verbatim quote from the record. Routing ignores all of them until a person sets \`routing_review: reviewed\`.*`,
    '',
    `- Records with a draft: ${stats.applied} of ${stats.records}`,
    `- Values applied: ${stats.topics} topics, ${stats.not_topics} excluded topics, ${stats.powers} powers`,
    `- Values dropped by the checks: ${stats.dropped}`,
    `- Records already reviewed (left alone): ${stats.skippedReviewed}`,
    '',
    '## How to review a record',
    '',
    '1. Open the record. Read each value in `facts.topics`, `facts.not_topics` and `facts.powers` next to its quote in `facts.routing_evidence`.',
    '2. Remove anything the quote does not support. Add anything missing, with a quote. Be strict about powers — overstating one is the worst error this site can make.',
    '3. Set `facts.routing_review: reviewed` and your handle in the pull request. A second person approves.',
    '',
    '## Dropped values and reviewer notes',
    '',
    ...(lines.length ? lines : ['None.']),
    ''
  ].join('\n');
  if (REPORT && !DRY) writeFileSync(join(ROOT, REPORT), md);
  console.log(JSON.stringify(stats));
}
