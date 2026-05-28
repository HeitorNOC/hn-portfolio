/* ═══════════════════════════════════════════════════════════
   HN Services — Lightning (performance-optimised)
   No shadowBlur — simulated glow via wide transparent strokes.
   Depth 5 instead of 7: 4× fewer recursive draw calls.
   Hard cap of 5 simultaneous strikes.
   ═══════════════════════════════════════════════════════════ */
(function () {

  window.initLightning = function () {
    var canvas = document.getElementById('lightning-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var W, H;

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    /* ── Fractal bolt — 2-pass, NO shadowBlur ──────────────── */
    function bolt(x1, y1, x2, y2, depth, alpha) {
      if (depth <= 0 || alpha < 0.028) return;
      var dx  = x2 - x1, dy = y2 - y1;
      var len = Math.hypot(dx, dy);
      var jag = len * (0.26 + Math.random() * 0.30);
      var mx2 = (x1 + x2) / 2 + (Math.random() - 0.5) * jag;
      var my2 = (y1 + y2) / 2 + (Math.random() - 0.5) * jag;

      /* Pass 1 — wide lime halo (no GPU-expensive shadowBlur) */
      ctx.globalAlpha = alpha * 0.09;
      ctx.strokeStyle = '#C9F31D';
      ctx.lineWidth   = depth * 4.2;
      ctx.beginPath(); ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(mx2, my2, x2, y2);
      ctx.stroke();

      /* Pass 2 — crisp bright core */
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#EEFFCC';
      ctx.lineWidth   = Math.max(0.5, depth * 0.42);
      ctx.beginPath(); ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(mx2, my2, x2, y2);
      ctx.stroke();

      bolt(x1, y1, mx2, my2, depth - 1, alpha * 0.72);
      bolt(mx2, my2, x2, y2,  depth - 1, alpha * 0.72);

      if (depth > 2 && Math.random() < 0.40) {
        var bAngle = Math.atan2(dy, dx) + (Math.random() - 0.5) * Math.PI * 0.75;
        var bLen   = len * (0.20 + Math.random() * 0.32);
        bolt(mx2, my2,
             mx2 + Math.cos(bAngle) * bLen,
             my2 + Math.sin(bAngle) * bLen,
             depth - 2, alpha * 0.42);
      }
    }

    /* ── Strike pool — hard cap 5 simultaneous ─────────────── */
    var strikes = [];
    var MAX_STRIKES = 5;

    function addStrike(x1, y1, x2, y2, life) {
      if (strikes.length >= MAX_STRIKES) return; /* drop when busy */
      strikes.push({
        x1: x1, y1: y1, x2: x2, y2: y2,
        born: performance.now(),
        life: life || (700 + Math.random() * 800)
      });
    }

    /* ── Crystal position helper ────────────────────────────── */
    function crystalPos() {
      var p = window.HN && window.HN.crystalScreenPos;
      return (p && p.visible) ? p : null;
    }

    /* ── Radial arcs from crystal ───────────────────────────── */
    function spawnRadialArcs(count, spread) {
      var p = crystalPos();
      if (!p) return;
      for (var i = 0; i < count; i++) {
        var angle = Math.random() * Math.PI * 2;
        var dist  = 100 + Math.random() * (spread || 220);
        addStrike(
          p.x, p.y,
          p.x + Math.cos(angle) * dist,
          p.y + Math.sin(angle) * dist,
          600 + Math.random() * 850
        );
      }
    }

    /* ── Sky bolt descending to crystal ────────────────────── */
    function spawnSkyBolt() {
      var p  = crystalPos();
      var tx = p ? p.x + (Math.random() - 0.5) * 110 : Math.random() * W;
      var ty = p ? p.y - 20 : H * 0.3;
      var ox = tx + (Math.random() - 0.5) * 160;
      addStrike(ox, -40, tx, ty, 850 + Math.random() * 1000);
      if (Math.random() < 0.38) {
        addStrike(ox + (Math.random() - 0.5) * 50, -40,
                  tx + (Math.random() - 0.5) * 70,  ty + Math.random() * 35,
                  600 + Math.random() * 650);
      }
    }

    /* ── Timers — slower intervals reduce peak load ─────────── */
    var nextSky   = 0;
    var nextPulse = 0;

    function scheduleSky()   { nextSky   = performance.now() + 4500 + Math.random() * 6000; }
    function schedulePulse() { nextPulse = performance.now() + 1800 + Math.random() * 2800; }

    scheduleSky();
    schedulePulse();

    /* ── Public burst API ──────────────────────────────────── */
    window.HN = window.HN || {};
    window.HN.triggerLightningBurst = function (intensity) {
      var n = Math.round((intensity || 1) * 3);
      for (var i = 0; i < n; i++) {
        (function (delay) {
          setTimeout(function () { spawnRadialArcs(1, 260 * (intensity || 1)); }, delay);
        }(i * 80 + Math.random() * 100));
      }
      setTimeout(spawnSkyBolt, 120 + Math.random() * 130);
    };

    /* ── Render loop ────────────────────────────────────────── */
    var running = false;
    var rafId = null;

    function frame(now) {
      if (!running) return;
      rafId = requestAnimationFrame(frame);

      ctx.clearRect(0, 0, W, H);

      /* Early exit — no draw calls at all when idle */
      if (now >= nextSky)   { spawnSkyBolt();          scheduleSky();   }
      if (now >= nextPulse) { spawnRadialArcs(1, 180); schedulePulse(); }
      if (!strikes.length)  return;

      ctx.lineCap = 'round'; /* set once per frame */

      strikes = strikes.filter(function (s) {
        var age   = now - s.born;
        if (age > s.life) return false;
        var p     = age / s.life;
        var alpha = Math.pow(1 - p, 1.7) * 0.90;
        bolt(s.x1, s.y1, s.x2, s.y2, 5, alpha);
        return true;
      });
    }

    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (entries) {
        var isIntersecting = entries[0].isIntersecting;
        if (isIntersecting && !running) {
          canvas.style.visibility = 'visible';
          running = true;
          rafId = requestAnimationFrame(frame);
        } else if (!isIntersecting && running) {
          canvas.style.visibility = 'hidden';
          running = false;
          if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
        }
      }, { threshold: 0 });
      io.observe(canvas);
    } else {
      running = true;
      rafId = requestAnimationFrame(frame);
    }
  };

}());
