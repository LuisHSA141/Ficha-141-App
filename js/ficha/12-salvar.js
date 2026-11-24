"use strict";
// ================== SALVAR / CARREGAR ==================
// Formato igual ao da ficha antiga (mesmos IDs), então os .json antigos continuam abrindo aqui.
function collect(){
  const d={version:3,inputs:{},checkboxes:{},textareas:{},selects:{},
    nationality:$("char-nationality").value,portraitSrc,backgroundUrl:$("background-url-input").value,theme:"dark",
    criticalInjuries:INJ_PARTS.filter(p=>$(p).classList.contains("injured")),
    dynamic:{}};
  document.querySelectorAll("[data-save]").forEach(el=>{
    if(el.type==="checkbox"){if(!el.disabled||el.dataset.manual) d.checkboxes[el.id]=el.checked;}
    else if(el.tagName==="TEXTAREA") d.textareas[el.id]=el.value;
    else if(el.tagName==="SELECT") d.selects[el.id]=el.value;
    else d.inputs[el.id]=el.value;
  });
  d.estados=[...fxManual];
  d.habTexto=Object.assign({},HABTXT);d.habUsos=Object.assign({},HABUSOS);if(window.DADOS) d.dadosHist=DADOS.salvar();if(window.INTER) d.interludio=INTER.salvar();
  if(window.CBT) CBT.save(d);
  if(window.MOD) d.layout=MOD.save();
  for(const l in LISTS) d.dynamic[l]=LISTS[l].filter(it=>!it._new).map(it=>it._snap?JSON.parse(it._snap):cleanItem(it));
  return d;
}
function resetForm(){
  document.querySelectorAll("[data-save]").forEach(el=>{
    if(el.type==="checkbox"){el.checked=false;el.disabled=false;delete el.dataset.racialProf;el.dataset.manual="";}
    else if(el.tagName!=="SELECT") el.value=el.dataset.def??"";
  });
  $("char-class").selectedIndex=0;$("char-race").selectedIndex=0;$("char-class2").selectedIndex=0;
  rebuildSpec("");rebuildSub("");rebuildSpec2("");$("char-colete").value="Nenhum";
  setNat("US");setPortrait("");setBg("");
  INJ_PARTS.forEach(p=>$(p).classList.remove("injured"));
  for(const l in LISTS) LISTS[l]=[];
  lastHp=null;INV.sel=null;fxManual.clear();HABTXT={};HABUSOS={};if(window.CBT) CBT.reset();if(window.DADOS){DADOS.carregar([]);DADOS.abrir(false);}if(window.INTER) INTER.carregar(null);
}
function apply(d){
  if(!d||typeof d!=="object"||(!d.inputs&&!d.selects&&!d.dynamic)) throw new Error("arquivo não parece uma ficha do 1.4.1");
  const S=d.selects||{},I=d.inputs||{},C=d.checkboxes||{},T=d.textareas||{},D=d.dynamic||{};
  resetForm();
  const setSel=(id,v)=>{if(v!=null&&[...$(id).options].some(o=>o.value===v)) $(id).value=v;};
  setSel("char-class",S["char-class"]);rebuildSpec(S["char-specialization"]);
  // humanidade (fichas antigas: "Mecanizado" virou Mecanizado/Nanotec e a tipagem de mutante tinha outro id)
  let race=S["char-race"],sub=S["char-subtype"]??S["char-mutant-subtype"];
  if(race==="Mecanizado"&&!sub) sub="Nanotec";
  setSel("char-race",race);rebuildSub(sub,S["char-halo"]);
  setSel("char-class2",S["char-class2"]);rebuildSpec2(S["char-spec2"]);
  for(const id in I){const el=$(id);if(el&&el.hasAttribute("data-save")) el.value=I[id];}
  refreshColetes();setSel("char-colete",S["char-colete"]);
  if($("char-colete").selectedOptions[0]?.disabled) $("char-colete").value="Nenhum";
  for(const id in C){const el=$(id);if(el&&el.type==="checkbox") el.checked=!!C[id];}
  for(const id in T){const el=$(id);if(el) el.value=T[id];}
  if(d.nationality) setNat(d.nationality);
  setPortrait(d.portraitSrc);setBg(d.backgroundUrl||I["background-url-input"]||"");
  (d.criticalInjuries||[]).forEach(p=>{if($(p)) $(p).classList.add("injured");});
  for(const l in LISTS){
    LISTS[l]=(Array.isArray(D[l])?D[l]:[]).map(src=>{const it=blank(l);FIELDS[l].forEach(f=>{if(src[f]!=null) it[f]=String(src[f]);});return it;});
  }
  (Array.isArray(d.estados)?d.estados:[]).forEach(id=>{if(FX_BY[id]&&id!=="surpreendido") fxManual.add(id);});
  HABTXT=Object.assign({},d.habTexto||{});HABUSOS=Object.assign({},d.habUsos||{});if(window.DADOS) DADOS.carregar(d.dadosHist);if(window.INTER) INTER.carregar(d.interludio);
  if(window.CBT) CBT.load(d);
  if(window.MOD) MOD.load(d.layout);
  update();renderAll();updateInjuries();
  lastHp=$("char-hp-current").value===""?null:nz($("char-hp-current").value);
}

let autoT=null,dirty=false;
function changed(soft=false){
  clearTimeout(updT);update();if(!soft) updateInjuries();
  dirty=true;clearTimeout(autoT);autoT=setTimeout(autosave,700);
}
// digitação: junta várias teclas numa atualização só (a ficha recalcula ~90ms depois da última tecla)
let updT=0;
function changedDigitando(){
  dirty=true;clearTimeout(autoT);autoT=setTimeout(autosave,700);
  clearTimeout(updT);updT=setTimeout(update,90);
}
function autosave(){
  if(state!=="sheet") return Promise.resolve(true);
  dirty=false;
  return FICHAS.save(collect()).then(ok=>{
    const t=new Date().toLocaleTimeString("pt-BR");
    $("saveState").textContent=ok?`AUTOSAVE: ${t}`:"AUTOSAVE: FALHOU (ARMAZENAMENTO CHEIO)";
    $("saveState").style.color=ok?"":"var(--red)";
    updateOpsInfo();
    return ok;
  });
}
window.addEventListener("beforeunload",()=>{if(dirty) autosave();});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&dirty) autosave();});

function quickSave(){
  FICHAS.saveQuick(collect()).then(ok=>{
    if(ok){toast("SALVAMENTO RÁPIDO CONCLUÍDO");dirty=false;}
    else{toast("NÃO FOI POSSÍVEL SALVAR // ARMAZENAMENTO CHEIO, EXPORTE O .JSON",true);sfx("errado");}
  });
}
$("saveBtn").onclick=quickSave;
$("loadBtn").setAttribute("data-nosfx","");
$("loadBtn").onclick=async()=>{
  const q=FICHAS.quick(FICHAS.current);
  if(!q){sfx("errado");toast("ESTE OPERADOR NÃO TEM SALVAMENTO RÁPIDO",true);return;}
  sfx("clique");
  if(!await ask("Voltar para o último salvamento rápido deste operador? O que não foi salvo nele será perdido.",{top:"CARREGAR RÁPIDO",yes:"CARREGAR"})) return;
  try{apply(JSON.parse(JSON.stringify(q)));autosave();toast("SALVAMENTO RÁPIDO CARREGADO");}catch(e){toast("ERRO AO CARREGAR: "+e.message,true);sfx("errado");}
};
$("clearBtn").setAttribute("data-nosfx","");
$("clearBtn").onclick=async()=>{
  sfx("clique");
  if(!await ask("Limpar a ficha deste operador? Os outros operadores salvos não são afetados.",{top:"LIMPAR FICHA",yes:"LIMPAR"})) return;
  resetForm();update();renderAll();updateInjuries();autosave();toast("FICHA LIMPA");
};
$("downloadBtn").onclick=async()=>{
  try{const r=await FICHAS.exportJSON(collect(),$("char-codename").value);if(r!=="cancel") toast(r==="share"?"FICHA PRONTA PARA COMPARTILHAR":r==="saved"?"FICHA SALVA NO ARQUIVO ESCOLHIDO":"ARQUIVO GERADO");}
  catch(e){sfx("errado");toast("NÃO FOI POSSÍVEL EXPORTAR: "+e.message,true);}
};
$("restShort").onclick=()=>descanso("curto");$("restLong").onclick=()=>{sfx("clique");INTER.abrir();};
// Firewall (CA contra invasão): equipamentos pessoais 8 + Proef + Int; Sistema interno (Autômato) e autômato do Criador 10 + Proef + Int
function updateFirewall(){
  const P=profBonus(),I=getMods().INT,RD=raceData(),L=lvlInfo();
  const rows=[["EQUIPAMENTOS PESSOAIS",8+P+I,"8 + Proef + Int // drones, pontos, visores, próteses"]];
  if(/aut[ôo]mato/i.test(RD.subName||"")) rows.push(["CHASSI (SISTEMA INTERNO)",10+P+I,"10 + Proef + Int // Interferir: perde a Reação; Controlar nunca funciona"]);
  if([[L.c1,L.s1],L.multi?[L.c2,L.s2]:null].some(x=>x&&x[0]==="Hacker"&&/criador/i.test(x[1]))) rows.push(["AUTÔMATO DO CRIADOR",10+P+I,"10 + Proef + Int // sem Sistema interno: pode ser Controlado"]);
  $("fwBox").innerHTML=`<span class="lbl">Firewall (defesa contra invasão)</span>`+rows.map(r=>`<div class="fw-r"><b>${r[1]}</b><span>${r[0]}<small>${r[2]}</small></span></div>`).join("");
}
$("opsBtn").onclick=()=>{sfx("clique");goTitle(true);};
async function updateOpsInfo(){
  const n=FICHAS.list().length,u=await FICHAS.usage();
  const mb=u>1048576?(u/1048576).toFixed(1)+" MB":Math.max(1,Math.round(u/1024))+" KB";
  $("opsInfo").innerHTML=`<b>${n}</b> OPERADOR${n===1?"":"ES"} SALVO${n===1?"":"S"} // ${mb} USADOS // GUARDADOS NO ${esc(FICHAS.where.toUpperCase())}`;
}
$("upload-file").onchange=e=>{
  const f=e.target.files[0];if(!f) return;
  const r=new FileReader();
  r.onload=async()=>{
    try{const d=JSON.parse(r.result);
      if(!await ask(`Carregar "${f.name}"? Tudo que está na tela será substituído.`,{top:"CARREGAR ARQUIVO",yes:"CARREGAR"})) return;
      apply(d);autosave();toast("FICHA CARREGADA DO ARQUIVO");
    }catch(err){sfx("errado");toast("ARQUIVO INVÁLIDO: "+err.message,true);}
  };
  r.readAsText(f);e.target.value="";
};
