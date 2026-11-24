"use strict";
// 141 // ÚLTIMO SCRIPT: registra o modo offline (PWA) e abre a tela inicial
// app instalável (PWA): funciona sem internet depois da primeira visita. No app nativo não precisa.
if("serviceWorker" in navigator&&(location.protocol==="https:"||location.hostname==="localhost")){
  if(!(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform())) navigator.serviceWorker.register("sw.js").catch(e=>console.warn("sw",e));
}
FICHAS.init().catch(e=>console.error(e)).then(()=>{boot();buildTitle();try{musUI();}catch(e){}setTimeout(()=>$("newBtn")&&$("newBtn").focus(),60);});
