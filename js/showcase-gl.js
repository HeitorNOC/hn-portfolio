/**
 * showcase-gl.js
 * WebGL water-displacement effect for the portfolio showcase.
 * – Idle "breathing" ripple on image surface
 * – Mouse-reactive ripple following cursor position
 * – Liquid morph transition between slides (displacement wipe)
 *
 * No external libs — raw WebGL2 with fallback to WebGL1.
 */
(function () {
  'use strict';

  /* ─── Vertex shader ─────────────────────────────────────────── */
  var VERT = /* glsl */`
    attribute vec2 a_pos;
    varying   vec2 v_uv;
    void main(){
      v_uv = a_pos * .5 + .5;
      gl_Position = vec4(a_pos, 0., 1.);
    }
  `;

  /* ─── Fragment shader ───────────────────────────────────────── */
  var FRAG = /* glsl */`
    precision highp float;
    uniform sampler2D u_tex0;     /* current image  */
    uniform sampler2D u_tex1;     /* next image     */
    uniform float     u_time;
    uniform float     u_progress; /* 0→1 transition */
    uniform vec2      u_mouse;    /* normalised 0-1 */
    uniform float     u_mouseStr; /* 0→1 hover strength */
    uniform vec2      u_res;
    varying vec2      v_uv;

    /* ── Simplex-ish noise (Ashima Arts) ── */
    vec3 mod289(vec3 x){return x - floor(x*(1./289.))*289.;}
    vec2 mod289(vec2 x){return x - floor(x*(1./289.))*289.;}
    vec3 permute(vec3 x){return mod289(((x*34.)+1.)*x);}
    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187,0.366025403784439,
                         -0.577350269189626,0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.,0.) : vec2(0.,1.);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.,i1.y,1.))
               + i.x + vec3(0.,i1.x,1.));
      vec3 m = max(.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                             dot(x12.zw,x12.zw)), 0.);
      m = m*m; m = m*m;
      vec3 x  = 2.*fract(p*C.www) - 1.;
      vec3 h  = abs(x) - .5;
      vec3 ox = floor(x + .5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - .85373472095314*(a0*a0+h*h);
      vec3 g;
      g.x  = a0.x * x0.x   + h.x * x0.y;
      g.yz = a0.yz* x12.xz  + h.yz* x12.yw;
      return 130. * dot(m, g);
    }

    void main(){
      vec2 uv = v_uv;
      vec2 aspect = vec2(u_res.x / u_res.y, 1.);

      /* ── 1. Idle ripple (always active, low amplitude) ── */
      float idleNoise = snoise(uv * 3.5 + vec2(u_time * 0.18, u_time * 0.12));
      vec2  idleDisp  = vec2(idleNoise) * 0.004;

      /* ── 2. Mouse ripple ── */
      vec2  mDelta    = (uv - u_mouse) * aspect;
      float mDist     = length(mDelta);
      float mWave     = sin(mDist * 18.0 - u_time * 3.5) * exp(-mDist * 5.0);
      vec2  mouseDisp = normalize(mDelta + 0.001) * mWave * 0.028 * u_mouseStr;

      /* ── 3. Transition wipe ── */
      float p = u_progress;
      float transNoise = snoise(uv * 4.0 + vec2(u_time * 0.5));
      float wave = p + transNoise * 0.25;
      float softEdge = smoothstep(0.0, 0.35, wave - p + 0.175);
      /* combined displacement for transition */
      vec2 transDisp = vec2(snoise(uv * 6.0 + u_time), snoise(uv * 6.0 - u_time)) * 0.06 * sin(p * 3.14159);

      /* ── Final UV sampling ── */
      vec2 dispUV = uv + idleDisp + mouseDisp;

      vec4 col0 = texture2D(u_tex0, clamp(dispUV + transDisp, 0.001, 0.999));
      vec4 col1 = texture2D(u_tex1, clamp(dispUV - transDisp, 0.001, 0.999));

      gl_FragColor = mix(col0, col1, clamp(softEdge, 0., 1.));
    }
  `;

  /* ─── Helpers ───────────────────────────────────────────────── */
  function createShader(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('[showcase-gl] shader error:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  function createProgram(gl, vSrc, fSrc) {
    var v = createShader(gl, gl.VERTEX_SHADER, vSrc);
    var f = createShader(gl, gl.FRAGMENT_SHADER, fSrc);
    if (!v || !f) return null;
    var p = gl.createProgram();
    gl.attachShader(p, v); gl.attachShader(p, f);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.warn('[showcase-gl] link error:', gl.getProgramInfoLog(p));
      return null;
    }
    return p;
  }

  function loadTexture(gl, img) {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    return tex;
  }

  /* ─── Main init ─────────────────────────────────────────────── */
  function init() {
    var clip    = document.getElementById('showcase-track-clip');
    if (!clip) return;

    /* Collect image srcs from showcase */
    var anchors = document.querySelectorAll('.showcase__image');
    if (!anchors.length) return;
    var srcs = Array.from(anchors).map(function (a) {
      return a.querySelector('img').src;
    });

    /* Create canvas overlay */
    var canvas = document.createElement('canvas');
    canvas.id  = 'showcase-gl-canvas';
    canvas.style.cssText = [
      'position:absolute', 'inset:0', 'width:100%', 'height:100%',
      'z-index:3', 'pointer-events:none', 'display:block'
    ].join(';');
    clip.style.position = 'relative';
    clip.appendChild(canvas);

    var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) { console.warn('[showcase-gl] WebGL not supported'); return; }

    var prog = createProgram(gl, VERT, FRAG);
    if (!prog) return;

    /* Fullscreen quad */
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1,-1,  1,-1,  -1,1,  1,1
    ]), gl.STATIC_DRAW);

    var aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    /* Uniform locations */
    var uTex0     = gl.getUniformLocation(prog, 'u_tex0');
    var uTex1     = gl.getUniformLocation(prog, 'u_tex1');
    var uTime     = gl.getUniformLocation(prog, 'u_time');
    var uProgress = gl.getUniformLocation(prog, 'u_progress');
    var uMouse    = gl.getUniformLocation(prog, 'u_mouse');
    var uMouseStr = gl.getUniformLocation(prog, 'u_mouseStr');
    var uRes      = gl.getUniformLocation(prog, 'u_res');

    /* Load images → textures */
    var textures = new Array(srcs.length).fill(null);
    var loaded   = 0;
    function onImgLoad(i, img) {
      textures[i] = loadTexture(gl, img);
      loaded++;
    }
    srcs.forEach(function (src, i) {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () { onImgLoad(i, img); };
      img.src = src;
    });

    /* State */
    var current  = 0;
    var next     = 0;
    var progress = 0;
    var mouseX   = 0.5;
    var mouseY   = 0.5;
    var mouseStr = 0; /* 0 = no hover, 1 = full hover */
    var startT   = null;

    /* Resize */
    function resize() {
      canvas.width  = clip.clientWidth;
      canvas.height = clip.clientHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener('resize', resize);

    /* Mouse tracking on the clip element (pointer-events: none on canvas) */
    clip.addEventListener('mousemove', function (e) {
      var r = clip.getBoundingClientRect();
      mouseX = (e.clientX - r.left) / r.width;
      mouseY = 1 - (e.clientY - r.top)  / r.height;
    });
    clip.addEventListener('mouseenter', function () {
      mouseStr = 0;
      (function ramp() {
        mouseStr = Math.min(1, mouseStr + 0.05);
        if (mouseStr < 1) requestAnimationFrame(ramp);
      }());
    });
    clip.addEventListener('mouseleave', function () {
      mouseStr = 1;
      (function ramp() {
        mouseStr = Math.max(0, mouseStr - 0.05);
        if (mouseStr > 0) requestAnimationFrame(ramp);
      }());
    });

    /* Render loop */
    var running = false;
    var rafId = null;

    function render(ts) {
      if (!running) return;
      rafId = requestAnimationFrame(render);

      if (!startT) startT = ts;
      var t = (ts - startT) / 1000;

      if (!textures[current] || !textures[next]) {
        return;
      }

      gl.useProgram(prog);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, textures[current]);
      gl.uniform1i(uTex0, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, textures[next]);
      gl.uniform1i(uTex1, 1);
      gl.uniform1f(uTime,     t);
      gl.uniform1f(uProgress, progress);
      gl.uniform2f(uMouse,    mouseX, mouseY);
      gl.uniform1f(uMouseStr, mouseStr);
      gl.uniform2f(uRes,      canvas.width, canvas.height);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (entries) {
        var isIntersecting = entries[0].isIntersecting;
        if (isIntersecting && !running) {
          canvas.style.visibility = 'visible';
          running = true;
          rafId = requestAnimationFrame(render);
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
      rafId = requestAnimationFrame(render);
    }

    /* ── Transition API exposed to main.js ── */
    var animating = false;
    window.showcaseGLTransition = function (fromIdx, toIdx, onDone) {
      if (animating) return;
      animating = true;
      current   = fromIdx;
      next      = toIdx;
      progress  = 0;

      var DURATION = 900; /* ms */
      var startTs  = null;

      function ease(t) { return t < .5 ? 2*t*t : -1+(4-2*t)*t; }

      function step(ts) {
        if (!startTs) startTs = ts;
        var elapsed = ts - startTs;
        var raw = Math.min(elapsed / DURATION, 1);
        progress = ease(raw);

        if (raw < 1) {
          requestAnimationFrame(step);
        } else {
          progress  = 0;
          current   = toIdx;
          next      = toIdx;
          animating = false;
          if (onDone) onDone();
        }
      }
      requestAnimationFrame(step);
    };
  }

  /* Wait for DOM + a small delay so images are in the DOM */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(init, 300);
    });
  } else {
    setTimeout(init, 300);
  }
}());
