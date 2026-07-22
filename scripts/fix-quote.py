#!/usr/bin/env python3
with open('/home/z/my-project/arcano-deploy/js/pages.js', 'r') as f:
    lines = f.readlines()

BT = chr(96)
fix_count = 0
for idx in range(len(lines)):
    line = lines[idx]
    # The bug: btn-sm " +  should be btn-sm "' +
    if 'btn-sm " +' in line:
        lines[idx] = line.replace('btn-sm " +', "btn-sm \"' +")
        fix_count += 1
        print(f'Fixed line {idx+1}')

with open('/home/z/my-project/arcano-deploy/js/pages.js', 'w') as f:
    f.writelines(lines)

print(f'Total fixes: {fix_count}')
