# 💎 Guia de Contexto: Desenvolvimento de Web Sites Premium (Animados, Responsivos e de Alta Performance)

Este documento atua como um repositório de diretrizes de engenharia e boas práticas de design para a criação de experiências de internet imersivas de alto luxo, integrando animações fluidas (GSAP/ScrollTrigger), simulação 3D (WebGL/Three.js) e performance técnica de ponta. Ele serve de base contextual para desenvolvedores e assistentes de IA arquitetarem projetos semelhantes com máxima robustez.

---

## 🚀 1. Filosofia de Design Imersivo (Aesthetics First)

1. **Aura e Profundidade**: Evite fundos pretos chapados (`#000000`) ou brancos puros. Prefira tonalidades ricas e atmosféricas (ex: `#080808` obsidian com gradientes radiais sutis e ruído analógico simulado com opacidade de `0.045`).
2. **Identidade Cromática Coesa**:
   * Estabeleça um sistema estrito de cores com base em HSL ou HSB. 
   * **Esquema de Botões Padrão**: Siga sempre o sistema de dois botões:
     1. *Botão Primário (`.btn--primary`)*: Preenchido com a cor de destaque (ex: verde-lima neon) com texto escuro e sombra de projeção elegante.
     2. *Botão Secundário (`.btn--outline`)*: Contorno fino na cor de destaque com fundo transparente, sofrendo transição fluida (*morph*) para preenchimento sólido ao passar o mouse.
3. **Tipografia Premium**: Use fontes display modernas e largas (ex: *Syne*, *Clash Display*, *Outfit*) com proporções generosas de espaçamento interno e kerning negativo (`letter-spacing: -0.03em`) para títulos imponentes.

---

## ⚙️ 2. Arquitetura de Animação Avançada (GSAP & ScrollTrigger)

### A. Restrição Síncrona de Ordem do DOM (Race Conditions de Offsets)
* **O Problema:** O GSAP `ScrollTrigger` calcula pontos de ancoragem (`offsetTop`) varrendo a página de cima para baixo. Elementos com `pin: true` criam dinamicamente containers de espaçamento (*pin-spacers*). Se uma seção inferior for inicializada *antes* de uma seção superior que cria um *pin-spacer*, a seção inferior calculará seus offsets ignorando a altura do spacer, ativando as animações de forma precoce e quebrando o scroll.
* **A Diretriz:** **Sempre inicialize os ScrollTriggers na ordem física exata em que aparecem no DOM.** Mantenha um boot sequencial único:
  ```javascript
  window.initAllAnimations = function() {
    initSobre();
    initProcesso();
    initManifesto(); // <-- Cria pin-spacer de 150vh
    initServicos();  // <-- Cria pin-spacer de 230vh
    initPortfolio(); // <-- Rotação calculada corretamente após os spacers acima!
  };
  ```

### B. Distribuição Simétrica de Linha do Tempo (Symmetry Buffer)
* **O Problema:** Em carrosséis com rolagem horizontal controlados por timelines e `scrub`, o último painel frequentemente fica sem tempo de tela de saída. Como a timeline termina exatamente no fim do último tween de movimento, o usuário atinge o limite do scroll-stage e a seção imediatamente se desfaz ou retrocede precocemente ao rolar para cima.
* **A Diretriz:** Estenda síncronamente a duração da timeline adicionando um ponto neutro (*dummy set/callback*) ao final da linha de tempo no exato ponto `N - 1`:
  ```javascript
  // Se N = 5 painéis e a animação vai até 3.65s
  tl.set({}, {}, N - 1); // Estende síncronamente a timeline até 4.0s
  ```
  Isso distribui o progresso do scroll de forma simétrica, garantindo que o primeiro e o último painel compartilhem o mesmo tempo de tela estável.

### C. Resolução de Concorrência de Tweens (*Kill-on-Enter*)
* **O Problema:** Rolagens rápidas criam animações concorrentes (entrada e saída sendo disparadas ao mesmo tempo no mesmo elemento). Staggers atrasados de tweens de saída podem sobrescrever valores de novos tweens de entrada, deixando elementos invisíveis ou desalinhados na tela.
* **A Diretriz:** Rastreie a timeline ativa de cada painel e mate-a compulsoriamente antes de iniciar um novo fluxo visual:
  ```javascript
  if (panel.currentTimeline) panel.currentTimeline.kill();
  panel.currentTimeline = gsap.timeline();
  ```

---

## ⚡ 3. Otimização de Performance WebGL e Canvas 2D

### A. Preservação de Layout (`visibility: hidden` vs `display: none`)
* **O Problema:** Ocultar canvases WebGL fora da tela com `display: none` colapsa sua largura e altura físicas para `0x0`. Ao realizar resizes ou reexibir o canvas, a viewport do motor (ex: Three.js Renderer) falha ao atualizar os buffers de renderização, deixando a tela inteiramente preta.
* **A Diretriz:** Use sempre `visibility: hidden` (e `visibility: visible`) para remover o canvas da camada do compositor de GPU sem alterar sua presença física de caixa no layout. Isso garante carregamento instantâneo a 60fps ao reexibir os gráficos.

### B. Desenho de Partículas em Lote (Batched Path Drawing)
* **O Problema:** Desenhar milhares de partículas utilizando chamadas individuais de renderização (`ctx.beginPath()`, `ctx.fill()`) satura a CPU em 100%, reduzindo a taxa de quadros a níveis inaceitáveis no celular.
* **A Diretriz:** Agrupe as partículas por opacidade e cor e realize chamadas únicas de desenho para o lote (*batch*):
  ```javascript
  ctx.fillStyle = 'rgba(201,243,29,0.8)';
  ctx.beginPath();
  for (let k = 0; k < list.length; k++) {
    ctx.moveTo(p.x + p.size, p.y);
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
  }
  ctx.fill(); // Uma única chamada de renderização por lote!
  ```

### C. Limite de Resolução Física (devicePixelRatio Capped)
* **O Problema:** Em telas de retina ou monitores 4K de alta densidade (`devicePixelRatio >= 3`), desenhar em escala nativa exige renderizar 9x mais pixels, provocando superaquecimento da GPU.
* **A Diretriz:** Defina um teto máximo para a densidade de pixels no renderizador, mantendo as bordas nítidas sem perdas de desempenho:
  ```javascript
  const dpr = Math.min(window.devicePixelRatio, 1.5);
  renderer.setPixelRatio(dpr);
  ```

---

## 📱 4. Design Responsivo Extremo e Tipografia Fluida

### A. Contenção de Fontes Display Largas (Anti-Clipping)
* **O Problema:** Títulos enormes usando fontes ultra-largas em containers com `overflow: hidden` (ex: wrappers de revelação de texto) sofrem cortes brutais de traçado nas letras das extremidades (como a letra "a" ou "o" no final da frase) em telas de notebooks ou tablets de tamanho médio.
* **A Diretriz:**
  1. **Reduza o multiplicador de viewport (`vw`)** em fórmulas de clamp tipográfico para garantir que a largura total do texto caiba dentro da grade do container (ex: mude de `clamp(3rem, 7vw, 6rem)` para `clamp(3rem, 6.2vw, 6rem)`).
  2. **Adicione um recuo lateral invisível** nas caixas de texto usando `padding-right` (ex: `padding-right: 0.25em`) para criar uma margem segura de proteção aos traçados externos.

### B. Gestão Coerente de Empilhamento (Stacking Contexts)
* **O Problema:** Elementos flutuantes, overlays absolutos de gradiente (ex: `.hero__bottom-fade`) e telas de animação entram em conflito de empilhamento. Máscaras escuras de fundo podem acidentalmente ficar por cima de parágrafos e botões interativos, desbotando suas cores e bloqueando cliques do mouse.
* **A Diretriz:** Estabeleça um sistema claro de `z-index` nas seções:
  * *Camada WebGL Base*: `z-index: 0`
  * *Camadas de Atmosfera e Máscaras Gradientes*: `z-index: 1` a `z-index: 3`
  * *Camada de Conteúdo Interativo (Textos, Botões)*: `z-index: 4` a `z-index: 10` (garantindo nitidez total)
  * *Barra de Navegação superior e Cursor Customizado*: `z-index: 1000+`

---

## 🔒 5. Independência e Resiliência Técnica (Offline-First)

* **O Problema:** Sites que dependem de CDNs externos para carregar scripts essenciais (GSAP, Three.js, ScrollTrigger) travam completamente na tela de carregamento (*loader*) se o usuário possuir conexões corporativas com firewall bloqueado ou timeouts de rede.
* **A Diretriz:** Salve sempre cópias locais das bibliotecas críticas no diretório local do projeto (ex: `/js/libs/`) e faça a chamada interna síncrona. O site deve bootar e renderizar em 60fps de forma 100% autônoma, operando offline e sem dependências de rede.
