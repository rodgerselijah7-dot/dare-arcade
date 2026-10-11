// Stripe webhook for arcade purchases: unlocks the games and emails the buyer their code.
// Stripe Dashboard > Developers > Webhooks > Add endpoint: https://dare-arcade.vercel.app/api/stripe-webhook
// Event: checkout.session.completed. Env: STRIPE_WEBHOOK_SECRET (this endpoint's signing secret).
// Store (darewear.store) checkouts arrive here too, from the same Stripe account; they're ignored.
const { verifyStripe, readRaw, readJson, stripe, SOURCE, PAID, gamesInSession, grantGames, hasRedis, redis, sendEmail, unlockEmail, nameOf, refOf, SITE } = require("./_lib");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  const raw = await readRaw(req);
  let event;
  if (verifyStripe(raw, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET)) event = JSON.parse(raw);
  else {
    // if the body was pre-parsed and the signature can't be checked, fetch the event from Stripe instead (authoritative)
    const body = await readJson(req); const id = body && body.id;
    if (!id || !String(id).startsWith("evt_")) return res.status(400).end();
    try { event = await stripe("GET", `events/${id}`); } catch { return res.status(400).end(); }
  }
  const s = event.data && event.data.object;
  try {
    if (event.type === "checkout.session.completed" && s && s.metadata && s.metadata.source === SOURCE) {
      const full = await stripe("GET", `checkout/sessions/${s.id}`);
      if (PAID(full)) {
        const games = gamesInSession(full);
        const email = (full.customer_details && full.customer_details.email) || "";
        const grant = await grantGames(full.id, email, games);
        if (grant && hasRedis() && await redis("SET", `arc:mail:${full.id}`, "1", "NX", "EX", 2592000)) {
          const site = SITE(req);
          if (email) await sendEmail(email, "Your DARE Arcade games are unlocked", unlockEmail(site, grant.code, games)).catch(() => {});
          const total = (full.amount_total || 0) / 100;
          await redis("LPUSH", "arc:orders", JSON.stringify({ ref: refOf(full.id), session: full.id, email, games, total, created: new Date(full.created * 1000).toISOString() }));
          await sendEmail(process.env.OWNER_EMAIL, `DARE Arcade sale ${refOf(full.id)}: $${total.toFixed(2)}`,
            `${email || "No email"} unlocked: ${games.map(nameOf).join(", ")}\nTotal: $${total.toFixed(2)}\n\nNothing to ship. The games unlocked automatically.`).catch(() => {});
        }
      }
    }
    return res.status(200).json({ received: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Webhook failed" }); // Stripe will retry
  }
};
module.exports.config = { api: { bodyParser: false } };
