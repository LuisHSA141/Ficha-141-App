"use strict";
// =====================================================================
// 141 // ARMAMENTO (Guia das Armas)
// Formato da arma, tipagens, escala de dano por nível, faixas de alcance,
// acessórios com ganho e perda, kits de conversão e escudos.
// =====================================================================
const ARM = (() => {
  const FAIXAS = {
    corpo: { n: "Corpo a corpo", m: 0, d: "Adjacente (2m para armas longas, como lanças)" },
    curta: { n: "Curta", m: 10, d: "Até 10m" },
    media: { n: "Média", m: 30, d: "Até 30m" },
    longa: { n: "Longa", m: 60, d: "Até 60m" },
    extrema: { n: "Extrema", m: 150, d: "Até 150m" }
  };
  const FAIXA_ORD = ["corpo", "curta", "media", "longa", "extrema"];

  // tipagens (Guia das Armas). P = Proef do operador, M = modificadores, w = a arma
  const cdDes = (P, M) => 10 + P + (M.DEX || 0);
  const TIPOS = {
    pistola: { n: "Pistola", g: "fogo", faixa: "curta", semTroca: true,
      t: () => "Trocar para uma arma de mão não exige teste. Double tap: depois de atacar com uma pistola, você pode usar a Ação Bônus para fazer um segundo disparo com a mesma pistola. Esse disparo sofre Recuo normalmente." },
    revolver: { n: "Revólver", g: "fogo", faixa: "curta", semTroca: true, unicaPadrao: true,
      t: () => "Trocar para uma arma de mão não exige teste. Calibre pesado de mão: num acerto crítico com um revólver, role um dado de dano a mais, além do dobro normal. A recarga de revólveres é Única, salvo se a arma ou um acessório disser outra coisa." },
    smg: { n: "Submetralhadora", g: "fogo", faixa: "curta",
      t: (P, M) => `Depois de fazer um ataque, você pode se deslocar ${Math.max(1, M.DEX)}m (mod. de Destreza, mínimo 1) sem gastar o seu Deslocamento.` },
    ar: { n: "Fuzil de Assalto", g: "fogo", faixa: "media",
      t: P => `Uma vez por turno, depois de atacar, escolha até o fim do seu próximo turno: +${Math.floor(P / 2)} de Precisão no próximo ataque contra um alvo diferente, ou +${Math.floor(P / 2)} no dano do próximo ataque contra o mesmo alvo.` },
    shotgun: { n: "Shotgun", g: "fogo", faixa: "curta",
      t: () => "Ao acertar um alvo a até 5m, você pode empurrá-lo 1m para longe de você. Se ele bater numa cobertura ou parede, a cobertura sofre o mesmo dano do disparo, e o alvo fica Caído." },
    dmr: { n: "DMR", g: "fogo", faixa: "longa",
      t: P => `Se você não se deslocou antes de atacar no turno, recebe +${Math.floor(P / 2)} de Precisão.` },
    sniper: { n: "Rifle de Precisão", g: "fogo", faixa: "extrema",
      t: P => `Se você não se deslocou antes de atacar no turno, recebe +${P} de Precisão.` },
    antimaterial: { n: "Rifle Antimaterial", g: "fogo", faixa: "extrema",
      t: () => "Os disparos causam o dobro de dano em coberturas, veículos, drones e autômatos, e atravessam coberturas de material Leve e Médio. Para disparar sem Desvantagem, a arma precisa estar apoiada: num Bipé, numa cobertura ou com o operador Caído. Peso: -2m de Deslocamento enquanto empunhada, salvo se o traço disser outra coisa. Usam a proficiência de Rifles de Precisão." },
    lmg: { n: "LMG", g: "fogo", faixa: "media",
      t: () => "Com a sua Ação, gastando metade dos Disparos atuais, você cobre uma área de 3x3 com fogo de supressão até o início do seu próximo turno. Todo alvo dentro da área fica Suprimido, como se estivesse sendo suprimido por 2 atacantes (CD 10). Quem se mover dentro da área provoca um ataque de oportunidade seu." },
    lancador: { n: "Lançador", g: "fogo", faixa: "media", unica: true,
      t: (P, M) => `Os disparos causam dano em área, com o raio indicado na ficha. Os alvos na área fazem um teste de resistência de Destreza (CD ${cdDes(P, M)}) para sofrer metade do dano. A recarga é sempre Única.` },
    especial: { n: "Arma Especial", g: "fogo", faixa: "",
      t: (P, M, w) => `Sem tipagem comum: a tipagem está no traço da arma${w && w.prof ? `, e ela usa a proficiência de ${w.prof}` : ""}.` },
    arco1: { n: "Arco comum", g: "arco", faixa: "media", semTroca: true, aljava: true,
      t: () => "Saque e troca sem teste. Se você estiver Escondido, o primeiro ataque do turno com o arco recebe +1 dado de dano. O dano soma Destreza." },
    arco2: { n: "Arco médio", g: "arco", faixa: "media", aljava: true,
      t: P => `Tensão máxima: se você não se deslocou antes de atacar no turno, recebe +${Math.floor(P / 2)} de Precisão. O dano soma Força.` },
    arco3: { n: "Arco grande", g: "arco", faixa: "extrema", aljava: true,
      t: () => "Virote pesado: exige Força 15. Puxar o arco custa a Ação e a Ação Bônus do turno. O virote atravessa o primeiro alvo e acerta o próximo na mesma linha, a até 5m. Um alvo atingido que esteja encostado numa parede ou cobertura fica Impedido (pregado) até usar uma Ação para se soltar. O dano soma Força." },
    leve: { n: "Arma branca Leve", g: "branca", faixa: "corpo", semTroca: true, base: "1d8", attr: "livre",
      t: () => "Saque e troca sem teste. Pode ser arremessada a até 6m." },
    media: { n: "Arma branca Média", g: "branca", faixa: "corpo", base: "2d6", attr: "FOR",
      t: () => "+2 de dano quando usada com uma mão só." },
    pesada: { n: "Arma branca Pesada", g: "branca", faixa: "corpo", base: "2d8", attr: "FOR",
      t: () => "Duas mãos. Rola de novo os resultados 1 e 2 nos dados de dano." },
    manopla: { n: "Manopla leve", g: "branca", faixa: "corpo", base: "1d6", attr: "livre",
      t: () => "Conta como desarmado e não pode ser desarmada. Saque sem teste." },
    manopla2: { n: "Manopla média", g: "branca", faixa: "corpo", base: "1d10", attr: "FOR",
      t: () => "Conta como desarmado e não pode ser desarmada. +1 de C.A. enquanto você não empunhar outra arma." },
    manopla3: { n: "Manopla pesada", g: "branca", faixa: "corpo", base: "2d8", attr: "FOR",
      t: () => "Conta como desarmado. Exige Força 15. Rola de novo os resultados 1 e 2. Peso: -1m de Deslocamento." },
    outro: { n: "Outro / sem tipagem", g: "outro", faixa: "" }
  };
  // bônus de Precisão que dependem da situação, por tipagem
  const PREC_TIPO = {
    ar: P => `+${Math.floor(P / 2)} no próximo ataque contra alvo diferente (Fuzil)`,
    dmr: P => `+${Math.floor(P / 2)} se não se deslocou antes de atacar (DMR)`,
    sniper: P => `+${P} se não se deslocou antes de atacar (Rifle de Precisão)`,
    arco2: P => `+${Math.floor(P / 2)} se não se deslocou antes de atacar (Tensão máxima)`
  };
  const ARCO_REGRA = "Arcos não recarregam: puxar a flecha faz parte do ataque. Em vez de Disparos, eles usam uma aljava, em que cada flecha é um disparo e que ocupa Carga. Depois do combate, role 1d6 por flecha usada: num 4 ou mais, ela pode ser reaproveitada. Atacar com um arco estando Escondido não revela a sua posição. A Precisão usa Destreza. Os arcos fazem parte das armas do Franco-atirador e da Cobra. As outras classes podem usá-los com o talento Mestre de Armas.";
  // arcos escalam como armas de fogo
  const ESCALA = { fogo: [5, 11, 17], arco: [5, 11, 17], branca: [5, 17] };

  const CATS = ["Mira", "Cano", "Boca", "Trilho", "Grip", "Pente", "Empunhadura", "Coronha", "Gatilho"];
  const MAX_ACC = 5;
  // fx: dano, troca, recarga (somam na CD), disp (soma), mul (multiplica), m (metros), pe (P.E., padrão 0,25)
  const ACC = {
    Mira: [
      { n: "Red Dot", g: "+1 de Precisão na faixa Curta", p: "Nenhuma", pc: "+1 na faixa Curta" },
      { n: "Holográfica", g: "+1 de Precisão, ou +2 a até 10m", p: "Troca +1", fx: { troca: 1, pr: 1 }, pc: "+2 em vez de +1 a até 10m" },
      { n: "Mira de Precisão", g: "+2 de Precisão nas faixas Média e Longa", p: "-1 de Precisão na Curta", pc: "+2 nas faixas Média e Longa, -1 na Curta" },
      { n: "Longo Alcance", g: "Atira uma faixa além sem Desvantagem", p: "Desvantagem em alvos a até 5m. Troca +2", fx: { troca: 2 } },
      { n: "Térmica", g: "Enxerga alvos através de fumaça e escuridão", p: "Sem bônus de Precisão", fx: { pe: 0.5 } }
    ],
    Cano: [
      { n: "Cano Longo", g: "+2 de dano e alcance +10m", p: "Troca +2", fx: { dano: 2, m: 10, troca: 2 } },
      { n: "Cano Curto", g: "Troca -2 e Recarga -2", p: "-1 de Precisão e alcance -10m", fx: { troca: -2, recarga: -2, m: -10, pr: -1 } }
    ],
    Boca: [
      { n: "Supressor", g: "Disparar não revela a posição de quem está Escondido", p: "-2 de dano e alcance -10m", fx: { dano: -2, m: -10 } },
      { n: "Quebra-chamas", g: "No escuro, o disparo não revela a sua posição", p: "Troca +1", fx: { troca: 1 } },
      { n: "Compensador", g: "O primeiro disparo extra do turno não sofre Recuo", p: "Troca +1", fx: { troca: 1 } },
      { n: "Extensor", g: "+1 de dano", p: "-1 de Precisão", fx: { dano: 1, pr: -1 } }
    ],
    Trilho: [
      { n: "Laser", g: "+1 de Precisão na faixa Curta", p: "Quem vê o laser sabe a sua posição", pc: "+1 na faixa Curta" },
      { n: "Lanterna", g: "Ilumina um cone de 10m. Com uma Ação Bônus, ofusca um alvo a até 5m (teste de Constituição, CD 12 + Proef + Des). Na falha, ele tem Desvantagem no próximo ataque", p: "Revela a sua posição enquanto estiver ligada", cd: true },
      { n: "Extensor de mira", g: "Permite uma segunda mira, e trocar entre as duas não gasta ação", p: "Só vale o bônus da mira em uso" },
      { n: "Bipé", g: "+2 de Precisão se você não se mover no turno e estiver apoiado", p: "Troca +2", fx: { troca: 2 }, pc: "+2 parado e apoiado" },
      { n: "Baioneta", g: "A arma pode atacar como arma branca Leve", p: "Troca +1", fx: { troca: 1 } },
      { n: "Bandoleira", g: "Troca -3", p: "Nenhuma, mas ocupa o espaço do trilho", fx: { troca: -3 } },
      { n: "Estojo de balas", g: "Vantagem na Recarga de armas de recarga Única", p: "Só serve para recarga Única" }
    ],
    Grip: [
      { n: "Grip Angular", g: "+1 de Precisão e Recarga -1", p: "Troca +1", fx: { recarga: -1, troca: 1, pr: 1 } },
      { n: "Grip Mão-segura", g: "Recarga -2 e Troca -2", p: "Nenhum bônus de Precisão", fx: { recarga: -2, troca: -2 } },
      { n: "Grip Vertical", g: "+2 de Precisão nos modos Rajada e Automático", p: "Troca +2", fx: { troca: 2 }, pc: "+2 em Rajada e Automático" }
    ],
    Pente: [
      { n: "Pente Curto", g: "Recarga -3", p: "Disparos -1", fx: { recarga: -3, disp: -1 } },
      { n: "Pente Longo", g: "Disparos +2", p: "Recarga +2", fx: { disp: 2, recarga: 2 } },
      { n: "Tambor", g: "Disparos dobrados", p: "Recarga +4", fx: { mul: 2, recarga: 4, pe: 0.5 } }
    ],
    Empunhadura: [
      { n: "Empunhadura emborrachada", g: "+1 de Precisão no modo Semi", p: "Troca +1", fx: { troca: 1 }, pc: "+1 no modo Semi" }
    ],
    Coronha: [
      { n: "Sem coronha", g: "Troca -3, e a arma conta como um tamanho menor na Manuseabilidade", p: "-1 de Precisão", fx: { troca: -3, pr: -1 } },
      { n: "Coronha pesada", g: "+1 de Precisão", p: "Troca +2", fx: { troca: 2, pr: 1 } }
    ],
    Gatilho: [
      { n: "Gatilho leve", g: "+1 de Precisão no primeiro disparo do turno", p: "Recarga +1", fx: { recarga: 1 }, pc: "+1 no primeiro disparo do turno" },
      { n: "Gatilho de cadência", g: "Na Rajada, o segundo ataque recebe +1 de Precisão", p: "-1 de dano no modo Semi", pc: "+1 no 2º ataque da Rajada" }
    ]
  };
  const accOf = (cat, n) => (ACC[cat] || []).find(a => a.n === n);
  const MODOS = [["S", "Semi"], ["R", "Rajada"], ["A", "Automático"]];
  const DMG_TIPOS = ["perfurante", "cortante", "contundente", "explosivo", "elétrico", "incendiário"];

  const MODELOS = {
    ak74: { name: "AK-74", tipo: "ar", pe: "2.5", damage: "3d8 + 3", dmgTipo: "perfurante", disparos: "4", modos: "S,A", faixa: "media", metros: "30", recarga: "15", swap: "12",
      slots: "Mira,Cano,Boca,Trilho,Grip,Pente,Coronha", traco: "Resistente. Não sofre defeitos com facilidade." }
  };

  const ESCUDOS = [
    ["Leve", "Cobertura parcial (+2)"],
    ["Médio", "Cobertura de três quartos (+4)"],
    ["Pesado", "Três quartos (+4). Com uma Ação Bônus, você pode plantar o escudo: ele vira cobertura total contra ataques da frente, mas seu Deslocamento cai para 0 e você não pode atacar até levantar o escudo de novo, também com uma Ação Bônus. Enquanto o escudo estiver plantado, o operador não pode ser empurrado."]
  ];

  // ---------------- utilidades ----------------
  const E = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const N = v => { const n = parseFloat(String(v ?? "").replace(",", ".")); return isNaN(n) ? 0 : n; };
  const sgn = n => (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n);
  const list = s => String(s || "").split(",").map(x => x.trim()).filter(Boolean);
  // acessórios guardados como texto ("Mira=Red Dot;Cano=Cano Longo") para salvar e carregar sem perda
  const accMap = w => {
    if (w.acc && typeof w.acc === "object") return w.acc;
    const o = {}; String(w.acc || "").split(";").forEach(p => { const i = p.indexOf("="); if (i > 0) o[p.slice(0, i).trim()] = p.slice(i + 1).trim(); }); return o;
  };
  const accStr = A => CATS.filter(c => A[c]).map(c => c + "=" + A[c]).join(";");
  // acessórios personalizados do jogador: { Boca: { n, g, p, dano, disp, recarga, troca, m, pe, pr } }
  const CUSTOM_CAMPOS = [["dano", "Dano"], ["pr", "Precisão"], ["disp", "Disparos"], ["recarga", "Recarga"], ["troca", "Troca"], ["m", "Alcance (m)"], ["pe", "P.E."]];
  const customOf = w => { try { const o = JSON.parse(w.accCustom || "{}"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; } };
  function resolveAcc(w, c, val) {
    if (val !== "*") return accOf(c, val);
    const d = customOf(w)[c] || {}, fx = {};
    CUSTOM_CAMPOS.forEach(([k]) => { const v = N(d[k]); if (k === "pe") fx.pe = d.pe == null || d.pe === "" ? 0.25 : v; else if (v) fx[k] = v; });
    const nums = CUSTOM_CAMPOS.filter(([k]) => k !== "pe" && N(d[k])).map(([k, l]) => `${l} ${N(d[k]) > 0 ? "+" : ""}${N(d[k])}`.replace(".", ","));
    return { n: (d.n || "").trim() || `${c} personalizado`, g: [d.g, ...nums.filter(x => !/^(Troca|Recarga) \+/.test(x))].filter(Boolean).join(". ") || "—",
      p: [/^\s*nenhum[a]?\s*$/i.test(d.p || "") && nums.some(x => /^(Troca|Recarga) \+/.test(x)) ? "" : d.p, ...nums.filter(x => /^(Troca|Recarga) \+/.test(x))].filter(Boolean).join(". ") || "Nenhuma", fx, custom: true };
  }
  function ctx() {
    const m = typeof getMods === "function" ? getMods() : { FOR: 0, DEX: 0 };
    const lvl = typeof lvlInfo === "function" ? lvlInfo().total : 1;
    return { lvl, prof: typeof profBonus === "function" ? profBonus() : 2, mods: m };
  }
  // texto próprio da arma (ex.: "Não recarrega") vale mais que a regra do tipo
  const isUnica = (w, T) => (T && T.unica && !/^n[ãa]o/i.test(String(w.recarga || "").trim())) || /^\s*[úu]nica/i.test(String(w.recarga || "")) || (T && T.unicaPadrao && String(w.recarga ?? "").trim() === "");
  const maxAcc = w => N(w.accMax) || MAX_ACC;
  // atributo do dano de armas brancas e arcos: o da arma (campo Atributo) ou o da tipagem
  function attrKey(w, T) {
    const o = w.attrOpc || "";
    if (o === "DEX" || o === "FOR") return o;
    if (o === "FOR/DEX" || (T && T.attr === "livre")) return w.attr === "DEX" ? "DEX" : "FOR";
    if (T && T.attr === "FOR") return "FOR";
    return "";
  }
  const attrLivre = (w, T) => w.attrOpc === "FOR/DEX" || (!w.attrOpc && T && T.attr === "livre");
  const tipoOf = w => TIPOS[w.tipo] || null;

  // acessórios equipados (só os que estão em espaços aceitos), no máximo 5
  function equipped(w) {
    const A = accMap(w), slots = list(w.slots), out = [];
    CATS.forEach(c => { if (A[c] && (!slots.length || slots.includes(c))) { const a = resolveAcc(w, c, A[c]); if (a) out.push(Object.assign({ cat: c }, a)); } });
    return out.slice(0, maxAcc(w));
  }
  function fxSum(w) {
    const s = { dano: 0, troca: 0, recarga: 0, disp: 0, mul: 1, m: 0, pe: 0, pr: 0 };
    equipped(w).forEach(a => { const f = a.fx || {}; s.dano += f.dano || 0; s.pr += f.pr || 0; s.troca += f.troca || 0; s.recarga += f.recarga || 0; s.disp += f.disp || 0; s.m += f.m || 0; s.pe += f.pe != null ? f.pe : 0.25; if (f.mul) s.mul *= f.mul; });
    return s;
  }

  // dano: o dado principal escala com o nível; o bônus fixo não
  function damage(w, C) {
    const T = tipoOf(w), fx = fxSum(w);
    let src = String(w.damage || "").trim();
    let attrBonus = 0, attrLbl = "";
    const addAttr = k => { if (!k) return; attrBonus += C.mods[k] || 0; attrLbl = k === "FOR" ? "FOR" : "DES"; };
    // "+ Des", "+ For" e "+ mod" no texto do dano viram o modificador do operador
    src = src.replace(/\s*\+\s*(des|for|mod)\b/gi, (m, k) => { k = k.toLowerCase(); addAttr(k === "des" ? "DEX" : k === "for" ? "FOR" : attrKey(w, T) || "FOR"); return ""; });
    if (T && T.g === "branca") {
      if (!src) src = T.base;
      if (!attrLbl) addAttr(attrKey(w, T));
    }
    if (!src) return { txt: "", base: "", steps: 0 };
    const toks = src.replace(/\s+/g, "").match(/[+-]?[^+-]+/g) || [];
    let main = null, extra = [], fixed = 0, other = [];
    toks.forEach(t => {
      const m = /^([+-]?)(\d*)d(\d+)$/i.exec(t);
      if (m) { const o = { s: m[1] || "+", n: +(m[2] || 1), d: +m[3] }; if (!main && o.s === "+") main = o; else extra.push(o); }
      else if (/^[+-]?\d+(\.\d+)?$/.test(t)) fixed += +t;
      else other.push(t.replace(/^\+/, ""));
    });
    const steps = T && ESCALA[T.g] ? ESCALA[T.g].filter(l => C.lvl >= l).length : 0;
    if (!main) return { txt: src + (fx.dano ? ` ${sgn(fx.dano)}` : ""), base: String(w.damage || ""), steps: 0 };
    const total = fixed + fx.dano + attrBonus;
    // Recuo do PRÓXIMO disparo: cada disparo já feito no turno tira 1 dado (mínimo 1 dado)
    const rec = Math.min(N(w._rec) + (w._shot ? 1 : 0), main.n + steps - 1);
    let txt = `${main.n + steps - rec}d${main.d}` + extra.map(o => ` ${o.s === "-" ? "−" : "+"} ${o.n}d${o.d}`).join("") + (other.length ? " + " + other.join(" + ") : "");
    if (total) txt += ` ${total > 0 ? "+" : "−"} ${Math.abs(total)}`;
    return { txt, base: String(w.damage || "").trim() || src, steps, attrLbl, attrBonus, fx: fx.dano, rec };
  }
  function calc(w, C = ctx()) {
    const T = tipoOf(w), fx = fxSum(w), branca = T && T.g === "branca";
    const dm = damage(w, C);
    const baseDisp = N(w.disparos) || N(w.penteMax);
    const disp = branca ? 0 : baseDisp > 0 ? Math.max(1, Math.round((baseDisp + fx.disp) * fx.mul)) : 0;
    // alcance
    let alc = "";
    const fk = w.faixa || (T && T.faixa) || "";
    if (fk && FAIXAS[fk]) {
      const F = FAIXAS[fk];
      if (fk === "corpo") alc = N(w.metros) ? `${F.n} (${N(w.metros)}m)` : F.n;
      else { const m = Math.max(0, (N(w.metros) || F.m) + fx.m); alc = `${F.n} (${m}m)`; }
    } else if (w.range) alc = w.range;
    // recarga e troca (CD)
    let rec = "";
    const rtx = String(w.recarga ?? "").trim();
    if (!branca && !(T && T.aljava)) {
      if (isUnica(w, T)) rec = `Única (CD ${10 + fx.recarga}/disparo)`;
      else if (/^-?\d/.test(rtx)) rec = String(N(rtx) + fx.recarga);
      else if (rtx) rec = rtx;
    }
    let tro = "";
    if (T && T.semTroca) tro = "sem teste";
    else if (String(w.swap ?? "").trim() !== "") tro = /^\s*-?\d/.test(w.swap) ? String(N(w.swap) + fx.troca) : w.swap;
    const pe = +(N(w.pe) + fx.pe).toFixed(2);
    // Precisão: 1d20 + Proef + modificadores da arma (acessórios). Arcos somam Destreza; armas brancas, o atributo da arma
    let prAttr = 0, prAttrLbl = "";
    if (T && T.g === "arco") { prAttr = C.mods.DEX || 0; prAttrLbl = "DES"; }
    else if (branca) { const k = attrKey(w, T) || "FOR"; prAttr = C.mods[k] || 0; prAttrLbl = k === "FOR" ? "FOR" : "DES"; }
    const prec = C.prof + prAttr + fx.pr;
    const precCond = [];
    if (T && PREC_TIPO[w.tipo]) precCond.push(PREC_TIPO[w.tipo](C.prof));
    equipped(w).forEach(a => { if (a.pc) precCond.push(`${a.pc} (${a.n})`); });
    return { T, dm, disp, alc, rec, tro, pe, fx, branca, acc: equipped(w), aljava: !!(T && T.aljava), prec, prAttr, prAttrLbl, precCond };
  }
  const pe = w => calc(w).pe;

  // ---------------- cartão (visualização) ----------------
  function view(w, i, actsHTML, nameHTML) {
    const C = ctx(), R = calc(w, C), T = R.T;
    // mantém o contador do combate em dia com os Disparos efetivos
    if (R.disp > 0) { w.penteMax = String(R.disp); if (String(w.penteAtual ?? "") === "" || N(w.penteAtual) > R.disp) w.penteAtual = String(R.disp); }
    const cur = N(w.penteAtual), max = R.disp || N(w.penteMax);
    const cells = max > 0 && max <= 60 ? Array.from({ length: max }, (_, k) => `<i class="${k < cur ? "" : "x"}"></i>`).join("") : (max > 0 ? `<i style="flex:0 0 ${Math.min(100, cur / max * 100)}%"></i><i class="x"></i>` : "");
    const dmgTitle = R.dm.base ? `No 1º nível: ${R.dm.base}${R.dm.steps ? ` // +${R.dm.steps} dado${R.dm.steps > 1 ? "s" : ""} pelo nível ${C.lvl}` : ""}${R.dm.attrLbl ? ` // + mod. de ${R.dm.attrLbl}` : ""}${R.dm.fx ? ` // acessórios ${sgn(R.dm.fx)}` : ""}` : "";
    const prTitle = `1d20 + Proef ${sgn(C.prof)}${R.prAttrLbl ? ` + ${R.prAttrLbl} ${sgn(R.prAttr)}` : ""}${R.fx.pr ? ` + acessórios ${sgn(R.fx.pr)}` : ""}`;
    const st = [
      ["PRECISÃO", `<b class="wprec" title="${E(prTitle)}">${R.prec >= 0 ? "+" : "−"}${Math.abs(R.prec)}</b>`],
      [R.dm.rec ? "PRÓX. DISPARO" : "DANO", R.dm.txt ? `<span title="${E(dmgTitle)}">${E(R.dm.txt)}${w.dmgTipo ? ` <small>${E(w.dmgTipo)}</small>` : ""}${R.dm.steps ? `<sup class="wup">▲${R.dm.steps}</sup>` : ""}</span>` : ""],
      ["ALCANCE", E(R.alc)], ["RECARGA", E(R.rec)], ["TROCA", E(R.tro)], ["P.E.", R.pe ? E(String(R.pe).replace(".", ",")) : ""]
    ].filter(x => x[1] !== "" && x[1] != null).map(x => `<span><em>${x[0]}</em>${x[1]}</span>`).join("");
    const modos = list(w.modos).map(k => (MODOS.find(m => m[0] === k) || [k, k])[1]);
    const chips = [T && w.tipo !== "outro" ? `<b class="wt">${E(T.n)}</b>` : "", ...modos.map(m => `<i class="wm">${E(m)}</i>`)].join("");
    const accs = R.acc.length ? `<div class="wacc">${R.acc.map(a => `<span title="${E(a.g + " // " + a.p)}"><em>${E(a.cat)}</em>${E(a.n)}</span>`).join("")}</div>` : "";
    const lines = [];
    if (w.traco) lines.push(`<p class="wtr"><em>TRAÇO</em>${E(w.traco)}</p>`);
    if (w.kit) lines.push(`<p class="wtr kit"><em>KIT</em>${E(w.kit)}</p>`);
    const det = [];
    if (T && T.t) det.push(`<p><b>${E(T.n.toUpperCase())}:</b> ${E(T.t(C.prof, C.mods, w))}</p>`);
    if (R.aljava) det.push(`<p><b>ARCOS:</b> ${E(ARCO_REGRA)}</p>`);
    R.acc.forEach(a => det.push(`<p><b>${E(a.n)}</b> <span class="g">▲ ${E(a.cd ? a.g.replace("CD 12 + Proef + Des", `CD ${12 + C.prof + (C.mods.DEX || 0)}`) : a.g)}</span> <span class="p">▼ ${E(a.p)}</span></p>`));
    const details = det.length ? `<details class="wdet"><summary>REGRAS DA ARMA</summary>${det.join("")}</details>` : "";
    return `<div class="card wcard" data-list="weapons" data-i="${i}">
      <div class="w-img">${w.imageSrc ? `<img src="${E(w.imageSrc)}" alt="">` : "SEM<br>IMAGEM"}</div>
      <div class="card-b"><div class="card-h"><span class="inv-grab" title="Arraste para a maleta ou o stash">⠿</span><div class="card-n">${nameHTML}</div>${actsHTML}</div>
      ${chips ? `<div class="wchips">${chips}</div>` : ""}
      ${st ? `<div class="stats">${st}</div>` : ""}
      ${max > 0 ? `<div class="ammo${cur <= 0 ? " empty-mag" : ""}"><em>${R.aljava ? "ALJAVA" : "DISPAROS"}</em><button class="step" data-act="dec" data-k="penteAtual" data-nosfx>−</button><b>${cur} / ${max}${R.aljava && w.municao ? ` <small>${E(w.municao)}</small>` : ""}</b><button class="step" data-act="inc" data-k="penteAtual" data-nosfx>+</button><button class="step" data-act="fill" data-k="penteAtual" title="${R.aljava ? "Repor a aljava" : "Recarregar"}" data-nosfx style="width:auto;padding:0 7px;font-size:10px;letter-spacing:.1em">${R.aljava ? "REPOR" : "RECARREGAR"}</button><div class="bar">${cells}</div></div>` : ""}
      ${w._shot && R.disp ? `<div class="wrec">RECUO // ${N(w._rec) + 1} disparo${N(w._rec) ? "s" : ""} neste turno: o próximo sai com −${R.dm.rec} dado${R.dm.rec > 1 ? "s" : ""} <button class="step" data-act="recoil0" title="Começar um turno novo: o Recuo zera" data-nosfx>↺ NOVO TURNO</button></div>` : ""}
      ${R.precCond.length ? `<div class="wpc"><em>PRECISÃO SE</em>${R.precCond.map(t => `<span>${E(t)}</span>`).join("")}</div>` : ""}
      ${accs}${lines.join("")}${w.desc ? `<p class="desc">${E(w.desc)}</p>` : ""}${details}</div></div>`;
  }

  // ---------------- cartão (edição) ----------------
  function edit(w, i) {
    const T = tipoOf(w), branca = T && T.g === "branca", A = accMap(w), slots = list(w.slots), modos = list(w.modos);
    const inp = (k, ph, type = "text", extra = "") => `<label><span class="lbl">${ph}</span><input class="in" data-k="${k}" type="${type}" value="${E(w[k])}" ${extra}></label>`;
    const opt = (v, t, cur) => `<option value="${E(v)}"${v === cur ? " selected" : ""}>${E(t)}</option>`;
    const tipoSel = `<label><span class="lbl">Tipo</span><select class="in" data-wk="tipo"><option value="">Escolha...</option>
      <optgroup label="Armas de fogo">${["pistola", "revolver", "smg", "ar", "shotgun", "dmr", "sniper", "antimaterial", "lmg", "lancador", "especial"].map(k => opt(k, TIPOS[k].n, w.tipo)).join("")}</optgroup>
      <optgroup label="Arcos">${["arco1", "arco2", "arco3"].map(k => opt(k, TIPOS[k].n, w.tipo)).join("")}</optgroup>
      <optgroup label="Armas brancas">${["leve", "media", "pesada", "manopla", "manopla2", "manopla3"].map(k => opt(k, TIPOS[k].n, w.tipo)).join("")}</optgroup>
      ${opt("outro", TIPOS.outro.n, w.tipo)}</select></label>`;
    const faixaSel = `<label><span class="lbl">Faixa de alcance</span><select class="in" data-k="faixa"><option value="">${T && T.faixa ? "Padrão: " + FAIXAS[T.faixa].n : "—"}</option>${FAIXA_ORD.map(k => opt(k, k === "corpo" ? FAIXAS[k].n : `${FAIXAS[k].n} (${FAIXAS[k].m}m)`, w.faixa)).join("")}</select></label>`;
    let g1 = `${tipoSel}${inp("pe", "P.E. (sem acessórios)", "number", 'step="0.25" min="0"')}`;
    const dmgPh = branca ? `vazio = ${T.base} (tabela)` : "ex.: 3d8 + 3";
    g1 += `<label><span class="lbl">Dano no 1º nível</span><input class="in" data-k="damage" value="${E(w.damage)}" placeholder="${E(dmgPh)}"></label>`;
    g1 += `<label><span class="lbl">Tipo de dano</span><input class="in" data-k="dmgTipo" list="dmgTipos" value="${E(w.dmgTipo)}" placeholder="perfurante"></label>`;
    if ((branca || (T && T.aljava)) && attrLivre(w, T)) g1 += `<label><span class="lbl">Atributo do dano</span><select class="in" data-k="attr">${opt("FOR", "Força", w.attr || "FOR")}${opt("DEX", "Destreza", w.attr || "FOR")}</select></label>`;
    let g2 = faixaSel + inp("metros", "Metros (vazio = padrão da faixa)", "number", 'min="0"');
    if (T && T.aljava) g2 += inp("disparos", `Aljava (${w.municao || "flechas"})`, "number", 'min="0"');
    else if (!branca) g2 += inp("disparos", "Disparos", "number", 'min="0"') + `<label><span class="lbl">Recarga (CD)</span><input class="in" data-k="recarga" value="${E(w.recarga)}" placeholder="${T && (T.unica || T.unicaPadrao) ? "Única" : "ex.: 15 ou Única"}"${T && T.unica ? " disabled" : ""}></label>`;
    g2 += `<label><span class="lbl">Troca (CD)</span><input class="in" data-k="swap" value="${E(w.swap)}" placeholder="${T && T.semTroca ? "sem teste" : "ex.: 12"}"${T && T.semTroca ? " disabled" : ""}></label>`;
    let fogo = "";
    if (!branca) {
      const used = Math.min(maxAcc(w), CATS.filter(c => A[c] && slots.includes(c)).length);
      fogo = `${T && T.aljava ? "" : `<div class="wsec"><span class="lbl">Modos de disparo</span><div class="wck">${MODOS.map(([k, n]) => `<label><input type="checkbox" data-wk="modo" value="${k}"${modos.includes(k) ? " checked" : ""}> ${n}</label>`).join("")}</div></div>`}
      <div class="wsec"><span class="lbl">Espaços de acessório (categorias que a arma aceita)</span><div class="wck">${CATS.map(c => `<label><input type="checkbox" data-wk="slot" value="${c}"${slots.includes(c) ? " checked" : ""}> ${c}</label>`).join("")}</div></div>
      <div class="wsec"><span class="lbl">Acessórios // ${used} de ${maxAcc(w)} // cada um soma +0,25 de P.E., salvo quando indicado</span>
        ${slots.length ? `<div class="ed-g wacc-ed">${CATS.filter(c => slots.includes(c)).map(c => `<label><span class="lbl">${c}</span><select class="in" data-wk="acc" data-cat="${c}"${!A[c] && used >= maxAcc(w) ? " disabled" : ""}><option value="">—</option>${ACC[c].map(a => opt(a.n, a.n, A[c] || "")).join("")}${opt("*", "Personalizado...", A[c] || "")}</select></label>`).join("")}</div>
        ${CATS.filter(c => A[c] === "*" && slots.includes(c)).map(c => customForm(w, c)).join("")}
        ${CATS.filter(c => A[c] && A[c] !== "*" && slots.includes(c)).map(c => { const a = accOf(c, A[c]); return a ? `<p class="wfx"><b>${E(a.n)}</b> <span class="g">▲ ${E(a.g)}</span> <span class="p">▼ ${E(a.p)}</span></p>` : ""; }).join("")}`
        : `<p class="note" style="margin:4px 0 0">Marque os espaços acima para escolher acessórios.</p>`}</div>`;
    }
    return `${inp("name", "Nome da arma")}<div class="ed-g">${g1}</div><div class="ed-g">${g2}</div>${fogo}
      <label><span class="lbl">Traço (o que a arma tem de único)</span><input class="in" data-k="traco" value="${E(w.traco)}"></label>
      <label><span class="lbl">Kit de conversão (um por arma; ajuste os valores acima conforme o kit)</span><input class="in" data-k="kit" value="${E(w.kit)}" placeholder="ex.: Kit Ronin: dano elétrico, crítico tira a Reação"></label>
      <label><span class="lbl">Notas</span><textarea class="ta" data-k="desc" rows="2">${E(w.desc)}</textarea></label>
      <datalist id="dmgTipos">${DMG_TIPOS.map(t => `<option value="${t}">`).join("")}</datalist>`;
  }

  function customForm(w, c) {
    const d = customOf(w)[c] || {};
    const txt = (k, l, ph) => `<label><span class="lbl">${l}</span><input class="in" data-wc="${k}" data-cat="${c}" value="${E(d[k] ?? "")}" placeholder="${E(ph)}"></label>`;
    const num = (k, l) => `<label><span class="lbl">${l}</span><input class="in" data-wc="${k}" data-cat="${c}" type="text" inputmode="decimal" value="${E(d[k] ?? (k === "pe" ? "0,25" : "0"))}"></label>`;
    return `<div class="wcus"><div class="wcus-h">${E(c.toUpperCase())} // PERSONALIZADO</div>
      ${txt("n", "Nome", `ex.: ${c} "Sussurro"`)}${txt("g", "Ganho", "o que ele faz de bom")}${txt("p", "Perda", "Nenhuma")}
      <div class="ed-g wcus-n">${CUSTOM_CAMPOS.map(([k, l]) => num(k, l)).join("")}</div>
      <p class="note" style="margin:6px 0 0">Números somam na arma. Na Recarga e na Troca, negativo deixa o teste mais fácil. P.E. é quanto ele custa (o padrão do guia é 0,25).</p></div>`;
  }
  // digitar no formulário do acessório personalizado atualiza a arma sem redesenhar (o cursor não pula)
  document.addEventListener("input", e => {
    const f = e.target.closest("[data-wc]"); if (!f) return;
    const card = f.closest(".card.edit"), w = card && LISTS.weapons[+card.dataset.i]; if (!w) return;
    const o = customOf(w), c = f.dataset.cat; o[c] = o[c] || {};
    o[c][f.dataset.wc] = f.dataset.wc === "n" || f.dataset.wc === "g" || f.dataset.wc === "p" ? f.value : f.value.replace(",", ".");
    w.accCustom = JSON.stringify(o); changed(true);
  });

  // controles do editor que mudam o formulário (tipo, modos, espaços, acessórios, modelo)
  document.addEventListener("change", e => {
    const f = e.target.closest("[data-wk]"); if (!f) return;
    const card = f.closest(".card.edit"); if (!card || card.dataset.list !== "weapons") return;
    const w = LISTS.weapons[+card.dataset.i]; if (!w) return;
    const k = f.dataset.wk;
    if (k === "tipo") {
      const old = tipoOf(w); w.tipo = f.value; const T = tipoOf(w);
      if (T && T.g === "branca" && (!old || old.g !== "branca")) { if (!w.faixa) w.faixa = ""; }
      if (T && T.unica) w.recarga = "Única";
    } else if (k === "modo" || k === "slot") {
      const key = k === "modo" ? "modos" : "slots", s = new Set(list(w[key]));
      f.checked ? s.add(f.value) : s.delete(f.value);
      const ord = k === "modo" ? MODOS.map(m => m[0]) : CATS;
      w[key] = ord.filter(x => s.has(x)).join(",");
      if (k === "slot" && !f.checked) { const A = Object.assign({}, accMap(w)); delete A[f.value]; w.acc = accStr(A); }
    } else if (k === "acc") {
      const A = Object.assign({}, accMap(w));
      if (f.value) A[f.dataset.cat] = f.value; else delete A[f.dataset.cat];
      w.acc = accStr(A);
      if (f.value === "*") { const o = customOf(w); if (!o[f.dataset.cat]) { o[f.dataset.cat] = { pe: "0.25" }; w.accCustom = JSON.stringify(o); } }
    } else if (k === "modelo") {
      const M = MODELOS[f.value]; if (M) Object.assign(w, JSON.parse(JSON.stringify(M)), { acc: "", penteAtual: "" });
    }
    renderList("weapons"); changed(true);
    if (typeof sfx === "function") sfx("clique");
  });

  // ---------------- texto curto para o modo de combate ----------------
  function info(w) {
    const R = calc(w);
    return [`PRECISÃO ${R.prec >= 0 ? "+" : "−"}${Math.abs(R.prec)}`, R.dm.txt && (R.dm.rec ? `PRÓX. DISPARO ${R.dm.txt} (RECUO −${R.dm.rec})` : "DANO " + R.dm.txt), R.alc && "ALCANCE " + R.alc, R.rec && "RECARGA " + R.rec, R.tro && "TROCA " + R.tro, R.disp && `${R.aljava ? "ALJAVA" : "DISPAROS"} ${N(w.penteAtual)}/${R.disp}${R.aljava && w.municao ? " " + w.municao : ""}`].filter(Boolean).join(" // ");
  }

  // ---------------- guia de consulta ----------------
  function guide() {
    const C = ctx();
    const tr = rows => rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("");
    return `<details class="wguia"><summary>▸ GUIA DAS ARMAS // REGRAS DE CONSULTA</summary>
      <h4>Faixas de alcance</h4><table>${tr(FAIXA_ORD.map(k => [FAIXAS[k].n, FAIXAS[k].d]))}</table>
      <p>Atirar uma faixa além da faixa da arma dá Desvantagem, e o dano perde 1 dado. Duas faixas além não é possível, salvo com habilidades ou talentos, como o Atirador Aguçado.</p>
      <h4>Escala de dano</h4>
      <p>Armas de fogo e arcos ganham 1 dado no 5º, 11º e 17º nível. Armas brancas ganham 1 dado só no 5º e no 17º (o Ataque Extra do CaC cobre o 11º). Em armas com dois tipos de dado, só o principal escala. O bônus fixo não escala. <b>A ficha já faz essa conta: escreva o dano do 1º nível.</b></p>
      <h4>Tipagens (com a sua Proef atual: +${C.prof})</h4>
      ${Object.keys(TIPOS).filter(k => TIPOS[k].t).map(k => `<p><b>${E(TIPOS[k].n)}:</b> ${E(TIPOS[k].t(C.prof, C.mods, null))}</p>`).join("")}
      <p><b>Arcos (regra geral):</b> ${E(ARCO_REGRA)}</p>
      <h4>Armas brancas</h4><table><tr><th>Tipagem</th><th>Base</th><th>5º</th><th>17º</th></tr>${tr([["Leve", "1d8", "2d8", "3d8"], ["Média", "2d6", "3d6", "4d6"], ["Pesada", "2d8", "3d8", "4d8"], ["Manopla leve", "1d6", "2d6", "3d6"]].map(r => r.map((c, j) => j ? c + " + mod" : c)))}${tr([["Manopla média", "1d10 + For", "2d10 + For", "3d10 + For"], ["Manopla pesada", "2d8 + For", "3d8 + For", "4d8 + For"]])}</table>
      <p>O "mod" é Força ou Destreza: Força para as médias e pesadas, e qualquer um dos dois para as leves e as manoplas leves, salvo quando a ficha da arma indicar outra coisa.</p>
      <h4>Escudos</h4><p>Funcionam como cobertura que o operador carrega, e só protegem contra ataques da frente.</p><table>${tr(ESCUDOS)}</table>
      <p>O escudo não acumula com a cobertura do cenário (use a maior). Disparar uma arma com uma mão enquanto empunha um escudo é feito com Desvantagem.</p>
      <h4>Acessórios</h4><p>Até 5 por arma (o AR-15 aceita 6), um por categoria, apenas nas categorias que a arma aceita. Cada um soma +0,25 de P.E., salvo quando indicado. Na Recarga e na Troca, número negativo deixa o teste mais fácil (a CD cai). Bônus de Precisão de miras não se acumulam. Acessórios não escalam com o nível.</p>
      <h4>Kits de Conversão</h4><p>Peças raras que mudam a natureza da arma (tipo, modo, dano ou comportamento). Um por arma. O kit substitui os valores indicados nele e não ocupa espaço de acessório, mas pode bloquear categorias. Instalação: descanso longo e teste de Tecnologia (CD 13); na falha o kit não é perdido. O Armeiro instala e remove sem teste.</p>
    </details>`;
  }

  // re-renderiza quando nível, Proef ou atributos mudam (o dano escala)
  let sig = "";
  function refresh() {
    const C = ctx(), s = [C.lvl, C.prof, C.mods.FOR, C.mods.DEX].join("|");
    if (s === sig) return; sig = s;
    if (LISTS.weapons.some(w => w._edit)) return;
    renderList("weapons");
    const g = document.getElementById("armGuia"); if (g) { const open = g.querySelector("details")?.open; g.innerHTML = guide(); if (open) g.querySelector("details").open = true; }
  }

  // ---------------- catálogo de armas (com imagem) ----------------
  let catSel = "", catQ = "";
  function catEl() {
    let el = document.getElementById("armCat");
    if (el) return el;
    el = document.createElement("div"); el.id = "armCat"; el.className = "acat";
    el.innerHTML = `<div class="acat-in" role="dialog" aria-label="Catálogo de armas"><span class="corner c1"></span><span class="corner c2"></span><span class="corner c3"></span><span class="corner c4"></span>
      <div class="acat-h"><span>⌖ CATÁLOGO DE ARMAS // <b id="acatN"></b></span><button class="btn ico" data-acat="x" title="Fechar" data-nosfx>×</button></div>
      <input class="in" id="acatQ" type="search" placeholder="Buscar arma..." autocomplete="off">
      <div class="acat-tabs" id="acatTabs"></div>
      <div class="acat-grid" id="acatGrid"></div>
      <p class="note acat-f">Armas e números do Guia das Armas. Ao adicionar, a arma entra pronta para revisar e salvar.</p></div>`;
    document.body.appendChild(el);
    el.addEventListener("click", e => {
      if (e.target === el || e.target.closest('[data-acat="x"]')) return catClose();
      const t = e.target.closest("[data-acat-tab]"); if (t) { catSel = t.dataset.acatTab; catQ = ""; el.querySelector("#acatQ").value = ""; catRender(); if (typeof sfx === "function") sfx("clique"); return; }
      const c = e.target.closest("[data-acat-id]"); if (c) catPick(c.dataset.acatId);
    });
    el.querySelector("#acatQ").addEventListener("input", e => { catQ = e.target.value; catRender(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && el.classList.contains("show")) catClose(); });
    return el;
  }
  const norm = t => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  function catRender() {
    const L = typeof ARMAS_CAT !== "undefined" ? ARMAS_CAT : [], ORD = typeof ARMAS_CAT_ORD !== "undefined" ? ARMAS_CAT_ORD : [];
    const cats = ORD.filter(c => L.some(w => w.cat === c));
    document.getElementById("acatTabs").innerHTML = [["", "Todas"], ...cats.map(c => [c, c])].map(([k, n]) => `<button class="acat-tab${(catQ.trim() ? k === "" : k === catSel) ? " on" : ""}" data-acat-tab="${E(k)}" data-nosfx>${E(n)} <em>${k ? L.filter(w => w.cat === k).length : L.length}</em></button>`).join("");
    const q = norm(catQ).trim();
    // com busca, procura em todas as categorias
    const vis = L.filter(w => q ? norm(w.name + " " + w.cat + " " + (TIPOS[w.tipo] ? TIPOS[w.tipo].n : "")).includes(q) : (!catSel || w.cat === catSel));
    document.getElementById("acatN").textContent = vis.length;
    document.getElementById("acatGrid").innerHTML = vis.map(w => {
      const T = TIPOS[w.tipo];
      return `<button class="acat-it" data-acat-id="${E(w.id)}" data-nosfx title="Adicionar ${E(w.name)}"><span class="acat-img">${w.img ? `<img src="${E(w.img)}" alt="" loading="lazy">` : "SEM IMAGEM"}</span>
        <b>${E(w.name)}</b><small>${E(T && w.tipo !== "outro" ? T.n : w.cat)}</small>
        <span class="acat-tags">${w.damage ? `<i>${E(w.damage)}</i>` : ""}${w.pe ? `<i>P.E. ${E(String(w.pe).replace(".", ","))}</i>` : ""}${w.img ? "" : '<i class="s">SEM IMAGEM</i>'}</span></button>`;
    }).join("") || '<div class="empty">NENHUMA ARMA ENCONTRADA</div>';
  }
  function catOpen() {
    const el = catEl(); catQ = ""; el.querySelector("#acatQ").value = ""; catRender(); el.classList.add("show"); document.body.classList.add("acat-on");
    if (typeof sfx === "function") sfx("abrir");
    setTimeout(() => { if (!matchMedia("(pointer:coarse)").matches) el.querySelector("#acatQ").focus(); }, 60);
  }
  function catClose() {
    const el = document.getElementById("armCat"); if (!el || !el.classList.contains("show")) return;
    el.classList.remove("show"); document.body.classList.remove("acat-on"); if (typeof sfx === "function") sfx("fechar");
  }
  function catPick(id) {
    const src = (typeof ARMAS_CAT !== "undefined" ? ARMAS_CAT : []).find(w => w.id === id); if (!src) return;
    const it = blank("weapons");
    ["name", "tipo", "attrOpc", "pe", "damage", "dmgTipo", "disparos", "municao", "modos", "faixa", "metros", "range", "recarga", "swap", "slots", "accMax", "prof", "traco"].forEach(k => { if (src[k] != null) it[k] = String(src[k]); });
    if (TIPOS[it.tipo] && TIPOS[it.tipo].unica && !it.recarga) it.recarga = "Única";
    it.imageSrc = src.img || "";
    it._edit = true; it._new = true;
    LISTS.weapons.push(it); catClose(); renderList("weapons");
    const c = document.getElementById("list-weapons").lastElementChild;
    if (c) c.scrollIntoView({ block: "nearest", behavior: "smooth" });
    if (typeof toast === "function") toast(`${src.name.toUpperCase()} ADICIONADA // REVISE E SALVE`);
  }
  document.addEventListener("click", e => { if (e.target.closest("[data-arm-cat]")) catOpen(); });

  function recoilReset() { let n = 0; LISTS.weapons.forEach(w => { if (w._rec || w._shot) { w._rec = 0; w._shot = false; n++; } }); if (n) renderList("weapons"); return n; }
  return { view, edit, calc, pe, info, guide, refresh, catOpen, catClose, recoilReset, TIPOS, ACC, CATS, FAIXAS, MODELOS };
})();
