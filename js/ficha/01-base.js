"use strict";
// ================== BASE ==================
const $=id=>document.getElementById(id);
const ATTR_KEYS=Object.keys(ATTRIBUTES);
const ABBR={FOR:"FOR",DEX:"DES",CON:"CON",INT:"INT",SAB:"SAB",CHA:"CAR"};
const skillId=s=>"prof-skill-"+s.replace(/\s+/g,"");
const fmt=n=>(n>=0?"+":"")+n;
const modOf=s=>Math.floor((s-10)/2);
const num=(id,d=0)=>{const v=parseFloat($(id).value);return isNaN(v)?d:v;};
const nz=v=>{const n=parseFloat(v);return isNaN(n)?0:n;};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const KEY_QUICK="projeto141Character";        // mesma chave da ficha antiga
const KEY_AUTO="projeto141Character_auto";
const KEY_VOL="ficha141_vol",KEY_VM="ficha141_vol_musica",KEY_VS="ficha141_vol_efeitos",KEY_MUTE="ficha141_mudo",KEY_CRT="ficha141_crt",KEY_TAB="ficha141_tab";
const THEME_KEY="ficha141_tema";
try{const t=localStorage.getItem(THEME_KEY);if(t) document.documentElement.dataset.theme=t;}catch(e){}
const store={
  get(k){try{return localStorage.getItem(k);}catch(e){return null;}},
  set(k,v){try{localStorage.setItem(k,v);return true;}catch(e){return false;}},
  del(k){try{localStorage.removeItem(k);}catch(e){}}
};

document.addEventListener("click",e=>{
  const b=e.target.closest("[data-huse]");if(!b) return;
  e.preventDefault();e.stopPropagation();
  const row=b.closest(".fuse"),id=row.dataset.uid,max=+row.dataset.max,used=HABUSOS[id]||0,d=+b.dataset.huse;
  const nu=Math.max(0,Math.min(max,used-d));
  if(nu===used){sfx("errado");toast(d<0?"SEM USOS // DESCANSE":"JÁ ESTÁ CHEIO",d<0);return;}
  if(nu) HABUSOS[id]=nu; else delete HABUSOS[id];
  sfx("clique");updateFeatures(true);changed(true);
});
