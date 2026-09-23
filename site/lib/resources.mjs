// Build-time data for the Resources collection: published media, explainers, windows.
import { loadContent, vocabLabel } from '../../scripts/lib/content.mjs';
import { data, recordStrings, recordUrl } from './data.mjs';

let cache;
export function resources() {
  if (cache) return cache;
  const sources = loadContent('resources/sources');
  const sourceById = new Map(sources.map(s => [s.id, s]));
  const media = loadContent('resources/media')
    .filter(m => m.meta.status === 'published')
    .sort((a, b) => (b.meta.featured === true) - (a.meta.featured === true) || b.facts.published_at.localeCompare(a.facts.published_at));
  const explainers = loadContent('resources/explainers');
  const windows = loadContent('resources/windows').sort((a, b) => a.facts.closes_on.localeCompare(b.facts.closes_on));
  cache = { sources, sourceById, media, explainers, windows };
  return cache;
}

export const today = () => new Date().toISOString().slice(0, 10);
export const isOpen = (w, now = today()) => w.facts.opens_on <= now && w.facts.closes_on >= now;

/** Link into the path with the outcome (and place) already chosen. */
export function handoff(lang, action) {
  if (!action?.outcome) return `/${lang}/`;
  const p = new URLSearchParams();
  if (action.where) {
    const [c, sub] = action.where.split('/');
    p.set('where', c);
    if (sub && sub !== 'federal') p.set('sub', sub);
    p.set('step', '2');
  } else if (action.outcome === 'fix') p.set('step', '2');
  const q = p.toString();
  return `/${lang}/start/${action.outcome}/${q ? `?${q}` : ''}`;
}

/** Directory records a resource names, as { name, url } for linking. */
export function related(lang, facts) {
  const { byId } = data();
  return ['bodies', 'channels', 'orgs'].flatMap(k => (facts[k] ?? []).map(id => byId.get(id)).filter(Boolean))
    .map(r => ({ name: recordStrings(r, lang).name.text, url: recordUrl(lang, r) }));
}

export function topicLabel(id) {
  return vocabLabel(data().vocab, 'topics', id);
}
export function perspectiveLabel(id) {
  return vocabLabel(data().vocab, 'perspectives', id);
}
