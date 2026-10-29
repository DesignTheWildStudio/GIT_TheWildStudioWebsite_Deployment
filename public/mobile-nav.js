// Mobile hamburger nav for The Wildstudio. Injects a toggle + full-screen drawer into the
// fixed header on every page. Visible only ≤900px via responsive.css; desktop is untouched.
// The page runtime renders the header from the raw <x-dc> template and re-renders it later, so the
// controls go only into the rendered header (a copy made from the template would have no listeners)
// and are put back whenever a re-render drops them.
(function () {
  if (window.__wsMobileNavInit) return; window.__wsMobileNavInit = true;
  var LINKS = [
    ['Work', 'work.html'],
    ['Services', 'services.html'],
    ['Branding', 'services.html#branding', true],
    ['UI/UX', 'services.html#uiux', true],
    ['Social Media', 'services.html#social-media', true],
    ['Development', 'services.html#development', true],
    ['About us', 'about.html'],
    ['Get in touch', 'contact.html']
  ];
  var open = false, btn = null, drawer = null, right = null;
  function set(v) {
    open = v;
    if (btn) {
      btn.classList.toggle('is-open', v);
      btn.setAttribute('aria-expanded', String(v));
      btn.setAttribute('aria-label', v ? 'Close menu' : 'Open menu');
    }
    if (drawer) {
      drawer.classList.toggle('is-open', v);
      drawer.setAttribute('aria-hidden', String(!v));
    }
    document.documentElement.classList.toggle('ws-nav-open', v);
  }
  window.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) set(false); });
  window.addEventListener('resize', function () { if (open && window.innerWidth > 900) set(false); });
  // A page restored from the back/forward cache comes back with the menu closed.
  window.addEventListener('pagehide', function () { if (open) set(false); });
  function findHeader() {
    var sel = 'header[data-screen-label="Header"]';
    if (document.getElementById('dc-root')) return document.querySelector('#dc-root ' + sel);
    // Not booted yet: leave the raw template alone.
    return document.querySelector('x-dc') ? null : document.querySelector(sel);
  }
  function markLogo(header) {
    var logo = Array.prototype.filter.call(header.querySelectorAll('a[href="#top"], a[href$="Wildstudio.dc.html"], a:first-child'),
      function (a) { return !a.closest('.ws-drawer, .ws-mobile-right'); })[0];
    if (logo && !logo.classList.contains('ws-mobile-logo')) logo.classList.add('ws-mobile-logo');
  }
  function build() {
    // A drawer that vanished while open must not keep the page locked.
    if (open && btn && !btn.isConnected) set(false);
    var header = findHeader();
    if (!header) return;
    var cur = header.querySelector('.ws-burger');
    if (cur && cur.__wsNav && drawer && drawer.parentNode === header) {
      // Keep them after the header's own content, even if a re-render re-created it in front of them.
      if (header.lastElementChild !== drawer || drawer.previousElementSibling !== right) { header.appendChild(right); header.appendChild(drawer); }
      markLogo(header);
      return;
    }
    // First build, or a re-render replaced the header: start clean.
    if (open) set(false);
    Array.prototype.forEach.call(header.querySelectorAll('.ws-mobile-right, .ws-drawer'), function (n) {
      if (n.__wsNav && n.parentNode === header) header.removeChild(n); // only our own leftovers, never the page's nodes
    });
    btn = document.createElement('button');
    btn.className = 'ws-burger'; btn.type = 'button'; btn.__wsNav = true;
    btn.setAttribute('aria-label', 'Open menu'); btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span></span><span></span><span></span>';
    drawer = document.createElement('nav');
    drawer.className = 'ws-drawer'; drawer.__wsNav = true; drawer.setAttribute('aria-hidden', 'true');
    var list = document.createElement('div'); list.className = 'ws-drawer-list';
    LINKS.forEach(function (l) {
      var a = document.createElement('a');
      a.href = l[1]; a.textContent = l[0];
      if (l[2]) a.className = 'ws-drawer-sub';
      if (l[0] === 'Get in touch') a.className = 'ws-drawer-cta';
      list.appendChild(a);
    });
    drawer.appendChild(list);
    btn.addEventListener('click', function () { set(!open); });
    drawer.addEventListener('click', function (e) { if (e.target.tagName === 'A') set(false); });
    right = document.createElement('div'); right.className = 'ws-mobile-right'; right.__wsNav = true;
    var themeBtn = header.querySelector('.ws-theme-btn');
    if (themeBtn) {
      // Mirror the real toggle so theme.js's binding keeps working. Click whichever toggle the header
      // has now: theme.js listens on document, and a replaced (detached) one would do nothing.
      var mirror = document.createElement('button');
      mirror.className = 'ws-theme-mirror'; mirror.type = 'button';
      mirror.setAttribute('aria-label', 'Toggle light and dark mode');
      mirror.innerHTML = themeBtn.innerHTML;
      mirror.addEventListener('click', function () {
        var h = findHeader(), tb = h && h.querySelector('.ws-theme-btn');
        if (tb) tb.click();
      });
      right.appendChild(mirror);
    }
    right.appendChild(btn);
    header.appendChild(right);
    header.appendChild(drawer);
    markLogo(header);
  }
  // Runs after each batch of DOM changes, before the next paint, so a re-rendered header never shows without them.
  new MutationObserver(build).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', build);
  build();
})();
