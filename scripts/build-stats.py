#!/usr/bin/env python3
"""Build the comprehensive business statistics module for Arcano admin.
Replaces renderEstadisticas and _renderEstContent in pages.js with a full
business analytics dashboard.
"""

import re

INPUT = '/home/z/my-project/arcano-deploy/js/pages.js'

with open(INPUT, 'r', encoding='utf-8') as f:
    content = f.read()

# The new stats code
NEW_STATS = r'''  renderEstadisticas: function(container) {
    var ventas = ArcanoDB.getVentas();
    var pedidos = ArcanoDB.getPedidos();
    var producciones = ArcanoDB.getProducciones();
    var entradas = ArcanoDB.getEntradas();
    var especias = ArcanoDB.getEspecias();
    var blends = ArcanoDB.getBlends();

    // === COMBINE ALL SALES ===
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

    if (!Pages._estTab) Pages._estTab = 'ventas';

    var h = '<div class="est-tabs">';
    h += '<button class="est-tab' + (Pages._estTab === 'ventas' ? ' active' : '') + '" onclick="Pages._estTab=\'ventas\';App.renderPage(\'estadisticas\')">Ventas</button>';
    h += '<button class="est-tab' + (Pages._estTab === 'costos' ? ' active' : '') + '" onclick="Pages._estTab=\'costos\';App.renderPage(\'estadisticas\')">Costos y Margen</button>';
    h += '<button class="est-tab' + (Pages._estTab === 'produccion' ? ' active' : '') + '" onclick="Pages._estTab=\'produccion\';App.renderPage(\'estadisticas\')">Produccion</button>';
    h += '<button class="est-tab' + (Pages._estTab === 'pedidos' ? ' active' : '') + '" onclick="Pages._estTab=\'pedidos\';App.renderPage(\'estadisticas\')">Pedidos Tienda</button>';
    h += '<button class="est-tab' + (Pages._estTab === 'inventario' ? ' active' : '') + '" onclick="Pages._estTab=\'inventario\';App.renderPage(\'estadisticas\')">Inventario</button>';
    h += '</div>';
    h += '<div id="est-content"></div>';
    container.innerHTML = h;

    var data;
    if (Pages._estTab === 'ventas' || Pages._estTab === 'costos' || Pages._estTab === 'produccion' || Pages._estTab === 'inventario') {
      data = allSales;
    } else {
      data = allSales.filter(function(s) { return s.source === 'tienda'; });
    }

    if (Pages._estTab === 'ventas') Pages._renderVentas(data, container.querySelector('#est-content'));
    else if (Pages._estTab === 'costos') Pages._renderCostos(data, container.querySelector('#est-content'), entradas, especias, blends, producciones);
    else if (Pages._estTab === 'produccion') Pages._renderProduccion(data, container.querySelector('#est-content'), producciones);
    else if (Pages._estTab === 'pedidos') Pages._renderPedidosTienda(data, container.querySelector('#est-content'));
    else if (Pages._estTab === 'inventario') Pages._renderInventario(container.querySelector('#est-content'), especias, blends);
  },

  /* ================================================================
     VENTAS TAB
     ================================================================ */
  _renderVentas: function(data, el) {
    if (!el) return;
    var totalIngresos = 0, totalOps = 0, totalUnidades = 0;
    var prodMap = {}, tipoMap = {}, tallaMap = {}, diaMap = {}, monthMap = {}, ciudadMap = {}, sourceMap = {};
    for (var d = 0; d < data.length; d++) {
      var s = data[d];
      totalIngresos += (s.total || 0);
      totalOps++;
      sourceMap[s.source] = (sourceMap[s.source] || 0) + 1;
      var opUnidades = 0;
      if (s.items) { for (var it = 0; it < s.items.length; it++) {
        var item = s.items[it];
        totalUnidades += (item.cantidad || 0);
        opUnidades += (item.cantidad || 0);
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
        diaMap[s.fecha].unidades += opUnidades;
        diaMap[s.fecha].ingresos += (s.total || 0);
        var mn = s.fecha.substring(0, 7);
        if (!monthMap[mn]) monthMap[mn] = { ops: 0, unidades: 0, ingresos: 0 };
        monthMap[mn].ops++;
        monthMap[mn].unidades += opUnidades;
        monthMap[mn].ingresos += (s.total || 0);
      }
      if (s.ciudad) {
        if (!ciudadMap[s.ciudad]) ciudadMap[s.ciudad] = { ops: 0, ingresos: 0 };
        ciudadMap[s.ciudad].ops++;
        ciudadMap[s.ciudad].ingresos += (s.total || 0);
      }
    }
    var prodArr = Object.values(prodMap).sort(function(a, b) { return b.ingreso - a.ingreso; });

    // Calculate day-on-day trend
    var diasSorted = Object.keys(diaMap).sort();
    var ingresosAyer = 0;
    if (diasSorted.length >= 2) { ingresosAyer = diaMap[diasSorted[diasSorted.length - 2]].ingresos || 0; }
    var ingresosHoy = diasSorted.length > 0 ? diaMap[diasSorted[diasSorted.length - 1]].ingresos : 0;
    var tendenciaDiaria = ingresosAyer > 0 ? Math.round(((ingresosHoy - ingresosAyer) / ingresosAyer) * 100) : 0;
    var tendSign = tendenciaDiaria >= 0 ? '+' : '';

    // Monthly comparison
    var mesesSorted = Object.keys(monthMap).sort();
    var mesActual = new Date().toISOString().slice(0, 7);
    var mesAnterior = mesesSorted.length >= 2 ? mesesSorted[mesesSorted.length - 2] : '';
    var ingresosMesActual = (monthMap[mesActual] || {}).ingresos || 0;
    var ingresosMesAnterior = mesAnterior ? (monthMap[mesAnterior] || {}).ingresos || 0 : 0;
    var tendenciaMensual = ingresosMesAnterior > 0 ? Math.round(((ingresosMesActual - ingresosMesAnterior) / ingresosMesAnterior) * 100) : 0;
    var tendMSign = tendenciaMensual >= 0 ? '+' : '';

    var h = '';
    // KPIs
    h += '<div class="est-kpi-grid">';
    h += '<div class="est-kpi"><div class="est-kpi-value">$' + totalIngresos.toLocaleString() + '</div><div class="est-kpi-label">Ingresos Totales</div><div class="est-kpi-sub">' + totalOps + ' operaciones</div></div>';
    h += '<div class="est-kpi"><div class="est-kpi-value">' + totalUnidades + '</div><div class="est-kpi-label">Unidades Vendidas</div><div class="est-kpi-sub">' + prodArr.length + ' productos distintos</div></div>';
    h += '<div class="est-kpi"><div class="est-kpi-value">$' + (totalOps > 0 ? Math.round(totalIngresos / totalOps) : 0).toLocaleString() + '</div><div class="est-kpi-label">Ticket Promedio</div><div class="est-kpi-sub">por operacion</div></div>';
    h += '<div class="est-kpi ' + (tendenciaDiaria >= 0 ? 'up' : 'down') + '"><div class="est-kpi-value">' + tendSign + tendenciaDiaria + '%</div><div class="est-kpi-label">Tendencia Dia</div><div class="est-kpi-sub">vs dia anterior</div></div>';
    h += '</div>';

    // Monthly comparison bar
    h += '<div class="card mt-16"><div class="card-header"><h3>Comparacion Mensual</h3></div><div class="card-body">';
    h += '<div class="est-kpi-grid" style="grid-template-columns:1fr 1fr 1fr">';
    h += '<div class="est-kpi"><div class="est-kpi-value">$' + ingresosMesActual.toLocaleString() + '</div><div class="est-kpi-label">Mes Actual (' + mesActual + ')</div><div class="est-kpi-sub">' + ((monthMap[mesActual] || {}).ops || 0) + ' ops / ' + ((monthMap[mesActual] || {}).unidades || 0) + ' uds</div></div>';
    h += '<div class="est-kpi"><div class="est-kpi-value">$' + ingresosMesAnterior.toLocaleString() + '</div><div class="est-kpi-label">Mes Anterior (' + mesAnterior + ')</div><div class="est-kpi-sub">' + (mesAnterior ? ((monthMap[mesAnterior] || {}).ops || 0) + ' ops / ' + ((monthMap[mesAnterior] || {}).unidades || 0) + ' uds' : 'sin datos') + '</div></div>';
    h += '<div class="est-kpi ' + (tendenciaMensual >= 0 ? 'up' : 'down') + '"><div class="est-kpi-value">' + tendMSign + tendenciaMensual + '%</div><div class="est-kpi-label">Variacion Mensual</div><div class="est-kpi-sub">' + (ingresosMesActual >= ingresosMesAnterior ? 'crecimiento' : 'caida') + '</div></div>';
    h += '</div></div></div>';

    // Source breakdown (admin vs tienda)
    h += '<div class="card mt-16"><div class="card-header"><h3>Canal de Venta</h3></div><div class="card-body">';
    h += '<div class="stats-grid" style="grid-template-columns:1fr 1fr">';
    var adminIngreso = 0, tiendaIngreso = 0;
    for (var d = 0; d < data.length; d++) {
      if (data[d].source === 'admin') adminIngreso += data[d].total || 0;
      else tiendaIngreso += data[d].total || 0;
    }
    var totalCh = adminIngreso + tiendaIngreso;
    h += '<div class="stat-card" style="border-left-color:var(--gold)"><div class="stat-value">$' + adminIngreso.toLocaleString() + '</div><div class="stat-label">Ventas Admin (Fisico)</div><div class="stat-sub">' + (sourceMap.admin || 0) + ' ops' + (totalCh > 0 ? ' (' + Math.round(adminIngreso/totalCh*100) + '%)' : '') + '</div></div>';
    h += '<div class="stat-card" style="border-left-color:var(--blue)"><div class="stat-value">$' + tiendaIngreso.toLocaleString() + '</div><div class="stat-label">Pedidos Tienda Online</div><div class="stat-sub">' + (sourceMap.tienda || 0) + ' ops' + (totalCh > 0 ? ' (' + Math.round(tiendaIngreso/totalCh*100) + '%)' : '') + '</div></div>';
    h += '</div></div></div>';

    // Charts
    h += '<div class="est-charts-grid">';
    h += '<div class="est-chart-card"><h4>Ingresos Diarios</h4><div class="est-chart-wrap"><canvas id="chart-daily"></canvas></div></div>';
    h += '<div class="est-chart-card"><h4>Ingresos Mensuales</h4><div class="est-chart-wrap"><canvas id="chart-monthly"></canvas></div></div>';
    h += '</div>';

    h += '<div class="est-charts-grid">';
    h += '<div class="est-chart-card"><h4>Tipo de Producto</h4><div class="est-chart-wrap"><canvas id="chart-types"></canvas></div></div>';
    h += '<div class="est-chart-card"><h4>Venta por Talla</h4><div class="est-chart-wrap"><canvas id="chart-tallas"></canvas></div></div>';
    h += '</div>';

    h += '<div class="est-charts-grid">';
    h += '<div class="est-chart-card"><h4>Top 10 Productos por Ingreso</h4><div class="est-chart-wrap est-chart-full"><canvas id="chart-products"></canvas></div></div>';
    h += '<div class="est-chart-card"><h4>Ingresos por Ciudad</h4><div class="est-chart-wrap"><canvas id="chart-ciudad"></canvas></div></div>';
    h += '</div>';

    // Top products table
    h += '<div class="card mt-16"><div class="card-header"><h3>Top Productos por Ingreso</h3></div><div class="card-body">';
    if (prodArr.length > 0) {
      h += '<div class="table-wrap"><table class="est-detail-table"><thead><tr><th>Producto</th><th>Tipo</th><th>Talla</th><th>Unidades</th><th>Ingreso</th><th>Participacion</th></tr></thead><tbody>';
      for (var pi = 0; pi < Math.min(prodArr.length, 20); pi++) {
        var pp = prodArr[pi];
        var pct = totalIngresos > 0 ? (pp.ingreso / totalIngresos * 100).toFixed(1) : '0';
        h += '<tr><td class="fw7">' + pp.nombre + '</td><td><span class="badge ' + (pp.tipo === 'blend' ? 'badge-blue' : 'badge-gold') + '">' + (pp.tipo === 'blend' ? 'Blend' : 'Especia') + '</span></td><td>' + pp.talla + '</td><td>' + pp.unidades + '</td><td class="fw7" style="color:var(--gold)">$' + pp.ingreso.toLocaleString() + '</td><td>' + pct + '%</td></tr>';
      }
      h += '</tbody></table></div>';
    } else { h += '<p class="text-muted text-center">Sin datos</p>'; }
    h += '</div></div>';

    // Daily breakdown
    var diasArr = Object.keys(diaMap).sort().reverse();
    if (diasArr.length > 0) {
      h += '<div class="card mt-16"><div class="card-header"><h3>Desglose por Dia</h3></div><div class="card-body">';
      h += '<div class="table-wrap"><table class="est-detail-table"><thead><tr><th>Fecha</th><th>Ops</th><th>Unidades</th><th>Ingreso</th><th>Ticket Prom.</th><th>Barra</th></tr></thead><tbody>';
      var maxDiaIng = 0;
      for (var di = 0; di < diasArr.length; di++) { if (diaMap[diasArr[di]].ingresos > maxDiaIng) maxDiaIng = diaMap[diasArr[di]].ingresos; }
      for (var di2 = 0; di2 < diasArr.length; di2++) {
        var dk = diasArr[di2]; var dv = diaMap[dk];
        var dBarW = maxDiaIng > 0 ? (dv.ingresos / maxDiaIng * 100).toFixed(0) : 0;
        var ticketP = dv.ops > 0 ? Math.round(dv.ingresos / dv.ops) : 0;
        h += '<tr><td class="fw7">' + dk + '</td><td>' + dv.ops + '</td><td>' + dv.unidades + '</td><td class="fw7" style="color:var(--gold)">$' + dv.ingresos.toLocaleString() + '</td><td>$' + ticketP.toLocaleString() + '</td><td><div class="est-bar-inline"><div class="est-bar-track"><div class="est-bar-fill" style="width:' + dBarW + '%;background:var(--gold)"></div></div></div></td></tr>';
      }
      h += '</tbody></table></div></div></div>';
    }

    el.innerHTML = h;

    // === CHARTS ===
    if (Pages._estCharts) { for (var ci = 0; ci < Pages._estCharts.length; ci++) { try { Pages._estCharts[ci].destroy(); } catch (e) {} } }
    Pages._estCharts = [];
    Chart.defaults.color = '#9a8a78';
    Chart.defaults.borderColor = '#3a2218';
    Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

    var gOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { boxWidth: 12, padding: 12 } } }, scales: { y: { ticks: { callback: function(v) { return '$' + v.toLocaleString(); } }, grid: { color: 'rgba(58,34,24,0.5)' } }, x: { grid: { display: false } } } };

    // Daily line
    var dailyLabels = [], dailyData = [], dailyOpsData = [];
    for (var dd = 0; dd < diasSorted.length; dd++) { dailyLabels.push(diasSorted[dd].slice(5)); dailyData.push(diaMap[diasSorted[dd]].ingresos); dailyOpsData.push(diaMap[diasSorted[dd]].ops); }
    var ctxD = document.getElementById('chart-daily');
    if (ctxD) {
      Pages._estCharts.push(new Chart(ctxD, {
        type: 'line',
        data: { labels: dailyLabels, datasets: [
          { label: 'Ingresos ($)', data: dailyData, borderColor: '#e8b84b', backgroundColor: 'rgba(232,184,75,0.1)', fill: true, tension: 0.3, pointRadius: 3, yAxisID: 'y' },
          { label: 'Operaciones', data: dailyOpsData, borderColor: '#5dade2', backgroundColor: 'rgba(93,173,226,0.1)', fill: false, tension: 0.3, pointRadius: 2, yAxisID: 'y1' }
        ] },
        options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { labels: { boxWidth: 12, padding: 16 } } }, scales: { y: { position: 'left', ticks: { callback: function(v) { return '$' + v.toLocaleString(); } }, grid: { color: 'rgba(58,34,24,0.5)' } }, y1: { position: 'right', ticks: { stepSize: 1 }, grid: { drawOnChartArea: false } }, x: { grid: { color: 'rgba(58,34,24,0.3)' } } } }
      }));
    }

    // Monthly bar
    var mLabels = [], mData = [], mOpsData = [];
    for (var mi = 0; mi < mesesSorted.length; mi++) { mLabels.push(mesesSorted[mi]); mData.push(monthMap[mesesSorted[mi]].ingresos); mOpsData.push(monthMap[mesesSorted[mi]].ops); }
    var ctxM = document.getElementById('chart-monthly');
    if (ctxM) {
      Pages._estCharts.push(new Chart(ctxM, {
        type: 'bar', data: { labels: mLabels, datasets: [
          { label: 'Ingresos ($)', data: mData, backgroundColor: 'rgba(232,184,75,0.7)', borderColor: '#e8b84b', borderWidth: 1, borderRadius: 6, yAxisID: 'y' },
          { label: 'Operaciones', data: mOpsData, type: 'line', borderColor: '#5dade2', backgroundColor: 'transparent', pointRadius: 3, yAxisID: 'y1' }
        ] },
        options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { labels: { boxWidth: 12, padding: 16 } } }, scales: { y: { position: 'left', ticks: { callback: function(v) { return '$' + v.toLocaleString(); } }, grid: { color: 'rgba(58,34,24,0.5)' } }, y1: { position: 'right', ticks: { stepSize: 1 }, grid: { drawOnChartArea: false } }, x: { grid: { display: false } } } }
      }));
    }

    // Types doughnut
    var ctxT = document.getElementById('chart-types');
    if (ctxT) {
      Pages._estCharts.push(new Chart(ctxT, {
        type: 'doughnut', data: { labels: ['Especias', 'Blends'], datasets: [{ data: [tipoMap.especia || 0, tipoMap.blend || 0], backgroundColor: ['#e8b84b', '#5dade2'], borderColor: '#241209', borderWidth: 3 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { padding: 16, boxWidth: 12 } } } }
      }));
    }

    // Tallas pie
    var ctxTa = document.getElementById('chart-tallas');
    if (ctxTa) {
      Pages._estCharts.push(new Chart(ctxTa, {
        type: 'pie', data: { labels: ['Pequeno', 'Grande'], datasets: [{ data: [tallaMap.chico || 0, tallaMap.grande || 0], backgroundColor: ['#c9963a', '#5dade2'], borderColor: '#241209', borderWidth: 3 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { padding: 16, boxWidth: 12 } } } }
      }));
    }

    // Top 10 horizontal bar
    var top10 = prodArr.slice(0, 10);
    var ctxP = document.getElementById('chart-products');
    if (ctxP) {
      var pL = [], pI = [], pC = [];
      for (var tp = 0; tp < top10.length; tp++) { pL.push(top10[tp].nombre); pI.push(top10[tp].ingreso); pC.push(top10[tp].tipo === 'blend' ? '#5dade2' : '#e8b84b'); }
      Pages._estCharts.push(new Chart(ctxP, { type: 'bar', data: { labels: pL, datasets: [{ label: 'Ingreso ($)', data: pI, backgroundColor: pC, borderRadius: 4, barThickness: 18 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { callback: function(v) { return '$' + v.toLocaleString(); } }, grid: { color: 'rgba(58,34,24,0.5)' } }, y: { grid: { display: false }, ticks: { font: { size: 11 } } } } } }));
    }

    // City bar
    var ctxC = document.getElementById('chart-ciudad');
    if (ctxC) {
      var ciudades = Object.keys(ciudadMap).sort(function(a, b) { return ciudadMap[b].ingresos - ciudadMap[a].ingresos; });
      var cL = [], cD = [];
      for (var ci2 = 0; ci2 < ciudades.length; ci2++) { cL.push(ciudades[ci2]); cD.push(ciudadMap[ciudades[ci2]].ingresos); }
      Pages._estCharts.push(new Chart(ctxC, { type: 'bar', data: { labels: cL, datasets: [{ label: 'Ingresos ($)', data: cD, backgroundColor: 'rgba(39,174,96,0.7)', borderColor: '#27ae60', borderWidth: 1, borderRadius: 6 }] }, options: Object.assign({}, gOpts) }));
    }

    var canvases = el.querySelectorAll('.est-chart-wrap');
    for (var ch = 0; ch < canvases.length; ch++) { canvases[ch].style.height = canvases[ch].classList.contains('est-chart-full') ? '300px' : '260px'; }
  },

  /* ================================================================
     COSTOS Y MARGEN TAB
     ================================================================ */
  _renderCostos: function(data, el, entradas, especias, blends, producciones) {
    if (!el) return;

    // 1. Total cost of purchases (entradas)
    var totalCostoCompras = 0;
    var costoByTipo = { especia_grs: 0, envase: 0, bolsa: 0, sticker: 0 };
    var proveedorMap = {};
    var compraMonthMap = {};
    for (var ei = 0; ei < entradas.length; ei++) {
      var ent = entradas[ei];
      var entTotal = Number(ent.total) || 0;
      totalCostoCompras += entTotal;
      var prov = (ent.proveedor || 'Sin proveedor').trim();
      if (!prov) prov = 'Sin proveedor';
      if (!proveedorMap[prov]) proveedorMap[prov] = { total: 0, ops: 0 };
      proveedorMap[prov].total += entTotal;
      proveedorMap[prov].ops++;
      if (ent.fecha) {
        var mn = ent.fecha.substring(0, 7);
        if (!compraMonthMap[mn]) compraMonthMap[mn] = 0;
        compraMonthMap[mn] += entTotal;
      }
      if (ent.items) {
        for (var ij = 0; ij < ent.items.length; ij++) {
          var it = ent.items[ij];
          var t = it.tipo || 'especia_grs';
          costoByTipo[t] = (costoByTipo[t] || 0) + ((Number(it.cantidad) || 0) * (Number(it.costoUnitario) || 0));
        }
      }
    }

    // 2. Total ingresos
    var totalIngresos = 0;
    for (var si = 0; si < data.length; si++) totalIngresos += (data[si].total || 0);

    // 3. Margen
    var margenBruto = totalIngresos - totalCostoCompras;
    var margenPct = totalIngresos > 0 ? (margenBruto / totalIngresos * 100).toFixed(1) : '0';

    // 4. Per-product margin (income vs estimated material cost from produccion)
    var prodVentaMap = {}, prodCostoMap = {};
    for (var di = 0; di < data.length; di++) {
      var s = data[di];
      if (s.items) { for (var ii = 0; ii < s.items.length; ii++) {
        var item = s.items[ii];
        var pk = item.nombre + '|' + item.tipo;
        if (!prodVentaMap[pk]) prodVentaMap[pk] = 0;
        prodVentaMap[pk] += (item.subtotal || 0);
      }}
    }
    // From entradas, calculate cost per gram for each especia
    var costoPorGramo = {};
    var gramosComprados = {};
    for (var ei2 = 0; ei2 < entradas.length; ei2++) {
      var ent2 = entradas[ei2];
      if (ent2.items) { for (var ij2 = 0; ij2 < ent2.items.length; ij2++) {
        var it2 = ent2.items[ij2];
        if (it2.tipo === 'especia_grs' && it2.especiaNombre) {
          var nombre = it2.especiaNombre;
          var grs = Number(it2.cantidad) || 0;
          var cost = grs * (Number(it2.costoUnitario) || 0);
          costoPorGramo[nombre] = (costoPorGramo[nombre] || 0) + cost;
          gramosComprados[nombre] = (gramosComprados[nombre] || 0) + grs;
        }
      }}
    }
    var costoGrPorEsp = {};
    var espNames = Object.keys(gramosComprados);
    for (var gn = 0; gn < espNames.length; gn++) {
      if (gramosComprados[espNames[gn]] > 0) {
        costoGrPorEsp[espNames[gn]] = costoPorGramo[espNames[gn]] / gramosComprados[espNames[gn]];
      }
    }

    // Build blend cost from ingredients
    var costoBlendMap = {};
    for (var bi = 0; bi < blends.length; bi++) {
      var bl = blends[bi];
      var ings = bl.ingredientes || [];
      var costChico = 0, costGrande = 0;
      for (var ig = 0; ig < ings.length; ig++) {
        var ing = ings[ig];
        var cpg = costoGrPorEsp[ing.especiaNombre] || 0;
        costChico += (Number(ing.gramosChico) || 0) * cpg;
        costGrande += (Number(ing.gramosGrande) || 0) * cpg;
      }
      // Add envase + bolsa + sticker cost per unit
      costoBlendMap['blend|' + bl.nombre] = { chico: costChico, grande: costGrande };
    }
    for (var ei3 = 0; ei3 < especias.length; ei3++) {
      var esp = especias[ei3];
      var cpg2 = costoGrPorEsp[esp.nombre] || 0;
      costoBlendMap['especia|' + esp.nombre] = { chico: (Number(esp.gramosChico) || 0) * cpg2, grande: (Number(esp.gramosGrande) || 0) * cpg2 };
    }

    // 5. Production volume stats
    var totalFrascosProd = 0, totalGrsProd = 0, prodByMonth = {};
    for (var pri = 0; pri < producciones.length; pri++) {
      var pr = producciones[pri];
      totalFrascosProd += (pr.cantidad || 0);
      totalGrsProd += (pr.gramosTotal || 0);
      if (pr.fecha) {
        var pmn = pr.fecha.substring(0, 7);
        if (!prodByMonth[pmn]) prodByMonth[pmn] = { frascos: 0, gramos: 0, ops: 0 };
        prodByMonth[pmn].frascos += (pr.cantidad || 0);
        prodByMonth[pmn].gramos += (pr.gramosTotal || 0);
        prodByMonth[pmn].ops++;
      }
    }

    var h = '';
    // KPIs
    h += '<div class="est-kpi-grid">';
    h += '<div class="est-kpi"><div class="est-kpi-value">$' + totalIngresos.toLocaleString() + '</div><div class="est-kpi-label">Ingresos Totales</div><div class="est-kpi-sub">por todas las ventas</div></div>';
    h += '<div class="est-kpi"><div class="est-kpi-value" style="color:var(--red)">$' + totalCostoCompras.toLocaleString() + '</div><div class="est-kpi-label">Costo Compras</div><div class="est-kpi-sub">materia prima + packaging</div></div>';
    h += '<div class="est-kpi ' + (margenBruto >= 0 ? 'up' : 'down') + '"><div class="est-kpi-value">$' + margenBruto.toLocaleString() + '</div><div class="est-kpi-label">Margen Bruto</div><div class="est-kpi-sub">' + margenPct + '%</div></div>';
    h += '<div class="est-kpi"><div class="est-kpi-value">' + totalFrascosProd + '</div><div class="est-kpi-label">Frascos Producidos</div><div class="est-kpi-sub">' + totalGrsProd.toLocaleString() + ' grs en total</div></div>';
    h += '</div>';

    // Cost breakdown by type
    h += '<div class="card mt-16"><div class="card-header"><h3>Desglose de Costos por Tipo</h3></div><div class="card-body">';
    h += '<div class="stats-grid" style="grid-template-columns:repeat(4,1fr)">';
    h += '<div class="stat-card" style="border-left-color:var(--gold)"><div class="stat-value">$' + (costoByTipo.especia_grs || 0).toLocaleString() + '</div><div class="stat-label">Materia Prima</div></div>';
    h += '<div class="stat-card" style="border-left-color:var(--blue)"><div class="stat-value">$' + (costoByTipo.envase || 0).toLocaleString() + '</div><div class="stat-label">Frascos (Envases)</div></div>';
    h += '<div class="stat-card" style="border-left-color:var(--green)"><div class="stat-value">$' + (costoByTipo.bolsa || 0).toLocaleString() + '</div><div class="stat-label">Bolsas</div></div>';
    h += '<div class="stat-card" style="border-left-color:var(--yellow)"><div class="stat-value">$' + (costoByTipo.sticker || 0).toLocaleString() + '</div><div class="stat-label">Stickers/Etiquetas</div></div>';
    h += '</div></div></div>';

    // Proveedor table
    var provArr = Object.keys(proveedorMap).sort(function(a, b) { return proveedorMap[b].total - proveedorMap[a].total; });
    if (provArr.length > 0) {
      h += '<div class="card mt-16"><div class="card-header"><h3>Compras por Proveedor</h3></div><div class="card-body">';
      h += '<div class="table-wrap"><table class="est-detail-table"><thead><tr><th>Proveedor</th><th>Ordenes</th><th>Total Comprado</th><th>Participacion</th></tr></thead><tbody>';
      for (var pvi = 0; pvi < provArr.length; pvi++) {
        var pv = provArr[pvi]; var pd = proveedorMap[pv];
        var pvPct = totalCostoCompras > 0 ? (pd.total / totalCostoCompras * 100).toFixed(1) : '0';
        h += '<tr><td class="fw7">' + pv + '</td><td>' + pd.ops + '</td><td class="fw7" style="color:var(--red)">$' + pd.total.toLocaleString() + '</td><td>' + pvPct + '%</td></tr>';
      }
      h += '</tbody></table></div></div></div>';
    }

    // Charts
    h += '<div class="est-charts-grid">';
    h += '<div class="est-chart-card"><h4>Ingresos vs Costos Mensual</h4><div class="est-chart-wrap"><canvas id="chart-cost-mensual"></canvas></div></div>';
    h += '<div class="est-chart-card"><h4>Distribucion de Costos</h4><div class="est-chart-wrap"><canvas id="chart-cost-dist"></canvas></div></div>';
    h += '</div>';

    // Per-product margin table
    h += '<div class="card mt-16"><div class="card-header"><h3>Margen Estimado por Producto</h3></div><div class="card-body"><p class="text-sm text-muted mb-8">Costo de materia prima estimado segun precio de compra por gramo. No incluye envases/bolsas/stickers.</p>';
    var allProducts = [];
    for (var vk = 0; vk < Object.keys(prodVentaMap).length; vk++) {
      var pk2 = Object.keys(prodVentaMap)[vk];
      var parts = pk2.split('|');
      var pNombre = parts.slice(1).join('|');
      var pTipo = parts[0];
      var pIngreso = prodVentaMap[pk2];
      var costoEst = costoBlendMap[pk2] || { chico: 0, grande: 0 };
      allProducts.push({ nombre: pNombre, tipo: pTipo, ingreso: pIngreso, costoEst: costoEst.chico + costoEst.grande });
    }
    allProducts.sort(function(a, b) { return b.ingreso - a.ingreso; });
    if (allProducts.length > 0) {
      h += '<div class="table-wrap"><table class="est-detail-table"><thead><tr><th>Producto</th><th>Tipo</th><th>Ingreso</th><th>Costo M.P.</th><th>Margen</th><th>% Margen</th></tr></thead><tbody>';
      for (var api = 0; api < Math.min(allProducts.length, 20); api++) {
        var ap = allProducts[api];
        var apMargen = ap.ingreso - ap.costoEst;
        var apPct = ap.ingreso > 0 ? (apMargen / ap.ingreso * 100).toFixed(1) : '0';
        var apColor = apMargen >= 0 ? 'var(--green)' : 'var(--red)';
        h += '<tr><td class="fw7">' + ap.nombre + '</td><td><span class="badge ' + (ap.tipo === 'blend' ? 'badge-blue' : 'badge-gold') + '">' + (ap.tipo === 'blend' ? 'Blend' : 'Especia') + '</span></td><td style="color:var(--gold)">$' + ap.ingreso.toLocaleString() + '</td><td style="color:var(--red)">$' + ap.costoEst.toLocaleString() + '</td><td style="color:' + apColor + '">$' + apMargen.toLocaleString() + '</td><td style="color:' + apColor + '">' + apPct + '%</td></tr>';
      }
      h += '</tbody></table></div>';
    } else { h += '<p class="text-muted text-center">Sin datos suficientes</p>'; }
    h += '</div></div>';

    el.innerHTML = h;

    // Charts
    if (Pages._estCharts) { for (var ci = 0; ci < Pages._estCharts.length; ci++) { try { Pages._estCharts[ci].destroy(); } catch (e) {} } }
    Pages._estCharts = [];
    Chart.defaults.color = '#9a8a78';
    Chart.defaults.borderColor = '#3a2218';
    Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

    // Ingresos vs Costos Mensual
    var allMonths = new Set(Object.keys(compraMonthMap));
    var ventasMonthMap = {};
    for (var vi = 0; vi < data.length; vi++) {
      if (data[vi].fecha) {
        var vmn = data[vi].fecha.substring(0, 7);
        ventasMonthMap[vmn] = (ventasMonthMap[vmn] || 0) + (data[vi].total || 0);
      }
    }
    Object.keys(ventasMonthMap).forEach(function(m) { allMonths.add(m); });
    var mSort = Array.from(allMonths).sort();
    var cmLabels = [], cmIngresos = [], cmCostos = [], cmMargen = [];
    for (var cm = 0; cm < mSort.length; cm++) {
      cmLabels.push(mSort[cm]);
      var v = ventasMonthMap[mSort[cm]] || 0;
      var c = compraMonthMap[mSort[cm]] || 0;
      cmIngresos.push(v); cmCostos.push(c); cmMargen.push(v - c);
    }
    var ctxCM = document.getElementById('chart-cost-mensual');
    if (ctxCM) {
      Pages._estCharts.push(new Chart(ctxCM, {
        type: 'bar', data: { labels: cmLabels, datasets: [
          { label: 'Ingresos', data: cmIngresos, backgroundColor: 'rgba(232,184,75,0.7)', borderRadius: 4 },
          { label: 'Costos', data: cmCostos, backgroundColor: 'rgba(231,76,60,0.7)', borderRadius: 4 },
          { label: 'Margen', data: cmMargen, type: 'line', borderColor: '#27ae60', backgroundColor: 'transparent', pointRadius: 4, borderWidth: 2 }
        ] },
        options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { labels: { boxWidth: 12, padding: 16 } } }, scales: { y: { ticks: { callback: function(v) { return '$' + v.toLocaleString(); } }, grid: { color: 'rgba(58,34,24,0.5)' } }, x: { grid: { display: false } } } }
      }));
    }

    // Cost distribution doughnut
    var ctxCD = document.getElementById('chart-cost-dist');
    if (ctxCD) {
      Pages._estCharts.push(new Chart(ctxCD, {
        type: 'doughnut', data: { labels: ['Materia Prima', 'Envases', 'Bolsas', 'Stickers'], datasets: [{ data: [costoByTipo.especia_grs || 0, costoByTipo.envase || 0, costoByTipo.bolsa || 0, costoByTipo.sticker || 0], backgroundColor: ['#e8b84b', '#5dade2', '#27ae60', '#f0c040'], borderColor: '#241209', borderWidth: 3 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { padding: 16, boxWidth: 12 } } } }
      }));
    }

    var canvases = el.querySelectorAll('.est-chart-wrap');
    for (var ch = 0; ch < canvases.length; ch++) { canvases[ch].style.height = '280px'; }
  },

  /* ================================================================
     PRODUCCION TAB
     ================================================================ */
  _renderProduccion: function(data, el, producciones) {
    if (!el) return;
    var totalFrascos = 0, totalGramos = 0;
    var tipoProdMap = {}, tallaProdMap = {}, prodProdMap = {}, prodMonthMap = {}, envasesConsumidos = 0, bolsasConsumidas = 0, stickersConsumidos = 0;
    for (var i = 0; i < producciones.length; i++) {
      var pr = producciones[i];
      totalFrascos += (pr.cantidad || 0);
      totalGramos += (pr.gramosTotal || 0);
      envasesConsumidos += (pr.envasesConsumidos || 0);
      bolsasConsumidas += (pr.bolsasConsumidas || 0);
      stickersConsumidos += (pr.stickersConsumidos || 0);
      tipoProdMap[pr.tipo] = (tipoProdMap[pr.tipo] || 0) + (pr.cantidad || 0);
      tallaProdMap[pr.talla || 'chico'] = (tallaProdMap[pr.talla || 'chico'] || 0) + (pr.cantidad || 0);
      var pk = (pr.productoNombre || '?') + '|' + (pr.tipo || 'especia') + '|' + (pr.talla || 'chico');
      if (!prodProdMap[pk]) prodProdMap[pk] = { nombre: pr.productoNombre, tipo: pr.tipo, talla: pr.talla, frascos: 0, gramos: 0, ops: 0 };
      prodProdMap[pk].frascos += (pr.cantidad || 0);
      prodProdMap[pk].gramos += (pr.gramosTotal || 0);
      prodProdMap[pk].ops++;
      if (pr.fecha) {
        var mn = pr.fecha.substring(0, 7);
        if (!prodMonthMap[mn]) prodMonthMap[mn] = { frascos: 0, gramos: 0, ops: 0 };
        prodMonthMap[mn].frascos += (pr.cantidad || 0);
        prodMonthMap[mn].gramos += (pr.gramosTotal || 0);
        prodMonthMap[mn].ops++;
      }
    }
    var prodArr = Object.values(prodProdMap).sort(function(a, b) { return b.frascos - a.frascos; });

    var h = '';
    h += '<div class="est-kpi-grid">';
    h += '<div class="est-kpi"><div class="est-kpi-value">' + totalFrascos + '</div><div class="est-kpi-label">Frascos Producidos</div><div class="est-kpi-sub">' + producciones.length + ' operaciones</div></div>';
    h += '<div class="est-kpi"><div class="est-kpi-value">' + totalGramos.toLocaleString() + 'g</div><div class="est-kpi-label">Materia Prima Usada</div><div class="est-kpi-sub">gramos en total</div></div>';
    h += '<div class="est-kpi"><div class="est-kpi-value">' + envasesConsumidos + '</div><div class="est-kpi-label">Envases Consumidos</div><div class="est-kpi-sub">frascos usados</div></div>';
    h += '<div class="est-kpi"><div class="est-kpi-value">' + stickersConsumidos + '</div><div class="est-kpi-label">Stickers Usados</div><div class="est-kpi-sub">etiquetas aplicadas</div></div>';
    h += '<div class="est-kpi"><div class="est-kpi-value">' + bolsasConsumidas + '</div><div class="est-kpi-label">Bolsas Usadas</div><div class="est-kpi-sub">empaques</div></div>';
    h += '</div>';

    // Charts
    h += '<div class="est-charts-grid">';
    h += '<div class="est-chart-card"><h4>Produccion Mensual (Frascos)</h4><div class="est-chart-wrap"><canvas id="chart-prod-monthly"></canvas></div></div>';
    h += '<div class="est-chart-card"><h4>Tipo y Talla</h4><div class="est-chart-wrap"><canvas id="chart-prod-tipo"></canvas></div></div>';
    h += '</div>';

    // Production table
    h += '<div class="card mt-16"><div class="card-header"><h3>Produccion por Producto</h3></div><div class="card-body">';
    if (prodArr.length > 0) {
      h += '<div class="table-wrap"><table class="est-detail-table"><thead><tr><th>Producto</th><th>Tipo</th><th>Talla</th><th>Frascos</th><th>Gramos</th><th>Ops</th></tr></thead><tbody>';
      for (var pi = 0; pi < prodArr.length; pi++) {
        var pp = prodArr[pi];
        h += '<tr><td class="fw7">' + pp.nombre + '</td><td><span class="badge ' + (pp.tipo === 'blend' ? 'badge-blue' : 'badge-gold') + '">' + (pp.tipo === 'blend' ? 'Blend' : 'Especia') + '</span></td><td>' + pp.talla + '</td><td class="fw7">' + pp.frascos + '</td><td>' + pp.gramos.toLocaleString() + 'g</td><td>' + pp.ops + '</td></tr>';
      }
      h += '</tbody></table></div>';
    } else { h += '<p class="text-muted text-center">Sin producciones</p>'; }
    h += '</div></div>';

    el.innerHTML = h;

    if (Pages._estCharts) { for (var ci = 0; ci < Pages._estCharts.length; ci++) { try { Pages._estCharts[ci].destroy(); } catch (e) {} } }
    Pages._estCharts = [];
    Chart.defaults.color = '#9a8a78'; Chart.defaults.borderColor = '#3a2218'; Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

    var pmSorted = Object.keys(prodMonthMap).sort();
    var pmL = [], pmF = [], pmG = [];
    for (var mi = 0; mi < pmSorted.length; mi++) { pmL.push(pmSorted[mi]); pmF.push(prodMonthMap[pmSorted[mi]].frascos); pmG.push(prodMonthMap[pmSorted[mi]].gramos); }
    var ctxPM = document.getElementById('chart-prod-monthly');
    if (ctxPM) {
      Pages._estCharts.push(new Chart(ctxPM, { type: 'bar', data: { labels: pmL, datasets: [
        { label: 'Frascos', data: pmF, backgroundColor: 'rgba(232,184,75,0.7)', borderRadius: 4, yAxisID: 'y' },
        { label: 'Gramos', data: pmG, type: 'line', borderColor: '#5dade2', backgroundColor: 'transparent', pointRadius: 3, yAxisID: 'y1' }
      ] }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { labels: { boxWidth: 12, padding: 16 } } }, scales: { y: { position: 'left', title: { display: true, text: 'Frascos' }, grid: { color: 'rgba(58,34,24,0.5)' } }, y1: { position: 'right', title: { display: true, text: 'Gramos' }, grid: { drawOnChartArea: false } }, x: { grid: { display: false } } } } }));
    }

    var ctxPT = document.getElementById('chart-prod-tipo');
    if (ctxPT) {
      Pages._estCharts.push(new Chart(ctxPT, { type: 'bar', data: { labels: ['Especia-Chico', 'Especia-Grande', 'Blend-Chico', 'Blend-Grande'], datasets: [{ label: 'Frascos', data: [tipoProdMap.especia_chico || 0, tipoProdMap.especia_grande || 0, tipoProdMap.blend_chico || 0, tipoProdMap.blend_grande || 0], backgroundColor: ['#e8b84b', '#c9963a', '#5dade2', '#3498db'], borderRadius: 6 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(58,34,24,0.5)' } }, x: { grid: { display: false } } } } }));
    }

    var canvases = el.querySelectorAll('.est-chart-wrap');
    for (var ch = 0; ch < canvases.length; ch++) { canvases[ch].style.height = '280px'; }
  },

  /* ================================================================
     PEDIDOS TIENDA TAB
     ================================================================ */
  _renderPedidosTienda: function(data, el) {
    if (!el) return;
    var total = 0, ops = 0, ciudades = {}, estadoMap = {}, dayMap = {}, prodMap = {};
    for (var i = 0; i < data.length; i++) {
      var s = data[i];
      total += (s.total || 0); ops++;
      estadoMap[s.estado || 'nuevo'] = (estadoMap[s.estado || 'nuevo'] || 0) + 1;
      if (s.ciudad) { if (!ciudades[s.ciudad]) ciudades[s.ciudad] = { ops: 0, ingreso: 0 }; ciudades[s.ciudad].ops++; ciudades[s.ciudad].ingreso += (s.total || 0); }
      if (s.fecha) { if (!dayMap[s.fecha]) dayMap[s.fecha] = { ops: 0, ingreso: 0 }; dayMap[s.fecha].ops++; dayMap[s.fecha].ingreso += (s.total || 0); }
      if (s.items) { for (var j = 0; j < s.items.length; j++) {
        var it = s.items[j]; var pk = it.nombre + '|' + (it.talla || 'chico');
        if (!prodMap[pk]) prodMap[pk] = { nombre: it.nombre, talla: it.talla, uds: 0, ingreso: 0 };
        prodMap[pk].uds += (it.cantidad || 0); prodMap[pk].ingreso += (it.subtotal || 0);
      }}
    }
    var prodArr = Object.values(prodMap).sort(function(a, b) { return b.ingreso - a.ingreso; });
    var cityArr = Object.keys(ciudades).sort(function(a, b) { return ciudades[b].ingreso - ciudades[a].ingreso; });

    var h = '<div class="est-kpi-grid">';
    h += '<div class="est-kpi"><div class="est-kpi-value">$' + total.toLocaleString() + '</div><div class="est-kpi-label">Ingresos Tienda</div><div class="est-kpi-sub">' + ops + ' pedidos</div></div>';
    h += '<div class="est-kpi"><div class="est-kpi-value">$' + (ops > 0 ? Math.round(total / ops) : 0).toLocaleString() + '</div><div class="est-kpi-label">Ticket Promedio</div><div class="est-kpi-sub">por pedido</div></div>';
    h += '<div class="est-kpi"><div class="est-kpi-value">' + cityArr.length + '</div><div class="est-kpi-label">Ciudades</div><div class="est-kpi-sub">destino de envios</div></div>';
    h += '<div class="est-kpi"><div class="est-kpi-value">' + (estadoMap.entregado || 0) + '</div><div class="est-kpi-label">Entregados</div><div class="est-kpi-sub">de ' + ops + ' total</div></div>';
    h += '</div>';

    // Estado breakdown
    var estColors = { nuevo: 'badge-red', confirmado: 'badge-yellow', preparando: 'badge-blue', enviado: 'badge-gold', entregado: 'badge-green', cancelado: 'badge-red' };
    var estLabels = { nuevo: 'Nuevos', confirmado: 'Confirmados', preparando: 'Preparando', enviado: 'Enviados', entregado: 'Entregados', cancelado: 'Cancelados' };
    h += '<div class="card mt-16"><div class="card-header"><h3>Estado de Pedidos</h3></div><div class="card-body" style="display:flex;gap:8px;flex-wrap:wrap">';
    var estKeys = Object.keys(estadoMap).sort();
    for (var ei = 0; ei < estKeys.length; ei++) {
      var ek = estKeys[ei];
      h += '<div style="text-align:center;padding:12px 16px;background:var(--bg);border-radius:8px;min-width:80px"><div style="font-size:1.4rem;font-weight:800;color:var(--text)">' + estadoMap[ek] + '</div><div style="font-size:.72rem;color:var(--text2);margin-top:2px">' + (estLabels[ek] || ek) + '</div></div>';
    }
    h += '</div></div>';

    // Charts
    h += '<div class="est-charts-grid">';
    h += '<div class="est-chart-card"><h4>Pedidos por Dia</h4><div class="est-chart-wrap"><canvas id="chart-ped-daily"></canvas></div></div>';
    h += '<div class="est-chart-card"><h4>Top 8 Productos</h4><div class="est-chart-wrap"><canvas id="chart-ped-prods"></canvas></div></div>';
    h += '</div>';

    // City table
    if (cityArr.length > 0) {
      h += '<div class="card mt-16"><div class="card-header"><h3>Ingresos por Ciudad</h3></div><div class="card-body">';
      h += '<div class="table-wrap"><table class="est-detail-table"><thead><tr><th>Ciudad</th><th>Pedidos</th><th>Ingreso</th><th>Promedio</th></tr></thead><tbody>';
      for (var ci = 0; ci < cityArr.length; ci++) {
        var cd = ciudades[cityArr[ci]];
        h += '<tr><td class="fw7">' + cityArr[ci] + '</td><td>' + cd.ops + '</td><td class="fw7" style="color:var(--gold)">$' + cd.ingreso.toLocaleString() + '</td><td>$' + (cd.ops > 0 ? Math.round(cd.ingreso / cd.ops) : 0).toLocaleString() + '</td></tr>';
      }
      h += '</tbody></table></div></div></div>';
    }

    el.innerHTML = h;

    if (Pages._estCharts) { for (var ci = 0; ci < Pages._estCharts.length; ci++) { try { Pages._estCharts[ci].destroy(); } catch (e) {} } }
    Pages._estCharts = [];
    Chart.defaults.color = '#9a8a78'; Chart.defaults.borderColor = '#3a2218'; Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

    var daySorted = Object.keys(dayMap).sort();
    var ctxPD = document.getElementById('chart-ped-daily');
    if (ctxPD) {
      var dl = [], dd = [], do2 = [];
      for (var di = 0; di < daySorted.length; di++) { dl.push(daySorted[di].slice(5)); dd.push(dayMap[daySorted[di]].ingreso); do2.push(dayMap[daySorted[di]].ops); }
      Pages._estCharts.push(new Chart(ctxPD, { type: 'bar', data: { labels: dl, datasets: [
        { label: 'Ingreso ($)', data: dd, backgroundColor: 'rgba(232,184,75,0.7)', borderRadius: 4, yAxisID: 'y' },
        { label: 'Pedidos', data: do2, type: 'line', borderColor: '#5dade2', backgroundColor: 'transparent', pointRadius: 3, yAxisID: 'y1' }
      ] }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { labels: { boxWidth: 12, padding: 16 } } }, scales: { y: { position: 'left', ticks: { callback: function(v) { return '$' + v.toLocaleString(); } }, grid: { color: 'rgba(58,34,24,0.5)' } }, y1: { position: 'right', ticks: { stepSize: 1 }, grid: { drawOnChartArea: false } }, x: { grid: { display: false } } } } }));
    }

    var ctxPP = document.getElementById('chart-ped-prods');
    if (ctxPP && prodArr.length > 0) {
      var top8 = prodArr.slice(0, 8);
      var pl = [], pd2 = [], pc = [];
      for (var pi = 0; pi < top8.length; pi++) { pl.push(top8[i].nombre); pd2.push(top8[pi].ingreso); pc.push('#e8b84b'); }
      Pages._estCharts.push(new Chart(ctxPP, { type: 'bar', data: { labels: pl, datasets: [{ label: 'Ingreso ($)', data: pd2, backgroundColor: pc, borderRadius: 4 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { callback: function(v) { return '$' + v.toLocaleString(); } }, grid: { color: 'rgba(58,34,24,0.5)' } }, y: { grid: { display: false } } } } }));
    }

    var canvases = el.querySelectorAll('.est-chart-wrap');
    for (var ch = 0; ch < canvases.length; ch++) { canvases[ch].style.height = '280px'; }
  },

  /* ================================================================
     INVENTARIO TAB
     ================================================================ */
  _renderInventario: function(el, especias, blends) {
    if (!el) return;
    var db = ArcanoDB.getDB();
    var envases = db.stockEnvases || { chico: 0, grande: 0 };
    var bolsas = db.stockBolsas || { chico: 0, grande: 0 };
    var stickers = ArcanoDB.getStickers();

    // Calculate inventory value (at sale price)
    var valorFrascos = 0, valorPala = 0;
    var stockBajo = [], sinStock = [];
    var catMap = {}, catStockMap = {};
    for (var i = 0; i < especias.length; i++) {
      var e = especias[i];
      var vChico = (e.stockChico || 0) * (e.precioChico || 0);
      var vGrande = (e.stockGrande || 0) * (e.precioGrande || 0);
      valorFrascos += vChico + vGrande;
      var palaGrs = e.stockBolsa || 0;
      var cat = e.categoria || 'Sin categoria';
      if (!catMap[cat]) catMap[cat] = { productos: 0, frascos: 0, pala: 0 };
      catMap[cat].productos++;
      catMap[cat].frascos += (e.stockChico || 0) + (e.stockGrande || 0);
      catMap[cat].pala += palaGrs;
      var totalStock = (e.stockChico || 0) + (e.stockGrande || 0);
      if (totalStock === 0 && palaGrs === 0) sinStock.push({ nombre: e.nombre, tipo: 'especia', cat: cat });
      else if (totalStock <= 3 || palaGrs <= 50) stockBajo.push({ nombre: e.nombre, tipo: 'especia', cat: cat, frascos: totalStock, pala: palaGrs });
    }
    for (var bi = 0; bi < blends.length; bi++) {
      var b = blends[bi];
      valorFrascos += (b.stockChico || 0) * (b.precioChico || 0) + (b.stockGrande || 0) * (b.precioGrande || 0);
      var cat2 = b.categoria || 'Sin categoria';
      if (!catMap[cat2]) catMap[cat2] = { productos: 0, frascos: 0, pala: 0 };
      catMap[cat2].productos++;
      catMap[cat2].frascos += (b.stockChico || 0) + (b.stockGrande || 0);
      var ts = (b.stockChico || 0) + (b.stockGrande || 0);
      if (ts === 0) sinStock.push({ nombre: b.nombre, tipo: 'blend', cat: cat2 });
      else if (ts <= 3) stockBajo.push({ nombre: b.nombre, tipo: 'blend', cat: cat2, frascos: ts, pala: 0 });
    }
    var totalProductos = especias.length + blends.length;
    var totalFrascosStock = especias.reduce(function(s, e) { return s + (e.stockChico||0) + (e.stockGrande||0); }, 0) +
                             blends.reduce(function(s, b) { return s + (b.stockChico||0) + (b.stockGrande||0); }, 0);
    var totalPala = especias.reduce(function(s, e) { return s + (e.stockBolsa||0); }, 0);

    var h = '';
    h += '<div class="est-kpi-grid">';
    h += '<div class="est-kpi"><div class="est-kpi-value">$' + valorFrascos.toLocaleString() + '</div><div class="est-kpi-label">Valor Inventario (Frascos)</div><div class="est-kpi-sub">al precio de venta</div></div>';
    h += '<div class="est-kpi"><div class="est-kpi-value">' + totalFrascosStock + '</div><div class="est-kpi-label">Frascos en Stock</div><div class="est-kpi-sub">listos para vender</div></div>';
    h += '<div class="est-kpi"><div class="est-kpi-value">' + totalPala.toLocaleString() + 'g</div><div class="est-kpi-label">Pala (Materia Prima)</div><div class="est-kpi-sub">gramos en stock</div></div>';
    h += '<div class="est-kpi ' + (stockBajo.length > 0 ? 'down' : 'up') + '"><div class="est-kpi-value">' + stockBajo.length + '</div><div class="est-kpi-label">Stock Bajo</div><div class="est-kpi-sub">requiere reposicion</div></div>';
    h += '<div class="est-kpi ' + (sinStock.length > 0 ? 'down' : 'up') + '"><div class="est-kpi-value">' + sinStock.length + '</div><div class="est-kpi-label">Sin Stock</div><div class="est-kpi-sub">productos agotados</div></div>';
    h += '</div>';

    // Packaging stock
    h += '<div class="card mt-16"><div class="card-header"><h3>Stock de Packaging</h3></div><div class="card-body">';
    h += '<div class="stats-grid" style="grid-template-columns:repeat(4,1fr)">';
    h += '<div class="stat-card" style="border-left-color:var(--blue)"><div class="stat-value">' + (envases.chico || 0) + '</div><div class="stat-label">Envases Pequenos</div></div>';
    h += '<div class="stat-card" style="border-left-color:var(--blue)"><div class="stat-value">' + (envases.grande || 0) + '</div><div class="stat-label">Envases Grandes</div></div>';
    h += '<div class="stat-card" style="border-left-color:var(--green)"><div class="stat-value">' + (bolsas.chico || 0) + '</div><div class="stat-label">Bolsas Pequenas</div></div>';
    h += '<div class="stat-card" style="border-left-color:var(--green)"><div class="stat-value">' + (bolsas.grande || 0) + '</div><div class="stat-label">Bolsas Grandes</div></div>';
    h += '</div></div></div>';

    // Category breakdown
    var catArr = Object.keys(catMap).sort(function(a, b) { return catMap[b].frascos - catMap[a].frascos; });
    h += '<div class="card mt-16"><div class="card-header"><h3>Inventario por Categoria</h3></div><div class="card-body">';
    h += '<div class="table-wrap"><table class="est-detail-table"><thead><tr><th>Categoria</th><th>Productos</th><th>Frascos</th><th>Pala (grs)</th></tr></thead><tbody>';
    for (var ci = 0; ci < catArr.length; ci++) {
      var cd = catMap[catArr[ci]];
      h += '<tr><td class="fw7">' + catArr[ci] + '</td><td>' + cd.productos + '</td><td>' + cd.frascos + '</td><td>' + cd.pala.toLocaleString() + '</td></tr>';
    }
    h += '</tbody></table></div></div></div>';

    // Low stock alerts
    if (stockBajo.length > 0) {
      h += '<div class="card mt-16" style="border-color:var(--yellow)"><div class="card-header"><h3 style="color:var(--yellow)">Alertas de Stock Bajo (' + stockBajo.length + ')</h3></div><div class="card-body">';
      h += '<div class="table-wrap"><table class="est-detail-table"><thead><tr><th>Producto</th><th>Tipo</th><th>Categoria</th><th>Frascos</th><th>Pala</th></tr></thead><tbody>';
      for (var si = 0; si < stockBajo.length; si++) {
        var sb = stockBajo[si];
        h += '<tr><td class="fw7">' + sb.nombre + '</td><td><span class="badge ' + (sb.tipo === 'blend' ? 'badge-blue' : 'badge-gold') + '">' + (sb.tipo === 'blend' ? 'Blend' : 'Especia') + '</span></td><td>' + sb.cat + '</td><td>' + (sb.frascos || '-') + '</td><td>' + (sb.pala ? sb.pala + 'g' : '-') + '</td></tr>';
      }
      h += '</tbody></table></div></div></div>';
    }

    // No stock
    if (sinStock.length > 0) {
      h += '<div class="card mt-16" style="border-color:var(--red)"><div class="card-header"><h3 style="color:var(--red)">Sin Stock (' + sinStock.length + ')</h3></div><div class="card-body">';
      h += '<p class="text-sm text-muted mb-8">';
      for (var ni = 0; ni < sinStock.length; ni++) {
        h += '<span class="badge badge-red mr-4">' + sinStock[ni].nombre + '</span>';
      }
      h += '</p></div></div>';
    }

    el.innerHTML = h;

    // No charts for inventory, no chart cleanup needed
    if (Pages._estCharts) { for (var ci = 0; ci < Pages._estCharts.length; ci++) { try { Pages._estCharts[ci].destroy(); } catch (e) {} } }
    Pages._estCharts = [];
  },

  /* ================================================================
     HELPERS (kept for backward compat)
     ================================================================ */
  _getCurrentEstData: function() {
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
    // Redirect to ventas tab for backward compat
    Pages._estTab = 'ventas';
    Pages._renderVentas(data, el);
  }'''


# Find and replace the old renderEstadisticas through _renderEstContent
# Pattern: from 'renderEstadisticas: function' to the closing '};' of _renderEstContent

# First, find the start
start_marker = '  renderEstadisticas: function(container) {'
start_idx = content.find(start_marker)
if start_idx == -1:
    print('ERROR: Could not find renderEstadisticas')
    exit(1)

# Find the end - we need to find the closing of _renderEstContent
# _renderEstContent is the last method before the closing }; of Pages
# We look for the pattern: _renderEstContent closing
end_pattern = '\n};\n'

# Find the end by looking for _renderEstContent's closing brace
# The _renderEstContent function ends with a specific pattern
end_search = content[start_idx:]
# Find the last }; that closes _renderEstContent
# We look for the pattern where _renderEstContent ends and Pages object continues

# Strategy: find _renderEstContent and then its closing
render_est_content = '  _renderEstContent: function(data, el) {'
rec_idx = end_search.find(render_est_content)
if rec_idx == -1:
    print('ERROR: Could not find _renderEstContent')
    rec_idx = end_search.find('_renderEstContent')
    if rec_idx == -1:
        print('ERROR: Still cannot find _renderEstContent')
        exit(1)

# From _renderEstContent, find its closing brace
# The function body is enclosed in { ... }
# We need to count braces to find the matching close
abs_rec = start_idx + rec_idx
brace_count = 0
found_open = False
end_pos = -1
for ci in range(abs_rec, len(content)):
    if content[ci] == '{':
        brace_count += 1
        found_open = True
    elif content[ci] == '}':
        brace_count -= 1
        if found_open and brace_count == 0:
            # This is the closing brace of _renderEstContent
            # Include the trailing comma and whitespace
            end_pos = ci + 1
            # Skip trailing comma/newline
            while end_pos < len(content) and content[end_pos] in ', \n\r':
                end_pos += 1
            break

if end_pos == -1:
    print('ERROR: Could not find end of _renderEstContent')
    exit(1)

print(f'Replacing from char {start_idx} to {end_pos} ({end_pos - start_idx} chars)')

# Replace
new_content = content[:start_idx] + NEW_STATS + content[end_pos:]

with open(INPUT, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f'File written successfully. New size: {len(new_content)} chars')
