with open('/home/z/my-project/arcano-deploy/js/pages.js', 'r') as f:
    content = f.read()

old = '''  _getCurrentEstData: function() {
    var ventas = ArcanoDB.getVentas();
    var pedidos = ArcanoDB.getPedidos();
};'''

new = '''  _getCurrentEstData: function() {
    var ventas = ArcanoDB.getVentas();
    var pedidos = ArcanoDB.getPedidos();
    var allSales = [];
    for (var vi = 0; vi < ventas.length; vi++) {
      var v = ventas[vi];
      var vItems = [];
      if (v.items) { for (var vi2 = 0; vi2 < v.items.length; vi2++) { var it = v.items[vi2]; vItems.push({ nombre: it.productoNombre || '?', tipo: it.tipo || 'especia', talla: it.talla || 'chico', cantidad: it.cantidad || 0, precio: it.precioUnitario || 0, subtotal: it.subtotal || 0 }); } }
      allSales.push({ fecha: v.fecha || '', creado: v.creado || '', total: v.total || 0, items: vItems, source: 'admin' });
    }
    for (var pi = 0; pi < pedidos.length; pi++) {
      var p = pedidos[pi];
      if (p.estado === 'cancelado') continue;
      var pItems = [];
      if (p.items) { for (var pi2 = 0; pi2 < p.items.length; pi2++) { var pit = p.items[pi2]; pItems.push({ nombre: pit.nombre || '?', tipo: pit.tipo || 'especia', talla: pit.talla || 'chico', cantidad: pit.qty || pit.cantidad || 0, precio: pit.precio || 0, subtotal: pit.subtotal || 0 }); } }
      var pFecha = p.creado ? p.creado.slice(0, 10) : '';
      allSales.push({ fecha: pFecha, creado: p.creado || '', total: p.total || 0, items: pItems, source: 'tienda', cliente: (p.cliente || {}).nombre || '', ciudad: (p.cliente || {}).ciudad || '' });
    }
    allSales.sort(function(a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); });
    return allSales;
  },

  _renderEstContent: function(data, el) {
    if (!el) return;
    var totalIngresos = 0, totalOps = 0, totalUnidades = 0;
    var prodMap = {}, tipoMap = {}, tallaMap = {}, diaMap = {}, monthMap = {}, ciudadMap = {};
    for (var d = 0; d < data.length; d++) {
      var s = data[d];
      totalIngresos += (s.total || 0);
      totalOps++;
      if (s.items) { for (var it = 0; it < s.items.length; it++) {
        var item = s.items[it];
        totalUnidades += (item.cantidad || 0);
        var key = item.nombre + '|' + item.tipo + '|' + item.talla;
        if (!prodMap[key]) prodMap[key] = { nombre: item.nombre, tipo: item.tipo, talla: item.talla, unidades: 0, ingreso: 0 };
        prodMap[key].unidades += (item.cantidad || 0);
        prodMap[key].ingreso += (item.subtotal || 0);
        tipoMap[item.tipo] = (tipoMap[item.tipo] || 0) + (item.cantidad || 0);
        tallaMap[item.talla || 'chico'] = (tallaMap[item.talla || 'chico'] || 0) + (item.cantidad || 0);
      }}
      if (s.fecha) {
        if (!diaMap[s.fecha]) diaMap[s.fecha] = { ops: 0, unidades: 0, ingresos: 0 };
        diaMap[s.fecha].ops++;
        diaMap[s.fecha].unidades += totalUnidades;
        diaMap[s.fecha].ingresos += (s.total || 0);
        var mn = s.fecha.substring(0, 7);
        if (!monthMap[mn]) monthMap[mn] = { ops: 0, ingresos: 0 };
        monthMap[mn].ops++;
        monthMap[mn].ingresos += (s.total || 0);
      }
      if (s.ciudad) {
        if (!ciudadMap[s.ciudad]) ciudadMap[s.ciudad] = { ops: 0, ingresos: 0 };
        ciudadMap[s.ciudad].ops++;
        ciudadMap[s.ciudad].ingresos += (s.total || 0);
      }
    }
    var prodArr = Object.values(prodMap).sort(function(a, b) { return b.ingreso - a.ingreso; });

    var h = '<div class="stats-grid" style="grid-template-columns:repeat(3,1fr)">' +
      '<div class="stat-card" style="border-left-color:var(--gold)"><div class="stat-value">$' + totalIngresos.toLocaleString() + '</div><div class="stat-label">Ingresos Totales</div><div class="stat-sub">' + totalOps + ' operaciones</div></div>' +
      '<div class="stat-card" style="border-left-color:var(--green)"><div class="stat-value">' + totalUnidades + '</div><div class="stat-label">Unidades Vendidas</div><div class="stat-sub">' + prodArr.length + ' productos</div></div>' +
      '<div class="stat-card" style="border-left-color:var(--blue)"><div class="stat-value">$' + (totalOps > 0 ? Math.round(totalIngresos / totalOps) : 0).toLocaleString() + '</div><div class="stat-label">Ticket Promedio</div><div class="stat-sub">por operacion</div></div></div>';

    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px">' +
      '<div class="card"><div class="card-body"><div class="est-chart-wrap"><canvas id="chart-daily"></canvas></div></div></div>' +
      '<div class="card"><div class="card-body"><div class="est-chart-wrap"><canvas id="chart-types"></canvas></div></div></div></div>';

    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px">' +
      '<div class="card"><div class="card-body"><div class="est-chart-wrap est-chart-full"><canvas id="chart-products"></canvas></div></div></div>' +
      '<div class="card"><div class="card-body"><div class="est-chart-wrap"><canvas id="chart-tallas"></canvas></div></div></div></div>';

    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px">' +
      '<div class="card"><div class="card-body"><div class="est-chart-wrap"><canvas id="chart-monthly"></canvas></div></div></div>' +
      '<div class="card"><div class="card-body"><div class="est-chart-wrap"><canvas id="chart-ciudad"></canvas></div></div></div></div>';

    // Top products table
    h += '<div class="card mt-16"><div class="card-header"><h3>Top Productos por Ingreso</h3></div><div class="card-body">';
    if (prodArr.length > 0) {
      h += '<div class="table-wrap"><table class="est-detail-table"><thead><tr><th>Producto</th><th>Tipo</th><th>Talla</th><th>Unidades</th><th>Ingreso</th><th>Barra</th></tr></thead><tbody>';
      var maxIngreso = prodArr[0].ingreso || 1;
      for (var pi = 0; pi < Math.min(prodArr.length, 15); pi++) {
        var pp = prodArr[pi];
        var barW = ((pp.ingreso / maxIngreso) * 100).toFixed(0);
        h += '<tr><td class="fw7">' + pp.nombre + '</td><td><span class="badge ' + (pp.tipo === 'blend' ? 'badge-blue' : 'badge-gold') + '">' + (pp.tipo === 'blend' ? 'Blend' : 'Especia') + '</span></td><td>' + pp.talla + '</td><td>' + pp.unidades + '</td><td class="fw7" style="color:var(--gold)">$' + pp.ingreso.toLocaleString() + '</td><td><div class="est-bar-inline"><div class="est-bar-track"><div class="est-bar-fill" style="width:' + barW + '%;background:' + (pp.tipo === 'blend' ? 'var(--blue)' : 'var(--gold)') + '"></div></div></div></td></tr>';
      }
      h += '</tbody></table></div>';
    } else {
      h += '<p class="text-muted text-center">Sin datos</p>';
    }
    h += '</div></div>';

    // Daily breakdown
    var diasArr = Object.keys(diaMap).sort().reverse();
    if (diasArr.length > 0) {
      h += '<div class="card mt-16"><div class="card-header"><h3>Desglose por Dia</h3></div><div class="card-body">';
      h += '<div class="table-wrap"><table class="est-detail-table"><thead><tr><th>Fecha</th><th>Operaciones</th><th>Unidades</th><th>Ingreso</th><th>Barra</th></tr></thead><tbody>';
      var maxDiaIngreso = 0;
      for (var di = 0; di < diasArr.length; di++) { if (diaMap[diasArr[di]].ingresos > maxDiaIngreso) maxDiaIngreso = diaMap[diasArr[di]].ingresos; }
      for (var di2 = 0; di2 < diasArr.length; di2++) {
        var dk = diasArr[di2]; var dv = diaMap[dk];
        var dBarW = maxDiaIngreso > 0 ? (dv.ingresos / maxDiaIngreso * 100).toFixed(0) : 0;
        h += '<tr><td class="fw7">' + dk + '</td><td>' + dv.ops + '</td><td>' + dv.unidades + '</td><td class="fw7" style="color:var(--gold)">$' + dv.ingresos.toLocaleString() + '</td><td><div class="est-bar-inline"><div class="est-bar-track"><div class="est-bar-fill" style="width:' + dBarW + '%;background:var(--gold)"></div></div></div></td></tr>';
      }
      h += '</tbody></table></div></div></div>';
    }
    el.innerHTML = h;

    if (Pages._estCharts) { for (var ci = 0; ci < Pages._estCharts.length; ci++) { try { Pages._estCharts[ci].destroy(); } catch (e) {} } }
    Pages._estCharts = [];
    Chart.defaults.color = '#9a8a78';
    Chart.defaults.borderColor = '#3a2218';
    Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

    var diasSorted = Object.keys(diaMap).sort();
    var dailyLabels = [], dailyData = [], dailyOpsData = [];
    for (var dd = 0; dd < diasSorted.length; dd++) { dailyLabels.push(diasSorted[dd].slice(5)); dailyData.push(diaMap[diasSorted[dd]].ingresos); dailyOpsData.push(diaMap[diasSorted[dd]].ops); }
    var ctxDaily = document.getElementById('chart-daily');
    if (ctxDaily) {
      Pages._estCharts.push(new Chart(ctxDaily, {
        type: 'line',
        data: { labels: dailyLabels, datasets: [
          { label: 'Ingresos ($)', data: dailyData, borderColor: '#e8b84b', backgroundColor: 'rgba(232,184,75,0.1)', fill: true, tension: 0.3, pointRadius: 3, pointBackgroundColor: '#e8b84b', yAxisID: 'y' },
          { label: 'Operaciones', data: dailyOpsData, borderColor: '#5dade2', backgroundColor: 'rgba(93,173,226,0.1)', fill: false, tension: 0.3, pointRadius: 2, yAxisID: 'y1' }
        ] },
        options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { labels: { boxWidth: 12, padding: 16 } } }, scales: { y: { position: 'left', ticks: { callback: function(v) { return '$' + v.toLocaleString(); } }, grid: { color: 'rgba(58,34,24,0.5)' } }, y1: { position: 'right', ticks: { stepSize: 1 }, grid: { drawOnChartArea: false } }, x: { grid: { color: 'rgba(58,34,24,0.3)' } } } }
      }));
    }

    var top10 = prodArr.slice(0, 10);
    var ctxProd = document.getElementById('chart-products');
    if (ctxProd) {
      var prodLabels = [], prodIngresos = [], prodColors = [];
      for (var tp = 0; tp < top10.length; tp++) { prodLabels.push(top10[tp].nombre); prodIngresos.push(top10[tp].ingreso); prodColors.push(top10[tp].tipo === 'blend' ? '#5dade2' : '#e8b84b'); }
      Pages._estCharts.push(new Chart(ctxProd, {
        type: 'bar', data: { labels: prodLabels, datasets: [{ label: 'Ingreso ($)', data: prodIngresos, backgroundColor: prodColors, borderRadius: 4, barThickness: 20 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { callback: function(v) { return '$' + v.toLocaleString(); } }, grid: { color: 'rgba(58,34,24,0.5)' } }, y: { grid: { display: false } } } }
      }));
    }

    var ctxTypes = document.getElementById('chart-types');
    if (ctxTypes) {
      Pages._estCharts.push(new Chart(ctxTypes, {
        type: 'doughnut', data: { labels: ['Especias', 'Blends'], datasets: [{ data: [tipoMap.especia || 0, tipoMap.blend || 0], backgroundColor: ['#e8b84b', '#5dade2'], borderColor: '#241209', borderWidth: 3 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { padding: 16, boxWidth: 12 } } } }
      }));
    }

    var ctxMonthly = document.getElementById('chart-monthly');
    if (ctxMonthly) {
      var mesesSorted = Object.keys(monthMap).sort();
      var mLabels = [], mData = [];
      for (var mi = 0; mi < mesesSorted.length; mi++) { mLabels.push(mesesSorted[mi]); mData.push(monthMap[mesesSorted[mi]].ingresos); }
      Pages._estCharts.push(new Chart(ctxMonthly, {
        type: 'bar', data: { labels: mLabels, datasets: [{ label: 'Ingresos ($)', data: mData, backgroundColor: 'rgba(232,184,75,0.7)', borderColor: '#e8b84b', borderWidth: 1, borderRadius: 6 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: function(v) { return '$' + v.toLocaleString(); } }, grid: { color: 'rgba(58,34,24,0.5)' } }, x: { grid: { display: false } } } }
      }));
    }

    var ctxTallas = document.getElementById('chart-tallas');
    if (ctxTallas) {
      Pages._estCharts.push(new Chart(ctxTallas, {
        type: 'pie', data: { labels: ['Chico', 'Grande'], datasets: [{ data: [tallaMap.chico || 0, tallaMap.grande || 0], backgroundColor: ['#c9963a', '#5dade2'], borderColor: '#241209', borderWidth: 3 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { padding: 16, boxWidth: 12 } } } }
      }));
    }

    var ctxCiudad = document.getElementById('chart-ciudad');
    if (ctxCiudad) {
      var ciudades = Object.keys(ciudadMap).sort(function(a, b) { return ciudadMap[b].ingresos - ciudadMap[a].ingresos; });
      var cLabels = [], cData = [];
      for (var ci2 = 0; ci2 < ciudades.length; ci2++) { cLabels.push(ciudades[ci2]); cData.push(ciudadMap[ciudades[ci2]].ingresos); }
      Pages._estCharts.push(new Chart(ctxCiudad, {
        type: 'bar', data: { labels: cLabels, datasets: [{ label: 'Ingresos ($)', data: cData, backgroundColor: 'rgba(39,174,96,0.7)', borderColor: '#27ae60', borderWidth: 1, borderRadius: 6 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: function(v) { return '$' + v.toLocaleString(); } }, grid: { color: 'rgba(58,34,24,0.5)' } }, x: { grid: { display: false } } } }
      }));
    }

    var chartCanvases = el.querySelectorAll('.est-chart-wrap');
    for (var ch = 0; ch < chartCanvases.length; ch++) { chartCanvases[ch].style.height = chartCanvases[ch].classList.contains('est-chart-full') ? '280px' : '260px'; }
  }
};'''

if old in content:
    content = content.replace(old, new, 1)
    print('OK: Replaced _getCurrentEstData and added _renderEstContent')
else:
    print('ERROR: old block not found')
    # Debug
    idx = content.find('_getCurrentEstData')
    if idx >= 0:
        print(f'Found _getCurrentEstData at index {idx}')
        print(repr(content[idx:idx+200]))

with open('/home/z/my-project/arcano-deploy/js/pages.js', 'w') as f:
    f.write(content)
