"use strict";
// ================== INÍCIO ==================
const blackout=$("blackout");
for(let i=0;i<96;i++) blackout.appendChild(document.createElement("i"));
function veil(cover,cb){
  const cells=[...blackout.children].sort(()=>Math.random()-.5);
  cells.forEach((c,i)=>setTimeout(()=>c.classList.toggle("on",cover),i*7));
  setTimeout(cb,cells.length*7+150);
}
// transição "sinal perdido" (glitch.js); sem animação, usa o véu de quadrados
function glitch(onPeak,done){
  if(!window.GLITCH||matchMedia("(prefers-reduced-motion:reduce)").matches){veil(true,()=>{onPeak();veil(false,done||(()=>{}));});return;}
  GLITCH.rodar([$("titleScreen"),$("wiz")],onPeak,()=>[$("sheet")],done);
}
// ===== menu inicial: o fundo e o painel acompanham o mouse (ou a inclinação do celular) =====
(()=>{
  const T=document.getElementById("titleScreen"),bg=document.getElementById("tsBg"),tilt=document.getElementById("tsTilt"),vid=document.getElementById("tsVid");
  if(!T||!bg||!tilt) return;
  // fundos disponíveis: a escolha fica salva no aparelho (Configurações > Visual)
  const FUNDOS={mosaico:["fundos/menu-mosaico.webm","fundos/menu-mosaico.mp4"],nenhum:null};
  let fundo="mosaico";try{const f=localStorage.getItem("ficha141_fundoMenu");if(f in FUNDOS) fundo=f;}catch(e){}
  function aplicaFundo(f){
    fundo=f in FUNDOS?f:"mosaico";try{localStorage.setItem("ficha141_fundoMenu",fundo);}catch(e){}
    bg.classList.remove("mosaico","cidade","nenhum");bg.classList.add(fundo);
    document.querySelectorAll("[data-fundo]").forEach(b=>b.classList.toggle("on",b.dataset.fundo===fundo));
    if(!vid) return;
    vid.classList.remove("ok");vid.pause();
    if(!FUNDOS[fundo]){vid.removeAttribute("src");vid.innerHTML="";vid.load();return;}
    vid.innerHTML=`<source src="${FUNDOS[fundo][0]}" type="video/webm"><source src="${FUNDOS[fundo][1]}" type="video/mp4">`;vid.load();
    const p=vid.play();if(p&&p.catch)p.catch(()=>{});
  }
  window.aplicaFundoMenu=aplicaFundo;
  document.addEventListener("click",e=>{const b=e.target.closest("[data-fundo]");if(b){aplicaFundo(b.dataset.fundo);sfx("clique");}});
  if(vid) vid.addEventListener("playing",()=>vid.classList.add("ok"));
  aplicaFundo(fundo);
  const calmo=matchMedia("(prefers-reduced-motion:reduce)").matches;
  let ax=0,ay=0,x=0,y=0,raf=0;
  const alvo=(nx,ny)=>{ax=Math.max(-1,Math.min(1,nx));ay=Math.max(-1,Math.min(1,ny));if(!raf) raf=requestAnimationFrame(passo);};
  function passo(){
    x+=(ax-x)*.08;y+=(ay-y)*.08;
    bg.style.setProperty("--bx",(-x*26).toFixed(2)+"px");bg.style.setProperty("--by",(-y*16).toFixed(2)+"px");
    const st=tilt.style;
    st.setProperty("--ry",(x*7).toFixed(2)+"deg");st.setProperty("--rx",(-y*6).toFixed(2)+"deg");
    st.setProperty("--tx",(x*10).toFixed(2)+"px");st.setProperty("--ty",(y*7).toFixed(2)+"px");
    st.setProperty("--sx",(-x*26).toFixed(1)+"px");st.setProperty("--sy",(18-y*14).toFixed(1)+"px");
    st.setProperty("--gx",(50+x*40).toFixed(1)+"%");st.setProperty("--gy",(30+y*35).toFixed(1)+"%");
    st.setProperty("--lx",(x*8).toFixed(2)+"px");st.setProperty("--ly",(y*6).toFixed(2)+"px");
    raf=(Math.abs(ax-x)+Math.abs(ay-y)>.002)?requestAnimationFrame(passo):0;
  }
  const visivel=()=>T.style.display!=="none"&&document.body.classList.contains("title-on");
  if(calmo) return;
  window.addEventListener("mousemove",e=>{if(visivel()) alvo(e.clientX/innerWidth*2-1,e.clientY/innerHeight*2-1);},{passive:true});
  document.addEventListener("mouseleave",()=>alvo(0,0));
  window.addEventListener("blur",()=>alvo(0,0));
  // celular: inclinação do aparelho (Android libera direto; no iPhone fica parado)
  window.addEventListener("deviceorientation",e=>{if(!visivel()||e.gamma==null) return;alvo(e.gamma/25,(e.beta-45)/25);},{passive:true});
  // o vídeo só roda com o menu na tela
  new MutationObserver(()=>{if(!vid) return;if(visivel()){const p=vid.play();if(p&&p.catch)p.catch(()=>{});}else vid.pause();}).observe(document.body,{attributes:true,attributeFilter:["class"]});
})();
// entra na ficha (vindo da tela inicial ou da criação)
function enterSheet(){
  if(state==="sheet"||state==="entering") return;
  const fromTitle=state==="title";state="entering";
  if(musicTarget()>0&&music.paused) music.play().catch(()=>{});   // libera o áudio ainda dentro do clique (Safari/iOS)
  document.body.classList.add("booting");
  setTimeout(()=>glitch(()=>{
    document.body.classList.remove("booting","title-on","locked");
    $("titleScreen").style.display="none";const w=$("wiz");if(w) w.classList.remove("show","small");
    $("sheet").classList.add("show");$("dock").classList.add("show");
    state="sheet";applyFx();syncHud();window.scrollTo(0,0);
    if(window.MOD) MOD.refresh();
    {const sb=document.querySelector(".stash-box");if(sb&&!sb.classList.contains("min")){sb.classList.add("min");if(window.MOD) MOD.relayout();}}
    if(musicTarget()>0) fadeMusic(musicTarget());
    update();renderInv();autosave();
  }),fromTitle?450:120);
}
const start=enterSheet;

// carrega o último estado (autosave; se não houver, o salvamento rápido da ficha antiga)
// a ficha começa vazia; a tela inicial pergunta se é operador novo ou existente (criacao.js)
function boot(){
  $("armGuia").innerHTML=ARM.guide();
  resetForm();
  update();renderAll();updateInjuries();
  const tab=store.get(KEY_TAB);if(tab) showTab(tab,true);
}
