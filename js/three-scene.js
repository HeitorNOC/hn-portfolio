/* ═══════════════════════════════════════════════════════════
   HN Services — Particle Globe
   Scattered: Orano-style full-viewport atmospheric particle cloud
   Formed:    Luminous planet globe with lat-lon wireframe grid
   On load: atmospheric cloud coalesces into globe.
   Scroll drives disassembly → cloud, then reforms at page end.
   Mouse spotlight reveals nearby particles in scattered state.
   ═══════════════════════════════════════════════════════════ */
(function () {

  /* ── Vertex shader ───────────────────────────────────────── */
  var vert = `
    attribute vec3  aTarget;
    attribute float aSize;
    attribute float aSeed;

    uniform float uMorph;
    uniform float uTime;
    uniform float uAlpha;
    uniform vec2  uMouse;    /* NDC -1..1 */

    varying float vBright;
    varying float vMorph;

    void main() {
      float m = smoothstep(0.0, 1.0, uMorph);
      vMorph  = m;

      /* Organic wind drift — active only in scattered/cloud state */
      float wind = 1.0 - m;
      vec3 drift = vec3(
        sin(aSeed * 13.41 + uTime * 0.15) * wind * 3.2,
        cos(aSeed *  9.17 + uTime * 0.12) * wind * 2.5
          + sin(uTime * 0.07 + aSeed * 2.71) * wind * 1.1,
        sin(aSeed *  6.83 + uTime * 0.10) * wind * 1.8
      );

      vec3 scattered = position + drift;
      vec3 pos = mix(scattered, aTarget, m);
      vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);

      /* Mouse spotlight — Orano-style: brightens particles near cursor */
      vec4 clip  = projectionMatrix * mvPos;
      vec2 ndc   = clip.xy / clip.w;
      float mdist = length(ndc - uMouse);
      float spot  = smoothstep(0.60, 0.0, mdist) * wind * 0.92;

      /* Point size — larger when formed (globe) */
      float sz = mix(aSize * 0.42, aSize * 1.30, m);
      gl_PointSize = sz * (285.0 / -mvPos.z);
      gl_Position  = projectionMatrix * mvPos;

      /* Brightness: dim cloud (spotlight lifts it), vivid globe */
      vBright = mix(0.12, 1.0, m * m) + spot;
    }
  `;

  /* ── Fragment shader ─────────────────────────────────────── */
  var frag = `
    uniform float uAlpha;
    varying float vBright;
    varying float vMorph;

    void main() {
      float d = length(gl_PointCoord - 0.5);
      if (d > 0.5) discard;

      /* Soft circular glow falloff */
      float soft = 1.0 - smoothstep(0.10, 0.50, d);

      /* Warm white stars → acid-lime globe */
      vec3 starCol = vec3(0.97, 0.95, 0.91);
      vec3 limeCol = vec3(0.788, 0.953, 0.114);
      float t   = smoothstep(0.18, 0.88, vMorph);
      vec3  col = mix(starCol, limeCol, t);

      gl_FragColor = vec4(col * vBright, soft * uAlpha);
    }
  `;

  /* ════════════════════════════════════════════════════════════
     Main entry point — called from main.js
   ════════════════════════════════════════════════════════════ */
  window.initThreeScene = function () {
    if (!window.THREE) return null;
    var canvas = document.getElementById('webgl-canvas');
    if (!canvas) return null;
    var triggerAnimateResume = null;

    /* ── Renderer ─────────────────────────────────────────── */
    var renderer = new THREE.WebGLRenderer({
      canvas: canvas, alpha: true, antialias: false,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);

    var scene  = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(44, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 88;

    /* ── Mouse ────────────────────────────────────────────── */
    var mx = 0, my = 0, camX = 0, camY = 0;
    var mNDC = new THREE.Vector2(0, 0);
    window.addEventListener('mousemove', function (e) {
      mx = (e.clientX / window.innerWidth  - 0.5) * 2;
      my = -(e.clientY / window.innerHeight - 0.5) * 2;
      mNDC.set(mx, my);
    }, { passive: true });

    /* ── Particle data ────────────────────────────────────── */
    var N     = 5000;
    var posA  = new Float32Array(N * 3);   /* atmospheric cloud    */
    var posB  = new Float32Array(N * 3);   /* globe surface + grid */
    var sizes = new Float32Array(N);
    var seeds = new Float32Array(N);

    /* ━━━ SEEDS — all particles ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    for (var i = 0; i < N; i++) {
      seeds[i] = Math.random();
    }

    /* ━━━ SCATTERED (posA): Orano full-viewport cloud ━━━━━━━
       Camera at z=88, FOV 44°, cloud offset -4.
       At cloud centre (world z=-4), distance = 92 units.
       Visible half-height = 92 * tan(22°) ≈ 37 units  → 74 full
       Visible half-width  = 37 * aspect ≈ 66 units     → 132 full
       Spread ~20% beyond viewport + depth layers for parallax. */
    for (var i = 0; i < N; i++) {
      posA[i*3]     = (Math.random() - 0.5) * 158;     /* x */
      posA[i*3 + 1] = (Math.random() - 0.5) *  96;     /* y */
      posA[i*3 + 2] = (Math.random() - 0.5) *  68 - 8; /* z depth layers */
    }

    /* ━━━ FORMED (posB): Globe with lat-lon wireframe ━━━━━━━
       Globe radius GR = 16 units.
       Particle budget split:
         55 % → uniform sphere surface   (2750 particles)
         25 % → 9 latitude parallels     (1250 particles, ~138 each)
         20 % → 12 meridians             (1000 particles, ~83 each)

       All use Y-up convention so the globe spins correctly
       around cloud.rotation.y (north pole stays at top).        */
    var GR    = 16;
    var surfN = Math.floor(N * 0.55); /* 2750 */
    var latN  = Math.floor(N * 0.25); /* 1250 */
    /* lonN = N - surfN - latN = 1000 */

    /* — Sphere surface (uniform via latitude trick) — */
    for (var i = 0; i < surfN; i++) {
      var lon    = Math.random() * Math.PI * 2;
      var sinLat = 2.0 * Math.random() - 1.0;   /* uniform in [-1,1] */
      var cosLat = Math.sqrt(1.0 - sinLat * sinLat);
      var r      = GR + (Math.random() - 0.5) * 0.55;
      posB[i*3]     = r * cosLat * Math.cos(lon);
      posB[i*3 + 1] = r * sinLat;
      posB[i*3 + 2] = r * cosLat * Math.sin(lon);
      sizes[i] = 0.9 + Math.random() * 2.1;
    }

    /* — Latitude parallels — 9 circles — */
    var latLines  = 9;
    var latPPL    = Math.floor(latN / latLines);           /* ~138 */
    var latDegs   = [-72, -54, -36, -18, 0, 18, 36, 54, 72];
    for (var l = 0; l < latLines; l++) {
      var latRad = latDegs[l] * Math.PI / 180;
      var rLat   = GR * Math.cos(latRad);
      var yLat   = GR * Math.sin(latRad);
      for (var j = 0; j < latPPL; j++) {
        var idx = surfN + l * latPPL + j;
        if (idx >= surfN + latN) break;
        var lon2 = (j / latPPL) * Math.PI * 2;
        posB[idx*3]     = rLat * Math.cos(lon2);
        posB[idx*3 + 1] = yLat;
        posB[idx*3 + 2] = rLat * Math.sin(lon2);
        sizes[idx] = 0.50 + Math.random() * 0.55;  /* fine grid lines */
      }
    }

    /* — Meridians — 12 longitude lines at 30° spacing — */
    var lonLines = 12;
    var lonPPL   = Math.floor((N - surfN - latN) / lonLines); /* ~83 */
    for (var l = 0; l < lonLines; l++) {
      var lonRad = (l / lonLines) * Math.PI * 2;
      for (var j = 0; j < lonPPL; j++) {
        var idx = surfN + latN + l * lonPPL + j;
        if (idx >= N) break;
        var latR2 = ((j / (lonPPL - 1)) - 0.5) * Math.PI; /* -90° → 90° */
        posB[idx*3]     = GR * Math.cos(latR2) * Math.cos(lonRad);
        posB[idx*3 + 1] = GR * Math.sin(latR2);
        posB[idx*3 + 2] = GR * Math.cos(latR2) * Math.sin(lonRad);
        sizes[idx] = 0.48 + Math.random() * 0.50;
      }
    }

    /* ── Shader material ──────────────────────────────────── */
    var pMat = new THREE.ShaderMaterial({
      vertexShader:   vert,
      fragmentShader: frag,
      uniforms: {
        uMorph: { value: 0.0 },
        uTime:  { value: 0.0 },
        uAlpha: { value: 0.0 },
        uMouse: { value: mNDC }
      },
      transparent: true,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending
    });

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posA,  3));
    geo.setAttribute('aTarget',  new THREE.BufferAttribute(posB,  3));
    geo.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aSeed',    new THREE.BufferAttribute(seeds, 1));

    var cloud = new THREE.Points(geo, pMat);
    cloud.position.set(0, 0, -4);
    scene.add(cloud);

    /* ── Deep-field background stars ─────────────────────── */
    var starN   = 900;
    var starArr = new Float32Array(starN * 3);
    for (var i = 0; i < starN; i++) {
      starArr[i*3]     = (Math.random() - 0.5) * 440;
      starArr[i*3 + 1] = (Math.random() - 0.5) * 310;
      starArr[i*3 + 2] = (Math.random() - 0.5) * 90 - 55;
    }
    var starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starArr, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xF0EBE3, size: 0.17, transparent: true, opacity: 0.10,
      sizeAttenuation: true
    })));

    /* ── Equatorial glow ring (appears when globe forms) ─── */
    var ringMat = new THREE.MeshBasicMaterial({
      color: 0xC9F31D, transparent: true, opacity: 0
    });
    var ring = new THREE.Mesh(
      new THREE.TorusGeometry(17, 0.12, 8, 120),
      ringMat
    );
    ring.rotation.x = 1.08;
    ring.position.set(0, 0, -30);
    scene.add(ring);

    /* ── Resize ───────────────────────────────────────────── */
    window.addEventListener('resize', function () {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }, { passive: true });

    /* ════════════════════════════════════════════════════════
       setupScrollAnimations — wired by animations.js after load
     ════════════════════════════════════════════════════════ */
    function setupScrollAnimations() {
      if (!window.gsap || !window.ScrollTrigger) return;

      /* 1. Atmospheric cloud fade in */
      gsap.to(pMat.uniforms.uAlpha, {
        value: 1.0, duration: 2.0, ease: 'power2.out', delay: 0.2
      });

      /* 2. Cloud coalesces into globe */
      gsap.to(pMat.uniforms.uMorph, {
        value: 1.0, duration: 3.2, ease: 'expo.out', delay: 0.6,
        onUpdate: function () {
          /* Trigger text particles when globe reaches ~95% formed */
          if (!this._earlyTriggered && pMat.uniforms.uMorph.value >= 0.95) {
            this._earlyTriggered = true;
            if (window.triggerHeroReveal) window.triggerHeroReveal();
          }
        },
        onComplete: function () {
          gsap.to(ringMat, { opacity: 0.022, duration: 1.5 });

          /* Ensure trigger fires even if onUpdate missed it */
          if (window.triggerHeroReveal) window.triggerHeroReveal();

          /* 3. Globe dissolves as the manifesto/about section enters view.
             Start dissolving early (manifesto section) so it's fully gone
             by the time they are reading manifesto/about. Hide canvas immediately
             after alpha reaches zero instead of waiting for onLeave. */
          var manifestoEl = document.getElementById('manifesto');
          var sobreEl     = document.getElementById('sobre');
          var triggerEl   = manifestoEl || sobreEl;
          if (triggerEl) {
            gsap.timeline({
              scrollTrigger: {
                trigger:             triggerEl,
                start:               'top 80%',
                end:                 'bottom 30%',
                scrub:               1.2,
                invalidateOnRefresh: true
              }
            })
            .to(pMat.uniforms.uMorph, { value: 0.0, ease: 'power2.in' }, 0)
            .to(pMat.uniforms.uAlpha, {
              value: 0.0, ease: 'power2.in',
              onUpdate: function () {
                /* As soon as fully transparent, hide canvas to free GPU */
                if (pMat.uniforms.uAlpha.value < 0.01) {
                  canvas.style.visibility = 'hidden';
                } else {
                  canvas.style.visibility = 'visible';
                  if (typeof triggerAnimateResume === 'function') {
                    triggerAnimateResume();
                  }
                }
              }
            }, 0)
            .to(ringMat, { opacity: 0, ease: 'power1.in' }, 0);
          }
        }
      });
    }

    /* ── Screen position (used by lightning) ──────────────── */
    var _pv = new THREE.Vector3();
    function updateScreenPos() {
      _pv.copy(cloud.position);
      _pv.project(camera);
      window.HN = window.HN || {};
      window.HN.crystalScreenPos = {
        x: (_pv.x + 1) * 0.5 * window.innerWidth,
        y: (-_pv.y + 1) * 0.5 * window.innerHeight,
        visible: pMat.uniforms.uAlpha.value > 0.05
      };
    }

    /* ── Render loop ──────────────────────────────────────── */
    var t = 0;
    var running = true;
    var rafId = null;

    function animate() {
      if (canvas.style.visibility === 'hidden') {
        running = false;
        rafId = null;
        return;
      }
      rafId = requestAnimationFrame(animate);
      t += 0.0055;

      camX += (mx - camX) * 0.012;
      camY += (my - camY) * 0.012;

      var m = pMat.uniforms.uMorph.value;

      /* Globe spins around Y-axis like Earth; faster when cloud */
      cloud.rotation.y += (0.0058 - m * 0.0040) + camX * 0.003;
      cloud.rotation.x += (0.0007 - m * 0.0005) + camY * 0.0015;

      pMat.uniforms.uTime.value = t;

      ring.rotation.z = t * 0.007;

      camera.position.x += (camX * 1.8 - camera.position.x) * 0.008;
      camera.position.y += (camY * 1.4 - camera.position.y) * 0.008;

      updateScreenPos();

      /* Skip GPU draw calls once globe has fully dissolved — saves
         ~4 ms/frame of shader cost while user is reading other sections. */
      if (pMat.uniforms.uAlpha.value > 0.005) {
        renderer.render(scene, camera);
      }
    }

    triggerAnimateResume = function () {
      if (!running) {
        running = true;
        if (!rafId) {
          animate();
        }
      }
    };

    // Start animate loop
    animate();

    return { setupScrollAnimations: setupScrollAnimations, crystal: cloud };
  };

}());
