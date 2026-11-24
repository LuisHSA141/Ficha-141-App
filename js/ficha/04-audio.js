"use strict";
// ================== SONS ==================
const SFX={
  hover:  "sons/Passar mouse em cima.mp3",
  clique: "sons/clicar 1.mp3",
  errado: "sons/Clicar errado.mp3",
  abrir:  "sons/Abrir.mp3",
  fechar: "sons/Fechar.mp3"
};
// playlist: a escolha (quais tocam, modo e a atual) fica salva no aparelho
const MUSICAS=[
  {id:"pense",nome:"PENSE",f:"sons/musicas/Pense.mp3",dur:"2:22"},
  {id:"adapte",nome:"ADAPTE",f:"sons/musicas/Adapte.mp3",dur:"2:25"},
  {id:"consuma",nome:"CONSUMA",f:"sons/musicas/Consuma.mp3",dur:"2:25"},
  {id:"mate",nome:"MATE",f:"sons/musicas/Mate.mp3",dur:"2:21"}
];
const KEY_MUS="ficha141_musicas";
const MUS={on:new Set(MUSICAS.map(m=>m.id)),modo:"seq",atual:"pense"};
try{const o=JSON.parse(localStorage.getItem(KEY_MUS)||"null");if(o){
  const on=(o.on||[]).filter(id=>MUSICAS.some(m=>m.id===id));if(on.length) MUS.on=new Set(on);
  if(["seq","rand","loop1"].includes(o.modo)) MUS.modo=o.modo;
  if(MUSICAS.some(m=>m.id===o.atual)) MUS.atual=o.atual;
}}catch(e){}
const musOf=id=>MUSICAS.find(m=>m.id===id)||MUSICAS[0];
const MUSICA=musOf(MUS.atual).f;
const VOL_SFX=.55, VOL_MUSICA=.3;
const sfxBase={};
for(const [k,f] of Object.entries(SFX)){const a=new Audio(encodeURI(f));a.preload="auto";sfxBase[k]=a;}
const music=new Audio(encodeURI(MUSICA));music.loop=MUS.modo==="loop1";music.preload="auto";music.volume=0;
music.preservesPitch=false;music.mozPreservesPitch=false;music.webkitPreservesPitch=false;
let vMusic=.7,vSfx=.7,muted=false,fadeTimer=null,lastHoverAt=0,state="title";
{ // volumes separados (migra o volume único da versão anterior)
  const old=parseFloat(store.get(KEY_VOL)),m=parseFloat(store.get(KEY_VM)),x=parseFloat(store.get(KEY_VS));
  vMusic=!isNaN(m)?m:!isNaN(old)?old:.7; vSfx=!isNaN(x)?x:!isNaN(old)?old:.7; muted=store.get(KEY_MUTE)==="1";
}
function sfx(k){
  if(muted||vSfx<=0||!sfxBase[k]||fxOn("surdo")) return;
  if(k==="hover"){const t=performance.now();if(t-lastHoverAt<45) return;lastHoverAt=t;}
  const a=sfxBase[k].cloneNode();a.volume=Math.min(1,VOL_SFX*vSfx*(k==="hover"?.6:1)*(fxOn("escondido")?.35:1));
  a.play().catch(()=>{});
}
function musSalvar(){try{localStorage.setItem(KEY_MUS,JSON.stringify({on:[...MUS.on],modo:MUS.modo,atual:MUS.atual}));}catch(e){}}
function musLista(){return MUSICAS.filter(m=>MUS.on.has(m.id));}
function musProxima(dir=1){
  const L=musLista();if(!L.length) return MUS.atual;
  if(MUS.modo==="rand"&&L.length>1){let n;do n=L[Math.random()*L.length|0];while(n.id===MUS.atual);return n.id;}
  const i=L.findIndex(m=>m.id===MUS.atual);
  if(i<0) return (dir>0?L[0]:L[L.length-1]).id;
  return L[(i+dir+L.length)%L.length].id;
}
function musTocar(id,auto){
  const m=musOf(id),tocava=!music.paused;
  MUS.atual=m.id;musSalvar();
  music.src=encodeURI(m.f);music.loop=MUS.modo==="loop1";
  try{fxRate();}catch(e){}
  if((tocava||auto)&&musicTarget()>0) music.play().catch(()=>{});
  musUI();
  document.dispatchEvent(new CustomEvent("musica",{detail:m.id}));
}
// fim da faixa: segue a playlist (no modo "repetir" o próprio loop do áudio cuida)
["play","pause","emptied"].forEach(ev=>music.addEventListener(ev,()=>document.body.classList.toggle("mus-pausa",music.paused)));
document.body.classList.add("mus-pausa");
music.addEventListener("ended",()=>{if(MUS.modo==="loop1"){music.currentTime=0;music.play().catch(()=>{});return;}musTocar(musProxima(1),true);});
function musNomeTag(){return fxOn("surdo")?'<span class="fx-sig">♪ SEM SINAL</span>':`<b>♪</b> ${musOf(MUS.atual).nome}`;}
function musUI(){
  const t=document.getElementById("songTag");if(t) try{t.innerHTML=musNomeTag();}catch(e){t.innerHTML=`<b>♪</b> ${musOf(MUS.atual).nome}`;}
  const n=document.getElementById("musNow");if(n) n.textContent=musOf(MUS.atual).nome;
  document.querySelectorAll("[data-mm]").forEach(b=>b.classList.toggle("on",b.dataset.mm===MUS.modo));
  const L=document.getElementById("musList");
  if(L) L.innerHTML=MUSICAS.map((m,i)=>`<div class="mus-it${MUS.on.has(m.id)?"":" off"}${m.id===MUS.atual?" now":""}">
    <label class="mus-ck" title="Incluir na playlist"><input type="checkbox" class="ck" data-mus-on="${m.id}"${MUS.on.has(m.id)?" checked":""}></label>
    <button class="mus-n" data-mus-play="${m.id}" title="Tocar agora" data-nosfx><em>${String(i+1).padStart(2,"0")}</em>${m.nome}${m.id===MUS.atual?'<i class="mus-eq"><b></b><b></b><b></b></i>':""}</button>
    <span class="mus-d">${m.dur}</span></div>`).join("");
}
document.addEventListener("click",e=>{
  const pl=e.target.closest("[data-mus-play]");
  if(pl){const id=pl.dataset.musPlay;if(!MUS.on.has(id)){MUS.on.add(id);}musTocar(id,true);sfx("clique");return;}
  const mm=e.target.closest("[data-mm]");
  if(mm){MUS.modo=mm.dataset.mm;music.loop=MUS.modo==="loop1";musSalvar();musUI();sfx("clique");return;}
  const nx=e.target.closest("#musNext,#musPrev,#songTag");
  if(nx){musTocar(musProxima(nx.id==="musPrev"?-1:1),true);sfx("clique");}
});
document.addEventListener("change",e=>{
  const c=e.target.closest&&e.target.closest("[data-mus-on]");if(!c) return;
  const id=c.dataset.musOn;
  if(!c.checked&&MUS.on.size<=1){c.checked=true;sfx("errado");toast("A PLAYLIST PRECISA DE PELO MENOS UMA MÚSICA",true);return;}
  c.checked?MUS.on.add(id):MUS.on.delete(id);musSalvar();musUI();sfx("clique");
});
const musicTarget=()=>muted||fxOn("surdo")?0:VOL_MUSICA*vMusic*(fxOn("escondido")?.4:1)*(fxOn("inconsciente")?.45:1);
function fadeMusic(to,ms=1800){
  clearInterval(fadeTimer);
  const from=music.volume,steps=30;let i=0;
  if(to>0&&music.paused) music.play().catch(()=>{});
  fadeTimer=setInterval(()=>{
    i++;music.volume=Math.max(0,Math.min(1,from+(to-from)*i/steps));
    if(i>=steps){clearInterval(fadeTimer);if(to===0) music.pause();}
  },ms/steps);
}
function applyMusic(){
  if(state!=="sheet") return;
  clearInterval(fadeTimer);music.volume=musicTarget();
  if(music.volume>0&&music.paused) music.play().catch(()=>{});
  if(music.volume===0) music.pause();
}
function syncVolUI(){
  document.querySelectorAll("[data-vol]").forEach(r=>{const p=Math.round((r.dataset.vol==="music"?vMusic:vSfx)*100);if(document.activeElement!==r) r.value=p;r.style.setProperty("--p",p+"%");});
  document.querySelectorAll("[data-pct]").forEach(el=>el.textContent=Math.round((el.dataset.pct==="music"?vMusic:vSfx)*100));
  $("vol").classList.toggle("mudo",muted);$("muteToggle").checked=muted;
  store.set(KEY_VM,vMusic);store.set(KEY_VS,vSfx);store.set(KEY_MUTE,muted?"1":"0");
}
function setVol(kind,v){
  v=Math.max(0,Math.min(1,v));
  if(kind==="music") vMusic=v; else vSfx=v;
  syncVolUI();if(kind==="music") applyMusic();
}
function toggleMute(v){muted=v===undefined?!muted:v;syncVolUI();applyMusic();}
syncVolUI();

// hover em tudo que é clicável
document.addEventListener("mouseover",e=>{
  const t=e.target.closest("button:not(:disabled),.add,.file-in,.portrait,.nat-opt,.body-part,.chk,.ck,.sel,#btnMute,.inv-it,.chip");
  if(!t||(e.relatedTarget&&t.contains(e.relatedTarget))) return;
  sfx("hover");
});
// clique padrão em botões (os que decidem o próprio som têm data-nosfx)
document.addEventListener("click",e=>{
  const b=e.target.closest("button,.add,.file-in");
  if(e.target.tagName==="INPUT") return;
  if(b&&!b.hasAttribute("data-nosfx")&&!b.hasAttribute("data-add")&&!b.disabled) sfx("clique");
},true);
document.addEventListener("change",e=>{if(e.target.type==="checkbox") sfx("clique");if(e.target.tagName==="SELECT") sfx("clique");});
