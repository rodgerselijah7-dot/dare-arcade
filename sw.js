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
    for (const w of wins) {
      if (new URL(w.url).pathname === new URL(url).pathname && "focus" in w) {
        try { await w.navigate(url); } catch (err) {}
        return w.focus();
      }
    }
    return self.clients.openWindow(url);
  })());
});
