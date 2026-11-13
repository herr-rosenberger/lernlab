// Offline-Unterstützung: Grundgerüst wird vorab gespeichert, besuchte Apps beim ersten Aufruf.
// Die Zeilen V und SHELL schreibt scripts/build.mjs automatisch neu.
const V = 'lernlab-a6c269b0a1'; // build
const SHELL = ["./","index.html","impressum.html","datenschutz.html","manifest.webmanifest","data/apps.json","assets/icon-180.png","assets/icon-192.png","assets/icon-512.png","assets/icon.svg","assets/katex/LICENSE","assets/katex/auto-render.min.js","assets/katex/fonts/KaTeX_AMS-Regular.woff2","assets/katex/fonts/KaTeX_Caligraphic-Bold.woff2","assets/katex/fonts/KaTeX_Caligraphic-Regular.woff2","assets/katex/fonts/KaTeX_Fraktur-Bold.woff2","assets/katex/fonts/KaTeX_Fraktur-Regular.woff2","assets/katex/fonts/KaTeX_Main-Bold.woff2","assets/katex/fonts/KaTeX_Main-BoldItalic.woff2","assets/katex/fonts/KaTeX_Main-Italic.woff2","assets/katex/fonts/KaTeX_Main-Regular.woff2","assets/katex/fonts/KaTeX_Math-BoldItalic.woff2","assets/katex/fonts/KaTeX_Math-Italic.woff2","assets/katex/fonts/KaTeX_SansSerif-Bold.woff2","assets/katex/fonts/KaTeX_SansSerif-Italic.woff2","assets/katex/fonts/KaTeX_SansSerif-Regular.woff2","assets/katex/fonts/KaTeX_Script-Regular.woff2","assets/katex/fonts/KaTeX_Size1-Regular.woff2","assets/katex/fonts/KaTeX_Size2-Regular.woff2","assets/katex/fonts/KaTeX_Size3-Regular.woff2","assets/katex/fonts/KaTeX_Size4-Regular.woff2","assets/katex/fonts/KaTeX_Typewriter-Regular.woff2","assets/katex/katex.min.css","assets/katex/katex.min.js","assets/qr/LICENSE","assets/qr/qrcode.js","css/main.css","css/print.css","js/catalog.js","js/common.js","js/lernapp.js","js/math.js","js/plot.js","js/qr.js","js/term.js","js/textcheck.js"]; // build
self.addEventListener('install', e => e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  // Zuerst aus dem Speicher (schnell, auch offline), im Hintergrund aktualisieren.
  e.respondWith(caches.open(V).then(async c => {
    const treffer = await c.match(r, { ignoreSearch: r.mode === 'navigate' });
    const netz = fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }).catch(() => null);
    if (treffer) { e.waitUntil(netz); return treffer; }
    return (await netz) || (r.mode === 'navigate' ? c.match('index.html') : Response.error());
  }));
});
