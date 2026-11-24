"use strict";
// ================== ESTADOS ==================
// Cada estado ativo mexe na ficha de um jeito. Dá pra desligar as brincadeiras em Sistema.
const FX_BY={};ESTADOS.forEach(e=>FX_BY[e.id]=e);
const FX_TELA={
  agarrado:"A tela fica presa: rolar a página fica bem mais difícil e o deslocamento no topo vai para 0m.",
  amedrontado:"Coração batendo na tela e nos alto-falantes. A ficha encolhe a cada batida.",
  atordoado:"A ficha balança e a música fica lenta e arrastada.",
  caido:"A ficha inteira tomba para o lado e a rolagem fica pela metade (rastejando).",
  cego:"Tudo escuro. Só dá pra ver o que está em volta do cursor.",
  congelado:"A ficha congela em azul gelo, com geada nas bordas. Puxa Impedido junto.",
  envenenado:"Tudo fica esverdeado e enjoado, e a música desafina.",
  escondido:"Tudo escurece e perde a cor. Música e efeitos ficam bem baixinhos, pra não ser descoberto.",
  impedido:"A página trava: não dá pra rolar. Deslocamento 0m.",
  incapacitado:"Botões de ação (pente, PV, adicionar) não funcionam: sem Ações nem Reações.",
  inconsciente:"A tela apaga e os olhos piscam devagar. A música fica lenta e distante. Puxa Incapacitado e Caído.",
  invisivel:"A ficha some (só aparece o que está sob o mouse) e o cursor desaparece.",
  paralisado:"Nada na ficha responde a cliques, choques elétricos piscam na tela e a música engasga.",
  queimado:"Brasas sobem da parte de baixo da tela com brilho de fogo.",
  sobrecarregado:"A ficha afunda com o peso e a rolagem fica pela metade. Liga sozinho quando a Carga passa do máximo.",
  suprimido:"Rajadas de tiro: a tela treme, pisca vermelho e leva marcas de bala.",
  surdo:"Um apito no ouvido e depois silêncio total. Nem música nem efeitos, não importa o volume.",
  surpreendido:"Não fica ativo: cada clique dispara o alerta (som e exclamação). É o lembrete do primeiro turno."
};
const SPD_ZERO=["agarrado","impedido","atordoado","paralisado","inconsciente","surpreendido"];
const fxManual=new Set();
const FX={map:new Map(),prev:new Set(),visual:store.get("ficha141_fxvis")!=="0",timers:{},audioSig:"",cur:null,rateT:null};
function fxOn(id){return FX.visual&&state==="sheet"&&FX.map.has(id);}
function fxActive(){
  const m=new Map();
  fxManual.forEach(id=>m.set(id,null));
  if(INV.cg>INV.cgMax&&!m.has("sobrecarregado")) m.set("sobrecarregado","CARGA");
  [...m.keys()].forEach(id=>(ESTADOS_IMPLICA[id]||[]).forEach(j=>{if(!m.has(j)) m.set(j,FX_BY[id].nome.toUpperCase());}));
  return m;
}
const fxIcon=(e,on)=>`<span class="fxi${on?" on":""}" style="--c:${e.cor};--m:url('${e.icon}')"><i class="fxc"></i><img src="${e.icon}" alt=""></span>`;

function applyFx(){
  FX.map=fxActive();
  const live=state==="sheet"&&FX.visual;
  ESTADOS.forEach(e=>document.body.classList.toggle("fx-"+e.id,live&&FX.map.has(e.id)));
  // faixa no HUD e contador
  const act=ESTADOS.filter(e=>FX.map.has(e.id));
  $("hudFx").innerHTML=act.map(e=>`<button class="hfx" data-fxopen="${e.id}" style="--c:${e.cor}" data-nosfx>${fxIcon(e,true)}${e.nome.toUpperCase()}${FX.map.get(e.id)?`<small>VIA ${esc(FX.map.get(e.id))}</small>`:""}</button>`).join("");
  $("fxCount").textContent=act.length?act.length:"";$("fxBtn").classList.toggle("has",act.length>0);
  // deslocamento
  const raw=$("char-speed").value||"--",zero=SPD_ZERO.some(id=>FX.map.has(id)),half=FX.map.has("sobrecarregado");
  let spd=raw;
  if(zero) spd="0m";
  else if(half){const m=/^([\d.,]+)\s*(.*)$/.exec(raw);spd=m?`${+(parseFloat(m[1].replace(",","."))/2).toFixed(1)}${m[2]}`:"½ "+raw;}
  $("hSpd").textContent=spd;$("hSpd").style.color=zero?"var(--red)":half?"var(--amber)":"";$("hSpd").classList.toggle("dif",spd!==raw);
  $("songTag").innerHTML=musNomeTag();
  // liga/desliga efeitos de tempo
  const now=new Set(live?FX.map.keys():[]);
  now.forEach(id=>{if(!FX.prev.has(id)) fxStart(id);});
  FX.prev.forEach(id=>{if(!now.has(id)) fxStop(id);});
  FX.prev=now;
  const sig=["surdo","escondido","inconsciente"].map(id=>fxOn(id)?1:0).join("");
  if(sig!==FX.audioSig){FX.audioSig=sig;applyMusic();}
  fxRate();
  if($("fxPanel").classList.contains("show")) renderFxPanel();
}
function fxLoop(id,fn,min,max){
  const tick=()=>{if(!fxOn(id)) return;fn();FX.timers[id]=setTimeout(tick,min+Math.random()*(max-min));};
  FX.timers[id]=setTimeout(tick,min===max?0:400+Math.random()*800);
}
function fxStart(id){
  if(id==="amedrontado") fxLoop(id,heartbeat,1000,1000);
  if(id==="suprimido") fxLoop(id,burst,1400,3800);
  if(id==="paralisado") fxLoop(id,zap,1300,3200);
  if(id==="surdo") tinnitus();
}
function fxStop(id){clearTimeout(FX.timers[id]);delete FX.timers[id];}
function fxRate(){
  const base=(fxOn("atordoado")?.84:1)*(fxOn("inconsciente")?.72:1);
  clearInterval(FX.rateT);FX.rateT=null;
  if(fxOn("envenenado")) FX.rateT=setInterval(()=>{try{music.playbackRate=base*(1+Math.sin(performance.now()/650)*.05);}catch(e){}},120);
  else try{music.playbackRate=base;}catch(e){}
}

// sons sintetizados (respeitam o volume dos efeitos e o Surdo)
let actx=null;
function ac(){
  if(!actx){try{actx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return null;}}
  if(actx.state==="suspended") actx.resume().catch(()=>{});
  return actx;
}
const synthVol=m=>muted||vSfx<=0||fxOn("surdo")?0:VOL_SFX*vSfx*m*(fxOn("escondido")?.35:1);
function thump(t0,f,m){
  const c=ac(),v=synthVol(m);if(!c||!v) return;
  const o=c.createOscillator(),g=c.createGain();
  o.type="sine";o.frequency.setValueAtTime(f*1.7,t0);o.frequency.exponentialRampToValueAtTime(f,t0+.09);
  g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(v,t0+.015);g.gain.exponentialRampToValueAtTime(.0001,t0+.24);
  o.connect(g).connect(c.destination);o.start(t0);o.stop(t0+.26);
}
function noise(dur,freq,m,type="bandpass",t0){
  const c=ac(),v=synthVol(m);if(!c||!v) return;
  const n=Math.floor(c.sampleRate*dur),buf=c.createBuffer(1,n,c.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3);
  const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
  s.buffer=buf;f.type=type;f.frequency.value=freq;g.gain.value=v;
  s.connect(f).connect(g).connect(c.destination);s.start(t0||c.currentTime);
}
function heartbeat(){const c=ac();if(!c) return;const t=c.currentTime+.02;thump(t,52,1.6);thump(t+.24,46,1.1);}
function tinnitus(){
  const c=ac();if(!c||muted||vSfx<=0) return;
  const o=c.createOscillator(),g=c.createGain(),t=c.currentTime;
  o.frequency.value=3900;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.05*vSfx,t+.06);g.gain.exponentialRampToValueAtTime(.0001,t+2.2);
  o.connect(g).connect(c.destination);o.start(t);o.stop(t+2.3);
}
const CRACK=`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g stroke="#e8e8e8" stroke-width="1.3" fill="none" opacity=".75"><path d="M50 50 L18 30 M50 50 L82 22 M50 50 L90 62 M50 50 L60 92 M50 50 L22 78 M50 50 L8 54 M50 50 L44 8"/><path d="M34 40 L30 52 M68 36 L74 46 M70 58 L62 70 M36 64 L46 70" opacity=".6"/></g><circle cx="50" cy="50" r="5" fill="#050505" stroke="#bbb" stroke-width="1.5"/></svg>`;
function burst(){
  const n=3+Math.floor(Math.random()*3),L=$("supL"),sh=$("sheet");
  const c=ac();const t=c?c.currentTime:0;
  for(let i=0;i<n;i++){
    noise(.07,1800,2.2,"bandpass",t+i*.095);noise(.12,180,1.4,"lowpass",t+i*.095);
    setTimeout(()=>{
      if(!fxOn("suprimido")) return;
      L.classList.remove("flash");void L.offsetWidth;L.classList.add("flash");setTimeout(()=>L.classList.remove("flash"),70);
      sh.classList.remove("shake");void sh.offsetWidth;sh.classList.add("shake");
      if(Math.random()<.55){const k=document.createElement("div");k.className="crack";k.innerHTML=CRACK;k.style.left=(8+Math.random()*84)+"%";k.style.top=(10+Math.random()*80)+"%";k.style.rotate=Math.random()*360+"deg";L.appendChild(k);setTimeout(()=>k.remove(),3300);}
    },i*95);
  }
  setTimeout(()=>sh.classList.remove("shake"),n*95+260);
}
function zap(){
  const L=$("zapL");L.classList.remove("zap");void L.offsetWidth;L.classList.add("zap");
  noise(.18,5200,.9,"highpass");
  if(!music.paused){music.pause();setTimeout(()=>{if(state==="sheet"&&musicTarget()>0) music.play().catch(()=>{});},160+Math.random()*220);}
}
// alerta do Surpreendido (som + exclamação). Respeita volume dos efeitos, mudo e Surdo.
const ALERTA=new Audio("sons/alerta.mp3"),SNAKE=new Audio("sons/kept-you-waiting.mp3");ALERTA.preload=SNAKE.preload="auto";
const fxVol=()=>muted||fxOn("surdo")?0:Math.min(1,VOL_SFX*vSfx*1.3*(fxOn("escondido")?.35:1));
function bang(){
  document.querySelectorAll(".fx-bang").forEach(x=>x.remove());
  const b=document.createElement("div");b.className="fx-bang";b.innerHTML='<img src="icones/alerta.png" alt="!">';document.body.appendChild(b);
  const v=fxVol();if(v>0){const a=ALERTA.cloneNode();a.volume=v;a.play().catch(()=>{});}
  const sh=$("sheet");sh.classList.remove("shake");void sh.offsetWidth;sh.classList.add("shake");setTimeout(()=>sh.classList.remove("shake"),300);
  setTimeout(()=>b.remove(),1500);
}
// easter egg: 14 cliques seguidos no Surpreendido
let surpN=0,surpT=0,snakeOn=false;
function surpriseClick(){
  const t=performance.now();surpN=t-surpT<2500?surpN+1:1;surpT=t;
  if(surpN>=14&&!snakeOn){surpN=0;keptYouWaiting();return;}
  bang();
}
function keptYouWaiting(){
  snakeOn=true;
  document.querySelectorAll(".fx-bang").forEach(x=>x.remove());
  const v=fxVol();
  const sub=document.createElement("div");sub.className="codec-sub";
  sub.innerHTML='<span class="cs-n">SNAKE</span><span class="cs-t"></span><span class="cs-pt">(Te deixei esperando, hein?)</span>';
  document.body.appendChild(sub);
  const line="Kept you waiting, huh?",el=sub.querySelector(".cs-t");let i=0;
  const tw=setInterval(()=>{el.textContent=line.slice(0,++i);if(i>=line.length) clearInterval(tw);},55);
  if(v>0){const a=SNAKE.cloneNode();a.volume=Math.min(1,v*1.2);a.play().catch(()=>{});}
  music.volume=Math.max(0,music.volume*.25);
  setTimeout(()=>{sub.classList.add("out");setTimeout(()=>sub.remove(),500);snakeOn=false;applyMusic();},5200);
}
// easter egg: Anima do tipo "Uma" (no assistente ou na ficha)
const WOWOK=new Audio("sons/wowok.mp3");WOWOK.preload="auto";
let umaOn=false;const umaPrev=new WeakMap();
const isUma=s=>String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").trim().toLowerCase()==="uma";
document.addEventListener("input",e=>{
  const t=e.target;if(!t||(t.id!=="char-anima"&&t.id!=="wzAnima")) return;
  const now=isUma(t.value),was=umaPrev.get(t)||false;umaPrev.set(t,now);
  if(now&&!was) wowok();
},true);
function wowok(){
  if(umaOn) return;umaOn=true;
  const sub=document.createElement("div");sub.className="codec-sub uma";
  sub.innerHTML='<span class="cs-n">UMA DESCONHECIDA</span><span class="cs-t">WOOWOOOKKKK!!!!</span>';
  document.body.appendChild(sub);
  const v=fxVol();if(v>0){const a=WOWOK.cloneNode();a.volume=Math.min(1,v*1.3);a.play().catch(()=>{});}
  const prev=music.volume;music.volume=Math.max(0,prev*.25);
  const sh=$("sheet");if(sh&&state==="sheet"){sh.classList.remove("shake");void sh.offsetWidth;sh.classList.add("shake");setTimeout(()=>sh.classList.remove("shake"),300);}
  setTimeout(()=>{sub.classList.add("out");setTimeout(()=>sub.remove(),500);umaOn=false;applyMusic();},2400);
}
// ladrilhos de brasa
$("embers").innerHTML=Array.from({length:18},()=>`<i style="left:${Math.random()*100}%;--t:${3+Math.random()*4}s;--d:${-Math.random()*6}s;--dx:${Math.round(Math.random()*120-60)}px;opacity:${.5+Math.random()*.5}"></i>`).join("");
// lanterna do Cego
let mxRaf=0;
document.addEventListener("pointermove",e=>{if(!document.body.classList.contains("fx-cego")||mxRaf) return;mxRaf=requestAnimationFrame(()=>{mxRaf=0;const L=$("fxLayer");L.style.setProperty("--mx",e.clientX+"px");L.style.setProperty("--my",e.clientY+"px");});},{passive:true});
// rolagem: Impedido trava, Agarrado segura, Caído/Sobrecarregado pela metade
let lastBlockMsg=0;
function scrollFactor(){
  if(fxOn("impedido")) return 0;
  let f=1;if(fxOn("agarrado")) f=.15;if(fxOn("caido")||fxOn("sobrecarregado")) f=Math.min(f,.5);
  return f;
}
window.addEventListener("wheel",e=>{
  if(state!=="sheet"||e.ctrlKey) return;
  const f=scrollFactor();if(f>=1) return;
  if(e.target.closest&&e.target.closest(".modal,.nat-list,.ta,.inv-wrap")) return;
  e.preventDefault();
  if(f>0){window.scrollBy(0,e.deltaY*f);return;}
  const t=performance.now();if(t-lastBlockMsg>1500){lastBlockMsg=t;sfx("errado");toast(fxOn("congelado")?"CONGELADO // DESLOCAMENTO 0":"IMPEDIDO // DESLOCAMENTO 0",true);}
},{passive:false});
// Incapacitado: sem Ações
window.addEventListener("click",e=>{
  if(!fxOn("incapacitado")||state!=="sheet") return;
  const b=e.target.closest('[data-act="dec"],[data-act="inc"],[data-act="fill"],[data-hp],[data-add],[data-step]');
  if(!b) return;
  e.preventDefault();e.stopImmediatePropagation();sfx("errado");
  const t=performance.now();if(t-lastBlockMsg>1200){lastBlockMsg=t;toast("INCAPACITADO // SEM AÇÕES NEM REAÇÕES",true);}
},true);

// painel
function renderFxPanel(){
  const cur=FX.cur&&FX_BY[FX.cur]?FX.cur:(ESTADOS.find(e=>FX.map.has(e.id))||ESTADOS[0]).id;FX.cur=cur;
  $("fxGrid").innerHTML=ESTADOS.map(e=>{const on=FX.map.has(e.id),src=FX.map.get(e.id);
    return `<button class="fx-t${on?" on":""}${src?" imp":""}${e.id===cur?" cur":""}" data-fx="${e.id}" style="--c:${e.cor}" data-nosfx>${src?`<small>VIA ${esc(src)}</small>`:""}${fxIcon(e,on)}${e.nome.toUpperCase()}</button>`;}).join("");
  fxDetail(cur);
}
function fxDetail(id){
  const e=FX_BY[id],src=FX.map.get(id);
  $("fxDet").style.setProperty("--c",e.cor);
  $("fxDet").innerHTML=`<h3>${e.nome.toUpperCase()}${FX.map.has(id)?` // ATIVO${src?` (VIA ${esc(src)})`:""}`:""}</h3><ul>${e.regras.map(r=>`<li>${esc(r)}</li>`).join("")}</ul><div class="tela"><b>NA FICHA:</b> ${esc(FX_TELA[id]||"")}</div>`;
}
function fxPanel(open,id){
  const P=$("fxPanel");if(open===P.classList.contains("show")&&!id) return;
  if(id) FX.cur=id;
  if(open){renderFxPanel();P.classList.add("show");sfx("abrir");}
  else{P.classList.remove("show");sfx("fechar");}
}
function fxToggle(id){
  FX.cur=id;
  if(id==="surpreendido"){fxManual.delete(id);surpriseClick();fxDetail(id);return;}
  if(FX.map.has(id)&&!fxManual.has(id)){sfx("errado");toast(`${FX_BY[id].nome.toUpperCase()} VEM DE ${FX.map.get(id)}`,true);renderFxPanel();return;}
  if(fxManual.has(id)){fxManual.delete(id);sfx("fechar");}else{sfx("abrir");fxManual.add(id);}
  changed();
}
$("fxGrid").addEventListener("click",e=>{const t=e.target.closest("[data-fx]");if(t) fxToggle(t.dataset.fx);});
$("fxGrid").addEventListener("mouseover",e=>{const t=e.target.closest("[data-fx]");if(t&&t.dataset.fx!==FX.shown){FX.shown=t.dataset.fx;fxDetail(t.dataset.fx);}});
$("fxGrid").addEventListener("mouseleave",()=>{FX.shown=null;fxDetail(FX.cur);});
$("fxBtn").onclick=()=>fxPanel(!$("fxPanel").classList.contains("show"));
$("fxX").onclick=$("fxClose").onclick=()=>fxPanel(false);
$("fxPanel").addEventListener("click",e=>{if(e.target.id==="fxPanel") fxPanel(false);});
$("fxClear").onclick=()=>{if(!fxManual.size){sfx("errado");return;}fxManual.clear();sfx("fechar");changed();};
document.addEventListener("click",e=>{const b=e.target.closest("[data-fxopen]");if(b) fxPanel(true,b.dataset.fxopen);});
$("fxVisToggle").checked=FX.visual;
function setTheme(t){
  if(t) document.documentElement.dataset.theme=t; else delete document.documentElement.dataset.theme;
  store.set(THEME_KEY,t||"");
  document.querySelectorAll(".th").forEach(b=>b.classList.toggle("on",b.dataset.th===(t||"")));
  drawRadar();
}
document.querySelectorAll(".th").forEach(b=>b.onclick=()=>{sfx("clique");setTheme(b.dataset.th);toast("COR DA INTERFACE: "+b.textContent.trim());});
document.querySelectorAll(".th").forEach(b=>b.classList.toggle("on",b.dataset.th===(document.documentElement.dataset.theme||"")));
$("fxVisToggle").onchange=e=>{FX.visual=e.target.checked;store.set("ficha141_fxvis",FX.visual?"1":"0");applyFx();};
