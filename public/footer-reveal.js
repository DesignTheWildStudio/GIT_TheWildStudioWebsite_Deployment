// Scroll-scrubbed reveal for the curtain footer (GSAP-style, dependency-free).
// Each footer row fades and slides in as it is uncovered — by the rising curtain on desktop, where the
// footer is fixed behind it, or by the viewport edge on phones, where the footer scrolls normally.
(function () {
  // The page runtime mounts head scripts a second time; one set of listeners is enough.
  if (window.__wsFooterReveal) return; window.__wsFooterReveal = true;
  var ease = function (x) { return 1 - Math.pow(1 - x, 3); };
  function update() {
    var wrap = document.querySelector('.ws-footer-curtain');
    if (!wrap) return;
    var footer = wrap.querySelector('footer');
    if (!footer) return;
    var targets = Array.prototype.filter.call(footer.children, function (el) {
      var cs = getComputedStyle(el);
      return cs.position !== 'fixed';
    });
    var r = wrap.getBoundingClientRect();
    var vh = window.innerHeight;
    // Rows that have scrolled off the top stay revealed; only the curtain or the viewport bottom hides them.
    var visTop = r.top, visBottom = Math.min(r.bottom, vh);
    var fTop = footer.getBoundingClientRect().top;
    // Read every row's layout position first (offsetTop ignores the transform set below), then write.
    targets.map(function (el) {
      var top = fTop + el.offsetTop, h = Math.max(1, el.offsetHeight);
      var shown = Math.min(top + h, visBottom) - Math.max(top, visTop);
      return [el, ease(Math.max(0, Math.min(1, shown / (Math.min(h, 160) * 0.8))))];
    }).forEach(function (row) {
      var el = row[0], e = row[1];
      var tr = 'translateY(' + Math.round(50 * (1 - e)) + 'px)', op = String(Math.round(e * 1000) / 1000);
      if (el.style.transform !== tr) el.style.transform = tr;
      if (el.style.opacity !== op) el.style.opacity = op;
      if (!el.style.willChange) el.style.willChange = 'transform, opacity';
    });
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; update(); });
  }
  // Capture: on phones <body> is the scroll container, and its scroll events never reach window.
  window.addEventListener('scroll', onScroll, { passive: true, capture: true });
  window.addEventListener('resize', onScroll, { passive: true });
  var tries = 0;
  var t = setInterval(function () { update(); if (++tries > 20) clearInterval(t); }, 300);
})();
