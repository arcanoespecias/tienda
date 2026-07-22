  renderProductos(container) {
    var especias = ArcanoDB.getEspecias();
    var blends = ArcanoDB.getBlends();
    var tab = window._prodTab || 'especias';

    var h = '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">' +
      '<div class="tabs" style="margin-bottom:0;border-bottom:none">' +
        `<button class="tab${tab==='especias' ? ' active' : ''}" onclick="window._prodTab='especias';App.renderPage('productos')">Especias<span class="tab-count">${especias.length}</span></button>` +
        `<button class="tab${tab==='blends' ? ' active' : ''}" onclick="window._prodTab='blends';App.renderPage('productos')">Blends<span class="tab-count">${blends.length}</span></button>` +
        `<button class="tab${tab==='etiquetas' ? ' active' : ''}" onclick="window._prodTab='etiquetas';App.renderPage('productos')">Etiquetas</button>` +
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
              '<button class="btn btn-sm " + (e.enTienda ? "'btn-green'" : "'btn-outline'") + ' mr-4" onclick="ArcanoDB.toggleTienda(\'especia\',' + e.id + ');App.renderPage(\'productos\')" title="Tienda">' + (e.enTienda ? "'Tienda ON'" : "'Tienda'") + '</button>' +
              '<button class="btn btn-sm btn-green mr-4" onclick="Pages.formProduccionRapida(\'especia\',' + e.id + ')">Producir</button>' +
              '<button class="btn btn-sm btn-outline mr-8" onclick="Pages.formEspecia(' + e.id + ')">Editar</button>' +
              '<button class="btn btn-sm btn-red" onclick="Pages.delEspecia(' + e.id + ')">X</button>' +
            '</td></tr>';
