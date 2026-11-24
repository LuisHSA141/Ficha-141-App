"use strict";
// =====================================================================
// 141 // CÓDIGO DE ITEM
// Transforma uma arma, equipamento, item, item de bolso, título, talento ou
// Habilidade Única num código de texto que outro jogador cola na ficha dele.
// Formato: 141.<tipo>.<z|j><dados em base64url>   (z = comprimido, j = puro)
// =====================================================================
const CODIGO = (() => {
  const E = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const TIPO = { weapons: "A", equipment: "E", itens: "I", bolso: "B", titles: "T", talents: "L", traits: "H" };
  const LISTA = Object.fromEntries(Object.entries(TIPO).map(([k, v]) => [v, k]));
  // posição na maleta e onde está guardado não viajam com o item
  const FORA = new Set(["local", "invX", "invY", "invRot", "invIn"]);
  const ONDE = { weapons: "ARMAMENTO", equipment: "EQUIPAMENTOS", itens: "MALETA", bolso: "ITENS DE BOLSO", titles: "TÍTULOS", talents: "TALENTOS", traits: "HABILIDADES ÚNICAS" };

  // ---------- base64url <-> bytes ----------
  const b64 = u8 => { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
  const unb64 = t => { t = t.replace(/-/g, "+").replace(/_/g, "/"); while (t.length % 4) t += "="; const s = atob(t), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
  async function passa(u8, stream) { const r = new Blob([u8]).stream().pipeThrough(stream); return new Uint8Array(await new Response(r).arrayBuffer()); }

  async function gerar(list, it) {
    const o = {};
    FIELDS[list].forEach(k => { if (!FORA.has(k) && it[k] != null && it[k] !== "") o[k] = it[k]; });
    const bytes = new TextEncoder().encode(JSON.stringify(o));
    let corpo = "j" + b64(bytes);
    if (window.CompressionStream) { try { const z = await passa(bytes, new CompressionStream("deflate-raw")); const c = "z" + b64(z); if (c.length < corpo.length) corpo = c; } catch (e) {} }
    return `141.${TIPO[list]}.${corpo}`;
  }
  async function ler(txt) {
    const m = /141\.([AEIBTLH])\.([zj])([A-Za-z0-9_-]+)/.exec(String(txt || ""));
    if (!m) throw new Error("formato");
    const list = LISTA[m[1]];
    let bytes = unb64(m[3]);
    if (m[2] === "z") { if (!window.DecompressionStream) throw new Error("navegador"); bytes = await passa(bytes, new DecompressionStream("deflate-raw")); }
    const raw = JSON.parse(new TextDecoder().decode(bytes));
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("formato");
    // só os campos que a ficha conhece, sempre como texto
    const it = blank(list);
    FIELDS[list].forEach(k => { if (!FORA.has(k) && k in raw && raw[k] != null && typeof raw[k] !== "object") it[k] = String(raw[k]); });
    return { list, it };
  }

  // ---------- janelas ----------
  function modal(id, html) {
    let m = document.getElementById(id);
    if (!m) {
      m = document.createElement("div"); m.className = "modal inter-m"; m.id = id;
      document.body.appendChild(m);
      m.addEventListener("click", e => { if (e.target === m || e.target.closest("[data-cx]")) fecha(m); });
      document.addEventListener("keydown", e => { if (e.key === "Escape" && m.classList.contains("show")) { e.stopImmediatePropagation(); fecha(m); } }, true);
    }
    m.innerHTML = `<div class="modal-box inter-box cod-box"><span class="corner c1"></span><span class="corner c2"></span><span class="corner c3"></span><span class="corner c4"></span>${html}</div>`;
    m.classList.add("show"); sfx("abrir");
    return m;
  }
  function fecha(m) { if (m.classList.contains("show")) { m.classList.remove("show"); sfx("fechar"); } }
  async function copia(t) {
    try { await navigator.clipboard.writeText(t); return true; }
    catch (e) { const ta = document.createElement("textarea"); ta.value = t; ta.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand("copy"); } catch (er) {} ta.remove(); return ok; }
  }

  async function mostrar(list, it) {
    const cod = await gerar(list, it), nome = it.name || NOUN[list];
    const grande = cod.length > 15000;
    const m = modal("codOut", `<div class="inter-top"><span>⧉ CÓDIGO // ${E(NOUN[list])}</span><button class="fx-close" data-cx aria-label="Fechar" data-nosfx>×</button></div>
      <div class="cod-nome">${E(nome.toUpperCase())}</div>
      <p class="cod-txt">Mande este código para outro jogador. Ele cola em <b>⇩ COLAR CÓDIGO</b> na ficha dele e o ${E(NOUN[list].toLowerCase())} aparece igualzinho${list === "weapons" ? ", com acessórios e números" : ""}.</p>
      <textarea class="in cod-ta" readonly spellcheck="false">${E(cod)}</textarea>
      ${grande ? '<p class="cod-aviso">CÓDIGO GRANDE: a imagem do item vai junto. Se o aplicativo de mensagem cortar o texto, tire a imagem antes de gerar.</p>' : ""}
      <div class="modal-acts">${navigator.share && matchMedia("(pointer:coarse)").matches ? '<button class="btn" data-cod-share data-nosfx>COMPARTILHAR</button>' : ""}<button class="btn" data-cx data-nosfx>FECHAR</button><button class="btn acc" data-cod-copy data-nosfx>COPIAR CÓDIGO</button></div>`);
    const ta = m.querySelector(".cod-ta");
    ta.addEventListener("focus", () => ta.select());
    m.querySelector("[data-cod-copy]").onclick = async () => { if (await copia(cod)) { sfx("clique"); toast("CÓDIGO COPIADO // É SÓ COLAR NA CONVERSA"); fecha(m); } else { ta.focus(); ta.select(); toast("SELECIONE E COPIE O CÓDIGO", true); } };
    const sh = m.querySelector("[data-cod-share]");
    if (sh) sh.onclick = () => navigator.share({ title: `141 // ${nome}`, text: cod }).catch(() => {});
  }

  function colar() {
    let achado = null;
    const m = modal("codIn", `<div class="inter-top"><span>⇩ COLAR CÓDIGO</span><button class="fx-close" data-cx aria-label="Fechar" data-nosfx>×</button></div>
      <p class="cod-txt">Cole o código que outro jogador (ou o mestre) mandou. Vale para armas, equipamentos, itens da maleta, itens de bolso, títulos, talentos e Habilidades Únicas: a ficha coloca cada um no lugar certo.</p>
      <textarea class="in cod-ta" id="codCola" placeholder="141.A.z..." spellcheck="false" autocomplete="off"></textarea>
      <div class="cod-prev" id="codPrev"></div>
      <div class="modal-acts"><button class="btn" data-cx data-nosfx>CANCELAR</button><button class="btn acc" id="codAdd" disabled data-nosfx>ADICIONAR À FICHA</button></div>`);
    const ta = m.querySelector("#codCola"), pv = m.querySelector("#codPrev"), bt = m.querySelector("#codAdd");
    let seq = 0;
    async function analisa() {
      const n = ++seq, t = ta.value.trim(); achado = null; bt.disabled = true;
      if (!t) { pv.innerHTML = ""; return; }
      try {
        const r = await ler(t); if (n !== seq) return;
        achado = r; bt.disabled = false;
        const it = r.it, info = [
          r.list === "weapons" && it.damage && "DANO " + it.damage,
          it.tipo && it.tipo.toUpperCase(),
          it.pe && "P.E. " + String(it.pe).replace(".", ","),
          it.marca && it.marca.toUpperCase(),
          it.qty && it.qty !== "1" && "QTD. " + it.qty,
        ].filter(Boolean);
        pv.innerHTML = `<div class="cod-ok"><em>${E(NOUN[r.list])} // VAI PARA ${ONDE[r.list]}</em><b>${E((it.name || "SEM NOME").toUpperCase())}</b>${info.length ? `<small>${E(info.join(" // "))}</small>` : ""}</div>`;
      } catch (e) {
        if (n !== seq) return;
        pv.innerHTML = `<div class="cod-err">${e.message === "navegador" ? "ESTE NAVEGADOR NÃO CONSEGUE ABRIR CÓDIGOS COMPRIMIDOS // ATUALIZE O NAVEGADOR" : "CÓDIGO INVÁLIDO OU INCOMPLETO // CONFIRA SE COPIOU TUDO"}</div>`;
      }
    }
    ta.addEventListener("input", analisa);
    bt.onclick = () => {
      if (!achado) return;
      const { list, it } = achado;
      LISTS[list].push(it);
      let aviso = "";
      if (list === "itens" && typeof autoPlace === "function" && !autoPlace(it)) aviso = " // SEM ESPAÇO NA MALETA, FICOU FORA";
      renderList(list); if (typeof renderInv === "function") renderInv(); update(); changed();
      fecha(m); sfx("clique");
      toast(`${(it.name || NOUN[list]).toUpperCase()} ADICIONADO EM ${ONDE[list]}${aviso}`, !!aviso);
    };
    setTimeout(() => ta.focus(), 50);
  }

  // botões: ⧉ nas cartas e no detalhe da maleta, ⇩ COLAR CÓDIGO nos cabeçalhos
  document.addEventListener("click", e => {
    const g = e.target.closest("[data-code]");
    if (g) { const card = g.closest(".card"); if (!card) return; const l = card.dataset.list, it = LISTS[l] && LISTS[l][+card.dataset.i]; if (it) mostrar(l, it); return; }
    if (e.target.closest("[data-code-in]")) colar();
  });
  return { gerar, ler, mostrar, colar };
})();
window.CODIGO = CODIGO;
