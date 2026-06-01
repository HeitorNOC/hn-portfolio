import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const DEFAULT_SERVICES = [
  {
    id: '01',
    name: 'Criação de Sites',
    bgColor: '#0a0a0a',
    accentWord: 'SITES',
    bullets: ['Landing Pages', 'Portais Corporativos', 'E-commerce', 'SEO Técnico'],
    cta: 'Solicitar orçamento',
    icon: (
      <svg className="w-full h-full text-lime-400 opacity-90 filter drop-shadow-[0_10px_30px_rgba(201,243,29,0.25)]" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="35" width="170" height="130" rx="10" stroke="currentColor" strokeWidth="3" />
        <line x1="15" y1="65" x2="185" y2="65" stroke="currentColor" strokeWidth="2" />
        <circle cx="35" cy="50" r="5" fill="currentColor" />
        <circle cx="50" cy="50" r="5" fill="currentColor" />
        <circle cx="65" cy="50" r="5" fill="currentColor" />
        <rect x="35" y="85" width="130" height="10" rx="4" fill="currentColor" fillOpacity="0.2" />
        <rect x="35" y="105" width="90" height="8" rx="4" fill="currentColor" fillOpacity="0.2" />
        <rect x="35" y="123" width="110" height="8" rx="4" fill="currentColor" fillOpacity="0.3" />
      </svg>
    )
  },
  {
    id: '02',
    name: 'Consultoria de TI',
    bgColor: '#0d1f0d',
    accentWord: 'CONSULTORIA',
    bullets: ['Diagnóstico de Stack', 'Arquitetura Cloud', 'Segurança & Auditoria', 'Roadmap de ROI'],
    cta: 'Solicitar orçamento',
    icon: (
      <svg className="w-full h-full text-lime-400 opacity-90 filter drop-shadow-[0_10px_30px_rgba(201,243,29,0.25)]" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="55" r="18" stroke="currentColor" strokeWidth="3" />
        <circle cx="55" cy="135" r="18" stroke="currentColor" strokeWidth="3" />
        <circle cx="145" cy="135" r="18" stroke="currentColor" strokeWidth="3" />
        <line x1="90" y1="70" x2="65" y2="120" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 4" />
        <line x1="110" y1="70" x2="135" y2="120" stroke="currentColor" strokeWidth="2.5" />
        <line x1="73" y1="135" x2="127" y2="135" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="100" cy="55" r="6" fill="currentColor" />
        <circle cx="55" cy="135" r="6" fill="currentColor" />
        <circle cx="145" cy="135" r="6" fill="currentColor" />
      </svg>
    )
  },
  {
    id: '03',
    name: 'Sistemas Web',
    bgColor: '#0a0f1a',
    accentWord: 'SISTEMAS',
    bullets: ['Aplicações Customizadas', 'Integração de APIs', 'Bancos de Dados', 'Dashboards Administrativos'],
    cta: 'Solicitar orçamento',
    icon: (
      <svg className="w-full h-full text-lime-400 opacity-90 filter drop-shadow-[0_10px_30px_rgba(201,243,29,0.25)]" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="30" width="160" height="140" rx="8" stroke="currentColor" strokeWidth="3" />
        <rect x="20" y="30" width="160" height="25" fill="currentColor" fillOpacity="0.1" />
        <circle cx="35" cy="42" r="4" fill="currentColor" />
        <circle cx="47" cy="42" r="4" fill="currentColor" />
        <circle cx="59" cy="42" r="4" fill="currentColor" />
        <path d="M40 80L55 90L40 100" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="65" y1="100" x2="95" y2="100" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <rect x="40" y="125" width="120" height="6" rx="3" fill="currentColor" fillOpacity="0.2" />
      </svg>
    )
  },
  {
    id: '04',
    name: 'UI/UX Design',
    bgColor: '#1a0a1a',
    accentWord: 'DESIGN',
    bullets: ['Design de Interface', 'Pesquisa de Usuário', 'Wireframes & Mockups', 'Protótipos Interativos'],
    cta: 'Solicitar orçamento',
    icon: (
      <svg className="w-full h-full text-lime-400 opacity-90 filter drop-shadow-[0_10px_30px_rgba(201,243,29,0.25)]" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="25" y="25" width="150" height="150" rx="16" stroke="currentColor" strokeWidth="3" />
        <circle cx="100" cy="85" r="30" stroke="currentColor" strokeWidth="2.5" />
        <line x1="79" y1="64" x2="121" y2="106" stroke="currentColor" strokeWidth="1.5" />
        <line x1="121" y1="64" x2="79" y2="106" stroke="currentColor" strokeWidth="1.5" />
        <rect x="50" y="135" width="100" height="12" rx="6" fill="currentColor" fillOpacity="0.25" />
        <line x1="25" y1="100" x2="175" y2="100" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 5" />
      </svg>
    )
  },
  {
    id: '05',
    name: 'Manutenção & Suporte',
    bgColor: '#1a0a0a',
    accentWord: 'SUPORTE',
    bullets: ['Hospedagem & Servidores', 'Updates de Segurança', 'Correção de Bugs', 'Monitoramento 24/7'],
    cta: 'Solicitar orçamento',
    icon: (
      <svg className="w-full h-full text-lime-400 opacity-90 filter drop-shadow-[0_10px_30px_rgba(201,243,29,0.25)]" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 25C135 32 165 32 165 32V90C165 135 135 165 100 178C65 165 35 135 35 90V32C35 32 65 32 100 25Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <path d="M60 100H85L95 80L105 120L115 90L125 100H140" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
];

export default function ServicesSection({ services = DEFAULT_SERVICES }) {
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const prevIndexRef = useRef(0);

  // Synchronize Mobile Viewport Flag
  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport, { passive: true });
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Set initial visual states for slide contents
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    services.forEach((_, idx) => {
      const slide = container.querySelector(`[data-slide-idx="${idx}"]`);
      if (!slide) return;
      const bgText = slide.querySelector('.carmed-bg-text');
      const floater = slide.querySelector('.carmed-floater');
      const texts = slide.querySelectorAll('.carmed-text-fade');
      const cta = slide.querySelector('.carmed-cta-fade');

      if (isMobile) {
        gsap.set([slide, bgText, floater, texts, cta].filter(Boolean), { clearProps: 'all' });
      } else {
        gsap.set(slide, { x: idx === 0 ? '0%' : '100%', opacity: idx === 0 ? 1 : 0 });
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
        if (texts.length) gsap.set(texts, { y: 24, opacity: 0 });
        if (cta) gsap.set(cta, { scale: 0.95, opacity: 0 });
      }
    });
  }, [isMobile, services]);

  // Set up continuous loop floating on floater elements
  useEffect(() => {
    const floaters = gsap.utils.toArray('.carmed-floater-inner');
    const ctx = gsap.context(() => {
      floaters.forEach((el, idx) => {
        gsap.fromTo(el,
          { y: -10 },
          {
            y: 10,
            duration: 2.5 + (idx * 0.2),
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: idx * 0.15
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, [services]);

  // Trigger horizontal entrance/exit slide animations (Desktop only)
  useEffect(() => {
    if (isMobile) return;
    const container = containerRef.current;
    if (!container) return;

    const prevIdx = prevIndexRef.current;
    const nextIdx = activeIndex;
    if (prevIdx === nextIdx) return;

    const prevSlide = container.querySelector(`[data-slide-idx="${prevIdx}"]`);
    const nextSlide = container.querySelector(`[data-slide-idx="${nextIdx}"]`);

    const direction = nextIdx > prevIdx ? 1 : -1;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Exiting Slide Animation
      if (prevSlide) {
        const prevBgText = prevSlide.querySelector('.carmed-bg-text');
        const prevFloater = prevSlide.querySelector('.carmed-floater');
        const prevTexts = prevSlide.querySelectorAll('.carmed-text-fade');
        const prevCta = prevSlide.querySelector('.carmed-cta-fade');

        gsap.killTweensOf([prevSlide, prevBgText, prevFloater, prevTexts, prevCta]);

        tl.to(prevSlide, {
          x: (-direction * 100) + '%',
          opacity: 0,
          duration: 0.9,
          ease: 'power3.inOut'
        }, 0);

        if (prevFloater) {
          tl.to(prevFloater, {
            x: -direction * 150,
            opacity: 0,
            duration: 0.85,
            ease: 'power2.inOut'
          }, 0);
        }

        if (prevBgText) {
          tl.to(prevBgText, {
            xPercent: -50,
            yPercent: -50,
            x: direction * 150,
            scale: 0.8,
            opacity: 0,
            duration: 0.8,
            ease: 'power2.inOut'
          }, 0);
        }

        if (prevTexts.length || prevCta) {
          tl.to([prevTexts, prevCta].filter(Boolean), {
            opacity: 0,
            y: -20,
            duration: 0.45,
            stagger: 0.05
          }, 0);
        }
      }

      // Entering Slide Animation
      if (nextSlide) {
        const bgText = nextSlide.querySelector('.carmed-bg-text');
        const floater = nextSlide.querySelector('.carmed-floater');
        const texts = nextSlide.querySelectorAll('.carmed-text-fade');
        const cta = nextSlide.querySelector('.carmed-cta-fade');

        gsap.killTweensOf([nextSlide, bgText, floater, texts, cta]);

        // Set initial entrance positions
        gsap.set(nextSlide, { x: (direction * 100) + '%', opacity: 0 });
        if (floater) gsap.set(floater, { x: direction * 200, opacity: 0 });
        if (bgText) {
          gsap.set(bgText, {
            xPercent: -50,
            yPercent: -50,
            x: -direction * 150,
            scale: 1.25,
            opacity: 0
          });
        }
        if (texts.length) gsap.set(texts, { y: 30, opacity: 0 });
        if (cta) gsap.set(cta, { scale: 0.94, opacity: 0 });

        tl.to(nextSlide, {
          x: '0%',
          opacity: 1,
          duration: 0.95,
          ease: 'power3.inOut'
        }, 0);

        if (floater) {
          tl.to(floater, {
            x: 0,
            opacity: 1,
            duration: 1.15,
            ease: 'power2.out'
          }, 0.05);
        }

        if (bgText) {
          tl.to(bgText, {
            x: 0,
            scale: 1,
            opacity: 0.1,
            duration: 1.2,
            ease: 'power2.out'
          }, 0.02);
        }

        if (texts.length) {
          tl.to(texts, {
            y: 0,
            opacity: 1,
            duration: 0.75,
            stagger: 0.1,
            ease: 'power2.out'
          }, 0.35);
        }

        if (cta) {
          tl.to(cta, {
            scale: 1,
            opacity: 1,
            duration: 0.6,
            ease: 'back.out(1.7)'
          }, 0.65);
        }
      }
    }, container);

    prevIndexRef.current = activeIndex;
    return () => ctx.revert();
  }, [activeIndex, isMobile]);

  // Set up ScrollTrigger and mobile scroll synchronization
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let triggerInstance = null;
    let visibilityInstance = null;
    let handleMobileScroll = null;

    if (isMobile) {
      // Mobile Viewport: Window scroll listener tracks active slide elements + fades dots in bounds
      handleMobileScroll = () => {
        const sy = window.scrollY;
        const rootTop = container.offsetTop;
        const rootBottom = rootTop + container.offsetHeight;
        const inBounds = (sy + window.innerHeight * 0.45 >= rootTop) && (sy + window.innerHeight * 0.45 <= rootBottom);
        setShowNav(inBounds);

        const syCenter = window.scrollY + window.innerHeight * 0.45;
        let highlightIdx = 0;
        const slideEls = container.querySelectorAll('.carmed-slide');
        slideEls.forEach((slide, idx) => {
          if (syCenter >= slide.offsetTop) {
            highlightIdx = idx;
          }
        });
        setActiveIndex(highlightIdx);
      };
      window.addEventListener('scroll', handleMobileScroll, { passive: true });
      handleMobileScroll();
    } else {
      // Desktop Viewport: Pinning ScrollTrigger is configured
      triggerInstance = ScrollTrigger.create({
        trigger: container,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          const numSlides = services.length;
          let idx = Math.floor(self.progress * numSlides);
          if (idx >= numSlides) idx = numSlides - 1;
          setActiveIndex(idx);
        }
      });

      visibilityInstance = ScrollTrigger.create({
        trigger: container,
        start: 'top center',
        end: 'bottom center',
        onToggle: (self) => {
          setShowNav(self.isActive);
        }
      });

      setActiveIndex(0);
      prevIndexRef.current = 0;
    }

    return () => {
      if (triggerInstance) triggerInstance.kill();
      if (visibilityInstance) visibilityInstance.kill();
      if (handleMobileScroll) window.removeEventListener('scroll', handleMobileScroll);
    };
  }, [isMobile, services.length]);

  // Click handler for side progress dots
  const scrollToSlide = (targetIdx) => {
    const container = containerRef.current;
    if (!container) return;

    if (isMobile) {
      const slide = container.querySelector(`[data-slide-idx="${targetIdx}"]`);
      if (slide) {
        gsap.to(window, {
          scrollTo: { y: slide, offsetY: 70 },
          duration: 0.95,
          ease: 'power2.out'
        });
      }
    } else {
      const start = ScrollTrigger.getById(container)?.start || (container.offsetTop);
      const end = ScrollTrigger.getById(container)?.end || (container.offsetTop + container.offsetHeight);
      const total = end - start;
      const targetScroll = start + (targetIdx / (services.length - 1)) * total;

      gsap.to(window, {
        scrollTo: { y: targetScroll },
        duration: 0.95,
        ease: 'power2.out'
      });
    }
  };

  return (
    <section 
      ref={containerRef}
      className={`carmed-root relative w-full ${isMobile ? 'h-auto' : 'h-[500vh]'} select-none overflow-visible`}
    >
      {/* Top Header Navigation Overlay */}
      <div className="absolute top-0 inset-x-0 h-24 flex items-center justify-between px-8 md:px-16 z-50 pointer-events-none">
        <span className="text-[#C9F31D] font-display font-extrabold text-2xl tracking-tighter pointer-events-auto">HN</span>
        {!isMobile && (
          <span className="text-gray-400 text-xs font-mono tracking-widest pointer-events-auto">
            // IMERSÃO GLOBAL EM SERVIÇOS
          </span>
        )}
      </div>

      {/* Side Dots Progress Navigation Indicators */}
      <div 
        className={`fixed right-6 md:right-10 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-40 transition-all duration-350 ${
          showNav ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-95'
        }`}
      >
        {services.map((svc, idx) => (
          <button
            key={svc.id}
            onClick={() => scrollToSlide(idx)}
            className="group flex items-center justify-end gap-3 focus:outline-none"
            aria-label={`Ir para ${svc.name}`}
          >
            {!isMobile && (
              <span className={`text-[10px] font-mono tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                activeIndex === idx ? 'text-[#C9F31D]' : 'text-gray-500'
              }`}>
                {svc.name}
              </span>
            )}
            <div className={`w-2.5 h-2.5 rounded-full border transition-all duration-300 ${
              activeIndex === idx 
                ? 'bg-[#C9F31D] border-[#C9F31D] scale-125 shadow-[0_0_10px_#C9F31D]' 
                : 'bg-transparent border-gray-600 scale-100 group-hover:border-gray-400'
            }`} />
          </button>
        ))}
      </div>

      {/* Immersive Slides Stage container */}
      <div 
        className={`carmed-stage ${
          isMobile ? 'relative h-auto overflow-visible flex flex-col' : 'sticky top-0 w-full h-screen overflow-hidden'
        } transition-colors duration-700`}
        style={{
          backgroundColor: isMobile ? 'transparent' : (services[activeIndex]?.bgColor || '#0a0a0a')
        }}
      >
        {services.map((svc, idx) => (
          <article
            key={svc.id}
            data-slide-idx={idx}
            className={`carmed-slide ${
              isMobile 
                ? 'relative w-full h-auto min-h-[82vh] flex flex-col justify-center items-center py-20 px-6 border-b border-white/5' 
                : `absolute inset-0 w-full h-full flex flex-col justify-between items-center py-20 px-6 md:px-20 ${
                    activeIndex === idx ? 'is-active' : ''
                  }`
            }`}
            style={{
              backgroundColor: isMobile ? svc.bgColor : 'transparent'
            }}
          >
            {/* Corner Navigation Counter */}
            <div className="absolute top-8 left-8 md:left-16 flex items-center gap-2 text-xs font-mono text-gray-500 z-10">
              <span className="text-white font-bold">{svc.id}</span>
              <span>/</span>
              <span>0{services.length}</span>
            </div>

            {/* Giant Ambient Background Word */}
            <div 
              className="carmed-bg-text absolute inset-0 flex items-center justify-center pointer-events-none select-none font-display font-extrabold text-[clamp(3.5rem,8vw,8.5rem)] text-white tracking-widest leading-none z-0 whitespace-nowrap"
              style={{ opacity: isMobile ? 0.1 : 0 }}
            >
              {svc.accentWord}
            </div>

            {/* Floating Technical SVG Representation */}
            <div className="carmed-floater w-48 h-48 md:w-64 md:h-64 mt-auto mb-6 z-10 flex items-center justify-center">
              <div className="carmed-floater-inner w-full h-full flex items-center justify-center">
                {svc.icon}
              </div>
            </div>

            {/* Text Contents & Bullet lists */}
            <div className="w-full max-w-3xl flex flex-col items-center gap-4 text-center z-10 mb-auto mt-4">
              <h2 className="carmed-text-fade font-display text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-none">
                {svc.name}
              </h2>
              
              <ul className="carmed-text-fade flex flex-col md:flex-row flex-wrap justify-center items-center gap-3 md:gap-x-8 text-xs md:text-sm text-gray-400 font-medium">
                {svc.bullets.map((bullet, bidx) => (
                  <li key={bidx} className="flex items-center gap-2 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C9F31D]" />
                    {bullet}
                  </li>
                ))}
              </ul>

              <div className="carmed-cta-fade mt-6">
                <a
                  href="#contato"
                  className="inline-flex items-center gap-3 px-8 py-3.5 bg-[#C9F31D] text-black font-display font-bold text-xs uppercase tracking-wider rounded-full hover:bg-white hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-300"
                >
                  {svc.cta} <span className="text-[1.1em]">→</span>
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
