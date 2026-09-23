// Anonymous completion counting — no cookies, no storage on the device, no identifiers.
//
// The brief measures success as the share of arrivals who leave with a draft. That needs totals,
// not people, so each event sends only its name and the outcome (e.g. "draft_copied / law") to
// /api/count (server.mjs), which adds one to a daily total. Never sent: the place chosen, the
// recipient, anything typed, or anything that could identify a visitor.
//
// Events stay available in-page too: window.aicaEvents, and an `aica:measure` DOM event.
const OUTCOMES = new Set(['law', 'harm', 'fix', 'record', 'join', 'insider']);
const started = typeof performance !== 'undefined' ? performance.now() : 0;
const sentOnce = new Set();

function send(e, o) {
  const body = JSON.stringify({ e, o: OUTCOMES.has(o) ? o : 'none' });
  try {
    if (navigator.sendBeacon) navigator.sendBeacon('/api/count', new Blob([body], { type: 'application/json' }));
    else fetch('/api/count', { method: 'POST', body, headers: { 'content-type': 'application/json' }, keepalive: true, credentials: 'omit' });
  } catch { /* counting must never break the page */ }
}

function timeBucket() {
  const min = (performance.now() - started) / 60000;
  return min < 5 ? 'time_under_5' : min < 10 ? 'time_5_10' : min < 15 ? 'time_10_15' : min < 20 ? 'time_15_20' : 'time_over_20';
}

export function measure(name, props = {}) {
  const detail = { name, ...props, at: new Date().toISOString() };
  (window.aicaEvents ||= []).push(detail);
  window.dispatchEvent(new CustomEvent('aica:measure', { detail }));

  const o = props.outcome;
  if (name === 'door') send('door', 'none');
  else if (name === 'path_step' && props.step >= 2) send(`step_${props.step}`, o);
  else if (name === 'draft_copied' || name === 'draft_downloaded') {
    send(name, o);
    if (!sentOnce.has('draft')) {                       // once per page: own words + time to draft
      sentOnce.add('draft');
      if (props.own_words) send('own_words', o);
      send(timeBucket(), o);
    }
  }
}
