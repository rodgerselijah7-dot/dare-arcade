/* DARE Arcade · Thanksgiving enter page scene
   A harvest sunset painted on one canvas at up to 2x pixel density. Static layers (sky, hills, farm, foreground,
   vignette) are rendered once per screen size into offscreen canvases; each frame composites them and draws the
   moving parts: the sun and its rays, drifting clouds, falling leaves, geese, chimney smoke and dust in the light.
   Loaded by index.html only when the enter page is showing in Thanksgiving season. Stops when the gate closes. */
(function () {
  const gate = document.getElementById("gate"), host = gate && gate.querySelector(".tg");
  if (!host) return;
  const cv = document.createElement("canvas");
  cv.className = "tg-cv"; cv.setAttribute("aria-hidden", "true");
  host.prepend(cv);
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- seeded randomness + value noise ---------- */
  let seed = 26112026;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  function noise2(P) { // value noise, periodic every P cells in both directions
    const g = new Float32Array(P * P); for (let i = 0; i < g.length; i++) g[i] = rnd();
    const w = n => ((n % P) + P) % P, sm = t => t * t * (3 - 2 * t);
    return (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), u = sm(x - xi), v = sm(y - yi);
      const x0 = w(xi), x1 = w(xi + 1), y0 = w(yi) * P, y1 = w(yi + 1) * P;
      const a = g[y0 + x0], b = g[y0 + x1], c = g[y1 + x0], d = g[y1 + x1];
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
  }
  const fbm = (n, x, y, o) => { let s = 0, a = .5, f = 1, t = 0; for (let i = 0; i < o; i++) { s += a * n(x * f, y * f); t += a; a *= .5; f *= 2; } return s / t; };
  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mk = (w, h) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
  const pick = a => a[Math.floor(rnd() * a.length)];

  /* ---------- textures made once ---------- */
  function grainTex() {
    const s = 192, c = mk(s, s), g = c.getContext("2d"), im = g.createImageData(s, s), d = im.data;
    for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    g.putImageData(im, 0, 0); return c;
  }
  // sunset clouds: soft bands, lit warm from below, tile horizontally. Made a moment after the first frame.
  function cloudTex(w, h) {
    const c = mk(w, h), g = c.getContext("2d"), im = g.createImageData(w, h), d = im.data, n = noise2(10);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = y / h, f = fbm(n, x / w * 10, v * 3.2, 6);
      const a = ss(.48, .76, f) * Math.pow(Math.sin(Math.PI * v), 1.3);
      const lit = ss(.35, 1, v) * .8 + (f - .5) * .5, i = (y * w + x) * 4;   // undersides catch the sun
      d[i] = 150 + 105 * lit; d[i + 1] = 78 + 92 * lit; d[i + 2] = 112 + 20 * lit; d[i + 3] = 235 * a;
    }
    g.putImageData(im, 0, 0); return c;
  }
  let CLOUD = null;
  setTimeout(() => { CLOUD = cloudTex(720, 200); }, reduce ? 0 : 350);

  // leaves: maple and oak shapes in harvest colors, shaded, with a midrib
  const LEAF_COLORS = [["#ffcf5a", "#e08a1c"], ["#ff9a3c", "#c2461a"], ["#e8502a", "#8f1f12"], ["#c9341f", "#6e140c"], ["#f2b544", "#a8641a"], ["#b5652a", "#5e2c12"]];
  function maplePath(s) {
    const p = new Path2D(), N = 140;
    for (let i = 0; i <= N; i++) {
      const a = i / N * Math.PI * 2 - Math.PI / 2;               // starts at the top tip
      const lobe = Math.pow(Math.abs(Math.cos(2.5 * (a + Math.PI / 2))), .55);
      const teeth = 1 + .07 * Math.sin(a * 17);
      const low = 1 - .38 * Math.max(0, Math.sin(a));             // shorter at the bottom
      const r = s * (.42 + .58 * lobe) * teeth * low;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      i ? p.lineTo(x, y) : p.moveTo(x, y);
    }
    p.closePath(); return p;
  }
  function oakPath(s) {
    const p = new Path2D(), N = 120;
    for (let i = 0; i <= N; i++) {
      const t = i / N * Math.PI * 2, wv = 1 + .22 * Math.sin(t * 7);
      const x = Math.sin(t) * s * .42 * wv * (1 - .25 * Math.cos(t)), y = -Math.cos(t) * s;
      i ? p.lineTo(x, y) : p.moveTo(x, y);
    }
    p.closePath(); return p;
  }
  function leafSprite(kind, col, S, rs, deep) {
    const R2 = rs || Math.random;
    const c = mk(S * 2.4, S * 2.4), g = c.getContext("2d"); g.translate(S * 1.2, S * 1.15);
    const path = kind === "maple" ? maplePath(S) : oakPath(S), big = S > 40;
    const gr = g.createLinearGradient(-S, -S, S, S); gr.addColorStop(0, col[0]); gr.addColorStop(1, col[1]);
    g.fillStyle = gr; g.fill(path);
    g.save(); g.clip(path);
    // mottled color: patches of lighter and deeper tones, a few dark age spots
    for (let i = 0; i < (big ? 26 : 9); i++) {
      const x = (R2() - .5) * S * 1.8, y = (R2() - .5) * S * 1.8, r = S * (.15 + R2() * .4), light = R2() < .5;
      const bl = g.createRadialGradient(x, y, 1, x, y, r); bl.addColorStop(0, light ? "rgba(255,226,140,.35)" : "rgba(110,20,6,.32)"); bl.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = bl; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < (big ? 10 : 2); i++) { g.fillStyle = `rgba(60,20,6,${.25 + R2() * .3})`; g.beginPath(); g.arc((R2() - .5) * S * 1.3, (R2() - .5) * S * 1.3, S * (.015 + R2() * .035), 0, Math.PI * 2); g.fill(); }
    const sh = g.createRadialGradient(-S * .3, -S * .45, 1, 0, 0, S * 1.2); sh.addColorStop(0, `rgba(255,244,210,${deep ? .18 : .4})`); sh.addColorStop(.6, "rgba(255,200,120,0)"); sh.addColorStop(1, `rgba(50,8,0,${deep ? .36 : .38})`);
    g.fillStyle = sh; g.fillRect(-S * 1.2, -S * 1.2, S * 2.4, S * 2.4);
    // veins: main ribs from the stem, with finer side veins
    const vein = (x0, y0, ang, len, w) => {
      const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len;
      g.strokeStyle = "rgba(80,22,6,.6)"; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + Math.cos(ang + 1.57) * len * .05, (y0 + y1) / 2 + Math.sin(ang + 1.57) * len * .05, x1, y1); g.stroke();
      g.strokeStyle = "rgba(255,220,160,.28)"; g.lineWidth = w * .45; g.beginPath(); g.moveTo(x0 + .6, y0 - .6); g.lineTo(x1 + .6, y1 - .6); g.stroke();
      const n = big ? 6 : 3;
      for (let k = 1; k <= n; k++) { const u = k / (n + 1), px = x0 + (x1 - x0) * u, py = y0 + (y1 - y0) * u;
        for (const side of [-1, 1]) { const a2 = ang + side * .75, l2 = len * .32 * (1 - u * .5);
          g.strokeStyle = "rgba(80,22,6,.38)"; g.lineWidth = w * .4; g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(a2) * l2, py + Math.sin(a2) * l2); g.stroke(); } }
    };
    g.lineCap = "round";
    const vw = Math.max(.6, S * .05), base = [0, S * .5];
    if (kind === "maple") { for (const [a2, l2] of [[-Math.PI / 2, 1.25], [-Math.PI / 2 - .85, .95], [-Math.PI / 2 + .85, .95], [-Math.PI / 2 - 1.75, .6], [-Math.PI / 2 + 1.75, .6]]) vein(base[0], base[1], a2, S * l2, vw * (l2 > 1 ? 1 : .8)); }
    else { vein(0, S * .6, -Math.PI / 2, S * 1.5, vw); }
    g.restore();
    // edge: a darker margin, and a thin bright rim where the sun shines through
    g.strokeStyle = deep ? "rgba(40,6,2,.9)" : "rgba(70,14,4,.6)"; g.lineWidth = Math.max(.6, S * (deep ? .045 : .035)); g.stroke(path);
    g.save(); g.clip(path); g.strokeStyle = "rgba(255,210,130,.35)"; g.lineWidth = Math.max(.8, S * .05); g.translate(S * .03, -S * .03); g.stroke(path); g.restore();
    g.beginPath(); g.moveTo(0, S * .5); g.quadraticCurveTo(S * .02, S * .85, S * .1, S * 1.08); g.lineWidth = Math.max(.8, S * .07); g.strokeStyle = "rgba(90,40,10,.95)"; g.stroke();
    return c;
  }
  let SPRITES = [], BIG = [];
  function makeSprites() {
    const S = Math.round(14 * D);
    SPRITES = [];
    for (const col of LEAF_COLORS) { SPRITES.push(leafSprite("maple", col, S, rnd)); SPRITES.push(leafSprite("oak", col, S * .9, rnd)); }
    if (!BIG.length || BIG.D !== D) {                                 // the close-to-the-lens leaves, drawn large so they stay crisp and solid
      BIG = []; BIG.D = D; const B = Math.round(54 * Math.min(D, 1.5));
      // close to the lens and backlit by the sunset, these read deeper and richer than the leaves far away
      const CLOSE = [["#ff8a2a", "#a8240a"], ["#f04a22", "#7a1206"], ["#ffb43a", "#b84a0e"], ["#e0581e", "#6a1a06"], ["#ff9c2e", "#8e2a08"], ["#e23a22", "#6e1006"]];
      for (const col of CLOSE) { BIG.push(leafSprite("maple", col, B, rnd, true)); BIG.push(leafSprite("oak", col, B * .9, rnd, true)); }
      BIG.k = B / 14;
    }
  }


  /* ---------- night: the scene follows the visitor's own clock ----------
     0 = the harvest sunset, 1 = a moonlit night. It fades over an hour and a half at dusk and again at dawn.
     Preview with ?tod=night|day|dusk or ?hour=21.5 */
  const TODQ = (location.search.match(/[?&]tod=(night|day|dusk|dawn)\b/) || [])[1];
  const HOURQ = parseFloat((location.search.match(/[?&]hour=([\d.]+)/) || [])[1]);
  function nightAt() {
    if (TODQ === "night") return 1; if (TODQ === "day") return 0; if (TODQ) return .5;
    const d = new Date(), h = isFinite(HOURQ) ? HOURQ % 24 : d.getHours() + d.getMinutes() / 60;
    return h < 12 ? 1 - ss(5.75, 7.25, h) : ss(17.25, 18.75, h);
  }
  let NT = nightAt();
  const markNight = () => document.documentElement.classList.toggle("tg-night", NT > .5);
  markNight();
  // a moonlit copy of a painted layer: multiply by a cool blue, keeping the layer's own shape
  // desat drains the sunset's warmth (moonlight has little color); sun = also take away the glow baked in around the sun
  function nightCopy(src, col, desat = .6, sun = false) {
    const c = mk(src.width, src.height), g = c.getContext("2d");
    g.drawImage(src, 0, 0);
    if (desat > 0) { g.globalCompositeOperation = "saturation"; g.globalAlpha = desat; g.fillStyle = "#808080"; g.fillRect(0, 0, c.width, c.height); g.globalAlpha = 1; }
    g.globalCompositeOperation = "multiply"; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
    if (sun && L && L.sun) {
      const k = c.width / W, x = L.sun.x * k, y = L.yH * k, r = Math.max(W * .62, 320) * k;
      const sg = g.createRadialGradient(x, y, 0, x, y, r); sg.addColorStop(0, "#7d84a0"); sg.addColorStop(.45, "#c4c8da"); sg.addColorStop(1, "#ffffff");
      g.fillStyle = sg; g.fillRect(0, 0, c.width, c.height);
      // and the tree's sunlit side: cool it toward the moon
      if (L.tree) { const t = L.tree, tg = g.createRadialGradient((t.x + t.rx * .6) * k, (t.y - t.ry * .3) * k, 0, (t.x + t.rx * .6) * k, (t.y - t.ry * .3) * k, t.rx * 1.5 * k);
        tg.addColorStop(0, "#9aa0c0"); tg.addColorStop(1, "#ffffff"); g.fillStyle = tg; g.fillRect(0, 0, c.width, c.height); }
    }
    g.globalCompositeOperation = "destination-in"; g.drawImage(src, 0, 0); return c;
  }
  let SPRITES_N = [], BIG_N = [], CLOUD_N = null;
  function buildNight() {
    let sd = 7101979; const r = () => ((sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296);   // its own dice, so day and night share the same leaves
    const { yH } = L, wide = W > 700;
    /* sky: deep blue, a hint of town glow on the horizon, the Milky Way and a sky full of stars */
    const sky = mk(W * D, H * D), s = sky.getContext("2d"); s.scale(D, D);
    const hf = yH / H, sg = s.createLinearGradient(0, 0, 0, H);
    sg.addColorStop(0, "#03061a"); sg.addColorStop(hf * .45, "#0a1534"); sg.addColorStop(hf * .82, "#1a2a58"); sg.addColorStop(hf, "#33406e"); sg.addColorStop(1, "#262f52");
    s.fillStyle = sg; s.fillRect(0, 0, W, H);
    // the Milky Way: a soft diagonal band dusted with faint stars
    const ax = wide ? W * .05 : -W * .1, ay = yH * .95, bx = wide ? W * .62 : W * 1.1, by = -H * .05, len = Math.hypot(bx - ax, by - ay), ang = Math.atan2(by - ay, bx - ax);
    s.save(); s.translate(ax, ay); s.rotate(ang);
    const mwN = noise2(10);
    for (let i = 0; i < 70; i++) { const u = r(), x = u * len, y = (r() - .5) * 46 * (1 + Math.sin(u * 9) * .4), rr = 30 + r() * 60;
      const a = .035 * mwN(u * 8, i % 5) * (1 - Math.abs(u - .5));
      const g = s.createRadialGradient(x, y, 1, x, y, rr); g.addColorStop(0, `rgba(190,200,255,${a})`); g.addColorStop(1, "rgba(190,200,255,0)"); s.fillStyle = g; s.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
    for (let i = 0, n = Math.round(len * 1.6); i < n; i++) { const x = r() * len, y = (r() + r() + r() - 1.5) * 40;
      s.globalAlpha = .15 + r() * .45; s.fillStyle = r() < .3 ? "#dfe6ff" : "#fff"; s.fillRect(x, y, .7, .7); }
    s.globalAlpha = 1; s.restore();
    for (let i = 0, n = Math.round(W * yH / 1300); i < n; i++) {
      const x = r() * W, y = Math.pow(r(), 1.3) * yH * .96, big = r() < .08;
      s.globalAlpha = (1 - y / yH * .7) * (.3 + r() * .6); s.fillStyle = ["#ffffff", "#dfe8ff", "#fff0d8", "#cfdcff"][Math.floor(r() * 4)];
      s.beginPath(); s.arc(x, y, big ? 1 + r() * .7 : .35 + r() * .6, 0, Math.PI * 2); s.fill();
    }
    s.globalAlpha = 1;
    const hz = s.createLinearGradient(0, yH - 90, 0, yH + 10); hz.addColorStop(0, "rgba(90,110,170,0)"); hz.addColorStop(1, "rgba(110,125,180,.35)");
    s.fillStyle = hz; s.fillRect(0, yH - 90, W, 100);
    L.nsky = sky;
    /* the full moon, with its soft cold glow */
    const MR = clamp(W * .045, 20, 40), moon = { x: wide ? W * .8 : W * .79, y: wide ? H * .16 : H * .135, R: MR };
    const md = mk(MR * 2.4 * D, MR * 2.4 * D), m = md.getContext("2d"); m.scale(D, D); m.translate(MR * 1.2, MR * 1.2);
    const mg = m.createRadialGradient(-MR * .25, -MR * .3, MR * .1, 0, 0, MR); mg.addColorStop(0, "#fffef6"); mg.addColorStop(.7, "#eeeadb"); mg.addColorStop(1, "#cfcbc0");
    m.fillStyle = mg; m.beginPath(); m.arc(0, 0, MR, 0, Math.PI * 2); m.fill();
    m.save(); m.beginPath(); m.arc(0, 0, MR, 0, Math.PI * 2); m.clip();
    for (const [x, y, rr, a] of [[-.32, -.28, .3, .22], [.1, -.38, .22, .18], [.3, .05, .34, .2], [-.12, .2, .24, .16], [-.45, .25, .16, .14], [.05, .45, .14, .12], [.42, -.3, .12, .12]]) {
      const g = m.createRadialGradient(x * MR, y * MR, 1, x * MR, y * MR, rr * MR); g.addColorStop(0, `rgba(120,122,140,${a * 1.5})`); g.addColorStop(1, "rgba(120,122,140,0)");
      m.fillStyle = g; m.fillRect(-MR, -MR, MR * 2, MR * 2); }
    for (let i = 0; i < 18; i++) { const x = (r() - .5) * MR * 1.6, y = (r() - .5) * MR * 1.6, rr = MR * (.03 + r() * .06);
      m.strokeStyle = "rgba(110,110,130,.25)"; m.lineWidth = .6; m.beginPath(); m.arc(x, y, rr, 0, Math.PI * 2); m.stroke(); }
    const limb = m.createRadialGradient(0, 0, MR * .7, 0, 0, MR); limb.addColorStop(0, "rgba(170,170,190,0)"); limb.addColorStop(1, "rgba(150,150,175,.35)");
    m.fillStyle = limb; m.fillRect(-MR, -MR, MR * 2, MR * 2); m.restore();
    const mh = mk(MR * 12 * D, MR * 12 * D), h = mh.getContext("2d"); h.scale(D, D);
    const hg = h.createRadialGradient(MR * 6, MR * 6, MR * .9, MR * 6, MR * 6, MR * 6); hg.addColorStop(0, "rgba(220,228,255,.42)"); hg.addColorStop(.25, "rgba(170,190,255,.14)"); hg.addColorStop(1, "rgba(140,160,255,0)");
    h.fillStyle = hg; h.fillRect(0, 0, MR * 12, MR * 12);
    L.moon = moon; L.mdisc = md; L.mglow = mh;
    // stars bright enough to twinkle, kept clear of the title area
    L.tw = []; for (let i = 0; i < (wide ? 34 : 18); i++) { const x = r() * W, y = r() * yH * .7; if (Math.abs(x - W / 2) < W * .3 && y > H * .2) continue; L.tw.push({ x, y, r: .8 + r() * 1, p: r() * 6.3, f: 1 + r() * 2.5 }); }
    /* the land under moonlight: the same paintings, cooled and darkened (farther = bluer) */
    L.farN = nightCopy(L.far, "#56679f", .7, true); L.farmN = nightCopy(L.farm, "#5e6b9e", .7, true); L.nearN = nightCopy(L.near, "#4a5482", .6, true);
    if (SPRITES_N.D !== D || SPRITES_N.length !== SPRITES.length) { SPRITES_N = SPRITES.map(c => nightCopy(c, "#6a78aa", .45)); SPRITES_N.D = D; }
    if (BIG_N.src !== BIG) { BIG_N = BIG.map(c => nightCopy(c, "#7c86b4", .45)); BIG_N.k = BIG.k; BIG_N.src = BIG; }
    if (CLOUD && !CLOUD_N) CLOUD_N = nightCopy(CLOUD, "#8e9cc6", 1);
  }
  let star = null, nextStar = 8;

  /* ---------- per-size layers ---------- */
  let QMAX = 2;
  let W = 0, H = 0, D = 1, L = null, leaves = [], motes = [], smoke = [], flock = null, turkeys = [], close = [];
  host.style.setProperty("--tg-grain", `url(${grainTex().toDataURL()})`);

  function build(keep) {
    W = gate.clientWidth; H = gate.clientHeight; D = Math.min(QMAX, window.devicePixelRatio || 1);
    cv.width = Math.round(W * D); cv.height = Math.round(H * D);
    seed = 26112026;
    makeSprites();
    const wide = W > 700;
    const yG = H - clamp(H * .15, 92, 150);                       // where the foreground starts
    const yH = yG - clamp(H * .13, 70, 128);                       // far horizon: room for hills and fields
    const R = clamp(W * .1, 44, 100);
    const sun = { x: wide ? W * .75 : W * .7, y: yH - R * .22, R };   // setting behind the far ridge
    L = { yG, yH, sun };

    /* sky */
    const sky = mk(W * D, H * D), s = sky.getContext("2d"); s.scale(D, D);
    const hf = yH / H, sg = s.createLinearGradient(0, 0, 0, H);
    sg.addColorStop(0, "#1b0f2c"); sg.addColorStop(hf * .3, "#371a3f"); sg.addColorStop(hf * .58, "#76304a"); sg.addColorStop(hf * .8, "#c5543c");
    sg.addColorStop(hf * .93, "#f09146"); sg.addColorStop(hf, "#ffc56c"); sg.addColorStop(1, "#ffd98e");
    s.fillStyle = sg; s.fillRect(0, 0, W, H);
    const glow = s.createRadialGradient(sun.x, sun.y, R * .5, sun.x, sun.y, Math.max(W, H) * .9);
    glow.addColorStop(0, "rgba(255,225,150,.75)"); glow.addColorStop(.12, "rgba(255,170,90,.38)"); glow.addColorStop(.35, "rgba(230,100,80,.14)"); glow.addColorStop(1, "rgba(0,0,0,0)");
    s.fillStyle = glow; s.fillRect(0, 0, W, H);
    const band = s.createLinearGradient(0, yH - 120, 0, yH + 10);
    band.addColorStop(0, "rgba(255,190,110,0)"); band.addColorStop(1, "rgba(255,200,120,.35)");
    s.fillStyle = band; s.fillRect(0, yH - 120, W, 130);
    // a few early stars up top, where the sky has already gone dark
    for (let i = 0, n = Math.round(W * yH / 9000); i < n; i++) {
      const x = rnd() * W, y = rnd() * yH * .32;
      s.globalAlpha = (1 - y / (yH * .32)) * (.25 + rnd() * .5); s.fillStyle = "#fff4e0";
      s.beginPath(); s.arc(x, y, .4 + rnd() * .8, 0, Math.PI * 2); s.fill();
    }
    s.globalAlpha = 1;
    // high, thin cirrus streaks catching the last light
    for (let i = 0, n = wide ? 9 : 6; i < n; i++) {
      const y = yH * (.18 + rnd() * .42), x0 = rnd() * W * 1.2 - W * .2, len = W * (.25 + rnd() * .45), th = 2 + rnd() * 5;
      const warm = 1 - Math.min(1, Math.abs(y - sun.y) / yH);
      const bend = (rnd() - .5) * 26, cn = noise2(8), segs = 40;
      for (let k = 0; k < 4; k++) for (let j = 0; j < segs; j++) {
        const u = j / segs, u2 = (j + 1) / segs, a = Math.sin(Math.PI * u) * ss(.35, .75, cn(u * 6 + i, k)) * (.07 + .09 * warm) * (1 - k / 4);
        if (a < .004) continue;
        const yy = u2 => y + Math.sin(u2 * Math.PI) * bend + Math.sin(u2 * 9 + i) * 2 + k * 1.2;
        s.strokeStyle = `rgba(255,${150 + 70 * warm},${130 + 30 * warm},${a})`; s.lineWidth = th * (.6 + k * .8); s.lineCap = "round";
        s.beginPath(); s.moveTo(x0 + len * u, yy(u)); s.lineTo(x0 + len * u2, yy(u2)); s.stroke();
      }
    }
    L.sky = sky;

    /* sun: halo, disc and rays (rays turn slowly, drawn with "lighter") */
    const halo = mk(R * 8 * D, R * 8 * D), hg = halo.getContext("2d"); hg.scale(D, D);
    const hr = hg.createRadialGradient(R * 4, R * 4, R * .8, R * 4, R * 4, R * 4);
    hr.addColorStop(0, "rgba(255,235,170,.9)"); hr.addColorStop(.3, "rgba(255,190,100,.35)"); hr.addColorStop(1, "rgba(255,140,60,0)");
    hg.fillStyle = hr; hg.fillRect(0, 0, R * 8, R * 8);
    L.halo = halo;
    const disc = mk(R * 2.2 * D, R * 2.2 * D), dg = disc.getContext("2d"); dg.scale(D, D);
    const dr = dg.createRadialGradient(R * 1.1 - R * .25, R * 1.1 - R * .3, R * .1, R * 1.1, R * 1.1, R);
    dr.addColorStop(0, "#fffbe8"); dr.addColorStop(.55, "#ffe39a"); dr.addColorStop(.86, "#ffb553"); dr.addColorStop(1, "#ff9640");
    dg.fillStyle = dr; dg.beginPath(); dg.ellipse(R * 1.1, R * 1.1 + R * .02, R, R * .975, 0, 0, Math.PI * 2); dg.fill();
    dg.save(); dg.beginPath(); dg.ellipse(R * 1.1, R * 1.1 + R * .02, R, R * .975, 0, 0, Math.PI * 2); dg.clip();
    for (let k = 0; k < 6; k++) { const yy = R * 1.1 + R * (.15 + k * .14); dg.fillStyle = `rgba(255,120,60,${.05 + k * .03})`; dg.fillRect(0, yy, R * 2.2, R * (.02 + k * .008)); }
    const limb = dg.createRadialGradient(R * 1.1, R * 1.1, R * .6, R * 1.1, R * 1.1, R); limb.addColorStop(0, "rgba(255,120,40,0)"); limb.addColorStop(1, "rgba(230,90,30,.35)");
    dg.fillStyle = limb; dg.fillRect(0, 0, R * 2.2, R * 2.2); dg.restore();
    L.disc = disc;
    const RS = Math.hypot(Math.max(sun.x, W - sun.x), sun.y) * 1.02, RK = .32, rays = mk(RS * 2 * RK, RS * 2 * RK), rg = rays.getContext("2d"); rg.scale(RK, RK);
    rg.translate(RS, RS);
    if ("filter" in rg) rg.filter = "blur(5px)";
    for (let i = 0; i < 22; i++) {
      const a = i / 22 * Math.PI * 2 + rnd() * .22, wdt = .03 + rnd() * .07, A = .09 + rnd() * .09;
      for (const [kw, ka] of [[1, .25], [.7, .3], [.45, .3], [.22, .35]]) {   // feathered edges
        const g2 = rg.createRadialGradient(0, 0, R, 0, 0, RS); g2.addColorStop(0, `rgba(255,222,150,${A * ka})`); g2.addColorStop(.6, `rgba(255,200,130,${A * ka * .35})`); g2.addColorStop(1, "rgba(255,200,120,0)");
        rg.fillStyle = g2; rg.beginPath(); rg.moveTo(0, 0); rg.arc(0, 0, RS, a - wdt * kw, a + wdt * kw); rg.closePath(); rg.fill();
      }
    }
    rg.filter = "none";
    L.rays = rays; L.RS = RS;

    /* far hills: two rolling ridges with tiny autumn treelines, hazy toward the sun */
    const far = mk(W * D, H * D), f = far.getContext("2d"); f.scale(D, D);
    const tn = noise2(32);
    const ridge = (base, amp, freq, ph, trees, top, bot) => {
      f.beginPath(); f.moveTo(0, H);
      const pts = [];
      for (let x = 0; x <= W + 3; x += 3) {
        const y0 = base - Math.sin(x / W * Math.PI * freq + ph) * amp - (fbm(tn, x / 90 + ph, ph * 3, 3) - .5) * amp * .8;
        const tr = trees ? Math.pow(fbm(tn, x / 11 + ph * 7, 5.1 + ph, 3), 2.4) * trees : 0;
        pts.push([x, y0, tr]); f.lineTo(x, y0 - tr);
      }
      f.lineTo(W, H); f.closePath();
      const gr = f.createLinearGradient(0, base - amp * 2 - trees, 0, yG + 20); gr.addColorStop(0, top); gr.addColorStop(1, bot);
      f.fillStyle = gr; f.fill();
      return pts;
    };
    ridge(yH - 18, 16, 1.1, 3.3, 0, "#c97a78", "#a85e68");             // farthest range, almost lost in the haze
    f.globalCompositeOperation = "source-atop"; f.fillStyle = "rgba(255,185,140,.32)"; f.fillRect(0, 0, W, H); f.globalCompositeOperation = "source-over";
    ridge(yH - 4, 22, 1.6, .7, 16, "#b35e66", "#86425a");
    // warm haze on the farthest ridge, strongest near the sun (painted only onto the ridge itself)
    f.globalCompositeOperation = "source-atop";
    const fh = f.createRadialGradient(sun.x, yH, 10, sun.x, yH, W * .7);
    fh.addColorStop(0, "rgba(255,190,120,.6)"); fh.addColorStop(1, "rgba(255,150,100,0)");
    f.fillStyle = fh; f.fillRect(0, 0, W, H);
    f.globalCompositeOperation = "source-over";
    const ridge2 = ridge(yH + 14, 16, 2.4, 2.1, 20, "#74324a", "#4e2139");
    // patchwork fields on the near ridge, with hedgerows between them
    f.globalCompositeOperation = "source-atop";
    const PATCH = ["rgba(196,120,60,.28)", "rgba(150,90,50,.28)", "rgba(120,110,60,.25)", "rgba(210,150,80,.24)", "rgba(110,50,50,.25)"];
    for (let x = -20; x < W + 40;) {
      const cw = 30 + rnd() * 60, y0 = ridge2[clamp(Math.round(x / 3), 0, ridge2.length - 1)][1];
      for (let yy = y0 + 3 + rnd() * 3; yy < yG + 10;) {
        const ch = 5 + rnd() * 8 + (yy - y0) * .12;
        f.fillStyle = PATCH[Math.floor(rnd() * PATCH.length)];
        f.beginPath(); f.moveTo(x, yy); f.lineTo(x + cw, yy - 2); f.lineTo(x + cw + 3, yy + ch - 2); f.lineTo(x - 2, yy + ch); f.closePath(); f.fill();
        f.strokeStyle = "rgba(60,20,30,.35)"; f.lineWidth = 1; f.beginPath(); f.moveTo(x - 2, yy + ch); f.lineTo(x + cw + 3, yy + ch - 2); f.stroke();
        yy += ch;
      }
      f.strokeStyle = "rgba(60,20,30,.3)"; f.beginPath(); f.moveTo(x, y0); f.lineTo(x - 4, yG + 10); f.stroke();
      x += cw;
    }
    f.globalCompositeOperation = "source-over";
    // dots of autumn color in the near ridge's treeline
    for (const [x, y0, tr] of ridge2) if (tr > 6 && rnd() < .5) {
      f.fillStyle = pick(["rgba(214,98,52,.55)", "rgba(236,150,60,.5)", "rgba(170,60,50,.55)"]);
      f.beginPath(); f.arc(x + rnd() * 2, y0 - tr * (.3 + rnd() * .5), 1.4 + rnd() * 2.2, 0, Math.PI * 2); f.fill();
    }
    L.far = far;

    /* farm: fields with crop rows, fence, barn, silo and farmhouse */
    const farm = mk(W * D, H * D), m = farm.getContext("2d"); m.scale(D, D);
    const fy = yH + 26, fd = yG - fy;                               // field top and its depth on screen
    const fg = m.createLinearGradient(0, fy, 0, yG + 30); fg.addColorStop(0, "#9a5a2c"); fg.addColorStop(.5, "#6e3a1e"); fg.addColorStop(1, "#4a2614");
    m.fillStyle = fg; m.beginPath(); m.moveTo(0, fy + 6);
    for (let x = 0; x <= W; x += 6) m.lineTo(x, fy + Math.sin(x / W * Math.PI * 1.2 + .4) * 5);
    m.lineTo(W, H); m.lineTo(0, H); m.closePath(); m.fill();
    // rows of harvested crop, fanning toward the viewer
    m.save(); m.clip();
    const vx = W * .5, vy = fy - 40;
    for (let i = -26; i <= 26; i++) {
      const x1 = vx + i * W * .06;
      m.strokeStyle = i % 2 ? "rgba(255,190,110,.10)" : "rgba(40,15,5,.22)"; m.lineWidth = 2.2;
      m.beginPath(); m.moveTo(vx + i * 6, fy); m.lineTo(x1, yG + 40); m.stroke();
    }
    const sunSide = m.createRadialGradient(sun.x, fy, 10, sun.x, fy, W * .6); sunSide.addColorStop(0, "rgba(255,190,110,.35)"); sunSide.addColorStop(1, "rgba(255,160,90,0)");
    m.fillStyle = sunSide; m.fillRect(0, fy - 10, W, yG - fy + 50);
    m.restore();

    const sc = clamp(W / 900, .6, 1.15);                           // building scale
    const bx = wide ? W * .58 : W * .64, by = fy + fd * .3;          // barn sits back in the field
    const lit = Math.sign(sun.x - (bx + 33 * sc)) || 1;              // which side of things the sun catches
    // a dirt lane winding up to the barn doors
    { const x0 = wide ? W * .52 : W * .6, x1 = bx + 33 * sc, y1 = by;
      const lane = (w0, w1) => { m.beginPath(); m.moveTo(x0 - w0, yG + 30); m.bezierCurveTo(x0 - w0, yG - fd * .2, x1 - 40 * sc, y1 + fd * .25, x1 - w1, y1);
        m.lineTo(x1 + w1, y1); m.bezierCurveTo(x1 - 30 * sc, y1 + fd * .25, x0 + w0, yG - fd * .2, x0 + w0, yG + 30); m.closePath(); };
      const lg = m.createLinearGradient(0, y1, 0, yG); lg.addColorStop(0, "#b07a4a"); lg.addColorStop(1, "#7a4a28");
      lane(34, 7 * sc); m.fillStyle = lg; m.fill();
      lane(10, 2 * sc); m.fillStyle = "rgba(60,25,10,.28)"; m.fill();          // the center strip between the ruts
      const ll = m.createRadialGradient(sun.x, y1, 10, sun.x, y1, W * .5); ll.addColorStop(0, "rgba(255,200,130,.35)"); ll.addColorStop(1, "rgba(255,200,130,0)");
      lane(34, 7 * sc); m.fillStyle = ll; m.fill(); }
    // haystacks out in the field, lit on the sun side
    const stack = (x, y, r) => {
      m.fillStyle = "rgba(40,15,5,.35)"; m.beginPath(); m.ellipse(x - lit * r * .6, y + 1, r * 1.5, r * .22, 0, 0, Math.PI * 2); m.fill();
      const hg3 = m.createLinearGradient(x - r, 0, x + r, 0); hg3.addColorStop(lit > 0 ? 0 : 1, "#6a4418"); hg3.addColorStop(.55, "#b08038"); hg3.addColorStop(lit > 0 ? 1 : 0, "#f0c468");
      m.fillStyle = hg3; m.beginPath(); m.moveTo(x - r, y); m.bezierCurveTo(x - r, y - r * 1.1, x - r * .3, y - r * 1.5, x, y - r * 1.5); m.bezierCurveTo(x + r * .3, y - r * 1.5, x + r, y - r * 1.1, x + r, y); m.closePath(); m.fill();
      m.strokeStyle = "rgba(255,220,150,.3)"; m.lineWidth = .8; for (let k = 0; k < 6; k++) { const yy = y - r * (.2 + k * .2); m.beginPath(); m.moveTo(x - r * .9 * (1 - k * .13), yy); m.quadraticCurveTo(x, yy - 2, x + r * .9 * (1 - k * .13), yy); m.stroke(); }
    };
    for (const [px, dz] of (wide ? [[.4, .42], [.455, .5], [.84, .4], [.905, .47]] : [[.22, .5], [.46, .46], [.93, .42]])) stack(W * px, fy + fd * dz, (6 + dz * 10) * sc);
    // silo
    const sw = 22 * sc, sh = 78 * sc, sx = bx + 64 * sc;
    const sg2 = m.createLinearGradient(sx, 0, sx + sw, 0); sg2.addColorStop(0, "#4b3442"); sg2.addColorStop(.75, "#6a4652"); sg2.addColorStop(1, "#c07a5c");
    m.fillStyle = sg2; m.fillRect(sx, by - sh, sw, sh);
    const dome = m.createLinearGradient(sx, 0, sx + sw, 0); dome.addColorStop(0, "#5a4a58"); dome.addColorStop(.7, "#9a8a92"); dome.addColorStop(1, "#ffd0a0");
    m.fillStyle = dome; m.beginPath(); m.ellipse(sx + sw / 2, by - sh, sw / 2 + .5, sw * .62, 0, Math.PI, 0); m.fill();
    m.fillStyle = "#3a2a34"; m.fillRect(sx + sw / 2 - 1.5 * sc, by - sh - sw * .7, 3 * sc, 3 * sc);
    m.strokeStyle = "rgba(30,15,20,.4)"; m.lineWidth = 1; for (let k = 1; k < 7; k++) { m.beginPath(); m.moveTo(sx, by - sh * k / 7); m.lineTo(sx + sw, by - sh * k / 7); m.stroke(); }
    m.strokeStyle = "rgba(255,210,170,.35)"; for (let k = 1; k < 7; k++) { m.beginPath(); m.moveTo(sx + sw * .72, by - sh * k / 7 + 1); m.lineTo(sx + sw, by - sh * k / 7 + 1); m.stroke(); }
    m.strokeStyle = "rgba(25,12,15,.8)"; m.lineWidth = .9;                       // ladder
    m.beginPath(); m.moveTo(sx + sw * .18, by); m.lineTo(sx + sw * .18, by - sh - 2); m.moveTo(sx + sw * .34, by); m.lineTo(sx + sw * .34, by - sh - 2); m.stroke();
    for (let y = by - 3; y > by - sh; y -= 3.2 * sc) { m.beginPath(); m.moveTo(sx + sw * .18, y); m.lineTo(sx + sw * .34, y); m.stroke(); }
    // barn
    const bw = 66 * sc, bh = 40 * sc, rh = 26 * sc;
    const bg = m.createLinearGradient(bx, 0, bx + bw, 0); bg.addColorStop(0, "#5e1a14"); bg.addColorStop(.7, "#7e2418"); bg.addColorStop(1, "#c4553a");
    m.fillStyle = bg; m.beginPath(); m.moveTo(bx, by); m.lineTo(bx, by - bh); m.lineTo(bx + bw * .18, by - bh - rh * .7); m.lineTo(bx + bw / 2, by - bh - rh);
    m.lineTo(bx + bw * .82, by - bh - rh * .7); m.lineTo(bx + bw, by - bh); m.lineTo(bx + bw, by); m.closePath(); m.fill();
    m.strokeStyle = "#2a0d0a"; m.lineWidth = 3 * sc; m.lineJoin = "round";
    m.beginPath(); m.moveTo(bx - 3 * sc, by - bh + 1); m.lineTo(bx + bw * .18, by - bh - rh * .7); m.lineTo(bx + bw / 2, by - bh - rh); m.lineTo(bx + bw * .82, by - bh - rh * .7); m.lineTo(bx + bw + 3 * sc, by - bh + 1); m.stroke();
    m.save(); m.clip();                                              // inside the barn walls
    m.strokeStyle = "rgba(30,6,4,.28)"; m.lineWidth = .8; for (let x = bx + 3; x < bx + bw; x += 3.4 * sc) { m.beginPath(); m.moveTo(x, by); m.lineTo(x, by - bh - rh); m.stroke(); }
    const rim = m.createLinearGradient(bx + (lit > 0 ? bw : 0), 0, bx + bw / 2, 0); rim.addColorStop(0, "rgba(255,170,110,.45)"); rim.addColorStop(1, "rgba(255,170,110,0)");
    m.fillStyle = rim; m.fillRect(bx, by - bh - rh, bw, bh + rh);
    m.restore();
    // shed roof leaning off the side away from the sun
    { const sx0 = lit > 0 ? bx - 22 * sc : bx + bw, sw0 = 22 * sc, sh0 = bh * .62;
      m.fillStyle = "#4e1610"; m.fillRect(sx0, by - sh0, sw0, sh0);
      m.fillStyle = "#2a0d0a"; m.beginPath(); m.moveTo(lit > 0 ? bx : bx + bw, by - bh * .85); m.lineTo(lit > 0 ? sx0 - 2 : sx0 + sw0 + 2, by - sh0 - 1); m.lineTo(lit > 0 ? sx0 - 2 : sx0 + sw0 + 2, by - sh0 + 2); m.lineTo(lit > 0 ? bx : bx + bw, by - bh * .85 + 3); m.closePath(); m.fill(); }
    // shingles on the roof
    m.strokeStyle = "rgba(255,200,150,.12)"; m.lineWidth = .7;
    for (let k = 1; k < 6; k++) { const yy = by - bh - rh * (k / 6) * .95; const half = bw / 2 * (1 - k / 6 * .55) + 3 * sc; m.beginPath(); m.moveTo(bx + bw / 2 - half, yy + rh * .1); m.lineTo(bx + bw / 2 + half, yy + rh * .1); m.stroke(); }
    // cupola on the ridge, with a weathervane
    { const cx0 = bx + bw / 2, cy0 = by - bh - rh, cw0 = 9 * sc;
      m.fillStyle = "#6e2016"; m.fillRect(cx0 - cw0 / 2, cy0 - 8 * sc, cw0, 8 * sc);
      m.fillStyle = "rgba(255,230,200,.7)"; m.fillRect(cx0 - cw0 * .3, cy0 - 6 * sc, cw0 * .22, 4 * sc); m.fillRect(cx0 + cw0 * .08, cy0 - 6 * sc, cw0 * .22, 4 * sc);
      m.fillStyle = "#2a0d0a"; m.beginPath(); m.moveTo(cx0 - cw0 * .75, cy0 - 8 * sc); m.lineTo(cx0, cy0 - 14 * sc); m.lineTo(cx0 + cw0 * .75, cy0 - 8 * sc); m.closePath(); m.fill();
      m.strokeStyle = "#1e0a08"; m.lineWidth = 1; m.beginPath(); m.moveTo(cx0, cy0 - 14 * sc); m.lineTo(cx0, cy0 - 22 * sc);
      m.moveTo(cx0 - 5 * sc, cy0 - 18 * sc); m.lineTo(cx0 + 5 * sc, cy0 - 18 * sc); m.stroke();
      m.fillStyle = "#1e0a08"; m.beginPath(); m.moveTo(cx0 + 5 * sc, cy0 - 18 * sc); m.lineTo(cx0 + 2.5 * sc, cy0 - 19.6 * sc); m.lineTo(cx0 + 2.5 * sc, cy0 - 16.4 * sc); m.fill();   // arrow
      m.beginPath(); m.ellipse(cx0 - 2 * sc, cy0 - 21 * sc, 2.6 * sc, 1.6 * sc, 0, 0, Math.PI * 2); m.fill(); }                                                        // rooster
    // doors with the white X trim, hay loft
    const dw = bw * .34, dh = bh * .62, dx = bx + (bw - dw) / 2;
    m.fillStyle = "#4a130e"; m.fillRect(dx, by - dh, dw, dh);
    m.strokeStyle = "rgba(240,220,200,.78)"; m.lineWidth = 1.6 * sc;
    m.strokeRect(dx, by - dh, dw, dh); m.beginPath(); m.moveTo(dx, by - dh); m.lineTo(dx + dw, by); m.moveTo(dx + dw, by - dh); m.lineTo(dx, by); m.moveTo(dx + dw / 2, by - dh); m.lineTo(dx + dw / 2, by); m.stroke();
    L.lights = [];
    const gs = 64, glowS = mk(gs, gs), gg = glowS.getContext("2d"), gr0 = gg.createRadialGradient(gs / 2, gs / 2, 1, gs / 2, gs / 2, gs / 2);
    gr0.addColorStop(0, "rgba(255,190,90,.55)"); gr0.addColorStop(1, "rgba(255,140,50,0)"); gg.fillStyle = gr0; gg.fillRect(0, 0, gs, gs);
    L.glow = glowS;
    const loft = { x: bx + bw / 2 - 6 * sc, y: by - bh - rh * .55, w: 12 * sc, h: 11 * sc };
    L.lights.push(loft);
    // farmhouse with a lit window and a chimney
    const hx = wide ? W * .32 : W * .1, hw = 44 * sc, hh = 28 * sc, hy = fy + fd * .18;
    const hg2 = m.createLinearGradient(hx, 0, hx + hw, 0); hg2.addColorStop(0, "#4c3236"); hg2.addColorStop(1, "#8a5a4c");
    m.fillStyle = hg2; m.fillRect(hx, hy - hh, hw, hh);
    m.fillStyle = "#2a141a"; m.beginPath(); m.moveTo(hx - 4 * sc, hy - hh); m.lineTo(hx + hw / 2, hy - hh - 18 * sc); m.lineTo(hx + hw + 4 * sc, hy - hh); m.closePath(); m.fill();
    m.fillStyle = "#2a141a"; m.fillRect(hx + hw * .7, hy - hh - 20 * sc, 6 * sc, 14 * sc);
    m.strokeStyle = "rgba(20,8,10,.35)"; m.lineWidth = .7; for (let y = hy - hh + 3; y < hy; y += 3 * sc) { m.beginPath(); m.moveTo(hx, y); m.lineTo(hx + hw, y); m.stroke(); }   // clapboard
    m.fillStyle = "#2a141a"; m.beginPath(); m.moveTo(hx - 6 * sc, hy - hh * .42); m.lineTo(hx + hw + 6 * sc, hy - hh * .42); m.lineTo(hx + hw + 9 * sc, hy - hh * .3); m.lineTo(hx - 9 * sc, hy - hh * .3); m.closePath(); m.fill();   // porch roof
    m.fillStyle = "#2a141a"; for (const px of [-7, hw * .5, hw + 6]) m.fillRect(hx + px * 1, hy - hh * .3, 1.4 * sc, hh * .3);
    m.fillStyle = "#24100c"; m.fillRect(hx + hw * .4, hy - hh * .55, 6 * sc, hh * .55);                 // door
    L.houseRim = { x: hx, y: hy - hh, w: hw, h: hh };
    L.chimney = { x: hx + hw * .7 + 3 * sc, y: hy - hh - 20 * sc, s: sc };
    L.porch = { x: hx + hw * .4 + 3 * sc, y: hy - hh * .3 + 1.5 * sc, s: sc };
    L.lights.push({ x: hx + hw * .1, y: hy - hh * .8, w: 8 * sc, h: 7 * sc, panes: true }, { x: hx + hw * .72, y: hy - hh * .8, w: 8 * sc, h: 7 * sc, panes: true });
    // windmill: lattice tower and tail here; the wheel turns in the frame
    { const wx = wide ? W * .69 : W * .33, wy = fy + fd * .22, th2 = 70 * sc;
      m.strokeStyle = "#2a1418"; m.lineWidth = 1.1;
      m.beginPath(); m.moveTo(wx - 9 * sc, wy); m.lineTo(wx - 1.5 * sc, wy - th2); m.moveTo(wx + 9 * sc, wy); m.lineTo(wx + 1.5 * sc, wy - th2); m.stroke();
      m.lineWidth = .7; for (let k = 1; k < 7; k++) { const y = wy - th2 * k / 7, hw2 = 9 * sc * (1 - k / 7) + 1.5 * sc * k / 7, y2 = wy - th2 * (k - 1) / 7, hw3 = 9 * sc * (1 - (k - 1) / 7) + 1.5 * sc * (k - 1) / 7;
        m.beginPath(); m.moveTo(wx - hw2, y); m.lineTo(wx + hw2, y); m.moveTo(wx - hw3, y2); m.lineTo(wx + hw2, y); m.moveTo(wx + hw3, y2); m.lineTo(wx - hw2, y); m.stroke(); }
      m.fillStyle = "#2a1418"; m.beginPath(); m.moveTo(wx, wy - th2 - 2 * sc); m.lineTo(wx - 22 * sc * lit, wy - th2 - 6 * sc); m.lineTo(wx - 24 * sc * lit, wy - th2 + 4 * sc); m.lineTo(wx, wy - th2 + 1 * sc); m.closePath(); m.fill();
      L.mill = { x: wx + 2 * sc * lit, y: wy - th2 - 1 * sc, r: 14 * sc }; }
    // fence along the field
    m.strokeStyle = "#2c140c"; m.lineWidth = 2;
    const fenceY = x => fy + fd * .52 + Math.sin(x / W * Math.PI * 1.2 + .4) * 5;
    for (let x = -10; x < W + 20; x += 26) { m.beginPath(); m.moveTo(x, fenceY(x) + 2); m.lineTo(x, fenceY(x) - 12); m.stroke(); }
    m.lineWidth = 1.4; for (const off of [-9, -4]) { m.beginPath(); for (let x = -10; x < W + 20; x += 13) m.lineTo(x, fenceY(x) + off); m.stroke(); }
    { const hz = m.createLinearGradient(0, fy - 6, 0, fy + fd * .7); hz.addColorStop(0, "rgba(255,190,120,.32)"); hz.addColorStop(1, "rgba(255,170,100,0)");
      m.globalCompositeOperation = "source-atop"; m.fillStyle = hz; m.fillRect(0, fy - 10, W, fd);
      const hz2 = m.createRadialGradient(sun.x, fy, 10, sun.x, fy, W * .45); hz2.addColorStop(0, "rgba(255,210,140,.3)"); hz2.addColorStop(1, "rgba(255,190,120,0)");
      m.fillStyle = hz2; m.fillRect(0, fy - 40, W, fd + 40); m.globalCompositeOperation = "source-over"; }
    L.farm = farm;

    /* foreground: dark ground with lit grass, big autumn tree, hay bales, pumpkins, corn shocks */
    const near = mk(W * D, H * D), n = near.getContext("2d"); n.scale(D, D);
    const gn = noise2(16);
    const gy = x => yG + Math.sin(x / W * Math.PI * 1.1) * -8 + (fbm(gn, x / 70, 1.3, 3) - .5) * 14;
    const ng = n.createLinearGradient(0, yG - 20, 0, H); ng.addColorStop(0, "#3a1c10"); ng.addColorStop(.4, "#24110a"); ng.addColorStop(1, "#120806");
    n.fillStyle = ng; n.beginPath(); n.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) n.lineTo(x, gy(x));
    n.lineTo(W, H); n.closePath(); n.fill();
    // grass tufts along the crest, rim-lit by the low sun
    for (let x = 0; x < W; x += 2.2) {
      const y = gy(x), h = 4 + rnd() * 11, lean = (rnd() - .3) * 5, warm = 1 - Math.min(1, Math.abs(x - sun.x) / W);
      n.strokeStyle = rnd() < .5 ? `rgba(${200 + 55 * warm},${120 + 60 * warm},60,${.35 + .4 * warm})` : "rgba(30,14,8,.9)";
      n.lineWidth = .9; n.beginPath(); n.moveTo(x, y + 2); n.quadraticCurveTo(x + lean * .4, y - h * .5, x + lean, y - h); n.stroke();
    }
    L.gy = gy;
    n.save(); n.beginPath(); n.moveTo(0, H); for (let x = 0; x <= W; x += 4) n.lineTo(x, gy(x) + 6); n.lineTo(W, H); n.closePath(); n.clip();
    for (let i = 0, k = Math.round(W * (H - yG) / 110); i < k; i++) {                    // soil and fallen leaves
      const x = rnd() * W, y = yG + rnd() * (H - yG), near = (y - yG) / (H - yG);
      if (rnd() < .3) { n.fillStyle = pick(["#5e140b", "#7a1c10", "#9c2a16", "#b8401c", "#c4581c"]); n.globalAlpha = (.22 + rnd() * .25) * (1 - near * .75);
        n.beginPath(); n.ellipse(x, y, 1.6 + rnd() * 3 + near * 3, 1 + rnd() * 1.4 + near, rnd() * Math.PI, 0, Math.PI * 2); n.fill(); }
      else { n.fillStyle = rnd() < .5 ? "rgba(70,36,18,.45)" : "rgba(8,3,2,.4)"; n.globalAlpha = 1; n.fillRect(x, y, 1 + rnd() * 2, 1); }
    }
    n.globalAlpha = 1; n.restore();
    for (let x = -10; x < W + 10; x += 3 + rnd() * 4) {                                   // tall grass in silhouette along the very bottom
      const h = 14 + rnd() * (wide ? 46 : 30), lean = (rnd() - .5) * 18;
      n.strokeStyle = rnd() < .85 ? "rgba(10,4,2,.92)" : "rgba(120,60,24,.6)"; n.lineWidth = 1 + rnd() * 1.4;
      n.beginPath(); n.moveTo(x, H + 2); n.quadraticCurveTo(x + lean * .3, H - h * .6, x + lean, H - h); n.stroke();
    }

    // the tree, on the left: trunk and branches, then the canopy as shaded clusters of leaves, lit from the sun side
    const phone = W < 600;
    const tx = phone ? W * .02 : W * .1, ty = gy(tx) + 4;
    const TH = phone ? clamp(H * .36, 190, 320) : clamp(H * .52, 240, 480), TW = phone ? clamp(W * .55, 170, 300) : clamp(W * .36, 200, 440);
    const tips = [];
    const branch = (x, y, len, ang, w, depth) => {
      const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
      n.strokeStyle = "#1c0c08"; n.lineWidth = w; n.lineCap = "round";
      n.beginPath(); n.moveTo(x, y); n.quadraticCurveTo((x + x2) / 2 + (rnd() - .5) * len * .25, (y + y2) / 2, x2, y2); n.stroke();
      if (depth > 0) { const k = 1 + (rnd() < .6 ? 1 : 0); for (let i = 0; i <= k; i++) branch(x2, y2, len * (.62 + rnd() * .18), ang + (rnd() - .5) * 1.1 + (i - k / 2) * .5, w * .62, depth - 1); }
      else tips.push([x2, y2]);
    };
    const trunk = new Path2D(); trunk.moveTo(tx - 24, ty + 6); trunk.quadraticCurveTo(tx - 9, ty - 10, tx - 8, ty - TH * .2); trunk.quadraticCurveTo(tx - 7, ty - TH * .34, tx - 6, ty - TH * .42);
    trunk.lineTo(tx + 10, ty - TH * .42); trunk.quadraticCurveTo(tx + 11, ty - TH * .3, tx + 13, ty - TH * .2); trunk.quadraticCurveTo(tx + 14, ty - 10, tx + 32, ty + 6); trunk.closePath();
    const tgr = n.createLinearGradient(tx - 10, 0, tx + 14, 0); tgr.addColorStop(0, "#140805"); tgr.addColorStop(.6, "#2a140c"); tgr.addColorStop(1, "#6a3418");
    n.fillStyle = tgr; n.fill(trunk);
    n.save(); n.clip(trunk); n.lineCap = "round";
    for (let k = 0; k < 46; k++) { const x = tx - 12 + rnd() * 26, y = ty - rnd() * TH * .42, l = 8 + rnd() * 22;          // bark furrows
      n.strokeStyle = rnd() < .7 ? "rgba(8,3,2,.6)" : "rgba(160,90,50,.25)"; n.lineWidth = .8 + rnd() * 1.2;
      n.beginPath(); n.moveTo(x, y); n.quadraticCurveTo(x + (rnd() - .5) * 4, y - l / 2, x + (rnd() - .5) * 3, y - l); n.stroke(); }
    n.restore();
    for (const a of [-1.95, -1.55, -1.2, -.85, -2.3]) branch(tx + 2, ty - TH * .4, TH * .26, a, phone ? 7 : 9, 3);
    const ccx = tx + TW * .16, ccy = ty - TH * .72, crx = TW * .62, cry = TH * .34;
    const LC = ["#5e140b", "#7a1c10", "#9c2a16", "#b8401c", "#d4621f", "#e8892a", "#f2ae3e", "#ffd06a"];
    const clusters = [];
    const nc = Math.round(clamp(crx * cry / 240, 50, 220));
    for (let i = 0; i < nc; i++) {
      let x, y;
      if (i % 3 === 0 && tips.length) { const tp = tips[Math.floor(rnd() * tips.length)]; x = tp[0] + (rnd() - .5) * 22; y = tp[1] + (rnd() - .5) * 18; }
      else { const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * .95; x = ccx + Math.cos(a) * crx * r * (1 + .12 * Math.sin(a * 3)); y = ccy + Math.sin(a) * cry * r; }
      clusters.push({ x, y, r: (phone ? 10 : 13) + rnd() * (phone ? 12 : 18) });
    }
    clusters.sort((p, q) => p.y - q.y || p.x - q.x);
    const litAt = (x, y) => clamp((x - ccx) / crx * .45 + .45 - (y - ccy) / cry * .3, 0, 1);  // brighter toward the sun and the top
    for (const c of clusters) {                                       // dark mass first so there are no gaps
      n.fillStyle = "rgba(84,22,10,.78)"; n.beginPath(); n.ellipse(c.x, c.y + c.r * .15, c.r * .78, c.r * .66, 0, 0, Math.PI * 2); n.fill();
    }
    for (const c of clusters) {
      const base = litAt(c.x, c.y), k = Math.round(c.r * 3.4);
      for (let j = 0; j < k; j++) {
        const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * c.r * 1.2;
        const x = c.x + Math.cos(a) * r, y = c.y + Math.sin(a) * r * .85;
        const local = (x - c.x) / c.r * .25 - (y - c.y) / c.r * .35;       // each cluster is lit on its upper sun side
        const ci = clamp(Math.round((base * .75 + local + .1) * (LC.length - 1) + (rnd() - .5) * 1.6), 0, LC.length - 1);
        n.fillStyle = LC[ci]; n.globalAlpha = .85 + rnd() * .15;
        n.beginPath(); n.ellipse(x, y, 1.6 + rnd() * 2.6, 1.1 + rnd() * 1.7, rnd() * Math.PI, 0, Math.PI * 2); n.fill();
      }
    }
    // loose leaves over the whole crown, so the clusters blend into one canopy
    for (let j = 0, k = Math.round(crx * cry / 9); j < k; j++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd());
      const x = ccx + Math.cos(a) * crx * r * 1.02, y = ccy + Math.sin(a) * cry * r * 1.02;
      const ci = clamp(Math.round(litAt(x, y) * (LC.length - 1) + (rnd() - .5) * 2.2), 0, LC.length - 1);
      n.fillStyle = LC[ci]; n.globalAlpha = .7 + rnd() * .3;
      n.beginPath(); n.ellipse(x, y, 1.4 + rnd() * 2.2, 1 + rnd() * 1.4, rnd() * Math.PI, 0, Math.PI * 2); n.fill();
    }
    for (let j = 0, k = Math.round(crx * cry / 22); j < k; j++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd());
      const x = ccx + Math.cos(a) * crx * r, y = ccy + Math.sin(a) * cry * r, l2 = litAt(x, y);
      if (y > ccy + cry * .25 && rnd() < .8) { n.fillStyle = rnd() < .5 ? "#3e0c06" : "#5a1408"; n.globalAlpha = .55 + rnd() * .3; }      // shade under the crown
      else if (l2 > .55) { n.fillStyle = rnd() < .5 ? "#ffe08a" : "#ffc04a"; n.globalAlpha = .6 + rnd() * .4; }                         // leaves catching the sun
      else continue;
      n.beginPath(); n.ellipse(x, y, 1.2 + rnd() * 2, .9 + rnd() * 1.2, rnd() * Math.PI, 0, Math.PI * 2); n.fill();
    }
    n.globalAlpha = 1;
    // a few branch ends poke out under the leaves
    n.strokeStyle = "#1c0c08"; n.lineCap = "round";
    for (const [x, y] of tips) if (rnd() < .3) { n.lineWidth = 1.2; n.beginPath(); n.moveTo(x, y); n.lineTo(x + (rnd() - .5) * 14, y + 6 + rnd() * 8); n.stroke(); }
    L.tree = { x: ccx, y: ccy, rx: crx, ry: cry };
    if (!phone) {                                                     // a rope swing hangs off a low branch
      const x0 = tx + 8, y0 = ty - TH * .44, cx1 = x0 + TW * .2, cy1 = y0 - TH * .02, x1 = x0 + TW * .52, y1 = y0 - TH * .2;
      const q = u => [(1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx1 + u * u * x1, (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy1 + u * u * y1];
      n.strokeStyle = "#1c0c08"; n.lineCap = "round";
      for (let i = 0; i < 12; i++) { const u0 = i / 12, u1 = (i + 1) / 12, [a1, b1] = q(u0), [a2, b2] = q(u1); n.lineWidth = 8 * (1 - u0 * .75); n.beginPath(); n.moveTo(a1, b1); n.lineTo(a2, b2); n.stroke(); }
      n.strokeStyle = "rgba(160,80,40,.35)"; n.lineWidth = 1.2; n.beginPath(); n.moveTo(x0, y0 - 3); n.quadraticCurveTo(cx1, cy1 - 3.5, x1, y1 - 2); n.stroke();   // lit top edge
      const [ax, ay] = q(.55);
      L.swing = { x: ax, y: ay + 2, len: clamp(TH * .38, 100, 180) };
    }
    // leaves already fallen, piled under the tree
    for (let i = 0; i < 160; i++) {
      const x = tx - 40 + rnd() * TW * .9, y = gy(x) + 2 + rnd() * 10;
      n.fillStyle = LC[Math.floor(rnd() * LC.length)]; n.globalAlpha = .55 + rnd() * .4;
      n.beginPath(); n.ellipse(x, y, 2 + rnd() * 3.5, 1.2 + rnd() * 1.6, rnd() * Math.PI, 0, Math.PI * 2); n.fill();
    }
    n.globalAlpha = 1;

    // round hay bales
    const bale = (x, r) => {
      const y = gy(x) + 4;
      const g3 = n.createLinearGradient(x - r, 0, x + r, 0); g3.addColorStop(0, "#5c3a14"); g3.addColorStop(.6, "#a87430"); g3.addColorStop(1, "#e8b45a");
      n.fillStyle = g3; n.beginPath(); n.ellipse(x, y - r * .9, r * 1.05, r * .9, 0, 0, Math.PI * 2); n.fill();
      const fx = x + r * .45, g4 = n.createRadialGradient(fx, y - r * .9, 1, fx, y - r * .9, r * .8); g4.addColorStop(0, "#f2c56a"); g4.addColorStop(1, "#b07a2c");
      n.fillStyle = g4; n.beginPath(); n.ellipse(fx, y - r * .9, r * .55, r * .82, 0, 0, Math.PI * 2); n.fill();
      n.strokeStyle = "rgba(90,50,15,.55)"; n.lineWidth = 1;
      for (let k = 1; k < 5; k++) { n.beginPath(); n.ellipse(fx, y - r * .9, r * .55 * k / 5, r * .82 * k / 5, 0, 0, Math.PI * 2); n.stroke(); }
      n.save(); n.beginPath(); n.ellipse(x, y - r * .9, r * 1.05, r * .9, 0, 0, Math.PI * 2); n.clip();
      for (let k = 0; k < 70; k++) { const yy = y - r * .05 - rnd() * r * 1.75, x0 = x - r * 1.05 + rnd() * r * .5;
        n.strokeStyle = rnd() < .55 ? `rgba(255,${210 + rnd() * 30 | 0},140,${.25 + rnd() * .3})` : `rgba(80,45,12,${.25 + rnd() * .25})`; n.lineWidth = .6 + rnd() * .7;
        n.beginPath(); n.moveTo(x0, yy); n.quadraticCurveTo(x0 + r * .5, yy + (rnd() - .5) * 4, x0 + r * (.6 + rnd() * .5), yy + (rnd() - .5) * 5); n.stroke(); }
      n.strokeStyle = "rgba(60,30,10,.7)"; n.lineWidth = Math.max(1, r * .06);                                       // twine wraps
      for (const u of [.35, .65]) { const yy = y - r * .9 - r * .9 + u * r * 1.8; n.beginPath(); n.moveTo(x - r * 1.05, yy); n.quadraticCurveTo(x - r * .2, yy + r * .08, x + r * .2, yy + r * .02); n.stroke(); }
      n.restore();
      for (let k = 0; k < 16; k++) { const a = rnd() * Math.PI * 2; n.strokeStyle = "rgba(240,200,120,.6)"; n.lineWidth = .7;           // loose straw on the outline
        const ex = x + Math.cos(a) * r * 1.03, ey = y - r * .9 + Math.sin(a) * r * .88; n.beginPath(); n.moveTo(ex, ey); n.lineTo(ex + Math.cos(a) * (2 + rnd() * 5), ey + Math.sin(a) * (2 + rnd() * 5)); n.stroke(); }
    };
    const pumpkin = (x, S, hue) => {
      const y = gy(x) + 3, cx = x, cy = y - S * .42;
      n.fillStyle = "rgba(20,8,2,.45)"; n.beginPath(); n.ellipse(cx - lit * S * .15, y + 1, S * .62, S * .12, 0, 0, Math.PI * 2); n.fill();
      for (const [ox, rx] of [[-.34, .3], [.34, .3], [-.16, .36], [.16, .36], [0, .4]]) {
        const gr = n.createRadialGradient(cx + ox * S + lit * rx * S * .35, cy - S * .16, S * .03, cx + ox * S, cy, rx * S * 1.25);
        gr.addColorStop(0, hue[0]); gr.addColorStop(.5, hue[1]); gr.addColorStop(1, hue[2]);
        n.fillStyle = gr; n.beginPath(); n.ellipse(cx + ox * S, cy, rx * S, S * .38, 0, 0, Math.PI * 2); n.fill();
      }
      n.strokeStyle = "rgba(60,16,0,.35)"; n.lineWidth = Math.max(.7, S * .025);                                    // ribs
      for (const ox of [-.26, -.09, .09, .26]) { n.beginPath(); n.moveTo(cx + ox * S * .8, cy - S * .35); n.quadraticCurveTo(cx + ox * S * 1.3, cy, cx + ox * S * .8, cy + S * .36); n.stroke(); }
      n.fillStyle = "rgba(255,240,210,.28)"; n.beginPath(); n.ellipse(cx + lit * S * .16, cy - S * .16, S * .06, S * .14, lit * .3, 0, Math.PI * 2); n.fill();   // gloss
      n.strokeStyle = "rgba(255,200,130,.4)"; n.lineWidth = Math.max(.8, S * .03); n.beginPath(); n.ellipse(cx, cy, S * .72, S * .38, 0, lit > 0 ? -1 : 2.2, lit > 0 ? .9 : 4.1); n.stroke();   // rim light
      n.fillStyle = "#5d4a22"; n.beginPath(); n.moveTo(cx - S * .05, cy - S * .34); n.quadraticCurveTo(cx - S * .02, cy - S * .5, cx + S * .09, cy - S * .56);
      n.lineTo(cx + S * .13, cy - S * .5); n.quadraticCurveTo(cx + S * .04, cy - S * .45, cx + S * .06, cy - S * .34); n.closePath(); n.fill();
      n.strokeStyle = "rgba(150,130,70,.6)"; n.lineWidth = .7; n.beginPath(); n.moveTo(cx - S * .02, cy - S * .36); n.quadraticCurveTo(cx, cy - S * .48, cx + S * .08, cy - S * .53); n.stroke();
      n.strokeStyle = "#6f7a2a"; n.lineWidth = Math.max(.8, S * .025); n.beginPath(); n.moveTo(cx + S * .1, cy - S * .5);
      n.bezierCurveTo(cx + S * .4, cy - S * .7, cx + S * .5, cy - S * .4, cx + S * .32, cy - S * .42); n.bezierCurveTo(cx + S * .22, cy - S * .44, cx + S * .28, cy - S * .55, cx + S * .36, cy - S * .5); n.stroke();
      n.fillStyle = "#4f6a24"; n.beginPath(); n.ellipse(cx - S * .2, cy - S * .4, S * .14, S * .07, -.4, 0, Math.PI * 2); n.fill();
    };
    const ORANGE = ["#ffb45a", "#e8701c", "#7a2c08"], CREAM = ["#fff0d0", "#e4c79a", "#8a6a44"], DEEP = ["#ff9a40", "#c44c12", "#5a1c06"];
    const shock = (x, h) => {                                      // corn stalks tied into a teepee
      const y = gy(x) + 4;
      n.fillStyle = "#3a2410"; n.beginPath(); n.moveTo(x - h * .36, y); n.quadraticCurveTo(x - h * .1, y - h * .5, x, y - h * .96); n.quadraticCurveTo(x + h * .1, y - h * .5, x + h * .36, y); n.closePath(); n.fill();
      for (let k = 0; k < 10; k++) {                                // leaf blades hanging off the stalks
        const yy = y - h * (.25 + rnd() * .55), side = rnd() < .5 ? -1 : 1, xx = x + side * h * (.12 - (y - yy) / h * .1);
        n.strokeStyle = rnd() < .5 ? "#a9824a" : "#6e4e22"; n.lineWidth = 1.6;
        n.beginPath(); n.moveTo(xx, yy); n.quadraticCurveTo(xx + side * h * .18, yy - h * .05, xx + side * h * .26, yy + h * .12); n.stroke();
      }
      for (let k = 0; k < 34; k++) {
        const bx2 = x + (k / 33 - .5) * h * .72, top = x + (rnd() - .5) * h * .08;
        n.strokeStyle = rnd() < .4 ? "#c49a52" : rnd() < .5 ? "#8a6630" : "#4a3214"; n.lineWidth = 1.4 + rnd();
        n.beginPath(); n.moveTo(bx2, y); n.quadraticCurveTo((bx2 + top) / 2, y - h * .55, top + (rnd() - .5) * h * .25, y - h * (.95 + rnd() * .15)); n.stroke();
      }
      n.strokeStyle = "#3a2410"; n.lineWidth = 2.4; n.beginPath(); n.moveTo(x - h * .09, y - h * .5); n.lineTo(x + h * .09, y - h * .5); n.stroke();
      // rim light toward the sun
      n.strokeStyle = "rgba(255,200,120,.5)"; n.lineWidth = 1;
      for (let k = 0; k < 6; k++) { const bx2 = x + h * (.12 + k * .04); n.beginPath(); n.moveTo(bx2, y); n.quadraticCurveTo(x + h * .05, y - h * .55, x + h * .02, y - h); n.stroke(); }
    };
    const s2 = clamp(W / 800, .7, 1.3);
    const scarecrow = (x, h) => {
      const y = gy(x) + 4, hw = h * .42;
      n.strokeStyle = "#2a160a"; n.lineWidth = Math.max(2, h * .035); n.lineCap = "butt";
      n.beginPath(); n.moveTo(x, y); n.lineTo(x, y - h * .9); n.moveTo(x - hw, y - h * .66); n.lineTo(x + hw, y - h * .66); n.stroke();
      // plaid shirt draped over the crossbar
      const shirt = new Path2D(); shirt.moveTo(x - hw, y - h * .7); shirt.lineTo(x + hw, y - h * .7); shirt.lineTo(x + hw * .92, y - h * .56); shirt.lineTo(x + hw * .3, y - h * .58);
      shirt.lineTo(x + hw * .34, y - h * .28); shirt.lineTo(x - hw * .34, y - h * .28); shirt.lineTo(x - hw * .3, y - h * .58); shirt.lineTo(x - hw * .92, y - h * .56); shirt.closePath();
      n.fillStyle = "#8a2418"; n.fill(shirt);
      n.save(); n.clip(shirt);
      n.strokeStyle = "rgba(30,10,8,.55)"; n.lineWidth = h * .03; for (let k = -6; k <= 6; k++) { n.beginPath(); n.moveTo(x + k * h * .07, y - h); n.lineTo(x + k * h * .07, y); n.stroke(); n.beginPath(); n.moveTo(x - hw, y - h * .7 + k * h * .07 + .42 * h); n.lineTo(x + hw, y - h * .7 + k * h * .07 + .42 * h); n.stroke(); }
      n.strokeStyle = "rgba(240,190,120,.3)"; n.lineWidth = h * .01; for (let k = -6; k <= 6; k++) { n.beginPath(); n.moveTo(x + k * h * .07 + h * .02, y - h); n.lineTo(x + k * h * .07 + h * .02, y); n.stroke(); }
      const sr = n.createLinearGradient(x - hw, 0, x + hw, 0); sr.addColorStop(lit > 0 ? 0 : 1, "rgba(0,0,0,.35)"); sr.addColorStop(lit > 0 ? 1 : 0, "rgba(255,170,90,.3)"); n.fillStyle = sr; n.fillRect(x - hw, y - h, hw * 2, h);
      n.restore();
      // straw poking out at the cuffs and hem
      n.strokeStyle = "#d8b060"; n.lineWidth = 1.1;
      for (const [cx2, cy2, dir] of [[x - hw, y - h * .63, -1], [x + hw, y - h * .63, 1]]) for (let k = 0; k < 7; k++) { n.beginPath(); n.moveTo(cx2, cy2); n.lineTo(cx2 + dir * (4 + rnd() * 7), cy2 + (rnd() - .3) * 9); n.stroke(); }
      for (let k = 0; k < 9; k++) { const sx2 = x - hw * .3 + rnd() * hw * .6; n.beginPath(); n.moveTo(sx2, y - h * .29); n.lineTo(sx2 + (rnd() - .5) * 5, y - h * .29 + 5 + rnd() * 7); n.stroke(); }
      // burlap head with a stitched face, and a straw hat
      const hr2 = h * .085, hy2 = y - h * .8;
      n.fillStyle = "#b89260"; n.beginPath(); n.arc(x, hy2, hr2, 0, Math.PI * 2); n.fill();
      n.fillStyle = "rgba(70,40,15,.8)"; n.beginPath(); n.arc(x - hr2 * .35, hy2 - hr2 * .05, hr2 * .13, 0, Math.PI * 2); n.arc(x + hr2 * .35, hy2 - hr2 * .05, hr2 * .13, 0, Math.PI * 2); n.fill();
      n.strokeStyle = "rgba(70,40,15,.8)"; n.lineWidth = 1; n.beginPath(); n.moveTo(x - hr2 * .4, hy2 + hr2 * .4); n.quadraticCurveTo(x, hy2 + hr2 * .65, x + hr2 * .4, hy2 + hr2 * .4); n.stroke();
      n.fillStyle = "#c79a4a"; n.beginPath(); n.ellipse(x, hy2 - hr2 * .7, hr2 * 2.1, hr2 * .42, -.08, 0, Math.PI * 2); n.fill();
      n.fillStyle = "#a87a34"; n.beginPath(); n.moveTo(x - hr2 * .9, hy2 - hr2 * .75); n.quadraticCurveTo(x - hr2 * .8, hy2 - hr2 * 1.9, x, hy2 - hr2 * 1.9); n.quadraticCurveTo(x + hr2 * .8, hy2 - hr2 * 1.9, x + hr2 * .9, hy2 - hr2 * .75); n.closePath(); n.fill();
      n.fillStyle = "#6a2010"; n.fillRect(x - hr2 * .9, hy2 - hr2 * 1.05, hr2 * 1.8, hr2 * .28);
      // a crow resting on one arm
      const cx3 = x + hw * .82 * lit, cy3 = y - h * .7;
      n.fillStyle = "#120808"; n.beginPath(); n.ellipse(cx3, cy3 - h * .035, h * .04, h * .026, -.2 * lit, 0, Math.PI * 2); n.fill();
      n.beginPath(); n.arc(cx3 + h * .035 * lit, cy3 - h * .062, h * .016, 0, Math.PI * 2); n.fill();
      n.beginPath(); n.moveTo(cx3 + h * .05 * lit, cy3 - h * .064); n.lineTo(cx3 + h * .07 * lit, cy3 - h * .058); n.lineTo(cx3 + h * .05 * lit, cy3 - h * .054); n.fill();
      n.beginPath(); n.moveTo(cx3 - h * .03 * lit, cy3 - h * .03); n.lineTo(cx3 - h * .075 * lit, cy3 - h * .02); n.lineTo(cx3 - h * .03 * lit, cy3 - h * .015); n.fill();
    };
    const crate = (x, w) => {
      const y = gy(x) + 5, h = w * .5;
      n.fillStyle = "rgba(20,8,4,.5)"; n.beginPath(); n.ellipse(x, y, w * .7, w * .1, 0, 0, Math.PI * 2); n.fill();
      // apples heaped on top
      for (let k = 0; k < 9; k++) { const ax = x - w * .4 + rnd() * w * .8, ay = y - h - rnd() * w * .12, ar = w * (.1 + rnd() * .03);
        const ag = n.createRadialGradient(ax - ar * .35, ay - ar * .4, ar * .1, ax, ay, ar); ag.addColorStop(0, rnd() < .25 ? "#f6f09a" : "#ff8a6a"); ag.addColorStop(.55, rnd() < .25 ? "#b8c43a" : "#c41c18"); ag.addColorStop(1, "#4a0806");
        n.fillStyle = ag; n.beginPath(); n.arc(ax, ay, ar, 0, Math.PI * 2); n.fill(); n.fillStyle = "rgba(255,250,235,.5)"; n.beginPath(); n.arc(ax - ar * .4, ay - ar * .35, ar * .18, 0, Math.PI * 2); n.fill(); }
      const cg2 = n.createLinearGradient(x - w / 2, 0, x + w / 2, 0); cg2.addColorStop(lit > 0 ? 0 : 1, "#4a2a12"); cg2.addColorStop(lit > 0 ? 1 : 0, "#b07a44");
      for (let k = 0; k < 3; k++) { n.fillStyle = cg2; n.fillRect(x - w / 2, y - h + k * h / 3 + 1, w, h / 3 - 2.5); }     // slats with gaps
      n.fillStyle = "#3a1e0c"; n.fillRect(x - w / 2, y - h, w * .07, h); n.fillRect(x + w / 2 - w * .07, y - h, w * .07, h);
      n.fillStyle = "rgba(255,230,190,.55)"; n.font = `600 ${Math.round(h * .26)}px Georgia, serif`; n.textAlign = "center"; n.fillText("APPLES", x, y - h * .42);
    };
    // goldenrod and tall dried grass along the crest
    const goldenrod = x => { const y = gy(x) + 2, h = 22 + rnd() * 26;
      n.strokeStyle = "#5a4a1e"; n.lineWidth = 1; n.beginPath(); n.moveTo(x, y); n.quadraticCurveTo(x + 2, y - h * .6, x + (rnd() - .5) * 6, y - h); n.stroke();
      for (let k = 0; k < 18; k++) { const u = k / 18, px = x + (rnd() - .5) * 8 * (1 - u) + u * 3, py = y - h * (.62 + u * .4);
        n.fillStyle = rnd() < .5 ? "#f2c43a" : "#d89a1e"; n.beginPath(); n.arc(px, py, 1.1 + rnd() * 1.2, 0, Math.PI * 2); n.fill(); } };
    const dryGrass = x => { const y = gy(x) + 2;
      for (let k = 0; k < 6; k++) { const h = 18 + rnd() * 30, lean = (rnd() - .5) * 14;
        n.strokeStyle = rnd() < .5 ? "rgba(214,170,100,.85)" : "rgba(120,80,40,.85)"; n.lineWidth = .9; n.beginPath(); n.moveTo(x + k, y); n.quadraticCurveTo(x + k + lean * .3, y - h * .6, x + k + lean, y - h); n.stroke();
        n.fillStyle = "rgba(230,190,120,.85)"; n.beginPath(); n.ellipse(x + k + lean, y - h - 3, 1.4, 4, lean * .05, 0, Math.PI * 2); n.fill(); } };
    for (let i = 0, k = Math.round(W / 40); i < k; i++) { const x = rnd() * W; rnd() < .45 ? goldenrod(x) : dryGrass(x); }
    if (wide) { shock(W * .8, 92 * s2); scarecrow(W * .87, clamp(H * .17, 100, 160)); shock(W * .94, 78 * s2); crate(W * .61, 46 * s2); }
    else { shock(W * .66, 56 * s2); scarecrow(W * .89, clamp(H * .11, 72, 100)); crate(W * .52, 34 * s2); }
    bale(wide ? W * .27 : W * .4, 26 * s2);
    bale(wide ? W * .69 : W * .66, 20 * s2);
    pumpkin(tx + TW * .32, 30 * s2, ORANGE); pumpkin(tx + TW * .44, 20 * s2, CREAM); pumpkin(tx + TW * .52, 24 * s2, DEEP);
    pumpkin(wide ? W * .74 : W * .76, 22 * s2, ORANGE); pumpkin(wide ? W * .955 : W * .95, 26 * s2, DEEP);
    L.near = near;

    /* vignette + a soft shade behind the title so the text stays easy to read */
    const vig = mk(W * D, H * D), v = vig.getContext("2d"); v.scale(D, D);
    const vg = v.createRadialGradient(W / 2, H * .45, Math.min(W, H) * .3, W / 2, H * .5, Math.max(W, H) * .85);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(10,4,8,.6)");
    v.fillStyle = vg; v.fillRect(0, 0, W, H);
    const tg = v.createRadialGradient(W / 2, H * .42, 10, W / 2, H * .42, Math.max(W * .55, 260));
    tg.addColorStop(0, "rgba(30,10,24,.34)"); tg.addColorStop(1, "rgba(30,10,24,0)");
    v.fillStyle = tg; v.fillRect(0, 0, W, H);
    L.vig = vig;
    if (NT > 0) buildNight();

    /* moving parts (kept as they are when only the resolution changes, so nothing jumps) */
    if (keep && leaves.length) return;
    const nLeaves = Math.round(clamp(W * H / 24000, 20, 54));
    leaves = []; for (let i = 0; i < nLeaves; i++) leaves.push(newLeaf(true));
    motes = []; for (let i = 0, k = Math.round(clamp(W / 18, 16, 60)); i < k; i++) motes.push({ x: rnd() * W, y: yH - rnd() * H * .45, r: .5 + rnd() * 1.4, p: rnd() * 6.3, v: 3 + rnd() * 6 });
    smoke = [];
    if (!flock || flock.done) flock = null;
    const tsz = clamp(W / 900, .7, 1.15) * 17, ty0 = fy + fd * .74;
    turkeys = [{ x: W * (wide ? .3 : .3), y: ty0, s: tsz * 1.1, dir: 1, tom: true, st: "walk", left: 3, ph: 0 },
               { x: W * (wide ? .25 : .2), y: ty0 + 3, s: tsz * .9, dir: 1, tom: false, st: "walk", left: 1.5, ph: 2 }];
    close = [];
  }

  function newLeaf(anywhere) {
    const fromTree = L && L.tree && rnd() < .45;
    const x = fromTree ? L.tree.x + (rnd() - .5) * L.tree.rx * 1.6 : rnd() * W * 1.15 - W * .1;
    const y = anywhere ? rnd() * H : fromTree ? L.tree.y + (rnd() - .5) * L.tree.ry : -20 - rnd() * 60;
    return { x, y, vy: 22 + rnd() * 30, sway: 12 + rnd() * 26, sf: .6 + rnd() * 1.1, p: rnd() * 6.3, rot: rnd() * 6.3, spin: (rnd() - .5) * 2.6,
      flip: rnd() * 6.3, ff: 1.2 + rnd() * 2.6, s: .55 + rnd() * .75, spr: Math.floor(rnd() * 1e6) };
  }
  function drawLeaf(l, x, y) {
    const nt = NT > .5 && L.nsky, set = l.big && BIG.length ? (nt ? BIG_N : BIG) : (nt ? SPRITES_N : SPRITES), sp = set[l.spr % set.length]; if (!sp) return;
    const big = l.big && BIG.length, w = (big ? sp.width / BIG.k : sp.width / D) * l.s, h = (big ? sp.height / BIG.k : sp.height / D) * l.s, c = Math.cos(l.flip);
    ctx.save(); ctx.translate(x, y); ctx.rotate(l.rot); ctx.scale(c * .85 + (c >= 0 ? .15 : -.15), 1);
    if (l.big) { ctx.shadowColor = "rgba(20,6,2,.35)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4; }   // a soft shadow sells how close it is
    ctx.drawImage(sp, -w / 2, -h / 2, w, h); ctx.restore();
  }
  function newFlock() {
    const n = 7 + Math.floor(rnd() * 4), dir = -1, s = clamp(W / 120, 5, 9);
    const y = H * (.12 + rnd() * .16), birds = [];
    for (let i = 0; i < n; i++) { const k = Math.ceil(i / 2) * (i % 2 ? 1 : -1); birds.push({ ox: Math.abs(k) * s * 3.2, oy: k * s * 2.1, p: rnd() * 6.3 }); }
    if (SND.on) SND.honks();
    return { x: W + 80, y, dir, s, birds, v: 34 + rnd() * 14 };
  }
  function drawGoose(x, y, s, ph) {
    const fl = Math.sin(ph);
    ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1);            // flying left
    ctx.fillStyle = "rgba(38,16,30,.9)"; ctx.strokeStyle = "rgba(38,16,30,.9)"; ctx.lineWidth = s * .28; ctx.lineCap = "round";
    ctx.beginPath(); ctx.ellipse(0, 0, s * .9, s * .26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(s * .7, -s * .05); ctx.lineTo(s * 1.5, -s * .25); ctx.stroke();               // neck
    ctx.beginPath(); ctx.arc(s * 1.58, -s * .28, s * .17, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = s * .22;
    ctx.beginPath(); ctx.moveTo(-s * .1, 0); ctx.quadraticCurveTo(-s * .2, -s * (.7 * fl + .1), -s * .6, -s * (1.5 * fl)); ctx.stroke();   // wings
    ctx.beginPath(); ctx.moveTo(s * .1, 0); ctx.quadraticCurveTo(s * .25, -s * (.6 * fl + .05), -s * .1, -s * (1.35 * fl) + s * .1); ctx.stroke();
    ctx.restore();
  }

  /* ---------- wild turkeys strutting across the field ---------- */
  function drawTurkey(k, x, y, t) {
    const s = k.s, d = k.dir, walk = k.st === "walk", strut = k.st === "strut", peck = k.st === "peck";
    const step = walk ? Math.sin(k.ph) : 0, bob = walk ? Math.abs(Math.sin(k.ph)) * s * .05 : 0;
    ctx.save(); ctx.translate(x, y - bob); ctx.scale(d, 1);
    ctx.fillStyle = "rgba(30,10,4,.35)"; ctx.beginPath(); ctx.ellipse(0, bob + 1, s * 1.1, s * .16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#8a5a2a"; ctx.lineWidth = Math.max(1, s * .08); ctx.lineCap = "round";      // legs
    ctx.beginPath(); ctx.moveTo(-s * .1, -s * .55); ctx.lineTo(-s * .12 + step * s * .25, bob); ctx.moveTo(s * .12, -s * .55); ctx.lineTo(s * .14 - step * s * .25, bob); ctx.stroke();
    // tail: fanned up in a strut, otherwise held low behind. Each feather tapers, with a pale band and a dark tip
    const fr = s * (k.st === "strut" ? 1.6 : .95), fcx = -s * .5, fcy = -s * (k.st === "strut" ? 1.0 : .8), nf = k.st === "strut" ? 17 : 9;
    for (let i = 0; i < nf; i++) {
      const a = k.st === "strut" ? Math.PI * (1.04 + i / (nf - 1) * .92) : Math.PI * (.86 + i / (nf - 1) * .32);
      ctx.save(); ctx.translate(fcx, fcy); ctx.rotate(a);
      const fg2 = ctx.createLinearGradient(0, 0, fr, 0);
      fg2.addColorStop(0, "#2a1408"); fg2.addColorStop(.55, i % 2 ? "#6a3e1c" : "#7a4822"); fg2.addColorStop(.78, "#5a3216"); fg2.addColorStop(.83, "#f0d4a0"); fg2.addColorStop(.9, "#e2b878"); fg2.addColorStop(.94, "#1e0e06"); fg2.addColorStop(1, "#140a04");
      ctx.fillStyle = fg2; ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(fr * .5, -s * .14, fr, -s * .07); ctx.quadraticCurveTo(fr * 1.04, 0, fr, s * .07); ctx.quadraticCurveTo(fr * .5, s * .14, 0, 0); ctx.fill();
      ctx.strokeStyle = "rgba(20,8,2,.5)"; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(fr * .1, 0); ctx.lineTo(fr * .95, 0); ctx.stroke();
      ctx.restore();
    }
    // body, bronze with a rim of sunlight
    const bg = ctx.createRadialGradient(s * .2, -s * 1.0, s * .1, 0, -s * .8, s * 1.1); bg.addColorStop(0, "#8a5a30"); bg.addColorStop(.5, "#4a2c16"); bg.addColorStop(1, "#1e1008");
    ctx.fillStyle = bg; ctx.beginPath(); ctx.ellipse(0, -s * .82, s * (strut ? .78 : .7), s * (strut ? .52 : .44), -.12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(200,150,90,.35)"; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(-s * .1 - i * s * .1, -s * .78 + i * s * .04, s * .28, s * .05, -.2, 0, Math.PI * 2); ctx.fill(); }   // barred wing
    ctx.strokeStyle = "rgba(255,180,110,.45)"; ctx.lineWidth = s * .06; ctx.beginPath(); ctx.ellipse(0, -s * .82, s * .7, s * .44, -.12, -1.2, .2); ctx.stroke();
    // neck and head: up and looking around, or down pecking
    const hx = peck ? s * .78 : s * .62 + (strut ? -s * .1 : 0), hy = peck ? -s * .12 : -s * (1.42 + .03 * Math.sin(t * 3 + k.ph));
    ctx.strokeStyle = "#5a3a2a"; ctx.lineWidth = s * .2; ctx.beginPath(); ctx.moveTo(s * .45, -s * .95); ctx.quadraticCurveTo(s * (peck ? .8 : .72), -s * (peck ? .7 : 1.15), hx, hy); ctx.stroke();
    ctx.fillStyle = "#b8c4d8"; ctx.beginPath(); ctx.arc(hx, hy, s * .14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#d8302a"; ctx.beginPath(); ctx.ellipse(hx + s * .02, hy + s * .2, s * .07, s * .14, 0, 0, Math.PI * 2); ctx.fill();          // wattle
    if (k.tom) { ctx.beginPath(); ctx.ellipse(hx + s * .14, hy + s * .06, s * .04, s * .13, -.3, 0, Math.PI * 2); ctx.fill(); }                   // snood
    ctx.fillStyle = "#e8c070"; ctx.beginPath(); ctx.moveTo(hx + s * .12, hy - s * .03); ctx.lineTo(hx + s * .26, hy + s * .02); ctx.lineTo(hx + s * .12, hy + s * .05); ctx.fill();
    ctx.fillStyle = "#120a06"; ctx.beginPath(); ctx.arc(hx + s * .04, hy - s * .04, s * .03, 0, Math.PI * 2); ctx.fill();
    if (k.tom) { ctx.strokeStyle = "#1a0c06"; ctx.lineWidth = s * .04; ctx.beginPath(); ctx.moveTo(s * .42, -s * .74); ctx.lineTo(s * .46, -s * .45); ctx.stroke(); }   // beard
    ctx.restore();
  }
  function stepTurkey(k, dt) {
    k.left -= dt;
    if (k.st === "walk") { k.x += k.dir * k.s * .9 * dt; k.ph += dt * 7; }
    if (k.left <= 0) {
      const r = Math.random();
      if (k.st !== "walk") { k.st = "walk"; k.left = 3 + Math.random() * 5; }
      else if (r < .45) { k.st = "peck"; k.left = 1.2 + Math.random() * 2.2; }
      else if (k.tom && r < .7) { k.st = "strut"; k.left = 2.5 + Math.random() * 2; }
      else { k.st = "walk"; k.left = 2 + Math.random() * 4; if (Math.random() < .25) k.dir *= -1; }
    }
    if (k.x > W + 40) k.dir = -1; if (k.x < -40) k.dir = 1;
  }

  /* ---------- parallax (mouse on desktop, tilt on phones that allow it) ---------- */
  const par = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener("pointermove", e => { if (e.pointerType === "mouse") { par.tx = e.clientX / innerWidth * 2 - 1; par.ty = e.clientY / innerHeight * 2 - 1; } }, { passive: true });
  addEventListener("deviceorientation", e => { if (e.gamma == null) return; par.tx = clamp(e.gamma / 25, -1, 1); par.ty = clamp((e.beta - 45) / 30, -1, 1); }, { passive: true });
  const PK = () => Math.min(1, W / 1000);                         // gentler on narrow screens
  const shift = k => [par.x * k * PK(), par.y * k * .5 * PK()];

  /* ---------- enter: a swirl of leaves from the button ---------- */
  const swirl = [];
  function burst(x, y) {
    for (let i = 0; i < 46; i++) { const a = Math.random() * Math.PI * 2, v = 120 + Math.random() * 320;
      swirl.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 140, life: 0, max: 1 + Math.random() * .8, rot: Math.random() * 6.3, spin: (Math.random() - .5) * 14,
        flip: Math.random() * 6.3, ff: 4 + Math.random() * 6, s: .7 + Math.random() * .8, spr: Math.floor(Math.random() * 1e6) }); }
    if (SND.on) SND.whoosh();
  }

  /* ---------- sound: autumn wind, leaves, and geese overhead (synthesized, off until turned on) ---------- */
  const SND = { on: false, ac: null, wind: null, rustle: null,
    ctx() { if (!this.ac) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; this.ac = new A(); } if (this.ac.state === "suspended") this.ac.resume(); return this.ac; },
    noise(sec, brown) { const ac = this.ac, b = ac.createBuffer(1, ac.sampleRate * sec, ac.sampleRate), d = b.getChannelData(0); let last = 0;
      for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; if (brown) { last = (last + .02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w * .5; } return b; },
    start() { const ac = this.ctx(); if (!ac) return; this.on = true;
      if (!this.wind) {
        const src = ac.createBufferSource(); src.buffer = this.noise(6, true); src.loop = true;
        const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 620; bp.Q.value = .6;
        const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = .08; lg.gain.value = 300; lfo.connect(lg).connect(bp.frequency); lfo.start();
        const g = ac.createGain(); g.gain.value = 0; src.connect(bp).connect(g).connect(ac.destination); src.start();
        // dry leaves skittering in the gusts
        const r = ac.createBufferSource(); r.buffer = this.noise(4, false); r.loop = true;
        const hp = ac.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2400;
        const rg = ac.createGain(); rg.gain.value = 0; r.connect(hp).connect(rg).connect(ac.destination); r.start();
        this.wind = g; this.rustle = rg;
        this.gustT = setInterval(() => { if (!this.on) return; const t = ac.currentTime, k = .02 + Math.random() * .04;
          rg.gain.cancelScheduledValues(t); rg.gain.setTargetAtTime(k, t, .4); rg.gain.setTargetAtTime(0, t + 1 + Math.random() * 1.5, .6); }, 5200);
      }
      this.wind.gain.setTargetAtTime(.13, ac.currentTime, 1.2);
    },
    stop() { this.on = false; if (this.wind) { this.wind.gain.setTargetAtTime(0, this.ac.currentTime, .3); this.rustle.gain.setTargetAtTime(0, this.ac.currentTime, .2); } },
    honk(at, pitch) { const ac = this.ac; if (!ac) return; const t = ac.currentTime + at;
      const o = ac.createOscillator(), o2 = ac.createOscillator(), bp = ac.createBiquadFilter(), g = ac.createGain();
      o.type = "sawtooth"; o2.type = "square"; o.frequency.setValueAtTime(pitch * 1.12, t); o.frequency.exponentialRampToValueAtTime(pitch, t + .12);
      o2.frequency.setValueAtTime(pitch * 2.02, t); o2.frequency.exponentialRampToValueAtTime(pitch * 1.9, t + .12);
      bp.type = "bandpass"; bp.frequency.value = 1100; bp.Q.value = 2.5;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + .015); g.gain.exponentialRampToValueAtTime(.001, t + .2);
      o.connect(bp); o2.connect(bp); bp.connect(g).connect(ac.destination); o.start(t); o2.start(t); o.stop(t + .22); o2.stop(t + .22); },
    honks() { for (let i = 0, n = 4 + Math.floor(Math.random() * 4); i < n; i++) this.honk(.4 + i * (.35 + Math.random() * .4), 300 + Math.random() * 70); },
    whoosh() { const ac = this.ac; if (!ac) return; const t = ac.currentTime;
      const src = ac.createBufferSource(); src.buffer = this.noise(1.2, false); const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = .9;
      bp.frequency.setValueAtTime(400, t); bp.frequency.exponentialRampToValueAtTime(3200, t + .45);
      const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.35, t + .1); g.gain.exponentialRampToValueAtTime(.001, t + .9);
      src.connect(bp).connect(g).connect(ac.destination); src.start(t); src.stop(t + 1.2); }
  };

  /* ---------- frame ---------- */
  let shown = false, cloudIn = 0;
  let nCheck = 0, last = 0, raf = 0, cloudX = 0, born = 0, nextFlock = 6, smokeT = 0, perf = [], pendingQ = 0;
  function frame(now) {
    if (!gate.isConnected) { SND.stop(); return; }
    if (!born) born = now;
    // a quality change rebuilds and repaints in this same frame, so the canvas is never shown blank
    if (pendingQ) { QMAX = pendingQ; pendingQ = 0; build(true); }
    if (now - nCheck > 1000) { nCheck = now; const n2 = nightAt(); if ((n2 > .5) !== (NT > .5)) { NT = n2; markNight(); } NT = n2; if (NT > 0 && !L.nsky) buildNight(); }
    const N = L.nsky ? NT : 0, DY = 1 - N;
    const t = now / 1000, dt = Math.min(.05, last ? (now - last) / 1000 : 0); last = now;
    par.x += (par.tx - par.x) * Math.min(1, dt * 3); par.y += (par.ty - par.y) * Math.min(1, dt * 3);
    const wind = 14 + 16 * Math.sin(t * .17) + 8 * Math.sin(t * .53);
    ctx.setTransform(D, 0, 0, D, 0, 0);
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
    if (DY > 0) ctx.drawImage(L.sky, 0, 0, W, H);
    if (N > 0) { ctx.globalAlpha = N; ctx.drawImage(L.nsky, 0, 0, W, H); ctx.globalAlpha = 1; }

    // sun with slowly turning rays
    const su = L.sun, [sx, sy] = shift(5), SX = su.x + sx, SY = su.y + sy;
    if (DY > 0) {
      ctx.globalCompositeOperation = "lighter";
      ctx.save(); ctx.translate(SX, SY); ctx.rotate(reduce ? 0 : t * .012); ctx.globalAlpha = (.55 + .1 * Math.sin(t * .4)) * DY;
      ctx.drawImage(L.rays, -L.RS, -L.RS, L.RS * 2, L.RS * 2); ctx.restore(); ctx.globalAlpha = DY;
      ctx.drawImage(L.halo, SX - su.R * 4, SY - su.R * 4, su.R * 8, su.R * 8);
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(L.disc, SX - su.R * 1.1, SY - su.R * 1.1, su.R * 2.2, su.R * 2.2); ctx.globalAlpha = 1;
    }
    // night: twinkling stars, a shooting star now and then, and the full moon
    if (N > 0) {
      ctx.globalCompositeOperation = "lighter";
      for (const st of L.tw) { const a = N * (.35 + .65 * (.5 + .5 * Math.sin(t * st.f + st.p))) * (reduce ? .8 : 1);
        ctx.fillStyle = `rgba(235,240,255,${a})`; ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(200,215,255,${a * .25})`; ctx.fillRect(st.x - st.r * 3, st.y - .3, st.r * 6, .6); ctx.fillRect(st.x - .3, st.y - st.r * 3, .6, st.r * 6); }
      if (!reduce && !star && N > .7 && t > nextStar) { const x0 = W * (.15 + Math.random() * .6), y0 = L.yH * (.05 + Math.random() * .25); star = { x: x0, y: y0, vx: (Math.random() < .5 ? -1 : 1) * (380 + Math.random() * 200), vy: 150 + Math.random() * 80, life: 0, max: .9 }; }
      if (star) { star.life += dt; const k = star.life / star.max;
        if (k >= 1) { star = null; nextStar = t + 14 + Math.random() * 20; }
        else { const x = star.x + star.vx * star.life, y = star.y + star.vy * star.life, a = Math.sin(Math.PI * k) * N, tl = .12;
          const g = ctx.createLinearGradient(x, y, x - star.vx * tl, y - star.vy * tl); g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(1, "rgba(200,215,255,0)");
          ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - star.vx * tl, y - star.vy * tl); ctx.stroke(); } }
      const mo = L.moon, [mx2, my2] = shift(4), MX = mo.x + mx2, MY = mo.y + my2;
      ctx.globalAlpha = N; ctx.drawImage(L.mglow, MX - mo.R * 6, MY - mo.R * 6, mo.R * 12, mo.R * 12);
      ctx.globalCompositeOperation = "source-over"; ctx.drawImage(L.mdisc, MX - mo.R * 1.2, MY - mo.R * 1.2, mo.R * 2.4, mo.R * 2.4); ctx.globalAlpha = 1;
    }

    // clouds drift slowly
    cloudX = (cloudX + dt * 6) % (W * 1.8);
    if (CLOUD) {
      cloudIn = reduce ? 1 : Math.min(1, cloudIn + dt / 1.2);
      const cw = W * 1.8, ch = clamp(H * .2, 110, 220), [cx2, cy2] = shift(9);
      for (const [off, y, a, k] of [[0, H * .06, .62, .7], [W * .7, L.yH - H * .36, .5, 1]]) {
        const x = -((cloudX * k + off) % cw) + cx2;
        if (DY > 0) { ctx.globalAlpha = a * cloudIn * DY; ctx.drawImage(CLOUD, x, y + cy2, cw, ch); ctx.drawImage(CLOUD, x + cw, y + cy2, cw, ch); }
        if (N > 0) { if (!CLOUD_N) CLOUD_N = nightCopy(CLOUD, "#8e9cc6", 1); ctx.globalAlpha = a * cloudIn * N * .8; ctx.drawImage(CLOUD_N, x, y + cy2, cw, ch); ctx.drawImage(CLOUD_N, x + cw, y + cy2, cw, ch); }
      }
      ctx.globalAlpha = 1;
    }

    // geese pass over now and then
    if (!reduce && !flock && t > nextFlock && now - born > 2500) flock = newFlock();
    if (flock) {
      flock.x -= flock.v * dt; const [gx, gy2] = shift(6);
      for (const b of flock.birds) drawGoose(flock.x + b.ox + gx, flock.y + b.oy + Math.sin(t * 1.2 + b.p) * 1.5 + gy2, flock.s, t * 6 + b.p);
      const tail = Math.max(...flock.birds.map(b => b.ox));
      if (flock.x + tail < -60) { flock = null; nextFlock = t + 18 + Math.random() * 14; }
    }

    const sc = Math.max(1.04, 1 + 2 * (30 * PK() + 3) / W), [fxs, fys] = shift(12), [mxs, mys] = shift(20), [nxs, nys] = shift(30);
    const lay = (d, n, ox, oy) => { const a = [-W * (sc - 1) / 2 + ox, -H * (sc - 1) / 2 + oy, W * sc, H * sc];
      if (DY > 0) ctx.drawImage(d, ...a); if (N > 0) { ctx.globalAlpha = N; ctx.drawImage(n, ...a); ctx.globalAlpha = 1; } };
    lay(L.far, L.farN, fxs, fys);
    // the sun's glow spilling over the ridge tops
    ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = .28 * DY;
    if (DY > 0) ctx.drawImage(L.halo, SX - su.R * 5, SY - su.R * 4.4, su.R * 10, su.R * 8.8);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    lay(L.farm, L.farmN, mxs, mys);
    // lit windows, flickering softly like a fire inside
    const P = (x, y, k, ox, oy) => [(x - W / 2) * sc + W / 2 + ox, (y - H / 2) * sc + H / 2 + oy];
    for (const w of L.lights) {
      const fl = .82 + .1 * Math.sin(t * 3.1 + w.x) + .06 * Math.sin(t * 7.7 + w.y);
      const [x, y] = P(w.x, w.y, 1, mxs, mys);
      ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = fl;
      const gw = w.w * (4.8 + 3.5 * N); ctx.drawImage(L.glow, x + w.w / 2 - gw / 2, y + w.h / 2 - gw / 2, gw, gw);
      ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
      ctx.fillStyle = `rgba(255,${200 + 30 * fl},${110 + 40 * fl},1)`; ctx.fillRect(x, y, w.w * sc, w.h * sc);
      if (w.panes) { ctx.fillStyle = "rgba(42,20,26,.9)"; ctx.fillRect(x + w.w * sc / 2 - .6, y, 1.2, w.h * sc); ctx.fillRect(x, y + w.h * sc / 2 - .6, w.w * sc, 1.2); }
    }
    // the porch light comes on after dark and pools on the ground
    if (N > 0 && L.porch) {
      const [x, y] = P(L.porch.x, L.porch.y, 1, mxs, mys), ps = L.porch.s * sc, fl = .94 + .06 * Math.sin(t * 5.3);
      ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = N * fl;
      ctx.drawImage(L.glow, x - 34 * ps, y - 16 * ps, 68 * ps, 50 * ps); ctx.drawImage(L.glow, x - 10 * ps, y - 10 * ps, 20 * ps, 20 * ps);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = `rgba(255,236,190,${N})`; ctx.beginPath(); ctx.arc(x, y, 1.3 * ps, 0, Math.PI * 2); ctx.fill();
    }
    // chimney smoke
    smokeT -= dt;
    if (!reduce && smokeT <= 0 && L.chimney) { smokeT = .32; smoke.push({ x: L.chimney.x, y: L.chimney.y, r: 2.5 * L.chimney.s + 1, life: 0, max: 5 + Math.random() * 2 }); }
    for (let i = smoke.length - 1; i >= 0; i--) {
      const p = smoke[i]; p.life += dt; if (p.life > p.max) { smoke.splice(i, 1); continue; }
      p.y -= 9 * dt; p.x += (wind * .35 + Math.sin(t + i) * 2) * dt; p.r += 2.6 * dt;
      const [x, y] = P(p.x, p.y, 1, mxs, mys), a = .22 * Math.sin(Math.PI * p.life / p.max);
      ctx.fillStyle = `rgba(${214 - 60 * N | 0},${182 - 20 * N | 0},${180 + 10 * N | 0},${a * (1 - .3 * N)})`; ctx.beginPath(); ctx.arc(x, y, p.r, 0, Math.PI * 2); ctx.fill();
    }

    // windmill wheel turning in the breeze
    if (L.mill) {
      const [x, y] = P(L.mill.x, L.mill.y, 1, mxs, mys), r = L.mill.r * sc, a0 = reduce ? 0 : t * (.8 + wind * .02);
      ctx.strokeStyle = "#2a1418"; ctx.lineWidth = Math.max(1, r * .1);
      for (let i = 0; i < 18; i++) { const a = a0 + i / 18 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * .25, y + Math.sin(a) * r * .25); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.stroke(); }
      ctx.lineWidth = Math.max(.8, r * .07); ctx.beginPath(); ctx.arc(x, y, r * .95, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, r * .5, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "#2a1418"; ctx.beginPath(); ctx.arc(x, y, r * .16, 0, Math.PI * 2); ctx.fill();
    }
    // turkeys
    const ta = 1 - ss(.25, .6, N);   // after dark the turkeys have gone to roost
    if (ta > 0) { ctx.globalAlpha = ta; for (const k of turkeys) { if (!reduce) stepTurkey(k, dt); const [x, y] = P(k.x, k.y, 1, mxs, mys); drawTurkey(k, x, y, t); } ctx.globalAlpha = 1; }

    // dust drifting in the low sunlight
    ctx.globalCompositeOperation = "lighter";
    for (const d of motes) {
      if (!reduce) { d.x += (wind * .25) * dt; d.y += Math.sin(t * .7 + d.p) * d.v * dt * .3; if (d.x > W + 10) d.x = -10; }
      const near = 1 - Math.min(1, Math.hypot(d.x - L.sun.x, d.y - L.sun.y) / (W * .55));
      ctx.fillStyle = `rgba(255,214,140,${(.15 + .55 * near) * (.6 + .4 * Math.sin(t * 2 + d.p)) * DY})`;
      ctx.beginPath(); ctx.arc(d.x + mxs, d.y + mys, d.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";

    lay(L.near, L.nearN, nxs, nys);

    // falling leaves (in front of everything but the text)
    for (let i = 0; i < leaves.length; i++) {
      const l = leaves[i];
      if (!reduce) {
        l.y += l.vy * dt * l.s; l.x += (wind + Math.sin(t * l.sf + l.p) * l.sway) * dt; l.rot += l.spin * dt; l.flip += l.ff * dt;
        if (l.y > H + 30 || l.x > W + 60) { leaves[i] = newLeaf(false); continue; }
      }
      drawLeaf(l, l.x + nxs * l.s, l.y + nys * l.s);
    }
    for (let i = swirl.length - 1; i >= 0; i--) {
      const k = swirl[i]; k.life += dt; if (k.life > k.max) { swirl.splice(i, 1); continue; }
      k.vx *= 1 - dt * 1.4; k.vy = k.vy * (1 - dt * 1.4) + 260 * dt; k.x += k.vx * dt; k.y += k.vy * dt; k.rot += k.spin * dt; k.flip += k.ff * dt;
      ctx.globalAlpha = Math.min(1, (k.max - k.life) * 3); drawLeaf(k, k.x, k.y); ctx.globalAlpha = 1;
    }

    // the rope swing, rocking gently
    if (L.swing) {
      const [ax, ay] = P(L.swing.x, L.swing.y, 1, nxs, nys), len = L.swing.len * sc, a = reduce ? 0 : Math.sin(t * 1.25) * .09 + Math.sin(t * .4) * .03;
      const sx = ax + Math.sin(a) * len, sy = ay + Math.cos(a) * len, hw = 16;
      ctx.strokeStyle = N > .5 ? "#6f6c80" : "#c8a46a"; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(ax - hw * .7, ay); ctx.lineTo(sx - hw * Math.cos(a), sy + hw * Math.sin(a)); ctx.moveTo(ax + hw * .7, ay); ctx.lineTo(sx + hw * Math.cos(a), sy - hw * Math.sin(a)); ctx.stroke();
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(-a);
      const pg = ctx.createLinearGradient(0, -3, 0, 4); pg.addColorStop(0, N > .5 ? "#54496a" : "#a8743e"); pg.addColorStop(1, N > .5 ? "#1e1a2c" : "#4a2a12");
      ctx.fillStyle = pg; ctx.fillRect(-hw - 3, -2, hw * 2 + 6, 6); ctx.restore();
    }
    // now and then a big leaf drifts past close to the lens, soft and out of focus
    if (!reduce && Math.random() < dt / 7 && close.length < 2) close.push({ x: -90, y: H * (.15 + Math.random() * .6), vx: 120 + Math.random() * 90, vy: 15 + Math.random() * 40,
      rot: Math.random() * 6.3, spin: (Math.random() - .5) * 2, flip: Math.random() * 6.3, ff: 1.5 + Math.random() * 2, s: 3.2 + Math.random() * 1.6, spr: Math.floor(Math.random() * 1e6), big: true });
    for (let i = close.length - 1; i >= 0; i--) {
      const c = close[i]; c.x += c.vx * dt; c.y += (c.vy + Math.sin(t * 1.4 + i) * 30) * dt; c.rot += c.spin * dt; c.flip += c.ff * dt;
      if (c.x > W + 120) { close.splice(i, 1); continue; }
      drawLeaf(c, c.x, c.y);
    }
    // faint lens flare along the line from the sun through the middle of the screen
    { const fx0 = SX, fy0 = SY, vx2 = W / 2 - fx0, vy2 = H / 2 - fy0, k0 = (.85 + .15 * Math.sin(t * .5)) * DY;
      ctx.globalCompositeOperation = "lighter";
      for (const [u, rr, c] of [[.55, .22, "255,190,120"], [.85, .1, "255,150,180"], [1.25, .34, "255,170,110"], [1.55, .14, "200,170,255"], [1.9, .5, "255,200,140"]]) {
        const x = fx0 + vx2 * u, y = fy0 + vy2 * u, r = L.sun.R * rr * 2;
        const gr = ctx.createRadialGradient(x, y, r * .2, x, y, r); gr.addColorStop(0, `rgba(${c},${.05 * k0})`); gr.addColorStop(.8, `rgba(${c},${.035 * k0})`); gr.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over"; }

    ctx.drawImage(L.vig, 0, 0, W, H);

    // cinematic open: fade up from black
    if (!shown) { shown = true; cv.classList.add("on"); }            // first frame is on the canvas: fade it in over the backdrop

    // keep it smooth: if frames run long, step the resolution down and redraw the layers
    if (now - born > 250 && dt > 0) {
      perf.push(dt * 1000);
      if (perf.length >= 24) { const med = perf.sort((a, b) => a - b)[12]; perf = []; if (med > 22 && D > 1) pendingQ = med > 30 ? 1 : Math.max(1, D - .5); }
    }
    if (!reduce || swirl.length || !CLOUD) raf = requestAnimationFrame(frame);
  }

  function start() { cancelAnimationFrame(raf); build(); last = 0; raf = requestAnimationFrame(frame); }
  let rt = 0;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { if (gate.isConnected) start(); }, 180); });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { if (SND.ac && SND.on) SND.ac.suspend(); return; }
    if (SND.ac && SND.on) SND.ac.resume();
    if (gate.isConnected && !reduce) { cancelAnimationFrame(raf); last = 0; raf = requestAnimationFrame(frame); }
  });
  start();
  document.documentElement.classList.add("tg-painted");

  /* ---------- hooks for the page ---------- */
  const SKEY = "dare-tg-sound";
  const btn = document.getElementById("hwSound");
  const paintBtn = () => { if (btn) { btn.setAttribute("aria-pressed", SND.on); btn.setAttribute("aria-label", SND.on ? "Sound on. Tap to mute." : "Turn on sound"); } };
  function setSound(on) { on ? SND.start() : SND.stop(); try { localStorage.setItem(SKEY, on ? "1" : "0"); } catch (e) {} paintBtn(); }
  if (btn) btn.addEventListener("click", e => { e.stopPropagation(); setSound(!SND.on); });
  let wanted = false; try { wanted = localStorage.getItem(SKEY) === "1"; } catch (e) {}
  if (wanted) { // browsers only allow sound after a tap, so pick it back up on the first one
    const first = () => { removeEventListener("pointerdown", first, true); if (gate.isConnected) setSound(true); };
    addEventListener("pointerdown", first, true);
  }
  paintBtn();
  window.DARETG = {
    burst(el) { const r = el.getBoundingClientRect(), g = gate.getBoundingClientRect(); burst(r.left + r.width / 2 - g.left, r.top + r.height / 2 - g.top); if (reduce) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); } },
    geese() { flock = newFlock(); }
  };
})();
