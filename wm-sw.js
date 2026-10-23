const C = "wm-shell-v5";
const LIB = "wm-lib-cesium-1.121.0";   // harita kütüphanesi: sürümü sabit, bir kez iner, cihazda kalır
const KEEP = [C, LIB];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(C).then((c) => c.addAll(["./", "wm-icon-192.png", "wm-icon-512.png"]).catch(() => {}))); self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const req = e.request, url = req.url;
  // Harita kütüphanesi ve yazı tipleri: önce cihazdaki kopya (anında), yoksa internetten indirip sakla
  if (req.method === "GET" && (url.startsWith("https://cdn.jsdelivr.net/npm/cesium@1.121.0/") || url.startsWith("https://fonts.gstatic.com/"))) {
    e.respondWith(caches.open(LIB).then((c) => c.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }))));
    return;
  }
  if (req.mode !== "navigate") return;
  const path = new URL(url).pathname;
  if (!(path.endsWith("/") || path.endsWith("/index.html"))) return;   // yalnızca uygulama sayfası saklanır (ör. gizlilik sayfası değil)
  // Sayfanın kendisi: her açılışta sunucudan en yeni sürüm (tarayıcının 10 dakikalık eski kopyası atlanır); internet yoksa son kayıtlı sürüm
  e.respondWith(fetch(req.url, { cache: "no-cache", credentials: "same-origin" }).then((r) => { const cp = r.clone(); caches.open(C).then((c) => c.put("./", cp)); return r; }).catch(() => caches.match("./")));
});
