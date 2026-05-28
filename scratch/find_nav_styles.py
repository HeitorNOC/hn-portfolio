with open('c:/workspace/hn-portfolio/css/style.css', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Find .nav rule
match = re.search(r'\.nav\s*\{([^}]+)\}', content)
if match:
    print("=== .nav ===")
    print(match.group(1).strip())
