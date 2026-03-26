/* ═══════════════════════════════════════════════════
   MANMIN PWA Service Worker  Ver 1.0
   전략: Cache-First (오프라인 우선) + Network fallback
═══════════════════════════════════════════════════ */

const CACHE_NAME    = 'manmin-v1.0.0';
const STATIC_CACHE  = 'manmin-static-v1.0.0';
const DYNAMIC_CACHE = 'manmin-dynamic-v1.0.0';

/* 설치 시 사전 캐시할 리소스 */
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/apple-touch-icon.png',
  /* Google Fonts는 설치 시점에 캐시 */
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@100;300;400;500;700;900&family=DM+Mono:wght@400;500&display=swap'
];

/* ── INSTALL ── */
self.addEventListener('install', event => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(PRECACHE_URLS.map(url => {
          return new Request(url, { mode: 'cors' });
        })).catch(err => {
          console.warn('[SW] Precache partial fail:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

/* ── ACTIVATE ── */
self.addEventListener('activate', event => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

/* ── FETCH ── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  /* Google Fonts: Stale-While-Revalidate */
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
    return;
  }

  /* 동일 출처 요청: Cache-First */
  if (url.origin === location.origin || request.url.startsWith('./')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  /* 외부 CDN (html2canvas 등): Network-First */
  event.respondWith(networkFirst(request));
});

/* ── STRATEGIES ── */

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    /* 오프라인 폴백 */
    const fallback = await caches.match('./index.html');
    return fallback || new Response('오프라인 상태입니다.', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      status: 503
    });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('리소스를 불러올 수 없습니다.', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || await fetchPromise;
}

/* ── BACKGROUND SYNC (오프라인 대비) ── */
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    console.log('[SW] Background sync triggered');
  }
});

/* ── PUSH (알림 향후 확장용) ── */
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'MANMIN', {
      body: data.body || '',
      icon: './icons/icon-192x192.png',
      badge: './icons/icon-72x72.png',
      tag: 'manmin-notification'
    })
  );
});
