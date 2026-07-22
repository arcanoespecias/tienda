import re

filepath = '/home/z/my-project/arcano-deploy/js/pages.js'
with open(filepath, 'r') as f:
    content = f.read()

# Find the renderProductos function - from 'renderProductos(container)' to the next method '/* === ESPECIA FORM ==='
# We'll use a marker approach
start_marker = "  renderProductos(container) {"
end_marker = "  /* ==================== ESPECIA FORM ====================" 

start_idx = content.index(start_marker)
end_idx = content.index(end_marker)

new_func = '''  renderProductos(container) {
    var especias = ArcanoDB.getEspecias();
    var blends = ArcanoDB.getBlends();
    var tab = window._prodTab || 'especias';

    var h = '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">' +
      '<div class="tabs" style="margin-bottom:0;border-bottom:none">' +
        '<button class="tab' + (tab==='especias' ? ' active' : '') + '" onclick="window._prodTab=\'especias\';App.renderPage(\'productos\')">Especias<span class="tab-count">' + especias.length + '</span></button>' +
        '<button class="tab' + (tab==='blends' ? ' active' : '') + '" onclick="window._prodTab=\'blends\';App.renderPage(\'productos\')">Blends<span class="tab-count">' + blends.length + '</span></button>' +
        '<button class="tab' + (tab==='etiquetas' ? ' active' : '') + '" onclick="window._prodTab=\'etiquetas\';App.renderPage(\'productos\')">Etiquetas</button>' +
      '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
        (tab==='especias' ? '<button class="btn btn-gold" onclick="Pages.formEspecia()">+ Especia</button><button class="btn btn-outline" style="border-color:var(--green);color:var(--green)" onclick="Pages.formImportarExcel()">Importar Excel</button>' : '') +
        (tab==='blends' ? '<button class="btn btn-gold" onclick="Pages.formBlend()">+ Blend</button>' : '') +
      '</div></div>';

    h += '<div style="border-bottom:2px solid var(--border);margin:8px 0 16px"></div>';

    // --- TAB: ESPECIAS ---
    if (tab === 'especias') {
      if (especias.length === 0) {
        h += '<div class="card"><div class="card-body"><p class="text-muted text-center" style="padding:32px">Sin especias. Crea una o importa desde Excel.</p></div></div>';
      } else {
        h += '<div class="table-wrap"><table class="table"><thead><tr><th>Nombre</th><th>Cat.</th><th>Bolsa</th><th>Grs/Ch</th><th>Grs/Gr</th><th>$Chico</th><th>$Grande</th><th>Fr.Ch</th><th>Fr.Gr</th><th>Acciones</th></tr></thead><tbody>';
        for (var i = 0; i < especias.length; i++) {
          var e = especias[i];
          h += '<tr>' +
            '<td class="fw7">' + e.nombre + '</td>' +
            '<td><span class="badge badge-gold">' + (e.categoria||'—') + '</span></td>' +
            '<td>' + (e.stockBolsa||0) + 'g</td>' +
            '<td>' + (e.gramosChico||0) + 'g</td>' +
            '<td>' + (e.gramosGrande||0) + 'g</td>' +
            '<td>$' + (e.precioChico||0).toLocaleString() + '</td>' +
            '<td>$' + (e.precioGrande||0).toLocaleString() + '</td>' +
            '<td><span class="' + ((e.stockChico||0)<=3?'text-red fw7':'text-green') + '">' + (e.stockChico||0) + '</span></td>' +
            '<td><span class="' + ((e.stockGrande||0)<=3?'text-red fw7':'text-green') + '">' + (e.stockGrande||0) + '</span></td>' +
            '<td style="white-space:nowrap">' +
              '<button class="btn btn-sm ' + (e.enTienda ? 'btn-green' : 'btn-outline') + ' mr-4" onclick="ArcanoDB.toggleTienda(\'especia\',' + e.id + ');App.renderPage(\'productos\')" title="Tienda">' + (e.enTienda ? 'Tienda ON' : 'Tienda') + '</button>' +
              '<button class="btn btn-sm btn-green mr-4" onclick="Pages.formProduccionRapida(\'especia\',' + e.id + ')">Producir</button>' +
              '<button class="btn btn-sm btn-outline mr-8" onclick="Pages.formEspecia(' + e.id + ')">Editar</button>' +
              '<button class="btn btn-sm btn-red" onclick="Pages.delEspecia(' + e.id + ')">X</button>' +
            '</td></tr>';
        }
        h += '</tbody></table></div>';
      }
    }

    // --- TAB: BLENDS ---
    if (tab === 'blends') {
      if (blends.length === 0) {
        h += '<div class="card"><div class="card-body"><p class="text-muted text-center" style="padding:32px">Sin blends. Crea uno nuevo.</p></div></div>';
      } else {
        h += '<div class="table-wrap"><table class="table"><thead><tr><th>Nombre</th><th>Cat.</th><th>Region</th><th>Ingredientes</th><th>$Chico</th><th>$Grande</th><th>Fr.Ch</th><th>Fr.Gr</th><th>Acciones</th></tr></thead><tbody>';
        for (var i = 0; i < blends.length; i++) {
          var b = blends[i];
          var ingN = (b.ingredientes||[]).map(function(x){return x.especiaNombre||'?'}).join(', ');
          h += '<tr>' +
            '<td class="fw7">' + b.nombre + '</td>' +
            '<td><span class="badge badge-blue">' + (b.categoria||'—') + '</span></td>' +
            '<td class="text-sm text-muted">' + (b.region||'—') + '</td>' +
            '<td class="text-sm text-muted">' + (ingN||'—') + '</td>' +
            '<td>$' + (b.precioChico||0).toLocaleString() + '</td>' +
            '<td>$' + (b.precioGrande||0).toLocaleString() + '</td>' +
            '<td><span class="' + ((b.stockChico||0)<=3?'text-red fw7':'text-green') + '">' + (b.stockChico||0) + '</span></td>' +
            '<td><span class="' + ((b.stockGrande||0)<=3?'text-red fw7':'text-green') + '">' + (b.stockGrande||0) + '</span></td>' +
            '<td style="white-space:nowrap">' +
              '<button class="btn btn-sm ' + (b.enTienda ? 'btn-green' : 'btn-outline') + ' mr-4" onclick="ArcanoDB.toggleTienda(\'blend\',' + b.id + ');App.renderPage(\'productos\')" title="Tienda">' + (b.enTienda ? 'Tienda ON' : 'Tienda') + '</button>' +
              '<button class="btn btn-sm btn-green mr-4" onclick="Pages.formProduccionRapida(\'blend\',' + b.id + ')">Producir</button>' +
              '<button class="btn btn-sm btn-outline mr-8" onclick="Pages.formBlend(' + b.id + ')">Editar</button>' +
              '<button class="btn btn-sm btn-red" onclick="Pages.delBlend(' + b.id + ')">X</button>' +
            '</td></tr>';
        }
        h += '</tbody></table></div>';
      }
    }

    // --- TAB: ETIQUETAS ---
    if (tab === 'etiquetas') {
      var allTags = ArcanoDB.getProductTags();
      var catKeys = ['Comidas', 'Infusiones', 'Cocteleria'];
      h += '<div class="card"><div class="card-body">';
      for (var ci = 0; ci < catKeys.length; ci++) {
        var cat = catKeys[ci];
        var tags = allTags[cat] || [];
        h += '<div style="margin-bottom:20px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><span class="badge badge-gold" style="min-width:100px;text-align:center">' + cat + '</span>' +
          '<input type="text" class="input" id="new-tag-' + ci + '" placeholder="Nueva etiqueta..." style="flex:1;padding:6px 10px;font-size:.85rem" onkeydown="if(event.key===\'Enter\')Pages.doAddTag(\'' + cat + '\',' + ci + ')">' +
          '<button class="btn btn-sm btn-outline" onclick="Pages.doAddTag(\'' + cat + '\',' + ci + ')">+ Agregar</button></div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:6px">';
        for (var ti = 0; ti < tags.length; ti++) {
          h += '<span class="tag-chip-admin"><span>' + tags[ti] + '</span><button onclick="Pages.doRemoveTag(\'' + cat + '\',\'' + tags[ti].replace(/'/g, "\\\'") + '\')" style="background:none;border:none;cursor:pointer;color:var(--red);font-size:1rem;padding:0 2px">\u00d7</button></span>';
        }
        if (tags.length === 0) h += '<span class="text-sm text-muted">Sin etiquetas</span>';
        h += '</div></div>';
      }
      h += '</div></div>';
    }

    container.innerHTML = h;
  },

  /* ==================== ESPECIA FORM ===================='''

content = content[:start_idx] + new_func + content[end_idx:]

with open(filepath, 'w') as f:
    f.write(content)

print(f'Replaced lines {start_idx} to {end_idx}')
print(f'New file length: {len(content)} chars')
