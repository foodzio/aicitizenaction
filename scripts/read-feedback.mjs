#!/usr/bin/env node
// Prints feedback and contributor requests, newest first.
//
//   npm run feedback                       reads data/feedback.jsonl (local server)
//   node scripts/read-feedback.mjs <file>  any copy, e.g. one fetched from Railway with
//                                          `railway ssh -- cat /data/feedback.jsonl > tmp/feedback.jsonl`
import { readFileSync, existsSync } from 'node:fs';
const file = process.argv[2] ?? 'data/feedback.jsonl';
if (!existsSync(file)) { console.log(`No messages yet (${file} does not exist).`); process.exit(0); }
const entries = readFileSync(file, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)).reverse();
for (const e of entries) {
  console.log(`— ${e.at.slice(0, 16).replace('T', ' ')} · ${e.kind}${e.topic ? ` · ${e.topic}` : ''}${e.role ? ` · ${e.role}` : ''} · ${e.lang}`);
  for (const [k, v] of Object.entries(e)) if (!['id', 'kind', 'at', 'lang', 'topic', 'role'].includes(k)) console.log(`  ${k}: ${v.replace(/\n/g, '\n    ')}`);
}
console.log(`\n${entries.length} message(s).`);
