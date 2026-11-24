"use strict";
// =====================================================================
// 141 // TEXTO FORMATADO (negrito, itálico, sublinhado, riscado, marca-texto)
// Os campos de texto longo viram editores: ao selecionar um trecho aparece
// uma barra de formatação. O <textarea> original continua por baixo, então
// salvar, carregar e exportar seguem iguais. Texto sem formatação continua
// salvo como texto puro (compatível com fichas antigas).
// =====================================================================
const RT = (() => {
  const ESC = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ALVOS = 'textarea[data-k="desc"],textarea[data-k="melhorias"],textarea.fd-ta,#char-appearance,#char-allies,#char-backstory,textarea.cb-text';
  const RICO = /<(b|i|u|s|mark|br)\b/i;
  const rico = t => RICO.test(String(t || ""));

  // ---------- limpeza: só as marcas permitidas sobrevivem ----------
  function limpa(html) {
    const tpl = document.createElement("template"); tpl.innerHTML = html;
    const out = [];
    const quebra = () => { if (out.length && out[out.length - 1] !== "<br>") out.push("<br>"); };
    function anda(n, fmt) {
      n.childNodes.forEach(c => {
        if (c.nodeType === 3) { if (c.nodeValue) out.push(abre(fmt) + ESC(c.nodeValue).replace(/\n/g, "<br>") + fecha(fmt)); return; }
        if (c.nodeType !== 1) return;
        const tag = c.tagName, f = Object.assign({}, fmt), st = c.style || {};
        if (tag === "BR") { out.push("<br>"); return; }
        if (tag === "B" || tag === "STRONG") f.b = 1;
        if (tag === "I" || tag === "EM") f.i = 1;
        if (tag === "U") f.u = 1;
        if (tag === "S" || tag === "STRIKE" || tag === "DEL") f.s = 1;
        if (tag === "MARK") f.m = 1;
        const fw = st.fontWeight; if (fw === "bold" || +fw >= 600) f.b = 1; if (fw === "normal" || (fw && +fw < 600)) delete f.b;
        if (st.fontStyle === "italic") f.i = 1; if (st.fontStyle === "normal") delete f.i;
        const td = (st.textDecorationLine || st.textDecoration || ""); if (/underline/.test(td)) f.u = 1; if (/line-through/.test(td)) f.s = 1;
        const bg = st.backgroundColor; if (bg && !/transparent|rgba\(0, 0, 0, 0\)|initial|inherit/.test(bg)) f.m = 1; if (bg && /transparent|rgba\(0, 0, 0, 0\)/.test(bg)) delete f.m;
        const bloco = /^(DIV|P|LI|H\d|BLOCKQUOTE)$/.test(tag);
        if (bloco) quebra();
        anda(c, f);
      });
    }
    anda(tpl.content, {});
    // junta trechos vizinhos com a mesma formatação e tira <br> sobrando no fim
    let s = out.join("").replace(/<\/(b|i|u|s|mark)>(<\1>)/g, "").replace(/(<br>)+$/, "");
    return s;
  }
  const ORD = ["m", "b", "i", "u", "s"], TAG = { m: "mark", b: "b", i: "i", u: "u", s: "s" };
  const abre = f => ORD.filter(k => f[k]).map(k => `<${TAG[k]}>`).join("");
  const fecha = f => ORD.filter(k => f[k]).reverse().map(k => `</${TAG[k]}>`).join("");
  // HTML do editor -> valor salvo (texto puro se não houver formatação)
  function valor(html) {
    const s = limpa(html);
    if (!/<(b|i|u|s|mark)>/.test(s)) { const d = document.createElement("textarea"); d.innerHTML = s.replace(/<br>/g, "\n"); return d.value; }
    return s;
  }
  // valor salvo -> HTML seguro para mostrar
  function html(t) { t = String(t ?? ""); return rico(t) ? limpa(t.replace(/\n/g, "<br>")) : ESC(t).replace(/\n/g, "<br>"); }
  // para listas que mostram um parágrafo por linha (habilidades, melhorias)
  function linhas(t) { t = String(t ?? ""); return rico(t) ? `<p>${limpa(t.replace(/\n/g, "<br>"))}</p>` : t.split("\n").filter(Boolean).map(l => `<p>${ESC(l)}</p>`).join(""); }

  // ---------- editor por cima do textarea ----------
  const PROTO = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value");
  function liga(ta) {
    if (ta._rt || ta.closest(".rt-off")) return;
    const ed = document.createElement("div");
    ed.className = "rt-ed " + ta.className.replace(/\bta\b/, "");
    ed.contentEditable = "true"; ed.spellcheck = true;
    ed.setAttribute("role", "textbox"); ed.setAttribute("aria-multiline", "true");
    if (ta.placeholder) ed.dataset.ph = ta.placeholder;
    const rows = +ta.getAttribute("rows") || 3; ed.style.minHeight = (rows * 1.6 + 1.2) + "em";
    ta._rt = ed; ta.style.display = "none"; ta.after(ed);
    let sync = false;
    Object.defineProperty(ta, "value", {
      configurable: true,
      get() { return PROTO.get.call(ta); },
      set(v) { PROTO.set.call(ta, v); if (!sync) ed.innerHTML = html(v); }
    });
    ed.innerHTML = html(PROTO.get.call(ta));
    ed.addEventListener("input", () => {
      sync = true; PROTO.set.call(ta, valor(ed.innerHTML)); sync = false;
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    });
    ed.addEventListener("blur", () => ta.dispatchEvent(new Event("change", { bubbles: true })));
    // colar sempre como texto puro (evita lixo de outros sites)
    ed.addEventListener("paste", e => { e.preventDefault(); const t = (e.clipboardData || window.clipboardData).getData("text/plain"); document.execCommand("insertText", false, t); });
    ed.addEventListener("keydown", e => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase(), c = { b: "bold", i: "italic", u: "underline" }[k];
      if (c) { e.preventDefault(); e.stopPropagation(); acao(c); }
    });
  }
  function ligaTudo(raiz) { (raiz || document).querySelectorAll(ALVOS).forEach(liga); }

  // ---------- barra de formatação ----------
  let bar = null;
  const BOTOES = [
    { c: "bold", t: "<b>B</b>", n: "Negrito (Ctrl+B)" },
    { c: "italic", t: "<i>I</i>", n: "Itálico (Ctrl+I)" },
    { c: "underline", t: "<u>U</u>", n: "Sublinhado (Ctrl+U)" },
    { c: "strikeThrough", t: "<s>S</s>", n: "Riscado" },
    { c: "mark", t: '<mark>M</mark>', n: "Marca-texto" },
    { c: "clear", t: "⌫", n: "Tirar a formatação" },
  ];
  function el() {
    if (bar) return bar;
    bar = document.createElement("div"); bar.className = "rt-bar"; bar.setAttribute("role", "toolbar");
    bar.innerHTML = BOTOES.map(b => `<button type="button" data-rt="${b.c}" title="${b.n}" aria-label="${b.n}" data-nosfx>${b.t}</button>`).join("");
    document.body.appendChild(bar);
    // mousedown não pode tirar a seleção do texto
    bar.addEventListener("mousedown", e => e.preventDefault());
    bar.addEventListener("touchstart", e => { if (e.target.closest("[data-rt]")) e.preventDefault(); }, { passive: false });
    bar.addEventListener("touchend", e => { const b = e.target.closest("[data-rt]"); if (b) { e.preventDefault(); acao(b.dataset.rt); } }, { passive: false });
    bar.addEventListener("click", e => { const b = e.target.closest("[data-rt]"); if (b) acao(b.dataset.rt); });
    return bar;
  }
  const edDaSelecao = () => { const s = getSelection(); if (!s.rangeCount) return null; const n = s.anchorNode; const e = n && (n.nodeType === 1 ? n : n.parentElement); return e && e.closest(".rt-ed"); };
  function marcaNaSelecao() { const s = getSelection(); if (!s.rangeCount) return []; const r = s.getRangeAt(0), ed = edDaSelecao(); if (!ed) return []; return [...ed.querySelectorAll("mark")].filter(m => r.intersectsNode(m)); }
  function tira(m) { const p = m.parentNode; while (m.firstChild) p.insertBefore(m.firstChild, m); p.removeChild(m); }
  function acao(c) {
    const ed = edDaSelecao(); if (!ed) return;
    document.execCommand("styleWithCSS", false, false);
    if (c === "mark") {
      const ms = marcaNaSelecao();
      if (ms.length) ms.forEach(tira); else { document.execCommand("styleWithCSS", false, true); document.execCommand("hiliteColor", false, "rgb(255, 214, 10)"); document.execCommand("styleWithCSS", false, false); }
    } else if (c === "clear") { marcaNaSelecao().forEach(tira); document.execCommand("removeFormat"); }
    else document.execCommand(c);
    ed.dispatchEvent(new Event("input", { bubbles: true }));
    estado(); if (typeof sfx === "function") sfx("clique");
  }
  function estado() {
    if (!bar) return;
    bar.querySelectorAll("[data-rt]").forEach(b => {
      const c = b.dataset.rt;
      let on = false;
      try { if (c === "mark") on = marcaNaSelecao().length > 0; else if (c !== "clear") on = document.queryCommandState(c); } catch (e) {}
      b.classList.toggle("on", on);
    });
  }
  function posiciona() {
    const s = getSelection(), ed = edDaSelecao();
    if (!ed || !s.rangeCount || s.isCollapsed || !String(s).trim()) { if (bar) bar.classList.remove("show"); return; }
    el(); estado();
    const r = s.getRangeAt(0).getBoundingClientRect(); if (!r.width && !r.height) return;
    bar.classList.add("show");
    const bw = bar.offsetWidth, bh = bar.offsetHeight, toque = matchMedia("(pointer:coarse)").matches;
    let x = r.left + r.width / 2 - bw / 2, y = toque ? r.bottom + 10 : r.top - bh - 8;
    if (y < 6) y = r.bottom + 8;
    if (y + bh > innerHeight - 6) y = Math.max(6, r.top - bh - 8);
    x = Math.max(6, Math.min(innerWidth - bw - 6, x));
    bar.style.left = x + "px"; bar.style.top = y + "px";
  }
  let raf = 0;
  document.addEventListener("selectionchange", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(posiciona); });
  window.addEventListener("scroll", () => { if (bar && bar.classList.contains("show")) posiciona(); }, true);
  window.addEventListener("resize", () => { if (bar && bar.classList.contains("show")) posiciona(); });

  // textareas que aparecem depois (cartas em edição, resumo de habilidade, caixas novas)
  const obs = new MutationObserver(ms => { for (const m of ms) m.addedNodes.forEach(n => { if (n.nodeType !== 1) return; if (n.matches && n.matches(ALVOS)) liga(n); else if (n.querySelector) ligaTudo(n); }); });
  function iniciar() { ligaTudo(); obs.observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
  return { html, linhas, valor, liga };
})();
window.RT = RT;
// atalhos usados pelos renderizadores das cartas
function rtx(t) { return RT.html(t); }
function rtLinhas(t) { return RT.linhas(t); }
