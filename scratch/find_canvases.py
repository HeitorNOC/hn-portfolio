with open('c:/workspace/hn-portfolio/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

import re

# Find all canvas elements in HTML
canvases = re.findall(r'<canvas[^>]*id="([^"]+)"[^>]*>', html)
print("Canvases found in HTML:", canvases)

# Find all script source files in HTML
scripts = re.findall(r'<script[^>]*src="([^"]+)"[^>]*>', html)
print("Scripts found in HTML:", scripts)
