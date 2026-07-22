/* ═══════════════════════════════════════════════════════════
   HN Services — Portfólio v6
   ─────────────────────────────────────────────────────────
     Ato 1 — .pf-constel: 11 pôsteres numa serpentina, emoldurada
       pela tipografia (Portfólio / Onze cases). 11 cards = 11
           projetos: nada de inflar a fita com frames repetidos.
   Ato 2 — a fita se esvai EM ORDEM ao longo da curva (não aleatório).
   Ato 3 — .pf-solo: um projeto por vez; o vídeo gravado do site é
           scrubbado pelo scroll (~50vh por projeto).

   Performance (a v5 ficou pesada — lições aplicadas):
   • FlowWave (WebGL) roda só nos atos 1–2; desligado no solo.
   • Sem backdrop-filter / mix-blend-mode.
   • Só o vídeo ativo (e o próximo) recebem src.
   • Seek no gsap.ticker, 1x por frame.

   Palco preso por CSS sticky (não pin:true) → sem pin-spacer,
   sem deslocar os offsets das seções seguintes (§2A do guia).
   ═══════════════════════════════════════════════════════════ */

window.initPortfolio = function () {
  'use strict';

  var root   = document.querySelector('.pf-root');
  var constel = document.getElementById('pf-constel');
  var ribbon = document.getElementById('pf-ribbon');
  var solo   = document.getElementById('pf-solo');
  var intro  = document.getElementById('pf-intro-space');
  var fill   = document.getElementById('pf-progress-fill');
  if (!root) return;

  var chips  = Array.prototype.slice.call(document.querySelectorAll('.pf-chip'));
  var videos = Array.prototype.slice.call(document.querySelectorAll('.pf-solo__video'));
  var steps  = Array.prototype.slice.call(document.querySelectorAll('.pf-step'));

  var hasGSAP  = !!(window.gsap && window.ScrollTrigger);
  var reduced  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.innerWidth <= 767;

  /* Pôster por projeto → usado pelo CSS no mobile (.pf-step::before) */
  steps.forEach(function (s, i) {
    if (videos[i]) s.style.setProperty('--poster', 'url(' + videos[i].getAttribute('poster') + ')');
  });

  initLightbox();

  if (isMobile || !hasGSAP || reduced) return;

  /* ── Vídeos sob demanda ─────────────────────────────────── */
  function loadVideo(i) {
    var v = videos[i];
    if (!v || v.__loaded) return;
    var src = v.getAttribute('data-src');
    if (!src) return;
    v.__loaded = true;
    v.src = src;
    v.load();
  }

  /* ── Loop lento (era scroll-scrub) ────────────────────────
     O scrub amarrava a animação ao ritmo do scroll: para ver a hero acontecer
     era preciso rolar "na velocidade certa", e isso custava ~90vh POR projeto.
     Em loop, a animação roda no tempo em que foi feita — e a seção encolhe.
     PLAYBACK abaixo de 1 deixa tudo mais lento e legível.                    */
  var PLAYBACK = 0.6;
  var active = -1;

  var urlEl = document.getElementById('pf-solo-url');

  function play(v) {
    if (!v) return;
    v.loop = true;
    var go = function () {
      if (videos[active] !== v) return;      // já saiu de cena enquanto carregava
      v.playbackRate = PLAYBACK;             // precisa ser reaplicado após load()
      try { v.currentTime = 0; } catch (e) { /* sem metadata ainda */ }
      var pr = v.play();
      if (pr && pr.catch) pr.catch(function () { /* autoplay barrado: fica no poster */ });
    };
    if (v.readyState >= 2) go();
    else v.addEventListener('loadeddata', go, { once: true });
  }

  function setActive(i) {
    if (active === i) return;
    // o anterior sai de cena e PARA — só o projeto visível consome decodificação
    if (videos[active]) {
      videos[active].classList.remove('is-active');
      videos[active].pause();
    }
    active = i;
    if (videos[active]) {
      videos[active].classList.add('is-active');
      loadVideo(active);
      loadVideo(active + 1);
      play(videos[active]);
    }
    // a barra da moldura mostra o domínio real do projeto em cena
    if (urlEl && steps[i]) {
      var btn = steps[i].querySelector('.pf-open');
      var link = btn && btn.getAttribute('data-live');
      if (link) {
        try { urlEl.textContent = new URL(link).host.replace(/^www\./, ''); }
        catch (e) { urlEl.textContent = link; }
      }
    }
  }

  /* ── Ato 2: a fita se esvai EM ORDEM ─────────────────────
     Cada card sobe e sai seguindo a própria inclinação; o stagger
     segue o índice (topo → base), então a fita "escoa" como um fio. */
  gsap.timeline({
    scrollTrigger: {
      trigger: intro,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.7
    }
  })
    .to(chips, {
      yPercent: -260,
      xPercent: function (i) { return (i % 2 ? 1 : -1) * (8 + i * 2); },
      rotate: function (i) { return (i % 2 ? 1 : -1) * (6 + i); },
      opacity: 0,
      ease: 'power2.in',
      stagger: { each: 0.055, from: 'start' }      // ordem: topo → base
    }, 0.18)
    .to([constel.querySelector('.pf-constel__word--top'),
         constel.querySelector('.pf-constel__word--bot'),
         constel.querySelector('.pf-constel__hint')], {
      opacity: 0, y: -30, ease: 'power2.in', duration: 0.5
    }, 0.1)
    .to(solo, { opacity: 1, ease: 'none', duration: 0.35 }, 0.72);

  /* ── Ato 3: um projeto por vez ───────────────────────────
     Uma ÚNICA janela por projeto, ancorada no CENTRO do step: de
     'center 80%' a 'center 20%' — o centro percorre 60vh, exatamente a
     altura do step. Assim as janelas ficam adjacentes: nunca dois cards
     na tela (o bug da v6.0) e sem intervalo morto entre projetos.
     Sem o scrub, a janela não precisa mais ser larga para dar tempo ao
     vídeo — ele roda em loop no próprio ritmo.                        */
  steps.forEach(function (step, i) {
    var card = step.querySelector('.pf-card');

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: step,
        start: 'center 80%',
        end: 'center 20%',
        scrub: 0.5,
        onToggle: function (self) { if (self.isActive) setActive(i); }
      }
    });

    if (card) {
      tl.fromTo(card, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' })
        .to(card, { duration: 0.6 })                                   // leitura
        .to(card, { opacity: 0, y: -35, duration: 0.2, ease: 'power2.in' });
    }
  });

  if (fill) {
    gsap.to(fill, {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.3 }
    });
  }

  /* Fora da seção (ou com a aba em segundo plano) nada deve decodificar. */
  function pauseAll() { videos.forEach(function (v) { if (!v.paused) v.pause(); }); }
  ScrollTrigger.create({
    trigger: root,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: function (self) {
      if (self.isActive) { if (videos[active]) play(videos[active]); }
      else pauseAll();
    }
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') pauseAll();
    else if (videos[active]) play(videos[active]);
  });

  /* ═══════════════ Lightbox: o site AO VIVO ═══════════════ */
  function initLightbox() {
    var lb = document.getElementById('pf-lightbox');
    if (!lb) return;

    var EXIT_MS = 320;
    var exitTimer = null;
    var isOpen = false;
    var lastFocus = null;

    function host(u) { try { return new URL(u).host.replace(/^www\./, ''); } catch (e) { return u; } }

    function render(name, url) {
      lb.innerHTML =
        '<div class="pf-lb__panel">' +
          '<header class="pf-lb__bar">' +
            '<div class="pf-lb__left">' +
              '<span class="pf-lb__dot"></span>' +
              '<span class="pf-lb__name"></span>' +
              '<span class="pf-lb__url"></span>' +
            '</div>' +
            '<div class="pf-lb__right">' +
              '<div class="pf-lb__seg" role="group" aria-label="Visualização">' +
                '<button type="button" data-device="desktop" class="is-active">Desktop</button>' +
                '<button type="button" data-device="mobile">Mobile</button>' +
              '</div>' +
              '<a class="pf-lb__open" target="_blank" rel="noopener">Nova aba ↗</a>' +
              '<button type="button" class="pf-lb__close" aria-label="Fechar">×</button>' +
            '</div>' +
          '</header>' +
          '<div class="pf-lb__stage">' +
            '<div class="pf-lb__loading">Carregando…</div>' +
            '<div class="pf-lb__wrap">' +
              '<iframe class="pf-lb__frame" allow="autoplay; fullscreen; xr-spatial-tracking"></iframe>' +
            '</div>' +
          '</div>' +
        '</div>';

      lb.querySelector('.pf-lb__name').textContent = name;
      lb.querySelector('.pf-lb__url').textContent = host(url);
      lb.querySelector('.pf-lb__open').href = url;

      var frame = lb.querySelector('.pf-lb__frame');
      var loading = lb.querySelector('.pf-lb__loading');
      frame.addEventListener('load', function () { loading.style.display = 'none'; });
      frame.src = url;

      lb.querySelector('.pf-lb__close').addEventListener('click', close);
      Array.prototype.forEach.call(lb.querySelectorAll('.pf-lb__seg button'), function (b) {
        b.addEventListener('click', function () {
          Array.prototype.forEach.call(lb.querySelectorAll('.pf-lb__seg button'), function (x) {
            x.classList.remove('is-active');
          });
          b.classList.add('is-active');
          lb.classList.toggle('is-mobile', b.getAttribute('data-device') === 'mobile');
        });
      });
    }

    function open(name, url, trigger) {
      if (isOpen) return;
      isOpen = true;
      lastFocus = trigger || null;
      clearTimeout(exitTimer);

      render(name, url);
      lb.classList.add('is-mounted');
      lb.classList.remove('is-mobile');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      setTimeout(function () { lb.classList.add('is-in'); }, 30);
      setTimeout(function () {
        var c = lb.querySelector('.pf-lb__close');
        if (c) c.focus();
      }, 80);
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      lb.classList.remove('is-in');
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';

      exitTimer = setTimeout(function () {
        lb.classList.remove('is-mounted', 'is-mobile');
        lb.innerHTML = '';
        if (lastFocus && lastFocus.focus) lastFocus.focus();
        lastFocus = null;
      }, EXIT_MS);
    }

    lb.addEventListener('mousedown', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen) close(); });

    Array.prototype.forEach.call(document.querySelectorAll('.pf-open'), function (btn) {
      btn.addEventListener('click', function () {
        open(btn.getAttribute('data-name'), btn.getAttribute('data-live'), btn);
      });
    });

    window.__pfCloseLightbox = close;
  }
};
