/* ═══════════════════════════════════════════════════════════
   HN Services — Serviços v3: Stacked Immersive Panels
   ─────────────────────────────────────────────────────────
   Architecture:
   • .svc3-root height is tall (N + 0.5 × 100vh) — provides scroll room
   • .svc3-stage is position: sticky top: 0 height: 100vh (CSS)
   • Panels are position: absolute overlapping each other
   • GSAP Timeline scrubs the vertical clip-path reveal per panel
   • Active panel triggers content entry: character-by-character title,
     SVG stroke drawing, expanding divider, and content fades
   • 3D mouse tracking tilt on SVG icon wraps
   • Color shifts interpolated smoothly across scroll segment
   ═══════════════════════════════════════════════════════════ */

window.initServicesV3 = function () {
  'use strict';

  var root       = document.querySelector('.svc3-root');
  var stage      = document.getElementById('svc3-stage');
  var panels     = gsap.utils.toArray('.svc3-panel');
  var curEl      = document.getElementById('svc3-cur');
  var progEl     = document.getElementById('svc3-prog');
  var bottomProg = document.getElementById('svc3-bottom-prog');
  var navItems   = document.querySelectorAll('.svc3-bottom-nav__item');

  if (!root || !stage || panels.length < 2) return;

  var isMobile = window.innerWidth <= 991;

  if (isMobile) {
    // On mobile, just activate all panels and ensure SVG strokes are drawn
    panels.forEach(function (p) {
      p.classList.add('is-active');
      var iconStrokes = p.querySelectorAll('.svc3-icon__stroke, .svc3-icon__fill');
      iconStrokes.forEach(function (stroke) {
        stroke.style.strokeDashoffset = 0;
      });
    });
    return;
  }

  if (!window.gsap || !window.ScrollTrigger) return;

  var N       = panels.length;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Set root height for scroll space
  root.style.height = (N + 0.5) * 100 + 'vh';

  // Panels background color interpolation target states (HN palette)
  var colors = [
    { r: 8, g: 8, b: 8 },      // #080808 (Web)
    { r: 6, g: 12, b: 8 },     // #060c08 (TI)
    { r: 6, g: 8, b: 8 },      // #060808 (Sistemas)
    { r: 8, g: 6, b: 8 },      // #080608 (UI/UX)
    { r: 7, g: 7, b: 8 }       // #070708 (Suporte)
  ];

  /* ── 1. Split Titles into Characters and Setup Solid Backgrounds ── */
  panels.forEach(function (panel) {
    var bg = panel.getAttribute('data-bg');
    if (bg) panel.style.backgroundColor = bg;

    var titles = panel.querySelectorAll('.svc3-title__line');
    titles.forEach(function (line) {
      var text = line.getAttribute('data-text') || line.textContent.trim();
      line.innerHTML = '';
      var chars = text.split('');
      chars.forEach(function (char) {
        var span = document.createElement('span');
        span.className = 'char-span';
        span.innerHTML = char === ' ' ? '&nbsp;' : char;
        line.appendChild(span);
      });
    });
  });

  /* ── 2. Setup Initial States ── */
  panels.forEach(function (p, idx) {
    if (reduced) return;

    // Set initial clip paths and scale explicitly to avoid conflicting fromTo tweens
    if (idx === 0) {
      gsap.set(p, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1 });
    } else {
      gsap.set(p, { clipPath: 'inset(0% 0% 100% 0%)', scale: 1 });
    }

    // Inside panel elements hidden
    gsap.set(p.querySelectorAll('.char-span'), { yPercent: 110, rotateX: -40, opacity: 0 });
    if (p.querySelector('.svc3-divider span')) {
      gsap.set(p.querySelector('.svc3-divider span'), { scaleX: 0 });
    }
    gsap.set([
      p.querySelector('.svc3-desc'),
      p.querySelector('.svc3-cta'),
      p.querySelector('.svc3-cat')
    ].filter(Boolean), { opacity: 0, y: 22 });

    // Correctly hide ALL li elements and highlights span elements initially
    gsap.set(p.querySelectorAll('.svc3-highlights span'), { opacity: 0, y: 16 });
    gsap.set(p.querySelectorAll('.svc3-tags li'), { opacity: 0, y: 16 });

    var bgNum = p.querySelector('.svc3-bg-num');
    if (bgNum) gsap.set(bgNum, { y: 60, opacity: 0, scale: 0.8 });

    // Prepare SVG icons for draw animation
    var iconStrokes = p.querySelectorAll('.svc3-icon__stroke, .svc3-icon__fill');
    iconStrokes.forEach(function (stroke) {
      var length = stroke.getTotalLength ? stroke.getTotalLength() : 800;
      stroke.style.strokeDasharray = length;
      stroke.style.strokeDashoffset = length;
    });

    var dots = p.querySelectorAll('.svc3-icon__dot');
    if (dots.length) gsap.set(dots, { scale: 0, transformOrigin: 'center' });
  });

  /* ── 3. Color Interpolation Helpers ── */
  function lerpColor(c1, c2, t) {
    var r = Math.round(c1.r + (c2.r - c1.r) * t);
    var g = Math.round(c1.g + (c2.g - c1.g) * t);
    var b = Math.round(c1.b + (c2.b - c1.b) * t);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function updateBgColor(progress) {
    var segment = progress * (N - 1);
    var idx = Math.floor(segment);
    var fract = segment - idx;
    if (idx >= N - 1) {
      root.style.backgroundColor = 'rgb(' + colors[N-1].r + ',' + colors[N-1].g + ',' + colors[N-1].b + ')';
    } else {
      var rgb = lerpColor(colors[idx], colors[idx+1], fract);
      root.style.backgroundColor = rgb;
    }
  }

  /* ── 4. Content Reveal Animation (Active panel) ── */
  function enterPanel(panel) {
    panel.classList.add('is-active');
    if (reduced) return;

    var chars = panel.querySelectorAll('.char-span');
    var divider = panel.querySelector('.svc3-divider span');
    var desc = panel.querySelector('.svc3-desc');
    var highlights = panel.querySelectorAll('.svc3-highlights span');
    var tags = panel.querySelectorAll('.svc3-tags li');
    var cta = panel.querySelector('.svc3-cta');
    var cat = panel.querySelector('.svc3-cat');
    var bgNum = panel.querySelector('.svc3-bg-num');
    var iconStrokes = panel.querySelectorAll('.svc3-icon__stroke, .svc3-icon__fill');
    var dots = panel.querySelectorAll('.svc3-icon__dot');

    // Kill any running timeline on this panel to avoid concurrency conflicts
    if (panel.currentTimeline) {
      panel.currentTimeline.kill();
    }

    // Overwrite any running exit animations synchronously and cleanly
    var tl = gsap.timeline({ defaults: { ease: 'power3.out', overwrite: 'auto' } });
    panel.currentTimeline = tl;

    if (cat) tl.to(cat, { opacity: 1, y: 0, duration: 0.4 }, 0);

    if (chars.length) {
      tl.to(chars, {
        yPercent: 0,
        rotateX: 0,
        opacity: 1,
        stagger: 0.015,
        duration: 0.8,
        ease: 'back.out(1.6)'
      }, 0.05);
    }

    if (divider) tl.to(divider, { scaleX: 1, duration: 0.7 }, 0.2);
    if (desc) tl.to(desc, { opacity: 1, y: 0, duration: 0.6 }, 0.35);

    if (highlights.length) {
      tl.to(highlights, {
        opacity: 1,
        y: 0,
        stagger: 0.04,
        duration: 0.5
      }, 0.38);
    }

    if (tags.length) {
      tl.to(tags, {
        opacity: 1,
        y: 0,
        stagger: 0.03,
        duration: 0.45
      }, 0.42);
    }

    if (cta) tl.to(cta, { opacity: 1, y: 0, duration: 0.5 }, 0.5);
    if (bgNum) tl.to(bgNum, { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'expo.out' }, 0.05);

    // SVG icon draw
    if (iconStrokes.length) {
      tl.to(iconStrokes, {
        strokeDashoffset: 0,
        duration: 1.3,
        stagger: 0.07,
        ease: 'power2.out'
      }, 0.1);
    }

    if (dots.length) {
      tl.to(dots, {
        scale: 1,
        duration: 0.5,
        stagger: 0.05,
        ease: 'back.out(1.8)'
      }, 0.55);
    }
  }

  /* ── 5. Content Hide Animation (Exit panel) ── */
  function exitPanel(panel, goingForward) {
    panel.classList.remove('is-active');
    if (reduced) return;

    var chars = panel.querySelectorAll('.char-span');
    var divider = panel.querySelector('.svc3-divider span');
    var desc = panel.querySelector('.svc3-desc');
    var highlights = panel.querySelectorAll('.svc3-highlights span');
    var tags = panel.querySelectorAll('.svc3-tags li');
    var cta = panel.querySelector('.svc3-cta');
    var cat = panel.querySelector('.svc3-cat');
    var bgNum = panel.querySelector('.svc3-bg-num');
    var iconStrokes = panel.querySelectorAll('.svc3-icon__stroke, .svc3-icon__fill');
    var dots = panel.querySelectorAll('.svc3-icon__dot');

    var exitY = goingForward ? -20 : 20;
    var exitCharY = goingForward ? -110 : 110;

    // Kill any running timeline on this panel to avoid concurrency conflicts
    if (panel.currentTimeline) {
      panel.currentTimeline.kill();
    }

    // Overwrite any running enter animations and animate exit synchronously and cleanly
    var tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
    panel.currentTimeline = tl;

    tl.to([desc, cta, cat].filter(Boolean), {
      opacity: 0,
      y: exitY,
      duration: 0.3,
      ease: 'power2.in'
    }, 0);

    if (highlights.length) {
      tl.to(highlights, {
        opacity: 0,
        y: exitY,
        duration: 0.25,
        ease: 'power2.in'
      }, 0);
    }

    if (tags.length) {
      tl.to(tags, {
        opacity: 0,
        y: exitY,
        duration: 0.25,
        ease: 'power2.in'
      }, 0);
    }

    if (divider) tl.to(divider, { scaleX: 0, duration: 0.3, ease: 'power2.in' }, 0);

    if (chars.length) {
      tl.to(chars, {
        yPercent: exitCharY,
        opacity: 0,
        duration: 0.35,
        stagger: 0.005,
        ease: 'power2.in'
      }, 0);
    }

    if (bgNum) {
      tl.to(bgNum, {
        opacity: 0,
        scale: 0.8,
        y: exitY * 1.5,
        duration: 0.35,
        ease: 'power2.in'
      }, 0);
    }

    iconStrokes.forEach(function (stroke) {
      var length = stroke.getTotalLength ? stroke.getTotalLength() : 800;
      tl.to(stroke, {
        strokeDashoffset: length,
        duration: 0.35,
        ease: 'power2.in'
      }, 0);
    });

    if (dots.length) tl.to(dots, { scale: 0, duration: 0.3, ease: 'power2.in' }, 0);
  }

  /* ── 6. Counter Machine Flip ── */
  function updateCounter(idx) {
    if (!curEl) return;
    var next = String(idx + 1).padStart(2, '0');
    if (reduced) { curEl.textContent = next; return; }

    gsap.to(curEl, {
      yPercent: -120,
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: function () {
        curEl.textContent = next;
        gsap.fromTo(curEl,
          { yPercent: 120, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.24, ease: 'power2.out' }
        );
      }
    });
  }

  /* ── 7. Bottom Navigation Link Active Sync ── */
  function updateBottomNav(idx) {
    navItems.forEach(function (btn, i) {
      btn.classList.toggle('is-active', i === idx);
    });
  }

  /* ── 8. Timeline setup for Scrubbed Clip-Path Reveals ── */
  var curIdx = -1;

  var tl = gsap.timeline({
    scrollTrigger: {
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.0,
      invalidateOnRefresh: true,
      onUpdate: function (self) {
        // Use the timeline's eased progress to eliminate any scrub lag mismatch!
        var progress = tl.progress();

        // Progress lines (raw scroll progress for UI rails)
        if (progEl) progEl.style.height = (self.progress * 100) + '%';
        if (bottomProg) bottomProg.style.width = (self.progress * 100) + '%';

        // Background color shifts (eased for smooth organic transition)
        updateBgColor(progress);

        // Get actual eased timeline playhead time t
        var t = progress * tl.duration();
        var snapIdx = Math.min(N - 1, Math.max(0, Math.round(t)));

        if (snapIdx !== curIdx) {
          var goingForward = snapIdx > curIdx;
          if (curIdx >= 0 && panels[curIdx]) exitPanel(panels[curIdx], goingForward);
          curIdx = snapIdx;
          if (panels[curIdx]) enterPanel(panels[curIdx]);
          updateCounter(curIdx);
          updateBottomNav(curIdx);
        }
      }
    }
  });

  // Both panels clip top-to-bottom, synchronized:
  // • New panel: bottom-inset shrinks 100%→0% (title reveals first, at top)
  // • Old panel: top-inset grows 0%→100% (title disappears first, at top)
  // At any scroll position t, new panel covers 0–t% of viewport from top
  // and old panel shows t–100% from top — zero overlap guaranteed.
  // We offset the transition start to (i - 1) + 0.35 and duration to 0.3.
  // This leaves 35% of the segment flat at the start and 35% flat at the end,
  // providing 70% massive stable readable regions where the panels are 100% visible
  // and preventing overlay clipping during reading states.
  for (var i = 1; i < N; i++) {
    var startT = (i - 1) + 0.35;
    var dur    = 0.3;
    
    tl.to(panels[i],
      { clipPath: 'inset(0% 0% 0% 0%)', duration: dur, ease: 'power2.inOut' },
      startT
    );
    tl.to(panels[i - 1],
      { clipPath: 'inset(100% 0% 0% 0%)', scale: 0.96, duration: dur, ease: 'power2.inOut' },
      startT
    );
  }

  // Extend timeline duration symmetrically so the last panel has a stable reading region at the end
  tl.set({}, {}, N - 1);

  /* ── 9. Bottom Nav Click Interactions ── */
  navItems.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetIdx = parseInt(btn.getAttribute('data-target'), 10);
      if (isNaN(targetIdx)) return;

      var startScroll = root.offsetTop;
      var totalScroll = root.offsetHeight - window.innerHeight;
      var targetScroll = startScroll + (targetIdx / (N - 1)) * totalScroll;

      gsap.to(window, {
        scrollTo: targetScroll,
        duration: 1.3,
        ease: 'power3.inOut'
      });
    });
  });

  /* ── 10. Bootstrap Entrance for First Panel ── */
  setTimeout(function () {
    if (curIdx === -1) {
      curIdx = 0;
      enterPanel(panels[0]);
      updateCounter(0);
      updateBottomNav(0);
      if (progEl) progEl.style.height = '0%';
      if (bottomProg) bottomProg.style.width = '0%';
    }
  }, 600);

  /* ── 11. 3D Parallax Mouse Tilt (Desktop only) ── */
  if (!reduced && window.matchMedia('(pointer: fine)').matches) {
    panels.forEach(function (panel) {
      var iconWrap = panel.querySelector('.svc3-icon-wrap');
      if (!iconWrap) return;

      panel.addEventListener('mousemove', function (e) {
        if (!panel.classList.contains('is-active')) return;
        var r = panel.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);

        gsap.to(iconWrap, {
          rotateX: -dy * 16,
          rotateY: dx * 16,
          transformPerspective: 1000,
          z: 32,
          duration: 0.4,
          ease: 'power2.out'
        });
      });

      panel.addEventListener('mouseleave', function () {
        gsap.to(iconWrap, {
          rotateX: 0,
          rotateY: 0,
          z: 0,
          duration: 0.8,
          ease: 'elastic.out(1, 0.4)'
        });
      });
    });
  }
};
