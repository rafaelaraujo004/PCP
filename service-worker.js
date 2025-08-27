const CACHE = 'form384-v1';
const ASSETS = [
  './','index.html','styles.css','print.css','app.js','manifest.json',
  'assets/logo.png','assets/icon-192.png','assets/icon-512.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(()=>caches.match('index.html')))
  );
});
