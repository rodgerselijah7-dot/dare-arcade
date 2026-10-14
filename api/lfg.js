// Open matches ("wants to play") and match alerts for DARE Buckets and DARE Chess.
//
// GET  /api/lfg                       -> { open: [{ game, code, nick, t }], key }   (key = VAPID public key for push)
// POST { op:"post",   game, code, nick, peer, ep? } -> post an open match; alerts everyone subscribed to that game
// POST { op:"keep",   game, code, peer }            -> keep it open (the host's game calls this every ~45s)
// POST { op:"cancel", game, code, peer }            -> take it down (opponent found, or host left)
// POST { op:"sub",    sub, games:[...] }            -> turn on match alerts for this device
// POST { op:"unsub",  endpoint }                    -> turn them off
//
// Redis: arc:lfg   hash  "<game>:<code>" -> { game, code, nick, peer, t, exp }   (entries live 150s past their last keep)
//        arc:push  hash  sha1(endpoint)  -> { sub, games, t }
//        arc:pushthr:<id>  per-device throttle so one phone gets at most one alert a minute
const crypto = require("crypto");
const { hasRedis, redis, readJson, clientIp, rateLimit } = require("./_lib");
const { vapid, sendPush } = require("./_push");

const GAMES = { buckets: "DARE Buckets", chess: "DARE Chess" };
const CODE = /^[A-HJ-NP-Z2-9]{4}$/;
const PEER = /^[a-z0-9]{8,24}$/;
const LIVE_MS = 150 * 1000;
const PUSH_HOSTS = /(^|\.)(fcm\.googleapis\.com|android\.googleapis\.com|push\.services\.mozilla\.com|push\.apple\.com|notify\.windows\.com|push\.api\.chromium\.org)$/;
const cleanNick = s => String(s || "").replace(/[^\p{L}\p{N} ._'-]/gu, "").trim().slice(0, 12) || "A player";
const subId = ep => crypto.createHash("sha1").update(String(ep)).digest("hex");

async function openList() {
  const flat = (await redis("HGETALL", "arc:lfg")) || [];
  const now = Date.now(), open = [], dead = [];
  for (let i = 0; i < flat.length; i += 2) {
    let v; try { v = JSON.parse(flat[i + 1]); } catch { dead.push(flat[i]); continue; }
    if (!v || v.exp < now) { dead.push(flat[i]); continue; }
    open.push(v);
  }
  if (dead.length) redis("HDEL", "arc:lfg", ...dead).catch(() => {});
  return open.sort((a, b) => b.t - a.t);
}

async function alertAll(entry, excludeEp) {
  const flat = (await redis("HGETALL", "arc:push")) || [];
  const skip = excludeEp ? subId(excludeEp) : "";
  const targets = [];
  for (let i = 0; i < flat.length && targets.length < 400; i += 2) {
    if (flat[i] === skip) continue;
    let v; try { v = JSON.parse(flat[i + 1]); } catch { continue; }
    if (v && v.sub && Array.isArray(v.games) && v.games.includes(entry.game)) targets.push([flat[i], v.sub]);
  }
  const msg = {
    title: GAMES[entry.game], body: `${entry.nick} wants to play. Tap to join match ${entry.code}.`,
    url: `/${entry.game}/?join=${entry.code}`, tag: `lfg-${entry.game}-${entry.code}`
  };
  let sent = 0;
  await Promise.all(targets.map(async ([id, sub]) => {
    try {
      if (!(await redis("SET", `arc:pushthr:${id}`, "1", "EX", 60, "NX"))) return; // alerted in the last minute
      const status = await sendPush(sub, msg);
      if (status === 404 || status === 410) await redis("HDEL", "arc:push", id);
      else if (status >= 200 && status < 300) sent++;
    } catch {}
  }));
  return sent;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!hasRedis()) return res.status(503).json({ error: "Match alerts aren't available right now." });
  const ip = clientIp(req);
  try {
    if (req.method === "GET") {
      if (!(await rateLimit(`lfg-get:${ip}`, 120, 60)).ok) return res.status(429).json({ error: "Too many requests." });
      const [open, keys] = await Promise.all([openList(), vapid().catch(() => null)]);
      res.setHeader("Cache-Control", "public, max-age=0, s-maxage=4, stale-while-revalidate=4");
      return res.status(200).json({ open: open.map(({ game, code, nick, t }) => ({ game, code, nick, t })), key: keys ? keys.publicKey : null });
    }
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const b = await readJson(req), op = String(b.op || "");

    if (op === "post" || op === "keep" || op === "cancel") {
      const game = String(b.game || ""), code = String(b.code || "").toUpperCase(), peer = String(b.peer || "");
      if (!GAMES[game] || !CODE.test(code) || !PEER.test(peer)) return res.status(400).json({ error: "Bad match." });
      const field = `${game}:${code}`;
      const cur = await redis("HGET", "arc:lfg", field);
      let entry = null; try { entry = cur && JSON.parse(cur); } catch {}
      if (entry && entry.peer !== peer) return res.status(409).json({ error: "That match code is taken." });
      if (op === "cancel") { if (entry) await redis("HDEL", "arc:lfg", field); return res.status(200).json({ ok: true }); }
      if (op === "keep") {
        if (!entry) return res.status(404).json({ error: "Not open." });
        entry.exp = Date.now() + LIVE_MS;
        await redis("HSET", "arc:lfg", field, JSON.stringify(entry));
        return res.status(200).json({ ok: true });
      }
      if (!(await rateLimit(`lfg-post:${ip}`, 8, 600)).ok) return res.status(429).json({ error: "You've posted a lot of matches. Wait a few minutes." });
      const now = Date.now();
      entry = { game, code, nick: cleanNick(b.nick), peer, t: now, exp: now + LIVE_MS };
      await redis("HSET", "arc:lfg", field, JSON.stringify(entry));
      await redis("EXPIRE", "arc:lfg", 3600);
      const alerted = await alertAll(entry, typeof b.ep === "string" ? b.ep : "").catch(() => 0);
      return res.status(200).json({ ok: true, alerted });
    }

    if (op === "sub") {
      if (!(await rateLimit(`lfg-sub:${ip}`, 30, 3600)).ok) return res.status(429).json({ error: "Too many requests." });
      const s = b.sub || {}, keys = s.keys || {};
      let host = ""; try { const u = new URL(String(s.endpoint)); if (u.protocol === "https:") host = u.hostname; } catch {}
      if (!PUSH_HOSTS.test(host) || typeof keys.p256dh !== "string" || typeof keys.auth !== "string" || keys.p256dh.length > 120 || keys.auth.length > 48)
        return res.status(400).json({ error: "This browser's alerts aren't supported." });
      const games = [...new Set((Array.isArray(b.games) ? b.games : []).filter(g => GAMES[g]))];
      if (!games.length) return res.status(400).json({ error: "Pick a game." });
      await redis("HSET", "arc:push", subId(s.endpoint), JSON.stringify({ sub: { endpoint: String(s.endpoint), keys: { p256dh: keys.p256dh, auth: keys.auth } }, games, t: Date.now() }));
      return res.status(200).json({ ok: true, games });
    }
    if (op === "unsub") {
      if (typeof b.endpoint === "string") await redis("HDEL", "arc:push", subId(b.endpoint));
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: "Unknown request." });
  } catch (e) {
    return res.status(502).json({ error: "Couldn't reach the match server. Try again." });
  }
};
