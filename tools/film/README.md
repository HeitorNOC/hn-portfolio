# Filme da abertura

Os frames do hero (`/pack`) saem de `pipeline.py`: corta, enquadra (16:9 em 1600×900 e retrato em 720×1280),
aplica a mesma grade de cor em todos os planos e empacota 30 WebP por plano em um arquivo (`pack/{d,m}/hN.webp` + `pack/manifest.json`).

Fontes dos planos (Pexels, licença livre): 5474275, 14970182, 852063, 7989474, 6804128, 7140931, 1085656,
16667320, 16671042, 8441631, 8426095, 8657613, 8061760, 14392820. O corredor do data center (s06) é uma imagem gerada no Runway,
animada em 2.5D pelo próprio script.

Para regerar: coloque os vídeos em `src/<id>.mp4`, a imagem do corredor em `stills/aisle.png` e rode `python3 pipeline.py`.
