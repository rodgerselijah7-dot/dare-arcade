// Confirmation page data: GET /api/order?session_id=cs_... -> { paid, code, games, email }
// Unlocks right away if the webhook hasn't run yet (both paths are safe to run twice).
const { stripe, SOURCE, PAID, gamesInSession, grantGames, fmtCode, nameOf, refOf } = require("./_lib");
module.exports = async (req, res) => {
  const id = String((req.query && req.query.session_id) || "");
  res.setHeader("Cache-Control", "no-store");
  if (!/^cs_[A-Za-z0-9_]+$/.test(id) || !process.env.STRIPE_SECRET_KEY) return res.status(400).json({ error: "Purchase not found." });
  try {
    const s = await stripe("GET", `checkout/sessions/${id}`);
    if (!s.metadata || s.metadata.source !== SOURCE) return res.status(404).json({ error: "Purchase not found." });
    const email = (s.customer_details && s.customer_details.email) || "";
    const out = { ref: refOf(id), paid: PAID(s), total: (s.amount_total || 0) / 100, email: email.replace(/^(.).*(@.*)$/, "$1•••$2") };
    if (out.paid) {
      const games = gamesInSession(s);
      const g = await grantGames(id, email, games);
      if (!g) return res.status(503).json({ ...out, error: "Your payment went through, but unlocking is busy. Refresh this page in a minute." });
      Object.assign(out, { code: fmtCode(g.code), games, names: games.map(nameOf) });
    }
    res.status(200).json(out);
  } catch { res.status(404).json({ error: "Purchase not found." }); }
};
