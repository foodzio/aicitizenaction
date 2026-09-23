// Completion measurement hook — deliberately sends nothing.
//
// The brief's success measure is draft completion (copy or download), and it forbids tracking
// that needs a consent wall. Which counting method to use is an open owner decision
// (docs/implementation-plan.md, open decision 6). Until it is made, the path announces events
// on `window` and keeps them in memory for the current page only. A chosen tool attaches with:
//
//   window.addEventListener('aica:measure', e => send(e.detail))
//
// Events: path_step {step}, recipient_chosen {recipient}, draft_copied / draft_downloaded
// {outcome, place, recipient, own_words: boolean}, path_done {outcome}.
export function measure(name, props = {}) {
  const detail = { name, ...props, at: new Date().toISOString() };
  (window.aicaEvents ||= []).push(detail);
  window.dispatchEvent(new CustomEvent('aica:measure', { detail }));
}
