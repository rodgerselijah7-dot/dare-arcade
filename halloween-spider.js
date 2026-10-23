/* DARE Arcade · the spider on the Enter button (Halloween enter page)
   Drawn on its own small canvas, top-down. Eight legs, each a hip, a knee and a foot solved with two-bone IK.
   Spiders walk with an alternating tetrapod gait: legs L1 R2 L3 R4 step together, then R1 L2 R3 L4, so four feet
   are always planted. Feet stay put on the ground while the body moves over them and swing forward when they
   reach the end of their stride. The spider wanders along the top edge of the button: walks, stops, twitches,
   turns around (stepping in place) and walks back. Replaces the SVG fallback in .hw-bug. */
(function () {
  const host = document.querySelector(".hw-bug"), btn = document.getElementById("enterBtn"), gate = document.getElementById("gate");
  if (!host || !btn || !gate) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const CW = 88, CH = 74, D = Math.min(3, window.devicePixelRatio || 1);
  const cv = document.createElement("canvas");
  cv.width = CW * D; cv.height = CH * D; cv.className = "hw-spider-cv";
  const ctx = cv.getContext("2d"); if (!ctx) return;
  host.textContent = ""; host.appendChild(cv); host.classList.add("live");

  const S = 1.15;                                // body scale (px per unit)
  const FEMUR = 9.5, TIBIA = 11.5;
  // legs front to back: hip position in body frame (x forward, y right), resting foot, stride length
  const LEGS = [
    { hip: [3.4, 1.9], rest: [15, 9], stride: 8 },
    { hip: [1.6, 2.6], rest: [6, 15.5], stride: 8 },
    { hip: [-.4, 2.6], rest: [-5, 15.5], stride: 8 },
    { hip: [-2.2, 1.9], rest: [-14, 10.5], stride: 8 },
  ];
  // every leg on both sides; group A = L1 R2 L3 R4, group B the rest
  const legs = [];
  for (const side of [-1, 1]) LEGS.forEach((L, i) => legs.push({ side, i, hip: [L.hip[0], L.hip[1] * side], rest: [L.rest[0], L.rest[1] * side], stride: L.stride,
    group: ((i % 2) ^ (side < 0 ? 0 : 1)), foot: null, from: null, to: null, swing: 0, lift: 0 }));

  // world state: x along the edge (px from the button's left), heading angle (0 = facing right, PI = facing left)
  const st = { x: 0, y: 0, ang: 0, target: 0, mode: "walk", modeT: 0, modeLen: 1.6, speed: 26, dir: 1, phase: 0, twitch: 0, palp: 0 };
  const edge = () => { const w = btn.clientWidth; return { min: 20, max: Math.max(40, w - 20) }; };
  { const e = edge(); st.x = e.max - 30; st.dir = -1; st.ang = Math.PI; }

  const toWorld = (p) => { const c = Math.cos(st.ang), s = Math.sin(st.ang); return [st.x + (p[0] * c - p[1] * s) * S, st.y + (p[0] * s + p[1] * c) * S]; };
  function plant(l) { l.foot = toWorld(l.rest); }
  legs.forEach(plant);

  function pickMode() {
    const e = edge(), r = Math.random();
    if (st.mode === "walk") {
      st.mode = r < .75 ? "pause" : "turn";
      st.modeLen = st.mode === "pause" ? .5 + Math.random() * 2.2 : .9;
      if (st.mode === "turn") st.dir *= -1;
    } else {
      // keep walking the same way unless near an end
      if ((st.dir > 0 && st.x > e.max - 25) || (st.dir < 0 && st.x < e.min + 25)) { st.mode = "turn"; st.dir *= -1; st.modeLen = .9; return; }
      st.mode = "walk"; st.modeLen = .5 + Math.random() * 1.8; st.speed = 18 + Math.random() * 26;
    }
  }

  let last = 0;
  function step(dt) {
    st.modeT += dt;
    if (st.modeT > st.modeLen) { st.modeT = 0; pickMode(); }
    const e = edge(), want = st.dir > 0 ? 0 : Math.PI;
    let moving = 0;
    if (st.mode === "walk") {
      const v = st.speed * st.dir;
      st.x += v * dt; moving = Math.abs(v);
      if (st.x > e.max) { st.x = e.max; st.modeT = st.modeLen; } if (st.x < e.min) { st.x = e.min; st.modeT = st.modeLen; }
    }
    // turn in place: rotate the body toward the new heading, legs reposition as it pivots
    let da = want - st.ang; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    const turnRate = 4.2 * dt;
    if (Math.abs(da) > .001) { const s = Math.sign(da) * Math.min(Math.abs(da), turnRate); st.ang += s; moving = Math.max(moving, Math.abs(s) / dt * 9); }

    // gait clock advances with movement (distance / stride), so legs never moonwalk
    st.phase += moving * dt / 8 * Math.PI;
    const active = Math.floor(st.phase / Math.PI) % 2;           // which group swings right now
    for (const l of legs) {
      const goal = toWorld([l.rest[0] + (st.mode === "walk" ? l.stride * .45 : 0), l.rest[1]]);
      const dx = goal[0] - l.foot[0], dy = goal[1] - l.foot[1], far = Math.hypot(dx, dy);
      if (l.swing > 0) {                                           // mid-step: move the foot along an arc to its target
        l.swing = Math.min(1, l.swing + dt / .14);
        const k = l.swing, ease = k * k * (3 - 2 * k);
        l.foot = [l.from[0] + (l.to[0] - l.from[0]) * ease, l.from[1] + (l.to[1] - l.from[1]) * ease];
        l.lift = Math.sin(Math.PI * k);
        if (l.swing >= 1) { l.swing = 0; l.lift = 0; }
      } else if ((l.group === active && moving > 1 && far > l.stride * .35) || far > l.stride * 1.4) {
        l.from = l.foot.slice(); l.to = toWorld([l.rest[0] + (st.mode === "walk" ? l.stride * .4 : 0), l.rest[1]]); l.swing = .001;
      }
    }
    // idle life: a leg twitch now and then, pedipalps feel around
    st.palp += dt * (st.mode === "pause" ? 7 : 3);
    if (st.mode === "pause" && Math.random() < dt * .9) { const l = legs[Math.floor(Math.random() * legs.length)]; if (!l.swing) { l.from = l.foot.slice(); l.to = toWorld([l.rest[0] + (Math.random() - .5) * 3, l.rest[1] * (1 + (Math.random() - .5) * .12)]); l.swing = .001; } }
  }

  function ik(h, f) { // two-bone IK: of the two possible knees, use the one farther from the body, so legs arch outward
    const F = FEMUR * S, T = TIBIA * S;
    let dx = f[0] - h[0], dy = f[1] - h[1], d = Math.hypot(dx, dy) || .001;
    const max = F + T - .01; if (d > max) { f = [h[0] + dx / d * max, h[1] + dy / d * max]; dx = f[0] - h[0]; dy = f[1] - h[1]; d = max; }
    const min = Math.abs(F - T) + .5; if (d < min) { f = [h[0] + dx / d * min, h[1] + dy / d * min]; dx = f[0] - h[0]; dy = f[1] - h[1]; d = min; }
    const a = Math.acos(Math.max(-1, Math.min(1, (F * F + d * d - T * T) / (2 * F * d)))), base = Math.atan2(dy, dx);
    const k1 = [h[0] + Math.cos(base + a) * F, h[1] + Math.sin(base + a) * F], k2 = [h[0] + Math.cos(base - a) * F, h[1] + Math.sin(base - a) * F];
    const dist = k => Math.hypot(k[0] - st.x, k[1] - st.y);
    return [dist(k1) > dist(k2) ? k1 : k2, f];
  }

  function draw() {
    // the canvas is centered on the spider: shift world coords so the body sits in the middle
    const ox = CW / 2 - st.x, oy = CH / 2 - st.y;
    host.style.transform = `translate(${st.x - CW / 2}px, 0)`;
    ctx.setTransform(D, 0, 0, D, 0, 0); ctx.clearRect(0, 0, CW, CH);
    ctx.translate(ox, oy);
    // soft contact shadow on the button
    ctx.fillStyle = "rgba(60,16,0,.26)"; ctx.beginPath(); ctx.ellipse(st.x + 1, st.y + 3, 13, 7, 0, 0, Math.PI * 2); ctx.fill();
    // legs (far side first)
    for (const l of legs) {
      const h = toWorld(l.hip);
      // seen from above, a lifted leg draws in toward the body
      const pull = l.lift * .22, f0 = [l.foot[0] + (h[0] - l.foot[0]) * pull, l.foot[1] + (h[1] - l.foot[1]) * pull];
      const [kn, ft] = ik(h, f0);
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.strokeStyle = "#0a0610"; ctx.lineWidth = 2.1; ctx.beginPath(); ctx.moveTo(h[0], h[1]); ctx.lineTo(kn[0], kn[1]); ctx.stroke();
      ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(kn[0], kn[1]); ctx.lineTo(ft[0], ft[1]); ctx.stroke();
      ctx.strokeStyle = "rgba(200,170,255,.35)"; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(h[0], h[1] - .6); ctx.lineTo(kn[0], kn[1] - .6); ctx.stroke(); // rim light
      ctx.fillStyle = "#0a0610"; ctx.beginPath(); ctx.arc(kn[0], kn[1], 1.1, 0, Math.PI * 2); ctx.fill();
    }
    // body: abdomen, cephalothorax, pedipalps, eyes
    ctx.save(); ctx.translate(st.x, st.y); ctx.rotate(st.ang);
    const bob = 1 + .03 * Math.sin(st.phase * 2);
    ctx.scale(S * bob, S / bob);
    const ab = ctx.createRadialGradient(-7, -2.4, .5, -6.5, 0, 7.5); ab.addColorStop(0, "#3a2a46"); ab.addColorStop(.35, "#150c1c"); ab.addColorStop(1, "#050208");
    ctx.fillStyle = ab; ctx.beginPath(); ctx.ellipse(-7, 0, 7.2, 5.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,90,20,.85)"; ctx.beginPath(); ctx.moveTo(-9.5, -1.4); ctx.lineTo(-7, 0); ctx.lineTo(-9.5, 1.4); ctx.lineTo(-4.5, 1.4); ctx.lineTo(-7, 0); ctx.lineTo(-4.5, -1.4); ctx.closePath(); ctx.fill(); // hourglass
    ctx.fillStyle = "rgba(230,210,255,.22)"; ctx.beginPath(); ctx.ellipse(-8.5, -2.6, 2.6, 1.1, -.3, 0, Math.PI * 2); ctx.fill();               // gloss
    const ce = ctx.createRadialGradient(1.8, -1.2, .3, 1.5, 0, 4.2); ce.addColorStop(0, "#2c2036"); ce.addColorStop(1, "#060309");
    ctx.fillStyle = ce; ctx.beginPath(); ctx.ellipse(1.6, 0, 4.2, 3.4, 0, 0, Math.PI * 2); ctx.fill();
    const pa = Math.sin(st.palp) * .35;
    ctx.strokeStyle = "#0a0610"; ctx.lineWidth = 1.1; ctx.lineCap = "round";
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(5, sd * 1); ctx.quadraticCurveTo(7, sd * (1.6 + pa * sd), 8.4, sd * (.7 + pa)); ctx.stroke(); }
    ctx.fillStyle = "#ff8a2a"; for (const [x, y] of [[4.6, -.7], [4.6, .7], [3.9, -1.5], [3.9, 1.5]]) { ctx.beginPath(); ctx.arc(x, y, .42, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }

  function loop(now) {
    if (!gate.isConnected) return;
    const dt = Math.min(.05, last ? (now - last) / 1000 : 0); last = now;
    step(dt); draw();
    requestAnimationFrame(loop);
  }
  if (reduce) { st.mode = "pause"; draw(); } else requestAnimationFrame(loop);
})();
