import os
from PIL import Image
import hashlib

def get_image_data(path):
    """Extract comprehensive image data for comparison"""
    img = Image.open(path).convert('RGB')
    tiny = img.resize((4, 6))
    pixels = list(tiny.getdata())
    avg_r = sum(p[0] for p in pixels) / len(pixels)
    avg_g = sum(p[1] for p in pixels) / len(pixels)
    avg_b = sum(p[2] for p in pixels) / len(pixels)
    size = os.path.getsize(path)
    return {
        'size': size,
        'avg_r': round(avg_r, 1),
        'avg_g': round(avg_g, 1),
        'avg_b': round(avg_b, 1),
        'dimensions': img.size,
        'pixel_data': pixels[:8],
    }

char_dir = 'assets/characters'

# Get all existing images
existing_files = sorted([f for f in os.listdir(char_dir) 
                         if f.endswith('.png') and 'copilot' not in f.lower()])
copilot_files = sorted([f for f in os.listdir(char_dir) 
                        if 'copilot' in f.lower()])

# Build existing database
existing_db = {}
for ef in existing_files:
    path = os.path.join(char_dir, ef)
    existing_db[ef] = get_image_data(path)

# Analyze copilot files
print("="*80)
print("COPILOT FILES ANALYSIS")
print("="*80)
print(f"Total copilot files: {len(copilot_files)}")
print()

# Group copilot files by similar characteristics
copilot_data = {}
for f in copilot_files:
    path = os.path.join(char_dir, f)
    copilot_data[f] = get_image_data(path)

# Find matches
print("MATCHING COPILOT FILES TO EXISTING CHARACTERS")
print("="*80)

for cop_f, cop_data in copilot_data.items():
    # Score each existing file
    scores = []
    for ex_f, ex_data in existing_db.items():
        # Size difference (in KB)
        size_diff = abs(cop_data['size'] - ex_data['size']) / 1024
        # Color difference (Euclidean)
        dr = cop_data['avg_r'] - ex_data['avg_r']
        dg = cop_data['avg_g'] - ex_data['avg_g']
        db = cop_data['avg_b'] - ex_data['avg_b']
        color_diff = (dr**2 + dg**2 + db**2) ** 0.5
        
        # Standard deviation of pixel data
        cop_pixels = cop_data['pixel_data']
        ex_pixels = ex_data['pixel_data']
        
        # Combined score (lower is better)
        size_score = size_diff / 100  # Normalize
        color_score = color_diff / 100  # Normalize
        
        total_score = size_score * 0.3 + color_score * 0.7
        
        scores.append({
            'file': ex_f,
            'total': total_score,
            'size_diff': size_diff,
            'color_diff': color_diff,
        })
    
    # Sort by score and get top 5
    scores.sort(key=lambda x: x['total'])
    top5 = scores[:5]
    
    print(f"\n{cop_f}:")
    print(f"  Size: {cop_data['size']:,} bytes ({cop_data['size']/1024:.1f} KB)")
    print(f"  Avg Color: RGB({cop_data['avg_r']}, {cop_data['avg_g']}, {cop_data['avg_b']})")
    print(f"  Dimensions: {cop_data['dimensions']}")
    print(f"  Top matches:")
    for match in top5:
        print(f"    {match['file']}: score={match['total']:.4f} (size_diff={match['size_diff']:.1f}KB, color_diff={match['color_diff']:.1f})")

# Also find best 1:1 matches (each existing file matched to at most one copilot)
print("\n" + "="*80)
print("BEST 1:1 MATCHES (Greedy Assignment)")
print("="*80)

# Reset and do greedy assignment
used_existing = set()
matches = []

for cop_f, cop_data in copilot_data.items():
    scores = []
    for ex_f, ex_data in existing_db.items():
        if ex_f in used_existing:
            continue
        size_diff = abs(cop_data['size'] - ex_data['size']) / 1024
        dr = cop_data['avg_r'] - ex_data['avg_r']
        dg = cop_data['avg_g'] - ex_data['avg_g']
        db = cop_data['avg_b'] - ex_data['avg_b']
        color_diff = (dr**2 + dg**2 + db**2) ** 0.5
        total_score = (size_diff / 100) * 0.3 + (color_diff / 100) * 0.7
        scores.append({'file': ex_f, 'total': total_score, 'size_diff': size_diff, 'color_diff': color_diff})
    
    scores.sort(key=lambda x: x['total'])
    if scores:
        best = scores[0]
        if best['total'] < 5:  # Only report good matches
            matches.append((cop_f, best))
            used_existing.add(best['file'])

for cop_f, match in sorted(matches, key=lambda x: x[1]['total']):
    print(f"{cop_f} -> {match['file']} (score={match['total']:.4f}, size_diff={match['size_diff']:.1f}KB, color_diff={match['color_diff']:.1f})")
