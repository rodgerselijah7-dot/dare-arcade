// Crown Rush clans.
// GET  /api/clans                                  -> { clans: { id: {...} }, players: { pid: {...} } }
// POST { op:"save",   pid, key, player:{nm,k,c,rp,clan,cp} } -> save this phone's racer (name, look, rank, clan, clan points)
// POST { op:"create", pid, key, id, clan:{name,tag,color,emb} } -> start a clan (the game then saves the player into it)
// Players have no accounts: each phone makes a random player id and a secret key. The first save stores a hash of
// the key, and later saves for that id must bring the same key, so nobody else can change your racer or clan.
// Redis: arc:cr:clans   hash id  -> { name, tag, color, emb, owner, at }
//        arc:cr:players hash pid -> { nm, k, c, rp, clan, cp, at, kh }   (kh = sha256 of the phone's key, never sent out)
const crypto = require("crypto");
const { hasRedis, redis, readJson, clientIp, rateLimit } = require("./_lib");

const PID = /^[a-z0-9]{16}$/, KEY = /^[a-z0-9]{24}$/, CID = /^c[a-z0-9]{8,24}$/;
const COLORS = ["#ffc83d", "#ff4f6d", "#4fb8ff", "#4fe39a", "#b47cff", "#ff8a45", "#f4efe1"];
const EMBS = ["👑", "⚡", "🔥", "⭐", "🐾", "💀", "🌙", "🦁"];
const KINDS = /^(teddy|redpanda|cyborg|dino|alien|penguin|fox|bunny|frog|cat|monkey|owl|shark|robot|ghost|dragon)$/;
const MAX_CLANS = 300, MAX_PLAYERS = 5000, MAX_CP_STEP = 80;
const hash = k => crypto.createHash("sha256").update(String(k)).digest("hex");
const txt = (v, n) => String(v || "").replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁯<>]/g, "").replace(/\s+/g, " ").trim().slice(0, n);
const int = (v, max) => Math.max(0, Math.min(max, Math.floor(+v || 0)));
function pairs(flat) {
  const out = {};
  for (let i = 0; i < (flat || []).length; i += 2) { try { out[flat[i]] = JSON.parse(flat[i + 1]); } catch (e) {} }
  return out;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!hasRedis()) return res.status(503).json({ error: "Clans aren't available right now." });
  if (!(await rateLimit(`clans:${clientIp(req)}`, 120, 60)).ok) return res.status(429).json({ error: "Too many requests. Wait a moment." });
  try {
    if (req.method === "GET") {
      const [c, p] = await Promise.all([redis("HGETALL", "arc:cr:clans"), redis("HGETALL", "arc:cr:players")]);
      const clans = pairs(c), players = pairs(p);
      for (const id in players) { delete players[id].kh; if (players[id].clan && !clans[players[id].clan]) players[id].clan = null; }
      return res.status(200).json({ clans, players });
    }
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const b = await readJson(req);
    const pid = String(b.pid || ""), key = String(b.key || "");
    if (!PID.test(pid) || !KEY.test(key)) return res.status(400).json({ error: "Bad player id." });
    const raw = await redis("HGET", "arc:cr:players", pid);
    const prev = raw ? JSON.parse(raw) : null;
    if (prev && prev.kh !== hash(key)) return res.status(403).json({ error: "This racer belongs to another phone." });

    if (b.op === "create") {
      const id = String(b.id || ""), c = b.clan || {};
      const name = txt(c.name, 18), tag = txt(c.tag, 4).toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (!CID.test(id)) return res.status(400).json({ error: "Bad clan id." });
      if (name.length < 3) return res.status(400).json({ error: "Give your clan a name of at least 3 characters." });
      if (tag.length < 2) return res.status(400).json({ error: "Pick a tag of 2 to 4 letters or numbers." });
      const clans = pairs(await redis("HGETALL", "arc:cr:clans"));
      if (clans[id]) return res.status(409).json({ error: "Try again." });
      if (Object.keys(clans).length >= MAX_CLANS) return res.status(409).json({ error: "The clan list is full." });
      if (Object.values(clans).some(x => x.tag === tag)) return res.status(409).json({ error: "That tag is taken. Try another." });
      const clan = { name, tag, color: COLORS.includes(c.color) ? c.color : COLORS[0], emb: EMBS.includes(c.emb) ? c.emb : EMBS[0], owner: pid, at: Date.now() };
      await redis("HSET", "arc:cr:clans", id, JSON.stringify(clan));
      return res.status(200).json({ ok: true, id });
    }

    if (b.op === "save") {
      const p = b.player || {};
      if (!prev && +(await redis("HLEN", "arc:cr:players")) >= MAX_PLAYERS) return res.status(409).json({ error: "The clan board is full." });
      let clan = p.clan ? String(p.clan) : null;
      if (clan && (!CID.test(clan) || !(await redis("HEXISTS", "arc:cr:clans", clan)))) clan = null;
      let cp = int(p.cp, 1e7);
      if (prev && prev.clan === clan) cp = Math.min(cp, (prev.cp | 0) + MAX_CP_STEP); // no big jumps between races
      else cp = 0;                                                                      // new clan, fresh start
      const body = {
        nm: txt(p.nm, 14) || "Racer", k: KINDS.test(String(p.k)) ? String(p.k) : "teddy",
        c: /^#[0-9a-f]{6}$/i.test(String(p.c)) ? String(p.c) : "#ffc83d", rp: int(p.rp, 1e7), clan, cp, at: Date.now(), kh: hash(key)
      };
      await redis("HSET", "arc:cr:players", pid, JSON.stringify(body));
      delete body.kh;
      return res.status(200).json({ ok: true, player: body });
    }
    return res.status(400).json({ error: "Unknown request." });
  } catch (e) {
    return res.status(502).json({ error: "Couldn't reach the clan server. Try again." });
  }
};
