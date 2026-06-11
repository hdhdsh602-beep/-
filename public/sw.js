const CACHE_NAME = 'linguacam-cache-v3';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS).catch((err) => {
      console.warn('Initial cache preload completed with some dynamic warnings:', err);
    }))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.map((cache) => (cache !== CACHE_NAME ? caches.delete(cache) : undefined))
    )).then(() => self.clients.claim())
  );
});

const putInCache = async (request, response) => {
  if (!response || response.status !== 200 || !request.url.startsWith(self.location.origin)) return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
};

const networkFirst = async (request) => {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    await putInCache(request, response);
    return response;
  } catch (err) {
    return (await caches.match(request)) || caches.match('/');
  }
};

const staleWhileRevalidate = async (request) => {
  const cached = await caches.match(request);
  const networkPromise = fetch(request).then(async (response) => {
    await putInCache(request, response);
    return response;
  }).catch(() => caches.match('/'));

  if (cached) return cached;
  return (await networkPromise) || caches.match('/');
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || request.url.includes('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
