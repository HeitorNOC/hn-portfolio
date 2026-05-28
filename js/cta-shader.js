/* ═══════════════════════════════════════════════════════════
   HN Services — CTA Bridge Shader
   Ribbon Aurora: bright lime/white flowing lines in 3D space.
   Contrasts with manifesto's dark FBM fluid by being geometric,
   luminous, and high-energy — not organic.
   ═══════════════════════════════════════════════════════════ */
(function () {

  window.initCtaShader = function () {
    var canvas = document.getElementById('cta-canvas');
    if (!canvas || !window.WebGLRenderingContext) return;

    if (window.innerWidth <= 767) {
      canvas.style.display = 'none';
      return;
    }

    var gl = canvas.getContext('webgl', {
      alpha: true, antialias: true, powerPreference: 'high-performance'
    });
    if (!gl) { canvas.style.visibility = 'hidden'; return; }

    function resize() {
      var dpr = Math.min(2.0, window.devicePixelRatio || 1.0);
      var rect = canvas.getBoundingClientRect();
      var w = Math.round(rect.width * dpr);
      var h = Math.round(rect.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }
    window.addEventListener('resize', resize, { passive: true });
    resize();

    var vert = [
      'attribute vec2 a_pos;',
      'varying vec2 v_uv;',
      'void main(){',
      '  v_uv = a_pos * 0.5 + 0.5;',
      '  gl_Position = vec4(a_pos, 0.0, 1.0);',
      '}'
    ].join('\n');

    var frag = [
      'precision highp float;',
      'uniform float u_time;',
      'uniform float u_alpha;',
      'varying vec2 v_uv;',

      /* smooth glowing ribbon at position pos_y with given width */
      'float ribbon(float y, float pos_y, float w){',
      '  return smoothstep(w, 0.0, abs(y - pos_y));',
      '}',

      /* 3D-style grid line (perspectivic lines converging at horizon) */
      'float gridLine(vec2 uv, float freq, float width){',
      '  float x = fract(uv.x * freq);',
      '  return smoothstep(width, 0.0, min(x, 1.0 - x));',
      '}',

      'void main(){',
      '  vec2 uv = v_uv;',
      '  float t = u_time * 0.22;',

      /* ── Flowing horizontal ribbons ── */
      /* Each ribbon oscillates in Y with different frequencies */
      '  float r0y = 0.28 + sin(uv.x * 3.1 + t * 1.1) * 0.08 + sin(uv.x * 7.2 - t * 0.6) * 0.03;',
      '  float r1y = 0.50 + sin(uv.x * 2.4 - t * 0.9) * 0.10 + sin(uv.x * 5.8 + t * 0.8) * 0.04;',
      '  float r2y = 0.72 + sin(uv.x * 4.0 + t * 1.4) * 0.07 + sin(uv.x * 9.1 - t * 0.5) * 0.03;',

      '  float r0 = ribbon(uv.y, r0y, 0.022);',
      '  float r1 = ribbon(uv.y, r1y, 0.030);',
      '  float r2 = ribbon(uv.y, r2y, 0.018);',

      /* ── Perspective grid (depth) ── */
      /* Simulate 3D floor grid receding toward horizon at y=0.5 */
      '  float horizon = 0.50;',
      '  float depth = abs(uv.y - horizon) + 0.01;',
      '  float xGrid = gridLine(vec2(uv.x / depth, uv.y), 2.5, 0.008 * depth);',
      '  float yGrid = gridLine(vec2(uv.x, 1.0 / depth * 0.3), 6.0, 0.012 * depth);',
      '  float grid = max(xGrid, yGrid) * smoothstep(0.0, 0.4, depth);',

      /* ── Colors ── */
      '  vec3 lime  = vec3(0.788, 0.953, 0.114);',  /* #C9F31D */
      '  vec3 white = vec3(0.961, 0.941, 0.910);',  /* #F5F0E8 */
      '  vec3 dimL  = vec3(0.45,  0.55,  0.05);',   /* dim lime for grid */

      '  vec3 col = lime  * r0 * 0.95',
      '           + white * r1 * 0.70',
      '           + lime  * r2 * 0.80',
      '           + dimL  * grid * 0.30;',

      /* ── Top/bottom fade ── */
      '  float fade = smoothstep(0.0, 0.18, uv.y) * smoothstep(1.0, 0.82, uv.y);',

      /* ── Vignette (edges dark) ── */
      '  vec2 vp = (uv - 0.5) * 2.0;',
      '  float vign = 1.0 - clamp(dot(vp * vec2(0.6, 1.0), vp * vec2(0.6, 1.0)) * 0.4, 0.0, 1.0);',

      '  float intensity = (r0 + r1 + r2) * 1.1 + grid * 0.3;',
      '  float alpha = u_alpha * fade * vign * clamp(intensity, 0.0, 1.0);',

      '  gl_FragColor = vec4(col, alpha);',
      '}'
    ].join('\n');

    function compile(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER,   vert));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    var buf  = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    var uTime  = gl.getUniformLocation(prog, 'u_time');
    var uAlpha = gl.getUniformLocation(prog, 'u_alpha');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    var running = false;
    var alpha   = 0;
    var target  = 0.72;
    var start   = performance.now();

    function tick() {
      if (!running) return;
      requestAnimationFrame(tick);
      alpha += (target - alpha) * 0.04;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime,  (performance.now() - start) * 0.001);
      gl.uniform1f(uAlpha, alpha);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    var section = document.getElementById('cta-bridge');
    if (section && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          running = e.isIntersecting;
          target  = running ? 0.72 : 0;
          if (running) {
            canvas.style.visibility = 'visible';
            tick();
          } else {
            canvas.style.visibility = 'hidden';
          }
        });
      }, { threshold: 0.01 }).observe(section);
    } else {
      running = true;
      tick();
    }
  };

}());
