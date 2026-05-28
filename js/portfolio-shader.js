/* ═══════════════════════════════════════════════════════════
   HN Services — Portfolio Section Background Shader
   Awwwards-Level: Calm Domain-Warped FBM Dark Fluid
   Reactive to time, scroll, and smooth mouse-spotlight LERP.
   100% WebGL 1.0 Compatible.
   Pauses via IntersectionObserver when off-screen.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  window.initPortfolioShader = function () {
    var canvas = document.getElementById('portfolio-canvas');
    if (!canvas || !window.WebGLRenderingContext) return;

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
      'uniform float u_scroll;',
      'uniform vec2 u_mouse;', /* Smooth mouse coordinate (0..1) */
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
      '  for(int i=0;i<4;i++){',
      '    v += a*noise(p);',
      '    p  = p*2.0 + vec2(1.7,9.2);',
      '    a *= 0.5;',
      '  }',
      '  return v;',
      '}',

      'void main(){',
      '  vec2 uv = v_uv;',
      '  float t = u_time * 0.08;',

      /* 1. Interactive Mouse Distortion */
      '  vec2 mouseDist = uv - u_mouse;',
      '  float d = length(mouseDist);',
      '  float force = smoothstep(0.40, 0.0, d);',
      '  vec2 distortedUV = uv + mouseDist * force * 0.15;',

      /* 2. Slow organic domain warped FBM fluid */
      '  float scrollFactor = u_scroll * 0.5;',
      '  vec2 q = vec2(',
      '    fbm(distortedUV * 1.5 + t + scrollFactor),',
      '    fbm(distortedUV * 1.5 + vec2(5.2,1.3) - t * 0.8)',
      '  );',
      '  vec2 r = vec2(',
      '    fbm(distortedUV + 2.0*q + vec2(1.7,9.2) + t * 0.5),',
      '    fbm(distortedUV + 2.0*q + vec2(8.3,2.8) - t * 0.3)',
      '  );',
      '  float f = fbm(distortedUV + 2.5*r);',

      /* 3. Luxurious Brand Color ramp */
      '  vec3 colBase   = vec3(0.03, 0.03, 0.02);', /* Obsidian black */
      '  vec3 colGlow   = vec3(0.08, 0.14, 0.02);', /* Dark olive-green */
      '  vec3 colAccent = vec3(0.788, 0.953, 0.114);', /* Brand Acid Lime (#C9F31D) */

      '  vec3 col = mix(colBase, colGlow, clamp(f * f * 3.5, 0.0, 1.0));',
      '  col = mix(col, colAccent * 0.70, clamp(pow(f, 3.5) * 5.0, 0.0, 1.0));',

      /* 4. Mouse Interactive Spotlight Glow */
      '  float mouseGlow = smoothstep(0.38, 0.0, d);',
      '  vec3 spotColor = colAccent * (0.45 + 0.55 * f);',
      '  col += spotColor * mouseGlow * 0.55;',

      /* Darken slightly for moody luxury atmosphere */
      '  col *= 0.68;',

      /* 5. Circular vignette to ensure card text remains highly readable */
      '  vec2 vp = (uv - 0.5) * 2.0;',
      '  col *= 1.0 - clamp(dot(vp, vp)*0.45, 0.0, 1.0);',

      /* 6. Soft top and bottom fades for smooth section boundary blend */
      '  float fade = smoothstep(0.0, 0.22, uv.y) * smoothstep(1.0, 0.78, uv.y);',

      '  gl_FragColor = vec4(col, u_alpha * fade);',
      '}'
    ].join('\n');

    // Shader compiler helper
    function compile(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error("Shader compiler error: ", gl.getShaderInfoLog(s));
      }
      return s;
    }

    var prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("Shader program linking error.");
      canvas.style.visibility = 'hidden';
      return;
    }

    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    
    var aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    var uTime   = gl.getUniformLocation(prog, 'u_time');
    var uAlpha  = gl.getUniformLocation(prog, 'u_alpha');
    var uScroll = gl.getUniformLocation(prog, 'u_scroll');
    var uMouse  = gl.getUniformLocation(prog, 'u_mouse');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    var running = false;
    var alpha   = 0;
    var target  = 0.82;
    var start   = performance.now();
    var scrollVal = 0;

    var mouseX = 0.5, mouseY = 0.5;
    var targetX = 0.5, targetY = 0.5;

    var portfolioSection = document.getElementById('portfolio');

    function onMouseMove(e) {
      if (!running) return;
      var rect = canvas.getBoundingClientRect();
      targetX = (e.clientX - rect.left) / rect.width;
      targetY = 1.0 - (e.clientY - rect.top) / rect.height;
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    function tick() {
      if (!running) return;
      requestAnimationFrame(tick);

      // Track scroll progress strictly within the portfolio container height bounds
      if (portfolioSection) {
        var startY = portfolioSection.offsetTop;
        var totalHeight = portfolioSection.offsetHeight - window.innerHeight;
        var scrolled = window.scrollY - startY;
        if (totalHeight > 0) {
          scrollVal = Math.min(1.0, Math.max(0.0, scrolled / totalHeight));
        }
      }

      // Easing LERP for smooth organic mouse trailing
      mouseX += (targetX - mouseX) * 0.08;
      mouseY += (targetY - mouseY) * 0.08;

      alpha += (target - alpha) * 0.045;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, (performance.now() - start) * 0.001);
      gl.uniform1f(uAlpha, alpha);
      gl.uniform1f(uScroll, scrollVal);
      gl.uniform2f(uMouse, mouseX, mouseY);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    if (portfolioSection && 'IntersectionObserver' in window) {
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
      }, { threshold: 0.01 }).observe(portfolioSection);
    } else {
      running = true;
      tick();
    }
  };

}());
