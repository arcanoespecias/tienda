#!/usr/bin/env python3
"""Fix broken onclick quoting in pages.js renderProductos"""

with open('/home/z/my-project/arcano-deploy/js/pages.js', 'r') as f:
    lines = f.readlines()

# Read replacement lines from temp files
with open('/tmp/fix_esp_lines.txt', 'r') as f:
    esp_lines = f.readlines()

with open('/tmp/fix_blend_lines.txt', 'r') as f:
    blend_lines = f.readlines()

# Verify what we're replacing (sanity check)
print("=== Current especia lines (idx 94-95) ===")
for i in [94, 95]:
    print(f"  L{i+1}: {lines[i].rstrip()}")

print("=== Current blend lines (idx 124-125) ===")
for i in [124, 125]:
    print(f"  L{i+1}: {lines[i].rstrip()}")

# Replace especia action buttons (lines 95-96, 0-indexed 94-95)
lines[94] = esp_lines[0]
lines[95] = esp_lines[1]

# Replace blend action buttons (lines 125-126, 0-indexed 124-125)
lines[124] = blend_lines[0]
lines[125] = blend_lines[1]

with open('/home/z/my-project/arcano-deploy/js/pages.js', 'w') as f:
    f.writelines(lines)

print("\n=== After fix: especia lines ===")
for i in [94, 95]:
    print(f"  L{i+1}: {lines[i].rstrip()}")

print("\n=== After fix: blend lines ===")
for i in [124, 125]:
    print(f"  L{i+1}: {lines[i].rstrip()}")
