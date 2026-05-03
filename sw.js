/* 桃園里長地圖 service worker
 * 策略: cache-first,first-load 預先快取所有 app shell
 * 換版本只需改 CACHE 字串
 */
const CACHE = 'tymap-guoling-v0.4-1';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // 只快取 GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  // 同源才快取
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // 把成功的同源回應加入快取
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => {
        // 失敗時 fallback 到根頁
        return caches.match('./index.html');
      });
    })
  );
});
