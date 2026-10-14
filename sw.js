const CACHE_NAME = "trace-benin-v6.9-cache";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "https://cdnjs.cloudflare.com/ajax/libs/localforage/1.10.0/localforage.min.js",
  "https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"
];


// Installation du Service Worker et mise en cache des ressources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});


// Activation et nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});


// Stratégie de mise en cache : Cache First avec fallback sur le réseau (parfait pour le mode offline)
self.addEventListener("fetch", (event) => {
  // Ignorer les requêtes vers l'API GFW ou le Worker Cloudflare pour laisser passer le direct/network
  if (
    event.request.url.includes("globalforestwatch.org") || 
    event.request.url.includes("workers.dev")
  ) {
    return;
  }


  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (
          !networkResponse || 
          networkResponse.status !== 200 || 
          networkResponse.type !== "basic"
        ) {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    }).catch(() => {
      // Si tout échoue (offline total), retourner la page d'accueil en cache
      if (event.request.mode === "navigate") {
        return caches.match("./index.html");
      }
    })
  );
});
