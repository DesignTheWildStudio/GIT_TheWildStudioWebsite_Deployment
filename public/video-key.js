// Makes the line-art animations truly transparent.
// The videos have a solid background baked in (white for light mode, near-black for dark mode).
// mix-blend-mode on a <video> used to hide it, but Safari/iOS ignore blending on video, which left a
// box behind every animation. Instead, each frame of a <video data-ws-key> is drawn into the <canvas>
// right after it with the background colour removed, and the video itself is hidden.
// If anything goes wrong the video simply stays visible, exactly as before.
// Optional data-ws-key-media="<media query>": only key while the query matches (checked again on resize/rotation);
// otherwise the video is shown as it is.
(function () {
  if (window.__wsVideoKey) return;
  window.__wsVideoKey = true;

  var GATE = 0.06; // pixels this close to the background colour (0–1) become fully transparent
  var tracked = [];
  var work = document.createElement('canvas');
  var wctx = work.getContext('2d', { willReadFrequently: true });
  var looping = false;

  function median(a) { a.sort(function (x, y) { return x - y; }); return a[a.length >> 1]; }

  // Background colour = per-channel median of the pixels along the frame's edge.
  function edgeColour(d, w, h) {
    var r = [], g = [], b = [], step = Math.max(1, Math.floor((w + h) / 60)), x, y;
    function take(px, py) { var i = (py * w + px) * 4; r.push(d[i]); g.push(d[i + 1]); b.push(d[i + 2]); }
    var x0 = Math.min(2, w - 1), y0 = Math.min(2, h - 1), x1 = Math.max(0, w - 3), y1 = Math.max(0, h - 3);
    for (x = x0; x <= x1; x += step) { take(x, y0); take(x, y1); }
    for (y = y0; y <= y1; y += step) { take(x0, y); take(x1, y); }
    return [median(r), median(g), median(b)];
  }

  // Turn "artwork over a solid background" into artwork with real transparency. A light background is
  // unmixed towards black ink, a dark one towards white ink, so colours and anti-aliasing survive.
  function key(img, bg) {
    var d = img.data, n = d.length;
    var dark = (bg[0] + bg[1] + bg[2]) / 3 < 128;
    var br = bg[0], bgg = bg[1], bb = bg[2];
    var ir = (dark ? 1 : -1) / ((dark ? 255 - br : br) || 1);
    var ig = (dark ? 1 : -1) / ((dark ? 255 - bgg : bgg) || 1);
    var ib = (dark ? 1 : -1) / ((dark ? 255 - bb : bb) || 1);
    var span = 255 / (1 - GATE);
    for (var i = 0; i < n; i += 4) {
      var r = d[i], g = d[i + 1], b = d[i + 2];
      var a = (r - br) * ir, t = (g - bgg) * ig;
      if (t > a) a = t;
      t = (b - bb) * ib;
      if (t > a) a = t;
      if (a <= GATE) { d[i + 3] = 0; continue; }
      if (a > 1) a = 1;
      var k = 1 - a;
      d[i] = (r - k * br) / a;
      d[i + 1] = (g - k * bgg) / a;
      d[i + 2] = (b - k * bb) / a;
      d[i + 3] = (a - GATE) * span;
    }
  }

  function giveUp(t) {
    t.failed = true;
    t.v.style.opacity = '';
    if (t.c) t.c.style.visibility = 'hidden';
  }

  function draw(t) {
    var v = t.v;
    if (t.failed || !v.isConnected) return;
    var c = v.nextElementSibling;
    if (!c || c.tagName !== 'CANVAS') return;
    if (c !== t.c) { t.c = c; t.ctx = c.getContext('2d'); if (!t.ctx) return giveUp(t); }
    var mq = v.getAttribute('data-ws-key-media');
    if (mq && window.matchMedia && !window.matchMedia(mq).matches) {
      if (t.shown) { t.shown = false; t.drawn = ''; v.style.opacity = ''; c.style.visibility = 'hidden'; }
      return;
    }
    var src = v.currentSrc || v.src;
    // A new source is loading (e.g. the other theme's animation): don't leave the old one's last frame showing.
    if (t.drawn && t.drawn !== src) { t.ctx.clearRect(0, 0, c.width, c.height); t.drawn = ''; }
    // Skip videos that are hidden (e.g. the other theme's version) or have no frame yet.
    if (!v.offsetParent || v.readyState < 2 || !v.videoWidth || !v.videoHeight) return;
    var bw = v.offsetWidth, bh = v.offsetHeight;
    if (!bw || !bh) return;
    var s = c.style;
    s.left = v.offsetLeft + 'px'; s.top = v.offsetTop + 'px'; s.width = bw + 'px'; s.height = bh + 'px';
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw = Math.round(bw * dpr), ch = Math.round(bh * dpr);
    if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }
    // Same framing as the video element (object-fit: contain).
    var sc = Math.min(cw / v.videoWidth, ch / v.videoHeight);
    var dw = Math.max(1, Math.round(v.videoWidth * sc)), dh = Math.max(1, Math.round(v.videoHeight * sc));
    if (work.width !== dw || work.height !== dh) { work.width = dw; work.height = dh; }
    wctx.drawImage(v, 0, 0, dw, dh);
    var img = wctx.getImageData(0, 0, dw, dh);
    if (!t.bg || t.bgSrc !== src) { t.bg = edgeColour(img.data, dw, dh); t.bgSrc = src; }
    key(img, t.bg);
    t.ctx.clearRect(0, 0, cw, ch);
    t.ctx.putImageData(img, Math.round((cw - dw) / 2), Math.round((ch - dh) / 2));
    t.drawn = src;
    if (!t.shown) { t.shown = true; s.visibility = 'visible'; v.style.opacity = '0'; }
  }

  function safeDraw(t) { try { draw(t); } catch (e) { giveUp(t); } }

  function tick() {
    var busy = false;
    for (var i = 0; i < tracked.length; i++) {
      var t = tracked[i];
      if (t.failed || t.v.paused || t.v.ended) continue;
      busy = true;
      if (t.v.currentTime !== t.last) { t.last = t.v.currentTime; safeDraw(t); }
    }
    if (busy && !document.hidden) requestAnimationFrame(tick); else looping = false;
  }
  function kick() { if (!looping) { looping = true; requestAnimationFrame(tick); } }
  function redrawAll() { for (var i = 0; i < tracked.length; i++) safeDraw(tracked[i]); kick(); }

  function register(v) {
    var t = { v: v, c: null, ctx: null, last: -1 };
    v.__wsKey = t;
    tracked.push(t);
    ['loadeddata', 'seeked', 'pause', 'ended', 'emptied'].forEach(function (e) { v.addEventListener(e, function () { safeDraw(t); }); });
    v.addEventListener('play', kick);
    v.addEventListener('playing', kick);
    safeDraw(t);
    kick();
  }

  function scan() {
    tracked = tracked.filter(function (t) { return t.v.isConnected; });
    var vids = document.querySelectorAll('video[data-ws-key]');
    for (var i = 0; i < vids.length; i++) if (!vids[i].__wsKey) register(vids[i]);
  }

  var scanTimer = 0;
  function scheduleScan() { if (!scanTimer) scanTimer = setTimeout(function () { scanTimer = 0; scan(); }, 150); }
  if (!wctx) return;
  new MutationObserver(scheduleScan).observe(document.documentElement, { childList: true, subtree: true });
  // Theme switches show the other set of animations and resize/re-lay out the heroes.
  new MutationObserver(function () { setTimeout(redrawAll, 50); }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  var resizeTimer = 0;
  window.addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(redrawAll, 120); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });
  scheduleScan();
})();
