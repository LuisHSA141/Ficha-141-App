"use strict";
// =====================================================================
// 141 // CRIAÇÃO DE OPERADOR, TELA INICIAL E SUBIR DE NÍVEL
// Regras do Livro do Jogador v1.4.1 (data.js / livro.js).
// =====================================================================
const CR = {};
const d6 = n => Math.floor(Math.random() * n) + 1;
const SKILL_ORDER = Object.keys(SKILLS).sort((a, b) => a.localeCompare(b, "pt"));
const ABR = { FOR: "FOR", DEX: "DES", CON: "CON", INT: "INT", SAB: "SAB", CHA: "CAR" };
const ATTR_LIST = Object.keys(ATTRIBUTES);
const STD_ARRAY = [15, 14, 13, 12, 10, 8];

// ---------------- overlay ----------------
const wizEl = document.createElement("div");
wizEl.className = "wiz";
wizEl.id = "wiz";
wizEl.innerHTML = `<div class="wiz-in"><span class="corner c1"></span><span class="corner c2"></span><span class="corner c3"></span><span class="corner c4"></span>
  <div class="wiz-top"><div id="wzTag">141 // CRIAÇÃO DE OPERADOR</div><div><i class="dot"></i> <span id="wzCount">ETAPA 01</span></div></div>
  <div class="wiz-steps" id="wzSteps"></div>
  <h2 id="wzTitle"></h2><div class="wiz-sub" id="wzSub"></div>
  <div class="wiz-body" id="wzBody"></div>
  <div class="wiz-nav"><button class="btn" id="wzBack" data-nosfx>VOLTAR</button><div class="wz-msg" id="wzMsg"></div><button class="btn acc" id="wzNext" data-nosfx>PRÓXIMO</button></div>
</div>`;
document.body.appendChild(wizEl);

// ---------------- tela inicial ----------------
const fmtWhen = t => { const d = new Date(t), now = new Date(); const hm = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return d.toDateString() === now.toDateString() ? "HOJE " + hm : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) + " " + hm; };
function buildTitle() {
  const sw = document.querySelector(".start-wrap");
  sw.innerHTML = `<div class="menu2" id="startMenu">
      <div class="title-row"><button class="start" id="newBtn" data-nosfx>NOVO OPERADOR</button><button class="die-btn" id="rndBtn" title="d20 // operador aleatório: o dado sorteia tudo e você revisa antes de ativar" aria-label="Operador aleatório" data-nosfx><svg viewBox="0 0 32 32"><path d="M16 2.5 28 9.5v13L16 29.5 4 22.5v-13z"/><path d="M16 2.5 9.5 12h13zM9.5 12 4 22.5M22.5 12 28 22.5M9.5 12 16 23.5 22.5 12M4 22.5h24M16 23.5v6" opacity=".55"/><text x="16" y="19.6" text-anchor="middle" font-size="6.8" font-weight="bold" font-family="Courier New,monospace" fill="currentColor" stroke="none">20</text></svg></button></div>
      <button class="start alt" id="oldBtn" data-nosfx>OPERADOR EXISTENTE</button>
    </div>
    <div class="hint">↑ ↓ ESCOLHER // ENTER CONFIRMAR</div>
    <div class="load-panel hidden" id="loadPanel">
      <div class="lp-h" id="lpHead">// OPERADORES SALVOS</div>
      <div id="lpList"></div>
      <label class="lp-it file" id="lpFile">▸ IMPORTAR ARQUIVO .JSON<small>ENTRA COMO OPERADOR NOVO NA LISTA // ACEITA A FICHA ANTIGA</small><input type="file" accept=".json,application/json"></label>
      <button class="btn" id="lpBack" data-nosfx>VOLTAR</button>
    </div>`;
  const L = FICHAS.list(), a = L.find(x => x.id === FICHAS.current) || L[0];
  $("found").innerHTML = a ? `ÚLTIMO REGISTRO: <b>${esc(a.cod.toUpperCase())}</b> // NV ${esc(a.lvl)} // ${esc(a.cls.toUpperCase())}${L.length > 1 ? ` // +${L.length - 1} SALVO${L.length > 2 ? "S" : ""}` : ""}` : "NENHUM REGISTRO LOCAL // NOVO OPERADOR";
  $("newBtn").onclick = () => { sfx("clique"); chooseNew(); };
  $("rndBtn").onclick = () => { const d = $("rndBtn"); d.classList.remove("roll"); void d.offsetWidth; d.classList.add("roll"); sfx("clique"); setTimeout(() => chooseNew(true), 650); };
  $("oldBtn").onclick = () => { sfx("abrir"); showLoad(true); };
  $("lpBack").onclick = () => { sfx("fechar"); showLoad(false); };
  $("lpFile").querySelector("input").onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { try { const d = JSON.parse(r.result); const id = FICHAS.create(d); sfx("clique"); toast("IMPORTADO: " + FICHAS.summary(d).cod.toUpperCase()); showLoad(true, id); } catch (err) { sfx("errado"); toast("ARQUIVO INVÁLIDO: " + err.message, true); } };
    r.readAsText(f); e.target.value = "";
  };
}
function openFicha(id) {
  const d = FICHAS.get(id);
  if (!d) { sfx("errado"); toast("REGISTRO NÃO ENCONTRADO", true); return; }
  try { FICHAS.setCurrent(id); apply(JSON.parse(JSON.stringify(d))); sfx("clique"); enterSheet(); }
  catch (e) { sfx("errado"); toast("REGISTRO CORROMPIDO: " + e.message, true); }
}
function showLoad(on, focusId) {
  $("startMenu").classList.toggle("hidden", on);
  document.querySelector(".hint").classList.toggle("hidden", on);
  $("loadPanel").classList.toggle("hidden", !on);
  if (!on) { $("newBtn").focus(); return; }
  const L = FICHAS.list();
  $("lpHead").textContent = `// OPERADORES SALVOS // ${L.length}`;
  $("lpList").innerHTML = L.map(s => `<div class="lp-row${s.id === FICHAS.current ? " cur" : ""}" data-id="${s.id}">
      <button class="lp-it" data-open="${s.id}" data-nosfx>${s.portrait ? `<img src="${esc(s.portrait)}" alt="">` : `<i class="lp-ph">${esc(s.cod.charAt(0).toUpperCase())}</i>`}<span><b>${esc(s.cod.toUpperCase())}</b><small>NV ${esc(s.lvl)} // ${esc((s.cls + " " + s.spec).trim().toUpperCase() || "SEM CLASSE")}</small><small class="lp-when">SALVO ${fmtWhen(s.updated)}${s.id === FICHAS.current ? " // ÚLTIMO ABERTO" : ""}</small></span></button>
      <div class="lp-acts"><button class="lp-a" data-dup="${s.id}" title="Duplicar" aria-label="Duplicar" data-nosfx>⧉</button><button class="lp-a" data-exp="${s.id}" title="Exportar .json" aria-label="Exportar" data-nosfx>⤓</button><button class="lp-a del" data-del="${s.id}" title="Apagar" aria-label="Apagar" data-nosfx>✕</button></div>
    </div>`).join("") || '<div class="lp-none">NENHUM OPERADOR SALVO NESTE APARELHO</div>';
  const Q = sel => $("lpList").querySelectorAll(sel);
  Q("[data-open]").forEach(b => b.onclick = () => openFicha(b.dataset.open));
  Q("[data-dup]").forEach(b => b.onclick = () => { const id = FICHAS.duplicate(b.dataset.dup); sfx("abrir"); toast("OPERADOR DUPLICADO"); showLoad(true, id); });
  Q("[data-exp]").forEach(b => b.onclick = async () => {
    sfx("clique"); const d = FICHAS.get(b.dataset.exp);
    try { const r = await FICHAS.exportJSON(d, FICHAS.summary(d).cod); if (r !== "cancel") toast(r === "share" ? "FICHA PRONTA PARA COMPARTILHAR" : "ARQUIVO GERADO"); } catch (e) { sfx("errado"); toast("NÃO FOI POSSÍVEL EXPORTAR: " + e.message, true); }
  });
  Q("[data-del]").forEach(b => b.onclick = async () => {
    const s = L.find(x => x.id === b.dataset.del); sfx("clique");
    if (!await ask(`Apagar "${s.cod}" deste aparelho? Isso não tem volta. Se quiser guardar, exporte o .json antes.`, { top: "APAGAR OPERADOR", yes: "APAGAR" })) return;
    await FICHAS.remove(s.id); sfx("fechar"); toast("OPERADOR APAGADO"); buildTitle(); showLoad(true);
  });
  const f = focusId && $("lpList").querySelector(`[data-open="${focusId}"]`);
  if (f) { f.closest(".lp-row").classList.add("flash"); f.scrollIntoView({ block: "nearest" }); }
  (f || $("lpList").querySelector("button") || $("lpFile")).focus();
}
function chooseNew(random) {
  if (random) openWizard(randomW(), STEPS.length - 1); else openWizard();
}

// ---------------- operador aleatório (o dado da tela inicial) ----------------
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const RND_COD = ["Sombra", "Corvo", "Viper", "Echo", "Nômade", "Tango", "Kilo", "Wraith", "Falcão", "Lince", "Atlas", "Ronin", "Vulto", "Brasa", "Ônix", "Orca", "Hydra", "Mamba", "Sílex", "Cinza", "Faísca", "Bastião", "Neblina", "Ferrugem", "Coyote", "Granito", "Mercúrio", "Halcyon", "Kestrel", "Pavio"];
const RND_FIRST = ["Ana", "Bruno", "Clara", "Diego", "Elisa", "Felipe", "Helena", "Igor", "Júlia", "Kai", "Lucas", "Marta", "Nina", "Otto", "Paula", "Rafael", "Sofia", "Tomás", "Vera", "Yuri", "Mei", "Ivan", "Amara", "Lars", "Noor"];
const RND_LAST = ["Silva", "Moreau", "Kowalski", "Tanaka", "Okafor", "Vargas", "Lindqvist", "Ivanov", "Costa", "Reyes", "Novak", "Haddad", "Becker", "Ferreira", "O'Neil", "Sato", "Mendes", "Petrov", "Duarte", "Kaur"];
function randomW() {
  const w = newW();
  w.race = pick(Object.keys(RACES)); W = w;
  const r = RACES[w.race];
  if (r.subs) w.sub = pick(Object.keys(r.subs));
  const sb = subOf(); if (sb && sb.halos) w.halo = pick(Object.keys(sb.halos));
  if (sb && sb.animaType) w.anima = pick(["Lobo", "Coruja", "Raposa", "Tubarão", "Urso", "Gato", "Serpente", "Corvo"]);
  w.cls = pick(Object.keys(CLASSES)); w.spec = pick(specKeys(w.cls));
  w.level = 1 + Math.floor(Math.random() * 10);
  if (w.level >= MULTI_MIN_LEVEL && Math.random() < .4) {
    w.multi = true; w.cls2 = pick(Object.keys(CLASSES));
    w.spec2 = pick(specKeys(w.cls2).filter(k => !(w.cls2 === w.cls && k === w.spec)));
    w.lvl2 = 1 + Math.floor(Math.random() * (w.level - (MULTI_MIN_LEVEL - 1)));
  }
  w.nat = pick(natCodes.filter(c => c !== "OTHER"));
  // atributos: rolagem 4d6, maiores nos atributos de resistência da classe
  w.method = "roll";
  // 4d6 descartando o menor, com piso 8 para o operador sair jogável
  w.pool = Array.from({ length: 6 }, () => { const x = [d6(6), d6(6), d6(6), d6(6)].sort((a, b) => a - b); return Math.max(8, x[1] + x[2] + x[3]); }).sort((a, b) => b - a);
  w.rolledPool = w.pool; w.rolled = true;
  const c = CLASSES[w.cls], pri = [...c.saves, ...(c.choice || [])], order = [...new Set([...shuffle(pri), ...shuffle(ATTR_LIST)])];
  order.forEach((k, i) => w.base[k] = i);
  racePickSlots().forEach(sl => w.picks[sl.key] = pick(sl.of));
  if (r.asi && r.asi.free) w.free = shuffle(ATTR_LIST).slice(0, r.asi.free);
  let pts = asiCount(w.level) * 2, i = 0;
  while (pts > 0 && i < order.length) { const k = order[i]; if ((finalScores()[k] || 0) < 20) { w.asi[k]++; pts--; } else i++; }
  w.saveChoice = c.choice ? pick(c.choice) : "";
  const auto = autoSkillsW();
  w.skills = shuffle(c.skills.from.filter(x => !auto.includes(x))).slice(0, c.skills.n);
  w.raceSkills = shuffle(ALL_SKILLS.filter(x => !auto.includes(x) && !w.skills.includes(x))).slice(0, raceSkillCount());
  w.hp = hpRows().map(row => d6(row.die));
  w.talents = shuffle(TALENTOS).slice(0, raceTalentCount()).map(t => t.name);
  w.titles = shuffle(TITULOS).slice(0, TITLE_LEVELS.filter(l => l <= w.level).length).map(t => t.name);
  w.codename = pick(RND_COD) + (Math.random() < .35 ? "-" + (1 + Math.floor(Math.random() * 9)) : "");
  w.name = pick(RND_FIRST) + " " + pick(RND_LAST);
  return w;
}

// ---------------- voltar para a tela inicial (clique na caveira) ----------------
function goTitle(openList) {
  if (state !== "sheet") return;
  autosave(); state = "entering"; sfx("fechar");
  if ($("fxPanel").classList.contains("show")) $("fxPanel").classList.remove("show");
  fadeMusic(0, 900);
  veil(true, () => {
    $("sheet").classList.remove("show"); $("dock").classList.remove("show");
    $("titleScreen").style.display = ""; document.body.classList.add("title-on", "locked");
    state = "title"; applyFx(); buildTitle(); window.scrollTo(0, 0);
    if (openList === true) showLoad(true);
    veil(false, () => { if (openList !== true) $("newBtn").focus(); });
  });
}
document.querySelector(".head-logo").title = "Voltar para a tela inicial (a ficha fica salva)";
document.querySelector(".head-logo").addEventListener("click", () => goTitle());
document.addEventListener("keydown", e => {
  if ($("modal").classList.contains("show")) return;
  const k = e.key;
  if (state === "title") {
    const panel = !$("loadPanel").classList.contains("hidden");
    const items = panel ? [...document.querySelectorAll("#loadPanel .lp-it,#loadPanel .lp-a,#lpBack")] : [$("newBtn"), $("rndBtn"), $("oldBtn")];
    const i = items.indexOf(document.activeElement);
    if (k === "ArrowDown" || k === "ArrowUp") { e.preventDefault(); const n = items[(i + (k === "ArrowDown" ? 1 : items.length - 1)) % items.length]; n.focus(); sfx("hover"); }
    else if (k === "Enter" && i < 0) { e.preventDefault(); items[0].click(); }
    else if (k === "Escape" && panel) { $("lpBack").click(); }
  } else if (state === "wizard" && wizEl.classList.contains("show")) {
    if (k === "Enter" && e.target.tagName !== "TEXTAREA" && e.target.tagName !== "BUTTON") { e.preventDefault(); $("wzNext").click(); }
    if (k === "Escape" && CR.mode === "lvl") closeLevelUp();
  }
});

// ---------------- estado da criação ----------------
let W = null;
function newW() {
  return { race: "", sub: "", halo: "", anima: "", cls: "", spec: "", level: 1, multi: false, cls2: "", spec2: "", lvl2: 1, nat: "BR",
    method: "std", pool: STD_ARRAY.slice(), base: {}, manual: { FOR: 10, DEX: 10, CON: 10, INT: 10, SAB: 10, CHA: 10 },
    picks: {}, free: [], asi: { FOR: 0, DEX: 0, CON: 0, INT: 0, SAB: 0, CHA: 0 },
    skills: [], raceSkills: [], saveChoice: "", hp: [], codename: "", name: "", portrait: "", talents: [], titles: [] };
}
const STEPS = [
  { id: "race", t: "TIPO DE HUMANIDADE", s: "Quem o seu operador é por dentro. Cada tipo muda atributos, deslocamento e traços." },
  { id: "class", t: "CLASSE E ESPECIALIZAÇÃO", s: "A classe define vida, proficiências e testes de resistência. A especialização define as habilidades." },
  { id: "level", t: "NÍVEL DO OPERADOR", s: "Nível total do operador. A partir do 5º nível dá para ter uma segunda especialização (Classe Dupla)." },
  { id: "nat", t: "NACIONALIDADE", s: "De onde o operador vem. Define os idiomas que ele aprendeu." },
  { id: "attr", t: "ATRIBUTOS", s: "Valores base, bônus da humanidade e incrementos de nível." },
  { id: "skills", t: "PERÍCIAS", s: "Proficiências escolhidas pela classe e pela humanidade." },
  { id: "saves", t: "TESTES DE RESISTÊNCIA", s: "Os testes de resistência vêm da classe principal." },
  { id: "hp", t: "PONTOS DE VIDA", s: "1º nível: valor fixo da classe + 1 dado de vida + CON. Depois, 1 dado da classe do nível + CON." },
  { id: "extras", t: "TALENTOS E TÍTULOS", s: "Opcional. Dá para escolher agora ou adicionar depois na ficha." },
  { id: "id", t: "IDENTIDADE", s: "Codinome, nome real e uma imagem do operador (opcional)." },
  { id: "review", t: "REVISÃO FINAL", s: "Confira tudo antes de ativar o operador." },
];
let step = 0;

function openWizard(preset, st) {
  W = preset || newW(); step = st || 0; CR.mode = "new";
  if (musicTarget() > 0 && music.paused) { music.play().catch(() => {}); fadeMusic(VOL_MUSICA * vMusic); }
  state = "booting";
  veil(true, () => {
    $("titleScreen").style.display = "none";
    document.body.classList.remove("title-on");
    wizEl.classList.remove("small"); wizEl.classList.add("show");
    state = "wizard"; renderStep(); wizEl.scrollTop = 0;
    if (preset) wzMsg("OPERADOR SORTEADO // VOLTE NAS ETAPAS PARA AJUSTAR O QUE QUISER");
    veil(false, () => {});
  });
}
function wzMsg(t, err) { const m = $("wzMsg"); m.textContent = t || ""; m.classList.toggle("err", !!err); }

// ---------------- regras auxiliares ----------------
const raceOf = () => RACES[W.race];
const subOf = () => (raceOf() && raceOf().subs) ? raceOf().subs[W.sub] : null;
const haloOf = () => (subOf() && subOf().halos) ? subOf().halos[W.halo] : null;
function racePickSlots() {
  const slots = [], r = raceOf(), s = subOf(), h = haloOf();
  [r, s, h].forEach((src, si) => { const a = src && (src.asi || (src.pick ? { pick: src.pick } : null)); if (a && a.pick) a.pick.forEach((p, i) => slots.push({ key: si + "-" + i, n: p.n, of: p.of, from: si === 0 ? W.race : si === 1 ? W.sub : "Auréola " + W.halo })); });
  return slots;
}
function raceBonus() {
  const b = { FOR: 0, DEX: 0, CON: 0, INT: 0, SAB: 0, CHA: 0 }, r = raceOf(), s = subOf();
  [r, s].forEach(src => { if (src && src.asi && src.asi.fixed) for (const k in src.asi.fixed) b[k] += src.asi.fixed[k]; });
  racePickSlots().forEach(sl => { const a = W.picks[sl.key]; if (a) b[a] += sl.n; });
  if (r && r.asi && r.asi.free) W.free.forEach(a => b[a] += 1);
  return b;
}
function baseScores() {
  if (W.method === "manual") return Object.assign({}, W.manual);
  const o = {}; ATTR_LIST.forEach(k => o[k] = W.base[k] != null ? W.pool[W.base[k]] : null); return o;
}
function finalScores() {
  const b = baseScores(), rb = raceBonus(), o = {};
  ATTR_LIST.forEach(k => o[k] = b[k] == null ? null : Math.min(30, b[k] + rb[k] + (W.asi[k] || 0)));
  return o;
}
const asiCount = lvl => ASI_LEVELS.filter(l => l <= lvl).length;
const profFor = lvl => Math.floor((lvl - 1) / 4) + 2;
function autoSkillsW() { const r = raceOf(), s = subOf(); return [...((r && r.auto) || []), ...((s && s.auto) || [])]; }
function raceSkillCount() { const r = raceOf(), s = subOf(); return ((r && r.skillChoice) || 0) + ((s && s.skillChoice) || 0); }
function raceTalentCount() { const r = raceOf(), s = subOf(); return ((r && r.talent) || 0) + ((s && s.talent) || 0); }
function lvlSplit() { const l2 = W.multi ? Math.max(1, Math.min(W.level - (MULTI_MIN_LEVEL - 1), W.lvl2)) : 0; return { l1: W.level - l2, l2 }; }
function hpRows() {
  const { l1, l2 } = lvlSplit(), rows = [], c1 = CLASSES[W.cls], c2 = CLASSES[W.cls2];
  if (!c1) return rows;
  rows.push({ lbl: `1º NÍVEL // ${W.cls.toUpperCase()}`, die: c1.hitDice, fixed: c1.hp1 });
  for (let i = 2; i <= l1; i++) rows.push({ lbl: `${W.spec.toUpperCase()} NV ${i}`, die: c1.hitDice });
  for (let i = 1; i <= l2; i++) rows.push({ lbl: `${W.spec2.toUpperCase()} NV ${i}`, die: c2.hitDice });
  return rows;
}
function hpTotal() {
  const con = modOf(finalScores().CON || 10);
  return hpRows().reduce((t, r, i) => t + (r.fixed || 0) + (W.hp[i] || 0) + con, 0);
}
const pickCard = (val, on, title, body, extra = "") => `<button class="pick${on ? " on" : ""}" data-v="${esc(val)}" ${extra} data-nosfx><b>${esc(title)}</b>${body}</button>`;
const featList = feats => feats.map(f => `• <b>${esc(f.name)}</b>${f.desc ? ": " + esc(String(f.desc).split("\n")[0]).slice(0, 220) : ""}`).join("<br>");

// ---------------- etapas ----------------
const R = {};
R.race = () => {
  let h = `<div class="cards-pick">` + Object.keys(RACES).map(k => {
    const r = RACES[k];
    const asi = r.asi && r.asi.fixed ? Object.entries(r.asi.fixed).map(([a, n]) => `+${n} ${ABR[a]}`).join(" ") : r.asi && r.asi.free ? `+1 em ${r.asi.free} atributos diferentes` : "Varia por tipagem";
    return pickCard(k, W.race === k, k.toUpperCase(), `<small>DESLOC. ${r.speed} // ${asi}${r.subs ? " // " + Object.keys(r.subs).length + " TIPAGENS" : ""}</small>`, 'data-g="race"');
  }).join("") + `</div>`;
  const r = raceOf();
  if (r && r.subs) {
    h += `<div class="wz-sec"><span class="lbl">${esc(r.subLabel)}</span><div class="cards-pick">` + Object.keys(r.subs).map(k => {
      const s = r.subs[k], asi = s.asi && s.asi.fixed ? Object.entries(s.asi.fixed).map(([a, n]) => `+${n} ${ABR[a]}`).join(" ") : "";
      const pk = s.asi && s.asi.pick ? s.asi.pick.map(p => `+${p.n} ${p.of.length > 2 ? "à escolha" : p.of.map(a => ABR[a]).join("/")}`).join(" ") : "";
      return pickCard(k, W.sub === k, k.toUpperCase(), `<small>${[asi, pk, s.speed ? "DESLOC. " + s.speed : ""].filter(Boolean).join(" // ")}</small>`, 'data-g="sub"');
    }).join("") + `</div></div>`;
  }
  const s = subOf();
  if (s && s.halos) h += `<div class="wz-sec"><span class="lbl">Cor da auréola</span><div class="cards-pick">` + Object.keys(s.halos).map(k => pickCard(k, W.halo === k, k.toUpperCase(), `<small>${esc(s.halos[k].desc)}</small>`, 'data-g="halo"')).join("") + `</div></div>`;
  if (s && s.animaType) h += `<div class="wz-sec"><label><span class="lbl">Tipo de Anima (animal)</span><input class="in" id="wzAnima" value="${esc(W.anima)}" placeholder="ex.: lobo, coruja, tubarão..."></label><p class="note">${esc(s.asiNote || "")}</p></div>`;
  if (r) h += `<div class="preview"><b>TRAÇOS</b><br>${featList(r.features)}${s ? "<br>" + featList(s.features) : ""}</div>`;
  return h;
};
R.race.bind = () => {
  $("wzBody").querySelectorAll("[data-g]").forEach(b => b.onclick = () => {
    const g = b.dataset.g, v = b.dataset.v; sfx("clique");
    if (g === "race") { if (W.race !== v) { W.race = v; W.sub = ""; W.halo = ""; W.picks = {}; W.free = []; W.raceSkills = []; } }
    if (g === "sub") { if (W.sub !== v) { W.sub = v; W.halo = ""; W.picks = {}; } }
    if (g === "halo") { W.halo = v; W.picks = {}; }
    renderStep(true);
  });
  const an = $("wzAnima"); if (an) an.oninput = () => W.anima = an.value;
};
R.race.ok = () => {
  if (!W.race) return "Escolha um tipo de humanidade.";
  const r = raceOf(); if (r.subs && !W.sub) return "Escolha a tipagem.";
  const s = subOf(); if (s && s.halos && !W.halo) return "Escolha a cor da auréola.";
  return "";
};

R.class = () => {
  let h = `<div class="cards-pick">` + Object.keys(CLASSES).map(k => {
    const c = CLASSES[k];
    const sv = c.saves.map(a => ABR[a]).join(" + ") + (c.choice ? ` + ${c.choice.map(a => ABR[a]).join("/")}` : "");
    return pickCard(k, W.cls === k, k.toUpperCase(), `<small>PV 1º NÍVEL ${c.hp1} + 1d${c.hitDice} + CON // DADO d${c.hitDice}</small><small>RESISTÊNCIA ${sv} // ${c.skills.n} PERÍCIAS</small><small>COLETES ${esc(c.coletes)}</small>`, 'data-g="cls"');
  }).join("") + `</div>`;
  if (W.cls) {
    const c = CLASSES[W.cls], pas = passivesOf(W.cls);
    h += `<div class="preview"><b>${esc(W.cls.toUpperCase())}</b> // ARMAS: ${esc(c.armas)} // FERRAMENTAS: ${esc(c.ferramentas)}${pas.map(p => `<br><b>PASSIVA: ${esc(p.name)}</b> ${esc(p.desc.split("\n")[0]).slice(0, 240)}`).join("")}</div>`;
    h += `<div class="wz-sec"><span class="lbl">Especialização</span><div class="cards-pick">` + specKeys(W.cls).map(sp => {
      const d = SPEC_BOOK[W.cls][sp], f1 = d.feats.filter(f => f.lvl === 1).map(f => f.name).join(", ");
      return pickCard(sp, W.spec === sp, sp.toUpperCase(), `<small>NV 1: ${esc(f1)}</small><small>${d.feats.length} HABILIDADES ATÉ O NV 15</small>`, 'data-g="spec"');
    }).join("") + `</div></div>`;
    if (W.spec) {
      const d = SPEC_BOOK[W.cls][W.spec];
      h += `<div class="preview"><b>${esc(W.spec.toUpperCase())}</b>${d.intro ? "<br>" + esc(d.intro.split("\n")[0]) : ""}<br>${d.feats.map(f => `NV ${f.lvl} <b>${esc(f.name)}</b>`).join(" // ")}</div>`;
    }
  }
  return h;
};
R.class.bind = () => $("wzBody").querySelectorAll("[data-g]").forEach(b => b.onclick = () => {
  sfx("clique");
  if (b.dataset.g === "cls") { if (W.cls !== b.dataset.v) { W.cls = b.dataset.v; W.spec = ""; W.skills = []; W.saveChoice = ""; W.hp = []; } }
  else W.spec = b.dataset.v;
  renderStep(true);
});
R.class.ok = () => !W.cls ? "Escolha a classe." : !W.spec ? "Escolha a especialização." : "";

R.level = () => {
  const { l1, l2 } = lvlSplit();
  let h = `<div class="lvl-pick"><button class="step big" data-lv="-1" data-nosfx>−</button><div class="big-num" id="wzLv">${W.level}</div><button class="step big" data-lv="1" data-nosfx>+</button></div>
    <input type="range" class="lvl-range" id="wzLvR" min="1" max="20" value="${W.level}">
    <div class="preview">PROFICIÊNCIA <b>${fmt(profFor(W.level))}</b> // P.E. BASE <b>${peBaseFor(W.level)}</b> // INCREMENTOS <b>${asiCount(W.level)}</b> // TÍTULOS <b>${TITLE_LEVELS.filter(l => l <= W.level).length}</b> // ITENS DE BOLSO <b>${2 + POCKET_LEVELS.filter(l => l <= W.level).length}</b></div>`;
  if (W.level >= MULTI_MIN_LEVEL) {
    h += `<div class="wz-sec"><label class="chk"><input type="checkbox" class="ck big" id="wzMulti" ${W.multi ? "checked" : ""}>O OPERADOR TEM MULTI-ESPECIALIZAÇÃO (CLASSE DUPLA)</label>
      <p class="note">Livro: a partir do 5º nível o operador pode ter níveis numa 2ª especialização, da mesma classe ou de outra (máximo 2). Cada especialização conta só os próprios níveis para liberar habilidades. Da outra classe ele recebe só proficiências de coletes e armas; da mesma classe, nenhuma proficiência nova.</p></div>`;
    if (W.multi) {
      h += `<div class="wz-sec"><span class="lbl">Classe da 2ª especialização</span><div class="cards-pick mini">` + Object.keys(CLASSES).map(k => pickCard(k, W.cls2 === k, k.toUpperCase(), `<small>DADO d${CLASSES[k].hitDice}</small>`, 'data-g="cls2"')).join("") + `</div></div>`;
      if (W.cls2) h += `<div class="wz-sec"><span class="lbl">2ª especialização</span><div class="cards-pick mini">` + specKeys(W.cls2).filter(sp => !(W.cls2 === W.cls && sp === W.spec)).map(sp => pickCard(sp, W.spec2 === sp, sp.toUpperCase(), "", 'data-g="spec2"')).join("") + `</div></div>`;
      h += `<div class="wz-sec"><span class="lbl">Divisão dos níveis</span>
        <div class="split"><div><small>${esc(W.spec.toUpperCase())}</small><b>${l1}</b></div><input type="range" id="wzL2" min="1" max="${W.level - (MULTI_MIN_LEVEL - 1)}" value="${l2}"><div><small>${esc((W.spec2 || "2ª ESPEC.").toUpperCase())}</small><b>${l2}</b></div></div>
        <p class="note">A 2ª especialização só começa a partir do 5º nível total, então a 1ª tem pelo menos ${MULTI_MIN_LEVEL - 1} níveis.</p></div>`;
    }
  }
  return h;
};
R.level.bind = () => {
  const set = v => { const nv = Math.max(1, Math.min(20, v)); if (nv === W.level) { sfx("errado"); return; } W.level = nv; if (W.level < MULTI_MIN_LEVEL) W.multi = false; W.hp = []; W.asi = { FOR: 0, DEX: 0, CON: 0, INT: 0, SAB: 0, CHA: 0 }; sfx("clique"); renderStep(true); };
  $("wzBody").querySelectorAll("[data-lv]").forEach(b => b.onclick = e => set(W.level + (+b.dataset.lv) * (e.shiftKey ? 5 : 1)));
  $("wzLvR").oninput = e => { W.level = +e.target.value; if (W.level < MULTI_MIN_LEVEL) W.multi = false; W.hp = []; W.asi = { FOR: 0, DEX: 0, CON: 0, INT: 0, SAB: 0, CHA: 0 }; renderStep(true, true); };
  const m = $("wzMulti"); if (m) m.onchange = () => { W.multi = m.checked; W.hp = []; renderStep(true); };
  $("wzBody").querySelectorAll("[data-g]").forEach(b => b.onclick = () => { sfx("clique"); if (b.dataset.g === "cls2") { W.cls2 = b.dataset.v; W.spec2 = ""; } else W.spec2 = b.dataset.v; W.hp = []; renderStep(true); });
  const l2 = $("wzL2"); if (l2) l2.oninput = () => { W.lvl2 = +l2.value; W.hp = []; renderStep(true, true); };
};
R.level.ok = () => W.multi && (!W.cls2 || !W.spec2) ? "Escolha a classe e a 2ª especialização, ou desmarque a multi-especialização." : "";

R.nat = () => `<input class="in" id="wzNatQ" placeholder="BUSCAR PAÍS..." autocomplete="off">
  <div class="nat-grid" id="wzNat">${natCodes.map(c => `<button class="nat-c${W.nat === c ? " on" : ""}" data-v="${c}" data-nosfx>${flagHTML(c)}<span>${esc(COUNTRIES[c])}</span></button>`).join("")}</div>`;
R.nat.bind = () => {
  const q = $("wzNatQ");
  q.oninput = () => { const t = natNorm(q.value); $("wzNat").querySelectorAll(".nat-c").forEach(b => b.classList.toggle("hidden", !natNorm(b.textContent).includes(t))); };
  $("wzNat").querySelectorAll(".nat-c").forEach(b => b.onclick = () => { W.nat = b.dataset.v; sfx("clique"); $("wzNat").querySelectorAll(".nat-c").forEach(x => x.classList.toggle("on", x === b)); wzMsg(""); });
  const cur = $("wzNat").querySelector(".on"); if (cur) cur.scrollIntoView({ block: "nearest" });
};
R.nat.ok = () => W.nat ? "" : "Escolha a nacionalidade.";

R.attr = () => {
  const b = baseScores(), rb = raceBonus(), fin = finalScores(), r = raceOf(), slots = racePickSlots(), nAsi = asiCount(W.level);
  const used = ATTR_LIST.reduce((t, k) => t + (W.asi[k] || 0), 0);
  let h = `<div class="seg">${[["std", "CONJUNTO PADRÃO"], ["roll", "ROLAGEM 4d6"], ["manual", "MANUAL"]].map(([v, l]) => `<button class="btn sm${W.method === v ? " on" : ""}" data-m="${v}" data-nosfx>${l}</button>`).join("")}</div>
    <p class="note">${W.method === "std" ? "Distribua 15, 14, 13, 12, 10 e 8 entre os atributos (cada valor uma vez)." : W.method === "roll" ? "Role 4d6 seis vezes, descartando o menor dado de cada rolagem, e distribua os resultados." : "Digite os valores combinados com o Mestre (3 a 18)."} O livro não fixa um método, então combine com o Mestre.</p>`;
  if (W.method === "roll") h += `<button class="btn acc" id="wzRoll" data-nosfx>ROLAR ATRIBUTOS</button> <span class="note">${W.pool.length && W.rolled ? "RESULTADOS: " + W.pool.join(", ") : ""}</span>`;
  h += `<table class="attr-tbl"><tr><th>ATRIBUTO</th><th>BASE</th><th>HUMANIDADE</th>${nAsi ? `<th>INCREMENTOS</th>` : ""}<th>FINAL</th><th>MOD</th></tr>`;
  ATTR_LIST.forEach(k => {
    let cell;
    if (W.method === "manual") cell = `<input class="in" type="number" min="3" max="18" data-man="${k}" value="${W.manual[k]}">`;
    else cell = `<select class="sel" data-as="${k}"><option value="">--</option>${W.pool.map((v, i) => { const taken = Object.entries(W.base).some(([kk, ii]) => kk !== k && ii === i); return `<option value="${i}"${W.base[k] === i ? " selected" : ""}${taken ? " disabled" : ""}>${v}</option>`; }).join("")}</select>`;
    h += `<tr><td>${ATTRIBUTES[k]}</td><td>${cell}</td><td>${rb[k] ? "+" + rb[k] : "--"}</td>${nAsi ? `<td><button class="step" data-asi="${k}" data-d="-1" data-nosfx>−</button> ${W.asi[k] ? "+" + W.asi[k] : "0"} <button class="step" data-asi="${k}" data-d="1" data-nosfx>+</button></td>` : ""}<td class="fin">${fin[k] ?? "--"}</td><td>${fin[k] == null ? "--" : fmt(modOf(fin[k]))}</td></tr>`;
  });
  h += `</table>`;
  if (slots.length) h += `<div class="wz-sec"><span class="lbl">Bônus à escolha da humanidade</span><div class="slot-row">${slots.map(sl => `<label><small>+${sl.n} // ${esc(sl.from)}</small><select class="sel" data-slot="${sl.key}"><option value="">--</option>${sl.of.map(a => `<option value="${a}"${W.picks[sl.key] === a ? " selected" : ""}>${ATTRIBUTES[a]}</option>`).join("")}</select></label>`).join("")}</div></div>`;
  if (r && r.asi && r.asi.free) h += `<div class="wz-sec"><span class="lbl">Humano: +1 em ${r.asi.free} atributos diferentes (${W.free.length}/${r.asi.free})</span><div class="seg">${ATTR_LIST.map(a => `<button class="btn sm${W.free.includes(a) ? " on" : ""}" data-free="${a}" data-nosfx>${ABR[a]}</button>`).join("")}</div></div>`;
  if (nAsi) h += `<p class="note">Incrementos de nível (${ASI_LEVELS.filter(l => l <= W.level).join("º, ")}º): ${nAsi * 2} pontos, usados <b>${used}</b>. Máximo 20 por atributo. Se preferir um talento no lugar de um incremento, deixe 2 pontos sem usar e escolha o talento na etapa de talentos.</p>`;
  return h;
};
R.attr.bind = () => {
  const body = $("wzBody");
  body.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { W.method = b.dataset.m; W.base = {}; if (W.method === "std") W.pool = STD_ARRAY.slice(); if (W.method === "roll") { W.pool = W.rolledPool || []; W.rolled = !!W.rolledPool; } sfx("clique"); renderStep(true); });
  const rb = $("wzRoll"); if (rb) rb.onclick = () => { W.pool = Array.from({ length: 6 }, () => { const r = [d6(6), d6(6), d6(6), d6(6)].sort((a, b) => a - b); return r[1] + r[2] + r[3]; }).sort((a, b) => b - a); W.rolledPool = W.pool; W.rolled = true; W.base = {}; sfx("clique"); renderStep(true); };
  body.querySelectorAll("[data-as]").forEach(s => s.onchange = () => { if (s.value === "") delete W.base[s.dataset.as]; else W.base[s.dataset.as] = +s.value; renderStep(true); });
  body.querySelectorAll("[data-man]").forEach(s => s.onchange = () => { W.manual[s.dataset.man] = Math.max(3, Math.min(18, +s.value || 10)); renderStep(true); });
  body.querySelectorAll("[data-slot]").forEach(s => s.onchange = () => { W.picks[s.dataset.slot] = s.value; renderStep(true); });
  body.querySelectorAll("[data-free]").forEach(b => b.onclick = () => { const a = b.dataset.free, i = W.free.indexOf(a), max = raceOf().asi.free; if (i >= 0) W.free.splice(i, 1); else if (W.free.length < max) W.free.push(a); else { sfx("errado"); return; } sfx("clique"); renderStep(true); });
  body.querySelectorAll("[data-asi]").forEach(b => b.onclick = () => {
    const k = b.dataset.asi, d = +b.dataset.d, used = ATTR_LIST.reduce((t, a) => t + W.asi[a], 0), fin = finalScores();
    if (d > 0 && (used >= asiCount(W.level) * 2 || (fin[k] || 0) >= 20)) { sfx("errado"); return; }
    if (d < 0 && !W.asi[k]) { sfx("errado"); return; }
    W.asi[k] += d; sfx("clique"); renderStep(true);
  });
};
R.attr.ok = () => {
  const b = baseScores(); if (ATTR_LIST.some(k => b[k] == null)) return W.method === "roll" && !W.rolled ? "Role os atributos." : "Distribua um valor para cada atributo.";
  if (racePickSlots().some(sl => !W.picks[sl.key])) return "Escolha os bônus da humanidade.";
  const r = raceOf(); if (r.asi && r.asi.free && W.free.length !== r.asi.free) return `Escolha ${r.asi.free} atributos para o +1 do Humano.`;
  return "";
};

R.skills = () => {
  const c = CLASSES[W.cls], auto = autoSkillsW(), fin = finalScores(), prof = profFor(W.level), nRace = raceSkillCount();
  const all = new Set([...W.skills, ...W.raceSkills, ...auto]);
  const row = (s, mode) => {
    const on = mode === "cls" ? W.skills.includes(s) : W.raceSkills.includes(s), lock = auto.includes(s);
    const taken = !on && !lock && (mode === "cls" ? W.raceSkills.includes(s) : W.skills.includes(s));
    const bonus = modOf(fin[SKILLS[s]] || 10) + (all.has(s) || lock ? prof : 0);
    return `<button class="sk${on || lock ? " on" : ""}${lock ? " lock" : ""}${taken ? " dim" : ""}" data-sk="${esc(s)}" data-mode="${mode}" data-nosfx>${lock ? "■" : on ? "▣" : "□"} ${esc(s)} <em>${ABR[SKILLS[s]]}</em><small>${fmt(bonus)}</small></button>`;
  };
  let h = `<div class="wz-sec" style="margin-top:0"><span class="lbl">Perícias da classe ${esc(W.cls)} (${W.skills.length}/${c.skills.n})</span><div class="skill-grid">${c.skills.from.slice().sort((a, b) => a.localeCompare(b, "pt")).map(s => row(s, "cls")).join("")}</div></div>`;
  if (nRace) h += `<div class="wz-sec"><span class="lbl">Perícia da humanidade, qualquer uma (${W.raceSkills.length}/${nRace})</span><div class="skill-grid">${SKILL_ORDER.map(s => row(s, "race")).join("")}</div></div>`;
  if (auto.length) h += `<p class="note">Automáticas da humanidade: <b>${auto.join(", ")}</b> (■).</p>`;
  return h;
};
R.skills.bind = () => $("wzBody").querySelectorAll("[data-sk]").forEach(b => b.onclick = () => {
  const s = b.dataset.sk, mode = b.dataset.mode, list = mode === "cls" ? W.skills : W.raceSkills, other = mode === "cls" ? W.raceSkills : W.skills;
  const max = mode === "cls" ? CLASSES[W.cls].skills.n : raceSkillCount();
  if (autoSkillsW().includes(s) || other.includes(s)) { sfx("errado"); wzMsg("Essa perícia já vem de outra fonte.", true); return; }
  const i = list.indexOf(s);
  if (i >= 0) list.splice(i, 1); else if (list.length < max) list.push(s); else { sfx("errado"); wzMsg(`Limite de ${max} perícias aqui. Desmarque uma antes.`, true); return; }
  sfx("clique"); renderStep(true);
});
R.skills.ok = () => { const n = CLASSES[W.cls].skills.n; if (W.skills.length < n) return `Escolha ${n} perícias da classe.`; if (W.raceSkills.length < raceSkillCount()) return "Escolha a perícia da humanidade."; return ""; };

R.saves = () => {
  const c = CLASSES[W.cls], fin = finalScores(), prof = profFor(W.level);
  let h = `<div class="cards-pick">` + ATTR_LIST.map(k => {
    const fixed = c.saves.includes(k), ch = c.choice && c.choice.includes(k), on = fixed || W.saveChoice === k;
    const bonus = modOf(fin[k] || 10) + (on ? prof : 0);
    return `<button class="pick${on ? " on" : ""}${!fixed && !ch ? " off" : ""}" data-sv="${k}" data-nosfx><b>${ATTRIBUTES[k].toUpperCase()} ${fmt(bonus)}</b><small>${fixed ? "PROFICIENTE PELA CLASSE" : ch ? "ESCOLHA DA CLASSE" : "SEM PROFICIÊNCIA"}</small></button>`;
  }).join("") + `</div>`;
  if (c.choice) h += `<p class="note">${esc(W.cls)}: escolha entre ${c.choice.map(a => ATTRIBUTES[a]).join(" ou ")}.</p>`;
  if (W.multi && W.cls2 !== W.cls) h += `<p class="note">Os testes de resistência de ${esc(W.cls2)} não são herdados pela 2ª especialização.</p>`;
  return h;
};
R.saves.bind = () => $("wzBody").querySelectorAll("[data-sv]").forEach(b => b.onclick = () => {
  const c = CLASSES[W.cls], k = b.dataset.sv;
  if (!(c.choice && c.choice.includes(k))) { sfx("errado"); return; }
  W.saveChoice = k; sfx("clique"); renderStep(true);
});
R.saves.ok = () => CLASSES[W.cls].choice && !W.saveChoice ? "Escolha o teste de resistência da classe." : "";

R.hp = () => {
  const rows = hpRows(), con = modOf(finalScores().CON || 10);
  let h = `<div class="hp-tbl">` + rows.map((r, i) => `<div class="hp-r"><span>${esc(r.lbl)}</span><em>${r.fixed ? r.fixed + " + " : ""}1d${r.die} ${con >= 0 ? "+" : "−"} ${Math.abs(con)}</em>
    <button class="btn sm die" data-roll="${i}" data-nosfx>${W.hp[i] ? "⟳ " + W.hp[i] : "ROLAR d" + r.die}</button><input class="in" type="number" min="1" max="${r.die}" data-hpm="${i}" value="${W.hp[i] || ""}" placeholder="--"><b>${W.hp[i] ? (r.fixed || 0) + W.hp[i] + con : "--"}</b></div>`).join("") + `</div>
    <div class="hp-sum"><button class="btn acc" id="wzRollAll" data-nosfx>ROLAR TODOS</button><div><small>PONTOS DE VIDA MÁXIMOS</small><b class="big-num">${W.hp.filter(Boolean).length === rows.length ? hpTotal() : "--"}</b></div></div>
    <p class="note">O valor fixo do 1º nível (${CLASSES[W.cls].hp1}) vale só para a classe principal. Se o Mestre usar média ou outro valor, digite no campo.</p>`;
  return h;
};
R.hp.bind = () => {
  const rows = hpRows();
  $("wzBody").querySelectorAll("[data-roll]").forEach(b => b.onclick = () => { const i = +b.dataset.roll; W.hp[i] = d6(rows[i].die); sfx("clique"); renderStep(true); });
  $("wzBody").querySelectorAll("[data-hpm]").forEach(s => s.onchange = () => { const i = +s.dataset.hpm; W.hp[i] = Math.max(1, Math.min(rows[i].die, +s.value || 0)) || 0; renderStep(true); });
  $("wzRollAll").onclick = () => { rows.forEach((r, i) => W.hp[i] = d6(r.die)); sfx("abrir"); renderStep(true); };
};
R.hp.ok = () => hpRows().every((r, i) => W.hp[i]) ? "" : "Role (ou digite) todos os dados de vida.";

R.extras = () => {
  const nTal = raceTalentCount(), nTit = TITLE_LEVELS.filter(l => l <= W.level).length, fin = finalScores();
  const reqOk = t => {
    if (!t.req) return true; const m = /(Força|Destreza|Constituição|Inteligência|Sabedoria|Carisma)(?:\/(Força|Destreza))?\s+(\d+)\s+ou maior/i.exec(t.req);
    if (!m) return true; const key = n => ATTR_LIST.find(a => ATTRIBUTES[a].toLowerCase() === n.toLowerCase());
    return [m[1], m[2]].filter(Boolean).some(n => (fin[key(n)] || 0) >= +m[3]);
  };
  const list = (arr, sel, kind, max) => `<input class="in wz-q" data-q="${kind}" placeholder="BUSCAR..."><div class="tal-list">${arr.map((t, i) => `<details class="tal${sel.includes(t.name) ? " on" : ""}${reqOk(t) ? "" : " noreq"}" data-k="${kind}" data-i="${i}"><summary><button class="ck-b" data-tk="${kind}" data-ti="${i}" data-nosfx>${sel.includes(t.name) ? "▣" : "□"}</button><span>${esc(t.name)}</span>${t.req ? `<small>${esc(t.req)}</small>` : ""}</summary><div class="fd">${esc(t.desc).replace(/\n/g, "<br>")}</div></details>`).join("")}</div>`;
  return `<div class="grid g2" style="gap:18px"><div><span class="lbl">Talentos (${W.talents.length}${nTal ? "/" + nTal + " da humanidade" : ""})</span>${list(TALENTOS, W.talents, "tal")}</div>
    <div><span class="lbl">Títulos de personagem (${W.titles.length}/${nTit} até o nível ${W.level})</span>${list(TITULOS, W.titles, "tit")}</div></div>
    <p class="note">Talentos vêm da humanidade (${nTal}) ou trocando um incremento de atributo. Títulos são ganhos nos níveis ${TITLE_LEVELS.join(", ")}. Pré-requisitos não atendidos ficam esmaecidos, mas o Mestre pode liberar.</p>`;
};
R.extras.bind = () => {
  $("wzBody").querySelectorAll("[data-tk]").forEach(b => b.onclick = e => {
    e.preventDefault(); const kind = b.dataset.tk, arr = kind === "tal" ? TALENTOS : TITULOS, sel = kind === "tal" ? W.talents : W.titles, name = arr[+b.dataset.ti].name;
    const maxTit = TITLE_LEVELS.filter(l => l <= W.level).length;
    const i = sel.indexOf(name);
    if (i >= 0) sel.splice(i, 1); else { if (kind === "tit" && sel.length >= maxTit) { sfx("errado"); wzMsg(`Até o nível ${W.level} são ${maxTit} títulos.`, true); return; } sel.push(name); }
    sfx("clique"); const y = wizEl.scrollTop; renderStep(true); wizEl.scrollTop = y;
  });
  $("wzBody").querySelectorAll("[data-q]").forEach(q => q.oninput = () => { const t = natNorm(q.value); q.nextElementSibling.querySelectorAll(".tal").forEach(d => d.classList.toggle("hidden", !natNorm(d.textContent).includes(t))); });
};
R.extras.ok = () => "";

R.id = () => `<div class="grid g2" style="gap:18px"><div>
    <label class="f"><span class="lbl">Codinome *</span><input class="in" id="wzCod" value="${esc(W.codename)}" autocomplete="off" spellcheck="false"></label>
    <label class="f"><span class="lbl">Nome real</span><input class="in" id="wzName" value="${esc(W.name)}" autocomplete="off" spellcheck="false"></label>
    <p class="note">O nome real pode ficar oculto na ficha (botão do olho).</p></div>
    <div><span class="lbl">Imagem do operador (opcional)</span><label class="wz-img">${W.portrait ? `<img src="${esc(W.portrait)}" alt="">` : "▸ ENVIAR IMAGEM"}<input type="file" accept="image/*" id="wzImg"></label>${W.portrait ? `<button class="btn sm" id="wzImgX" data-nosfx>REMOVER</button>` : ""}</div></div>`;
R.id.bind = () => {
  $("wzCod").oninput = e => W.codename = e.target.value; $("wzName").oninput = e => W.name = e.target.value;
  $("wzImg").onchange = async e => { const f = e.target.files[0]; if (!f) return; try { W.portrait = await readImage(f, 420); sfx("clique"); renderStep(true); } catch (err) { sfx("errado"); toast("NÃO FOI POSSÍVEL LER A IMAGEM", true); } };
  const x = $("wzImgX"); if (x) x.onclick = () => { W.portrait = ""; sfx("fechar"); renderStep(true); };
  setTimeout(() => $("wzCod").focus(), 30);
};
R.id.ok = () => W.codename.trim() ? "" : "Dê um codinome ao operador.";

R.review = () => {
  const fin = finalScores(), { l1, l2 } = lvlSplit(), c = CLASSES[W.cls];
  const saves = ATTR_LIST.filter(k => c.saves.includes(k) || W.saveChoice === k).map(k => ATTRIBUTES[k]).join(", ");
  const sk = [...W.skills, ...W.raceSkills, ...autoSkillsW()];
  return `<div class="review">${W.portrait ? `<img class="rv-img" src="${esc(W.portrait)}" alt="">` : ""}
    <div><h3>${esc(W.codename.toUpperCase())}</h3><small>${esc(W.name || "NOME REAL NÃO INFORMADO")} // ${esc(COUNTRIES[W.nat] || "")}</small>
    <p><b>${esc(W.race)}${W.sub ? " // " + esc(W.sub) : ""}${W.halo ? " (auréola " + esc(W.halo) + ")" : ""}${W.anima ? " (" + esc(W.anima) + ")" : ""}</b></p>
    <p>${esc(W.cls)} // ${esc(W.spec)} NV ${l1}${W.multi ? ` &nbsp;+&nbsp; ${esc(W.cls2)} // ${esc(W.spec2)} NV ${l2}` : ""} &nbsp;=&nbsp; <b>NÍVEL ${W.level}</b></p>
    <p>${ATTR_LIST.map(k => `${ABR[k]} <b>${fin[k]}</b> (${fmt(modOf(fin[k]))})`).join(" &nbsp; ")}</p>
    <p>PV <b>${hpTotal()}</b> // PROF. <b>${fmt(profFor(W.level))}</b> // P.E. BASE <b>${peBaseFor(W.level)}</b> // DESLOC. <b>${esc((subOf() && subOf().speed) || raceOf().speed)}</b></p>
    <p>RESISTÊNCIA: ${esc(saves)}</p><p>PERÍCIAS: ${esc(sk.join(", "))}</p>
    ${W.talents.length ? `<p>TALENTOS: ${esc(W.talents.join(", "))}</p>` : ""}${W.titles.length ? `<p>TÍTULOS: ${esc(W.titles.join(", "))}</p>` : ""}</div></div>`;
};
R.review.ok = () => "";

// ---------------- render da etapa ----------------
function renderStep(keep, quiet) {
  const st = STEPS[step];
  $("wzSteps").innerHTML = STEPS.map((s, i) => `<i class="${i < step ? "done" : i === step ? "cur" : ""}" title="${s.t}"></i>`).join("");
  $("wzCount").textContent = `ETAPA ${String(step + 1).padStart(2, "0")}/${STEPS.length}`;
  $("wzTitle").textContent = st.t; $("wzSub").textContent = st.s;
  const y = wizEl.scrollTop;
  $("wzBody").innerHTML = R[st.id]();
  if (R[st.id].bind) R[st.id].bind();
  $("wzBack").textContent = step === 0 ? "CANCELAR" : "VOLTAR";
  $("wzNext").textContent = step === STEPS.length - 1 ? "ATIVAR OPERADOR" : "PRÓXIMO";
  if (!quiet) wzMsg("");
  if (keep) wizEl.scrollTop = y; else wizEl.scrollTop = 0;
  if (!keep) { const b = $("wzBody"); b.classList.remove("glitch"); void b.offsetWidth; b.classList.add("glitch"); }
}
$("wzNext").onclick = () => {
  if (CR.mode === "lvl") return lvlNext();
  const err = R[STEPS[step].id].ok();
  if (err) { sfx("errado"); wzMsg(err, true); return; }
  if (step === STEPS.length - 1) { sfx("clique"); finishWizard(); return; }
  step++; sfx("abrir"); renderStep();
};
$("wzBack").onclick = async () => {
  if (CR.mode === "lvl") return lvlBack();
  if (step === 0) {
    sfx("clique");
    if (!await ask("Cancelar a criação e voltar para a tela inicial?", { top: "CANCELAR", yes: "VOLTAR AO INÍCIO", no: "CONTINUAR CRIANDO" })) return;
    wizEl.classList.remove("show"); $("titleScreen").style.display = ""; document.body.classList.add("title-on"); state = "title"; $("newBtn").focus(); return;
  }
  step--; sfx("fechar"); renderStep();
};

// ---------------- aplica a criação na ficha ----------------
function finishWizard() {
  FICHAS.setCurrent(null);   // operador novo entra como ficha nova na lista
  resetForm();
  const fin = finalScores(), { l2 } = lvlSplit();
  $("char-race").value = W.race; rebuildSub(W.sub, W.halo); $("char-anima").value = W.anima || "";
  $("char-class").value = W.cls; rebuildSpec(W.spec);
  $("char-level").value = W.level;
  if (W.multi) { $("char-multi").checked = true; $("char-class2").value = W.cls2; rebuildSpec2(W.spec2); $("char-lvl2").value = l2; }
  setNat(W.nat);
  ATTR_LIST.forEach(k => $("score-" + k.toLowerCase()).value = fin[k]);
  [...W.skills, ...W.raceSkills].forEach(s => { const el = $(skillId(s)); if (el) el.checked = true; });
  if (W.saveChoice) $("prof-save-" + W.saveChoice.toLowerCase()).checked = true;
  const hp = hpTotal(); $("char-hp-max").value = hp; $("char-hp-current").value = hp;
  $("char-speed").value = raceSpeed();
  $("char-codename").value = W.codename.trim(); $("char-name").value = W.name.trim();
  setPortrait(W.portrait);
  W.talents.forEach(n => { const t = TALENTOS.find(x => x.name === n); LISTS.talents.push({ name: t.name, desc: t.desc }); });
  W.titles.forEach(n => { const t = TITULOS.find(x => x.name === n); LISTS.titles.push({ name: t.name, desc: t.desc }); });
  $("char-backstory").value = "";
  if (window.MOD) MOD.load(null);
  update(); renderAll(); updateInjuries(); fxManual.clear();
  $("char-pvon").value = $("pvonMax").textContent; update();
  enterSheet();
  setTimeout(() => toast(`OPERADOR ${W.codename.trim().toUpperCase()} ATIVADO`), 1400);
}

// =====================================================================
// SUBIR DE NÍVEL
// =====================================================================
let LU = null;
function openLevelUp() {
  const L = lvlInfo();
  if (L.total >= 20) { sfx("errado"); toast("NÍVEL MÁXIMO (20)", true); return; }
  const nt = L.total + 1;
  LU = { nt, L, target: L.multi ? "" : "s1", newC2: "", newS2: "", die: 0, asiMode: "", asiA: "", asiB: "", talent: "", title: "", step: 0 };
  if (!L.multi && nt < MULTI_MIN_LEVEL) LU.target = "s1";
  CR.mode = "lvl"; state = "wizard";
  wizEl.classList.add("small", "show");
  $("wzTag").textContent = "141 // SUBIR DE NÍVEL";
  luRender(); sfx("abrir");
}
function closeLevelUp() { wizEl.classList.remove("show", "small"); CR.mode = ""; state = "sheet"; $("wzTag").textContent = "141 // CRIAÇÃO DE OPERADOR"; sfx("fechar"); }
function luSpec() {
  const L = LU.L;
  if (LU.target === "s1") return { c: L.c1, s: L.s1, lv: L.l1 + 1 };
  if (LU.target === "s2") return { c: L.c2, s: L.s2, lv: L.l2 + 1 };
  if (LU.target === "new") return { c: LU.newC2, s: LU.newS2, lv: 1 };
  return null;
}
function luSteps() {
  const s = ["spec", "hp"];
  if (ASI_LEVELS.includes(LU.nt)) s.push("asi");
  if (TITLE_LEVELS.includes(LU.nt)) s.push("title");
  s.push("sum"); return s;
}
function luRender() {
  const steps = luSteps(), id = steps[LU.step], L = LU.L, sp = luSpec(), mods = getMods();
  $("wzSteps").innerHTML = steps.map((x, i) => `<i class="${i < LU.step ? "done" : i === LU.step ? "cur" : ""}"></i>`).join("");
  $("wzCount").textContent = `NÍVEL ${L.total} → ${LU.nt}`;
  let t = "", sub = "", h = "";
  if (id === "spec") {
    t = "ONDE ENTRA O NÍVEL"; sub = L.multi ? "Com Classe Dupla, você escolhe em qual especialização o nível entra." : LU.nt >= MULTI_MIN_LEVEL ? "A partir do 5º nível você pode começar uma 2ª especialização (Classe Dupla)." : "O nível entra na sua especialização.";
    h = `<div class="cards-pick">` + pickCard("s1", LU.target === "s1", `${L.s1} → NV ${L.l1 + 1}`, `<small>${esc(L.c1.toUpperCase())} // d${CLASSES[L.c1].hitDice}</small>`, 'data-g="t"');
    if (L.multi) h += pickCard("s2", LU.target === "s2", `${L.s2} → NV ${L.l2 + 1}`, `<small>${esc(L.c2.toUpperCase())} // d${CLASSES[L.c2].hitDice}</small>`, 'data-g="t"');
    else if (LU.nt >= MULTI_MIN_LEVEL) h += pickCard("new", LU.target === "new", "NOVA MULTI-ESPECIALIZAÇÃO", `<small>COMEÇA UMA 2ª ESPECIALIZAÇÃO NO NV 1</small>`, 'data-g="t"');
    h += `</div>`;
    if (LU.target === "new") {
      h += `<div class="wz-sec"><span class="lbl">Classe</span><div class="cards-pick mini">` + Object.keys(CLASSES).map(k => pickCard(k, LU.newC2 === k, k.toUpperCase(), `<small>d${CLASSES[k].hitDice}</small>`, 'data-g="c2"')).join("") + `</div></div>`;
      if (LU.newC2) h += `<div class="wz-sec"><span class="lbl">Especialização</span><div class="cards-pick mini">` + specKeys(LU.newC2).filter(k => !(LU.newC2 === L.c1 && k === L.s1)).map(k => pickCard(k, LU.newS2 === k, k.toUpperCase(), "", 'data-g="s2"')).join("") + `</div></div>`;
      h += `<p class="note">Da outra classe você recebe só proficiências de coletes e armas. Habilidades compartilhadas (Gambiarra, Surto de Ação...) não acumulam usos.</p>`;
    }
    if (sp && sp.s) { const nf = ((SPEC_BOOK[sp.c] || {})[sp.s] || { feats: [] }).feats.filter(f => f.lvl === sp.lv); if (nf.length) h += `<div class="preview"><b>NOVO NO NV ${sp.lv} DE ${esc(sp.s.toUpperCase())}:</b> ${nf.map(f => esc(f.name)).join(", ")}</div>`; }
  } else if (id === "hp") {
    const die = CLASSES[sp.c].hitDice, con = mods.CON;
    t = "PONTOS DE VIDA"; sub = `1d${die} (${sp.c}) + modificador de Constituição (${fmt(con)}).`;
    h = `<div class="hp-sum"><button class="btn acc" id="luRoll" data-nosfx>${LU.die ? "ROLAR DE NOVO" : "ROLAR d" + die}</button><input class="in" type="number" id="luDie" min="1" max="${die}" value="${LU.die || ""}" placeholder="--" style="width:80px;text-align:center"><div><small>PV GANHOS</small><b class="big-num">${LU.die ? Math.max(1, LU.die + con) : "--"}</b></div></div>
      <p class="note">PV máximos: ${esc($("char-hp-max").value || "0")} → <b>${LU.die ? nz($("char-hp-max").value) + Math.max(1, LU.die + con) : "--"}</b>. Os PV atuais sobem o mesmo tanto.</p>`;
  } else if (id === "asi") {
    t = "INCREMENTO NO VALOR DE HABILIDADE"; sub = `Nível ${LU.nt}: +2 em um atributo, +1 em dois, ou um talento no lugar. Máximo 20.`;
    const opt = (v, l) => `<button class="btn sm${LU.asiMode === v ? " on" : ""}" data-am="${v}" data-nosfx>${l}</button>`;
    h = `<div class="seg">${opt("2", "+2 EM UM")}${opt("11", "+1 EM DOIS")}${opt("tal", "TALENTO")}</div>`;
    const sel = (id2, v) => `<select class="sel" id="${id2}"><option value="">--</option>${ATTR_LIST.map(k => { const sc = num("score-" + k.toLowerCase(), 10); return `<option value="${k}"${v === k ? " selected" : ""}${sc >= 20 ? " disabled" : ""}>${ATTRIBUTES[k]} (${sc})</option>`; }).join("")}</select>`;
    if (LU.asiMode === "2") h += `<div class="slot-row"><label><small>+2</small>${sel("luA", LU.asiA)}</label></div>`;
    if (LU.asiMode === "11") h += `<div class="slot-row"><label><small>+1</small>${sel("luA", LU.asiA)}</label><label><small>+1</small>${sel("luB", LU.asiB)}</label></div>`;
    if (LU.asiMode === "tal") h += `<select class="sel" id="luTal"><option value="">-- escolha um talento --</option>${TALENTOS.map(x => `<option${LU.talent === x.name ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</select>${LU.talent ? `<div class="preview">${esc(TALENTOS.find(x => x.name === LU.talent).desc).replace(/\n/g, "<br>")}</div>` : ""}`;
  } else if (id === "title") {
    t = "TÍTULO DE PERSONAGEM"; sub = `Nível ${LU.nt} dá um título novo (opcional).`;
    h = `<select class="sel" id="luTit"><option value="">-- sem título agora --</option>${TITULOS.map(x => `<option${LU.title === x.name ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</select>${LU.title ? `<div class="preview">${esc(TITULOS.find(x => x.name === LU.title).desc)}</div>` : ""}`;
  } else {
    t = "RESUMO"; sub = "Confira e confirme.";
    const nf = ((SPEC_BOOK[sp.c] || {})[sp.s] || { feats: [] }).feats.filter(f => f.lvl === sp.lv);
    const li = [];
    li.push(`<b>${esc(sp.s.toUpperCase())}</b> passa para o nível <b>${sp.lv}</b>${LU.target === "new" ? " (nova multi-especialização)" : ""}.`);
    li.push(`PV máximos <b>+${Math.max(1, LU.die + mods.CON)}</b>.`);
    if (profFor(LU.nt) > profFor(L.total)) li.push(`Bônus de proficiência sobe para <b>${fmt(profFor(LU.nt))}</b>.`);
    if (peBaseFor(LU.nt) > peBaseFor(L.total)) li.push(`P.E. base sobe para <b>${peBaseFor(LU.nt)}</b>.`);
    if (POCKET_LEVELS.includes(LU.nt)) li.push(`Você pode carregar <b>+1 Item de Bolso</b>.`);
    if (LU.asiMode === "2" && LU.asiA) li.push(`${ATTRIBUTES[LU.asiA]} <b>+2</b>.`);
    if (LU.asiMode === "11") li.push(`${ATTRIBUTES[LU.asiA]} <b>+1</b> e ${ATTRIBUTES[LU.asiB]} <b>+1</b>.`);
    if (LU.asiMode === "tal" && LU.talent) li.push(`Novo talento: <b>${esc(LU.talent)}</b>.`);
    if (LU.title) li.push(`Novo título: <b>${esc(LU.title)}</b>.`);
    if (nf.length) li.push(`Habilidades novas: <b>${nf.map(f => esc(f.name)).join(", ")}</b>.`);
    h = `<div class="preview">${li.join("<br>")}</div>` + nf.map(f => featHTML(f, "spec", false)).join("");
  }
  $("wzTitle").textContent = t; $("wzSub").textContent = sub; $("wzBody").innerHTML = h;
  $("wzBack").textContent = LU.step === 0 ? "CANCELAR" : "VOLTAR";
  $("wzNext").textContent = id === "sum" ? "CONFIRMAR NÍVEL" : "PRÓXIMO";
  wzMsg("");
  // eventos
  $("wzBody").querySelectorAll("[data-g]").forEach(b => b.onclick = () => {
    sfx("clique"); const g = b.dataset.g, v = b.dataset.v;
    if (g === "t") { LU.target = v; LU.die = 0; } if (g === "c2") { LU.newC2 = v; LU.newS2 = ""; LU.die = 0; } if (g === "s2") LU.newS2 = v;
    luRender();
  });
  const rb = $("luRoll"); if (rb) rb.onclick = () => { LU.die = d6(CLASSES[luSpec().c].hitDice); sfx("clique"); luRender(); };
  const di = $("luDie"); if (di) di.onchange = () => { LU.die = Math.max(1, Math.min(CLASSES[luSpec().c].hitDice, +di.value || 0)) || 0; luRender(); };
  $("wzBody").querySelectorAll("[data-am]").forEach(b => b.onclick = () => { LU.asiMode = b.dataset.am; LU.asiA = LU.asiB = LU.talent = ""; sfx("clique"); luRender(); });
  ["luA", "luB"].forEach(x => { const s = $(x); if (s) s.onchange = () => { LU[x === "luA" ? "asiA" : "asiB"] = s.value; luRender(); }; });
  const lt = $("luTal"); if (lt) lt.onchange = () => { LU.talent = lt.value; luRender(); };
  const ti = $("luTit"); if (ti) ti.onchange = () => { LU.title = ti.value; luRender(); };
}
function lvlNext() {
  const id = luSteps()[LU.step];
  let err = "";
  if (id === "spec") { if (!LU.target) err = "Escolha onde o nível entra."; else if (LU.target === "new" && (!LU.newC2 || !LU.newS2)) err = "Escolha a classe e a especialização."; }
  if (id === "hp" && !LU.die) err = "Role (ou digite) o dado de vida.";
  if (id === "asi") {
    if (!LU.asiMode) err = "Escolha o tipo de incremento.";
    else if (LU.asiMode === "2" && !LU.asiA) err = "Escolha o atributo.";
    else if (LU.asiMode === "11" && (!LU.asiA || !LU.asiB || LU.asiA === LU.asiB)) err = "Escolha dois atributos diferentes.";
    else if (LU.asiMode === "2" && num("score-" + LU.asiA.toLowerCase(), 10) + 2 > 20) err = "Esse atributo passaria de 20.";
    else if (LU.asiMode === "tal" && !LU.talent) err = "Escolha o talento.";
  }
  if (err) { sfx("errado"); wzMsg(err, true); return; }
  if (id === "sum") { luApply(); return; }
  LU.step++; sfx("abrir"); luRender();
}
function lvlBack() { if (LU.step === 0) { closeLevelUp(); return; } LU.step--; sfx("fechar"); luRender(); }
function luApply() {
  const L = LU.L, mods = getMods(), gain = Math.max(1, LU.die + mods.CON);
  if (LU.target === "new") { $("char-multi").checked = true; $("char-class2").value = LU.newC2; rebuildSpec2(LU.newS2); $("char-lvl2").value = 1; }
  else if (LU.target === "s2") $("char-lvl2").value = L.l2 + 1;
  $("char-level").value = LU.nt;
  const mx = nz($("char-hp-max").value), cur = $("char-hp-current").value === "" ? mx : nz($("char-hp-current").value);
  $("char-hp-max").value = mx + gain; $("char-hp-current").value = cur + gain;
  const add = (k, n) => { const el = $("score-" + k.toLowerCase()); el.value = Math.min(20, num("score-" + k.toLowerCase(), 10) + n); };
  if (LU.asiMode === "2") add(LU.asiA, 2);
  if (LU.asiMode === "11") { add(LU.asiA, 1); add(LU.asiB, 1); }
  if (LU.asiMode === "tal" && LU.talent) { const t = TALENTOS.find(x => x.name === LU.talent); LISTS.talents.push({ name: t.name, desc: t.desc }); renderList("talents"); }
  if (LU.title) { const t = TITULOS.find(x => x.name === LU.title); LISTS.titles.push({ name: t.name, desc: t.desc }); renderList("titles"); }
  closeLevelUp(); changed(); sfx("abrir");
  const hud = $("hud"); hud.classList.remove("hit"); void hud.offsetWidth;
  toast(`NÍVEL ${LU.nt} // ${luSpec().s.toUpperCase()} NV ${luSpec().lv} // +${gain} PV`);
}
$("lvlUpBtn").onclick = () => { sfx("clique"); openLevelUp(); };
wizEl.addEventListener("mouseover", e => { const t = e.target.closest("summary,.lp-it.file"); if (t && !(e.relatedTarget && t.contains(e.relatedTarget))) sfx("hover"); });

