"use strict";
// ================== RETRATO / FUNDO / CRT ==================
let portraitSrc="";
function setPortrait(src){
  portraitSrc=src&&String(src).startsWith("data:image")?src:"";
  $("portraitImg").src=portraitSrc;$("portraitImg").classList.toggle("hidden",!portraitSrc);$("portraitPh").classList.toggle("hidden",!!portraitSrc);
}
$("portrait").onclick=()=>{sfx("clique");$("portraitUp").click();};
async function portraitFrom(input){
  const f=input.files[0];if(!f) return;
  try{setPortrait(await readImage(f,420));changed();toast(f.type==="image/gif"?"GIF DO OPERADOR ATUALIZADO":"IMAGEM DO OPERADOR ATUALIZADA");}catch(e){toast(e&&e.gif?"GIF MUITO GRANDE // MÁXIMO 10 MB":"NÃO FOI POSSÍVEL LER A IMAGEM",true);sfx("errado");}
  input.value="";
}
$("portraitUp").onchange=e=>portraitFrom(e.target);
$("char-image-upload").onchange=e=>portraitFrom(e.target);

function setBg(url){
  url=(url||"").trim();$("background-url-input").value=url;
  $("bgimg").style.backgroundImage=url?`url("${url.replace(/"/g,"%22")}")`:"";
}
$("bgApply").onclick=()=>{setBg($("background-url-input").value);changed();toast($("background-url-input").value?"PLANO DE FUNDO APLICADO":"PLANO DE FUNDO REMOVIDO");};
function setCrt(on){document.body.classList.toggle("nocrt",!on);$("crtToggle").checked=on;store.set(KEY_CRT,on?"1":"0");}
$("crtToggle").onchange=e=>setCrt(e.target.checked);
setCrt(store.get(KEY_CRT)!=="0");

// nome real oculto
$("eyeBtn").onclick=()=>{const w=$("nameWrap"),h=!w.classList.contains("hid");w.classList.toggle("hid",h);$("char-name").readOnly=h;$("eyeBtn").textContent=h?"◌":"◉";$("eyeBtn").title=h?"Mostrar nome real":"Ocultar nome real";};
