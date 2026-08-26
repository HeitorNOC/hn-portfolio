/* ═══════════════════════════════════════════════════════════
   HN Services — Portfólio HORIZONTAL
   ─────────────────────────────────────────────────────────
   O scroll vertical dirige a translação horizontal do track
   (GSAP pin + scrub). Cada painel é um projeto autocontido:
   info + moldura de browser com o vídeo do site.

   Só o painel ATIVO toca vídeo (o resto fica no pôster) — nunca
   12 vídeos decodificando de uma vez. Mobile (<=900px) ou sem
   GSAP: os painéis empilham e cada vídeo toca ao entrar na tela.

   Pin cria pin-spacer (empurra as seções seguintes) — por isso
   initPortfolio roda na ordem física do DOM no boot (depois de
   Serviços e Sistemas, antes do CTA Bridge — §2A em animations.js).
   ═══════════════════════════════════════════════════════════ */

window.initPortfolio = function () {
  'use strict';

  var root = document.querySelector('.pf-root');
  if (!root) return;

  var pin    = root.querySelector('.pf-pin');
  var track  = document.getElementById('pf-track');
  var fill   = document.getElementById('pf-progress-fill');
  var countEl = document.getElementById('pf-count');
  var panels = Array.prototype.slice.call(root.querySelectorAll('.pf-panel'));
  var videos = Array.prototype.slice.call(root.querySelectorAll('.pf-video'));
  var N = panels.length;

  /* ── "Exibir mais": mostra INITIAL painéis; o botão revela +STEP ── */
  var moreWrap    = document.getElementById('pf-more');
  var moreBtn     = document.getElementById('pf-more-btn');
  var moreCountEl = document.getElementById('pf-more-count');
  var totalEl     = document.getElementById('pf-total');
  var INITIAL = moreWrap ? (parseInt(moreWrap.getAttribute('data-initial'), 10) || 3) : N;
  var STEP    = moreWrap ? (parseInt(moreWrap.getAttribute('data-step'), 10) || 5) : 5;
  var visibleCount = Math.min(INITIAL, N);

  var hasGSAP    = !!(window.gsap && window.ScrollTrigger);
  var reduced    = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var horizontal = window.innerWidth > 900 && hasGSAP && !reduced && !!track;

  function pad(n) { return String(n).padStart(2, '0'); }
  function visiblePanels() { return panels.filter(function (p) { return !p.classList.contains('is-hidden'); }); }
  function updateTotal() { if (totalEl) totalEl.textContent = '/' + pad(visibleCount); }

  var afterReveal = function () {};   // definido por modo (desktop/mobile)
  function revealMore() {
    if (visibleCount >= N) return null;
    var before = visibleCount;
    visibleCount = Math.min(visibleCount + STEP, N);
    for (var i = before; i < visibleCount; i++) panels[i].classList.remove('is-hidden');
    updateTotal();
    if (visibleCount >= N) { if (moreWrap) moreWrap.classList.add('is-hidden'); }
    else if (moreCountEl) { moreCountEl.textContent = 'próximos ' + Math.min(STEP, N - visibleCount); }
    return before;
  }
  if (moreBtn) moreBtn.addEventListener('click', function () {
    var before = revealMore();
    if (before != null) afterReveal(before);
  });
  updateTotal();

  var PLAYBACK = 0.6;
  var active = -1;                            // painel ativo (desktop). Mobile fica em -1.

  function loadVideo(i) {
    var v = videos[i];
    if (!v || v.__loaded) return;
    var src = v.getAttribute('data-src');
    if (!src) return;
    v.__loaded = true;
    v.src = src;
    v.load();
  }

  function playVideo(v) {
    if (!v) return;
    v.loop = true;
    var go = function () {
      // Guard: no desktop, se o vídeo já saiu de cena enquanto carregava,
      // NÃO toca (senão vários vídeos ficam tocando ao mesmo tempo).
      if (horizontal && videos[active] !== v) return;
      v.playbackRate = PLAYBACK;              // reaplicar após load()
      try { v.currentTime = 0; } catch (e) { /* sem metadata ainda */ }
      var p = v.play();
      if (p && p.catch) p.catch(function () { /* autoplay barrado → pôster */ });
    };
    if (v.readyState >= 2) go();
    else v.addEventListener('loadeddata', go, { once: true });
  }

  function pauseAll() { videos.forEach(function (v) { if (!v.paused) v.pause(); }); }

  /* ── MOBILE / sem GSAP: carrossel horizontal NATIVO ───────
     O swipe é 100% CSS (track com overflow-x + scroll-snap). Aqui só
     tocamos o vídeo do painel visível e sincronizamos o contador. */
  if (!horizontal) {
    var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var idx = videos.indexOf(e.target);
        if (e.isIntersecting) {
          loadVideo(idx);
          playVideo(e.target);
          var pos = visiblePanels().indexOf(e.target.closest('.pf-panel'));
          if (countEl && pos >= 0) countEl.textContent = pad(pos + 1);
        } else {
          e.target.pause();
        }
      });
    }, { threshold: 0.55 }) : null;   // >0.5 → só 1 painel "vence" por vez no snap

    videos.forEach(function (v, i) {
      if (io) io.observe(v);
      else { loadVideo(i); playVideo(v); }
    });

    // ao revelar, traz o 1º painel novo à vista (swipe nativo)
    afterReveal = function (before) {
      var np = panels[before];
      if (np) np.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    };
    return;
  }

  /* ── DESKTOP: scroll horizontal ─────────────────────────── */
  function setActive(i) {
    if (i === active || i < 0 || i >= N) return;
    active = i;
    // pausa TODOS menos o ativo (defesa contra corridas de load rápido)
    videos.forEach(function (v, k) { if (k !== i && !v.paused) v.pause(); });
    loadVideo(i);
    loadVideo(i + 1);
    playVideo(videos[i]);
  }

  /* Ativo = painel visível mais próximo do centro da viewport (robusto com
     painéis ocultos e com o botão "exibir mais" no fim do track). */
  function updateActive() {
    var vis = visiblePanels();
    if (!vis.length) return;
    var vpc = window.innerWidth / 2, best = vis[0], bestPos = 0, bestD = Infinity;
    for (var k = 0; k < vis.length; k++) {
      var r = vis[k].getBoundingClientRect();
      var d = Math.abs(r.left + r.width / 2 - vpc);
      if (d < bestD) { bestD = d; best = vis[k]; bestPos = k; }
    }
    setActive(panels.indexOf(best));
    if (countEl) countEl.textContent = pad(bestPos + 1);
  }

  function distance() { return Math.max(1, track.scrollWidth - window.innerWidth); }

  var tween = gsap.to(track, {
    x: function () { return -distance(); },
    ease: 'none',
    scrollTrigger: {
      trigger: root,
      start: 'top top',
      end: function () { return '+=' + distance(); },
      pin: pin,
      scrub: 0.6,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: function (self) {
        if (fill) fill.style.transform = 'scaleX(' + self.progress + ')';
        updateActive();
      }
    }
  });
  var st = tween.scrollTrigger;

  // ao revelar mais: recomputa o pin e centra o 1º painel novo
  afterReveal = function (before) {
    ScrollTrigger.refresh();
    if (st) st.scroll(st.start + before * window.innerWidth);
  };

  setActive(0);

  /* Aba em segundo plano → nada decodifica (o rAF congela na aba oculta). */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') pauseAll();
    else if (videos[active]) playVideo(videos[active]);
  });
};
