import re

with open('css/style.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Define o bloco de classes restauradas
restored_css = """/* ── Nav logo glow pulse ─────────────────────────────────────  */
.nav__logo svg {
  filter: drop-shadow(0 0 6px rgba(201, 243, 29, 0.0));
  transition: filter 0.4s;
}

.nav__logo:hover svg {
  filter: drop-shadow(0 0 12px rgba(201, 243, 29, 0.45));
}

/* ── Portfolio slide count badge ─────────────────────────────  */
.pf-slide__count {
  font-variant-numeric: tabular-nums;
}

/* ── Reduce glow on low-motion preference ───────────────────  */
@media (prefers-reduced-motion: reduce) {
  .hero::before,
  .hero::after,
  .contact__blob {
    animation: none;
  }
  .hero__word--fill {
    animation: none;
    background-position: 0% 50%;
  }
}

/* ─── Portfólio 3D Ring ──────────────────────────────────── */

/* Root provides scroll travel; height set to 350vh by JS */
.port-root {
  position: relative;
}

/* Sticky viewport that pins while the ring spins */
.port-stage {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
  perspective: 1400px;
  perspective-origin: 50% 55%;
}

/* Background WebGL canvas for dynamic futuristic visual overlay */
.port-bg-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  object-fit: cover;
}

/* Fade to bg at the bottom — smooth visual transition out of the section */
.port-stage::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: clamp(100px, 22vh, 200px);
  background: linear-gradient(to bottom, transparent, var(--bg));
  pointer-events: none;
  z-index: 30;
}

/* Header: above the ring — top must clear the fixed nav bar (~70px) */
.port-header {
  position: absolute;
  top: clamp(8rem, 13vh, 10.5rem);
  left: 0;
  right: 0;
  z-index: 10;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  text-align: center;
}

.port-header__label {
  color: var(--accent);
}

.port-header__title {
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
  color: var(--white);
}

.port-header__sub {
  color: rgba(245, 240, 232, 0.45);
  font-size: var(--text-sm);
  line-height: 1.5;
}

/* Full-stage layer that carries the 3D context */
/* padding-top pushes ring centre below the header overlay */
.port-scene {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-style: preserve-3d;
  padding-top: clamp(4rem, 8vh, 6rem);
  transform: translateY(4.5vh);
}

/* Zero-size anchor at stage centre; GSAP animates rotationY */
.port-ring {
  width: 0;
  height: 0;
  transform-style: preserve-3d;
}

/* Card: landscape format matches website screenshots.
   Centred at ring origin via negative margins, then placed on cylinder. */
.port-card {
  --card-w: clamp(260px, 24vw, 360px);
  --card-h: calc(var(--card-w) * 0.68); /* ≈ 3/2 landscape */

  position: absolute;
  top: 0;
  left: 0;
  width: var(--card-w);
  height: var(--card-h);
  margin-top: calc(var(--card-h) * -0.5);
  margin-left: calc(var(--card-w) * -0.5);

  /* Static 3D position of card bounds on the cylinder ring */
  transform: rotateY(var(--card-angle, 0deg))
             translateZ(var(--card-radius, 440px));

  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform-style: preserve-3d;
  cursor: pointer;
  z-index: 5;
}

/* Inner card wrapper for stable hover scaling and tilt 3D parallax */"""

# Encontra a posição de '/* ── Nav logo glow pulse ─────────────────────────────────────  */'
start_marker = "/* ── Nav logo glow pulse ─────────────────────────────────────  */"
end_marker = ".port-card__inner {"

pos_start = content.find(start_marker)
pos_end = content.find(end_marker)

if pos_start != -1 and pos_end != -1:
    new_content = content[:pos_start] + restored_css + "\n" + content[pos_end:]
    with open('css/style.css', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("CSS successfully repaired and restored!")
else:
    print(f"Error: Markers not found! Start: {pos_start}, End: {pos_end}")
