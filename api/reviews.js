// Player reviews for the arcade's games: a star rating (1-5) and an optional comment, one review per player per game.
//
// GET  /api/reviews                         -> { games, stats }                        (names + { game: { n, avg, d:[1★..5★] } })
// GET  /api/reviews?game=chess&sort=new|top&before=<t> -> { reviews, stats, games, more }  (20 at a time; no game = all games)
// POST { op:"save",   game, stars, text, name, pid }  -> { ok, review }   (adds, or replaces this player's review of that game)
// POST { op:"remove", game, pid }                     -> { ok }
// POST { op:"mine",   pid }                           -> { mine: { game: review } }
// POST { op:"report", id }                            -> { ok }           (flags a review for Don to look at)
// Admin (header x-admin-key = ARCADE_ADMIN_KEY):
// POST { op:"admin-list" }  -> { reviews (newest 200, reported first) }     POST { op:"admin-delete", id } -> { ok }
//
// Redis: arc:rev:<id>        review JSON { id, game, stars, name, text, t, edited, who }  (who = hash of the player's id)
//        arc:rev:all         sorted set, every review by time            arc:rev:g:<game>  sorted set, that game's reviews
//        arc:rev:own         hash  "<who>:<game>" -> id                  arc:rev:stat      hash  game -> { n, sum, d }
//        arc:rev:flag        sorted set, reported reviews by report count
// Players have no accounts: pid is a random id the phone keeps, and only its hash is stored.
const crypto = require("crypto");
const { hasRedis, redis, readJson, clientIp, rateLimit } = require("./_lib");

// Keep in step with the lobby when a game is added.
const GAMES = {
  "the-last-don": "The Last Don", "square-up": "Square Up", "dead-rise": "Dead Rise", "rare-rumble": "Rare Rumble",
  "rumble-karts": "Rumble Karts", "crown-rush": "Crown Rush", "chess": "Chess", "connect": "Connect", "dice": "Dice",
  "truth-or-dare": "Truth or Dare", "spades": "Spades", "pool": "Pool", "rebel-elimination": "Rebel Elimination",
  "cosmic-encounter": "Cosmic Encounter", "dirt-line": "Dirt Line", "grand-prix": "Grand Prix", "live-fire-range": "Live Fire Range",
  "open-season": "Open Season", "frostbound": "Frostbound", "crowd-run": "Crowd Run", "break-the-block": "Break the Block",
  "bubble": "Bubble Blaster", "ori": "ORI", "2048": "2048", "1010": "1010", "jenga": "Jenga", "buckets": "Buckets",
  "lunker-lake": "Lunker Lake", "southside-acres": "Southside Acres", "long-shot": "Long Shot", "crate-digger": "Crate Digger", "game-day": "Game Day", "slang-search": "Slang Search", "divine-axioms": "Divine Axioms"
};
const PID = /^r[a-z0-9]{10,32}$/;
const ID = /^[a-z0-9]{10}$/;
const PAGE = 20, KEEP_ALL = 3000, MAX_TEXT = 500;
const who = pid => crypto.createHash("sha256").update("dare-rev:" + pid).digest("hex").slice(0, 20);

// Strong swears are starred out; links and contact details aren't allowed (keeps spam out).
const SWEAR = /\b(f+u+c+k+\w*|s+h+i+t+\w*|b+i+t+c+h+\w*|a+s+s+h+o+l+e+s?|c+u+n+t+s?|d+i+c+k+(head)?s?|p+u+s+s+y|motherf\w*|bastards?|wh+o+r+e+s?|sl+u+t+s?)\b/gi;
const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|co|xyz|gg|app|ly|me)\b|@[a-z0-9_]{3,}|\b\d{3}[\s.-]?\d{3}[\s.-]?\d{4}\b)/i;
const clean = s => String(s || "").normalize("NFC").replace(/[\u0000-\u0008\u000b-\u001f\u007f<>]/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
const star = w => w[0] + "*".repeat(Math.max(1, w.length - 1));
const cleanName = s => clean(s).replace(/\n/g, " ").replace(SWEAR, star).slice(0, 20) || "A player";

const pub = r => r && ({ id: r.id, game: r.game, stars: r.stars, name: r.name, text: r.text, t: r.t, edited: r.edited || 0 });
async function getMany(ids) {
  if (!ids.length) return [];
  const vals = await redis("MGET", ...ids.map(id => "arc:rev:" + id));
  return (vals || []).map(v => { try { return JSON.parse(v); } catch { return null; } }).filter(Boolean);
}
async function restat(game) {
  const ids = (await redis("ZRANGE", "arc:rev:g:" + game, 0, -1)) || [];
  const rs = await getMany(ids), d = [0, 0, 0, 0, 0];
  let sum = 0; for (const r of rs) { d[r.stars - 1]++; sum += r.stars; }
  if (rs.length) await redis("HSET", "arc:rev:stat", game, JSON.stringify({ n: rs.length, sum, d }));
  else await redis("HDEL", "arc:rev:stat", game);
}
async function allStats() {
  const flat = (await redis("HGETALL", "arc:rev:stat")) || [], out = {};
  for (let i = 0; i < flat.length; i += 2) {
    try { const s = JSON.parse(flat[i + 1]); if (GAMES[flat[i]] && s.n) out[flat[i]] = { n: s.n, avg: Math.round(s.sum / s.n * 10) / 10, d: s.d }; } catch {}
  }
  return out;
}
async function drop(r) {
  await Promise.all([
    redis("DEL", "arc:rev:" + r.id), redis("ZREM", "arc:rev:all", r.id), redis("ZREM", "arc:rev:g:" + r.game, r.id),
    redis("ZREM", "arc:rev:flag", r.id), redis("HDEL", "arc:rev:own", r.who + ":" + r.game)
  ]);
  await restat(r.game);
}
const keyOk = given => {
  const want = process.env.ARCADE_ADMIN_KEY || "";
  if (want.length < 8 || !given) return false;
  const a = crypto.createHash("sha256").update(String(given)).digest(), b = crypto.createHash("sha256").update(want).digest();
  return crypto.timingSafeEqual(a, b);
};

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!hasRedis()) return res.status(503).json({ error: "Reviews aren't available right now." });
  const ip = clientIp(req);
  try {
    if (req.method === "GET") {
      if (!(await rateLimit(`rev-get:${ip}`, 240, 60)).ok) return res.status(429).json({ error: "Too many requests. Wait a moment." });
      const q = new URL(req.url, "http://x").searchParams;
      const game = String(q.get("game") || ""), sort = q.get("sort") === "top" ? "top" : "new";
      const stats = await allStats();
      if (!q.has("game") && !q.has("list")) {
        res.setHeader("Cache-Control", "public, max-age=0, s-maxage=30, stale-while-revalidate=60");
        return res.status(200).json({ games: GAMES, stats });
      }
      if (game && !GAMES[game]) return res.status(400).json({ error: "Unknown game." });
      const key = game ? "arc:rev:g:" + game : "arc:rev:all";
      let reviews, more = false;
      if (sort === "top") {
        // best first, then longest comments, then newest (from the newest 400)
        const rs = await getMany((await redis("ZRANGE", key, 0, 399, "REV")) || []);
        rs.sort((a, b) => b.stars - a.stars || (b.text ? 1 : 0) - (a.text ? 1 : 0) || b.t - a.t);
        const skip = Math.max(0, parseInt(q.get("skip") || "0", 10) || 0);
        reviews = rs.slice(skip, skip + PAGE); more = rs.length > skip + PAGE;
      } else {
        const before = Number(q.get("before")) || 0;
        const ids = before
          ? await redis("ZRANGE", key, "(" + before, "-inf", "BYSCORE", "REV", "LIMIT", 0, PAGE + 1)
          : await redis("ZRANGE", key, 0, PAGE, "REV");
        reviews = await getMany((ids || []).slice(0, PAGE)); more = (ids || []).length > PAGE;
      }
      return res.status(200).json({ games: GAMES, stats, reviews: reviews.map(pub), more });
    }
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const b = await readJson(req), op = String(b.op || "");

    if (op === "admin-list" || op === "admin-delete") {
      if (!keyOk(req.headers["x-admin-key"])) {
        const r = await rateLimit(`admbad:${ip}`, 8, 900).catch(() => ({ ok: true }));
        return res.status(r.ok ? 401 : 429).json({ error: r.ok ? "Wrong password." : "Too many wrong tries. Wait 15 minutes." });
      }
      if (op === "admin-delete") {
        const id = String(b.id || ""); if (!ID.test(id)) return res.status(400).json({ error: "Bad review." });
        const [r] = await getMany([id]); if (r) await drop(r);
        return res.status(200).json({ ok: true });
      }
      const flagged = (await redis("ZRANGE", "arc:rev:flag", 0, 49, "REV", "WITHSCORES")) || [];
      const flags = {}; for (let i = 0; i < flagged.length; i += 2) flags[flagged[i]] = +flagged[i + 1];
      const ids = [...new Set([...Object.keys(flags), ...((await redis("ZRANGE", "arc:rev:all", 0, 199, "REV")) || [])])];
      const rs = (await getMany(ids)).map(r => ({ ...pub(r), reports: flags[r.id] || 0 }));
      return res.status(200).json({ games: GAMES, reviews: rs });
    }

    if (op === "report") {
      const id = String(b.id || ""); if (!ID.test(id)) return res.status(400).json({ error: "Bad review." });
      if (!(await rateLimit(`rev-rep:${ip}:${id}`, 1, 86400)).ok) return res.status(200).json({ ok: true });
      if (!(await rateLimit(`rev-rep:${ip}`, 20, 3600)).ok) return res.status(429).json({ error: "Too many reports. Wait a while." });
      if (await redis("EXISTS", "arc:rev:" + id)) await redis("ZINCRBY", "arc:rev:flag", 1, id);
      return res.status(200).json({ ok: true });
    }

    const pid = String(b.pid || "");
    if (!PID.test(pid)) return res.status(400).json({ error: "Reload the page and try again." });
    const me = who(pid);

    if (op === "mine") {
      const flat = (await redis("HGETALL", "arc:rev:own")) || [], ids = [];
      for (let i = 0; i < flat.length; i += 2) if (flat[i].startsWith(me + ":")) ids.push(flat[i + 1]);
      const mine = {}; for (const r of await getMany(ids)) mine[r.game] = pub(r);
      return res.status(200).json({ mine });
    }

    const game = String(b.game || "");
    if (!GAMES[game]) return res.status(400).json({ error: "Pick a game." });
    const ownKey = me + ":" + game, curId = await redis("HGET", "arc:rev:own", ownKey);
    const [cur] = curId ? await getMany([curId]) : [];

    if (op === "remove") {
      if (cur) await drop(cur);
      return res.status(200).json({ ok: true });
    }
    if (op !== "save") return res.status(400).json({ error: "Unknown request." });

    const stars = Math.round(Number(b.stars));
    if (!(stars >= 1 && stars <= 5)) return res.status(400).json({ error: "Tap 1 to 5 stars." });
    const raw = clean(b.text);
    if (raw.length > MAX_TEXT) return res.status(400).json({ error: `Keep it under ${MAX_TEXT} characters.` });
    if (LINK.test(raw)) return res.status(400).json({ error: "Links, handles and phone numbers can't go in reviews." });
    if (!(await rateLimit(`rev-save:${ip}`, 12, 3600)).ok) return res.status(429).json({ error: "You've posted a lot of reviews. Try again in a little while." });
    const now = Date.now();
    const r = {
      id: cur ? cur.id : crypto.randomBytes(8).toString("base64").replace(/[^a-z0-9]/gi, "").toLowerCase().padEnd(10, "x").slice(0, 10),
      game, stars, name: cleanName(b.name), text: raw.replace(SWEAR, star), t: cur ? cur.t : now, edited: cur ? now : 0, who: me
    };
    await redis("SET", "arc:rev:" + r.id, JSON.stringify(r));
    await Promise.all([
      redis("ZADD", "arc:rev:all", r.t, r.id), redis("ZADD", "arc:rev:g:" + game, r.t, r.id), redis("HSET", "arc:rev:own", ownKey, r.id)
    ]);
    if (cur) await redis("ZREM", "arc:rev:flag", r.id);   // an edited review gets a fresh start
    await restat(game);
    const extra = await redis("ZRANGE", "arc:rev:all", 0, -KEEP_ALL - 1);   // trim the oldest past the cap
    if (extra && extra.length) for (const old of await getMany(extra)) await drop(old);
    return res.status(200).json({ ok: true, review: pub(r) });
  } catch (e) {
    return res.status(502).json({ error: "Couldn't reach reviews. Try again." });
  }
};
