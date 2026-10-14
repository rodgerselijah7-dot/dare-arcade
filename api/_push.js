// Web Push for match alerts, with no outside packages.
// VAPID keys: VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY env vars if set (base64url, raw P-256), otherwise a key pair
// generated once and kept in Redis at arc:vapid. Payloads are encrypted per RFC 8291 (aes128gcm).
const crypto = require("crypto");
const { redis, hasRedis } = require("./_lib");

const b64u = buf => Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = s => Buffer.from(String(s).replace(/-/g, "+").replace(/_/g, "/"), "base64");
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:darewareusa@gmail.com";

let cached = null;
function keysFromRaw(pubRaw, privRaw) {
  const pub = unb64u(pubRaw), d = unb64u(privRaw);
  const key = crypto.createPrivateKey({ key: { kty: "EC", crv: "P-256", d: b64u(d), x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)) }, format: "jwk" });
  return { publicKey: b64u(pub), key };
}
async function vapid() {
  if (cached) return cached;
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) return (cached = keysFromRaw(process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY));
  if (!hasRedis()) throw new Error("No Redis for VAPID keys");
  let stored = await redis("GET", "arc:vapid");
  if (!stored) {
    const { privateKey } = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });
    const j = privateKey.export({ format: "jwk" });
    const pub = Buffer.concat([Buffer.from([4]), unb64u(j.x), unb64u(j.y)]);
    await redis("SET", "arc:vapid", JSON.stringify({ pub: b64u(pub), priv: j.d }), "NX");
    stored = await redis("GET", "arc:vapid"); // whoever won the race
  }
  const v = JSON.parse(stored);
  return (cached = keysFromRaw(v.pub, v.priv));
}

function vapidHeader(endpoint, keys) {
  const aud = new URL(endpoint).origin;
  const enc = o => b64u(Buffer.from(JSON.stringify(o)));
  const data = enc({ typ: "JWT", alg: "ES256" }) + "." + enc({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: SUBJECT });
  const sig = crypto.sign("sha256", Buffer.from(data), { key: keys.key, dsaEncoding: "ieee-p1363" });
  return `vapid t=${data}.${b64u(sig)}, k=${keys.publicKey}`;
}

const hmac = (key, data) => crypto.createHmac("sha256", key).update(data).digest();
// RFC 8291 + RFC 8188 (single record)
function encrypt(payload, p256dh, auth, salt = crypto.randomBytes(16), ecdh = null) {
  const uaPublic = unb64u(p256dh), authSecret = unb64u(auth);
  if (uaPublic.length !== 65 || authSecret.length < 16) throw new Error("Bad subscription keys");
  const as = ecdh || crypto.createECDH("prime256v1");
  if (!ecdh) as.generateKeys();
  const asPublic = as.getPublicKey();
  const shared = as.computeSecret(uaPublic);
  const prkKey = hmac(authSecret, shared);
  const ikm = hmac(prkKey, Buffer.concat([Buffer.from("WebPush: info\0"), uaPublic, asPublic, Buffer.from([1])]));
  const prk = hmac(salt, ikm);
  const cek = hmac(prk, Buffer.from("Content-Encoding: aes128gcm\0\x01")).subarray(0, 16);
  const nonce = hmac(prk, Buffer.from("Content-Encoding: nonce\0\x01")).subarray(0, 12);
  const c = crypto.createCipheriv("aes-128-gcm", cek, nonce);
  const body = Buffer.concat([c.update(Buffer.concat([Buffer.from(payload), Buffer.from([2])])), c.final(), c.getAuthTag()]);
  const header = Buffer.alloc(21); salt.copy(header, 0); header.writeUInt32BE(4096, 16); header[20] = 65;
  return Buffer.concat([header, asPublic, body]);
}

// Returns the HTTP status from the push service (201 = delivered; 404/410 = subscription gone).
async function sendPush(sub, data, ttl = 600) {
  const keys = await vapid();
  const body = encrypt(JSON.stringify(data), sub.keys.p256dh, sub.keys.auth);
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const r = await fetch(sub.endpoint, {
      method: "POST", signal: ctrl.signal,
      headers: { Authorization: vapidHeader(sub.endpoint, keys), "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", TTL: String(ttl), Urgency: "high", Topic: String(data.tag || "dare").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32) },
      body
    });
    return r.status;
  } catch { return 0; } finally { clearTimeout(timer); }
}

module.exports = { vapid, sendPush, encrypt, vapidHeader, b64u, unb64u };
