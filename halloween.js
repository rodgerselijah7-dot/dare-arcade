/* DARE Arcade · Halloween enter page scene
   Painted on one canvas at up to 2x pixel density. Static layers (sky, moon, clouds, fog, graveyard, pumpkins,
   vignette, grain) are rendered once per screen size into offscreen canvases; each frame only composites them and
   draws the moving parts (twinkling stars, drifting clouds and fog, bats, pumpkin flicker, embers).
   Loaded by index.html only when the enter page is showing in Halloween season. Stops when the gate closes. */
(function () {
  const gate = document.getElementById("gate"), host = gate && gate.querySelector(".hw");
  if (!host) return;
  const cv = document.createElement("canvas");
  cv.className = "hw-cv"; cv.setAttribute("aria-hidden", "true");
  host.prepend(cv);
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- seeded randomness + value noise ---------- */
  let seed = 31102026;
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
  const mk = (w, h) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };

  /* ---------- textures that don't depend on screen size (built once) ---------- */
  /* ---------- noise textures, made off the main thread so the page never freezes while it opens ----------
     TEX_SRC runs inside a Web Worker (or, if workers fail, on the main thread a moment after the first frame).
     Each function returns raw RGBA pixels. */
  const TEX_SRC = `
  let seed = 7770031;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  function noise2(P) {
    const g = new Float32Array(P * P); for (let i = 0; i < g.length; i++) g[i] = rnd();
    const w = n => ((n % P) + P) % P, sm = t => t * t * (3 - 2 * t);
    return (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), u = sm(x - xi), v = sm(y - yi);
      const x0 = w(xi), x1 = w(xi + 1), y0 = w(yi) * P, y1 = w(yi + 1) * P;
      const a = g[y0 + x0], b = g[y0 + x1], c = g[y1 + x0], d = g[y1 + x1];
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
  }
  const fbm = (n, x, y, o) => { let s = 0, a = .5, f = 1, t = 0; for (let i = 0; i < o; i++) { s += a * n(x * f, y * f); t += a; a *= .5; f *= 2; } return s / t; };
  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function cloudPx(w, h) { // soft cumulus band, tiles horizontally
    const d = new Uint8ClampedArray(w * h * 4), n = noise2(12);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = y / h, f = fbm(n, x / w * 12, v * 4, 6), a = ss(.46, .78, f) * Math.sin(Math.PI * v) ** 1.4, shade = .55 + .45 * (1 - v) * f, i = (y * w + x) * 4;
      d[i] = 120 + 70 * shade; d[i + 1] = 108 + 62 * shade; d[i + 2] = 150 + 70 * shade; d[i + 3] = 255 * a;
    }
    return d;
  }
  function fogPx(w, h) { // low ground fog, tiles horizontally
    const d = new Uint8ClampedArray(w * h * 4), n = noise2(8);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = y / h, f = fbm(n, x / w * 8, v * 2.5, 5), a = ss(.3, .82, f) * Math.sin(Math.PI * v) ** 1.2, i = (y * w + x) * 4;
      d[i] = 176; d[i + 1] = 166; d[i + 2] = 206; d[i + 3] = 255 * a;
    }
    return d;
  }
  function moonPx(R) { // a lit full moon: dark seas, craters with rims, limb darkening, anti-aliased edge
    seed = 4242; const s = Math.ceil(R * 2) + 2, d = new Uint8ClampedArray(s * s * 4), big = noise2(16), fine = noise2(64), cr = [];
    for (let i = 0; i < 34; i++) { const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * .96; cr.push([Math.cos(a) * r, Math.sin(a) * r, rnd() ** 2.6 * .15 + .016]); }
    cr.push([-.18, .52, .1], [.38, -.22, .07], [-.45, -.4, .05]);
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const nx = (x + .5 - 1) / R - 1, ny = (y + .5 - 1) / R - 1, rr = nx * nx + ny * ny, i = (y * s + x) * 4;
      if (rr >= 1) continue;
      const nz = Math.sqrt(1 - rr), m = fbm(big, nx * 2.1 + 4.3, ny * 2.1 + 1.7, 4);
      let alb = 1.02 - ss(.48, .64, m) * .22 + (fbm(fine, nx * 9 + 2, ny * 9 + 5, 3) - .5) * .08;
      for (const [cx, cy, r0] of cr) {
        const dx = nx - cx, dy = ny - cy, q = Math.sqrt(dx * dx + dy * dy) / r0;
        if (q < 1) alb += -.05 * (1 - q * q) + .08 * q ** 3 * Math.max(0, (dx + dy) / (r0 * 1.4));
        else if (q < 1.4) alb += .03 * (1.4 - q) / .4;
      }
      const lit = .62 + .38 * Math.pow(nz, .45), v = Math.max(0, Math.min(1.05, alb * lit)), edge = Math.min(1, (1 - Math.sqrt(rr)) * R);
      d[i] = 255 * v; d[i + 1] = 240 * v; d[i + 2] = 200 * v; d[i + 3] = 255 * edge;
    }
    return { d, s };
  }`;
  const toCanvas = (d, w, h) => { const c = mk(w, h); c.getContext("2d").putImageData(new ImageData(d, w, h), 0, 0); return c; };
  let CLOUD = null, FOG = null;
  const TEX = { worker: null, local: null, wait: {} , id: 0 };
  function texJob(kind, args, done) {
    const id = ++TEX.id; TEX.wait[id] = done;
    try {
      if (!TEX.worker && TEX.worker !== false) {
        const url = URL.createObjectURL(new Blob([TEX_SRC + `
          onmessage = e => { const { id, kind, args } = e.data;
            if (kind === "moon") { const r = moonPx(args[0]); postMessage({ id, d: r.d, w: r.s, h: r.s }, [r.d.buffer]); }
            else { const d = (kind === "cloud" ? cloudPx : fogPx)(args[0], args[1]); postMessage({ id, d, w: args[0], h: args[1] }, [d.buffer]); } };`], { type: "text/javascript" }));
        TEX.worker = new Worker(url);
        TEX.worker.onmessage = e => { const f = TEX.wait[e.data.id]; delete TEX.wait[e.data.id]; if (f) f(toCanvas(e.data.d, e.data.w, e.data.h)); };
        TEX.worker.onerror = () => { TEX.worker = false; };
      }
      if (TEX.worker) { TEX.worker.postMessage({ id, kind, args }); return; }
    } catch (e) { TEX.worker = false; }
    setTimeout(() => { // no worker: make it here, after the first frames are on screen
      TEX.local = TEX.local || new Function(TEX_SRC + "; return { cloudPx, fogPx, moonPx };")();
      if (kind === "moon") { const r = TEX.local.moonPx(args[0]); done(toCanvas(r.d, r.s, r.s)); }
      else done(toCanvas((kind === "cloud" ? TEX.local.cloudPx : TEX.local.fogPx)(args[0], args[1]), args[0], args[1]));
    }, 400);
  }
  function grainTex() {
    const s = 192, c = mk(s, s), g = c.getContext("2d"), im = g.createImageData(s, s), d = im.data;
    for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    g.putImageData(im, 0, 0); return c;
  }
  function pumpkinTex(S) { // returns {body, face}: the carved pumpkin, and its glowing cutouts to draw with a flicker
    const w = S * 1.25, h = S, body = mk(w, h * 1.12), g = body.getContext("2d"), cx = w / 2, cy = h * .62;
    const lobes = [[-.38, .3], [.38, .3], [-.2, .38], [.2, .38], [0, .42]];
    for (const [ox, rx] of lobes) {
      const gr = g.createRadialGradient(cx + ox * S - rx * S * .25, cy - S * .18, S * .04, cx + ox * S, cy, rx * S * 1.15);
      gr.addColorStop(0, "#ffb15a"); gr.addColorStop(.45, "#f07418"); gr.addColorStop(.85, "#a8420a"); gr.addColorStop(1, "#5a2004");
      g.fillStyle = gr; g.beginPath(); g.ellipse(cx + ox * S, cy, rx * S, S * .4, 0, 0, Math.PI * 2); g.fill();
    }
    g.strokeStyle = "rgba(90,30,4,.55)"; g.lineWidth = S * .012;
    for (const ox of [-.29, -.1, .1, .29]) { g.beginPath(); g.moveTo(cx + ox * S * .8, cy - S * .37); g.quadraticCurveTo(cx + ox * S * 1.25, cy, cx + ox * S * .8, cy + S * .37); g.stroke(); }
    const st = g.createLinearGradient(cx, cy - S * .55, cx, cy - S * .33); st.addColorStop(0, "#6b8a35"); st.addColorStop(1, "#2f4416");
    g.fillStyle = st; g.beginPath(); g.moveTo(cx - S * .05, cy - S * .36); g.quadraticCurveTo(cx - S * .02, cy - S * .5, cx + S * .1, cy - S * .58);
    g.lineTo(cx + S * .13, cy - S * .53); g.quadraticCurveTo(cx + S * .05, cy - S * .46, cx + S * .05, cy - S * .36); g.closePath(); g.fill();
    g.fillStyle = "rgba(255,230,190,.16)"; g.beginPath(); g.ellipse(cx - S * .18, cy - S * .2, S * .08, S * .14, -.4, 0, Math.PI * 2); g.fill();
    const face = new Path2D();
    face.moveTo(cx - S * .26, cy - S * .03); face.lineTo(cx - S * .12, cy - S * .2); face.lineTo(cx - S * .04, cy - S * .02); face.closePath();
    face.moveTo(cx + S * .26, cy - S * .03); face.lineTo(cx + S * .12, cy - S * .2); face.lineTo(cx + S * .04, cy - S * .02); face.closePath();
    face.moveTo(cx - S * .04, cy + S * .07); face.lineTo(cx, cy + S * .01); face.lineTo(cx + S * .04, cy + S * .07); face.closePath();
    face.moveTo(cx - S * .3, cy + S * .1);
    face.quadraticCurveTo(cx, cy + S * .36, cx + S * .3, cy + S * .1);
    face.lineTo(cx + S * .22, cy + S * .2); face.lineTo(cx + S * .16, cy + S * .14); face.lineTo(cx + S * .1, cy + S * .23); face.lineTo(cx + S * .03, cy + S * .17);
    face.lineTo(cx - S * .03, cy + S * .25); face.lineTo(cx - S * .1, cy + S * .17); face.lineTo(cx - S * .16, cy + S * .23); face.lineTo(cx - S * .22, cy + S * .14);
    face.closePath();
    g.fillStyle = "#1a0700"; g.fill(face);
    const lit = mk(w, h * 1.12), l = lit.getContext("2d");
    const fg = l.createRadialGradient(cx, cy + S * .05, S * .02, cx, cy + S * .05, S * .4); fg.addColorStop(0, "#fffbe0"); fg.addColorStop(.45, "#ffd660"); fg.addColorStop(1, "#ff8a1a");
    l.shadowColor = "#ffb030"; l.shadowBlur = S * .12; l.fillStyle = fg; l.fill(face);
    return { body, face: lit, w, h: h * 1.12 };
  }

  /* ---------- per-size layers ---------- */
  let QMAX = 2;                      // resolution cap; lowered on the fly if a phone can't keep the scene smooth
  let W = 0, H = 0, D = 1, L = null, stars = [], bats = [], embers = [], pumpkins = [];
  host.style.setProperty("--hw-grain", `url(${grainTex().toDataURL()})`);   // film grain runs as a GPU-composited CSS layer
  texJob("cloud", [768, 256], c => { CLOUD = c; });
  texJob("fog", [640, 160], c => { FOG = c; });

  function build() {
    const prevMoon = L && L.moonTex;
    W = gate.clientWidth; H = gate.clientHeight; D = Math.min(QMAX, window.devicePixelRatio || 1);
    cv.width = Math.round(W * D); cv.height = Math.round(H * D);
    seed = 31102026;
    const yG = H - Math.min(150, Math.max(92, H * .15));          // ground line
    const R = Math.min(96, Math.max(44, W * .13));
    const moon = { x: W - Math.max(72, W * .19), y: W > 700 ? Math.max(150, H * .21) : Math.max(110, H * .16), R };
    L = { yG, moon };

    // sky
    const sky = mk(W * D, H * D), s = sky.getContext("2d"); s.scale(D, D);
    const sg = s.createLinearGradient(0, 0, 0, H);
    sg.addColorStop(0, "#07040f"); sg.addColorStop(.35, "#150a27"); sg.addColorStop(.68, "#2a1338"); sg.addColorStop(.86, "#3d1a33"); sg.addColorStop(1, "#1a0a12");
    s.fillStyle = sg; s.fillRect(0, 0, W, H);
    const hz = s.createRadialGradient(W * .5, yG + 30, 10, W * .5, yG + 30, Math.max(W, H) * .6);
    hz.addColorStop(0, "rgba(255,120,40,.30)"); hz.addColorStop(.35, "rgba(200,70,90,.12)"); hz.addColorStop(1, "rgba(0,0,0,0)");
    s.fillStyle = hz; s.fillRect(0, 0, W, H);
    const mg = s.createRadialGradient(moon.x, moon.y, R * .9, moon.x, moon.y, R * 6);
    mg.addColorStop(0, "rgba(255,226,170,.30)"); mg.addColorStop(.25, "rgba(200,170,230,.10)"); mg.addColorStop(1, "rgba(0,0,0,0)");
    s.fillStyle = mg; s.fillRect(0, 0, W, H);
    L.sky = sky;
    L.moonTex = prevMoon; { const mine = L; texJob("moon", [R * D], c => { mine.moonTex = c; }); }   // keep the old moon on screen until the new one is ready

    // stars (none near the moon or below the treeline)
    stars = [];
    const ns = Math.round(W * H / 2600);
    for (let i = 0; i < ns; i++) {
      const x = rnd() * W, y = rnd() * (yG - 60);
      if (Math.hypot(x - moon.x, y - moon.y) < R * 2.2) continue;
      stars.push({ x, y, r: rnd() ** 3 * 1.3 + .35, a: .35 + rnd() * .6, f: .6 + rnd() * 2.2, p: rnd() * 6.3, warm: rnd() < .15 });
    }

    // far treeline + hills (lit purple, sits in the haze)
    const far = mk(W * D, H * D), f = far.getContext("2d"); f.scale(D, D);
    const tn = noise2(32);
    f.fillStyle = "#1b0e26"; f.beginPath(); f.moveTo(0, H);
    for (let x = 0; x <= W; x += 3) {
      const base = yG - 22 - Math.sin(x / W * Math.PI * 1.3 + .6) * 16;
      const tree = Math.pow(fbm(tn, x / 26, 3.3, 4), 2.2) * 48 + (fbm(tn, x / 6, 9.1, 2) - .5) * 9;
      f.lineTo(x, base - tree);
    }
    f.lineTo(W, H); f.closePath(); f.fill();
    // a far chapel on the hill
    const chx = W * .7, chy = yG - 26;
    f.fillStyle = "#170b21";
    f.fillRect(chx, chy - 30, 34, 30); f.beginPath(); f.moveTo(chx - 3, chy - 30); f.lineTo(chx + 17, chy - 46); f.lineTo(chx + 37, chy - 30); f.fill();
    f.fillRect(chx + 24, chy - 62, 9, 32); f.beginPath(); f.moveTo(chx + 22, chy - 62); f.lineTo(chx + 28.5, chy - 80); f.lineTo(chx + 35, chy - 62); f.fill();
    f.fillStyle = "rgba(255,170,70,.75)"; f.fillRect(chx + 8, chy - 20, 4, 7); f.fillRect(chx + 18, chy - 20, 4, 7);
    const haze = f.createLinearGradient(0, yG - 90, 0, yG + 10); haze.addColorStop(0, "rgba(120,80,160,0)"); haze.addColorStop(1, "rgba(120,80,160,.28)");
    f.fillStyle = haze; f.fillRect(0, yG - 90, W, 100);
    L.far = far;

    // near graveyard: hill, gnarled tree, headstones, fence, grass (moon-rimmed silhouettes)
    const near = mk(W * D, H * D), n = near.getContext("2d"); n.scale(D, D);
    const ink = "#040207", rim = "rgba(196,170,235,.32)";
    const hill = x => yG + 8 - Math.sin(x / W * Math.PI * 2 + .4) * 10 - Math.sin(x / W * Math.PI * 5.2) * 4;
    n.fillStyle = ink; n.beginPath(); n.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) n.lineTo(x, hill(x)); n.lineTo(W, H); n.closePath(); n.fill();
    n.strokeStyle = "rgba(170,140,220,.22)"; n.lineWidth = 1.2; n.beginPath();
    for (let x = 0; x <= W; x += 4) x ? n.lineTo(x, hill(x)) : n.moveTo(x, hill(x)); n.stroke();

    // tree
    const tx = Math.max(22, W * .06), th = Math.min(H * .32, 300, W * .48);
    n.strokeStyle = ink; n.lineCap = "round";
    function branch(x, y, len, ang, wdt, depth) {
      const segs = 4; let px = x, py = y, a = ang;
      n.lineWidth = wdt; n.beginPath(); n.moveTo(px, py);
      for (let i = 0; i < segs; i++) { a += (rnd() - .5) * .5; px += Math.cos(a) * len / segs; py += Math.sin(a) * len / segs; n.lineTo(px, py); }
      n.stroke();
      if (depth <= 0 || wdt < .7) return;
      const kids = 2 + (rnd() < .45 ? 1 : 0);
      for (let k = 0; k < kids; k++) branch(px, py, len * (.62 + rnd() * .18), a + (k - (kids - 1) / 2) * (.55 + rnd() * .35) + (rnd() - .5) * .3, wdt * .62, depth - 1);
    }
    const root = hill(tx);
    n.fillStyle = ink; n.beginPath(); n.moveTo(tx - th * .09, root + 4); n.quadraticCurveTo(tx - th * .02, root - th * .1, tx - th * .02, root - th * .25);
    n.lineTo(tx + th * .03, root - th * .25); n.quadraticCurveTo(tx + th * .04, root - th * .1, tx + th * .12, root + 4); n.fill();
    branch(tx, root - th * .22, th * .34, -Math.PI / 2 + .12, th * .055, 6);
    branch(tx, root - th * .3, th * .28, -Math.PI / 2 + .9, th * .035, 5);
    branch(tx, root - th * .26, th * .22, -Math.PI / 2 - .7, th * .03, 4);

    // headstones
    const stones = [];
    const count = Math.max(4, Math.round(W / 120));
    for (let i = 0; i < count; i++) {
      const x = W * (.2 + .62 * (i + rnd() * .6) / count);
      if (Math.abs(x - W / 2) < Math.min(130, W * .2)) continue;              // keep the middle clear for the Enter button
      stones.push({ x, kind: Math.floor(rnd() * 4), s: (.7 + rnd() * .5) * Math.min(1.25, Math.max(.8, W / 700)), tilt: (rnd() - .5) * .14 });
    }
    for (const st of stones) {
      const y = hill(st.x) + 3, s2 = st.s;
      n.save(); n.translate(st.x, y); n.rotate(st.tilt);
      const p = new Path2D();
      if (st.kind === 0) { p.moveTo(-11 * s2, 0); p.lineTo(-11 * s2, -22 * s2); p.arc(0, -22 * s2, 11 * s2, Math.PI, 0); p.lineTo(11 * s2, 0); p.closePath(); }
      else if (st.kind === 1) { p.rect(-3 * s2, -40 * s2, 6 * s2, 40 * s2); p.rect(-12 * s2, -31 * s2, 24 * s2, 6 * s2); }
      else if (st.kind === 2) { p.moveTo(-6 * s2, 0); p.lineTo(-4 * s2, -42 * s2); p.lineTo(0, -50 * s2); p.lineTo(4 * s2, -42 * s2); p.lineTo(6 * s2, 0); p.closePath(); }
      else { p.moveTo(-13 * s2, 0); p.lineTo(-13 * s2, -20 * s2); p.quadraticCurveTo(-13 * s2, -30 * s2, -4 * s2, -31 * s2); p.lineTo(4 * s2, -31 * s2); p.quadraticCurveTo(13 * s2, -30 * s2, 13 * s2, -20 * s2); p.lineTo(13 * s2, 0); p.closePath(); }
      n.fillStyle = "#0b0812"; n.fill(p);
      n.save(); n.clip(p);
      const lg = n.createLinearGradient(15 * s2, -40 * s2, -10 * s2, 0); lg.addColorStop(0, "rgba(150,135,185,.38)"); lg.addColorStop(.5, "rgba(60,50,80,.12)"); lg.addColorStop(1, "rgba(0,0,0,0)");
      n.fillStyle = lg; n.fillRect(-20 * s2, -55 * s2, 40 * s2, 60 * s2);
      n.strokeStyle = "rgba(0,0,0,.35)"; n.lineWidth = .8;
      for (let k = 0; k < 3; k++) { n.beginPath(); n.moveTo(-6 * s2, (-16 + k * 5) * s2); n.lineTo(6 * s2, (-16 + k * 5) * s2); n.stroke(); }
      n.restore();
      n.strokeStyle = rim; n.lineWidth = 1; n.stroke(p);
      n.restore();
    }

    // iron fence on the right
    const fx0 = W * .74, fx1 = W * .98, fy = x => hill(x) + 2, fh = Math.min(46, H * .05);
    n.strokeStyle = ink; n.fillStyle = ink; n.lineWidth = 2.2;
    n.beginPath(); n.moveTo(fx0, fy(fx0) - fh * .78); n.lineTo(fx1, fy(fx1) - fh * .78); n.moveTo(fx0, fy(fx0) - fh * .22); n.lineTo(fx1, fy(fx1) - fh * .22); n.stroke();
    for (let x = fx0; x <= fx1; x += 11) {
      const y = fy(x); n.lineWidth = 2; n.beginPath(); n.moveTo(x, y); n.lineTo(x, y - fh); n.stroke();
      n.beginPath(); n.moveTo(x - 3.5, y - fh); n.lineTo(x, y - fh - 8); n.lineTo(x + 3.5, y - fh); n.closePath(); n.fill();
    }
    // grass along the crest
    n.strokeStyle = ink; n.lineWidth = 1.1;
    for (let x = 0; x < W; x += 2.2) {
      if (rnd() < .35) continue;
      const y = hill(x) + 3, hgt = 3 + rnd() ** 2 * 11; n.beginPath(); n.moveTo(x, y); n.quadraticCurveTo(x + (rnd() - .5) * 4, y - hgt * .6, x + (rnd() - .5) * 6, y - hgt); n.stroke();
    }
    L.near = near; L.hill = hill;

    // pumpkins
    const PS = Math.min(110, Math.max(58, W * .15));
    pumpkins = [
      { x: Math.max(PS * .7, W * .14), s: PS, ph: 0 },
      { x: W - Math.max(PS * .6, W * .12), s: PS * .76, ph: 2.1 }
    ].map(p => Object.assign(p, { tex: pumpkinTex(p.s * D), y: hill(p.x) + p.s * .2 }));

    // vignette
    const vig = mk(W * D, H * D), v = vig.getContext("2d"); v.scale(D, D);
    const vg = v.createRadialGradient(W / 2, H * .45, Math.min(W, H) * .35, W / 2, H * .5, Math.max(W, H) * .85);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.62)");
    v.fillStyle = vg; v.fillRect(0, 0, W, H);
    const tg = v.createRadialGradient(W / 2, H * .45, 10, W / 2, H * .45, Math.min(W, H) * .62);   // soft shade behind the title
    tg.addColorStop(0, "rgba(6,2,12,.38)"); tg.addColorStop(1, "rgba(6,2,12,0)");
    v.fillStyle = tg; v.fillRect(0, 0, W, H);
    L.vig = vig;
    // moon halo, drawn once
    const hs = R * 6, halo = mk(hs * D, hs * D), hg = halo.getContext("2d"); hg.scale(D, D);
    const hgr = hg.createRadialGradient(hs / 2, hs / 2, R * .95, hs / 2, hs / 2, R * 2.6);
    hgr.addColorStop(0, "rgba(255,225,160,.35)"); hgr.addColorStop(.4, "rgba(255,200,140,.08)"); hgr.addColorStop(1, "rgba(0,0,0,0)");
    hg.fillStyle = hgr; hg.fillRect(0, 0, hs, hs);
    L.halo = halo;

    // bats and embers
    bats = Array.from({ length: W > 700 ? 9 : 6 }, (_, i) => ({ x: rnd() * W, y: H * (.08 + rnd() * .38), s: 10 + rnd() ** 2 * 18, v: 24 + rnd() * 40, f: 7 + rnd() * 6, p: rnd() * 6.3, wob: 10 + rnd() * 22, dir: rnd() < .8 ? 1 : -1 }));
    embers = Array.from({ length: 26 }, () => newEmber(true));
  }
  function newEmber(anywhere) {
    const p = pumpkins.length ? pumpkins[Math.floor(rnd() * pumpkins.length)] : { x: W / 2, y: H };
    return { x: p.x + (rnd() - .5) * 40, y: anywhere ? p.y - rnd() * H * .5 : p.y - 10, vy: 8 + rnd() * 16, vx: (rnd() - .5) * 8, r: .6 + rnd() * 1.6, life: 0, max: 4 + rnd() * 5, p: rnd() * 6.3 };
  }

  function drawBat(b, t) {
    const s = b.s, fl = Math.sin(t * b.f + b.p), tipY = -s * .25 + fl * s * .55, midY = -s * .05 + fl * s * .25;
    ctx.save(); ctx.translate(b.x, b.y); ctx.scale(b.dir, 1);
    ctx.fillStyle = "#050208";
    ctx.beginPath(); ctx.ellipse(0, 0, s * .12, s * .2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-s * .06, -s * .2); ctx.lineTo(-s * .1, -s * .34); ctx.lineTo(-s * .01, -s * .24); ctx.lineTo(s * .01, -s * .24); ctx.lineTo(s * .1, -s * .34); ctx.lineTo(s * .06, -s * .2); ctx.fill();
    for (const side of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(side * s * .08, -s * .08);
      ctx.quadraticCurveTo(side * s * .45, midY - s * .25, side * s * 1.0, tipY);
      ctx.quadraticCurveTo(side * s * .85, midY + s * .02, side * s * .74, midY + s * .12);
      ctx.quadraticCurveTo(side * s * .62, midY + s * .02, side * s * .5, midY + s * .16);
      ctx.quadraticCurveTo(side * s * .38, midY + s * .05, side * s * .26, midY + s * .18);
      ctx.quadraticCurveTo(side * s * .16, s * .06, side * s * .06, s * .12);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  /* ---------- parallax (mouse on desktop, tilt on phones that allow it) ---------- */
  const par = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener("pointermove", e => { if (e.pointerType === "mouse") { par.tx = e.clientX / innerWidth * 2 - 1; par.ty = e.clientY / innerHeight * 2 - 1; } }, { passive: true });
  addEventListener("deviceorientation", e => { if (e.gamma == null) return; par.tx = Math.max(-1, Math.min(1, e.gamma / 25)); par.ty = Math.max(-1, Math.min(1, (e.beta - 45) / 30)); }, { passive: true });
  const shift = k => [par.x * k, par.y * k * .5];

  /* ---------- lightning ---------- */
  const bolt = { at: 0, next: 7, path: null, x: 0 };
  function makeBolt() {
    const x0 = W * (rnd() < .5 ? .06 + rnd() * .16 : .74 + rnd() * .14), y0 = H * .1, y1 = L.yG - 30, pts = [[x0, y0]];
    let x = x0; for (let y = y0; y < y1; y += 14 + rnd() * 16) { x += (rnd() - .5) * 34; pts.push([x, y]); }
    const forks = []; for (let k = 0; k < 2; k++) { const i = 2 + Math.floor(rnd() * (pts.length - 4)); let [fx, fy] = pts[i]; const f = [[fx, fy]]; const dir = rnd() < .5 ? -1 : 1;
      for (let j = 0; j < 4; j++) { fx += dir * (10 + rnd() * 20); fy += 12 + rnd() * 14; f.push([fx, fy]); } forks.push(f); }
    return [pts, ...forks];
  }
  function lightning(now) { bolt.at = now; bolt.path = makeBolt(); bolt.next = now / 1000 + 14 + Math.random() * 14; if (SND.on) SND.thunder(.4 + Math.random() * .9); }

  /* ---------- tap/enter ember burst ---------- */
  const sparks = [];
  function burst(x, y) {
    for (let i = 0; i < 70; i++) { const a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 260;
      sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: 0, max: .6 + Math.random() * .9, r: .8 + Math.random() * 2.2 }); }
    if (SND.on) SND.whoosh();
  }

  /* ---------- sound (synthesized, off until the viewer turns it on) ---------- */
  const SND = { on: false, ac: null, wind: null,
    ctx() { if (!this.ac) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; this.ac = new A(); } if (this.ac.state === "suspended") this.ac.resume(); return this.ac; },
    noise(sec) { const ac = this.ac, b = ac.createBuffer(1, ac.sampleRate * sec, ac.sampleRate), d = b.getChannelData(0); let last = 0;
      for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + .02 * w) / 1.02; d[i] = last * 3.5; } return b; },   // brown noise
    start() { const ac = this.ctx(); if (!ac) return; this.on = true;
      if (!this.wind) {
        const src = ac.createBufferSource(); src.buffer = this.noise(6); src.loop = true;
        const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 500; bp.Q.value = .7;
        const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = .07; lg.gain.value = 260; lfo.connect(lg).connect(bp.frequency); lfo.start();
        const g = ac.createGain(); g.gain.value = 0; src.connect(bp).connect(g).connect(ac.destination); src.start();
        this.wind = g; this.owlT = setInterval(() => { if (this.on && Math.random() < .55) this.owl(); }, 22000);
      }
      this.wind.gain.setTargetAtTime(.16, ac.currentTime, 1.2);
    },
    stop() { this.on = false; if (this.wind) this.wind.gain.setTargetAtTime(0, this.ac.currentTime, .3); },
    thunder(delay) { const ac = this.ac; if (!ac) return; const t = ac.currentTime + delay;
      const src = ac.createBufferSource(); src.buffer = this.noise(4); const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(90, t + 3);
      const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.9, t + .08); g.gain.exponentialRampToValueAtTime(.001, t + 3.6);
      src.connect(lp).connect(g).connect(ac.destination); src.start(t); src.stop(t + 4); },
    owl() { const ac = this.ac; if (!ac) return; const t0 = ac.currentTime + .1;
      [[0, .32], [.45, .7]].forEach(([o, len]) => { const t = t0 + o, osc = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
        osc.type = "sine"; osc.frequency.setValueAtTime(390, t); osc.frequency.linearRampToValueAtTime(330, t + len); lp.type = "lowpass"; lp.frequency.value = 900;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.07, t + .06); g.gain.linearRampToValueAtTime(0, t + len);
        osc.connect(lp).connect(g).connect(ac.destination); osc.start(t); osc.stop(t + len + .05); }); },
    whoosh() { const ac = this.ac; if (!ac) return; const t = ac.currentTime;
      const src = ac.createBufferSource(); src.buffer = this.noise(1.2); const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(220, t); bp.frequency.exponentialRampToValueAtTime(2600, t + .5);
      const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.5, t + .12); g.gain.exponentialRampToValueAtTime(.001, t + .9);
      src.connect(bp).connect(g).connect(ac.destination); src.start(t); src.stop(t + 1.2);
      const o = ac.createOscillator(), og = ac.createGain(); o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(40, t + .6);
      og.gain.setValueAtTime(.35, t); og.gain.exponentialRampToValueAtTime(.001, t + .7); o.connect(og).connect(ac.destination); o.start(t); o.stop(t + .75); }
  };

  let last = 0, raf = 0, cloudX = 0, fogX = 0, fog2X = 0, grainF = 0, born = 0;
  function frame(now) {
    if (!gate.isConnected) { SND.stop(); return; }
    if (!born) born = now;
    const t = now / 1000, dt = Math.min(.05, last ? (now - last) / 1000 : 0); last = now;
    par.x += (par.tx - par.x) * Math.min(1, dt * 3); par.y += (par.ty - par.y) * Math.min(1, dt * 3);
    ctx.setTransform(D, 0, 0, D, 0, 0);
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
    ctx.drawImage(L.sky, 0, 0, W, H);

    // lightning: flash timing (the bolt itself is drawn behind the hills)
    if (!reduce && t > bolt.next && now - born > 3000) lightning(now);
    const since = (now - bolt.at) / 1000, flash = bolt.at && since < 1.1 ? Math.max(0, (since < .08 ? 1 : since < .16 ? .25 : since < .26 ? .85 : 1 - (since - .26) / .84)) : 0;

    const [sx, sy] = shift(4);
    for (const s of stars) {
      const a = s.a * (.65 + .35 * Math.sin(t * s.f + s.p));
      ctx.globalAlpha = a; ctx.fillStyle = s.warm ? "#ffe2b0" : "#eef0ff";
      ctx.beginPath(); ctx.arc(s.x + sx, s.y + sy, s.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    const m = L.moon, [mx, my] = shift(7), MX = m.x + mx, MY = m.y + my;
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(L.halo, MX - m.R * 3, MY - m.R * 3, m.R * 6, m.R * 6);
    ctx.globalCompositeOperation = "source-over";
    if (L.moonTex) ctx.drawImage(L.moonTex, MX - m.R, MY - m.R, m.R * 2 + 2 / D, m.R * 2 + 2 / D);
    else { const mg2 = ctx.createRadialGradient(MX - m.R * .3, MY - m.R * .3, 1, MX, MY, m.R); mg2.addColorStop(0, "#fff6dc"); mg2.addColorStop(1, "#e8cf96"); ctx.fillStyle = mg2; ctx.beginPath(); ctx.arc(MX, MY, m.R, 0, Math.PI * 2); ctx.fill(); }

    // clouds drift across the moon (they light up with the lightning)
    cloudX = (cloudX + dt * 7) % (W * 1.8);
    const cw = W * 1.8, ch = Math.max(140, H * .26), [cxs, cys] = shift(11);
    for (const [off, y, a, k] of [[0, m.y - ch * .3, .55, 1], [W * .9, H * .04, .4, .6]]) {
      const x = -((cloudX * k + off) % cw) + cxs;
      if (!CLOUD) continue;
      ctx.globalAlpha = Math.min(1, a + flash * .45); ctx.drawImage(CLOUD, x, y + cys, cw, ch); ctx.drawImage(CLOUD, x + cw, y + cys, cw, ch);
    }
    ctx.globalAlpha = 1;

    for (const b of bats) {
      b.x += b.v * dt * b.dir; const y = b.y + Math.sin(t * .8 + b.p) * b.wob;
      if (b.dir > 0 && b.x > W + 60) b.x = -60; if (b.dir < 0 && b.x < -60) b.x = W + 60;
      drawBat({ ...b, x: b.x + sx * 2, y: y + sy * 2 }, t);
    }

    if (flash > 0 && bolt.path) {
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineJoin = "round"; ctx.lineCap = "round";
      bolt.path.forEach((pts, i) => {
        for (const [w, c] of [[9, `rgba(170,140,255,${.18 * flash})`], [3, `rgba(220,210,255,${.6 * flash})`], [1.2, `rgba(255,255,255,${flash})`]]) {
          ctx.lineWidth = i ? w * .55 : w; ctx.strokeStyle = c; ctx.beginPath(); pts.forEach(([x, y], j) => j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
        }
      });
      ctx.restore();
    }

    const [fxs, fys] = shift(16), [nxs, nys] = shift(28), sc = 1.04;
    ctx.drawImage(L.far, -W * .02 + fxs, -H * .02 + fys, W * sc, H * sc);
    fogX = (fogX + dt * 10) % (W * 1.6);
    const fw = W * 1.6, fh = Math.max(110, H * .2);
    if (FOG) { ctx.globalAlpha = .55; ctx.drawImage(FOG, -fogX + fxs, L.yG - fh * .75 + fys, fw, fh); ctx.drawImage(FOG, -fogX + fw + fxs, L.yG - fh * .75 + fys, fw, fh); }
    ctx.globalAlpha = 1;
    ctx.drawImage(L.near, -W * .02 + nxs, -H * .02 + nys, W * sc, H * sc);

    // pumpkins: light on the ground, the carved body, then the flickering glow
    for (const p0 of pumpkins) {
      const p = { ...p0, x: (p0.x - W / 2) * sc + W / 2 + nxs, y: (p0.y - H / 2) * sc + H / 2 + nys };
      const fl = .78 + .14 * Math.sin(t * 7.3 + p.ph) + .08 * Math.sin(t * 17.1 + p.ph * 2) + (Math.random() < .03 ? -.25 : 0);
      ctx.globalCompositeOperation = "lighter";
      const gl = ctx.createRadialGradient(p.x, p.y - p.s * .3, 2, p.x, p.y - p.s * .3, p.s * 1.7);
      gl.addColorStop(0, `rgba(255,140,40,${.32 * fl})`); gl.addColorStop(1, "rgba(255,90,10,0)");
      ctx.fillStyle = gl; ctx.fillRect(p.x - p.s * 2, p.y - p.s * 2.2, p.s * 4, p.s * 3);
      ctx.globalCompositeOperation = "source-over";
      const w = p.tex.w / D, h = p.tex.h / D, x = p.x - w / 2, y = p.y - h;
      ctx.drawImage(p.tex.body, x, y, w, h);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = Math.max(.35, Math.min(1, fl)); ctx.drawImage(p.tex.face, x, y, w, h); ctx.drawImage(p.tex.face, x, y, w, h);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    }

    // front fog
    fog2X = (fog2X + dt * 16) % (W * 1.6);
    const [ffx] = shift(40);
    if (FOG) { ctx.globalAlpha = .32; ctx.drawImage(FOG, -fog2X + ffx, H - fh * .9, fw, fh); ctx.drawImage(FOG, -fog2X + fw + ffx, H - fh * .9, fw, fh); }
    ctx.globalAlpha = 1;

    // embers + tap sparks
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < embers.length; i++) {
      const e = embers[i]; e.life += dt; e.y -= e.vy * dt; e.x += (e.vx + Math.sin(t * 1.3 + e.p) * 6) * dt;
      if (e.life > e.max || e.y < H * .3) { embers[i] = newEmber(false); continue; }
      const a = Math.sin(Math.PI * e.life / e.max) * .9;
      ctx.fillStyle = `rgba(255,${150 + 60 * Math.sin(e.p)},60,${a})`; ctx.beginPath(); ctx.arc(e.x + nxs, e.y + nys, e.r, 0, Math.PI * 2); ctx.fill();
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const k = sparks[i]; k.life += dt; if (k.life > k.max) { sparks.splice(i, 1); continue; }
      k.vx *= 1 - dt * 1.8; k.vy = k.vy * (1 - dt * 1.8) + 140 * dt; k.x += k.vx * dt; k.y += k.vy * dt;
      const a = 1 - k.life / k.max; ctx.fillStyle = `rgba(255,${170 + 70 * a},${60 + 120 * a},${a})`;
      ctx.beginPath(); ctx.arc(k.x, k.y, k.r * (.5 + a), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";


    if (flash > 0) { ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = `rgba(150,130,230,${.16 * flash})`; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = "source-over"; }

    ctx.drawImage(L.vig, 0, 0, W, H);

    // cinematic open: fade up from black
    const intro = reduce ? 1 : Math.min(1, (now - born) / 1600);
    if (intro < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - intro * intro * (3 - 2 * intro)})`; ctx.fillRect(0, 0, W, H); }

    // keep it smooth: if frames run long, step the resolution down once or twice and redraw the layers
    if (now - born > 1200 && dt > 0) {
      perf.push(dt * 1000);                                  // time between frames, which includes the actual drawing
      if (perf.length >= 30) {
        const med = perf.sort((a, b) => a - b)[15]; perf = [];
        if (med > 22 && D > 1) { QMAX = Math.max(1, D - .5); build(); }
      }
    }
    if (!reduce || sparks.length) raf = requestAnimationFrame(frame);
  }
  let perf = [];

  function start() { cancelAnimationFrame(raf); build(); last = 0; raf = requestAnimationFrame(frame); }
  let rt = 0;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { if (gate.isConnected) start(); }, 180); });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { if (SND.ac && SND.on) SND.ac.suspend(); return; }
    if (SND.ac && SND.on) SND.ac.resume();
    if (gate.isConnected && !reduce) { cancelAnimationFrame(raf); last = 0; raf = requestAnimationFrame(frame); }
  });
  start();
  document.documentElement.classList.add("hw-painted");

  /* ---------- hooks for the page ---------- */
  const SKEY = "dare-hw-sound";
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
  window.DAREHW = {
    burst(el) { const r = el.getBoundingClientRect(), g = gate.getBoundingClientRect(); burst(r.left + r.width / 2 - g.left, r.top + r.height / 2 - g.top); if (reduce) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); } },
    lightning() { lightning(performance.now()); }
  };
})();
