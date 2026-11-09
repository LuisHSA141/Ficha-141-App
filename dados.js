"use strict";
// =====================================================================
// 141 // BANDEJA DE DADOS
// Monta a rolagem (3d6 + 2d8 + 4), vantagem/desvantagem nos d20, total e histórico.
// O histórico fica salvo na ficha do operador.
// =====================================================================
const DADOS = (() => {
  const TIPOS = [4, 6, 8, 10, 12, 20, 100];
  const MAX_HIST = 40;
  let pool = {}, mod = 0, modo = "normal", hist = [], ultimo = null;
  const E = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const sg = n => (n >= 0 ? "+ " : "− ") + Math.abs(n);
  // número aleatório justo (crypto quando existe)
  function d(n) {
    if (window.crypto && crypto.getRandomValues) { const a = new Uint32Array(1), lim = Math.floor(0x100000000 / n) * n; let x; do { crypto.getRandomValues(a); x = a[0]; } while (x >= lim); return (x % n) + 1; }
    return 1 + Math.floor(Math.random() * n);
  }

  // ---------- expressão <-> dados escolhidos ----------
  function formula(p = pool, m = mod) {
    const parts = TIPOS.filter(t => p[t] > 0).map(t => `${p[t]}d${t}`);
    let f = parts.join(" + ");
    if (m) f += (f ? " " : "") + (m > 0 ? (f ? "+ " : "") + m : "− " + Math.abs(m));
    return f || "";
  }
  // aceita "3d6+2d8+4", "d20 - 1", "2D10 + 1d4", "d%"
  function parse(txt) {
    const p = {}, s = String(txt || "").toLowerCase().replace(/−/g, "-").replace(/\s+/g, "").replace(/d%/g, "d100");
    if (!s) return { p, m: 0 };
    let m = 0, ok = true;
    const toks = s.match(/[+-]?[^+-]+/g) || [];
    toks.forEach(t => {
      const sgn = t[0] === "-" ? -1 : 1, b = t.replace(/^[+-]/, "");
      let x;
      if ((x = /^(\d*)d(\d+)$/.exec(b))) { const n = +(x[1] || 1), f = +x[2]; if (!f || n > 100 || f > 1000) { ok = false; return; } if (sgn < 0) { ok = false; return; } p[f] = (p[f] || 0) + n; }
      else if (/^\d+$/.test(b)) m += sgn * +b;
      else ok = false;
    });
    return ok ? { p, m } : null;
  }

  // ---------- rolar ----------
  function rolar(p, m, md, rotulo) {
    const grupos = [];
    let total = m, nat = null;
    Object.keys(p).map(Number).sort((a, b) => a - b).forEach(f => {
      const n = p[f]; if (!n) return;
      const res = [];
      for (let i = 0; i < n; i++) {
        if (f === 20 && md !== "normal") {
          const a = d(20), b = d(20), keep = md === "vant" ? Math.max(a, b) : Math.min(a, b);
          res.push({ v: keep, drop: keep === a ? b : a });
          total += keep;
        } else { const v = d(f); res.push({ v }); total += v; }
      }
      grupos.push({ f, res });
    });
    // natural 20 / 1 quando a rolagem tem um d20 só
    const d20 = grupos.find(g => g.f === 20);
    if (d20 && d20.res.length === 1) nat = d20.res[0].v === 20 ? "crit" : d20.res[0].v === 1 ? "falha" : null;
    const r = { t: Date.now(), f: formula(p, m), md: grupos.some(g => g.f === 20) ? md : "normal", rot: rotulo || "", grupos, m, total, nat };
    hist.unshift(r); if (hist.length > MAX_HIST) hist.length = MAX_HIST;
    ultimo = r;
    som(r);
    if (typeof changed === "function") changed(true);
    return r;
  }

  // ---------- som de dados (sintetizado) ----------
  function som(r) {
    const C = typeof ac === "function" ? ac() : null, vol = typeof synthVol === "function" ? synthVol(.9) : 0;
    if (!C || vol <= 0) return;
    const n = Math.min(8, r.grupos.reduce((a, g) => a + g.res.length, 0) + 2);
    for (let i = 0; i < n; i++) {
      const t0 = C.currentTime + i * 0.055 + Math.random() * 0.03;
      const len = Math.floor(C.sampleRate * 0.035), buf = C.createBuffer(1, len, C.sampleRate), ch = buf.getChannelData(0);
      for (let k = 0; k < len; k++) ch[k] = (Math.random() * 2 - 1) * Math.pow(1 - k / len, 3);
      const src = C.createBufferSource(), bp = C.createBiquadFilter(), g = C.createGain();
      src.buffer = buf; bp.type = "bandpass"; bp.frequency.value = 1800 + Math.random() * 2200; bp.Q.value = 3;
      g.gain.value = vol * (0.35 + Math.random() * 0.4);
      src.connect(bp).connect(g).connect(C.destination); src.start(t0);
    }
  }

  // ---------- rolagens da ficha ----------
  function atalhos() {
    const out = [];
    try {
      const ini = (document.getElementById("char-initiative") || {}).textContent || "+0";
      out.push({ g: "GERAL", n: "Iniciativa", f: "1d20 " + ini.replace("+", "+ ").replace("-", "− ").replace(/^1d20 \+ 0$/, "1d20") });
      const M = getMods();
      Object.keys(ATTRIBUTES).forEach(k => { if (k in M) out.push({ g: "TESTE DE ATRIBUTO", n: ATTRIBUTES[k], f: "1d20" + (M[k] ? " " + sg(M[k]) : "") }); });
      (LISTS.weapons || []).forEach(w => {
        if (w._new || w._edit || w.local) return;
        const R = ARM.calc(w), nm = w.name || "Arma";
        out.push({ g: "ARMAS", n: `${nm} // ataque`, f: "1d20" + (R.prec ? " " + sg(R.prec) : "") });
        const dm = String(R.dm.txt || "").replace(/−/g, "-");
        if (parse(dm)) out.push({ g: "ARMAS", n: `${nm} // dano${R.dm.rec ? " (com Recuo)" : ""}`, f: dm.replace(/-/g, "−") });
      });
    } catch (e) { console.warn(e); }
    return out;
  }

  // ---------- interface ----------
  function el() {
    let m = document.getElementById("diceTray"); if (m) return m;
    m = document.createElement("aside"); m.id = "diceTray"; m.className = "dtray"; m.setAttribute("aria-label", "Bandeja de dados");
    m.innerHTML = `<div class="dt-h"><span>⚄ BANDEJA DE DADOS</span><button class="fx-close" data-dt="x" aria-label="Fechar" data-nosfx>×</button></div>
      <div class="dt-dice">${TIPOS.map(t => `<button class="dt-d" data-dt-add="${t}" title="Clique: +1 d${t} // clique no número ou botão direito: −1" data-nosfx><span>d${t}</span><b data-dt-n="${t}"></b></button>`).join("")}</div>
      <div class="dt-row"><input class="in dt-f" id="dtF" placeholder="Toque nos dados ou digite: 3d6 + 2d8 + 2" autocomplete="off" spellcheck="false" enterkeyhint="go"></div>
      <div class="dt-row dt-opts">
        <div class="dt-mod"><span class="lbl">MOD.</span><button class="step" data-dt-mod="-1" data-nosfx>−</button><b id="dtMod">0</b><button class="step" data-dt-mod="1" data-nosfx>+</button></div>
        <div class="dt-modo">${[["normal", "NORMAL"], ["vant", "VANTAGEM"], ["desv", "DESVANTAGEM"]].map(([k, n]) => `<button data-dt-modo="${k}" data-nosfx>${n}</button>`).join("")}</div>
      </div>
      <div class="dt-row dt-go"><button class="btn" data-dt="clear" data-nosfx>LIMPAR</button><button class="btn acc dt-roll" data-dt="roll" data-nosfx>⚄ ROLAR</button></div>
      <div class="dt-res" id="dtRes"><span class="dt-empty">MONTE A ROLAGEM E ROLE</span></div>
      <details class="dt-sec" id="dtAt"><summary>ROLAGENS DA FICHA</summary><div id="dtAtL"></div></details>
      <div class="dt-sec dt-hist"><div class="dt-hh"><span>HISTÓRICO</span><button class="btn sm" data-dt="hclear" data-nosfx>LIMPAR</button></div><div id="dtHist"></div></div>`;
    document.body.appendChild(m);
    m.addEventListener("click", e => {
      const b = e.target.closest("[data-dt],[data-dt-add],[data-dt-mod],[data-dt-modo],[data-dt-at],[data-dt-h]"); if (!b) return;
      if (b.dataset.dtAdd && e.target.matches("[data-dt-n]")) { const t = +b.dataset.dtAdd; if (pool[t]) pool[t]--; sync(); sfx("clique"); return; }
      if (b.dataset.dtAdd) { const t = +b.dataset.dtAdd; pool[t] = Math.min(99, (pool[t] || 0) + 1); sync(); sfx("clique"); return; }
      if (b.dataset.dtMod) { mod = Math.max(-99, Math.min(99, mod + +b.dataset.dtMod)); sync(); sfx("clique"); return; }
      if (b.dataset.dtModo) { modo = b.dataset.dtModo; sync(); sfx("clique"); return; }
      if (b.dataset.dtAt != null) { const a = atalhos()[+b.dataset.dtAt]; if (a) rolarTxt(a.f, a.n); return; }
      if (b.dataset.dtH != null) { const h = hist[+b.dataset.dtH]; if (h) { rolarTxt(h.f, h.rot, h.md); } return; }
      const a = b.dataset.dt;
      if (a === "x") abrir(false);
      else if (a === "clear") { pool = {}; mod = 0; modo = "normal"; sync(); sfx("fechar"); }
      else if (a === "roll") rolarAtual();
      else if (a === "hclear") { if (!hist.length) return; hist = []; desenhaHist(); sfx("fechar"); if (typeof changed === "function") changed(true); }
    });
    // botão direito num dado tira um
    m.addEventListener("contextmenu", e => { const b = e.target.closest("[data-dt-add]"); if (!b) return; e.preventDefault(); const t = +b.dataset.dtAdd; if (pool[t]) { pool[t]--; sync(); sfx("clique"); } });
    const f = m.querySelector("#dtF");
    f.addEventListener("input", () => { const r = parse(f.value); f.classList.toggle("bad", !r); if (r) { pool = r.p; mod = r.m; sync(true); } });
    f.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); rolarAtual(); } });
    m.querySelector("#dtAt").addEventListener("toggle", desenhaAtalhos);
    return m;
  }
  function sync(daDigitacao) {
    const m = el();
    TIPOS.forEach(t => { const b = m.querySelector(`[data-dt-n="${t}"]`); b.textContent = pool[t] ? pool[t] : ""; b.parentElement.classList.toggle("on", !!pool[t]); });
    m.querySelector("#dtMod").textContent = mod > 0 ? "+" + mod : mod < 0 ? "−" + Math.abs(mod) : "0";
    m.querySelectorAll("[data-dt-modo]").forEach(b => b.classList.toggle("on", b.dataset.dtModo === modo));
    m.querySelector(".dt-modo").classList.toggle("dim", !pool[20]);
    m.querySelector(".dt-modo").title = pool[20] ? "Vantagem/desvantagem: cada d20 rola duas vezes e fica o maior (ou o menor)" : "Vantagem e desvantagem valem para os d20";
    if (!daDigitacao) { const f = m.querySelector("#dtF"); f.value = formula(); f.classList.remove("bad"); }
  }
  function rolarAtual() {
    const f = el().querySelector("#dtF"), r = parse(f.value);
    if (!r || (!Object.values(r.p).some(Boolean) && !r.m)) { sfx("errado"); f.classList.add("bad"); toast("MONTE A ROLAGEM: TOQUE NOS DADOS OU DIGITE (EX.: 3d6 + 2d8 + 2)", true); return; }
    mostra(rolar(r.p, r.m, modo));
  }
  function rolarTxt(txt, rot, md) {
    const r = parse(txt); if (!r) return;
    pool = r.p; mod = r.m; if (md) modo = md; sync();
    mostra(rolar(r.p, r.m, modo, rot));
  }
  function chips(r, cls = "") {
    return r.grupos.map(g => g.res.map(x => `<i class="dt-v${cls}${g.f === 20 && x.v === 20 ? " c20" : ""}${g.f === 20 && x.v === 1 ? " c1" : ""}" title="d${g.f}">${x.v}${x.drop != null ? `<s>${x.drop}</s>` : ""}<small>d${g.f}</small></i>`).join("")).join("") + (r.m ? `<i class="dt-v dt-m">${r.m > 0 ? "+" : "−"}${Math.abs(r.m)}</i>` : "");
  }
  const MODO_TXT = { vant: "VANTAGEM", desv: "DESVANTAGEM" };
  function mostra(r) {
    const box = el().querySelector("#dtRes");
    box.innerHTML = `<div class="dt-rh">${r.rot ? `<b>${E(r.rot.toUpperCase())}</b> // ` : ""}${E(r.f)}${r.md !== "normal" ? ` // ${MODO_TXT[r.md]}` : ""}</div>
      <div class="dt-tot${r.nat ? " " + r.nat : ""}"><span id="dtTot">0</span>${r.nat === "crit" ? "<em>NATURAL 20</em>" : r.nat === "falha" ? "<em>NATURAL 1</em>" : ""}</div>
      <div class="dt-chips">${chips(r)}</div>`;
    box.classList.remove("rolling"); void box.offsetWidth; box.classList.add("rolling");
    // contagem rápida até o total
    const t = document.getElementById("dtTot"), fim = r.total, t0 = performance.now(), dur = 420;
    (function step(now) { const k = Math.min(1, (now - t0) / dur); t.textContent = k < 1 ? Math.round(fim * k + (Math.random() - .5) * 6 * (1 - k)) : fim; if (k < 1) requestAnimationFrame(step); })(t0);
    desenhaHist();
  }
  function desenhaHist() {
    const L = el().querySelector("#dtHist");
    L.innerHTML = hist.length ? hist.map((h, i) => `<button class="dt-hi" data-dt-h="${i}" title="Rolar de novo" data-nosfx>
        <span class="dt-ht">${new Date(h.t).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
        <span class="dt-hf">${h.rot ? `<b>${E(h.rot)}</b> ` : ""}${E(h.f)}${h.md !== "normal" ? ` <em>${MODO_TXT[h.md].slice(0, 4)}.</em>` : ""}<small>${h.grupos.map(g => g.res.map(x => x.v).join(", ")).filter(Boolean).join(" | ")}</small></span>
        <b class="dt-hv${h.nat ? " " + h.nat : ""}">${h.total}</b></button>`).join("") : '<div class="dt-empty">NENHUMA ROLAGEM AINDA</div>';
  }
  function desenhaAtalhos() {
    const A = atalhos(), L = el().querySelector("#dtAtL");
    let g0 = "", h = "";
    A.forEach((a, i) => { if (a.g !== g0) { g0 = a.g; h += `<div class="dt-ag">${E(a.g)}</div>`; } h += `<button class="dt-a" data-dt-at="${i}" data-nosfx><span>${E(a.n)}</span><em>${E(a.f)}</em></button>`; });
    L.innerHTML = h || '<div class="dt-empty">—</div>';
  }
  function abrir(on) {
    const m = el(); if (on === undefined) on = !m.classList.contains("show");
    m.classList.toggle("show", on); document.body.classList.toggle("dt-on", on);
    const b = document.getElementById("diceBtn"); if (b) b.classList.toggle("on", on);
    if (on) { sync(); desenhaHist(); if (m.querySelector("#dtAt").open) desenhaAtalhos(); sfx("abrir"); }
    else sfx("fechar");
  }
  return {
    abrir, rolar, parse, formula,
    get aberto() { const m = document.getElementById("diceTray"); return !!(m && m.classList.contains("show")); },
    salvar: () => hist.slice(0, MAX_HIST),
    carregar: h => { hist = Array.isArray(h) ? h.slice(0, MAX_HIST) : []; ultimo = null; const m = document.getElementById("diceTray"); if (m) { desenhaHist(); m.querySelector("#dtRes").innerHTML = '<span class="dt-empty">MONTE A ROLAGEM E ROLE</span>'; } }
  };
})();
window.DADOS = DADOS;
document.addEventListener("click", e => { if (e.target.closest("#diceBtn")) DADOS.abrir(); });
