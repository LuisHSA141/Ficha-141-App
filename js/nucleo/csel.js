"use strict";
// =====================================================================
// 141 // LISTAS DE ESCOLHA ESTILIZADAS
// A lista nativa do <select> não aceita estilo, então ela é trocada por um painel
// no visual da ficha. O <select> continua no lugar (valor, salvamento e eventos
// seguem iguais); só a lista que abre é nossa.
// =====================================================================
(() => {
  const E = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = t => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const BUSCA_MIN = 12; // listas grandes ganham busca
  let pop = null, alvo = null, itens = [], foco = -1;
  const mob = () => window.matchMedia("(max-width:650px)").matches;
  const ok = s => s && s.tagName === "SELECT" && !s.multiple && !(s.size > 1) && !s.disabled && !s.hasAttribute("data-nativo");

  function el() {
    if (pop) return pop;
    pop = document.createElement("div"); pop.className = "csel"; pop.setAttribute("role", "listbox");
    pop.innerHTML = `<div class="csel-in" tabindex="-1"><div class="csel-h"><span class="csel-t"></span><button class="csel-x" data-nosfx aria-label="Fechar">×</button></div><input class="in csel-q" placeholder="Buscar..." autocomplete="off" spellcheck="false"><div class="csel-l"></div></div>`;
    document.body.appendChild(pop);
    pop.addEventListener("mousedown", e => { if (!e.target.closest(".csel-q")) e.preventDefault(); }); // não tira o foco da busca
    pop.addEventListener("click", e => {
      if (e.target === pop || e.target.closest(".csel-x")) return fechar();
      const o = e.target.closest(".csel-o"); if (!o || o.classList.contains("off")) return;
      escolher(itens[+o.dataset.i]);
    });
    const q = pop.querySelector(".csel-q");
    q.addEventListener("input", () => desenha(q.value));
    pop.addEventListener("keydown", tecla);
    return pop;
  }
  function lerOpcoes(s) {
    const out = [];
    [...s.children].forEach(n => {
      if (n.tagName === "OPTGROUP") { out.push({ g: n.label }); [...n.children].forEach(o => out.push(opt(o, n.disabled))); }
      else if (n.tagName === "OPTION") out.push(opt(n, false));
    });
    return out.filter(o => o.g != null || !o.hid);
  }
  function opt(o, gOff) {
    const t = o.textContent, k = t.indexOf(" // ");
    return { v: o.value, t: k > 0 ? t.slice(0, k) : t, tag: k > 0 ? t.slice(k + 4) : "", off: o.disabled || gOff, hid: o.hidden, sel: o.selected, o };
  }
  function desenha(q) {
    const L = pop.querySelector(".csel-l"), qq = norm(q).trim();
    let html = "", g = null; foco = -1;
    const vis = itens.map((x, i) => ({ x, i })).filter(({ x }) => x.g == null && (!qq || norm(x.t + " " + x.tag).includes(qq)));
    vis.forEach(({ x, i }) => {
      const gr = grupoDe(i); if (gr !== g) { g = gr; if (g) html += `<div class="csel-g">${E(g)}</div>`; }
      html += `<div class="csel-o${x.off ? " off" : ""}${x.sel ? " on" : ""}" data-i="${i}" role="option"${x.off ? ' aria-disabled="true"' : ""}><span>${E(x.t) || "&nbsp;"}</span>${x.tag ? `<em>${E(x.tag)}</em>` : ""}</div>`;
    });
    L.innerHTML = html || '<div class="csel-vazio">NADA ENCONTRADO</div>';
    const on = L.querySelector(".csel-o.on") || (qq && L.querySelector(".csel-o:not(.off)"));
    if (on) { marca(on); if (!qq) on.scrollIntoView({ block: "center" }); }
  }
  function grupoDe(i) { for (let k = i; k >= 0; k--) if (itens[k].g != null) return itens[k].g; return null; }
  function marca(o) { pop.querySelectorAll(".csel-o.foco").forEach(x => x.classList.remove("foco")); if (o) { o.classList.add("foco"); foco = +o.dataset.i; } }
  function tecla(e) {
    const os = [...pop.querySelectorAll(".csel-o:not(.off)")], at = os.findIndex(o => +o.dataset.i === foco);
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); fechar(true); }
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); const n = os[Math.max(0, Math.min(os.length - 1, at + (e.key === "ArrowDown" ? 1 : -1)))]; if (n) { marca(n); n.scrollIntoView({ block: "nearest" }); } }
    else if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); if (foco >= 0 && !itens[foco].off) escolher(itens[foco]); }
    else if (e.key === "Tab") fechar();
  }
  function abrir(s) {
    if (!ok(s)) return;
    if (alvo === s && pop && pop.classList.contains("show")) return fechar();
    el(); alvo = s; itens = lerOpcoes(s);
    const lbl = s.closest("label"), t = (lbl && lbl.querySelector(".lbl")) || (s.id && document.querySelector(`label[for="${s.id}"]`));
    pop.querySelector(".csel-t").textContent = t ? t.textContent : "ESCOLHA";
    const q = pop.querySelector(".csel-q"), nOp = itens.filter(x => x.g == null).length;
    q.value = ""; q.style.display = nOp >= BUSCA_MIN ? "" : "none";
    pop.classList.toggle("sheet", mob());
    desenha("");
    pop.classList.add("show"); s.classList.add("csel-aberto");
    posiciona();
    if (typeof sfx === "function") sfx("abrir");
    if (nOp >= BUSCA_MIN && !mob()) q.focus({ preventScroll: true }); else pop.querySelector(".csel-in").focus({ preventScroll: true });
  }
  function posiciona() {
    if (!alvo || !pop.classList.contains("show")) return;
    const box = pop.querySelector(".csel-in");
    if (pop.classList.contains("sheet")) { box.style.cssText = ""; return; }
    const r = alvo.getBoundingClientRect(), W = window.innerWidth, H = window.innerHeight;
    const w = Math.min(W - 16, Math.max(r.width, 240));
    const abaixo = H - r.bottom - 10, acima = r.top - 10, para = abaixo >= 220 || abaixo >= acima ? "b" : "t";
    const maxH = Math.min(380, para === "b" ? abaixo : acima);
    box.style.width = w + "px"; box.style.maxHeight = maxH + "px";
    box.style.left = Math.max(8, Math.min(r.left, W - w - 8)) + "px";
    if (para === "b") { box.style.top = (r.bottom + 2) + "px"; box.style.bottom = ""; }
    else { box.style.bottom = (H - r.top + 2) + "px"; box.style.top = ""; }
  }
  function escolher(x) {
    const s = alvo; fechar();
    if (!s || !x) return;
    if (s.value !== x.v) {
      s.value = x.v;
      s.dispatchEvent(new Event("input", { bubbles: true }));
      s.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (typeof sfx === "function") sfx("clique");
  }
  function fechar(devolveFoco) {
    if (!pop || !pop.classList.contains("show")) return;
    pop.classList.remove("show");
    const s = alvo; alvo = null; if (s) { s.classList.remove("csel-aberto"); if (devolveFoco) s.focus({ preventScroll: true }); }
  }

  // mouse: segura a lista nativa e abre a nossa
  document.addEventListener("mousedown", e => {
    const s = e.target.closest && e.target.closest("select");
    if (pop && pop.classList.contains("show") && !pop.contains(e.target) && s !== alvo) fechar();
    if (!ok(s) || e.button !== 0 || e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
    e.preventDefault(); s.focus({ preventScroll: true }); abrir(s);
  }, true);
  // toque: abre no fim do toque (se não foi rolagem), e cancela o seletor nativo
  let t0 = null;
  document.addEventListener("touchstart", e => { const s = e.target.closest && e.target.closest("select"); t0 = ok(s) ? { s, x: e.touches[0].clientX, y: e.touches[0].clientY } : null; if (pop && pop.classList.contains("show") && !pop.contains(e.target) && s !== alvo) fechar(); }, { passive: true, capture: true });
  document.addEventListener("touchend", e => {
    if (!t0) return; const c = e.changedTouches[0], s = t0.s, mov = Math.hypot(c.clientX - t0.x, c.clientY - t0.y); t0 = null;
    if (mov > 10 || !ok(s)) return;
    e.preventDefault(); abrir(s);
  }, { passive: false, capture: true });
  // teclado no select fechado: Enter, espaço ou Alt+↓ abrem a lista
  document.addEventListener("keydown", e => {
    const s = e.target; if (!ok(s) || (pop && pop.classList.contains("show"))) return;
    if (e.key === "Enter" || e.key === " " || (e.altKey && e.key === "ArrowDown") || e.key === "F4") { e.preventDefault(); e.stopPropagation(); abrir(s); }
  }, true);
  window.addEventListener("resize", () => { if (pop && pop.classList.contains("show")) { pop.classList.toggle("sheet", mob()); posiciona(); } });
  document.addEventListener("scroll", e => { if (pop && pop.classList.contains("show") && !pop.contains(e.target)) { if (pop.classList.contains("sheet")) return; if (alvo && !alvo.isConnected) return fechar(); posiciona(); } }, true);
  // a ficha redesenha os cards com frequência: se o select sumiu, fecha
  new MutationObserver(() => { if (alvo && !alvo.isConnected) fechar(); }).observe(document.body, { childList: true, subtree: true });
  window.CSEL = { abrir, fechar };
})();
