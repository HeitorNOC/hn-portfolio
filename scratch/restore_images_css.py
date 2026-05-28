with open('css/style.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Define o bloco de classes de estilo das imagens e corpos dos cards
images_css = """/* Inner card wrapper for stable hover scaling and tilt 3D parallax */
.port-card__inner {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--border);
  transform-style: preserve-3d;
  transition: border-color 0.4s var(--ease-out), box-shadow 0.4s var(--ease-out);
  will-change: transform;
}

.port-card__img {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: top center;
  transition: transform 0.7s var(--ease-out), filter 0.5s;
  filter: grayscale(15%);
}

.port-card:hover .port-card__img {
  transform: scale(1.06);
  filter: grayscale(0%);
}

.port-card__inner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(8, 8, 8, 0.9) 0%, rgba(8, 8, 8, 0.15) 55%, transparent 100%);
  z-index: 1;
}

.port-card__body {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: clamp(0.85rem, 2vw, 1.4rem);
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.4s var(--ease-out), transform 0.45s var(--ease-out);
}

.port-card:hover .port-card__body {
  opacity: 1;
  transform: translateY(0);
}

.port-card__cat {
  color: var(--accent);
}

.port-card__name {
  font-family: var(--font-display);
  font-size: clamp(0.9rem, 1.4vw, 1.2rem);
  font-weight: 700;
  color: var(--white);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.port-card__desc {
  font-size: clamp(0.72rem, 0.95vw, 0.85rem);
  color: rgba(245, 240, 232, 0.7);
  line-height: 1.45;
  margin-top: 4px;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.port-card__link {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  color: var(--accent);
}

.port-card:hover .port-card__link {
  opacity: 1;
  transform: translateY(0);
}

.port-card:hover .port-card__inner {
  border-color: rgba(201, 243, 29, 0.45);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5), 0 0 20px rgba(201, 243, 29, 0.1);
}"""

# Encontra a posição de '.port-card__inner {' e a substitui por todo o bloco
target_marker = ".port-card__inner {"

pos = content.find(target_marker)

if pos != -1:
    # Encontra o fechamento da antiga chave '}' após target_marker
    close_pos = content.find("}", pos)
    if close_pos != -1:
        new_content = content[:pos] + images_css + "\n" + content[close_pos+1:]
        with open('css/style.css', 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("CSS successfully updated with image styles!")
    else:
        print("Error: closing brace for .port-card__inner not found!")
else:
    print("Error: .port-card__inner marker not found!")
