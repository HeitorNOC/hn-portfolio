# 🎨 Masterclass de WebGL com Three.js: Animações Complexas, Shaders Customizados e Otimização de GPU

Este manual fornece uma imersão técnica e matemática profunda sobre programação de computação gráfica para navegadores utilizando a biblioteca **Three.js** e a linguagem **GLSL (OpenGL Shading Language)**. É projetado para ser um guia definitivo de engenharia gráfica, ensinando desenvolvedores a criarem partículas volumétricas dinâmicas, deformações geométricas orgânicas, shaders atmosféricos e transições tridimensionais integradas a eventos de rolagem (*ScrollTrigger*).

---

## 🚀 1. A Arquitetura WebGL: Entendendo a GPU

Ao contrário do JavaScript convencional, que roda em uma única thread na CPU de forma linear, a **GPU (Graphics Processing Unit)** opera em uma arquitetura massivamente paralela. Ela é desenhada para computar milhões de operações matemáticas simultaneamente (um processamento dedicado a cada pixel na tela).

```
         CPU (JavaScript)
                |
                v  [Carrega Geometrias, Texturas e Uniforms]
          Barramento PCI
                |
                v
         GPU (WebGL Pipeline)
  +-------------------------------+
  | 1. Vertex Shader (3D a 2D)    | <-- Computa posição dos pontos
  +-------------------------------+
                |
                v  [Rasterização: Converte vetores em pixels]
  +-------------------------------+
  | 2. Fragment Shader (Pixels)   | <-- Calcula a cor de cada pixel
  +-------------------------------+
                |
                v
          Framebuffer (Tela)
```

### O Pipeline Gráfico
1. **CPU:** Gerencia o ciclo de vida, lê dados do usuário (mouse, scroll, tempo), cria geometrias em vértices e envia as informações para a GPU por meio de buffers de dados (*BufferAttributes*).
2. **Vertex Shader:** Um programa em GLSL que roda uma vez para **cada vértice** da geometria 3D. Sua função principal é projetar as coordenadas 3D no plano 2D do monitor, calculando a variável nativa `gl_Position`.
3. **Rasterização:** O WebGL converte as formas vetoriais geométricas em fragmentos (pixels potenciais) que cobrem a tela.
4. **Fragment Shader (Pixel Shader):** Um programa em GLSL que roda uma vez para **cada pixel** individual que é desenhado no monitor. Sua única responsabilidade é determinar a cor RGB e a opacidade Alfa de cada ponto, atribuindo esse valor à variável nativa `gl_FragColor`.

---

## ✍️ 2. A Linguagem GLSL (OpenGL Shading Language)

GLSL é uma linguagem tipada, fortemente baseada na sintaxe do C. Ela não possui garbage collector, alocação dinâmica de memória ou funções string. É otimizada puramente para álgebra linear e vetores.

### Tipos de Dados Fundamentais
* `float`: Números decimais (sempre declare com ponto, ex: `1.0`, `0.0`).
* `vec2`, `vec3`, `vec4`: Vetores de 2, 3 e 4 componentes, ideais para armazenar coordenadas (x, y, z), cores (r, g, b, a) ou posições (u, v).
* `mat2`, `mat3`, `mat4`: Matrizes quadradas usadas para transformações lineares (rotação, translação, escala).
* `sampler2D`: Representa uma textura de imagem 2D carregada da CPU.

### Variáveis de Escopo e Comunicação
* **Uniforms:** Variáveis enviadas da CPU que permanecem **idênticas** para todos os vértices e fragmentos de um frame (ex: tempo atual, coordenadas do mouse, progresso do scroll). Elas podem ser atualizadas a cada frame no loop do JavaScript.
* **Attributes:** Variáveis exclusivas de cada vértice, enviadas em lotes pela CPU. Elas só existem no **Vertex Shader** (ex: posição original do ponto, mapeamento UV, vetor normal).
* **Varyings:** Variáveis declaradas no Vertex Shader que são **interpoladas** e enviadas para o **Fragment Shader**. Elas permitem passar dados do vértice para o pixel (ex: passar a posição calculada ou coordenadas UV para determinar gradientes de cor por pixel).

---

## 🌊 3. Vertex Shaders: Deformando Geometrias 3D

O Vertex Shader permite alterar a posição física de geometrias em tempo de execução, realizando deformações orgânicas como ondas oceânicas, tecidos ao vento ou ondulações de terreno, diretamente na GPU.

### Exemplo Prático: Shader de Onda de Ondulação Distorcida (Vertex Shader)
```glsl
uniform float uTime;
uniform float uWaveSpeed;
uniform float uWaveFrequency;
uniform float uWaveAmplitude;

varying vec2 vUv;
varying float vElevation;

// Função clássica de ruído pseudo-aleatório senoide para deformação
float calculateElevation(vec3 position) {
    float elevation = sin(position.x * uWaveFrequency + uTime * uWaveSpeed) * 
                      cos(position.y * uWaveFrequency + uTime * uWaveSpeed) * 
                      uWaveAmplitude;
    return elevation;
}

void main() {
    vUv = uv; // Passa mapeamento UV nativo para o Fragment Shader
    
    vec3 newPosition = position;
    
    // Deforma o eixo Z (profundidade) baseado em funções de tempo e posição
    float elevation = calculateElevation(newPosition);
    newPosition.z += elevation;
    
    vElevation = elevation; // Envia a elevação calculada para pintar a cor no Fragment

    // Realiza as transformações de câmera e perspectiva do Three.js
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
```

---

## 🎨 4. Fragment Shaders: Pintura Procedural e Efeitos de Névoa

No Fragment Shader, o desenvolvedor atua no nível atômico da cor. É possível gerar gradientes dinâmicos, fusões de cores, atmosferas de fumaça procedurais e distorções cromáticas.

### Ruído FBM (Fractal Brownian Motion)
Para simular fenômenos da natureza como fumaça, nuvens, fogo ou líquidos viscosos, a técnica matemática recomendada é o **FBM**, que sobrepõe múltiplos níveis (*oitavas*) de ruído matemático com frequências crescentes e amplitudes decrescentes.

```glsl
// Vertex de apoio envia vUv e vTime
varying vec2 vUv;
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;

// Função clássica de ruído de gradiente 2D
float noise(in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = sin(dot(i, vec2(127.1, 311.7))) * 43758.5453123;
    // Interpolação suave para transições orgânicas
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(fract(a), fract(a + 1.0), u.x), 
               mix(fract(a + 2.0), fract(a + 3.0), u.x), u.y);
}

#define OCTAVES 4
float fbm(in vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < OCTAVES; i++) {
        value += amplitude * noise(st * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    vec2 uv = vUv;
    
    // Domain Warping: distorce as coordenadas UV usando ruído recursivo
    vec2 distortion = vec2(
        fbm(uv * 3.0 + uTime * 0.2),
        fbm(uv * 3.0 - uTime * 0.2)
    );
    
    float noisePattern = fbm(uv * 2.0 + distortion * 2.0);
    
    // Interpola entre duas cores com base no padrão de névoa orgânica calculado
    vec3 finalColor = mix(uColorA, uColorB, noisePattern);
    
    // Adiciona um gradiente de vinheta suave nas bordas para profundidade cinematográfica
    float edgeAlpha = smoothstep(0.0, 0.45, uv.x) * smoothstep(1.0, 0.55, uv.x) *
                      smoothstep(0.0, 0.45, uv.y) * smoothstep(1.0, 0.55, uv.y);
                      
    gl_FragColor = vec4(finalColor, noisePattern * edgeAlpha);
}
```

---

## 🔮 5. Sistemas de Partículas Dinâmicos e Transições Tridimensionais (Morphing)

Para criar transições espetaculares de partículas que se reagrupam em formas diferentes (ex: de uma esfera para uma forma cilíndrica ou para um plano plano) de maneira fluida e de alto desempenho, **todo o cálculo deve ocorrer na GPU**. Atualizar as posições no JavaScript frame por frame causa gargalos severos de transmissão de dados na CPU.

```
       PARTÍCULAS INICIAIS
       +-----------------+
       |     Esfera      | (uProgress = 0.0)
       +--------+--------+
                |
                |  [Desliza o Scroll (uProgress se move de 0.0 a 1.0)]
                v
       INTERPOLAÇÃO NA GPU
       +-----------------+
       |   gl_Position   | = mix(PositionA, PositionB, uProgress)
       +--------+--------+
                |
                v
        FORMA FINALIZADA
       +-----------------+
       |    Cilindro     | (uProgress = 1.0)
       +-----------------+
```

### A Estrutura dos Buffers
Carregamos os vértices de múltiplas formas geométricas em buffers separados na CPU e os enviamos para a GPU de uma única vez sob a forma de atributos customizados:
1. `position`: A forma de partida (Forma A).
2. `aTarget`: A forma de destino (Forma B).

### O Vertex Shader de Morphing Volumétrico
```glsl
attribute vec3 aTarget; // Vetor da posição na forma de destino

uniform float uProgress; // Controlado pelo ScrollTrigger (0.0 a 1.0)
uniform float uTime;

varying float vSpeedColor;

void main() {
    // Interpola linearmente a posição de cada partícula individual entre as duas geometrias
    vec3 mixedPosition = mix(position, aTarget, uProgress);
    
    // Adiciona uma turbulência caótica no ápice da transição (quando uProgress = 0.5)
    float transitionState = sin(uProgress * 3.14159); // Vai de 0.0 a 1.0 no meio da transição
    float turbulence = sin(mixedPosition.y * 10.0 + uTime) * cos(mixedPosition.x * 10.0 + uTime) * 0.15;
    mixedPosition.x += turbulence * transitionState;
    mixedPosition.z += turbulence * transitionState;
    
    vSpeedColor = transitionState;

    // Configura o tamanho de projeção da partícula com correção de perspectiva de distância
    vec4 mvPosition = modelViewMatrix * vec4(mixedPosition, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Partículas maiores quanto mais próximas da câmera
    gl_PointSize = (12.0 / -mvPosition.z); 
}
```

---

## 🔗 6. Integração de Shaders com JavaScript e ScrollTrigger

A comunicação entre a CPU (JavaScript) e a GPU (GLSL Shaders) é realizada por meio da configuração do dicionário de `uniforms` do `THREE.ShaderMaterial` do Three.js.

### Configuração do Material e Render Loop
```javascript
// 1. Definição do material com uniforms reativos
const myUniforms = {
  uTime: { value: 0.0 },
  uProgress: { value: 0.0 },
  uColorA: { value: new THREE.Color('#060c08') },
  uColorB: { value: new THREE.Color('#C9F31D') }
};

const shaderMaterial = new THREE.ShaderMaterial({
  vertexShader: myVertexShaderCode,
  fragmentShader: myFragmentShaderCode,
  uniforms: myUniforms,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending // Efeito de brilho cumulativo de partículas
});

// 2. Criação do Mesh ou Points no Three.js
const particleSystem = new THREE.Points(myGeometry, shaderMaterial);
scene.add(particleSystem);

// 3. Atualização no loop requestAnimationFrame (rAF)
const clock = new THREE.Clock();
function animate() {
  const elapsedTime = clock.getElapsedTime();
  
  // Atualiza síncronamente o uniform de tempo na GPU a cada frame
  myUniforms.uTime.value = elapsedTime;
  
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
```

### Acoplamento Perfeito com GSAP ScrollTrigger
Podemos vincular o progresso físico de rolagem de uma seção diretamente ao uniform de transição `uProgress` da GPU, mantendo o controle total da animação nas mãos do usuário:
```javascript
gsap.to(myUniforms.uProgress, {
  value: 1.0, // Progresso final na GPU
  ease: 'none',
  scrollTrigger: {
    trigger: '#secao-3d',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.6, // Amortecimento de 0.6 segundos para maior inércia visual
    pin: true   // Fixa a seção enquanto a transição de partículas ocorre
  }
});
```

---

## 🛠️ 7. Depuração e Otimização Avançada de Shaders

Shaders não exibem logs no console do navegador (`console.log`) e não suportam breakpoints de inspeção convencionais. Se houver qualquer erro aritmético silencioso, a renderização quebrará inteiramente na GPU.

### A. Técnica de Depuração por Cor (Color Debugging)
Para descobrir se uma variável matemática do shader está computando valores corretos ou ultrapassando limites, use-a para determinar a cor direta de saída do pixel.
* **Exemplo de Verificação:** Se você deseja inspecionar se a variável de elevação vertical `vElevation` está no intervalo correto de `0.0` a `1.0`:
  ```glsl
  // No Fragment Shader
  gl_FragColor = vec4(vElevation, 0.0, 0.0, 1.0);
  ```
  Se a tela acender em tons de vermelho brilhante nas cristas e preto nos vales, o cálculo está perfeito. Se piscar inteiramente branco, o valor ultrapassou `1.0` (indicando amplitude excessiva).

### B. Evite Ramificações de Código Complexas (Branching)
A GPU processa múltiplos blocos de dados simultaneamente sob a premissa de que todos os pixels rodarão exatamente as mesmas instruções. O uso de declarações condicionais (`if/else`) complexas que produzem caminhos de código diferentes para pixels adjacentes desativa a paralelização da GPU, degradando drasticamente o desempenho.
* **Padrão Ruim (Satura o hardware):**
  ```glsl
  float colorIntensity;
  if (vUv.x > 0.5) {
      colorIntensity = 1.0;
  } else {
      colorIntensity = 0.0;
  }
  ```
* **Padrão Premium (Otimizado matematicamente com funções embutidas):**
  ```glsl
  float colorIntensity = step(0.5, vUv.x);
  ```
  Use sempre as funções nativas de hardware do GLSL: `step()`, `smoothstep()`, `clamp()`, `mix()`, `sign()`, `abs()`, `min()`, `max()`. Elas rodam em circuitos integrados dedicados na GPU, executando instantaneamente.
