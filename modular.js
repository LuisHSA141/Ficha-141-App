"use strict";
// =====================================================================
// 141 // LAYOUT MODULAR
// Janela principal + trilho de ícones. Toda caixa pode ser arrastada pelo
// cabeçalho, redimensionada pelo canto, minimizada e renomeada (duplo clique
// no título). Caixas novas: texto, imagem, barra e contador.
// O layout é salvo junto com a ficha (collect/apply).
// =====================================================================
const MOD = (() => {
  const UNIT = 4, GAP = 16;
  const WINS = {
    principal: { name: "PRINCIPAL", icon: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="1"/><circle cx="9" cy="11" r="2.6"/><path d="M5.5 17c.8-2 2-3 3.5-3s2.7 1 3.5 3M14 9h5M14 12h5M14 15h3"/></svg>' },
    combate: { name: "COMBATE & INVENTÁRIO", icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/></svg>' },
    habilidades: { name: "HABILIDADES & TÍTULOS", icon: '<svg viewBox="0 0 24 24"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/></svg>' },
    notas: { name: "NOTAS & RP", icon: '<svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 15h7M9 18h4"/></svg>' },
    arquivo: { name: "SALVAR / CARREGAR", icon: '<svg viewBox="0 0 24 24"><path d="M4 4h13l3 3v13H4z"/><path d="M8 4v5h8V4M8 20v-6h8v6"/></svg>' },
  };
  const ORDER = Object.keys(WINS);
  // larguras padrão (12 colunas) e ordem inicial de cada janela
  const DEF = {
    principal: [["identificacao", 4], ["atributos", 4], ["vitalidade", 4], ["origem", 4], ["pericias", 4], ["defesas", 4], ["testes-de-resistencia", 4], ["recursos", 4], ["ferimento-critico", 4], ["salvaguardas-exaustao", 4]],
    combate: [["armamento", 12], ["maleta", 8], ["dinheiro", 4], ["equipamentos", 4]],
    habilidades: [["habilidades-de-raca-classe", 6], ["titulos-de-personagem", 6], ["talentos", 6], ["habilidades-unicas", 6]],
    notas: [["aparencia-personalidade", 6], ["historia-do-personagem", 6], ["aliados-sinergia", 6]],
    arquivo: [["salvar-ficha-em-arquivo", 6], ["carregar-ficha-de-arquivo", 6], ["plano-de-fundo", 6], ["sistema", 6]],
  };
  const COLORS = ["#b3263f", "#e0a33c", "#7ed957", "#7fd8ff", "#a46ce0", "#ff7a2a", "#dddddd", "#6c6cf0"];
  const slug = t => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  let main = "principal", rail = ORDER.slice(1), locked = false;
  const boards = {}, pages = {};
  let ro = null;

  // ---------------- montagem ----------------
  function init() {
    const sheet = $("sheet"), tabs = $("tabs");
    const stage = document.createElement("div"); stage.className = "stage"; stage.id = "stage";
    stage.innerHTML = '<div class="stage-main" id="stageMain"></div><nav class="rail" id="rail" aria-label="Janelas"></nav>';
    (tabs || sheet.querySelector(".page")).before(stage);
    if (tabs) tabs.remove();
    ro = new ResizeObserver(es => es.forEach(e => fit(e.target)));
    ORDER.forEach(id => {
      const page = $(id); pages[id] = page;
      $("stageMain").appendChild(page);
      const boxes = [...page.querySelectorAll(".box")];
      const bar = document.createElement("div"); bar.className = "win-bar";
      bar.innerHTML = `<span class="win-t">${WINS[id].name}</span><div class="win-acts">
        <button class="btn sm" data-wact="add" data-nosfx title="Criar uma caixa nova nesta janela">+ CAIXA</button>
        <button class="btn sm" data-wact="lock" data-nosfx title="Trava arrastar e redimensionar">TRAVAR</button>
        <button class="btn sm" data-wact="reset" data-nosfx title="Volta esta janela ao layout padrão">PADRÃO</button></div>`;
      const board = document.createElement("div"); board.className = "board"; board.dataset.win = id;
      page.innerHTML = ""; page.append(bar, board);
      boards[id] = board;
      boxes.forEach(b => { prepBox(b, id); board.appendChild(b); });
    });
    applyDefaults(true);
    renderRail(); show(main, true);
    window.addEventListener("resize", () => relayoutAll());
    document.addEventListener("click", onClick);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("dblclick", onDbl);
  }
  function prepBox(b, win) {
    const h = b.querySelector(".box-h");
    if (!b.dataset.box) {
      const t = h.querySelector("span");
      b.dataset.box = b.dataset.box || slug(t.textContent);
      b.dataset.default = t.textContent;
      t.classList.add("bx-title");
    }
    b.dataset.win = win;
    if (!h.querySelector(".bx-ctl")) {
      const c = document.createElement("span"); c.className = "bx-ctl";
      c.innerHTML = (b.dataset.custom ? '<button class="bx-b" data-bx="cfg" title="Configurar" data-nosfx>⚙</button><button class="bx-b" data-bx="del" title="Excluir caixa" data-nosfx>×</button>' : "") +
        '<button class="bx-b" data-bx="min" title="Minimizar" data-nosfx>▁</button><span class="bx-grip" title="Arraste para mover">⠿</span>';
      h.appendChild(c);
      const rs = document.createElement("span"); rs.className = "bx-rs"; rs.title = "Arraste para redimensionar // duplo clique: altura automática";
      b.appendChild(rs);
    }
    ro.observe(b);
  }

  // ---------------- layout (masonry em grid) ----------------
  function effW(b) {
    const bw = boards[b.dataset.win].clientWidth || 1000, w = +b.dataset.w || 4;
    if (bw >= 900) return w;
    if (bw >= 560) return w >= 7 ? 12 : 6;
    return 12;
  }
  function fit(b) {
    if (!b.isConnected || b.offsetParent === null) return;
    b.style.gridColumn = `span ${effW(b)}`;
    const h = b.getBoundingClientRect().height;
    b.style.gridRowEnd = `span ${Math.max(1, Math.ceil((h + GAP) / UNIT))}`;
  }
  function relayout(win) { const bd = boards[win]; if (bd) [...bd.children].forEach(fit); }
  function relayoutAll() { ORDER.forEach(relayout); }
  function setBox(b, o) {
    if (o.w) b.dataset.w = o.w;
    b.classList.toggle("min", !!o.min);
    if (o.h) { b.style.height = o.h + "px"; b.classList.add("fixed"); b.dataset.h = o.h; }
    else { b.style.height = ""; b.classList.remove("fixed"); delete b.dataset.h; }
    const t = b.querySelector(".bx-title");
    if (o.title) { t.textContent = o.title; b.dataset.title = o.title; } else { t.textContent = b.dataset.default; delete b.dataset.title; }
    fit(b);
  }
  function applyDefaults(all, only) {
    ORDER.forEach(win => {
      if (only && win !== only) return;
      const bd = boards[win], def = DEF[win];
      def.forEach(([id, w]) => { const b = bd.querySelector(`[data-box="${id}"]`); if (b) { bd.appendChild(b); setBox(b, { w }); } });
      [...bd.children].forEach(b => { if (!def.some(d => d[0] === b.dataset.box)) { bd.appendChild(b); if (!b.dataset.w) setBox(b, { w: 4 }); } });
    });
  }

  // ---------------- janelas + trilho ----------------
  function renderRail() {
    $("rail").innerHTML = rail.map((id, i) => `<button class="rail-t" data-win="${id}" data-nosfx title="${WINS[id].name} (${ORDER.indexOf(id) + 1})">${WINS[id].icon}<span>${WINS[id].name}</span><em>${ORDER.indexOf(id) + 1}</em></button>`).join("");
  }
  function show(id, silent) {
    if (!WINS[id]) return;
    if (id !== main) {
      const i = rail.indexOf(id);
      if (i >= 0) rail[i] = main; // a janela anterior fica no lugar do ícone clicado
      main = id; renderRail();
    }
    ORDER.forEach(w => pages[w].classList.toggle("on", w === main));
    const p = pages[main];
    if (!silent) { p.classList.remove("glitch"); void p.offsetWidth; p.classList.add("glitch"); }
    requestAnimationFrame(() => relayout(main));
    if (!silent) { const top = $("stage").getBoundingClientRect().top + window.scrollY - $("hud").offsetHeight - 10; if (window.scrollY > top) window.scrollTo({ top }); }
  }

  // ---------------- caixas novas ----------------
  const TYPES = { texto: "TEXTO", imagem: "IMAGEM", barra: "BARRA", contador: "CONTADOR" };
  function customHTML(type) {
    if (type === "texto") return `<textarea class="ta cb-text" rows="5" placeholder="Escreva aqui..."></textarea>`;
    if (type === "imagem") return `<label class="cb-img"><span>▸ ENVIAR IMAGEM</span><img alt="" class="hidden"><input type="file" accept="image/*"></label>`;
    if (type === "barra") return `<div class="cb-bar"><i></i><span></span></div><div class="cb-row"><button class="step" data-cb="-1" data-nosfx>−</button><input class="in cb-cur" type="number"><span class="sl">/</span><input class="in cb-max" type="number"><button class="step" data-cb="1" data-nosfx>+</button></div>`;
    return `<div class="cb-count"><button class="step big" data-cb="-1" data-nosfx>−</button><input class="in cb-val" type="number"><button class="step big" data-cb="1" data-nosfx>+</button></div>`;
  }
  function makeCustom(c) {
    const b = document.createElement("div");
    b.className = "box custom"; b.dataset.box = c.id; b.dataset.custom = c.type; b.dataset.default = TYPES[c.type];
    b.innerHTML = `<div class="box-h"><span class="bx-title">${esc(TYPES[c.type])}</span></div>
      <div class="cb-cfg hidden"><span class="lbl">Cor</span><div class="cb-colors">${COLORS.map(col => `<button class="cb-c" data-col="${col}" style="background:${col}" data-nosfx></button>`).join("")}</div><p class="note" style="margin:6px 0 0">Duplo clique no título renomeia a caixa.</p></div>
      <div class="cb-body">${customHTML(c.type)}</div>`;
    prepBox(b, c.win);
    fillCustom(b, c.data || {});
    return b;
  }
  function fillCustom(b, d) {
    const t = b.dataset.custom;
    b.style.setProperty("--cb", d.color || COLORS[0]);
    b.dataset.color = d.color || COLORS[0];
    if (t === "texto") b.querySelector(".cb-text").value = d.text || "";
    if (t === "imagem") { const img = b.querySelector(".cb-img img"); img.src = d.src || ""; img.classList.toggle("hidden", !d.src); b.querySelector(".cb-img span").classList.toggle("hidden", !!d.src); }
    if (t === "barra") { b.querySelector(".cb-cur").value = d.cur ?? 10; b.querySelector(".cb-max").value = d.max ?? 10; drawBar(b); }
    if (t === "contador") b.querySelector(".cb-val").value = d.val ?? 0;
  }
  function drawBar(b) {
    const cur = +b.querySelector(".cb-cur").value || 0, max = +b.querySelector(".cb-max").value || 0;
    b.querySelector(".cb-bar i").style.width = (max > 0 ? Math.max(0, Math.min(100, cur / max * 100)) : 0) + "%";
    b.querySelector(".cb-bar span").textContent = `${cur} / ${max}`;
  }
  function customData(b) {
    const t = b.dataset.custom, d = { color: b.dataset.color };
    if (t === "texto") d.text = b.querySelector(".cb-text").value;
    if (t === "imagem") { const img = b.querySelector(".cb-img img"); d.src = img.classList.contains("hidden") ? "" : img.getAttribute("src"); }
    if (t === "barra") { d.cur = +b.querySelector(".cb-cur").value || 0; d.max = +b.querySelector(".cb-max").value || 0; }
    if (t === "contador") d.val = +b.querySelector(".cb-val").value || 0;
    return d;
  }
  function addMenu(btn) {
    closeMenu();
    const m = document.createElement("div"); m.className = "add-menu"; m.id = "addMenu";
    m.innerHTML = Object.entries(TYPES).map(([k, v]) => `<button data-new="${k}" data-nosfx><b>${v}</b><small>${{ texto: "anotações livres", imagem: "foto, mapa, referência", barra: "PV de aliado, PVon, munição...", contador: "qualquer número com + e −" }[k]}</small></button>`).join("");
    document.body.appendChild(m);
    const r = btn.getBoundingClientRect();
    m.style.top = (r.bottom + window.scrollY + 4) + "px"; m.style.left = Math.max(8, Math.min(window.innerWidth - m.offsetWidth - 8, r.right - m.offsetWidth)) + "px";
    sfx("abrir");
  }
  function closeMenu() { const m = $("addMenu"); if (m) m.remove(); }
  function createCustom(type) {
    const c = { id: "cx-" + Date.now().toString(36), type, win: main, data: type === "barra" ? { cur: 10, max: 10 } : {} };
    const b = makeCustom(c); boards[main].prepend(b); setBox(b, { w: 4 });
    b.classList.add("flash"); setTimeout(() => b.classList.remove("flash"), 900);
    b.scrollIntoView({ block: "nearest", behavior: "smooth" });
    sfx("abrir"); saved();
    setTimeout(() => startRename(b), 150);
  }

  // ---------------- eventos ----------------
  function saved() { if (typeof changed === "function") changed(true); }
  async function onClick(e) {
    const t = e.target;
    const rt = t.closest(".rail-t"); if (rt) { sfx("clique"); showTab(rt.dataset.win); return; }
    const nw = t.closest("[data-new]"); if (nw) { closeMenu(); createCustom(nw.dataset.new); return; }
    if (!t.closest("#addMenu") && !t.closest('[data-wact="add"]')) closeMenu();
    const wa = t.closest("[data-wact]");
    if (wa) {
      const a = wa.dataset.wact;
      if (a === "add") { if ($("addMenu")) { closeMenu(); sfx("fechar"); } else addMenu(wa); }
      if (a === "lock") { locked = !locked; syncLock(); sfx("clique"); saved(); }
      if (a === "reset") {
        sfx("clique");
        if (await ask(`Voltar a janela ${WINS[main].name} ao layout padrão? Posições, tamanhos e nomes voltam ao original. Caixas criadas por você continuam.`, { top: "LAYOUT PADRÃO", yes: "RESTAURAR" })) {
          [...boards[main].children].forEach(b => { if (!b.dataset.custom) setBox(b, { w: b.dataset.w }); });
          applyDefaults(false, main); relayout(main); saved(); toast("LAYOUT PADRÃO RESTAURADO");
        }
      }
      return;
    }
    const bx = t.closest("[data-bx]");
    if (bx) {
      const b = bx.closest(".box"), a = bx.dataset.bx;
      if (a === "min") { b.classList.toggle("min"); sfx(b.classList.contains("min") ? "fechar" : "abrir"); fit(b); saved(); }
      if (a === "cfg") { b.querySelector(".cb-cfg").classList.toggle("hidden"); sfx("clique"); }
      if (a === "del") { sfx("clique"); if (await ask(`Excluir a caixa "${b.querySelector(".bx-title").textContent}"?`, { top: "EXCLUIR CAIXA", yes: "EXCLUIR" })) { ro.unobserve(b); b.remove(); relayout(main); saved(); } }
      return;
    }
    const col = t.closest("[data-col]");
    if (col) { const b = col.closest(".box"); b.dataset.color = col.dataset.col; b.style.setProperty("--cb", col.dataset.col); sfx("clique"); saved(); return; }
    const cb = t.closest("[data-cb]");
    if (cb) {
      const b = cb.closest(".box"), d = (+cb.dataset.cb) * (e.shiftKey ? 5 : 1);
      if (b.dataset.custom === "barra") { const c = b.querySelector(".cb-cur"), mx = +b.querySelector(".cb-max").value || 0; const v = Math.max(0, Math.min(mx || Infinity, (+c.value || 0) + d)); if (v === +c.value) { sfx("errado"); return; } c.value = v; drawBar(b); }
      else { const c = b.querySelector(".cb-val"); c.value = (+c.value || 0) + d; }
      sfx(d < 0 ? "fechar" : "clique"); saved();
    }
  }
  document.addEventListener("input", e => {
    const b = e.target.closest && e.target.closest(".box.custom"); if (!b) return;
    if (b.dataset.custom === "barra") drawBar(b);
    saved();
  });
  document.addEventListener("change", async e => {
    const inp = e.target; if (!inp.closest || !inp.closest(".cb-img")) return;
    const f = inp.files[0]; if (!f) return;
    try { const src = await readImage(f, 900); const b = inp.closest(".box"); fillCustom(b, Object.assign(customData(b), { src })); fit(b); saved(); }
    catch (err) { sfx("errado"); toast("NÃO FOI POSSÍVEL LER A IMAGEM", true); }
    inp.value = "";
  });
  function onDbl(e) {
    const rs = e.target.closest(".bx-rs");
    if (rs) { const b = rs.closest(".box"); setBox(b, { w: b.dataset.w, min: b.classList.contains("min"), title: b.dataset.title }); sfx("clique"); saved(); return; }
    const t = e.target.closest(".bx-title"); if (t) startRename(t.closest(".box"));
  }
  function startRename(b) {
    const t = b.querySelector(".bx-title"); if (t.isContentEditable) return;
    const old = t.textContent;
    t.contentEditable = "true"; t.spellcheck = false; t.focus();
    const r = document.createRange(); r.selectNodeContents(t); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    const done = ok => {
      t.contentEditable = "false"; t.removeEventListener("keydown", key); t.removeEventListener("blur", blur);
      let v = t.textContent.replace(/\s+/g, " ").trim().slice(0, 40);
      if (!ok || !v) v = old;
      if (v.toUpperCase() === (b.dataset.default || "").toUpperCase()) { delete b.dataset.title; t.textContent = b.dataset.default; }
      else { b.dataset.title = v; t.textContent = v; }
      if (ok && v !== old) { sfx("clique"); saved(); }
    };
    const key = e => { if (e.key === "Enter") { e.preventDefault(); done(true); } if (e.key === "Escape") { e.preventDefault(); done(false); } e.stopPropagation(); };
    const blur = () => done(true);
    t.addEventListener("keydown", key); t.addEventListener("blur", blur);
  }

  // ---------------- arrastar e redimensionar ----------------
  let D = null;
  function onDown(e) {
    if (e.button > 0 || locked) return;
    const rs = e.target.closest(".bx-rs");
    if (rs) return startResize(e, rs.closest(".box"));
    const h = e.target.closest(".board .box-h");
    if (!h || e.target.closest("button,input,select,textarea,a,label,[contenteditable=true],.nat")) return;
    const b = h.closest(".box");
    D = { b, sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY, on: false, touch: e.pointerType === "touch", t0: Date.now() };
    if (D.touch) D.timer = setTimeout(() => { if (D && !D.on) begin(); }, 380);
  }
  function begin() {
    const b = D.b, r = b.getBoundingClientRect();
    D.on = true; D.ox = D.x - r.left; D.oy = D.y - r.top; D.board = b.parentElement;
    const ph = document.createElement("div"); ph.className = "bx-ph";
    ph.style.gridColumn = b.style.gridColumn; ph.style.height = r.height + "px"; ph.style.gridRowEnd = b.style.gridRowEnd;
    b.before(ph); D.ph = ph;
    Object.assign(b.style, { position: "fixed", left: r.left + "px", top: r.top + "px", width: r.width + "px", zIndex: 120, pointerEvents: "none" });
    b.classList.add("dragging"); document.body.classList.add("dragging");
    sfx("abrir");
  }
  document.addEventListener("pointermove", e => {
    if (R) return moveResize(e);
    if (!D) return;
    D.x = e.clientX; D.y = e.clientY;
    if (!D.on) {
      const dist = Math.hypot(D.x - D.sx, D.y - D.sy);
      if (D.touch) { if (dist > 8) { clearTimeout(D.timer); D = null; } return; }
      if (dist < 6) return;
      begin();
    }
    e.preventDefault();
    D.b.style.left = (D.x - D.ox) + "px"; D.b.style.top = (D.y - D.oy) + "px";
    place();
    autoScroll();
  }, { passive: false });
  document.addEventListener("touchmove", e => { if (D && D.on) e.preventDefault(); }, { passive: false });
  function place() {
    const kids = [...D.board.children].filter(k => k !== D.b && k !== D.ph);
    let target = null, after = false;
    for (const k of kids) {
      const r = k.getBoundingClientRect();
      if (D.x >= r.left && D.x <= r.right && D.y >= r.top && D.y <= r.bottom) { target = k; after = (D.y - r.top) > r.height / 2; break; }
    }
    if (!target) {
      const br = D.board.getBoundingClientRect();
      if (D.y > br.bottom - 10) { if (D.board.lastElementChild !== D.ph) D.board.appendChild(D.ph); }
      return;
    }
    const ref = after ? target.nextSibling : target;
    if (ref !== D.ph && ref !== D.ph.nextSibling) D.board.insertBefore(D.ph, ref);
    else if (!after && target.previousSibling !== D.ph) D.board.insertBefore(D.ph, target);
  }
  let scrollRaf = 0;
  function autoScroll() {
    if (scrollRaf) return;
    const step = () => {
      scrollRaf = 0; if (!D || !D.on) return;
      const m = 70, y = D.y, h = window.innerHeight;
      const v = y < m ? -(m - y) / 3 : y > h - m ? (y - (h - m)) / 3 : 0;
      if (v) { window.scrollBy(0, v); place(); scrollRaf = requestAnimationFrame(step); }
    };
    scrollRaf = requestAnimationFrame(step);
  }
  function endDrag(cancel) {
    if (!D) return; clearTimeout(D.timer);
    const d = D; D = null;
    if (!d.on) return;
    const b = d.b;
    if (!cancel) d.ph.replaceWith(b); else d.ph.remove();
    Object.assign(b.style, { position: "", left: "", top: "", width: "", zIndex: "", pointerEvents: "" });
    if (b.dataset.h) b.style.height = b.dataset.h + "px";
    b.classList.remove("dragging"); document.body.classList.remove("dragging");
    fit(b); relayout(b.dataset.win); sfx("fechar"); saved();
  }
  let R = null;
  function startResize(e, b) {
    e.preventDefault();
    const r = b.getBoundingClientRect(), bw = boards[b.dataset.win].clientWidth;
    R = { b, sx: e.clientX, sy: e.clientY, w0: r.width, h0: r.height, col: (bw - 11 * GAP) / 12, wide: bw >= 900, w: +b.dataset.w || 4 };
    b.classList.add("resizing"); document.body.classList.add("dragging");
  }
  function moveResize(e) {
    e.preventDefault();
    const dx = e.clientX - R.sx, dy = e.clientY - R.sy, b = R.b;
    if (R.wide) {
      const w = Math.max(2, Math.min(12, Math.round((R.w0 + dx + GAP) / (R.col + GAP))));
      if (w !== +b.dataset.w) { b.dataset.w = w; }
    }
    if (Math.abs(dy) > 4 || b.dataset.h) {
      const hh = Math.max(70, Math.round(R.h0 + dy));
      b.style.height = hh + "px"; b.dataset.h = hh; b.classList.add("fixed");
    }
    fit(b);
  }
  document.addEventListener("pointerup", () => {
    if (R) { R.b.classList.remove("resizing"); document.body.classList.remove("dragging"); relayout(R.b.dataset.win); R = null; sfx("clique"); saved(); return; }
    endDrag(false);
  });
  document.addEventListener("pointercancel", () => { if (R) { R.b.classList.remove("resizing"); R = null; document.body.classList.remove("dragging"); } endDrag(true); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && D && D.on) endDrag(true); });
  function syncLock() {
    document.body.classList.toggle("layout-locked", locked);
    document.querySelectorAll('[data-wact="lock"]').forEach(b => { b.classList.toggle("on", locked); b.textContent = locked ? "DESTRAVAR" : "TRAVAR"; });
  }

  // ---------------- salvar / carregar ----------------
  function save() {
    const wins = {};
    ORDER.forEach(win => {
      wins[win] = { order: [], items: {} };
      [...boards[win].children].forEach(b => {
        if (!b.classList.contains("box")) return;
        wins[win].order.push(b.dataset.box);
        const o = { w: +b.dataset.w || 4 };
        if (b.dataset.h) o.h = +b.dataset.h;
        if (b.classList.contains("min")) o.min = 1;
        if (b.dataset.title) o.title = b.dataset.title;
        wins[win].items[b.dataset.box] = o;
      });
    });
    const custom = [...document.querySelectorAll(".box.custom")].map(b => ({ id: b.dataset.box, type: b.dataset.custom, win: b.dataset.win, data: customData(b) }));
    return { v: 1, main, rail: rail.slice(), locked, wins, custom };
  }
  function load(L) {
    document.querySelectorAll(".box.custom").forEach(b => { ro.unobserve(b); b.remove(); });
    ORDER.forEach(win => [...boards[win].children].forEach(b => setBox(b, { w: b.dataset.w })));
    applyDefaults(true);
    if (L && L.wins) {
      (L.custom || []).forEach(c => { if (TYPES[c.type] && boards[c.win]) boards[c.win].appendChild(makeCustom(c)); });
      ORDER.forEach(win => {
        const W = L.wins[win]; if (!W) return;
        const bd = boards[win];
        (W.order || []).forEach(id => { const b = [...document.querySelectorAll(".board .box")].find(x => x.dataset.box === id); if (b && b.dataset.win === win) bd.appendChild(b); });
        [...bd.children].forEach(b => { const o = (W.items || {})[b.dataset.box]; if (o) setBox(b, o); else if (!b.dataset.w) setBox(b, { w: 4 }); });
      });
      if (L.main && WINS[L.main]) { main = L.main; rail = Array.isArray(L.rail) && L.rail.length === ORDER.length - 1 && L.rail.every(w => WINS[w] && w !== main) ? L.rail.slice() : ORDER.filter(w => w !== main); }
      locked = !!L.locked;
    } else { main = "principal"; rail = ORDER.slice(1); locked = false; }
    syncLock(); renderRail(); show(main, true);
  }
  function refresh() { requestAnimationFrame(() => { relayoutAll(); show(main, true); }); }

  init();
  return { show, save, load, refresh, relayout: relayoutAll, get main() { return main; } };
})();
window.MOD = MOD;
