"use strict";
// =====================================================================
// 141 // INTERLÚDIO, PV TEMPORÁRIOS E INTIMIDAÇÃO EM COMBATE
// Regras do Livro do Jogador 1.4.1 (Interlúdio e Intimidação em combate).
// O jogador escolhe o local e as ações; a ficha mostra a regra de cada ação.
// Automático: Dormir (conforme o local) e a recarga de equipamento ao fim.
// =====================================================================
const INTER = (() => {
  const E = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = t => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim();
  const temTitulo = n => LISTS.titles.some(t => norm(t.name) === norm(n));
  const nivel = () => { try { return lvlInfo().total || 1; } catch (e) { return 1; } };
  const d6 = () => { const a = new Uint32Array(1); crypto.getRandomValues(a); return 1 + a[0] % 6; };

  // bônus ativos: {id, tipo, txt, det, dura, usado}
  let BON = [], ultimo = null;

  // ---------------- PV temporários ----------------
  const tmpEl = () => document.getElementById("char-hp-temp");
  function temp() { return Math.max(0, nz(tmpEl() && tmpEl().value)); }
  function setTemp(v) { const el = tmpEl(); if (el) el.value = v > 0 ? String(v) : ""; }
  // não acumula: só troca se o novo valor for maior
  function ganharTemp(v) { v = Math.max(0, Math.floor(v)); if (v > temp()) { setTemp(v); return true; } return false; }
  // dano negativo (d < 0): gasta os temporários primeiro e devolve o que sobra para os PV
  function absorve(d) {
    const t = temp(); if (d >= 0 || !t) return d;
    const a = Math.min(t, -d); setTemp(t - a);
    if (a) pop(`−${a} TEMP`);
    return d + a;
  }
  function pop(txt) {
    const el = tmpEl(); if (!el) return;
    const tag = document.createElement("span"); tag.className = "rel-pop neg"; tag.textContent = txt;
    const r = el.getBoundingClientRect(); tag.style.left = (r.left + r.width / 2) + "px"; tag.style.top = (r.top + window.scrollY) + "px";
    document.body.appendChild(tag); setTimeout(() => tag.remove(), 1100);
  }

  // ---------------- bônus até o próximo interlúdio ----------------
  const uid = () => Math.random().toString(36).slice(2, 9);
  function addBon(tipo, txt, det, dura = 1) {
    // Treinar / Estudar e Plano não acumulam: o novo substitui
    if (tipo === "treino" || tipo === "plano") BON = BON.filter(b => b.tipo !== tipo);
    BON.push({ id: uid(), tipo, txt, det: det || "", dura, usado: false });
  }
  function iniBonus() { const p = BON.find(b => b.tipo === "plano" && !b.usado); return p ? nz(p.ini) : 0; }
  function bonUI() {
    const box = document.getElementById("interBon"); if (!box) return;
    const ativos = BON.filter(b => !b.usado), t = temp();
    const linhas = BON.map(b => `<div class="ib-it${b.usado ? " usado" : ""}" data-ib="${b.id}">
      <span class="ib-tag ib-${b.tipo}">${({ prato: "PRATO", treino: "TREINO", plano: "PLANO", temp: "PV TEMP." })[b.tipo] || "BÔNUS"}</span>
      <span class="ib-t"><b>${E(b.txt)}</b>${b.det ? `<small>${E(b.det)}</small>` : ""}${b.dura > 1 ? `<small class="ib-d">DURA MAIS ${b.dura - 1} INTERLÚDIO</small>` : ""}</span>
      ${b.tipo === "treino" && !b.usado ? `<button class="btn sm" data-ib-rola="${b.id}" title="Rola 1d6 e marca como usado" data-nosfx>+1D6</button>` : ""}
      <button class="btn sm${b.usado ? "" : " acc"}" data-ib-usa="${b.id}" data-nosfx>${b.usado ? "DESFAZER" : "USADO"}</button></div>`).join("");
    const ult = ultimo ? `<div class="ib-ult">ÚLTIMO INTERLÚDIO ${E(ultimo.data)} // ${E(ultimo.local)}${ultimo.acoes.length ? " // " + E(ultimo.acoes.join(", ")) : ""}${ultimo.nota ? `<small>${E(ultimo.nota)}</small>` : ""}</div>` : "";
    box.innerHTML = (BON.length ? `<div class="ib-h"><span>ATÉ O PRÓXIMO INTERLÚDIO</span><em>${ativos.length} ATIVO${ativos.length === 1 ? "" : "S"}${t ? ` // ${t} PV TEMP.` : ""}</em></div>${linhas}` : "") + ult;
    box.classList.toggle("hidden", !BON.length && !ultimo);
    const ini = document.getElementById("char-initiative");
    if (ini) ini.title = iniBonus() ? `Inclui +${iniBonus()} do Plano (Revisar a Missão)` : "";
  }
  document.addEventListener("click", e => {
    const u = e.target.closest("[data-ib-usa]");
    if (u) { const b = BON.find(x => x.id === u.dataset.ibUsa); if (b) { b.usado = !b.usado; sfx("clique"); bonUI(); update(); changed(true); } return; }
    const r = e.target.closest("[data-ib-rola]");
    if (r) {
      const b = BON.find(x => x.id === r.dataset.ibRola); if (!b) return;
      let v;
      if (window.DADOS) { const res = DADOS.rolar({ 6: 1 }, 0, "normal", `TREINO // ${b.pericia || "PERÍCIA"}`); v = res.total; } else v = d6();
      b.usado = true; bonUI(); changed(true); toast(`BÔNUS DE TREINO: +${v} NO TESTE DE ${(b.pericia || "PERÍCIA").toUpperCase()}`);
    }
  });

  // ---------------- painel do interlúdio ----------------
  const ACOES = [
    { k: "dormir", n: "DORMIR", d: "Descanso longo, conforme a condição do local.", r: "Você recebe os benefícios de um descanso longo, conforme a condição do local. Habilidades que acontecem durante um descanso longo, como preparar doses, pentes ou módulos, fazem parte da ação Dormir e não gastam outra ação.", auto: true },
    { k: "cozinhar", n: "COZINHAR", d: "Sobrevivência CD 12. Prato para até 4 aliados.", r: "Faça um teste de Sobrevivência (CD 12) e gaste 1 recurso de comida por pessoa servida. Num sucesso, você prepara um prato para até 4 aliados, incluindo você. Quem comer não gasta ação. Reforçado: PV temporários iguais ao próprio nível até o próximo interlúdio. Energético: recupera 1d6 PVon e Vantagem no próximo teste contra Exaustão. Comida de casa: Vantagem no próximo teste de resistência de Sabedoria." },
    { k: "relaxar", n: "RELAXAR", d: "Recupera metade dos PVon; todos em grupo.", r: "Você conversa, joga cartas, ouve música, faz qualquer coisa que tire a cabeça do trabalho, e recupera metade dos PVon. Se pelo menos mais um operador relaxar junto com você, cada um de vocês recupera todos os PVon." },
    { k: "manutencao", n: "MANUTENÇÃO", d: "1 Suprimento: conserto ou fabricação.", r: "Gaste 1 Suprimento e escolha uma opção. Conserto: você conserta uma arma, um colete ou um equipamento danificado. Fabricação: você fabrica munição ou um consumível simples. O Armeiro faz isso sem teste; os outros fazem um teste de Tecnologia (CD 13)." },
    { k: "tratar", n: "TRATAR", d: "Medicina CD 13: ferimento crítico ou Exaustão.", r: "Gaste 1 Suprimento e faça um teste de Medicina (CD 13) num aliado. Num sucesso, escolha um efeito: um ferimento crítico dele é curado, ou ele remove 1 nível de Exaustão. O Suporte tem Vantagem nesse teste." },
    { k: "treinar", n: "TREINAR OU ESTUDAR", d: "+1d6 guardado para uma perícia.", r: "Escolha uma perícia. Até o próximo interlúdio, você pode somar 1d6 a um teste dela. O bônus não acumula: se você treinar de novo, o novo bônus substitui o antigo." },
    { k: "revisar", n: "REVISAR A MISSÃO", d: "Investigação: Pista ou Plano.", r: "Faça um teste de Investigação (CD 12 simples, 15 complexo, 18 bem escondido). Num sucesso, escolha: Pista (o mestre revela uma informação concreta) ou Plano (até o próximo interlúdio, quem participou tem +2 na Iniciativa do primeiro combate e Vantagem no primeiro teste que siga o plano). Passando por 5 ou mais, as duas." },
    { k: "contatos", n: "FAZER CONTATOS", d: "Rumor ou acesso a itens.", r: "Você usa a rede da sua facção ou os seus conhecidos. Dependendo de onde estiver, consegue um rumor útil sobre a próxima missão, ou acesso a um item Restrito pelo preço normal, ou a um item Militar com o multiplicador de Restrito." },
  ];
  const LOCAIS = [
    { k: "precario", n: "PRECÁRIO", d: "Metade dos PV e PVon, não remove Exaustão." },
    { k: "normal", n: "NORMAL", d: "Descanso longo padrão." },
    { k: "confortavel", n: "CONFORTÁVEL", d: "Remove 1 nível de Exaustão a mais." },
    { k: "luxuoso", n: "LUXUOSO", d: "Como Confortável + PV temporários = 2 × nível." },
  ];
  let S = null; // estado do painel aberto
  function limite() { return temTitulo("INCANSÁVEL") && S && S.acoes.includes("dormir") ? 3 : 2; }
  function el() {
    let m = document.getElementById("interModal"); if (m) return m;
    m = document.createElement("div"); m.className = "modal inter-m"; m.id = "interModal";
    m.innerHTML = `<div class="modal-box inter-box"><span class="corner c1"></span><span class="corner c2"></span><span class="corner c3"></span><span class="corner c4"></span>
      <div class="inter-top"><span>◈ INTERLÚDIO</span><button class="fx-close" data-in="x" aria-label="Fechar" data-nosfx>×</button></div>
      <div class="inter-body" id="interBody"></div>
      <div class="modal-acts inter-acts"><span class="inter-cnt" id="interCnt"></span><button class="btn" data-in="x" data-nosfx>CANCELAR</button><button class="btn acc" data-in="ok" data-nosfx>CONCLUIR INTERLÚDIO</button></div></div>`;
    document.body.appendChild(m);
    m.addEventListener("click", e => {
      if (e.target === m) return fechar();
      const b = e.target.closest("[data-in],[data-in-loc],[data-in-acao]");
      if (!b) return;
      if (b.dataset.in === "x") return fechar();
      if (b.dataset.in === "ok") return concluir();
      if (b.dataset.inLoc) { S.local = b.dataset.inLoc; sfx("clique"); return desenha(); }
      if (b.dataset.inAcao) {
        const k = b.dataset.inAcao, i = S.acoes.indexOf(k);
        if (i >= 0) { S.acoes.splice(i, 1); if (k === "dormir" && S.acoes.length > 2) S.acoes.length = 2; }
        else {
          const lim = k === "dormir" && temTitulo("INCANSÁVEL") ? 3 : limite();
          if (S.acoes.length >= lim) { sfx("errado"); toast(`ATÉ ${limite()} AÇÕES NO INTERLÚDIO${temTitulo("INCANSÁVEL") ? "" : " (3 COM INCANSÁVEL + DORMIR)"}`, true); return; }
          S.acoes.push(k);
        }
        sfx("clique"); desenha();
      }
    });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && m.classList.contains("show")) { e.stopPropagation(); fechar(); } }, true);
    return m;
  }
  const opt = (sel, k, n, d, attr) => `<button class="in-op${sel ? " on" : ""}" ${attr}="${k}" data-nosfx><b>${n}</b>${d ? `<small>${d}</small>` : ""}</button>`;
  function desenha(soContagem) {
    const lim = limite();
    document.getElementById("interCnt").innerHTML = `AÇÕES <b>${S.acoes.length} / ${lim}</b>${temTitulo("INCANSÁVEL") ? " // INCANSÁVEL" : ""}`;
    if (soContagem) return;
    const tem = k => S.acoes.includes(k);
    let h = `<div class="in-sec"><span class="lbl">Condição do local</span><div class="in-grid g4">${LOCAIS.map(l => opt(S.local === l.k, l.k, l.n, l.d, "data-in-loc")).join("")}</div></div>
      <div class="in-sec"><span class="lbl">Ações (até ${lim}, sem repetir)</span><div class="in-grid g2">${ACOES.map(a => opt(tem(a.k), a.k, a.n, a.d, "data-in-acao")).join("")}</div></div>`;
    // trecho da regra de cada ação escolhida, na ordem em que foi marcada
    const det = S.acoes.map(k => { const a = ACOES.find(x => x.k === k); return `<div class="in-det"><em>${a.n}${a.auto ? " // A FICHA APLICA SOZINHA" : ""}</em>${E(a.r)}</div>`; });
    det.push(`<div class="in-det in-fim"><em>AO FIM DO INTERLÚDIO // A FICHA APLICA SOZINHA</em>Baterias com todas as cargas, Itens de Bolso de Recarga com todos os usos e unidades de Consumíveis, Lançáveis e Armadilhas (se o grupo tiver Suprimentos ou loja).</div>`);
    document.getElementById("interBody").innerHTML = h + `<div class="in-sec">${det.join("")}</div>`;
    desenha(true);
  }
  function abrir() {
    S = { local: "normal", acoes: [] };
    const m = el(); desenha(); m.classList.add("show"); sfx("abrir");
  }
  function fechar() { const m = document.getElementById("interModal"); if (m && m.classList.contains("show")) { m.classList.remove("show"); sfx("fechar"); } }

  async function concluir() {
    const tem = k => S.acoes.includes(k);
    if (!S.acoes.length && !await ask("Nenhuma ação escolhida. Concluir o interlúdio mesmo assim? Os equipamentos recarregam.", { top: "INTERLÚDIO", yes: "CONCLUIR" })) return;
    fechar();
    const feito = [], lv = nivel();
    // bônus do interlúdio anterior expiram (PV temporários de Luxuoso inclusive)
    if (BON.some(b => b.tipo === "temp" && !b.usado)) setTemp(0);
    BON = [];
    const pvMax = () => nz(document.getElementById("pvonMax").textContent);
    const pvAt = () => { const v = document.getElementById("char-pvon").value; return v === "" ? pvMax() : nz(v); };
    const setPv = v => { document.getElementById("char-pvon").value = Math.max(0, Math.min(pvMax(), v)); };
    const exhN = () => [1, 2, 3, 4, 5, 6].filter(i => document.getElementById("exhaustion-level-" + i).checked).length;
    const tiraExh = n => { let k = exhN(); for (let i = 0; i < n && k > 0; i++, k--) document.getElementById("exhaustion-level-" + k).checked = false; };
    // Dormir: descanso longo conforme o local
    if (tem("dormir")) {
      const hm = document.getElementById("char-hp-max").value;
      if (S.local === "precario") {
        if (hm !== "") { const hc = document.getElementById("char-hp-current"), cur = hc.value === "" ? nz(hm) : nz(hc.value); hc.value = Math.min(nz(hm), cur + Math.ceil(nz(hm) / 2)); }
        setPv(pvAt() + Math.ceil(pvMax() / 2)); feito.push("METADE DOS PV E PVON");
      } else {
        if (hm !== "") document.getElementById("char-hp-current").value = hm;
        setPv(pvMax()); feito.push("PV E PVON CHEIOS");
        const n = S.local === "normal" ? 1 : 2, k = exhN(); tiraExh(n);
        if (k) feito.push(`−${Math.min(k, n)} EXAUSTÃO`);
      }
      HABUSOS = {}; feito.push("USOS DE HABILIDADE");
      let nt = 0; LISTS.traits.forEach(t => { if (nz(t.usosMax) > 0 && nz(t.usosAtuais) < nz(t.usosMax)) { t.usosAtuais = t.usosMax; nt++; } });
      if (nt) feito.push("HABILIDADES ÚNICAS");
      if (S.local === "luxuoso") { const v = 2 * lv; addBon("temp", `${v} PV temporários`, "Local Luxuoso: começa a próxima cena com eles"); ganharTemp(v); feito.push(`${v} PV TEMPORÁRIOS`); }
    }
    // registro do interlúdio
    const nomes = Object.fromEntries(ACOES.map(x => [x.k, x.n]));
    ultimo = { data: new Date().toLocaleDateString("pt-BR"), local: (LOCAIS.find(l => l.k === S.local) || {}).n || "", acoes: S.acoes.map(k => nomes[k]), nota: "" };
    // 5) fim de qualquer interlúdio: equipamento
    let nb = 0; LISTS.bolso.forEach(it => { if (it.marca === "Recarga" && String(it.usosAtuais) !== String(profBonus())) { it.usosAtuais = String(profBonus()); nb++; } });
    if (nb) feito.push("ITENS DE BOLSO");
    let nc = 0; LISTS.equipment.forEach(it => { if (nz(it.cargasMax) && nz(it.cargasAtual) < nz(it.cargasMax)) { it.cargasAtual = it.cargasMax; nc++; } });
    if (nc) feito.push("CARGAS DE BATERIA");
    if (LISTS.equipment.some(it => nz(it.qtdMax) && nz(it.qtdAtual) < nz(it.qtdMax)) && await ask("O grupo tem Suprimentos ou acesso a uma loja? Se sim, as unidades gastas de Consumíveis, Lançáveis e Armadilhas voltam.", { top: "REPOR UNIDADES", yes: "REPOR", no: "NÃO TEM" })) {
      LISTS.equipment.forEach(it => { if (nz(it.qtdMax)) it.qtdAtual = it.qtdMax; }); feito.push("UNIDADES DE EQUIPAMENTO");
    }
    if (window.ARM) ARM.recoilReset();
    renderAll(); updateInjuries(); update(); updateFeatures(true); changed();
    sfx("abrir"); toast(`INTERLÚDIO // ${feito.length ? feito.join(", ") : "NADA A RECUPERAR"}`);
  }

  // ---------------- intimidação em combate ----------------
  const INTIM = [
    ["VACILO", "Perde a Reação e tem Desvantagem no próximo ataque."],
    ["PÉS PESADOS", "O Deslocamento cai pela metade."],
    ["MÃO TRÊMULA", "Desvantagem em todos os ataques."],
    ["NÃO OUSA", "Não pode atacar quem o intimidou, mas pode atacar outros."],
    ["RECUO", "Se afasta imediatamente até metade do Deslocamento, sem provocar ataque de oportunidade, e não pode se aproximar voluntariamente."],
    ["PÂNICO", "Fica Amedrontado por quem intimidou."],
  ];
  function intimidar() {
    let m = document.getElementById("intimModal");
    if (!m) {
      m = document.createElement("div"); m.className = "modal inter-m"; m.id = "intimModal";
      m.innerHTML = `<div class="modal-box inter-box intim-box"><span class="corner c1"></span><span class="corner c2"></span><span class="corner c3"></span><span class="corner c4"></span>
        <div class="inter-top"><span>☠ INTIMIDAÇÃO EM COMBATE</span><button class="fx-close" data-im="x" aria-label="Fechar" data-nosfx>×</button></div>
        <div class="inter-body" id="intimBody"></div></div>`;
      document.body.appendChild(m);
      document.addEventListener("keydown", e => { if (e.key === "Escape" && m.classList.contains("show")) { e.stopImmediatePropagation(); m.classList.remove("show"); sfx("fechar"); } }, true);
      m.addEventListener("click", e => {
        if (e.target === m || e.target.closest('[data-im="x"]')) { m.classList.remove("show"); sfx("fechar"); return; }
        if (e.target.closest('[data-im="rola"]')) rolaIntim();
        const esc2 = e.target.closest("[data-im-esc]"); if (esc2) { mostraEfeito(+esc2.dataset.imEsc, true); sfx("clique"); }
      });
    }
    const pres = temTitulo("PRESENÇA OPRESSORA");
    const bonus = (() => { try { const id = skillId("Intimidação"), on = document.getElementById(id) && document.getElementById(id).checked; return getMods().CHA + (on ? profBonus() : 0); } catch (e) { return null; } })();
    document.getElementById("intimBody").innerHTML = `<div class="im-regra">
      <p><b>AÇÃO.</b> Escolha um alvo a até <b>9m</b> que possa ver ou ouvir você. Faça um teste de <b>Intimidação</b>${bonus != null ? ` (<b>1d20 ${bonus >= 0 ? "+" : "−"} ${Math.abs(bonus)}</b>)` : ""} contra um <b>teste de resistência de Sabedoria</b> do alvo.</p>
      <p>Se vencer, ${pres ? "role <b>2d6</b> e escolha qual resultado vale (<b>PRESENÇA OPRESSORA</b>)" : "o alvo rola <b>1d6</b>"}. O efeito dura até o fim do próximo turno do alvo; um novo sucesso substitui o anterior.</p>
      <p class="im-obs">Falha: as próximas tentativas contra esse alvo têm Desvantagem até o fim do combate. Drones, autômatos e imunes a Amedrontado não são afetados. Chefes e elites resistem com Vantagem.</p></div>
      <div class="im-acts">${bonus != null ? `<button class="btn" data-im-teste data-nosfx>ROLAR INTIMIDAÇÃO</button>` : ""}<button class="btn acc" data-im="rola" data-nosfx>SUCESSO // ROLAR ${pres ? "2D6" : "1D6"}</button></div>
      <div class="im-res" id="imRes"></div>
      <div class="im-tab">${INTIM.map((x, i) => `<div class="im-l" data-im-l="${i + 1}"><b>${i + 1}</b><span><em>${x[0]}</em> ${x[1]}</span></div>`).join("")}</div>`;
    const t = m.querySelector("[data-im-teste]");
    if (t) t.onclick = () => { if (window.DADOS) { const r = DADOS.rolar({ 20: 1 }, bonus, "normal", "INTIMIDAÇÃO"); document.getElementById("imRes").innerHTML = `<div class="im-teste">TESTE DE INTIMIDAÇÃO: <b>${r.total}</b> <small>(d20: ${r.grupos[0].res[0].v})</small> // compare com o TR de Sabedoria do alvo</div>`; } };
    m.classList.add("show"); sfx("abrir");
  }
  function rolaIntim() {
    const pres = temTitulo("PRESENÇA OPRESSORA");
    let vals;
    if (window.DADOS) vals = DADOS.rolar({ 6: pres ? 2 : 1 }, 0, "normal", "INTIMIDAÇÃO // EFEITO").grupos[0].res.map(x => x.v);
    else vals = pres ? [d6(), d6()] : [d6()];
    const box = document.getElementById("imRes");
    if (pres && vals[0] !== vals[1]) {
      box.innerHTML = `<div class="im-esc"><span>PRESENÇA OPRESSORA // ESCOLHA O RESULTADO</span>${vals.map(v => `<button class="btn" data-im-esc="${v}" data-nosfx><b>${v}</b> ${INTIM[v - 1][0]}</button>`).join("")}</div>`;
      document.querySelectorAll(".im-l").forEach(l => l.classList.toggle("on", vals.includes(+l.dataset.imL)));
    } else mostraEfeito(vals[0]);
  }
  function mostraEfeito(v, escolhido) {
    const x = INTIM[v - 1];
    document.getElementById("imRes").innerHTML = `<div class="im-efeito"><b>${v}</b><span><em>${x[0]}</em>${x[1]}<small>ATÉ O FIM DO PRÓXIMO TURNO DO ALVO</small></span></div>`;
    document.querySelectorAll(".im-l").forEach(l => l.classList.toggle("on", +l.dataset.imL === v));
  }

  // ---------------- avisos de títulos na ficha ----------------
  function titulosUI() {
    const n = document.getElementById("nervosNote"); if (!n) return;
    const msgs = [];
    if (temTitulo("NERVOS DE AÇO")) msgs.push("<b>NERVOS DE AÇO</b>: Vantagem em TR contra Intimidação em combate e contra Amedrontado.");
    if (temTitulo("PRESENÇA OPRESSORA")) msgs.push("<b>PRESENÇA OPRESSORA</b>: na sua Intimidação em combate, o alvo rola 2d6 e você escolhe o efeito.");
    n.innerHTML = msgs.join("<br>"); n.classList.toggle("hidden", !msgs.length);
  }

  // ---------------- salvar / carregar ----------------
  function salvar() { return { bon: BON, ultimo }; }
  function carregar(d) { BON = Array.isArray(d && d.bon) ? d.bon : []; ultimo = (d && d.ultimo) || null; bonUI(); }
  function refresh() { bonUI(); titulosUI(); }

  document.addEventListener("click", e => { if (e.target.closest("[data-intimidar]")) intimidar(); });
  return { abrir, absorve, ganharTemp, temp, iniBonus, salvar, carregar, refresh, intimidar };
})();
window.INTER = INTER;
