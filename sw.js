/* ═══════════════════════════════════════════════════
   MANMIN PWA — Service Worker  Ver 1.0
   전략: Cache-First (오프라인 우선) + Network fallback
═══════════════════════════════════════════════════ */
const CACHE_VER     = 'v1.0.0';
const STATIC_CACHE  = `manmin-static-${CACHE_VER}`;
const DYNAMIC_CACHE = `manmin-dynamic-${CACHE_VER}`;

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/apple-touch-icon.png',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@100;300;400;500;700;900&family=DM+Mono:wght@400;500&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

/* ── INSTALL ── */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then(cache =>
      Promise.allSettled(PRECACHE.map(url =>
        cache.add(new Request(url, {mode:'cors'})).catch(()=>{})
      ))
    ).then(() => self.skipWaiting())
  );
});

/* ── ACTIVATE : 구 캐시 정리 ── */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(k => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
        .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── FETCH ── */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Google Fonts → Stale-While-Revalidate
  if (url.hostname.includes('fonts.gstatic.com') || url.hostname.includes('fonts.googleapis.com')) {
    e.respondWith(swr(e.request));
    return;
  }
  // 동일 출처 → Cache-First
  if (url.origin === location.origin) {
    e.respondWith(cacheFirst(e.request));
    return;
  }
  // 외부 CDN → Network-First
  e.respondWith(networkFirst(e.request));
});

async function cacheFirst(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(STATIC_CACHE)).put(req, res.clone());
    return res;
  } catch {
    return await caches.match('./index.html')
      || new Response('오프라인 상태입니다.', {status:503, headers:{'Content-Type':'text/plain;charset=utf-8'}});
  }
}

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(DYNAMIC_CACHE)).put(req, res.clone());
    return res;
  } catch {
    return await caches.match(req) || new Response('', {status:503});
  }
}

async function swr(req) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const hit   = await cache.match(req);
  const fresh = fetch(req).then(r => { if(r.ok) cache.put(req, r.clone()); return r; }).catch(()=>null);
  return hit || await fresh;
}

/* ── 푸시 알림 (확장용) ── */
self.addEventListener('push', e => {
  if (!e.data) return;
  const d = e.data.json();
  e.waitUntil(self.registration.showNotification(d.title||'MANMIN', {
    body: d.body||'', icon:'./icons/icon-192x192.png', badge:'./icons/icon-72x72.png'
  }));
});
