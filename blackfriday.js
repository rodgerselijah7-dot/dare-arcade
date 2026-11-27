/* DARE Arcade — Black Friday enter page.
   A black-and-gold night: spotlights sweeping over a city skyline, a mirror-black street with a neon horizon,
   drifting gold bokeh, falling foil confetti, glitter and camera flashes. On Cyber Monday the neon turns electric blue.
   Hooks: window.DARETG.burst(el) for the Enter tap (same as the Thanksgiving scene), sound on #hwSound. */
(function () {
  const gate = document.getElementById("gate"), host = gate && gate.querySelector(".tg");
  if (!host) return;
  const cv = document.createElement("canvas");
  cv.className = "tg-cv"; cv.setAttribute("aria-hidden", "true");
  host.appendChild(cv);
  const ctx = cv.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const CYBER = document.documentElement.classList.contains("bf-cyber");
  const NEON = CYBER ? [70, 200, 255] : [255, 46, 60];           // red neon, or electric blue on Cyber Monday
  const neon = a => `rgba(${NEON[0]},${NEON[1]},${NEON[2]},${a})`;
  const GOLD = ["#fff3c4", "#ffd76a", "#f2b632", "#c98a16", "#fff9e6"];

  let W = 0, H = 0, D = 1, QMAX = 2, pendingQ = 0, L = {};
  const mk = (w, h) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
  let sd = 1127;
  const rnd = () => ((sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296);

  /* ---------- per-size layers ---------- */
  function build(keep) {
    W = host.clientWidth || innerWidth; H = host.clientHeight || innerHeight;
    D = Math.min(QMAX, window.devicePixelRatio || 1);
    cv.width = Math.round(W * D); cv.height = Math.round(H * D);
    sd = 1127;
    const wide = W > 700, yH = Math.round(H * (wide ? .7 : .72));
    L = { yH, wide };

    // sky: near-black with a warm glow rising from the city and a hint of neon at the horizon
    const bg = mk(W * D, H * D), b = bg.getContext("2d"); b.scale(D, D);
    const g = b.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#030203"); g.addColorStop(.45, "#0a0708"); g.addColorStop(yH / H, "#1a120c"); g.addColorStop(1, "#000");
    b.fillStyle = g; b.fillRect(0, 0, W, H);
    const warm = b.createRadialGradient(W * .5, yH, 10, W * .5, yH, Math.max(W, H) * .7);
    warm.addColorStop(0, "rgba(255,190,90,.22)"); warm.addColorStop(.35, "rgba(200,120,40,.08)"); warm.addColorStop(1, "rgba(0,0,0,0)");
    b.fillStyle = warm; b.fillRect(0, 0, W, H);
    const hz = b.createLinearGradient(0, yH - 70, 0, yH + 4); hz.addColorStop(0, "rgba(0,0,0,0)"); hz.addColorStop(1, neon(.22));
    b.fillStyle = hz; b.fillRect(0, yH - 70, W, 74);
    // a few stars
    for (let i = 0, n = Math.round(W * yH / 5000); i < n; i++) { b.globalAlpha = .15 + rnd() * .4; b.fillStyle = "#fff"; b.fillRect(rnd() * W, rnd() * yH * .6, .8, .8); }
    b.globalAlpha = 1;
    L.bg = bg;

    // skyline: three depths of towers with lit windows; the near row has gold-trimmed roofs
    const sk = mk(W * D, H * D), s = sk.getContext("2d"); s.scale(D, D);
    const rows = [{ h: .34, c: "#120d10", win: .1, wa: .35 }, { h: .24, c: "#0b0809", win: .14, wa: .55 }, { h: .15, c: "#050404", win: .2, wa: .8 }];
    L.wins = [];
    rows.forEach((r, ri) => {
      let x = -10;
      while (x < W + 10) {
        const bw = (wide ? 34 : 22) + rnd() * (wide ? 70 : 44), bh = yH * r.h * (.35 + rnd() * .75), top = yH - bh;
        s.fillStyle = r.c; s.fillRect(x, top, bw, bh + 2);
        if (rnd() < .3) { s.fillRect(x + bw * .4, top - bh * .12, bw * .2, bh * .12); if (rnd() < .5) s.fillRect(x + bw * .48, top - bh * .22, 1.5, bh * .1); }
        if (ri === 2) { s.fillStyle = "rgba(242,182,50,.35)"; s.fillRect(x, top, bw, 1); }
        const cw = 3 + ri, ch = 4 + ri, gx = 5 + ri * 2, gy = 7 + ri * 2;
        for (let wy = top + 6; wy < yH - 6; wy += gy) for (let wx = x + 4; wx < x + bw - cw - 2; wx += gx) {
          if (rnd() > r.win) continue;
          const warmW = rnd() < .8;
          s.fillStyle = warmW ? `rgba(255,${200 + rnd() * 40 | 0},${110 + rnd() * 60 | 0},${r.wa * (.5 + rnd() * .5)})` : neon(r.wa * .6);
          s.fillRect(wx, wy, cw, ch);
          if (ri === 2 && rnd() < .06) L.wins.push({ x: wx, y: wy, w: cw, h: ch, p: rnd() * 6.3, f: .3 + rnd() * .8 });
        }
        x += bw + (rnd() < .3 ? rnd() * 8 : 0);
      }
    });
    L.sky = sk;

    // the street: mirror-black, with a perspective grid in neon fading into the horizon
    const fl = mk(W * D, H * D), f = fl.getContext("2d"); f.scale(D, D);
    const fg = f.createLinearGradient(0, yH, 0, H); fg.addColorStop(0, "#0c0808"); fg.addColorStop(.25, "#040303"); fg.addColorStop(1, "#000");
    f.fillStyle = fg; f.fillRect(0, yH, W, H - yH);
    // reflection of the skyline glow
    f.save(); f.globalAlpha = .28; f.translate(0, yH * 2); f.scale(1, -1); f.drawImage(sk, 0, 0, W * D, yH * D, 0, 0, W, yH); f.restore();
    const fade = f.createLinearGradient(0, yH, 0, yH + (H - yH) * .7); fade.addColorStop(0, "rgba(0,0,0,.35)"); fade.addColorStop(1, "rgba(0,0,0,1)");
    f.fillStyle = fade; f.fillRect(0, yH, W, H - yH);
    f.strokeStyle = neon(.28); f.lineWidth = 1;
    const vx = W / 2;
    for (let i = -14; i <= 14; i++) { const xb = vx + i * W * .12; f.globalAlpha = 1 - Math.abs(i) / 16; f.beginPath(); f.moveTo(vx + i * 6, yH); f.lineTo(xb, H); f.stroke(); }
    for (let k = 1; k < 12; k++) { const t = Math.pow(k / 12, 2.2), y = yH + (H - yH) * t; f.globalAlpha = .15 + t * .6; f.beginPath(); f.moveTo(0, y); f.lineTo(W, y); f.stroke(); }
    f.globalAlpha = 1;
    // the neon horizon line
    const hl = f.createLinearGradient(0, 0, W, 0); hl.addColorStop(0, neon(0)); hl.addColorStop(.2, neon(.9)); hl.addColorStop(.8, neon(.9)); hl.addColorStop(1, neon(0));
    f.fillStyle = hl; f.fillRect(0, yH - 1, W, 2);
    f.globalAlpha = .5; f.filter = "blur(6px)"; f.fillRect(0, yH - 4, W, 8); f.filter = "none"; f.globalAlpha = 1;
    L.floor = fl;

    // a spotlight beam sprite (pointing up), soft-edged
    const BL = Math.hypot(W, H) * 1.1, BW = Math.max(160, W * .16);
    const bm = mk(BW * 2, BL), m = bm.getContext("2d");
    const lg = m.createLinearGradient(0, BL, 0, 0); lg.addColorStop(0, "rgba(255,240,200,.55)"); lg.addColorStop(.35, "rgba(255,225,160,.18)"); lg.addColorStop(1, "rgba(255,220,150,0)");
    m.fillStyle = lg; m.beginPath(); m.moveTo(BW - 6, BL); m.lineTo(BW + 6, BL); m.lineTo(BW * 2, 0); m.lineTo(0, 0); m.closePath(); m.fill();
    m.globalCompositeOperation = "destination-in";
    const sg = m.createLinearGradient(0, 0, BW * 2, 0); sg.addColorStop(0, "rgba(0,0,0,0)"); sg.addColorStop(.5, "rgba(0,0,0,1)"); sg.addColorStop(1, "rgba(0,0,0,0)");
    m.fillStyle = sg; m.fillRect(0, 0, BW * 2, BL);
    L.beam = bm; L.BL = BL; L.BW = BW;
    L.beams = [
      { x: W * .14, a: -.35, sp: .21, ph: 0, amp: .42, tint: null },
      { x: W * .4, a: .1, sp: .16, ph: 2.1, amp: .38, tint: null },
      { x: W * .64, a: -.1, sp: .19, ph: 4.2, amp: .4, tint: "neon" },
      { x: W * .9, a: .3, sp: .14, ph: 1.3, amp: .44, tint: null }
    ];
    // the neon-tinted beam
    const nb = mk(bm.width, bm.height), n = nb.getContext("2d"); n.drawImage(bm, 0, 0); n.globalCompositeOperation = "source-atop"; n.fillStyle = neon(.85); n.fillRect(0, 0, nb.width, nb.height);
    L.nbeam = nb;

    // soft glow sprite for bokeh and flashes
    const gs = mk(64, 64), gg = gs.getContext("2d"), rg = gg.createRadialGradient(32, 32, 0, 32, 32, 32);
    rg.addColorStop(0, "rgba(255,235,180,1)"); rg.addColorStop(.35, "rgba(255,205,110,.45)"); rg.addColorStop(1, "rgba(255,190,90,0)");
    gg.fillStyle = rg; gg.fillRect(0, 0, 64, 64); L.glow = gs;
    const bk = mk(64, 64), bg2 = bk.getContext("2d"), br = bg2.createRadialGradient(32, 32, 0, 32, 32, 32);
    br.addColorStop(0, "rgba(255,214,120,.55)"); br.addColorStop(.75, "rgba(255,200,100,.35)"); br.addColorStop(.92, "rgba(255,230,170,.5)"); br.addColorStop(1, "rgba(255,200,100,0)");
    bg2.fillStyle = br; bg2.fillRect(0, 0, 64, 64); L.bokeh = bk;

    // vignette
    const vg = mk(W * D, H * D), v = vg.getContext("2d"); v.scale(D, D);
    const vr = v.createRadialGradient(W / 2, H * .46, Math.min(W, H) * .3, W / 2, H * .5, Math.hypot(W, H) * .62);
    vr.addColorStop(0, "rgba(0,0,0,0)"); vr.addColorStop(1, "rgba(0,0,0,.75)"); v.fillStyle = vr; v.fillRect(0, 0, W, H);
    const tx = v.createLinearGradient(0, H * .2, 0, H * .62); tx.addColorStop(0, "rgba(0,0,0,0)"); tx.addColorStop(.5, "rgba(0,0,0,.28)"); tx.addColorStop(1, "rgba(0,0,0,0)");
    v.fillStyle = tx; v.fillRect(0, 0, W, H);   // a little shade behind the title so it always reads
    L.vig = vg;

    if (keep && conf.length) return;
    conf = []; bokeh = []; sparks = [];
    const nC = Math.min(140, Math.round(W * H / 9000));
    for (let i = 0; i < nC; i++) conf.push(newConf(true));
    for (let i = 0, nb2 = wide ? 34 : 20; i < nb2; i++) bokeh.push({ x: Math.random() * W, y: Math.random() * yH * 1.05, r: 6 + Math.random() * (wide ? 26 : 18), a: .08 + Math.random() * .22, vx: (Math.random() - .5) * 6, vy: -2 - Math.random() * 5, p: Math.random() * 6.3 });
    for (let i = 0, ns = wide ? 40 : 24; i < ns; i++) sparks.push({ x: Math.random() * W, y: Math.random() * H, p: Math.random() * 6.3, f: 1.5 + Math.random() * 3, s: .6 + Math.random() * 1.4 });
  }
  let conf = [], bokeh = [], sparks = [], flashes = [], burstBits = [];
  const FOIL = [["#ffe48a", "#a86d0c"], ["#fff6d6", "#b89a5a"], ["#f4f4f4", "#7a7a7a"], ["#2a2a2a", "#000000"], ["#ffcf4a", "#8a5a08"]];
  function newConf(anywhere) {
    const f = FOIL[Math.random() < .12 ? 3 : Math.random() < .25 ? 2 : Math.random() < .5 ? 1 : Math.random() < .5 ? 4 : 0];
    const red = !CYBER && Math.random() < .07, blue = CYBER && Math.random() < .1;
    return { x: Math.random() * W, y: anywhere ? Math.random() * H : -20 - Math.random() * 60, vy: 26 + Math.random() * 40, vx: (Math.random() - .5) * 14,
      sw: Math.random() * 6.3, swf: .6 + Math.random() * 1.4, swa: 10 + Math.random() * 22, rot: Math.random() * 6.3, spin: (Math.random() - .5) * 4,
      flip: Math.random() * 6.3, ff: 2 + Math.random() * 5, w: 5 + Math.random() * 6, h: 3 + Math.random() * 4, c: red ? ["#ff5a5a", "#7a0a10"] : blue ? ["#8fe4ff", "#145a8a"] : f, ribbon: Math.random() < .12 };
  }
  function drawConf(c, k = 1) {
    const fl = Math.cos(c.flip), lit = (fl + 1) / 2;
    ctx.save(); ctx.translate(c.x + Math.sin(c.sw) * c.swa * .2, c.y); ctx.rotate(c.rot); ctx.scale(1, Math.max(.08, Math.abs(fl)));
    ctx.globalAlpha = k;
    ctx.fillStyle = lit > .5 ? c.c[0] : c.c[1];
    if (c.ribbon) { ctx.fillRect(-c.w * 1.6, -1, c.w * 3.2, 2); }
    else { ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h); if (lit > .82) { ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h * .35); } }
    ctx.restore();
  }

  /* ---------- frame ---------- */
  let last = 0, raf = 0, born = 0, perf = [], perfOn = true, shown = false, nextFlash = 1.2;
  function frame(now) {
    if (pendingQ) { QMAX = pendingQ; pendingQ = 0; build(true); }   // rebuild and repaint in the same frame
    if (!born) born = now;
    const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    const t = now / 1000, intro = Math.min(1, (now - born) / 1400);
    const { yH } = L;
    ctx.setTransform(D, 0, 0, D, 0, 0);
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
    const px = parseFloat(gate.style.getPropertyValue("--px")) || 0, py = parseFloat(gate.style.getPropertyValue("--py")) || 0;
    ctx.drawImage(L.bg, 0, 0, W, H);

    // sweeping spotlights behind the skyline
    ctx.globalCompositeOperation = "lighter";
    for (const bm of L.beams) {
      const a = bm.a + (reduce ? 0 : Math.sin(t * bm.sp + bm.ph) * bm.amp);
      ctx.save(); ctx.translate(bm.x - px * 6, yH + 20); ctx.rotate(a);
      ctx.globalAlpha = (bm.tint ? .5 : .42) * intro * (.85 + .15 * Math.sin(t * .7 + bm.ph));
      ctx.drawImage(bm.tint ? L.nbeam : L.beam, -L.BW, -L.BL, L.BW * 2, L.BL);
      ctx.restore();
    }
    // bokeh drifting up
    for (const k of bokeh) {
      if (!reduce) { k.x += k.vx * dt; k.y += k.vy * dt; if (k.y < -40) { k.y = yH + 20; k.x = Math.random() * W; } if (k.x < -40) k.x = W + 30; if (k.x > W + 40) k.x = -30; }
      ctx.globalAlpha = k.a * (.7 + .3 * Math.sin(t * .8 + k.p)) * intro;
      ctx.drawImage(L.bokeh, k.x - k.r - px * 10, k.y - k.r - py * 6, k.r * 2, k.r * 2);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";

    // skyline, with a few windows flickering
    ctx.drawImage(L.sky, -px * 4, -py * 2, W, H);
    ctx.globalCompositeOperation = "lighter";
    for (const w of L.wins) { const a = .5 + .5 * Math.sin(t * w.f + w.p); ctx.fillStyle = `rgba(255,210,130,${a * .6})`; ctx.fillRect(w.x - px * 4, w.y - py * 2, w.w, w.h); }
    ctx.globalCompositeOperation = "source-over";

    // the street
    ctx.drawImage(L.floor, 0, 0, W, H);
    // light pooling on the street under the beams
    ctx.globalCompositeOperation = "lighter";
    for (const bm of L.beams) { ctx.globalAlpha = .16 * intro; ctx.drawImage(bm.tint ? L.nbeam : L.glow, bm.x - 90, yH - 10, 180, 40); }
    // camera flashes along the street
    if (!reduce && t > nextFlash) { nextFlash = t + .25 + Math.random() * 1.6; flashes.push({ x: W * (.05 + Math.random() * .9), y: yH + 4 + Math.random() * (H - yH) * .25, life: 0, s: 10 + Math.random() * 18 }); }
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i]; f.life += dt; const k = 1 - f.life / .35;
      if (k <= 0) { flashes.splice(i, 1); continue; }
      ctx.globalAlpha = k; ctx.drawImage(L.glow, f.x - f.s, f.y - f.s, f.s * 2, f.s * 2);
      ctx.fillStyle = `rgba(255,255,255,${k})`; ctx.fillRect(f.x - f.s * .9, f.y - .5, f.s * 1.8, 1); ctx.fillRect(f.x - .5, f.y - f.s * .6, 1, f.s * 1.2);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";

    // falling foil confetti
    for (const c of conf) {
      if (!reduce) { c.y += c.vy * dt; c.x += c.vx * dt; c.sw += c.swf * dt; c.rot += c.spin * dt; c.flip += c.ff * dt;
        if (c.y > H + 20) Object.assign(c, newConf(false)); }
      drawConf(c, Math.min(1, intro * 1.5));
    }
    // the Enter burst
    for (let i = burstBits.length - 1; i >= 0; i--) {
      const c = burstBits[i]; c.life += dt;
      if (c.life > c.max) { burstBits.splice(i, 1); continue; }
      c.vy += 420 * dt; c.vx *= .985; c.x += c.vx * dt; c.y += c.vy * dt; c.rot += c.spin * dt; c.flip += c.ff * dt;
      drawConf(c, Math.min(1, (c.max - c.life) / .4));
    }
    // glitter
    ctx.globalCompositeOperation = "lighter";
    for (const s of sparks) { const a = Math.max(0, Math.sin(t * s.f + s.p)); if (a < .55) continue; const k = (a - .55) / .45 * intro, r = s.s * 3 * k;
      ctx.fillStyle = `rgba(255,236,180,${k})`; ctx.fillRect(s.x - r, s.y - .4, r * 2, .8); ctx.fillRect(s.x - .4, s.y - r, .8, r * 2); }
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(L.vig, 0, 0, W, H);

    if (!shown) { shown = true; cv.classList.add("on"); }
    // keep it smooth on slower phones: step the resolution down once if frames run long
    if (perfOn && now - born > 250) { perf.push(dt * 1000); if (perf.length >= 24) { perfOn = false; const med = perf.sort((a, b) => a - b)[12];
      if (med > 22 && D > 1) pendingQ = med > 30 ? 1 : Math.max(1, D - .5); } }
    if (!reduce || burstBits.length) raf = requestAnimationFrame(frame);
  }
  function start() { build(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
  let rt = 0; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { if (gate.isConnected) { build(true); if (reduce) raf = requestAnimationFrame(frame); } }, 150); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) cancelAnimationFrame(raf); else if (gate.isConnected) { last = 0; raf = requestAnimationFrame(frame); } });

  function burst(x, y) {
    for (let i = 0; i < 90; i++) { const a = -Math.PI / 2 + (Math.random() - .5) * 2.4, v = 260 + Math.random() * 420, c = newConf(false);
      Object.assign(c, { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 1.2 + Math.random() * .9, spin: (Math.random() - .5) * 16, ff: 6 + Math.random() * 10, w: c.w * 1.2 }); burstBits.push(c); }
    for (let i = 0; i < 6; i++) flashes.push({ x: x + (Math.random() - .5) * 160, y: y + (Math.random() - .5) * 80, life: -i * .05, s: 20 + Math.random() * 26 });
    for (const bm of L.beams) bm.ph += 1.2;   // the lights swing toward the doors
    if (SND.on) SND.chaching();
  }

  /* ---------- sound: a low city hum and soft shimmer; a cash-register "cha-ching" on Enter (synthesized, off until turned on) ---------- */
  const SND = { on: false, ac: null, pad: null,
    ctx() { if (!this.ac) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; this.ac = new A(); } if (this.ac.state === "suspended") this.ac.resume(); return this.ac; },
    start() { const ac = this.ctx(); if (!ac) return; this.on = true;
      if (!this.pad) {
        const g = ac.createGain(); g.gain.value = 0; const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 520; lp.connect(g).connect(ac.destination);
        [55, 82.4, 110, 164.8].forEach((f, i) => { const o = ac.createOscillator(); o.type = i % 2 ? "triangle" : "sawtooth"; o.frequency.value = f; o.detune.value = (i - 1.5) * 6;
          const og = ac.createGain(); og.gain.value = i ? .05 : .08; o.connect(og).connect(lp); o.start(); });
        const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = .11; lg.gain.value = 180; lfo.connect(lg).connect(lp.frequency); lfo.start();
        this.pad = g;
        this.twT = setInterval(() => { if (this.on) this.twinkle(); }, 2600);
      }
      this.pad.gain.setTargetAtTime(.22, ac.currentTime, 1.4);
    },
    stop() { this.on = false; if (this.pad) this.pad.gain.setTargetAtTime(0, this.ac.currentTime, .3); },
    bell(at, f, v, dur) { const ac = this.ac, t = ac.currentTime + at;
      [1, 2.76, 5.4].forEach((m, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = "sine"; o.frequency.value = f * m;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v / (i + 1), t + .005); g.gain.exponentialRampToValueAtTime(.0008, t + dur / (i + 1));
        o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur); }); },
    twinkle() { const notes = [1318.5, 1568, 1760, 2093, 2349.3]; for (let i = 0; i < 3; i++) this.bell(i * .14 + Math.random() * .05, notes[Math.floor(Math.random() * notes.length)], .018, 1.4); },
    chaching() { const ac = this.ac; if (!ac) return; const t = ac.currentTime;
      // the drawer: a short mechanical rattle
      const b = ac.createBuffer(1, ac.sampleRate * .12, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
      const src = ac.createBufferSource(), hp = ac.createBiquadFilter(), g = ac.createGain(); src.buffer = b; hp.type = "bandpass"; hp.frequency.value = 2600; hp.Q.value = 1.2; g.gain.value = .5;
      src.connect(hp).connect(g).connect(ac.destination); src.start(t);
      this.bell(.06, 1975.5, .16, 1.6); this.bell(.2, 2637, .14, 2.2); }
  };

  start();
  document.documentElement.classList.add("tg-painted");

  /* ---------- hooks for the page ---------- */
  const SKEY = "dare-bf-sound";
  const btn = document.getElementById("hwSound");
  const paintBtn = () => { if (btn) { btn.setAttribute("aria-pressed", SND.on); btn.setAttribute("aria-label", SND.on ? "Sound on. Tap to mute." : "Turn on sound"); } };
  function setSound(on) { on ? SND.start() : SND.stop(); try { localStorage.setItem(SKEY, on ? "1" : "0"); } catch (e) {} paintBtn(); }
  if (btn) btn.addEventListener("click", e => { e.stopPropagation(); setSound(!SND.on); });
  let wanted = false; try { wanted = localStorage.getItem(SKEY) === "1"; } catch (e) {}
  if (wanted) { const first = () => { removeEventListener("pointerdown", first, true); if (gate.isConnected) setSound(true); }; addEventListener("pointerdown", first, true); }
  paintBtn();
  window.DARETG = {
    burst(el) { const r = el.getBoundingClientRect(), g = gate.getBoundingClientRect(); burst(r.left + r.width / 2 - g.left, r.top + r.height / 2 - g.top); if (reduce) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); } }
  };
})();
