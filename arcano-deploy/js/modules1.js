// ===================== CURRENT USER =====================
let currentUser = null;
const SESSION_KEY = 'arcano_session';

// ===================== PIN / LOGIN =====================
function initPin() {
  const screen = document.getElementById('pin-screen');
  const db = getDB();

  try {
    const savedSession = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (savedSession && savedSession.userId) {
      const user = db.usuarios.find(u => u.id === savedSession.userId);
      if (user) { currentUser = user; screen.style.display = 'none'; updateUserChip(); renderDashboard(); return; }
    }
  } catch {}

  function showUserList() {
    screen.innerHTML = `
      <div class="pin-logo">Arcano</div>
      <div class="pin-sub">Complice del Sabor</div>
      <div class="user-list" style="margin-top:8px">
        ${db.usuarios.map(u => `
          <button class="user-btn" onclick="selectUser(${u.id})">
            <div class="user-avatar">${u.emoji}</div>
            <div>
              <div style="font-size:.95rem;font-weight:700">${u.nombre}</div>
              <div style="font-size:.7rem;color:var(--muted)">${u.rol}</div>
            </div>
          </button>`).join('')}
      </div>`;
  }

  window.selectUser = function(uid) {
    const user = db.usuarios.find(u => u.id === uid);
    if (!user) return;
    let entered = '';
    screen.innerHTML = `
      <div class="pin-logo">Arcano</div>
      <div class="pin-sub">${user.emoji} ${user.nombre}</div>
      <div class="pin-display" id="pin-dots">
        ${[0,1,2,3].map(() => '<div class="pin-dot"></div>').join('')}
      </div>
      <div class="pin-pad">
        ${[1,2,3,4,5,6,7,8,9,'←',0,'OK'].map(k => `<button class="pin-digit" onclick="pinKey('${k}')">${k}</button>`).join('')}
      </div>
      <button class="btn btn-ghost btn-sm" onclick="initPin()" style="margin-top:4px">← Volver</button>
      <div id="pin-err" style="color:#e07070;font-size:.8rem;min-height:18px;margin-top:4px"></div>`;
    window.pinKey = function(k) {
      if (k === '←') { entered = entered.slice(0,-1); }
      else if (k === 'OK') {
        if (entered === user.pin) {
          currentUser = user;
          localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));
          screen.style.display = 'none';
          updateUserChip();
          renderDashboard();
        } else { entered = ''; document.getElementById('pin-err').textContent = 'PIN incorrecto'; setTimeout(() => { const e = document.getElementById('pin-err'); if(e) e.textContent=''; }, 1500); }
      } else if (entered.length < 4) { entered += k; }
      const dots = document.querySelectorAll('.pin-dot');
      dots.forEach((d,i) => d.classList.toggle('filled', i < entered.length));
    };
  };

  showUserList();
}

function updateUserChip() {
  const chip = document.getElementById('user-chip');
  if (chip && currentUser) {
    chip.innerHTML = `${currentUser.emoji} ${currentUser.nombre} <span style="color:var(--muted);font-size:.7rem">▼</span>`;
  }
  // OCULTAR AJUSTES PARA OPERADORES
  const navAjustes = document.getElementById('nav-ajustes');
  if (navAjustes) {
    navAjustes.style.display = (currentUser && currentUser.rol === 'admin') ? '' : 'none';
  }
}

function logoutUser() {
  currentUser = null;
  localStorage.removeItem(SESSION_KEY);
  document.getElementById('pin-screen').style.display = 'flex';
  initPin();
}

// ===================== NAV =====================
function goPage(name, btn) {
  // Operadores NO pueden acceder a Ajustes
  if (name === 'ajustes' && currentUser && currentUser.rol !== 'admin') return;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  if (btn) btn.classList.add('active');
  const renders = {
    dashboard: renderDashboard, costos: renderCostos, especias: renderEspecias,
    blends: renderBlends, ventas: renderVentas, reportes: renderReportes, ajustes: renderAjustes,
  };
  if (renders[name]) renders[name]();
}

// ===================== DASHBOARD =====================
function renderDashboard() {
  const db = getDB(); const c = db.costos;
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const mesStart = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const ventasHoy = db.ventas.filter(v => new Date(v.fecha) >= hoy && v.estado !== 'cancelada');
  const ventasMes  = db.ventas.filter(v => new Date(v.fecha) >= mesStart && v.estado !== 'cancelada');
  const ingHoy = ventasHoy.reduce((s,v) => s + v.total, 0);
  const ingMes  = ventasMes.reduce((s,v) => s + v.total, 0);
  const stockBajo = db.especias.filter(e => e.stock <= e.stockMin).length;

  document.getElementById('dash-stats').innerHTML = `
    <div class="stat"><div class="stat-label">Ventas hoy</div><div class="stat-value">${ventasHoy.length}</div><div class="stat-sub">${fmt(ingHoy)}</div></div>
    <div class="stat"><div class="stat-label">Ingresos mes</div><div class="stat-value">${fmt(ingMes)}</div><div class="stat-sub">${ventasMes.length} ventas</div></div>
    <div class="stat"><div class="stat-label">Especias</div><div class="stat-value">${db.especias.length}</div><div class="stat-sub">en catalogo</div></div>
    <div class="stat"><div class="stat-label">Stock bajo</div><div class="stat-value" style="color:${stockBajo>0?'var(--red)':'var(--green)'}">${stockBajo}</div><div class="stat-sub">requieren reposicion</div></div>`;

  const chart = document.getElementById('chart-7d');
  const dias = Array.from({length:7}, (_,i) => { const d=new Date(hoy); d.setDate(d.getDate()-(6-i)); return d; });
  const vals = dias.map(dia => {
    const sig = new Date(dia); sig.setDate(sig.getDate()+1);
    return db.ventas.filter(v => { const f=new Date(v.fecha); return f>=dia&&f<sig&&v.estado!=='cancelada'; }).reduce((s,v)=>s+v.total,0);
  });
  const max = Math.max(...vals, 1);
  chart.innerHTML = vals.map((v,i) => `
    <div class="bar-col">
      <div class="bar-val">${v ? fmt(v) : ''}</div>
      <div class="bar" style="height:${Math.round((v/max)*90)}px;opacity:${v?1:.25}"></div>
      <div class="bar-lbl">${fmtDay(dias[i].toISOString())}</div>
    </div>`).join('');

  const bajo = db.especias.filter(e => e.stock <= e.stockMin);
  const sb = document.getElementById('dash-stock-bajo');
  if (!bajo.length) {
    sb.innerHTML = '<div class="empty" style="padding:20px"><div class="empty-icon">✅</div><p>Todo el stock esta OK</p></div>';
  } else {
    sb.innerHTML = bajo.map(e => `
      <div class="flex items-center justify-between" style="padding:8px 0;border-bottom:1px solid var(--border);font-size:.84rem">
        <span>${e.nombre}</span>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="text-red fw7">${fmtG(e.stock)}</span>
          <span class="badge br">Bajo</span>
        </div>
      </div>`).join('');
  }

  const tbody = document.getElementById('dash-ventas-tabla');
  const ult = db.ventas.slice(0, 7);
  if (!ult.length) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty"><div class="empty-icon">🧾</div><p>Sin ventas aun</p></div></td></tr>`;
  } else {
    tbody.innerHTML = ult.map(v => `<tr>
      <td class="text-muted text-xs">${fmtDateTime(v.fecha)}</td>
      <td class="text-sm">${v.items.map(i=>`${i.nombre}x${i.qty}`).join(', ')}</td>
      <td class="fw7 text-gold">${fmt(v.total)}</td>
      <td>${estadoBadge(v.estado)}</td>
    </tr>`).join('');
  }

  const conteo = {};
  db.ventas.filter(v=>v.estado!=='cancelada').forEach(v => v.items.forEach(i => { conteo[i.nombre] = (conteo[i.nombre]||0) + i.qty; }));
  const top = Object.entries(conteo).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const topEl = document.getElementById('dash-top');
  topEl.innerHTML = top.length ? top.map(([n,q],i) => `
    <div class="flex items-center justify-between" style="padding:8px 0;border-bottom:1px solid var(--border);font-size:.84rem">
      <span><span style="color:var(--gold-dim);margin-right:8px">${i+1}.</span>${n}</span>
      <span class="badge ba">${q} u.</span>
    </div>`).join('') : '<div class="text-muted text-sm" style="padding:12px 0">Sin datos de ventas aun</div>';
}

// ===================== COSTOS =====================
function saveCostos() {
  const db = getDB();
  db.costos = {
    envChico:  +document.getElementById('c-env-c').value  || 0,
    envGrande: +document.getElementById('c-env-g').value  || 0,
    pkgChico:  +document.getElementById('c-pkg-c').value  || 0,
    pkgGrande: +document.getElementById('c-pkg-g').value  || 0,
    etiqueta:  +document.getElementById('c-etiq').value   || 0,
    mo:        +document.getElementById('c-mo').value     || 0,
    otros:     +document.getElementById('c-otros').value  || 0,
  };
  saveDB(db);
  renderResumenCostos();
  toast('Costos guardados');
}

function renderCostos() {
  const c = getDB().costos;
  document.getElementById('c-env-c').value  = c.envChico;
  document.getElementById('c-env-g').value  = c.envGrande;
  document.getElementById('c-pkg-c').value  = c.pkgChico;
  document.getElementById('c-pkg-g').value  = c.pkgGrande;
  document.getElementById('c-etiq').value   = c.etiqueta;
  document.getElementById('c-mo').value     = c.mo;
  document.getElementById('c-otros').value  = c.otros;
  renderResumenCostos();
}

function renderResumenCostos() {
  const c = getDB().costos;
  const fijosC = c.pkgChico  + c.etiqueta + c.mo + c.otros;
  const fijosG = c.pkgGrande + c.etiqueta + c.mo + c.otros;
  const totalC = c.envChico  + fijosC;
  const totalG = c.envGrande + fijosG;
  document.getElementById('resumen-costos').innerHTML = `
    <div class="cost-box">
      <div class="fw7 text-gold text-sm mb-12">ENVASE CHICO</div>
      <div class="cost-row"><span>Envase</span><span>${fmt(c.envChico)}</span></div>
      <div class="cost-row"><span>Packaging</span><span>${fmt(c.pkgChico)}</span></div>
      <div class="cost-row"><span>Etiqueta</span><span>${fmt(c.etiqueta)}</span></div>
      <div class="cost-row"><span>Mano de obra</span><span>${fmt(c.mo)}</span></div>
      <div class="cost-row"><span>Otros</span><span>${fmt(c.otros)}</span></div>
      <div class="cost-row total"><span>Total fijos/u</span><span>${fmt(totalC)}</span></div>
    </div>
    <div class="cost-box">
      <div class="fw7 text-gold text-sm mb-12">ENVASE GRANDE</div>
      <div class="cost-row"><span>Envase</span><span>${fmt(c.envGrande)}</span></div>
      <div class="cost-row"><span>Packaging</span><span>${fmt(c.pkgGrande)}</span></div>
      <div class="cost-row"><span>Etiqueta</span><span>${fmt(c.etiqueta)}</span></div>
      <div class="cost-row"><span>Mano de obra</span><span>${fmt(c.mo)}</span></div>
      <div class="cost-row"><span>Otros</span><span>${fmt(c.otros)}</span></div>
      <div class="cost-row total"><span>Total fijos/u</span><span>${fmt(totalG)}</span></div>
    </div>`;
}

// ===================== ESPECIAS =====================
let editingEspId = null;

function openModalEspecia(id = null) {
  editingEspId = id;
  document.getElementById('modal-esp-titulo').textContent = id ? 'Editar especia' : 'Nueva especia';
  const db = getDB();
  if (id) {
    const e = db.especias.find(x => x.id === id);
    if (e) {
      document.getElementById('esp-nombre').value = e.nombre;
      document.getElementById('esp-precio').value = e.precioKg;
      document.getElementById('esp-stock').value  = e.stock || 0;
      document.getElementById('esp-stockmin').value = e.stockMin || 500;
      calcEsp100();
    }
  } else {
    ['esp-nombre'].forEach(i => document.getElementById(i).value = '');
    document.getElementById('esp-precio').value = '';
    document.getElementById('esp-stock').value = '0';
    document.getElementById('esp-stockmin').value = '500';
    document.getElementById('esp-100').value = '';
  }
  openModal('modal-esp');
}

function calcEsp100() {
  const kg = parseFloat(document.getElementById('esp-precio').value) || 0;
  document.getElementById('esp-100').value = fmt(kg / 10);
}

function guardarEspecia() {
  const nombre = document.getElementById('esp-nombre').value.trim();
  const precioKg = parseFloat(document.getElementById('esp-precio').value) || 0;
  if (!nombre) { showAlert('alert-esp','El nombre es obligatorio.','err'); return; }
  const db = getDB();
  const obj = { nombre, precioKg, stock: +document.getElementById('esp-stock').value || 0, stockMin: +document.getElementById('esp-stockmin').value || 500 };
  if (editingEspId) { obj.id = editingEspId; const i = db.especias.findIndex(e => e.id === editingEspId); if (i >= 0) db.especias[i] = obj; }
  else { obj.id = nid(); db.especias.push(obj); }
  saveDB(db);
  toast(editingEspId ? 'Especia actualizada' : 'Especia creada');
  setTimeout(() => closeModal('modal-esp'), 700);
  renderEspecias();
}

function openModalStock(id) {
  const db = getDB(); const esp = db.especias.find(e => e.id === id);
  if (!esp) return;
  document.getElementById('ms-nombre').textContent = esp.nombre;
  document.getElementById('ms-stock-actual').textContent = fmtG(esp.stock);
  document.getElementById('ms-tipo').value = 'entrada';
  document.getElementById('ms-cantidad').value = '';
  document.getElementById('ms-nota-stock').value = '';
  document.getElementById('ms-esp-id').value = id;
  renderMovimientos(id);
  openModal('modal-stock');
}

function guardarMovimiento() {
  const id = +document.getElementById('ms-esp-id').value;
  const tipo = document.getElementById('ms-tipo').value;
  const cant = parseFloat(document.getElementById('ms-cantidad').value) || 0;
  const nota = document.getElementById('ms-nota-stock').value.trim();
  if (!cant || cant <= 0) { showAlert('alert-stock','Ingresa una cantidad valida.','err'); return; }
  const db = getDB(); const esp = db.especias.find(e => e.id === id);
  if (!esp) return;
  const delta = tipo === 'entrada' ? cant : -cant;
  esp.stock = Math.max(0, (esp.stock || 0) + delta);
  db.movimientos.push({ id: nid(), espId: id, tipo, cantidad: cant, nota, fecha: new Date().toISOString(), usuario: currentUser?.nombre || 'Sistema' });
  saveDB(db);
  document.getElementById('ms-stock-actual').textContent = fmtG(esp.stock);
  document.getElementById('ms-cantidad').value = '';
  renderMovimientos(id); renderEspecias();
  toast('Stock actualizado');
}

function renderMovimientos(espId) {
  const db = getDB();
  const movs = db.movimientos.filter(m => m.espId === espId).slice(-10).reverse();
  const el = document.getElementById('ms-historial');
  if (!movs.length) { el.innerHTML = '<div class="text-muted text-sm" style="padding:8px 0">Sin movimientos aun</div>'; return; }
  el.innerHTML = movs.map(m => `
    <div class="mov-row">
      <span class="${m.tipo === 'entrada' ? 'mov-in' : 'mov-out'}">${m.tipo === 'entrada' ? '▲' : '▼'}</span>
      <span class="fw7 ${m.tipo === 'entrada' ? 'text-green' : 'text-red'}">${fmtG(m.cantidad)}</span>
      <span class="text-muted text-xs">${m.nota || '—'}</span>
      <span class="text-muted text-xs mov-date">${fmtDateTime(m.fecha)}</span>
    </div>`).join('');
}

function eliminarEspecia(id) {
  if (!confirm('Eliminar esta especia?')) return;
  const db = getDB(); db.especias = db.especias.filter(e => e.id !== id);
  saveDB(db); renderEspecias(); toast('Especia eliminada');
}

function renderEspecias() {
  const q = (document.getElementById('search-esp')?.value || '').toLowerCase();
  const db = getDB();
  const list = db.especias.filter(e => e.nombre.toLowerCase().includes(q));
  const tbody = document.getElementById('tabla-especias');
  if (!list.length) { tbody.innerHTML = `<tr><td colspan="7"><div class="empty"><div class="empty-icon">🌿</div><p>No hay especias.</p></div></td></tr>`; return; }
  tbody.innerHTML = list.map(e => {
    const bajo = e.stock <= e.stockMin;
    return `<tr>
      <td><strong>${e.nombre}</strong></td>
      <td>${fmt(e.precioKg)}</td>
      <td class="text-gold">${fmt(e.precioKg / 10)}</td>
      <td class="${bajo ? 'stock-low' : 'stock-ok'}">${fmtG(e.stock)}</td>
      <td class="text-muted text-xs">${fmtG(e.stockMin)}</td>
      <td>${bajo ? '<span class="badge br">Stock bajo</span>' : '<span class="badge bg">OK</span>'}</td>
      <td class="tr" style="white-space:nowrap">
        <button class="btn btn-ghost btn-sm" onclick="openModalStock(${e.id})">📦 Stock</button>
        <button class="btn btn-ghost btn-sm" onclick="openModalEspecia(${e.id})">✏</button>
        <button class="btn btn-red btn-sm" onclick="eliminarEspecia(${e.id})">🗑</button>
      </td></tr>`;
  }).join('');
}

// ===================== HELPERS =====================
function estadoBadge(e) {
  const m = { completada:'bg', pendiente:'by', cancelada:'br', entregada:'ba' };
  return `<span class="badge ${m[e]||'ba'}">${e}</span>`;
}
