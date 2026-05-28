with open('c:/workspace/hn-portfolio/css/style.css', 'r', encoding='utf-8') as f:
    content = f.read()

import re

elements = ['svc3-panel__inner', 'svc3-title', 'svc3-divider', 'svc3-desc', 'svc3-tags', 'svc3-cta']
for el in elements:
    match = re.search(r'\.' + el + r'\s*\{([^}]+)\}', content)
    if match:
        print(f"=== {el} ===")
        print(match.group(1).strip())
