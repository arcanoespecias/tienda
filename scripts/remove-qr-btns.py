with open('/home/z/my-project/arcano-deploy/js/pages.js', 'r') as f:
    lines = f.readlines()

new_lines = []
removed = 0
for line in lines:
    if 'showQRLabels' in line:
        removed += 1
        continue
    new_lines.append(line)

print(f'Removed {removed} QR button lines')

with open('/home/z/my-project/arcano-deploy/js/pages.js', 'w') as f:
    f.writelines(new_lines)
