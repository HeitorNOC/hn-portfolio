/* ═══════════════════════════════════════════════════════════
   HN Services — Portfólio v3: 3D Circular Scroll Carousel
   ─────────────────────────────────────────────────────────
   Architecture:
   • .port-root height is 350vh — provides scroll travel room
   • .port-stage is position: sticky top: 0 height: 100vh
   • .port-ring holds N cards positioned along a circle's perimeter
   • GSAP ScrollTrigger scrubs rotationY of the ring (CSS sticky provides the visual pin)
   • Ring also sways on rotationX and rotationZ for elastic 3D depth
   • On hover, targeted cards pop outward along their Z axis,
     while non-hovered cards fade and blur sutilly.
   ═══════════════════════════════════════════════════════════ */

window.initPortfolio3D = function () {
  'use strict';

  if (window.innerWidth < 768) {
    return;
  }

  var root       = document.querySelector('.port-root');
  var stage      = document.getElementById('port-stage');
  var ring       = document.getElementById('port-ring');
  var cards      = gsap.utils.toArray('.port-card');
  var indicator  = document.querySelector('.port-indicator');

  if (!root || !stage || !ring || cards.length < 2) return;
  if (!window.gsap || !window.ScrollTrigger) return;

  var N       = cards.length;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Set root height for pinning space (reduced from 350vh to 230vh/200vh for snappier scrolling)
  root.style.height = (window.innerWidth > 991) ? '230vh' : '200vh';

  /* ── 1. Geometric Card Placement ── */
  function layoutCarousel() {
    var cardWidth = cards[0].offsetWidth;
    
    // Enforce robust fallback if element hasn't fully rendered or is 0
    if (!cardWidth || cardWidth < 50) {
      cardWidth = (window.innerWidth > 991) ? 325 : 220;
    }
    
    // Calculate radius to form a beautiful wide circular globe (spacious spacing)
    // One card in front, one in back, one left, one right.
    var angleStep = 360 / N;
    
    // Math.sin provides the precise geometry for circular distribution
    var radius = (cardWidth / 2) / Math.sin(Math.PI / N);
    
    // Multiply by a spacing factor to spread cards apart widely like a floating globe
    var factor = (window.innerWidth > 991) ? 1.45 : 1.25;
    radius = Math.round(radius * factor);
    
    // Enforce a minimum radius for beautiful volumetric space on desktop/mobile
    var minRadius = (window.innerWidth > 991) ? 440 : 220;
    if (radius < minRadius) radius = minRadius;

    // Mathematical Bound for Anti-Clipping:
    // Capped only on desktop. On mobile, we use CSS transform scale on the scene to prevent clipping!
    if (window.innerWidth > 991) {
      var maxRadius = (window.innerWidth - 40 - cardWidth) / 2;
      if (maxRadius < 50) maxRadius = 50;
      if (radius > maxRadius) radius = Math.round(maxRadius);
    }

    cards.forEach(function (card, idx) {
      var angle = idx * angleStep;
      
      // Position card on the cylinder perimeter via CSS variables
      // to ensure perfect rotation-then-translation 3D transform order!
      gsap.set(card, {
        '--card-angle': angle + 'deg',
        '--card-radius': radius + 'px',
        '--card-scale': 1
      });
      
      // Cache values for hover calculations
      card.dataset.radius = radius;
    });
  }

  // Initial layout
  layoutCarousel();
  
  // Re-layout on window resizing for responsiveness
  window.addEventListener('resize', function () {
    layoutCarousel();
  });

  /* ── 2. Scroll-Driven 3D Ring Animation ── */
  /* CSS sticky on .port-stage handles the visual pin; GSAP only drives rotation. */
  var tl = gsap.timeline({
    scrollTrigger: {
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: function (self) {
        if (indicator) {
          if (self.progress > 0.9) {
            gsap.to(indicator, { opacity: 0, duration: 0.3 });
          } else {
            gsap.to(indicator, { opacity: 1 - self.progress * 1.5, duration: 0.3 });
          }
        }
      }
    }
  });

  // Rotate ring 360 degrees horizontals
  tl.to(ring, {
    rotationY: -360,
    ease: 'none'
  }, 0);

  // Complex Awwwards wave/spiral pitch tilt
  tl.fromTo(ring,
    { rotationX: -6, rotationZ: -2 },
    { rotationX: 6, rotationZ: 2, ease: 'sine.inOut' },
    0
  );

  /* ── 3. Interactive Card Hovers (Stable Depth Scale & 3D Parallax Tilt) ── */
  cards.forEach(function (card) {
    if (reduced) return;

    var inner = card.querySelector('.port-card__inner');
    if (!inner) return;

    card.addEventListener('mouseenter', function () {
      ring.classList.add('is-focusing');
      card.classList.add('is-hovered');

      // Pop target card visual layer slightly forward
      gsap.to(inner, {
        scale: 1.05,
        z: 35,
        duration: 0.4,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    });

    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      
      // Calculate cursor coordinates relative to the card center, normalized to -0.5 .. 0.5
      var cx = (e.clientX - rect.left) / rect.width - 0.5;
      var cy = (e.clientY - rect.top) / rect.height - 0.5;

      // 3D Parallax Tilt: rotate on both axes and maintain scale/depth pop
      gsap.to(inner, {
        rotateX: -cy * 18,
        rotateY: cx * 18,
        scale: 1.05,
        z: 35,
        duration: 0.35,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    });

    card.addEventListener('mouseleave', function () {
      ring.classList.remove('is-focusing');
      card.classList.remove('is-hovered');

      // Smoothly restore neutral positioning
      gsap.to(inner, {
        rotateX: 0,
        rotateY: 0,
        scale: 1.0,
        z: 0,
        duration: 0.6,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    });
  });
};
