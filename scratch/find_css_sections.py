with open('c:/workspace/hn-portfolio/css/style.css', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '.section {' in line:
        print(f"Found .section at line {i+1}")
    if '.hero-loading {' in line:
        print(f"Found .hero-loading at line {i+1}")
