/* Module 11 - Web Push service worker.
 *
 * Lives in /public (not the bundle) because a service worker must be served
 * from the site root to control the whole scope. Vite copies this verbatim.
 *
 * Deliberately thin: the lead-change rule that decides whether a goal is worth
 * sending lives in the API, so this file only receives, displays and routes.
 */

self.addEventListener("install", (event) => {
  // Take over immediately rather than waiting for all tabs to close.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/** Tells any open page that a push arrived, for local debugging. */
function announce(type, detail) {
  return self.clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((list) => list.forEach((c) => c.postMessage({ type, detail })))
    .catch(() => undefined);
}

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }

  const options = {
    body: payload.body || "",
    // Same tag per match, so a goal notification replaces the "match live"
    // one in place instead of stacking five of them up during one match.
    tag: payload.tag || (payload.matchId ? `match-${payload.matchId}` : undefined),
    renotify: true,
    icon: "/logo.png",
    badge: "/logo.png",
    data: {
      matchId: payload.matchId,
      url: payload.url || "/",
    },
  };

  event.waitUntil(
    self.registration
      .showNotification(payload.title || "Chhattisgarh Hockey League", options)
      .then(() => announce("PUSH_SHOWN", { title: options.body, matchId: payload.matchId }))
      .catch((err) => announce("PUSH_FAILED", { error: String(err) }))
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Focus an existing tab on the right page instead of opening a new one.
        for (const client of clientList) {
          if (client.url.includes(target) && "focus" in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(target);
      })
      .catch(() => self.clients.openWindow(target))
  );
});