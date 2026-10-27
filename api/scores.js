// Arcade leaderboards for Live Fire Range and Dirt Line.
// GET  /api/scores?drill=bill                       -> { top: [{ pid, name, v }] }  (25 best; Live Fire Range when no game is given)
// GET  /api/scores?game=dl&drill=t-rookie           -> Dirt Line board (t-<course> = race time, j-<course> = Trick Jam score)
// POST { game, drill, v, pid, name }                -> { ok: true }
// Each board is one Redis sorted set holding each player's best (lowest time, or highest score). Names live in one hash
// per game. Players have no accounts: pid is a random id the phone makes.
const { hasRedis, redis, readJson, clientIp, rateLimit } = require("./_lib");

const DL_COURSES = ["rookie", "pro", "bigair", "desert", "ridge", "night"];
const BOARDS = {
  lfr: { prefix: "arc:lfr:", names: "arc:lfr:names", who: "Shooter", time: [0.8, 600], scoreMax: 20000,
    drills: { bill: "time", prez: "time", rack: "time", mover: "time", popper: "time", ladder: "time", house: "time", sixty: "score",
      steel: "time", paper: "time", swing: "time", valley: "time", yard: "time", course: "time", threegun: "time" } },
  dl: { prefix: "arc:dl:", names: "arc:dl:names", who: "Rider", time: [20, 900], scoreMax: 2000000,
    drills: Object.fromEntries(DL_COURSES.flatMap(c => [["t-" + c, "time"], ["j-" + c, "score"]])) }
};
const PID = /^p[a-z0-9]{6,16}$/;
const KEEP = 500;
const cleanName = (s, who) => String(s || "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 18) || who;

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!hasRedis()) return res.status(503).json({ error: "Leaderboards aren't available right now." });
  try {
    if (req.method === "GET") {
      const q = new URL(req.url, "http://x").searchParams;
      const board = BOARDS[String((req.query && req.query.game) || q.get("game") || "lfr")];
      const drill = String((req.query && req.query.drill) || q.get("drill") || "");
      if (!board || !board.drills[drill]) return res.status(400).json({ error: "Unknown drill." });
      if (!(await rateLimit(`scores:get:${clientIp(req)}`, 240, 60)).ok) return res.status(429).json({ error: "Too many requests. Wait a moment." });
      const key = board.prefix + drill;
      const flat = board.drills[drill] === "score"
        ? await redis("ZRANGE", key, 0, 24, "REV", "WITHSCORES")
        : await redis("ZRANGE", key, 0, 24, "WITHSCORES");
      const rows = [];
      for (let i = 0; i < (flat || []).length; i += 2) rows.push({ pid: flat[i], v: +flat[i + 1] });
      const names = rows.length ? await redis("HMGET", board.names, ...rows.map(r => r.pid)) : [];
      rows.forEach((r, i) => { r.name = (names && names[i]) || board.who; });
      return res.status(200).json({ top: rows });
    }
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    if (!(await rateLimit(`scores:post:${clientIp(req)}`, 40, 600)).ok) return res.status(429).json({ error: "Too many runs saved. Wait a few minutes." });
    const b = await readJson(req);
    const board = BOARDS[String(b.game || "lfr")];
    const drill = String(b.drill || ""), pid = String(b.pid || ""), v = Number(b.v);
    if (!board || !board.drills[drill] || !PID.test(pid) || !Number.isFinite(v)) return res.status(400).json({ error: "Bad run." });
    const isScore = board.drills[drill] === "score";
    if (isScore ? (v < 0 || v > board.scoreMax) : (v < board.time[0] || v > board.time[1])) return res.status(400).json({ error: "That run is out of range." });
    const key = board.prefix + drill;
    await redis("ZADD", key, isScore ? "GT" : "LT", Math.round(v * 100) / 100, pid);
    await redis("HSET", board.names, pid, cleanName(b.name, board.who));
    if (isScore) await redis("ZREMRANGEBYRANK", key, 0, -(KEEP + 1));
    else await redis("ZREMRANGEBYRANK", key, KEEP, -1);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Leaderboard error. Try again." });
  }
};
