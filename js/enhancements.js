/* ═══════════════════════════════════════════════════════════
   HN Services — Enhancements
   • Trust Bar animated counters
   • Slam-in reveal for [data-slam] elements
   • Reveal-scene progress bar sync
   ═══════════════════════════════════════════════════════════ */
(function () {

  /* ── Trust Bar Counters ──────────────────────────────── */
  function initTrustCounters() {
    var nums = document.querySelectorAll('.trust-item__num[data-target]');
    if (!nums.length) return;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    nums.forEach(function (el) {
      var target = parseFloat(el.dataset.target);
      var decimals = parseInt(el.dataset.decimals || '0', 10);
      var suffix = el.dataset.suffix || '';
      var prefix = el.dataset.prefix || '';

      if (reduced) {
        el.textContent = prefix + target.toFixed(decimals) + suffix;
        return;
      }

      var animated = false;
      function fire() {
        if (animated) return;
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.92 && r.bottom > 0) {
          animated = true;
          var obj = { v: 0 };
          if (window.gsap) {
            gsap.to(obj, {
              v: target, duration: 2.2, ease: 'expo.out',
              onUpdate: function () {
                el.textContent = prefix + obj.v.toFixed(decimals) + suffix;
              }
            });
          } else {
            var start = performance.now();
            (function tick(now) {
              var p = Math.min(1, (now - start) / 2200);
              var e = 1 - Math.pow(1 - p, 3);
              el.textContent = prefix + (e * target).toFixed(decimals) + suffix;
              if (p < 1) requestAnimationFrame(tick);
            })(start);
          }
        }
      }
      window.addEventListener('scroll', fire, { passive: true });
      fire();
    });
  }

  /* ── Slam-in CINEMATIC effect ──────────────────────────
     On hit, inject a .slam-burst child with 3 shockwave rings
     + 8 radially-directed particles + a horizontal impact bar.
     Also mirrors the text into a data-text attr so the CSS
     chromatic aberration layer can use it via ::after content. */
  function injectBurst(el) {
    if (el.querySelector('.slam-burst')) return;
    var burst = document.createElement('span');
    burst.className = 'slam-burst';
    burst.setAttribute('aria-hidden', 'true');

    // 3 shockwave rings
    for (var i = 1; i <= 3; i++) {
      var r = document.createElement('span');
      r.className = 'slam-ring slam-ring--' + i;
      burst.appendChild(r);
    }

    // 8 radial particles at 45° increments (± jitter)
    for (var k = 0; k < 8; k++) {
      var p = document.createElement('span');
      p.className = 'slam-particle';
      var baseAngle = (k / 8) * Math.PI * 2;
      var jitter = (Math.random() - 0.5) * 0.4;
      var angle = baseAngle + jitter;
      var dist = 60 + Math.random() * 40;
      p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      p.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
      p.style.animationDelay = (0.4 + Math.random() * 0.08) + 's';
      burst.appendChild(p);
    }

    // Horizontal impact bar
    var bar = document.createElement('span');
    bar.className = 'slam-bar';
    burst.appendChild(bar);

    el.appendChild(burst);

    // Camera shake on parent container
    var parent = el.parentElement;
    if (parent && !parent.classList.contains('slam-shake-parent')) {
      parent.classList.add('slam-shake-parent');
      parent.style.animation = 'slam-shake 0.42s cubic-bezier(0.36, 0.07, 0.19, 0.97) 0.35s';
      setTimeout(function () {
        parent.style.animation = '';
        parent.classList.remove('slam-shake-parent');
      }, 900);
    }

    // Cleanup burst after animations complete (~2.5s)
    setTimeout(function () { if (burst && burst.parentNode) burst.parentNode.removeChild(burst); }, 2600);
  }

  function initSlam() {
    var els = document.querySelectorAll('[data-slam]');
    if (!els.length) return;

    // Copy text content into data-text for chromatic aberration layer
    els.forEach(function (el) {
      el.classList.add('slam-in');
      if (!el.hasAttribute('data-text')) {
        el.setAttribute('data-text', el.textContent.trim());
      }
    });

    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-hit'); injectBurst(el); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          el.classList.add('is-hit');
          // Delay burst injection to match text impact frame (~350ms)
          setTimeout(function () { injectBurst(el); }, 340);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.35, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ── Reveal-scene progress fill ─────────────────────── */
  function initRevealProgress() {
    var root = document.querySelector('.reveal-root');
    var fill = document.querySelector('.reveal-progress__fill');
    var stops = document.querySelectorAll('.reveal-progress__stops span');
    if (!root || !fill) return;

    function update() {
      var r = root.getBoundingClientRect();
      var total = r.height - window.innerHeight;
      var scrolled = Math.min(Math.max(-r.top, 0), total);
      var pct = total > 0 ? (scrolled / total) : 0;
      fill.style.width = (pct * 100) + '%';
      stops.forEach(function (s, i) {
        var stopP = i / (stops.length - 1);
        s.classList.toggle('is-hit', pct >= stopP - 0.02);
      });
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ── Lazy-load & autoplay videos (process steps + showreel) ── */
  function initLazyVideos() {
    var videos = document.querySelectorAll('video[data-src]');
    if (!videos.length) return;

    function loadVideo(v) {
      if (v.dataset.loaded) return;
      v.dataset.loaded = '1';
      v.src = v.dataset.src;
      v.load();
      var p = v.play();
      if (p && p.catch) p.catch(function () { /* autoplay blocked; muted usually ok */ });
      v.addEventListener('loadeddata', function () { v.classList.add('is-ready'); }, { once: true });
      // Fallback show even if loadeddata delayed
      setTimeout(function () { v.classList.add('is-ready'); }, 2500);
    }

    if (!('IntersectionObserver' in window)) {
      videos.forEach(loadVideo);
      return;
    }

    // Observe the video's parent (video without src has 0x0 dims and IO won't fire)
    var pairs = [];
    videos.forEach(function (v) {
      var parent = v.parentElement;
      if (parent) pairs.push({ v: v, target: parent });
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          pairs.forEach(function (pair) {
            if (pair.target === entry.target) {
              loadVideo(pair.v);
              io.unobserve(pair.target);
            }
          });
        }
      });
    }, { rootMargin: '250px 0px' });
    pairs.forEach(function (pair) { io.observe(pair.target); });
  }

  /* ── Boot ─────────────────────────────────────────────── */
  function boot() {
    initTrustCounters();
    initSlam();
    initRevealProgress();
    initLazyVideos();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}());
