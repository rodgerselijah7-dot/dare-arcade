// DARE Arcade loading screen for the 3D games.
// Covers the page from the first paint until the game calls DAREBOOT.ready()
// (after its first rendered frame), so players never see a half-built menu
// whose buttons don't work yet while the 3D engine downloads.
// Usage, in <head> after the page's <style>:
//   <script src="/dare-boot.js" data-title="Chess" data-bg="#0e0a0c" data-fg="#f0e7d4" data-accent="#d1aa58" data-font="var(--display)"></script>
(function () {
  var s = document.currentScript, d = (s && s.dataset) || {};
  var title = d.title || document.title.split(/\s+[—-]\s+/)[0];
  var bg = d.bg || '#0d0b0a', fg = d.fg || '#f3ebde', ac = d.accent || '#e9a54a';
  var font = d.font || 'system-ui,-apple-system,"Segoe UI",sans-serif';
  var css =
    '#dareBoot{position:fixed;inset:0;z-index:2147482000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:24px;' +
    'background:' + bg + ';color:' + fg + ';text-align:center;transition:opacity .4s;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}' +
    '#dareBoot.out{opacity:0;pointer-events:none}' +
    '#dareBoot h1{margin:0;font-family:' + font + ';font-size:clamp(40px,12vw,76px);line-height:1;font-weight:700}' +
    '#dareBoot .db-bar{width:min(220px,60vw);height:4px;border-radius:2px;background:rgba(255,255,255,.14);overflow:hidden}' +
    '#dareBoot .db-bar i{display:block;width:40%;height:100%;border-radius:2px;background:' + ac + ';animation:dareBootBar 1.1s ease-in-out infinite}' +
    '@keyframes dareBootBar{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}' +
    '#dareBoot p{margin:0;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;opacity:.7}' +
    '#dareBoot button{display:none;padding:12px 22px;border-radius:12px;border:0;background:' + ac + ';color:' + bg + ';font:700 15px/1 system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer}' +
    '#dareBoot.fail .db-bar{display:none}#dareBoot.fail button{display:inline-block}' +
    '@media (prefers-reduced-motion:reduce){#dareBoot .db-bar i{animation-duration:2.4s}}';
  var st = document.createElement('style'); st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  var el = document.createElement('div');
  el.id = 'dareBoot'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
  var h = document.createElement('h1'); h.textContent = title;
  var bar = document.createElement('div'); bar.className = 'db-bar'; bar.appendChild(document.createElement('i'));
  var msg = document.createElement('p'); msg.textContent = 'Loading';
  var btn = document.createElement('button'); btn.type = 'button'; btn.textContent = 'Try again';
  btn.onclick = function () { location.reload(); };
  el.appendChild(h); el.appendChild(bar); el.appendChild(msg); el.appendChild(btn);
  document.documentElement.appendChild(el);

  var done = false, failed = false;
  function hide() {
    if (done) return; done = true;
    el.classList.add('out');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 450);
  }
  function fail(m) {
    if (done || failed) return; failed = true;
    el.classList.add('fail');
    msg.textContent = m || "Couldn't load the game. Check your connection.";
  }
  // a script that fails to download (e.g. the 3D engine on a bad connection)
  window.addEventListener('error', function (e) {
    if (done) return;
    var t = e.target;
    if (t && t.tagName === 'SCRIPT') { if (/three|cannon|cdnjs|jsdelivr|unpkg/.test(t.src || '')) fail(); }
    else if (!t || t === window) fail('Something went wrong loading the game.');
  }, true);
  // never leave someone stuck behind the loader
  setTimeout(function () { if (!done && !failed) hide(); }, 30000);

  window.DAREBOOT = {
    // call once the game has started its render loop; waits for that frame to draw
    ready: function () {
      if (done || failed) return;
      requestAnimationFrame(function () { requestAnimationFrame(hide); });
    },
    fail: fail
  };
})();
