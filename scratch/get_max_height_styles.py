import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('c:/workspace/hn-portfolio/css/style.css', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'max-height: 820px' in line:
        print(f"Found max-height: 820px at line {i+1}")
        for j in range(max(0, i-2), min(len(lines), i+20)):
            print(f"{j+1}: {lines[j].rstrip()}")
