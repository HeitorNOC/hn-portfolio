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

  /* ── Slam ELEGANT — char-by-char mask reveal (v4) ─────
     Wraps each character in .slam-char > span so CSS can drive
     a staggered translateY(110%)→0 reveal. Underline + soft
     glow appear after the last character lands. */
  function wrapChars(el) {
    if (el.dataset.charsWrapped) return;
    el.dataset.charsWrapped = '1';

    // Preserve child HTML (e.g. <em>) but wrap chars inside all text nodes
    var idx = 0;
    function process(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        var text = node.nodeValue;
        var frag = document.createDocumentFragment();
        for (var i = 0; i < text.length; i++) {
          var ch = text[i];
          if (ch === ' ') {
            var s = document.createElement('span');
            s.className = 'slam-space';
            frag.appendChild(s);
          } else {
            var wrap = document.createElement('span');
            wrap.className = 'slam-char';
            wrap.style.setProperty('--i', idx);
            var inner = document.createElement('span');
            inner.textContent = ch;
            wrap.appendChild(inner);
            frag.appendChild(wrap);
            idx++;
          }
        }
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Recurse into element children (like <em>)
        Array.prototype.slice.call(node.childNodes).forEach(process);
      }
    }
    Array.prototype.slice.call(el.childNodes).forEach(process);
  }

  function initSlam() {
    var els = document.querySelectorAll('[data-slam]');
    if (!els.length) return;

    els.forEach(function (el) {
      el.classList.add('slam-in');
      wrapChars(el);
    });

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

  /* ── Process section simple entrance ──────────────────
     Each .process-step slides up + fades when it enters viewport,
     staggered by intersection order. */
  function initProcessEntrance() {
    var steps = document.querySelectorAll('.process-step');
    if (!steps.length) return;

    if (!('IntersectionObserver' in window)) {
      steps.forEach(function (s) { s.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });
    steps.forEach(function (s) { io.observe(s); });
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

  /* ── Showreel scroll-scrubbing (Awwwards-style) ───────
     Fullscreen sticky section. Scroll progress drives:
     • video.currentTime (frame scrub)
     • cinema transforms (zoom, blur, tint opacity)
     • 3 copy stages fade through
     • timecode display + progress bar */
  function initShowreelScrub() {
    var root = document.getElementById('showreel');
    if (!root) return;
    var video = root.querySelector('.showreel__video');
    var tint = root.querySelector('.showreel__tint');
    var stages = root.querySelectorAll('.showreel-stage');
    var progressFill = root.querySelector('#showreel-fill');
    var stops = root.querySelectorAll('.showreel__progress-stops span');
    var tc = root.querySelector('#showreel-tc');
    if (!video) return;

    // Load the video src from data-src (was excluded from lazy-load autoplay)
    if (!video.src && video.dataset.src) {
      video.src = video.dataset.src;
      video.load();
    }

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Prevent autoplay — we manually scrub currentTime
    video.pause();
    video.autoplay = false;
    video.loop = false;
    video.muted = true;

    // Wait for metadata to know duration; some mobile browsers need play() to enable seek
    var duration = 0;
    function onMeta() {
      duration = video.duration || 0;
      updateFromScroll();
    }
    if (video.readyState >= 1) onMeta();
    else video.addEventListener('loadedmetadata', onMeta);

    function fmtTime(t) {
      if (!isFinite(t) || t < 0) t = 0;
      var m = Math.floor(t / 60);
      var s = Math.floor(t % 60);
      return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp01(t) { return Math.max(0, Math.min(1, t)); }

    var pendingSeek = null;
    function safeSeek(target) {
      if (!isFinite(target) || target < 0) return;
      pendingSeek = target;
      try {
        video.currentTime = target;
      } catch (e) { /* seeking may throw during buffering */ }
    }

    var lastProgress = -1;
    function updateFromScroll() {
      var r = root.getBoundingClientRect();
      var travel = r.height - window.innerHeight;
      if (travel <= 0) return;
      var scrolled = Math.min(Math.max(-r.top, 0), travel);
      var p = clamp01(scrolled / travel);

      if (Math.abs(p - lastProgress) < 0.001) return;
      lastProgress = p;

      // Video scrub (throttled seeks)
      if (duration > 0 && !reduced) {
        safeSeek(p * duration);
      }

      // Cinema camera transforms — synced to progress
      // Zoom OUT from 1.15 → 1.0, sway left/right, brightness ramps
      var zoom = lerp(1.18, 1.02, p);
      var swayX = Math.sin(p * Math.PI * 2) * 1.5;  // % translate
      var brightness = lerp(0.55, 0.75, p);
      var saturate = lerp(0.7, 1.05, p);
      var blur = lerp(1.5, 0, clamp01(p / 0.15)); // blur clears in first 15%
      video.style.transform = 'scale(' + zoom + ') translateX(' + swayX + '%)';
      video.style.filter = 'contrast(1.1) saturate(' + saturate + ') brightness(' + brightness + ') blur(' + blur + 'px)';

      // Tint fades out as user goes deeper (video becomes cleaner)
      if (tint) tint.style.opacity = lerp(1, 0.35, p);

      // Stage crossfade at thresholds [0, 0.33, 0.66]
      var thresholds = [[0, 0.42], [0.28, 0.72], [0.58, 1.0]];
      stages.forEach(function (el, i) {
        var range = thresholds[i] || [0, 0];
        var inRange = p >= range[0] && p < range[1];
        if (inRange) {
          var local = (p - range[0]) / (range[1] - range[0]);
          var opac = Math.min(1, local * 4) - Math.max(0, (local - 0.75) * 4);
          var y = lerp(30, -30, local);
          el.style.opacity = Math.max(0, opac);
          el.style.transform = 'translateY(' + y + 'px)';
        } else {
          el.style.opacity = 0;
        }
      });

      // Progress bar
      if (progressFill) progressFill.style.width = (p * 100) + '%';
      if (stops.length) {
        stops.forEach(function (s, i) {
          var t = i / (stops.length - 1);
          s.classList.toggle('is-hit', p >= t - 0.02);
        });
      }

      // Timecode
      if (tc && duration > 0) {
        tc.textContent = fmtTime(p * duration) + ' / ' + fmtTime(duration);
      }
    }

    window.addEventListener('scroll', updateFromScroll, { passive: true });
    window.addEventListener('resize', updateFromScroll);
    updateFromScroll();

    // Some iOS/Safari need a tap to allow seek — try play/pause once on first scroll
    var unlocked = false;
    function unlock() {
      if (unlocked) return;
      unlocked = true;
      var p = video.play();
      if (p && p.then) p.then(function () { video.pause(); }).catch(function () {});
    }
    window.addEventListener('scroll', unlock, { once: true, passive: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
  }
  function initLazyVideos() {
    var videos = document.querySelectorAll('.process-step__video[data-src]');
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
    initShowreelScrub();
    initProcessEntrance();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}());
