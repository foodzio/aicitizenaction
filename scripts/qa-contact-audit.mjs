#!/usr/bin/env node
// Browser-level regression and accessibility check for the Places to Contact correction.
// Requires the built site (including dist/axe.min.js), a local server, and Chrome for Testing on CDP.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib/content.mjs';

const base = process.env.AICA_QA_URL ?? 'http://127.0.0.1:4322';
const cdp = process.env.AICA_CDP ?? 'http://127.0.0.1:9352';
const out = join(ROOT, 'tmp', 'qa-contact');
mkdirSync(out, { recursive: true });

async function tab(url) {
  const target = await fetch(`${cdp}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' }).then(r => r.json());
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0;
  const pending = new Map();
  const events = [];
  ws.onmessage = ({ data }) => {
    const m = JSON.parse(data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result); }
    else events.push(m);
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => { const n = ++id; pending.set(n, { resolve, reject }); ws.send(JSON.stringify({ id: n, method, params })); });
  await send('Page.enable'); await send('Runtime.enable');
  const evaluate = async expression => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
    return r.result.value;
  };
  const goto = async path => {
    events.length = 0;
    await send('Page.navigate', { url: `${base}${path}` });
    for (let i = 0; i < 100 && !events.some(e => e.method === 'Page.loadEventFired'); i++) await new Promise(r => setTimeout(r, 50));
    await new Promise(r => setTimeout(r, 150));
  };
  return { target, ws, send, evaluate, goto };
}

const failures = [], results = [];
const check = (ok, name, detail = '') => { results.push({ name, ok, detail }); if (!ok) failures.push({ name, detail }); };
const pages = [
  ['/en/directory/', 'directory'],
  ['/en/channels/global-ai-incident-database/', 'valid-contact'],
  ['/en/channels/global-perils-ai-safety-s-insularity-why/', 'reference-record'],
  ['/en/start/record/?where=ar&step=3', 'argentina-regression']
];

const browser = await tab(`${base}/en/directory/`);
await browser.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });

for (const [path, name] of pages) {
  await browser.goto(path);
  const facts = await browser.evaluate(`({
    title: document.title,
    text: document.body.innerText,
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    errors: window.__qaErrors || []
  })`);
  check(!facts.overflow, `${name}: no mobile horizontal overflow`);
  if (name === 'directory') {
    check(facts.text.includes('Places to contact'), 'directory: renamed category');
    check(!facts.text.includes("The perils of AI safety's insularity"), 'directory: article excluded');
  }
  if (name === 'valid-contact') {
    check(/Open contact route|Limited contact route/.test(facts.text), 'record: contact status shown');
    check(facts.text.includes('Evidence that this route accepts contact'), 'record: acceptance evidence shown');
  }
  if (name === 'reference-record') check(facts.text.includes('not a current contact destination'), 'record: reference warning shown');
  if (name === 'argentina-regression') {
    check(!facts.text.includes('rest.hcdn.gob.ar/web/proyectos/289500/adjuntos/104100'), 'path: bill attachment excluded');
    check(!facts.text.includes('AI bills before the Chamber of Deputies'), 'path: false recipient excluded');
    check(facts.text.includes('How to send it'), 'path: instructions are not mislabeled as a destination');
  }
  const png = await browser.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(join(out, `${name}.png`), Buffer.from(png.data, 'base64'));

  for (const scheme of ['light', 'dark']) {
    await browser.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
    const axe = await browser.evaluate(`(async () => {
      if (!window.axe) { const code = await fetch('/axe.min.js').then(r => r.text()); (0, eval)(code); }
      const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','best-practice'] } });
      return r.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
    })()`);
    check(axe.length === 0, `${name}: axe ${scheme}`, JSON.stringify(axe));
  }
}

await browser.goto('/fr/directory/');
const fr = await browser.evaluate(`document.body.innerText`);
check(fr.includes('Lieux à contacter'), 'French directory: renamed category');
check(fr.includes('Afficher uniquement les moyens de contact actuellement vérifiés'), 'French directory: verified-contact wording');

const api = await fetch(`${base}/api/channels.json`).then(r => r.json());
check(api.count === 52 && api.excluded_count === 22, 'API: audited public count', `${api.count}/${api.excluded_count}`);
check(api.records.every(r => r.facts.contact_disposition === 'keep'), 'API: every record passes disposition');
check(api.records.every(r => r.facts.routes.some(x => x.contact?.review === 'reviewed' && ['open', 'limited'].includes(x.contact.status))), 'API: every record has reviewed eligible route');

await fetch(`${cdp}/json/close/${browser.target.id}`);
writeFileSync(join(out, 'results.json'), JSON.stringify({ run_at: new Date().toISOString(), base, results, failures }, null, 2));
console.log(`${results.length - failures.length}/${results.length} browser checks passed`);
for (const f of failures) console.error(`FAIL ${f.name}${f.detail ? `: ${f.detail}` : ''}`);
if (failures.length) process.exit(1);
