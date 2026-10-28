// Phones: after a reload or Back, put the visitor back where they were once the page has rendered.
// The browser's own restore runs against the half-built page and can land far off (often on the
// footer). Wider than 900px the browser keeps its own restore; back/forward-cache restores never run this.
(function () {
  // The page runtime mounts head scripts a second time; once is enough.
  if (window.__wsScrollRestore) return; window.__wsScrollRestore = true;
  if (!window.matchMedia || !('scrollRestoration' in history)) return;
  var mq = window.matchMedia('(max-width: 900px)');
  // 'manual' sticks to the history entry across reloads, so follow the width the page is left at
  // (a phone or tablet rotated, a window resized).
  var mode = function () { try { history.scrollRestoration = mq.matches ? 'manual' : 'auto'; } catch (e) {} };
  if (mq.addEventListener) mq.addEventListener('change', mode); else if (mq.addListener) mq.addListener(mode);
  mode();
  // One key per history entry, so Back to an earlier visit of the same page returns to that visit's spot.
  var st = history.state && typeof history.state === 'object' ? history.state : {};
  if (!st.wsScrollKey) {
    st = Object.assign({}, st, { wsScrollKey: Date.now().toString(36) + Math.random().toString(36).slice(2, 7) });
    try { history.replaceState(st, ''); } catch (e) {}
  }
  var key = 'ws-scroll:' + location.pathname + location.search + ':' + st.wsScrollKey;
  var save = function () {
    mode();
    var max = document.documentElement.scrollHeight - window.innerHeight;
    try { sessionStorage.setItem(key, String(Math.round(Math.max(0, Math.min(window.scrollY, max))))); } catch (e) {}
  };
  window.addEventListener('pagehide', save);
  // Mobile browsers may discard a background tab without a pagehide.
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') save(); });
  if (!mq.matches) return;
  var nav = ((performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || {}).type;
  var saved = null;
  try { saved = sessionStorage.getItem(key); } catch (e) {}
  if (saved == null || (nav !== 'reload' && nav !== 'back_forward')) return;
  var y = +saved || 0, n = 0, hits = 0, done = false;
  // The visitor's own scrolling always wins.
  ['touchstart', 'wheel', 'keydown', 'mousedown'].forEach(function (ev) {
    window.addEventListener(ev, function () { done = true; }, { once: true, passive: true, capture: true });
  });
  var go = function () {
    try { window.scrollTo({ top: y, behavior: 'instant' }); } catch (e) {
      var h = document.documentElement, sb = h.style.scrollBehavior;
      h.style.scrollBehavior = 'auto'; window.scrollTo(0, y); h.style.scrollBehavior = sb;
    }
  };
  var t = setInterval(function () {
    if (done || ++n > 40) return clearInterval(t);
    // Wait for the rendered page and its web fonts (they change the layout; at most 3s for the fonts).
    if (!document.querySelector('.ws-footer-curtain') || document.documentElement.scrollHeight < y + window.innerHeight
        || (document.fonts && document.fonts.status !== 'loaded' && n < 20)) return;
    if (Math.abs(window.scrollY - y) > 1) go();
    // Hold the position for about a second while the page finishes rendering.
    if (++hits > 6) clearInterval(t);
  }, 150);
})();
