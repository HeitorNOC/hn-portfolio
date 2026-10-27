/* HN Services — page behaviour.
   Real preloader (fonts, hero video, key images), stacked-panel transitions, header that follows
   the tone under it, word-by-word headings, image reveals, project reel and the contact form. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  root.classList.add("is-loading");
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  /* ---------- split headings into words (keeps <em>) ---------- */
  let wi = 0;
  const splitNode = (node, into) => {
    node.textContent.split(/(\s+)/).forEach(part => {
      if (!part) return;
      if (/^\s+$/.test(part)) { into.appendChild(document.createTextNode(" ")); return; }
      const w = document.createElement("span"); w.className = "w";
      const s = document.createElement("span"); s.textContent = part; s.style.setProperty("--i", wi++);
      w.appendChild(s); into.appendChild(w);
    });
  };
  $$("[data-split]").forEach(h => {
    wi = 0;
    const frag = document.createDocumentFragment();
    [...h.childNodes].forEach(n => {
      if (n.nodeType === 3) splitNode(n, frag);
      else { const c = n.cloneNode(false); splitNode(n, c); frag.appendChild(c); }
    });
    h.setAttribute("aria-label", h.textContent.trim());
    h.textContent = ""; h.appendChild(frag);
    [...h.children].forEach(c => c.setAttribute("aria-hidden", "true"));
  });

  /* ---------- reveals: elements wait hidden only once JS runs; observer releases them ---------- */
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
  }), { rootMargin: "0px 0px -10% 0px" });
  const armReveals = () => waiting.forEach(([el]) => io.observe(el));

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
  async function preload() {
    const imgs = ["/media/sobre.webp", "/media/svc-sites.webp", "/media/svc-sistemas.webp", "/media/svc-infra.webp", "/media/svc-consultoria.webp"];
    const W = { fonts: 8, video: 70, img: 4.4 };                       // relative weights, total 100
    load.total = W.fonts + W.video + imgs.length * W.img;
    const fonts = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 2500))])
      .then(() => { load.done += W.fonts; paint(); });
    const vid = fetchBytes(portrait ? "/media/hero-m.mp4" : "/media/hero-d.mp4", W.video)
      .then(b => { video.src = URL.createObjectURL(b); })
      .catch(() => { video.src = portrait ? "/media/hero-m.mp4" : "/media/hero-d.mp4"; load.done += W.video; paint(); });
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
    layout(); requestAnimationFrame(tick);
  }
  preload().catch(start);
  setTimeout(start, 15000);

  /* ---------- stacked panels ---------- */
  const panels = $$(".panel");
  const links = new Map($$(".nav a").map(a => [a.getAttribute("href").slice(1), a]));   // active link = panel on top
  let activePanel = null;
  const header = $("#header");
  function layout() {
    // a panel sticks when its bottom reaches the viewport bottom, so the next one slides over it
    panels.forEach((p, i) => { p.style.top = Math.min(0, innerHeight - p.offsetHeight) + "px"; p.style.zIndex = i + 1; });
  }
  addEventListener("resize", layout);
  new ResizeObserver(layout).observe(document.body);
  let lastY = 0;
  function tick() {
    const vh = innerHeight;
    for (let i = 0; i < panels.length - 1; i++) {
      const top = panels[i + 1].getBoundingClientRect().top;
      const c = Math.min(1, Math.max(0, (vh - top) / vh));
      panels[i].style.setProperty("--cover", c.toFixed(3));
      panels[i + 1].style.borderTopLeftRadius = panels[i + 1].style.borderTopRightRadius = `${(28 * Math.min(1, top / (vh * .35))).toFixed(1)}px`;
    }
    // header: solid after the hero starts moving, dark text over cream panels, hides on fast scroll down
    const y = scrollY;
    header.classList.toggle("scrolled", y > 40);
    const under = panels.find(p => { const r = p.getBoundingClientRect(); return r.top <= 40 && r.bottom > 40; }) || panels[0];
    let topmost = under;
    panels.forEach(p => { const r = p.getBoundingClientRect(); if (r.top <= 40 && r.bottom > 40 && +p.style.zIndex > +topmost.style.zIndex) topmost = p; });
    header.classList.toggle("on-light", topmost.classList.contains("tone-light"));
    if (topmost !== activePanel) {
      activePanel = topmost;
      links.forEach((a, id) => a.classList.toggle("is-active", id === topmost.id));
    }
    header.classList.toggle("hide", y > lastY + 4 && y > innerHeight * 1.2);
    if (y < lastY - 4) header.classList.remove("hide");
    lastY = y;
    requestAnimationFrame(tick);
  }

  // where a panel starts in the document flow (sticky offsets make offsetTop unreliable)
  const flowTop = el => {
    const i = panels.indexOf(el.closest(".panel")); if (i <= 0) return 0;
    const overlap = -parseFloat(getComputedStyle(panels[1]).marginTop) || 0;
    return panels.slice(0, i).reduce((a, p) => a + p.offsetHeight, 0) - overlap * i;
  };

  /* ---------- anchors through Lenis; price buttons preselect the service ---------- */
  $$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
    const id = a.getAttribute("href"); if (id.length < 2) return;
    const el = document.querySelector(id); if (!el) return;
    e.preventDefault();
    if (a.dataset.service) $("#f-service").value = a.dataset.service;
    const y = flowTop(el);
    window.__lenis ? window.__lenis.scrollTo(y, { duration: 1.6 }) : scrollTo({ top: y, behavior: "smooth" });
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

  /* ---------- FAQ accordion ---------- */
  $$(".qa button").forEach(b => b.addEventListener("click", () => {
    const qa = b.closest(".qa"), open = !qa.classList.contains("open");
    $$(".qa.open").forEach(o => { if (o !== qa) { o.classList.remove("open"); $("button", o).setAttribute("aria-expanded", "false"); } });
    qa.classList.toggle("open", open); b.setAttribute("aria-expanded", open);
  }));

  /* ---------- WhatsApp button appears after the hero ---------- */
  const wa = $("#wa");
  new IntersectionObserver(([e]) => wa.classList.toggle("show", !e.isIntersecting && started), { threshold: 0 }).observe($(".hero-top"));

  /* ---------- magnetic primary buttons (pointer devices) ---------- */
  if (matchMedia("(hover: hover)").matches && !reduce) $$("[data-magnet]").forEach(b => {
    b.addEventListener("pointermove", e => { const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px, ${(e.clientY - r.top - r.height / 2) * .28}px)`; });
    b.addEventListener("pointerleave", () => { b.style.transform = ""; });
  });

  /* ---------- project reel ---------- */
  const track = $("#track"), cards = $$(".proj", track), count = $("#proj-count");
  const step = dir => track.scrollBy({ left: dir * (cards[0].getBoundingClientRect().width + 20), behavior: reduce ? "auto" : "smooth" });
  $("#proj-prev").addEventListener("click", () => step(-1));
  $("#proj-next").addEventListener("click", () => step(1));
  const vis = new IntersectionObserver(es => es.forEach(e => {
    const v = $("video", e.target);
    if (e.intersectionRatio > .6) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); count.textContent = String(cards.indexOf(e.target) + 1).padStart(2, "0"); }
    else v.pause();
  }), { root: track, threshold: [0, .6, 1] });
  cards.forEach(c => vis.observe(c));
  let down = null;
  track.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") return; down = { x: e.clientX, l: track.scrollLeft, moved: false }; track.classList.add("dragging"); });
  addEventListener("pointermove", e => { if (!down) return; const dx = e.clientX - down.x; if (Math.abs(dx) > 4) down.moved = true; track.scrollLeft = down.l - dx; });
  addEventListener("pointerup", () => { if (!down) return; track.classList.remove("dragging"); setTimeout(() => down = null, 0); });
  track.addEventListener("click", e => { if (down?.moved) e.preventDefault(); }, true);

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
