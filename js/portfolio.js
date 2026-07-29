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
   initPortfolio roda ANTES de initPrecos no boot (ordem física, §2A).
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

  var hasGSAP    = !!(window.gsap && window.ScrollTrigger);
  var reduced    = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var horizontal = window.innerWidth > 900 && hasGSAP && !reduced && !!track;

  initLightbox();

  var PLAYBACK = 0.6;

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
      v.playbackRate = PLAYBACK;              // reaplicar após load()
      try { v.currentTime = 0; } catch (e) { /* sem metadata ainda */ }
      var p = v.play();
      if (p && p.catch) p.catch(function () { /* autoplay barrado → pôster */ });
    };
    if (v.readyState >= 2) go();
    else v.addEventListener('loadeddata', go, { once: true });
  }

  function pauseAll() { videos.forEach(function (v) { if (!v.paused) v.pause(); }); }

  /* ── MOBILE / sem GSAP: empilhado + IntersectionObserver ─── */
  if (!horizontal) {
    var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var idx = videos.indexOf(e.target);
        if (e.isIntersecting) { loadVideo(idx); playVideo(e.target); }
        else e.target.pause();
      });
    }, { threshold: 0.4 }) : null;

    videos.forEach(function (v, i) {
      if (io) io.observe(v);
      else { loadVideo(i); playVideo(v); }
    });
    return;
  }

  /* ── DESKTOP: scroll horizontal ─────────────────────────── */
  var active = -1;

  function setActive(i) {
    if (i === active || i < 0 || i >= N) return;
    if (videos[active]) videos[active].pause();
    active = i;
    loadVideo(i);
    loadVideo(i + 1);
    playVideo(videos[i]);
    if (countEl) countEl.textContent = String(i + 1).padStart(2, '0');
  }

  function distance() { return Math.max(1, track.scrollWidth - window.innerWidth); }

  gsap.to(track, {
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
        setActive(Math.round(self.progress * (N - 1)));
      }
    }
  });

  setActive(0);

  /* Aba em segundo plano → nada decodifica (o rAF congela na aba oculta). */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') pauseAll();
    else if (videos[active]) playVideo(videos[active]);
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
