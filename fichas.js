"use strict";
// =====================================================================
// 141 // ARQUIVO DE OPERADORES
// Várias fichas guardadas no aparelho.
//  - App nativo (Capacitor): um arquivo .json por ficha na pasta de dados do app.
//  - Navegador / PWA: IndexedDB (sem o limite de ~5 MB do localStorage).
//  - Último recurso: localStorage.
// Tudo fica num cache em memória, então leitura é síncrona e escrita é em segundo plano.
// =====================================================================
const FICHAS = (() => {
  const CUR_KEY = "ficha141_atual", MIG_KEY = "ficha141_migrado", LS_KEY = "ficha141_fichas";
  const cache = new Map();          // id -> { id, data, quick, created, updated }
  const isNative = !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());
  const plug = n => { if (!isNative) return null; try { return (Capacitor.Plugins && Capacitor.Plugins[n]) || (Capacitor.registerPlugin ? Capacitor.registerPlugin(n) : null); } catch (e) { return null; } };
  const FS = plug("Filesystem"), SHARE = plug("Share");
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
  let current = lsGet(CUR_KEY) || null;
  let backend = null, backendName = "";

  // ---------- backends ----------
  const IDB = {
    db: null,
    init() {
      return new Promise((res, rej) => {
        if (!window.indexedDB) return rej(new Error("sem IndexedDB"));
        const r = indexedDB.open("ficha141", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("fichas", { keyPath: "id" });
        r.onsuccess = () => { this.db = r.result; res(); };
        r.onerror = () => rej(r.error);
      });
    },
    all() {
      return new Promise((res, rej) => {
        const q = this.db.transaction("fichas").objectStore("fichas").getAll();
        q.onsuccess = () => res(q.result || []); q.onerror = () => rej(q.error);
      });
    },
    tx(fn) {
      return new Promise((res, rej) => {
        const t = this.db.transaction("fichas", "readwrite"); fn(t.objectStore("fichas"));
        t.oncomplete = () => res(); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error || new Error("abortado"));
      });
    },
    put(rec) { return this.tx(s => s.put(rec)); },
    del(id) { return this.tx(s => s.delete(id)); }
  };
  const FSB = {
    async init() { try { await FS.mkdir({ path: "fichas", directory: "DATA", recursive: true }); } catch (e) { /* já existe */ } },
    async all() {
      const r = await FS.readdir({ path: "fichas", directory: "DATA" }), out = [];
      for (const f of r.files || []) {
        const n = typeof f === "string" ? f : f.name;
        if (!/\.json$/.test(n)) continue;
        try { const x = await FS.readFile({ path: "fichas/" + n, directory: "DATA", encoding: "utf8" }); out.push(JSON.parse(x.data)); } catch (e) { console.warn("ficha ilegível", n, e); }
      }
      return out;
    },
    put(rec) { return FS.writeFile({ path: "fichas/" + rec.id + ".json", data: JSON.stringify(rec), directory: "DATA", encoding: "utf8", recursive: true }); },
    del(id) { return FS.deleteFile({ path: "fichas/" + id + ".json", directory: "DATA" }); }
  };
  const LSB = {
    async init() {},
    async all() { try { return JSON.parse(lsGet(LS_KEY) || "[]"); } catch (e) { return []; } },
    async put() { if (!lsSet(LS_KEY, JSON.stringify([...cache.values()]))) throw new Error("armazenamento cheio"); },
    async del() { return this.put(); }
  };

  // escritas em fila, uma de cada vez, para a última sempre vencer
  let chain = Promise.resolve();
  const queue = fn => (chain = chain.then(fn, fn));

  // ---------- utilidades ----------
  const newId = () => "op" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  function summary(d) {
    const I = (d && d.inputs) || {}, S = (d && d.selects) || {};
    return { cod: (I["char-codename"] || "").trim() || "SEM CODINOME", name: (I["char-name"] || "").trim(), lvl: I["char-level"] || "1",
      cls: S["char-class"] || "", spec: S["char-specialization"] || "", portrait: (d && d.portraitSrc) || "" };
  }
  function persist(rec) {
    return queue(() => backend.put(rec)).then(() => true, e => { console.error("falha ao salvar ficha", e); return false; });
  }
  function setCurrent(id) { current = id || null; if (current) lsSet(CUR_KEY, current); else { try { localStorage.removeItem(CUR_KEY); } catch (e) {} } }

  // ---------- migração dos saves antigos (autosave + salvamento rápido do localStorage) ----------
  async function migrate() {
    if (lsGet(MIG_KEY) || cache.size) { lsSet(MIG_KEY, "1"); return; }
    const parse = k => { try { const s = lsGet(k); return s ? JSON.parse(s) : null; } catch (e) { return null; } };
    const auto = parse("projeto141Character_auto"), quick = parse("projeto141Character"), now = Date.now();
    const same = auto && quick && summary(auto).cod === summary(quick).cod;
    if (auto) { const r = { id: newId(), data: auto, quick: same ? quick : null, created: now, updated: now }; cache.set(r.id, r); await persist(r); setCurrent(r.id); }
    if (quick && !same) { const r = { id: newId(), data: quick, quick: quick, created: now - 1, updated: now - 1 }; cache.set(r.id, r); await persist(r); if (!auto) setCurrent(r.id); }
    lsSet(MIG_KEY, "1");
  }

  async function init() {
    const tries = FS ? [[FSB, "aparelho"], [IDB, "navegador"], [LSB, "navegador (limitado)"]] : [[IDB, "navegador"], [LSB, "navegador (limitado)"]];
    for (const [b, n] of tries) {
      try { await b.init(); const all = await b.all(); backend = b; backendName = n; all.forEach(r => r && r.id && cache.set(r.id, r)); break; }
      catch (e) { console.warn("backend indisponível:", n, e); }
    }
    if (!backend) { backend = LSB; backendName = "navegador (limitado)"; }
    await migrate();
    if (current && !cache.has(current)) setCurrent(null);
    // pede ao navegador para não apagar os dados quando faltar espaço (PWA)
    try { if (!isNative && navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
  }

  // ---------- exportar .json (download no navegador, compartilhar no celular) ----------
  async function exportJSON(data, base) {
    const txt = JSON.stringify(data, null, 2);
    const name = (String(base || "personagem").trim() || "personagem").replace(/\s+/g, "_").replace(/[\\/:*?"<>|]/g, "") + "-projeto141.json";
    if (FS && SHARE) {
      await FS.writeFile({ path: name, data: txt, directory: "CACHE", encoding: "utf8" });
      const { uri } = await FS.getUri({ path: name, directory: "CACHE" });
      try { await SHARE.share({ title: name, files: [uri], dialogTitle: "Exportar ficha" }); }
      catch (e) { if (!/cancel/i.test(String(e && e.message))) await SHARE.share({ title: name, url: uri, dialogTitle: "Exportar ficha" }).catch(() => {}); }
      return "share";
    }
    const file = typeof File === "function" ? new File([txt], name, { type: "application/json" }) : null;
    const touch = window.matchMedia && matchMedia("(pointer:coarse)").matches;
    if (file && touch && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: name }); return "share"; } catch (e) { if (e && e.name === "AbortError") return "cancel"; }
    }
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], { type: "application/json" })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    return "download";
  }

  return {
    init, summary, exportJSON,
    get isNative() { return isNative; },
    get where() { return backendName; },
    get current() { return current; },
    setCurrent,
    has: id => cache.has(id),
    get: id => (cache.get(id) || {}).data || null,
    quick: id => (cache.get(id) || {}).quick || null,
    list() {
      return [...cache.values()].sort((a, b) => b.updated - a.updated)
        .map(r => Object.assign({ id: r.id, updated: r.updated, hasQuick: !!r.quick }, summary(r.data)));
    },
    // salva a ficha aberta; se ainda não existe (operador novo), cria
    save(data) {
      let r = current && cache.get(current);
      if (!r) { r = { id: newId(), data: null, quick: null, created: Date.now(), updated: 0 }; cache.set(r.id, r); setCurrent(r.id); }
      r.data = data; r.updated = Date.now();
      return persist(r);
    },
    saveQuick(data) {
      let r = current && cache.get(current);
      if (!r) { this.save(data); r = cache.get(current); }
      r.quick = data; r.data = data; r.updated = Date.now();
      return persist(r);
    },
    create(data) { const now = Date.now(), r = { id: newId(), data, quick: null, created: now, updated: now }; cache.set(r.id, r); persist(r); return r.id; },
    duplicate(id) {
      const src = cache.get(id); if (!src) return null;
      const d = JSON.parse(JSON.stringify(src.data));
      d.inputs = d.inputs || {}; d.inputs["char-codename"] = summary(d).cod.replace(/ \(CÓPIA( \d+)?\)$/, "") + " (CÓPIA)";
      return this.create(d);
    },
    remove(id) {
      cache.delete(id); if (current === id) setCurrent(null);
      if (backend === LSB) return persist(null);
      return queue(() => backend.del(id)).then(() => true, () => false);
    },
    async usage() {
      try { if (navigator.storage && navigator.storage.estimate) { const e = await navigator.storage.estimate(); return e.usage || 0; } } catch (e) {}
      let n = 0; cache.forEach(r => n += JSON.stringify(r).length); return n;
    }
  };
})();
