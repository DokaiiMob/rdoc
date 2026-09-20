/* Playground service worker — caches app shell for offline convert. */
const CACHE = "rdoc-playground-v1";
const SHELL = [
  "./",
  "./index.html",
  "./landing.css",
  "./assets/app.js",
  "./manifest.webmanifest",
  "./icons/rdoc-logo.svg",
  "./icons/rdoc-icon-192.png",
  "./icons/rdoc-icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      await Promise.all(
        SHELL.map(async (url) => {
          try {
            await cache.add(new Request(url, { cache: "reload" }));
          } catch {
            /* optional asset missing — continue */
          }
        }),
      );
    }).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // App shell: cache-first so convert works offline after first visit
  event.respondWith(
    caches.match(req).then(async (cached) => {
      if (cached) return cached;
      try {
        const fresh = await fetch(req);
        if (fresh.ok && (url.pathname.endsWith(".js") ||
            url.pathname.endsWith(".css") ||
            url.pathname.endsWith(".html") ||
            url.pathname.endsWith(".webmanifest") ||
            url.pathname.endsWith(".svg") ||
            url.pathname.endsWith(".png") ||
            url.pathname.endsWith("/"))) {
          const copy = fresh.clone();
          void caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return fresh;
      } catch {
        if (req.mode === "navigate") {
          const fallback = await caches.match("./index.html");
          if (fallback) return fallback;
        }
        throw new Error("offline");
      }
    }),
  );
});
