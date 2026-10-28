// Phones: after a reload or Back, put the visitor back where they were once the page has rendered.
// The browser's own restore runs against the half-built page and can land far off (often on the
// footer). Desktop keeps the browser's restore; back/forward-cache restores never run this.
(function () {
  // The page runtime mounts head scripts a second time; once is enough.
  if (window.__wsScrollRestore) return; window.__wsScrollRestore = true;
  if (!window.matchMedia || !window.matchMedia('(max-width: 900px)').matches) return;
  try { history.scrollRestoration = 'manual'; } catch (e) { return; }
  var key = 'ws-scroll:' + location.pathname + location.search;
  window.addEventListener('pagehide', function () {
    try { sessionStorage.setItem(key, String(Math.round(window.scrollY))); } catch (e) {}
  });
  var nav = ((performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || {}).type;
  var saved = null;
  try { saved = sessionStorage.getItem(key); } catch (e) {}
  if (location.hash || saved == null || (nav !== 'reload' && nav !== 'back_forward')) return;
  var y = +saved || 0, n = 0, hits = 0, done = false;
  // The visitor's own scrolling always wins.
  window.addEventListener('touchstart', function () { done = true; }, { once: true, passive: true });
  window.addEventListener('wheel', function () { done = true; }, { once: true, passive: true });
  var t = setInterval(function () {
    if (done || ++n > 40) return clearInterval(t);
    if (!document.querySelector('.ws-footer-curtain') || document.documentElement.scrollHeight < y + window.innerHeight) return;
    window.scrollTo({ top: y, behavior: 'instant' });
    // Hold the position for about a second while the page finishes rendering.
    if (++hits > 6) clearInterval(t);
  }, 150);
})();
