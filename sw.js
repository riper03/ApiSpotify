const CACHE_NAME = 'spotify-chafon-v5';
const API_CACHE_NAME = 'spotify-api-cache-v1';
const AUDIO_CACHE_NAME = 'spotify-audio-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './img/imagenes/DesktopCaptura.png',
  './img/imagenes/MobilCaptura.png',
  './img/imagenes/9bd43890d48528e08a1ca47e0f342677.gif',
  './img/imagenes/15iA.gif',
  './img/imagenes/2624779c7876079a4d3972954c9a9f4e.gif',
  './img/imagenes/giphy.gif'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Instalando cache de recursos...');
        return Promise.all(
          urlsToCache.map(url => 
            cache.add(url).catch(e => 
              console.warn(`[SW] Error cacheando ${url}:`, e)
            )
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (![CACHE_NAME, API_CACHE_NAME, AUDIO_CACHE_NAME].includes(cacheName)) {
            console.log(`[SW] Eliminando cache antiguo: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Manejo de requests de audio mejorado
const handleAudioRequest = async (event) => {
  const request = event.request;
  const cache = await caches.open(AUDIO_CACHE_NAME);
  
  try {
    // Verificar cache primero
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('[SW] Audio servido desde cache:', request.url);
      return cachedResponse;
    }

    // Si no está en cache, hacer fetch y cachear
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const clone = networkResponse.clone();
      event.waitUntil(
        cache.put(request, clone)
          .then(() => console.log('[SW] Audio cacheado:', request.url))
      );
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('[SW] Error al manejar audio:', error);
    return new Response(null, { status: 503 });
  }
};

// Estrategia de Fetch mejorada
self.addEventListener('fetch', event => {
  const { request } = event;
    if (isAudioRequest(request)) {
    event.respondWith(handleAudioRequest(event));
    return;
  }
  if (isStaticResource(request)) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request))
    );
    return;
  }
  if (isSpotifyAPIRequest(request)) {
    event.respondWith(handleAPIRequest(event));
    return;
  }
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
function isAudioRequest(request) {
  const url = request.url;
  return (
    request.method === 'GET' &&
    (
      url.includes('mp3-preview') ||
      url.includes('audio') ||
      (request.headers.get('accept') || '').includes('audio') ||
      url.endsWith('.mp3')
    )
  );
}

function isStaticResource(request) {
  const url = new URL(request.url);
  return urlsToCache.some(cacheUrl => 
    url.pathname === new URL(cacheUrl, self.location).pathname
  );
}

function isSpotifyAPIRequest(request) {
  return new URL(request.url).hostname.includes('spotify23.p.rapidapi.com');
}

async function handleAPIRequest(event) {
  const request = event.request;
  const cache = await caches.open(API_CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    // Actualizar cache en segundo plano
    event.waitUntil(
      fetch(request)
        .then(networkResponse => {
          if (networkResponse.ok) {
            return cache.put(request, networkResponse.clone());
          }
        })
        .catch(() => {})
    );
    return cached;
  }
  
  return fetch(request)
    .then(networkResponse => {
      if (networkResponse.ok) {
        event.waitUntil(cache.put(request, networkResponse.clone()));
      }
      return networkResponse;
    })
    .catch(() => new Response(null, { status: 503 }));
}

// Limpieza de cache de audio (simplificada)
self.addEventListener('message', event => {
  if (event.data === 'clean-audio-cache') {
    caches.open(AUDIO_CACHE_NAME).then(cache => 
      cache.keys().then(keys => {
        keys.forEach(request => {
          cache.delete(request);
        });
      })
    );
  }
});