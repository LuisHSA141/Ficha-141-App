"use strict";
// ================== MONTAGEM ==================
function fillSelect(id,keys,labelFn=k=>k){
  $(id).innerHTML=keys.map(k=>`<option value="${esc(k)}">${esc(labelFn(k))}</option>`).join("");
}
fillSelect("char-class",Object.keys(CLASSES),k=>`${k}  (d${CLASSES[k].hitDice})`);
fillSelect("char-race",Object.keys(RACES));
fillSelect("char-class2",Object.keys(CLASSES),k=>`${k}  (d${CLASSES[k].hitDice})`);

$("attrs").innerHTML=ATTR_KEYS.map(k=>{const l=k.toLowerCase();return `
  <div class="attr"><div class="attr-n">${ATTRIBUTES[k].toUpperCase()}</div><div class="attr-m" id="mod-${l}">+0</div>
  <div class="attr-s"><button class="step" data-step="score-${l}" data-d="-1" data-nosfx>−</button><input class="in" id="score-${l}" data-save data-def="10" type="number" value="10" min="1" max="30"><button class="step" data-step="score-${l}" data-d="1" data-nosfx>+</button></div></div>`;}).join("");

$("saves").innerHTML=ATTR_KEYS.map(k=>{const l=k.toLowerCase();return `
  <div class="lr" id="row-save-${l}"><input type="checkbox" class="ck" id="prof-save-${l}" data-save><label for="prof-save-${l}">${ATTRIBUTES[k]}</label><span class="lock" id="lock-save-${l}"></span><b id="bonus-save-${l}">+0</b></div>`;}).join("");

$("skills").innerHTML=Object.keys(SKILLS).sort((a,b)=>a.localeCompare(b,"pt")).map(s=>{const id=skillId(s);return `
  <div class="lr" id="row-${id}"><input type="checkbox" class="ck" id="${id}" data-save><label for="${id}">${s}<small>${ABBR[SKILLS[s]]}</small>${s==="Furtividade"?'<span class="tag hidden" id="stealth-disadvantage-indicator">DESV.</span>':""}</label><span class="lock" id="lock-${id}"></span><b id="bonus-${id.replace("prof-","")}">+0</b></div>`;}).join("");

const EXH=EXHAUSTION;
$("exh").innerHTML=EXH.map((d,i)=>`<label id="exl-${i+1}"><input type="checkbox" class="ck" id="exhaustion-level-${i+1}" data-save><b>NV ${i+1}</b>${d}</label>`).join("");

// ================== NACIONALIDADE ==================
const flagHTML=code=>code==="OTHER"?'<span class="flag none">?</span>':`<img class="flag" src="https://flagcdn.com/w40/${code.toLowerCase()}.png" alt="" loading="lazy" onerror="this.outerHTML='<span class=&quot;flag none&quot;>${esc(code.slice(0,2))}</span>'">`;
const natCodes=Object.keys(COUNTRIES).sort((a,b)=>a==="OTHER"?1:b==="OTHER"?-1:COUNTRIES[a].localeCompare(COUNTRIES[b],"pt"));
$("natList").innerHTML=natCodes.map(c=>`<div class="nat-opt" data-v="${c}">${flagHTML(c)}<span>${esc(COUNTRIES[c])}</span></div>`).join("")+'<div class="nat-empty hidden" id="natEmpty">NENHUM PAÍS ENCONTRADO</div>';
function setNat(code){
  if(!COUNTRIES[code]) code="OTHER";
  $("char-nationality").value=code;
  $("natBtn").innerHTML=`${flagHTML(code)}<span>${esc(COUNTRIES[code])}</span><span class="arr">▼</span>`;
}
const natNorm=s=>s.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
function natFilter(){
  const q=natNorm($("natSearch").value);let n=0;
  document.querySelectorAll(".nat-opt").forEach(o=>{const show=natNorm(o.textContent).includes(q);o.classList.toggle("hidden",!show);o.classList.remove("kb");if(show) n++;});
  $("natEmpty").classList.toggle("hidden",n>0);
  const first=document.querySelector(".nat-opt:not(.hidden)");if(first&&q) first.classList.add("kb");
}
function natOpen(v){
  const nat=$("nat");if(nat.classList.contains("open")===v) return;
  nat.classList.toggle("open",v);sfx(v?"abrir":"fechar");
  if(v){$("natSearch").value="";natFilter();setTimeout(()=>$("natSearch").focus(),20);}
}
$("natBtn").setAttribute("data-nosfx","");
$("natBtn").onclick=()=>natOpen(!$("nat").classList.contains("open"));
$("natSearch").addEventListener("input",natFilter);
$("natSearch").addEventListener("keydown",e=>{
  if(e.key==="Escape"){natOpen(false);$("natBtn").focus();}
  if(e.key==="Enter"){e.preventDefault();const f=document.querySelector(".nat-opt:not(.hidden)");if(f) f.click();}
});
$("natList").addEventListener("click",e=>{const o=e.target.closest(".nat-opt");if(!o) return;setNat(o.dataset.v);sfx("clique");natOpen(false);changed();});
document.addEventListener("click",e=>{if(!e.target.closest("#nat")) natOpen(false);});
setNat("US");
