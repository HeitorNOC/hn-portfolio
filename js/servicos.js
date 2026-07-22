/* ═══════════════════════════════════════════════════════════
   HN Services — Serviços: jogo de objetos
   ─────────────────────────────────────────────────────────
   Referência: grids.obys.agency (blocos geométricos sólidos de
   proporções variadas, alguns em diagonal, sobre grade fina).

   Cada serviço tem uma COMPOSIÇÃO própria de 6 blocos. Trocar de
   serviço recoreografa todos: eles viajam, giram e mudam de
   proporção até o novo arranjo, em stagger.

   Só transform é animado (x/y/scale/rotate) — zero layout por frame.
   ═══════════════════════════════════════════════════════════ */

window.initServicos = function () {
  'use strict';

  var section = document.getElementById('servicos');
  var stage   = document.getElementById('obj-stage');
  var wrap    = document.getElementById('obj-blocks');
  var idx     = document.getElementById('obj-idx');
  var tagsEl  = document.getElementById('obj-tags');
  var nameEl  = document.getElementById('obj-name');
  var numEl   = document.getElementById('obj-num');
  if (!section || !stage || !wrap || !idx) return;

  var items  = Array.prototype.slice.call(idx.querySelectorAll('.obj-idx__item'));
  var blocks = Array.prototype.slice.call(wrap.querySelectorAll('.obj-block'));
  if (!items.length || !blocks.length) return;

  var hasGSAP = !!window.gsap;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Composições: {x, y, w, h, r} em fração do palco ──────
     Cada uma tem um "caráter": pilha, cascata diagonal, grade
     modular, molduras sobrepostas, barras horizontais.        */
  var COMPS = [
    /* 01 Criação de Sites — pilha de blocos tipo layout de página */
    [ {x:.05,y:.10,w:.42,h:.28,r:0}, {x:.53,y:.06,w:.20,h:.20,r:0},
      {x:.05,y:.44,w:.20,h:.44,r:0}, {x:.30,y:.48,w:.42,h:.16,r:0},
      {x:.78,y:.30,w:.17,h:.55,r:0}, {x:.55,y:.70,w:.18,h:.18,r:-12} ],

    /* 02 Consultoria de TI — cascata diagonal (diagnóstico → roadmap) */
    [ {x:.03,y:.06,w:.17,h:.17,r:8},  {x:.23,y:.21,w:.22,h:.22,r:-6},
      {x:.47,y:.36,w:.22,h:.22,r:10}, {x:.71,y:.53,w:.24,h:.24,r:-8},
      {x:.10,y:.62,w:.28,h:.13,r:0},  {x:.60,y:.07,w:.13,h:.28,r:0} ],

    /* 03 Sistemas Web — grade modular (módulos de sistema) */
    [ {x:.04,y:.08,w:.27,h:.34,r:0},  {x:.36,y:.08,w:.27,h:.34,r:0},
      {x:.68,y:.08,w:.28,h:.34,r:0},  {x:.04,y:.50,w:.27,h:.36,r:0},
      {x:.36,y:.50,w:.60,h:.36,r:0},  {x:.47,y:.28,w:.10,h:.10,r:45} ],

    /* 04 UI/UX Design — molduras sobrepostas (camadas de interface) */
    [ {x:.08,y:.12,w:.42,h:.48,r:-4}, {x:.28,y:.30,w:.42,h:.48,r:3},
      {x:.52,y:.10,w:.28,h:.28,r:0},  {x:.66,y:.56,w:.26,h:.28,r:-8},
      {x:.04,y:.72,w:.19,h:.15,r:0},  {x:.85,y:.16,w:.10,h:.10,r:20} ],

    /* 05 Manutenção & Suporte — barras horizontais (monitoramento) */
    [ {x:.04,y:.10,w:.92,h:.09,r:0},  {x:.04,y:.25,w:.58,h:.09,r:0},
      {x:.04,y:.40,w:.75,h:.09,r:0},  {x:.04,y:.55,w:.38,h:.09,r:0},
      {x:.04,y:.70,w:.86,h:.09,r:0},  {x:.70,y:.55,w:.13,h:.24,r:0} ],
  ];

  var current = 0;
  var SW = 0, SH = 0;

  function measure() { SW = stage.clientWidth; SH = stage.clientHeight; }

  /* Os blocos vivem na faixa de cima; a de baixo é do nome do serviço
     (assim nada colide com a tipografia). */
  var BAND = 0.66;

  /* Converte a fração da composição em transform do bloco base 100×100. */
  function frame(c) {
    var y = c.y * BAND, h = c.h * BAND;
    return {
      x: (c.x + c.w / 2) * SW - 50,
      y: (y + h / 2) * SH - 50,
      scaleX: Math.max(0.01, c.w * SW / 100),
      scaleY: Math.max(0.01, h * SH / 100),
      rotation: c.r
    };
  }

  function place(i, instant) {
    var comp = COMPS[i % COMPS.length];
    blocks.forEach(function (b, k) {
      var f = frame(comp[k % comp.length]);
      if (!hasGSAP || reduced || instant) {
        b.style.transform = 'translate(' + f.x + 'px,' + f.y + 'px) rotate(' + f.rotation + 'deg) scale(' + f.scaleX + ',' + f.scaleY + ')';
        return;
      }
      gsap.to(b, {
        x: f.x, y: f.y, scaleX: f.scaleX, scaleY: f.scaleY, rotation: f.rotation,
        duration: 0.9,
        ease: 'power3.inOut',
        delay: k * 0.05,                 // stagger: os objetos não chegam juntos
        overwrite: 'auto'
      });
    });
  }

  function setService(i, instant) {
    current = i;
    items.forEach(function (b, k) { b.classList.toggle('is-active', k === i); });
    if (numEl) numEl.textContent = '0' + (i + 1);

    /* nome: sai por cima, entra por baixo (máscara no CSS) */
    var label = items[i].querySelector('.obj-idx__name').textContent;
    if (nameEl) {
      var sp = nameEl.querySelector('span');
      if (!hasGSAP || reduced || instant) { sp.textContent = label; }
      else {
        gsap.to(sp, {
          yPercent: -100, duration: 0.3, ease: 'power2.in',
          onComplete: function () {
            sp.textContent = label;
            gsap.fromTo(sp, { yPercent: 100 }, { yPercent: 0, duration: 0.5, ease: 'power3.out' });
          }
        });
      }
    }

    /* tags */
    if (tagsEl) {
      var raw = items[i].getAttribute('data-tags') || '';
      tagsEl.classList.add('is-swapping');
      setTimeout(function () {
        tagsEl.innerHTML = raw.split('|').map(function (t) { return '<li>' + t + '</li>'; }).join('');
        void tagsEl.offsetWidth;
        tagsEl.classList.remove('is-swapping');
      }, 180);
    }

    place(i, instant);
  }

  /* ── Auto-avanço (pausa ao interagir) ───────────────────── */
  var AUTO = 4200, autoT = 0, idleT = 0, paused = false, visible = false;
  function schedule() {
    clearTimeout(autoT);
    if (paused || !visible || reduced) return;
    autoT = setTimeout(function () { setService((current + 1) % items.length); schedule(); }, AUTO);
  }
  function poke() {
    paused = true; clearTimeout(autoT); clearTimeout(idleT);
    idleT = setTimeout(function () { paused = false; schedule(); }, 9000);
  }

  items.forEach(function (b, i) {
    b.addEventListener('mouseenter', function () { if (i !== current) setService(i); poke(); });
    b.addEventListener('click',      function () { setService(i); poke(); });
    b.addEventListener('focus',      function () { if (i !== current) setService(i); poke(); });
  });

  window.addEventListener('resize', function () { measure(); place(current, true); }, { passive: true });

  /* Só coreografa enquanto a seção está em cena. */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        visible = e.isIntersecting;
        if (visible) schedule(); else clearTimeout(autoT);
      });
    }, { threshold: 0.2 }).observe(section);
  } else { visible = true; schedule(); }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') clearTimeout(autoT);
  });

  /* Estado inicial */
  measure();
  setService(0, true);

  /* Entrada: os blocos "montam" a primeira composição ao aparecer */
  if (hasGSAP && window.ScrollTrigger && !reduced) {
    ScrollTrigger.create({
      trigger: stage,
      start: 'top 80%',
      once: true,
      onEnter: function () {
        gsap.from(blocks, {
          scaleX: 0, scaleY: 0, opacity: 0,
          duration: 0.8, ease: 'power3.out', stagger: 0.06
        });
      }
    });
  }
};
