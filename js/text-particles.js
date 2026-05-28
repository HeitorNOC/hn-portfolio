/* ═══════════════════════════════════════════════════════════
   HN Services — Text Particle Formation (hero intro)
   Canvas 2D. Particles scatter across viewport and converge
   into the hero heading text, then the real CSS text cross-fades
   in and the canvas fades out.

   Called from animations.js after the loader completes.
   onDone() fires when CSS text should become visible.
   ═══════════════════════════════════════════════════════════ */
(function () {

  window.initTextParticles = function (onDone) {

    /* Skip animation for reduced-motion preference */
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var c = document.getElementById('text-particles-canvas');
      if (c) c.style.display = 'none';
      onDone && onDone();
      return;
    }

    /* ── Safety: clean up within 4.5 s even if animation stalls ── */
    var finished = false;
    var safetyTimer = setTimeout(function () {
      finish();
    }, 3500);

    function finish() {
      if (finished) return;
      finished = true;
      clearTimeout(safetyTimer);
      onDone && onDone();
    }

    var canvas = document.getElementById('text-particles-canvas');
    if (!canvas) { finish(); return; }

    var W, H, ctx, particles;
    var phase = 'idle';
    var FORM_MS  = 1700;   /* convergence duration */
    var HOLD_MS  = 300;    /* hold shape before text fades in */
    var startTime, phaseStart, rafId;

    /* ── Ease — gentle cubic that starts slow, decelerates softly ── */
    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /* ── Sample text pixels from an offscreen canvas ─────────── */
    function samplePositions() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      ctx = canvas.getContext('2d');

      var off = document.createElement('canvas');
      off.width = W; off.height = H;
      var oc = off.getContext('2d');

      var words = document.querySelectorAll('.hero__word');
      var drawn = 0;

      words.forEach(function (wordEl) {
        var rect = wordEl.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        var text     = wordEl.textContent.trim();
        var isStroke = wordEl.classList.contains('hero__word--stroke');

        /* Mirror the element's actual computed font so particles
           land precisely on each rendered glyph */
        var cs = window.getComputedStyle(wordEl);
        var fSize = parseFloat(cs.fontSize) || Math.max(72, Math.min(W * 0.11, 168));

        oc.font = (cs.fontWeight || '800') + ' ' + fSize + 'px ' + (cs.fontFamily || '"Clash Display",sans-serif');
        if ('letterSpacing' in oc) {
          oc.letterSpacing = cs.letterSpacing !== 'normal' ? cs.letterSpacing : '0px';
        }

        var m       = oc.measureText(text);
        var ascent  = m.fontBoundingBoxAscent || fSize * 0.78;
        var baseline = rect.top + ascent;

        oc.fillStyle = isStroke ? '#C9F31D' : '#F5F0E8';
        oc.fillText(text, rect.left, baseline);
        drawn++;
      });

      if (!drawn) return [];

      var data      = oc.getImageData(0, 0, W, H).data;
      var positions = [];
      var step      = 6;

      for (var y = 0; y < H; y += step) {
        for (var x = 0; x < W; x += step) {
          var i = (y * W + x) * 4;
          if (data[i + 3] < 80) continue;
          var lime = (data[i + 1] > 200 && data[i + 2] < 60) ? 1 : 0;
          positions.push({ x: x, y: y, lime: lime });
        }
      }

      /* Fisher-Yates shuffle */
      for (var k = positions.length - 1; k > 0; k--) {
        var j   = Math.floor(Math.random() * (k + 1));
        var tmp = positions[k];
        positions[k] = positions[j];
        positions[j] = tmp;
      }

      var MAX = 2600;
      if (positions.length > MAX) positions.length = MAX;

      return positions;
    }

    /* ── Build particle array ─────────────────────────────────── */
    function buildParticles(positions) {
      return positions.map(function (p) {
        var angle = Math.random() * Math.PI * 2;
        /* Tighter scatter radius = shorter travel = smoother convergence */
        var dist  = 160 + Math.random() * 340;
        return {
          sx: W * 0.5 + Math.cos(angle) * dist,
          sy: H * 0.48 + Math.sin(angle) * dist,
          x: 0, y: 0,
          tx: p.x, ty: p.y,
          /* Smaller, more uniform particles → refined look */
          size:  0.6 + Math.random() * 1.0,
          lime:  p.lime,
          /* Tighter delay spread so particles travel together */
          delay: Math.random() * 0.28
        };
      });
    }

    /* ── Draw frame ───────────────────────────────────────────── */
    function drawFrame(now) {
      ctx.clearRect(0, 0, W, H);

      if (phase === 'form') {
        var elapsed = now - startTime;
        var allDone = true;

        var limeBuckets = [[], [], [], [], []];
        var whiteBuckets = [[], [], [], [], []];

        for (var i = 0; i < particles.length; i++) {
          var p = particles[i];
          var t = Math.max(0, (elapsed - p.delay * FORM_MS) / (FORM_MS * (1 - p.delay * 0.6)));
          t = Math.min(1, t);
          if (t < 1) allDone = false;

          var ease  = easeInOutCubic(t);
          p.x = p.sx + (p.tx - p.sx) * ease;
          p.y = p.sy + (p.ty - p.sy) * ease;

          var alpha = Math.min(1, t * 2.5);
          if (alpha <= 0.05) continue;

          var bIdx = Math.min(4, Math.floor(alpha * 5));

          if (p.lime) {
            limeBuckets[bIdx].push(p);
          } else {
            whiteBuckets[bIdx].push(p);
          }
        }

        // Draw lime in batches (maximum 5 draw calls)
        for (var b = 0; b < 5; b++) {
          var list = limeBuckets[b];
          if (list.length === 0) continue;
          var opacity = ((b + 1) * 0.2 * 0.92).toFixed(2);
          ctx.fillStyle = 'rgba(201,243,29,' + opacity + ')';
          ctx.beginPath();
          for (var k = 0; k < list.length; k++) {
            var p = list[k];
            ctx.moveTo(p.x + p.size, p.y);
            ctx.arc(p.x, p.y, p.size, 0, 6.2832);
          }
          ctx.fill();
        }

        // Draw white in batches (maximum 5 draw calls)
        for (var b = 0; b < 5; b++) {
          var list = whiteBuckets[b];
          if (list.length === 0) continue;
          var opacity = ((b + 1) * 0.2 * 0.88).toFixed(2);
          ctx.fillStyle = 'rgba(245,240,232,' + opacity + ')';
          ctx.beginPath();
          for (var k = 0; k < list.length; k++) {
            var p = list[k];
            ctx.moveTo(p.x + p.size, p.y);
            ctx.arc(p.x, p.y, p.size, 0, 6.2832);
          }
          ctx.fill();
        }

        if (allDone) { phase = 'hold'; phaseStart = now; }
        return;
      }

      if (phase === 'hold') {
        ctx.fillStyle = 'rgba(201,243,29,0.92)';
        ctx.beginPath();
        for (var i = 0; i < particles.length; i++) {
          var p = particles[i];
          if (p.lime) {
            ctx.moveTo(p.tx + p.size, p.ty);
            ctx.arc(p.tx, p.ty, p.size, 0, 6.2832);
          }
        }
        ctx.fill();

        ctx.fillStyle = 'rgba(245,240,232,0.88)';
        ctx.beginPath();
        for (var i = 0; i < particles.length; i++) {
          var p = particles[i];
          if (!p.lime) {
            ctx.moveTo(p.tx + p.size, p.ty);
            ctx.arc(p.tx, p.ty, p.size, 0, 6.2832);
          }
        }
        ctx.fill();

        if (now - phaseStart > HOLD_MS) {
          phase = 'out';
          finish(); /* fire → hero text fades in */
          if (window.gsap) {
            gsap.to(canvas, {
              opacity: 0, duration: 0.55, ease: 'power2.in',
              onComplete: function () {
                cancelAnimationFrame(rafId);
                canvas.style.display = 'none';
              }
            });
          } else {
            cancelAnimationFrame(rafId);
            canvas.style.display = 'none';
          }
        }
      }
    }

    /* ── Render loop ──────────────────────────────────────────── */
    function loop(now) {
      if (phase === 'out') return;
      drawFrame(now);
      rafId = requestAnimationFrame(loop);
    }

    /* ── Start (called after font is ready) ───────────────────── */
    function start() {
      var positions;
      try {
        positions = samplePositions();
      } catch (e) {
        positions = [];
      }

      if (!positions.length) {
        canvas.style.display = 'none';
        finish();
        return;
      }

      particles  = buildParticles(positions);
      phase      = 'form';
      startTime  = performance.now();
      rafId      = requestAnimationFrame(loop);
    }

    /* Wait for Syne 800 before sampling pixels */
    if (document.fonts && document.fonts.load) {
      document.fonts.load('800 1px "Syne"').then(start, start);
    } else {
      start();
    }
  };

}());
