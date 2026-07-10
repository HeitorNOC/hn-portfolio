/* ═══════════════════════════════════════════════════════════
   HN Services — Website Reveal Scene (v2)
   Sticky-based cinematic (no ScrollTrigger pin conflict).
   Laptop wireframed → cover strips → hinge opens → angle
   change → screen: wireframe → design → live production.
   ═══════════════════════════════════════════════════════════ */
(function () {
  if (!window.THREE) return;

  window.initRevealScene = function () {
    var section = document.getElementById('reveal-scene');
    var stageWrap = section && section.querySelector('.reveal-stage-wrap');
    var canvas = document.getElementById('reveal-canvas');
    if (!section || !canvas || !stageWrap) return;

    var THREE = window.THREE;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    /* Ensure canvas has real pixel size before renderer init */
    function fitCanvas() {
      var rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, rect.width * dpr);
      canvas.height = Math.max(1, rect.height * dpr);
    }
    fitCanvas();

    var scene = new THREE.Scene();
    scene.background = null;

    var camera = new THREE.PerspectiveCamera(35, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, 0.6, 6.4);
    camera.lookAt(0, 0, 0);

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(dpr);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

    /* Lights */
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    var key = new THREE.DirectionalLight(0xC9F31D, 0.85);
    key.position.set(3, 4, 4); scene.add(key);
    var rim = new THREE.DirectionalLight(0xffffff, 0.35);
    rim.position.set(-4, 2, -2); scene.add(rim);

    /* Laptop group */
    var laptop = new THREE.Group();
    scene.add(laptop);

    var baseGeo = new THREE.BoxGeometry(3.2, 0.14, 2.1);
    var baseMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.6, roughness: 0.35 });
    var base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -0.65;
    laptop.add(base);

    var kbdGeo = new THREE.PlaneGeometry(2.9, 1.85);
    var kbdMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.3, roughness: 0.9 });
    var kbd = new THREE.Mesh(kbdGeo, kbdMat);
    kbd.rotation.x = -Math.PI / 2;
    kbd.position.y = -0.575;
    laptop.add(kbd);

    // Screen hinge
    var hinge = new THREE.Group();
    hinge.position.set(0, -0.58, -1.0);
    laptop.add(hinge);

    var frameGeo = new THREE.BoxGeometry(3.2, 2.0, 0.08);
    var frameMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.7, roughness: 0.3 });
    var frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = 1.0;
    hinge.add(frame);

    /* Screen canvas texture */
    var screenCanvas = document.createElement('canvas');
    screenCanvas.width = 1024; screenCanvas.height = 640;
    var sctx = screenCanvas.getContext('2d');
    var screenTex = new THREE.CanvasTexture(screenCanvas);
    screenTex.minFilter = THREE.LinearFilter;
    screenTex.magFilter = THREE.LinearFilter;

    var screenGeo = new THREE.PlaneGeometry(3.0, 1.85);
    var screenMat = new THREE.MeshBasicMaterial({ map: screenTex, transparent: true });
    var screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 1.0, 0.045);
    hinge.add(screen);

    /* Cover: wireframe box wrapping laptop, strips away */
    var coverGroup = new THREE.Group();
    laptop.add(coverGroup);
    var coverGeo = new THREE.BoxGeometry(3.6, 2.6, 2.4);
    var coverEdges = new THREE.EdgesGeometry(coverGeo);
    var coverMat = new THREE.LineBasicMaterial({ color: 0xC9F31D, transparent: true, opacity: 0.75 });
    var cover = new THREE.LineSegments(coverEdges, coverMat);
    cover.position.y = 0.15;
    coverGroup.add(cover);

    var coverFillMat = new THREE.MeshBasicMaterial({ color: 0xC9F31D, transparent: true, opacity: 0.06, side: THREE.DoubleSide });
    var coverFill = new THREE.Mesh(coverGeo, coverFillMat);
    coverFill.position.y = 0.15;
    coverGroup.add(coverFill);

    var particlesGeo = new THREE.BufferGeometry();
    var pCount = 140;
    var positions = new Float32Array(pCount * 3);
    for (var i = 0; i < pCount; i++) {
      positions[i*3+0] = (Math.random() - 0.5) * 3.5;
      positions[i*3+1] = (Math.random() - 0.3) * 2.4;
      positions[i*3+2] = (Math.random() - 0.5) * 2.2;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var particlesMat = new THREE.PointsMaterial({ color: 0xC9F31D, size: 0.025, transparent: true, opacity: 0.7 });
    var particles = new THREE.Points(particlesGeo, particlesMat);
    coverGroup.add(particles);

    /* Frames: wireframe / design / live */
    function drawWireframe() {
      sctx.fillStyle = '#0a0a0a';
      sctx.fillRect(0, 0, 1024, 640);
      sctx.strokeStyle = 'rgba(201, 243, 29, 0.45)';
      sctx.lineWidth = 2;
      sctx.setLineDash([6, 8]);
      for (var x = 40; x < 1024; x += 80) { sctx.beginPath(); sctx.moveTo(x, 20); sctx.lineTo(x, 620); sctx.stroke(); }
      for (var y = 40; y < 640; y += 80) { sctx.beginPath(); sctx.moveTo(20, y); sctx.lineTo(1004, y); sctx.stroke(); }
      sctx.setLineDash([]);
      sctx.strokeStyle = 'rgba(245, 240, 232, 0.55)';
      sctx.lineWidth = 3;
      sctx.strokeRect(60, 60, 904, 80);
      sctx.strokeRect(60, 180, 560, 240);
      sctx.strokeRect(660, 180, 304, 60);
      sctx.strokeRect(660, 260, 304, 40);
      sctx.strokeRect(660, 320, 180, 50);
      sctx.strokeRect(60, 460, 280, 140);
      sctx.strokeRect(372, 460, 280, 140);
      sctx.strokeRect(684, 460, 280, 140);
      sctx.beginPath();
      sctx.moveTo(60, 180); sctx.lineTo(620, 420);
      sctx.moveTo(620, 180); sctx.lineTo(60, 420);
      sctx.stroke();
      screenTex.needsUpdate = true;
    }

    function drawDesign() {
      var g = sctx.createLinearGradient(0, 0, 0, 640);
      g.addColorStop(0, '#0f0f0f'); g.addColorStop(1, '#050505');
      sctx.fillStyle = g; sctx.fillRect(0, 0, 1024, 640);
      sctx.fillStyle = 'rgba(255,255,255,0.04)';
      sctx.fillRect(0, 0, 1024, 70);
      sctx.fillStyle = '#C9F31D'; sctx.fillRect(50, 26, 22, 22);
      sctx.fillStyle = '#F5F0E8'; sctx.font = 'bold 18px sans-serif';
      sctx.fillText('HN Services', 84, 42);
      var gh = sctx.createLinearGradient(60, 100, 60, 420);
      gh.addColorStop(0, 'rgba(201,243,29,0.35)');
      gh.addColorStop(1, 'rgba(201,243,29,0.08)');
      sctx.fillStyle = gh;
      sctx.fillRect(60, 110, 560, 300);
      sctx.fillStyle = 'rgba(245,240,232,0.9)';
      sctx.font = 'bold 44px sans-serif';
      sctx.fillText('Sites que', 660, 180);
      sctx.fillText('Vendem.', 660, 232);
      sctx.fillStyle = '#C9F31D';
      sctx.fillRect(660, 270, 160, 46);
      sctx.fillStyle = '#0a0a0a';
      sctx.font = 'bold 14px sans-serif';
      sctx.fillText('COMEÇAR AGORA →', 674, 298);
      for (var c = 0; c < 3; c++) {
        sctx.fillStyle = 'rgba(255,255,255,0.05)';
        sctx.fillRect(60 + c * 312, 460, 280, 140);
        sctx.fillStyle = '#C9F31D';
        sctx.fillRect(80 + c * 312, 480, 32, 3);
        sctx.fillStyle = 'rgba(245,240,232,0.85)';
        sctx.font = 'bold 20px sans-serif';
        sctx.fillText(['Rápido', 'Bonito', 'Escala'][c], 80 + c * 312, 520);
        sctx.fillStyle = 'rgba(245,240,232,0.4)';
        sctx.font = '13px sans-serif';
        sctx.fillText('Loading time <1s', 80 + c * 312, 548);
      }
      screenTex.needsUpdate = true;
    }

    function drawLive() {
      drawDesign();
      sctx.fillStyle = '#C9F31D';
      sctx.beginPath(); sctx.arc(950, 40, 6, 0, Math.PI * 2); sctx.fill();
      sctx.fillStyle = 'rgba(245,240,232,0.7)';
      sctx.font = '12px monospace';
      sctx.fillText('LIVE', 962, 44);
      sctx.fillStyle = 'rgba(201,243,29,0.18)';
      sctx.fillRect(60, 610, 904, 22);
      sctx.fillStyle = '#C9F31D';
      sctx.font = 'bold 12px monospace';
      sctx.fillText('99.9% UPTIME · CORE WEB VITALS: A+ · SEO SCORE: 98', 76, 626);
      screenTex.needsUpdate = true;
    }

    /* Initial state */
    hinge.rotation.x = -Math.PI / 2;
    drawWireframe();
    var lastPhase = 0;

    /* Resize */
    function resize() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    setTimeout(resize, 100);

    /* ── Progress from scroll position ──────────────────── */
    function computeProgress() {
      var r = section.getBoundingClientRect();
      var travel = r.height - window.innerHeight;
      if (travel <= 0) return 0;
      var scrolled = Math.min(Math.max(-r.top, 0), travel);
      return scrolled / travel;
    }

    /* Helper: smoothstep */
    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp01(t) { return Math.max(0, Math.min(1, t)); }
    function smoothstep(edge0, edge1, x) {
      var t = clamp01((x - edge0) / (edge1 - edge0));
      return t * t * (3 - 2 * t);
    }

    /* ── Copy stages sync (opacity per phase) ────────────── */
    var stages = Array.prototype.slice.call(section.querySelectorAll('.reveal-stage'));
    var progressFill = section.querySelector('.reveal-progress__fill');
    var progressStops = section.querySelectorAll('.reveal-progress__stops span');

    /* ── Apply state from progress (0-1) ─────────────────── */
    function applyState(p) {
      // Phase 1 (0.00 - 0.22): cover lifts + fades
      var t1 = smoothstep(0.00, 0.22, p);
      cover.material.opacity = lerp(0.75, 0, t1);
      coverFill.material.opacity = lerp(0.06, 0, t1);
      particles.material.opacity = lerp(0.7, 0, smoothstep(0.05, 0.20, p));
      coverGroup.position.y = lerp(0, 2.5, t1);
      var cs = lerp(1, 1.4, t1);
      coverGroup.scale.set(cs, cs, cs);

      // Phase 2 (0.22 - 0.40): hinge opens
      var t2 = smoothstep(0.22, 0.40, p);
      hinge.rotation.x = lerp(-Math.PI / 2, 0, t2);

      // Phase 3 (0.40 - 0.60): angle change + slight tilt
      var t3 = smoothstep(0.40, 0.60, p);
      laptop.rotation.y = lerp(0, -0.45, t3);
      laptop.rotation.x = lerp(0, -0.08, t3);

      // Phase 4 (0.60 - 0.85): screen transitions wireframe -> design -> live
      var phase;
      if (p < 0.50) phase = 0;             // wireframe
      else if (p < 0.72) phase = 1;        // design
      else phase = 2;                       // live
      if (phase !== lastPhase) {
        if (phase === 0) drawWireframe();
        else if (phase === 1) drawDesign();
        else drawLive();
        lastPhase = phase;
      }

      // Phase 5 (0.85 - 1.00): dolly in + rotate back for hero close-up
      var t5 = smoothstep(0.85, 1.00, p);
      camera.position.z = lerp(6.4, 4.9, t5);
      camera.position.y = lerp(0.6, 0.4, t5);
      laptop.rotation.y = lerp(laptop.rotation.y, 0, t5);
      laptop.rotation.x = lerp(laptop.rotation.x, 0, t5);

      // Copy stages: show one at a time
      // 0: 0.00-0.22 (cover), 1: 0.22-0.50 (wireframe), 2: 0.50-0.75 (design), 3: 0.75-1.00 (live)
      var thresholds = [
        [0.00, 0.22],
        [0.22, 0.50],
        [0.50, 0.75],
        [0.75, 1.00]
      ];
      stages.forEach(function (el, i) {
        var range = thresholds[i] || [0, 0];
        var inRange = p >= range[0] && p < range[1];
        var opac, y;
        if (inRange) {
          var local = (p - range[0]) / (range[1] - range[0]);
          opac = smoothstep(0, 0.15, local) - smoothstep(0.85, 1, local);
          y = lerp(20, -20, local);
        } else {
          opac = 0;
          y = p < range[0] ? 30 : -30;
        }
        el.style.opacity = opac;
        el.style.transform = 'translateY(' + y + 'px)';
      });

      // Progress bar
      if (progressFill) progressFill.style.width = (p * 100) + '%';
      if (progressStops.length) {
        var stopThresholds = [0, 0.33, 0.66, 0.99];
        progressStops.forEach(function (s, i) {
          s.classList.toggle('is-hit', p >= stopThresholds[i]);
        });
      }
    }

    /* ── Render loop ────────────────────────────────────── */
    var t = 0;
    var lastProgress = -1;
    function render() {
      t += 0.008;
      // Only recompute progress if scrolled
      var p = computeProgress();
      if (Math.abs(p - lastProgress) > 0.0005) {
        applyState(p);
        lastProgress = p;
      }
      // Idle bob & particle drift (subtle life)
      laptop.position.y = Math.sin(t * 0.8) * 0.02;
      particles.rotation.y += 0.002;
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }
    render();

    /* Init copy stages baseline */
    stages.forEach(function (el, i) {
      el.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
      el.style.opacity = i === 0 ? 1 : 0;
      el.style.transform = 'translateY(0px)';
    });

    /* Reduced motion */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      hinge.rotation.x = 0;
      cover.material.opacity = 0;
      coverFill.material.opacity = 0;
      particles.material.opacity = 0;
      drawLive();
    }
  };
}());
