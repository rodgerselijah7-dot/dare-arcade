/* DARE Arcade · Thanksgiving enter page scene: the cornucopia table
   A candlelit harvest table painted on one canvas at up to 2x pixel density. The still life (wall, table, a woven
   cornucopia spilling pumpkins, squash, apples, pears, grapes, corn, pomegranate, gourds and cranberries, wheat,
   candles) is rendered once per screen size; each frame composites it and draws what moves: candle flames and their
   glow, drifting bokeh lights, a few falling leaves and sparks rising off the candles.
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

  /* ---------- helpers ---------- */
  let seed = 26112026;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  function noise2(P) {
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
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mk = (w, h) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
  const TAU = Math.PI * 2;

  function grainTex() {
    const s = 192, c = mk(s, s), g = c.getContext("2d"), im = g.createImageData(s, s), d = im.data;
    for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    g.putImageData(im, 0, 0); return c;
  }

  /* ---------- leaves (scattered on the table, falling, and in the Enter swirl) ---------- */
  const LEAF_COLORS = [["#ffcf5a", "#e08a1c"], ["#ff9a3c", "#c2461a"], ["#e8502a", "#8f1f12"], ["#c9341f", "#6e140c"], ["#f2b544", "#a8641a"], ["#b5652a", "#5e2c12"]];
  function maplePath(s) {
    const p = new Path2D(), N = 140;
    for (let i = 0; i <= N; i++) {
      const a = i / N * TAU - Math.PI / 2, lobe = Math.pow(Math.abs(Math.cos(2.5 * (a + Math.PI / 2))), .55);
      const r = s * (.42 + .58 * lobe) * (1 + .07 * Math.sin(a * 17)) * (1 - .38 * Math.max(0, Math.sin(a)));
      i ? p.lineTo(Math.cos(a) * r, Math.sin(a) * r) : p.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    p.closePath(); return p;
  }
  function oakPath(s) {
    const p = new Path2D(), N = 120;
    for (let i = 0; i <= N; i++) { const t = i / N * TAU, wv = 1 + .22 * Math.sin(t * 7), x = Math.sin(t) * s * .42 * wv * (1 - .25 * Math.cos(t)), y = -Math.cos(t) * s; i ? p.lineTo(x, y) : p.moveTo(x, y); }
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

  /* ---------- produce painters (light comes from the upper left; candles add warmth from the right) ---------- */
  let g = null, S = 1;   // the still-life context and the scene scale while building
  const ball = (x, y, r, c0, c1, c2, lx = -.35, ly = -.4) => {
    const gr = g.createRadialGradient(x + r * lx, y + r * ly, r * .05, x, y, r * 1.05);
    gr.addColorStop(0, c0); gr.addColorStop(.55, c1); gr.addColorStop(1, c2); return gr;
  };
  const shine = (x, y, rx, ry, a = .55, rot = -.6) => { g.fillStyle = `rgba(255,250,235,${a})`; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fill(); };
  const shadow = (x, y, rx, ry, a = .45) => {
    const gr = g.createRadialGradient(x, y, 1, x, y, rx); gr.addColorStop(0, `rgba(20,6,2,${a})`); gr.addColorStop(1, "rgba(20,6,2,0)");
    g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rx, 0, TAU); g.fill(); g.restore();
  };
  const stem = (x, y, ang, len, w, col = "#5a3a18") => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = "round"; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(ang - .4) * len * .5, y + Math.sin(ang - .4) * len * .5, x + Math.cos(ang) * len, y + Math.sin(ang) * len); g.stroke(); };

  function pumpkin(x, y, r, hue) {             // y = where it sits on the table
    shadow(x + r * .15, y, r * 1.3, r * .32);
    const cy = y - r * .78, lob = [[-.62, .42], [.62, .42], [-.36, .52], [.36, .52], [0, .58]];
    for (const [ox, rx] of lob) {
      g.fillStyle = ball(x + ox * r, cy, rx * r * 1.25, hue[0], hue[1], hue[2], -.2, -.45);
      g.beginPath(); g.ellipse(x + ox * r, cy, rx * r, r * .8, 0, 0, TAU); g.fill();
    }
    g.strokeStyle = "rgba(70,20,0,.35)"; g.lineWidth = r * .03;
    for (const ox of [-.5, -.18, .18, .5]) { g.beginPath(); g.moveTo(x + ox * r * .8, cy - r * .74); g.quadraticCurveTo(x + ox * r * 1.25, cy, x + ox * r * .8, cy + r * .76); g.stroke(); }
    shine(x - r * .32, cy - r * .4, r * .12, r * .26, .22, -.3);
    g.fillStyle = "#5d4a22"; g.beginPath(); g.moveTo(x - r * .08, cy - r * .74); g.quadraticCurveTo(x - r * .05, cy - r * 1.02, x + r * .14, cy - r * 1.12);
    g.lineTo(x + r * .2, cy - r * 1.02); g.quadraticCurveTo(x + r * .06, cy - r * .92, x + r * .1, cy - r * .74); g.closePath(); g.fill();
    g.strokeStyle = "#6f7a2a"; g.lineWidth = r * .03; g.beginPath(); g.moveTo(x + r * .12, cy - r * 1.05); g.bezierCurveTo(x + r * .4, cy - r * 1.3, x + r * .55, cy - r * .9, x + r * .38, cy - r * .85); g.stroke();
  }
  function apple(x, y, r, red) {
    shadow(x + r * .2, y, r * 1.15, r * .28);
    const cy = y - r * .92;
    g.fillStyle = red ? ball(x, cy, r, "#ff8a6a", "#c81e1e", "#5e0a0a") : ball(x, cy, r, "#f6f09a", "#b8c43a", "#5a6a12");
    g.beginPath(); g.moveTo(x, cy - r * .72);
    g.bezierCurveTo(x + r * .55, cy - r * 1.1, x + r * 1.12, cy - r * .55, x + r * .98, cy + r * .2);
    g.bezierCurveTo(x + r * .86, cy + r * .9, x + r * .3, cy + r * 1.02, x, cy + r * .86);
    g.bezierCurveTo(x - r * .3, cy + r * 1.02, x - r * .86, cy + r * .9, x - r * .98, cy + r * .2);
    g.bezierCurveTo(x - r * 1.12, cy - r * .55, x - r * .55, cy - r * 1.1, x, cy - r * .72); g.fill();
    if (!red) { g.fillStyle = "rgba(220,70,40,.35)"; g.beginPath(); g.ellipse(x + r * .35, cy + r * .1, r * .45, r * .5, 0, 0, TAU); g.fill(); }
    shine(x - r * .4, cy - r * .3, r * .14, r * .26, .6);
    stem(x, cy - r * .66, -1.35, r * .55, Math.max(1, r * .08));
    g.fillStyle = "#4f7a24"; g.beginPath(); g.ellipse(x + r * .28, cy - r * .95, r * .28, r * .11, -.5, 0, TAU); g.fill();
  }
  function pear(x, y, r, ang = 0) {
    shadow(x + r * .2, y, r * 1.1, r * .26);
    g.save(); g.translate(x, y - r * .9); g.rotate(ang);
    g.fillStyle = ball(0, 0, r * 1.2, "#fff4a0", "#c8b03a", "#6a5212", -.4, -.2);
    g.beginPath(); g.moveTo(0, -r * 1.55);
    g.bezierCurveTo(r * .45, -r * 1.55, r * .45, -r * .7, r * .8, -r * .2);
    g.bezierCurveTo(r * 1.15, r * .35, r * .8, r * .9, 0, r * .9);
    g.bezierCurveTo(-r * .8, r * .9, -r * 1.15, r * .35, -r * .8, -r * .2);
    g.bezierCurveTo(-r * .45, -r * .7, -r * .45, -r * 1.55, 0, -r * 1.55); g.fill();
    g.fillStyle = "rgba(200,80,30,.25)"; g.beginPath(); g.ellipse(r * .35, r * .2, r * .45, r * .5, 0, 0, TAU); g.fill();
    shine(-r * .4, -r * .1, r * .12, r * .34, .45, -.2);
    stem(0, -r * 1.5, -1.1, r * .5, Math.max(1, r * .08));
    g.restore();
  }
  function grapes(x, y, r, n, dark) {          // cluster hangs down from (x, y)
    const pts = [];
    for (let row = 0, k = 0; k < n; row++) { const m = Math.max(1, 5 - row); for (let i = 0; i < m && k < n; i++, k++) pts.push([x + (i - (m - 1) / 2) * r * 1.55 + (rnd() - .5) * r * .5, y + row * r * 1.35 + (rnd() - .5) * r * .4]); }
    stem(x, y - r * .4, -1.9, r * 1.6, Math.max(1, r * .22), "#5a4a22");
    pts.sort((a, b) => a[1] - b[1]);
    for (const [px, py] of pts) {
      g.fillStyle = dark ? ball(px, py, r, "#a690d8", "#4a1f6e", "#1a0624") : ball(px, py, r, "#f2ffb0", "#9ab83a", "#3a5410");
      g.beginPath(); g.arc(px, py, r, 0, TAU); g.fill();
      g.fillStyle = "rgba(255,255,255,.55)"; g.beginPath(); g.arc(px - r * .35, py - r * .38, r * .2, 0, TAU); g.fill();
      g.fillStyle = "rgba(220,220,255,.08)"; g.beginPath(); g.arc(px, py, r, 0, TAU); g.fill();   // bloom
    }
  }
  function corn(x, y, len, ang) {              // husked ear pointing along ang from its base (x, y)
    g.save(); g.translate(x, y); g.rotate(ang);
    for (const side of [-1, 1]) {               // husks peeled back
      g.fillStyle = side < 0 ? "#d8c08a" : "#c2a466";
      g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(len * .25, side * len * .28, len * .55, side * len * .3, len * .62, side * len * .1);
      g.bezierCurveTo(len * .4, side * len * .1, len * .2, side * len * .05, 0, side * len * .06); g.fill();
      g.strokeStyle = "rgba(120,90,40,.5)"; g.lineWidth = 1; g.beginPath(); g.moveTo(len * .05, side * len * .04); g.quadraticCurveTo(len * .3, side * len * .2, len * .55, side * len * .12); g.stroke();
    }
    const w = len * .17;
    g.fillStyle = "#c8861e"; g.beginPath(); g.ellipse(len * .5, 0, len * .5, w, 0, 0, TAU); g.fill();
    const rows = 6, cols = Math.round(len / (w * .42));
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const u = (i + .5) / cols, xx = len * (.04 + u * .92), half = w * Math.sqrt(Math.max(0, 1 - Math.pow((u - .5) * 2, 2)));
      const v = (j + .5) / rows * 2 - 1, yy = v * half * .9, k = Math.max(.2, 1 - Math.abs(v) * .8);
      g.fillStyle = `rgb(${Math.round(220 + 35 * k)},${Math.round(150 + 70 * k)},${Math.round(30 + 40 * k)})`;
      g.beginPath(); g.ellipse(xx, yy, len / cols * .46, half / rows * .9 + .5, 0, 0, TAU); g.fill();
    }
    shine(len * .5, -w * .45, len * .32, w * .12, .3, 0);
    g.restore();
  }
  function butternut(x, y, len, ang) {         // lying on the table
    shadow(x + len * .1, y, len * .62, len * .12);
    g.save(); g.translate(x, y - len * .2); g.rotate(ang);
    g.fillStyle = ball(len * .2, -len * .05, len * .55, "#fff0c4", "#e2b46a", "#8a5a24", -.3, -.6);
    g.beginPath(); g.moveTo(-len * .5, -len * .07);
    g.bezierCurveTo(-len * .1, -len * .12, 0, -len * .08, len * .1, -len * .2);
    g.bezierCurveTo(len * .3, -len * .34, len * .55, -len * .24, len * .52, 0);
    g.bezierCurveTo(len * .55, len * .24, len * .3, len * .3, len * .1, len * .18);
    g.bezierCurveTo(0, len * .1, -len * .1, len * .12, -len * .5, len * .07); g.closePath(); g.fill();
    shine(len * .2, -len * .15, len * .14, len * .04, .3, 0);
    g.fillStyle = "#6a4a1e"; g.fillRect(-len * .56, -len * .03, len * .08, len * .06);
    g.restore();
  }
  function acorn(x, y, r) {                    // acorn squash: dark green, rounded, deep ridges, an orange patch
    shadow(x, y, r * 1.2, r * .28);
    const cy = y - r * .8, body = new Path2D();
    body.moveTo(x, cy - r * .92);
    body.bezierCurveTo(x + r * .7, cy - r * .9, x + r * 1.08, cy - r * .2, x + r * .9, cy + r * .4);
    body.bezierCurveTo(x + r * .7, cy + r * .82, x + r * .3, cy + r * .82, x, cy + r * .8);
    body.bezierCurveTo(x - r * .3, cy + r * .82, x - r * .7, cy + r * .82, x - r * .9, cy + r * .4);
    body.bezierCurveTo(x - r * 1.08, cy - r * .2, x - r * .7, cy - r * .9, x, cy - r * .92);
    g.fillStyle = ball(x, cy, r * 1.05, "#6f9a5a", "#24421f", "#0a160a", -.35, -.5); g.fill(body);
    g.save(); g.clip(body);
    g.fillStyle = "rgba(235,140,40,.6)"; g.beginPath(); g.ellipse(x + r * .45, cy + r * .45, r * .42, r * .32, -.3, 0, TAU); g.fill();
    for (let k = -3; k <= 3; k++) {                                  // ridges, dark grooves with a lit edge
      const ox = k / 3.4 * r;
      g.strokeStyle = "rgba(4,12,4,.7)"; g.lineWidth = r * .07;
      g.beginPath(); g.moveTo(x + ox * .25, cy - r * .9); g.quadraticCurveTo(x + ox * 1.25, cy - r * .1, x + ox * .6, cy + r * .82); g.stroke();
      g.strokeStyle = "rgba(150,190,120,.25)"; g.lineWidth = r * .03;
      g.beginPath(); g.moveTo(x + ox * .25 + r * .05, cy - r * .88); g.quadraticCurveTo(x + ox * 1.25 + r * .06, cy - r * .1, x + ox * .6 + r * .05, cy + r * .8); g.stroke();
    }
    g.restore();
    shine(x - r * .35, cy - r * .35, r * .1, r * .24, .3);
    g.fillStyle = "#8a7444"; g.beginPath(); g.moveTo(x - r * .1, cy - r * .86); g.lineTo(x - r * .06, cy - r * 1.14); g.lineTo(x + r * .08, cy - r * 1.14); g.lineTo(x + r * .1, cy - r * .86); g.closePath(); g.fill();
  }
  function gourd(x, y, r) {                    // striped yellow-green bottle gourd
    shadow(x, y, r * 1.1, r * .25);
    g.save(); g.translate(x, y - r * .8);
    const body = new Path2D(); body.ellipse(0, r * .1, r * .72, r * .7, 0, 0, TAU); body.ellipse(r * .05, -r * .7, r * .35, r * .4, 0, 0, TAU);
    g.fillStyle = ball(0, 0, r, "#fff7b0", "#e8c02a", "#7a5a0a"); g.fill(body);
    g.save(); g.clip(body); g.strokeStyle = "rgba(60,110,40,.75)"; g.lineWidth = r * .14;
    for (const ox of [-.4, 0, .4]) { g.beginPath(); g.moveTo(ox * r * .6, -r * 1.1); g.quadraticCurveTo(ox * r * 1.6, 0, ox * r * .9, r * .9); g.stroke(); }
    g.restore();
    shine(-r * .25, -r * .1, r * .1, r * .2, .4);
    stem(r * .05, -r * 1.05, -1.2, r * .35, Math.max(1, r * .1));
    g.restore();
  }
  function pomegranate(x, y, r) {
    shadow(x, y, r * 1.1, r * .26);
    const cy = y - r * .9;
    g.fillStyle = ball(x, cy, r, "#ff8a7a", "#a8141e", "#3a0408");
    g.beginPath(); g.arc(x, cy, r, 0, TAU); g.fill();
    g.fillStyle = "#7a0c12"; g.beginPath(); g.moveTo(x - r * .26, cy - r * .86);
    for (let k = 0; k <= 5; k++) { const xx = x - r * .26 + k * r * .104; g.lineTo(xx, cy - r * (k % 2 ? 1.25 : 1.05)); }
    g.lineTo(x + r * .26, cy - r * .86); g.closePath(); g.fill();
    shine(x - r * .38, cy - r * .35, r * .14, r * .24, .5);
  }
  function walnut(x, y, r) {
    shadow(x, y, r * 1.1, r * .25);
    g.fillStyle = ball(x, y - r * .8, r, "#d8a870", "#8a5a2c", "#3a2210");
    g.beginPath(); g.ellipse(x, y - r * .8, r, r * .82, 0, 0, TAU); g.fill();
    g.strokeStyle = "rgba(50,25,8,.55)"; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y - r * 1.6); g.bezierCurveTo(x + r * .3, y - r * 1.1, x - r * .3, y - r * .5, x, y); g.stroke();
  }
  function cranberries(x0, x1, y, n, spreadY) {
    for (let i = 0; i < n; i++) {
      const x = x0 + rnd() * (x1 - x0), yy = y + rnd() * spreadY, r = (2.4 + rnd() * 1.4) * S;
      shadow(x, yy, r * 1.4, r * .5, .35);
      g.fillStyle = ball(x, yy - r, r, "#ff7a7a", "#b0101e", "#4a0408"); g.beginPath(); g.arc(x, yy - r, r, 0, TAU); g.fill();
      g.fillStyle = "rgba(255,255,255,.6)"; g.beginPath(); g.arc(x - r * .35, yy - r * 1.35, r * .25, 0, TAU); g.fill();
    }
  }
  function wheat(x, y, len, ang) {
    g.strokeStyle = "#b8924a"; g.lineWidth = Math.max(1, 1.4 * S); g.lineCap = "round";
    const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len, bend = .12;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(ang + bend) * len * .6, y + Math.sin(ang + bend) * len * .6, ex, ey); g.stroke();
    const hl = len * .26, n = 9;
    for (let i = 0; i < n; i++) {
      const u = i / n, px = ex - Math.cos(ang) * hl * u, py = ey - Math.sin(ang) * hl * u, s = (1 - u * .4) * 3.6 * S;
      for (const side of [-1, 1]) {
        g.fillStyle = side < 0 ? "#e8c070" : "#c89a48";
        g.save(); g.translate(px, py); g.rotate(ang + side * .45); g.beginPath(); g.ellipse(s * .9, 0, s * 1.1, s * .5, 0, 0, TAU); g.fill(); g.restore();
      }
      g.strokeStyle = "rgba(230,200,140,.6)"; g.lineWidth = .6; g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(ang - .3) * s * 4, py + Math.sin(ang - .3) * s * 4); g.stroke();
    }
  }
  function tableLeaf(x, y, s, rot) {
    const sp = SPRITES[Math.floor(rnd() * SPRITES.length)]; if (!sp) return;
    const w = sp.width / D * s, h = sp.height / D * s;
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(1, .55); g.globalAlpha = .95; g.drawImage(sp, -w / 2, -h / 2, w, h); g.restore(); g.globalAlpha = 1;
  }

  /* ---------- the woven cornucopia ---------- */
  function cornucopia(M, R) {                  // M = mouth center (facing right), R = mouth radius
    // spine: from the mouth back to a curled tip, up and to the left
    const P = [[M.x, M.y], [M.x - R * 2.2, M.y + R * .15], [M.x - R * 3.5, M.y - R * .45], [M.x - R * 3.2, M.y - R * 1.75]];
    const bez = t => { const u = 1 - t; return [0, 1].map(k => u * u * u * P[0][k] + 3 * u * u * t * P[1][k] + 3 * u * t * t * P[2][k] + t * t * t * P[3][k]); };
    const N = 220, rings = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, [x, y] = bez(t), [x2, y2] = bez(Math.min(1, t + .002)), [x0, y0] = bez(Math.max(0, t - .002));
      rings.push({ t, x, y, a: Math.atan2(y2 - y0, x2 - x0), r: R * Math.pow(1 - t, .9) + R * .06 });
    }
    // the curl at the tip
    const tipA = rings[N].a; let { x: cx, y: cy } = rings[N];
    for (let i = 1; i <= 40; i++) { const a = tipA + i / 40 * 2.2, r = R * .06 * (1 - i / 48); cx += Math.cos(a) * R * .035; cy += Math.sin(a) * R * .035; rings.push({ t: 1, x: cx, y: cy, a, r }); }
    shadow(M.x - R * 1.6, M.y + R * 1.02, R * 2.6, R * .42, .55);
    // body: rings from the tip forward, each a little ellipse seen at an angle, banded like woven willow
    for (let i = rings.length - 1; i >= 0; i--) {
      const k = rings[i], band = Math.floor(k.t * 34) % 2;
      g.save(); g.translate(k.x, k.y); g.rotate(k.a);
      const gr = g.createLinearGradient(0, -k.r, 0, k.r);
      if (band) { gr.addColorStop(0, "#f2c77a"); gr.addColorStop(.35, "#c98f3e"); gr.addColorStop(.8, "#6e4118"); gr.addColorStop(1, "#3a200a"); }
      else { gr.addColorStop(0, "#e0b064"); gr.addColorStop(.35, "#b07a30"); gr.addColorStop(.8, "#5e3612"); gr.addColorStop(1, "#301a08"); }
      g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, k.r * .34, k.r, 0, 0, TAU); g.fill();
      g.restore();
    }
    // weave: the edges of each band, with short slanted strands that alternate direction band to band
    for (let b = 1; b < 34; b++) {
      const t = b / 34, k = rings[Math.round(t * N)];
      g.save(); g.translate(k.x, k.y); g.rotate(k.a);
      g.strokeStyle = "rgba(50,24,6,.55)"; g.lineWidth = Math.max(.8, R * .018);
      g.beginPath(); g.ellipse(0, 0, k.r * .34, k.r * .98, 0, -Math.PI / 2, Math.PI / 2); g.stroke();
      const dir = b % 2 ? 1 : -1, steps = Math.max(4, Math.round(k.r / (R * .07)));
      g.strokeStyle = "rgba(255,225,160,.28)"; g.lineWidth = Math.max(.6, R * .012);
      for (let s2 = 1; s2 < steps; s2++) {
        const th = -Math.PI / 2 + s2 / steps * Math.PI, ex = Math.cos(th) * k.r * .34, ey = Math.sin(th) * k.r * .98;
        g.beginPath(); g.moveTo(ex - R * .03, ey - dir * R * .02); g.lineTo(ex - R * .09, ey + dir * R * .03); g.stroke();
      }
      g.restore();
    }
    // mouth: dark inside, then a braided rim
    const mr = rings[0];
    g.save(); g.translate(mr.x, mr.y); g.rotate(mr.a);
    const ins = g.createRadialGradient(-R * .05, 0, 2, 0, 0, R); ins.addColorStop(0, "#140804"); ins.addColorStop(1, "#3a1e0a");
    g.fillStyle = ins; g.beginPath(); g.ellipse(0, 0, R * .4, R * 1.02, 0, 0, TAU); g.fill();
    g.lineWidth = R * .16; g.strokeStyle = "#a0682a"; g.beginPath(); g.ellipse(0, 0, R * .4, R * 1.02, 0, 0, TAU); g.stroke();
    for (let i = 0; i < 46; i++) {
      const th = i / 46 * TAU, ex = Math.cos(th) * R * .4, ey = Math.sin(th) * R * 1.02;
      g.strokeStyle = i % 2 ? "#f0c27a" : "#5e3410"; g.lineWidth = R * .05;
      g.beginPath(); g.moveTo(ex - R * .05, ey - R * .05); g.lineTo(ex + R * .05, ey + R * .05); g.stroke();
    }
    g.restore();
    return mr;
  }

  /* ---------- per-size layers ---------- */
  let QMAX = 2, pendingQ = 0;
  let W = 0, H = 0, D = 1, L = null, bokeh = [], leaves = [], sparks = [];
  host.style.setProperty("--tg-grain", `url(${grainTex().toDataURL()})`);

  function build() {
    W = gate.clientWidth; H = gate.clientHeight; D = Math.min(QMAX, window.devicePixelRatio || 1);
    cv.width = Math.round(W * D); cv.height = Math.round(H * D);
    seed = 26112026;
    SPRITES = []; const LS = Math.round(14 * D);
    for (const col of LEAF_COLORS) { SPRITES.push(leafSprite("maple", col, LS)); SPRITES.push(leafSprite("oak", col, LS * .9)); }
    const wide = W >= 700;
    S = wide ? clamp(Math.min(W / 1400, H / 1000), .5, 1.25) : clamp(H / 1700, .38, .56);   // phones: fit the strip under the links
    const yT = wide ? H - clamp(H * .24, 150, 270) : H - clamp(H * .16, 104, 160);   // back edge of the table
    L = { yT };

    /* wall: deep warm brown, glowing behind the title and toward the candles */
    const wall = mk(W * D, H * D), w = wall.getContext("2d"); w.scale(D, D);
    const wg = w.createLinearGradient(0, 0, 0, yT); wg.addColorStop(0, "#120806"); wg.addColorStop(.6, "#2a120a"); wg.addColorStop(1, "#3c1a0c");
    w.fillStyle = wg; w.fillRect(0, 0, W, H);
    const glow = w.createRadialGradient(W / 2, H * .42, 10, W / 2, H * .42, Math.max(W, H) * .65);
    glow.addColorStop(0, "rgba(160,70,30,.42)"); glow.addColorStop(.5, "rgba(110,40,20,.16)"); glow.addColorStop(1, "rgba(0,0,0,0)");
    w.fillStyle = glow; w.fillRect(0, 0, W, H);
    // faint wainscot panels so it reads as a room, not a void
    w.strokeStyle = "rgba(255,190,130,.035)"; w.lineWidth = 1;
    const pw = clamp(W / 6, 120, 240);
    for (let x = -pw / 2; x < W + pw; x += pw) { w.strokeRect(x + 14, yT - clamp(H * .3, 120, 260), pw - 28, clamp(H * .3, 120, 260) - 18); }
    L.wall = wall;

    /* the table: planks with grain, lit by the candles */
    const set = mk(W * D, H * D); g = set.getContext("2d"); g.scale(D, D);
    const tn = noise2(24);
    const tg = g.createLinearGradient(0, yT, 0, H); tg.addColorStop(0, "#6a3618"); tg.addColorStop(.25, "#552a12"); tg.addColorStop(1, "#2a1208");
    g.fillStyle = tg; g.fillRect(0, yT, W, H - yT);
    for (let i = 0, y = yT; y < H; i++) {                       // planks run left to right, wider toward the viewer
      const ph = 10 + (y - yT) * .22;
      for (let k = 0; k < 26; k++) {
        const yy = y + rnd() * ph, a = .05 + rnd() * .08;
        g.strokeStyle = rnd() < .5 ? `rgba(30,10,2,${a})` : `rgba(255,190,120,${a * .6})`; g.lineWidth = .6 + rnd();
        g.beginPath(); for (let x = 0; x <= W; x += 12) { const v = yy + (fbm(tn, x / 160 + k, yy / 40, 2) - .5) * 6; x ? g.lineTo(x, v) : g.moveTo(x, v); } g.stroke();
      }
      y += ph; g.strokeStyle = "rgba(20,6,0,.55)"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
    }
    const bk = g.createLinearGradient(0, yT - 6, 0, yT + 16); bk.addColorStop(0, "rgba(255,200,140,.25)"); bk.addColorStop(.3, "rgba(255,200,140,0)"); bk.addColorStop(1, "rgba(20,6,0,.35)");
    g.fillStyle = bk; g.fillRect(0, yT - 2, W, 18);

    /* candles on the right (flames are drawn each frame) */
    const candles = [];
    const candle = (x, h, r) => {
      const y = yT + 10 * S, top = y - 4 - h;
      shadow(x + r * .4, y + 2, r * 2.6, r * .55, .55);
      // brass holder
      const dg = g.createLinearGradient(x - r * 1.7, 0, x + r * 1.7, 0); dg.addColorStop(0, "#4a2c0c"); dg.addColorStop(.35, "#f0c46a"); dg.addColorStop(.6, "#b07a2a"); dg.addColorStop(1, "#4a2c0c");
      g.fillStyle = "#2a1606"; g.beginPath(); g.ellipse(x, y + 1, r * 1.75, r * .45, 0, 0, TAU); g.fill();
      g.fillStyle = dg; g.beginPath(); g.ellipse(x, y - 1, r * 1.7, r * .4, 0, 0, TAU); g.fill();
      g.fillStyle = dg; g.fillRect(x - r * 1.15, y - 5, r * 2.3, 5); g.beginPath(); g.ellipse(x, y - 5, r * 1.15, r * .26, 0, 0, TAU); g.fill();
      // wax body, slightly translucent at the edges
      const cg = g.createLinearGradient(x - r, 0, x + r, 0);
      cg.addColorStop(0, "#8a6038"); cg.addColorStop(.14, "#d6b080"); cg.addColorStop(.4, "#f6e2bc"); cg.addColorStop(.66, "#e8c898"); cg.addColorStop(.9, "#b08250"); cg.addColorStop(1, "#6e4824");
      g.fillStyle = cg; g.beginPath(); g.moveTo(x - r, y - 5);
      g.lineTo(x - r, top + r * .3);
      for (let k = 0; k <= 8; k++) { const xx = x - r + k / 8 * r * 2; g.lineTo(xx, top + r * .3 + Math.sin(k * 1.9 + x) * r * .12 - (k === 0 || k === 8 ? 0 : r * .05)); }   // melted lip
      g.lineTo(x + r, y - 5); g.closePath(); g.fill();
      // glow through the wax near the flame
      const wg2 = g.createLinearGradient(0, top, 0, top + h * .45); wg2.addColorStop(0, "rgba(255,170,80,.6)"); wg2.addColorStop(1, "rgba(255,170,80,0)");
      g.fillStyle = wg2; g.fillRect(x - r, top, r * 2, h * .45);
      // pool of melted wax on top
      g.fillStyle = "#fbe8c4"; g.beginPath(); g.ellipse(x, top + r * .3, r * .92, r * .24, 0, 0, TAU); g.fill();
      g.fillStyle = "rgba(255,200,120,.55)"; g.beginPath(); g.ellipse(x, top + r * .32, r * .6, r * .14, 0, 0, TAU); g.fill();
      // drips running down the side
      for (let k = 0; k < 3; k++) {
        const dx = x + (k - 1) * r * .62 + (rnd() - .5) * r * .2, dl = h * (.08 + rnd() * .22);
        const dgr = g.createLinearGradient(dx - r * .1, 0, dx + r * .1, 0); dgr.addColorStop(0, "#f2e0c2"); dgr.addColorStop(.5, "#fffaf0"); dgr.addColorStop(1, "#e0c49a");
        g.strokeStyle = dgr; g.lineCap = "round"; g.lineWidth = r * (.16 + rnd() * .08);
        g.beginPath(); g.moveTo(dx, top + r * .3); g.lineTo(dx, top + r * .3 + dl); g.stroke();
        g.fillStyle = "#fffaf0"; g.beginPath(); g.arc(dx, top + r * .3 + dl, r * .13, 0, TAU); g.fill();
      }
      g.strokeStyle = "#241408"; g.lineWidth = Math.max(1, r * .1); g.lineCap = "round";
      g.beginPath(); g.moveTo(x, top + r * .3); g.quadraticCurveTo(x + r * .05, top, x + r * .1, top - r * .1); g.stroke();
      candles.push({ x: x + r * .1, y: top - r * .05, r });
    };
    const cR = 13 * S;
    if (wide) { candle(W * .83, 120 * S, cR * 1.15); candle(W * .9, 170 * S, cR * 1.3); candle(W * .955, 90 * S, cR * 1.1); }
    else { candle(W * .84, 62 * S + 36, cR + 3); candle(W * .94, 44 * S + 26, cR + 2); }
    L.candles = candles;
    // warm pool of candlelight on the table
    for (const c of candles) { const lg = g.createRadialGradient(c.x, yT + 30 * S, 4, c.x, yT + 30 * S, 260 * S + 60); lg.addColorStop(0, "rgba(255,170,80,.22)"); lg.addColorStop(1, "rgba(255,140,60,0)"); g.fillStyle = lg; g.fillRect(0, yT, W, H - yT); }

    /* the cornucopia and the harvest spilling out of it */
    const R = 70 * S * (wide ? 1 : .9);
    const M = { x: wide ? W * .2 : W * .44, y: yT + 22 * S - R * 1.0 };
    const front = y => yT + y * S;                               // a spot on the table, y units toward the viewer
    const RX = wide ? R * Math.min(1, (W * .37 - M.x) / (R * 4.8)) : R;   // horizontal reach of the spill
    // behind the horn: wheat fanning out of the back, a tall pumpkin to the far left
    for (let i = 0; i < 9; i++) wheat(M.x - R * .3, M.y + R * .1, (150 + rnd() * 50) * S * (wide ? .8 : .62), -2.4 + i * .17 + (rnd() - .5) * .08);
    const mr = cornucopia(M, R);
    // spilling from the mouth: grapes over the rim, corn, then everything on the table
    corn(M.x - R * .1, M.y - R * .45, 120 * S, -.38);
    grapes(M.x + R * .32, M.y - R * .15, 7.5 * S, 14, true);
    pumpkin(M.x + RX * 1.25, front(16), 44 * S, ["#ffb45a", "#e8701c", "#6a2606"]);
    acorn(M.x + RX * .3, front(30), 30 * S);
    grapes(M.x + RX * 2.05, M.y + R * .35, 6.5 * S, 10, false);
    apple(M.x + RX * 2.4, front(26), 22 * S, true);
    pear(M.x + RX * 1.9, front(40), 18 * S, .25);
    gourd(M.x + RX * .95, front(48), 20 * S);
    butternut(M.x + RX * 3.1, front(22), 110 * S, -.1);
    pomegranate(M.x + RX * 3.6, front(44), 21 * S);
    apple(M.x + RX * 4.15, front(34), 21 * S, false);
    walnut(M.x + RX * 2.75, front(52), 9 * S); walnut(M.x + RX * 3.35, front(60), 8 * S);
    apple(M.x + RX * 1.55, front(58), 20 * S, true);
    cranberries(M.x + RX * .9, M.x + RX * 4.8, front(54), 26, 22 * S);
    // on wide screens, a second small harvest by the candles so both sides of the table feel full
    if (wide) {
      pumpkin(W * .87, front(46), 34 * S, ["#fff0d0", "#e2c492", "#7a5a34"]);
      pumpkin(W * .79, front(34), 26 * S, ["#ffa84a", "#d85a14", "#5a1c04"]);
      gourd(W * .935, front(56), 16 * S); apple(W * .73, front(52), 19 * S, true);
      cranberries(W * .7, W * .97, front(60), 14, 16 * S);
    }
    // autumn leaves scattered along the table
    for (let i = 0, n = Math.round(W / 52); i < n; i++) tableLeaf(rnd() * W, yT + (10 + rnd() * (H - yT - 20)), .9 + rnd() * .9, rnd() * TAU);
    L.set = set; L.M = M; L.R = R;

    /* vignette + a soft shade behind the title */
    const vig = mk(W * D, H * D), v = vig.getContext("2d"); v.scale(D, D);
    const vg = v.createRadialGradient(W / 2, H * .45, Math.min(W, H) * .32, W / 2, H * .5, Math.max(W, H) * .85);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(6,2,0,.62)");
    v.fillStyle = vg; v.fillRect(0, 0, W, H);
    L.vig = vig;
    // candle glow sprite
    const gs = 128, glowS = mk(gs, gs), gg = glowS.getContext("2d"), g0 = gg.createRadialGradient(gs / 2, gs / 2, 1, gs / 2, gs / 2, gs / 2);
    g0.addColorStop(0, "rgba(255,210,130,.9)"); g0.addColorStop(.25, "rgba(255,160,70,.35)"); g0.addColorStop(1, "rgba(255,120,40,0)");
    gg.fillStyle = g0; gg.fillRect(0, 0, gs, gs); L.glow = glowS;

    /* moving parts */
    bokeh = [];
    for (let i = 0, n = Math.round(clamp(W * H / 26000, 14, 40)); i < n; i++)
      bokeh.push({ x: rnd() * W, y: rnd() * yT * .95, r: (8 + rnd() * 26) * (wide ? 1 : .75), a: .05 + rnd() * .12, p: rnd() * TAU, f: .2 + rnd() * .5, v: 2 + rnd() * 5,
        c: rnd() < .7 ? [255, 180 + rnd() * 40 | 0, 90 + rnd() * 50 | 0] : [255, 120 + rnd() * 40 | 0, 60] });
    leaves = []; for (let i = 0, n = Math.round(clamp(W / 80, 6, 18)); i < n; i++) leaves.push(newLeaf(true));
    sparks = [];
  }

  function newLeaf(anywhere) {
    return { x: rnd() * W * 1.1 - W * .05, y: anywhere ? rnd() * L.yT : -20 - rnd() * 80, vy: 18 + rnd() * 22, sway: 14 + rnd() * 22, sf: .6 + rnd(), p: rnd() * TAU,
      rot: rnd() * TAU, spin: (rnd() - .5) * 2.4, flip: rnd() * TAU, ff: 1.2 + rnd() * 2.4, s: .6 + rnd() * .7, spr: Math.floor(rnd() * 1e6) };
  }
  function drawLeaf(l, x, y) {
    const sp = SPRITES[l.spr % SPRITES.length]; if (!sp) return;
    const w = sp.width / D * l.s, h = sp.height / D * l.s, c = Math.cos(l.flip);
    ctx.save(); ctx.translate(x, y); ctx.rotate(l.rot); ctx.scale(c * .85 + (c >= 0 ? .15 : -.15), 1);
    ctx.drawImage(sp, -w / 2, -h / 2, w, h); ctx.restore();
  }

  /* ---------- parallax ---------- */
  const par = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener("pointermove", e => { if (e.pointerType === "mouse") { par.tx = e.clientX / innerWidth * 2 - 1; par.ty = e.clientY / innerHeight * 2 - 1; } }, { passive: true });
  addEventListener("deviceorientation", e => { if (e.gamma == null) return; par.tx = clamp(e.gamma / 25, -1, 1); par.ty = clamp((e.beta - 45) / 30, -1, 1); }, { passive: true });
  const PK = () => Math.min(1, W / 1000);                         // gentler on narrow screens
  const shift = k => [par.x * k * PK(), par.y * k * .5 * PK()];

  /* ---------- enter: leaves and golden sparks swirl out of the button ---------- */
  const swirl = [];
  function burst(x, y) {
    for (let i = 0; i < 40; i++) { const a = Math.random() * TAU, v = 120 + Math.random() * 320;
      swirl.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 140, life: 0, max: 1 + Math.random() * .8, rot: Math.random() * TAU, spin: (Math.random() - .5) * 14,
        flip: Math.random() * TAU, ff: 4 + Math.random() * 6, s: .7 + Math.random() * .8, spr: Math.floor(Math.random() * 1e6), leaf: true }); }
    for (let i = 0; i < 50; i++) { const a = Math.random() * TAU, v = 60 + Math.random() * 260;
      swirl.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, life: 0, max: .6 + Math.random() * .8, r: .8 + Math.random() * 2 }); }
    if (SND.on) SND.whoosh();
  }

  /* ---------- sound: a fire crackling in the next room (synthesized, off until turned on) ---------- */
  const SND = { on: false, ac: null, bed: null,
    ctx() { if (!this.ac) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; this.ac = new A(); } if (this.ac.state === "suspended") this.ac.resume(); return this.ac; },
    noise(sec, brown) { const ac = this.ac, b = ac.createBuffer(1, ac.sampleRate * sec, ac.sampleRate), d = b.getChannelData(0); let last = 0;
      for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; if (brown) { last = (last + .02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; } return b; },
    start() { const ac = this.ctx(); if (!ac) return; this.on = true;
      if (!this.bed) {
        const src = ac.createBufferSource(); src.buffer = this.noise(6, true); src.loop = true;       // the low roar of the fire
        const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 380;
        const g0 = ac.createGain(); g0.gain.value = 0; src.connect(lp).connect(g0).connect(ac.destination); src.start();
        this.bed = g0; this.click = this.noise(.05, false);
        const tick = () => { if (this.on) this.crackle(); this.crT = setTimeout(tick, 40 + Math.random() * 260); };
        tick();
      }
      this.bed.gain.setTargetAtTime(.22, ac.currentTime, 1);
    },
    stop() { this.on = false; clearTimeout(this.crT); this.bed = this.bed && (this.bed.gain.setTargetAtTime(0, this.ac.currentTime, .3), this.bed); },
    crackle() { const ac = this.ac; if (!ac) return; const t = ac.currentTime + .01, pops = Math.random() < .2 ? 3 : 1;
      for (let i = 0; i < pops; i++) {
        const s = ac.createBufferSource(); s.buffer = this.click; const hp = ac.createBiquadFilter(); hp.type = "bandpass"; hp.frequency.value = 1500 + Math.random() * 3500; hp.Q.value = .8;
        const g1 = ac.createGain(), at = t + i * (.01 + Math.random() * .03), amp = .04 + Math.random() * (Math.random() < .1 ? .35 : .12);
        g1.gain.setValueAtTime(amp, at); g1.gain.exponentialRampToValueAtTime(.0005, at + .02 + Math.random() * .05);
        s.connect(hp).connect(g1).connect(ac.destination); s.start(at); s.stop(at + .08);
      } },
    whoosh() { const ac = this.ac; if (!ac) return; const t = ac.currentTime;
      const src = ac.createBufferSource(); src.buffer = this.noise(1.2, false); const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = .9;
      bp.frequency.setValueAtTime(400, t); bp.frequency.exponentialRampToValueAtTime(3200, t + .45);
      const g1 = ac.createGain(); g1.gain.setValueAtTime(0, t); g1.gain.linearRampToValueAtTime(.18, t + .1); g1.gain.exponentialRampToValueAtTime(.001, t + .9);
      src.connect(bp).connect(g1).connect(ac.destination); src.start(t); src.stop(t + 1.2); }
  };

  /* ---------- frame ---------- */
  let last = 0, raf = 0, born = 0, perf = [];
  function frame(now) {
    if (pendingQ) { QMAX = pendingQ; pendingQ = 0; build(); } // rebuild and repaint in the same frame: never a blank canvas
    if (!gate.isConnected) { SND.stop(); return; }
    if (!born) born = now;
    const t = now / 1000, dt = Math.min(.05, last ? (now - last) / 1000 : 0); last = now;
    par.x += (par.tx - par.x) * Math.min(1, dt * 3); par.y += (par.ty - par.y) * Math.min(1, dt * 3);
    ctx.setTransform(D, 0, 0, D, 0, 0);
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
    const sc = 1 + 2 * (22 * PK() + 3) / W, [wx, wy] = shift(6), [bx, by] = shift(14), [nx, ny] = shift(22);
    ctx.drawImage(L.wall, -W * .02 + wx, -H * .02 + wy, W * sc, H * sc);

    // out-of-focus lights in the room
    ctx.globalCompositeOperation = "lighter";
    for (const b of bokeh) {
      if (!reduce) { b.y -= b.v * dt * .3; b.x += Math.sin(t * .2 + b.p) * dt * 3; if (b.y < -40) b.y = L.yT; }
      const a = b.a * (.7 + .3 * Math.sin(t * b.f + b.p)), x = b.x + bx, y = b.y + by;
      const gr = ctx.createRadialGradient(x, y, b.r * .55, x, y, b.r);
      gr.addColorStop(0, `rgba(${b.c[0]},${b.c[1]},${b.c[2]},${a})`); gr.addColorStop(.85, `rgba(${b.c[0]},${b.c[1]},${b.c[2]},${a * .75})`); gr.addColorStop(1, `rgba(${b.c[0]},${b.c[1]},${b.c[2]},0)`);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, b.r, 0, TAU); ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";

    // a few leaves drifting down behind the table
    for (let i = 0; i < leaves.length; i++) {
      const l = leaves[i];
      if (!reduce) { l.y += l.vy * dt * l.s; l.x += (6 + Math.sin(t * l.sf + l.p) * l.sway) * dt; l.rot += l.spin * dt; l.flip += l.ff * dt; if (l.y > L.yT + 10) { leaves[i] = newLeaf(false); continue; } }
      ctx.globalAlpha = .9; drawLeaf(l, l.x + bx * l.s, l.y + by * l.s); ctx.globalAlpha = 1;
    }

    ctx.drawImage(L.set, -W * .02 + nx, -H * .02 + ny, W * sc, H * sc);
    const P = (x, y) => [(x - W / 2) * sc + W / 2 + nx, (y - H / 2) * sc + H / 2 + ny];

    // candle flames, their glow on the room, and sparks lifting off them
    for (const [i, c] of L.candles.entries()) {
      const fl = .85 + .1 * Math.sin(t * 9.1 + i * 2) + .06 * Math.sin(t * 23.7 + i) + (Math.random() < .02 ? -.15 : 0);
      const sway = reduce ? 0 : Math.sin(t * 2.3 + i * 1.7) * .12 + Math.sin(t * 7.1 + i) * .05;
      const [x, y] = P(c.x, c.y), fh = c.r * 2.4 * fl, fw = c.r * .55;
      ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = .38 * fl;
      const gw = c.r * 24; ctx.drawImage(L.glow, x - gw / 2, y - fh * .9 - gw / 2, gw, gw);
      ctx.globalAlpha = .5 * fl; const gw2 = c.r * 5; ctx.drawImage(L.glow, x - gw2 / 2, y - fh * .55 - gw2 / 2, gw2, gw2);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      ctx.save(); ctx.translate(x, y); ctx.rotate(sway);
      const flame = new Path2D(); flame.moveTo(0, -fh); flame.bezierCurveTo(fw * 1.05, -fh * .5, fw * 1.15, -fh * .04, 0, 0); flame.bezierCurveTo(-fw * 1.15, -fh * .04, -fw * 1.05, -fh * .5, 0, -fh);
      const f = ctx.createLinearGradient(0, -fh, 0, 0);
      f.addColorStop(0, "rgba(255,120,30,.75)"); f.addColorStop(.3, "rgba(255,180,60,.95)"); f.addColorStop(.7, "rgba(255,236,170,1)"); f.addColorStop(1, "rgba(255,200,120,.9)");
      ctx.fillStyle = f; ctx.fill(flame);
      ctx.fillStyle = "rgba(255,255,240,.95)"; ctx.beginPath(); ctx.ellipse(0, -fh * .32, fw * .38, fh * .24, 0, 0, TAU); ctx.fill();   // bright core
      ctx.fillStyle = "rgba(70,110,230,.55)"; ctx.beginPath(); ctx.ellipse(0, -fh * .05, fw * .5, fh * .09, 0, 0, TAU); ctx.fill();     // blue at the wick
      ctx.restore();
      if (!reduce && Math.random() < dt * .8) sparks.push({ x: c.x + (Math.random() - .5) * 3, y: c.y - fh, vy: 20 + Math.random() * 20, life: 0, max: 1.2 + Math.random(), r: .5 + Math.random() * .8 });
    }
    // the whole scene breathes a little with the candlelight
    const fl2 = .5 + .5 * Math.sin(t * 6.3) * Math.sin(t * 2.1);
    ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = `rgba(255,150,60,${.02 + .02 * fl2})`; ctx.fillRect(0, 0, W, H);
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i]; s.life += dt; if (s.life > s.max) { sparks.splice(i, 1); continue; }
      s.y -= s.vy * dt; s.x += Math.sin(t * 3 + i) * 6 * dt;
      const [x, y] = P(s.x, s.y), a = 1 - s.life / s.max;
      ctx.fillStyle = `rgba(255,${180 + 50 * a},90,${a * .8})`; ctx.beginPath(); ctx.arc(x, y, s.r, 0, TAU); ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";

    for (let i = swirl.length - 1; i >= 0; i--) {
      const k = swirl[i]; k.life += dt; if (k.life > k.max) { swirl.splice(i, 1); continue; }
      k.vx *= 1 - dt * 1.4; k.vy = k.vy * (1 - dt * 1.4) + 260 * dt; k.x += k.vx * dt; k.y += k.vy * dt;
      if (k.leaf) { k.rot += k.spin * dt; k.flip += k.ff * dt; ctx.globalAlpha = Math.min(1, (k.max - k.life) * 3); drawLeaf(k, k.x, k.y); ctx.globalAlpha = 1; }
      else { const a = 1 - k.life / k.max; ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = `rgba(255,${190 + 50 * a},${90 + 90 * a},${a})`; ctx.beginPath(); ctx.arc(k.x, k.y, k.r * (.5 + a), 0, TAU); ctx.fill(); ctx.globalCompositeOperation = "source-over"; }
    }

    ctx.drawImage(L.vig, 0, 0, W, H);
    const intro = reduce ? 1 : Math.min(1, (now - born) / 1600);
    if (intro < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - intro * intro * (3 - 2 * intro)})`; ctx.fillRect(0, 0, W, H); }

    if (now - born > 1200 && dt > 0) {
      perf.push(dt * 1000);
      if (perf.length >= 30) { const med = perf.sort((a, b) => a - b)[15]; perf = []; if (med > 22 && D > 1) pendingQ = med > 30 ? 1 : Math.max(1, D - .5); }
    }
    if (!reduce || swirl.length) raf = requestAnimationFrame(frame);
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
  if (wanted) { const first = () => { removeEventListener("pointerdown", first, true); if (gate.isConnected) setSound(true); }; addEventListener("pointerdown", first, true); }
  paintBtn();
  window.DARETG = {
    burst(el) { const r = el.getBoundingClientRect(), gr = gate.getBoundingClientRect(); burst(r.left + r.width / 2 - gr.left, r.top + r.height / 2 - gr.top); if (reduce) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); } }
  };
})();
