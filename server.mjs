#!/usr/bin/env node
// Production server: the static site in dist/ (served by serve-handler, the code behind the
// `serve` command) plus one endpoint that counts anonymous events.
//
// What is counted (docs/ux-brief.md, "How we will know it works"): arrivals at the door, steps
// reached, drafts copied or downloaded, whether the user added their own words, and a coarse
// time-to-draft bucket — per outcome, per day. Nothing else.
//
// What is never stored or read: cookies, local storage, IP addresses, user agents, referrers,
// exact times, or anything the user typed. Nothing is written to the visitor's device, and a
// count cannot be linked to a person. The server keeps only totals.
//
//   PORT=8080 COUNTS_FILE=/data/counts.json node server.mjs
//   (on Railway, mount a volume at /data so totals survive deploys)
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import handler from 'serve-handler';

const ROOT = dirname(fileURLToPath(import.meta.url));

export const EVENTS = new Set(['door', 'step_2', 'step_3', 'step_4', 'draft_copied', 'draft_downloaded', 'own_words', 'time_under_5', 'time_5_10', 'time_10_15', 'time_15_20', 'time_over_20']);
export const OUTCOMES = new Set(['none', 'law', 'harm', 'fix', 'record', 'join', 'insider']);
const MAX_BODY = 200;                 // bytes; a valid event is ~40
const MAX_PER_MINUTE = 1200;          // global cap, not per visitor — nothing identifies a visitor

/** Totals: { 'YYYY-MM-DD': { 'event|outcome': n } } */
export function createCounter(file) {
  let totals = {};
  if (file && existsSync(file)) { try { totals = JSON.parse(readFileSync(file, 'utf8')); } catch { totals = {}; } }
  let dirty = false, minute = 0, inMinute = 0;
  return {
    add(event, outcome, now = new Date()) {
      if (!EVENTS.has(event) || !OUTCOMES.has(outcome)) return false;
      const m = Math.floor(now.getTime() / 60000);
      if (m !== minute) { minute = m; inMinute = 0; }
      if (++inMinute > MAX_PER_MINUTE) return false;
      const day = now.toISOString().slice(0, 10);
      const key = `${event}|${outcome}`;
      (totals[day] ??= {})[key] = (totals[day][key] ?? 0) + 1;
      dirty = true;
      return true;
    },
    totals: () => totals,
    flush() {
      if (!file || !dirty) return;
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(`${file}.tmp`, JSON.stringify(totals));
      renameSync(`${file}.tmp`, file);
      dirty = false;
    }
  };
}

/** Summary for the public: totals per event and outcome over all days, plus per-day totals. */
export function summary(totals) {
  const all = {}, byDay = {};
  for (const [day, counts] of Object.entries(totals)) {
    byDay[day] = {};
    for (const [key, n] of Object.entries(counts)) {
      const [event] = key.split('|');
      all[key] = (all[key] ?? 0) + n;
      byDay[day][event] = (byDay[day][event] ?? 0) + n;
    }
  }
  const sum = event => Object.entries(all).filter(([k]) => k.startsWith(`${event}|`)).reduce((n, [, v]) => n + v, 0);
  const arrivals = sum('door');
  const drafts = sum('draft_copied') + sum('draft_downloaded');
  return {
    about: 'Anonymous totals. No cookies, no IP addresses, no identifiers; nothing a user types is sent.',
    completion_rate: arrivals ? Math.round((drafts / arrivals) * 1000) / 10 : null,
    own_words_rate: drafts ? Math.round((sum('own_words') / drafts) * 1000) / 10 : null,
    totals: all,
    by_day: byDay
  };
}

export function createApp({ counter, publicDir = join(ROOT, 'dist') } = {}) {
  return createServer((req, res) => {
    if (req.url === '/api/count' && req.method === 'POST') {
      let body = '', tooBig = false;
      req.on('data', chunk => { body += chunk; if (body.length > MAX_BODY) { tooBig = true; req.destroy(); } });
      req.on('end', () => {
        if (tooBig) return;
        let ok = false;
        try { const { e, o } = JSON.parse(body); ok = counter.add(String(e), String(o ?? 'none')); } catch {}
        res.writeHead(ok ? 204 : 400, { 'cache-control': 'no-store' });
        res.end();
      });
      return;
    }
    if (req.url === '/api/counts' && req.method === 'GET') {
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      res.end(JSON.stringify(summary(counter.totals())));
      return;
    }
    return handler(req, res, { public: publicDir, cleanUrls: true, trailingSlash: true, directoryListing: false });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 8080);
  const counter = createCounter(process.env.COUNTS_FILE ?? join(ROOT, 'data', 'counts.json'));
  setInterval(() => counter.flush(), 30000).unref();
  for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => { counter.flush(); process.exit(0); });
  createApp({ counter }).listen(port, () => console.log(`Listening on ${port}`));
}
