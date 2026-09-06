const CACHE_NAME = "cardledger-cache-v3";

const PRECACHE_URLS = [
  "./",
  "index.html",
  "manifest.json",
  "favicon.ico",
  "icons/icon-192x192.png",
  "icons/icon-512x512.png",
  "icons/icon-192x192-maskable.png",
  "icons/icon-512x512-maskable.png",
  "src/styles/global.css",
  "src/assets/fonts/inter-latin-400-normal.woff2",
  "src/assets/fonts/inter-latin-500-normal.woff2",
  "src/assets/fonts/inter-latin-700-normal.woff2",
  "src/vendor/jspdf.umd.min.js",
  "src/index.js",
  "src/app.js",
  "src/utils/id.js",
  "src/utils/dom.js",
  "src/utils/categories.js",
  "src/utils/date.js",
  "src/utils/format.js",
  "src/utils/storage.js",
  "src/utils/exportCsv.js",
  "src/utils/exportPdf.js",
  "src/utils/charts.js",
  "src/utils/profiles.js",
  "src/utils/importCsv.js",
  "src/components/sheet.js",
  "src/components/toast.js",
  "src/components/expenseSheet.js",
  "src/components/onboardingSheet.js",
  "src/components/billView.js",
  "src/components/tableView.js",
  "src/components/logView.js",
  "src/components/billDetailSheet.js",
  "src/components/statsView.js",
  "src/components/settingsView.js",
  "src/components/budgetsView.js",
  "src/components/profilesSection.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => console.warn("CardLedger SW: failed to cache", url, err))
        )
      );
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // App-shell navigation: try network first, fall back to cached shell offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("index.html", copy));
          return res;
        })
        .catch(() => caches.match("index.html"))
    );
    return;
  }

  // Static assets: cache-first, update cache in background.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
