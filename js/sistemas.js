/* ═══════════════════════════════════════════════════════════
   HN Services — Sistemas Disponíveis
   ─────────────────────────────────────────────────────────
   Carrossel simples (sem dependências) para as telas do HN
   Finances + reveal em stagger dos cards, mesmo padrão do
   initPrecos: conteúdo já nasce visível, uma falha de trigger
   nunca esconde nada.
   ═══════════════════════════════════════════════════════════ */

window.initSistemas = function () {
  'use strict';

  var root = document.querySelector('.sis-root');
  if (!root) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Reveal dos cards ─────────────────────────────────── */
  var cards = Array.prototype.slice.call(root.querySelectorAll('.sis-card'));
  if (cards.length && window.gsap && window.ScrollTrigger && !reduced) {
    ScrollTrigger.create({
      trigger: root,
      start: 'top 78%',
      once: true,
      onEnter: function () {
        gsap.from(cards, { opacity: 0, y: 40, duration: 0.7, ease: 'power3.out', stagger: 0.12 });
      }
    });
  }

  /* ── Carrossel de telas do HN Finances ──────────────────── */
  var carousel = document.getElementById('sis-carousel');
  if (!carousel) return;

  var track   = carousel.querySelector('.sis-carousel__track');
  var slides  = Array.prototype.slice.call(carousel.querySelectorAll('.sis-carousel__slide'));
  var dotsWrap = carousel.querySelector('.sis-carousel__dots');
  var prevBtn = carousel.querySelector('.sis-carousel__nav--prev');
  var nextBtn = carousel.querySelector('.sis-carousel__nav--next');
  if (!track || !slides.length) return;

  var index = 0;
  var timer = null;
  var AUTOPLAY_MS = 4500;

  var dots = slides.map(function (_, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'sis-carousel__dot';
    b.setAttribute('aria-label', 'Ir para o slide ' + (i + 1));
    b.addEventListener('click', function () { goTo(i); restart(); });
    if (dotsWrap) dotsWrap.appendChild(b);
    return b;
  });

  function render() {
    track.style.transform = 'translateX(-' + (index * 100) + '%)';
    dots.forEach(function (d, i) { d.classList.toggle('is-active', i === index); });
  }

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    render();
  }

  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function start() {
    if (reduced || slides.length < 2) return;
    stop();
    timer = setInterval(next, AUTOPLAY_MS);
  }
  function restart() { stop(); start(); }

  if (nextBtn) nextBtn.addEventListener('click', function () { next(); restart(); });
  if (prevBtn) prevBtn.addEventListener('click', function () { prev(); restart(); });
  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', start);
  carousel.addEventListener('focusin', stop);
  carousel.addEventListener('focusout', start);

  render();
  start();
};
