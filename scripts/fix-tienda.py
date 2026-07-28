'#!/usr/bin/env python3
"""'

# Fix tienda-ui.js: 
# 1. Remove card-meta (Especia/Blend) line
# 2. Add usoTags from tags or uso field
# 3. Remove card-prices div (duplicate of button prices)
# 4. Add size selector buttons
# 5. Fix doAddToCart to accept talla param
# 6. Add size selector in detail modal
# 7. Fix detail modal button
import re

filepath = '/home/z/my-project/arcano-deploy/js/tienda-ui.js'

with open(filepath, 'r') as f:
    original = f.read()
    lines = original.split('\n')
    i = 0
    while i < len(lines):
        line = lines[i]
        line = line.rstrip() + '\n'
        # Skip the 3 problematic lines (had Unicode issues in edit)
        if i in (89, 90, 91, 92, 93):
            continue
        # 1. Remove card-meta
        if line.strip().startswith("'<div class=\"card-meta\""):
            i += 1  # skip the whole div
            continue
        # 2. Replace with usoTags
        if line.strip().startswith("(p.tags &&"):
            i += 1  # skip
            continue
        # 3. Replace stock line
        if 'stock-badge' in line:
            # Line 88: old stock badge line
            # We need to rebuild it with usoTags instead of meta
            parts = line.split("'")
            if len(parts) < 2 or 'stock-badge' not in parts[0]:
                i += 1  # skip
                continue
            tag = ''
            if anyStock:
                if usoTags:
                    tag = '<span class="stock-badge ' + stockClass + '">' + stockText + '</span>'
                else:
                    tag = ''
                line = tag + '\n'
            else:
                line = '\n'
                i += 1
        # 4. Replace card-prices div + single/add-btn with size selector buttons
        if line.strip().startswith("'<div class=\"card-prices\""):
            i += 1  # skip the whole div
            # But mark that we need to add buttons
            # Next non-empty, non-card-prices line should be the button
            continue
        # 5. Replace single add-btn with size selector
        if line.strip().startswith("(anyStock ?"):"):
            i += 1  # skip old button
            continue
        # 6. Replace line with closing div
        if line.strip() == '</div>':
            line = '\n'
            continue
        # 7. Add new buttons after closing div
        if '</div>' in line:
            # Replace the closing div with: buttons + closing div
            buttons = ''
            if anyStock:
                if hasChico && hasGrande:
                    buttons += '<div class="card-size-btns">' +
                        '<button class="add-btn size-btn" onclick="doAddToCart(' + p.id + ',\'chico\')">Peque\u00f1o $' + p.precioChico.toLocaleString() + '</button>' +
                        '<button class="add-btn size-btn" onclick="doAddToCart(' + p.id + ',\'grande\')">Grande $' + p.precioGrande.toLocaleString() + '</button>' +
                      '</div>' +
                    else:
                    if hasChico:
                        buttons += '<button class="add-btn" onclick="doAddToCart(' + p.id + ',\'chico\')">Peque\u00f1o $' + p.precioChico.toLocaleString() + '</button>' +
                    else:
                        buttons += '<button class="add-btn" onclick="doAddToCart(' + p.id + ',\'grande\')">Grande $' + p.precioGrande.toLocaleString() + '</button>' +
                    buttons += '<button class="add-btn" disabled>Sin stock</button>' +
            buttons += '\n'
        else:
            line = '\n' +
                line = '<button class="add-btn" disabled>Sin stock</button>' +
    i += 1

with open(filepath, 'w') as f:
    f.write('\n'.join(lines))

print('Done! Changes applied')
# Verify
with open(filepath, 'r') as f:
    c = f.read()
    checks = []
    if 'usoTags' in c: checks.append('  OK: usoTags added')
    if 'card-size-btns' in c: checks.append('  OK: size selector buttons')
    if 'doAddToCart(pid, talla)' in c: checks.append('  OK: doAddToCart with talla param')
    if 'detail-size-btns' in c: checks.append('  OK: detail size selector')
    if 'card-prices' in c: checks.append('  WARN: card-prices still exists!')
    if 'card-meta' in c: checks.append('  WARN: card-meta still exists!')
    else: checks.append('  OK: card-meta removed')
    if 'Peque' in c: checks.append('  OK: Pequeño renamed')
print('Done! Changes applied')
# Verify
c = f.open(filepath, 'r')
    if 'Chico' in c or 'chico' in c.lower():
        print('  WARN: Chico still found at: ' + c[:80])
    else:
        print('  OK: No Chico remaining')
