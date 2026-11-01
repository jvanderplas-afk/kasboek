/* Kasboek Nooit Gedacht: service worker. Bevat geen clubgegevens. */
var CACHE = "kasboek-v1.6-664e3a13b5";
var CDN_CACHE = "kasboek-cdn-v1";
var CORE = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-192.png", "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png", "./icons/favicon-32.png"];
var CDN_HOSTS = ["cdnjs.cloudflare.com", "cdn.jsdelivr.net", "tessdata.projectnaptha.com", "unpkg.com"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(CORE.map(function (u) { return new Request(u, { cache: "reload" }); }));
  }));
});
self.addEventListener("message", function (e) { if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting(); });
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf("kasboek-") === 0 && k !== CACHE && k !== CDN_CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (req.mode === "navigate") {
      e.respondWith(caches.match("./index.html", { cacheName: CACHE }).then(function (r) { return r || fetch(req); }).catch(function () { return fetch(req); }));
      return;
    }
    e.respondWith(caches.match(req, { cacheName: CACHE, ignoreSearch: true }).then(function (r) { return r || fetch(req); }));
    return;
  }
  if (CDN_HOSTS.indexOf(url.hostname) !== -1) {
    /* pdf.js / tesseract.js: na het eerste gebruik ook offline beschikbaar */
    e.respondWith(caches.open(CDN_CACHE).then(function (c) {
      return c.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) { if (res && (res.ok || res.type === "opaque")) c.put(req, res.clone()); return res; });
      });
    }));
  }
});
