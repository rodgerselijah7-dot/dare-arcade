// Unlock codes. GET /api/license?code=ABCD-EFGH-JKLM -> { games }   POST /api/license { email } -> emails the code
const { hasRedis, redis, readJson, clientIp, rateLimit, cleanCode, isCode, licenseGames, sendEmail, unlockEmail, SITE } = require("./_lib");
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!hasRedis()) return res.status(503).json({ error: "Unlocks aren't available right now. Try again later." });
  if (req.method === "GET") {
    if (!(await rateLimit(`lic:${clientIp(req)}`, 60, 600)).ok) return res.status(429).json({ error: "Too many tries. Wait a few minutes and try again." });
    const code = cleanCode(req.query && req.query.code);
    if (!isCode(code)) return res.status(400).json({ error: "That code doesn't look right. It's 12 letters and numbers, like ABCD-EFGH-JKLM." });
    const games = await licenseGames(code);
    if (!games) return res.status(404).json({ error: "We couldn't find that code. Check it against your confirmation email." });
    return res.status(200).json({ games });
  }
  if (req.method === "POST") {
    if (!(await rateLimit(`licmail:${clientIp(req)}`, 5, 3600)).ok) return res.status(429).json({ error: "Too many tries. Wait a while and try again." });
    const em = String((await readJson(req)).email || "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return res.status(400).json({ error: "Enter the email you used at checkout." });
    if (!process.env.RESEND_API_KEY) return res.status(503).json({ error: "Email restore isn't set up yet. Use the unlock code from your confirmation page." });
    const code = await redis("GET", `arc:lic-email:${em}`);
    const games = code && await licenseGames(code);
    if (games && games.length) await sendEmail(em, "Your DARE Arcade unlock code", unlockEmail(SITE(req), code, games)).catch(() => {});
    return res.status(200).json({ ok: true, message: "If that email has bought games, we've sent the unlock code to it." });
  }
  return res.status(405).json({ error: "Method not allowed" });
};
