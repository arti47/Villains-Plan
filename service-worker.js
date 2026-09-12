// service-worker.js — app shell cached, navigations network-first.
// CACHE_VERSION is bumped on ANY shipped-file change (CLAUDE.md §10.7).
const CACHE_VERSION = "schemer-v18";
const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.json",
  "./icon.svg",
  "./data.js",
  "./data-library.js",
  "./data-mythic.js",
  "./data-villain-crafter.js",
  "./data-elements.js",
  "./data-scenes.js",
  "./data-fate-chart.js",
  "./data-fate-check.js",
  "./data-actions.js",
  "./firebase-config.js",
  "./src/core.js",
  "./src/ui.js",
  "./src/rules.js",
  "./src/derived.js",
  "./src/settings.js",
  "./src/store.js",
  "./src/roller.js",
  "./src/oracle.js",
  "./src/crafter.js",
  "./src/scenes.js",
  "./src/lifecycle.js",
  "./src/wizard.js",
  "./src/sheet.js",
  "./src/screens.js",
  "./src/tutorial.js",
  "./src/router.js",
  "./src/main.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  // Navigations are network-first so a stale shell never outlives a deploy.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match("./index.html")))
    );
    return;
  }

  // Everything else: cache-first, because it is versioned with CACHE_VERSION.
  event.respondWith(
    caches.match(request).then((hit) => hit || fetch(request).then((response) => {
      if (response.ok && new URL(request.url).origin === location.origin) {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
      }
      return response;
    }).catch(() => hit))
  );
});
