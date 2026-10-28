// Scroll-scrubbed staggered reveal for the curtain footer (GSAP-style, dependency-free).
// Desktop: the footer is fixed behind the rising curtain and its rows fade in top-down with the curtain.
// Phones: the footer scrolls in normally, so each row fades and slides in as it comes on screen.
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
    var rows;
    if (getComputedStyle(footer).position === 'fixed') {
      var p = (vh - r.top) / Math.min(r.height, vh);
      p = Math.max(0, Math.min(1, p));
      rows = targets.map(function (el, i) { return [el, ease(Math.max(0, Math.min(1, p * 1.6 - i * 0.22)))]; });
    } else {
      // Rows that have scrolled off the top stay revealed; only the viewport bottom hides them again.
      var visTop = r.top, visBottom = Math.min(r.bottom, vh);
      var fTop = footer.getBoundingClientRect().top;
      // Read every row's layout position first (offsetTop ignores the transform set below), then write.
      rows = targets.map(function (el) {
        var top = fTop + el.offsetTop, h = Math.max(1, el.offsetHeight);
        var shown = Math.min(top + h, visBottom) - Math.max(top, visTop);
        return [el, ease(Math.max(0, Math.min(1, shown / (Math.min(h, 160) * 0.8))))];
      });
    }
    rows.forEach(function (row) {
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
  // Capture: in browsers without overflow-x:clip, phones still scroll inside <body>, and its scroll
  // events never reach window.
  window.addEventListener('scroll', onScroll, { passive: true, capture: true });
  window.addEventListener('resize', onScroll, { passive: true });
  var tries = 0;
  var t = setInterval(function () { update(); if (++tries > 20) clearInterval(t); }, 300);
})();
