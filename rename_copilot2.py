import os
import re
import random

char_dir = 'assets/characters'

# Get all copilot files (including duplicates with (1) suffix)
all_copilot = [f for f in os.listdir(char_dir) if 'copilot' in f.lower() and f.endswith('.png')]
all_copilot_sorted = sorted(all_copilot)
print(f"Found {len(all_copilot_sorted)} copilot files")

# Read monsters.js
with open('js/monsters.js', 'r') as f:
    content = f.read()

# Extract existing names and last ID
pattern = r'\{ id: (\d+), name: "([^"]+)", type: "([^"]+)", hp: (\d+), atk: (\d+), def: (\d+), spd: (\d+) \}'
entries = re.findall(pattern, content)
existing_names = set()
for entry in entries:
    existing_names.add(entry[1])

used_ids = set(int(e[0]) for e in entries)
next_id = max(used_ids) + 1
print(f"Last ID: {max(used_ids)}, Next ID: {next_id}")

# Generate unique names using Greek letters continued
prefixes = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Echo', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa',
            'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 'Tau', 'Upsilon',
            'Phi', 'Chi', 'Psi', 'Omega']
suffixes = ['Unit', 'Frame', 'Core', 'Spec', 'Model', 'Prime', 'Zero', 'One', 'Nexus', 'Orb']
types = ['Tech', 'Robot', 'AI', 'Digital', 'Cyber', 'System', 'Machine', 'Node', 'Matrix', 'Data']

rename_map = {}
new_entries = []

# Find how many existing unit/frame names there are
existing_units = [n for n in existing_names if any(n.endswith(s) for s in suffixes)]
print(f"Existing unit/frame names: {len(existing_units)}")

counter = 0
for copilot_file in all_copilot_sorted:
    # Generate unique name
    prefix_idx = counter % len(prefixes)
    suffix_idx = (counter // len(prefixes)) % len(suffixes)
    prefix = prefixes[prefix_idx]
    suffix = suffixes[suffix_idx]
    type_ = types[counter % len(types)]
    
    base_name = f"{prefix}{suffix}"
    name = base_name
    dup_count = 1
    while name in existing_names or name in [e['name'] for e in new_entries]:
        name = f"{base_name}{dup_count}"
        dup_count += 1
    
    # Generate balanced random stats
    random.seed(next_id + counter)
    stats = []
    for _ in range(4):
        if random.random() < 0.3:
            stats.append(200)
        else:
            stats.append(random.randint(248, 350))
    random.shuffle(stats)
    hp, atk, def_, spd = stats
    
    new_entry = {
        'id': next_id + counter,
        'name': name,
        'type': type_,
        'hp': hp,
        'atk': atk,
        'def': def_,
        'spd': spd,
    }
    new_entries.append(new_entry)
    rename_map[copilot_file] = f"{name}.png"
    counter += 1

# Output rename commands
print("\n=== RENAME COMMANDS ===")
for old, new in sorted(rename_map.items()):
    print(f"Rename-Item -Path \"assets/characters\\{old}\" -Destination \"assets/characters\\{new}\" -Force")

# Output new entries
print("\n=== NEW ENTRIES ===")
for entry in new_entries:
    print(f'  {{ id: {entry["id"]}, name: "{entry["name"]}", type: "{entry["type"]}", hp: {entry["hp"]}, atk: {entry["atk"]}, def: {entry["def"]}, spd: {entry["spd"]} }},')
