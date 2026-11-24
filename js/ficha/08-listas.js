"use strict";
// ================== LISTAS DINÂMICAS ==================
const LISTS={weapons:[],equipment:[],itens:[],bolso:[],titles:[],talents:[],traits:[]};
const FIELDS={
  weapons:["name","tipo","damage","dmgTipo","attr","attrOpc","range","faixa","metros","disparos","municao","modos","recarga","swap","pe","slots","acc","accCustom","accMax","prof","kit","traco","local","invX","invY","invRot","invIn","penteAtual","penteMax","desc","imageSrc","acoes"],
  equipment:["name","tipo","acao","qty","qtdAtual","qtdMax","cargasAtual","cargasMax","carga","pe","veiculo","excl","desc","melhorias","acoes","local","invX","invY","invRot","invIn"],
  itens:["name","qty","carga","desc","imageSrc","acoes","invW","invH","invX","invY","invRot","invIn","local"],
  bolso:["name","marca","acao","classe","desc","melhorias","usosAtuais","acoes"],
  titles:["name","desc","acoes"],talents:["name","desc","acoes"],traits:["name","desc","usosAtuais","usosMax","acoes"]
};
// Terminal de Chamada "PÁTIO": o P.E. depende do veículo registrado
const PATIO_VEIC=[{k:"",n:"-- escolha o veículo --",pe:""},{k:"leve",n:"Leve (moto, quadriciclo, jet ski): P.E. 1",pe:"1"},{k:"medio",n:"Médio (carro, picape, SUV, lancha): P.E. 2",pe:"2"},{k:"pesado",n:"Pesado (caminhão, van blindada, blindado leve sem armamento): P.E. 3",pe:"3"},{k:"militar",n:"Militar (blindado de transporte armado, helicóptero de transporte): P.E. 4,5",pe:"4.5"}];
document.addEventListener("change",e=>{const s=e.target.closest&&e.target.closest("[data-patio]");if(!s) return;const v=PATIO_VEIC.find(x=>x.k===s.value);const pe=s.closest(".card")?.querySelector('[data-k="pe"]');if(v&&v.pe&&pe){pe.value=v.pe;pe.dispatchEvent(new Event("input",{bubbles:true}));}});
const NOUN={weapons:"ARMA",equipment:"EQUIPAMENTO",itens:"ITEM",bolso:"ITEM DE BOLSO",titles:"TÍTULO",talents:"TALENTO",traits:"HABILIDADE ÚNICA"};
function blank(list){const o={};FIELDS[list].forEach(f=>o[f]="");if(list==="equipment"||list==="itens") o.qty="1";if(o.invW!==undefined){o.invW="1";o.invH="1";}return o;}

function viewCard(list,it,i){
  const acts=`<div class="card-a">${window.CBT?CBT.tagsItem(list,i,it):""}<button class="btn ico" data-code title="Gerar código para passar a outro jogador" data-nosfx>⧉</button><button class="btn ico" data-act="edit" title="Editar" data-nosfx>✎</button><button class="btn ico danger" data-act="del" title="Excluir" data-nosfx>×</button></div>`;
  const name=esc(it.name)||`<span style="color:var(--dim2)">${NOUN[list]} SEM NOME</span>`;
  const desc=it.desc?`<p class="desc">${rtx(it.desc)}</p>`:"";
  if(list==="weapons") return ARM.view(it,i,acts,name);
  if(list==="equipment"){
    const q=nz(it.qty)||1,cg=nz(it.carga);
    const st=[["P.E.",String(it.pe??"").replace(".",",")],["CARGA",it.carga!==""&&it.carga!=null?`${it.carga}${q>1?` × ${q} = ${+(cg*q).toFixed(2)}`:""}`:""]].filter(x=>x[1]!==""&&x[1]!=null).map(x=>`<span><em>${x[0]}</em>${esc(x[1])}</span>`).join("");
    const chips=[it.tipo?`<b class="wt">${esc(it.tipo)}</b>`:"",it.acao?`<i class="wm">${esc(it.acao)}</i>`:"",it.excl?`<i class="wm">EXCLUSIVO: ${esc(it.excl)}</i>`:""].join("");
    // unidades (Lançáveis, Armadilhas, Consumíveis) e cargas (Baterias)
    const cont=(k,lbl,dica)=>{const mx=nz(it[k+"Max"]);if(!mx) return "";if(String(it[k+"Atual"]??"")===""||nz(it[k+"Atual"])>mx) it[k+"Atual"]=String(mx);const cur=nz(it[k+"Atual"]);
      return `<div class="uses" title="${dica}"><em>${lbl}</em><button class="step" data-act="dec" data-k="${k}Atual" data-nosfx>−</button><b>${cur} / ${mx}</b><button class="step" data-act="inc" data-k="${k}Atual" data-nosfx>+</button>${mx<=12?`<div class="pips">${Array.from({length:mx},(_,j)=>`<i class="${j<cur?"":"x"}"></i>`).join("")}</div>`:""}</div>`;};
    const mel=it.melhorias?`<details class="wdet"><summary>MELHORIAS</summary>${rtLinhas(it.melhorias)}</details>`:"";
    return `<div class="card" data-list="${list}" data-i="${i}"><div class="card-b"><div class="card-h"><span class="inv-grab" title="Arraste para a maleta ou o stash">⠿</span><div class="card-n">${name}${q>1?`<small>× ${esc(it.qty)}</small>`:""}</div>${acts}</div>${chips?`<div class="wchips">${chips}</div>`:""}${st?`<div class="stats">${st}</div>`:""}${cont("qtd","UNIDADES","Voltam no descanso longo se o grupo tiver Suprimentos ou loja")}${cont("cargas","CARGAS","Voltam no descanso longo ou com uma Célula de Energia")}${desc}${mel}</div></div>`;
  }
  if(list==="bolso"){
    const rec=it.marca==="Recarga",max=profBonus();
    if(rec){it.usosMax=String(max);if(String(it.usosAtuais??"")===""||nz(it.usosAtuais)>max) it.usosAtuais=String(max);}
    const cur=nz(it.usosAtuais);
    const chips=[it.marca?`<b class="wt">${esc(it.marca)}</b>`:`<b class="wt dim">SEM MARCAÇÃO</b>`,it.acao?`<i class="wm">${esc(it.acao)}</i>`:"",it.classe?`<i class="wm">SÓ ${esc(it.classe)}</i>`:""].join("");
    const usos=rec?`<div class="uses"><em>USOS</em><button class="step" data-act="dec" data-k="usosAtuais" data-nosfx>−</button><b>${cur} / ${max}</b><button class="step" data-act="inc" data-k="usosAtuais" data-nosfx>+</button><div class="pips">${Array.from({length:max},(_,k)=>`<i class="${k<cur?"":"x"}"></i>`).join("")}</div></div>`:"";
    const mel=it.melhorias?`<details class="wdet"><summary>MELHORIAS</summary>${rtLinhas(it.melhorias)}</details>`:"";
    return `<div class="card" data-list="${list}" data-i="${i}"><div class="card-b"><div class="card-h"><div class="card-n">${name}</div>${acts}</div><div class="wchips">${chips}</div>${usos}${desc}${mel}</div></div>`;
  }
  let uses="";
  if(list==="traits"&&nz(it.usosMax)>0){
    const cur=nz(it.usosAtuais),max=nz(it.usosMax);
    uses=`<div class="uses"><em>USOS</em><button class="step" data-act="dec" data-k="usosAtuais" data-nosfx>−</button><b>${cur} / ${max}</b><button class="step" data-act="inc" data-k="usosAtuais" data-nosfx>+</button>${max<=20?`<div class="pips">${Array.from({length:max},(_,k)=>`<i class="${k<cur?"":"x"}"></i>`).join("")}</div>`:""}</div>`;
  }
  return `<div class="card" data-list="${list}" data-i="${i}"><div class="card-b"><div class="card-h"><div class="card-n">${name}</div>${acts}</div>${uses}${desc}</div></div>`;
}
function editCard(list,it,i){
  const inp=(k,ph,type="text",extra="")=>`<label><span class="lbl">${ph}</span><input class="in" data-k="${k}" type="${type}" value="${esc(it[k])}" ${extra}></label>`;
  let body="";
  if(list==="weapons") body=ARM.edit(it,i);
  else if(list==="bolso"){
    const L=lvlInfo(),tem=c=>!c||c.split(", ").some(x=>x===L.c1||(L.multi&&x===L.c2));
    const sel=(k,opts,cur)=>`<select class="in" data-k="${k}">${opts.map(o=>`<option value="${esc(o[0])}"${o[0]===(cur||"")?" selected":""}>${esc(o[1])}</option>`).join("")}</select>`;
    body=`${it._new?`<label><span class="lbl">Escolher do Guia dos Equipamentos</span><select class="in" data-bk="cat"><option value="">Item personalizado</option>${BOLSO_CAT.map((b,j)=>`<option value="${j}"${tem(b.classe)?"":" disabled"}>${esc(b.name)}${b.marca?" ("+b.marca+")":""}${b.classe?" // só "+esc(b.classe):""}</option>`).join("")}</select></label>`:""}
    ${inp("name","Nome do item")}<div class="ed-g"><label><span class="lbl">Marcação</span>${sel("marca",[["","Escolha..."],["Ferramenta","Ferramenta (sem limite)"],["Recarga","Recarga (usos = Proef)"]],it.marca)}</label><label><span class="lbl">Ação</span>${sel("acao",[["",""],["Ação","Ação"],["Ação Bônus","Ação Bônus"],["Ação Livre","Ação Livre"],["Reação","Reação"]],it.acao)}</label></div>
    <label><span class="lbl">Descrição</span><textarea class="ta" data-k="desc" rows="3">${esc(it.desc)}</textarea></label>
    <label><span class="lbl">Melhorias (uma por linha)</span><textarea class="ta" data-k="melhorias" rows="2">${esc(it.melhorias)}</textarea></label>`;
  }
  else if(list==="equipment"){
    const sel=(k,opts)=>`<select class="in" data-k="${k}">${opts.map(o=>`<option value="${esc(o)}"${o===(it[k]||"")?" selected":""}>${esc(o||"—")}</option>`).join("")}</select>`;
    const TIPOS_EQ=["","Lançável","Armadilha","Bateria","Bateria (Ferramenta de hacking)","Vestido","Vestido / Bateria","Consumível","Consumível (Munição)"];
    body=`${inp("name","Nome do equipamento")}<div class="ed-g"><label><span class="lbl">Tipo</span>${sel("tipo",TIPOS_EQ.includes(it.tipo||"")?TIPOS_EQ:[...TIPOS_EQ,it.tipo])}</label><label><span class="lbl">Ação</span>${sel("acao",["","Ação","Ação Bônus","Ação Livre","Reação"])}</label>${inp("pe","P.E.","number",'step="0.25" min="0"')}</div>
    ${/P[ÁA]TIO/i.test(it.name||"")?`<label class="f"><span class="lbl">Veículo registrado (define o P.E.)</span><select class="in" data-k="veiculo" data-patio>${PATIO_VEIC.map(v=>`<option value="${v.k}"${(it.veiculo||"")===v.k?" selected":""}>${esc(v.n)}</option>`).join("")}</select></label>`:""}
    <div class="ed-g">${inp("qtdMax","Unidades (Quantidade)","number",'min="0"')}${inp("cargasMax","Cargas (Bateria)","number",'min="0"')}${inp("carga","Carga (peso)","number",'step="0.5"')}</div>
    <label><span class="lbl">Descrição</span><textarea class="ta" data-k="desc" rows="3">${esc(it.desc)}</textarea></label>
    <label><span class="lbl">Melhorias (uma por linha)</span><textarea class="ta" data-k="melhorias" rows="2">${esc(it.melhorias)}</textarea></label>`;
  }
  else if(list==="itens") body=`${inp("name","Nome do item")}<div class="ed-g">${inp("qty","Quantidade","number",'min="1"')}${inp("carga","Carga (un.)","number",'step="0.5"')}${inp("invW","Maleta: largura","number",'min="1" max="12"')}${inp("invH","Maleta: altura","number",'min="1" max="12"')}</div>
    <label><span class="lbl">Descrição</span><textarea class="ta" data-k="desc" rows="2">${esc(it.desc)}</textarea></label>`;
  else body=`${inp("name","Nome do "+NOUN[list].toLowerCase())}${list==="traits"?`<div class="ed-g">${inp("usosAtuais","Usos atuais","number")}${inp("usosMax","Usos máx. (vazio = sem usos)","number")}</div>`:""}
    <label><span class="lbl">Descrição</span><textarea class="ta" data-k="desc" rows="3">${esc(it.desc)}</textarea></label>`;
  const img=list==="weapons"||list==="itens"?`<label class="w-img">${it.imageSrc?`<img src="${esc(it.imageSrc)}" alt=""><button class="x" data-act="noimg" title="Remover imagem" data-nosfx>×</button>`:"▸ ENVIAR<br>IMAGEM"}<input type="file" accept="image/*" class="hidden" data-act-file="img"></label>`:"";
  return `<div class="card edit" data-list="${list}" data-i="${i}">${img}<div class="card-b ed">${body}
    <div class="ed-a"><button class="btn sm danger" data-act="cancel" data-nosfx>${it._new?"DESCARTAR":"CANCELAR"}</button><button class="btn sm acc" data-act="ok" data-nosfx>SALVAR</button></div></div></div>`;
}
function renderList(list){
  const el=$("list-"+list),arr=LISTS[list];
  if(list==="itens"){el.innerHTML=arr.map((it,i)=>it._edit?editCard(list,it,i):"").join("");renderInv(true);return;}
  const guardado=it=>(list==="weapons"||list==="equipment")&&it.local&&!it._edit;
  const nG=arr.filter(guardado).length;
  el.innerHTML=arr.length>nG?arr.map((it,i)=>guardado(it)?"":it._edit?editCard(list,it,i):viewCard(list,it,i)).join("")+(nG?`<div class="stored-note">+ ${nG} GUARDADO${nG>1?"S":""} NA MALETA / STASH</div>`:""):nG?`<div class="empty">TUDO GUARDADO NA MALETA / STASH // ARRASTE DE VOLTA PARA EQUIPAR</div>`:`<div class="empty">NENHUM REGISTRO // ${list==="weapons"?"⌖ CATÁLOGO OU + ARMA EM BRANCO":list==="equipment"?"⌖ CATÁLOGO OU + EM BRANCO":list==="bolso"?"+ ITEM DE BOLSO":"+ ADICIONAR"}</div>`;

}
const renderAll=()=>Object.keys(LISTS).forEach(renderList);

document.addEventListener("click",async e=>{
  const add=e.target.closest("[data-add]");
  if(add){const l=add.dataset.add,it=blank(l);it._edit=true;it._new=true;LISTS[l].push(it);renderList(l);sfx("abrir");
    const c=$("list-"+l).lastElementChild;c.scrollIntoView({block:"nearest",behavior:"smooth"});c.querySelector("input[data-k]")?.focus();return;}
  const b=e.target.closest("[data-act]");if(!b) return;
  const card=b.closest(".card");if(!card) return;
  const l=card.dataset.list,i=+card.dataset.i,it=LISTS[l][i];if(!it) return;
  const act=b.dataset.act;
  if(act==="edit"){it._snap=JSON.stringify(cleanItem(it));it._edit=true;renderList(l);sfx("abrir");$("list-"+l).children[i]?.querySelector("input[data-k]")?.focus();}
  else if(act==="ok"){
    const wasNew=it._new;delete it._edit;delete it._new;delete it._snap;
    if(wasNew&&it.invW!==undefined&&!autoPlace(it)) toast("SEM ESPAÇO NA MALETA // ITEM FICOU FORA",true);
    renderList(l);sfx("fechar");changed();
  }
  else if(act==="cancel"){
    if(it._new) LISTS[l].splice(i,1);
    else{Object.assign(it,JSON.parse(it._snap||"{}"));delete it._edit;delete it._snap;}
    renderList(l);sfx("fechar");changed();
  }
  else if(act==="del"){
    if(await ask(`Excluir "${it.name||NOUN[l]}"? Não dá pra desfazer.`,{top:"EXCLUIR REGISTRO",yes:"EXCLUIR"})){if(INV.sel===it) INV.sel=null;LISTS[l].splice(i,1);renderList(l);changed();}
  }
  else if(act==="noimg"){e.preventDefault();it.imageSrc="";renderList(l);sfx("fechar");changed();}
  else if(act==="recoil0"){it._rec=0;it._shot=false;sfx("clique");renderList(l);}
  else if(act==="dec"||act==="inc"||act==="fill"){
    const k=b.dataset.k,mk=k.replace("Atual","Max"),cur=nz(it[k]),max=nz(it[mk]);
    let v=cur;
    if(act==="dec"&&cur>0) v=cur-1;
    if(act==="inc"&&cur<max) v=cur+1;
    if(act==="fill") v=max;
    if(v===cur){sfx("errado");return;}
    // Recuo: cada disparo depois do primeiro no turno tira 1 dado do dano
    if(l==="weapons"&&k==="penteAtual"){if(act==="dec") it._rec=(it._rec||0)+(it._shot?1:0),it._shot=true;if(act==="inc"){if(it._rec>0) it._rec--; else it._shot=false;}}
    it[k]=String(v);sfx("clique");renderList(l);changed();
  }
});
document.addEventListener("input",e=>{
  const f=e.target.closest("[data-k]");const card=f&&f.closest(".card.edit");if(!card) return;
  LISTS[card.dataset.list][+card.dataset.i][f.dataset.k]=f.value;changedDigitando();
});
document.addEventListener("change",e=>{
  const f=e.target.closest("[data-bk]");if(!f) return;
  const card=f.closest(".card.edit"),it=LISTS.bolso[+card.dataset.i],b=BOLSO_CAT[+f.value];
  if(b){Object.assign(it,{name:b.name,marca:b.marca,acao:b.acao,classe:b.classe,desc:b.desc,melhorias:b.melhorias,usosAtuais:""});}
  else Object.assign(it,{name:"",marca:"",acao:"",classe:"",desc:"",melhorias:""});
  renderList("bolso");sfx("clique");
});
// quantos Itens de Bolso o operador pode carregar: 2 no 1º nível, +1 no 5º, 11º e 17º
function bolsoInfo(){
  const el=$("bolsoInfo");if(!el) return;
  const lv=lvlInfo().total,n=2+[5,11,17].filter(x=>lv>=x).length,has=LISTS.bolso.filter(x=>!x._new).length;
  el.innerHTML=`<b style="color:${has>n?"var(--red)":"var(--txt)"}">${has} / ${n}</b> ITENS // 2 NO 1º NÍVEL, +1 NO 5º, 11º E 17º // RECARGA: USOS = PROEF (${profBonus()}), VOLTAM NO DESCANSO // CD 12 + PROEF + ATRIBUTO`;
}
document.addEventListener("keydown",e=>{
  const card=e.target.closest&&e.target.closest(".card.edit");
  if(!card) return;
  if(e.key==="Enter"&&e.target.tagName==="INPUT"){e.preventDefault();card.querySelector('[data-act="ok"]').click();}
  if(e.key==="Escape"){card.querySelector('[data-act="cancel"]').click();}
});
document.addEventListener("change",async e=>{
  if(e.target.dataset.actFile!=="img") return;
  const card=e.target.closest(".card"),file=e.target.files[0];if(!file) return;
  try{LISTS[card.dataset.list][+card.dataset.i].imageSrc=await readImage(file,480);renderList(card.dataset.list);changed();}
  catch(err){toast("NÃO FOI POSSÍVEL LER A IMAGEM",true);sfx("errado");}
});
const cleanItem=it=>{const o={};for(const k in it) if(!k.startsWith("_")) o[k]=it[k]??"";return o;};

// imagens: reduz antes de guardar pra não estourar o armazenamento do navegador
const GIF_MAX=10*1024*1024;
function readImage(file,max=512){
  return new Promise((ok,fail)=>{
    const r=new FileReader();
    r.onerror=fail;
    if(file&&file.type==="image/gif"){
      if(file.size>GIF_MAX){const e=new Error("gif grande");e.gif=1;fail(e);return;}
      r.onload=()=>ok(r.result);r.readAsDataURL(file);return;
    }
    r.onload=()=>{const im=new Image();im.onerror=fail;im.onload=()=>{
      const s=Math.min(1,max/Math.max(im.width,im.height)),w=Math.round(im.width*s),h=Math.round(im.height*s);
      const cv=document.createElement("canvas");cv.width=w;cv.height=h;cv.getContext("2d").drawImage(im,0,0,w,h);
      let url=cv.toDataURL("image/webp",.86);
      if(!url.startsWith("data:image/webp")) url=cv.toDataURL("image/png");
      ok(url);
    };im.src=r.result;};
    r.readAsDataURL(file);
  });
}
