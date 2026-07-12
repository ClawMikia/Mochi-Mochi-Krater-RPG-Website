import re

with open('js/monsters.js', 'r') as f:
    content = f.read()

names = re.findall(r'name: "([^"]+)"', content)
print(f'Total entries: {len(names)}')
print(f'Unique names: {len(set(names))}')

from collections import Counter
counts = Counter(names)
dupes = {k: v for k, v in counts.items() if v > 1}
if dupes:
    print(f'Duplicates: {dupes}')
else:
    print('No duplicates!')

ids = re.findall(r'id: (\d+)', content)
print(f'ID range: {ids[0]} to {ids[-1]}')
print(f'Total IDs: {len(ids)}')
