with open('c:/workspace/hn-portfolio/css/style.css', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(1440, 1455):
    if i < len(lines):
        print(f"{i+1}: {lines[i].strip()}")
