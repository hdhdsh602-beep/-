const CACHE_NAME = 'linguacam-cache-v4';
const OFFLINE_ASSETS = [
  '/manifest.json',
  '/icon.svg',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_ASSETS).catch((err) => {
      console.warn('Offline asset preload completed with warnings:', err);
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

const isSameOrigin = (request) => request.url.startsWith(self.location.origin);

const isAppShellRequest = (request) => {
  const url = new URL(request.url);
  return request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '/sw.js';
};

const isImmutableAsset = (request) => {
  const url = new URL(request.url);
  return url.pathname.startsWith('/assets/') || /\.(?:png|jpg|jpeg|svg|webp|gif|ico|woff2?)$/i.test(url.pathname);
};

const putInCache = async (request, response) => {
  if (!response || response.status !== 200 || !isSameOrigin(request)) return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
};

const fetchFreshAppShell = async (request) => {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (request.mode === 'navigate' || new URL(request.url).pathname === '/index.html') {
      await putInCache(new Request('/index.html'), response);
    }
    return response;
  } catch (err) {
    return (await caches.match('/index.html')) || caches.match(request);
  }
};

const cacheFirstAsset = async (request) => {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  await putInCache(request, response);
  return response;
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || !isSameOrigin(request) || request.url.includes('/api/')) return;

  if (isAppShellRequest(request)) {
    event.respondWith(fetchFreshAppShell(request));
    return;
  }

  if (isImmutableAsset(request)) {
    event.respondWith(cacheFirstAsset(request));
    return;
  }

  event.respondWith(fetch(request, { cache: 'no-store' }));
});
