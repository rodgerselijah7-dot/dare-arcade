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
  function leafSprite(kind, col, S) {
    const c = mk(S * 2.4, S * 2.4), g = c.getContext("2d"); g.translate(S * 1.2, S * 1.15);
    const path = kind === "maple" ? maplePath(S) : oakPath(S);
    const gr = g.createLinearGradient(-S, -S, S, S); gr.addColorStop(0, col[0]); gr.addColorStop(1, col[1]);
    g.fillStyle = gr; g.fill(path);
    g.save(); g.clip(path);
    const sh = g.createRadialGradient(-S * .3, -S * .4, 1, 0, 0, S * 1.2); sh.addColorStop(0, "rgba(255,240,200,.35)"); sh.addColorStop(1, "rgba(60,10,0,.25)");
    g.fillStyle = sh; g.fillRect(-S * 1.2, -S * 1.2, S * 2.4, S * 2.4); g.restore();
    g.strokeStyle = "rgba(70,20,5,.55)"; g.lineWidth = Math.max(.6, S * .06); g.lineCap = "round";
    g.beginPath(); g.moveTo(0, S * .62); g.lineTo(0, -S * .8);
    if (kind === "maple") { g.moveTo(0, S * .1); g.lineTo(-S * .55, -S * .35); g.moveTo(0, S * .1); g.lineTo(S * .55, -S * .35); }
    g.stroke();
    g.beginPath(); g.moveTo(0, S * .55); g.lineTo(S * .05, S * 1.05); g.lineWidth = Math.max(.8, S * .08); g.strokeStyle = "rgba(90,40,10,.9)"; g.stroke();
    return c;
  }
  let SPRITES = [];
  function makeSprites() {
    const S = Math.round(14 * D);
    SPRITES = [];
    for (const col of LEAF_COLORS) { SPRITES.push(leafSprite("maple", col, S)); SPRITES.push(leafSprite("oak", col, S * .9)); }
  }

  /* ---------- per-size layers ---------- */
  let QMAX = 2;
  let W = 0, H = 0, D = 1, L = null, leaves = [], motes = [], smoke = [], flock = null;
  host.style.setProperty("--tg-grain", `url(${grainTex().toDataURL()})`);

  function build() {
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
    dg.fillStyle = dr; dg.beginPath(); dg.arc(R * 1.1, R * 1.1, R, 0, Math.PI * 2); dg.fill();
    L.disc = disc;
    const RS = Math.hypot(Math.max(sun.x, W - sun.x), sun.y) * 1.02, RK = .32, rays = mk(RS * 2 * RK, RS * 2 * RK), rg = rays.getContext("2d"); rg.scale(RK, RK);
    rg.translate(RS, RS);
    for (let i = 0; i < 18; i++) {
      const a = i / 18 * Math.PI * 2 + rnd() * .2, wdt = .035 + rnd() * .06;
      const g2 = rg.createRadialGradient(0, 0, R, 0, 0, RS); g2.addColorStop(0, `rgba(255,220,150,${.10 + rnd() * .08})`); g2.addColorStop(1, "rgba(255,200,120,0)");
      rg.fillStyle = g2; rg.beginPath(); rg.moveTo(0, 0); rg.arc(0, 0, RS, a - wdt, a + wdt); rg.closePath(); rg.fill();
    }
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
    ridge(yH - 4, 22, 1.6, .7, 16, "#b35e66", "#86425a");
    // warm haze on the farthest ridge, strongest near the sun (painted only onto the ridge itself)
    f.globalCompositeOperation = "source-atop";
    const fh = f.createRadialGradient(sun.x, yH, 10, sun.x, yH, W * .7);
    fh.addColorStop(0, "rgba(255,190,120,.6)"); fh.addColorStop(1, "rgba(255,150,100,0)");
    f.fillStyle = fh; f.fillRect(0, 0, W, H);
    f.globalCompositeOperation = "source-over";
    const ridge2 = ridge(yH + 14, 16, 2.4, 2.1, 20, "#74324a", "#4e2139");
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
    const bx = wide ? W * .58 : W * .78, by = fy + fd * .3;          // barn sits back in the field
    // silo
    const sw = 22 * sc, sh = 78 * sc, sx = bx + 64 * sc;
    const sg2 = m.createLinearGradient(sx, 0, sx + sw, 0); sg2.addColorStop(0, "#4b3442"); sg2.addColorStop(.75, "#6a4652"); sg2.addColorStop(1, "#c07a5c");
    m.fillStyle = sg2; m.fillRect(sx, by - sh, sw, sh);
    m.beginPath(); m.ellipse(sx + sw / 2, by - sh, sw / 2, sw * .55, 0, Math.PI, 0); m.fill();
    m.strokeStyle = "rgba(30,15,20,.35)"; m.lineWidth = 1; for (let k = 1; k < 6; k++) { m.beginPath(); m.moveTo(sx, by - sh * k / 6); m.lineTo(sx + sw, by - sh * k / 6); m.stroke(); }
    // barn
    const bw = 66 * sc, bh = 40 * sc, rh = 26 * sc;
    const bg = m.createLinearGradient(bx, 0, bx + bw, 0); bg.addColorStop(0, "#5e1a14"); bg.addColorStop(.7, "#7e2418"); bg.addColorStop(1, "#c4553a");
    m.fillStyle = bg; m.beginPath(); m.moveTo(bx, by); m.lineTo(bx, by - bh); m.lineTo(bx + bw * .18, by - bh - rh * .7); m.lineTo(bx + bw / 2, by - bh - rh);
    m.lineTo(bx + bw * .82, by - bh - rh * .7); m.lineTo(bx + bw, by - bh); m.lineTo(bx + bw, by); m.closePath(); m.fill();
    m.strokeStyle = "#2a0d0a"; m.lineWidth = 3 * sc; m.lineJoin = "round";
    m.beginPath(); m.moveTo(bx - 3 * sc, by - bh + 1); m.lineTo(bx + bw * .18, by - bh - rh * .7); m.lineTo(bx + bw / 2, by - bh - rh); m.lineTo(bx + bw * .82, by - bh - rh * .7); m.lineTo(bx + bw + 3 * sc, by - bh + 1); m.stroke();
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
    L.chimney = { x: hx + hw * .7 + 3 * sc, y: hy - hh - 20 * sc, s: sc };
    L.lights.push({ x: hx + hw * .18, y: hy - hh * .62, w: 8 * sc, h: 8 * sc }, { x: hx + hw * .58, y: hy - hh * .62, w: 8 * sc, h: 8 * sc });
    // fence along the field
    m.strokeStyle = "#2c140c"; m.lineWidth = 2;
    const fenceY = x => fy + fd * .52 + Math.sin(x / W * Math.PI * 1.2 + .4) * 5;
    for (let x = -10; x < W + 20; x += 26) { m.beginPath(); m.moveTo(x, fenceY(x) + 2); m.lineTo(x, fenceY(x) - 12); m.stroke(); }
    m.lineWidth = 1.4; for (const off of [-9, -4]) { m.beginPath(); for (let x = -10; x < W + 20; x += 13) m.lineTo(x, fenceY(x) + off); m.stroke(); }
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
    n.fillStyle = "#1c0c08"; n.beginPath(); n.moveTo(tx - 20, ty + 6); n.quadraticCurveTo(tx - 8, ty - TH * .2, tx - 6, ty - TH * .42); n.lineTo(tx + 10, ty - TH * .42); n.quadraticCurveTo(tx + 12, ty - TH * .2, tx + 26, ty + 6); n.closePath(); n.fill();
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
    n.globalAlpha = 1;
    // a few branch ends poke out under the leaves
    n.strokeStyle = "#1c0c08"; n.lineCap = "round";
    for (const [x, y] of tips) if (rnd() < .3) { n.lineWidth = 1.2; n.beginPath(); n.moveTo(x, y); n.lineTo(x + (rnd() - .5) * 14, y + 6 + rnd() * 8); n.stroke(); }
    L.tree = { x: ccx, y: ccy, rx: crx, ry: cry };
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
      n.strokeStyle = "rgba(255,220,150,.35)"; for (let k = 0; k < 14; k++) { const yy = y - r * .2 - rnd() * r * 1.4; n.beginPath(); n.moveTo(x - r * .9, yy); n.lineTo(x + r * .1, yy + (rnd() - .5) * 3); n.stroke(); }
    };
    const pumpkin = (x, S, hue) => {
      const y = gy(x) + 3, cx = x, cy = y - S * .42;
      for (const [ox, rx] of [[-.34, .3], [.34, .3], [-.16, .36], [.16, .36], [0, .4]]) {
        const gr = n.createRadialGradient(cx + ox * S + rx * S * .3, cy - S * .15, S * .03, cx + ox * S, cy, rx * S * 1.2);
        gr.addColorStop(0, hue[0]); gr.addColorStop(.5, hue[1]); gr.addColorStop(1, hue[2]);
        n.fillStyle = gr; n.beginPath(); n.ellipse(cx + ox * S, cy, rx * S, S * .38, 0, 0, Math.PI * 2); n.fill();
      }
      n.fillStyle = "#4a5a22"; n.beginPath(); n.moveTo(cx - S * .04, cy - S * .34); n.quadraticCurveTo(cx, cy - S * .5, cx + S * .1, cy - S * .55); n.lineTo(cx + S * .12, cy - S * .5); n.quadraticCurveTo(cx + S * .04, cy - S * .44, cx + S * .05, cy - S * .34); n.fill();
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
    if (wide) { shock(W * .8, 96 * s2); shock(W * .9, 78 * s2); }
    else { shock(W * .94, 70 * s2); }
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

    /* moving parts */
    const nLeaves = Math.round(clamp(W * H / 24000, 20, 54));
    leaves = []; for (let i = 0; i < nLeaves; i++) leaves.push(newLeaf(true));
    motes = []; for (let i = 0, k = Math.round(clamp(W / 18, 16, 60)); i < k; i++) motes.push({ x: rnd() * W, y: yH - rnd() * H * .45, r: .5 + rnd() * 1.4, p: rnd() * 6.3, v: 3 + rnd() * 6 });
    smoke = [];
    if (!flock || flock.done) flock = null;
  }

  function newLeaf(anywhere) {
    const fromTree = L && L.tree && rnd() < .45;
    const x = fromTree ? L.tree.x + (rnd() - .5) * L.tree.rx * 1.6 : rnd() * W * 1.15 - W * .1;
    const y = anywhere ? rnd() * H : fromTree ? L.tree.y + (rnd() - .5) * L.tree.ry : -20 - rnd() * 60;
    return { x, y, vy: 22 + rnd() * 30, sway: 12 + rnd() * 26, sf: .6 + rnd() * 1.1, p: rnd() * 6.3, rot: rnd() * 6.3, spin: (rnd() - .5) * 2.6,
      flip: rnd() * 6.3, ff: 1.2 + rnd() * 2.6, s: .55 + rnd() * .75, spr: Math.floor(rnd() * 1e6) };
  }
  function drawLeaf(l, x, y) {
    const sp = SPRITES[l.spr % SPRITES.length]; if (!sp) return;
    const w = sp.width / D * l.s, h = sp.height / D * l.s;
    ctx.save(); ctx.translate(x, y); ctx.rotate(l.rot); ctx.scale(Math.cos(l.flip) * .85 + (Math.cos(l.flip) >= 0 ? .15 : -.15), 1);
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

  /* ---------- parallax (mouse on desktop, tilt on phones that allow it) ---------- */
  const par = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener("pointermove", e => { if (e.pointerType === "mouse") { par.tx = e.clientX / innerWidth * 2 - 1; par.ty = e.clientY / innerHeight * 2 - 1; } }, { passive: true });
  addEventListener("deviceorientation", e => { if (e.gamma == null) return; par.tx = clamp(e.gamma / 25, -1, 1); par.ty = clamp((e.beta - 45) / 30, -1, 1); }, { passive: true });
  const shift = k => [par.x * k, par.y * k * .5];

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
  let last = 0, raf = 0, cloudX = 0, born = 0, nextFlock = 6, smokeT = 0, perf = [];
  function frame(now) {
    if (!gate.isConnected) { SND.stop(); return; }
    if (!born) born = now;
    const t = now / 1000, dt = Math.min(.05, last ? (now - last) / 1000 : 0); last = now;
    par.x += (par.tx - par.x) * Math.min(1, dt * 3); par.y += (par.ty - par.y) * Math.min(1, dt * 3);
    const wind = 14 + 16 * Math.sin(t * .17) + 8 * Math.sin(t * .53);
    ctx.setTransform(D, 0, 0, D, 0, 0);
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
    ctx.drawImage(L.sky, 0, 0, W, H);

    // sun with slowly turning rays
    const su = L.sun, [sx, sy] = shift(5), SX = su.x + sx, SY = su.y + sy;
    ctx.globalCompositeOperation = "lighter";
    ctx.save(); ctx.translate(SX, SY); ctx.rotate(reduce ? 0 : t * .012); ctx.globalAlpha = .55 + .1 * Math.sin(t * .4);
    ctx.drawImage(L.rays, -L.RS, -L.RS, L.RS * 2, L.RS * 2); ctx.restore(); ctx.globalAlpha = 1;
    ctx.drawImage(L.halo, SX - su.R * 4, SY - su.R * 4, su.R * 8, su.R * 8);
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(L.disc, SX - su.R * 1.1, SY - su.R * 1.1, su.R * 2.2, su.R * 2.2);

    // clouds drift slowly
    cloudX = (cloudX + dt * 6) % (W * 1.8);
    if (CLOUD) {
      const cw = W * 1.8, ch = clamp(H * .2, 110, 220), [cx2, cy2] = shift(9);
      for (const [off, y, a, k] of [[0, H * .06, .62, .7], [W * .7, L.yH - H * .36, .5, 1]]) {
        const x = -((cloudX * k + off) % cw) + cx2;
        ctx.globalAlpha = a; ctx.drawImage(CLOUD, x, y + cy2, cw, ch); ctx.drawImage(CLOUD, x + cw, y + cy2, cw, ch);
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

    const sc = 1.04, [fxs, fys] = shift(12), [mxs, mys] = shift(20), [nxs, nys] = shift(30);
    ctx.drawImage(L.far, -W * .02 + fxs, -H * .02 + fys, W * sc, H * sc);
    ctx.drawImage(L.farm, -W * .02 + mxs, -H * .02 + mys, W * sc, H * sc);
    // lit windows, flickering softly like a fire inside
    const P = (x, y, k, ox, oy) => [(x - W / 2) * sc + W / 2 + ox, (y - H / 2) * sc + H / 2 + oy];
    for (const w of L.lights) {
      const fl = .82 + .1 * Math.sin(t * 3.1 + w.x) + .06 * Math.sin(t * 7.7 + w.y);
      const [x, y] = P(w.x, w.y, 1, mxs, mys);
      ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = fl;
      const gw = w.w * 4.8; ctx.drawImage(L.glow, x + w.w / 2 - gw / 2, y + w.h / 2 - gw / 2, gw, gw);
      ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
      ctx.fillStyle = `rgba(255,${200 + 30 * fl},${110 + 40 * fl},1)`; ctx.fillRect(x, y, w.w * sc, w.h * sc);
    }
    // chimney smoke
    smokeT -= dt;
    if (!reduce && smokeT <= 0 && L.chimney) { smokeT = .32; smoke.push({ x: L.chimney.x, y: L.chimney.y, r: 2.5 * L.chimney.s + 1, life: 0, max: 5 + Math.random() * 2 }); }
    for (let i = smoke.length - 1; i >= 0; i--) {
      const p = smoke[i]; p.life += dt; if (p.life > p.max) { smoke.splice(i, 1); continue; }
      p.y -= 9 * dt; p.x += (wind * .35 + Math.sin(t + i) * 2) * dt; p.r += 2.6 * dt;
      const [x, y] = P(p.x, p.y, 1, mxs, mys), a = .22 * Math.sin(Math.PI * p.life / p.max);
      ctx.fillStyle = `rgba(214,182,180,${a})`; ctx.beginPath(); ctx.arc(x, y, p.r, 0, Math.PI * 2); ctx.fill();
    }

    // dust drifting in the low sunlight
    ctx.globalCompositeOperation = "lighter";
    for (const d of motes) {
      if (!reduce) { d.x += (wind * .25) * dt; d.y += Math.sin(t * .7 + d.p) * d.v * dt * .3; if (d.x > W + 10) d.x = -10; }
      const near = 1 - Math.min(1, Math.hypot(d.x - L.sun.x, d.y - L.sun.y) / (W * .55));
      ctx.fillStyle = `rgba(255,214,140,${(.15 + .55 * near) * (.6 + .4 * Math.sin(t * 2 + d.p))})`;
      ctx.beginPath(); ctx.arc(d.x + mxs, d.y + mys, d.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";

    ctx.drawImage(L.near, -W * .02 + nxs, -H * .02 + nys, W * sc, H * sc);

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

    ctx.drawImage(L.vig, 0, 0, W, H);

    // cinematic open: fade up from black
    const intro = reduce ? 1 : Math.min(1, (now - born) / 1600);
    if (intro < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - intro * intro * (3 - 2 * intro)})`; ctx.fillRect(0, 0, W, H); }

    // keep it smooth: if frames run long, step the resolution down and redraw the layers
    if (now - born > 1200 && dt > 0) {
      perf.push(dt * 1000);
      if (perf.length >= 30) { const med = perf.sort((a, b) => a - b)[15]; perf = []; if (med > 22 && D > 1) { QMAX = Math.max(1, D - .5); build(); } }
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
