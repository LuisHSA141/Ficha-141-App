"use strict";
// =====================================================================
// 141 // FUNDO ANIMADO DA MÚSICA
// Cada faixa da playlist tem um vídeo em loop atrás da ficha. No PC usa a versão
// horizontal, no celular (tela em pé) a vertical. A troca de música faz uma fusão
// entre os dois vídeos. Um plano de fundo por URL, se houver, tem prioridade.
// =====================================================================
const FUNDOS_MUS = (() => {
  const KEY = "ficha141_fundoMusica";
  let ligado = true; try { ligado = localStorage.getItem(KEY) !== "0"; } catch (e) {}
  let box, vids, ativo = 0, atual = "", seq = 0;
  const falhou = new Set(); // não insiste num arquivo que já deu erro nesta sessão
  const emPe = () => matchMedia("(orientation: portrait)").matches;
  const arq = id => `fundos/bg-${id}-${emPe() ? "v" : "h"}.mp4`;
  const naFicha = () => !document.body.classList.contains("title-on");
  const temUrl = () => { const i = document.getElementById("background-url-input"); return !!(i && i.value.trim()); };
  const musica = () => { try { return MUS.atual; } catch (e) { return "pense"; } };

  function monta() {
    if (box) return;
    box = document.createElement("div"); box.className = "mus-bg"; box.setAttribute("aria-hidden", "true");
    box.innerHTML = '<video muted loop playsinline preload="auto" disablepictureinpicture></video><video muted loop playsinline preload="auto" disablepictureinpicture></video><i class="mus-bg-tint"></i>';
    const ref = document.getElementById("bgimg"); (ref ? ref.parentNode.insertBefore(box, ref.nextSibling) : document.body.prepend(box));
    vids = [...box.querySelectorAll("video")];
  }
  function deve() { return ligado && naFicha() && !temUrl() && !document.hidden; }
  // troca para o vídeo da música atual, com fusão
  function atualiza(forca) {
    monta();
    if (!deve()) { box.classList.remove("on"); vids.forEach(v => v.pause()); return; }
    const src = arq(musica());
    if (falhou.has(src)) { if (!vids[ativo].classList.contains("vis")) box.classList.remove("on"); return; }
    if (src === atual && !forca) {
      // só acende a camada com um vídeo de verdade tocando (sem ele, o tingimento viraria uma tela vermelha)
      const v = vids[ativo];
      if (v.classList.contains("vis") && v.getAttribute("src")) { if (v.paused) v.play().catch(() => {}); box.classList.add("on"); }
      return;
    }
    atual = src; const n = ++seq, prox = 1 - ativo, v = vids[prox], velho = vids[ativo];
    v.src = src; v.load();
    const pronto = () => {
      if (n !== seq) return;
      v.classList.add("vis"); velho.classList.remove("vis");
      box.classList.add("on"); ativo = prox;
      setTimeout(() => { if (n === seq) { velho.pause(); velho.removeAttribute("src"); velho.load(); } }, 1300);
    };
    v.addEventListener("playing", pronto, { once: true });
    v.addEventListener("error", () => { if (n !== seq) return; console.warn("[141] fundo da música não carregou:", src); falhou.add(src); atual = ""; if (!velho.classList.contains("vis")) box.classList.remove("on"); }, { once: true });
    const p = v.play(); if (p && p.catch) p.catch(() => {});
  }
  function liga(on) {
    ligado = on; try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) {}
    const c = document.getElementById("musBgToggle"); if (c) c.checked = on;
    atualiza(true);
  }
  // quando atualizar: troca de música, entrar/sair da ficha, girar o celular, aba escondida, URL de fundo
  document.addEventListener("musica", () => atualiza());
  new MutationObserver(() => atualiza()).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  matchMedia("(orientation: portrait)").addEventListener("change", () => atualiza(true));
  document.addEventListener("visibilitychange", () => atualiza());
  document.addEventListener("click", e => { if (e.target.closest("#bgApply")) setTimeout(() => atualiza(), 50); });
  document.addEventListener("change", e => { if (e.target.id === "musBgToggle") { liga(e.target.checked); if (typeof sfx === "function") sfx("clique"); } });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { const c = document.getElementById("musBgToggle"); if (c) c.checked = ligado; });
  else { const c = document.getElementById("musBgToggle"); if (c) c.checked = ligado; }
  return { atualiza, liga };
})();
window.FUNDOS_MUS = FUNDOS_MUS;
