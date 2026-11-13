// DARE Arcade service worker: match alerts only. No caching, so game updates always load fresh.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data && e.data.text() }; }
  const title = d.title || "DARE Arcade";
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || "Someone wants to play a match.",
    icon: "/icons/arcade-192.png?v=2",
    badge: "/icons/favicon-32.png?v=2",
    tag: d.tag || "dare-match",
    renotify: true,
    data: { url: d.url || "/" }
  }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "/", self.location.origin).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const same = wins.find(w => new URL(w.url).pathname === new URL(url).pathname);
    if (same) {
      try { await same.focus(); } catch (err) {}
      try { if (await same.navigate(url)) return; } catch (err) {}
      // navigate() isn't allowed for every tab; ask the page to open the match itself
      try { same.postMessage({ type: "dare-open", url }); return; } catch (err) {}
    }
    return self.clients.openWindow(url);
  })());
});

// Phones replace their push address from time to time. Re-subscribe and move this phone's games to the new one,
// so alerts keep coming without the player turning them off and on.
const keyBytes = s => { const p = "=".repeat((4 - s.length % 4) % 4), raw = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(raw, c => c.charCodeAt(0)); };
self.addEventListener("pushsubscriptionchange", e => {
  e.waitUntil((async () => {
    const old = e.oldSubscription;
    let sub = e.newSubscription;
    if (!sub) {
      let key = old && old.options && old.options.applicationServerKey;
      if (!key) { const d = await (await fetch("/api/lfg", { cache: "no-store" })).json(); if (!d.key) return; key = keyBytes(d.key); }
      sub = await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
    }
    if (!old) return; // the page re-registers on its next visit
    await fetch("/api/lfg", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "move", old: old.endpoint, sub: sub.toJSON() }) });
  })().catch(() => {}));
});
