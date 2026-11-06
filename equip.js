"use strict";
// =====================================================================
// 141 // CATÁLOGO DE EQUIPAMENTOS (Guia dos Equipamentos)
// Filtra pelo que o operador pode escolher: gerais + exclusivos das classes dele.
// O Especialista (Faz-tudo) pode escolher os exclusivos de qualquer classe.
// =====================================================================
const EQC = (() => {
  const E = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = t => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const GRUPOS = [["", "Todos"], ["Lançável", "Lançáveis"], ["Armadilha", "Armadilhas"], ["Bateria", "Baterias"], ["Vestido", "Vestidos"], ["Consumível", "Consumíveis"], ["Munição", "Munição"]];
  const grupoOf = e => /Munição/.test(e.tipo) ? "Munição" : e.tipo.startsWith("Vestido") ? "Vestido" : e.tipo.split(" ")[0];
  let sel = "", q = "", soMeu = true;

  function classes() { const L = lvlInfo(); return [...new Set([L.c1, L.multi ? L.c2 : null].filter(Boolean))]; }
  const especialista = () => classes().includes("Especialista");
  // pode escolher? gerais sempre; exclusivos se tiver nível numa das classes; Especialista escolhe tudo
  function pode(e) { if (!e.excl || !e.excl.length) return true; if (especialista()) return true; const C = classes(); return e.excl.some(c => C.includes(c)); }

  function el() {
    let m = document.getElementById("eqCat"); if (m) return m;
    m = document.createElement("div"); m.id = "eqCat"; m.className = "acat";
    m.innerHTML = `<div class="acat-in" role="dialog" aria-label="Catálogo de equipamentos"><span class="corner c1"></span><span class="corner c2"></span><span class="corner c3"></span><span class="corner c4"></span>
      <div class="acat-h"><span>⌖ CATÁLOGO DE EQUIPAMENTOS // <b id="eqcN"></b></span><button class="btn ico" data-eqc="x" title="Fechar" data-nosfx>×</button></div>
      <div class="eqc-top"><input class="in" id="eqcQ" type="search" placeholder="Buscar equipamento..." autocomplete="off">
        <label class="eqc-tg"><input type="checkbox" id="eqcMeu" checked> SÓ O QUE EU POSSO ESCOLHER</label></div>
      <p class="note eqc-who" id="eqcWho"></p>
      <div class="acat-tabs" id="eqcTabs"></div>
      <div class="eqc-grid" id="eqcGrid"></div></div>`;
    document.body.appendChild(m);
    m.addEventListener("click", e => {
      if (e.target === m || e.target.closest('[data-eqc="x"]')) return close();
      const t = e.target.closest("[data-eqc-tab]"); if (t) { sel = t.dataset.eqcTab; render(); sfx("clique"); return; }
      const a = e.target.closest("[data-eqc-add]"); if (a) { pick(+a.dataset.eqcAdd); return; }
    });
    m.querySelector("#eqcQ").addEventListener("input", e => { q = e.target.value; render(); });
    m.querySelector("#eqcMeu").addEventListener("change", e => { soMeu = e.target.checked; render(); sfx("clique"); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && m.classList.contains("show")) close(); });
    return m;
  }
  function render() {
    const C = classes(), qq = norm(q).trim();
    document.getElementById("eqcWho").innerHTML = especialista()
      ? "ESPECIALISTA // FAZ-TUDO: você pode escolher os exclusivos de qualquer classe"
      : `GERAIS + EXCLUSIVOS DE <b>${E(C.join(" E ").toUpperCase() || "SUA CLASSE")}</b>`;
    const base = EQUIP_CAT.map((e, i) => ({ e, i })).filter(x => !soMeu || pode(x.e));
    document.getElementById("eqcTabs").innerHTML = GRUPOS.map(([k, n]) => {
      const c = k ? base.filter(x => grupoOf(x.e) === k).length : base.length;
      return c || !k ? `<button class="acat-tab${(qq ? k === "" : k === sel) ? " on" : ""}" data-eqc-tab="${E(k)}" data-nosfx>${E(n)} <em>${c}</em></button>` : "";
    }).join("");
    const vis = base.filter(x => qq ? norm(x.e.name + " " + x.e.tipo + " " + x.e.desc).includes(qq) : (!sel || grupoOf(x.e) === sel));
    document.getElementById("eqcN").textContent = vis.length;
    document.getElementById("eqcGrid").innerHTML = vis.map(({ e, i }) => {
      const ok = pode(e), meta = [e.tipo, `P.E. ${String(e.pe).replace(".", ",")}`, e.acao, e.qtd && `${e.qtd} un.`, e.cargas && `${e.cargas} cargas`].filter(Boolean);
      return `<div class="eqc-it${ok ? "" : " lock"}"><div class="eqc-h"><b>${E(e.name)}</b>${ok ? `<button class="btn sm acc" data-eqc-add="${i}" data-nosfx>+ ADICIONAR</button>` : `<span class="eqc-lk">SÓ ${E(e.excl.join(", ").toUpperCase())}</span>`}</div>
        <div class="eqc-m">${meta.map(t => `<i>${E(t)}</i>`).join("")}${e.excl ? `<i class="x">EXCLUSIVO: ${E(e.excl.join(", "))}</i>` : ""}</div>
        <p>${E(e.desc)}</p>${e.melhorias ? `<details><summary>MELHORIAS (${e.mel})</summary>${e.melhorias.split("\n").map(m => `<p>${E(m)}</p>`).join("")}</details>` : ""}</div>`;
    }).join("") || '<div class="empty">NENHUM EQUIPAMENTO ENCONTRADO</div>';
  }
  function open() { const m = el(); q = ""; m.querySelector("#eqcQ").value = ""; render(); m.classList.add("show"); document.body.classList.add("acat-on"); sfx("abrir"); }
  function close() { const m = document.getElementById("eqCat"); if (!m || !m.classList.contains("show")) return; m.classList.remove("show"); document.body.classList.remove("acat-on"); sfx("fechar"); }
  function pick(i) {
    const e = EQUIP_CAT[i]; if (!e) return;
    const it = blank("equipment");
    Object.assign(it, { name: e.name, tipo: e.tipo, acao: e.acao, pe: String(e.pe), qty: "1", desc: e.desc, melhorias: e.melhorias || "", excl: (e.excl || []).join(", "),
      qtdMax: e.qtd || "", qtdAtual: e.qtd || "", cargasMax: e.cargas || "", cargasAtual: e.cargas || "" });
    it._edit = true; it._new = true;
    LISTS.equipment.push(it); close(); renderList("equipment");
    const c = document.getElementById("list-equipment").lastElementChild; if (c) c.scrollIntoView({ block: "nearest", behavior: "smooth" });
    toast(`${e.name.toUpperCase()} ADICIONADO // REVISE E SALVE`);
  }
  document.addEventListener("click", e => { if (e.target.closest("[data-eq-cat]")) open(); });
  return { open, close, pode };
})();
