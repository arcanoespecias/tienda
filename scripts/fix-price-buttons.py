import sys

with open('/home/z/my-project/arcano-deploy/js/tienda-ui.js', 'r', encoding='utf-8') as f:
    content = f.read()

changes = 0

# 1. Replace price-box divs with buttons in card rendering
old_card = """(hasChico ? '<div class="price-box"><div class="price-label">Pequeño</div><div class="price-value">$' + p.precioChico.toLocaleString() + '</div></div>' : '') +
          (hasGrande ? '<div class="price-box"><div class="price-label">Grande</div><div class="price-value">$' + p.precioGrande.toLocaleString() + '</div></div>' : '') +
          (!hasChico && !hasGrande ? '<div class="price-na">Sin precio</div>' : '') +
        '</div>' +
        (anyStock ? '<button class="add-btn" onclick="doAddToCart(' + p.id + ')">Agregar al pedido</button>'
        : '<button class="add-btn" disabled>Sin stock</button>') +"""

new_card = """(hasChico ? '<button class="price-box price-box-btn" onclick="event.stopPropagation();addToCartByIdAndSize(' + p.id + ',\'chico\')"><div class="price-label">Peque\u00f1o</div><div class="price-value">$' + p.precioChico.toLocaleString() + '</div></button>' : '') +
          (hasGrande ? '<button class="price-box price-box-btn" onclick="event.stopPropagation();addToCartByIdAndSize(' + p.id + ',\'grande\')"><div class="price-label">Grande</div><div class="price-value">$' + p.precioGrande.toLocaleString() + '</div></button>' : '') +
          (!hasChico && !hasGrande ? '<div class="price-na">Sin precio</div>' : '') +
        '</div>' +
        (!anyStock ? '<button class="add-btn" disabled>Sin stock</button>' : '') +"""

if old_card in content:
    content = content.replace(old_card, new_card, 1)
    changes += 1
    print('OK: card prices replaced')
else:
    print('FAIL: card prices block not found')
    idx = content.find('card-prices')
    if idx >= 0:
        print('card-prices at', idx)
        print(repr(content[idx-20:idx+400]))

# 2. Replace detail price cards with buttons
old_detail_prices = """  var pricesHtml = '';
  if (hasChico) pricesHtml += '<div class="detail-price-card"><div class="detail-price-label">Peque\u00f1o</div><div class="detail-price-val">$' + p.precioChico.toLocaleString() + '</div></div>';
  if (hasGrande) pricesHtml += '<div class="detail-price-card"><div class="detail-price-label">Grande</div><div class="detail-price-val">$' + p.precioGrande.toLocaleString() + '</div></div>';"""

new_detail_prices = """  var pricesHtml = '';
  if (hasChico) pricesHtml += '<button class="detail-price-card detail-price-btn" onclick="addToCartByIdAndSize(' + p.id + ',\'chico\');document.getElementById(\'detail-overlay\').remove()"><div class="detail-price-label">Peque\u00f1o</div><div class="detail-price-val">$' + p.precioChico.toLocaleString() + '</div></button>';
  if (hasGrande) pricesHtml += '<button class="detail-price-card detail-price-btn" onclick="addToCartByIdAndSize(' + p.id + ',\'grande\');document.getElementById(\'detail-overlay\').remove()"><div class="detail-price-label">Grande</div><div class="detail-price-val">$' + p.precioGrande.toLocaleString() + '</div></button>';"""

if old_detail_prices in content:
    content = content.replace(old_detail_prices, new_detail_prices, 1)
    changes += 1
    print('OK: detail prices replaced')
else:
    print('FAIL: detail prices not found')
    idx = content.find('pricesHtml')
    if idx >= 0:
        print('pricesHtml at', idx)
        print(repr(content[idx:idx+400]))

# 3. Remove generic 'Agregar al pedido' button from detail modal
old_detail_btn = """      (anyStock ? '<button class="detail-add-btn" onclick="doAddToCart(' + p.id + ');document.getElementById(\'detail-overlay\').remove()">Agregar al pedido</button>' :
        '<button class="detail-add-btn" disabled>Sin stock</button>') +"""

if old_detail_btn in content:
    content = content.replace(old_detail_btn, '', 1)
    changes += 1
    print('OK: detail generic button removed')
else:
    print('FAIL: detail button not found')
    idx = content.find('detail-add-btn')
    if idx >= 0:
        print('detail-add-btn at', idx)
        print(repr(content[idx-20:idx+200]))

# 4. Add addToCartByIdAndSize function before doAddToCart
old_doadd = 'function doAddToCart(pid) {'
new_func = 'function addToCartByIdAndSize(pid, talla) {\n  var products = getStoreProducts();\n  var product = null;\n  for (var i = 0; i < products.length; i++) { if (products[i].id === pid) { product = products[i]; break; } }\n  if (!product) return;\n  addToCart(product, talla);\n}\n\nfunction doAddToCart(pid) {'

if old_doadd in content:
    content = content.replace(old_doadd, new_func, 1)
    changes += 1
    print('OK: addToCartByIdAndSize added')
else:
    print('FAIL: doAddToCart not found')

if changes > 0:
    with open('/home/z/my-project/arcano-deploy/js/tienda-ui.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print('File saved. Total changes:', changes)
else:
    print('No changes applied!')
