with open('c:/workspace/hn-portfolio/css/style.css', 'r', encoding='utf-8') as f:
    content = f.read()

import re

matches = re.findall(r'@media\s*\(\s*max-height\s*:\s*820px\s*\)\s*\{([^}]+)\}', content)
for m in matches:
    print("=== @media (max-height: 820px) ===")
    print(m.strip())

# Or search generally for max-height
print("=== General max-height search ===")
for line in content.split('\n'):
    if 'max-height' in line:
        print(line.strip())
