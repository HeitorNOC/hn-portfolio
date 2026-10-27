/* HN Services — full cinematic opening (15 shots).
   Fixed WebGL canvas scrubs graded frame sequences over the #hero track.
   Mosaic+halftone at chapter changes, light dissolve inside a chapter, and a
   mosaic exit into the page ink as the first section slides over the film. */
(() => {
  const N = 30;
  const W = [1.25, 1, .9, .8, .9, 1, .7, .7, 1, 1.15, .9, .8, .8, .9, 1.35];
  const MODE = [0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0];
  const S = W.length, CUM = W.reduce((a, w, i) => (a.push(a[i] + w), a), [0]), TOT = CUM[S];
  const at = s => { const k = Math.min(S - 1, Math.floor(s)); return (CUM[k] + (s - k) * W[k]) / TOT; };
  const CH = [["c1", .32, 2], ["c2", 2, 5], ["c3", 5, 8], ["c4", 8, 10], ["c5", 10, 13], ["c6", 13, 14]]
    .map(([id, a, b]) => ({ el: document.getElementById(id), a: at(a), b: at(b) }));
  const LOCK_AT = at(14.2);
  const NAMES = ["Código", "Produto", "Infraestrutura", "Escala", "Clientes", "Juntos"];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pad = n => String(n).padStart(2, "0");
  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const set_ = innerHeight > innerWidth * 1.05 ? "m" : "d";
  const IMG = set_ === "m" ? [720, 1280] : [1600, 900];

  /* rail ticks from the chapter map */
  const rail = document.querySelector(".rail");
  CH.forEach(c => { const i = document.createElement("i"); i.style.top = (c.a * 100).toFixed(1) + "%"; rail.appendChild(i); });

  /* loader: preloads what the opening needs before the page opens — the first shots of the film
     for this screen shape, the fonts and the project posters — and reports real downloaded bytes.
     The rest of the film keeps streaming in the background after the page opens. */
  const PRE = set_ === "m" ? 4 : 3;                         // shots ready before entering (the whole first chapter and more)
  const DEC = 0.35;                                         // decoding weighs 35% of a shot's bytes in the progress bar
  const frames = Array.from({ length: S }, () => Array(N).fill(null));
  const el = id => document.getElementById(id);
  const ui = { bar: el("loader-bar"), pct: el("loader-pct"), step: el("loader-step") };
  const loadState = { done: 0, total: 1 };
  let started = false, shown = 0;
  const paint = () => {
    const p = Math.min(1, loadState.done / loadState.total);
    const v = Math.max(shown, Math.floor(p * 100)); shown = v;           // never runs backwards
    ui.pct.textContent = String(v).padStart(3, "0"); ui.bar.style.transform = `scaleX(${v / 100})`;
  };
  const step = () => {};                                   // the label stays a plain "Carregando"
  document.documentElement.classList.add("is-loading");
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  const decode = u => { const i = new Image(); i.src = u; return i.decode().then(() => i, () => null); };
  async function fetchBytes(url, onBytes) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(url);
    if (!r.body || !r.body.getReader) { const b = await r.blob(); onBytes(b.size); return b; }
    const rd = r.body.getReader(), parts = [];
    for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); onBytes(value.length); }
    return new Blob(parts);
  }
  async function loadShot(k, offs, counted) {
    const blob = await fetchBytes(`/pack/${set_}/h${k + 1}.webp`, n => { if (counted) { loadState.done += n; paint(); } });
    for (let i = 0; i < offs.length; i += 6) {                       // decode in small batches, yielding between them
      const batch = offs.slice(i, i + 6);
      (await Promise.all(batch.map(([o, l]) => decode(URL.createObjectURL(blob.slice(o, o + l, "image/webp"))))))
        .forEach((im, j) => frames[k][i + j] = im);
      if (counted) { loadState.done += batch.reduce((a, [, l]) => a + l, 0) * DEC; paint(); }
      if (!counted) await new Promise(r => (window.requestIdleCallback || setTimeout)(r, { timeout: 120 }));
    }
    dirty = true;
  }
  const sizeOf = offs => { const [o, l] = offs[offs.length - 1]; return o + l; };

  async function preload() {
    const man = await (await fetch("/pack/manifest.json")).json();
    const packs = man.sets[set_];
    const posters = [...document.querySelectorAll("#track img")].map(i => i.currentSrc || i.src);
    const FONT_W = 110000, POSTER_W = 80000;                          // byte weights for items without a known size
    loadState.total = FONT_W + posters.length * POSTER_W;
    for (let k = 0; k < PRE; k++) loadState.total += sizeOf(packs[`h${k + 1}`]) * (1 + DEC);

    step("Fontes");
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    await Promise.race([fonts, new Promise(r => setTimeout(r, 2500))]);
    loadState.done += FONT_W; paint();

    for (let k = 0; k < PRE; k++) { step(`Filme · plano ${k + 1} de ${PRE}`); await loadShot(k, packs[`h${k + 1}`], true); }

    step("Projetos");
    await Promise.all(posters.map(u => decode(u).then(() => { loadState.done += POSTER_W; paint(); })));

    loadState.done = loadState.total; paint(); step("Pronto");
    await new Promise(r => setTimeout(r, 350));
    start();
    for (let k = PRE; k < S; k++) await loadShot(k, packs[`h${k + 1}`], false);
  }
  preload().catch(() => start());
  setTimeout(() => start(), 20000);                                    // a slow network never locks the page
  const pick = (k, i) => { const r = frames[k]; if (!r) return null; if (r[i]) return r[i];
    for (let d = 1; d < N; d++) { if (r[i - d]) return r[i - d]; if (r[i + d]) return r[i + d]; } return null; };

  /* WebGL */
  let dirty = true, lastP = -1, lastOver = -1;      // the canvas only redraws when something changed
  const canvas = document.getElementById("film");
  const gl = canvas.getContext("webgl", { antialias: false });
  const FS = `precision highp float;
  uniform sampler2D uA,uB,uN;uniform float uMix,uT,uMode,uExit,uTime,uFade,uGrain;uniform vec2 uRes,uImg;varying vec2 vUv;
  vec2 cover(vec2 uv){float rs=uRes.x/uRes.y,ri=uImg.x/uImg.y;vec2 s=rs>ri?vec2(1.,ri/rs):vec2(rs/ri,1.);return (uv-.5)*s+.5;}
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float lum(vec3 c){return dot(c,vec3(.299,.587,.114));}
  vec3 halftone(vec3 c,float k){vec2 cell=fract(vUv*uRes/7.)-.5;return mix(c,c*smoothstep(.5,.42,length(cell)/(sqrt(lum(c))*.8+.04))*1.3,k);}
  void main(){
    vec2 uv=cover(vUv);float t=uT,pk=sin(3.14159*t);vec3 c;
    if(uMode>.5){
      float cells=mix(900.,30.,pk);vec2 g=vec2(cells,cells*uRes.y/uRes.x);
      vec2 p=t>.001?(floor(uv*g)+.5)/g:uv;
      vec3 a=mix(texture2D(uA,p).rgb,texture2D(uB,p).rgb,uMix),b=texture2D(uN,p).rgb;
      float n=h(floor(uv*g));c=mix(a,b,smoothstep(n-.18,n+.18,t*1.36-.18));c=halftone(c,pk*.55);
    }else{
      vec3 a=mix(texture2D(uA,uv).rgb,texture2D(uB,uv).rgb,uMix),b=texture2D(uN,uv).rgb;
      float L=lum(b);c=mix(a,b,smoothstep(L-.3,L+.3,t*1.6-.3))+pk*.1;
    }
    if(uExit>0.){                                   /* film -> page: mosaic into ink */
      float e=uExit,cells=mix(260.,22.,e);vec2 g=vec2(cells,cells*uRes.y/uRes.x);
      float n=h(floor(vUv*g)+3.7);c=halftone(c,sin(3.14159*min(e,1.))*.5);
      c=mix(c,vec3(.055,.051,.043),smoothstep(n-.12,n+.12,e*1.25-.12));
    }
    vec2 q=vUv-.5;c*=1.-dot(q,q)*.85;
    c+=(h(vUv*uRes+fract(uTime*.37)*91.7)-.5)*uGrain;
    gl_FragColor=vec4(c*uFade,1.);
  }`;
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, "attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}"));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {}; "uA uB uN uMix uT uMode uExit uTime uFade uGrain uRes uImg".split(" ").forEach(n => U[n] = gl.getUniformLocation(prog, n));
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  const slots = [0, 1, 2].map(unit => {
    const tex = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([14, 13, 11, 255]));
    return { unit, tex, img: null };
  });
  gl.uniform1i(U.uA, 0); gl.uniform1i(U.uB, 1); gl.uniform1i(U.uN, 2); gl.uniform2f(U.uImg, IMG[0], IMG[1]);
  const bind = (s, img) => { if (!img || s.img === img) return false; gl.activeTexture(gl.TEXTURE0 + s.unit); gl.bindTexture(gl.TEXTURE_2D, s.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); s.img = img; return true; };
  const resize = () => { const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(innerWidth * dpr); canvas.height = Math.round(innerHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(U.uRes, canvas.width, canvas.height); dirty = true; };
  addEventListener("resize", resize); resize();

  /* scroll */
  const hero = document.getElementById("hero"), $ = s => document.querySelector(s);
  const fill = $("#rail-fill"), fcount = $("#hud-frame"), chapLabel = $("#hud-chapter"), lock = $("#lockup"), intro = $("#intro");
  let P = 0;
  function draw(now) {
    const end = hero.offsetHeight - innerHeight, y = scrollY;
    const target = Math.min(1, Math.max(0, y / end));
    const over = Math.min(1, Math.max(0, (y - end) / (innerHeight * 0.85)));
    const live = over < 1;
    document.body.classList.toggle("past-hero", y > end + innerHeight * 0.6);
    P += (target - P) * (reduce ? 1 : 0.2); if (Math.abs(target - P) < 1e-5) P = target;
    const moving = Math.abs(P - lastP) > 1e-6 || Math.abs(over - lastOver) > 1e-6;
    if (live && (moving || dirty)) {
      lastP = P; lastOver = over; dirty = false;
      const g = P * TOT; let k = 0; while (k < S - 1 && g >= CUM[k + 1]) k++;
      const local = Math.min(1, (g - CUM[k]) / W[k]), hold = MODE[k] ? .78 : .86;
      let f, t = 0;
      if (k === S - 1) f = local * (N - 1); else if (local < hold) f = local / hold * (N - 1); else { f = N - 1; t = (local - hold) / (1 - hold); }
      const i0 = Math.floor(f), i1 = Math.min(N - 1, i0 + 1);
      if (!pick(k, i0)) dirty = true;               // frame not streamed yet: try again next tick
      bind(slots[0], pick(k, i0)); bind(slots[1], pick(k, i1)); if (t > 0) bind(slots[2], pick(k + 1, 0));
      gl.uniform1f(U.uMix, f - i0); gl.uniform1f(U.uT, reduce ? +(t > .5) : t); gl.uniform1f(U.uMode, k < S - 1 ? MODE[k] : 0);
      gl.uniform1f(U.uExit, reduce ? +(over > .5) : over);
      gl.uniform1f(U.uTime, now / 1000); gl.uniform1f(U.uGrain, reduce ? .03 : .06); gl.uniform1f(U.uFade, .1 + .9 * ss(0, .04, P));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      fill.style.transform = `scaleY(${P})`;
      fcount.textContent = String(Math.round(k * N + f) + 1).padStart(3, "0");
      let ci = 0;
      CH.forEach((c, idx) => {
        const o = ss(c.a - .006, c.a + .022, P) * (1 - ss(c.b - .03, c.b - .008, P));
        c.el.style.setProperty("--o", o.toFixed(3)); if (P >= c.a - .01) ci = idx;
      });
      chapLabel.textContent = `${pad(ci + 1)} / 06 · ${P >= LOCK_AT - .01 ? "HN Services" : NAMES[ci]}`;
      const lo = ss(LOCK_AT, LOCK_AT + .03, P) * (1 - ss(0, .35, over));
      lock.style.setProperty("--o", lo.toFixed(3)); lock.classList.toggle("on", lo > .5);
      intro.style.setProperty("--o", (1 - ss(.003, .025, P)).toFixed(3));
      document.documentElement.style.setProperty("--hud", (1 - ss(0, .4, over)).toFixed(3));
    }
    canvas.style.visibility = live ? "visible" : "hidden";
    requestAnimationFrame(draw);
  }
  function start() {
    if (started) return; started = true;
    scrollTo(0, 0);
    document.documentElement.classList.remove("is-loading"); document.body.classList.add("is-ready");
    if (window.Lenis && !reduce) { const l = new Lenis({ lerp: .1, smoothWheel: true }); window.__lenis = l;
      const raf = t => { l.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
    requestAnimationFrame(draw);
  }
})();
