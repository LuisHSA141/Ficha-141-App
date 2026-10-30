// 141 // service worker: deixa a ficha funcionar sem internet depois da primeira visita.
// HTML e JS se atualizam sozinhos (a versão nova aparece na abertura seguinte).
// Ao trocar sons ou imagens, mude VERSAO para os aparelhos baixarem tudo de novo.
const VERSAO = "ficha141-v3.5";
const ARQUIVOS = [
  "./",
  "index.html",
  "fichas.js",
  "data.js",
  "livro.js",
  "modular.js",
  "criacao.js",
  "combate.js",
  "logo.png",
  "manifest.webmanifest",
  "sons/Abrir.mp3",
  "sons/Clicar%20errado.mp3",
  "sons/Fechar.mp3",
  "sons/Passar%20mouse%20em%20cima.mp3",
  "sons/alerta.mp3",
  "sons/clicar%201.mp3",
  "sons/kept-you-waiting.mp3",
  "sons/wowok.mp3",
  "sons/musicas/Pense.mp3",
  "icones/agarrado.svg",
  "icones/alerta.png",
  "icones/amedrontado.png",
  "icones/atordoado.png",
  "icones/caido.png",
  "icones/cego.png",
  "icones/congelado.png",
  "icones/envenenado.png",
  "icones/escondido.svg",
  "icones/impedido.png",
  "icones/incapacitado.svg",
  "icones/inconsciente.png",
  "icones/invisivel.png",
  "icones/paralisado.png",
  "icones/queimado.png",
  "icones/sobrecarregado.svg",
  "icones/suprimido.svg",
  "icones/surdo.png",
  "icones/surpreendido.svg",
  "app-icons/apple-touch-icon.png",
  "app-icons/icon-1024.png",
  "app-icons/icon-192.png",
  "app-icons/icon-512.png",
  "app-icons/icon-maskable-512.png"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO && k !== "ficha141-ext").map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// áudio pede pedaços do arquivo (Range); o Safari só toca se receber 206
async function comRange(req, res) {
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get("range") || "");
  if (!m) return res;
  const buf = await res.arrayBuffer(), total = buf.byteLength;
  const ini = m[1] ? +m[1] : total - +m[2], fim = m[1] && m[2] ? Math.min(+m[2], total - 1) : total - 1;
  return new Response(buf.slice(ini, fim + 1), { status: 206, statusText: "Partial Content",
    headers: { "Content-Type": res.headers.get("Content-Type") || "audio/mpeg", "Content-Range": `bytes ${ini}-${fim}/${total}`, "Content-Length": String(fim - ini + 1), "Accept-Ranges": "bytes" } });
}
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // bandeiras (flagcdn): guarda depois da primeira vez
  if (url.hostname === "flagcdn.com") {
    e.respondWith(caches.open("ficha141-ext").then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      try { const r = await fetch(req); if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; } catch (err) { return Response.error(); }
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(VERSAO);
    const idx = new URL("index.html", self.registration.scope).href;
    const hit = await c.match(req.mode === "navigate" ? idx : req, { ignoreSearch: true });
    // código (html/js): responde do cache e já baixa a versão nova para a próxima abertura
    if (hit && (req.mode === "navigate" || /\.(js|html|webmanifest)$/.test(url.pathname))) {
      e.waitUntil(fetch(req.mode === "navigate" ? idx : req, { cache: "no-cache" }).then(r => { if (r.ok && r.status === 200) return c.put(req.mode === "navigate" ? idx : req, r); }).catch(() => {}));
    }
    if (hit) return req.headers.has("range") ? comRange(req, hit) : hit;
    try {
      const r = await fetch(req);
      if (r.ok && r.status === 200 && !req.headers.has("range")) c.put(req, r.clone());
      return r;
    } catch (err) {
      return (req.mode === "navigate" && await c.match(idx)) || Response.error();
    }
  })());
});
