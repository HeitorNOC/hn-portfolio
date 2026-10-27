/* HN Services — page behaviour.
   Real preloader (fonts, hero video, key images); one layered moment (the paper sheet covers the
   hero, which shrinks and dims); header that follows what is under it; word-by-word titles;
   About statement that lights up word by word; service list with a cursor image preview;
   project videos on hover/in view; FAQ; contact form. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const root = document.documentElement;
  root.classList.add("is-loading");
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  /* ---------- split headings into words (keeps <em>) ---------- */
  let wi = 0;
  const splitNode = (node, into, cls) => {
    node.textContent.split(/(\s+)/).forEach(part => {
      if (!part) return;
      if (/^\s+$/.test(part)) { into.appendChild(document.createTextNode(" ")); return; }
      const w = document.createElement("span"); w.className = "w";
      if (cls) { w.textContent = part; into.appendChild(w); return; }
      const s = document.createElement("span"); s.textContent = part; s.style.setProperty("--i", wi++);
      w.appendChild(s); into.appendChild(w);
    });
  };
  const split = (h, flat) => {
    wi = 0;
    const frag = document.createDocumentFragment();
    [...h.childNodes].forEach(n => {
      if (n.nodeType === 3) splitNode(n, frag, flat);
      else { const c = n.cloneNode(false); splitNode(n, c, flat); frag.appendChild(c); }
    });
    if (!flat) h.setAttribute("aria-label", h.textContent.trim());
    h.textContent = ""; h.appendChild(frag);
    if (!flat) [...h.children].forEach(c => c.setAttribute("aria-hidden", "true"));
  };
  $$("[data-split]").forEach(h => split(h));
  const stmt = $("#stmt"); split(stmt, true);
  const stmtWords = $$(".w", stmt);

  /* ---------- reveals: hidden only once JS runs; an observer releases them ---------- */
  const waiting = [];
  if (!reduce) {
    $$("[data-rv]").forEach(el => { el.classList.add("rv-wait"); waiting.push([el, "rv-wait", "rv-in"]); });
    $$("[data-split]").forEach(el => { el.classList.add("sp-wait"); waiting.push([el, "sp-wait", "sp-in"]); });
    $$("[data-reveal]").forEach(el => { el.classList.add("img-wait"); waiting.push([el, "img-wait", "img-in"]); });
  }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const item = waiting.find(w => w[0] === e.target); if (!item) return;
    e.target.classList.remove(item[1]); e.target.classList.add(item[2]); io.unobserve(e.target);
  }), { rootMargin: "0px 0px -8% 0px" });
  const armReveals = () => waiting.forEach(([el, a, b]) => {
    // the hero is on screen from the start: release it right away instead of waiting on the observer
    if (el.closest(".hero")) { el.classList.remove(a); el.classList.add(b); } else io.observe(el);
  });

  /* ---------- loader: fonts + hero video + key images, progress in real bytes ---------- */
  const ui = { bar: $("#loader-bar"), pct: $("#loader-pct") };
  const load = { done: 0, total: 1 }; let shown = 0, started = false;
  const paint = () => {
    const v = Math.max(shown, Math.floor(Math.min(1, load.done / load.total) * 100)); shown = v;
    ui.pct.textContent = String(v).padStart(3, "0"); ui.bar.style.transform = `scaleX(${v / 100})`;
  };
  async function fetchBytes(url, weight) {
    const r = await fetch(url); if (!r.ok) throw new Error(url);
    const len = +r.headers.get("content-length") || 0;
    if (!r.body || !r.body.getReader || !len) { const b = await r.blob(); load.done += weight; paint(); return b; }
    const rd = r.body.getReader(), parts = [];
    for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); load.done += value.length / len * weight; paint(); }
    return new Blob(parts, { type: r.headers.get("content-type") || "" });
  }
  const decode = u => { const i = new Image(); i.src = u; return i.decode().catch(() => {}); };
  const video = $("#hero-video");
  const portrait = innerHeight > innerWidth * 1.05;
  const svcImgs = $$(".svc").map(s => s.dataset.img);
  async function preload() {
    const imgs = ["/media/sobre.webp", ...(fine ? svcImgs : [])];
    const W = { fonts: 8, video: 72, img: 4 };
    load.total = W.fonts + W.video + imgs.length * W.img;
    const fonts = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 2500))])
      .then(() => { load.done += W.fonts; paint(); });
    const src = portrait ? "/media/hero-m.mp4" : "/media/hero-d.mp4";
    const vid = fetchBytes(src, W.video)
      .then(b => { video.src = URL.createObjectURL(b); })
      .catch(() => { video.src = src; load.done += W.video; paint(); });
    const pics = Promise.all(imgs.map(u => decode(u).then(() => { load.done += W.img; paint(); })));
    await Promise.all([fonts, vid, pics]);
    load.done = load.total; paint();
    await new Promise(r => setTimeout(r, 300));
    start();
  }
  function start() {
    if (started) return; started = true;
    scrollTo(0, 0);
    root.classList.remove("is-loading"); document.body.classList.add("is-ready");
    video.play().catch(() => {});
    if (window.Lenis && !reduce) {
      const l = new Lenis({ lerp: .1, smoothWheel: true }); window.__lenis = l;
      const raf = t => { l.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
    }
    setTimeout(() => { armReveals(); armCounters(); }, 250);
    requestAnimationFrame(tick);
  }
  preload().catch(start);
  setTimeout(start, 15000);

  /* ---------- per-frame: hero recede, header state, statement words ---------- */
  const hero = $(".hero"), sheet = $(".sheet"), footer = $("#rodape"), header = $("#header"), wa = $("#wa");
  let lastY = 0, lastP = -1, heroPlaying = true, lit = -1;
  function tick() {
    const vh = innerHeight, y = scrollY;
    // hero shrinks and dims while the sheet rises over it; pause the video once it is covered
    const p = Math.min(1, Math.max(0, y / vh));
    if (Math.abs(p - lastP) > .001) { hero.style.setProperty("--p", p.toFixed(3)); lastP = p; }
    const covered = sheet.getBoundingClientRect().top <= 0 && footer.getBoundingClientRect().top > vh * -.5;
    if (covered && heroPlaying) { video.pause(); heroPlaying = false; }
    else if (!covered && !heroPlaying) { video.play().catch(() => {}); heroPlaying = true; }

    // header: transparent on the hero, paper over the sheet, ink over the footer
    const sTop = sheet.getBoundingClientRect().top, fTop = footer.getBoundingClientRect().top, hh = header.offsetHeight / 2;
    header.classList.toggle("solid", sTop <= hh);
    header.classList.toggle("dark", fTop <= hh);
    header.classList.toggle("hide", y > lastY + 4 && y > vh * 1.2 && !root.classList.contains("menu-open"));
    if (y < lastY - 4) header.classList.remove("hide");
    wa.classList.toggle("show", y > vh * .7 && fTop > vh * .6);
    lastY = y;

    // About statement lights up word by word as it crosses the viewport
    // (dimming starts with the first scroll; at the top of the page the statement is out of sight anyway)
    if (!reduce && (y > 0 || stmt.classList.contains("scrub"))) {
      stmt.classList.add("scrub");
      const r = stmt.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        const k = Math.min(1, Math.max(0, (vh * .86 - r.top) / (vh * .5 + r.height * .6)));
        const n = Math.round(k * stmtWords.length);
        if (n !== lit) { stmtWords.forEach((w, i) => w.classList.toggle("on", i < n)); lit = n; }
      }
    }
    requestAnimationFrame(tick);
  }

  /* ---------- active nav link ---------- */
  const links = new Map($$(".nav a").map(a => [a.getAttribute("href").slice(1), a]));
  const navIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach((a, id) => a.classList.toggle("is-active", id === e.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  links.forEach((_, id) => { const s = document.getElementById(id); if (s) navIO.observe(s); });

  /* ---------- anchors through Lenis; buttons with data-service preselect the form ---------- */
  $$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
    const id = a.getAttribute("href"); if (id.length < 2) return;
    const el = document.querySelector(id); if (!el) return;
    e.preventDefault();
    if (a.dataset.service) $("#f-service").value = a.dataset.service;
    const target = id === "#topo" ? 0 : el;
    window.__lenis ? window.__lenis.scrollTo(target, { duration: 1.5, offset: id === "#topo" ? 0 : -10 })
      : (id === "#topo" ? scrollTo({ top: 0, behavior: "smooth" }) : el.scrollIntoView({ behavior: "smooth" }));
  }));

  /* ---------- mobile menu ---------- */
  const menuBtn = $("#menu-btn"), menu = $("#menu");
  const setMenu = open => {
    root.classList.toggle("menu-open", open);
    menuBtn.setAttribute("aria-expanded", open); menuBtn.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    menu.setAttribute("aria-hidden", !open);
    if (window.__lenis) open ? window.__lenis.stop() : window.__lenis.start();
  };
  menuBtn.addEventListener("click", () => setMenu(!root.classList.contains("menu-open")));
  $$("a", menu).forEach(a => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

  /* ---------- numbers count up when they appear ---------- */
  const counters = $$("[data-count]");
  const countIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; countIO.unobserve(e.target);
    const el = e.target, to = +el.dataset.count, t0 = performance.now(), dur = 1400;
    if (reduce) return;
    const stepN = now => { const t = Math.min(1, (now - t0) / dur), k = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(to * k); if (t < 1) requestAnimationFrame(stepN); };
    requestAnimationFrame(stepN);
  }), { threshold: .6 });
  const armCounters = () => counters.forEach(c => { if (!reduce) c.textContent = "0"; countIO.observe(c); });

  /* ---------- service list: image preview that trails the cursor ---------- */
  const prev = $("#svc-preview");
  if (fine && !reduce) {
    const pics = new Map(svcImgs.map(u => { const i = new Image(); i.src = u; i.alt = ""; prev.appendChild(i); return [u, i]; }));
    let tx = 0, ty = 0, x = 0, yv = 0, on = false, raf = 0;
    const follow = () => {
      x += (tx - x) * .14; yv += (ty - yv) * .14;
      const w = prev.offsetWidth, h = prev.offsetHeight;
      prev.style.transform = `translate3d(${x - w / 2}px, ${yv - h / 2}px, 0) rotate(${Math.max(-6, Math.min(6, (tx - x) * .04))}deg)`;
      if (on || Math.abs(tx - x) > .5) raf = requestAnimationFrame(follow); else raf = 0;
    };
    $$(".svc").forEach(s => {
      s.addEventListener("pointerenter", e => {
        if (!on) { x = tx = e.clientX; yv = ty = e.clientY; }
        on = true; prev.classList.add("on");
        pics.forEach((img, u) => img.classList.toggle("on", u === s.dataset.img));
        if (!raf) raf = requestAnimationFrame(follow);
      });
      s.addEventListener("pointermove", e => { tx = e.clientX; ty = e.clientY; });
    });
    $(".svc-list").addEventListener("pointerleave", () => { on = false; prev.classList.remove("on"); pics.forEach(i => i.classList.remove("on")); });
    addEventListener("scroll", () => { if (on) { on = false; prev.classList.remove("on"); pics.forEach(i => i.classList.remove("on")); } }, { passive: true });
  }

  /* ---------- FAQ accordion ---------- */
  $$(".qa button").forEach(b => b.addEventListener("click", () => {
    const qa = b.closest(".qa"), open = !qa.classList.contains("open");
    $$(".qa.open").forEach(o => { if (o !== qa) { o.classList.remove("open"); $("button", o).setAttribute("aria-expanded", "false"); } });
    qa.classList.toggle("open", open); b.setAttribute("aria-expanded", open);
  }));

  /* ---------- projects: preview video on hover (mouse) or when mostly in view (touch) ---------- */
  const playV = v => { if (!v.src) v.src = v.dataset.src; v.classList.add("on"); v.play().catch(() => {}); };
  const stopV = v => { v.pause(); v.classList.remove("on"); };
  $$(".work").forEach(w => {
    const v = $("video", w);
    if (fine) { w.addEventListener("pointerenter", () => playV(v)); w.addEventListener("pointerleave", () => stopV(v)); }
  });
  if (!fine) {
    const vis = new IntersectionObserver(es => es.forEach(e => { const v = $("video", e.target); e.intersectionRatio > .6 ? playV(v) : stopV(v); }), { threshold: [0, .6] });
    $$(".work").forEach(w => vis.observe(w));
  }

  /* ---------- contact form → /api/send-email (Resend) ---------- */
  const form = $("#contact-form"), err = $(".err", form), btn = $("button[type=submit]", form);
  form.addEventListener("submit", async e => {
    e.preventDefault();
    err.hidden = true; btn.disabled = true; const label = btn.innerHTML; btn.textContent = "Enviando…";
    try {
      const r = await fetch(form.action, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Não foi possível enviar agora.");
      form.classList.add("is-sent"); form.reset();
    } catch (x) {
      err.textContent = `${x.message} Se preferir, escreva para contato@hnservices.com.br.`; err.hidden = false;
    } finally { btn.disabled = false; btn.innerHTML = label; }
  });
})();
