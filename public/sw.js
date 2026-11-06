const CACHE = "little-dash-adventure-v4";
const BASE = self.registration.scope;
const CORE = [
  "", "index.html", "manifest.webmanifest", "assets/icon.svg",
  "assets/worlds/candy-kingdom.webp",
  "assets/worlds/dinosaur-island.webp",
  "assets/worlds/underwater.webp",
  "assets/worlds/space-adventure.webp"
].map((path) => new URL(path, BASE).toString());

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)));
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); }
    return response;
  }).catch(() => caches.match(new URL("index.html", BASE).toString()))));
});
