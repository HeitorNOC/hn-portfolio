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

## Iteração 3 (10/Jan/2026)
### Laptop 3D realista (v3)
- **Base + Lid**: `ExtrudeGeometry` com `Shape` de rounded rect (raio 0.14 base, 0.10 lid) + bevel de 6 segmentos → cantos suaves reais
- **Materiais PBR**: `MeshStandardMaterial` com metalness 0.88 / roughness 0.32 no alumínio + `envMapIntensity: 1.2`
- **Environment map procedural**: `PMREMGenerator` de um `Scene` interno com gradiente vertical (lime top / dark bottom) + 3 point lights (lime + white + blue accent) — dá reflexão de estúdio real na carcaça
- **Teclado**: 14×5 = 70 teclas individuais (BoxGeometry 0.16³) em grid com gap 0.023 → parece MacBook real
- **Trackpad**: rounded rect extruído (1.1 × 0.7) com material metalness 0.6 + edge line
- **Bezel de tela**: Shape com hole (rect com bordas arredondadas dentro) → moldura de tela com espessura real
- **Screen glow**: plane emissivo lime atrás da tela com AdditiveBlending, opacidade ramps 0→0.22 durante fase design/live
- **Logo**: círculo lime emissive nas costas do lid (rotação 180°)
- **Renderer**: sRGB encoding + ACESFilmicToneMapping + exposure 1.1 → cores mais ricas
- **3-point + fill lighting rig**: key (lime), rim (white), fill (soft lime)

### Hook GLTF (extensível)
- Setar `window.HN_LAPTOP_MODEL_URL = 'https://.../laptop.glb'` ANTES do reveal-scene.js carregar
- Carrega via `GLTFLoader` + `DRACOLoader` (CDN jsdelivr r128), oculta partes procedurais e adiciona modelo
- Fallback automático para procedural se falha o load

### Slam Cinematográfico (v3)
- **Entrada**: `translateY(-80px) scale(2.2) rotate(-3deg)` + `blur(28px)` + `brightness(1.6)` — cai do topo da tela com motion blur
- **Impacto (0.35s)**: 
  - Text shake ±5px × 4 keyframes (translate + rotate wobble)
  - `.slam-burst` DOM injetado com JS: 3 anéis concêntricos expandindo (scale 0.1→6, opacity 1→0) com delays 0.35/0.42/0.50s
  - 8 partículas radiais em ângulos 45° com jitter, cada uma voa `--dx/--dy` a distância 60-100px
  - `.slam-bar` horizontal (lightning line gradient lime→white→lime) atravessa o elemento
  - Camera shake no `.parentElement` (± 4px por 420ms com cubic-bezier explosivo)
- **Chromatic aberration**: pseudo `::after` clona o texto (via `content: attr(data-text)`) em vermelho + azul cyan com blend mode screen → estilo hit RGB flash
- **Afterglow**: pseudo `::before` gera aura radial lime (blur 18px) que cresce scale 0→1.3 durante 2.2s

### Files touched
- `/app/js/reveal-scene.js` (rewrite v3 — 380+ linhas com laptop realista completo)
- `/app/js/enhancements.js` (initSlam v2 com injectBurst)
- `/app/css/reveal-scene.css` (slam CINEMATIC: rings, particles, bar, chromatic, camera shake keyframes)
- `/app/index.html` (+ GLTFLoader + DRACOLoader script tags)
