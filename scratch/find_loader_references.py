import sys
sys.stdout.reconfigure(encoding='utf-8')

import os
js_dir = 'c:/workspace/hn-portfolio/js'
for fname in os.listdir(js_dir) + ['script.js']:
    path = fname if fname == 'script.js' else os.path.join(js_dir, fname)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        if 'initLoader' in content or 'loader__' in content or 'loader ' in content:
            print(f"Found reference in {fname}:")
            for i, line in enumerate(content.split('\n')):
                if 'initLoader' in line or 'loader' in line:
                    print(f"  Line {i+1}: {line.strip()}")
