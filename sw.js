// 141 // service worker: deixa a ficha funcionar sem internet depois da primeira visita.
// HTML e JS se atualizam sozinhos (a versão nova aparece na abertura seguinte).
// Ao trocar sons ou imagens, mude VERSAO para os aparelhos baixarem tudo de novo.
const VERSAO = "ficha141-v4.8";
const ARQUIVOS = [
  "./",
  "index.html",
  "fichas.js",
  "armas.js",
  "armas-catalogo.js",
  "bolso-catalogo.js",
  "equip-catalogo.js",
  "equip.js",
  "armas/aa-12.webp",
  "armas/ak-12.webp",
  "armas/ak-74.webp",
  "armas/ak-74u.webp",
  "armas/alligator.webp",
  "armas/an-94.webp",
  "armas/ar-15.webp",
  "armas/arco-compacto-de-caca.webp",
  "armas/arco-composto-militar.webp",
  "armas/arco-longo-de-caca.webp",
  "armas/arco-recurvo-tatico.webp",
  "armas/as-val.webp",
  "armas/asvk.webp",
  "armas/at4.webp",
  "armas/awm.webp",
  "armas/barret-m82.webp",
  "armas/benelli-m4.webp",
  "armas/berreta-1301.webp",
  "armas/cano-duplo.webp",
  "armas/carl-gustaf-m4.webp",
  "armas/china-lake.webp",
  "armas/colt-python.webp",
  "armas/crossbow.webp",
  "armas/cz-75.webp",
  "armas/cz-85.webp",
  "armas/desert-eagle.webp",
  "armas/dp-28.webp",
  "armas/famas.webp",
  "armas/five-seven.webp",
  "armas/fn-509.webp",
  "armas/fn-fal.webp",
  "armas/fn-scar.webp",
  "armas/g17.webp",
  "armas/g18.webp",
  "armas/g36c.webp",
  "armas/g85.webp",
  "armas/garras.webp",
  "armas/hecate-ii.webp",
  "armas/hk-g28.webp",
  "armas/hk-msg90.webp",
  "armas/hk-usp.webp",
  "armas/hk21.webp",
  "armas/hk416.webp",
  "armas/honey-badger.webp",
  "armas/imi-galil.webp",
  "armas/intervention.webp",
  "armas/javelin.webp",
  "armas/judge.webp",
  "armas/kar98.webp",
  "armas/karambit.webp",
  "armas/katana.webp",
  "armas/ksg.webp",
  "armas/kukri.webp",
  "armas/lanca-ceu.webp",
  "armas/lanca-chamas.webp",
  "armas/lanca-tatica.webp",
  "armas/lcr.webp",
  "armas/m110.webp",
  "armas/m1911.webp",
  "armas/m24.webp",
  "armas/m249.webp",
  "armas/m27-iar.webp",
  "armas/m32-mgl.webp",
  "armas/m320.webp",
  "armas/m4a1.webp",
  "armas/m500.webp",
  "armas/m60.webp",
  "armas/m79.webp",
  "armas/m9.webp",
  "armas/mac10.webp",
  "armas/machado.webp",
  "armas/marlin.webp",
  "armas/maverick-88.webp",
  "armas/mg3.webp",
  "armas/mk14-ebr.webp",
  "armas/mk22.webp",
  "armas/montante.webp",
  "armas/mosin.webp",
  "armas/mp5.webp",
  "armas/mp7.webp",
  "armas/mpx.webp",
  "armas/negev.webp",
  "armas/ots-01.webp",
  "armas/p320.webp",
  "armas/p90.webp",
  "armas/pit-viper.webp",
  "armas/pkm.webp",
  "armas/pl-14.webp",
  "armas/pm.webp",
  "armas/pp-90.webp",
  "armas/pp19.webp",
  "armas/qbu-88.webp",
  "armas/remington-870.webp",
  "armas/rpg-7.webp",
  "armas/rpk.webp",
  "armas/rsh-12.webp",
  "armas/saiga-12.webp",
  "armas/scorpion.webp",
  "armas/sg.webp",
  "armas/sig-m250.webp",
  "armas/sig-spear.webp",
  "armas/skorpion.webp",
  "armas/sks.webp",
  "armas/sl8.webp",
  "armas/soqueira.webp",
  "armas/spas-12.webp",
  "armas/spr.webp",
  "armas/srs.webp",
  "armas/steyr-aug.webp",
  "armas/steyr-scout.webp",
  "armas/stiker.webp",
  "armas/svd.webp",
  "armas/svu.webp",
  "armas/tac-50.webp",
  "armas/taser.webp",
  "armas/tec-9.webp",
  "armas/tmp.webp",
  "armas/tomahawk.webp",
  "armas/tonfa.webp",
  "armas/ultimax.webp",
  "armas/ump45.webp",
  "armas/ump9.webp",
  "armas/uzi.webp",
  "armas/vector.webp",
  "armas/vsk-94.webp",
  "armas/vss.webp",
  "armas/winchester-1887.webp",
  "data.js",
  "livro.js",
  "modular.js",
  "criacao.js",
  "combate.js",
  "dados.js",
  "csel.js",
  "glitch.js",
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
