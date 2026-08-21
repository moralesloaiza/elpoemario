/*
 * Service worker de El Poemario · caché offline con estrategia por tipo.
 *
 * Diseño pensado para un sitio ESTÁTICO que se redespliega a menudo, evitando
 * el problema clásico de "página obsoleta":
 *
 *   · Navegaciones (HTML)  → NETWORK-FIRST. Siempre se pide la página fresca;
 *     solo se sirve de caché si no hay red. Así el contenido nunca se queda
 *     atrás mientras haya conexión.
 *   · /_astro/*            → CACHE-FIRST. Assets con hash en el nombre: su
 *     contenido nunca cambia sin cambiar la URL, así que cachearlos para
 *     siempre es seguro y rapidísimo.
 *   · /pagefind/*          → SIN CACHÉ (passthrough). El índice de búsqueda
 *     cambia en cada build con el mismo nombre de fichero; cachearlo daría
 *     resultados viejos. La búsqueda ya requiere conexión.
 *   · Resto mismo-origen   → STALE-WHILE-REVALIDATE (imágenes, iconos, logo…):
 *     sirve de caché al instante y refresca en segundo plano para la próxima.
 *
 * VERSIÓN: al subir este número cambian los nombres de caché; en 'activate' se
 * borran las cachés viejas. Súbelo si cambias la lógica de cacheo de assets.
 */

const VERSION = 'v1';
const CACHE_STATIC = `elp-static-${VERSION}`;
const CACHE_PAGES = `elp-pages-${VERSION}`;
const CACHE_ASSETS = `elp-assets-${VERSION}`;
const CACHES_ACTUALES = new Set([CACHE_STATIC, CACHE_PAGES, CACHE_ASSETS]);

const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => cache.add(OFFLINE_URL))
  );
  // Activa el nuevo SW sin esperar a que se cierren las pestañas viejas.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const nombres = await caches.keys();
      await Promise.all(
        nombres.map((n) => (CACHES_ACTUALES.has(n) ? null : caches.delete(n)))
      );
      await self.clients.claim();
    })()
  );
});

// Permite forzar la activación inmediata desde la página (registro del SW).
self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

function esNavegacion(request) {
  return (
    request.mode === 'navigate' ||
    (request.method === 'GET' &&
      request.headers.get('accept')?.includes('text/html'))
  );
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_PAGES);
  try {
    const fresca = await fetch(request);
    // Solo guardamos respuestas correctas (evita cachear 404/500 opacas).
    if (fresca && fresca.ok) cache.put(request, fresca.clone());
    return fresca;
  } catch (e) {
    const cacheada = await cache.match(request);
    if (cacheada) return cacheada;
    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;
    throw e;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_ASSETS);
  const cacheada = await cache.match(request);
  if (cacheada) return cacheada;
  const fresca = await fetch(request);
  if (fresca && fresca.ok) cache.put(request, fresca.clone());
  return fresca;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_ASSETS);
  const cacheada = await cache.match(request);
  const red = fetch(request)
    .then((fresca) => {
      if (fresca && fresca.ok) cache.put(request, fresca.clone());
      return fresca;
    })
    .catch(() => null);
  return cacheada || (await red) || Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Solo GET mismo-origen. Lo demás (POST, terceros, extensiones) pasa directo.
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // El índice de Pagefind cambia en cada build con el mismo nombre: nunca se
  // cachea para no servir resultados de búsqueda obsoletos.
  if (url.pathname.startsWith('/pagefind/')) return;

  if (esNavegacion(request)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Assets con hash de Astro: inmutables, cache-first agresivo.
  if (url.pathname.startsWith('/_astro/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Resto de estáticos mismo-origen (imágenes, iconos, logo, fuentes sueltas).
  event.respondWith(staleWhileRevalidate(request));
});
