"use strict";
// ================== DESCANSOS ==================
async function descanso(tipo){
  const longo=tipo==="longo";
  sfx("clique");
  if(!await ask(longo?"Descanso longo: PV e PVon cheios, Estafa zerada, todos os usos de habilidades, Itens de Bolso de Recarga e Habilidades Únicas restaurados.":"Descanso curto: recupera metade do PVon, os usos que voltam no descanso curto e os Itens de Bolso de Recarga. Os PV não mudam: some a cura dos Dados de Vida no campo (ex.: +12).",{top:longo?"DESCANSO LONGO":"DESCANSO CURTO",yes:"DESCANSAR"})) return;
  const feito=[];
  const pvMax=nz($("pvonMax").textContent),pv=$("char-pvon").value===""?pvMax:nz($("char-pvon").value);
  if(longo){
    const hm=$("char-hp-max").value;if(hm!==""){$("char-hp-current").value=hm;feito.push("PV");}
    $("char-pvon").value=pvMax;feito.push("PVON");
  }else{const nv=Math.min(pvMax,pv+Math.ceil(pvMax/2));if(nv!==pv){$("char-pvon").value=nv;feito.push("PVON +"+(nv-pv));}}
  // usos de habilidades de classe
  const antes=Object.keys(HABUSOS).length;
  document.querySelectorAll("#features .fuse").forEach(r=>{if(longo||r.dataset.rest==="curto") delete HABUSOS[r.dataset.uid];});
  if(longo) HABUSOS={};
  if(antes!==Object.keys(HABUSOS).length) feito.push("USOS DE HABILIDADE");
  // Itens de Bolso de Recarga
  let nb=0;LISTS.bolso.forEach(it=>{if(it.marca==="Recarga"&&String(it.usosAtuais)!==String(profBonus())){it.usosAtuais=String(profBonus());nb++;}});
  if(nb) feito.push("ITENS DE BOLSO");
  if(longo){
    let nc=0;LISTS.equipment.forEach(it=>{if(nz(it.cargasMax)&&nz(it.cargasAtual)<nz(it.cargasMax)){it.cargasAtual=it.cargasMax;nc++;}});
    if(nc) feito.push("CARGAS DE BATERIA");
    if(LISTS.equipment.some(it=>nz(it.qtdMax)&&nz(it.qtdAtual)<nz(it.qtdMax))&&await ask("O grupo tem Suprimentos ou acesso a uma loja? Se sim, as unidades gastas dos equipamentos (granadas, minas, kits...) voltam.",{top:"REPOR UNIDADES",yes:"REPOR",no:"NÃO TEM"})){
      LISTS.equipment.forEach(it=>{if(nz(it.qtdMax)) it.qtdAtual=it.qtdMax;});feito.push("UNIDADES DE EQUIPAMENTO");
    }
  }
  if(longo){let nt=0;LISTS.traits.forEach(t=>{if(nz(t.usosMax)>0&&nz(t.usosAtuais)<nz(t.usosMax)){t.usosAtuais=t.usosMax;nt++;}});if(nt) feito.push("HABILIDADES ÚNICAS");}
  if(window.ARM) ARM.recoilReset();
  renderAll();update();updateFeatures(true);changed();
  sfx("abrir");toast(`${longo?"DESCANSO LONGO":"DESCANSO CURTO"} // ${feito.length?feito.join(", "):"NADA A RECUPERAR"}`);
}
