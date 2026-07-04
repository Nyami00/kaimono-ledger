/* 買い物台帳 Service Worker — アプリ本体をキャッシュしオフライン動作させる
   バージョンを上げると古いキャッシュを破棄して更新します */
const CACHE = "kaimono-v4";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=> c.addAll(SHELL)).then(()=> self.skipWaiting()));
});
self.addEventListener("activate", e=>{
  e.waitUntil(
    caches.keys().then(keys=> Promise.all(keys.filter(k=> k!==CACHE).map(k=> caches.delete(k))))
      .then(()=> self.clients.claim())
  );
});
self.addEventListener("fetch", e=>{
  const req = e.request;
  // 同一オリジンのGETのみキャッシュ対象（OCR等のクロスオリジンPOSTは素通し）
  if(req.method!=="GET" || new URL(req.url).origin!==location.origin) return;
  e.respondWith(
    caches.match(req).then(hit=> hit || fetch(req).then(res=>{
      const copy = res.clone();
      caches.open(CACHE).then(c=> c.put(req, copy)).catch(()=>{});
      return res;
    }).catch(()=> caches.match("./index.html")))
  );
});
