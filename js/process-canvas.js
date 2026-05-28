/* ═══════════════════════════════════════════════════════════
   HN Services — Canvas "Video Loop" Effects
   About:   Neural network (nodes + packets + connections)
   Step 01: Radar scan (discovery / mapping)
   Step 02: Circuit builder (construction / development)
   Step 03: Signal burst  (launch / delivery)
   ═══════════════════════════════════════════════════════════ */
(function () {

  var LIME  = '#C9F31D';
  var LIME_A = 'rgba(201,243,29,';
  var WHITE_A = 'rgba(245,240,232,';

  /* ─── Shared helpers ────────────────────────────────────── */
  function setupCanvas(id) {
    var c = document.getElementById(id);
    if (!c) return null;
    var ctx = c.getContext('2d');
    function resize() {
      c.width  = c.offsetWidth  || c.parentElement.offsetWidth  || 400;
      c.height = c.offsetHeight || c.parentElement.offsetHeight || 400;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });
    return { c: c, ctx: ctx, resize: resize };
  }

  /* Only run canvas when visible */
  function visibilityLoop(canvas, fn, onStateChange) {
    var running = false;
    var rafId = null;

    function loop() {
      if (!running) return;
      fn();
      rafId = requestAnimationFrame(loop);
    }

    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (entries) {
        var isIntersecting = entries[0].isIntersecting;
        if (isIntersecting && !running) {
          canvas.style.visibility = 'visible';
          running = true;
          if (onStateChange) onStateChange(true);
          rafId = requestAnimationFrame(loop);
        } else if (!isIntersecting && running) {
          canvas.style.visibility = 'hidden';
          running = false;
          if (onStateChange) onStateChange(false);
          if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
        }
      }, { threshold: 0 });
      io.observe(canvas);
    } else {
      running = true;
      if (onStateChange) onStateChange(true);
      rafId = requestAnimationFrame(loop);
    }
  }

  /* ═══════════════════════════════════════════════════════
     ABOUT — Neural Network "video loop"
     ═══════════════════════════════════════════════════════ */
  window.initAboutCanvas = function () {
    var s = setupCanvas('about-canvas');
    if (!s) return;
    var c = s.c, ctx = s.ctx;
    var isRunning = false;

    /* Nodes */
    var N    = 26;
    var nodes = [];
    for (var i = 0; i < N; i++) {
      nodes.push({
        x:     Math.random() * c.width,
        y:     Math.random() * c.height,
        vx:    (Math.random() - 0.5) * 0.22,
        vy:    (Math.random() - 0.5) * 0.22,
        r:     Math.random() * 2.5 + 1.0,
        phase: Math.random() * Math.PI * 2
      });
    }

    /* Data packets travelling along connections */
    var packets = [];
    function spawnPacket() {
      if (!isRunning) return;
      var i = Math.floor(Math.random() * N);
      var j = Math.floor(Math.random() * N);
      if (i === j) return;
      packets.push({ from: i, to: j, t: 0, speed: 0.006 + Math.random() * 0.008 });
    }
    setInterval(spawnPacket, 600);

    function draw() {
      c.width = c.width; /* clear */
      ctx.clearRect(0, 0, c.width, c.height);

      /* Update node positions */
      nodes.forEach(function (n) {
        n.x += n.vx; n.y += n.vy; n.phase += 0.015;
        if (n.x < 0) n.x += c.width;  if (n.x > c.width)  n.x -= c.width;
        if (n.y < 0) n.y += c.height; if (n.y > c.height) n.y -= c.height;
      });

      /* Connections */
      var CDIST = Math.min(c.width, c.height) * 0.38;
      for (var i = 0; i < N; i++) {
        for (var j = i + 1; j < N; j++) {
          var dx   = nodes[j].x - nodes[i].x;
          var dy   = nodes[j].y - nodes[i].y;
          var dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < CDIST) {
            var a = (1 - dist / CDIST) * 0.22;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = LIME_A + a + ')';
            ctx.lineWidth   = 0.6;
            ctx.stroke();
          }
        }
      }

      /* Packets */
      packets = packets.filter(function (p) {
        p.t += p.speed;
        if (p.t >= 1) return false;
        var nx = nodes[p.from].x + (nodes[p.to].x - nodes[p.from].x) * p.t;
        var ny = nodes[p.from].y + (nodes[p.to].y - nodes[p.from].y) * p.t;
        var grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, 5);
        grad.addColorStop(0, LIME_A + '0.95)');
        grad.addColorStop(1, LIME_A + '0)');
        ctx.beginPath();
        ctx.arc(nx, ny, 5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        return true;
      });

      /* Node dots with pulse glow */
      nodes.forEach(function (n) {
        var pr   = n.r * (1 + Math.sin(n.phase) * 0.35);
        var grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, pr * 4);
        grad.addColorStop(0, LIME_A + '0.9)');
        grad.addColorStop(0.4, LIME_A + '0.25)');
        grad.addColorStop(1, LIME_A + '0)');
        ctx.beginPath();
        ctx.arc(n.x, n.y, pr * 4, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(n.x, n.y, pr, 0, Math.PI * 2);
        ctx.fillStyle = LIME_A + '0.85)';
        ctx.fill();
      });
    }

    visibilityLoop(c, draw, function (state) {
      isRunning = state;
    });
  };

  /* ═══════════════════════════════════════════════════════
     STEP 01 — Matrix Digital Rain (Descoberta)
     Acid-lime katakana + binary + code symbols fall in
     columns. Bright head, dimming trail. Horizontal scan.
     ═══════════════════════════════════════════════════════ */
  window.initProcessCanvas1 = function () {
    var s = setupCanvas('process-canvas-1');
    if (!s) return;
    var c = s.c, ctx = s.ctx;

    /* character pool: katakana fragments + binary + code glyphs */
    var CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨ' +
                'ラリルレロワヲン01<>{}[]#=+-/\\~%;:!?$&@';

    var COL_W   = 18;
    var FONT_H  = 17;
    var cols    = [];
    var initialized = false;

    function initCols() {
      cols = [];
      var n = Math.ceil(c.width / COL_W) + 1;
      for (var i = 0; i < n; i++) {
        var col = {
          x:     i * COL_W + COL_W * 0.5,
          y:     -Math.random() * c.height * 1.5,
          speed: 0, trail: 0, bright: 0, frozen: 0
        };
        resetCol(col);
        cols.push(col);
      }
    }

    function resetCol(col) {
      col.speed  = 1.4 + Math.random() * 3.0;
      col.trail  = Math.floor(10 + Math.random() * 16);
      col.bright = 0.55 + Math.random() * 0.45;
      col.frozen = 0;
      return col;
    }

    function draw() {
      var now = performance.now();
      var W = c.width, H = c.height;

      if (!initialized) {
        ctx.clearRect(0, 0, W, H);
        initialized = true;
      }

      /* partial dim — creates the trailing smear */
      ctx.fillStyle = 'rgba(8,8,8,0.16)';
      ctx.fillRect(0, 0, W, H);

      ctx.font      = FONT_H + 'px "Space Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      cols.forEach(function (col, ci) {
        /* advance unless frozen */
        if (col.frozen > now) return;
        col.y += col.speed;

        /* wrap: reset column when tail clears screen */
        if (col.y - col.trail * FONT_H > H) {
          col.y = -FONT_H * (Math.random() * 4);
          resetCol(col);
          /* occasionally freeze for a moment (stutter effect) */
          if (Math.random() < 0.18) col.frozen = now + 300 + Math.random() * 800;
        }

        /* head character — white-green with glow */
        var headChar = CHARS.charAt(Math.floor((now * 0.014 + ci * 137.508) % CHARS.length));
        ctx.save();
        ctx.fillStyle    = 'rgba(230,255,200,0.96)';
        ctx.shadowColor  = '#C9F31D';
        ctx.shadowBlur   = 10;
        ctx.fillText(headChar, col.x, col.y);
        ctx.restore();

        /* trail — dim lime characters fading upward */
        for (var tr = 1; tr < col.trail; tr++) {
          var ty = col.y - tr * FONT_H;
          if (ty < -FONT_H || ty > H + FONT_H) continue;
          var tAlpha = Math.pow(1 - tr / col.trail, 1.6) * col.bright * 0.9;
          if (tAlpha < 0.015) continue;
          var trChar = CHARS.charAt(Math.floor((ci * 31.7 + tr * 8.3 + now * 0.003) % CHARS.length));
          ctx.fillStyle = LIME_A + tAlpha + ')';
          ctx.fillText(trChar, col.x, ty);
        }
      });

      /* horizontal scan line sweeping top→bottom */
      var scanY = (now * 0.055) % H;
      ctx.fillStyle = 'rgba(201,243,29,0.028)';
      ctx.fillRect(0, scanY, W, 3);
      /* secondary slower scan */
      var scan2 = (now * 0.028 + H * 0.55) % H;
      ctx.fillStyle = 'rgba(201,243,29,0.014)';
      ctx.fillRect(0, scan2, W, 1);

      /* vignette edges */
      var vx = ctx.createLinearGradient(0, 0, W, 0);
      vx.addColorStop(0,   'rgba(8,8,8,0.35)');
      vx.addColorStop(0.1, 'rgba(8,8,8,0)');
      vx.addColorStop(0.9, 'rgba(8,8,8,0)');
      vx.addColorStop(1,   'rgba(8,8,8,0.35)');
      ctx.fillStyle = vx;
      ctx.fillRect(0, 0, W, H);
    }

    /* init columns on first draw (canvas has size by then) */
    var ready = false;
    function wrappedDraw() {
      if (!ready) { initCols(); ready = true; }
      draw();
    }

    window.addEventListener('resize', function () {
      ready = false;
      initialized = false;
    }, { passive: true });

    visibilityLoop(c, wrappedDraw);
  };

  /* ═══════════════════════════════════════════════════════
     STEP 02 — Circuit Builder (Construção)
     ═══════════════════════════════════════════════════════ */
  window.initProcessCanvas2 = function () {
    var s = setupCanvas('process-canvas-2');
    if (!s) return;
    var c = s.c, ctx = s.ctx;
    var isRunning = false;

    var paths   = [];
    var packets = [];
    var built   = false;
    var buildProgress = 0;

    /* Build a grid of circuit paths */
    function buildCircuit() {
      paths = [];
      var W = c.width, H = c.height;
      var gridX = 8, gridY = 8;
      var cellW = W / gridX, cellH = H / gridY;

      /* Random L-shaped paths on the grid */
      for (var k = 0; k < 28; k++) {
        var gx1 = Math.floor(Math.random() * gridX);
        var gy1 = Math.floor(Math.random() * gridY);
        var gx2 = Math.floor(Math.random() * gridX);
        var gy2 = Math.floor(Math.random() * gridY);
        paths.push({
          x1: (gx1 + 0.5) * cellW,
          y1: (gy1 + 0.5) * cellH,
          x2: (gx2 + 0.5) * cellW,
          y2: (gy2 + 0.5) * cellH,
          drawn: 0, /* 0→1 progress */
          speed: 0.004 + Math.random() * 0.006,
          delay: k * 0.06
        });
      }
    }
    buildCircuit();
    setInterval(function () {
      if (!isRunning) return;
      buildCircuit();
      buildProgress = 0;
    }, 7000);

    /* Spawn data packet along a random completed path */
    setInterval(function () {
      if (!isRunning) return;
      var done = paths.filter(function (p) { return p.drawn >= 1; });
      if (!done.length) return;
      var p = done[Math.floor(Math.random() * done.length)];
      packets.push({ x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2, t: 0, speed: 0.012 });
    }, 320);

    var elapsed = 0;

    function draw() {
      elapsed += 0.016;
      ctx.clearRect(0, 0, c.width, c.height);

      /* Background grid dots */
      var dot = 18;
      ctx.fillStyle = LIME_A + '0.07)';
      for (var gx = dot; gx < c.width; gx += dot) {
        for (var gy = dot; gy < c.height; gy += dot) {
          ctx.fillRect(gx - 0.5, gy - 0.5, 1, 1);
        }
      }

      /* Draw paths */
      paths.forEach(function (p) {
        if (elapsed < p.delay) return;
        p.drawn = Math.min(1, p.drawn + p.speed);
        var ex = p.x1 + (p.x2 - p.x1) * p.drawn;
        var ey = p.y1;
        var corner = p.x1 + (p.x2 - p.x1) * p.drawn;
        /* L-shaped: horizontal then vertical */
        var done = p.drawn;
        var horiz = Math.min(1, done * 2);
        var vert  = Math.max(0, done * 2 - 1);
        var midX  = p.x1 + (p.x2 - p.x1) * horiz;
        var endY  = p.y1 + (p.y2 - p.y1) * vert;

        var alpha = p.drawn > 0.95 ? 0.35 : 0.55;
        ctx.beginPath();
        ctx.moveTo(p.x1, p.y1);
        ctx.lineTo(midX, p.y1);
        ctx.lineTo(midX, endY);
        ctx.strokeStyle = LIME_A + alpha + ')';
        ctx.lineWidth   = 1;
        ctx.stroke();

        /* Node at intersections */
        if (p.drawn > 0.98) {
          [
            [p.x1,  p.y1],
            [p.x2,  p.y1],
            [p.x2,  p.y2]
          ].forEach(function (pt) {
            ctx.beginPath();
            ctx.arc(pt[0], pt[1], 2.5, 0, Math.PI * 2);
            ctx.fillStyle   = LIME_A + '0.8)';
            ctx.shadowColor = LIME; ctx.shadowBlur = 6;
            ctx.fill(); ctx.shadowBlur = 0;
          });
        }
      });

      /* Packets */
      packets = packets.filter(function (p) {
        p.t += p.speed;
        if (p.t >= 1) return false;
        /* Follow same L-shape */
        var horiz = Math.min(1, p.t * 2);
        var vert  = Math.max(0, p.t * 2 - 1);
        var px = p.x1 + (p.x2 - p.x1) * horiz;
        var py = p.y1 + (p.y2 - p.y1) * vert;
        var g = ctx.createRadialGradient(px, py, 0, px, py, 6);
        g.addColorStop(0, WHITE_A + '1)');
        g.addColorStop(0.3, LIME_A + '0.8)');
        g.addColorStop(1, LIME_A + '0)');
        ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
        return true;
      });
    }

    visibilityLoop(c, draw, function (state) {
      isRunning = state;
    });
  };

  /* ═══════════════════════════════════════════════════════
     STEP 03 — Signal Burst (Lançamento)
     ═══════════════════════════════════════════════════════ */
  window.initProcessCanvas3 = function () {
    var s = setupCanvas('process-canvas-3');
    if (!s) return;
    var c = s.c, ctx = s.ctx;
    var isRunning = false;

    var rings   = [];
    var sparks  = [];
    var phase   = 0;

    /* Spawn a ring burst */
    function burst() {
      if (!isRunning && !firstRun) return;
      firstRun = false;
      var W = c.width, H = c.height;
      rings.push({ r: 0, maxR: Math.min(W, H) * 0.48, life: 1.0, speed: 0.008 });
      /* Sparks */
      for (var i = 0; i < 18; i++) {
        var a = (i / 18) * Math.PI * 2 + Math.random() * 0.3;
        var spd = 0.9 + Math.random() * 0.7;
        sparks.push({ x: W/2, y: H/2, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life: 1.0, r: Math.random() * 2 + 1 });
      }
    }
    var firstRun = true;
    burst();
    setInterval(burst, 2800);

    function draw() {
      var W = c.width, H = c.height, cx = W/2, cy = H/2;
      phase += 0.02;
      ctx.clearRect(0, 0, W, H);

      /* Central pulsing core */
      var coreR = 6 + Math.sin(phase) * 2;
      var coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 5);
      coreGrad.addColorStop(0, WHITE_A + '1)');
      coreGrad.addColorStop(0.25, LIME_A + '0.8)');
      coreGrad.addColorStop(0.6, LIME_A + '0.15)');
      coreGrad.addColorStop(1, LIME_A + '0)');
      ctx.beginPath(); ctx.arc(cx, cy, coreR * 5, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fillStyle = WHITE_A + '1)'; ctx.fill();

      /* Expanding rings */
      rings = rings.filter(function (r) {
        r.r += (r.maxR - r.r) * r.speed * 2.2;
        r.life -= 0.007;
        if (r.life <= 0) return false;
        var a = r.life * 0.9;
        ctx.beginPath();
        ctx.arc(cx, cy, r.r, 0, Math.PI * 2);
        ctx.strokeStyle = LIME_A + a + ')';
        ctx.lineWidth   = Math.max(0.5, r.life * 1.5);
        ctx.shadowColor = LIME; ctx.shadowBlur = r.life * 12;
        ctx.stroke(); ctx.shadowBlur = 0;
        /* Secondary fainter ring */
        if (r.r > 20) {
          ctx.beginPath();
          ctx.arc(cx, cy, r.r * 0.72, 0, Math.PI * 2);
          ctx.strokeStyle = LIME_A + (a * 0.35) + ')';
          ctx.lineWidth   = 0.5;
          ctx.stroke();
        }
        return true;
      });

      /* Sparks */
      sparks = sparks.filter(function (sp) {
        sp.x += sp.vx; sp.y += sp.vy;
        sp.vx *= 0.985; sp.vy *= 0.985;
        sp.life -= 0.012;
        if (sp.life <= 0) return false;
        var a = sp.life * 0.8;
        ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.r * sp.life, 0, Math.PI * 2);
        ctx.fillStyle = LIME_A + a + ')'; ctx.fill();
        return true;
      });

      /* Orbit dots */
      for (var i = 0; i < 6; i++) {
        var a  = phase * (1 + i * 0.15) + (i / 6) * Math.PI * 2;
        var or = 28 + Math.sin(phase * 2 + i) * 6;
        var ox = cx + Math.cos(a) * or;
        var oy = cy + Math.sin(a) * or;
        ctx.beginPath(); ctx.arc(ox, oy, 2, 0, Math.PI * 2);
        ctx.fillStyle = LIME_A + '0.55)'; ctx.fill();
      }
    }

    visibilityLoop(c, draw, function (state) {
      isRunning = state;
    });
  };

  /* ── Init all process canvases ────────────────────────── */
  window.initProcessCanvases = function () {
    initProcessCanvas1();
    initProcessCanvas2();
    initProcessCanvas3();
    initAboutCanvas();
  };

}());
