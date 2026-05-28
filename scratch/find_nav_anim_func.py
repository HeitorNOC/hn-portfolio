import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('c:/workspace/hn-portfolio/js/animations.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'initNavAnimations' in line:
        print(f"Found initNavAnimations at line {i+1}")
        for j in range(max(0, i-5), min(len(lines), i+30)):
            print(f"{j+1}: {lines[j].rstrip()}")
        break
