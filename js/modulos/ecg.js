/* ECG: "lifeline" médica dos Pontos de Vida na barra de cima.
   Vida cheia: batimento firme e regular. Pouca vida: lento, fraco e irregular, em vermelho.
   PV temporários: mais rápido, mais forte e com brilho azul. 0 PV: linha reta. */
window.ECG = (() => {
  const cv = document.getElementById("hEcg");
  if (!cv) return { ler() {} };
  const ctx = cv.getContext("2d");
  const calmo = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const toque = matchMedia("(pointer:coarse)").matches;
  let W = 0, H = 0, dpr = 1, ys = new Float32Array(0), cols = new Uint8Array(0);
  let x = 0, t = 0, fase = 0, last = 0, raf = 0, visivel = true, pulaBatida = false;
  // estado atual, lido da ficha
  const st = { r: 1, temp: 0, tem: false, cor: "#ddd", acc: "#d33", azul: "#6cb6ff" };

  function ler() {
    const hc = document.getElementById("char-hp-current").value, hm = document.getElementById("char-hp-max").value;
    const max = parseFloat(hm) || 0, cur = hc === "" ? max : (parseFloat(hc) || 0);
    st.tem = hm !== "" && max > 0;
    st.r = st.tem ? Math.max(0, Math.min(1, cur / max)) : 1;
    st.temp = window.INTER ? INTER.temp() : 0;
    cores();
    if (calmo) estatico();
  }
  // cores do tema (relidas a cada batida, para acompanhar a troca de tema)
  function cores() {
    const cs = getComputedStyle(document.documentElement);
    st.cor = cs.getPropertyValue("--txt").trim() || "#ddd";
    st.acc = cs.getPropertyValue("--acc").trim() || "#d33";
  }
  // parâmetros do batimento conforme a vida
  function modo() {
    if (!st.tem) return { bpm: 0, amp: 0, ruido: .02, c: 0 };
    if (st.r <= 0) return { bpm: 0, amp: 0, ruido: .04, c: 1 };
    if (st.temp > 0) return { bpm: 104, amp: 1, ruido: .02, c: 2 };
    if (st.r <= .25) return { bpm: 42 + st.r * 60, amp: .28 + st.r * .9, ruido: .05, c: 1, irreg: true };
    return { bpm: 62 + st.r * 18, amp: .5 + st.r * .45, ruido: .015, c: 0 };
  }
  // forma do complexo P-QRS-T, fase de 0 a 1
  const g = (p, c, w) => Math.exp(-((p - c) * (p - c)) / (2 * w * w));
  const onda = p => .12 * g(p, .12, .025) - .14 * g(p, .225, .008) + 1 * g(p, .25, .009) - .3 * g(p, .275, .01) + .22 * g(p, .47, .045);

  function resize() {
    const r = cv.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const nW = Math.max(1, Math.round(r.width)), nH = Math.max(1, Math.round(r.height));
    if (nW === W && nH === H) return;
    W = nW; H = nH; cv.width = W * dpr; cv.height = H * dpr;
    ys = new Float32Array(W).fill(0); cols = new Uint8Array(W); x = 0;
    if (calmo) estatico();
  }
  function amostra(dt) {
    const m = modo(), per = m.bpm ? 60 / m.bpm : 1;
    fase += dt / per;
    if (fase >= 1) { fase -= 1; pulaBatida = m.irreg && Math.random() < .22; cores(); }
    const v = m.bpm && !pulaBatida ? onda(fase) * m.amp : 0;
    return { y: v + (Math.random() - .5) * m.ruido, c: m.c };
  }
  const corDe = c => c === 2 ? st.azul : c === 1 ? st.acc : st.cor;
  function desenha() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const base = H * .7, esc = H * .62, rastro = W * .85;
    ctx.lineWidth = 1.5; ctx.lineJoin = "round"; ctx.lineCap = "round";
    // segmentos curtos com opacidade decrescente atrás do cursor
    const passo = 6;
    for (let d = 0; d < rastro; d += passo) {
      const a0 = Math.round(x - d), a1 = a0 - passo;
      ctx.beginPath();
      let ini = false;
      for (let k = a0; k >= a1 - 1; k--) {
        const i = ((k % W) + W) % W;
        const px = i, py = base - ys[i] * esc;
        if (!ini || i === W - 1) { ctx.moveTo(px, py); ini = true; } else ctx.lineTo(px, py);
      }
      const c = corDe(cols[((a0 % W) + W) % W]);
      ctx.strokeStyle = c; ctx.globalAlpha = Math.max(0, 1 - d / rastro);
      ctx.shadowColor = c; ctx.shadowBlur = cols[((a0 % W) + W) % W] === 2 ? 6 : 0;
      ctx.stroke();
    }
    // ponto do cursor
    const ix = Math.floor(x) % W, c = corDe(cols[ix]);
    ctx.globalAlpha = 1; ctx.shadowBlur = 8; ctx.shadowColor = c; ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(ix, base - ys[ix] * esc, 1.8, 0, 7); ctx.fill();
    ctx.shadowBlur = 0;
  }
  function estatico() {
    if (!W) return;
    fase = 0; x = 0;
    for (let i = 0; i < W; i++) { const s = amostra(1 / 80); ys[i] = s.y; cols[i] = s.c; }
    x = W - 1; desenha();
  }
  const VEL = 70; // px por segundo
  function quadro(now) {
    raf = 0;
    if (!visivel || document.hidden) return;
    // no celular ~30fps basta
    if (toque && last && now - last < 30) { raf = requestAnimationFrame(quadro); return; }
    const dt = Math.min(.1, (now - (last || now)) / 1000); last = now;
    let anda = dt * VEL;
    const sub = 1 / VEL;
    while (anda > 0) {
      const s = amostra(sub); x = (x + 1) % W;
      ys[Math.floor(x)] = s.y; cols[Math.floor(x)] = s.c; anda -= 1;
    }
    desenha();
    raf = requestAnimationFrame(quadro);
  }
  function liga() { if (!raf && !calmo && visivel && !document.hidden) { last = 0; raf = requestAnimationFrame(quadro); } }

  new ResizeObserver(() => { resize(); }).observe(cv);
  if ("IntersectionObserver" in window) new IntersectionObserver(e => { visivel = e[0].isIntersecting; liga(); }).observe(cv);
  document.addEventListener("visibilitychange", liga);
  resize(); ler(); liga();
  return { ler };
})();
