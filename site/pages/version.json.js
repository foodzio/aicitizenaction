// Public version endpoint (CLAUDE.md: version.json is served at /version.json).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../../scripts/lib/content.mjs';

export const GET = () => new Response(readFileSync(join(ROOT, 'version.json'), 'utf8'), { headers: { 'content-type': 'application/json' } });
