// ============================================================
//  SERVICE WORKER — Absensi Semarang PWA
//  Versi: 1.0
// ============================================================

const CACHE_NAME    = 'absensi-semarang-v1';
const OFFLINE_URL   = '/absen-semarang-bengkel/offline.html';

// File yang di-cache saat install
const PRECACHE_URLS = [
  '/absen-semarang-bengkel/',
  '/absen-semarang-bengkel/index.html',
  '/absen-semarang-bengkel/offline.html',
  '/absen-semarang-bengkel/manifest.json',
  '/absen-semarang-bengkel/icons/icon-192x192.png',
  '/absen-semarang-bengkel/icons/icon-512x512.png'
];

// ── Install: pre-cache shell ──────────────────────────────────
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// ── Activate: hapus cache lama ────────────────────────────────
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== CACHE_NAME;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ── Fetch: Network-first, fallback ke cache ───────────────────
self.addEventListener('fetch', function(event) {
  // Skip non-GET dan request ke Apps Script / Google API
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('script.google.com')) return;
  if (event.request.url.includes('googleapis.com')) return;
  if (event.request.url.includes('sweetalert2')) return;
  if (event.request.url.includes('fonts.googleapis.com')) return;

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Cache response baru yang valid
        if (response && response.status === 200 && response.type === 'basic') {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function() {
        // Offline fallback
        return caches.match(event.request).then(function(cached) {
          if (cached) return cached;
          // Untuk navigasi, tampilkan halaman offline
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
        });
      })
  );
});
