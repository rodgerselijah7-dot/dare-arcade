// Comp codes: unlock codes Don gives away (ambassadors, giveaway winners, friends), made from /admin.
// Every call needs the admin password (Vercel env ARCADE_ADMIN_KEY) in the "x-admin-key" header.
// POST { action: "list" }                                   -> { codes: [...] }
// POST { action: "create", label, games: [...], days }      -> { code }   (days 0 or empty = never expires)
// POST { action: "revoke" | "restore" | "delete", code }    -> { ok }
// Comp codes live beside paid ones: arc:lic:<CODE> { comp: true, label, games, created, expires, revoked },
// listed in the set arc:comp. A revoked or expired code fails /api/license, so the arcade locks again on the next check.
const crypto = require("crypto");
const { CATALOG, hasRedis, redis, readJson, clientIp, rateLimit, cleanCode, isCode, newCode, compState } = require("./_lib");

const VALID = new Set(CATALOG.map(p => p.id));
const keyOk = given => {
  const want = process.env.ARCADE_ADMIN_KEY || "";
  if (want.length < 8 || !given) return false;
  const a = crypto.createHash("sha256").update(String(given)).digest(), b = crypto.createHash("sha256").update(want).digest();
  return crypto.timingSafeEqual(a, b);
};

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.ARCADE_ADMIN_KEY) return res.status(503).json({ error: "Set ARCADE_ADMIN_KEY in Vercel first, then redeploy." });
  if (!hasRedis()) return res.status(503).json({ error: "The database isn't connected." });
  const ip = clientIp(req);
  if (!keyOk(req.headers["x-admin-key"])) {
    const r = await rateLimit(`admbad:${ip}`, 8, 900).catch(() => ({ ok: true }));
    return res.status(r.ok ? 401 : 429).json({ error: r.ok ? "Wrong password." : "Too many wrong tries. Wait 15 minutes." });
  }
  const b = await readJson(req), action = String(b.action || "");
  try {
    if (action === "list" || action === "check") {
      if (action === "check") return res.status(200).json({ ok: true });
      const codes = (await redis("SMEMBERS", "arc:comp")) || [];
      const rows = [];
      for (let i = 0; i < codes.length; i += 50) {
        const part = codes.slice(i, i + 50), raws = await redis("MGET", ...part.map(c => `arc:lic:${c}`));
        part.forEach((c, j) => { if (!raws[j]) return; const l = JSON.parse(raws[j]); rows.push({ code: c, label: l.label || "", games: l.games || [], created: l.created, expires: l.expires || null, state: compState(l) }); });
      }
      rows.sort((x, y) => String(y.created).localeCompare(String(x.created)));
      return res.status(200).json({ codes: rows });
    }
    if (action === "create") {
      const label = String(b.label || "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, 60);
      if (!label) return res.status(400).json({ error: "Add a name so you know who has the code." });
      let games = [...new Set((Array.isArray(b.games) ? b.games : []).map(String).filter(g => VALID.has(g)))];
      if (!games.length) return res.status(400).json({ error: "Pick All-Access or at least one game." });
      if (games.includes("all-access")) games = ["all-access"];
      const days = Math.max(0, Math.min(3650, Math.floor(+b.days || 0)));
      const lic = { comp: true, label, games, created: new Date().toISOString(), expires: days ? new Date(Date.now() + days * 864e5).toISOString() : null, revoked: false };
      let code = null;
      for (let i = 0; i < 5 && !code; i++) { const c = newCode(); if (await redis("SET", `arc:lic:${c}`, JSON.stringify(lic), "NX")) code = c; }
      if (!code) return res.status(500).json({ error: "Couldn't make a code. Try again." });
      await redis("SADD", "arc:comp", code);
      return res.status(200).json({ code, ...lic, state: "active" });
    }
    if (action === "revoke" || action === "restore" || action === "delete") {
      const code = cleanCode(b.code);
      if (!isCode(code) || !(await redis("SISMEMBER", "arc:comp", code))) return res.status(404).json({ error: "That isn't one of your comp codes." });
      if (action === "delete") { await redis("DEL", `arc:lic:${code}`); await redis("SREM", "arc:comp", code); return res.status(200).json({ ok: true }); }
      const raw = await redis("GET", `arc:lic:${code}`); if (!raw) return res.status(404).json({ error: "Code not found." });
      const lic = JSON.parse(raw); lic.revoked = action === "revoke";
      await redis("SET", `arc:lic:${code}`, JSON.stringify(lic));
      return res.status(200).json({ ok: true, state: compState(lic) });
    }
    return res.status(400).json({ error: "Unknown action." });
  } catch (e) {
    return res.status(502).json({ error: "Couldn't reach the database. Try again." });
  }
};
