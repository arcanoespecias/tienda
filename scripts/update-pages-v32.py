#!/usr/bin/env python3
"""Apply v32 business flow changes to pages.js"""

import re

PAGES_PATH = '/home/z/my-project/arcano-deploy/js/pages.js'

with open(PAGES_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# ============================================================
# 1. STOREFRONT: addToCart - when blend, show frasco picker
# ============================================================
old_addToCart = """function addToCart(isBlend, id, nombre, precio, unidad, stock) {
  var existing = cart.find(function(c) { return c.isBlend === isBlend && c.id === id; });
  if (existing) {
    if (existing.qty >= stock) { toast('No hay más stock disponible', 'err'); return; }
    existing.qty++;
  } else {
    cart.push({ isBlend: isBlend, id: id, nombre: nombre, precio: precio, unidad: unidad, qty: 1, maxStock: stock });
  }
  updateCartUI();
  toast(nombre + ' agregado al carrito');
}"""

new_addToCart = """function addToCart(isBlend, id, nombre, precio, unidad, stock) {
  if (isBlend) {
    mostrarSelectorFrasco(id, 'carrito', nombre, precio, stock);
    return;
  }
  var existing = cart.find(function(c) { return c.isBlend === isBlend && c.id === id; });
  if (existing) {
    if (existing.qty >= stock) { toast('No hay más stock disponible', 'err'); return; }
    existing.qty++;
  } else {
    cart.push({ isBlend: isBlend, id: id, nombre: nombre, precio: precio, unidad: unidad, qty: 1, maxStock: stock });
  }
  updateCartUI();
  toast(nombre + ' agregado al carrito');
}

// Reusable frasco selector for blends
function mostrarSelectorFrasco(blendId, contexto, nombre, precio, stock) {
  var db = getDB();
  var blend = db.blends.find(function(b) { return b.id === blendId; });
  if (!blend) return;
  nombre = nombre || blend.nombre;
  precio = precio || blend.precioVenta;
  stock = stock || blend.stock;

  var frascos = (db.productos || []).filter(function(p) { return p.tipo === 'frasco' && p.stock > 0; });
  if (frascos.length === 0) {
    toast('No hay frascos disponibles en stock', 'err');
    return;
  }

  var etiqueta = blend.etiquetaId ? db.productos.find(function(p) { return p.id === blend.etiquetaId; }) : null;
  var etiquetaStock = etiqueta ? etiqueta.stock : 9999;

  var html = '<p class="text-sm text-muted mb-12">Elegí el frasco para <strong class="text-gold">' + esc(nombre) + '</strong> (' + esc(blend.formato || 'polvo') + ')</p>';
  html += '<div class="card mb-16">';
  frascos.forEach(function(f) {
    var disponible = Math.min(stock, f.stock, etiquetaStock);
    var disabled = disponible <= 0 ? ' style="opacity:.4;pointer-events:none"' : '';
    html += '<div class="mov-row" style="cursor:pointer"' + disabled + ' onclick="confirmarFrasco(' + blendId + ',' + f.id + ',\\'' + contexto + '\\',' + precio + ',' + stock + ')">' +
      '<div><span class="fw7">' + esc(f.nombre) + '</span>' +
      '<div class="text-xs text-muted">Frasco: ' + f.stock + ' | Etiqueta: ' + etiquetaStock + '</div></div>' +
      '<span class="text-gold fw7">' + fmt(precio) + '</span></div>';
  });
  html += '</div>';
  html += '<button class="btn btn-ghost btn-full" onclick="closeModal()">Cancelar</button>';
  openModal('Elegir Frasco', html);
}

function confirmarFrasco(blendId, frascoId, contexto, precio, stock) {
  var db = getDB();
  var blend = db.blends.find(function(b) { return b.id === blendId; });
  var frasco = db.productos.find(function(p) { return p.id === frascoId; });
  var etiqueta = blend && blend.etiquetaId ? db.productos.find(function(p) { return p.id === blend.etiquetaId; }) : null;
  if (!blend || !frasco) return;

  var etiquetaStock = etiqueta ? etiqueta.stock : 9999;
  var disponible = Math.min(blend.stock, frasco.stock, etiquetaStock);
  if (disponible <= 0) { toast('Sin stock disponible', 'err'); return; }

  var nombre = blend.nombre + ' (' + frasco.nombre + ')';

  if (contexto === 'carrito') {
    // Check if same blend+frasco already in cart
    var existing = cart.find(function(c) { return c.isBlend && c.id === blendId && c.frascoId === frascoId; });
    if (existing) {
      if (existing.qty >= disponible) { toast('Stock máximo alcanzado', 'err'); return; }
      existing.qty++;
    } else {
      cart.push({ isBlend: true, id: blendId, nombre: nombre, precio: precio, unidad: 'unidad', qty: 1, maxStock: disponible, frascoId: frascoId, frascoNombre: frasco.nombre, etiquetaId: blend.etiquetaId || 0 });
    }
    closeModal();
    updateCartUI();
    toast(nombre + ' agregado al carrito');
  } else if (contexto === 'venta') {
    agregarBlendAVenta(blendId, frascoId, nombre, precio, disponible);
    closeModal();
  }
}"""

content = content.replace(old_addToCart, new_addToCart)

# ============================================================
# 2. STOREFRONT: updateCartUI - show frasco info
# ============================================================
old_cartItem = """    html += '<div class="cart-item">' +
      '<div class="cart-item-info"><div class="cart-item-name">' + esc(c.nombre) + '</div>' +
      '<div class="cart-item-price">' + fmt(c.precio) + ' / ' + esc(c.unidad) + '</div></div>' +
      '<div class="cart-item-qty">' +
        '<button onclick="cartQty(' + i + ',-1)">-</button>' +
        '<span>' + c.qty + '</span>' +
        '<button onclick="cartQty(' + i + ',1)">+</button>' +
      '</div></div>';"""

new_cartItem = """    html += '<div class="cart-item">' +
      '<div class="cart-item-info"><div class="cart-item-name">' + esc(c.nombre) + '</div>' +
      '<div class="cart-item-price">' + fmt(c.precio) + ' / ' + esc(c.unidad) + '</div></div>' +
      '<div class="cart-item-qty">' +
        '<button onclick="cartQty(' + i + ',-1)">-</button>' +
        '<span>' + c.qty + '</span>' +
        '<button onclick="cartQty(' + i + ',1)">+</button>' +
      '</div></div>';"""

content = content.replace(old_cartItem, new_cartItem)  # same for now, nombre already includes frasco

# ============================================================
# 3. STOREFRONT: submitOrder - include frasco info + deduct frasco/etiqueta
# ============================================================
old_submitOrder_items = """  cart.forEach(function(c) {
    var sub = c.precio * c.qty;
    total += sub;
    items.push({
      tipo: c.isBlend ? 'blend' : 'especia',
      id: c.id,
      nombre: c.nombre,
      cantidad: c.qty,
      unidad: c.unidad,
      precioUnitario: c.precio,
      subtotal: sub
    });
  });"""

new_submitOrder_items = """  cart.forEach(function(c) {
    var sub = c.precio * c.qty;
    total += sub;
    var item = {
      tipo: c.isBlend ? 'blend' : 'especia',
      id: c.id,
      nombre: c.nombre,
      cantidad: c.qty,
      unidad: c.unidad,
      precioUnitario: c.precio,
      subtotal: sub
    };
    if (c.isBlend && c.frascoId) {
      item.frascoId = c.frascoId;
      item.frascoNombre = c.frascoNombre || '';
      item.etiquetaId = c.etiquetaId || 0;
    }
    items.push(item);
  });"""

content = content.replace(old_submitOrder_items, new_submitOrder_items)

# ============================================================
# 4. STOREFRONT: submitOrder - deduct frasco + etiqueta stock
# ============================================================
old_submitOrder_stock = """  // Update stock
  items.forEach(function(it) {
    if (it.tipo === 'especia') {
      var prod = db.productos.find(function(p) { return p.id === it.id; });
      if (prod) {
        prod.stock = Math.max(0, prod.stock - it.cantidad);
        prod.actualizadoEn = new Date().toISOString();
        addMovimiento('venta', 'ventas', venta.id, it.nombre, -it.cantidad, 'Pedido de tienda');
      }
    } else if (it.tipo === 'blend') {
      var blend = db.blends.find(function(b) { return b.id === it.id; });
      if (blend) {
        blend.stock = Math.max(0, blend.stock - it.cantidad);
        blend.actualizadoEn = new Date().toISOString();
        addMovimiento('venta', 'ventas', venta.id, it.nombre, -it.cantidad, 'Pedido de tienda');
      }
    }
  });

  saveDB();
  cart = [];
  closeModal();
  renderStoreProducts();
  updateCartUI();
  toast('Pedido realizado con éxito');"""

new_submitOrder_stock = """  // Update stock
  items.forEach(function(it) {
    if (it.tipo === 'especia') {
      var prod = db.productos.find(function(p) { return p.id === it.id; });
      if (prod) {
        prod.stock = Math.max(0, prod.stock - it.cantidad);
        prod.actualizadoEn = new Date().toISOString();
        addMovimiento('venta', 'ventas', venta.id, it.nombre, -it.cantidad, 'Pedido de tienda');
      }
    } else if (it.tipo === 'blend') {
      var blend = db.blends.find(function(b) { return b.id === it.id; });
      if (blend) {
        blend.stock = Math.max(0, blend.stock - it.cantidad);
        blend.actualizadoEn = new Date().toISOString();
        addMovimiento('venta', 'ventas', venta.id, it.nombre, -it.cantidad, 'Pedido de tienda');
      }
      // Deduct frasco stock
      if (it.frascoId) {
        var frasco = db.productos.find(function(p) { return p.id === it.frascoId; });
        if (frasco) {
          frasco.stock = Math.max(0, frasco.stock - it.cantidad);
          frasco.actualizadoEn = new Date().toISOString();
          addMovimiento('venta', 'ventas', venta.id, it.frascoNombre || 'Frasco', -it.cantidad, 'Frasco para ' + it.nombre);
        }
      }
      // Deduct etiqueta stock
      if (it.etiquetaId) {
        var etiqueta = db.productos.find(function(p) { return p.id === it.etiquetaId; });
        if (etiqueta) {
          etiqueta.stock = Math.max(0, etiqueta.stock - it.cantidad);
          etiqueta.actualizadoEn = new Date().toISOString();
          addMovimiento('venta', 'ventas', venta.id, etiqueta.nombre || 'Etiqueta', -it.cantidad, 'Etiqueta para ' + it.nombre);
        }
      }
    }
  });

  saveDB();
  cart = [];
  closeModal();
  renderStoreProducts();
  updateCartUI();
  toast('Pedido realizado con éxito');"""

content = content.replace(old_submitOrder_stock, new_submitOrder_stock)

# ============================================================
# 5. DASHBOARD: expand low stock to include frascos and etiquetas
# ============================================================
old_lowStock = """  var lowStock = especias.filter(function(p) { return p.stock <= p.stockMin; });"""

new_lowStock = """  var frascos = productos.filter(function(p) { return p.tipo === 'frasco'; });
  var etiquetas = productos.filter(function(p) { return p.tipo === 'etiqueta'; });
  var lowStock = productos.filter(function(p) { return p.stock <= (p.stockMin || 0) && p.tipo !== 'especia'; });
  var lowStockEspecias = especias.filter(function(p) { return p.stock <= p.stockMin; });
  if (lowStockEspecias.length > 0) lowStock = lowStockEspecias.concat(lowStock);"""

content = content.replace(old_lowStock, new_lowStock)

old_lowStock_alert = """    if (lowStock.length > 0) {
      html += '<div class="card mb-20" style="border-color:var(--red)">' +
        '<div class="flex items-center gap-8"><span style="font-size:1.2rem">\\u26A0</span>' +
        '<div><div class="fw7 text-red">' + lowStock.length + ' productos con stock bajo</div>' +
        '<div class="text-xs text-muted">' + lowStock.slice(0, 3).map(function(p) { return p.nombre; }).join(', ') + (lowStock.length > 3 ? '...' : '') + '</div></div>' +
        '<button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="navigateTo(\\'productos\\')">Ver Productos</button></div></div>';
    }"""

new_lowStock_alert = """    if (lowStock.length > 0) {
      html += '<div class="card mb-20" style="border-color:var(--red)">' +
        '<div class="flex items-center gap-8"><span style="font-size:1.2rem">\\u26A0</span>' +
        '<div><div class="fw7 text-red">' + lowStock.length + ' items con stock bajo</div>' +
        '<div class="text-xs text-muted">' + lowStock.slice(0, 5).map(function(p) { return p.nombre + ' (' + p.tipo + ')'; }).join(', ') + (lowStock.length > 5 ? '...' : '') + '</div></div>' +
        '<button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="navigateTo(\\'productos\\')">Ver Stock</button></div></div>';
    }"""

content = content.replace(old_lowStock_alert, new_lowStock_alert)

# ============================================================
# 6. BLEND: blendFormHTML - add formato + etiquetaId
# ============================================================
old_blendForm = """function blendFormHTML(b) {
  b = b || {};
  return '<div class="fr1" style="margin-bottom:12px"><label>Nombre</label><input id="bl-nombre" value="' + esc(b.nombre || '') + '" placeholder="Nombre del blend"></div>' +
    '<div class="fr1" style="margin-bottom:12px"><label>Descripción</label><textarea id="bl-desc" rows="2">' + esc(b.descripcion || '') + '</textarea></div>' +
    '<h3>Receta</h3><div id="bl-receta-container"></div>' +
    '<button class="btn btn-ghost btn-sm mb-12" onclick="addBlendRecetaRow()">+ Ingrediente</button>' +
    '<hr class="divider">' +
    '<div class="fr"><div><label>Precio Venta</label><input type="number" id="bl-precio" value="' + (b.precioVenta || '') + '" min="0" step="any"></div>' +
    '<div style="display:flex;align-items:flex-end;padding-bottom:2px"><div class="cost-box" style="width:100%"><div class="cost-row"><span>Costo estimado</span><span id="bl-costo-est">$0</span></div></div></div></div>' +
    '<div id="bl-alert" class="alert alert-err"></div>' +
    '<button class="btn btn-gold btn-full" onclick="guardarBlend(' + (b.id || 0) + ')">' + (b.id ? 'Actualizar' : 'Crear') + ' Blend</button>';
}"""

new_blendForm = """function blendFormHTML(b) {
  b = b || {};
  var db = getDB();
  var etiquetas = (db.productos || []).filter(function(p) { return p.tipo === 'etiqueta'; });
  return '<div class="fr1" style="margin-bottom:12px"><label>Nombre</label><input id="bl-nombre" value="' + esc(b.nombre || '') + '" placeholder="Nombre del blend"></div>' +
    '<div class="fr1" style="margin-bottom:12px"><label>Descripción</label><textarea id="bl-desc" rows="2">' + esc(b.descripcion || '') + '</textarea></div>' +
    '<div class="fr"><div><label>Formato</label><select id="bl-formato">' + optHtml(BLEND_FORMATOS, b.formato || 'polvo') + '</select></div>' +
    '<div><label>Etiqueta</label><select id="bl-etiqueta"><option value="0">Sin etiqueta</option>' +
    etiquetas.map(function(e) { return '<option value="' + e.id + '"' + ((b.etiquetaId || 0) === e.id ? ' selected' : '') + '>' + esc(e.nombre) + ' (stock: ' + e.stock + ')</option>'; }).join('') +
    '</select></div></div>' +
    '<h3>Receta (especias)</h3><div id="bl-receta-container"></div>' +
    '<button class="btn btn-ghost btn-sm mb-12" onclick="addBlendRecetaRow()">+ Ingrediente</button>' +
    '<hr class="divider">' +
    '<div class="fr"><div><label>Precio Venta</label><input type="number" id="bl-precio" value="' + (b.precioVenta || '') + '" min="0" step="any"></div>' +
    '<div style="display:flex;align-items:flex-end;padding-bottom:2px"><div class="cost-box" style="width:100%"><div class="cost-row"><span>Costo estimado</span><span id="bl-costo-est">$0</span></div></div></div></div>' +
    '<div id="bl-alert" class="alert alert-err"></div>' +
    '<button class="btn btn-gold btn-full" onclick="guardarBlend(' + (b.id || 0) + ')">' + (b.id ? 'Actualizar' : 'Crear') + ' Blend</button>';
}"""

content = content.replace(old_blendForm, new_blendForm)

# ============================================================
# 7. BLEND: guardarBlend - save formato + etiquetaId
# ============================================================
old_guardarBlend = """function guardarBlend(existingId) {
  var nombre = document.getElementById('bl-nombre').value.trim();
  var desc = document.getElementById('bl-desc').value.trim();
  var precio = parseFloat(document.getElementById('bl-precio').value) || 0;
  var alertEl = document.getElementById('bl-alert');"""

new_guardarBlend = """function guardarBlend(existingId) {
  var nombre = document.getElementById('bl-nombre').value.trim();
  var desc = document.getElementById('bl-desc').value.trim();
  var formato = document.getElementById('bl-formato').value;
  var etiquetaId = parseInt(document.getElementById('bl-etiqueta').value) || 0;
  var precio = parseFloat(document.getElementById('bl-precio').value) || 0;
  var alertEl = document.getElementById('bl-alert');"""

content = content.replace(old_guardarBlend, new_guardarBlend)

old_guardarBlend_update = """      blend.nombre = nombre; blend.descripcion = desc; blend.receta = receta;
      blend.precioVenta = precio; blend.costoUnitario = calcBlendCost({ receta: receta });
      blend.actualizadoEn = now;"""

new_guardarBlend_update = """      blend.nombre = nombre; blend.descripcion = desc; blend.receta = receta;
      blend.formato = formato; blend.etiquetaId = etiquetaId;
      blend.precioVenta = precio; blend.costoUnitario = calcBlendCost({ receta: receta });
      blend.actualizadoEn = now;"""

content = content.replace(old_guardarBlend_update, new_guardarBlend_update)

old_guardarBlend_create = """    db.blends.push({
      id: nextId(), nombre: nombre, descripcion: desc, receta: receta,
      costoUnitario: calcBlendCost({ receta: receta }), precioVenta: precio,
      stock: 0, creadoEn: now, actualizadoEn: now
    });"""

new_guardarBlend_create = """    db.blends.push({
      id: nextId(), nombre: nombre, descripcion: desc, formato: formato, etiquetaId: etiquetaId,
      receta: receta, costoUnitario: calcBlendCost({ receta: receta }), precioVenta: precio,
      stock: 0, creadoEn: now, actualizadoEn: now
    });"""

content = content.replace(old_guardarBlend_create, new_guardarBlend_create)

# ============================================================
# 8. BLEND: renderBlends - show formato + etiqueta + frasco availability
# ============================================================
old_blendCard = """      html += '<div class="blend-card"><div class="blend-header" onclick="this.nextElementSibling.classList.toggle(\\'open\\')">' +
        '<div><div class="blend-name">' + esc(b.nombre) + '</div>' +
        '<div class="text-xs text-muted mt-12">' + esc(b.descripcion || 'Sin descripción') + '</div></div>' +
        '<div class="flex items-center gap-12">' +
          '<span class="badge ' + estadoBadge + '">' + b.stock + ' und</span>' +
          '<span class="text-gold fw7">' + fmt(b.precioVenta) + '</span></div></div>';"""

new_blendCard = """      // Calculate available stock considering frascos and etiquetas
      var etiquetaProd = b.etiquetaId ? (db.productos || []).find(function(p) { return p.id === b.etiquetaId; }) : null;
      var etiquetaStk = etiquetaProd ? etiquetaProd.stock : 9999;
      var frascosDisp = (db.productos || []).filter(function(p) { return p.tipo === 'frasco' && p.stock > 0; });
      var maxFrascoStock = frascosDisp.length > 0 ? Math.max.apply(null, frascosDisp.map(function(f) { return f.stock; })) : 0;
      var stockEfectivo = Math.min(b.stock || 0, maxFrascoStock, etiquetaStk);

      html += '<div class="blend-card"><div class="blend-header" onclick="this.nextElementSibling.classList.toggle(\\'open\\')">' +
        '<div><div class="blend-name">' + esc(b.nombre) + '</div>' +
        '<div class="text-xs text-muted mt-12">' + esc(b.descripcion || 'Sin descripción') + ' &bull; <span class="badge ba">' + esc(b.formato || 'polvo') + '</span>' +
        (etiquetaProd ? ' &bull; Etiqueta: ' + etiquetaProd.stock : ' &bull; <span class="text-red">Sin etiqueta</span>') +
        '</div></div>' +
        '<div class="flex items-center gap-12">' +
          '<span class="badge ' + estadoBadge + '">' + b.stock + ' und</span>' +
          (stockEfectivo < b.stock ? '<span class="text-xs text-yellow" title="Limitado por frascos/etiquetas">Vendible: ' + stockEfectivo + '</span>' : '') +
          '<span class="text-gold fw7">' + fmt(b.precioVenta) + '</span></div></div>';"""

content = content.replace(old_blendCard, new_blendCard)

# ============================================================
# 9. VENTA POS: agregarAVenta for blends - show frasco picker
# ============================================================
old_agregarAVenta = """function agregarAVenta(tipo, id) {
  var db = getDB();
  var item;

  if (tipo === 'especia') {
    var prod = db.productos.find(function(p) { return p.id === id; });
    if (!prod) return;
    item = { tipo: 'especia', id: prod.id, nombre: prod.nombre, cantidad: 1, unidad: prod.unidad, precioUnitario: prod.precioVenta, subtotal: prod.precioVenta, maxStock: prod.stock };
  } else {
    var blend = db.blends.find(function(b) { return b.id === id; });
    if (!blend) return;
    item = { tipo: 'blend', id: blend.id, nombre: blend.nombre, cantidad: 1, unidad: 'unidad', precioUnitario: blend.precioVenta, subtotal: blend.precioVenta, maxStock: blend.stock };
  }

  if (!ventaActual) {
    ventaActual = { items: [], clienteNombre: '', clienteTelefono: '' };
  }

  // Check if already in cart
  var existing = ventaActual.items.find(function(i) { return i.tipo === tipo && i.id === id; });
  if (existing) {
    if (existing.cantidad >= existing.maxStock) { toast('Stock máximo', 'err'); return; }
    existing.cantidad++;
    existing.subtotal = existing.cantidad * existing.precioUnitario;
  } else {
    ventaActual.items.push(item);
  }

  closeModal();
  renderVentas();
}"""

new_agregarAVenta = """function agregarAVenta(tipo, id) {
  var db = getDB();

  if (tipo === 'especia') {
    var prod = db.productos.find(function(p) { return p.id === id; });
    if (!prod) return;
    var item = { tipo: 'especia', id: prod.id, nombre: prod.nombre, cantidad: 1, unidad: prod.unidad, precioUnitario: prod.precioVenta, subtotal: prod.precioVenta, maxStock: prod.stock };
    if (!ventaActual) { ventaActual = { items: [], clienteNombre: '', clienteTelefono: '' }; }
    var existing = ventaActual.items.find(function(i) { return i.tipo === tipo && i.id === id; });
    if (existing) {
      if (existing.cantidad >= existing.maxStock) { toast('Stock máximo', 'err'); return; }
      existing.cantidad++;
      existing.subtotal = existing.cantidad * existing.precioUnitario;
    } else {
      ventaActual.items.push(item);
    }
    closeModal();
    renderVentas();
  } else {
    // Blend: show frasco picker
    mostrarSelectorFrasco(id, 'venta');
  }
}

function agregarBlendAVenta(blendId, frascoId, nombre, precio, disponible) {
  if (!ventaActual) { ventaActual = { items: [], clienteNombre: '', clienteTelefono: '' }; }
  // Check if same blend+frasco already in sale
  var existing = ventaActual.items.find(function(i) { return i.tipo === 'blend' && i.id === blendId && i.frascoId === frascoId; });
  if (existing) {
    if (existing.cantidad >= disponible) { toast('Stock máximo', 'err'); return; }
    existing.cantidad++;
    existing.subtotal = existing.cantidad * existing.precioUnitario;
  } else {
    ventaActual.items.push({
      tipo: 'blend', id: blendId, nombre: nombre, cantidad: 1, unidad: 'unidad',
      precioUnitario: precio, subtotal: precio, maxStock: disponible,
      frascoId: frascoId, frascoNombre: (db_productos_find(frascoId) || {}).nombre || 'Frasco',
      etiquetaId: (db_blends_find(blendId) || {}).etiquetaId || 0
    });
  }
  renderVentas();
}

function db_productos_find(id) { return (getDB().productos || []).find(function(p) { return p.id === id; }); }
function db_blends_find(id) { return (getDB().blends || []).find(function(b) { return b.id === id; }); }"""

content = content.replace(old_agregarAVenta, new_agregarAVenta)

# ============================================================
# 10. VENTA: renderVentaActiva - show frasco info
# ============================================================
old_ventaItem_row = """      html += '<tr><td>' + esc(it.nombre) + '</td><td>' + it.cantidad + '</td>' +
        '<td>' + fmt(it.precioUnitario) + '</td><td class="text-gold">' + fmt(it.subtotal) + '</td>' +
        '<td><button class="btn btn-ghost btn-sm" onclick="removeVentaItem(' + i + ')" style="padding:3px 6px;font-size:.8rem">x</button></td></tr>';"""

new_ventaItem_row = """      html += '<tr><td>' + esc(it.nombre) + (it.frascoNombre ? '<div class="text-xs text-muted">' + esc(it.frascoNombre) + '</div>' : '') + '</td><td>' + it.cantidad + '</td>' +
        '<td>' + fmt(it.precioUnitario) + '</td><td class="text-gold">' + fmt(it.subtotal) + '</td>' +
        '<td><button class="btn btn-ghost btn-sm" onclick="removeVentaItem(' + i + ')" style="padding:3px 6px;font-size:.8rem">x</button></td></tr>';"""

content = content.replace(old_ventaItem_row, new_ventaItem_row)

# ============================================================
# 11. VENTA: completarVenta - deduct frasco + etiqueta
# ============================================================
old_completarVenta_stock = """  // Update stock
  ventaActual.items.forEach(function(it) {
    if (it.tipo === 'especia') {
      var prod = db.productos.find(function(p) { return p.id === it.id; });
      if (prod) {
        prod.stock = Math.max(0, prod.stock - it.cantidad);
        prod.actualizadoEn = new Date().toISOString();
        addMovimiento('venta', 'ventas', venta.id, it.nombre, -it.cantidad, 'Venta mostrador');
      }
    } else if (it.tipo === 'blend') {
      var blend = db.blends.find(function(b) { return b.id === it.id; });
      if (blend) {
        blend.stock = Math.max(0, blend.stock - it.cantidad);
        blend.actualizadoEn = new Date().toISOString();
        addMovimiento('venta', 'ventas', venta.id, it.nombre, -it.cantidad, 'Venta mostrador');
      }
    }
  });"""

new_completarVenta_stock = """  // Update stock
  ventaActual.items.forEach(function(it) {
    if (it.tipo === 'especia') {
      var prod = db.productos.find(function(p) { return p.id === it.id; });
      if (prod) {
        prod.stock = Math.max(0, prod.stock - it.cantidad);
        prod.actualizadoEn = new Date().toISOString();
        addMovimiento('venta', 'ventas', venta.id, it.nombre, -it.cantidad, 'Venta mostrador');
      }
    } else if (it.tipo === 'blend') {
      var blend = db.blends.find(function(b) { return b.id === it.id; });
      if (blend) {
        blend.stock = Math.max(0, blend.stock - it.cantidad);
        blend.actualizadoEn = new Date().toISOString();
        addMovimiento('venta', 'ventas', venta.id, it.nombre, -it.cantidad, 'Venta mostrador');
      }
      // Deduct frasco
      if (it.frascoId) {
        var frasco = db.productos.find(function(p) { return p.id === it.frascoId; });
        if (frasco) {
          frasco.stock = Math.max(0, frasco.stock - it.cantidad);
          frasco.actualizadoEn = new Date().toISOString();
          addMovimiento('venta', 'ventas', venta.id, it.frascoNombre || 'Frasco', -it.cantidad, 'Frasco para ' + it.nombre);
        }
      }
      // Deduct etiqueta
      if (it.etiquetaId) {
        var etiqueta = db.productos.find(function(p) { return p.id === it.etiquetaId; });
        if (etiqueta) {
          etiqueta.stock = Math.max(0, etiqueta.stock - it.cantidad);
          etiqueta.actualizadoEn = new Date().toISOString();
          addMovimiento('venta', 'ventas', venta.id, etiqueta.nombre || 'Etiqueta', -it.cantidad, 'Etiqueta para ' + it.nombre);
        }
      }
    }
  });"""

content = content.replace(old_completarVenta_stock, new_completarVenta_stock)

# ============================================================
# 12. VENTA: cambiarEstadoVenta - restore frasco + etiqueta on cancel
# ============================================================
old_cancel_restore = """  // If cancelled and was completed/tienda, restore stock
  if (nuevoEstado === 'cancelada' && (estadoAnterior === 'completada' || estadoAnterior === 'pendiente')) {
    (venta.items || []).forEach(function(it) {
      if (it.tipo === 'especia') {
        var prod = db.productos.find(function(p) { return p.id === it.id; });
        if (prod) { prod.stock += it.cantidad; prod.actualizadoEn = new Date().toISOString(); }
      } else if (it.tipo === 'blend') {
        var blend = db.blends.find(function(b) { return b.id === it.id; });
        if (blend) { blend.stock += it.cantidad; blend.actualizadoEn = new Date().toISOString(); }
      }
    });
    addMovimiento('ajuste', 'ventas', venta.id, 'Devolución', 0, 'Venta #' + id + ' cancelada - stock restaurado');
  }"""

new_cancel_restore = """  // If cancelled and was completed/tienda, restore stock
  if (nuevoEstado === 'cancelada' && (estadoAnterior === 'completada' || estadoAnterior === 'pendiente')) {
    (venta.items || []).forEach(function(it) {
      if (it.tipo === 'especia') {
        var prod = db.productos.find(function(p) { return p.id === it.id; });
        if (prod) { prod.stock += it.cantidad; prod.actualizadoEn = new Date().toISOString(); }
      } else if (it.tipo === 'blend') {
        var blend = db.blends.find(function(b) { return b.id === it.id; });
        if (blend) { blend.stock += it.cantidad; blend.actualizadoEn = new Date().toISOString(); }
        // Restore frasco
        if (it.frascoId) {
          var frasco = db.productos.find(function(p) { return p.id === it.frascoId; });
          if (frasco) { frasco.stock += it.cantidad; frasco.actualizadoEn = new Date().toISOString(); }
        }
        // Restore etiqueta
        if (it.etiquetaId) {
          var etiqueta = db.productos.find(function(p) { return p.id === it.etiquetaId; });
          if (etiqueta) { etiqueta.stock += it.cantidad; etiqueta.actualizadoEn = new Date().toISOString(); }
        }
      }
    });
    addMovimiento('ajuste', 'ventas', venta.id, 'Devolución', 0, 'Venta #' + id + ' cancelada - stock restaurado');
  }"""

content = content.replace(old_cancel_restore, new_cancel_restore)

# ============================================================
# 13. VENTA: modalVerVenta - show frasco info in items
# ============================================================
old_verVenta_items = """  (v.items || []).forEach(function(it) {
    body += '<div class="mov-row"><span>' + esc(it.nombre) + ' x' + it.cantidad + '</span><span class="text-gold">' + fmt(it.subtotal) + '</span></div>';
  });"""

new_verVenta_items = """  (v.items || []).forEach(function(it) {
    body += '<div class="mov-row"><span>' + esc(it.nombre) + (it.frascoNombre ? ' <span class="text-xs text-muted">(' + esc(it.frascoNombre) + ')</span>' : '') + ' x' + it.cantidad + '</span><span class="text-gold">' + fmt(it.subtotal) + '</span></div>';
  });"""

content = content.replace(old_verVenta_items, new_verVenta_items)

# ============================================================
# 14. BLEND: renderBlends - add "Ver Frascos" info in the blend body
# ============================================================
# After the recipe display, add frasco/etiqueta info
old_blend_body_costbox = """      html += '<div class="cost-box mb-16">' +
        '<div class="cost-row"><span>Costo unitario</span><span>' + fmt(costo) + '</span></div>' +
        '<div class="cost-row"><span>Precio venta</span><span>' + fmt(b.precioVenta) + '</span></div>' +
        '<div class="cost-row ' + profitClass + '"><span>Ganancia</span><span>' + fmt(profit) + '</span></div></div>';"""

new_blend_body_costbox = """      // Show packaging availability
      var etiqProd = b.etiquetaId ? (db.productos || []).find(function(p) { return p.id === b.etiquetaId; }) : null;
      if (etiqProd || frascosDisp.length > 0) {
        html += '<div class="card mb-16"><h3>Empaquetado</h3>';
        if (etiqProd) {
          var etiqCls = etiqProd.stock <= (etiqProd.stockMin || 0) ? 'text-red' : 'text-green';
          html += '<div class="mov-row"><span>Etiqueta</span><span class="' + etiqCls + '">' + esc(etiqProd.nombre) + ': ' + etiqProd.stock + ' und</span></div>';
        } else {
          html += '<div class="mov-row"><span>Etiqueta</span><span class="text-red">Sin asignar</span></div>';
        }
        frascosDisp.forEach(function(f) {
          var fCls = f.stock <= (f.stockMin || 0) ? 'text-red' : '';
          html += '<div class="mov-row"><span>Frasco</span><span class="' + fCls + '">' + esc(f.nombre) + ': ' + f.stock + ' und</span></div>';
        });
        html += '</div>';
      }

      html += '<div class="cost-box mb-16">' +
        '<div class="cost-row"><span>Costo unitario (especias)</span><span>' + fmt(costo) + '</span></div>' +
        '<div class="cost-row"><span>Precio venta</span><span>' + fmt(b.precioVenta) + '</span></div>' +
        '<div class="cost-row ' + profitClass + '"><span>Ganancia</span><span>' + fmt(profit) + '</span></div></div>';"""

content = content.replace(old_blend_body_costbox, new_blend_body_costbox)

# ============================================================
# 15. STOREFRONT: renderStoreProducts - show formato on blend cards
# ============================================================
old_storeBlend_push = """    blends.forEach(function(b) {
    products.push({
      id: b.id, nombre: b.nombre, tipo: 'Blend',
      desc: b.descripcion || '', precio: b.precioVenta,
      stock: b.stock, unidad: 'unidad', blend: true,
      origen: '', perfil: ''
    });
  });"""

new_storeBlend_push = """    blends.forEach(function(b) {
    // Calculate effective stock (min of blend, frascos, etiqueta)
    var etiq = b.etiquetaId ? (db.productos || []).find(function(p) { return p.id === b.etiquetaId; }) : null;
    var etiqStk = etiq ? etiq.stock : 0;
    var frascosStk = (db.productos || []).filter(function(p) { return p.tipo === 'frasco'; });
    var maxFrasco = frascosStk.length > 0 ? Math.max.apply(null, frascosStk.map(function(f) { return f.stock; })) : 0;
    var stockEfectivo = Math.min(b.stock || 0, maxFrasco, etiqStk);
    if (stockEfectivo <= 0) return; // Don't show if can't fulfill

    products.push({
      id: b.id, nombre: b.nombre + ' (' + (b.formato || 'polvo') + ')', tipo: 'Blend',
      desc: (b.descripcion || ''), precio: b.precioVenta,
      stock: stockEfectivo, unidad: 'unidad', blend: true,
      origen: '', perfil: ''
    });
  });"""

content = content.replace(old_storeBlend_push, new_storeBlend_push)

# Write result
with open(PAGES_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'Updated: {PAGES_PATH}')
print(f'New size: {len(content)} chars')