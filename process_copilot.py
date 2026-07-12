import os
import re
import random

char_dir = 'assets/characters'

# Matches from the comparison (copilot_file -> existing_file)
matches = {
    "Copilot_20260713_032104.png": "JungleCrusher.png",
    "Copilot_20260713_032106.png": "ColossusCrusher.png",
    "Copilot_20260713_032107.png": "SushiSenpai.png",
    "Copilot_20260713_032111.png": "BubblesBerserker.png",
    "Copilot_20260713_032405.png": "QuillQuartermaster.png",
    "Copilot_20260713_032406.png": "PrunerPummeler.png",
    "Copilot_20260713_032407.png": "RhythmRampage.png",
    "Copilot_20260713_032409.png": "RootRipper.png",
    "Copilot_20260713_032707.png": "QuokkaQuarrel.png",
    "Copilot_20260713_032709.png": "KettleKnight.png",
    "Copilot_20260713_032710.png": "FerryFury.png",
    "Copilot_20260713_032712.png": "GeodeGoliath.png",
    "Copilot_20260713_033214.png": "MarshmallowMangler.png",
    "Copilot_20260713_033215.png": "CupcakeCarnage.png",
    "Copilot_20260713_033216.png": "ProducePummeler.png",
    "Copilot_20260713_033223.png": "ViralVandal.png",
    "Copilot_20260713_033730.png": "GravelGoliath.png",
    "Copilot_20260713_033734.png": "GlueGoliath.png",
    "Copilot_20260713_033735.png": "PotPummeler.png",
    "Copilot_20260713_033736.png": "ConfettiCrusher.png",
    "Copilot_20260713_034224.png": "MochiMarauder.png",
    "Copilot_20260713_034225.png": "UrchinUndertaker.png",
    "Copilot_20260713_034226.png": "BagelBarista.png",
    "Copilot_20260713_034228.png": "PencilPummeler.png",
    "Copilot_20260713_034442.png": "ColdSpaghettiCarl.png",
    "Copilot_20260713_034446.png": "ShoreSlasher.png",
    "Copilot_20260713_034449.png": "FossilFury.png",
    "Copilot_20260713_034451.png": "PocketPuncher.png",
    "Copilot_20260713_035036.png": "HedgeHavoc.png",
    "Copilot_20260713_035040.png": "MicrochipMaster.png",
    "Copilot_20260713_035043.png": "RakeRampage.png",
    "Copilot_20260713_035046.png": "CerealCrusher.png",
    "Copilot_20260713_035239.png": "EquineGoliath.png",
    "Copilot_20260713_035343.png": "ElectronEnder.png",
}

# Read monsters.js
with open('js/monsters.js', 'r') as f:
    content = f.read()

# Extract existing entries to get types
pattern = r'\{ id: (\d+), name: "([^"]+)", type: "([^"]+)", hp: (\d+), atk: (\d+), def: (\d+), spd: (\d+) \}'
entries = re.findall(pattern, content)
existing_db = {}
for entry in entries:
    existing_db[entry[1]] = {
        'id': int(entry[0]),
        'type': entry[2],
        'hp': int(entry[3]),
        'atk': int(entry[4]),
        'def': int(entry[5]),
        'spd': int(entry[6]),
    }

print(f"Existing DB entries: {len(existing_db)}")

# Generate balanced random stats for each match
random.seed(42)  # Deterministic for reproducibility
new_entries = []
used_ids = set(int(e[0]) for e in entries)

next_id = max(used_ids) + 1

for copilot_file, existing_file in sorted(matches.items()):
    # Get the name from the existing file (remove .png)
    name = existing_file.replace('.png', '')
    type_ = existing_db.get(name, {}).get('type', 'Misc')
    
    # Generate balanced random stats in 200-350 range
    # Similar style to existing monsters: most stats are 200 or 250-350
    # Pattern: 2 stats around 200, 2 stats around 250-350
    stats = []
    for _ in range(4):
        # 60% chance of 200, 40% chance of 250-350
        if random.random() < 0.35:
            stats.append(200)
        else:
            stats.append(random.randint(248, 350))
    
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
    next_id += 1

# Print what we'll add
print("\nNew entries to add:")
for entry in new_entries:
    print(f'  {{ id: {entry["id"]}, name: "{entry["name"]}", type: "{entry["type"]}", hp: {entry["hp"]}, atk: {entry["atk"]}, def: {entry["def"]}, spd: {entry["spd"]} }},')

# Check for duplicate names
new_names = [e['name'] for e in new_entries]
existing_names = list(existing_db.keys())
dupes = [n for n in new_names if n in existing_names]
print(f"\nNames already in DB: {len(dupes)}")
for d in dupes:
    print(f"  {d}")

# Generate rename commands
print("\n--- RENAME COMMANDS ---")
for copilot_file, existing_file in sorted(matches.items()):
    src = os.path.join(char_dir, copilot_file)
    dst = os.path.join(char_dir, existing_file)
    print(f'Rename-Item -Path "{src}" -Destination "{dst}" -Force')
