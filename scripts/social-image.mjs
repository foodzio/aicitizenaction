// Renders the social-media preview image (site/public/brand/social-preview.png, 1200×630) with
// headless Chrome, using the site's own tokens, Figtree and lockup. Re-run after changing the text.
// Usage: CHROME="/path/to/Google Chrome for Testing" node scripts/social-image.mjs
// Last modified: 2026-09-29T13:55:00+02:00
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = new URL('..', import.meta.url).pathname;
const CHROME = process.env.CHROME;
if (!CHROME) throw new Error('Set CHROME to a Chrome / Chrome for Testing executable.');

const font = w => pathToFileURL(join(ROOT, `node_modules/@fontsource/figtree/files/figtree-latin-${w}-normal.woff2`)).href;
const tokens = readFileSync(join(ROOT, 'site/styles/tokens.css'), 'utf8');
const logo = pathToFileURL(join(ROOT, 'site/public/brand/aicitizenaction-lockup.png')).href;

const html = `<!doctype html><meta charset="utf-8"><style>
${tokens}
@font-face { font-family: Figtree; font-weight: 500; src: url(${font(500)}); }
@font-face { font-family: Figtree; font-weight: 800; src: url(${font(800)}); }
html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
body { background: var(--surface); color: var(--ink); font-family: var(--font-sans); box-sizing: border-box;
  padding: 72px 88px; display: flex; flex-direction: column; justify-content: space-between;
  border-bottom: 16px solid var(--teal); }
h1 { font-size: 84px; line-height: 1.05; font-weight: 800; letter-spacing: -0.02em; margin: 0; max-width: 15ch; }
h1 span { color: var(--coral-ink); }
p { font-size: 34px; line-height: 1.3; font-weight: 500; color: var(--ink-muted); margin: 28px 0 0; max-width: 30ch; }
img { height: 44px; align-self: flex-start; }
</style><body data-theme="light"><div>
<h1>What do <span>you</span> want to happen with AI?</h1>
<p>Reach out to the people who can actually do something about your concern.</p>
</div><img src="${logo}" alt=""></body>`;

mkdirSync(join(ROOT, 'tmp'), { recursive: true });
const src = join(ROOT, 'tmp/social-preview.html');
writeFileSync(src, html);
const out = join(ROOT, 'site/public/brand/social-preview.png');
execFileSync(CHROME, ['--headless', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
  '--allow-file-access-from-files', '--virtual-time-budget=2000', '--window-size=1200,630', `--screenshot=${out}`, pathToFileURL(src).href], { stdio: 'inherit' });
console.log(`Wrote ${out}`);
