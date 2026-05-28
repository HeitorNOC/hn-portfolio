with open('c:/workspace/hn-portfolio/css/style.css', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'port-' in line or 'svc3-' in line:
        print(f"{i+1}: {line.strip()}")
