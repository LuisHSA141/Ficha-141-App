"use strict";
// ================== EVENTOS DO FORMULÁRIO ==================
$("sheet").addEventListener("input",e=>{
  const t=e.target;if(t.closest(".card.edit")||t.id==="natSearch"||t.id==="background-url-input"||t.dataset.vol||t.classList.contains("fd-ta")) return;
  if(t.id==="st-cols"||t.id==="st-rows"){if(t.value!==""){const v=Math.max(1,Math.min(24,Math.round(+t.value)));if(+t.value!==v) t.value=v;}renderInv(true);}
  if(t.id==="inv-cols"||t.id==="inv-rows"){if(t.value!==""){const v=Math.max(1,Math.min(24,Math.round(+t.value)));if(+t.value!==v) t.value=v;}renderInv(true);}
  if(t.id==="char-level"&&t.value!==""){const v=Math.max(1,Math.min(20,Math.round(+t.value)));if(+t.value!==v) t.value=v;}
  changedDigitando();
});
$("sheet").addEventListener("change",e=>{
  const t=e.target;if(t.closest(".card.edit")||t.type==="file"||t.classList.contains("fd-ta")||t.dataset.vol||t.id==="muteToggle"||t.id==="crtToggle"||t.id==="fxVisToggle") return;
  if((t.id==="st-cols"||t.id==="st-rows")&&t.value===""){t.value=t.dataset.def;renderInv(true);}
  if((t.id==="inv-cols"||t.id==="inv-rows")&&t.value===""){t.value=t.dataset.def;renderInv(true);}
  if(t.id==="char-class") rebuildSpec();
  if(t.id==="char-race"){rebuildSub();$("char-speed").value=raceSpeed();}
  if(t.id==="char-subtype"){rebuildHalo();$("char-speed").value=raceSpeed();}
  if(t.id==="char-class"||t.id==="char-specialization") rebuildSpec2();
  if(t.id==="char-class2") rebuildSpec2();
  if(t.id==="char-multi"&&t.checked){if(lvlInfo().total<MULTI_MIN_LEVEL){t.checked=false;sfx("errado");toast(`MULTI-ESPECIALIZAÇÃO SÓ A PARTIR DO ${MULTI_MIN_LEVEL}º NÍVEL`,true);}else{rebuildSpec2();}}
  if(t.id==="char-level"&&t.value==="") t.value=1;
  changed();
});
document.addEventListener("click",e=>{
  const st=e.target.closest("[data-step]");
  if(st){const el=$(st.dataset.step),v=num(st.dataset.step,10)+(+st.dataset.d)*(e.shiftKey?2:1);
    if(v<1||v>30){sfx("errado");return;}el.value=v;sfx("clique");changed(true);return;}
  const pvb=e.target.closest("[data-pv]");
  if(pvb){const el=$("char-pvon"),mx=nz($("pvonMax").textContent),d=(+pvb.dataset.pv)*(e.shiftKey?5:1);
    const v=Math.max(0,Math.min(mx,(el.value===""?mx:nz(el.value))+d));
    if(String(v)===el.value||(el.value===""&&v===mx)){sfx("errado");return;}
    el.value=v;sfx(d<0?"errado":"clique");changed(true);return;}
  const hp=e.target.closest("[data-hp]");
  if(hp){const cur=$("char-hp-current"),max=$("char-hp-max"),d=(+hp.dataset.hp)*(e.shiftKey?5:1);
    if(cur.value===""&&max.value===""){sfx("errado");toast("DEFINA OS PONTOS DE VIDA MÁXIMOS",true);return;}
    let dd=d;if(dd<0&&window.INTER){const t0=INTER.temp();dd=INTER.absorve(dd);if(dd===0){sfx("errado");changed(true);update();return;}}
    let v=Math.max(0,(cur.value===""?nz(max.value):nz(cur.value))+dd);
    if(max.value!=="") v=Math.min(v,nz(max.value));
    if(String(v)===cur.value){sfx("errado");return;}
    cur.value=v;sfx(d<0?"errado":"clique");changed(true);}
});
$("bodySvg").addEventListener("click",e=>{
  const p=e.target.closest(".body-part");if(!p) return;
  p.classList.toggle("injured");sfx(p.classList.contains("injured")?"errado":"clique");changed();
});

// janelas (o layout modular fica em modular.js)
const WIN_ORDER=["principal","combate","habilidades","notas","arquivo"];
function showTab(name,silent){if(window.MOD) MOD.show(name,silent);store.set(KEY_TAB,name);if(name==="combate") setTimeout(renderInv,30);}
// a barra só fica presa no topo no PC; no celular ela rola junto e as abas grudam no topo da tela
function syncHud(){const h=$("hud"),presa=getComputedStyle(h).position==="sticky";document.documentElement.style.setProperty("--hud-h",(presa?h.offsetHeight:0)+"px");}
window.addEventListener("resize",()=>{syncHud();renderInv();});
if(window.ResizeObserver) new ResizeObserver(()=>syncHud()).observe($("hud"));

// teclado
document.addEventListener("keydown",e=>{
  const k=e.key.toLowerCase(),typing=/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)||!!(e.target.isContentEditable);
  if($("fxPanel").classList.contains("show")){if(k==="escape"||k==="e"&&!typing) fxPanel(false);return;}
  if($("modal").classList.contains("show")){if(k==="escape") closeModal(false);if(k==="enter"&&e.target.tagName!=="BUTTON"){e.preventDefault();closeModal(true);}return;}
  if(state!=="sheet") return;
  if(window.DADOS&&DADOS.aberto&&k==="escape"){DADOS.abrir(false);return;}
  if((e.ctrlKey||e.metaKey)&&k==="s"){e.preventDefault();sfx("clique");quickSave();return;}
  if(typing||e.ctrlKey||e.metaKey||e.altKey||e.repeat) return;
  if(k==="m"){toggleMute();sfx("clique");}
  else if(k==="r"&&INV.sel&&INV.sel.invIn==="1"){invRotate(INV.sel);}
  else if(k==="e"){fxPanel(true);}
  else if(k==="c"&&window.CBT){CBT.toggle();}
  else if(k==="d"&&window.DADOS){DADOS.abrir();}
  else if(k==="escape"&&INV.sel){INV.sel=null;renderInv();}
  else if(/^[1-5]$/.test(k)){sfx("clique");showTab(WIN_ORDER[+k-1]);}
});

// volume
$("btnMute").addEventListener("click",()=>{toggleMute();sfx("clique");});
$("muteToggle").addEventListener("change",e=>toggleMute(e.target.checked));
document.addEventListener("input",e=>{const k=e.target.dataset&&e.target.dataset.vol;if(k) setVol(k,e.target.value/100);});
document.addEventListener("change",e=>{if(e.target.dataset&&e.target.dataset.vol){sfx("clique");e.target.blur();}});
