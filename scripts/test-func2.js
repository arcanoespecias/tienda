var Pages = {
  renderProductos(container) {
    var especias = [];
    var blends = [];
    var tab = window._prodTab || 'especias';

    var h = '<div style="display:flex">' +
      '<div class="tabs">' +
        '<button class="tab active">Especias<span class="tab-count">0</span></button>' +
      '</div>' +
      '</div>';

    h += '<div style="border-bottom:2px solid var(--border);margin:8px 0 16px"></div>';

    if (tab === 'especias') {
      var e = {enTienda: true, id: 5, nombre: 'Test', categoria: 'Comidas', stockBolsa: 100, gramosChico: 30, gramosGrande: 60, precioChico: 5000, precioGrande: 9000, stockChico: 3, stockGrande: 2};
      h += '<tr>' +
        '<td class="fw7">' + e.nombre + '</td>' +
        '<td><span class="badge badge-gold">' + (e.categoria||'—') + '</span></td>' +
        '<td>' + (e.stockBolsa||0) + 'g</td>' +
        '<td style="white-space:nowrap">' +
          '<button class="btn btn-sm " + (e.enTienda ? "'btn-green'" : "'btn-outline'") + ' mr-4" onclick="ArcanoDB.toggleTienda(\'especia\',' + e.id + ');App.renderPage(\'productos\')" title="Tienda">' + (e.enTienda ? "'Tienda ON'" : "'Tienda'") + '</button>' +
          '<button class="btn btn-sm btn-green mr-4" onclick="Pages.formProduccionRapida(\'especia\',' + e.id + ')">Producir</button>' +
          '<button class="btn btn-sm btn-outline mr-8" onclick="Pages.formEspecia(' + e.id + ')">Editar</button>' +
          '<button class="btn btn-sm btn-red" onclick="Pages.delEspecia(' + e.id + ')">X</button>' +
        '</td></tr>';
    }
  }
};
