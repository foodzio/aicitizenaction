#!/usr/bin/env node
// Weekly freshness report: how current the directory is, per section and country, seat-holder
// checks due, open windows, translation coverage, and the Resources perspective balance.
//
//   node scripts/freshness.mjs [--link-state .linkcheck/state.json] [--out report.json] [--summary file.md]
import { writeFileSync, appendFileSync } from 'node:fs';
import { freshness, freshnessMarkdown } from './lib/freshness.mjs';

const args = process.argv.slice(2);
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const f = freshness({ linkState: opt('--link-state') });
const md = freshnessMarkdown(f);
if (opt('--out')) writeFileSync(opt('--out'), JSON.stringify(f, null, 2));
if (opt('--summary')) appendFileSync(opt('--summary'), md + '\n');
console.log(md);
