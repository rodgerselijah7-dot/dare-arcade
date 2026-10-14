// Live match rooms for online play in DARE Buckets, DARE Chess and DARE Connect.
// POST { room, peer, presence } -> { now, peers: [{ peer, presence }] }   (each phone polls ~6x a second during a match)
// POST { room, peer, leave: true } -> { ok: true }
// A room is one Redis hash, arc:room:<name>, holding each player's latest state. Players who stop polling for
// 8 seconds drop out, and the whole room expires 10 minutes after its last update.
const { hasRedis, readJson, clientIp, rateLimit } = require("./_lib");

const R_URL = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const R_TOKEN = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
async function pipe(cmds) {
  const r = await fetch(R_URL().replace(/\/$/, "") + "/pipeline", {
    method: "POST",
    headers: { Authorization: `Bearer ${R_TOKEN()}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmds.map(c => c.map(String)))
  });
  const d = await r.json();
  if (!Array.isArray(d)) throw new Error("Redis: " + (d && d.error));
  return d.map(x => { if (x.error) throw new Error("Redis: " + x.error); return x.result; });
}

const ROOM = /^[a-z0-9][a-z0-9_.-]{0,47}$/;
const PEER = /^[a-z0-9]{8,24}$/;
const STALE_MS = 8000, MAX_PRESENCE = 4096, MAX_PEERS = 8;

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!hasRedis()) return res.status(503).json({ error: "Online play isn't available right now." });
  if (!(await rateLimit(`room:${clientIp(req)}`, 1500, 60)).ok) return res.status(429).json({ error: "Too many requests. Wait a moment." });

  const b = await readJson(req);
  const room = String(b.room || ""), peer = String(b.peer || "");
  if (!ROOM.test(room) || !PEER.test(peer)) return res.status(400).json({ error: "Bad room or player id." });
  const key = `arc:room:${room}`;

  try {
    if (b.leave) { await pipe([["HDEL", key, peer]]); return res.status(200).json({ ok: true }); }

    const presence = b.presence && typeof b.presence === "object" && !Array.isArray(b.presence) ? b.presence : {};
    const pjson = JSON.stringify(presence);
    if (Buffer.byteLength(pjson) > MAX_PRESENCE) return res.status(413).json({ error: "Player state too large." });

    const now = Date.now();
    const out = await pipe([
      ["HSET", key, peer, JSON.stringify({ t: now, p: presence })],
      ["EXPIRE", key, 600],
      ["HGETALL", key]
    ]);
    const flat = out[2] || [], peers = [], stale = [];
    for (let i = 0; i < flat.length; i += 2) {
      let v; try { v = JSON.parse(flat[i + 1]); } catch { stale.push(flat[i]); continue; }
      if (!v || now - v.t > STALE_MS) { stale.push(flat[i]); continue; }
      if (peers.length < MAX_PEERS) peers.push({ peer: flat[i], presence: v.p || {} });
    }
    if (stale.length) pipe([["HDEL", key, ...stale]]).catch(() => {});
    return res.status(200).json({ now, peers });
  } catch (e) {
    return res.status(502).json({ error: "Couldn't reach the match server. Try again." });
  }
};
