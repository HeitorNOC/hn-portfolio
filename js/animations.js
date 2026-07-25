/* ═══════════════════════════════════════════════════════════
   HN Services — GSAP Animations
   Philosophy: each animation has one job.
   Headings emerge from below (clip). Body fades up (opacity+y).
   Lines draw left-to-right. Everything fires in reading order.
   ═══════════════════════════════════════════════════════════ */
(function () {

  if (!window.gsap || !window.ScrollTrigger) {
    window.initAllAnimations = function () {};
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Shared eases ─────────────────────────────────────────
     expo.out  → snappy start, elegant slow stop (headings)
     power3.out → softer, organic (body, labels)
  ──────────────────────────────────────────────────────────── */

  /* ── Clip-reveal for a set of elements ────────────────────
     Works with any element whose parent has overflow:hidden.
     Uses yPercent so it's resolution-independent.
  ──────────────────────────────────────────────────────────── */
  function clipReveal(targets, opts) {
    if (reduced) { gsap.set(targets, { yPercent: 0, opacity: 1 }); return; }
    return gsap.from(targets, Object.assign({
      yPercent: 108,
      duration:  1.0,
      ease:     'expo.out',
      stagger:   0.08
    }, opts));
  }

  /* ── Fade-up for secondary content ────────────────────────  */
  function fadeUp(targets, opts) {
    if (reduced) { gsap.set(targets, { opacity: 1, y: 0 }); return; }
    return gsap.from(targets, Object.assign({
      opacity:  0,
      y:        22,
      duration: 0.75,
      ease:     'power3.out'
    }, opts));
  }

  /* ── Magnetic hover effect ─────────────────────────────────  */
  function initMagnetic() {
    document.querySelectorAll('.btn, .filter-btn, .contact__social-link').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r  = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width  / 2);
        var dy = e.clientY - (r.top  + r.height / 2);
        gsap.to(el, { x: dx * 0.32, y: dy * 0.32, duration: 0.35, ease: 'power2.out' });
      });
      el.addEventListener('mouseleave', function () {
        gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  /* ── Cursor trail (dot chain, fine-pointer only) ───────────  */
  function initCursorTrail() {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    var TRAIL = 5;
    var dots  = [];
    for (var i = 0; i < TRAIL; i++) {
      var d = document.createElement('div');
      var size = (1 - i / TRAIL) * 5 + 1;
      d.style.cssText = 'position:fixed;pointer-events:none;z-index:9998;border-radius:50%;' +
        'background:#C9F31D;transform:translate(-50%,-50%);width:' + size + 'px;height:' + size + 'px;' +
        'opacity:' + ((1 - i / TRAIL) * 0.55) + ';';
      document.body.appendChild(d);
      dots.push({ el: d, x: -100, y: -100 });
    }
    var cx = -100, cy = -100;
    window.addEventListener('mousemove', function (e) { cx = e.clientX; cy = e.clientY; }, { passive: true });
    gsap.ticker.add(function () {
      var px = cx, py = cy;
      dots.forEach(function (d) {
        d.x += (px - d.x) * (0.28 - dots.indexOf(d) * 0.012);
        d.y += (py - d.y) * (0.28 - dots.indexOf(d) * 0.012);
        gsap.set(d.el, { x: d.x, y: d.y });
        px = d.x; py = d.y;
      });
    });
  }

  /* ── Ticker / Marquee ──────────────────────────────────────  */
  window.initTicker = function () {
    var track = document.querySelector('.ticker__track');
    if (!track || reduced) return;
    var clone = track.cloneNode(true);
    track.parentNode.appendChild(clone);
    gsap.to([track, clone], {
      xPercent: -100, repeat: -1, duration: 24, ease: 'none',
      modifiers: { xPercent: gsap.utils.unitize(function (v) { return parseFloat(v) % 100; }) }
    });
  };

  /* ══════════════════════════════════════════════════════════
     HERO — entrance: called via triggerHeroReveal after globe
     forms (three-scene onComplete), with a 5 s safety fallback.
     text-particles.js runs first; its onDone fires this function
     so text cross-fades in as the particle canvas dissolves.
  ══════════════════════════════════════════════════════════ */
  window.initHeroAnimations = function () {
    function unlockScroll() {
      if (window.unlockPageScroll) {
        window.unlockPageScroll();
      } else {
        document.documentElement.classList.remove('hero-loading');
      }
    }

    if (reduced) {
      gsap.set(['.hero__eyebrow', '.hero__word', '.hero__sub',
                '.hero__scroll-hint', '.hero__ctas .btn', '.hero__badge'],
               { opacity: 1, y: 0, yPercent: 0, scale: 1 });
      unlockScroll();
      return;
    }

    /* Single timeline — complex Everswap-style entrance */
    var tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: unlockScroll
    });

    /* Eyebrow: slides in from left */
    tl.fromTo('.hero__eyebrow',
      { opacity: 0, x: -24 },
      { opacity: 1, x: 0, duration: 0.60 }, 0.1);

    /* Fill word "Tecnologia": clips up from below */
    tl.fromTo('.hero__word--fill',
      { opacity: 0, yPercent: 40 },
      { opacity: 1, yPercent: 0, duration: 0.90, ease: 'expo.out' }, 0.25);

    /* Stroke word "que Transforma": same but offset */
    tl.fromTo('.hero__word--stroke',
      { opacity: 0, yPercent: 40 },
      { opacity: 1, yPercent: 0, duration: 0.90, ease: 'expo.out' }, 0.40);

    /* Sub: fades up */
    tl.fromTo('.hero__sub',
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.65 }, 0.60);

    /* CTAs stagger with scale */
    tl.fromTo('.hero__ctas .btn',
      { opacity: 0, y: 14, scale: 0.96 },
      { opacity: 1, y: 0,  scale: 1, stagger: 0.10, duration: 0.55, ease: 'back.out(1.5)' }, 0.72);

    /* Scroll hint: drops in from above */
    tl.fromTo('.hero__scroll-hint',
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.50 }, 0.90);

    /* Badge: springs in */
    tl.fromTo('.hero__badge',
      { scale: 0.6, opacity: 0, rotation: -20 },
      { scale: 1, opacity: 1, rotation: 0, duration: 0.85, ease: 'back.out(2.8)' }, 0.55);

    /* Badge glow pulse after entrance */
    tl.to('.hero__badge', {
      filter: 'drop-shadow(0 0 16px rgba(201,243,29,0.5))',
      duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1
    }, 1.5);
  };

  /* ── Nav scroll behaviour + active section highlight ───────  */
  window.initNavAnimations = function () {
    var links = document.querySelectorAll('.nav__link');
    if (!links.length) return;

    var NAV_IDS_WITH_LINKS = Array.from(links).reduce(function (m, l) {
      var hash = l.getAttribute('href');
      if (hash && hash.startsWith('#')) m[hash.slice(1)] = l;
      return m;
    }, {});

    function setActive(id) {
      links.forEach(function (l) { l.classList.remove('is-active'); });
      if (NAV_IDS_WITH_LINKS[id]) {
        NAV_IDS_WITH_LINKS[id].classList.add('is-active');
      }
    }

    ScrollTrigger.create({
      start:       80,
      onEnter:     function () { document.getElementById('nav').classList.add('is-scrolled'); },
      onLeaveBack: function () {
        document.getElementById('nav').classList.remove('is-scrolled');
        setActive('hero');
      }
    });

    // Enterprise-grade section highlights based on robust individual ScrollTriggers
    var sectionIds = ['hero', 'sobre', 'processo', 'servicos', 'portfolio', 'contato'];

    sectionIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      ScrollTrigger.create({
        trigger: el,
        start:   'top 30%',
        end:     'bottom 30%',
        onEnter:     function () { setActive(id); },
        onEnterBack: function () { setActive(id); }
      });
    });

    // Determine initial state
    var initialMatched = 'hero';
    var sy = window.scrollY + window.innerHeight * 0.4;
    for (var i = 0; i < sectionIds.length; i++) {
      var sEl = document.getElementById(sectionIds[i]);
      if (sEl && sy >= sEl.offsetTop) {
        initialMatched = sectionIds[i];
      }
    }
    setActive(initialMatched);
  };

  /* ══════════════════════════════════════════════════════════
     SOBRE — reading order: label → heading → body → stats → card
  ══════════════════════════════════════════════════════════ */
  window.initAboutAnimations = function () {
    var section = document.querySelector('.about');
    if (!section) return;

    var st = { trigger: section, start: 'top 65%', once: true };

    /* 1. Label — fades up with glow */
    fadeUp('.about__label', { scrollTrigger: st, duration: 0.55 });

    /* 2. Heading: each line clips up */
    document.querySelectorAll('.about__heading .reveal-line > span').forEach(function (el, i) {
      gsap.from(el, {
        scrollTrigger: st,
        yPercent: 110,
        opacity: 0,
        duration: 1.1,
        delay: 0.08 + i * 0.12,
        ease: 'expo.out'
      });
    });

    /* 3. Body paragraphs: slide from left */
    document.querySelectorAll('.about__text').forEach(function (el, i) {
      gsap.from(el, {
        scrollTrigger: { trigger: section, start: 'top 60%', once: true },
        x: -30, opacity: 0,
        duration: 0.85, delay: 0.22 + i * 0.12, ease: 'power3.out'
      });
    });

    /* 4. "HN" decorative letters: slides from right */
    gsap.from('.about__bg-letters', {
      scrollTrigger: { trigger: '.about__right', start: 'top 72%', once: true },
      x: 80, opacity: 0,
      duration: 1.2, ease: 'power3.out'
    });

    /* 5. Manifesto card: rises + de-rotates */
    gsap.from('.about__card', {
      scrollTrigger: { trigger: '.about__card', start: 'top 82%', once: true },
      y: 50, rotation: -3, opacity: 0,
      duration: 1.1, ease: 'power3.out'
    });

    if (document.querySelector('.about__stats')) {
      /* 6. Stats: stagger scale-in with perspective */
      gsap.from('.stat', {
        scrollTrigger: { trigger: '.about__stats', start: 'top 80%', once: true },
        scale: 0.7, opacity: 0, y: 30,
        stagger: { amount: 0.4, from: 'start' },
        duration: 0.85, ease: 'back.out(2.2)'
      });

      /* 7. Stat counters: tick up with eased interpolation */
      document.querySelectorAll('.stat__number').forEach(function (el) {
        var target = parseInt(el.dataset.target, 10);
        var suffix = el.dataset.suffix || '';
        var obj    = { val: 0 };
        ScrollTrigger.create({
          trigger: el, start: 'top 82%', once: true,
          onEnter: function () {
            gsap.to(obj, {
              val: target, duration: 2.2, ease: 'expo.out',
              onUpdate: function () { el.textContent = Math.round(obj.val) + suffix; }
            });
          }
        });
      });
    }
  };

  /* ══════════════════════════════════════════════════════════
     PROCESSO — vertical steps scroll-reveal
  ══════════════════════════════════════════════════════════ */
  window.initProcessAnimations = function () {
    var steps = document.querySelectorAll('.process-step');
    if (!steps.length) return;

    /* Section header */
    fadeUp('.process-header__label, .process-header__tag', {
      scrollTrigger: { trigger: '.process-section', start: 'top 78%', once: true },
      stagger: 0.06, duration: 0.55
    });

    /* Each step: aside (canvas) slides in from edge, body reveals */
    steps.forEach(function (step, i) {
      var isEven  = i % 2 === 1;
      var aside   = step.querySelector('.process-step__aside');
      var num     = step.querySelector('.process-step__num');
      var title   = step.querySelector('.process-step__title');
      var text    = step.querySelector('.process-step__text');
      var tags    = step.querySelector('.process-step__tags');
      var trigger = { trigger: step, start: 'top 78%', once: true };

      if (aside) {
        gsap.from(aside, {
          scrollTrigger: trigger,
          x: isEven ? 40 : -40,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out'
        });
      }

      var tl = gsap.timeline({ scrollTrigger: trigger });
      if (num)   tl.from(num,   { opacity: 0, y: 10, duration: 0.4, ease: 'power3.out' }, 0.15);
      if (title) tl.from(title, { opacity: 0, y: 24, duration: 0.7, ease: 'expo.out' }, 0.25);
      if (text)  tl.from(text,  { opacity: 0, y: 18, duration: 0.6, ease: 'power3.out' }, 0.42);
      if (tags) {
        tl.from(tags.querySelectorAll('li'), {
          opacity: 0, y: 10, stagger: 0.07, duration: 0.4, ease: 'power3.out'
        }, 0.55);
      }
    });
  };


  /* ══════════════════════════════════════════════════════════
     MANIFESTO — scroll-driven line reveal (pinned on desktop)
  ══════════════════════════════════════════════════════════ */
  /* Fill each manifesto line to the exact container width based on the longest line */
  function fitManifestoLines() {
    var content = document.querySelector('.manifesto__content');
    var lines   = document.querySelectorAll('.manifesto__line');
    if (!content || !lines.length) return;

    // Mobile: clear inline font-sizes to let CSS media queries take full control
    if (window.innerWidth <= 768) {
      lines.forEach(function (line) {
        line.style.fontSize = '';
      });
      return;
    }

    var W = content.offsetWidth;
    if (!W) return;

    // 1. Temporarily set all lines to a baseline 100px font size
    lines.forEach(function (line) {
      line.style.fontSize = '100px';
    });

    // 2. Measure scrollWidth to find the longest line (which will determine our unified size)
    var longestLine = lines[0];
    var maxScrollWidth = lines[0].scrollWidth;
    lines.forEach(function (line) {
      var sw = line.scrollWidth;
      if (sw > maxScrollWidth) {
        maxScrollWidth = sw;
        longestLine = line;
      }
    });

    // 3. Binary search to fit only the longest line to container width W
    var lo = 12, hi = 240, mid;
    
    // Dynamic cap to prevent vertical overflow on short viewports (e.g., standard laptops)
    var maxVerticalFs = window.innerHeight * 0.12; 
    if (hi > maxVerticalFs) {
      hi = maxVerticalFs;
    }
    if (lo > hi) {
      lo = hi / 2;
    }

    for (var i = 0; i < 16; i++) {
      mid = (lo + hi) / 2;
      longestLine.style.fontSize = mid + 'px';
      if (longestLine.scrollWidth <= W) lo = mid; else hi = mid;
    }

    var finalFontSize = lo;

    // 4. Apply this unified font size to ALL lines
    lines.forEach(function (line) {
      line.style.fontSize = finalFontSize + 'px';
    });
  }

  window.initManifestoAnimations = function () {
    var section = document.querySelector('.manifesto-section');
    if (!section) return;

    /* Size each line to fill the full container width */
    fitManifestoLines();
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(fitManifestoLines, 180);
    });

    var lines = gsap.utils.toArray('.manifesto__line', section);
    var sub   = section.querySelector('.manifesto__sub');

    if (reduced) { return; }

    /* Pre-hide: lines below their overflow:hidden wrappers */
    gsap.set(lines, { yPercent: 112 });
    if (sub) gsap.set(sub, { opacity: 0, y: 28 });

    var mm = gsap.matchMedia();

    /* ── Desktop: section pins, lines reveal as user scrolls ── */
    mm.add('(min-width: 769px)', function () {
      var tl = gsap.timeline({
        scrollTrigger: {
          trigger:           section,
          start:             'top top',
          end:               '+=150%',
          pin:               true,
          scrub:             1.1,
          anticipatePin:     1,
          invalidateOnRefresh: true
        }
      });

      /* Each line clips up from below with a staggered start */
      lines.forEach(function (line, i) {
        tl.to(line,
          { yPercent: 0, duration: 0.24, ease: 'power2.out' },
          i * 0.21
        );
      });

      /* Sub paragraph fades in near the end of the scroll travel */
      if (sub) {
        tl.to(sub,
          { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out' },
          0.86
        );
      }
    });

    /* ── Mobile: simple scroll-triggered reveal, no pin ──────── */
    mm.add('(max-width: 768px)', function () {
      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          once: true
        }
      });
      tl.to(lines, {
        yPercent: 0,
        duration: 0.85,
        ease: 'expo.out',
        stagger: 0.12
      });
      if (sub) {
        tl.to(sub, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out'
        }, '-=0.4');
      }
    });
  };

  /* ══════════════════════════════════════════════════════════
     CTA BRIDGE — 3D rotateX word reveal + actions fade
     Each word row hinges in from -70deg (facing upward) to 0deg.
     Staggered so words land one after another with momentum.
  ══════════════════════════════════════════════════════════ */
  window.initCtaBridgeAnimation = function () {
    var section = document.getElementById('cta-bridge');
    if (!section) return;

    var title   = section.querySelector('.cta-bridge__title');
    var actions = section.querySelector('.cta-bridge__actions');
    if (!title) return;

    /* ── Split title into individual character spans ── */
    var fullText = title.textContent.trim();
    title.setAttribute('aria-label', fullText);
    title.textContent = '';

    var chars = [];
    fullText.split('').forEach(function (ch) {
      var span = document.createElement('span');
      span.className = 'cta-char';
      span.textContent = ch;
      title.appendChild(span);
      chars.push(span);
    });

    /* Blinking cursor appended after the last char */
    var cursor = document.createElement('span');
    cursor.className = 'cta-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.textContent = '_';
    title.appendChild(cursor);

    /* Initial state */
    gsap.set(chars, { opacity: 0 });
    if (actions) gsap.set(actions, { opacity: 0, y: 20 });

    if (reduced) {
      gsap.set(chars, { opacity: 1 });
      if (actions) gsap.set(actions, { opacity: 1, y: 0 });
      return;
    }

    /* ── Scroll-scrubbed typewriter timeline ── */
    var root = section.closest('.cta-root') || section;

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: root,
        start:   'top top',
        end:     'bottom bottom',
        scrub:   0.7
      }
    });

    /* Characters reveal one-by-one as user scrolls (0 → 80% of timeline) */
    tl.to(chars, {
      opacity:  1,
      duration: 0.001,
      ease:     'none',
      stagger:  { each: 0.8 / chars.length, from: 'start' }
    }, 0);

    /* Actions slide in after typing finishes (80–100% of timeline) */
    if (actions) {
      tl.to(actions, {
        opacity:  1,
        y:        0,
        duration: 0.15,
        ease:     'power2.out'
      }, 0.82);
    }
  };

  window.initContactAnimations = function () {
    var section = document.querySelector('.contact');
    if (!section) return;

    var st = { trigger: section, start: 'top 65%', once: true };

    /* 1. Label */
    fadeUp('.contact__label', { scrollTrigger: st, duration: 0.5 });

    /* 2. Heading: clip reveal per line */
    document.querySelectorAll('.contact__heading .reveal-line > span').forEach(function (el, i) {
      gsap.from(el, {
        scrollTrigger: st,
        yPercent: 110,
        opacity: 0,
        duration: 1.1,
        delay: 0.06 + i * 0.1,
        ease: 'expo.out'
      });
    });

    /* 3. Sub paragraph */
    gsap.from('.contact__sub', {
      scrollTrigger: st,
      x: -20, opacity: 0,
      duration: 0.75, delay: 0.35, ease: 'power3.out'
    });

    /* 4. Info items: stagger from left */
    gsap.from('.contact__info-list li', {
      scrollTrigger: { trigger: '.contact__info-list', start: 'top 76%', once: true },
      x: -24, opacity: 0, stagger: 0.08, duration: 0.65, ease: 'power3.out'
    });

    /* 5. Social links */
    fadeUp('.contact__socials', {
      scrollTrigger: { trigger: '.contact__socials', start: 'top 82%', once: true },
      duration: 0.55
    });

    /* 6. Form: entire form clips in from right */
    gsap.from('.contact-form', {
      scrollTrigger: { trigger: '.contact-form', start: 'top 75%', once: true },
      x: 40, opacity: 0,
      duration: 1.0, ease: 'power3.out', delay: 0.12
    });

    /* 7. Form fields stagger after the container arrives */
    gsap.from('.form-field', {
      scrollTrigger: { trigger: '.contact-form', start: 'top 72%', once: true },
      opacity: 0, y: 16, stagger: 0.07, duration: 0.5, ease: 'power3.out', delay: 0.4
    });

    /* 8. Submit button */
    gsap.from('.btn--submit', {
      scrollTrigger: { trigger: '.btn--submit', start: 'top 90%', once: true },
      opacity: 0, scale: 0.95, y: 10, duration: 0.6, ease: 'back.out(1.8)'
    });
  };

  /* ══════════════════════════════════════════════════════════
     FOOTER — simple fade
  ══════════════════════════════════════════════════════════ */
  function initFooterAnimations() {
    var footer = document.querySelector('.footer');
    if (!footer) return;
    fadeUp(footer, {
      scrollTrigger: { trigger: footer, start: 'top 92%', once: true },
      duration: 0.6
    });
  }

  /* ══════════════════════════════════════════════════════════
     SECTION TRACKER — Orano-style fixed right-side chapter nav
     Highlights the active section as you scroll.
  ══════════════════════════════════════════════════════════ */
  function initSectionTracker() {
    var items = document.querySelectorAll('.section-tracker__item');
    if (!items.length) return;

    var sectionIds = ['hero', 'sobre', 'processo', 'servicos', 'portfolio', 'contato'];

    function setActive(id) {
      items.forEach(function (item) {
        item.classList.toggle('is-active', item.dataset.section === id);
      });
    }

    sectionIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      ScrollTrigger.create({
        trigger: el,
        start:   'top 30%',
        end:     'bottom 30%',
        onEnter:     function () { setActive(id); },
        onEnterBack: function () { setActive(id); }
      });
    });

    /* Click: smooth scroll to section */
    items.forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.getElementById(item.dataset.section);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });

    /* Entrance: tracker slides in from right after load */
    gsap.from(items, {
      x: 24, opacity: 0, stagger: 0.06, duration: 0.7, ease: 'power3.out', delay: 2.2
    });
  }

  /* ── Scroll velocity skew ───────────────────────────────────
     Sections tilt subtly when the user scrolls fast, then
     spring back. Gives the page a physical, alive quality.
     Only fires on fine-pointer devices; skips reduced-motion.
  ──────────────────────────────────────────────────────────── */
  function initScrollSkew() {
    if (reduced) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    var skewSetter = gsap.quickSetter('[data-skew]', 'skewY', 'deg');
    var clamp      = gsap.utils.clamp(-2.2, 2.2);
    var current    = 0;

    ScrollTrigger.create({
      onUpdate: function (self) {
        var raw = self.getVelocity() / 380;
        if (Math.abs(raw) > Math.abs(current)) {
          current = clamp(raw);
          gsap.to({ val: current }, {
            val: 0,
            duration: 0.85,
            ease: 'power3.out',
            onUpdate: function () { skewSetter(this.targets()[0].val); }
          });
        }
      }
    });
  }

  /* ── initAllAnimations — called after loader completes ─────  */
  window.initAllAnimations = function (threeObjects) {

    /* ── Globe scroll animations ──────────────────────────── */
    try {
      if (threeObjects && threeObjects.setupScrollAnimations) {
        threeObjects.setupScrollAnimations();
      }
    } catch (e) { /* non-fatal */ }

    /* ── DOM Order-Based ScrollTrigger Initializations ── */
    
    // 1. Sobre (About)
    try { initAboutAnimations(); } catch (e) {}

    // 2. Processo (Process)
    try { if (window.initProcessCanvases) initProcessCanvases(); } catch (e) {}
    try { initProcessAnimations(); } catch (e) {}

    // 3. Manifesto (Manifesto)
    try { if (window.initManifestoAnimations) initManifestoAnimations(); } catch (e) {}

    // 4. Portfólio (Portfolio)
    try { if (window.initPortfolio) initPortfolio(); } catch (e) {}

    // 5. Serviços / Preços — agora DEPOIS do portfólio (init na ordem física do DOM, §2A)
    try { if (window.initPrecos) initPrecos(); } catch (e) {}

    // 6. CTA Bridge
    try { if (window.initCtaShader) window.initCtaShader(); } catch (e) {}
    try { if (window.initCtaBridgeAnimation) window.initCtaBridgeAnimation(); } catch (e) {}

    // 7. Contato (Contact)
    try { initContactAnimations(); } catch (e) {}

    // 8. Footer
    try { initFooterAnimations(); } catch (e) {}

    // 9. Interactive UI Elements
    try { initCursorTrail(); }       catch (e) {}
    try { initMagnetic(); }          catch (e) {}
    try { initTicker(); }            catch (e) {}
    /* initScrollSkew() removido a pedido: inclinava (skewY) as seções Sobre e
       Contato conforme a velocidade do scroll — "texto caindo para o lado".
       A função segue definida acima caso se queira reativar. */

    // 10. Nav and Section Tracker (Runs last after all layout is completely locked)
    try { initSectionTracker(); }    catch (e) {}
    try { initNavAnimations(); }     catch (e) {}

    /* ── Hero reveal ─────────────────────────────────────────
       triggerHeroReveal is called by three-scene.js when the
       globe particle formation completes (~3.8 s after load).
       If Three.js is unavailable the 5 s fallback fires instead.
    ──────────────────────────────────────────────────────────  */
    var heroRevealDone = false;

    window.triggerHeroReveal = function () {
      if (heroRevealDone) return;
      heroRevealDone = true;
      try {
        if (window.initTextParticles) {
          /* Particle canvas forms text shape, then calls onDone */
          window.initTextParticles(initHeroAnimations);
        } else {
          initHeroAnimations();
        }
      } catch (e) {
        initHeroAnimations(); /* ensure text always appears */
      }
    };

    /* Fallback: globe takes ~3.8 s; 5 s covers slow connections */
    setTimeout(function () {
      if (!heroRevealDone) window.triggerHeroReveal();
    }, 5000);

    /* No Three.js at all → skip the globe wait */
    if (!window.THREE || !threeObjects) {
      setTimeout(function () {
        if (!heroRevealDone) window.triggerHeroReveal();
      }, 300);
    }
  };

}());
