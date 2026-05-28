import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('c:/workspace/hn-portfolio/js/main.js', 'r', encoding='utf-8') as f:
    main_content = f.read()

with open('c:/workspace/hn-portfolio/js/animations.js', 'r', encoding='utf-8') as f:
    anim_content = f.read()

print("=== Search in main.js ===")
for line in main_content.split('\n'):
    if 'active' in line or 'nav__link' in line or 'scroll' in line:
        print(line.strip())

print("=== Search in animations.js ===")
for line in anim_content.split('\n'):
    if 'active' in line or 'nav__link' in line or 'scroll' in line:
        print(line.strip())
