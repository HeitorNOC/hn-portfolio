with open('c:/workspace/hn-portfolio/css/style.css', 'r', encoding='utf-8') as f:
    content = f.read()

import re
match = re.search(r'\.hero-loading[^{]*\{([^}]+)\}', content)
if match:
    print("=== .hero-loading ===")
    print(match.group(0))
else:
    print("hero-loading rule not found in style.css!")
