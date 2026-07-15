import os, re

char_dir = 'assets/characters'
all_files = sorted([f.replace('.png','') for f in os.listdir(char_dir) if f.endswith('.png')])
print(f'Total files: {len(all_files)}')

with open('js/monsters.js') as f:
    content = f.read()

entries = re.findall(r'name: "([^"]+)"', content)
print(f'JS entries: {len(entries)}')

missing = [f for f in all_files if f not in entries]
print(f'Missing from JS: {len(missing)}')
for m in missing:
    print(f'  {m}')
