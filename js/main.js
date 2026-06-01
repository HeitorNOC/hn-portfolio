/* ═══════════════════════════════════════════════════════════
   HN Services — Main Entry Point
   Custom cursor · Nav · Portfolio pin · Services switcher · Form · Loader
   ═══════════════════════════════════════════════════════════ */
(function () {

  /* ── GSAP ScrollTo plugin registration ─────────────────── */
  if (window.gsap && window.ScrollToPlugin) {
    gsap.registerPlugin(ScrollToPlugin);
  }

  /* ── Smooth anchor scroll ───────────────────────────────── */
  function smoothScrollTo(target) {
    if (!target) return;
    var el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    if (window.gsap && window.ScrollToPlugin) {
      gsap.to(window, { scrollTo: { y: el, offsetY: 0 }, duration: 1.1, ease: 'power3.inOut' });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function initSmoothLinks() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var hash = a.getAttribute('href');
        if (hash === '#') { e.preventDefault(); smoothScrollTo(document.body); return; }
        var target = document.querySelector(hash);
        if (target) { e.preventDefault(); smoothScrollTo(target); closeMenu(); }
      });
    });
  }

  /* ── Custom Cursor ───────────────────────────────────────── */
  function initCursor() {
    var dot  = document.getElementById('cursor-dot');
    var ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;
    if (!window.matchMedia('(pointer: fine)').matches) {
      dot.style.display = ring.style.display = 'none'; return;
    }
    document.body.style.cursor = 'none';
    var cx = innerWidth / 2, cy = innerHeight / 2, rx = cx, ry = cy;
    document.addEventListener('mousemove', function (e) { cx = e.clientX; cy = e.clientY; }, { passive: true });
    if (!window.gsap) return;
    gsap.ticker.add(function () {
      rx += (cx - rx) * 0.13;
      ry += (cy - ry) * 0.13;
      gsap.set(dot,  { x: cx, y: cy });
      gsap.set(ring, { x: rx, y: ry });
    });
    ['a', 'button'].forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        el.addEventListener('mouseenter', function () { ring.classList.add('is-hover-link'); });
        el.addEventListener('mouseleave', function () { ring.classList.remove('is-hover-link'); });
      });
    });
    var hero = document.getElementById('hero');
    if (hero) {
      hero.addEventListener('mouseenter', function () { ring.classList.add('in-hero'); });
      hero.addEventListener('mouseleave', function () { ring.classList.remove('in-hero'); });
    }
    document.addEventListener('mouseleave', function () { gsap.to([dot, ring], { opacity: 0, duration: 0.2 }); });
    document.addEventListener('mouseenter', function () { gsap.to([dot, ring], { opacity: 1, duration: 0.2 }); });
  }

  /* ── Nav / Mobile overlay ────────────────────────────────── */
  var menuOpen = false;

  function openMenu() {
    menuOpen = true;
    document.getElementById('nav-overlay').classList.add('is-open');
    document.getElementById('nav-overlay').removeAttribute('aria-hidden');
    var b = document.getElementById('nav-hamburger');
    b.classList.add('is-open'); b.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    menuOpen = false;
    document.getElementById('nav-overlay').classList.remove('is-open');
    document.getElementById('nav-overlay').setAttribute('aria-hidden', 'true');
    var b = document.getElementById('nav-hamburger');
    b.classList.remove('is-open'); b.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  window.closeMenu = closeMenu;

  function initNav() {
    var burger = document.getElementById('nav-hamburger');
    if (burger) {
      burger.addEventListener('click', function () { menuOpen ? closeMenu() : openMenu(); });
    }
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) closeMenu(); });
  }

  /* ── Contact Form ────────────────────────────────────────── */
  function initContactForm() {
    var form    = document.getElementById('contact-form');
    var success = document.getElementById('contact-success');
    var btn     = document.getElementById('btn-submit');
    if (!form || !success || !btn) return;
    var btnText    = btn.querySelector('.btn-text');
    var btnSpinner = btn.querySelector('.btn-spinner');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;
      form.querySelectorAll('[required]').forEach(function (inp) {
        if (!inp.value.trim()) {
          valid = false;
          if (window.gsap) gsap.to(inp.closest('.form-field'), { x: [-6, 6, -4, 4, 0], duration: 0.4, ease: 'power2.inOut' });
        }
      });
      if (!valid) return;

      btn.disabled = true;
      if (window.gsap) {
        gsap.to(btnText,    { opacity: 0, y: -8, duration: 0.18 });
        gsap.to(btnSpinner, { opacity: 1, duration: 0.2, delay: 0.15 });
      }

      function onSuccess() {
        var finish = function () {
          form.style.display = 'none';
          success.style.display = 'flex';
          success.classList.add('is-visible');
          if (window.gsap) gsap.from(success, { opacity: 0, y: 20, duration: 0.5, ease: 'power3.out' });
          var cp = success.querySelector('.success-check__path');
          if (cp) setTimeout(function () { cp.classList.add('is-drawn'); }, 100);
        };
        if (window.gsap) {
          gsap.to(form, { opacity: 0, x: -30, duration: 0.45, ease: 'power2.in', onComplete: finish });
        } else {
          finish();
        }
      }

      function onError(msg) {
        btn.disabled = false;
        if (window.gsap) {
          gsap.to(btnSpinner, { opacity: 0, duration: 0.18 });
          gsap.to(btnText,    { opacity: 1, y: 0, duration: 0.2, delay: 0.15 });
        }
        var errEl = form.querySelector('.form-error');
        if (!errEl) {
          errEl = document.createElement('p');
          errEl.className = 'form-error';
          btn.parentNode.insertBefore(errEl, btn.nextSibling);
        }
        errEl.textContent = msg;
        if (window.gsap) gsap.from(errEl, { opacity: 0, y: -6, duration: 0.3 });
      }

      fetch('/api/send-email', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    form.elements['name'].value.trim(),
          email:   form.elements['email'].value.trim(),
          service: form.elements['service'].value,
          message: form.elements['message'].value.trim()
        })
      })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.error) onError(data.error);
        else            onSuccess();
      })
      .catch(function () {
        onError('Erro de conexão. Verifique sua internet e tente novamente.');
      });
    });
  }

  /* ── Loader ──────────────────────────────────────────────── */
  function initLoader(onComplete) {
    var loader = document.getElementById('loader');
    var bar    = document.getElementById('loader-bar');
    if (!loader || !bar || !window.gsap) {
      if (loader) loader.style.display = 'none';
      onComplete && onComplete(); return;
    }
    var done = false;
    function finish() {
      if (done) return; done = true;
      gsap.to(loader, {
        opacity: 0, duration: 0.55, ease: 'power2.inOut',
        onComplete: function () { loader.style.display = 'none'; onComplete && onComplete(); }
      });
    }
    var tl = gsap.timeline({ onComplete: finish });
    tl.to(bar, { scaleX: 0.5, duration: 0.7,  ease: 'power2.out',  transformOrigin: 'left' })
      .to(bar, { scaleX: 0.8, duration: 0.5,  ease: 'power1.inOut' }, '+=0.1')
      .to(bar, { scaleX: 1,   duration: 0.35, ease: 'power2.in'   }, '+=0.2');

    var minWait   = new Promise(function (r) { setTimeout(r, 1500); });
    var fontsDone = (document.fonts && document.fonts.ready)
      ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 3000); })])
      : Promise.resolve();
    var hardStop  = new Promise(function (r) { setTimeout(r, 5000); });

    Promise.race([Promise.all([minWait, fontsDone]), hardStop]).then(function () {
      tl.progress(1, false);
    });
  }

  /* ── Scroll Progress Bar ────────────────────────────────── */
  function initScrollProgress() {
    var bar = document.getElementById('scroll-progress');
    if (!bar) return;
    window.addEventListener('scroll', function () {
      var scrolled = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      bar.style.transform = 'scaleX(' + Math.min(1, scrolled) + ')';
    }, { passive: true });
  }
  /* ── Boot ────────────────────────────────────────────────── */
  function boot() {
    if (window.HN_BOOTED) return;
    window.HN_BOOTED = true;

    // Force scroll to top on refresh/load and disable browser history auto-restore
    window.scrollTo(0, 0);
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    // Bulletproof scroll interceptors while loading
    function preventScroll(e) {
      if (document.documentElement.classList.contains('hero-loading')) {
        e.preventDefault();
      }
    }
    
    var keysToBlock = { 'Space': 1, 'ArrowUp': 1, 'ArrowDown': 1, 'PageUp': 1, 'PageDown': 1, 'End': 1, 'Home': 1, ' ': 1 };
    function preventKeyScroll(e) {
      if (document.documentElement.classList.contains('hero-loading') && keysToBlock[e.key]) {
        e.preventDefault();
      }
    }

    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('keydown', preventKeyScroll, { passive: false });

    // Always lock scrolling during boot/refresh
    document.documentElement.classList.add('hero-loading');

    // Safety timer hard-cap at 6s in case loading fails
    var safetyTimer = setTimeout(function () {
      unlockPage();
    }, 6000);

    function unlockPage() {
      document.documentElement.classList.remove('hero-loading');
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('touchmove', preventScroll);
      window.removeEventListener('keydown', preventKeyScroll);
      if (safetyTimer) clearTimeout(safetyTimer);
      if (window.ScrollTrigger) {
        setTimeout(function () {
          ScrollTrigger.refresh();
        }, 120);
      }
    }

    // Expose unlockPage globally so it can be invoked by animations.js
    window.unlockPageScroll = unlockPage;

    /* ── No GSAP fallback ─────────────────────────────────── */
    if (!window.gsap) {
      var l = document.getElementById('loader');
      if (l) l.style.display = 'none';
      unlockPage();
      initNav(); initSmoothLinks(); initContactForm();
      return;
    }

    /* ── With GSAP ─────────────────────────────────────────── */
    initScrollProgress();
    initSmoothLinks();
    initCursor();
    initNav();
    initContactForm();
    if (window.initManifestoShader) initManifestoShader();
    if (window.initPortfolioShader) initPortfolioShader();

    var threeObj = window.initThreeScene ? initThreeScene() : null;
    if (window.initLightning) initLightning();

    initLoader(function () {
      // Force page scroll to top again just in case elements loaded dynamically shifted layout
      window.scrollTo(0, 0);

      if (window.initAllAnimations) initAllAnimations(threeObj);

      /* ScrollTrigger refresh after all pins/spacers are in DOM */
      if (window.ScrollTrigger) {
        setTimeout(function () { ScrollTrigger.refresh(); }, 150);
      }
    });
  }

  // Handle DOMContentLoaded race condition elegantly
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    boot();
  } else {
    document.addEventListener('DOMContentLoaded', boot);
  }

}());
