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

  /* ── Slam-in effect ──────────────────────────────────── */
  function initSlam() {
    var els = document.querySelectorAll('[data-slam]');
    if (!els.length) return;

    els.forEach(function (el) { el.classList.add('slam-in'); });

    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-hit'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-hit');
          io.unobserve(entry.target);
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
