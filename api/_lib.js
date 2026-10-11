// Shared helpers for the arcade's API functions. Files starting with "_" are not exposed as routes.
// Uses the same Stripe account and Upstash Redis database as the DARE store; every Redis key here
// starts with "arc:" so arcade data never mixes with store data.
const crypto = require("crypto");
const CATALOG = require("../games.json");
const GAME_IDS = CATALOG.filter(p => !p.pass).map(p => p.id);
const findItem = id => CATALOG.find(p => p.id === id);
const gamesOf = id => { const p = findItem(id); return p ? (p.pass ? p.games : [p.id]) : []; };

/* ---------- Upstash Redis over REST ---------- */
const R_URL = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const R_TOKEN = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const hasRedis = () => !!(R_URL() && R_TOKEN());
async function redis(...cmd) {
  const r = await fetch(R_URL(), { method: "POST", headers: { Authorization: `Bearer ${R_TOKEN()}`, "Content-Type": "application/json" }, body: JSON.stringify(cmd.map(String)) });
  const d = await r.json();
  if (d.error) throw new Error("Redis: " + d.error);
  return d.result;
}

/* ---------- Stripe over REST ---------- */
function form(obj, prefix, out = []) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object") form(v, key, out); else out.push(encodeURIComponent(key) + "=" + encodeURIComponent(v));
  }
  return out.join("&");
}
async function stripe(method, path, params) {
  const r = await fetch("https://api.stripe.com/v1/" + path, {
    method, headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: params ? form(params) : undefined
  });
  const d = await r.json();
  if (!r.ok) { const e = new Error((d.error && d.error.message) || "Stripe error"); e.stripe = d.error; throw e; }
  return d;
}
function verifyStripe(raw, header, secret) {
  if (!header || !secret) return false;
  const t = +((header.split(",").find(x => x.startsWith("t=")) || "").slice(2));
  const sigs = header.split(",").filter(x => x.startsWith("v1=")).map(x => x.slice(3));
  if (!t || Math.abs(Date.now() / 1000 - t) > 300) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex");
  return sigs.some(s => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}
const SOURCE = "dare-arcade"; // marks arcade checkouts in Stripe (the store's webhook skips these)
const PAID = s => ["paid", "no_payment_required"].includes(s.payment_status); // no_payment_required = 100%-off promo code

/* ---------- email (optional, via Resend) ---------- */
async function sendEmail(to, subject, text) {
  if (!process.env.RESEND_API_KEY || !to) return false;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.FROM_EMAIL || "DARE Arcade <orders@resend.dev>", to, subject, text })
  });
  return r.ok;
}

/* ---------- unlock codes ----------
   arc:lic:<CODE>        { email, games: [...], sessions: [...], created }
   arc:lic-email:<email> CODE   (one code per customer; later purchases add games to it)
   arc:lic-sess:<id>     CODE   (makes unlocking idempotent: webhook retries + the confirmation page) */
const CODE_ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I, so codes are easy to type
const newCode = () => [...crypto.randomBytes(12)].map(b => CODE_ABC[b % 32]).join("");
const cleanCode = c => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const isCode = c => c.length === 12 && [...c].every(ch => CODE_ABC.includes(ch));
const fmtCode = c => c.replace(/(.{4})(?=.)/g, "$1-");
const gamesInSession = s => [...new Set(String((s.metadata && s.metadata.items) || "").split(",").filter(Boolean).flatMap(gamesOf))];
async function grantGames(sessionId, email, games) {
  if (!hasRedis() || !games.length || !sessionId) return null;
  const done = await redis("GET", `arc:lic-sess:${sessionId}`);
  if (done) return { code: done, first: false };
  const em = String(email || "").trim().toLowerCase();
  let code = em && await redis("GET", `arc:lic-email:${em}`);
  if (!code) code = newCode();
  const claimed = await redis("SET", `arc:lic-sess:${sessionId}`, code, "NX");
  if (!claimed) return { code: await redis("GET", `arc:lic-sess:${sessionId}`), first: false };
  const raw = await redis("GET", `arc:lic:${code}`);
  const lic = raw ? JSON.parse(raw) : { email: em, games: [], sessions: [], created: new Date().toISOString() };
  lic.games = [...new Set([...lic.games, ...games])];
  lic.sessions = [...new Set([...(lic.sessions || []), sessionId])].slice(-50);
  await redis("SET", `arc:lic:${code}`, JSON.stringify(lic));
  if (em) await redis("SET", `arc:lic-email:${em}`, code);
  return { code, first: true };
}
async function licenseGames(code) {
  if (!hasRedis() || !isCode(code)) return null;
  const raw = await redis("GET", `arc:lic:${code}`);
  return raw ? JSON.parse(raw).games || [] : null;
}
const SITE = req => (process.env.SITE_URL || `https://${(req.headers || {}).host}`).replace(/\/$/, "");
const nameOf = g => (findItem(g) || {}).name || g;
function unlockEmail(site, code, games) {
  return `Your DARE Arcade games are unlocked: ${games.map(nameOf).join(", ")}.\n\nPlay now: ${site}/?unlock=${code}\n\nYour unlock code: ${fmtCode(code)}\n\nOn another phone or computer, or in the arcade app on your Home Screen, open a game and tap "Enter unlock code". Keep this email; the code works for every game you buy with this email address.\n\nDesired Ambitions Requires Execution.`;
}

/* ---------- misc ---------- */
async function readRaw(req) {
  if (typeof req.body === "string") return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  const chunks = []; for await (const c of req) chunks.push(typeof c === "string" ? Buffer.from(c) : c);
  return Buffer.concat(chunks).toString("utf8");
}
async function readJson(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  try { return JSON.parse(await readRaw(req) || "{}"); } catch { return {}; }
}
const clientIp = req => String(((req.headers || {})["x-forwarded-for"] || "").split(",")[0].trim() || (req.socket && req.socket.remoteAddress) || "unknown");
async function rateLimit(key, limit, windowSeconds) {
  if (!hasRedis()) return { ok: true };
  const k = `arc:rl:${key}:${Math.floor(Date.now() / 1000 / windowSeconds)}`;
  const n = await redis("INCR", k);
  if (n === 1) await redis("EXPIRE", k, windowSeconds);
  return { ok: n <= limit };
}
const refOf = id => id.slice(-8).toUpperCase();

module.exports = { CATALOG, GAME_IDS, findItem, gamesOf, hasRedis, redis, stripe, verifyStripe, SOURCE, PAID, sendEmail,
  cleanCode, isCode, fmtCode, gamesInSession, grantGames, licenseGames, SITE, nameOf, unlockEmail, readRaw, readJson, clientIp, rateLimit, refOf };
