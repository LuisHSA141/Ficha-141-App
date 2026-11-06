"use strict";
// =====================================================================
// 141 // MODO DE COMBATE
// Cada arma, equipamento, item, habilidade, talento e título pode ser marcado
// com os tipos de ação que usa: A (Ação), B (Ação Bônus), R (Reação), L (Ação Livre).
// As marcações ficam salvas na ficha. "Ver tudo" lista o que dá pra usar por tipo.
// =====================================================================
const CBT = (() => {
  const TYPES = [
    { k: "A", n: "AÇÃO", c: "#ff5f5f" },
    { k: "B", n: "AÇÃO BÔNUS", c: "#e0a33c" },
    { k: "R", n: "REAÇÃO", c: "#6cb6ff" },
    { k: "L", n: "AÇÃO LIVRE", c: "#7ed957" },
  ];
  const TK = Object.fromEntries(TYPES.map(t => [t.k, t]));
  let hab = {};            // habilidades: chave -> "A,B"
  let on = false;
  const spent = {};        // tipos já gastos neste turno
  const setOf = v => new Set(String(v || "").split(",").filter(k => TK[k]));
  const str = set => TYPES.map(t => t.k).filter(k => set.has(k)).join(",");

  const tagBtns = (cur, ref) => {
    const set = setOf(cur);
    return `<span class="act-tags">${TYPES.map(t => `<button class="act-t${set.has(t.k) ? " on" : ""}" style="--ac:${t.c}" data-act-tag="${t.k}" ${ref} title="${t.n}" data-nosfx>${t.k}</button>`).join("")}</span>`;
  };
  const tagsItem = (list, i, it) => i < 0 || !it ? "" : tagBtns(it.acoes, `data-al="${list}" data-ai="${i}"`);
  const tagsFeat = key => tagBtns(hab[key], `data-af="${esc(key)}"`);

  // ---------------- o que pode ser usado ----------------
  function entries() {
    const out = [];
    const add = (acoes, o) => { const set = setOf(acoes); if (set.size) out.push(Object.assign(o, { types: set })); };
    LISTS.weapons.forEach((w, i) => { if (!w._new && !w.local) add(w.acoes, { src: "ARMA", name: w.name || "ARMA", list: "weapons", i,
      info: ARM.info(w), desc: [w.traco, w.desc].filter(Boolean).join("\n") }); });
    LISTS.equipment.forEach((e, i) => { if (!e._new && !e.local) add(e.acoes, { src: "EQUIPAMENTO", name: e.name || "EQUIPAMENTO", list: "equipment", i,
      info: [e.tipo, e.pe !== "" && e.pe != null && "P.E. " + String(e.pe).replace(".", ","), nz(e.qtdMax) && `UNIDADES ${nz(e.qtdAtual)}/${nz(e.qtdMax)}`, nz(e.cargasMax) && `CARGAS ${nz(e.cargasAtual)}/${nz(e.cargasMax)}`, nz(e.qty) > 1 && "×" + e.qty].filter(Boolean).join(" // "), desc: e.desc }); });
    LISTS.itens.forEach((e, i) => { if (!e._new && e.local !== "stash") add(e.acoes, { src: "ITEM DA MALETA", name: e.name || "ITEM", list: "itens", i,
      info: [nz(e.qty) > 1 && "×" + e.qty, e.invIn !== "1" && "FORA DA MALETA"].filter(Boolean).join(" // "), desc: e.desc }); });
    LISTS.bolso.forEach((b, i) => { if (!b._new) add(b.acoes, { src: "ITEM DE BOLSO", name: b.name || "ITEM DE BOLSO", list: "bolso", i,
      info: [b.marca, b.marca === "Recarga" && `USOS ${nz(b.usosAtuais)}/${nz(b.usosMax)}`].filter(Boolean).join(" // "), desc: b.desc }); });
    LISTS.traits.forEach((t, i) => { if (!t._new) add(t.acoes, { src: "HABILIDADE ÚNICA", name: t.name || "HABILIDADE", list: "traits", i,
      info: nz(t.usosMax) > 0 ? `USOS ${nz(t.usosAtuais)}/${nz(t.usosMax)}` : "", desc: t.desc }); });
    LISTS.talents.forEach((t, i) => { if (!t._new) add(t.acoes, { src: "TALENTO", name: t.name || "TALENTO", list: "talents", i, info: "", desc: t.desc }); });
    LISTS.titles.forEach((t, i) => { if (!t._new) add(t.acoes, { src: "TÍTULO", name: t.name || "TÍTULO", list: "titles", i, info: "", desc: t.desc }); });
    document.querySelectorAll("#features details[data-fkey]:not(.lockd)").forEach(d => {
      const key = d.dataset.fkey, parts = key.split("|");
      add(hab[key], { src: parts[0] === "spec" ? `${parts[2]}`.toUpperCase() + " // NV " + (d.querySelector(".lv") || { textContent: "" }).textContent.replace("NV ", "") : parts[0] === "classe" ? "PASSIVA DE " + parts[1].toUpperCase() : "HUMANIDADE",
        name: d.querySelector(".fn").textContent, info: "", desc: [...d.querySelectorAll(".fd p")].map(p => p.textContent).join("\n"), key });
    });
    return out;
  }

  // ---------------- HUD ----------------
  function hud() {
    const el = $("hudCbt");
    el.classList.toggle("hidden", !on);
    document.body.classList.toggle("combat", on);
    $("cbtBtn").textContent = on ? "⚔ EM COMBATE" : "⚔ COMBATE";
    if (!on) { if (typeof syncHud === "function") syncHud(); return; }
    const E = entries();
    el.innerHTML = `<span class="cbt-l">⚔ MODO DE COMBATE</span>` +
      TYPES.map(t => `<button class="cbt-chip${spent[t.k] ? " spent" : ""}" style="--ac:${t.c}" data-spend="${t.k}" title="Clique para marcar como usada neste turno" data-nosfx>${t.n} <b>${E.filter(e => e.types.has(t.k)).length}</b></button>`).join("") +
      `<span class="sp"></span><button class="btn sm acc" data-cbt="all" data-nosfx>VER TUDO</button><button class="btn sm" data-cbt="turn" data-nosfx title="Libera todas as ações de novo">NOVO TURNO</button><button class="btn sm" data-cbt="off" data-nosfx>SAIR</button>`;
    if (typeof syncHud === "function") syncHud();
  }

  // ---------------- painel "ver tudo" ----------------
  const panel = document.createElement("div");
  panel.className = "modal"; panel.id = "cbtPanel";
  panel.innerHTML = `<div class="modal-box fx-box" style="width:min(1180px,100%)!important"><span class="corner c1"></span><span class="corner c2"></span><span class="corner c3"></span><span class="corner c4"></span>
    <div class="modal-top">MODO DE COMBATE // O QUE VOCÊ PODE USAR <button class="fx-close" data-cbt="close" aria-label="Fechar" data-nosfx>×</button></div>
    <div class="cbt-cols" id="cbtCols"></div>
    <p class="cbt-help">Marque os tipos de ação com os botões <b>A</b> (Ação), <b>B</b> (Ação Bônus), <b>R</b> (Reação) e <b>L</b> (Ação Livre) que aparecem nas armas, equipamentos, itens da maleta, habilidades, talentos e títulos enquanto o modo de combate está ligado. As marcações ficam salvas na ficha.</p>
    <div class="modal-acts" style="margin-top:12px;flex-wrap:wrap"><button class="btn" data-cbt="suggest" data-nosfx title="Lê as descrições do livro e marca o que estiver vazio">SUGERIR PELO LIVRO</button><button class="btn" data-cbt="turn" data-nosfx>NOVO TURNO</button><button class="btn acc" data-cbt="close" data-nosfx>FECHAR</button></div></div>`;
  document.body.appendChild(panel);
  function renderPanel() {
    const E = entries();
    $("cbtCols").innerHTML = TYPES.map(t => {
      const list = E.filter(e => e.types.has(t.k));
      return `<div class="cbt-col${spent[t.k] ? " spent" : ""}" style="--ac:${t.c}"><div class="cbt-ch"><span>${t.n} // ${list.length}</span><button data-spend="${t.k}" data-nosfx>${spent[t.k] ? "LIBERAR" : "MARCAR USADA"}</button></div>
        <div class="cbt-list">${list.length ? list.map(e => {
          const acts = e.list === "weapons" && nz(LISTS.weapons[e.i].penteMax) > 0 ? `<div class="ea"><button class="btn sm" data-cq="dec" data-al="weapons" data-ai="${e.i}" data-k="penteAtual" data-nosfx>DISPARAR −1</button><button class="btn sm" data-cq="fill" data-al="weapons" data-ai="${e.i}" data-k="penteAtual" data-nosfx>RECARREGAR</button></div>`
            : e.list === "equipment" && (nz(LISTS.equipment[e.i].qtdMax) || nz(LISTS.equipment[e.i].cargasMax)) ? `<div class="ea"><button class="btn sm" data-cq="dec" data-al="equipment" data-ai="${e.i}" data-k="${nz(LISTS.equipment[e.i].qtdMax) ? "qtdAtual" : "cargasAtual"}" data-nosfx>USAR −1</button></div>`
            : e.list === "bolso" && LISTS.bolso[e.i].marca === "Recarga" ? `<div class="ea"><button class="btn sm" data-cq="dec" data-al="bolso" data-ai="${e.i}" data-k="usosAtuais" data-nosfx>USAR −1</button></div>`
            : e.list === "traits" && nz(LISTS.traits[e.i].usosMax) > 0 ? `<div class="ea"><button class="btn sm" data-cq="dec" data-al="traits" data-ai="${e.i}" data-k="usosAtuais" data-nosfx>USAR −1</button></div>` : "";
          return `<details class="cbt-e"><summary><span class="es">${esc(e.src)}</span><span class="en">${esc(e.name)}</span>${e.info ? `<span class="ei">${esc(e.info)}</span>` : ""}</summary>${e.desc ? `<div class="ed">${esc(e.desc)}</div>` : ""}</details>${acts}`;
        }).join("") : `<div class="cbt-empty">NADA MARCADO COMO ${t.k}</div>`}</div></div>`;
    }).join("");
  }
  function openPanel() { renderPanel(); panel.classList.add("show"); sfx("abrir"); }
  function closePanel() { panel.classList.remove("show"); sfx("fechar"); }

  // ---------------- sugestão pelo texto do livro ----------------
  const RX = {
    B: /(?:com|usar|use|usa|gast\w*|como|é|vira)\s+(?:uma\s+|a\s+sua\s+|sua\s+|a\s+)?a[çc][ãa]o\s+b[ôo]nus|\(\s*[^)]*\ba[çc][ãa]o\s+b[ôo]nus\s*[,)]/i,
    R: /(?:com|usar|use|usa|gast\w*|como)\s+(?:a\s+sua\s+|sua\s+|a\s+|uma\s+)?rea[çc][ãa]o\b|\(\s*[^)]*\brea[çc][ãa]o\s*[,)]/i,
    A: /(?:com|usar|use|usa|gast\w*|como)\s+(?:uma\s+|a\s+sua\s+|sua\s+|a\s+)?a[çc][ãa]o\b(?!\s+b[ôo]nus)|\(\s*[^)]*,\s*a[çc][ãa]o\s*[,)]/i,
  };
  function suggest() {
    let n = 0;
    document.querySelectorAll("#features details[data-fkey]:not(.lockd)").forEach(d => {
      const key = d.dataset.fkey; if (hab[key]) return;
      const txt = d.querySelector(".fd").textContent, set = new Set();
      ["A", "B", "R"].forEach(k => { if (RX[k].test(txt)) set.add(k); });
      if (set.size) { hab[key] = str(set); n++; }
    });
    ["weapons", "equipment"].forEach(l => LISTS[l].forEach(it => { if (!it._new && !it.acoes) { it.acoes = "A"; n++; } }));
    const AC = { "Ação": "A", "Ação Bônus": "B", "Reação": "R", "Ação Livre": "L" };
    LISTS.bolso.forEach(it => { if (!it._new && !it.acoes && AC[it.acao]) { it.acoes = AC[it.acao]; n++; } });
    LISTS.equipment.forEach(it => { if (!it._new && AC[it.acao] && it.acoes !== AC[it.acao] && !/[^A]/.test(it.acoes || "")) { it.acoes = AC[it.acao]; n++; } });
    return n;
  }

  // ---------------- eventos ----------------
  document.addEventListener("click", e => {
    const tag = e.target.closest("[data-act-tag]");
    if (tag) {
      e.preventDefault(); e.stopPropagation();
      const k = tag.dataset.actTag;
      if (tag.dataset.af != null) { const set = setOf(hab[tag.dataset.af]); set.has(k) ? set.delete(k) : set.add(k); if (set.size) hab[tag.dataset.af] = str(set); else delete hab[tag.dataset.af]; tag.classList.toggle("on", set.has(k)); }
      else { const it = LISTS[tag.dataset.al][+tag.dataset.ai]; if (!it) return; const set = setOf(it.acoes); set.has(k) ? set.delete(k) : set.add(k); it.acoes = str(set); tag.classList.toggle("on", set.has(k)); }
      sfx(tag.classList.contains("on") ? "clique" : "fechar");
      hud(); if (panel.classList.contains("show")) renderPanel(); changed(true);
      return;
    }
    const sp = e.target.closest("[data-spend]");
    if (sp) { e.stopPropagation(); const k = sp.dataset.spend; spent[k] = !spent[k]; sfx(spent[k] ? "errado" : "clique"); hud(); if (panel.classList.contains("show")) renderPanel(); return; }
    const cq = e.target.closest("[data-cq]");
    if (cq) {
      const it = LISTS[cq.dataset.al][+cq.dataset.ai], k = cq.dataset.k, mk = k.replace("Atual", "Max"), cur = nz(it[k]), max = nz(it[mk]);
      const v = cq.dataset.cq === "dec" ? cur - 1 : max;
      if (v < 0 || v === cur) { sfx("errado"); toast(cq.dataset.cq === "dec" ? (k === "penteAtual" ? "PENTE VAZIO // RECARREGUE" : "SEM USOS") : "JÁ ESTÁ CHEIO", true); return; }
      if (cq.dataset.al === "weapons" && k === "penteAtual" && cq.dataset.cq === "dec") { it._rec = (it._rec || 0) + (it._shot ? 1 : 0); it._shot = true; }
      it[k] = String(v); sfx(cq.dataset.cq === "dec" ? "clique" : "abrir"); renderList(cq.dataset.al); renderPanel(); changed(true); return;
    }
    const b = e.target.closest("[data-cbt]");
    if (!b) return;
    const a = b.dataset.cbt;
    if (a === "all") openPanel();
    if (a === "close") closePanel();
    if (a === "turn") { TYPES.forEach(t => spent[t.k] = false); LISTS.weapons.forEach(w => { w._rec = 0; w._shot = false; }); renderList("weapons"); sfx("abrir"); toast("NOVO TURNO // AÇÕES LIBERADAS"); hud(); if (panel.classList.contains("show")) renderPanel(); }
    if (a === "off") toggle(false);
    if (a === "suggest") { const n = suggest(); updateFeatures(); renderAll(); hud(); renderPanel(); changed(true); sfx(n ? "abrir" : "errado"); toast(n ? `${n} SUGESTÕES MARCADAS // AJUSTE À VONTADE` : "NADA NOVO PARA SUGERIR", !n); }
  }, true);
  panel.addEventListener("click", e => { if (e.target === panel) closePanel(); });
  document.addEventListener("keydown", e => {
    if (panel.classList.contains("show") && e.key === "Escape") { e.stopImmediatePropagation(); closePanel(); }
  }, true);
  $("cbtBtn").addEventListener("click", () => toggle());

  async function toggle(v) {
    on = v === undefined ? !on : v;
    try { localStorage.setItem("ficha141_combate", on ? "1" : "0"); } catch (e) {}
    sfx(on ? "abrir" : "fechar");
    hud();
    if (on) {
      toast("MODO DE COMBATE // MARQUE A, B, R, L NAS ARMAS, EQUIPAMENTOS E HABILIDADES");
      if (!entries().length && await ask("Nada está marcado com tipo de ação ainda. Quer que eu sugira pelo texto do livro? Armas e equipamentos viram Ação, e habilidades que falam em Ação, Ação Bônus ou Reação recebem a marca certa. Você pode ajustar tudo depois.", { top: "MODO DE COMBATE", yes: "SUGERIR", no: "MARCAR NA MÃO" })) {
        const n = suggest(); updateFeatures(); renderAll(); hud(); changed(true); toast(`${n} SUGESTÕES MARCADAS // AJUSTE À VONTADE`);
      }
    }
  }

  // ---------------- salvar / carregar ----------------
  function save(d) { d.acoesHab = Object.assign({}, hab); }
  function load(d) { hab = Object.assign({}, (d && d.acoesHab) || {}); TYPES.forEach(t => spent[t.k] = false); setTimeout(hud, 0); }
  function reset() { hab = {}; TYPES.forEach(t => spent[t.k] = false); }

  try { on = localStorage.getItem("ficha141_combate") === "1"; } catch (e) {}
  setTimeout(hud, 0);
  return { tagsItem, tagsFeat, save, load, reset, toggle, hud, entries, get on() { return on; } };
})();
window.CBT = CBT;
