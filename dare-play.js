/* DARE Arcade · play together
   Shared by the arcade lobby, DARE Buckets, DARE Chess, DARE Connect, DARE Dice, DARE Pool and Truth or Dare:
   - DAREPlay.chat(opts)    in-match chat. Messages ride inside each player's match presence, so they work
                            over /api/room and inside Claude alike. outbox() goes into presence, receive() reads.
   - DAREPlay.feed(opts)    "X wants to play" alerts for open matches, polled from /api/lfg while the page is open.
   - DAREPlay.post/keep/cancel  open a match to everyone ("Find an opponent").
   - DAREPlay.alerts        phone notifications for new open matches (Web Push via /sw.js). */
(function () {
  if (window.DAREPlay) return;
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const ss = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };
  const GAMES = { buckets: "DARE Buckets", chess: "DARE Chess", connect: "DARE Connect", dice: "DARE Dice", pool: "DARE Pool", "crate-digger": "Crate Digger", "game-day": "Game Day", "crown-rush": "Crown Rush", "truth-or-dare": "Truth or Dare" };
  const ONLINE = /^https?:$/.test(location.protocol) && !window.claude;
  const peer = (() => { let p = ls.get("dare-peer"); if (!/^[a-z0-9]{12}$/.test(p || "")) { p = Array.from(crypto.getRandomValues(new Uint8Array(12)), b => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join(""); ls.set("dare-peer", p); } return p; })();
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- styles ---------- */
  const css = `
.dp,.dp *{box-sizing:border-box}
.dp{--dp-acc:#F0C040;--dp-bg:rgba(14,12,10,.96);--dp-ink:#F4EEE4;--dp-dim:#A39A8E;--dp-line:rgba(255,255,255,.12);
  font:15px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--dp-ink);-webkit-tap-highlight-color:transparent}
.dp button{font:inherit;color:inherit;cursor:pointer}
.dp-fab{position:fixed;z-index:9000;height:46px;padding:0 16px 0 13px;border-radius:23px;border:1.5px solid var(--dp-acc);background:var(--dp-bg);
  display:flex;align-items:center;gap:7px;font-weight:700;font-size:15px;letter-spacing:.02em;box-shadow:0 6px 20px rgba(0,0,0,.45);transition:transform .12s;touch-action:manipulation}
.dp-fab:active{transform:scale(.94)}
.dp-fab svg{width:20px;height:20px;color:var(--dp-acc)}
.dp-fab.ping{animation:dpPing .5s ease-out 2}
.dp-fab[hidden]{display:none}
.dp-badge{position:absolute;top:-4px;right:-4px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:#E5352B;color:#fff;font-size:12px;font-weight:700;display:grid;place-items:center}
.dp-badge[hidden]{display:none}
.dp-peek{position:fixed;z-index:9001;max-width:min(270px,calc(100vw - 90px));background:var(--dp-bg);border:1px solid var(--dp-line);border-radius:14px 14px 4px 14px;
  padding:8px 12px;box-shadow:0 6px 20px rgba(0,0,0,.4);pointer-events:none;animation:dpIn .2s ease-out}
.dp-peek b{color:var(--dp-acc);font-weight:600;display:block;font-size:12px;letter-spacing:.04em}
.dp-sheet{position:fixed;z-index:9002;left:0;right:0;bottom:0;margin:0 auto;max-width:460px;height:min(70vh,520px);max-height:var(--dp-vh,100vh);background:var(--dp-bg);
  border:1px solid var(--dp-line);border-bottom:0;border-radius:18px 18px 0 0;display:flex;flex-direction:column;box-shadow:0 -10px 40px rgba(0,0,0,.5);
  padding-bottom:env(safe-area-inset-bottom,0px);animation:dpUp .22s cubic-bezier(.2,.8,.2,1)}
.dp-sheet[hidden]{display:none}
.dp-hd{display:flex;align-items:center;gap:10px;padding:12px 10px 10px 16px;border-bottom:1px solid var(--dp-line)}
.dp-hd h3{margin:0;font-size:16px;font-weight:650;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dp-hd small{display:block;font-weight:400;color:var(--dp-dim);font-size:12px}
.dp-ib{background:none;border:0;width:40px;height:40px;border-radius:10px;display:grid;place-items:center;color:var(--dp-dim)}
.dp-ib:hover{color:var(--dp-ink)}
.dp-ib svg{width:20px;height:20px}
.dp-ib.on{color:#E5352B}
.dp-log{flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:6px;overscroll-behavior:contain}
.dp-m{max-width:78%;padding:7px 12px;border-radius:16px;word-wrap:break-word;white-space:pre-wrap}
.dp-m.me{align-self:flex-end;background:var(--dp-acc);color:#111;border-bottom-right-radius:4px}
.dp-m.them{align-self:flex-start;background:rgba(255,255,255,.1);border-bottom-left-radius:4px}
.dp-from{display:block;font-size:12px;font-weight:700;color:var(--dp-acc);margin-bottom:1px}
.dp-sys{align-self:center;color:var(--dp-dim);font-size:12px;padding:2px 0}
.dp-empty{margin:auto;color:var(--dp-dim);text-align:center;font-size:14px;max-width:220px}
.dp-quick{display:flex;gap:6px;overflow-x:auto;padding:8px 12px 2px;scrollbar-width:none}
.dp-quick::-webkit-scrollbar{display:none}
.dp-quick button{flex:none;background:rgba(255,255,255,.08);border:1px solid var(--dp-line);border-radius:999px;padding:6px 12px;font-size:14px}
.dp-form{display:flex;gap:8px;padding:8px 12px 12px}
.dp-form input{flex:1;min-width:0;background:rgba(255,255,255,.07);border:1px solid var(--dp-line);border-radius:999px;padding:10px 14px;color:var(--dp-ink);font:inherit;font-size:16px;outline:none}
.dp-form input:focus{border-color:var(--dp-acc)}
.dp-send{width:44px;height:44px;flex:none;border-radius:50%;border:0;background:var(--dp-acc);color:#111;display:grid;place-items:center}
.dp-send svg{width:20px;height:20px}
.dp-send:disabled{opacity:.4}
.dp-msg{pointer-events:auto;width:100%;max-width:420px;display:flex;gap:10px;align-items:flex-start;text-align:left;background:var(--dp-bg);border:1px solid var(--dp-line);border-left:3px solid var(--dp-acc);
  border-radius:12px;padding:10px 14px;box-shadow:0 10px 30px rgba(0,0,0,.45);animation:dpDrop .25s cubic-bezier(.2,.8,.2,1)}
.dp-msg svg{width:18px;height:18px;flex:none;margin-top:2px;color:var(--dp-acc)}
.dp-msg b{display:block;font-size:13px;color:var(--dp-acc)}
.dp-msg span{display:block;font-size:16px;word-wrap:break-word}
.dp-open[hidden]{display:none}
.dp-toasts{position:fixed;z-index:9003;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 10px);display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none;padding:0 12px}
.dp-toast{pointer-events:auto;width:100%;max-width:420px;display:flex;align-items:center;gap:12px;background:var(--dp-bg);border:1px solid var(--dp-line);border-left:3px solid var(--dp-acc);
  border-radius:12px;padding:10px 10px 10px 14px;box-shadow:0 10px 30px rgba(0,0,0,.45);animation:dpDrop .25s cubic-bezier(.2,.8,.2,1)}
.dp-toast .tx{flex:1;min-width:0}
.dp-toast .tx b{display:block;font-size:15px}
.dp-toast .tx span{color:var(--dp-dim);font-size:13px}
.dp-join{background:var(--dp-acc);color:#111;border:0;border-radius:8px;padding:9px 14px;font-weight:700}
.dp-x{background:none;border:0;color:var(--dp-dim);width:30px;height:30px;font-size:18px}
.dp-open{display:flex;flex-direction:column;gap:6px}
.dp-orow{display:flex;align-items:center;gap:10px;padding:9px 10px 9px 12px;border:1px solid var(--dp-line);border-radius:10px;background:rgba(255,255,255,.04)}
.dp-orow .tx{flex:1;min-width:0}
.dp-orow .tx b{display:block}
.dp-orow .tx span{color:var(--dp-dim);font-size:13px}
.dp-dot{width:8px;height:8px;border-radius:50%;background:#3DDC84;box-shadow:0 0 0 3px rgba(61,220,132,.2);flex:none}
.dp-alerts{display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid var(--dp-line);border-radius:10px;background:rgba(255,255,255,.04);text-align:left}
.dp-alerts .tx{flex:1;min-width:0}
.dp-alerts .tx b{display:block;font-weight:600}
.dp-alerts .tx span{color:var(--dp-dim);font-size:13px}
.dp-sw{flex:none;width:46px;height:28px;border-radius:14px;background:rgba(255,255,255,.18);border:0;position:relative;transition:background .15s}
.dp-sw::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:transform .15s}
.dp-sw[aria-checked=true]{background:#3DDC84}
.dp-sw[aria-checked=true]::after{transform:translateX(18px)}
.dp-sw:disabled{opacity:.4}
@keyframes dpPing{50%{transform:scale(1.12)}}
@keyframes dpIn{from{opacity:0;transform:translateY(6px)}}
@keyframes dpUp{from{transform:translateY(100%)}}
@keyframes dpDrop{from{opacity:0;transform:translateY(-14px)}}
@media (prefers-reduced-motion:reduce){.dp-peek,.dp-sheet,.dp-toast{animation:none}}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  let root = null;
  const rootEl = () => { if (!root) { root = document.createElement("div"); root.className = "dp"; document.body.appendChild(root); } return root; };
  const setAccent = c => { if (c) rootEl().style.setProperty("--dp-acc", c); };
  let toastWrap = null;
  const toastHost = () => { if (!toastWrap) { toastWrap = document.createElement("div"); toastWrap.className = "dp-toasts"; rootEl().appendChild(toastWrap); } return toastWrap; };

  const I = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
    mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.7 21a2 2 0 0 1-3.4 0M18.6 13A17 17 0 0 1 18 8M6.3 6.3A6 6 0 0 0 6 8c0 7-3 9-3 9h14M18 8a6 6 0 0 0-9.3-5M2 2l20 20"/></svg>'
  };

  /* ---------- chat ---------- */
  function chat(opts) {
    opts = opts || {};
    const r = rootEl(); setAccent(opts.accent);
    const pos = Object.assign({ right: "14px", bottom: "calc(env(safe-area-inset-bottom,0px) + 90px)" }, opts.pos || {});
    const quick = opts.quick || ["Good luck", "Nice!", "GG", "Rematch?", "One more", "🔥", "😂"];
    const fab = document.createElement("button");
    fab.className = "dp-fab"; fab.type = "button"; fab.hidden = true; fab.setAttribute("aria-label", "Open chat");
    fab.innerHTML = I.chat + '<span>Chat</span><span class="dp-badge" hidden>0</span>';
    Object.assign(fab.style, pos);
    const sheet = document.createElement("div");
    sheet.className = "dp-sheet"; sheet.hidden = true; sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-label", "Match chat");
    sheet.innerHTML = `<div class="dp-hd"><h3><span class="dp-who">Match chat</span><small class="dp-sub">Only your opponent sees this</small></h3>
      <button class="dp-ib dp-mute" type="button" aria-label="Mute chat" aria-pressed="false">${I.bell}</button>
      <button class="dp-ib dp-close" type="button" aria-label="Close chat">${I.close}</button></div>
      <div class="dp-log" aria-live="polite"><p class="dp-empty">Say something to your opponent.</p></div>
      <div class="dp-quick">${quick.map(q => `<button type="button">${esc(q)}</button>`).join("")}</div>
      <form class="dp-form" autocomplete="off"><input maxlength="140" placeholder="Message" enterkeyhint="send" aria-label="Message"><button class="dp-send" type="submit" aria-label="Send">${I.send}</button></form>`;
    r.appendChild(fab); r.appendChild(sheet);
    const $ = s => sheet.querySelector(s), log = $(".dp-log"), input = $("input"), badge = fab.querySelector(".dp-badge"), muteBtn = $(".dp-mute");
    let out = [], seq = 0, seen = {}, unread = 0, attached = false, opp = "Opponent", muted = false, lastSend = 0, peekEl = null, peekT = 0, fabOk = true;
    const stopKeys = e => e.stopPropagation(); // keep typing out of the game's key controls
    ["keydown", "keyup", "keypress"].forEach(t => sheet.addEventListener(t, stopKeys));
    ["pointerdown", "touchstart", "mousedown", "click"].forEach(t => sheet.addEventListener(t, e => e.stopPropagation()));

    function add(kind, text, who) {
      const e = log.querySelector(".dp-empty"); if (e) e.remove();
      const el = document.createElement("div");
      el.className = kind === "sys" ? "dp-sys" : "dp-m " + kind;
      if (who) { const b = document.createElement("b"); b.className = "dp-from"; b.textContent = who; el.appendChild(b); el.appendChild(document.createTextNode(text)); }
      else el.textContent = text;
      log.appendChild(el);
      while (log.children.length > 120) log.firstChild.remove();
      log.scrollTop = log.scrollHeight;
    }
    function setBadge() { badge.hidden = !unread; badge.textContent = unread > 9 ? "9+" : unread; }
    function peek(text, who) {
      if (!attached) return;
      const wrap = toastHost();
      if (peekEl) peekEl.remove();
      const el = peekEl = document.createElement("button"); el.type = "button"; el.className = "dp-msg";
      el.innerHTML = I.chat + `<div><b>${esc(who || opp)}</b><span></span></div>`;
      el.querySelector("span").textContent = text;
      el.onclick = e => { e.stopPropagation(); el.remove(); open(); };
      wrap.appendChild(el);
      fab.classList.remove("ping"); void fab.offsetWidth; fab.classList.add("ping");
      clearTimeout(peekT); peekT = setTimeout(() => { el.remove(); if (peekEl === el) peekEl = null; }, 6000);
    }
    const vv = window.visualViewport;
    function fit() { // iOS keeps fixed elements behind the keyboard; lift the sheet to the visible area
      if (!vv || sheet.hidden) return;
      const hidden = Math.max(0, innerHeight - vv.height - vv.offsetTop);
      sheet.style.bottom = hidden + "px"; sheet.style.setProperty("--dp-vh", Math.max(240, vv.height - 8) + "px");
    }
    if (vv) { vv.addEventListener("resize", fit); vv.addEventListener("scroll", fit); }
    input.addEventListener("focus", () => setTimeout(fit, 250));
    input.addEventListener("blur", () => setTimeout(() => { sheet.style.bottom = "0px"; fit(); }, 100));
    function open() { sheet.hidden = false; fab.hidden = true; unread = 0; setBadge(); if (peekEl) { peekEl.remove(); peekEl = null; } log.scrollTop = log.scrollHeight; if (opts.onOpen) opts.onOpen(true); setTimeout(() => { if (!matchMedia("(pointer:coarse)").matches) input.focus(); }, 60); }
    function close() { sheet.hidden = true; input.blur(); fab.hidden = !(attached && fabOk); if (opts.onOpen) opts.onOpen(false); }
    function send(text) {
      text = String(text || "").replace(/\s+/g, " ").trim().slice(0, 140);
      if (!text || !attached) return false;
      const now = Date.now(); if (now - lastSend < 700) return false; lastSend = now;
      out.push([++seq, text]); if (out.length > 6) out = out.slice(-6);
      add("me", text);
      if (opts.onSend) opts.onSend();
      return true;
    }
    fab.onclick = e => { e.stopPropagation(); open(); };
    $(".dp-close").onclick = close;
    muteBtn.onclick = () => { muted = !muted; muteBtn.innerHTML = muted ? I.mute : I.bell; muteBtn.classList.toggle("on", muted); muteBtn.setAttribute("aria-pressed", muted); muteBtn.setAttribute("aria-label", muted ? "Unmute chat" : "Mute chat"); add("sys", muted ? "Chat muted. You won't see new messages." : "Chat unmuted."); };
    $(".dp-quick").onclick = e => { const b = e.target.closest("button"); if (b) send(b.textContent); };
    $(".dp-form").onsubmit = e => { e.preventDefault(); if (send(input.value)) input.value = ""; };
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !sheet.hidden) close(); });

    return {
      attach(name) { attached = true; if (name) this.setOpp(name); fab.hidden = !fabOk || !sheet.hidden; },
      detach() { attached = false; fab.hidden = true; sheet.hidden = true; if (peekEl) { peekEl.remove(); peekEl = null; } },
      reset() { out = []; seen = {}; unread = 0; setBadge(); log.innerHTML = '<p class="dp-empty">Say something to your opponent.</p>'; },
      setOpp(name) { opp = name || "Opponent"; $(".dp-who").textContent = "Chat with " + opp; },
      showButton(on) { fabOk = !!on; fab.hidden = !(attached && fabOk && sheet.hidden); if (!on && !sheet.hidden) close(); },
      outbox() { return out.length ? out.slice() : null; },
      receive(from, list, who) { // who: the sender's name, for group games (shown on each message)
        if (!Array.isArray(list)) return;
        let last = seen[from] || 0, fresh = [];
        for (const m of list) if (Array.isArray(m) && typeof m[0] === "number" && m[0] > last && typeof m[1] === "string") fresh.push(m);
        if (!fresh.length) return;
        fresh.sort((a, b) => a[0] - b[0]);
        seen[from] = fresh[fresh.length - 1][0];
        if (muted) return;
        for (const m of fresh) {
          const t = m[1].replace(/\s+/g, " ").trim().slice(0, 140); if (!t) continue;
          add("them", t, who);
          if (sheet.hidden) { unread++; setBadge(); peek(t, who); }
        }
        if (opts.onMessage) opts.onMessage();
      },
      note(text) { add("sys", text); },
      isOpen() { return !sheet.hidden; },
      open() { if (attached) open(); },
      close
    };
  }

  /* ---------- open matches ---------- */
  const mine = new Set(); // codes this page posted
  let feedState = { list: [], key: null, subs: [] };
  async function api(body) {
    const r = await fetch("/api/lfg", body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), keepalive: true } : { cache: "no-store" });
    let d = {}; try { d = await r.json(); } catch (e) {}
    if (!r.ok) throw new Error(d.error || "Couldn't reach the match server.");
    return d;
  }
  async function refresh() {
    if (!ONLINE) return feedState.list;
    try {
      const d = await api();
      feedState.list = (d.open || []).filter(m => GAMES[m.game]);
      if (d.key) feedState.key = d.key;
      feedState.subs.forEach(f => { try { f(feedState.list); } catch (e) {} });
    } catch (e) {}
    return feedState.list;
  }
  let pollT = 0, polling = false;
  function startPolling() {
    if (polling || !ONLINE) return; polling = true;
    const tick = async () => { if (document.visibilityState === "visible") await refresh(); pollT = setTimeout(tick, 15000); };
    tick();
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") { clearTimeout(pollT); tick(); } });
  }
  function onOpen(fn) { feedState.subs.push(fn); fn(feedState.list); startPolling(); }

  function toast(m, onJoin) {
    const toastWrap = toastHost();
    while (toastWrap.children.length >= 2) toastWrap.firstChild.remove();
    const el = document.createElement("div"); el.className = "dp-toast"; el.setAttribute("role", "status");
    el.innerHTML = `<div class="tx"><b>${esc(m.nick)} wants to play</b><span>${GAMES[m.game]} · match ${esc(m.code)}</span></div><button class="dp-join" type="button">Join</button><button class="dp-x" type="button" aria-label="Dismiss">✕</button>`;
    el.querySelector(".dp-join").onclick = () => { el.remove(); join(m, onJoin); };
    el.querySelector(".dp-x").onclick = () => el.remove();
    toastWrap.appendChild(el);
    setTimeout(() => el.remove(), 14000);
  }
  function join(m, onJoin) {
    if (onJoin && onJoin(m) !== false) return;
    location.href = `/${m.game}/?join=${encodeURIComponent(m.code)}`;
  }
  let busy = false;
  function feed(opts) {
    opts = opts || {}; setAccent(opts.accent);
    const seenKey = "dare-lfg-seen", seen = new Set((ss.get(seenKey) || "").split(",").filter(Boolean));
    const born = Date.now();
    onOpen(list => {
      for (const m of list) {
        const id = m.game + ":" + m.code + ":" + m.t;
        if (seen.has(id) || mine.has(m.game + ":" + m.code)) continue;
        seen.add(id); ss.set(seenKey, [...seen].slice(-40).join(","));
        if (busy || (opts.games && !opts.games.includes(m.game))) continue;
        if (Date.now() - m.t > 120000 && m.t < born) continue; // only fresh ones on arrival
        toast(m, opts.onJoin);
      }
    });
  }
  // A list of open matches for one game, rendered into el (used on the games' online screens)
  function openList(el, game, onJoin) {
    onOpen(list => {
      const rows = list.filter(m => m.game === game && !mine.has(m.game + ":" + m.code));
      el.hidden = !rows.length;
      el.innerHTML = rows.slice(0, 5).map(m => `<div class="dp-orow"><span class="dp-dot"></span><div class="tx"><b>${esc(m.nick)}</b><span>${GAMES[m.game]} · match ${esc(m.code)}</span></div><button class="dp-join" type="button" data-code="${esc(m.code)}">Join</button></div>`).join("");
      el.querySelectorAll("[data-code]").forEach(b => b.onclick = () => join(rows.find(m => m.code === b.dataset.code), onJoin));
    });
    el.classList.add("dp", "dp-open");
  }
  async function post(game, code, nick) {
    mine.add(game + ":" + code);
    const ep = await alerts.endpoint().catch(() => null);
    return api({ op: "post", game, code, nick, peer, ep });
  }
  const keep = (game, code) => api({ op: "keep", game, code, peer }).catch(() => {});
  const cancel = (game, code) => { mine.delete(game + ":" + code); return api({ op: "cancel", game, code, peer }).catch(() => {}); };

  /* ---------- match alerts (push) ---------- */
  const b64ToBytes = s => { const p = "=".repeat((4 - s.length % 4) % 4), raw = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(raw, c => c.charCodeAt(0)); };
  const alerts = {
    supported() { return ONLINE && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window; },
    isIOS() { return /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); },
    standalone() { return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; },
    games() { return (ls.get("dare-alert-games") || "").split(",").filter(g => GAMES[g]); },
    async reg() { return navigator.serviceWorker.register("/sw.js", { scope: "/" }); },
    async endpoint() {
      if (!this.supported()) return null;
      const r = await navigator.serviceWorker.getRegistration("/"); if (!r) return null;
      const s = await r.pushManager.getSubscription(); return s ? s.endpoint : null;
    },
    async enable(games) {
      if (!this.supported()) throw new Error(this.isIOS() && !this.standalone() ? "On iPhone, add the arcade to your Home Screen first, then turn alerts on from there." : "This browser can't show match alerts.");
      const perm = await Notification.requestPermission();
      if (perm !== "granted") throw new Error("Notifications are blocked. Allow them for this site in your settings, then try again.");
      if (!feedState.key) await refresh();
      if (!feedState.key) throw new Error("Match alerts aren't available right now.");
      const reg = await this.reg(); await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(feedState.key) });
      const all = [...new Set([...this.games(), ...games])];
      await api({ op: "sub", sub: sub.toJSON(), games: all });
      ls.set("dare-alert-games", all.join(","));
      return all;
    },
    async disable(games) {
      const left = this.games().filter(g => !games.includes(g));
      const reg = this.supported() ? await navigator.serviceWorker.getRegistration("/") : null;
      const sub = reg && await reg.pushManager.getSubscription();
      if (sub) {
        if (left.length) await api({ op: "sub", sub: sub.toJSON(), games: left });
        else { await api({ op: "unsub", endpoint: sub.endpoint }).catch(() => {}); await sub.unsubscribe().catch(() => {}); }
      }
      ls.set("dare-alert-games", left.join(","));
      return left;
    },
    // A toggle row: "Match alerts — get a notification when someone wants to play"
    toggle(el, games, opts) {
      opts = opts || {};
      el.classList.add("dp", "dp-alerts"); setAccent(opts.accent);
      el.innerHTML = `<div class="tx"><b>Match alerts</b><span class="dp-at"></span></div><button class="dp-sw" type="button" role="switch" aria-checked="false" aria-label="Match alerts"></button>`;
      const sw = el.querySelector(".dp-sw"), tx = el.querySelector(".dp-at");
      const label = opts.label || "Get a notification when someone wants to play.";
      const paint = msg => {
        const on = games.every(g => this.games().includes(g)) && typeof Notification !== "undefined" && Notification.permission === "granted";
        sw.setAttribute("aria-checked", on);
        tx.textContent = msg || (on ? "On. We'll let you know when someone wants to play." : label);
        if (!this.supported()) { sw.disabled = !this.isIOS(); if (!msg) tx.textContent = this.isIOS() && !this.standalone() ? "On iPhone, add the arcade to your Home Screen first, then turn alerts on there." : !ONLINE ? "Available on the DARE Arcade site." : "This browser can't show match alerts."; }
      };
      sw.onclick = async () => {
        if (!this.supported()) { if (opts.onNeedsInstall) opts.onNeedsInstall(); else paint(); return; }
        sw.disabled = true;
        try { if (sw.getAttribute("aria-checked") === "true") { await this.disable(games); paint("Off."); } else { await this.enable(games); paint("On. We'll let you know when someone wants to play."); } }
        catch (e) { paint(e.message); }
        sw.disabled = false;
      };
      paint();
      if (this.supported() && this.games().length) this.reg().catch(() => {}); // keep the worker current
    }
  };

  window.DAREPlay = {
    online: ONLINE, peer, GAMES,
    nick() { return ls.get("dare-nick") || ""; }, setNick(n) { if (n) ls.set("dare-nick", n); },
    chat, feed, openList, post, keep, cancel, alerts, refresh,
    set busy(v) { busy = !!v; }, get busy() { return busy; },
    joinCode() { const m = /[?&]join=([A-Za-z0-9]{4})\b/.exec(location.search); return m ? m[1].toUpperCase() : ""; },
    clearJoin() { try { const u = new URL(location.href); u.searchParams.delete("join"); history.replaceState(null, "", u.pathname + u.search + u.hash); } catch (e) {} }
  };
})();
