/* ═══════════════════════════════════════════════════════════
   HN Services — Manifesto Section Fluid Shader
   Domain-warped FBM — dark fluid with lime wisps.
   Pauses via IntersectionObserver when off-screen.
   ═══════════════════════════════════════════════════════════ */
(function () {

  window.initManifestoShader = function () {
    var canvas = document.getElementById('manifesto-canvas');
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

      'float hash(vec2 p){',
      '  p = fract(p * vec2(234.34, 435.35));',
      '  p += dot(p, p + 34.23);',
      '  return fract(p.x * p.y);',
      '}',

      'float noise(vec2 p){',
      '  vec2 i = floor(p), f = fract(p);',
      '  f = f*f*(3.0-2.0*f);',
      '  return mix(',
      '    mix(hash(i), hash(i+vec2(1.0,0.0)), f.x),',
      '    mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), f.x),',
      '    f.y);',
      '}',

      'float fbm(vec2 p){',
      '  float v=0.0, a=0.5;',
      '  for(int i=0;i<5;i++){',
      '    v += a*noise(p);',
      '    p  = p*2.0 + vec2(1.7,9.2);',
      '    a *= 0.5;',
      '  }',
      '  return v;',
      '}',

      'void main(){',
      '  vec2 uv = v_uv;',
      '  float t = u_time * 0.07;',

      /* double domain warp */
      '  vec2 q = vec2(',
      '    fbm(uv*1.1 + t*0.6),',
      '    fbm(uv*1.1 + vec2(5.2,1.3) + t*0.4)',
      '  );',
      '  vec2 r = vec2(',
      '    fbm(uv + 2.0*q + vec2(1.7,9.2) + t*0.3),',
      '    fbm(uv + 2.0*q + vec2(8.3,2.8) + t*0.2)',
      '  );',
      '  float f = fbm(uv + 2.5*r);',

      /* color ramp: near-black with barely-visible olive/lime wisps */
      '  vec3 col = mix(vec3(0.032,0.032,0.018), vec3(0.07,0.10,0.003),',
      '    clamp(f*f*3.5, 0.0, 1.0));',
      '  col = mix(col, vec3(0.17,0.24,0.006),',
      '    clamp(pow(f,3.5)*5.5, 0.0, 1.0));',
      '  col = mix(col, vec3(0.30,0.40,0.010),',
      '    clamp(pow(f,6.0)*4.0, 0.0, 0.14));',

      /* darken further so it reads as moody smoke, not a glow */
      '  col *= 0.72;',

      /* vignette — darker at edges */
      '  vec2 vp = (uv - 0.5) * 2.0;',
      '  col *= 1.0 - clamp(dot(vp, vp)*0.55, 0.0, 1.0);',

      /* generous top/bottom fade — blends cleanly into hero and next section */
      '  float fade = smoothstep(0.0,0.28,uv.y) * smoothstep(1.0,0.72,uv.y);',

      '  gl_FragColor = vec4(col, u_alpha * fade);',
      '}'
    ].join('\n');

    function compile(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    var buf = gl.createBuffer();
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
    var target  = 0.82;
    var start   = performance.now();

    function tick() {
      if (!running) return;
      requestAnimationFrame(tick);
      alpha += (target - alpha) * 0.035;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime,  (performance.now() - start) * 0.001);
      gl.uniform1f(uAlpha, alpha);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    var section = document.getElementById('manifesto');
    if (section && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          running = e.isIntersecting;
          target  = running ? 0.82 : 0;
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
