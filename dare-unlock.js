/* DARE Arcade unlocks — shared by the lobby, the shop and every paid game.
   Buying (DARE.buy) goes through Stripe Checkout via /api/checkout. Each purchase gives an unlock code;
   the code is checked with /api/license and the games it covers are remembered on this device.
   DARE.owned(game)                 -> true if this device has unlocked it (works offline)
   DARE.gate(game, onUnlocked, opt) -> runs onUnlocked now if owned, otherwise shows the "free tryout complete" panel
   DARE.panel(opt)                  -> the code / restore panel without a game (used by the lobby)
   DARE.buy(items, back)            -> start checkout for ["ori"] or ["all-access"] (opens in a new tab when it can)
   DARE.code() / DARE.refresh()     -> the saved code / re-check it */
(function () {
  if (window.DARE) return;
  const API = (window.DARE_API || "").replace(/\/$/, ""); // same site
  const GAMES = {
    "the-last-don": { name: "The Last Don", price: 4.99, rest: "Districts 2 to 5, levels 13 to 60" },
    "rebel-elimination": { name: "Rebel Elimination", price: 3.99, rest: "Stages 2 and 3 and their bosses" },
    "cosmic-encounter": { name: "Cosmic Encounter", price: 2.99, rest: "Every wave after the first boss" },
    "ori": { name: "ORI", price: 2.99, rest: "Zones 2 to 6 and endless ORBIT" },
    "dead-rise": { name: "Dead Rise", price: 3.99, rest: "Every wave after the Warden, across all five areas" },
    "break-the-block": { name: "Break the Block", price: 2.99, rest: "Zones 3 to 8, levels 21 to 80" }
  };
  const PASS = { id: "all-access", name: "All-Access Pass", price: 12.99 };
  // prices live in /games.json (the same file checkout charges from); the numbers above are just a fallback
  fetch(API + "/games.json", { cache: "no-cache" }).then(r => r.json()).then(list => list.forEach(p => {
    if (p.pass) { PASS.price = p.price; PASS.name = p.name; } else { const g = GAMES[p.id] || (GAMES[p.id] = {}); g.name = p.name; g.price = p.price; g.rest = p.unlocks; g.tryout = p.tryout; }
  })).catch(() => {});
  const K_CODE = "dare_unlock_code", K_OWNED = "dare_owned";
  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const clean = c => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const fmt = c => clean(c).replace(/(.{4})(?=.)/g, "$1-");
  const money = n => "$" + n.toFixed(2);
  const listeners = [];
  const owned = g => { const l = ls.get(K_OWNED, []) || []; return l.includes(g) || l.includes(PASS.id); };
  const code = () => ls.get(K_CODE, "");

  async function check(c) {
    const r = await fetch(API + "/api/license?code=" + encodeURIComponent(clean(c)), { cache: "no-store" });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(d.error || "Couldn't check that code. Try again."); e.status = r.status; throw e; }
    return d.games || [];
  }
  function save(c, games) {
    ls.set(K_CODE, clean(c)); ls.set(K_OWNED, games);
    listeners.forEach(f => { try { f(games); } catch (e) {} });
  }
  async function redeem(c) { const games = await check(c); save(c, games); return games; }
  async function refresh() {
    const c = code(); if (!c) return ls.get(K_OWNED, []);
    try { const games = await check(c); save(c, games); return games; }
    catch (e) { if (e.status === 404) { ls.set(K_OWNED, []); ls.set(K_CODE, ""); } return ls.get(K_OWNED, []); }
  }
  // another tab (e.g. the checkout confirmation) saved a code: pick it up here too
  addEventListener("storage", e => { if (e.key === K_OWNED) listeners.forEach(f => { try { f(ls.get(K_OWNED, [])); } catch (x) {} }); });

  /* ---------- checkout ---------- */
  // Opens Stripe Checkout in a new tab so the game keeps its place; when the purchase finishes there,
  // the confirmation page saves the code and this tab unlocks by itself. Falls back to the same tab.
  async function buy(items, back) {
    let w = null;
    try { w = window.open("", "_blank"); if (w) w.document.write('<title>DARE Arcade</title><body style="margin:0;display:grid;place-items:center;height:100vh;background:#000;color:#fff;font:600 16px -apple-system,Helvetica,Arial,sans-serif">Opening secure checkout…</body>'); } catch (e) { w = null; }
    try {
      const r = await fetch(API + "/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items, back: back || location.pathname }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.url) throw new Error(d.error || "Checkout isn't available right now. Try again in a minute.");
      if (w && !w.closed) w.location.href = d.url; else location.href = d.url;
      return true;
    } catch (err) { if (w && !w.closed) w.close(); throw err; }
  }

  /* ---------- panel ---------- */
  const CSS = `
.dare-ul{all:initial;box-sizing:border-box;position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:max(16px,env(safe-area-inset-top)) 16px max(16px,env(safe-area-inset-bottom));
  background:rgba(0,0,0,.84);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);font:16px/1.45 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;color:#fff;
  overflow-y:auto;touch-action:pan-y;user-select:text;-webkit-user-select:text}
.dare-ul *{all:revert;box-sizing:border-box;margin:0}
.dare-ul .dul-card{width:100%;max-width:400px;background:#0c0c0e;border:1px solid #2a2a2e;padding:26px 22px 20px;margin:auto}
.dare-ul .dul-eb{font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#EF3B2F;display:flex;align-items:center;gap:8px}
.dare-ul .dul-eb:before{content:"";width:8px;height:8px;border-radius:50%;background:#EF3B2F}
.dare-ul h2{font-size:28px;line-height:1.05;font-weight:800;letter-spacing:-.01em;margin:10px 0 8px;text-transform:uppercase}
.dare-ul p{color:#b5b5ba;font-size:15px;margin:0 0 16px}
.dare-ul p b{color:#fff;font-weight:600}
.dare-ul a.dul-btn,.dare-ul button.dul-btn{display:flex;align-items:center;justify-content:center;width:100%;min-height:50px;padding:0 16px;border:1px solid #fff;background:#fff;color:#000;
  font-weight:700;font-size:15px;line-height:1;font-family:inherit;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;text-align:center;white-space:nowrap;border-radius:0;transform:none;box-shadow:none;cursor:pointer;margin:0 0 10px;-webkit-tap-highlight-color:transparent}
.dare-ul .dul-btn.dul-q{background:transparent;color:#fff;border-color:#4a4a50}
.dare-ul .dul-btn:active{transform:scale(.98)}
.dare-ul .dul-fine{font-size:13px;color:#8a8a90;margin:-2px 0 6px;text-align:center}
.dare-ul .dul-row{display:flex;gap:8px;margin:0 0 8px}
.dare-ul input{flex:1;min-width:0;height:48px;border:1px solid #4a4a50;background:#000;color:#fff;padding:0 12px;font-weight:600;font-size:17px;line-height:1;font-family:inherit;letter-spacing:.08em;border-radius:0;-webkit-appearance:none}
.dare-ul input[type=email]{letter-spacing:0;font-weight:400}
.dare-ul input:focus{outline:2px solid #EF3B2F;outline-offset:0}
.dare-ul .dul-row .dul-btn{width:auto;margin:0;min-width:96px}
.dare-ul .dul-links{display:flex;flex-wrap:wrap;gap:6px 18px;margin-top:6px}
.dare-ul .dul-lk{background:none;border:0;padding:6px 0;color:#d6d6da;font:inherit;font-size:14px;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.dare-ul .dul-msg{min-height:20px;font-size:14px;margin:4px 0 8px;color:#b5b5ba}
.dare-ul .dul-msg.dul-err{color:#ff6b61}.dare-ul .dul-msg.dul-ok{color:#7ee2a8}
.dare-ul .dul-sec{display:none;border-top:1px solid #2a2a2e;margin-top:14px;padding-top:14px}
.dare-ul .dul-sec.dul-on{display:block}
.dare-ul .dul-sec h3{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#fff;margin:0 0 8px}`;
  function ensureCss() { if (document.getElementById("dare-ul-css")) return; const s = document.createElement("style"); s.id = "dare-ul-css"; s.textContent = CSS; document.head.appendChild(s); }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // opt: { game, title, onUnlocked, exitLabel, onExit, startWith: "code" }
  function panel(opt = {}) {
    ensureCss();
    const g = opt.game && GAMES[opt.game];
    const el = document.createElement("div"); el.className = "dare-ul"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
    el.innerHTML = `<div class="dul-card">
      <div class="dul-eb">DARE Arcade</div>
      ${g ? `<h2>${esc(opt.title || "Free tryout complete")}</h2>
        <p>Unlock the full game to keep going. <b>${esc(g.rest)}</b>, plus everything you've already played.</p>
        <button class="dul-btn" data-buy="${esc(opt.game)}">Unlock full game · ${money(g.price)}</button>
        <button class="dul-btn dul-q" data-buy="${PASS.id}">All-Access Pass · ${money(PASS.price)}</button>
        <p class="dul-fine">The pass unlocks every paid game in the arcade, including new ones.</p>`
      : `<h2>${esc(opt.title || "Unlock your games")}</h2><p>Bought a game or the All-Access Pass? Enter the unlock code from your confirmation page or email.</p>`}
      <div class="dul-msg" aria-live="polite"></div>
      <div class="dul-links">
        <button class="dul-lk" data-show="code">Enter unlock code</button>
        <button class="dul-lk" data-show="mail">Restore by email</button>
        ${g ? `<button class="dul-lk" data-recheck>I just bought it</button>` : ""}
        ${opt.onExit ? `<button class="dul-lk" data-exit>${esc(opt.exitLabel || "Back to menu")}</button>` : `<button class="dul-lk" data-exit>Close</button>`}
      </div>
      <div class="dul-sec" data-sec="code"><h3>Unlock code</h3><form class="dul-row" data-f="code"><input name="c" autocomplete="one-time-code" autocapitalize="characters" spellcheck="false" placeholder="ABCD-EFGH-JKLM" maxlength="16" aria-label="Unlock code"><button class="dul-btn" type="submit">Unlock</button></form></div>
      <div class="dul-sec" data-sec="mail"><h3>Restore by email</h3><form class="dul-row" data-f="mail"><input name="e" type="email" autocomplete="email" placeholder="you@example.com" aria-label="Email used at checkout"><button class="dul-btn" type="submit">Send</button></form></div>
    </div>`;
    const msg = el.querySelector(".dul-msg");
    const say = (t, cls) => { msg.textContent = t; msg.className = "dul-msg" + (cls ? " dul-" + cls : ""); };
    const close = () => { el.remove(); listeners.splice(listeners.indexOf(onChange), 1); };
    const done = () => { close(); opt.onUnlocked && opt.onUnlocked(); };
    function onChange(games) { if (g && games.includes(opt.game)) { say("Unlocked. Enjoy the full game.", "ok"); setTimeout(done, 700); } }
    listeners.push(onChange);
    const show = k => el.querySelectorAll(".dul-sec").forEach(s => { const on = s.dataset.sec === k; s.classList.toggle("dul-on", on); if (on) setTimeout(() => s.querySelector("input").focus(), 30); });
    el.addEventListener("click", e => {
      const t = e.target;
      if (t.dataset.show) show(t.dataset.show);
      if (t.dataset.buy) {
        say("Opening secure checkout…");
        buy([t.dataset.buy]).then(() => say("Finish checkout in the new tab. This game unlocks as soon as you're done.", "ok")).catch(err => say(err.message, "err"));
      }
      if (t.hasAttribute("data-exit")) { close(); opt.onExit && opt.onExit(); }
      if (t.hasAttribute("data-recheck")) {
        if (!code()) { say("Enter the unlock code from your confirmation page or email.", ""); show("code"); return; }
        say("Checking…"); refresh().then(games => { if (!(g && games.includes(opt.game))) say("Not unlocked yet. Enter your unlock code to finish.", "err"); });
      }
    });
    el.querySelector('[data-f="code"]').addEventListener("submit", async e => {
      e.preventDefault(); const c = e.target.c.value;
      if (clean(c).length !== 12) { say("Codes are 12 letters and numbers, like ABCD-EFGH-JKLM.", "err"); return; }
      say("Checking…");
      try {
        const games = await redeem(c);
        if (g && !games.includes(opt.game)) say(`That code works, but it doesn't include ${g.name}. Unlock it above.`, "err");
        else if (!g) { say(`Unlocked: ${games.map(x => (GAMES[x] || {}).name || x).join(", ")}.`, "ok"); setTimeout(done, 1200); }
      } catch (err) { say(err.message, "err"); }
    });
    el.querySelector('[data-f="mail"]').addEventListener("submit", async e => {
      e.preventDefault(); say("Sending…");
      try {
        const r = await fetch(API + "/api/license", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: e.target.e.value }) });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "Couldn't send. Try again.");
        say(d.message || "Check your email for your unlock code.", "ok"); show("code");
      } catch (err) { say(err.message, "err"); }
    });
    ["keydown", "keyup", "keypress"].forEach(t => el.addEventListener(t, e => e.stopPropagation())); // keep typing out of the game's controls
    ["touchstart", "touchmove", "touchend", "pointerdown", "mousedown"].forEach(t => el.addEventListener(t, e => e.stopPropagation(), { passive: true }));
    document.body.appendChild(el);
    if (opt.startWith) show(opt.startWith);
    return { close };
  }
  function gate(game, onUnlocked, opt = {}) {
    if (owned(game)) { onUnlocked && onUnlocked(); return true; }
    panel(Object.assign({ game, onUnlocked }, opt));
    if (code()) refresh(); // a purchase made on this device may have just landed
    return false;
  }

  // ?unlock=CODE in the address (the "Play now" link after checkout): save it, check it, tidy the URL
  try {
    const u = new URL(location.href), c = u.searchParams.get("unlock");
    if (c) {
      u.searchParams.delete("unlock"); history.replaceState(history.state, "", u.pathname + (u.search || "") + u.hash);
      ls.set(K_CODE, clean(c));
      redeem(c).then(games => { if (games.length) toast(`Unlocked: ${games.map(x => (GAMES[x] || {}).name || x).join(", ")}`); }).catch(() => {});
    } else if (code()) {
      refresh(); // keep the list current (refunds, new purchases on another device)
    }
  } catch (e) {}
  function toast(t) {
    ensureCss();
    const d = document.createElement("div");
    d.style.cssText = "position:fixed;left:50%;top:max(14px,env(safe-area-inset-top));transform:translateX(-50%);z-index:2147483001;background:#fff;color:#000;padding:10px 16px;font:600 14px/1.3 -apple-system,Helvetica,Arial,sans-serif;max-width:92vw;text-align:center;box-shadow:0 6px 24px rgba(0,0,0,.35)";
    d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 3200);
  }
  window.DARE = { owned, gate, panel, buy, save, code: () => fmt(code()), refresh, redeem, onChange: f => listeners.push(f), GAMES, PASS };
})();
