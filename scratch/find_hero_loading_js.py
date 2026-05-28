import sys
sys.stdout.reconfigure(encoding='utf-8')

import os
js_dir = 'c:/workspace/hn-portfolio/js'
for fname in os.listdir(js_dir):
    if fname.endswith('.js'):
        path = os.path.join(js_dir, fname)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        if 'hero-loading' in content:
            print(f"Found 'hero-loading' in {fname}:")
            for i, line in enumerate(content.split('\n')):
                if 'hero-loading' in line:
                    print(f"  Line {i+1}: {line.strip()}")
