with open('/home/z/my-project/arcano-deploy/js/tienda-ui.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and replace lines 141 and 142 (0-indexed: 140, 141)
for i, line in enumerate(lines):
    if "detail-price-btn" in line and "addToCartByIdAndSize" in line and "chico" in line:
        lines[i] = "  if (hasChico) pricesHtml += '<button class=\"detail-price-card detail-price-btn\" onclick=\"addToCartByIdAndSize(' + p.id + ', ' + chr(39) + 'chico' + chr(39) + ');document.getElementById(' + chr(39) + 'detail-overlay' + chr(39) + ').remove()\"><div class=\"detail-price-label\">Peque\u00f1o</div><div class=\"detail-price-val\">$' + p.precioChico.toLocaleString() + '</div></button>';\n"
        print(f'Fixed line {i+1} (chico)')
    elif "detail-price-btn" in line and "addToCartByIdAndSize" in line and "grande" in line:
        lines[i] = "  if (hasGrande) pricesHtml += '<button class=\"detail-price-card detail-price-btn\" onclick=\"addToCartByIdAndSize(' + p.id + ', ' + chr(39) + 'grande' + chr(39) + ');document.getElementById(' + chr(39) + 'detail-overlay' + chr(39) + ').remove()\"><div class=\"detail-price-label\">Grande</div><div class=\"detail-price-val\">$' + p.precioGrande.toLocaleString() + '</div></button>';\n"
        print(f'Fixed line {i+1} (grande)')

with open('/home/z/my-project/arcano-deploy/js/tienda-ui.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
