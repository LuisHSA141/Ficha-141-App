"use strict";
// ================== REGRAS ==================
const specKeys=c=>Object.keys(SPEC_BOOK[c]||{});
function rebuildSpec(keep){
  const keys=specKeys($("char-class").value);
  $("specWrap").classList.toggle("hidden",!keys.length);
  let cur=keep??$("char-specialization").value;cur=SPEC_RENAME[cur]||cur;
  fillSelect("char-specialization",keys);
  if(keys.includes(cur)) $("char-specialization").value=cur;
}
function rebuildSpec2(keep){
  const c2=$("char-class2").value,keys=specKeys(c2).filter(k=>!(c2===$("char-class").value&&k===$("char-specialization").value));
  let cur=keep??$("char-spec2").value;cur=SPEC_RENAME[cur]||cur;
  fillSelect("char-spec2",keys);
  if(keys.includes(cur)) $("char-spec2").value=cur;
}
function raceData(){
  const r=RACES[$("char-race").value]||RACES.Humano,sub=r.subs?r.subs[$("char-subtype").value]:null;
  const halo=sub&&sub.halos?sub.halos[$("char-halo").value]:null;
  return {r,sub,halo,name:$("char-race").value,subName:sub?$("char-subtype").value:"",haloName:halo?$("char-halo").value:""};
}
function rebuildSub(keep,keepHalo){
  const r=RACES[$("char-race").value]||RACES.Humano,keys=Object.keys(r.subs||{});
  $("subWrap").classList.toggle("hidden",!keys.length);$("subLbl").textContent=r.subLabel||"Tipagem";
  const cur=keep??$("char-subtype").value;
  fillSelect("char-subtype",keys);
  if(keys.includes(cur)) $("char-subtype").value=cur;
  rebuildHalo(keepHalo);
}
function rebuildHalo(keep){
  const {sub}=raceData(),keys=Object.keys((sub&&sub.halos)||{});
  $("haloWrap").classList.toggle("hidden",!keys.length);
  const cur=keep??$("char-halo").value;
  fillSelect("char-halo",keys);
  if(keys.includes(cur)) $("char-halo").value=cur;
  $("animaWrap").classList.toggle("hidden",!(sub&&sub.animaType));
}
function raceSpeed(){const {r,sub}=raceData();return (sub&&sub.speed)||r.speed||"9m";}
// níveis: total, especialização 1 e 2 (classe dupla a partir do 5º nível)
function lvlInfo(){
  const total=Math.max(1,Math.min(20,Math.round(num("char-level",1))));
  const multi=$("char-multi").checked&&total>=MULTI_MIN_LEVEL;
  const l2=multi?Math.max(1,Math.min(total-(MULTI_MIN_LEVEL-1),Math.round(num("char-lvl2",1)))):0;
  return {total,multi,l1:total-l2,l2,c1:$("char-class").value,s1:$("char-specialization").value,c2:multi?$("char-class2").value:"",s2:multi?$("char-spec2").value:""};
}
function syncOrigin(){
  const L=lvlInfo();
  $("multiFields").classList.toggle("hidden",!$("char-multi").checked);
  $("spec1Lvl").textContent=`NV ${L.l1}`;$("spec2Lvl").textContent=L.multi?`NV ${L.l2}`:"";
  $("char-lvl2").max=Math.max(1,L.total-(MULTI_MIN_LEVEL-1));
  $("multiNote").textContent=$("char-multi").checked&&!L.multi?`Classe dupla só a partir do ${MULTI_MIN_LEVEL}º nível total.`:
    L.multi?`Especialização 1: ${L.l1} níveis // Especialização 2: ${L.l2} níveis. Da 2ª classe você recebe só proficiências de coletes e armas${L.c1===L.c2?" (mesma classe: nenhuma proficiência nova)":""}.`:"";
}
let COLETE_STR=null;
function refreshColetes(){
  const sel=$("char-colete"),str=num("score-for",10),cur=sel.value||"Nenhum";
  // só refaz a lista quando a Força muda (era refeita a cada tecla)
  if(str===COLETE_STR&&sel.options.length) return;COLETE_STR=str;
  sel.innerHTML=Object.keys(COLETES).map(c=>{const a=COLETES[c],off=a.strReq>str;
    return `<option value="${esc(c)}"${off?" disabled":""}>${esc(c)}  [CA ${a.ac}]${off?`  (FOR ${a.strReq}+)`:""}</option>`;}).join("");
  const opt=[...sel.options].find(o=>o.value===cur);
  if(opt&&!opt.disabled) sel.value=cur;
  else{sel.value="Nenhum";if(opt&&opt.disabled&&state==="sheet") toast(`FORÇA INSUFICIENTE PARA ${cur.toUpperCase()} // COLETE REMOVIDO`,true);}
}
function getMods(){const m={};ATTR_KEYS.forEach(k=>m[k]=modOf(num("score-"+k.toLowerCase(),10)));return m;}
function profBonus(){return Math.floor((lvlInfo().total-1)/4)+2;}

let RADAR_KEY="";
function drawRadar(){
  const key=ATTR_KEYS.map(k=>$("score-"+k.toLowerCase()).value).join("|");
  if(key===RADAR_KEY&&$("radar").childElementCount) return;RADAR_KEY=key;
  const cx=150,cy=138,R=96,svg=$("radar");
  const pt=(i,r)=>{const a=-Math.PI/2+i*Math.PI*2/6;return [cx+Math.cos(a)*r,cy+Math.sin(a)*r];};
  const poly=r=>ATTR_KEYS.map((_,i)=>pt(i,r).map(v=>v.toFixed(1)).join(",")).join(" ");
  let h="";
  [5,10,15,20].forEach(v=>h+=`<polygon points="${poly(R*v/20)}" fill="none" style="stroke:${v===10?"var(--btn)":"var(--line3)"}" stroke-width="1" ${v===10?'stroke-dasharray="3 3"':""}/>`);
  ATTR_KEYS.forEach((_,i)=>{const [x,y]=pt(i,R);h+=`<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" style="stroke:var(--line3)"/>`;});
  const sc=ATTR_KEYS.map(k=>Math.max(0,Math.min(20,num("score-"+k.toLowerCase(),10))));
  const pts=sc.map((s,i)=>pt(i,R*s/20));
  h+=`<polygon points="${pts.map(p=>p.map(v=>v.toFixed(1)).join(",")).join(" ")}" style="fill:rgb(var(--acc-rgb) / .2);stroke:var(--acc)" stroke-width="2"/>`;
  pts.forEach(([x,y])=>h+=`<rect x="${(x-3).toFixed(1)}" y="${(y-3).toFixed(1)}" width="6" height="6" style="fill:var(--txt);stroke:var(--acc)"/>`);
  ATTR_KEYS.forEach((k,i)=>{const [x,y]=pt(i,R+22);const s=num("score-"+k.toLowerCase(),10);
    h+=`<text x="${x.toFixed(1)}" y="${(y-2).toFixed(1)}" text-anchor="middle" style="fill:var(--dim)" font-size="11" letter-spacing="2">${ABBR[k]}</text><text x="${x.toFixed(1)}" y="${(y+11).toFixed(1)}" text-anchor="middle" fill="#ddd" font-size="12" font-weight="bold">${s}</text>`;});
  svg.innerHTML=h;
}

function updateSaves(mods,prof){
  const cls=CLASSES[$("char-class").value]||{saves:[]};
  const choice=cls.choice||[];
  ATTR_KEYS.forEach(k=>{
    const l=k.toLowerCase(),cb=$("prof-save-"+l),lock=$("lock-save-"+l);
    if(cls.saves.includes(k)){cb.checked=true;cb.disabled=true;cb.dataset.manual="";lock.textContent="CLASSE";}
    else if(choice.includes(k)){cb.disabled=false;cb.dataset.manual="1";lock.textContent="ESCOLHA";}
    else{cb.checked=false;cb.disabled=true;cb.dataset.manual="";lock.textContent="";}
    $("row-save-"+l).classList.toggle("prof",cb.checked);
    $("bonus-save-"+l).textContent=fmt(mods[k]+(cb.checked?prof:0));
  });
  $("saveHint").textContent=choice.length?`ESCOLHA 1: ${choice.map(c=>ABBR[c]).join(" OU ")}`:"";
}

function autoSkills(){
  const {r,sub}=raceData(),out=[...(r.auto||[]),...((sub&&sub.auto)||[])];
  return out;
}
function updateSkills(mods,prof){
  const auto=autoSkills();let n=0;
  for(const s in SKILLS){
    const id=skillId(s),cb=$(id);
    if(auto.includes(s)){cb.checked=true;cb.disabled=true;cb.dataset.racialProf="true";$("lock-"+id).textContent="RAÇA";}
    else if(cb.dataset.racialProf){cb.checked=false;cb.disabled=false;delete cb.dataset.racialProf;$("lock-"+id).textContent="";}
    $("row-"+id).classList.toggle("prof",cb.checked);
    if(cb.checked) n++;
    $("bonus-"+id.replace("prof-","")).textContent=fmt(mods[SKILLS[s]]+(cb.checked?prof:0));
  }
  $("skillCount").textContent=`${n} PROFICIENTE${n===1?"":"S"}`;
}

function updateCombat(mods){
  const name=$("char-colete").value,c=COLETES[name]||COLETES.Nenhum;
  let dex=mods.DEX;if(c.maxDex!==null&&dex>c.maxDex) dex=c.maxDex;
  const base=c.addDex?c.ac+dex:c.ac;
  const RD=raceData(),raceAc=(RD.sub&&RD.sub.ac)||0;
  const ac=base+num("ac-bonus-shield")+num("ac-bonus-other")+raceAc;
  $("char-ac").textContent=ac;
  const haloDis=RD.sub&&RD.sub.stealthDis&&!(RD.halo&&RD.halo.noStealthDis);
  $("stealth-disadvantage-indicator").classList.toggle("hidden",!(c.stealthDisadvantage||haloDis));
  $("ammo-primary").textContent=c.primaryAmmo;$("ammo-secondary").textContent=c.secondaryAmmo;
  const ini=mods.DEX+num("init-bonus-other")+(window.INTER?INTER.iniBonus():0);
  $("char-initiative").textContent=fmt(ini);
  const L=lvlInfo(),cls=CLASSES[L.c1],cls2=CLASSES[L.c2],lvl=L.total;
  if(cls) $("char-hit-dice").textContent=`${L.l1}d${cls.hitDice}`+(L.multi&&cls2?` + ${L.l2}d${cls2.hitDice}`:"");
  const dexTxt=c.addDex?(c.maxDex===null?"+ DES":`+ DES (máx ${c.maxDex})`):"(sem DES)";
  $("coleteInfo").innerHTML=`CA BASE <b>${c.ac}</b> ${dexTxt} = <b>${base}</b> &nbsp;//&nbsp; PENTES <b>${c.primaryAmmo}</b> PRIM. / <b>${c.secondaryAmmo}</b> SEC.<br>`+
    (c.strReq?`EXIGE <b>FOR ${c.strReq}</b> &nbsp;//&nbsp; `:"")+(c.stealthDisadvantage?'<span class="bad">DESVANTAGEM EM FURTIVIDADE</span>':"FURTIVIDADE NORMAL")+(raceAc?` &nbsp;//&nbsp; CHASSI REFORÇADO <b>+${raceAc}</b>`:"")+
    `<br>PROFICIÊNCIA DA CLASSE: <b>${esc((cls&&cls.coletes)||"--")}</b>`+(cls2&&L.c2!==L.c1?` + <b>${esc(cls2.coletes)}</b>`:"");
  // P.E.
  // Livro: base 4, +1 nos níveis 3/6/9/15 e +2 no 12. O modificador de Força só paga P.E. de ARMAS.
  const peBase=peBaseFor(lvl),peStr=Math.max(0,mods.FOR),peMax=peBase+num("pe-bonus");
  $("pe-base").textContent=peBase;$("pe-str").textContent=fmt(peStr);
  const cgBase=8+mods.FOR*2;$("cg-base").textContent=cgBase;
  return {ac,ini,peMax,peStr,cgMax:cgBase+num("carga-bonus"),spd:$("char-speed").value||"--"};
}

function totals(peStr=0){
  let peW=0,peE=0,cg=0;
  // equipado: conta P.E. // na maleta: pesa 2 × P.E. na Carga // no Stash: não conta nada
  LISTS.weapons.forEach(w=>{const L=w.local||"";if(!L) peW+=ARM.pe(w);else if(L==="mal") cg+=2*ARM.pe(w);});
  LISTS.equipment.forEach(e=>{const L=e.local||"";if(!L){peE+=nz(e.pe);cg+=(nz(e.qty)||1)*nz(e.carga);}else if(L==="mal") cg+=2*nz(e.pe);});
  LISTS.itens.forEach(e=>{if(e.local!=="stash") cg+=(nz(e.qty)||1)*nz(e.carga);});
  const cover=Math.min(peW,peStr);   // a Força cobre parte do P.E. das armas
  return {pe:+(peE+peW-cover).toFixed(2),peW:+peW.toFixed(2),peE:+peE.toFixed(2),cover:+cover.toFixed(2),cg:+cg.toFixed(2)};
}

// textos de habilidade reescritos pelo jogador (chave da habilidade -> texto)
let HABTXT={};
// usos por descanso das habilidades de classe: HABUSOS[chave#n] = usos gastos
let HABUSOS={},FEAT_LV=1,USE_SEEN=new Set();
const NUMW={um:1,uma:1,dois:2,duas:2,"três":3,tres:3,quatro:4,cinco:5};
// lê o texto do livro e acha os usos por descanso (rest: "curto" = volta no curto e no longo; "longo" = só no longo)
function usesOf(txt,name,lv){
  const P=profBonus(),M=getMods(),out=[];
  const bullets=String(txt||"").replace(/•/g,"\n").split("\n");
  bullets.forEach(bl=>{
    bl=bl.trim();if(!bl) return;
    const blabel=(/^([^:]{2,40}):/.exec(bl)||[])[1];
    // dados de superioridade: "você tem 3 dados ... mais um no 5º, no 9º e no 13º nível ... recupera todos num descanso"
    let m=/você tem (\d+) dados de superioridade/i.exec(bl);
    if(m&&/descanso/i.test(bl)){let n=+m[1];const up=/mais um no ([^.]*?) nível/i.exec(bl);if(up) [...up[1].matchAll(/(\d+)º/g)].forEach(x=>{if(lv>=+x[1]) n++;});
      out.push({label:"Dados de superioridade",max:n,rest:/descanso curto/i.test(bl)?"curto":"longo"});return;}
    bl.split(/(?<=\.)\s+(?=[A-ZÁÉÍÓÚÂÊÔ])/).forEach(fr=>{
      const t=fr.trim();if(!t||/passa a ter/i.test(t)) return;
      if(!/descanso|utiliz[áa]-la novamente/i.test(t)) return;
      // "A partir do 13º nível, você pode usar isso duas vezes por descanso": melhora o contador anterior
      const ap=/^A partir do (\d+)º nível[^.]*?(uma|duas|dois|três|tres|\d+) vez(?:es)? por descanso/i.exec(t);
      if(ap){if(lv>=+ap[1]&&out.length) out[out.length-1].max=NUMW[ap[2].toLowerCase()]||+ap[2];return;}
      let max=null;
      if((m=/(uma|um|duas|dois|três|tres|\d+) (?:vez(?:es)?|usos?) por descanso/i.exec(t))) max=NUMW[m[1].toLowerCase()]||+m[1];
      else if(/número de vezes igual (?:a|à) metade da sua Proef/i.test(t)) max=Math.ceil(P/2);
      else if(/número de vezes igual (?:a|à) (?:sua )?Proef/i.test(t)) max=P;
      else if(/Códigos iguais à (?:sua )?Proef \+ (?:seu )?modificador de Intelig/i.test(t)) max=Math.max(1,P+M.INT);
      else if(/Estamina iguais à sua Proef \+ seu modificador de Constituição/i.test(t)) max=Math.max(1,P+M.CON);
      else if((m=/Usos: (\d+) por descanso longo((?:,? (?:e )?\d+ no \d+º(?: nível)?)+)/i.exec(t))){
        max=+m[1];[...m[2].matchAll(/(\d+) no (\d+)º/g)].forEach(x=>{if(lv>=+x[2]) max=+x[1];});
      }
      else if((m=/igual a (\d+) × seu nível de \w+/i.exec(t))) max=+m[1]*lv;
      else if(/antes de utiliz[áa]-la novamente/i.test(t)) max=1;
      if(!max) return;
      const rest=/descanso curto/i.test(t)||/antes de utiliz/i.test(t)?"curto":"longo";
      let label=(/^([^:]{2,40}):/.exec(t)||[])[1]||blabel||name;
      if(/^usos$/i.test(label.trim())) label=name;
      out.push({label:label.trim(),max,rest});
    });
  });
  // a mesma regra repetida vira um contador só
  return out.filter((u,i)=>out.findIndex(v=>v.max===u.max&&v.rest===u.rest&&v.label===u.label)===i);
}
function usesHTML(key,list){
  return list.map((u,n)=>{const id=key+"#"+n,used=Math.min(u.max,HABUSOS[id]||0),left=u.max-used;
    return `<div class="fuse" data-uid="${esc(id)}" data-rest="${u.rest}" data-max="${u.max}"><em>${esc(u.label.toUpperCase())}</em><button class="step" data-huse="-1" data-nosfx title="Usar">−</button><b>${left} / ${u.max}</b><button class="step" data-huse="1" data-nosfx title="Devolver um uso">+</button>${u.max<=12?`<span class="pips">${Array.from({length:u.max},(_,k)=>`<i class="${k<left?"":"x"}"></i>`).join("")}</span>`:""}<small>${u.rest==="curto"?"VOLTA NO DESCANSO CURTO OU LONGO":"VOLTA NO DESCANSO LONGO"}</small></div>`;}).join("");
}
function featHTML(f,cls,locked,extra="",key=""){
  const own=key&&HABTXT[key]!=null,txt=own?HABTXT[key]:f.desc;
  const d=rtLinhas(txt);
  const tags=key&&!locked&&window.CBT?CBT.tagsFeat(key):"";
  // o mesmo recurso descrito em duas habilidades (ex.: Códigos do Hacker) vira um contador só
  const uses=(key&&!locked?usesOf(key.startsWith("raca|halo")?f.desc:(featOriginal(key)||f.desc),f.name,FEAT_LV):[]).filter(u=>{const k=u.label.toUpperCase()+"|"+u.max;if(u.label!==f.name&&USE_SEEN.has(k)) return false;USE_SEEN.add(k);return true;});
  const ub=uses.length?uses.map((u,n)=>{const left=u.max-Math.min(u.max,HABUSOS[key+"#"+n]||0);return `<span class="dup use-b${left?"":" zero"}">${left}/${u.max}</span>`;}).join(""):"";
  const tools=key?`<div class="fd-acts"><button class="btn sm" data-hedit data-nosfx>✎ ${own?"EDITAR RESUMO":"RESUMIR / EDITAR"}</button>${own?'<button class="btn sm" data-horig data-nosfx>VER ORIGINAL</button><button class="btn sm danger" data-hrest data-nosfx>RESTAURAR TEXTO DO LIVRO</button>':""}</div>`:"";
  return `<details class="feat ${cls}${locked?" lockd":""}${own?" own":""}"${key?` data-fkey="${esc(key)}"`:""}><summary><span class="fn">${esc(f.name)}</span>${own?'<span class="dup own-t">RESUMO DO JOGADOR</span>':""}${ub}${f.lvl?`<span class="lv" title="${locked?"Libera no nível "+f.lvl+" da especialização":"Liberada"}">NV ${f.lvl}</span>`:""}${extra}${tags}</summary><div class="fd">${uses.length?usesHTML(key,uses):""}${d||"<p>--</p>"}${tools}</div></details>`;
}
// texto original do livro de uma habilidade (para comparar/restaurar)
function featOriginal(key){
  const p=key.split("|");
  if(p[0]==="spec"){const f=((SPEC_BOOK[p[1]]||{})[p[2]]||{feats:[]}).feats.find(x=>x.name===p[3]);return f?f.desc:"";}
  if(p[0]==="classe"){const f=passivesOf(p[1]).find(x=>x.name===p[2]);return f?f.desc:"";}
  if(p[0]==="raca"){
    if(p[1]==="halo"){for(const r of Object.values(RACES)) for(const sb of Object.values(r.subs||{})) if(sb.halos&&sb.halos[p[2]]) return sb.halos[p[2]].desc;return "";}
    const r=RACES[p[1]]||Object.values(RACES).map(x=>(x.subs||{})[p[1]]).find(Boolean);const f=r&&r.features.find(x=>x.name===p[2]);return f?f.desc:"";
  }
  return "";
}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-hedit],[data-horig],[data-hrest],[data-hsave],[data-hcancel]");if(!b) return;
  e.preventDefault();
  const det=b.closest("details[data-fkey]"),key=det.dataset.fkey,fd=det.querySelector(".fd");
  if(b.hasAttribute("data-hedit")){
    const cur=HABTXT[key]??featOriginal(key);
    fd.innerHTML=`<textarea class="ta fd-ta" rows="${Math.min(14,Math.max(4,Math.ceil(cur.length/70)))}">${esc(cur)}</textarea><div class="fd-acts"><button class="btn sm acc" data-hsave data-nosfx>SALVAR RESUMO</button><button class="btn sm" data-hcancel data-nosfx>CANCELAR</button><span class="note">Escreva do seu jeito. O texto do livro fica guardado e pode ser restaurado.</span></div>`;
    const ta=fd.querySelector("textarea");ta.focus();ta.setSelectionRange(0,0);sfx("abrir");return;
  }
  if(b.hasAttribute("data-hsave")){
    const v=fd.querySelector("textarea").value.trim();
    if(!v||v===featOriginal(key).trim()) delete HABTXT[key]; else HABTXT[key]=v;
    sfx("fechar");updateFeatures(true);changed(true);toast(HABTXT[key]!=null?"RESUMO SALVO NA FICHA":"TEXTO DO LIVRO MANTIDO");return;
  }
  if(b.hasAttribute("data-hcancel")){sfx("fechar");updateFeatures(true);return;}
  if(b.hasAttribute("data-horig")){
    const op=fd.querySelector(".fd-orig");if(op){op.remove();sfx("fechar");return;}
    const o=document.createElement("div");o.className="fd-orig";o.innerHTML=`<b>TEXTO DO LIVRO</b>`+featOriginal(key).split("\n").filter(Boolean).map(l=>`<p>${esc(l)}</p>`).join("");
    fd.appendChild(o);sfx("abrir");return;
  }
  if(b.hasAttribute("data-hrest")){
    ask("Apagar o seu resumo e voltar para o texto do livro?",{top:"RESTAURAR TEXTO",yes:"RESTAURAR"}).then(ok=>{if(!ok) return;delete HABTXT[key];updateFeatures(true);changed(true);});
  }
},true);
function passivesOf(c){return CLASS_PASSIVES[c]||[];}
const FEAT_FOLD=new Set((()=>{try{return JSON.parse(localStorage.getItem("ficha141_featFold")||"[]");}catch(e){return [];}})());
function featFoldSave(){try{localStorage.setItem("ficha141_featFold",JSON.stringify([...FEAT_FOLD]));}catch(e){}}
document.addEventListener("click",e=>{
  const t=e.target.closest("[data-fg-t]");
  if(t){const g=t.closest(".feat-g"),k=g.dataset.fg,f=g.classList.toggle("fold");f?FEAT_FOLD.add(k):FEAT_FOLD.delete(k);t.setAttribute("aria-expanded",String(!f));featFoldSave();sfx("clique");return;}
  const a=e.target.closest("[data-fg-all]");
  if(a){const gs=[...document.querySelectorAll("#features .feat-g")],fechar=a.dataset.fgAll==="1";
    gs.forEach(g=>{g.classList.toggle("fold",fechar);fechar?FEAT_FOLD.add(g.dataset.fg):FEAT_FOLD.delete(g.dataset.fg);g.querySelector("[data-fg-t]").setAttribute("aria-expanded",String(!fechar));});
    featFoldSave();sfx("clique");}
});
let FEAT_HTML="";
function updateFeatures(force){
  if(!force&&document.querySelector("#features .fd-ta")) return;   // não apaga um resumo sendo escrito
  const L=lvlInfo(),RD=raceData();let h="";FEAT_LV=L.total;USE_SEEN=new Set();
  // cada categoria pode ser recolhida (fica lembrado no aparelho)
  const group=(t,body,k)=>{if(!body) return "";const n=(body.match(/<details class="feat /g)||[]).length,f=FEAT_FOLD.has(k);
    return `<div class="feat-g${f?" fold":""}" data-fg="${esc(k)}"><button class="feat-t" type="button" data-fg-t aria-expanded="${!f}" data-nosfx><i class="fg-ar">▾</i>${t}<em class="fg-n">${n}</em></button><div class="feat-b">${body}</div></div>`;};
  let rf=RD.r.features.map(f=>featHTML(f,"race",false,"",`raca|${RD.name}|${f.name}`)).join("");
  if(RD.sub) rf+=RD.sub.features.map(f=>featHTML(f,"mut",false,"",`raca|${RD.subName}|${f.name}`)).join("");
  if(RD.halo) rf+=featHTML({name:"Auréola "+RD.haloName,desc:RD.halo.desc},"mut",false,"",`raca|halo|${RD.haloName}`);
  const an=$("char-anima").value.trim();if(RD.sub&&RD.sub.animaType&&an) rf+=featHTML({name:"Anima: "+an,desc:"Bônus de atributo e traço animal definidos pelo tipo de Anima."},"mut",false);
  h+=group(esc(`HUMANIDADE // ${RD.name.toUpperCase()}${RD.subName?" // "+RD.subName.toUpperCase():""}`),rf,"humanidade");
  const got=new Set();
  const specBlock=(c,sp,lv,first)=>{
    const d=(SPEC_BOOK[c]||{})[sp];if(!d) return "";
    let b="";FEAT_LV=lv;
    if(first||c!==L.c1) b+=passivesOf(c).map(pas=>featHTML(pas,"cls",false,'<span class="dup">PASSIVA DE CLASSE</span>',`classe|${c}|${pas.name}`)).join("");
    if(d.intro&&first!==null) b+=featHTML({name:"Sobre a especialização",desc:d.intro},"cls",false);
    const unlocked=d.feats.filter(f=>f.lvl<=lv).length;
    const key=n=>n.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().trim(),shared=SHARED_FEATURES.map(key);
    b+=d.feats.map(f=>{const k=key(f.name),dup=!first&&f.lvl<=lv&&shared.includes(k)&&got.has(k);
      if(f.lvl<=lv) got.add(k);
      return featHTML(f,"spec",f.lvl>lv,dup?'<span class="dup">JÁ OBTIDA // NÃO ACUMULA</span>':"",dup?"":`spec|${c}|${sp}|${f.name}`);}).join("");
    return group(`${esc(c.toUpperCase())} // ${esc(sp.toUpperCase())} &nbsp;// NV ${lv} &nbsp;[${unlocked}/${d.feats.length}]`,b,"esp|"+c+"|"+sp);
  };
  h+=specBlock(L.c1,L.s1,L.l1,true);
  if(L.multi) h+=specBlock(L.c2,L.s2,L.l2,false);
  // nada mudou: não refaz o HTML (era a parte mais pesada de cada atualização)
  h=h||'<div class="empty">SEM DADOS</div>';
  if(!force&&h===FEAT_HTML&&$("features").childElementCount) return;FEAT_HTML=h;
  const idOf=d=>d.dataset.fkey||d.querySelector(".fn").textContent;
  const open=new Set([...document.querySelectorAll("#features details[open]")].map(idOf));
  $("features").innerHTML=h;
  document.querySelectorAll("#features details").forEach(d=>{if(open.has(idOf(d))) d.open=true;});
}

const INJ_PARTS=["injury-head","injury-torso","injury-left-arm","injury-right-arm","injury-left-leg","injury-right-leg"];
const INJ_NAMES={"injury-head":"CABEÇA","injury-torso":"TORSO","injury-left-arm":"BRAÇO ESQ.","injury-right-arm":"BRAÇO DIR.","injury-left-leg":"PERNA ESQ.","injury-right-leg":"PERNA DIR."};
function updateInjuries(){
  const on=new Set(INJ_PARTS.filter(p=>$(p).classList.contains("injured")));
  const out=[],add=(t,d,crit)=>out.push(`<div class="inj${crit?" crit":""}"><em>${t}</em>${esc(d)}</div>`);
  if(on.has("injury-head")) add("CABEÇA",INJURY_DESCRIPTIONS["injury-head"]);
  if(on.has("injury-torso")) add("TORSO",INJURY_DESCRIPTIONS["injury-torso"]);
  if(on.has("injury-left-arm")&&on.has("injury-right-arm")) add("AMBOS OS BRAÇOS",INJURY_DESCRIPTIONS["arms-crippled"],true);
  else ["injury-left-arm","injury-right-arm"].forEach(p=>{if(on.has(p)) add(INJ_NAMES[p],INJURY_DESCRIPTIONS[p]);});
  if(on.has("injury-left-leg")&&on.has("injury-right-leg")) add("AMBAS AS PERNAS",INJURY_DESCRIPTIONS["legs-crippled"],true);
  else ["injury-left-leg","injury-right-leg"].forEach(p=>{if(on.has(p)) add(INJ_NAMES[p],INJURY_DESCRIPTIONS[p]);});
  $("injList").innerHTML=out.join("")||'<div class="inj-none">NENHUM FERIMENTO CRÍTICO ATIVO.</div>';
}

let lastHp=null;
function update(){
  syncOrigin();
  const prof=profBonus(),mods=getMods();
  ATTR_KEYS.forEach(k=>$("mod-"+k.toLowerCase()).textContent=fmt(mods[k]));
  drawRadar();
  refreshColetes();
  updateSaves(mods,prof);
  updateSkills(mods,prof);
  const c=updateCombat(mods),t=totals(c.peStr);
  updateFeatures();
  for(let i=1;i<=6;i++) $("exl-"+i).classList.toggle("on",$("exhaustion-level-"+i).checked);
  // recursos
  const peOver=t.pe>c.peMax,cgOver=t.cg>c.cgMax;
  const vg=x=>String(x).replace(".",",");
  $("peRo").textContent=`${vg(t.pe)} / ${vg(c.peMax)}`;
  $("peNote").innerHTML=`ARMAS <b>${vg(t.peW)}</b>${t.cover?` (FORÇA PAGA <b>${vg(t.cover)}</b>)`:""} &nbsp;//&nbsp; EQUIPAMENTOS <b>${vg(t.peE)}</b>`;$("cgRo").textContent=`${t.cg} / ${c.cgMax}`+(cgOver?"  // SOBRECARGA":"");
  $("peRo").style.color=peOver?"var(--red)":"";$("cgRo").style.color=cgOver?"var(--red)":"";
  const pct=(a,b)=>Math.max(0,Math.min(100,b>0?a/b*100:(a>0?100:0)));
  $("peMeter").firstChild.style.width=pct(t.pe,c.peMax)+"%";$("peMeter").classList.toggle("over",peOver);
  $("cgMeter").firstChild.style.width=pct(t.cg,c.cgMax)+"%";$("cgMeter").classList.toggle("over",cgOver);
  INV.cg=t.cg;INV.cgMax=c.cgMax;invInfo();
  // HUD
  const lvl=lvlInfo().total;
  $("hLvl").textContent=lvl;
  // PVon (Livro: 10 + CON + SAB + 2 × nível + Proef) e níveis de Estafa
  const pvMax=10+mods.CON+mods.SAB+2*lvl+prof,pvEl=$("char-pvon");
  $("pvonMax").textContent=pvMax;
  const pv=pvEl.value===""?pvMax:nz(pvEl.value),pr=pvMax>0?pv/pvMax:1;
  const est=pv<=0?4:pr<.25?3:pr<.5?2:pr<.75?1:0;
  $("estafa").textContent=["","ESTAFA 1: desvantagem em todos os testes de habilidade e perícia.","ESTAFA 2: deslocamento reduzido pela metade.","ESTAFA 3: desvantagem em jogadas de ataque e testes de resistência.","ESTAFA 4: inconsciente por 1d4 horas, ou até ser acordado."][est];$("hProf").textContent=fmt(prof);$("hAc").textContent=c.ac;$("hInit").textContent=fmt(c.ini);$("hSpd").textContent=c.spd;
  const hc=$("char-hp-current").value,hm=$("char-hp-max").value;
  const htmp=window.INTER?INTER.temp():0;
  $("hHp").textContent=`${hc===""?"--":hc} / ${hm===""?"--":hm}${htmp?` +${htmp}`:""}`;
  const hp=pct(nz(hc),nz(hm));
  // com PV temporários a barra representa atual + temporários (sem passar de 100% do conjunto)
  const cur=hc===""?nz(hm):nz(hc),tot=Math.max(nz(hm),cur+htmp)||1;
  $("hHpBar").style.width=(hm===""?0:Math.min(100,cur/tot*100))+"%";
  const tb=$("hTmpBar");tb.style.left=(hm===""?0:Math.min(100,cur/tot*100))+"%";tb.style.width=(hm===""||!htmp?0:Math.min(100,htmp/tot*100))+"%";
  $("hHpBox").classList.toggle("low",hm!==""&&hc!==""&&hp<=25);
  if(window.ECG) ECG.ler();
  if(lastHp!==null&&hc!==""&&nz(hc)<lastHp){const hud=$("hud");hud.classList.remove("hit");void hud.offsetWidth;hud.classList.add("hit");}
  lastHp=hc===""?null:nz(hc);
  $("hPe").textContent=`${String(t.pe).replace(".",",")} / ${String(c.peMax).replace(".",",")}`;$("hPeBox").classList.toggle("over",peOver);
  $("hCg").textContent=`${t.cg} / ${c.cgMax}`;$("hCgBox").classList.toggle("over",cgOver);
  // cabeçalho
  const cod=$("char-codename").value.trim();
  $("hdName").textContent=cod?cod.toUpperCase():"OPERADOR SEM CODINOME";
  const RD=raceData(),LV=lvlInfo();
  $("hdSub").textContent=[`${LV.c1} ${LV.s1}${LV.multi?" "+LV.l1:""}`,LV.multi?`${LV.c2} ${LV.s2} ${LV.l2}`:"",RD.name+(RD.subName?" ("+RD.subName+")":""),COUNTRIES[$("char-nationality").value]||""].filter(Boolean).join(" // ").toUpperCase();
  document.title=cod?`141 // ${cod.toUpperCase()}`:"141 // FICHA DE OPERADOR";
  applyFx();
  ARM.refresh();bolsoInfo();updateFirewall();if(window.INTER) INTER.refresh();
  const bsig=lvlInfo().total+"|"+profBonus();if(bsig!==update._b&&!LISTS.bolso.some(x=>x._edit)){update._b=bsig;renderList("bolso");}
  if(window.CBT&&CBT.on) CBT.hud();
}
