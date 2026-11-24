"use strict";
// ================== MALETA E STASH (GRADES ESTILO RE4) ==================
// Itens, armas e equipamentos podem ficar na Maleta (pesa na Carga) ou no Stash (não pesa nada).
// Arma guardada: retângulo com área = Carga (2 × P.E.). Equipamento guardado: quadrado.
const INV={cell:44,cells:{},sel:null,drag:null,cg:0,cgMax:8};
const clampN=(id,d)=>Math.max(1,Math.min(24,Math.round(num(id,d))||d));
const CONT={
  mal:{nome:"MALETA",grid:"invGrid",items:"invItems",ghost:"invGhost",wrap:"invWrap",tray:"tray",bar:"invBar",info:"invInfo",cols:()=>clampN("inv-cols",10),rows:()=>clampN("inv-rows",6)},
  st:{nome:"STASH",grid:"stGrid",items:"stItems",ghost:"stGhost",wrap:"stWrap",tray:"stTray",bar:"stBar",info:"stInfo",cols:()=>clampN("st-cols",12),rows:()=>clampN("st-rows",8)}
};
const CONTS=["mal","st"];
const invCols=()=>CONT.mal.cols(),invRows=()=>CONT.mal.rows();
const sz=v=>Math.max(1,Math.min(12,parseInt(v)||1));
const KIND=new WeakMap();   // item -> lista de origem
// arma: retângulo (largura > altura) com área perto da carga; equipamento: quadrado
function rectFor(c){let best=null;for(let h=1;h<=6;h++){const w=Math.max(h+1,Math.ceil(c/h));const sc=(w*h-c)*2+Math.abs(w/h-1.5);if(!best||sc<best.sc) best={w,h,sc};}return [Math.min(12,best.w),best.h];}
const cargaGuardada=(it,l)=>2*(l==="weapons"?ARM.pe(it):nz(it.pe));
function baseDims(it,l=KIND.get(it)||"itens"){
  if(l==="weapons") return rectFor(Math.max(1,Math.ceil(cargaGuardada(it,l))));
  if(l==="equipment"){const sd=Math.min(12,Math.ceil(Math.sqrt(Math.max(1,Math.ceil(cargaGuardada(it,l))))));return [sd,sd];}
  return [sz(it.invW),sz(it.invH)];
}
const dimsOf=(it,rot=it.invRot==="1")=>{const [w,h]=baseDims(it);return rot?[h,w]:[w,h];};
const invTag=it=>`${sz(it.invW)}×${sz(it.invH)}${it.invIn==="1"?"":" (FORA)"}`;
// onde está: itens -> mal/st; armas e equipamentos -> null (equipado), mal ou st
function contOf(it,l=KIND.get(it)||"itens"){const v=it.local||"";if(l==="itens") return v==="stash"?"st":"mal";return v==="mal"?"mal":v==="stash"?"st":null;}
const LOCAL={mal:"mal",st:"stash"};
function setCont(it,l,c){it.local=c===null?"":(l==="itens"&&c==="mal"?"":LOCAL[c]);}
function invAll(c){
  const a=[];
  [["itens",LISTS.itens],["weapons",LISTS.weapons],["equipment",LISTS.equipment]].forEach(([l,arr])=>arr.forEach((it,i)=>{
    if(it._new||it._edit&&l!=="itens") return;KIND.set(it,l);
    const cc=contOf(it,l);if(cc&&(!c||cc===c)) a.push({it,l,i,c:cc});
  }));
  return a;
}
function fitsAt(it,x,y,rot,c=contOf(it)){
  const C=CONT[c],[w,h]=dimsOf(it,rot);
  if(x<0||y<0||x+w>C.cols()||y+h>C.rows()) return false;
  for(const o of invAll(c)){
    const b=o.it;if(b===it||b.invIn!=="1") continue;
    const [bw,bh]=dimsOf(b),bx=+b.invX||0,by=+b.invY||0;
    if(x<bx+bw&&bx<x+w&&y<by+bh&&by<y+h) return false;
  }
  return true;
}
function autoPlace(it,c=contOf(it)){
  const r0=it.invRot==="1",C=CONT[c];
  for(const rot of [r0,!r0]) for(let y=0;y<C.rows();y++) for(let x=0;x<C.cols();x++)
    if(fitsAt(it,x,y,rot,c)){Object.assign(it,{invX:String(x),invY:String(y),invRot:rot?"1":"",invIn:"1"});return true;}
  return false;
}
// guarda no contêiner c (posição livre ou a escolhida); devolve false se não couber
function moveTo(it,l,c,x,y,rot){
  const old=[it.local,it.invX,it.invY,it.invRot,it.invIn];
  KIND.set(it,l);setCont(it,l,c);
  if(x!=null){if(fitsAt(it,x,y,rot,c)){Object.assign(it,{invX:String(x),invY:String(y),invRot:rot?"1":"",invIn:"1"});return true;}}
  else{it.invIn="";if(autoPlace(it,c)) return true;}
  [it.local,it.invX,it.invY,it.invRot,it.invIn]=old;return false;
}
function equipar(it,l){it.local="";it.invIn="";if(INV.sel===it) INV.sel=null;sfx("abrir");renderList(l);renderInv();changed();toast(`${(it.name||NOUN[l]).toUpperCase()} EQUIPADO`);}
function validateInv(c){ // tira da grade o que não cabe mais (grade diminuiu, item cresceu...)
  const placed=invAll(c).filter(o=>o.it.invIn==="1"),bumped=[];
  placed.forEach(o=>o.it.invIn="");
  const loose=[];
  placed.forEach(o=>{const it=o.it;if(fitsAt(it,+it.invX||0,+it.invY||0,it.invRot==="1",c)) it.invIn="1";else loose.push(o);});
  loose.forEach(o=>{if(!autoPlace(o.it,c)) bumped.push(o.it.name||NOUN[o.l]);});
  return bumped;
}
function invInfo(){
  CONTS.forEach(c=>{const C=CONT[c];if(!$(C.info)) return;
    let used=0;invAll(c).forEach(o=>{if(o.it.invIn==="1"){const [w,h]=dimsOf(o.it);used+=w*h;}});
    const over=INV.cg>INV.cgMax;
    $(C.info).innerHTML=`<span>ESPAÇO <b>${used} / ${C.cols()*C.rows()}</b></span>`+(c==="mal"?`<span>CARGA <b class="${over?"bad":""}">${String(INV.cg).replace(".",",")} / ${INV.cgMax}${over?" // SOBRECARGA":""}</b></span>`:`<span>NÃO PESA NA CARGA NEM NO P.E.</span>`);
  });
}
function renderInv(report){
  if(!$("invGrid")) return;
  if(INV.sel&&!invAll().some(o=>o.it===INV.sel)) INV.sel=null;
  CONTS.forEach(c=>{
    const C=CONT[c],grid=$(C.grid);if(!grid) return;
    const bumped=validateInv(c);
    const cols=C.cols(),rows=C.rows(),wrapW=$(C.wrap).clientWidth||640;
    const cell=Math.max(28,Math.min(56,Math.floor((wrapW-2)/cols)));INV.cells[c]=cell;if(c==="mal") INV.cell=cell;
    grid.style.setProperty("--cell",cell+"px");grid.style.width=(cols*cell+2)+"px";grid.style.height=(rows*cell+2)+"px";
    let h="",tray="";
    invAll(c).forEach(o=>{
      const it=o.it,[w,hh]=dimsOf(it),name=esc(it.name||NOUN[o.l]),kind=o.l==="weapons"?" wp":o.l==="equipment"?" eqp":"";
      const qty=o.l==="itens"&&nz(it.qty)>1?`<span class="q">×${esc(it.qty)}</span>`:"";
      const tag=o.l==="weapons"?`<span class="kd">ARMA</span>`:o.l==="equipment"?`<span class="kd">EQUIP.</span>`:"";
      const ref=`data-c="${c}" data-l="${o.l}" data-ix="${o.i}"`;
      if(it.invIn==="1"){
        const rot=it.invRot==="1",[ow,oh]=baseDims(it);
        const img=it.imageSrc?`<img src="${esc(it.imageSrc)}" alt="" style="width:${ow*cell-8}px;height:${oh*cell-8}px;transform:translate(-50%,-50%)${rot?" rotate(90deg)":""}">`:"";
        h+=`<div class="inv-it${kind}${INV.sel===it?" sel":""}" ${ref} title="${name} (${w}×${hh})" style="left:${(+it.invX||0)*cell+1}px;top:${(+it.invY||0)*cell+1}px;width:${w*cell-1}px;height:${hh*cell-1}px">${img}${qty}${tag}<span class="nm">${name}</span></div>`;
      } else tray+=`<div class="chip${kind}" ${ref}>${it.imageSrc?`<img src="${esc(it.imageSrc)}" alt="">`:""}${name}<small>${baseDims(it).join("×")}</small></div>`;
    });
    $(C.items).innerHTML=h;
    $(C.tray).innerHTML=tray||'<span class="none">TUDO GUARDADO</span>';
    const s=INV.sel,sl=s&&KIND.get(s),sc=s&&contOf(s);
    const outro=c==="mal"?"st":"mal";
    $(C.bar).innerHTML=s&&sc===c?`<b>${esc(s.name||"ITEM")} // ${dimsOf(s).join("×")}${sl==="itens"&&nz(s.qty)>1?` // ×${esc(s.qty)}`:""}${sl==="itens"?(s.carga!==""&&s.carga!=null?` // CARGA ${esc(s.carga)}`:""):` // CARGA ${String(+cargaGuardada(s,sl).toFixed(2)).replace(".",",")}`}</b>`+
        (s.invIn==="1"?`<button class="btn sm" data-inv="rot" data-nosfx>GIRAR (R)</button><button class="btn sm" data-inv="out" data-nosfx>TIRAR</button>`:`<button class="btn sm" data-inv="in" data-nosfx>ENCAIXAR</button>`)+
        `<button class="btn sm" data-inv="move" data-nosfx>→ ${CONT[outro].nome}</button>`+
        (sl!=="itens"?`<button class="btn sm acc" data-inv="equip" data-nosfx>EQUIPAR</button>`:(window.CBT?CBT.tagsItem("itens",LISTS.itens.indexOf(s),s):"")+`<button class="btn sm" data-inv="edit" data-nosfx>EDITAR</button>`)+`<button class="btn sm" data-inv="code" title="Gerar código para passar a outro jogador" data-nosfx>⧉ CÓDIGO</button>`+
        `<button class="btn sm danger" data-inv="del" data-nosfx>EXCLUIR</button>`+(s.desc?`<div style="flex-basis:100%;color:var(--txt2);letter-spacing:.04em;font-size:11px;line-height:1.5;white-space:pre-wrap">${rtx(s.desc)}</div>`:"")
      :(c==="mal"?'ARRASTE PARA MOVER // CLIQUE PARA SELECIONAR // R GIRA // ARRASTE ARMAS E EQUIPAMENTOS PELA ALÇA ⠿ DO CARD':'GUARDE AQUI O QUE NÃO ESTÁ LEVANDO // ARRASTE PARA O ARMAMENTO OU OS EQUIPAMENTOS PARA EQUIPAR');
    if(report&&bumped.length&&state==="sheet"){toast(`SEM ESPAÇO: ${bumped.join(", ").toUpperCase()} SAIU DA GRADE ${C.nome==="MALETA"?"DA MALETA":"DO STASH"}`,true);sfx("errado");}
  });
  invInfo();
}
function invRotate(it){
  const rot=it.invRot!=="1";
  if(!fitsAt(it,+it.invX||0,+it.invY||0,rot)){sfx("errado");toast("SEM ESPAÇO PARA GIRAR AQUI",true);return;}
  it.invRot=rot?"1":"";sfx("clique");renderInv();changed(true);
}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-inv]");if(!b||!INV.sel) return;
  const it=INV.sel,l=KIND.get(it)||"itens",act=b.dataset.inv,i=LISTS[l].indexOf(it),c=contOf(it);
  if(act==="rot") invRotate(it);
  else if(act==="out"){it.invIn="";sfx("fechar");renderInv();changed(true);}
  else if(act==="in"){if(autoPlace(it,c)){sfx("fechar");renderInv();changed(true);}else{sfx("errado");toast(`SEM ESPAÇO ${c==="mal"?"NA MALETA":"NO STASH"} PARA ESTE ITEM`,true);}}
  else if(act==="move"){const o=c==="mal"?"st":"mal";if(moveTo(it,l,o)){sfx("fechar");renderInv();update();changed();toast(`GUARDADO ${o==="mal"?"NA MALETA":"NO STASH"}`);}else{sfx("errado");toast(`SEM ESPAÇO ${o==="mal"?"NA MALETA":"NO STASH"}`,true);}}
  else if(act==="equip") equipar(it,l);
  else if(act==="code"&&i>=0&&window.CODIGO) CODIGO.mostrar(l,it);
  else if(act==="edit"&&i>=0&&l==="itens"){it._snap=JSON.stringify(cleanItem(it));it._edit=true;renderList("itens");sfx("abrir");$("list-itens").querySelector("input[data-k]")?.focus();}
  else if(act==="del"&&i>=0){ask(`Excluir "${it.name||NOUN[l]}"? Não dá pra desfazer.`,{top:"EXCLUIR",yes:"EXCLUIR"}).then(ok=>{if(!ok) return;LISTS[l].splice(i,1);INV.sel=null;renderList(l);renderInv();changed();});}
});
const inRect=(x,y,r)=>r&&r.width>0&&x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;
const boxOf=id=>{const e=$(id);return e?e.closest(".box"):null;};
document.addEventListener("pointerdown",e=>{
  if(e.button>0) return;
  const grab=e.target.closest(".inv-grab");
  let it,l,el,fromGrid=false,fromCard=false;
  if(grab){const card=grab.closest(".card");l=card.dataset.list;it=LISTS[l][+card.dataset.i];el=card;fromCard=true;}
  else{el=e.target.closest(".inv-it,.chip");if(!el||!el.dataset.l) return;l=el.dataset.l;it=LISTS[l][+el.dataset.ix];fromGrid=el.classList.contains("inv-it");}
  if(!it) return;
  e.preventDefault();KIND.set(it,l);
  let offX=0,offY=0;const c0=contOf(it);
  if(fromGrid){const r=el.getBoundingClientRect(),cell=INV.cells[c0]||INV.cell;offX=Math.floor((e.clientX-r.left)/cell);offY=Math.floor((e.clientY-r.top)/cell);}
  document.body.classList.add("dragging");
  INV.drag={it,l,el,c0,fromGrid,fromCard,rot:it.invRot==="1",offX,offY,sx:e.clientX,sy:e.clientY,px:e.clientX,py:e.clientY,moved:false,tgt:null,x:null,y:null,ok:false};
});
function dragUpdate(){
  const d=INV.drag;if(!d) return;
  const [w,h]=dimsOf(d.it,d.rot),fl=$("invFloat");
  fl.textContent=`${(d.it.name||"ITEM").toUpperCase()} ${w}×${h} // R GIRA`;fl.style.left=(d.px+14)+"px";fl.style.top=(d.py+16)+"px";fl.classList.remove("hidden");
  d.tgt=null;d.x=null;d.ok=false;
  CONTS.forEach(c=>{$(CONT[c].ghost).classList.add("hidden");$(CONT[c].tray).classList.remove("over");boxOf(CONT[c].grid)?.classList.remove("drop-over");});
  ["list-weapons","list-equipment"].forEach(id=>boxOf(id)?.classList.remove("drop-over"));
  // voltar a equipar: soltar no Armamento ou nos Equipamentos
  if(d.l!=="itens"&&!d.fromCard){const bx=boxOf(d.l==="weapons"?"list-weapons":"list-equipment");if(inRect(d.px,d.py,bx?.getBoundingClientRect())){d.tgt="equip";bx.classList.add("drop-over");return;}}
  for(const c of CONTS){
    const C=CONT[c],g=$(C.grid),gr=g.getBoundingClientRect(),cell=INV.cells[c]||INV.cell;
    if(inRect(d.px,d.py,gr)&&g.offsetParent){
      const ox=Math.min(d.offX,w-1),oy=Math.min(d.offY,h-1);
      d.tgt=c;d.x=Math.max(0,Math.min(C.cols()-w,Math.floor((d.px-gr.left-1)/cell)-ox));d.y=Math.max(0,Math.min(C.rows()-h,Math.floor((d.py-gr.top-1)/cell)-oy));
      const keep=[d.it.local];setCont(d.it,d.l,c);d.ok=w<=C.cols()&&h<=C.rows()&&fitsAt(d.it,d.x,d.y,d.rot,c);d.it.local=keep[0];
      const gh=$(C.ghost);Object.assign(gh.style,{left:(d.x*cell+1)+"px",top:(d.y*cell+1)+"px",width:(w*cell-1)+"px",height:(h*cell-1)+"px"});gh.classList.toggle("bad",!d.ok);gh.classList.remove("hidden");
      return;
    }
    if(d.fromGrid&&c===d.c0&&inRect(d.px,d.py,$(C.tray).getBoundingClientRect())){d.tgt="tray";$(C.tray).classList.add("over");return;}
    // caixa minimizada ou fora da grade: guarda onde couber
    const bx=boxOf(C.grid);if(inRect(d.px,d.py,bx?.getBoundingClientRect())&&c!==d.c0){d.tgt="auto:"+c;bx.classList.add("drop-over");return;}
  }
}
document.addEventListener("pointermove",e=>{
  const d=INV.drag;if(!d) return;
  d.px=e.clientX;d.py=e.clientY;
  if(!d.moved){if(Math.hypot(d.px-d.sx,d.py-d.sy)<5) return;d.moved=true;d.el.classList.add("drag");sfx("abrir");}
  dragUpdate();
});
function dragEnd(cancel){
  const d=INV.drag;if(!d) return;INV.drag=null;document.body.classList.remove("dragging");
  $("invFloat").classList.add("hidden");
  CONTS.forEach(c=>{$(CONT[c].ghost).classList.add("hidden");$(CONT[c].tray).classList.remove("over");boxOf(CONT[c].grid)?.classList.remove("drop-over");});
  ["list-weapons","list-equipment"].forEach(id=>boxOf(id)?.classList.remove("drop-over"));
  d.el.classList.remove("drag");
  if(cancel) return;
  const it=d.it,l=d.l;
  if(!d.moved){
    if(d.fromCard){toast("ARRASTE PELA ALÇA ⠿ ATÉ A MALETA OU O STASH");return;}
    if(d.fromGrid){INV.sel=INV.sel===it?null:it;sfx("clique");renderInv();}
    else if(autoPlace(it,d.c0)){INV.sel=it;sfx("fechar");renderInv();changed(true);}
    else{INV.sel=it;sfx("errado");renderInv();toast("SEM ESPAÇO PARA ESTE ITEM",true);}
    return;
  }
  const done=msg=>{INV.sel=it;sfx("fechar");if(l!=="itens") renderList(l);renderInv();update();changed();if(msg) toast(msg);};
  if(d.tgt==="equip"){equipar(it,l);return;}
  if(d.tgt==="tray"){it.invIn="";if(INV.sel===it) INV.sel=null;sfx("fechar");renderInv();changed(true);return;}
  if(d.tgt&&d.tgt.startsWith("auto:")){const c=d.tgt.slice(5);if(moveTo(it,l,c)) done(`GUARDADO ${c==="mal"?"NA MALETA":"NO STASH"}`);else{sfx("errado");toast(`SEM ESPAÇO ${c==="mal"?"NA MALETA":"NO STASH"}`,true);}return;}
  if(d.tgt&&d.ok){moveTo(it,l,d.tgt,d.x,d.y,d.rot);done(d.c0!==d.tgt?`GUARDADO ${d.tgt==="mal"?"NA MALETA":"NO STASH"}`:"");return;}
  if(d.tgt){sfx("errado");}
  renderInv();
}
document.addEventListener("pointerup",()=>dragEnd(false));
document.addEventListener("pointercancel",()=>dragEnd(true));
document.addEventListener("keydown",e=>{
  const d=INV.drag;if(!d||!d.moved||e.key.toLowerCase()!=="r") return;
  e.preventDefault();e.stopImmediatePropagation();
  d.rot=!d.rot;[d.offX,d.offY]=[d.offY,d.offX];sfx("clique");dragUpdate();
},true);
document.addEventListener("contextmenu",e=>{if(INV.drag&&INV.drag.moved){e.preventDefault();INV.drag.rot=!INV.drag.rot;[INV.drag.offX,INV.drag.offY]=[INV.drag.offY,INV.drag.offX];sfx("clique");dragUpdate();}});
