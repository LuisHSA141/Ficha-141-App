"use strict";
// =====================================================================
// 141 // TRANSIÇÃO "SINAL PERDIDO" (inspirada no visual de terminal CRT do Signalis)
// 1) a tela atual se rasga em faixas horizontais e separa as cores (filtro SVG)
// 2) chiado tingido na cor do tema, linhas de varredura e piscadas cobrem tudo
// 3) no pico aparece o aviso de sinal, a ficha entra por baixo e se estabiliza
// =====================================================================
const GLITCH = (() => {
  const NS = "http://www.w3.org/2000/svg";
  let svg, cv, ctx, buf, bctx, tiles = [], scan = null, TXT = {};
  const PADRAO = { t: "SINAL PERDIDO", s: "// RESTABELECENDO CONEXÃO COM O OPERADOR" };
  const R = (a, b) => a + Math.random() * (b - a);

  function montar() {
    if (svg) return;
    // filtro: rasgos (deslocamento só na horizontal, em degraus) + separação vermelho / ciano
    svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", "0"); svg.setAttribute("height", "0"); svg.setAttribute("aria-hidden", "true");
    svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    svg.innerHTML = `<filter id="sgF" x="-10%" y="0%" width="120%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence id="sgT" type="fractalNoise" baseFrequency="0 0.06" numOctaves="1" seed="2" result="t"/>
      <feComponentTransfer in="t" result="s"><feFuncR type="discrete" tableValues="0 .5 .5 .5 .5 .5 1"/><feFuncG type="discrete" tableValues=".5"/></feComponentTransfer>
      <feDisplacementMap id="sgD" in="SourceGraphic" in2="s" scale="0" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feColorMatrix in="d" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/>
      <feOffset id="sgR" in="r" dx="0" dy="0" result="ro"/>
      <feColorMatrix in="d" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb"/>
      <feOffset id="sgC" in="gb" dx="0" dy="0" result="go"/>
      <feBlend in="ro" in2="go" mode="screen"/>
    </filter>`;
    document.body.appendChild(svg);
    cv = document.createElement("canvas"); cv.className = "sg-cv"; cv.setAttribute("aria-hidden", "true");
    document.body.appendChild(cv); ctx = cv.getContext("2d");
    buf = document.createElement("canvas"); bctx = buf.getContext("2d");
    // ruído pronto em blocos pequenos: esticado na horizontal vira risco de fita
    for (let k = 0; k < 4; k++) {
      const t = document.createElement("canvas"); t.width = 96; t.height = 64;
      const g = t.getContext("2d"), im = g.createImageData(96, 64), D = im.data;
      for (let y = 0; y < 64; y++) { let run = 0, v = 0; for (let x = 0; x < 96; x++) { if (--run <= 0) { run = 1 + Math.random() * 7 | 0; v = Math.random() < .45 ? Math.random() * 255 : Math.random() * 40; } const i = (y * 96 + x) * 4; D[i] = D[i + 1] = D[i + 2] = v; D[i + 3] = 255; } }
      g.putImageData(im, 0, 0); tiles.push(t);
    }
  }
  function acc() { // cor do tema (vermelho no padrão)
    const v = getComputedStyle(document.documentElement).getPropertyValue("--acc-rgb").trim().split(/\s+/).map(Number);
    return v.length === 3 && v.every(n => !isNaN(n)) ? v : [179, 38, 63];
  }
  function filtro(els, on) { els.filter(Boolean).forEach(e => { e.style.filter = on ? "url(#sgF)" : ""; e.style.willChange = on ? "filter" : ""; }); }
  function setF(k) { // k = intensidade 0..1
    const D = document.getElementById("sgD"), T = document.getElementById("sgT"), Rr = document.getElementById("sgR"), C = document.getElementById("sgC");
    const tear = Math.random() < .25 + k * .6 ? k : k * .15;
    D.setAttribute("scale", (tear * R(40, 140)).toFixed(1));
    if (Math.random() < .55) { T.setAttribute("seed", 1 + Math.random() * 999 | 0); T.setAttribute("baseFrequency", `0 ${R(.015, .12).toFixed(3)}`); }
    const sp = k * R(3, 14) + R(0, 2);
    Rr.setAttribute("dx", sp.toFixed(1)); C.setAttribute("dx", (-sp).toFixed(1));
    Rr.setAttribute("dy", (Math.random() < .2 ? R(-2, 2) : 0).toFixed(1));
  }
  function limpaF() { const D = document.getElementById("sgD"); if (!D) return; D.setAttribute("scale", "0"); document.getElementById("sgR").setAttribute("dx", "0"); document.getElementById("sgC").setAttribute("dx", "0"); }

  // ---------- quadro do chiado ----------
  function quadro(k, fase, e) {
    const W = cv.width, H = cv.height, [ar, ag, ab] = acc(), out = cv.getContext("2d");
    out.clearRect(0, 0, W, H);
    if (k <= 0.01) return;
    if (buf.width !== W || buf.height !== H) { buf.width = W; buf.height = H; }
    const ctx = bctx;
    // fundo escuro (o buffer é sempre opaco)
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1; ctx.fillStyle = "#050203"; ctx.fillRect(0, 0, W, H);
    // faixas de chiado (blocos de ruído esticados), mais grossas no pico
    let y = 0;
    while (y < H) {
      const h = Math.random() < .15 ? R(H * .05, H * .22) : R(2, H * .035);
      if (Math.random() < .25 + k * .7) {
        ctx.globalAlpha = R(.35, 1);
        const t = tiles[Math.random() * 4 | 0], sx = R(0, 60), sy = R(0, 48);
        ctx.drawImage(t, sx, sy, R(8, 36), Math.max(1, h / 6), R(-W * .2, 0), y, W * 1.4, h);
      }
      y += h;
    }
    // tinge tudo na cor do tema (o chiado do Signalis é vermelho)
    ctx.globalCompositeOperation = "multiply"; ctx.globalAlpha = 1;
    ctx.fillStyle = `rgb(${ar},${ag},${ab})`; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(${ar},${ag},${ab},.1)`; ctx.fillRect(0, 0, W, H);
    // faixas claras de "tracking" que cortam a tela
    const nb = Math.random() * 3 | 0;
    for (let i = 0; i < nb; i++) { ctx.globalAlpha = R(.15, .5) * k; ctx.fillStyle = `rgb(${Math.min(255, ar + 90)},${Math.min(255, ag + 70)},${Math.min(255, ab + 70)})`; ctx.fillRect(0, R(0, H), W, R(1, 4)); }
    // barra que rola de cima para baixo
    const by = ((e / 900) % 1) * (H + 80) - 40;
    const gr = ctx.createLinearGradient(0, by - 40, 0, by + 40);
    gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(.5, `rgba(${ar},${ag},${ab},${.35 * k})`); gr.addColorStop(1, "rgba(255,255,255,0)");
    ctx.globalAlpha = 1; ctx.fillStyle = gr; ctx.fillRect(0, by - 40, W, 80);
    // blocos pretos de "pacote perdido"
    ctx.globalCompositeOperation = "source-over";
    for (let i = 0, n = Math.random() * 4 | 0; i < n; i++) { ctx.globalAlpha = R(.6, 1) * k; ctx.fillStyle = "#000"; ctx.fillRect(R(0, W), R(0, H), R(W * .05, W * .45), R(2, H * .08)); }
    // aviso de sinal no pico, com as cores separadas
    if (fase === "pico") {
      const fs = Math.max(13, Math.min(26, W / 30)), cx = W / 2, cy = H / 2, jit = R(-3, 3);
      ctx.font = `bold ${fs}px "Courier New", monospace`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const txt = Math.random() < .05 ? "▓▓ ▒▒▒▒ ░░░ ▓▓▓▓" : TXT.t;
      const sub = TXT.s;
      ctx.globalAlpha = .9; ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = "rgba(255,0,40,.9)"; ctx.fillText(txt, cx - 3 + jit, cy - fs * .6);
      ctx.fillStyle = "rgba(0,220,255,.7)"; ctx.fillText(txt, cx + 3 + jit, cy - fs * .6);
      ctx.fillStyle = "#fff"; ctx.globalAlpha = .85; ctx.fillText(txt, cx + jit, cy - fs * .6);
      ctx.font = `${Math.round(fs * .45)}px "Courier New", monospace`; ctx.globalAlpha = .7;
      ctx.fillStyle = `rgb(${Math.min(255, ar + 60)},${Math.min(255, ag + 40)},${Math.min(255, ab + 40)})`; ctx.fillText(sub, cx, cy + fs * .5);
      // moldura de terminal
      ctx.globalCompositeOperation = "source-over"; ctx.strokeStyle = `rgba(${ar},${ag},${ab},.8)`; ctx.lineWidth = 1; ctx.globalAlpha = .8;
      const bw = Math.min(W * .92, Math.max(fs * 17, ctx.measureText(sub).width + fs * 2)), bh = fs * 2.6; ctx.strokeRect(cx - bw / 2 + jit, cy - bh / 2 - fs * .15, bw, bh);
    }
    // linhas de varredura por cima de tudo
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = .55 * Math.min(1, k * 1.5);
    ctx.fillStyle = scan; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    // passa para a tela em faixas: com k baixo, várias faixas ficam abertas e mostram a página rasgada
    if (k >= .999) { out.drawImage(buf, 0, 0); return; }
    let yy = 0;
    while (yy < H) {
      const h = Math.random() < .2 ? R(H * .04, H * .18) : R(2, H * .04);
      if (Math.random() < k * 1.1) { out.globalAlpha = Math.min(1, .55 + k * .6); out.drawImage(buf, 0, yy, W, h, (Math.random() < .3 ? R(-W * .04, W * .04) : 0), yy, W, h); }
      yy += h;
    }
    out.globalAlpha = 1;
  }

  function som(dur) {
    const c = typeof ac === "function" ? ac() : null, v = typeof synthVol === "function" ? synthVol(.5) : 0;
    if (!c || !v) return;
    const t = c.currentTime, n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    // estática "picotada" (sample-and-hold) com buracos
    let hold = 0, val = 0, gate = 1;
    for (let i = 0; i < n; i++) { if (--hold <= 0) { hold = 1 + (Math.random() < .015 ? 300 : 5) * Math.random() | 0; val = Math.random() * 2 - 1; if (Math.random() < .004) gate = Math.random() < .35 ? 0 : 1; } d[i] = val * gate; }
    const src = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf; bp.type = "bandpass"; bp.frequency.value = 2200; bp.Q.value = .6;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + dur * .25); g.gain.setValueAtTime(v, t + dur * .55); g.gain.linearRampToValueAtTime(0, t + dur);
    src.connect(bp).connect(g).connect(c.destination); src.start(t);
    // zumbido grave de CRT
    const o = c.createOscillator(), og = c.createGain(); o.type = "sawtooth"; o.frequency.value = 55;
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 260;
    og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(v * .5, t + dur * .3); og.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(lp).connect(og).connect(c.destination); o.start(t); o.stop(t + dur + .05);
    // bipes digitais descendo no pico
    [0, .07, .14].forEach((dt, i) => { const b = c.createOscillator(), bg = c.createGain(), t1 = t + dur * .42 + dt; b.type = "square"; b.frequency.setValueAtTime(1600 - i * 380, t1); bg.gain.setValueAtTime(v * .22, t1); bg.gain.exponentialRampToValueAtTime(.0001, t1 + .05); b.connect(bg).connect(c.destination); b.start(t1); b.stop(t1 + .06); });
  }

  // antes: elementos que se rasgam ao sair // depois: os que se rasgam ao entrar
  function rodar(antes, onPeak, depois, done, texto) {
    montar(); TXT = Object.assign({}, PADRAO, texto || {});
    const IN = 520, HOLD = 260, OUT = 620, T = IN + HOLD + OUT;
    const W = cv.width = Math.max(200, Math.round(innerWidth / 2)), H = cv.height = Math.max(150, Math.round(innerHeight / 2));
    // padrão de linhas de varredura
    const sp = document.createElement("canvas"); sp.width = 2; sp.height = 3; const sg = sp.getContext("2d"); sg.fillStyle = "rgba(0,0,0,.85)"; sg.fillRect(0, 2, 2, 1); scan = ctx.createPattern(sp, "repeat");
    cv.classList.add("on"); document.body.classList.add("sg-run");
    som(T / 1000);
    filtro(antes, true);
    let t0 = null, peak = false, last = 0, alvo = antes;
    function passo(now) {
      if (t0 === null) t0 = now;
      const e = now - t0;
      if (!peak && e >= IN + HOLD * .45) {
        peak = true; filtro(antes, false);
        try { onPeak(); } catch (err) { console.error(err); }
        alvo = depois(); filtro(alvo, true);
      }
      const fase = e < IN ? "in" : e < IN + HOLD ? "pico" : "out";
      // piscadas: alguns quadros apagam ou acendem de vez
      let k = fase === "in" ? Math.pow(e / IN, 1.6) : fase === "pico" ? 1 : Math.pow(Math.max(0, 1 - (e - IN - HOLD) / OUT), 1.4);
      if (fase !== "pico" && Math.random() < .12) k = Math.random() < .5 ? Math.min(1, k + .6) : k * .2;
      // ~30 quadros por segundo bastam e pesam menos no celular
      if (now - last > 30) { last = now; quadro(k, fase, e); setF(fase === "pico" ? 1 : fase === "in" ? Math.min(1, k * 1.4 + .15) : Math.min(1, k * 1.3)); }
      if (e < T) requestAnimationFrame(passo);
      else {
        ctx.clearRect(0, 0, W, H); cv.classList.remove("on"); limpaF(); filtro(alvo, false); document.body.classList.remove("sg-run");
        if (done) done();
      }
    }
    requestAnimationFrame(passo);
  }
  return { rodar };
})();
window.GLITCH = GLITCH;
