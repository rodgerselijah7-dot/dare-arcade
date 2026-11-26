// Southside Acres: live neighborhood (farms, friend codes, gifts, market, help, chat, likes) and farm alerts
// that reach the phone even when the game is closed.
//
// Players have no accounts. The phone keeps a random secret key; its farm id (uid) is sha256("acres:" + key), so only
// the phone holding the key can write as that farm. Every call is POST { op, key?, ... } and returns JSON.
//
//   { op:"farms" }                                  -> { farms: [...] }        recent public farm profiles
//   { op:"farm", key, farm:{...} }                  -> { ok }                  publish my farm profile
//   { op:"getFarm", id }                            -> { farm }                one farm (friends)
//   { op:"code", key }                              -> { code }                register my 6-character friend code
//   { op:"lookup", code }                           -> { uid }
//   { op:"gift", key, to, item, qty, from }         -> { ok }                  one gift per friend per day
//   { op:"gifts", key }                             -> { gifts: [...] }        gifts sent to me (last 50)
//   { op:"market" } / { op:"help" } / { op:"chat" } -> { items: [...] }
//   { op:"list", key, item, qty, price, farm }      -> { id }                  put a stand listing in the paper
//   { op:"buy", key, id, bot? }                     -> { ok }                  first buyer wins (atomic)
//   { op:"unlist", key, id }                        -> { ok }
//   { op:"ask", key, kind, ref, farm, ... }         -> { id }                  help request
//   { op:"fill", key, id }  / { op:"unask", key, id }
//   { op:"say", key, txt, farm } / { op:"unsay", key, id }
//   { op:"like", key, farm } / { op:"likes", key }
//   { op:"alerts", key, sub?, items:[{ at, tag, body }] } -> { ok }        schedule push alerts (empty items = clear)
//   GET /api/acres?cron=1  (Vercel cron every 5 minutes, see vercel.json)                  -> sends alerts that are due
//
// Redis keys all start with arc:acres:
const crypto = require("crypto");
const { hasRedis, redis, readJson, clientIp, rateLimit } = require("./_lib");
const { sendPush } = require("./_push");

const P = "arc:acres:";
const DAY = 86400;
const uidOf = key => crypto.createHash("sha256").update("acres:" + key).digest("hex").slice(0, 16);
const KEY = /^[A-Za-z0-9]{24,48}$/;
const UID = /^[a-f0-9]{16}$/;
const ID = /^[a-z0-9]{10}$/;
const CODE_ABC = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const newId = () => [...crypto.randomBytes(10)].map(b => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
const clean = (s, n) => String(s || "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, n);
const PUSH_HOSTS = /(^|\.)(fcm\.googleapis\.com|android\.googleapis\.com|push\.services\.mozilla\.com|push\.apple\.com|notify\.windows\.com|push\.api\.chromium\.org)$/;
const ITEM = /^[a-zA-Z]{2,20}$/;

// Same 6-character code the game shows (FNV-1a over the farm id).
function codeOf(uid) {
  let h = 2166136261; for (const c of uid) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  let s = ""; for (let i = 0; i < 6; i++) { s += CODE_ABC[h % CODE_ABC.length]; h = Math.floor(h / CODE_ABC.length) + i * 7919; } return s;
}
const j = s => { try { return JSON.parse(s); } catch { return null; } };

// Sorted-set + hash collections (market, help, chat): newest first, capped, entries expire.
async function addTo(coll, id, data, cap, ttlMs) {
  const t = Date.now();
  await redis("HSET", P + coll, id, JSON.stringify({ ...data, id, t }));
  await redis("ZADD", P + coll + ":z", t, id);
  // trim: oldest beyond cap, and anything past its lifetime
  const old = (await redis("ZRANGEBYSCORE", P + coll + ":z", "-inf", t - ttlMs)) || [];
  const n = await redis("ZCARD", P + coll + ":z");
  const over = n > cap ? (await redis("ZRANGE", P + coll + ":z", 0, n - cap - 1)) || [] : [];
  const gone = [...new Set([...old, ...over])];
  if (gone.length) { await redis("ZREM", P + coll + ":z", ...gone); await redis("HDEL", P + coll, ...gone); await redis("HDEL", P + coll + ":claim", ...gone); }
}
async function listOf(coll, n) {
  const ids = (await redis("ZREVRANGE", P + coll + ":z", 0, n - 1)) || [];
  if (!ids.length) return [];
  const [rows, claims] = await Promise.all([redis("HMGET", P + coll, ...ids), redis("HMGET", P + coll + ":claim", ...ids)]);
  return ids.map((id, i) => { const d = j(rows[i]); if (!d) return null; return { ...d, claimedBy: claims[i] || "" }; }).filter(Boolean);
}
async function removeFrom(coll, id, uid, field) {
  const d = j(await redis("HGET", P + coll, id));
  if (!d) return true;
  if (d[field] !== uid) return false;
  await redis("HDEL", P + coll, id); await redis("ZREM", P + coll + ":z", id); await redis("HDEL", P + coll + ":claim", id);
  return true;
}

/* ---------- alerts ---------- */
const TAGS = /^[a-z]{2,12}$/;
async function scheduleAlerts(uid, sub, items) {
  if (sub) await redis("HSET", P + "subs", uid, JSON.stringify(sub));
  const prev = (await redis("SMEMBERS", P + "tags:" + uid)) || [];
  const keep = new Set();
  for (const it of items.slice(0, 12)) {
    const tag = String(it.tag || ""), at = Math.round(+it.at), body = clean(it.body, 140);
    if (!TAGS.test(tag) || !body || !(at > Date.now() - 60000) || at > Date.now() + 14 * DAY * 1000) continue;
    const m = uid + ":" + tag; keep.add(m);
    await redis("HSET", P + "alert", m, body);
    await redis("ZADD", P + "due", at, m);
  }
  const drop = prev.filter(m => !keep.has(m));
  if (drop.length) { await redis("ZREM", P + "due", ...drop); await redis("HDEL", P + "alert", ...drop); }
  await redis("DEL", P + "tags:" + uid);
  if (keep.size) { await redis("SADD", P + "tags:" + uid, ...keep); await redis("EXPIRE", P + "tags:" + uid, 15 * DAY); }
}
async function sendDue(max = 80) {
  // one sender at a time
  const lock = await redis("SET", P + "cronlock", "1", "NX", "EX", 50);
  if (!lock) return 0;
  let sent = 0;
  try {
    const due = (await redis("ZRANGEBYSCORE", P + "due", "-inf", Date.now(), "LIMIT", 0, max)) || [];
    for (const m of due) {
      if (!(await redis("ZREM", P + "due", m))) continue; // someone else took it
      const body = await redis("HGET", P + "alert", m);
      await redis("HDEL", P + "alert", m);
      const uid = m.split(":")[0];
      const sub = j(await redis("HGET", P + "subs", uid));
      if (!sub || !body) continue;
      const st = await sendPush(sub, { title: "Southside Acres", body, tag: "acres-" + m.split(":")[1], url: "/southside-acres/", icon: "/southside-acres/icon-192.png" }, 3600);
      if (st === 404 || st === 410) await redis("HDEL", P + "subs", uid);
      else if (st >= 200 && st < 300) sent++;
    }
  } finally { await redis("DEL", P + "cronlock"); }
  return sent;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!hasRedis()) return res.status(503).json({ error: "The neighborhood is offline right now." });
  try {
    if (req.method === "GET") {
      if ((req.query && req.query.cron) || /vercel-cron/i.test(String((req.headers || {})['user-agent'] || ''))) return res.json({ sent: await sendDue() });
      return res.json({ ok: true });
    }
    if (req.method !== "POST") return res.status(405).end();
    const b = await readJson(req);
    const op = String(b.op || "");
    const ip = clientIp(req);
    if (!(await rateLimit("acres:" + ip, 240, 60)).ok) return res.status(429).json({ error: "Slow down a little." });
    const uid = KEY.test(String(b.key || "")) ? uidOf(b.key) : null;
    const need = () => { if (!uid) { res.status(400).json({ error: "No farm key" }); return false; } return true; };

    // a little opportunistic help for the cron: whoever is playing nudges due alerts out too
    if (Math.random() < 0.15) sendDue(30).catch(() => {});

    switch (op) {
      case "farms": {
        const ids = (await redis("ZREVRANGE", P + "farms", 0, 49)) || [];
        const rows = ids.length ? await redis("HMGET", P + "farm", ...ids) : [];
        return res.json({ farms: ids.map((id, i) => { const f = j(rows[i]); return f ? { ...f, id } : null; }).filter(Boolean) });
      }
      case "getFarm": {
        if (!UID.test(String(b.id || ""))) return res.json({ farm: null });
        const f = j(await redis("HGET", P + "farm", b.id));
        return res.json({ farm: f ? { ...f, id: b.id } : null });
      }
      case "farm": {
        if (!need()) return;
        if (!(await rateLimit("acres-pub:" + uid, 6, 60)).ok) return res.json({ ok: false });
        const f = b.farm || {};
        const objs = String(f.objs || "");
        if (objs.length > 60000) return res.status(413).json({ error: "Farm too big" });
        const farm = { name: clean(f.name, 24) || "A Southside farm", lvl: Math.max(1, Math.min(199, f.lvl | 0)), t: Date.now(), objs,
          land: Array.isArray(f.land) ? f.land.filter(x => /^[0-3],[0-3]$/.test(x)).slice(0, 16) : [],
          feat: f.feat && typeof f.feat === "object" ? { pond: !!f.feat.pond, dock: !!f.feat.dock, station: !!f.feat.station, mine: !!f.feat.mine } : {},
          fp: Math.max(0, f.fp | 0), fw: clean(f.fw, 12), beauty: Math.max(0, f.beauty | 0), hs: Math.max(0, Math.min(9, f.hs | 0)), ch: Math.max(0, f.ch | 0) };
        await redis("HSET", P + "farm", uid, JSON.stringify(farm));
        await redis("ZADD", P + "farms", Date.now(), uid);
        // keep the 300 most recently active farms in the public list (profiles stay readable for friends)
        const n = await redis("ZCARD", P + "farms"); if (n > 300) await redis("ZREMRANGEBYRANK", P + "farms", 0, n - 301);
        return res.json({ ok: true, uid });
      }
      case "code": {
        if (!need()) return;
        const code = codeOf(uid);
        await redis("SET", P + "code:" + code, uid);
        return res.json({ code, uid });
      }
      case "lookup": {
        const code = String(b.code || "").toUpperCase();
        if (!/^[A-Z0-9]{6}$/.test(code)) return res.json({ uid: null });
        if (!(await rateLimit("acres-look:" + ip, 20, 60)).ok) return res.status(429).json({ error: "Too many tries" });
        return res.json({ uid: (await redis("GET", P + "code:" + code)) || null });
      }
      case "gift": {
        if (!need()) return;
        const to = String(b.to || ""), item = String(b.item || ""), qty = b.qty | 0;
        if (!UID.test(to) || to === uid || !ITEM.test(item) || qty < 1 || qty > 10) return res.status(400).json({ error: "Bad gift" });
        const day = new Date().toISOString().slice(0, 10);
        if (!(await redis("SET", `${P}gifted:${uid}:${to}:${day}`, "1", "NX", "EX", 2 * DAY))) return res.json({ ok: false, error: "Already gifted today" });
        const g = { id: newId(), to, from: clean(b.from, 24) || "A Southside farm", item, qty, t: Date.now() };
        await redis("LPUSH", P + "gifts:" + to, JSON.stringify(g)); await redis("LTRIM", P + "gifts:" + to, 0, 49); await redis("EXPIRE", P + "gifts:" + to, 30 * DAY);
        // tell the friend's phone right away
        const sub = j(await redis("HGET", P + "subs", to));
        if (sub) sendPush(sub, { title: "Southside Acres", body: `🎁 ${g.from} sent you ${qty} ${item}!`, tag: "acres-gift", url: "/southside-acres/" }, 3600).then(st => { if (st === 404 || st === 410) redis("HDEL", P + "subs", to); }).catch(() => {});
        return res.json({ ok: true });
      }
      case "gifts": {
        if (!need()) return;
        const rows = (await redis("LRANGE", P + "gifts:" + uid, 0, 49)) || [];
        return res.json({ gifts: rows.map(j).filter(Boolean) });
      }
      case "market": return res.json({ items: (await listOf("mkt", 80)).map(m => ({ ...m, buyer: m.claimedBy })) });
      case "help": return res.json({ items: (await listOf("help", 60)).map(h => ({ ...h, filledBy: h.claimedBy })) });
      case "chat": return res.json({ items: await listOf("chat", 40) });
      case "list": {
        if (!need()) return;
        if (!(await rateLimit("acres-list:" + uid, 12, 60)).ok) return res.status(429).json({ error: "Too many listings" });
        const item = String(b.item || ""), qty = b.qty | 0, price = b.price | 0;
        if (!ITEM.test(item) || qty < 1 || qty > 10 || price < 1 || price > 100000) return res.status(400).json({ error: "Bad listing" });
        const id = newId();
        await addTo("mkt", id, { seller: uid, farm: clean(b.farm, 24), item, qty, price }, 200, 3 * DAY * 1000);
        return res.json({ id });
      }
      case "buy": {
        if (!need()) return;
        const id = String(b.id || ""); if (!ID.test(id)) return res.json({ ok: false });
        const d = j(await redis("HGET", P + "mkt", id)); if (!d) return res.json({ ok: false });
        if (d.seller === uid && !b.bot) return res.json({ ok: false });
        if (b.bot && d.seller !== uid) return res.json({ ok: false }); // townsfolk only buy from your own stand
        const ok = await redis("HSETNX", P + "mkt:claim", id, b.bot ? "bot" : uid);
        return res.json({ ok: !!ok });
      }
      case "unlist": { if (!need()) return; return res.json({ ok: await removeFrom("mkt", String(b.id || ""), uid, "seller") }); }
      case "ask": {
        if (!need()) return;
        if (!(await rateLimit("acres-ask:" + uid, 10, 60)).ok) return res.status(429).json({ error: "Too many requests" });
        const kind = clean(b.kind, 12), ref = clean(b.ref, 24);
        if (!kind || !ref) return res.status(400).json({ error: "Bad request" });
        const id = newId();
        const extra = {}; for (const k of ["item", "qty", "label", "e"]) if (b[k] !== undefined) extra[k] = typeof b[k] === "number" ? b[k] : clean(b[k], 40);
        await addTo("help", id, { owner: uid, farm: clean(b.farm, 24), kind, ref, ...extra }, 150, 2 * DAY * 1000);
        return res.json({ id });
      }
      case "fill": {
        if (!need()) return;
        const id = String(b.id || ""); if (!ID.test(id)) return res.json({ ok: false });
        const d = j(await redis("HGET", P + "help", id)); if (!d || d.owner === uid) return res.json({ ok: false });
        return res.json({ ok: !!(await redis("HSETNX", P + "help:claim", id, uid)) });
      }
      case "unask": { if (!need()) return; return res.json({ ok: await removeFrom("help", String(b.id || ""), uid, "owner") }); }
      case "say": {
        if (!need()) return;
        if (!(await rateLimit("acres-say:" + uid, 6, 30)).ok) return res.status(429).json({ error: "Slow down" });
        const txt = clean(b.txt, 140).replace(/https?:\/\/\S+/gi, "").trim();
        if (!txt) return res.status(400).json({ error: "Empty" });
        const id = newId();
        await addTo("chat", id, { u: uid, farm: clean(b.farm, 24) || "A neighbor", txt }, 80, 3 * DAY * 1000);
        return res.json({ id });
      }
      case "unsay": { if (!need()) return; return res.json({ ok: await removeFrom("chat", String(b.id || ""), uid, "u") }); }
      case "like": {
        if (!need()) return;
        const farm = String(b.farm || ""); if (!UID.test(farm) || farm === uid) return res.json({ ok: false });
        await redis("SADD", P + "likes:" + farm, uid);
        return res.json({ ok: true });
      }
      case "likes": { if (!need()) return; return res.json({ n: (await redis("SCARD", P + "likes:" + uid)) || 0 }); }
      case "alerts": {
        if (!need()) return;
        let sub = null;
        if (b.sub && b.sub.endpoint && b.sub.keys && b.sub.keys.p256dh && b.sub.keys.auth) {
          let host = ""; try { host = new URL(b.sub.endpoint).hostname; } catch {}
          if (!PUSH_HOSTS.test(host)) return res.status(400).json({ error: "Unknown push service" });
          sub = { endpoint: String(b.sub.endpoint), keys: { p256dh: String(b.sub.keys.p256dh), auth: String(b.sub.keys.auth) } };
        }
        await scheduleAlerts(uid, sub, Array.isArray(b.items) ? b.items : []);
        return res.json({ ok: true });
      }
      case "noalerts": { if (!need()) return; await scheduleAlerts(uid, null, []); await redis("HDEL", P + "subs", uid); return res.json({ ok: true }); }
      default: return res.status(400).json({ error: "Unknown op" });
    }
  } catch (e) {
    return res.status(500).json({ error: "Something went wrong" });
  }
};
