/* ═══════════════════════════════════════════════════════════
   HN Services — Serviços v3: Carmed-style Fullscreen Pinning Slides
   ─────────────────────────────────────────────────────────
   Architecture:
   • On Desktop: Stage pins via sticky viewport container inside a 500vh Tall stage.
     A GSAP ScrollTrigger monitors page scroll progress and maps it to slide horizontal transitions.
     Slides slide in and out horizontally (right-to-left when scrolling down, left-to-right when scrolling up)
     with gorgeous parallax effects on the SVGs and ambient background texts.
   • On Mobile: Pinning is completely disabled. Slides stack vertically in a natural flow,
     eliminating any touch freeze or heavy scroll hijacking issues.
   • Side dots indicators are preserved on both viewports: position is set to fixed,
     and they fade in dynamically via ScrollTrigger/Window-scroll when entering the services section.
     Clicking smoothly scrolls to the respective slide index position.
   ═══════════════════════════════════════════════════════════ */

window.initServicesV3 = function () {
  'use strict';

  var root   = document.querySelector('.carmed-root');
  var stage  = document.getElementById('carmed-stage');
  var slides = gsap.utils.toArray('.carmed-slide');
  var dots   = document.querySelectorAll('.carmed-nav__dot');

  if (!root || !stage || slides.length === 0) return;

  var activeIndex = -1;
  var isMobile = window.innerWidth <= 768;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var scrollTriggerInstance = null;
  var visibilityTriggerInstance = null;
  var mobileScrollHandler = null;

  /* ── 1. Set Initial Visual States ── */
  function setInitialStates() {
    slides.forEach(function (slide, idx) {
      var bgText = slide.querySelector('.carmed-slide__bg-text');
      var floater = slide.querySelector('.carmed-slide__floater');
      var textFade = slide.querySelectorAll('.carmed-slide__text-fade');
      var ctaFade = slide.querySelector('.carmed-slide__cta-fade');

      // Set elegant starting transitions
      // Critical: use xPercent/yPercent to prevent GSAP from wiping CSS centering translates
      if (bgText) {
        gsap.set(bgText, {
          xPercent: -50,
          yPercent: -50,
          scale: 1.25,
          opacity: 0,
          transformOrigin: 'center'
        });
      }
      if (floater) gsap.set(floater, { y: 60, opacity: 0 });
      if (textFade.length) gsap.set(textFade, { y: 24, opacity: 0 });
      if (ctaFade) gsap.set(ctaFade, { scale: 0.95, opacity: 0 });

      // Apply background color directly to slide for mobile view stack fallback
      var bg = slide.getAttribute('data-bg') || '#0a0a0a';
      slide.style.backgroundColor = bg;
    });
  }

  setInitialStates();

  /* ── 2. Continuous Floating Loop (Nested Inner Wrapper) ── */
  if (!reduced) {
    var floatersInner = gsap.utils.toArray('.carmed-slide__floater-inner');
    floatersInner.forEach(function (el, idx) {
      gsap.fromTo(el,
        { y: -10 },
        {
          y: 10,
          duration: 2.8 + (idx * 0.15),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: idx * 0.2
        }
      );
    });
  }

  /* ── 3. Cinematic Entrance & Exit Transitions (Desktop Right-to-Left Sliding) ── */
  function transitionSlide(prevIdx, nextIdx) {
    if (nextIdx === prevIdx) return;

    var nextSlide = slides[nextIdx];
    var nextBg = nextSlide.getAttribute('data-bg') || '#0a0a0a';

    // Highlight the active dot
    dots.forEach(function (dot, i) {
      dot.classList.toggle('is-active', i === nextIdx);
    });

    if (isMobile) {
      // Mobile does not use horizontal sliding, but we ensure full visibility of active content
      slides.forEach(function (slide) {
        gsap.set(slide, { x: '0%', opacity: 1, pointerEvents: 'auto', visibility: 'visible' });
        var bgText = slide.querySelector('.carmed-slide__bg-text');
        var floater = slide.querySelector('.carmed-slide__floater');
        var textFade = slide.querySelectorAll('.carmed-slide__text-fade');
        var ctaFade = slide.querySelector('.carmed-slide__cta-fade');
        
        if (bgText) gsap.set(bgText, { opacity: 1, scale: 1, x: 0, y: 0, xPercent: -50, yPercent: -50 });
        if (floater) gsap.set(floater, { opacity: 1, scale: 1, x: 0, y: 0 });
        if (ctaFade) gsap.set(ctaFade, { opacity: 1, scale: 1, x: 0, y: 0 });
        if (textFade.length) gsap.set(textFade, { opacity: 1, scale: 1, x: 0, y: 0 });
      });
      return;
    }

    // Determine direction of travel: 1 = scrolling down (right-to-left), -1 = scrolling up (left-to-right)
    var direction = 1;
    if (prevIdx !== undefined && nextIdx < prevIdx) {
      direction = -1;
    }

    // Toggle active slide visibility classes
    slides.forEach(function (slide, idx) {
      slide.classList.toggle('is-active', idx === nextIdx);
    });

    // Crossfade stage background color
    gsap.to(stage, {
      backgroundColor: nextBg,
      duration: 0.85,
      ease: 'power2.out'
    });

    // Exiting Slide Animations
    if (prevIdx !== undefined && prevIdx >= 0 && prevIdx < slides.length) {
      var prevSlide = slides[prevIdx];
      var prevBgText = prevSlide.querySelector('.carmed-slide__bg-text');
      var prevFloater = prevSlide.querySelector('.carmed-slide__floater');
      var prevTexts = prevSlide.querySelectorAll('.carmed-slide__text-fade');
      var prevCta = prevSlide.querySelector('.carmed-slide__cta-fade');

      if (prevSlide.timeline) prevSlide.timeline.kill();

      var exitTl = gsap.timeline({
        onComplete: function () {
          gsap.set(prevSlide, { visibility: 'hidden', pointerEvents: 'none' });
        }
      });

      // Slide out main panel to left/right
      exitTl.to(prevSlide, {
        x: (-direction * 100) + '%',
        opacity: 0,
        duration: 0.9,
        ease: 'power3.inOut'
      }, 0);

      // Slide out floater with parallax lag
      if (prevFloater) {
        exitTl.to(prevFloater, {
          x: -direction * 150,
          opacity: 0,
          duration: 0.85,
          ease: 'power2.inOut'
        }, 0);
      }

      // Ambient text opposite direction slide out
      if (prevBgText) {
        exitTl.to(prevBgText, {
          xPercent: -50,
          yPercent: -50,
          x: direction * 150,
          scale: 0.8,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.inOut'
        }, 0);
      }

      // Exit text contents
      if (prevTexts.length || prevCta) {
        exitTl.to([prevTexts, prevCta].filter(Boolean), {
          opacity: 0,
          y: -20,
          duration: 0.45,
          stagger: 0.05
        }, 0);
      }

      prevSlide.timeline = exitTl;
    }

    // Entering Slide Animations
    var activeBgText = nextSlide.querySelector('.carmed-slide__bg-text');
    var activeFloater = nextSlide.querySelector('.carmed-slide__floater');
    var activeTexts = nextSlide.querySelectorAll('.carmed-slide__text-fade');
    var activeCta = nextSlide.querySelector('.carmed-slide__cta-fade');

    if (nextSlide.timeline) nextSlide.timeline.kill();

    var enterTl = gsap.timeline();

    // Prepare entrance state
    gsap.set(nextSlide, {
      x: (direction * 100) + '%',
      opacity: 0,
      visibility: 'visible',
      pointerEvents: 'auto'
    });
    if (activeFloater) gsap.set(activeFloater, { x: direction * 200, opacity: 0 });
    if (activeBgText) {
      gsap.set(activeBgText, {
        xPercent: -50,
        yPercent: -50,
        x: -direction * 150,
        scale: 1.25,
        opacity: 0
      });
    }
    if (activeTexts.length) gsap.set(activeTexts, { y: 30, opacity: 0 });
    if (activeCta) gsap.set(activeCta, { scale: 0.94, opacity: 0 });

    // Animate in main slide panel
    enterTl.to(nextSlide, {
      x: '0%',
      opacity: 1,
      duration: 0.95,
      ease: 'power3.inOut'
    }, 0);

    // Parallax entering floater (SVG)
    if (activeFloater) {
      enterTl.to(activeFloater, {
        x: 0,
        opacity: 1,
        duration: 1.15,
        ease: 'power2.out'
      }, 0.05);
    }

    // Parallax entering ambient bg text
    if (activeBgText) {
      enterTl.to(activeBgText, {
        x: 0,
        scale: 1,
        opacity: 0.1,
        duration: 1.2,
        ease: 'power2.out'
      }, 0.02);
    }

    // Stagger entering text contents
    if (activeTexts.length) {
      enterTl.to(activeTexts, {
        y: 0,
        opacity: 1,
        duration: 0.75,
        stagger: 0.1,
        ease: 'power2.out'
      }, 0.35);
    }

    // Scale entering CTA
    if (activeCta) {
      enterTl.to(activeCta, {
        scale: 1,
        opacity: 1,
        duration: 0.6,
        ease: 'back.out(1.7)'
      }, 0.65);
    }

    nextSlide.timeline = enterTl;
  }

  /* ── 4. ScrollTrigger Pinning Setup ── */
  function initScrollTrigger() {
    // Kill existing desktop instances
    if (scrollTriggerInstance) {
      scrollTriggerInstance.kill();
      scrollTriggerInstance = null;
    }
    if (visibilityTriggerInstance) {
      visibilityTriggerInstance.kill();
      visibilityTriggerInstance = null;
    }
    // Remove mobile window scroll handler if exists
    if (mobileScrollHandler) {
      window.removeEventListener('scroll', mobileScrollHandler);
      mobileScrollHandler = null;
    }

    if (isMobile) {
      // Mobile Cleanup: Force stack, reset layouts and inline overrides
      gsap.set(stage, { clearProps: 'backgroundColor' });
      slides.forEach(function (slide) {
        slide.classList.remove('is-active');
        gsap.set(slide, { x: '0%', opacity: 1, pointerEvents: 'auto', visibility: 'visible' });
        var bgText = slide.querySelector('.carmed-slide__bg-text');
        var floater = slide.querySelector('.carmed-slide__floater');
        var textFade = slide.querySelectorAll('.carmed-slide__text-fade');
        var ctaFade = slide.querySelector('.carmed-slide__cta-fade');
        
        if (bgText) gsap.set(bgText, { opacity: 1, scale: 1, x: 0, y: 0, xPercent: -50, yPercent: -50 });
        if (floater) gsap.set(floater, { opacity: 1, scale: 1, x: 0, y: 0 });
        if (ctaFade) gsap.set(ctaFade, { opacity: 1, scale: 1, x: 0, y: 0 });
        textFade.forEach(function(el) { gsap.set(el, { opacity: 1, scale: 1, x: 0, y: 0 }); });
      });

      // Add window scroll handler to update sidebar dot highlight + fade in/out on Mobile
      mobileScrollHandler = function () {
        var sy = window.scrollY;
        var rootTop = root.offsetTop;
        var rootBottom = rootTop + root.offsetHeight;
        
        // Hide/Show lateral dots bar based on scroll bounds
        var inBounds = (sy + window.innerHeight * 0.45 >= rootTop) && (sy + window.innerHeight * 0.45 <= rootBottom);
        gsap.to('.carmed-nav', { autoAlpha: inBounds ? 1 : 0, duration: 0.3, overwrite: 'auto' });

        var syCenter = window.scrollY + window.innerHeight * 0.45;
        var highlightIdx = 0;
        slides.forEach(function (slide, idx) {
          if (syCenter >= slide.offsetTop) {
            highlightIdx = idx;
          }
        });
        dots.forEach(function (dot, i) {
          dot.classList.toggle('is-active', i === highlightIdx);
        });
      };
      window.addEventListener('scroll', mobileScrollHandler, { passive: true });
      mobileScrollHandler();
      return;
    }

    // Desktop Setup
    gsap.set(stage, { backgroundColor: slides[0].getAttribute('data-bg') || '#0a0a0a' });
    slides.forEach(function (slide, idx) {
      slide.classList.toggle('is-active', idx === 0);
      gsap.set(slide, { x: idx === 0 ? '0%' : '100%', opacity: idx === 0 ? 1 : 0 });
      var bgText = slide.querySelector('.carmed-slide__bg-text');
      if (bgText) {
        gsap.set(bgText, { xPercent: -50, yPercent: -50 });
      }
    });

    // Pinned slides progress manager
    scrollTriggerInstance = ScrollTrigger.create({
      trigger: '.carmed-root',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: function (self) {
        var progress = self.progress;
        var numSlides = slides.length;
        var idx = Math.floor(progress * numSlides);
        if (idx >= numSlides) idx = numSlides - 1;

        if (idx !== activeIndex) {
          transitionSlide(activeIndex, idx);
          activeIndex = idx;
        }
      }
    });

    // Elegant show/hide driver for .carmed-nav when entering/leaving Services
    visibilityTriggerInstance = ScrollTrigger.create({
      trigger: '.carmed-root',
      start: 'top center',
      end: 'bottom center',
      onToggle: function (self) {
        gsap.to('.carmed-nav', { autoAlpha: self.isActive ? 1 : 0, duration: 0.35, overwrite: 'auto' });
      }
    });

    activeIndex = 0;
    transitionSlide(undefined, 0);
  }

  // Initial trigger setup
  initScrollTrigger();

  /* ── 5. Navigation Dots Clicking ── */
  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      var targetIdx = parseInt(dot.getAttribute('data-target'), 10);
      if (isNaN(targetIdx)) return;

      if (isMobile) {
        var targetSlide = slides[targetIdx];
        if (targetSlide) {
          gsap.to(window, {
            scrollTo: { y: targetSlide, offsetY: 70 },
            duration: 0.95,
            ease: 'power2.out'
          });
        }
        return;
      }

      // Desktop: Scroll main window scrollbar to slide trigger offset
      var st = scrollTriggerInstance;
      if (st) {
        var start = st.start;
        var end = st.end;
        var totalDist = end - start;
        var targetScroll = start + (targetIdx / (slides.length - 1)) * totalDist;

        gsap.to(window, {
          scrollTo: { y: targetScroll },
          duration: 0.95,
          ease: 'power2.out'
        });
      }
    });
  });

  // Re-synchronize dimensions on resize
  window.addEventListener('resize', function () {
    var checkMobile = window.innerWidth <= 768;
    if (checkMobile !== isMobile) {
      isMobile = checkMobile;
      initScrollTrigger();
    }
  }, { passive: true });

};
