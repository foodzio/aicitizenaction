// Maps the free-text jurisdictions recorded during research to a path geography:
// { country: ISO 3166-1 alpha-2 (lower case) | 'eu' | 'global', sub?: string }.
// Order matters: sub-national and bloc patterns are tried before country names.

const US_STATES = {
  california: 'ca', colorado: 'co', illinois: 'il', 'new york': 'ny', texas: 'tx',
  massachusetts: 'ma', washington: 'wa', connecticut: 'ct', virginia: 'va', utah: 'ut',
  maryland: 'md', 'new jersey': 'nj', minnesota: 'mn'
};

const COUNTRIES = [
  [/\bunited states\b|\busa\b|\bus\b|\bu\.s\.|\bus-/i, 'us'],
  [/\bunited kingdom\b|\buk\b|\bbritain\b/i, 'gb'],
  [/\bpeople's republic of china\b|\bchina\b/i, 'cn'],
  [/\brepublic of korea\b|\bsouth korea\b/i, 'kr'],
  [/\bjapan\b/i, 'jp'], [/\bindia\b/i, 'in'], [/\bbrazil\b/i, 'br'], [/\bcanada\b/i, 'ca'],
  [/\baustralia\b/i, 'au'], [/\bnew zealand\b/i, 'nz'], [/\bireland\b/i, 'ie'], [/\bfrance\b/i, 'fr'],
  [/\bgermany\b/i, 'de'], [/\bitaly\b/i, 'it'], [/\bspain\b/i, 'es'], [/\bnetherlands\b/i, 'nl'],
  [/\bswitzerland\b/i, 'ch'], [/\bsingapore\b/i, 'sg'], [/\bunited arab emirates\b/i, 'ae'],
  [/\bsaudi arabia\b/i, 'sa'], [/\bisrael\b/i, 'il'], [/\bkenya\b/i, 'ke'], [/\bnigeria\b/i, 'ng'],
  [/\brwanda\b/i, 'rw'], [/\bsouth africa\b/i, 'za'], [/\bargentina\b/i, 'ar'], [/\bchile\b/i, 'cl'],
  [/\bmexico\b/i, 'mx'], [/\bindonesia\b/i, 'id'], [/\btaiwan\b/i, 'tw']
];

const GLOBAL = /^(global|international|multilateral|oecd|g7|council of europe|african union|asia-pacific|~\d+ members|hosted by india; global|n\/a|any other country)/i;
const EU = /^(eu\b|european union|individual eu member states|eu\/eea|eu \()/i;

/** Every country the text names, in order of first appearance. */
export function countriesIn(text) {
  const hits = [];
  for (const [re, code] of COUNTRIES) {
    const m = String(text).match(re);
    if (m) hits.push([m.index, code]);
  }
  for (const state of Object.keys(US_STATES)) {
    const m = String(text).match(new RegExp(`\\b${state}\\b`, 'i'));
    if (m) hits.push([m.index, 'us']);
  }
  return [...new Set(hits.sort((a, b) => a[0] - b[0]).map(h => h[1]))];
}

/**
 * @param {string} text  jurisdiction as recorded
 * @param {object} ctx   { level?: 'federal'|'state'|..., federalBody?: boolean, multiMeansGlobal?: boolean }
 * @returns {{country: string, sub?: string} | null}  null when nothing matched
 */
export function mapGeo(text, ctx = {}) {
  const t = String(text || '').trim();
  if (!t) return null;
  if (GLOBAL.test(t)) return { country: 'global' };
  if (/^us-based, globally used/i.test(t)) return { country: 'global' };
  if (EU.test(t) || /^france \/ eu/i.test(t)) return /^france/i.test(t) ? { country: 'fr' } : { country: 'eu' };
  if (/^us and eu/i.test(t)) return { country: 'us' };
  if (/^multistate$/i.test(t)) return { country: 'us', sub: 'multistate' };
  if (/^federal preemption context$/i.test(t)) return { country: 'us', sub: 'federal' };

  const lead = t.split(/[(,;—]/)[0].trim().toLowerCase().replace(/ state$/, '');
  if (US_STATES[lead]) return { country: 'us', sub: US_STATES[lead] };

  const found = countriesIn(t);
  if (!found.length) return null;
  if (ctx.multiMeansGlobal && found.length > 1) return { country: 'global' };
  const country = found[0];
  if (country === 'us' && (ctx.federalBody || /\(federal/i.test(t) || ctx.level === 'federal')) return { country: 'us', sub: 'federal' };
  return { country };
}
