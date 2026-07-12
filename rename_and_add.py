import os
import re
import random

char_dir = 'assets/characters'

# Get all copilot files
copilot_files = sorted([f for f in os.listdir(char_dir) if 'copilot' in f.lower()])
print(f"Found {len(copilot_files)} copilot files")

# Read monsters.js
with open('js/monsters.js', 'r') as f:
    content = f.read()

# Extract existing names to avoid duplicates
pattern = r'\{ id: (\d+), name: "([^"]+)", type: "([^"]+)", hp: (\d+), atk: (\d+), def: (\d+), spd: (\d+) \}'
entries = re.findall(pattern, content)
existing_names = set()
for entry in entries:
    existing_names.add(entry[1])

print(f"Existing names: {len(existing_names)}")

# Generate unique names for each copilot file
random.seed(42)
new_entries = []
used_ids = set(int(e[0]) for e in entries)
next_id = max(used_ids) + 1

# Generate names
prefixes = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Echo', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega']
suffixes = ['Unit', 'Frame', 'Core', 'Unit', 'Type', 'Spec', 'Model', 'Variant', 'Prime', 'Zero']
types = ['Tech', 'Robot', 'AI', 'Digital', 'Cyber', 'System', 'Machine', 'Unit', 'Frame', 'Node']

rename_map = {}
for i, copilot_file in enumerate(copilot_files):
    prefix = prefixes[i % len(prefixes)]
    suffix = suffixes[(i // len(prefixes)) % len(suffixes)]
    type_ = types[i % len(types)]
    name = f"{prefix}{suffix}"
    
    # Ensure unique name
    base_name = name
    counter = 1
    while name in existing_names or name in [e['name'] for e in new_entries]:
        name = f"{base_name}{counter}"
        counter += 1
    
    # Generate balanced random stats
    # Pattern similar to existing: most stats 200-350, some at 200
    stats = []
    for _ in range(4):
        # Mix of 200 and 250-350
        if random.random() < 0.3:
            stats.append(200)
        else:
            stats.append(random.randint(248, 350))
    
    random.shuffle(stats)
    hp, atk, def_, spd = stats
    
    new_entry = {
        'id': next_id,
        'name': name,
        'type': type_,
        'hp': hp,
        'atk': atk,
        'def': def_,
        'spd': spd,
    }
    new_entries.append(new_entry)
    rename_map[copilot_file] = name
    next_id += 1

# Print rename map
print("\n=== RENAME MAP ===")
for old, new in sorted(rename_map.items()):
    print(f"{old} -> {new}.png")

# Print new entries
print("\n=== NEW ENTRIES FOR MONSTERS.JS ===")
for entry in new_entries:
    print(f'  {{ id: {entry["id"]}, name: "{entry["name"]}", type: "{entry["type"]}", hp: {entry["hp"]}, atk: {entry["atk"]}, def: {entry["def"]}, spd: {entry["spd"]} }},')

# Generate PowerShell rename commands
print("\n=== RENAME COMMANDS ===")
for old, new in sorted(rename_map.items()):
    src = os.path.join(char_dir, old)
    dst = os.path.join(char_dir, f"{new}.png")
    print(f'Rename-Item -Path "{src}" -Destination "{dst}" -Force')
