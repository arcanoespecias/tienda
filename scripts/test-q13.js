var o = {
  f() {
    var e = {enTienda: true, id: 5};
    var h = '<button class="btn btn-sm "' + (e.enTienda ? "'btn-green'" : "'btn-outline'") + ' mr-4" onclick="ArcanoDB.toggleTienda(\'especia\',' + e.id + ');App.renderPage(\'productos\')" title="Tienda">' + (e.enTienda ? "'Tienda ON'" : "'Tienda'") + '</button>';
  }
};
