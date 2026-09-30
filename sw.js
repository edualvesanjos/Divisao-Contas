// Service worker mínimo: cacheia o "app shell" para abrir offline.
// A sincronização de dados em si é feita por js/sync.js, não aqui.

const CACHE_NAME = 'contas-combustivel-v1.0.2-dev';
const APP_SHELL = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/import-xlsx.js',
  './js/import-fuel-enrichment.js',
  './js/auth.js',
  './js/db-local.js',
  './js/sync.js',
  './js/environment.js',
  './js/superdb-client.js',
  './manifest.json',
  './favicon.ico',
  './icons/favicon-32.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './package.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Nunca cachear chamadas ao serviço de dados — só o app shell.
  if (event.request.url.includes('superdb.com.br')) return;

  if (new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
