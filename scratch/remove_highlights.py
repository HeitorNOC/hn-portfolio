import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('c:/workspace/hn-portfolio/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Find and remove all occurrences of the <p class="svc3-highlights" ...> ... </p> block
# We match from <p class="svc3-highlights" to </p> including any whitespace
pattern = r'\s*<p class="svc3-highlights"[^>]*>[\s\S]*?</p>'
modified_content, count = re.subn(pattern, '', content)

print(f"Removed {count} highlights blocks from index.html.")

with open('c:/workspace/hn-portfolio/index.html', 'w', encoding='utf-8') as f:
    f.write(modified_content)

print("index.html updated successfully!")
