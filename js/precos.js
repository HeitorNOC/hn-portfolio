/* ═══════════════════════════════════════════════════════════
   HN Services — Serviços / Preços
   ─────────────────────────────────────────────────────────
   Seção de preços (dev de sites e sistemas), agora depois do
   portfólio. Só um reveal em stagger dos cards — o conteúdo já
   nasce visível, então uma falha de trigger nunca esconde os preços.
   ═══════════════════════════════════════════════════════════ */

window.initPrecos = function () {
  'use strict';

  var root = document.querySelector('.pr-root');
  if (!root) return;
  var cards = Array.prototype.slice.call(root.querySelectorAll('.pr-card'));
  if (!cards.length) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || !window.ScrollTrigger || reduced) return;

  ScrollTrigger.create({
    trigger: root,
    start: 'top 78%',
    once: true,
    onEnter: function () {
      gsap.from(cards, {
        opacity: 0, y: 40, duration: 0.7, ease: 'power3.out', stagger: 0.1
      });
    }
  });
};
