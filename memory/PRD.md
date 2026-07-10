# HN Services — Portfolio Elevation

## Problema
Elevar o nível do portfólio HN Services (hn-portfolio) para transmitir mais credibilidade a clientes que querem contratar sites, landing pages e sistemas de TI. Preservar o que já está bom e adicionar vídeos, objetos 3D, animações, transições e efeitos de scroll com sequência lógica (referência: analogia do carro que sai coberto e vai sendo revelado com o scroll).

## Stack (preservada)
Vanilla HTML + CSS + JS · Three.js (r128 local) · GSAP + ScrollTrigger · Static site servido em /app/frontend via `serve` no port 3000.

## Preferências do Usuário
- Serviços em ordem de destaque: Landing pages > Sites institucionais > Sistemas web
- Estilo: Futurista/Tech (neon lime #C9F31D + glassmorphism) + Premium/Corporativo (fundo escuro elegante)
- Vídeos/3D: Three.js + geometrias/shaders (SEM three-fiber, SEM vídeos stock por ora)

## Implementado (10/Jan/2026)
- **Reveal Scene 3D cinematográfica** (`/app/js/reveal-scene.js` + `/app/css/reveal-scene.css`): laptop wrapped em wireframe glow → scroll tira a "capa" (opacity+scale+lift), abre a tampa (hinge rotation), gira o ângulo (perspectiva muda), a tela desenha wireframe → design → site live com métrica de uptime. 4 fases sincronizadas com copy fade in/out ("Descoberta → Wireframe → Design → Produção"). Pin ScrollTrigger 280%. Progress bar lateral com 4 stops.
- **Trust Bar** com 4 contadores animados (Core Web Vitals 98%, Prazo 15 dias, Uptime 99.9%, 120+ projetos) — animação IntersectionObserver + easeOutExpo.
- **Slam-in effect** (`data-slam` attr) aplicado em títulos de Sobre, Processo (3 etapas), Portfólio: scale 2.4→1 + blur 24px→0 + rotate.
- **Sequência narrativa nova**: Hero → Manifesto → Ticker → **Trust Bar** → **Reveal Scene (4 fases)** → Sobre → Processo → Serviços → Portfólio → CTA → Contato.
- Preservado: cursor customizado, loader HN, section-tracker, portfólio 3D ring, manifesto pinned, serviços Carmed slides, formulário Resend.
- Setup: /app/frontend/package.json com `serve` para servir /app estático via supervisor.

## Backlog / Enhancement
- Vídeos stock (Coverr/Pexels) muted como background sutil nos process steps
- Modelos 3D reais (GLTF) via loader — trocar box laptop por device model
- Case studies com "before/after" scroll comparison
- Depoimentos de clientes em card carousel

## Sugestão de Enhancement de Conversão
Adicionar micro CTA "Ver Preview do Seu Site em 48h" com formulário de 3 campos (nome, negócio, cor preferida) ao final da Reveal Scene — captura leads no momento de maior encantamento visual, quando o cliente acabou de ver o site "nascer" no laptop.

## Iteração 2 (10/Jan/2026)
### Bug fixes
- **Reveal Scene v2**: refatorado para usar apenas `position: sticky` + progress manual (removido ScrollTrigger `pin: true` que causava overlap com hero). Agora calcula progresso via `getBoundingClientRect` a cada frame, aplica 5 phases com `smoothstep` easing. Sem conflito com manifesto pin.

### Novas features
- **Slam-in com GLOW ripple**: pseudo `::before` gera aura radial lime (cresce 0→160% durante 1.1s) + pseudo `::after` shockwave (box-shadow 0→40px) sincronizado com o slam do texto. Efeito de impacto visual completo.
- **Vídeos stock nos 3 Process Steps** (Pexels CDN verificado 200 OK): Descoberta = mãos digitando, Construção = designer em mockup, Lançamento = servidores. Filtro `hue-rotate(50deg) + brightness(0.6)` para tint verde HN. Lazy-load via IntersectionObserver observando o `.process-step__aside` (contorna bug de video sem src ter 0×0 dims).
- **Showreel section** entre Serviços e Portfólio: vídeo full-screen de código/servidor rodando (Pexels 6963744) com overlay lime radial, scanlines mix-blend-mode, badge "AO VIVO · PRODUÇÃO 2026" com pulse-dot, slam title "Cada frame é um projeto lançado" com em em lime gradient.

### Files touched
- `/app/js/reveal-scene.js` (rewrite v2)
- `/app/js/enhancements.js` (+ initLazyVideos)  
- `/app/css/reveal-scene.css` (+ slam glow, showreel, process video)
- `/app/index.html` (+ Showreel section, + 3 video tags, + data-slam attrs)
