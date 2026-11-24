"use strict";
// ================== CONTADORES: "-20" / "+5" soma ao valor atual ==================
// vale para Vida, PVon, Dinheiro e os contadores e barras criados pelo jogador
(()=>{
  const SEL="[data-rel]";
  const num=v=>{const n=parseFloat(String(v??"").replace(",","."));return isNaN(n)?0:n;};
  const relOf=v=>{const m=/^\s*([+-])\s*(\d+(?:[.,]\d+)?)\s*$/.exec(String(v));return m?(m[1]==="-"?-1:1)*num(m[2]):null;};
  const typing=v=>/^\s*[+-]\s*[\d.,]*\s*$/.test(String(v));
  const limits=t=>{
    if(t.id==="char-hp-current"){const mx=document.getElementById("char-hp-max").value;return [0,mx===""?Infinity:num(mx)];}
    if(t.id==="char-pvon"){const mx=document.getElementById("pvonMax");return [0,mx?num(mx.textContent)||Infinity:Infinity];}
    if(t.classList.contains("cb-cur")){const mx=t.closest(".box")?.querySelector(".cb-max")?.value;return [0,mx?num(mx):Infinity];}
    if(t.id==="char-money") return [0,Infinity];   // sem dívida: o dinheiro para em 0
    if(t.id==="char-hp-temp") return [0,Infinity];
    return [-Infinity,Infinity];
  };
  document.addEventListener("focusin",e=>{const t=e.target;if(t.matches&&t.matches(SEL)) t.dataset.prev=t.value;},true);
  // enquanto digita "-2..." a ficha não recalcula com o número negativo
  document.addEventListener("input",e=>{const t=e.target;if(!t.matches||!t.matches(SEL)) return;
    if(typing(t.value)&&t.dataset.prev!==undefined&&String(t.dataset.prev).trim()!==""){e.stopImmediatePropagation();t.classList.add("rel-on");}
    else t.classList.remove("rel-on");},true);
  function commit(t){
    t.classList.remove("rel-on");
    if(t.value===t.dataset.prev) return;   // já aplicado (Enter seguido de sair do campo)
    const d=relOf(t.value),prev=t.dataset.prev;
    if(d===null||prev===undefined||String(prev).trim()===""){if(typing(t.value)&&prev!==undefined&&String(prev).trim()!==""){t.value=prev;}return;}
    const [lo,hi]=limits(t);
    let d2=d;
    if(t.id==="char-hp-current"&&d<0&&window.INTER){d2=INTER.absorve(d);if(d2===0){t.value=prev;t.dataset.prev=prev;changed(true);update();return;}}
    const v=+Math.max(lo,Math.min(hi,num(prev)+d2)).toFixed(2);
    t.value=String(v);t.dataset.prev=t.value;
    t.dispatchEvent(new Event("input",{bubbles:true}));t.dispatchEvent(new Event("change",{bubbles:true}));
    // aviso rápido do que foi somado
    const tag=document.createElement("span");tag.className="rel-pop"+(d<0?" neg":"");tag.textContent=(d>0?"+":"−")+Math.abs(d);
    const r=t.getBoundingClientRect();tag.style.left=(r.left+r.width/2)+"px";tag.style.top=(r.top+window.scrollY)+"px";
    document.body.appendChild(tag);setTimeout(()=>tag.remove(),1100);
    if(typeof sfx==="function") sfx("clique");
  }
  document.addEventListener("keydown",e=>{const t=e.target;if(e.key==="Enter"&&t.matches&&t.matches(SEL)){e.preventDefault();commit(t);t.blur();}},true);
  document.addEventListener("focusout",e=>{const t=e.target;if(t.matches&&t.matches(SEL)) commit(t);},true);
})();
