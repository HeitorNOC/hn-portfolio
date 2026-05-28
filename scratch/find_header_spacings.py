with open('c:/workspace/hn-portfolio/css/style.css', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Find paddings of sections
sections = ['about', 'process-section', 'svc3-root', 'port-root', 'contact']
for sec in sections:
    match = re.search(r'\.' + sec + r'\s*\{([^}]+)\}', content)
    if match:
        print(f"=== {sec} ===")
        print(match.group(1).strip())

# Find headers of sections
headers = ['about__left', 'process-header', 'svc3-ui', 'port-header', 'contact__left']
for header in headers:
    match = re.search(r'\.' + header + r'\s*\{([^}]+)\}', content)
    if match:
        print(f"=== {header} ===")
        print(match.group(1).strip())
