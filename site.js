/* HN Services — page behaviour after the film. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* anchors through Lenis; price buttons preselect the service */
  $$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
    const id = a.getAttribute("href"); if (id.length < 2) return;
    const el = document.querySelector(id); if (!el) return;
    e.preventDefault();
    if (a.dataset.service) $("#f-service").value = a.dataset.service;
    window.__lenis ? window.__lenis.scrollTo(el, { offset: -70, duration: 1.6 }) : el.scrollIntoView({ behavior: "smooth" });
  }));

  /* active nav link */
  const links = new Map($$(".nav a").map(a => [a.getAttribute("href").slice(1), a]));
  const nav = new IntersectionObserver(es => es.forEach(e => links.get(e.target.id)?.classList.toggle("is-active", e.isIntersecting)),
    { rootMargin: "-45% 0px -50% 0px" });
  links.forEach((_, id) => { const s = document.getElementById(id); if (s) nav.observe(s); });

  /* entrance animations: only elements still below the fold wait for their reveal */
  if (!reduce) {
    const rv = $$("[data-rv]").filter(el => el.getBoundingClientRect().top > innerHeight);
    rv.forEach(el => el.classList.add("rv-wait"));
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.remove("rv-wait"); e.target.classList.add("rv-in"); io.unobserve(e.target);
    }), { rootMargin: "0px 0px -12% 0px" });
    rv.forEach(el => io.observe(el));
  }

  /* ambient loops play only while visible */
  $$("video[data-ambient]").forEach(v => new IntersectionObserver(([e]) => e.isIntersecting ? v.play().catch(() => {}) : v.pause()).observe(v));

  /* projects: optional horizontal track (drag, buttons, counter); the most visible card plays its preview */
  const track = $("#track"), cards = $$(".proj", track), count = $("#proj-count");
  const step = dir => {
    const w = cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 24);
    track.scrollBy({ left: dir * w, behavior: reduce ? "auto" : "smooth" });
  };
  $("#proj-prev").addEventListener("click", () => step(-1));
  $("#proj-next").addEventListener("click", () => step(1));
  const vis = new IntersectionObserver(es => es.forEach(e => {
    const v = $("video", e.target);
    if (e.intersectionRatio > .6) {
      if (!v.src) v.src = v.dataset.src;
      v.play().catch(() => {});
      count.textContent = String(cards.indexOf(e.target) + 1).padStart(2, "0");
    } else v.pause();
  }), { root: track, threshold: [0, .6, 1] });
  cards.forEach(c => vis.observe(c));
  let down = null;
  track.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") return; down = { x: e.clientX, l: track.scrollLeft, moved: false }; track.classList.add("dragging"); });
  addEventListener("pointermove", e => { if (!down) return; const dx = e.clientX - down.x; if (Math.abs(dx) > 4) down.moved = true; track.scrollLeft = down.l - dx; });
  addEventListener("pointerup", () => { if (!down) return; track.classList.remove("dragging"); setTimeout(() => down = null, 0); });
  track.addEventListener("click", e => { if (down?.moved) e.preventDefault(); }, true);

  /* contact form → /api/send-email (Resend) */
  const form = $("#contact-form");
  const err = $(".err", form), btn = $("button[type=submit]", form);
  form.addEventListener("submit", async e => {
    e.preventDefault();
    err.hidden = true; btn.disabled = true; btn.textContent = "Enviando…";
    try {
      const r = await fetch(form.action, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Não foi possível enviar agora.");
      form.classList.add("is-sent"); form.reset();
    } catch (x) {
      err.textContent = `${x.message} Se preferir, escreva para contato@hnservices.com.br.`; err.hidden = false;
    } finally { btn.disabled = false; btn.textContent = "Enviar mensagem"; }
  });
})();
