/* ═══════════════════════════════════════════════════════════
   HN Services — Website Reveal Scene (v3)
   Realistic procedural laptop (rounded corners, PBR aluminum,
   individual keys, trackpad, env reflections) with optional
   GLTF override via window.HN_LAPTOP_MODEL_URL. Scroll-driven
   4-phase cinematic: cover → wireframe → design → live.
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

    var scene = new THREE.Scene();
    scene.background = null;

    var camera = new THREE.PerspectiveCamera(32, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, 0.6, 6.6);
    camera.lookAt(0, 0, 0);

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(dpr);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    /* ── Environment map (procedural HDR-ish) ─────────────
       PMREMGenerator turns a small scene into a reflection map
       giving the aluminum shell real material response.        */
    function buildEnvMap() {
      var envScene = new THREE.Scene();
      // Vertical gradient sky using a large box with vertex colors
      var geo = new THREE.BoxGeometry(20, 20, 20);
      var colors = [];
      var pos = geo.attributes.position;
      for (var i = 0; i < pos.count; i++) {
        var y = pos.getY(i);
        var t = (y + 10) / 20;
        // dark bottom, warm mid, lime top
        var r = 0.04 + 0.10 * t + 0.35 * Math.pow(t, 3);
        var g = 0.06 + 0.12 * t + 0.65 * Math.pow(t, 3);
        var b = 0.08 + 0.08 * t + 0.10 * Math.pow(t, 3);
        colors.push(r, g, b);
      }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      var mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide });
      envScene.add(new THREE.Mesh(geo, mat));
      // 4 accent lights around
      envScene.add(new THREE.PointLight(0xC9F31D, 8, 20).translateX(4));
      envScene.add(new THREE.PointLight(0xffffff, 4, 20).translateY(6));
      envScene.add(new THREE.PointLight(0x88ccff, 3, 20).translateX(-4));

      var pmrem = new THREE.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      var envTex = pmrem.fromScene(envScene, 0.04).texture;
      pmrem.dispose();
      return envTex;
    }
    var envMap = buildEnvMap();
    scene.environment = envMap;

    /* ── Lights ─────────────────────────────────────────── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    var key = new THREE.DirectionalLight(0xC9F31D, 1.0);
    key.position.set(3, 4, 4);
    scene.add(key);
    var rim = new THREE.DirectionalLight(0xffffff, 0.55);
    rim.position.set(-4, 2, -2);
    scene.add(rim);
    var fill = new THREE.DirectionalLight(0xC9F31D, 0.35);
    fill.position.set(0, -2, 3);
    scene.add(fill);

    /* ── Utility: rounded rectangle Shape ────────────────── */
    function roundedRectShape(w, h, r) {
      var shape = new THREE.Shape();
      var x = -w / 2, y = -h / 2;
      shape.moveTo(x + r, y);
      shape.lineTo(x + w - r, y);
      shape.quadraticCurveTo(x + w, y, x + w, y + r);
      shape.lineTo(x + w, y + h - r);
      shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      shape.lineTo(x + r, y + h);
      shape.quadraticCurveTo(x, y + h, x, y + h - r);
      shape.lineTo(x, y + r);
      shape.quadraticCurveTo(x, y, x + r, y);
      return shape;
    }

    /* ── Materials ──────────────────────────────────────── */
    var aluminum = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.88,
      roughness: 0.32,
      envMapIntensity: 1.2
    });
    var deepBlack = new THREE.MeshStandardMaterial({
      color: 0x080808,
      metalness: 0.35,
      roughness: 0.75,
      envMapIntensity: 0.6
    });
    var keyMat = new THREE.MeshStandardMaterial({
      color: 0x141414,
      metalness: 0.15,
      roughness: 0.85,
      envMapIntensity: 0.4
    });
    var trackpadMat = new THREE.MeshStandardMaterial({
      color: 0x1c1c1c,
      metalness: 0.6,
      roughness: 0.28,
      envMapIntensity: 1.0
    });
    var accentMat = new THREE.MeshStandardMaterial({
      color: 0xC9F31D,
      emissive: 0xC9F31D,
      emissiveIntensity: 1.2,
      metalness: 0,
      roughness: 0.4
    });

    /* ── Laptop group ───────────────────────────────────── */
    var laptop = new THREE.Group();
    scene.add(laptop);

    // ── BASE (rounded, extruded) ────────────────────────
    var baseW = 3.2, baseD = 2.15, baseThick = 0.13;
    var baseShape = roundedRectShape(baseW, baseD, 0.14);
    var baseGeo = new THREE.ExtrudeGeometry(baseShape, {
      depth: baseThick, bevelEnabled: true, bevelSegments: 6,
      bevelSize: 0.015, bevelThickness: 0.015, curveSegments: 12
    });
    baseGeo.rotateX(-Math.PI / 2);
    baseGeo.translate(0, -0.65, 0);
    var base = new THREE.Mesh(baseGeo, aluminum);
    laptop.add(base);

    // Palm rest / keyboard deck (dark inset)
    var deckShape = roundedRectShape(baseW - 0.15, baseD - 0.15, 0.08);
    var deckGeo = new THREE.ExtrudeGeometry(deckShape, {
      depth: 0.004, bevelEnabled: false, curveSegments: 8
    });
    deckGeo.rotateX(-Math.PI / 2);
    deckGeo.translate(0, -0.51, 0.02);
    var deck = new THREE.Mesh(deckGeo, deepBlack);
    laptop.add(deck);

    // ── KEYBOARD (individual keys) ──────────────────────
    var kbdGroup = new THREE.Group();
    kbdGroup.position.set(0, -0.505, -0.20);
    laptop.add(kbdGroup);

    var keyGeo = new THREE.BoxGeometry(0.16, 0.04, 0.16);
    var kbdCols = 14, kbdRows = 5;
    var keyGap = 0.023;
    var totalKbdW = kbdCols * (0.16 + keyGap) - keyGap;
    var totalKbdD = kbdRows * (0.16 + keyGap) - keyGap;
    for (var kr = 0; kr < kbdRows; kr++) {
      for (var kc = 0; kc < kbdCols; kc++) {
        var kx = -totalKbdW / 2 + kc * (0.16 + keyGap) + 0.08;
        var kz = -totalKbdD / 2 + kr * (0.16 + keyGap) + 0.08;
        var kMesh = new THREE.Mesh(keyGeo, keyMat);
        kMesh.position.set(kx, 0, kz);
        kbdGroup.add(kMesh);
      }
    }

    // ── TRACKPAD ────────────────────────────────────────
    var trackpadShape = roundedRectShape(1.1, 0.7, 0.06);
    var trackpadGeo = new THREE.ExtrudeGeometry(trackpadShape, {
      depth: 0.002, bevelEnabled: false, curveSegments: 8
    });
    trackpadGeo.rotateX(-Math.PI / 2);
    trackpadGeo.translate(0, -0.503, 0.62);
    var trackpad = new THREE.Mesh(trackpadGeo, trackpadMat);
    laptop.add(trackpad);

    // Trackpad subtle border line (accent)
    var tpBorderGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.1, 0.003, 0.7));
    var tpBorder = new THREE.LineSegments(tpBorderGeo, new THREE.LineBasicMaterial({
      color: 0x2a2a2a, transparent: true, opacity: 0.6
    }));
    tpBorder.position.set(0, -0.502, 0.62);
    laptop.add(tpBorder);

    // ── SCREEN LID (hinged group) ──────────────────────
    var hinge = new THREE.Group();
    hinge.position.set(0, -0.58, -1.06);
    laptop.add(hinge);

    // Lid outer shell (rounded, extruded)
    var lidW = 3.2, lidH = 2.0, lidThick = 0.10;
    var lidShape = roundedRectShape(lidW, lidH, 0.10);
    var lidGeo = new THREE.ExtrudeGeometry(lidShape, {
      depth: lidThick, bevelEnabled: true, bevelSegments: 5,
      bevelSize: 0.012, bevelThickness: 0.012, curveSegments: 12
    });
    lidGeo.translate(0, 1.0, -lidThick);
    var lid = new THREE.Mesh(lidGeo, aluminum);
    hinge.add(lid);

    // Screen bezel (frame ring around screen)
    var bezelOuter = roundedRectShape(3.0, 1.86, 0.06);
    var bezelInner = new THREE.Path();
    var iw = 2.86, ih = 1.72, ir = 0.03;
    var ix = -iw / 2, iy = -ih / 2;
    bezelInner.moveTo(ix + ir, iy);
    bezelInner.lineTo(ix + iw - ir, iy);
    bezelInner.quadraticCurveTo(ix + iw, iy, ix + iw, iy + ir);
    bezelInner.lineTo(ix + iw, iy + ih - ir);
    bezelInner.quadraticCurveTo(ix + iw, iy + ih, ix + iw - ir, iy + ih);
    bezelInner.lineTo(ix + ir, iy + ih);
    bezelInner.quadraticCurveTo(ix, iy + ih, ix, iy + ih - ir);
    bezelInner.lineTo(ix, iy + ir);
    bezelInner.quadraticCurveTo(ix, iy, ix + ir, iy);
    bezelOuter.holes.push(bezelInner);
    var bezelGeo = new THREE.ExtrudeGeometry(bezelOuter, {
      depth: 0.02, bevelEnabled: false, curveSegments: 8
    });
    bezelGeo.translate(0, 1.0, 0);
    var bezel = new THREE.Mesh(bezelGeo, deepBlack);
    hinge.add(bezel);

    // Screen glow (behind, wider than screen, emissive)
    var glowGeo = new THREE.PlaneGeometry(3.4, 2.2);
    var glowMat = new THREE.MeshBasicMaterial({
      color: 0xC9F31D, transparent: true, opacity: 0.0,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    var screenGlow = new THREE.Mesh(glowGeo, glowMat);
    screenGlow.position.set(0, 1.0, -0.05);
    hinge.add(screenGlow);

    // ── SCREEN CONTENT (canvas texture) ────────────────
    var screenCanvas = document.createElement('canvas');
    screenCanvas.width = 1024; screenCanvas.height = 640;
    var sctx = screenCanvas.getContext('2d');
    var screenTex = new THREE.CanvasTexture(screenCanvas);
    screenTex.minFilter = THREE.LinearFilter;
    screenTex.magFilter = THREE.LinearFilter;
    screenTex.encoding = THREE.sRGBEncoding;

    var screenGeo = new THREE.PlaneGeometry(2.86, 1.72);
    var screenMat = new THREE.MeshBasicMaterial({ map: screenTex, transparent: true });
    var screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 1.0, 0.022);
    hinge.add(screenMesh);

    // Logo on the back of lid (small lime shape via mesh)
    var logoGeo = new THREE.CircleGeometry(0.12, 32);
    var logo = new THREE.Mesh(logoGeo, accentMat);
    logo.position.set(0, 1.0, -lidThick - 0.001);
    logo.rotation.y = Math.PI;
    hinge.add(logo);

    // ── COVER (wireframe box wrapping laptop) ───────────
    var coverGroup = new THREE.Group();
    laptop.add(coverGroup);
    var coverGeo = new THREE.BoxGeometry(3.7, 2.7, 2.5);
    var coverEdges = new THREE.EdgesGeometry(coverGeo);
    var coverMat = new THREE.LineBasicMaterial({ color: 0xC9F31D, transparent: true, opacity: 0.75 });
    var cover = new THREE.LineSegments(coverEdges, coverMat);
    cover.position.y = 0.20;
    coverGroup.add(cover);

    var coverFillMat = new THREE.MeshBasicMaterial({
      color: 0xC9F31D, transparent: true, opacity: 0.06, side: THREE.DoubleSide
    });
    var coverFill = new THREE.Mesh(coverGeo, coverFillMat);
    coverFill.position.y = 0.20;
    coverGroup.add(coverFill);

    // Floating particles inside cover (dust)
    var particlesGeo = new THREE.BufferGeometry();
    var pCount = 160;
    var positions = new Float32Array(pCount * 3);
    for (var i = 0; i < pCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 3.6;
      positions[i * 3 + 1] = (Math.random() - 0.3) * 2.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2.3;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var particlesMat = new THREE.PointsMaterial({
      color: 0xC9F31D, size: 0.025, transparent: true, opacity: 0.75
    });
    var particles = new THREE.Points(particlesGeo, particlesMat);
    coverGroup.add(particles);

    /* ── Optional GLTF override ──────────────────────────
       Set window.HN_LAPTOP_MODEL_URL = 'https://.../laptop.glb'
       BEFORE this script loads to replace the procedural
       laptop shell. Screen texture continues to work via a
       dedicated plane placed at the model's screen mesh. */
    if (window.HN_LAPTOP_MODEL_URL && THREE.GLTFLoader) {
      try {
        var loader = new THREE.GLTFLoader();
        if (THREE.DRACOLoader) {
          var draco = new THREE.DRACOLoader();
          draco.setDecoderPath('https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/js/libs/draco/');
          loader.setDRACOLoader(draco);
        }
        loader.load(window.HN_LAPTOP_MODEL_URL, function (gltf) {
          var model = gltf.scene;
          // Hide procedural laptop body (but keep hinge + screen + cover)
          [base, deck, kbdGroup, trackpad, tpBorder, lid, bezel, logo].forEach(function (m) {
            if (m) m.visible = false;
          });
          model.position.set(0, -0.5, 0);
          model.scale.setScalar(1);
          laptop.add(model);
        }, undefined, function (err) {
          console.warn('GLTF load failed, using procedural laptop:', err);
        });
      } catch (e) { console.warn('GLTF init error:', e); }
    }

    /* ── Screen frames drawer ──────────────────────────── */
    function drawWireframe() {
      sctx.fillStyle = '#0a0a0a';
      sctx.fillRect(0, 0, 1024, 640);
      sctx.strokeStyle = 'rgba(201, 243, 29, 0.5)';
      sctx.lineWidth = 2;
      sctx.setLineDash([6, 8]);
      for (var x = 40; x < 1024; x += 80) { sctx.beginPath(); sctx.moveTo(x, 20); sctx.lineTo(x, 620); sctx.stroke(); }
      for (var y = 40; y < 640; y += 80) { sctx.beginPath(); sctx.moveTo(20, y); sctx.lineTo(1004, y); sctx.stroke(); }
      sctx.setLineDash([]);
      sctx.strokeStyle = 'rgba(245, 240, 232, 0.6)';
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
      gh.addColorStop(0, 'rgba(201,243,29,0.38)');
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

    // Initial state
    hinge.rotation.x = -Math.PI / 2;
    drawWireframe();
    var lastPhase = 0;

    // Resize
    function resize() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    setTimeout(resize, 100);

    // Helpers
    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp01(t) { return Math.max(0, Math.min(1, t)); }
    function smoothstep(edge0, edge1, x) {
      var t = clamp01((x - edge0) / (edge1 - edge0));
      return t * t * (3 - 2 * t);
    }

    var stages = Array.prototype.slice.call(section.querySelectorAll('.reveal-stage'));
    var progressFill = section.querySelector('.reveal-progress__fill');
    var progressStops = section.querySelectorAll('.reveal-progress__stops span');

    function computeProgress() {
      var r = section.getBoundingClientRect();
      var travel = r.height - window.innerHeight;
      if (travel <= 0) return 0;
      var scrolled = Math.min(Math.max(-r.top, 0), travel);
      return scrolled / travel;
    }

    function applyState(p) {
      // Phase 1: cover lifts + fades
      var t1 = smoothstep(0.00, 0.22, p);
      cover.material.opacity = lerp(0.75, 0, t1);
      coverFill.material.opacity = lerp(0.06, 0, t1);
      particles.material.opacity = lerp(0.75, 0, smoothstep(0.05, 0.20, p));
      coverGroup.position.y = lerp(0, 2.6, t1);
      var cs = lerp(1, 1.4, t1);
      coverGroup.scale.set(cs, cs, cs);

      // Phase 2: hinge opens
      var t2 = smoothstep(0.22, 0.42, p);
      hinge.rotation.x = lerp(-Math.PI / 2, 0, t2);

      // Phase 3: angle change
      var t3 = smoothstep(0.40, 0.60, p);
      laptop.rotation.y = lerp(0, -0.45, t3);
      laptop.rotation.x = lerp(0, -0.08, t3);

      // Phase 4: screen content
      var phase;
      if (p < 0.50) phase = 0;
      else if (p < 0.72) phase = 1;
      else phase = 2;
      if (phase !== lastPhase) {
        if (phase === 0) drawWireframe();
        else if (phase === 1) drawDesign();
        else drawLive();
        lastPhase = phase;
      }

      // Screen glow ramps up with design/live
      var glowT = smoothstep(0.45, 0.85, p);
      screenGlow.material.opacity = 0.22 * glowT;

      // Phase 5: dolly in
      var t5 = smoothstep(0.85, 1.00, p);
      camera.position.z = lerp(6.6, 5.0, t5);
      camera.position.y = lerp(0.6, 0.4, t5);
      laptop.rotation.y = lerp(laptop.rotation.y, 0, t5);
      laptop.rotation.x = lerp(laptop.rotation.x, 0, t5);

      // Copy stages
      var thresholds = [[0.00, 0.22], [0.22, 0.50], [0.50, 0.75], [0.75, 1.00]];
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

      if (progressFill) progressFill.style.width = (p * 100) + '%';
      if (progressStops.length) {
        var stopThresholds = [0, 0.33, 0.66, 0.99];
        progressStops.forEach(function (s, i) {
          s.classList.toggle('is-hit', p >= stopThresholds[i]);
        });
      }
    }

    // Render
    var t = 0, lastProgress = -1;
    function render() {
      t += 0.008;
      var p = computeProgress();
      if (Math.abs(p - lastProgress) > 0.0005) {
        applyState(p);
        lastProgress = p;
      }
      laptop.position.y = Math.sin(t * 0.8) * 0.02;
      particles.rotation.y += 0.002;
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }
    render();

    stages.forEach(function (el, i) {
      el.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
      el.style.opacity = i === 0 ? 1 : 0;
      el.style.transform = 'translateY(0px)';
    });

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      hinge.rotation.x = 0;
      cover.material.opacity = 0;
      coverFill.material.opacity = 0;
      particles.material.opacity = 0;
      drawLive();
    }
  };
}());
