// Live Fire Range leaderboards.
// GET  /api/scores?drill=bill                       -> { top: [{ pid, name, v }] }  (25 best)
// POST { drill, v, pid, name }                      -> { ok: true }
// Each drill is one Redis sorted set, arc:lfr:<drill>, holding each player's best (lowest time, or highest score for
// the 60-second drill). Names live in the hash arc:lfr:names. Players have no accounts: pid is a random id the phone makes.
const { hasRedis, redis, readJson, clientIp, rateLimit } = require("./_lib");

const DRILLS = { bill: "time", prez: "time", rack: "time", mover: "time", popper: "time", ladder: "time", house: "time", sixty: "score",
  steel: "time", paper: "time", swing: "time", valley: "time", yard: "time", course: "time", threegun: "time" };
const PID = /^p[a-z0-9]{6,16}$/;
const KEEP = 500;
const cleanName = s => String(s || "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 18) || "Shooter";

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!hasRedis()) return res.status(503).json({ error: "Leaderboards aren't available right now." });
  try {
    if (req.method === "GET") {
      const drill = String((req.query && req.query.drill) || new URL(req.url, "http://x").searchParams.get("drill") || "");
      if (!DRILLS[drill]) return res.status(400).json({ error: "Unknown drill." });
      if (!(await rateLimit(`scores:get:${clientIp(req)}`, 240, 60)).ok) return res.status(429).json({ error: "Too many requests. Wait a moment." });
      const key = `arc:lfr:${drill}`;
      const flat = DRILLS[drill] === "score"
        ? await redis("ZRANGE", key, 0, 24, "REV", "WITHSCORES")
        : await redis("ZRANGE", key, 0, 24, "WITHSCORES");
      const rows = [];
      for (let i = 0; i < (flat || []).length; i += 2) rows.push({ pid: flat[i], v: +flat[i + 1] });
      const names = rows.length ? await redis("HMGET", "arc:lfr:names", ...rows.map(r => r.pid)) : [];
      rows.forEach((r, i) => { r.name = (names && names[i]) || "Shooter"; });
      return res.status(200).json({ top: rows });
    }
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    if (!(await rateLimit(`scores:post:${clientIp(req)}`, 40, 600)).ok) return res.status(429).json({ error: "Too many runs saved. Wait a few minutes." });
    const b = await readJson(req);
    const drill = String(b.drill || ""), pid = String(b.pid || ""), v = Number(b.v);
    if (!DRILLS[drill] || !PID.test(pid) || !Number.isFinite(v)) return res.status(400).json({ error: "Bad run." });
    const isScore = DRILLS[drill] === "score";
    if (isScore ? (v < 0 || v > 20000) : (v < 0.8 || v > 600)) return res.status(400).json({ error: "That run is out of range." });
    const key = `arc:lfr:${drill}`;
    await redis("ZADD", key, isScore ? "GT" : "LT", Math.round(v * 100) / 100, pid);
    await redis("HSET", "arc:lfr:names", pid, cleanName(b.name));
    if (isScore) await redis("ZREMRANGEBYRANK", key, 0, -(KEEP + 1));
    else await redis("ZREMRANGEBYRANK", key, KEEP, -1);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Leaderboard error. Try again." });
  }
};
