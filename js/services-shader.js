/* ═══════════════════════════════════════════════════════════
   HN Services — Services Section Smoke Shader
   Lightweight WebGL smokescreen for the services background.
   Pauses rendering when off-screen via IntersectionObserver.
   ═══════════════════════════════════════════════════════════ */
(function () {

  window.initServicesShader = function () {
    var canvas = document.getElementById('svc-smoke');
    if (!canvas) return;
    if (!window.WebGLRenderingContext) { canvas.style.visibility = 'hidden'; return; }

    /* Half-resolution for performance; CSS scales up */
    var W = 512, H = 384;
    canvas.width  = W;
    canvas.height = H;

    var gl = canvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power' });
    if (!gl) { canvas.style.visibility = 'hidden'; return; }

    var vsrc = `
      attribute vec2 a_pos;
      varying vec2 v_uv;
      void main() {
        v_uv = a_pos * 0.5 + 0.5;
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;

    var fsrc = `
      precision mediump float;
      uniform float u_time;
      uniform float u_alpha;
      varying vec2 v_uv;

      float hash(vec2 p) {
        p = fract(p * vec2(234.34, 435.35));
        p += dot(p, p + 34.23);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1,0)), f.x),
          mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x),
          f.y
        );
      }

      float fbm(vec2 p) {
        float v = 0.0, a = 0.5;
        mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
        for (int i = 0; i < 4; i++) {
          v += a * noise(p);
          p = m * p;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv = v_uv;
        float t = u_time * 0.038;

        vec2 q = vec2(fbm(uv + t), fbm(uv + vec2(5.2, 1.3)));
        float f = fbm(uv + 3.0 * q + vec2(1.7 + t * 0.25, 9.2));

        vec3 col = mix(vec3(0.02, 0.02, 0.02),
                       vec3(0.07, 0.12, 0.02),
                       clamp(f * f * 4.5, 0.0, 1.0));
        col = mix(col, vec3(0.32, 0.50, 0.06),
                  clamp(f * f * f * 8.0 - 0.5, 0.0, 1.0));

        vec2 e = (v_uv - 0.5) * 2.0;
        float vig = 1.0 - smoothstep(0.25, 0.95, dot(e * vec2(1.0, 0.7), e * vec2(1.0, 0.7)));

        gl_FragColor = vec4(col, f * 0.58 * vig * u_alpha);
      }
    `;

    function compileShader(type, src) {
      var sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    }

    var prog = gl.createProgram();
    gl.attachShader(prog, compileShader(gl.VERTEX_SHADER,   vsrc));
    gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fsrc));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      canvas.style.visibility = 'hidden'; return;
    }
    gl.useProgram(prog);

    /* Fullscreen quad */
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    var posLoc   = gl.getAttribLocation(prog,  'a_pos');
    var timeLoc  = gl.getUniformLocation(prog, 'u_time');
    var alphaLoc = gl.getUniformLocation(prog, 'u_alpha');

    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.viewport(0, 0, W, H);

    var time = 0, alpha = 0, running = false, raf = null;

    function render() {
      if (!running) { raf = null; return; }
      time += 0.016;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(timeLoc,  time);
      gl.uniform1f(alphaLoc, alpha);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    }

    /* Only run when visible — saves GPU on other sections */
    if (window.IntersectionObserver) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            canvas.style.visibility = 'visible';
            running = true;
            alpha   = 0.80;
            if (!raf) render();
          } else {
            canvas.style.visibility = 'hidden';
            running = false;
            alpha   = 0;
          }
        });
      }, { rootMargin: '80px' });
      observer.observe(canvas);
    } else {
      running = true; alpha = 0.80; render();
    }
  };

}());
