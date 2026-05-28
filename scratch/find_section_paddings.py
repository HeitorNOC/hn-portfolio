with open('c:/workspace/hn-portfolio/css/style.css', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Find .section rule
match = re.search(r'\.section\s*\{([^}]+)\}', content)
if match:
    print("=== .section ===")
    print(match.group(1).strip())

# Find any rule matching portfolio or header top
for line in content.split('\n'):
    if 'padding-block' in line or 'padding-top' in line:
        if any(sec in line for sec in ['.section', 'process', 'about', 'port', 'svc']):
            print(line.strip())
