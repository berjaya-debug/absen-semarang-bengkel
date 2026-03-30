// ============================================================
//  SERVICE WORKER — Absensi Semarang PWA (FINAL)
//  Auto Update + Anti Delay + Clean Cache
// ============================================================

// ⚠️ GANTI VERSI INI SETIAP UPDATE
const CACHE_NAME = 'absensi-semarang-v2';

const OFFLINE_URL = '/absen-semarang-bengkel/offline.html';

// File penting (app shell)
const PRECACHE_URLS = [
  '/absen-semarang-bengkel/',
  '/absen-semarang-bengkel/index.html',
  '/absen-semarang-bengkel/offline.html',
  '/absen-semarang-bengkel/manifest.json',
  '/absen-semarang-bengkel/icons/icon-192x192.png',
  '/absen-semarang-bengkel/icons/icon-512x512.png'
];

// ============================================================
// INSTALL → cache awal + langsung aktif
// ============================================================
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()) // langsung aktif
  );
});

// ============================================================
// ACTIVATE → hapus cache lama
// ============================================================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()) // ambil kontrol langsung
  );
});

// ============================================================
// FETCH STRATEGY
// ============================================================
self.addEventListener('fetch', event => {

  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // ❌ SKIP API & external
  if (
    url.includes('script.google.com') ||
    url.includes('googleapis.com') ||
    url.includes('fonts.googleapis.com') ||
    url.includes('sweetalert2')
  ) return;

  // ============================================================
  // ✅ HTML → SELALU FRESH (anti delay)
  // ============================================================
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // ============================================================
  // ✅ ASSETS (JS, CSS, IMG) → cache + update di background
  // ============================================================
  event.respondWith(
    caches.match(event.request).then(cached => {

      const fetchPromise = fetch(event.request)
        .then(networkRes => {

          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone);
            });
          }

          return networkRes;
        })
        .catch(() => cached);

      // tampilkan cache dulu (biar cepat), update di belakang
      return cached || fetchPromise;
    })
  );
});
