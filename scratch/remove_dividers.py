import re

file_path = 'c:/workspace/hn-portfolio/index.html'

with open(file_path, 'r', encoding='utf-8') as file:
    content = file.read()

# Replace all divider lines
pattern = r'\s*<div class="svc3-divider" aria-hidden="true"><span></span></div>'
new_content = re.sub(pattern, '', content)

with open(file_path, 'w', encoding='utf-8') as file:
    file.write(new_content)

print("Done! Removed all dividers.")
