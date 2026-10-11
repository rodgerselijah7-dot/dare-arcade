// Starts a Stripe Checkout for arcade games: POST { items: ["ori", "all-access"], back: "/ori/" } -> { url }
// Env: STRIPE_SECRET_KEY (same key as the DARE store). Optional: STRIPE_AUTOMATIC_TAX=true, SITE_URL.
const { findItem, gamesOf, stripe, readJson, clientIp, rateLimit, SITE, SOURCE } = require("./_lib");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: "Checkout isn't set up yet. Add STRIPE_SECRET_KEY to the dare-arcade project in Vercel and redeploy." });
  const limited = await rateLimit(`checkout:${clientIp(req)}`, 20, 600);
  if (!limited.ok) return res.status(429).json({ error: "Too many checkout attempts. Wait a few minutes and try again." });

  const body = await readJson(req);
  let ids = [...new Set((Array.isArray(body.items) ? body.items : []).map(String))].slice(0, 10);
  if (!ids.length) return res.status(400).json({ error: "Pick a game to unlock." });
  if (ids.some(id => !findItem(id))) return res.status(400).json({ error: "That game isn't for sale. Refresh and try again." });
  // the pass already includes every game, so drop single games bought alongside it
  if (ids.some(id => findItem(id).pass)) ids = ids.filter(id => findItem(id).pass).slice(0, 1);

  const site = SITE(req);
  const back = /^\/[a-z0-9-]*\/?$/.test(String(body.back || "")) ? body.back : "/shop/";
  const image = id => findItem(id).pass ? `${site}/icons/arcade-512.png` : `${site}/${id}/icon-512.png`;
  try {
    const session = await stripe("POST", "checkout/sessions", {
      mode: "payment",
      line_items: ids.map(id => { const p = findItem(id); return { quantity: 1, price_data: { currency: "usd", unit_amount: Math.round(p.price * 100), product_data: {
        name: p.pass ? `${p.name} (DARE Arcade)` : `${p.name} (DARE Arcade, full game)`,
        description: `Unlocks ${p.unlocks.charAt(0).toLowerCase() + p.unlocks.slice(1)}. Plays in your browser.`,
        images: [image(id)], metadata: { arcade_item: id } } } }; }),
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === "true" },
      success_url: `${site}/unlocked/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}${back}`,
      metadata: { source: SOURCE, items: ids.join(","), games: [...new Set(ids.flatMap(gamesOf))].join(",") },
      payment_intent_data: { metadata: { source: SOURCE, items: ids.join(",") }, description: "DARE Arcade: " + ids.map(id => findItem(id).name).join(", ") }
    });
    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error("Stripe error", e.stripe || e);
    return res.status(502).json({ error: "Checkout couldn't start. Try again in a minute." });
  }
};
