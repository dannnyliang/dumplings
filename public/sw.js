/*
 * Dumplings service worker（手寫，無 build plugin，Turbopack 無關）。
 *
 * 快取策略刻意保守，守住 read-your-own-writes 契約：
 *   - 靜態 hashed 資源（/_next/static、字型、icon）→ CacheFirst：讓重複啟動接近即時。
 *   - Supabase 與所有 API → 完全不碰（NetworkOnly）：認證與資料永遠即時。
 *   - 頁面導航 → NetworkOnly，離線時回極簡 fallback：不快取動態已登入頁，避免回吐舊明細。
 *
 * 改版時 bump CACHE_VERSION 讓舊快取在 activate 時清除。
 */
const CACHE_VERSION = 'dmp-v1'
const ASSET_CACHE = `${CACHE_VERSION}-assets`

const OFFLINE_HTML =
  '<!doctype html><html lang="zh-TW"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>離線</title><style>body{margin:0;height:100dvh;display:flex;flex-direction:column;' +
  'align-items:center;justify-content:center;background:#FBF7F1;color:#6B5A48;' +
  'font-family:-apple-system,system-ui,sans-serif;gap:8px}h1{font-size:40px;margin:0}' +
  'p{font-size:14px;margin:0}</style></head><body><h1>🥟</h1>' +
  '<p>目前離線，請連上網路後重試</p></body></html>'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k))
      )
      await self.clients.claim()
    })()
  )
})

/** 可安全 CacheFirst 的靜態資源：Next hashed 產物、字型、圖片、manifest。 */
function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icon') ||
    url.pathname === '/manifest.json' ||
    /\.(?:woff2?|ttf|otf|png|jpg|jpeg|gif|webp|svg|ico|css|js)$/.test(url.pathname)
  )
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // 跨網域（Supabase 等）一律不介入，維持認證與資料即時。
  if (url.origin !== self.location.origin) return

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request))
    return
  }

  // 頁面導航：只走網路（不快取動態已登入內容），離線時回 fallback。
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(
        () => new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
      )
    )
    return
  }
  // 其餘（RSC data、API 等）交給瀏覽器預設處理，不快取。
})

async function cacheFirst(request) {
  const cache = await caches.open(ASSET_CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) cache.put(request, response.clone())
  return response
}
