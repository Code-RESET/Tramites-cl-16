/*
  Guía de Trámites IMSS · service worker (copia local para funcionar sin red)
  Autor: Ing. Luis Ángel Díaz Bernal
  IMPORTANTE: en cada entrega cambie VERSION aquí y en version.json (el mismo número).
*/
var VERSION = '1.0.0';
var CACHE = 'guia-tramites-imss-' + VERSION;
var ARCHIVOS = [
  './', 'index.html', 'styles.css', 'app.js', 'data.js', 'version.json', 'manifest.json', 'icons/icono.svg',
  'fonts/atkinson-hyperlegible-400.woff2', 'fonts/atkinson-hyperlegible-700.woff2'
  // Si agrega fotos reales de documentos (carpeta fotos/), anótelas aquí también.
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARCHIVOS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

// Primero la red (para ver cambios); si no hay red, la copia guardada.
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then(function (resp) {
      if (resp && resp.ok && new URL(e.request.url).origin === location.origin && e.request.url.indexOf('version.json') < 0) {
        var copia = resp.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copia); });
      }
      return resp;
    }).catch(function () {
      return caches.match(e.request, { ignoreSearch: true });
    })
  );
});
