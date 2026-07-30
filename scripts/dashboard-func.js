  /* ================================================================
     DASHBOARD — MAPA VISUAL COMPLETO DEL NEGOCIO
     ================================================================ */
  _dashCharts: [],

  renderDashboard(container) {
    if (Pages._dashCharts) { for (var _ci = 0; _ci < Pages._dashCharts.length; _ci++) { try { Pages._dashCharts[_ci].destroy(); } catch(e) {} } }
    Pages._dashCharts = [];

    var db = ArcanoDB.getDB();
    var stats = ArcanoDB.getStats();
    var ventas = ArcanoDB.getVentas();
    var pedidos = ArcanoDB.getPedidos();
    var producciones = ArcanoDB.getProducciones();
    var entradas = ArcanoDB.getEntradas();
    var especias = ArcanoDB.getEspecias();
    var blends = ArcanoDB.getBlends();
    var stickers = ArcanoDB.getStickers();
    var today = new Date().toISOString().slice(0, 10);
    var mes = new Date().toISOString().slice(0, 7);

    // === CALCULATE ALL KPIs ===
    var ventasHoy = [], ventasMes = [], pedidosNuevos = [];
    var totalIngresos = 0, totalUnidades = 0, totalOps = 0;
    var adminIngreso = 0, tiendaIngreso = 0;
    var prodVentaMap = {}, tipoCount = {especia: 0, blend: 0}, tallaCount = {chico: 0, grande: 0};
    var diaMap = {}, monthMap = {};

    for (var vi = 0; vi < ventas.length; vi++) {
      var v = ventas[vi];
      var vf = v.fecha || '';
      totalIngresos += (v.total || 0);
      totalOps++;
      adminIngreso += (v.total || 0);
      if (vf === today) ventasHoy.push(v);
      if (vf && vf.startsWith(mes)) ventasMes.push(v);
      if (vf) {
        if (!diaMap[vf]) diaMap[vf] = {ops: 0, ingresos: 0};
        diaMap[vf].ops++;
        diaMap[vf].ingresos += (v.total || 0);
        var mn = vf.substring(0, 7);
        if (!monthMap[mn]) monthMap[mn] = {ops: 0, ingresos: 0};
        monthMap[mn].ops++;
        monthMap[mn].ingresos += (v.total || 0);
      }
      if (v.items) { for (var vi2 = 0; vi2 < v.items.length; vi2++) {
        var it = v.items[vi2];
        var iCant = it.cantidad || 0;
        totalUnidades += iCant;
        tipoCount[it.tipo || 'especia'] = (tipoCount[it.tipo || 'especia'] || 0) + iCant;
        tallaCount[it.talla || 'chico'] = (tallaCount[it.talla || 'chico'] || 0) + iCant;
        var pkey = it.productoNombre || '?';
        if (!prodVentaMap[pkey]) prodVentaMap[pkey] = 0;
        prodVentaMap[pkey] += (it.subtotal || 0);
      }}
    }
    for (var pi = 0; pi < pedidos.length; pi++) {
      var p = pedidos[pi];
      if (p.estado === 'nuevo') pedidosNuevos.push(p);
      if (p.estado === 'cancelado') continue;
      var pf = p.creado ? p.creado.slice(0, 10) : '';
      totalIngresos += (p.total || 0);
      totalOps++;
      tiendaIngreso += (p.total || 0);
      if (pf && pf.startsWith(mes)) ventasMes.push(p);
      if (pf) {
        if (!diaMap[pf]) diaMap[pf] = {ops: 0, ingresos: 0};
        diaMap[pf].ops++;
        diaMap[pf].ingresos += (p.total || 0);
      }
      if (p.items) { for (var pi2 = 0; pi2 < p.items.length; pi2++) {
        var pit = p.items[pi2];
        var pCant = pit.qty || pit.cantidad || 0;
        totalUnidades += pCant;
        tipoCount[pit.tipo || 'especia'] = (tipoCount[pit.tipo || 'especia'] || 0) + pCant;
        tallaCount[pit.talla || 'chico'] = (tallaCount[pit.talla || 'chico'] || 0) + pCant;
        var pkey2 = pit.nombre || '?';
        if (!prodVentaMap[pkey2]) prodVentaMap[pkey2] = 0;
        prodVentaMap[pkey2] += (pit.subtotal || 0);
      }}
    }

    var ingresosHoy = 0;
    for (var vi3 = 0; vi3 < ventasHoy.length; vi3++) ingresosHoy += (ventasHoy[vi3].total || 0);
    var ingresosMes = 0, opsMes = 0;
    for (var vi4 = 0; vi4 < ventasMes.length; vi4++) { ingresosMes += (ventasMes[vi4].total || 0); opsMes++; }

    var totalCostos = 0;
    for (var ei = 0; ei < entradas.length; ei++) totalCostos += (Number(entradas[ei].total) || 0);
    var margenBruto = totalIngresos - totalCostos;
    var margenPct = totalIngresos > 0 ? (margenBruto / totalIngresos * 100) : 0;

    var prodMesCount = 0, prodMesUds = 0;
    for (var pr = 0; pr < producciones.length; pr++) {
      var prd = producciones[pr];
      if (prd.fecha && prd.fecha.startsWith(mes)) { prodMesCount++; prodMesUds += (prd.cantidad || 0); }
    }

    var palaBaja = [], frascosBajos = [], stickerBajos = [];
    for (var ei2 = 0; ei2 < especias.length; ei2++) {
      var esp = especias[ei2];
      if ((esp.stockBolsa || 0) <= 50) palaBaja.push(esp);
      if ((esp.stockChico || 0) <= 3 && (esp.stockGrande || 0) <= 3) frascosBajos.push({nombre: esp.nombre, chico: esp.stockChico||0, grande: esp.stockGrande||0, tipo: 'especia'});
    }
    for (var bi = 0; bi < blends.length; bi++) {
      var bl = blends[bi];
      if ((bl.stockChico || 0) <= 3 && (bl.stockGrande || 0) <= 3) frascosBajos.push({nombre: bl.nombre, chico: bl.stockChico||0, grande: bl.stockGrande||0, tipo: 'blend'});
    }
    for (var si = 0; si < stickers.length; si++) {
      var stk = stickers[si];
      if (((stk.stockChico||0) + (stk.stockGrande||0)) <= 5) stickerBajos.push(stk);
    }
    var totalAlertas = palaBaja.length + frascosBajos.length + stickerBajos.length;

    var prodArr = [];
    var pkeys = Object.keys(prodVentaMap);
    for (var pk = 0; pk < pkeys.length; pk++) prodArr.push({nombre: pkeys[pk], ingreso: prodVentaMap[pkeys[pk]]});
    prodArr.sort(function(a, b) { return b.ingreso - a.ingreso; });

    // === BUILD HTML ===
    var h = '';

    // KPIs principales
    h += '<div class="dash-section-title"><span class="dash-dot" style="background:var(--gold)"></span>Resumen del Negocio</div>';
    h += '<div class="dash-kpi-row">';
    h += '<div class="dash-kpi-card dash-kpi-gold"><div class="dash-kpi-icon">$</div><div class="dash-kpi-body"><div class="dash-kpi-val">$' + ingresosHoy.toLocaleString() + '</div><div class="dash-kpi-lbl">Ventas Hoy</div></div></div>';
    h += '<div class="dash-kpi-card dash-kpi-blue"><div class="dash-kpi-icon">M</div><div class="dash-kpi-body"><div class="dash-kpi-val">$' + ingresosMes.toLocaleString() + '</div><div class="dash-kpi-lbl">Ingresos del Mes</div><div class="dash-kpi-sub">' + opsMes + ' operaciones</div></div></div>';
    var mClr = margenPct >= 0 ? 'var(--green)' : 'var(--red)';
    h += '<div class="dash-kpi-card"><div class="dash-kpi-icon" style="color:var(--green)">%a</div><div class="dash-kpi-body"><div class="dash-kpi-val" style="color:' + mClr + '">' + margenPct.toFixed(1) + '%</div><div class="dash-kpi-lbl">Margen Bruto</div><div class="dash-kpi-sub">Ingreso $' + totalIngresos.toLocaleString() + ' - Costos $' + totalCostos.toLocaleString() + '</div></div></div>';
    h += '<div class="dash-kpi-card ' + (totalAlertas > 0 ? 'dash-kpi-red' : 'dash-kpi-green') + '"><div class="dash-kpi-icon">!</div><div class="dash-kpi-body"><div class="dash-kpi-val">' + totalAlertas + '</div><div class="dash-kpi-lbl">Alertas de Stock</div><div class="dash-kpi-sub">' + palaBaja.length + ' pala, ' + frascosBajos.length + ' frascos, ' + stickerBajos.length + ' stk</div></div></div>';
    h += '</div>';

    // Segunda fila
    h += '<div class="dash-kpi-row dash-kpi-sm">';
    h += '<div class="dash-mini"><div class="dash-mini-val">' + totalUnidades + '</div><div class="dash-mini-lbl">Unidades Vendidas</div></div>';
    h += '<div class="dash-mini"><div class="dash-mini-val">$' + (totalOps > 0 ? Math.round(totalIngresos / totalOps) : 0).toLocaleString() + '</div><div class="dash-mini-lbl">Ticket Promedio</div></div>';
    h += '<div class="dash-mini"><div class="dash-mini-val">' + prodMesCount + '</div><div class="dash-mini-lbl">Producciones Mes</div><div class="dash-mini-sub">' + prodMesUds + ' frascos</div></div>';
    h += '<div class="dash-mini"><div class="dash-mini-val">' + stats.totalFrascos + '</div><div class="dash-mini-lbl">Frascos en Stock</div><div class="dash-mini-sub">' + stats.frascosChico + ' pq / ' + stats.frascosGrande + ' gr</div></div>';
    h += '<div class="dash-mini"><div class="dash-mini-val">' + stats.totalProductos + '</div><div class="dash-mini-lbl">Productos Activos</div><div class="dash-mini-sub">' + stats.totalEspecias + ' esp + ' + stats.totalBlends + ' bl</div></div>';
    h += '<div class="dash-mini"><div class="dash-mini-val">' + pedidosNuevos.length + '</div><div class="dash-mini-lbl">Pedidos Nuevos</div></div>';
    h += '</div>';

    // Canal de venta + Composicion
    h += '<div class="dash-section-title"><span class="dash-dot" style="background:var(--blue)"></span>Analisis de Ventas</div>';
    h += '<div class="dash-grid-2">';
    h += '<div class="dash-card"><h4>Canal de Venta</h4>';
    var totalCanal = adminIngreso + tiendaIngreso;
    var admPct = totalCanal > 0 ? Math.round(adminIngreso / totalCanal * 100) : 0;
    var tiePct = totalCanal > 0 ? Math.round(tiendaIngreso / totalCanal * 100) : 0;
    h += '<div class="dash-canal-row"><div class="dash-canal-item"><div class="dash-canal-bar-track"><div class="dash-canal-bar-fill" style="width:' + admPct + '%;background:var(--gold)"></div></div><div class="dash-canal-info"><span class="dash-canal-name">Ventas Admin</span><span class="dash-canal-val">$' + adminIngreso.toLocaleString() + ' (' + admPct + '%)</span></div></div>';
    h += '<div class="dash-canal-item"><div class="dash-canal-bar-track"><div class="dash-canal-bar-fill" style="width:' + tiePct + '%;background:var(--blue)"></div></div><div class="dash-canal-info"><span class="dash-canal-name">Tienda Online</span><span class="dash-canal-val">$' + tiendaIngreso.toLocaleString() + ' (' + tiePct + '%)</span></div></div></div></div>';

    // Composicion con SVG rings
    h += '<div class="dash-card"><h4>Composicion de Ventas</h4><div class="dash-comp-grid">';
    var tipoTotal = (tipoCount.especia || 0) + (tipoCount.blend || 0);
    var espPct = tipoTotal > 0 ? Math.round((tipoCount.especia || 0) / tipoTotal * 100) : 50;
    var blPct = 100 - espPct;
    var tallaTotal = (tallaCount.chico || 0) + (tallaCount.grande || 0);
    var chPct = tallaTotal > 0 ? Math.round((tallaCount.chico || 0) / tallaTotal * 100) : 50;
    var grPct = 100 - chPct;
    h += '<div class="dash-comp-item"><div class="dash-comp-ring"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--bg4)" stroke-width="3"></circle><circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--gold)" stroke-width="3" stroke-dasharray="' + espPct + ' ' + (100 - espPct) + '" stroke-dashoffset="25" stroke-linecap="round"></circle></svg><div class="dash-comp-center">' + espPct + '%</div></div><div class="dash-comp-label">Especias <b>' + (tipoCount.especia || 0) + '</b></div></div>';
    h += '<div class="dash-comp-item"><div class="dash-comp-ring"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--bg4)" stroke-width="3"></circle><circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--blue)" stroke-width="3" stroke-dasharray="' + blPct + ' ' + (100 - blPct) + '" stroke-dashoffset="25" stroke-linecap="round"></circle></svg><div class="dash-comp-center">' + blPct + '%</div></div><div class="dash-comp-label">Blends <b>' + (tipoCount.blend || 0) + '</b></div></div>';
    h += '<div class="dash-comp-item"><div class="dash-comp-ring"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--bg4)" stroke-width="3"></circle><circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--gold2)" stroke-width="3" stroke-dasharray="' + chPct + ' ' + (100 - chPct) + '" stroke-dashoffset="25" stroke-linecap="round"></circle></svg><div class="dash-comp-center">' + chPct + '%</div></div><div class="dash-comp-label">Pequeno <b>' + (tallaCount.chico || 0) + '</b></div></div>';
    h += '<div class="dash-comp-item"><div class="dash-comp-ring"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--bg4)" stroke-width="3"></circle><circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--green)" stroke-width="3" stroke-dasharray="' + grPct + ' ' + (100 - grPct) + '" stroke-dashoffset="25" stroke-linecap="round"></circle></svg><div class="dash-comp-center">' + grPct + '%</div></div><div class="dash-comp-label">Grande <b>' + (tallaCount.grande || 0) + '</b></div></div>';
    h += '</div></div></div>';

    // Charts
    h += '<div class="dash-section-title"><span class="dash-dot" style="background:var(--green)"></span>Tendencias</div>';
    h += '<div class="dash-grid-2">';
    h += '<div class="dash-card"><h4>Ingresos Ultimos 15 Dias</h4><div class="dash-chart-wrap"><canvas id="dash-chart-daily"></canvas></div></div>';
    h += '<div class="dash-card"><h4>Ingresos Mensuales</h4><div class="dash-chart-wrap"><canvas id="dash-chart-monthly"></canvas></div></div>';
    h += '</div>';

    // Top productos + Pedidos nuevos
    h += '<div class="dash-section-title"><span class="dash-dot" style="background:var(--yellow)"></span>Actividad Reciente</div>';
    h += '<div class="dash-grid-2">';
    h += '<div class="dash-card"><h4>Top 5 Productos por Ingreso</h4>';
    if (prodArr.length > 0) {
      var maxIngreso = prodArr[0].ingreso || 1;
      h += '<div class="dash-top-list">';
      for (var tp = 0; tp < Math.min(5, prodArr.length); tp++) {
        var pp = prodArr[tp];
        var barW = Math.max(4, Math.round((pp.ingreso / maxIngreso) * 100));
        h += '<div class="dash-top-item"><div class="dash-top-info"><span class="dash-top-rank">' + (tp + 1) + '</span><span class="dash-top-name">' + pp.nombre + '</span></div><div class="dash-top-bar-track"><div class="dash-top-bar-fill" style="width:' + barW + '%"></div></div><div class="dash-top-val">$' + pp.ingreso.toLocaleString() + '</div></div>';
      }
      h += '</div>';
    } else { h += '<div class="est-empty">Sin datos de ventas</div>'; }
    h += '</div>';

    // Pedidos nuevos
    h += '<div class="dash-card ' + (pedidosNuevos.length > 0 ? 'dash-card-alert' : '') + '"><h4>' + (pedidosNuevos.length > 0 ? '<span style="color:var(--red)">Pedidos Nuevos (' + pedidosNuevos.length + ')</span>' : 'Pedidos Nuevos') + '</h4>';
    if (pedidosNuevos.length > 0) {
      h += '<div class="dash-pedidos-list">';
      for (var pn = 0; pn < pedidosNuevos.length; pn++) {
        var ped = pedidosNuevos[pn];
        var cl = ped.cliente || {};
        var hora = ped.creado ? ped.creado.slice(11, 16) : '';
        h += '<div class="dash-pedido-item"><div class="dash-pedido-left"><div class="dash-pedido-time">' + hora + '</div><div class="dash-pedido-cliente">' + (cl.nombre || '?') + '</div><div class="dash-pedido-ciudad">' + (cl.ciudad || '') + '</div></div><div class="dash-pedido-right"><div class="dash-pedido-total">$' + (ped.total || 0).toLocaleString() + '</div><div class="dash-pedido-items">' + ((ped.items || []).length) + ' items</div></div></div>';
      }
      h += '</div>';
    } else { h += '<div class="est-empty">Sin pedidos pendientes</div>'; }
    h += '</div></div>';

    // Inventario
    h += '<div class="dash-section-title"><span class="dash-dot" style="background:var(--red)"></span>Estado del Inventario</div>';
    h += '<div class="dash-grid-3">';
    h += '<div class="dash-card"><h4>Envases</h4>';
    h += '<div class="dash-stock-row"><span>Pequenos</span><span class="dash-stock-val" style="color:' + (stats.envasesChico <= 10 ? 'var(--red)' : 'var(--green)') + '">' + stats.envasesChico.toLocaleString() + '</span></div><div class="dash-stock-bar-track"><div class="dash-stock-bar-fill" style="width:' + Math.min(100, stats.envasesChico / 500 * 100) + '%;background:' + (stats.envasesChico <= 10 ? 'var(--red)' : 'var(--green)') + '"></div></div>';
    h += '<div class="dash-stock-row" style="margin-top:8px"><span>Grandes</span><span class="dash-stock-val" style="color:' + (stats.envasesGrande <= 10 ? 'var(--red)' : 'var(--green)') + '">' + stats.envasesGrande.toLocaleString() + '</span></div><div class="dash-stock-bar-track"><div class="dash-stock-bar-fill" style="width:' + Math.min(100, stats.envasesGrande / 500 * 100) + '%;background:' + (stats.envasesGrande <= 10 ? 'var(--red)' : 'var(--green)') + '"></div></div></div>';
    h += '<div class="dash-card"><h4>Bolsas</h4>';
    h += '<div class="dash-stock-row"><span>Pequenas</span><span class="dash-stock-val" style="color:' + (stats.bolsasChico <= 10 ? 'var(--red)' : 'var(--green)') + '">' + stats.bolsasChico.toLocaleString() + '</span></div><div class="dash-stock-bar-track"><div class="dash-stock-bar-fill" style="width:' + Math.min(100, stats.bolsasChico / 500 * 100) + '%;background:' + (stats.bolsasChico <= 10 ? 'var(--red)' : 'var(--green)') + '"></div></div>';
    h += '<div class="dash-stock-row" style="margin-top:8px"><span>Grandes</span><span class="dash-stock-val" style="color:' + (stats.bolsasGrande <= 10 ? 'var(--red)' : 'var(--green)') + '">' + stats.bolsasGrande.toLocaleString() + '</span></div><div class="dash-stock-bar-track"><div class="dash-stock-bar-fill" style="width:' + Math.min(100, stats.bolsasGrande / 500 * 100) + '%;background:' + (stats.bolsasGrande <= 10 ? 'var(--red)' : 'var(--green)') + '"></div></div></div>';
    h += '<div class="dash-card ' + (totalAlertas > 0 ? 'dash-card-alert' : '') + '"><h4>' + (totalAlertas > 0 ? '<span style="color:var(--red)">Alertas de Stock</span>' : 'Stock Saludable') + '</h4>';
    if (totalAlertas > 0) {
      h += '<div class="dash-alert-list">';
      for (var ai = 0; ai < Math.min(palaBaja.length, 4); ai++) h += '<div class="dash-alert-item dash-alert-yellow">PALA: ' + palaBaja[ai].nombre + ' <b>' + (palaBaja[ai].stockBolsa || 0) + 'g</b></div>';
      for (var ai2 = 0; ai2 < Math.min(frascosBajos.length, 3); ai2++) h += '<div class="dash-alert-item dash-alert-red">FRASCO: ' + frascosBajos[ai2].nombre + ' <b>pq:' + frascosBajos[ai2].chico + ' gr:' + frascosBajos[ai2].grande + '</b></div>';
      for (var ai3 = 0; ai3 < Math.min(stickerBajos.length, 3); ai3++) h += '<div class="dash-alert-item dash-alert-blue">STICKER: ' + (stickerBajos[ai3].nombre || '?') + ' <b>' + ((stickerBajos[ai3].stockChico||0) + (stickerBajos[ai3].stockGrande||0)) + '</b></div>';
      h += '</div>';
    } else { h += '<div class="est-empty">Todo el inventario esta OK</div>'; }
    h += '</div></div>';

    // Ultimas operaciones
    h += '<div class="dash-section-title"><span class="dash-dot" style="background:var(--text3)"></span>Ultimas Operaciones</div>';
    h += '<div class="dash-grid-2">';
    h += '<div class="dash-card"><h4>Ultimas Ventas</h4>';
    var ultVentas = ventas.slice(0, 5);
    if (ultVentas.length === 0) { h += '<div class="est-empty">Sin ventas</div>'; }
    else {
      h += '<div class="dash-ops-list">';
      for (var uv = 0; uv < ultVentas.length; uv++) {
        var uv2 = ultVentas[uv];
        var uvItems = '';
        if (uv2.items) { for (var uv3 = 0; uv3 < Math.min(2, uv2.items.length); uv3++) { uvItems += (uv2.items[uv3].productoNombre || '?') + ' x' + (uv2.items[uv3].cantidad || 0); if (uv3 < Math.min(2, uv2.items.length) - 1) uvItems += ', '; } if ((uv2.items||[]).length > 2) uvItems += '...'; }
        h += '<div class="dash-op-item"><div class="dash-op-left"><span class="dash-op-date">' + (uv2.fecha || '') + '</span><span class="dash-op-detail">' + uvItems + '</span></div><div class="dash-op-val">$' + (uv2.total || 0).toLocaleString() + '</div></div>';
      }
      h += '</div>';
    }
    h += '</div>';
    h += '<div class="dash-card"><h4>Ultimas Producciones</h4>';
    var ultProd = producciones.slice(0, 5);
    if (ultProd.length === 0) { h += '<div class="est-empty">Sin producciones</div>'; }
    else {
      h += '<div class="dash-ops-list">';
      for (var up = 0; up < ultProd.length; up++) {
        var upr = ultProd[up];
        var tClr = (upr.talla || 'chico') === 'grande' ? 'var(--gold)' : 'var(--blue)';
        h += '<div class="dash-op-item"><div class="dash-op-left"><span class="dash-op-date">' + (upr.fecha || '') + '</span><span class="dash-op-detail">' + (upr.productoNombre || '') + ' <span style="color:' + tClr + ';font-weight:700">' + (upr.talla || 'chico') + '</span></span></div><div class="dash-op-val" style="color:var(--green)">+' + (upr.cantidad || 0) + ' frascos</div></div>';
      }
      h += '</div>';
    }
    h += '</div></div>';

    container.innerHTML = h;

    // === CHARTS ===
    Chart.defaults.color = '#9a8a78';
    Chart.defaults.borderColor = '#3a2218';
    Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    var diasSorted = Object.keys(diaMap).sort().slice(-15);
    var ctxD = document.getElementById('dash-chart-daily');
    if (ctxD && diasSorted.length > 0) {
      var dLabels = [], dData = [];
      for (var dd = 0; dd < diasSorted.length; dd++) { dLabels.push(diasSorted[dd].slice(5)); dData.push(diaMap[diasSorted[dd]].ingresos); }
      Pages._dashCharts.push(new Chart(ctxD, { type: 'bar', data: { labels: dLabels, datasets: [{ label: 'Ingresos', data: dData, backgroundColor: 'rgba(232,184,75,0.6)', borderColor: '#e8b84b', borderWidth: 1, borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: function(v) { return '$' + v.toLocaleString(); } }, grid: { color: 'rgba(58,34,24,0.4)' } }, x: { grid: { display: false } } } } }));
    }
    var mesesSorted = Object.keys(monthMap).sort().slice(-12);
    var ctxM = document.getElementById('dash-chart-monthly');
    if (ctxM && mesesSorted.length > 0) {
      var mLabels = [], mData = [];
      for (var mm = 0; mm < mesesSorted.length; mm++) { mLabels.push(mesesSorted[mm]); mData.push(monthMap[mesesSorted[mm]].ingresos); }
      Pages._dashCharts.push(new Chart(ctxM, { type: 'bar', data: { labels: mLabels, datasets: [{ label: 'Ingresos', data: mData, backgroundColor: 'rgba(93,173,226,0.6)', borderColor: '#5dade2', borderWidth: 1, borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: function(v) { return '$' + v.toLocaleString(); } }, grid: { color: 'rgba(58,34,24,0.4)' } }, x: { grid: { display: false } } } } }));
    }
    var chartWraps = container.querySelectorAll('.dash-chart-wrap');
    for (var cw = 0; cw < chartWraps.length; cw++) chartWraps[cw].style.height = '220px';
  },

  verPedido(key) {
    App.navigate('pedidos');
    setTimeout(function() { var btn = document.querySelector('[data-pedido-key="' + key + '"]'); if (btn) btn.click(); }, 300);
  },
