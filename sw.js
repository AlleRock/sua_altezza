// Sua Altezza - Service Worker v1.0
// Gestisce cache offline per tiles mappa e assets statici

const CACHE_NAME = 'sua-altezza-v1';
const TILE_CACHE_NAME = 'sua-altezza-tiles-v1';

// Assets statici da pre-cachare all'installazione
const STATIC_ASSETS = [
  './Sua_Altezza.html',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;900&family=Barlow+Condensed:wght@700;900&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://api.mapbox.com/mapbox.js/plugins/leaflet-omnivore/v0.3.1/leaflet-omnivore.min.js',
  'https://raw.githubusercontent.com/AlleRock/sua_altezza/main/punto.png'
];

// Domini delle tile mappa da cachare dinamicamente
const TILE_DOMAINS = [
  'tile.openstreetmap.org',
  'tile.opentopomap.org',
  'server.arcgisonline.com'
];

// ── INSTALL: pre-cacha gli asset statici ──────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS.filter(url => !url.startsWith('https://fonts'))))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Pre-cache parziale:', err))
  );
});

// ── ACTIVATE: pulisce cache vecchie ──────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== TILE_CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: strategia per tipo di risorsa ─────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Tile mappa → Cache First (offline-friendly)
  if (TILE_DOMAINS.some(domain => url.hostname.includes(domain))) {
    event.respondWith(cacheTileFirst(event.request));
    return;
  }

  // API elevazione Open-Meteo → Network First con fallback
  if (url.hostname.includes('api.open-meteo.com')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Assets statici → Cache First
  if (event.request.destination === 'script' || 
      event.request.destination === 'style' ||
      event.request.destination === 'image') {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Default → Network con fallback cache
  event.respondWith(networkFirst(event.request));
});

// ── STRATEGIE ────────────────────────────────────────────────────────────────

// Cache First: usa cache, scarica solo se non presente
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Risorsa non disponibile offline', { status: 503 });
  }
}

// Cache First per tile (cache separata, max 2000 tile)
async function cacheTileFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(TILE_CACHE_NAME);
      // Limita dimensione cache tile
      const keys = await cache.keys();
      if (keys.length > 2000) {
        await cache.delete(keys[0]);
      }
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Tile grigia di fallback 256x256
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#1a1f2e"/></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

// Network First: prova rete, usa cache come fallback
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

// ── MESSAGGIO: permette all'app di richiedere cache manuale di un'area ────────
self.addEventListener('message', async event => {
  if (event.data && event.data.type === 'CACHE_MAP_AREA') {
    const { bounds, zoom, layers } = event.data;
    const tiles = generateTileList(bounds, zoom, layers);
    
    event.source.postMessage({ type: 'CACHE_PROGRESS', total: tiles.length, done: 0 });
    
    const cache = await caches.open(TILE_CACHE_NAME);
    let done = 0;
    
    for (const url of tiles) {
      try {
        const response = await fetch(url);
        if (response.ok) await cache.put(url, response);
      } catch { /* ignora tile fallite */ }
      done++;
      if (done % 10 === 0) {
        event.source.postMessage({ type: 'CACHE_PROGRESS', total: tiles.length, done });
      }
    }
    event.source.postMessage({ type: 'CACHE_DONE', total: tiles.length });
  }
});

// Genera lista URL tile per un'area geografica e range di zoom
function generateTileList(bounds, maxZoom, layers) {
  const urls = [];
  const minZoom = Math.max(maxZoom - 3, 10);
  
  for (let z = minZoom; z <= maxZoom; z++) {
    const minTile = latLonToTile(bounds.north, bounds.west, z);
    const maxTile = latLonToTile(bounds.south, bounds.east, z);
    
    for (let x = minTile.x; x <= maxTile.x; x++) {
      for (let y = minTile.y; y <= maxTile.y; y++) {
        // OpenStreetMap Standard
        const s = ['a','b','c'][Math.floor(Math.random()*3)];
        urls.push(`https://${s}.tile.openstreetmap.org/${z}/${x}/${y}.png`);
        // OpenTopoMap
        urls.push(`https://a.tile.opentopomap.org/${z}/${x}/${y}.png`);
      }
    }
  }
  return urls;
}

function latLonToTile(lat, lon, zoom) {
  const x = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  return { x, y };
}
