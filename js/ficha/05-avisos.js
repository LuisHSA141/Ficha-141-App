"use strict";
// ================== AVISOS ==================
let toastT=null;
function toast(msg,err=false){
  const t=$("toast");t.textContent=msg;t.classList.toggle("err",err);t.classList.add("show");
  clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove("show"),2600);
}
let modalCb=null;
function ask(txt,{top="CONFIRMAÇÃO",yes="CONFIRMAR",no="CANCELAR"}={}){
  return new Promise(ok=>{
    $("mTop").textContent=top;$("mTxt").textContent=txt;$("mYes").textContent=yes;$("mNo").textContent=no;
    $("mNo").classList.toggle("hidden",!no);
    $("modal").classList.add("show");sfx("abrir");modalCb=ok;
    setTimeout(()=>$("mYes").focus(),30);
  });
}
function closeModal(v){if(!modalCb) return;$("modal").classList.remove("show");sfx("fechar");const cb=modalCb;modalCb=null;cb(v);}
$("mYes").setAttribute("data-nosfx","");$("mNo").setAttribute("data-nosfx","");
$("mYes").onclick=()=>closeModal(true);$("mNo").onclick=()=>closeModal(false);
$("modal").addEventListener("click",e=>{if(e.target.id==="modal") closeModal(false);});
