#!/usr/bin/env node
// Link check for every URL in content/, tuned for government sites that block automated checks.
//
//   node scripts/check-links.mjs                      whole tree
//   node scripts/check-links.mjs --files a.yml b.yml   only URLs in these files (pull requests)
//   options: --state <file>   previous run's state; enables the two-consecutive-failures rule
//            --out <file>     write results JSON (confirmed failures, unknowns, moved)
//            --summary <file> append a markdown summary (e.g. $GITHUB_STEP_SUMMARY)
//            --concurrency N  default 8 · --timeout ms default 15000
//
// Classification (docs/implementation-plan.md, phase 2):
//   ok       2xx after redirects
//   moved    ok, but redirected to a different host — reported, not a failure
//   unknown  401/403/405/406/429/451/999, bot challenges, timeouts, TLS-chain and HTTP/2
//            client errors — never an issue on its own
//   broken   404/410, other 4xx/5xx after retries, DNS failure, refused connection
// A URL becomes a *confirmed* failure only when it was also broken in the previous state.
// With --files (pull-request mode) any broken URL fails the run immediately.
// Domains listed in scripts/linkcheck-exclude.yml are skipped; they are reviewed by hand.
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT, CONTENT, walk, readYaml, rel } from './lib/content.mjs';

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const filesIdx = args.indexOf('--files');
const FILES = filesIdx >= 0 ? args.slice(filesIdx + 1).filter(a => !a.startsWith('--')) : null;
const CONCURRENCY = Number(opt('--concurrency', 8));
const TIMEOUT = Number(opt('--timeout', 15000));
const UA = 'Mozilla/5.0 (compatible; aicitizenaction-linkcheck/1.0; +https://github.com/sinscrit/aicitizenaction)';
const UNKNOWN_STATUS = new Set([401, 403, 405, 406, 429, 451, 999]);

/** url → [{ path, where }] for every http(s) URL in the given files. */
export function collectUrls(paths) {
  const urls = new Map();
  const add = (url, path, where) => {
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) return;
    if (!urls.has(url)) urls.set(url, []);
    urls.get(url).push({ path, where });
  };
  for (const p of paths) {
    const r = readYaml(p) ?? {};
    const path = rel(p);
    for (const route of r.facts?.routes ?? []) add(route.value, path, `route ${route.id}`);
    for (const s of r.meta?.sources ?? []) add(s.url, path, 'source');
    for (const k of ['url', 'site_url', 'feed_url', 'action_url']) add(r.facts?.[k], path, k);
  }
  return urls;
}

export function loadExclusions() {
  const p = resolve(ROOT, 'scripts/linkcheck-exclude.yml');
  return existsSync(p) ? new Set((readYaml(p)?.domains ?? []).map(d => d.domain)) : new Set();
}

const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function request(url, method) {
  const res = await fetch(url, {
    method, redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT),
    headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,*/*;q=0.8', 'accept-language': 'en' }
  });
  let challenge = false;
  if (method === 'GET') {
    const text = (await res.text().catch(() => '')).slice(0, 4000);
    challenge = /cf-chl|challenge-platform|captcha|are you a robot|access denied/i.test(text) && res.status >= 400;
  } else res.body?.cancel?.();
  return { status: res.status, finalUrl: res.url, challenge };
}

/** @returns {Promise<{status:'ok'|'moved'|'unknown'|'broken', code?:number, detail?:string, finalUrl?:string}>} */
export async function checkUrl(url, { retries = 2 } = {}) {
  let last;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      let r = await request(url, 'HEAD');
      if (r.status >= 400) r = await request(url, 'GET');     // many servers mishandle HEAD
      if (r.challenge) return { status: 'unknown', code: r.status, detail: 'bot challenge' };
      if (r.status >= 200 && r.status < 400) {
        return host(r.finalUrl) && host(r.finalUrl) !== host(url)
          ? { status: 'moved', code: r.status, finalUrl: r.finalUrl }
          : { status: 'ok', code: r.status };
      }
      if (UNKNOWN_STATUS.has(r.status)) {
        last = { status: 'unknown', code: r.status, detail: 'blocked or rate-limited' };
        if (r.status !== 429) return last;
      } else if (r.status === 404 || r.status === 410) {
        return { status: 'broken', code: r.status };
      } else last = { status: 'broken', code: r.status };
    } catch (e) {
      const code = e.cause?.code ?? e.name;
      if (code === 'TimeoutError' || code === 'AbortError' || code === 'UND_ERR_CONNECT_TIMEOUT') last = { status: 'unknown', detail: 'timeout' };
      else if (code === 'ENOTFOUND' || code === 'ECONNREFUSED' || code === 'EAI_AGAIN') last = { status: 'broken', detail: code };
      // Incomplete certificate chains (browsers repair them, Node does not) and HTTP/2 protocol
      // quirks are client-side problems, not evidence the page is gone.
      else if (/CERT|SIGNATURE|SELF_SIGNED|TLS|SSL/i.test(code)) last = { status: 'unknown', detail: `tls: ${code}` };
      else if (/HTTP2|UND_ERR_SOCKET|ECONNRESET/i.test(code)) last = { status: 'unknown', detail: `protocol: ${code}` };
      else last = { status: 'broken', detail: String(code ?? e.message).slice(0, 80) };
      if (code === 'ENOTFOUND') return last;
    }
    if (attempt < retries) await sleep(500 * 2 ** attempt);
  }
  return last;
}

export async function run({ files, statePath, concurrency = CONCURRENCY } = {}) {
  const paths = files ? files.map(f => resolve(f)).filter(f => f.endsWith('.yml') && existsSync(f)) : walk(CONTENT);
  const urls = collectUrls(paths);
  const excluded = loadExclusions();
  const previous = statePath && existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : {};
  const results = {};
  const queue = [...urls.keys()];
  async function worker() {
    while (queue.length) {
      const url = queue.shift();
      if (excluded.has(host(url))) { results[url] = { status: 'excluded' }; continue; }
      results[url] = await checkUrl(url);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length || 1) }, worker));

  const state = {}, confirmed = [], broken = [], unknown = [], moved = [];
  const today = new Date().toISOString().slice(0, 10);
  for (const [url, r] of Object.entries(results)) {
    const refs = urls.get(url);
    if (r.status === 'broken') {
      const prev = previous[url];
      const count = prev?.status === 'broken' ? prev.count + 1 : 1;
      state[url] = { status: 'broken', count, since: prev?.status === 'broken' ? prev.since : today, code: r.code, detail: r.detail };
      broken.push({ url, ...r, refs, count });
      if (count >= 2) confirmed.push({ url, ...r, refs, since: state[url].since });
    } else if (r.status === 'unknown') { unknown.push({ url, ...r, refs }); state[url] = { status: 'unknown' }; }
    else if (r.status === 'moved') moved.push({ url, ...r, refs });
  }
  return { checked: urls.size, excluded: [...Object.values(results)].filter(r => r.status === 'excluded').length, broken, confirmed, unknown, moved, state };
}

function summary(r, prMode) {
  const line = x => `- ${x.url}${x.code ? ` (${x.code})` : ''}${x.detail ? ` — ${x.detail}` : ''} · ${x.refs.map(f => `\`${f.path}\` ${f.where}`).join(', ')}`;
  return [
    `## Link check`,
    ``,
    `${r.checked} URLs · ${r.broken.length} broken${prMode ? '' : ` (${r.confirmed.length} confirmed on two consecutive runs)`} · ${r.unknown.length} unknown (blocked, rate-limited or timed out — not failures) · ${r.moved.length} moved to another host · ${r.excluded} excluded`,
    ``,
    ...(r.broken.length ? ['### Broken', '', ...r.broken.map(line), ''] : []),
    ...(r.moved.length ? ['### Moved to another host — check the record still points at the right page', '', ...r.moved.map(x => `${line(x)} → ${x.finalUrl}`), ''] : [])
  ].join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const statePath = opt('--state');
  const r = await run({ files: FILES, statePath });
  const out = opt('--out');
  if (out) writeFileSync(out, JSON.stringify(r, null, 2));
  if (statePath && !FILES) writeFileSync(statePath, JSON.stringify(r.state, null, 2));
  const md = summary(r, !!FILES);
  const sum = opt('--summary');
  if (sum) appendFileSync(sum, md + '\n');
  console.log(md);
  process.exit(FILES && r.broken.length ? 1 : 0);
}
