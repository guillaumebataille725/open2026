const CACHE_NAME = 'bch-open-2026-v1';

// Fichiers à mettre en cache pour le mode hors ligne
const STATIC_ASSETS = [
  '/open2026/',
  '/open2026/index.html'
];

// Installation : on met en cache les fichiers statiques
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activation : on supprime les anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch : stratégie "network first, cache fallback"
// → on essaie le réseau en priorité (pour avoir les scores à jour)
// → si pas de réseau, on sert le cache
self.addEventListener('fetch', event => {
  // On ignore les requêtes vers Apps Script (API externe)
  if (event.request.url.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la réponse est valide, on la met en cache et on la retourne
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Pas de réseau → on sert depuis le cache
        return caches.match(event.request);
      })
  );
});
