#!/usr/bin/env node
// Deterministic browser checks for the critical contact journey. Requires a built/served site and
// Chrome for Testing on the project CDP port. Use --update only after visually reviewing output.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { ROOT } from './lib/content.mjs';

const update = process.argv.includes('--update');
const base = process.env.AICA_QA_URL ?? 'http://127.0.0.1:4322';
const cdp = process.env.AICA_CDP ?? 'http://127.0.0.1:9352';
const baselineDir = join(ROOT, 'tests', 'visual-baselines');
const artifactDir = join(ROOT, 'tmp', 'visual-regression');
const axePath = join(ROOT, 'node_modules', 'axe-core', 'axe.min.js');
const maxDiffPixels = 12;
mkdirSync(baselineDir, { recursive: true });
mkdirSync(artifactDir, { recursive: true });

const scenarios = [
  { name: 'reference-desktop-light', path: '/en/design-system/', width: 1280, height: 900, scheme: 'light' },
  { name: 'reference-desktop-dark', path: '/en/design-system/', width: 1280, height: 900, scheme: 'dark' },
  { name: 'reference-mobile-light', path: '/en/design-system/', width: 390, height: 844, scheme: 'light', mobile: true },
  { name: 'directory-desktop-light', path: '/en/directory/', width: 1280, height: 900, scheme: 'light' },
  { name: 'directory-mobile-dark', path: '/en/directory/', width: 390, height: 844, scheme: 'dark', mobile: true },
  { name: 'actionable-record-light', path: '/en/channels/global-ai-incident-database/', width: 1280, height: 900, scheme: 'light' },
  { name: 'reference-record-light', path: '/en/channels/global-house-evaluation-is-not-enough-third/', width: 1280, height: 900, scheme: 'light' },
  { name: 'guided-path-mobile-light', path: '/en/start/record/?where=us&step=3', width: 390, height: 844, scheme: 'light', mobile: true }
];

async function connect(url) {
  const target = await fetch(`${cdp}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' }).then(response => response.json());
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0;
  const pending = new Map();
  const events = [];
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id && pending.has(message.id)) {
      const handlers = pending.get(message.id); pending.delete(message.id);
      message.error ? handlers.reject(new Error(message.error.message)) : handlers.resolve(message.result);
    } else events.push(message);
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const messageId = ++id; pending.set(messageId, { resolve, reject });
    socket.send(JSON.stringify({ id: messageId, method, params }));
  });
  await send('Page.enable');
  await send('Runtime.enable');
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  };
  const goto = async path => {
    events.length = 0;
    await send('Page.navigate', { url: `${base}${path}` });
    for (let attempt = 0; attempt < 200 && !events.some(event => event.method === 'Page.loadEventFired'); attempt++) {
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    await evaluate(`document.fonts.ready.then(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))`);
  };
  return { target, socket, send, evaluate, goto };
}

const failures = [];
const results = [];
const browser = await connect(`${base}/en/design-system/`);
const version = await browser.send('Browser.getVersion');
await browser.send('Emulation.setTimezoneOverride', { timezoneId: 'Europe/Paris' });
await browser.send('Emulation.setLocaleOverride', { locale: 'en-GB' });
const axeSource = readFileSync(axePath, 'utf8');

for (const scenario of scenarios) {
  await browser.send('Emulation.setDeviceMetricsOverride', {
    width: scenario.width, height: scenario.height, deviceScaleFactor: 1, mobile: !!scenario.mobile
  });
  await browser.send('Emulation.setEmulatedMedia', { features: [
    { name: 'prefers-color-scheme', value: scenario.scheme },
    { name: 'prefers-reduced-motion', value: 'reduce' }
  ] });
  await browser.goto(scenario.path);
  await browser.evaluate(`(() => {
    const style = document.createElement('style');
    style.dataset.visualRegression = 'true';
    style.textContent = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}html{scroll-behavior:auto!important}';
    document.head.append(style); window.scrollTo(0, 0);
  })()`);
  const checks = await browser.evaluate(`(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    title: document.title,
    routes: [...document.querySelectorAll('[data-ds-component="contact-route"]')].map(node => ({
      state: node.dataset.contactState,
      actionable: node.dataset.actionable,
      actions: node.querySelectorAll('[data-contact-action="primary"]').length,
      evidenceButtons: node.querySelectorAll('[data-contact-evidence] .btn').length
    }))
  }))()`);
  if (checks.overflow) failures.push(`${scenario.name}: horizontal overflow`);
  for (const route of checks.routes) {
    if ((route.actionable === 'true') !== (route.actions === 1)) failures.push(`${scenario.name}: actionability/action count disagree for ${route.state}`);
    if (route.evidenceButtons) failures.push(`${scenario.name}: evidence uses primary button styling`);
  }
  await browser.evaluate(`(() => { if (!window.axe) (0, eval)(${JSON.stringify(axeSource)}); })()`);
  const violations = await browser.evaluate(`axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','best-practice'] } }).then(result => result.violations.map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.map(node => node.target) })))`);
  if (violations.length) failures.push(`${scenario.name}: axe ${JSON.stringify(violations)}`);

  const capture = await browser.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
  const bytes = Buffer.from(capture.data, 'base64');
  const baselinePath = join(baselineDir, `${scenario.name}.png`);
  const actualPath = join(artifactDir, `${scenario.name}.actual.png`);
  writeFileSync(actualPath, bytes);
  const hash = createHash('sha256').update(bytes).digest('hex');
  let baselineHash = null;
  if (existsSync(baselinePath)) baselineHash = createHash('sha256').update(readFileSync(baselinePath)).digest('hex');
  if (update) writeFileSync(baselinePath, bytes);
  else if (!baselineHash) failures.push(`${scenario.name}: baseline missing; review artifacts then run with --update`);
  let diffPixels = 0;
  if (!update && baselineHash && hash !== baselineHash) {
    const expected = PNG.sync.read(readFileSync(baselinePath));
    const actual = PNG.sync.read(bytes);
    if (expected.width !== actual.width || expected.height !== actual.height) {
      failures.push(`${scenario.name}: screenshot dimensions changed from ${expected.width}×${expected.height} to ${actual.width}×${actual.height}`);
    } else {
      const diff = new PNG({ width: expected.width, height: expected.height });
      diffPixels = pixelmatch(expected.data, actual.data, diff.data, expected.width, expected.height, { threshold: 0.1 });
      if (diffPixels > maxDiffPixels) {
        writeFileSync(join(artifactDir, `${scenario.name}.diff.png`), PNG.sync.write(diff));
        failures.push(`${scenario.name}: ${diffPixels} pixels differ (allowance ${maxDiffPixels}); actual and diff retained in tmp/visual-regression`);
      }
    }
  }
  results.push({ ...scenario, title: checks.title, axeViolations: violations.length, overflow: checks.overflow, hash, diffPixels });
}

await fetch(`${cdp}/json/close/${browser.target.id}`);
const report = {
  generatedAt: new Date().toISOString(), update, base,
  environment: { product: version.product, userAgent: version.userAgent, protocolVersion: version.protocolVersion, platform: process.platform, arch: process.arch, deviceScaleFactor: 1, timezone: 'Europe/Paris', locale: 'en-GB', reducedMotion: 'reduce', maxDiffPixels },
  results, failures
};
writeFileSync(join(artifactDir, 'report.json'), JSON.stringify(report, null, 2));
if (update) writeFileSync(join(baselineDir, 'manifest.json'), JSON.stringify({ reviewedEnvironment: report.environment, scenarios: results.map(({ name, path, width, height, scheme, mobile, hash }) => ({ name, path, width, height, scheme, mobile: !!mobile, hash })) }, null, 2));
console.log(`${scenarios.length - failures.length}/${scenarios.length} visual/accessibility scenarios passed${update ? ' and baselines updated' : ''}.`);
for (const failure of failures) console.error(`FAIL ${failure}`);
if (failures.length) process.exitCode = 1;
