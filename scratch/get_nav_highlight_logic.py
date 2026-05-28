import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('c:/workspace/hn-portfolio/js/animations.js', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Find active highlight logic block
match = re.search(r'/\*\s*──\s*Nav scroll behaviour[\s\S]+?(?=\r?\n\r?\n|$)', content)
if match:
    print("=== NAV HIGHLIGHT LOGIC ===")
    print(match.group(0))
else:
    print("Not found with exact regex. Printing matching lines:")
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'nav__link' in line or 'NAV_IDS_WITH_LINKS' in line or 'is-active' in line:
            print(f"{i+1}: {line.strip()}")
